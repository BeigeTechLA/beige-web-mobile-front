"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import router for navigation
import { OverallShootsTable } from "@/components/admin/OverallShootsTable";
import OverviewChart from "@/components/admin/OverviewChart";
import RecentActivity from "@/components/admin/RecentActivity";
import ShootByCategory from "@/components/admin/ShootByCategory";
import ShootStatusChart from "@/components/admin/ShootStatusChart";
import StackedDashboard from "@/components/admin/StatsModule";
import { TopCreatives } from "@/components/admin/TopCreatives";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { SortDateButton } from "@/components/admin/SortDateButton";

export default function AdminDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const router = useRouter();

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-white">
          <h1 className="text-lg text-2xl lg:leading-[32px] font-semibold mb-1">Welcome back, Admin !</h1>
          <p className="text-xs lg:text-sm text-white/70">Monitor revenue, shoots, clients, and performance metrics in one centralized dashboard.</p>
        </div>
        <SortDateButton
          selectedDate={selectedDate}
          onDateChange={handleDateSort}
        />
      </div>

      <div
        className="lg:hidden h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px',
          backgroundRepeat: 'repeat-x'
        }}
      />

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

      <div className="flex flex-col lg:flex-row gap-4 mt-5 pb-20 lg:pb-0"> {/* Added padding-bottom for mobile to clear the floating button */}
        <div className="lg:w-3/4">
          <ShootStatusChart />
        </div>
        <div className="lg:w-1/4">
          <RecentActivity />
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
        <Button
          onClick={() => router.push("/book-a-shoot")}
          className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
        >
          Book a Shoot
        </Button>
      </div>
    </>
  )
}