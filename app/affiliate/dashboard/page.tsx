"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  LogOut,
  LayoutDashboard,
  Wallet,
  Settings,
  Menu,
  X,
  CheckCircle,
  Camera,
  Pencil,
  Check,
  Calendar,
  MapPin,
  Info,
  ChevronRight,
  MessageCircle,
  FolderOpen,
  ChevronUp, ChevronDown
} from "lucide-react";
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
import {
  affiliateApi,
  type AffiliateDashboardStats,
  type ReferralHistoryItem,
  updateReferralCode,
} from "@/lib/api";
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
  const { logout, user } = useAuth();

  // Tabs State
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateDashboardStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralHistoryItem[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShootFormOpen, setIsShootFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

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
    <div className="h-screen bg-[#0A0A0A] text-white flex overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block w-64 border-r border-white/10 shrink-0 h-full">
        <SidebarContent />
      </div>

      {/* MOBILE SIDEBAR (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-[70] lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE TOP NAV */}
        <header className="lg:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#0A0A0A] sticky top-0 z-50">
          <Link href="/" className="relative flex items-center">
            <Image
              src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
              alt="BEIGE"
              width={100}
              height={20}
            />
            <span className="absolute right-0 -bottom-3 md:-bottom-4 text-[8px] md:text-[10px] font-medium tracking-wide py-[1px] px-1 md:py-[1.5px] md:px-2 rounded-full text-white border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] backdrop-blur-xs overflow-hidden">
              Beta
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-white/80 hover:text-white"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="mx-auto space-y-4 lg:space-y-8 pb-6 lg:pb-12">
            {activeTab === "dashboard" ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-white">
                    <h1 className="text-lg lg:text-3xl lg:leading-[32px] font-semibold mb-1">
                      Welcome back, {user?.name || "Partner"} !
                    </h1>
                    <p className="text-xs lg:text-sm text-white/70">
                      Monitor revenue, shoots, clients, and performance metrics
                      in one centralized dashboard.
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

                  {/* Referral Code Card */}
                  <div className="bg-[#1A1A1A] border border-[#E8D1AB]/20 rounded-lg lg:rounded-xl p-1 pr-1 flex items-center gap-3 w-full md:w-auto min-w-[300px]">
                    <div className="px-4 py-2 flex-1">
                      <span className="text-xs text-[#E8D1AB] uppercase tracking-wider font-semibold block mb-0.5">
                        Your Code
                      </span>

                      {isEditingCode ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={newCode}
                            maxLength={20}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^a-zA-Z0-9]/g,
                                ""
                              );
                              setNewCode(value.toUpperCase());
                            }}
                            style={{
                              width: `${Math.max(newCode.length, 4) + 1}ch`,
                            }}
                            className="bg-transparent border-b border-[#E8D1AB] outline-none lg:text-xl font-mono font-bold text-white tracking-widest uppercase transition-all duration-75"
                            disabled={isUpdating}
                          />
                          <button
                            onClick={handleUpdateReferralCode}
                            disabled={isUpdating}
                            className="text-green-400 hover:text-green-300"
                          >
                            {isUpdating ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                            ) : (
                              <Check size={20} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingCode(false);
                              setNewCode(stats?.affiliate.referral_code || "");
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="lg:text-xl font-mono font-bold text-white tracking-widest">
                            {stats?.affiliate.referral_code || "------"}
                          </span>
                          <div className="relative group flex items-center">
                            <button
                              onClick={() => setIsEditingCode(true)}
                              className="text-white/40 hover:text-[#E8D1AB] transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#111] border border-white/10 text-xs text-white rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none shadow-xl">
                              You can set your unique code
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-white/10"></div>
                              <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#111]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditingCode && (
                      <Button
                        onClick={handleCopyCode}
                        className="h-full bg-[#E8D1AB] hover:bg-[#d0b890] text-black font-medium px-4 py-3 rounded-lg"
                      >
                        {copySuccess ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Copy size={18} />
                        )}
                        <span className="ml-2">
                          {copySuccess ? "Copied" : "Copy"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Google Forms CTA Banner */}
                {pendingCount > 0 && (
                  <div className="bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border border-[#E8D1AB]/20 rounded-lg lg:rounded-xl p-4 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg lg:text-xl mb-2">
                          Complete Your Shoot Details
                        </h3>
                        <p className="text-white/60 text-sm lg:text-base">
                          Help us prepare better by filling out detailed
                          information about your upcoming shoot
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsShootFormOpen(true)}
                        className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium px-6 py-3 h-auto whitespace-nowrap"
                      >
                        Fill Out Shoot Details
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Earnings"
                    value={formatCurrency(stats?.earnings.total_earnings || 0)}
                    icon={DollarSign}
                    iconColor="text-green-500"
                    hoverBorder="hover:border-green-500/30"
                  />
                  <StatCard
                    label="Pending Payout"
                    value={formatCurrency(stats?.earnings.pending_earnings || 0)}
                    icon={Clock}
                    iconColor="text-yellow-500"
                    hoverBorder="hover:border-yellow-500/30"
                    valueColor="text-yellow-500"
                  />
                  <StatCard
                    label="Total Referrals"
                    value={stats?.stats.total_referrals || 0}
                    icon={Users}
                    iconColor="text-blue-500"
                    hoverBorder="hover:border-blue-500/30"
                    subtext={`${stats?.stats.successful_referrals || 0} successful`}
                  />
                  <StatCard
                    label="Conversion Rate"
                    value={`${stats?.stats.conversion_rate || 0} %`}
                    icon={TrendingUp}
                    iconColor="text-purple-500"
                    hoverBorder="hover:border-purple-500/30"
                  />
                </div>

                {/* Referrals Table Section */}
                <div className="bg-[#111] rounded-lg lg:rounded-xl border border-white/5 overflow-hidden">
                  <div className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      Recent Referrals
                    </h2>
                  </div>
                  {/* --- MOBILE VIEW (Accordion Cards) --- */}
                  <div className="lg:hidden space-y-4">
                    {referrals.length === 0 ? (
                      <div className="px-6 py-12 text-center text-white/40 bg-white/5  border border-white/5">
                        <Users className="mx-auto mb-3 opacity-20" size={32} />
                        <p>No referrals yet. Share your code to start earning!</p>
                      </div>
                    ) : (
                      referrals.map((referral) => {
                        const isExpanded = expandedId === referral.referral_id;

                        return (
                          <div
                            key={referral.referral_id}
                            className="bg-[#101010] rounded-2xl border border-white/5 overflow-hidden"
                          >
                            <div
                              className="p-4 flex items-center justify-between cursor-pointer"
                              onClick={() => toggleExpand(referral.referral_id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${isExpanded ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'}`}>
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Commission</p>
                                  <p className="font-medium text-[#E8D1AB]">
                                    {formatCurrency(referral.commission_amount)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(referral.status)}`}>
                                  {referral.status}
                                </span>
                              </div>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="px-4 pb-5 pt-2 border-t border-white/5 grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Date</p>
                                  <p className="text-white/80 text-sm">{formatDate(referral.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Booking Amt</p>
                                  <p className="text-white/60 text-sm">
                                    {referral.booking_amount ? formatCurrency(referral.booking_amount) : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Payout Status</p>
                                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${getPayoutStatusColor(referral.payout_status)}`}>
                                    {referral.payout_status}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* --- DESKTOP VIEW (Original Table) --- */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
                          <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D] ">Date</th>
                          <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">
                            Booking Amount
                          </th>
                          <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Commission</th>
                          <th className="pb-4 px-4 bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Status</th>
                          <th className="pb-4 px-4 text-right bg-[#101010] py-4 px-4 border-b border-b-[#3D3D3D]">Payout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {referrals.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-12 text-center text-white/40"
                            >
                              <Users
                                className="mx-auto mb-3 opacity-20"
                                size={32}
                              />
                              <p>
                                No referrals yet. Share your code to start
                                earning!
                              </p>
                            </td>
                          </tr>
                        ) : (
                          referrals.map((referral) => (
                            <tr
                              key={referral.referral_id}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4 text-white/80">
                                {formatDate(referral.created_at)}
                              </td>
                              <td className="px-6 py-4 text-white/60">
                                {referral.booking_amount
                                  ? formatCurrency(referral.booking_amount)
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 font-medium text-[#E8D1AB]">
                                {formatCurrency(referral.commission_amount)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${getStatusColor(referral.status)}`}
                                >
                                  {referral.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${getPayoutStatusColor(referral.payout_status)}`}
                                >
                                  {referral.payout_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-[#111] rounded-lg lg:rounded-xl border border-white/5 p-4 lg:p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    How to Earn
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">
                          Share Code
                        </p>
                        <p className="text-sm text-white/40">
                          Send your unique code to potential clients.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">They Book</p>
                        <p className="text-sm text-white/40">
                          They use the code at checkout for a shoot.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/10 text-[#E8D1AB] flex items-center justify-center font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">You Earn</p>
                        <p className="text-sm text-white/40">
                          Get 10% for every completed booking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* MY BOOKINGS VIEW */
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    My Bookings
                  </h1>
                  <p className="text-white/60">
                    Manage and view your personal shoot bookings.
                  </p>
                </div>

                <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                      <thead>
                        <tr className="bg-white/5 text-white/40">
                          <th className="px-6 py-4 font-medium">
                            Project / Type
                          </th>
                          <th className="px-6 py-4 font-medium">Date & Time</th>
                          <th className="px-6 py-4 font-medium">Location</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {isBookingsLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <div className="animate-spin h-6 w-6 border-2 border-[#E8D1AB] border-t-transparent rounded-full mx-auto" />
                            </td>
                          </tr>
                        ) : (
                          (bookingsResponse as any)?.booking?.map(
                            (booking: any) => {
                              const status = getBookingStatus(booking);
                              return (
                                <tr
                                  key={booking.booking_id}
                                  className="hover:bg-white/5 transition-colors group"
                                >
                                  <td className="px-6 py-4">
                                    <p className="text-white font-medium">
                                      {booking.project_name}
                                    </p>
                                    <p className="text-xs text-[#E8D1AB] capitalize">
                                      {booking.event_type}
                                    </p>
                                  </td>
                                  <td className="px-6 py-4 text-white/80">
                                    <div>{formatDate(booking.event_date)}</div>
                                    <div className="text-xs text-white/40">
                                      {booking.start_time}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-white/60 max-w-[200px] truncate">
                                    {booking.event_location?.address}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${status.class}`}
                                    >
                                      {status.label}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setSelectedBooking(booking)
                                      }
                                      className="text-[#E8D1AB] hover:text-[#E8D1AB] hover:bg-[#E8D1AB]/10 text-xs font-semibold gap-1"
                                    >
                                      View Details <ChevronRight size={14} />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            },
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <AnimatePresence>
          {activeTab === "bookings" &&
            selectedBooking &&
            typeof selectedBooking === "object" && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedBooking(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
                {/* Drawer Content */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#111] border-l border-white/10 z-[110] shadow-2xl flex flex-col"
                >
                  <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#161616]">
                    <h2 className="text-xl font-bold text-white">
                      Project Details
                    </h2>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Summary Section */}
                    <section className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs text-[#E8D1AB] font-bold uppercase tracking-widest">
                          Project Name
                        </p>
                        <h3 className="text-2xl font-bold text-white">
                          {selectedBooking.project_name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-bold mb-1">
                            Event Date
                          </p>
                          <p className="text-sm font-medium">
                            {formatDate(selectedBooking.event_date)}
                          </p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-bold mb-1">
                            Budget
                          </p>
                          <p className="text-sm font-medium text-[#E8D1AB]">
                            {formatCurrency(selectedBooking.budget)}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Info Section */}
                    <section className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                          <Info size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-white/40 font-bold uppercase">
                            Type & Start Time
                          </p>
                          <p className="text-sm text-white/80 capitalize">
                            {selectedBooking.event_type} •{" "}
                            {selectedBooking.start_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-white/40 font-bold uppercase">
                            Location
                          </p>
                          <p className="text-sm text-white/80 leading-relaxed">
                            {selectedBooking.event_location?.address}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Assigned Crew Section */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase text-white tracking-widest">
                          Assigned Crew ({selectedBooking.assigned_crew_count})
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {selectedBooking.assigned_crews?.length > 0 ? (
                          selectedBooking.assigned_crews.map((crew: any) => (
                            <div
                              key={crew.id}
                              className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center text-[#E8D1AB] text-xs font-bold uppercase">
                                  {crew.crew_member.crew_member_name[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {crew.crew_member.crew_member_name}
                                  </p>
                                  <p className="text-[10px] text-white/40 uppercase">
                                    Crew Member ID: {crew.crew_member_id}
                                  </p>
                                </div>
                              </div>

                              {/* Crew Status Badge */}
                              <div>
                                {crew.crew_accept === 1 ? (
                                  <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                                    <CheckCircle size={12} />
                                    <span className="text-[10px] font-bold uppercase">
                                      Accepted
                                    </span>
                                  </div>
                                ) : crew.crew_accept === 2 ? (
                                  <div className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">
                                    <X size={12} />
                                    <span className="text-[10px] font-bold uppercase">
                                      Rejected
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold uppercase">
                                      Pending
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-white/40 italic">
                            No crew assigned yet.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="p-6 border-t border-white/10 bg-[#161616]">
                    <Button
                      onClick={() => setSelectedBooking(null)}
                      className="w-full bg-[#E8D1AB] hover:bg-[#d0b890] text-black font-bold"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
        </AnimatePresence>
      </div>

      <AffiliateShootDetailsForm
        isOpen={isShootFormOpen}
        onClose={() => setIsShootFormOpen(false)}
        projectId={pendingProjects[0]?.project_id || 0}
        pendingProjects={pendingProjects}
      />
    </div>
  );
}
