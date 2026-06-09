"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import { Button } from "@/components/ui/button";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";
import { affiliateApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AffiliateDashboardPage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [isShootFormOpen, setIsShootFormOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchPendingProjectForms = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        const pendingData = await affiliateApi.getProjectFormSubmission(token);
        if (!pendingData?.error) {
          setPendingProjects(pendingData.projects || []);
          setPendingCount(pendingData.count || 0);
        } else {
          setPendingProjects([]);
          setPendingCount(0);
        }
      } catch (error) {
        console.error("Error fetching pending project forms:", error);
        toast.error("Failed to load pending shoot forms");
        setPendingProjects([]);
        setPendingCount(0);
      }
    };

    fetchPendingProjectForms();
  }, []);

  const isDark = !mounted || theme === "dark";

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-center gap-3">
          <div>
            <h1
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Welcome back, {user?.name || "Partner"}!
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Monitor revenue, shoots, clients, and performance metrics in one
              centralized dashboard.
            </p>
          </div>

          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <>
          {pendingCount > 0 && (
            <div className={`border rounded-lg lg:rounded-xl p-4 lg:p-8 transition-colors ${isDark
              ? "bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border-[#E8D1AB]/20"
              : "bg-white border-[#E8D1AB]/30 shadow-sm"
              }`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg lg:text-xl mb-2 ${isDark ? "text-white" : "text-[#171717]"}`}>
                    Complete Your Shoot Details
                  </h3>
                  <p className={`text-sm lg:text-base ${isDark ? "text-white/60" : "text-zinc-500"}`}>
                    Help us prepare better by filling out detailed information about your upcoming shoot
                  </p>
                  <p className={`text-xs lg:text-sm mt-2 font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#7A5A2A]"}`}>
                    Pending projects: {pendingCount}
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
      </div>

      <AffiliateShootDetailsForm
        isOpen={isShootFormOpen}
        onClose={() => setIsShootFormOpen(false)}
        projectId={pendingProjects[0]?.project_id || 0}
        pendingProjects={pendingProjects}
        isDark={isDark}
      />
    </>
  );
}
