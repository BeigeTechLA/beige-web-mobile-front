"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AffiliateDashboardPage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => setMounted(true), []);

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
      </div>
    </>
  );
}
