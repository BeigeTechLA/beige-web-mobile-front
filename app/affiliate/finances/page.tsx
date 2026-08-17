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
  ChevronDown,
  Coins,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  credit_type?: string | null;
  title?: string | null;
  transaction_type?: string | null;
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
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

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

  const transactionLabel = (entry: ClientCreditHistoryEntry) => {
    if (entry.credit_type === "signup_bonus") return "Signup Credit";
    if (entry.title) return entry.title;

    const labelMap: Record<string, string> = {
      credit_created: "Credit Added",
      credit_used: "Credit Used",
      credit_reversed: "Credit Reversed",
    };
    const entryType = entry.entry_type;
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

  const toggleExpand = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const metrics = [
    {
      id: "available",
      label: "Available Credits",
      value: formatCurrency(creditSummary?.available_credit_amount || 0),
      helperText: "Admin approved credits",
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
      helperText: "Approved + Used credits",
      helperTooltip: "Excluding expired credits. Only approved and used (non-expired) credits are included in this total.",
      icon: Wallet,
      iconWrapClass: "bg-[#141A1A] text-[#79C8BD]",
    },
  ];

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={null}
      />

      <div
        className="space-y-5 overflow-hidden p-4 lg:space-y-8 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-black"}`}>
              Credit Points
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Track credit points usage across shoots and invoices
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <section className={`rounded-[24px] border p-5 lg:p-6 transition-colors ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h2 className={`text-sm lg:text-lg font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
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

          <div className={`grid grid-cols-1 lg:grid-cols-3 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const isActive = activeMetricId === metric.id;

              return (
                <div
                  key={metric.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMetricId(metric.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveMetricId(metric.id);
                    }
                  }}
                  className={`relative group cursor-pointer rounded-lg p-4 border transition-all duration-200 ${isActive
                    ? 'bg-[#ECD7B4] text-[#171717] border-transparent'
                    : (isDark ? 'bg-[#101010] text-white border-transparent hover:border-white/30' : 'bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]')
                    }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <p className={`text-sm font-medium ${isActive ? "text-[#171717]" : isDark ? "text-white/90" : "text-[#171717]"}`}>
                      {metric.label}
                    </p>
                    <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : (isDark ? 'bg-[#2C2C2C] text-white/60' : 'bg-white text-[#E8D1AB]')}`}>
                      <Icon size={20} />
                    </div>
                  </div>

                  <p className={`text-[26px] font-bold mb-2 h-8 w-12 animate-pulse rounded ${isActive ? "text-[#171717]" : isDark ? "text-white" : "text-[#171717]"}`}>
                    {metric.value}
                  </p>
                  <div className="text-xs flex gap-1 items-center">
                    <p className={`font-bold ${isActive ? "text-[#171717]/75" : isDark ? "text-[#A5A5A5]" : "text-[#6F6F6F]"}`}>
                      {metric.helperText}
                    </p>
                    {metric.helperTooltip ? (
                      <InfoTooltip
                        message={metric.helperTooltip}
                        isDark={!isActive && isDark}
                        align="right"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"}`}>
          <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h2 className={`text-sm lg:text-lg font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>
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

          {/*  MOBILE VIEW (Card Accordion)  */}
          <div className="lg:hidden flex-grow">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#E8D1AB]" />
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
                {/* Header Sticky Strip */}
                <div className={`flex justify-between text-sm font-medium p-4 rounded-b-2xl border-b transition-colors duration-200 ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-black bg-[#FFFCF6] border-b-black/10"}`}>
                  <span>Transaction Description</span>
                  <span>Amount</span>
                </div>

                {/* Row List Iteration Grid */}
                {filteredTransactions.map((entry) => {
                  const isDebit = entry.direction === "debit" || entry.entry_type === "credit_used";
                  const DirectionIcon = isDebit ? ArrowUpRight : ArrowDownLeft;
                  const isRowExpanded = expandedId === entry.account_credit_ledger_id;

                  console.log(entry);
                  return (
                    <div
                      key={entry.account_credit_ledger_id}
                      className={`p-4 ${(isRowExpanded ? (isDark ? "bg-white/5" : "bg-black/5") : "")}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Expand Toggle Trigger Arrow */}
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(e, entry?.account_credit_ledger_id || "")}
                            className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-200 shrink-0 ${isRowExpanded
                              ? "rotate-180 border-[#E8D1AB] text-[#E8D1AB]"
                              : isDark ? "border-white/20 text-white/40" : "border-black/30 text-black/40"
                              }`}
                          >
                            <ChevronDown size={16} />
                          </button>

                          {/* Direction Flow Indicator Avatar Icon */}
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-colors ${isDebit
                            ? "bg-[#FF7A7A]/15 text-[#FF7A7A]"
                            : "bg-[#3CB371]/15 text-[#3CB371]"
                            }`}>
                            <DirectionIcon size={18} />
                          </div>

                          {/* Title and Short Description Text Strings */}
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#323232]"}`}>
                              {transactionLabel(entry)}
                            </p>
                            {/* <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-black/40"}`}>
                              {entry.booking_name || (entry.booking_id ? `Booking #${entry.booking_id}` : entry.source || "-")}
                            </p> */}
                          </div>
                        </div>

                        {/* Running Ledger Price Label */}
                        <div className="text-right shrink-0">
                          <p className={`font-semibold ${isDebit ? "text-[#FF7A7A]" : "text-[#3CB371]"}`}>
                            {isDebit ? "-" : "+"}
                            {formatCurrency(entry.amount || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Expandable Meta Panel Drawer Content block */}
                      {isRowExpanded && (
                        <div className="mt-4 grid grid-cols-2 gap-y-4 px-2 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                          <div>
                            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>
                              Booking Name
                            </p>
                            <p className={`text-xs wrap-normal ${isDark ? "text-white/" : "text-[#323232]"}`}>
                              {entry.booking_name || (entry.booking_id ? `Booking #${entry.booking_id}` : entry.source || "-")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>
                              Direction
                            </p>
                            <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>
                              {isDebit ? "Outgoing" : "Incoming"}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>
                              Date
                            </p>
                            <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>
                              {formatDate(entry.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>
                              Status
                            </p>
                            <div className="flex justify-end mt-0.5">
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${entry.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : entry.status === "rejected"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-orange-500/10 text-orange-400"
                                }`}>
                                {entry.status || "pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className={`text-center py-10 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                No credit transactions found.
              </div>
            )}
          </div>

          {/*  DESKTOP VIEW (Standard Table)  */}
          <div className="hidden lg:block w-full overflow-x-auto flex-grow">
            <table className="w-full text-left">
              <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
                <tr className={`text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                  <th className="px-6 py-5 font-medium">Flow</th>
                  <th className="px-6 py-5 font-medium">Date</th>
                  <th className="px-6 py-5 font-medium">Transaction</th>
                  <th className="px-6 py-5 font-medium">Booking/Source</th>
                  <th className="px-6 py-5 font-medium">Status</th>
                  <th className="px-6 py-5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="p-5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
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
                        className={`${isDark ? " hover:bg-white/[0.02]" : " hover:bg-black/[0.03]"}`}
                      >
                        <td className="px-6 py-5 text-[15px]">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isDebit
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
                          {transactionLabel(entry)}
                        </td>
                        <td className={`px-6 py-5 text-[15px] ${isDark ? "text-[#D1D1D1]" : "text-[#3B3B3B]"}`}>
                          {entry.booking_name || (entry.booking_id ? `Booking #${entry.booking_id}` : entry.source || "-")}
                        </td>
                        <td className="px-6 py-5 text-[15px]">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${entry.status === "approved"
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
        </section>
      </div>
    </>
  );
}
