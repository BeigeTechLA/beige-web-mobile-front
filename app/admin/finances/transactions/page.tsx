"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ArrowUpToLine } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import TransactionsTable, {
  type TransactionRow,
} from "@/components/admin/finances/TransactionsTable";
import DottedDivider from "@/components/admin/DottedDivider";

const transactionRows: TransactionRow[] = [
  {
    id: "txn-1",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Prince Carter",
    date: "Jan 13, 2026",
    shootType: "Wedding Videography",
    totalAmount: "$12,000",
    paymentMethod: "Stripe",
    status: "Paid",
    initials: "PC",
    avatarColor: "#F0C4E3",
    invoiceIds: ["INV-101-A", "INV-101-B"],
    invoiceDetails: [
      {
        id: "INV-001-A",
        date: "2026-04-20",
        method: "Credit Card",
        status: "Paid",
        amount: "$7,500",
        feeNote: "Service: $7000 + Tax: $500",
      },
      {
        id: "INV-001-B",
        date: "2026-04-21",
        method: "Bank Transfer",
        status: "Paid",
        amount: "$5,000",
        feeNote: "Service: $4500 + Tax: $350",
      },
    ],
  },
  {
    id: "txn-2",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Ethan Carter",
    date: "Jan 13, 2026",
    shootType: "Podcast Shoot",
    totalAmount: "$8,000",
    paymentMethod: "Bank Transfer",
    status: "Failed",
    initials: "EC",
    avatarColor: "#F5E4BC",
    avatarImage: "/images/avatar.png",
    invoiceIds: ["INV-102-A", "INV-102-B"],
    invoiceDetails: [
      {
        id: "INV-002-A",
        date: "2026-04-18",
        method: "Credit Card",
        status: "Failed",
        amount: "$4,000",
        feeNote: "Service: $3800 + Tax: $200",
      },
      {
        id: "INV-002-B",
        date: "2026-04-19",
        method: "Bank Transfer",
        status: "Failed",
        amount: "$4,000",
        feeNote: "Service: $3650 + Tax: $350",
      },
    ],
  },
  {
    id: "txn-3",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Sophia Johnson",
    date: "Jan 13, 2026",
    shootType: "Music Video",
    totalAmount: "$14,000",
    paymentMethod: "Stripe",
    status: "Paid",
    initials: "SJ",
    avatarColor: "#F4E5CC",
    avatarImage: "/images/avatar.png",
    invoiceIds: ["INV-103-A", "INV-103-B"],
    invoiceDetails: [
      {
        id: "INV-003-A",
        date: "2026-04-15",
        method: "Credit Card",
        status: "Paid",
        amount: "$8,500",
        feeNote: "Service: $8000 + Tax: $500",
      },
      {
        id: "INV-003-B",
        date: "2026-04-16",
        method: "Bank Transfer",
        status: "Paid",
        amount: "$5,500",
        feeNote: "Service: $5100 + Tax: $400",
      },
    ],
  },
  {
    id: "txn-4",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Maya Ross",
    date: "Jan 13, 2026",
    shootType: "Podcast Shoot",
    totalAmount: "$4,000",
    paymentMethod: "Stripe",
    status: "Pending",
    initials: "MR",
    avatarColor: "#CFF3B9",
    invoiceIds: ["INV-104-A", "INV-104-B"],
    invoiceDetails: [
      {
        id: "INV-004-A",
        date: "2026-04-11",
        method: "Credit Card",
        status: "Pending",
        amount: "$2,250",
        feeNote: "Service: $2100 + Tax: $150",
      },
      {
        id: "INV-004-B",
        date: "2026-04-12",
        method: "Bank Transfer",
        status: "Pending",
        amount: "$1,750",
        feeNote: "Service: $1600 + Tax: $150",
      },
    ],
  },
  {
    id: "txn-5",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "John Lee",
    date: "Jan 13, 2026",
    shootType: "Podcast Shoot",
    totalAmount: "$15,000",
    paymentMethod: "Stripe",
    status: "Pending",
    initials: "JL",
    avatarColor: "#E8DDD0",
    avatarImage: "/images/avatar.png",
    invoiceIds: ["INV-105-A", "INV-105-B"],
    invoiceDetails: [
      {
        id: "INV-005-A",
        date: "2026-04-09",
        method: "Credit Card",
        status: "Pending",
        amount: "$7,800",
        feeNote: "Service: $7300 + Tax: $500",
      },
      {
        id: "INV-005-B",
        date: "2026-04-10",
        method: "Bank Transfer",
        status: "Pending",
        amount: "$7,200",
        feeNote: "Service: $6800 + Tax: $400",
      },
    ],
  },
  {
    id: "txn-6",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Arvi Ross",
    date: "Jan 13, 2026",
    shootType: "Music Video",
    totalAmount: "$6,000",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    initials: "AR",
    avatarColor: "#E2E2E2",
    avatarImage: "/images/avatar.png",
    invoiceIds: ["INV-106-A", "INV-106-B"],
    invoiceDetails: [
      {
        id: "INV-006-A",
        date: "2026-04-07",
        method: "Credit Card",
        status: "Pending",
        amount: "$3,250",
        feeNote: "Service: $3000 + Tax: $250",
      },
      {
        id: "INV-006-B",
        date: "2026-04-08",
        method: "Bank Transfer",
        status: "Pending",
        amount: "$2,750",
        feeNote: "Service: $2550 + Tax: $200",
      },
    ],
  },
  {
    id: "txn-7",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Daniel Roberts",
    date: "Jan 13, 2026",
    shootType: "Corporate Photography",
    totalAmount: "$8,200",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    initials: "DR",
    avatarColor: "#F3F3F3",
    invoiceIds: ["INV-107-A", "INV-107-B"],
    invoiceDetails: [
      {
        id: "INV-007-A",
        date: "2026-04-05",
        method: "Credit Card",
        status: "Pending",
        amount: "$4,400",
        feeNote: "Service: $4100 + Tax: $300",
      },
      {
        id: "INV-007-B",
        date: "2026-04-06",
        method: "Bank Transfer",
        status: "Pending",
        amount: "$3,800",
        feeNote: "Service: $3550 + Tax: $250",
      },
    ],
  },
  {
    id: "txn-8",
    transactionId: "TXN-2026-001245",
    shootId: "#1234",
    clientName: "Raj Yadhav",
    date: "Jan 13, 2026",
    shootType: "Music Video",
    totalAmount: "$4,500",
    paymentMethod: "Stripe",
    status: "Pending",
    initials: "RY",
    avatarColor: "#D5D9E8",
    avatarImage: "/images/avatar.png",
    invoiceIds: ["INV-108-A", "INV-108-B"],
    invoiceDetails: [
      {
        id: "INV-008-A",
        date: "2026-04-03",
        method: "Credit Card",
        status: "Pending",
        amount: "$2,600",
        feeNote: "Service: $2400 + Tax: $200",
      },
      {
        id: "INV-008-B",
        date: "2026-04-04",
        method: "Bank Transfer",
        status: "Pending",
        amount: "$1,900",
        feeNote: "Service: $1750 + Tax: $150",
      },
    ],
  },
];

export default function AdminTransactionsPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState<"Transactions ID" | "Shoot ID">("Transactions ID");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [selectedDate, searchQuery, statusFilter, monthFilter, typeFilter, view]);

  const isDark = !mounted || theme === "dark";

  const filteredRows = useMemo(() => {
    return transactionRows.filter((row) => {
      const matchesSearch =
        row.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.shootId.toLowerCase().includes(searchQuery.toLowerCase());
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
          <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors">
            <ArrowUpToLine /> Export
          </Button>
        }
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Transactions
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage your transactions, and payment history
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <DottedDivider/>

        <TransactionsTable
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
          viewValue={view}
          onViewChange={setView}
        />
      </div>
    </>
  );
}
