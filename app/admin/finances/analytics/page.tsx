"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";

import { format } from "date-fns";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import RevenueOverviewChart from "@/components/admin/finances/RevenueOverviewChart";
import TopCPsByPayout from "@/components/admin/finances/TopCPsByPayout";
import TopCPsByShoots from "@/components/admin/finances/TopCPsByShoots";
import AvgPayoutMarginCount from "@/components/admin/finances/AvgPayoutMarginCount";
import TopOverdueCPs from "@/components/admin/finances/TopOverdueCPs";
import CPPayoutTimeline from "@/components/admin/finances/CPPayoutTimeline";
import ShootDistribution from "@/components/admin/finances/ShootDistribution";
import AvgClientSpendPerShoot from "@/components/admin/finances/AvgClientSpendPerShoot";
import TopClients from "@/components/admin/finances/TopClients";
import ClientPaymentOverview from "@/components/admin/finances/ClientPaymentOverview";
import OutstandingPayment from "@/components/admin/finances/OutstandingPayment";


export default function FinanceAnalyticsPage() {
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [loading, setLoading] = useState(true);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden p-4 pb-20 lg:p-6 lg:px-10 lg:py-9 space-y-3 lg:space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${isDark ? "text-white" : "text-black"}`}>
              Finance
            </h1>
            <p className={`text-xs transition-colors duration-100 lg:text-sm ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              CP earnings, client revenue, and dispute analytics
            </p>
          </div>

          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        <>
          <RevenueOverviewChart />
          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Creative Partner Analysis</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              <TopCPsByPayout />
              <AvgPayoutMarginCount />
            </div>

            <TopCPsByShoots />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              <CPPayoutTimeline />
              <TopOverdueCPs />
            </div>
          </div>

          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Client Analytics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              <TopClients />
              <div className="space-y-3 lg:space-y-6">
                <AvgClientSpendPerShoot />
                <ShootDistribution />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              <ClientPaymentOverview />
              <OutstandingPayment />
            </div>
          </div>

          <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 space-y-3 lg:space-y-6 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <p className="font-medium text-sm lg:text-base">Disputes Analytics</p>
            </div>
          </div>
        </>

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        {/* <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>

        </div> */}
      </div >
    </>
  );
}
