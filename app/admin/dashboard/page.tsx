"use client";
import React, { useState } from "react";
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
          <h1 className="text-2xl leading-[32px] font-semibold mb-1">Welcome back, Admin !</h1>
          <p className="text-sm text-white/70">Monitor revenue, shoots, clients, and performance metrics in one centralized dashboard.</p>
        </div>
        <SortDateButton
          selectedDate={selectedDate}
          onDateChange={handleDateSort}
        />
      </div>

      <OverviewChart externalSelectedDate={selectedDate} />

      <div className="flex gap-4 mt-5">
        <div className="w-3/4 flex flex-col gap-4">
          <StackedDashboard />
          <TopCreatives />
        </div>
        <div className="w-1/4">
          <ShootByCategory />
        </div>
      </div>
      <OverallShootsTable />
      <div className="flex gap-4 mt-5">
        <div className="w-3/4">
          <ShootStatusChart />
        </div>
        <div className="w-1/4">
          <RecentActivity />
        </div>
      </div>
    </>
  )
}