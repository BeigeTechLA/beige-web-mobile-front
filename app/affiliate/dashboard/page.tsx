"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
// import AffiliateStatsModule from "@/components/affiliate/AffiliateStatsModule";
// import { AffiliateTopCreatives } from "@/components/affiliate/AffiliateTopCreatives";
import AffiliateFileManager from "@/components/affiliate/AffiliateFileManager";
import AffiliateMeetings from "@/components/affiliate/AffiliateMeetings";
import AffiliateMessages from "@/components/affiliate/AffiliateMessages";
import { AffiliateShoots } from "@/components/affiliate/AffiliateShoots";
import AffiliateShootDetails from "@/components/affiliate/AffiliateShootDetails";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";
import { AffiliateProfileSettings } from "@/components/affiliate/AffiliateProfileSettings";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useGetBookingsMutation } from "@/lib/redux/features/booking/bookingApi";
import Image from "next/image";
import { StatCard } from "@/components/admin/StatCard";

// Define a type for the active tab
type TabType =
  | "dashboard"
  | "overview"
  | "bookings"
  | "file-manager"
  | "meetings"
  | "messages"
  | "shoots"
  | "profile";

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // RTK Query Mutation for Bookings
  const [
    getBookings,
    { data: bookingsResponse, isLoading: isBookingsLoading },
  ] = useGetBookingsMutation();

  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = Cookies.get("revure_token");
      if (!token) {
        toast.error("Please log in to view your affiliate dashboard");
        router.push("/");
        return;
      }

      try {
        if (!selectedDate) setIsLoading(true);
        else setIsDataRefreshing(true);

        const params: any = {};
        if (selectedDate) {
          const { format } = await import("date-fns");
          params.date_on = format(selectedDate, 'yyyy-MM-dd');
        }

        const [statsData, referralHistory, summaryData, pendingData] = await Promise.all([
          affiliateApi.getDashboardStats(token),
          affiliateApi.getReferralHistory(token),
          affiliateApi.getDashboardSummary(token, params),
          affiliateApi.getProjectFormSubmission(token),
        ]);
        setStats(statsData);
        setReferrals(referralHistory.referrals || []);
        setDashboardSummary(summaryData.data);
        setNewCode(statsData.affiliate.referral_code);

        if (!pendingData.error) {
          setPendingProjects(pendingData.projects || []);
          setPendingCount(pendingData.count || 0);
        }
      } catch (error: any) {
        console.error("Error fetching affiliate dashboard:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
        setIsDataRefreshing(false);
      }
    };

    fetchDashboardData();
  }, [router, selectedDate]);

  // Fetch Bookings when tab changes to "bookings"
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close mobile sidebar on click

    if (tab === "shoots") {
      setSelectedBooking(null); // Reset detail view when clicking sidebar
    }

    if (tab === "bookings") {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userId = parsedUser?.id;

      if (userId) {
        try {
          await getBookings(Number(userId)).unwrap();
        } catch (err) {
          toast.error("Failed to load your bookings");
        }
      } else {
        toast.error("User ID not found. Please log in again.");
      }
    }
  };

  const getBookingStatus = (booking: any) => {
    if (booking.is_cancelled)
      return { label: "Cancelled", class: "text-red-400 bg-red-400/10" };
    if (booking.is_completed)
      return { label: "Completed", class: "text-green-400 bg-green-400/10" };
    if (booking.is_draft)
      return { label: "Draft", class: "text-yellow-400 bg-yellow-400/10" };
    return { label: "Active", class: "text-blue-400 bg-blue-400/10" };
  };

  const handleUpdateReferralCode = async () => {
    if (newCode.length < 4 || newCode.length > 20) {
      toast.error("Referral code must be between 4-20 characters");
      return;
    }

    const storedUser = localStorage.getItem("revure_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const affiliate_id = parsedUser?.affiliate_id;

    if (!affiliate_id) {
      toast.error("Affiliate ID not found");
      return;
    }

    try {
      setIsUpdating(true);
      await updateReferralCode({
        affiliate_id,
        referral_code: newCode.toUpperCase(),
      });

      if (stats) {
        setStats({
          ...stats,
          affiliate: {
            ...stats.affiliate,
            referral_code: newCode.toUpperCase(),
          },
        });
      }
      setIsEditingCode(false);
      toast.success("Referral code updated!");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update referral code",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    router.push("/");
  };

  const handleCopyCode = async () => {
    if (stats?.affiliate.referral_code) {
      try {
        await navigator.clipboard.writeText(stats.affiliate.referral_code);
        setCopySuccess(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
      }
    }
  };

  const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null || isNaN(Number(amount)))
      return "$0.00";
    return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
      case "confirmed":
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "cancelled":
      case "refunded":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/60 bg-white/5";
    }
  };

  const getPayoutStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "paid":
        return "text-green-400 bg-green-400/10";
      case "approved":
        return "text-blue-400 bg-blue-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "rejected":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-white/60 bg-white/5";
    }
  };

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#111] text-white">
      {/* LOGO - Fixed at top */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <Link href="/" className="relative flex items-center">
          <Image
            src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={100}
            height={20}
            priority
          />
          <span className="absolute right-0 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
            Beta
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
          </span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-2 text-white/60 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* NAV LINKS - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        <button
          onClick={() => handleTabChange("dashboard")}
          className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${activeTab === "dashboard"
            ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
            : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "overview"
            ? "bg-[#E5D5B8] text-black shadow-lg"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
        >
          <Users size={20} />
          <span className="font-medium">Affiliate Overview</span>
        </button>

        <button
          onClick={() => handleTabChange("file-manager")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "file-manager"
            ? "bg-[#E5D5B8] text-black shadow-lg"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
        >
          <FolderOpen size={20} />
          <span className="font-medium">File Manager</span>
        </button>

        <button
          onClick={() => setActiveTab("meetings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "meetings"
            ? "bg-[#E5D5B8] text-black shadow-lg"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
        >
          <Calendar size={20} />
          <span className="font-medium">Meetings</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "messages"
            ? "bg-[#E5D5B8] text-black shadow-lg"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
        >
          <MessageCircle size={20} />
          <span className="font-medium">Messages</span>
        </button>

        <button
          onClick={() => handleTabChange("shoots")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "shoots"
            ? "bg-[#E5D5B8] text-black shadow-lg"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
        >
          <Camera size={20} />
          <span className="font-medium">Shoots</span>
        </button>

        <Link
          href="/book-a-shoot"
          className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Camera size={20} />
          <span>Book A Shoot</span>
        </Link>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${activeTab === "profile"
            ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
            : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
        >
          <Settings size={20} />
          <span>Profile</span>
        </button>
      </div>

      {/* USER PROFILE & LOGOUT - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-[#111]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E8D1AB] to-[#C4A470] flex items-center justify-center text-black font-bold text-sm shrink-0 uppercase">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-white">
              {user?.name || "Affiliate"}
            </p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black">
            Book a Shoot
          </Button>
        }
      />
      <div className="overflow-hidden pb-30 p-4 lg:p-6 lg:px-10 lg:py-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>
              Welcome back, {user?.name || "Partner"} !
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              {/* Monitor revenue, shoots, clients, and performance metrics
                      in one centralized dashboard. */}
              Manage every shoot from start to finish in one centralized platform.
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <AffiliateOverviewChart externalSelectedDate={selectedDate} />

                <div className="flex flex-col lg:flex-row gap-4 mt-5">
                  <div className="lg:w-3/4 flex flex-col gap-4">
                    <AffiliateOverallShootsTable externalSelectedDate={selectedDate} />
                  </div>
                  <div className="lg:w-1/4">
                    <AffiliateShootByCategory externalSelectedDate={selectedDate} />
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 mt-5">
                  <div className="lg:w-3/4">
                    <AffiliateShootStatusChart externalSelectedDate={selectedDate} />
                  </div>
                  <div className="lg:w-1/4">
                    <AffiliateRecentActivity externalSelectedDate={selectedDate} />
                  </div>
                </div>
              </>
            ) : activeTab === "shoots" ? (
              selectedBooking ? (
                <AffiliateShootDetails
                  shootId={selectedBooking}
                  onBack={() => setSelectedBooking(null)}
                />
              ) : (
                <AffiliateShoots
                  onShootClick={(id) => setSelectedBooking(id)}
                  onFillDetailsClick={() => setIsShootFormOpen(true)}
                  pendingCount={pendingCount}
                />
              )
            ) : activeTab === "file-manager" ? (
              <AffiliateFileManager />
            ) : activeTab === "meetings" ? (
              <AffiliateMeetings />
            ) : activeTab === "messages" ? (
              <AffiliateMessages />
            ) : activeTab === "profile" ? (
              <AffiliateProfileSettings />
            ) : activeTab === "overview" ? (
              <>
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 lg:gap-6">
                  <div>
                    <h1 className="text-lg lg:text-3xl font-bold text-white mb-2">
                      Dashboard
                    </h1>
                    <p className="text-xs lg:text-sm text-white/60">
                      Welcome back, {user?.name || "Partner"}
                    </p>
                  </div>

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/book-a-shoot")}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
    </>
  )
}
