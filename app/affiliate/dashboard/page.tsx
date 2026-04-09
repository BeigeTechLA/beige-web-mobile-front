"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { format } from "date-fns";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import { useAuth } from "@/lib/hooks/useAuth";
import { affiliateApi } from "@/lib/api";

export default function AffiliateDashboardPage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCheckingEmptyState, setIsCheckingEmptyState] = useState(true);
  const [hasDashboardData, setHasDashboardData] = useState(true);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    let active = true;

    const checkDashboardData = async () => {
      const token = Cookies.get("revure_token");
      if (!token) {
        if (active) {
          setHasDashboardData(false);
          setIsCheckingEmptyState(false);
        }
        return;
      }

      try {
        setIsCheckingEmptyState(true);

        const params: any = { range: "all" };
        if (selectedDate) {
          params.date_on = format(selectedDate, "yyyy-MM-dd");
        }

        const response = await affiliateApi.getDashboardSummary(token, params);
        const totalShoots = Number(response?.data?.total_shoots?.count || 0);

        if (active) {
          setHasDashboardData(totalShoots > 0);
        }
      } catch (error) {
        if (active) {
          setHasDashboardData(true);
        }
      } finally {
        if (active) {
          setIsCheckingEmptyState(false);
        }
      }
    };

    checkDashboardData();

    return () => {
      active = false;
    };
  }, [selectedDate]);

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
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
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
              Monitor revenue, shoots, clients, and performance metrics in one
              centralized dashboard.
            </p>
          </div>

          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        {!isCheckingEmptyState && !hasDashboardData ? (
          <EmptyFileState
            title="No Dashboard Data"
            description="No shoots found for the selected date range yet. Once shoots are added, your dashboard insights will appear here."
          />
        ) : (
          <>
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
        )}
      </div>
    </>
  );
}
