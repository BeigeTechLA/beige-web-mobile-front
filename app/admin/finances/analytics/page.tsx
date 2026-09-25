"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import Overview from "@/components/admin/finances/analytics/Overview";
import CreativePartnerAnalysis from "@/components/admin/finances/analytics/CreativePartnerAnalysis";
import ClientAnalytics from "@/components/admin/finances/analytics/ClientAnalytics";
import DisputesAnalytics from "@/components/admin/finances/analytics/DisputesAnalytics";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function FinanceAnalyticsPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div
      className={`min-h-screen overflow-x-clip transition-colors duration-300 ${
        isDark ? "bg-[#0F0F0F] text-white" : "bg-[#F4F5F7] text-[#171717]"
      }`}
    >
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          finances: "Finances",
          analytics: "Finance Analytics",
        }}
      />

      <div
        className="p-4 pb-8 lg:p-10"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mb-2 font-semibold lg:text-2xl">Finance</h1>
            <p
              className={`text-xs lg:text-sm ${
                isDark ? "text-[#FFFFFFB2]" : "text-[#000000B2]"
              }`}
            >
              CP earnings, client revenue, and dispute analytics
            </p>
          </div>

          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <div className="space-y-5 lg:space-y-6">
          <Overview isDark={isDark} selectedDate={selectedDate} />
          <CreativePartnerAnalysis
            isDark={isDark}
            selectedDate={selectedDate}
          />
          <ClientAnalytics isDark={isDark} selectedDate={selectedDate} />
          <DisputesAnalytics isDark={isDark} selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
}
