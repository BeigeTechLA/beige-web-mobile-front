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

  if (["completed", "paid", "success", "successful", "processed"].includes(normalized)) {
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

const getPayoutItems = (responseData: unknown): PayoutScreenItem[] => {
  if (!responseData || typeof responseData !== "object") return [];

  const container = responseData as {
    payouts?: PayoutScreenItem[];
    data?: { payouts?: PayoutScreenItem[] };
    items?: PayoutScreenItem[];
    rows?: PayoutScreenItem[];
    results?: PayoutScreenItem[];
  };

  const candidates = [
    container.payouts,
    container.data?.payouts,
    container.items,
    container.rows,
    container.results,
  ];

  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found : [];
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
        throw new Error(response?.error || "Failed to fetch payout data");
      }

      const responseSummary = (() => {
        const source = response.data as {
          summary?: PayoutScreenSummary;
          overview?: PayoutScreenSummary;
          data?: { summary?: PayoutScreenSummary; overview?: PayoutScreenSummary };
        } | null;

        return source?.summary || source?.overview || source?.data?.summary || source?.data?.overview || null;
      })();

      setPayoutSummary(responseSummary);

      const payoutItems = getPayoutItems(response.data);
      const mappedRows: PayoutHistoryRow[] = payoutItems.map((item, index) => {
        const creatorName = item.creator_name || "Unknown";
        const initials = creatorName
          .split(" ")
          .filter(Boolean)
          .map((name) => name[0])
          .join("")
          .toUpperCase() || "U";

        return {
          id: String(item.id ?? item.booking_id ?? item.project_id ?? `payout-${index}`),
          shootId: `#${item.booking_id || item.project_id || "N/A"}`,
          creatorName,
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown date",
          serviceType: item.role || "Creative",
          netPayout: safeCurrency(item.amount),
          paymentMethod: normalizePaymentMethod(item.payment_method),
          status: normalizePayoutStatus(item.status),
          initials,
          avatarColor: "#E2E2E2",
          avatarImage: item.creator_image || undefined,
          breakdown: {
            earnings: safeCurrency(item.total_amount),
            fee: safeNegativeCurrency(item.fee_amount),
            net: safeCurrency(item.amount),
          },
          invoiceIds: Array.isArray(item.invoices)
            ? item.invoices.map((invoice) => String(invoice))
            : [],
        };
      });

      setPayouts(mappedRows);
    } catch (error) {
      console.error("Failed to load payout data:", error);
      toast.error("Failed to load payout data");
      setPayouts([]);
      setPayoutSummary(null);
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
