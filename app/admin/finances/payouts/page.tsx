"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpToLine } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import PayoutMetricCards, {
  type PayoutMetricCard,
} from "@/components/admin/finances/PayoutMetricCards";
import PayoutHistoryTable, {
  type PayoutHistoryRow,
} from "@/components/admin/finances/PayoutHistoryTable";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

const payoutRows: PayoutHistoryRow[] = [
  {
    id: "payout-1",
    shootId: "#1234",
    creatorName: "Prince Carter",
    date: "Jan 13, 2026",
    serviceType: "Videography",
    netPayout: "$12,000",
    paymentMethod: "Stripe",
    status: "Completed",
    initials: "PC",
    avatarColor: "#F0C4E3",
    breakdown: { earnings: "$14,000", fee: "-$2,000", net: "$12,000" },
    invoiceIds: ["INV-001-A", "INV-001-B"],
  },
  {
    id: "payout-2",
    shootId: "#1234",
    creatorName: "Ethan Carter",
    date: "Jan 13, 2026",
    serviceType: "Photography",
    netPayout: "$8,000",
    paymentMethod: "Bank Transfer",
    status: "Rejected",
    initials: "EC",
    avatarColor: "#F5E4BC",
    avatarImage: "/images/avatar.png",
    breakdown: { earnings: "$9,100", fee: "-$1,100", net: "$8,000" },
    invoiceIds: ["INV-002-A", "INV-002-B"],
  },
  {
    id: "payout-3",
    shootId: "#1234",
    creatorName: "Sophia Johnson",
    date: "Jan 13, 2026",
    serviceType: "Photography",
    netPayout: "$14,000",
    paymentMethod: "Stripe",
    status: "Completed",
    initials: "SJ",
    avatarColor: "#F4E5CC",
    avatarImage: "/images/avatar.png",
    breakdown: { earnings: "$15,800", fee: "-$1,800", net: "$14,000" },
    invoiceIds: ["INV-003-A", "INV-003-B"],
  },
  {
    id: "payout-4",
    shootId: "#1234",
    creatorName: "Maya Ross",
    date: "Jan 13, 2026",
    serviceType: "Photo + Video",
    netPayout: "$4,000",
    paymentMethod: "Stripe",
    status: "Pending",
    initials: "MR",
    avatarColor: "#CFF3B9",
    breakdown: { earnings: "$4,550", fee: "-$550", net: "$4,000" },
    invoiceIds: ["INV-004-A", "INV-004-B"],
  },
  {
    id: "payout-5",
    shootId: "#1234",
    creatorName: "John Lee",
    date: "Jan 13, 2026",
    serviceType: "Photo + Video",
    netPayout: "$15,000",
    paymentMethod: "Stripe",
    status: "Completed",
    initials: "JL",
    avatarColor: "#E8DDD0",
    avatarImage: "/images/avatar.png",
    breakdown: { earnings: "$17,000", fee: "-$2,000", net: "$15,000" },
    invoiceIds: ["INV-005-A", "INV-005-B"],
  },
  {
    id: "payout-6",
    shootId: "#1234",
    creatorName: "Arvi Ross",
    date: "Jan 13, 2026",
    serviceType: "Photography",
    netPayout: "$6,000",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    initials: "AR",
    avatarColor: "#E2E2E2",
    avatarImage: "/images/avatar.png",
    breakdown: { earnings: "$6,800", fee: "-$800", net: "$6,000" },
    invoiceIds: ["INV-006-A", "INV-006-B"],
  },
  {
    id: "payout-7",
    shootId: "#1234",
    creatorName: "Daniel Roberts",
    date: "Jan 13, 2026",
    serviceType: "Videography",
    netPayout: "$8,200",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    initials: "DR",
    avatarColor: "#F3F3F3",
    breakdown: { earnings: "$9,320", fee: "-$1,120", net: "$8,200" },
    invoiceIds: ["INV-007-A", "INV-007-B"],
  },
  {
    id: "payout-8",
    shootId: "#1234",
    creatorName: "Raj Yadhav",
    date: "Jan 13, 2026",
    serviceType: "Videography",
    netPayout: "$4,500",
    paymentMethod: "Stripe",
    status: "Rejected",
    initials: "RY",
    avatarColor: "#D5D9E8",
    avatarImage: "/images/avatar.png",
    breakdown: { earnings: "$5,020", fee: "-$520", net: "$4,500" },
    invoiceIds: ["INV-008-A", "INV-008-B"],
  },
];

export default function AdminPayoutsPage() {
  const pathname = usePathname();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");


  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [selectedDate, metricRange, searchQuery, statusFilter, monthFilter, typeFilter]);

  const { isDark } = useResolvedTheme();


  const CustomClockIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Clock.svg"
      width={size}
      height={size}
      alt="video"
    />
  );
  const CustomDollarIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Dollar.svg"
      width={size}
      height={size}
      alt="camera"
    />
  );
  const CustomGraphIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/GraphUp.svg"
      width={size}
      height={size}
      alt="film reel"
    />
  );

  const CustomShieldIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/security.svg"
      width={size}
      height={size}
      alt="film reel"
    />
  );

  const metrics: PayoutMetricCard[] = [
    {
      id: "available",
      label: "Available Balance",
      value: "$4,325.50",
      helperText: "Ready for withdrawal",
      icon: CustomDollarIcon,
    },
    {
      id: "pending",
      label: "Pending Balance",
      value: "$1,847.25",
      helperText: "Processing payments",
      icon: CustomClockIcon,
    },
    {
      id: "reserved",
      label: "Reserved Balance",
      value: "$892.80",
      helperText: "Risk management hold",
      icon: CustomShieldIcon,
    },
    {
      id: "total",
      label: "Total Paid Out",
      value: "$47,523.90",
      helperText: "Lifetime earnings",
      icon: CustomGraphIcon,
    },
  ];

  const filteredRows = useMemo(() => {
    return payoutRows.filter((row) => {
      const matchesSearch =
        row.shootId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesType = typeFilter === "All" || row.paymentMethod === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}>
              <ArrowUpToLine /> Export
            </Button>
            <Button className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d]">
              Request Payout
            </Button>
          </>
        }
      />

      <div
        className="overflow-hidden p-4 pb-24 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Payouts
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage your balances, withdrawals, and payment history
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <PayoutMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          rangeValue={metricRange}
          onRangeChange={setMetricRange}
        />

        <PayoutHistoryTable
          rows={filteredRows}
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          monthValue={monthFilter}
          onMonthChange={setMonthFilter}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Request Payout
          </Button>
        </div>
      </div>
    </>
  );
}
