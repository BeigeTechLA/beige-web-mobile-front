"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Cookies from "js-cookie";
import {
  Calendar,
  Camera,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import AffiliateFileManager from "@/components/affiliate/AffiliateFileManager";
import AffiliateMeetings from "@/components/affiliate/AffiliateMeetings";
import AffiliateMessages from "@/components/affiliate/AffiliateMessages";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import AffiliateShootDetails from "@/components/affiliate/AffiliateShootDetails";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
import { AffiliateShoots } from "@/components/affiliate/AffiliateShoots";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import { AffiliateProfileSettings } from "@/components/affiliate/AffiliateProfileSettings";
import { affiliateApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

type TabType =
  | "dashboard"
  | "overview"
  | "file-manager"
  | "meetings"
  | "messages"
  | "shoots"
  | "profile";

const tabs: Array<{
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "overview", label: "Affiliate Overview", icon: Users },
  { id: "file-manager", label: "File Manager", icon: FolderOpen },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "shoots", label: "Shoots", icon: Camera },
  { id: "profile", label: "Profile", icon: Settings },
];

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [isShootFormOpen, setIsShootFormOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadPendingProjects = async () => {
      const token = Cookies.get("revure_token");
      if (!token) {
        toast.error("Please log in to view your affiliate dashboard");
        router.push("/");
        return;
      }

      const response = await affiliateApi.getProjectFormSubmission(token);
      if (!active || response?.error) return;

      setPendingProjects(response.projects || []);
      setPendingCount(response.count || 0);
    };

    loadPendingProjects();

    return () => {
      active = false;
    };
  }, [router]);

  const isDark = !mounted || theme === "dark";

  const renderDashboard = () => (
    <>
      <AffiliateOverviewChart externalSelectedDate={selectedDate} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/4 flex flex-col gap-4">
          <AffiliateOverallShootsTable externalSelectedDate={selectedDate} />
        </div>
        <div className="lg:w-1/4">
          <AffiliateShootByCategory externalSelectedDate={selectedDate} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-3/4">
          <AffiliateShootStatusChart externalSelectedDate={selectedDate} />
        </div>
        <div className="lg:w-1/4">
          <AffiliateRecentActivity externalSelectedDate={selectedDate} />
        </div>
      </div>
    </>
  );

  const renderOverview = () => (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:p-8 text-white">
      <h2 className="text-xl font-semibold">Affiliate Overview</h2>
      <p className="mt-2 max-w-2xl text-sm text-white/65">
        Your detailed overview has its own page with referral code management,
        earnings, and payout history.
      </p>
      <Button
        onClick={() => router.push("/affiliate/overview")}
        className="mt-5 bg-[#E5D5B8] text-black hover:bg-[#d8c7a5]"
      >
        Open Overview Page
      </Button>
    </div>
  );

  const renderContent = () => {
    if (activeTab === "dashboard") return renderDashboard();
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "shoots") {
      return selectedBooking ? (
        <AffiliateShootDetails
          shootId={selectedBooking}
          onBack={() => setSelectedBooking(null)}
        />
      ) : (
        <AffiliateShoots
          onShootClick={(id) => setSelectedBooking(id)}
          onFillDetailsClick={() => setIsShootFormOpen(true)}
          pendingCount={pendingCount}
          selectedDate={selectedDate}
        />
      );
    }
    if (activeTab === "file-manager") return <AffiliateFileManager />;
    if (activeTab === "meetings") return <AffiliateMeetings />;
    if (activeTab === "messages") return <AffiliateMessages />;
    return <AffiliateProfileSettings />;
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button
            onClick={() => router.push("/book-a-shoot")}
            className="bg-[#E5D5B8] text-black hover:bg-[#d8c7a5]"
          >
            Book a Shoot
          </Button>
        }
      />

      <div
        className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold transition-colors duration-100 ${
                isDark ? "text-white" : "text-[#000]"
              }`}
            >
              Welcome back, {user?.name || "Partner"}!
            </h1>
            <p
              className={`text-xs lg:text-sm transition-colors duration-100 ${
                isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
            >
              Manage every shoot from start to finish in one centralized
              platform.
            </p>
          </div>

          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-xl bg-[#171717] p-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "shoots") {
                    setSelectedBooking(null);
                  }
                }}
                className={`h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#E5D5B8] text-black hover:bg-[#d8c7a5]"
                    : "bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={18} />
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </div>

        {renderContent()}
      </div>

      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[40] px-6 pb-6 pt-4 ${
          isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
        }`}
      >
        <Button
          onClick={() => router.push("/book-a-shoot")}
          className="h-14 w-full rounded-md border border-white/20 bg-[#E5D5B8] text-sm font-semibold text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-transform active:scale-[0.98] hover:bg-[#d8c7a5]"
        >
          Book a Shoot
        </Button>
      </div>

      <AffiliateShootDetailsForm
        isOpen={isShootFormOpen}
        onClose={() => setIsShootFormOpen(false)}
        pendingProjects={pendingProjects}
        isDark={isDark}
      />
    </>
  );
}
