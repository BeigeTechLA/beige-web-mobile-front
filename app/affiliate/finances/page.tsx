"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpToLine,
  BadgeDollarSign,
  Coins,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import { affiliateApi } from "@/lib/api";

const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyMonthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyStatusOptions = ["All", "Added", "Used"];

type ClientCreditSummary = {
  total_credit_amount?: number;
  used_credit_amount?: number;
  available_credit_amount?: number;
  pending_credit_amount?: number;
};

type ClientCreditHistoryEntry = {
  account_credit_ledger_id?: number;
  amount?: number;
  direction?: "debit" | "credit";
  entry_type?: string;
  status?: string;
  source?: string;
  notes?: string | null;
  booking_id?: number | null;
  booking_name?: string | null;
  created_at?: string | null;
};

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
  const [creditSummary, setCreditSummary] = useState<ClientCreditSummary | null>(null);
  const [creditHistory, setCreditHistory] = useState<ClientCreditHistoryEntry[]>([]);

  useEffect(() => setMounted(true), []);

  const fetchClientCredits = useCallback(async () => {
    const token = Cookies.get("revure_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        affiliateApi.getClientCreditSummary(token),
        affiliateApi.getClientCreditHistory(token, { page: 1, limit: 200 }),
      ]);

      if (!summaryRes?.error) {
        setCreditSummary(summaryRes?.data || null);
      }

      if (!historyRes?.error) {
        setCreditHistory(historyRes?.data?.history || []);
      }
    } catch (error) {
      console.error("Failed to load client credit data:", error);
      toast.error("Failed to load credit details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientCredits();
  }, [fetchClientCredits]);

  const isDark = !mounted || theme === "dark";

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const transactionLabel = (entryType?: string) => {
    const labelMap: Record<string, string> = {
      credit_created: "Credit Added",
      credit_used: "Credit Used",
      credit_reversed: "Credit Reversed",
    };
    return labelMap[entryType || ""] || (entryType ? entryType.replace(/_/g, " ") : "Unknown");
  };

  const passesDateRange = (createdAt?: string | null, range = "Month") => {
    if (!createdAt) return false;
    const rowDate = new Date(createdAt);
    if (Number.isNaN(rowDate.getTime())) return false;

    const now = new Date();
    if (range === "Last 30 Days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return rowDate >= from;
    }
    if (range === "This Quarter") {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const from = new Date(now.getFullYear(), quarterStartMonth, 1);
      return rowDate >= from;
    }
    if (range === "This Year") {
      return rowDate.getFullYear() === now.getFullYear();
    }

    return rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear();
  };

  const filteredTransactions = useMemo(() => {
    return creditHistory.filter((entry) => {
      const isUsed = entry.direction === "debit" || entry.entry_type === "credit_used";

      if (historyStatus === "Added" && isUsed) return false;
      if (historyStatus === "Used" && !isUsed) return false;
      if (!passesDateRange(entry.created_at, historyMonth)) return false;

      if (selectedDate && entry.created_at) {
        const rowDate = new Date(entry.created_at);
        if (
          rowDate.getDate() !== selectedDate.getDate() ||
          rowDate.getMonth() !== selectedDate.getMonth() ||
          rowDate.getFullYear() !== selectedDate.getFullYear()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [creditHistory, historyMonth, historyStatus, selectedDate]);

  const metrics = [
    {
      id: "available",
      label: "Available Credits",
      value: formatCurrency(creditSummary?.available_credit_amount || 0),
      helperText: "Admin approed credits",
      icon: Coins,
      iconWrapClass: "bg-[#1D1A14] text-[#E8D1AB]",
    },
    {
      id: "used",
      label: "Used Credits",
      value: formatCurrency(creditSummary?.used_credit_amount || 0),
      helperText: "Applied on bookings",
      icon: BadgeDollarSign,
      iconWrapClass: "bg-[#1B1413] text-[#F79A8B]",
    },
    {
      id: "total",
      label: "Total Credits",
      value: formatCurrency(
        (Number(creditSummary?.available_credit_amount || 0) || 0) +
          (Number(creditSummary?.used_credit_amount || 0) || 0)
      ),
      helperText: "Approved + used credits",
      icon: Wallet,
      iconWrapClass: "bg-[#141A1A] text-[#79C8BD]",
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

        <section
          className={`rounded-[24px] border p-5 lg:p-6 transition-colors ${
            isDark
              ? "border-[#2D2D2D] bg-[#171717]"
              : "border-[#E5E5E5] bg-[#FCFBF7]"
          }`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h2 className={`text-lg font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                Overview
              </h2>
            </div>

            {/* <select
              value={metricRange}
              onChange={(e) => setMetricRange(e.target.value)}
              className={`h-10 rounded-full px-4 text-xs border ${
                isDark
                  ? "bg-zinc-900 border-[#3D3D3D] text-white/70"
                  : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}
            >
              {metricDropdownOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const isActive = activeMetricId === metric.id;

              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setActiveMetricId(metric.id)}
                  className={`rounded-2xl border p-5 lg:p-6 text-left transition-all min-h-[182px] ${
                    isActive
                      ? isDark
                        ? "border-[#AE936A] bg-[#E5D1AA] text-[#171717]"
                        : "border-[#E8D1AB] bg-[linear-gradient(145deg,#F8EBCF_0%,#F3DFC0_100%)]"
                      : isDark
                      ? "border-[#242424] bg-[#101010] hover:border-[#3A3A3A]"
                      : "border-[#EFE7DB] bg-white hover:border-[#E5D5B8]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm font-medium ${isActive ? "text-[#171717]" : isDark ? "text-white/90" : "text-[#171717]"}`}>
                      {metric.label}
                    </p>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-[#171717] text-[#E8D1AB]" : metric.iconWrapClass}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <p className={`mt-8 text-[48px] leading-none tracking-[-0.03em] font-semibold ${isActive ? "text-[#171717]" : isDark ? "text-white" : "text-[#171717]"}`}>
                    {metric.value}
                  </p>
                  <p className={`mt-4 text-sm ${isActive ? "text-[#171717]/75" : isDark ? "text-[#A5A5A5]" : "text-[#6F6F6F]"}`}>
                    {metric.helperText}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section
          className={`overflow-visible rounded-[24px] border transition-colors ${
            isDark
              ? "border-[#2D2D2D] bg-[#171717]"
              : "border-[#E5E5E5] bg-[#FCFBF7]"
          }`}
        >
          <div
            className={`flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 ${
              isDark ? "border-[#2A2A2A]" : "border-[#ECE2D3]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h2 className={`text-lg font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                Credit Transactions
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/5 text-white/80" : "bg-white text-[#444]"}`}>
                Pending Approval: {formatCurrency(creditSummary?.pending_credit_amount || 0)}
              </div>
            </div>
          </div>

          {/* <div className={`flex items-center gap-2 p-4 border-b ${isDark ? "border-[#2A2A2A]" : "border-[#ECE2D3]"}`}>
            <select
              value={historyMonth}
              onChange={(e) => setHistoryMonth(e.target.value)}
              className={`h-9 rounded-full px-3 text-xs border ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-white border-[#E3E3E3] text-[#323232]"}`}
            >
              {historyMonthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value)}
              className={`h-9 rounded-full px-3 text-xs border ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-white border-[#E3E3E3] text-[#323232]"}`}
            >
              {historyStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div> */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left">
              <thead className={isDark ? "bg-[#101010]" : "bg-[#FFF9EE]"}>
                <tr className={`text-sm ${isDark ? "text-[#E9D2A9]" : "text-[#7E5E2A]"}`}>
                  <th className="px-6 py-5 font-medium">Flow</th>
                  <th className="px-6 py-5 font-medium">Date</th>
                  <th className="px-6 py-5 font-medium">Transaction</th>
                  <th className="px-6 py-5 font-medium">Booking/Source</th>
                  <th className="px-6 py-5 font-medium">Status</th>
                  <th className="px-6 py-5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="h-[300px] text-center align-middle">
                      <div className="flex h-full min-h-[300px] items-center justify-center">
                        <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                      No credit transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((entry) => {
                    const isDebit = entry.direction === "debit" || entry.entry_type === "credit_used";
                    const DirectionIcon = isDebit ? ArrowUpRight : ArrowDownLeft;
                    return (
                      <tr
                        key={entry.account_credit_ledger_id}
                        className={`border-t ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F1E7D9] hover:bg-[#FFFDF9]"}`}
                      >
                        <td className="px-6 py-5 text-[15px]">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              isDebit
                                ? "bg-[#FF7A7A]/15 text-[#FF7A7A]"
                                : "bg-[#3CB371]/15 text-[#3CB371]"
                            }`}>
                              <DirectionIcon size={15} />
                            </span>
                            <span className={`text-xs font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                              {isDebit ? "Outgoing" : "Incoming"}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 text-[15px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td className={`px-6 py-5 text-[15px] capitalize ${isDark ? "text-white/90" : "text-[#171717]"}`}>
                          {transactionLabel(entry.entry_type)}
                        </td>
                        <td className={`px-6 py-5 text-[15px] ${isDark ? "text-[#D1D1D1]" : "text-[#3B3B3B]"}`}>
                          {entry.booking_name || (entry.booking_id ? `Booking #${entry.booking_id}` : entry.source || "-")}
                        </td>
                        <td className="px-6 py-5 text-[15px]">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            entry.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : entry.status === "rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-orange-500/10 text-orange-400"
                          }`}>
                            {entry.status || "pending"}
                          </span>
                        </td>
                        <td className={`px-6 py-5 text-[15px] text-right font-semibold ${isDebit ? "text-[#FF7A7A]" : "text-[#3CB371]"}`}>
                          {isDebit ? "-" : "+"}
                          {formatCurrency(entry.amount || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 lg:hidden">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                No credit transactions found.
              </div>
            ) : (
              filteredTransactions.map((entry) => {
                const isDebit = entry.direction === "debit" || entry.entry_type === "credit_used";
                const DirectionIcon = isDebit ? ArrowUpRight : ArrowDownLeft;
                return (
                  <article
                    key={entry.account_credit_ledger_id}
                    className={`rounded-[20px] border p-4 ${
                      isDark ? "border-[#252525] bg-[#111111]" : "border-[#EFE4D6] bg-white"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isDebit
                            ? "bg-[#FF7A7A]/15 text-[#FF7A7A]"
                            : "bg-[#3CB371]/15 text-[#3CB371]"
                        }`}>
                          <DirectionIcon size={15} />
                        </span>
                        <p className={`text-xs font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                          {isDebit ? "Outgoing" : "Incoming"}
                        </p>
                      </div>
                      <p className={`font-semibold ${isDebit ? "text-[#FF7A7A]" : "text-[#3CB371]"}`}>
                        {isDebit ? "-" : "+"}
                        {formatCurrency(entry.amount || 0)}
                      </p>
                    </div>
                    <p className={`font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transactionLabel(entry.entry_type)}
                    </p>
                    <p className={`text-sm ${isDark ? "text-[#9F9F9F]" : "text-[#6F6F6F]"}`}>
                      {entry.booking_name || (entry.booking_id ? `Booking #${entry.booking_id}` : entry.source || "-")}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className={`text-xs ${isDark ? "text-white/50" : "text-[#777]"}`}>
                        {formatDate(entry.created_at)}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        entry.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : entry.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}>
                        {entry.status || "pending"}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </>
  );
}
