"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AffiliateOverallShootsTable } from "@/components/affiliate/AffiliateOverallShootsTable";
import AffiliateOverviewChart from "@/components/affiliate/AffiliateOverviewChart";
import AffiliateRecentActivity from "@/components/affiliate/AffiliateRecentActivity";
import AffiliateShootByCategory from "@/components/affiliate/AffiliateShootByCategory";
import { AffiliateShootStatusChart } from "@/components/affiliate/AffiliateShootStatusChart";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import Topbar from "@/components/admin/Topbar";

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

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

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
