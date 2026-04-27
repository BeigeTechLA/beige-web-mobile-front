"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ArrowUpToLine, BadgeDollarSign, Coins, Users } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import FinanceMetricCards from "@/components/affiliate/FinanceMetricCards";
import CreditHistoryTable, {
  type CreditHistoryRow,
} from "@/components/affiliate/CreditHistoryTable";
import { Button } from "@/src/components/landing/ui/button";

const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyMonthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyStatusOptions = ["All", "Used", "Available"];

const creditHistoryRows: CreditHistoryRow[] = [
  {
    id: "1",
    date: "Apr 23, 2026",
    clientName: "Alex Morgan",
    email: "alex.morgan@example.com",
    availablePoints: "3,500 Points",
    usedPoints: "-850 Points",
    lastActivity: "22-04-2026",
    initials: "AM",
    avatarColor: "#F0C4E3",
  },
  {
    id: "2",
    date: "Apr 10, 2026",
    clientName: "Ethan Carter",
    email: "ethancarter@gmail.com",
    availablePoints: "4,000 Points",
    usedPoints: "-400 Points",
    lastActivity: "12-04-2026",
    initials: "EC",
    avatarColor: "#F5E4BC",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "3",
    date: "Mar 31, 2026",
    clientName: "Maya Ross",
    email: "mayaross@gmail.com",
    availablePoints: "5,500 Points",
    usedPoints: "-100 Points",
    lastActivity: "01-04-2026",
    initials: "MR",
    avatarColor: "#CFF3B9",
  },
  {
    id: "4",
    date: "Mar 12, 2026",
    clientName: "John Lee",
    email: "johnlee@outlook.com",
    availablePoints: "3,000 Points",
    usedPoints: "-200 Points",
    lastActivity: "21-03-2026",
    initials: "JL",
    avatarColor: "#F1DFC3",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "5",
    date: "Mar 4, 2026",
    clientName: "Raj Yadhav",
    email: "rajyadhav@outlook.com",
    availablePoints: "2,450 Points",
    usedPoints: "-550 Points",
    lastActivity: "06-03-2026",
    initials: "RY",
    avatarColor: "#D5D9E8",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "6",
    date: "Feb 8, 2026",
    clientName: "Daniel Roberts",
    email: "danielr@gmail.com",
    availablePoints: "2,450 Points",
    usedPoints: "-600 Points",
    lastActivity: "15-02-2026",
    initials: "DR",
    avatarColor: "#F4F4F4",
  },
  {
    id: "7",
    date: "Jan 30, 2026",
    clientName: "Sophia Bennett",
    email: "sophiab@gmail.com",
    availablePoints: "6,100 Points",
    usedPoints: "0 Points",
    lastActivity: "31-01-2026",
    initials: "SB",
    avatarColor: "#FFE0C7",
  },
  {
    id: "8",
    date: "Jan 14, 2026",
    clientName: "Noah Walker",
    email: "noahwalker@gmail.com",
    availablePoints: "1,900 Points",
    usedPoints: "0 Points",
    lastActivity: "16-01-2026",
    initials: "NW",
    avatarColor: "#D7E6FF",
  },
];

export default function AffiliateFinancesPage() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [historyMonth, setHistoryMonth] = useState("Month");
  const [historyStatus, setHistoryStatus] = useState("All");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [selectedDate, historyMonth, historyStatus, metricRange]);

  const isDark = !mounted || theme === "dark";

  const filteredRows = useMemo(() => {
    if (historyStatus === "All") return creditHistoryRows;

    return creditHistoryRows.filter((row) =>
      historyStatus === "Used"
        ? row.usedPoints.startsWith("-")
        : !row.usedPoints.startsWith("-")
    );
  }, [historyStatus]);

  const metrics = [
    {
      id: "available",
      label: "Total Credits Available",
      value: "10,050",
      helperText: "Across all users",
      icon: Coins,
    },
    {
      id: "used",
      label: "Total Credits Used",
      value: "3,450",
      helperText: "All-time usage",
      icon: BadgeDollarSign,
    },
    {
      id: "users",
      label: "Active Users with Credits",
      value: "5",
      helperText: "Currently holding credits",
      icon: Users,
    },
  ];

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
            <ArrowUpToLine size={18} />
            Export
          </Button>
        }
      />

      <div
        className="space-y-5 overflow-hidden p-4 lg:space-y-8 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
                isDark ? "text-white" : "text-[#000]"
              }`}
            >
              Credit Points
            </h1>
            <p
              className={`text-xs lg:text-sm transition-colors duration-100 ${
                isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
            >
              Track credit points usage across shoots and invoices
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <FinanceMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          dropdownLabel="Month"
          dropdownValue={metricRange}
          dropdownOptions={metricDropdownOptions}
          onDropdownChange={setMetricRange}
        />

        <CreditHistoryTable
          rows={filteredRows}
          loading={loading}
          monthValue={historyMonth}
          monthOptions={historyMonthOptions}
          onMonthChange={setHistoryMonth}
          statusValue={historyStatus}
          statusOptions={historyStatusOptions}
          onStatusChange={setHistoryStatus}
        />
      </div>
    </>
  );
}
