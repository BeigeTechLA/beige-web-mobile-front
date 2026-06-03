"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import DottedDivider from "@/components/admin/DottedDivider";
import { Button } from "@/components/ui/button";
import CPCompensationOverview from "@/components/admin/finances/cp-compensation/CPCompensationOverview";
import CPCompensationTabs from "@/components/admin/finances/cp-compensation/CPCompensationTabs";
import CPCompensationTable from "@/components/admin/finances/cp-compensation/CPCompensationTable";
import { ArrowUpToLine, Plus } from "lucide-react";

export default function CPCompensationPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"shoots" | "creators">("shoots");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex items-center gap-3">
            <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors">
              <ArrowUpToLine className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d] font-semibold"
            >
              Add Compensation
            </Button>
          </div>
        }
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              CP Compensation
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage creative partner compensation, advance payments, approvals, and payout tracking in one place.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Overview Cards */}
        <CPCompensationOverview />

        {/* Tabs and content */}
        <div className="space-y-6">
          <CPCompensationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <CPCompensationTable type={activeTab} />
        </div>
      </div>
    </>
  );
}
