"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { adminApi } from "@/lib/api"; 
import { usePathname } from "next/navigation";
import {
  ArrowUpToLine,
  BadgeDollarSign,
  Clock3,
  Landmark,
  Shield,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import PayoutMetricCards, {
  type PayoutMetricCard,
} from "@/components/admin/finances/PayoutMetricCards";
import PayoutHistoryTable, {
  type PayoutHistoryRow,
} from "@/components/admin/finances/PayoutHistoryTable";
import DottedDivider from "@/components/admin/DottedDivider";
import { toast } from "sonner";

type PayoutScreenItem = {
  id?: string | number;
  booking_id?: string | number;
  project_id?: string | number;
  creator_name?: string | null;
  creator_image?: string | null;
  role?: string | null;
  amount?: string | number | null;
  total_amount?: string | number | null;
  fee_amount?: string | number | null;
  payment_method?: string | null;
  status?: string | null;
  created_at?: string | null;
  invoices?: Array<string | number> | null;
};

type PayoutScreenSummary = {
  available_balance?: string | number | null;
  pending_balance?: string | number | null;
  reserved_balance?: string | number | null;
  total_paid_out?: string | number | null;
  available?: string | number | null;
  pending?: string | number | null;
  reserved?: string | number | null;
  total?: string | number | null;
  [key: string]: unknown;
};

const normalizePayoutStatus = (status?: string | null): PayoutHistoryRow["status"] => {
  const normalized = (status || "").trim().toLowerCase();

  if (["completed", "paid", "success", "requested", "approved","successful", "processed"].includes(normalized)) {
    return "Completed";
  }

  if (["pending", "processing", "in_progress", "queued", "awaiting"].includes(normalized)) {
    return "Pending";
  }

  if (["rejected", "failed", "declined", "cancelled", "canceled"].includes(normalized)) {
    return "Rejected";
  }

  return "Pending";
};

const normalizePaymentMethod = (method?: string | null) => {
  const value = (method || "").trim().toLowerCase();

  if (value.includes("bank")) return "Bank Transfer";
  if (value.includes("stripe")) return "Stripe";
  if (value.includes("wire")) return "Bank Transfer";
  if (value.includes("ach")) return "Bank Transfer";
  return method || "Stripe";
};

const safeCurrency = (value?: string | number | null) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(numeric) ? numeric : 0);
};

const safeNegativeCurrency = (value?: string | number | null) => {
  const numeric = Math.abs(Number(value ?? 0));
  return `-${safeCurrency(Number.isFinite(numeric) ? numeric : 0)}`;
};

const parseCurrencyValue = (value?: string | number | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const cleaned = value.replace(/[^0-9.-]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPayoutItems = (responseData: any): PayoutScreenItem[] => {
  if (!responseData) return [];
  return responseData.payout_history?.rows || [];
};

export default function AdminPayoutsPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [payouts, setPayouts] = useState<PayoutHistoryRow[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutScreenSummary | null>(null);


  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted) {
      fetchPayoutData(); 
    }
  }, [mounted, selectedDate]); 

  const isDark = !mounted || theme === "dark";

  const metrics: PayoutMetricCard[] = useMemo(() => {
    const completedRows = payouts.filter((row) => row.status === "Completed");
    const pendingRows = payouts.filter((row) => row.status === "Pending");
    const rejectedRows = payouts.filter((row) => row.status === "Rejected");

    const rowsTotal = payouts.reduce((sum, row) => sum + parseCurrencyValue(row.netPayout), 0);
    const rowsCompletedTotal = completedRows.reduce((sum, row) => sum + parseCurrencyValue(row.netPayout), 0);
    const rowsPendingTotal = pendingRows.reduce((sum, row) => sum + parseCurrencyValue(row.netPayout), 0);
    const rowsReservedTotal = rejectedRows.reduce((sum, row) => sum + parseCurrencyValue(row.netPayout), 0);

    const summary = payoutSummary || {};

    const availableBalance =
      parseCurrencyValue(summary.available_balance) ||
      parseCurrencyValue(summary.available) ||
      rowsCompletedTotal;

    const pendingBalance =
      parseCurrencyValue(summary.pending_balance) ||
      parseCurrencyValue(summary.pending) ||
      rowsPendingTotal;

    const reservedBalance =
      parseCurrencyValue(summary.reserved_balance) ||
      parseCurrencyValue(summary.reserved) ||
      rowsReservedTotal;

    const totalPaidOut =
      parseCurrencyValue(summary.total_paid_out) ||
      parseCurrencyValue(summary.total) ||
      rowsTotal;

    return [
      {
        id: "available",
        label: "Available Balance",
        value: safeCurrency(availableBalance),
        helperText: completedRows.length > 0
          ? `${completedRows.length} payout${completedRows.length === 1 ? "" : "s"} ready for withdrawal`
          : "Ready for withdrawal",
        icon: BadgeDollarSign,
      },
      {
        id: "pending",
        label: "Pending Balance",
        value: safeCurrency(pendingBalance),
        helperText: pendingRows.length > 0
          ? `${pendingRows.length} payout${pendingRows.length === 1 ? "" : "s"} processing`
          : "Processing payments",
        icon: Clock3,
      },
      {
        id: "reserved",
        label: "Reserved Balance",
        value: safeCurrency(reservedBalance),
        helperText: rejectedRows.length > 0
          ? `${rejectedRows.length} payout${rejectedRows.length === 1 ? "" : "s"} on hold`
          : "Risk management hold",
        icon: Shield,
      },
      {
        id: "total",
        label: "Total Paid Out",
        value: safeCurrency(totalPaidOut),
        helperText: payouts.length > 0
          ? `${payouts.length} payout${payouts.length === 1 ? "" : "s"} loaded`
          : "Lifetime earnings",
        icon: Landmark,
      },
    ];
  }, [payouts, payoutSummary]);

  const filteredRows = useMemo(() => {
    return payouts.filter((row) => {
      const matchesSearch =
        row.shootId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesType = typeFilter === "All" || row.paymentMethod === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [payouts,searchQuery, statusFilter, typeFilter]);

 const fetchPayoutData = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPayoutsScreen();
      if (!response?.success) {
        throw new Error(response?.error || "Failed to fetch");
      }

      // 1. Update summary path
      setPayoutSummary(response.data?.overview || null);

      // 2. Get items
      const payoutItems = getPayoutItems(response.data);

      // 3. Update mapping keys
      const mappedRows: PayoutHistoryRow[] = payoutItems.map((item: any, index) => {
        const creator = item.creator || {};
        const breakdown = item.payout_breakdown || {};

        return {
          id: String(item.payout_request_id || index),
          shootId: item.request_code || "N/A",
          creatorName: creator.name || "Unknown",
          date: item.requested_at
            ? new Date(item.requested_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown date",
          serviceType: "Creative", 
          netPayout: safeCurrency(item.net_payout),
          paymentMethod: item.payment_method_label || "Bank Transfer",
          status: normalizePayoutStatus(item.status),
          initials: creator.initials || "U",
          avatarColor: "#E2E2E2",
          avatarImage: creator.image || undefined,
          breakdown: {
            earnings: safeCurrency(breakdown.service_earnings),
            fee: safeNegativeCurrency(breakdown.platform_fee),
            net: safeCurrency(breakdown.net_payout),
          },
          invoiceIds: Array.isArray(item.linked_invoices) ? item.linked_invoices : [],
        };
      });

      setPayouts(mappedRows);
    } catch (error) {
      console.error("Failed to load payout data:", error);
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors">
              <ArrowUpToLine /> Export
            </Button>
            <Button className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d]">
              Request Payout
            </Button>
          </>
        }
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
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

        <DottedDivider/>

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
      </div>
    </>
  );
}
