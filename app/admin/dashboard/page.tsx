"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/lib/redux/hooks";

import { OverallShootsTable } from "@/components/admin/OverallShootsTable";
import { LeadsShootsTable } from "@/components/admin/LeadsShootsTable";
import { TopCreatives } from "@/components/admin/TopCreatives";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";

import OverviewChart from "@/components/admin/OverviewChart";
import RecentActivity from "@/components/admin/RecentActivity";
import ShootByCategory from "@/components/admin/ShootByCategory";
import ShootStatusChart from "@/components/admin/ShootStatusChart";
import StackedDashboard from "@/components/admin/StatsModule";
import Topbar from "@/components/admin/Topbar";
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canCreate } = usePermissions("shoots");
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  // Constant default to dark
  const isDark = !mounted || theme === "dark";
  const roleLabel = user?.user_type_id === 8 || user?.userTypeId === 8 ? "Super Admin" : "Admin";

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <div className="flex gap-2">
            {/* <Button onClick={() => router.push("/admin/internal-credentials")} className="bg-white text-black hover:bg-white/90">
              Internal Credentials
            </Button> */}
            {canCreate && (
              <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black">
                Book a Shoot
              </Button>
            )}
          </div>
        }
      />

      <div className="overflow-hidden pb-30 p-4 lg:p-6 lg:px-10 lg:py-9" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Welcome back, {roleLabel} !</h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Monitor revenue, shoots, Users, and performance metrics in one centralized dashboard.</p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        {/* <DottedDivider /> */}
        <OverviewChart externalSelectedDate={selectedDate} />

        <div className="flex flex-col lg:flex-row gap-4 mt-5">
          <div className="lg:w-3/4 flex flex-col gap-4">
            <StackedDashboard />
            <TopCreatives />
          </div>
          <div className="lg:w-1/4">
            <ShootByCategory />
          </div>
        </div>
        <OverallShootsTable />

        <div className="flex flex-col lg:flex-row gap-4 mt-5 lg:pb-0">
          <div className="lg:w-3/4">
            <ShootStatusChart />
          </div>
          <div className="lg:w-1/4">
            <RecentActivity />
          </div>
        </div>

        <LeadsShootsTable />

        {/* --- FLOATING MOBILE BUTTON --- */}
        {canCreate && (
          <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
            <Button
              onClick={() => router.push("/book-a-shoot")}
              className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              Book a Shoot
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
