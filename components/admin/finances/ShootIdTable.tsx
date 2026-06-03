"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  MoreVertical,
  ReceiptText,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api";

export type TransactionStatus = "Paid" | "Pending" | "Failed";

export type TransactionRow = {
  id: string;
  transactionId: string;
  shootId: string;
  clientName: string;
  date: string;
  shootType: string;
  totalAmount: string;
  paymentMethod: string;
  status: TransactionStatus;
  initials: string;
  avatarColor: string;
  avatarImage?: string;
  invoiceIds?: string[];
  invoiceDetails?: {
    id: string;
    date: string;
    method: string;
    status: TransactionStatus;
    amount: string;
    feeNote: string;
  }[];
};

type FinanceTransactionItem = {
  id?: string | number;
  transaction_id?: string | number;
  transactionId?: string | number;
  transaction_code?: string | null;
  payment_id?: string | number;
  shoot_id?: string | number;
  booking_id?: string | number;
  project_id?: string | number;
  finance_transaction_id?: string | number;
  client_name?: string | null;
  creator_name?: string | null;
  shoot_type?: string | null;
  service_type?: string | null;
  transaction_type?: string | null;
  source?: string | null;
  total_amount?: string | number | null;
  gross_amount?: string | number | null;
  net_amount?: string | number | null;
  payment_method?: string | null;
  status?: string | null;
  transaction_date?: string | null;
  created_at?: string | null;
  avatar_color?: string | null;
  avatar_image?: string | null;
  client_image?: string | null;
  invoice_ids?: Array<string | number> | null;
  invoice_details?: unknown;
  invoiceDetails?: unknown;
  invoices?: unknown;
  booking?: {
    stream_project_booking_id?: string | number | null;
    project_name?: string | null;
    shoot_type?: string | null;
    event_type?: string | null;
    event_date?: string | null;
  } | null;
  client?: {
    name?: string | null;
  } | null;
  [key: string]: unknown;
};

type Props = {
  selectedDate?: Date | null;
};

const transactionStatusPillStyles: Record<TransactionStatus, string> = {
  Paid: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
  Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
  Failed: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const range: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) range.push(i);
    else if (i === left - 1 || i === right) range.push("...");
  }
  return range.filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...");
};

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const safeCurrency = (value?: string | number | null) => {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(numeric) ? numeric : 0
  );
};

const normalizeStatus = (status?: string | null): TransactionStatus => {
  const value = (status || "").trim().toLowerCase();
  if (["paid", "completed", "success", "successful", "processed"].includes(value)) return "Paid";
  if (["failed", "rejected", "declined", "cancelled", "canceled", "error"].includes(value)) return "Failed";
  return "Pending";
};

const normalizePaymentMethod = (method?: string | null, fallback?: string | null) => {
  const value = (method || fallback || "").trim();
  const normalized = value.toLowerCase();
  if (!value) return "Unknown";
  if (normalized.includes("account_credit") || normalized.includes("account credit")) return "Account Credit";
  if (normalized.includes("bank")) return "Bank Transfer";
  if (normalized.includes("stripe")) return "Stripe";
  if (normalized.includes("card")) return "Card";
  return value;
};

const buildInitials = (name?: string | null) =>
  (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const getArrayFromPayload = (payload: unknown): unknown[] => {
  if (!payload || typeof payload !== "object") return [];
  const container = payload as { data?: unknown; rows?: unknown[]; items?: unknown[]; results?: unknown[]; list?: unknown[] };
  const nested = container.data;
  const nestedContainer = nested && typeof nested === "object" ? (nested as Record<string, unknown>) : {};
  const candidates = [
    container.rows,
    container.items,
    container.results,
    container.list,
    Array.isArray(nested) ? nested : undefined,
    Array.isArray(nestedContainer.rows) ? nestedContainer.rows : undefined,
    Array.isArray(nestedContainer.items) ? nestedContainer.items : undefined,
    Array.isArray(nestedContainer.results) ? nestedContainer.results : undefined,
    Array.isArray(nestedContainer.list) ? nestedContainer.list : undefined,
  ];
  return (candidates.find(Array.isArray) as unknown[]) || [];
};

const formatShootType = (shootType?: string | null, eventType?: string | null) => {
  const base = (shootType || "Shoot")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  const extra = (eventType || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(", ");
  return extra ? `${base} • ${extra}` : base;
};

const mapShootItem = (item: FinanceTransactionItem, index: number): TransactionRow => {
  const clientName = item.client?.name || item.client_name || item.creator_name || "Unknown";
  const bookingId =
    item.booking?.stream_project_booking_id ??
    item.booking_id ??
    item.id ??
    item.project_id ??
    `shoot-${index + 1}`;
  const transactionIdValue =
    item.transaction_code ??
    item.transactionId ??
    item.transaction_id ??
    item.payment_id ??
    item.finance_transaction_id ??
    `TXN-${index + 1}`;

  return {
    id: String(bookingId),
    transactionId: String(transactionIdValue),
    shootId: String(bookingId).startsWith("#") ? String(bookingId) : `#${bookingId}`,
    clientName,
    date: formatDate(item.booking?.event_date || item.transaction_date || item.created_at),
    shootType: formatShootType(item.booking?.shoot_type || item.service_type || item.transaction_type, item.booking?.event_type),
    totalAmount: safeCurrency(item.net_amount ?? item.gross_amount ?? item.total_amount),
    paymentMethod: normalizePaymentMethod(item.payment_method, item.source),
    status: normalizeStatus(item.status),
    initials: buildInitials(clientName),
    avatarColor: item.avatar_color || "#E2E2E2",
    avatarImage: item.avatar_image || item.client_image || undefined,
    invoiceIds: Array.isArray(item.invoice_ids) ? item.invoice_ids.map((invoice) => String(invoice)) : [],
    invoiceDetails: [],
  };
};

const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => (
  <span className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold ${transactionStatusPillStyles[status]}`}>
    {status}
  </span>
);

export default function ShootIdTable({ selectedDate }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    const date_on = selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined;

    const load = async () => {
      setLoading(true);
      try {
        const response = await adminApi.getFinanceShoots(date_on ? { date_on } : {});
        if (response?.success === false) throw new Error(response?.error || "Failed to fetch shoots");
        const items = getArrayFromPayload(response);
        setRows(items.map((item, index) => mapShootItem(item as FinanceTransactionItem, index)));
      } catch (error) {
        console.error("Failed to load shoot data:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, searchQuery, statusFilter, monthFilter, typeFilter]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch =
          row.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.shootId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || row.status === statusFilter;
        const matchesType = typeFilter === "All" || row.paymentMethod === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      }),
    [rows, searchQuery, statusFilter, typeFilter]
  );

  const itemsPerPage = 7;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  return (
    <section className={`w-full rounded-2xl border overflow-hidden ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}>
      <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-6 bg-[#E5D5B8]" />
            <h3 className={isDark ? "text-white text-[18px]" : "text-[#323232] text-[18px]"}>Shoot ID</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="Month">Month</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="This Quarter">This Quarter</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={`w-[90px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Stripe">Stripe</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Account Credit">Account Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder="Search by Shoot ID, Client Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-base font-medium border-b ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
              <th className="py-5 px-6 font-medium">Shoot ID</th>
              <th className="py-5 px-6 font-medium">Client Name</th>
              <th className="py-5 px-6 font-medium">Shoot Type</th>
              <th className="py-5 px-6 font-medium">Total Amount</th>
              <th className="py-5 px-6 font-medium">Invoices</th>
              <th className="py-5 px-6 font-medium">Payment Method</th>
              <th className="py-5 px-6 font-medium">Status</th>
              <th className="py-5 px-6 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="h-[360px] text-center align-middle">
                  <div className="flex h-full min-h-[360px] items-center justify-center">
                    <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                  </div>
                </td>
              </tr>
            ) : visibleRows.length > 0 ? (
              visibleRows.flatMap((row) => {
                const isExpanded = expandedRowId === row.id;
                return [
                  <tr
                    key={row.id}
                    onClick={() => setExpandedRowId((current) => (current === row.id ? null : row.id))}
                    className={`border-b cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                  >
                    <td className={`py-6 px-6 whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                      <div className="flex items-center gap-3">
                        <ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`} />
                        <span>{row.shootId}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-black font-medium text-[18px]" style={{ backgroundColor: row.avatarColor }}>
                          {row.avatarImage ? (
                            <Image src={row.avatarImage} alt={row.clientName} fill className="object-cover" />
                          ) : (
                            row.initials
                          )}
                        </div>
                        <div>
                          <p className={`max-w-[170px] truncate font-medium text-[18px] ${isDark ? "text-white" : "text-[#171717]"}`}>{row.clientName}</p>
                          <p className={`${isDark ? "text-white/40" : "text-[#666]"} text-sm mt-1`}>{row.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-6 px-6 min-w-[190px] whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.shootType}</td>
                    <td className={`py-6 px-6 whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.totalAmount}</td>
                    <td className="py-6 px-6">
                      <span className={`inline-flex min-w-[108px] items-center justify-center rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${isDark ? "bg-[#312D2D] text-[#D3B98A]" : "bg-[#F2EEE7] text-[#8B6B36]"}`}>
                        {String((row.invoiceIds || []).length).padStart(2, "0")} Invoices
                      </span>
                    </td>
                    <td className={`py-6 px-6 min-w-[150px] whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{row.paymentMethod}</td>
                    <td className="py-6 px-6">
                      <TransactionStatusBadge status={row.status} />
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="flex min-h-[44px] items-center justify-end">
                        <button className={isDark ? "text-white/80" : "text-[#171717]"}>
                          <MoreVertical size={22} />
                        </button>
                      </div>
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${row.id}-details`}>
                      <td colSpan={8} className="px-5 pb-6 pt-0">
                        <div className={`rounded-b-2xl px-4 py-5 lg:px-6 ${isDark ? "bg-[#0D0D0D]" : "bg-[#FAFAFA]"}`}>
                          <div className="mb-4 flex items-center gap-2">
                            <ReceiptText size={16} className={isDark ? "text-[#D3B98A]" : "text-[#8B6B36]"} />
                            <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>Invoices for {row.shootId}</p>
                          </div>
                          <div className="space-y-3">
                            {(row.invoiceDetails || []).length > 0 ? (
                              (row.invoiceDetails || []).map((invoice) => {
                                const isCardPayment = invoice.method.toLowerCase().includes("card");
                                return (
                                  <div
                                    key={invoice.id}
                                    className={`flex items-center justify-between rounded-xl border px-4 py-4 ${isDark ? "border-[#222222] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-4">
                                      <div className="min-w-0">
                                        <p className={`text-[22px] leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{invoice.id}</p>
                                        <p className={`mt-2 text-sm ${isDark ? "text-white/45" : "text-[#777]"}`}>{invoice.date}</p>
                                      </div>
                                      <div className={`hidden h-10 w-px lg:block ${isDark ? "bg-[#2A2A2A]" : "bg-[#E5E5E5]"}`} />
                                      <div className="flex items-center gap-2">
                                        {isCardPayment ? (
                                          <CreditCard size={14} className={isDark ? "text-white/45" : "text-[#777]"} />
                                        ) : (
                                          <Landmark size={14} className={isDark ? "text-white/45" : "text-[#777]"} />
                                        )}
                                        <span className={`text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>{invoice.method}</span>
                                      </div>
                                      <TransactionStatusBadge status={invoice.status} />
                                    </div>
                                    <div className="ml-4 flex items-center gap-4">
                                      <div className="text-right">
                                        <p className={`text-[28px] leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{invoice.amount}</p>
                                        <p className={`mt-2 text-xs ${isDark ? "text-white/35" : "text-[#8A8A8A]"}`}>{invoice.feeNote}</p>
                                      </div>
                                      <ChevronRight size={18} className={isDark ? "text-white/45" : "text-[#676767]"} />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className={`rounded-xl border px-4 py-4 text-sm ${isDark ? "border-[#222222] bg-[#171717] text-white/60" : "border-[#E5E5E5] bg-white text-[#666]"}`}>
                                No invoice details available for this shoot.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ];
              })
            ) : (
              <tr>
                <td colSpan={8} className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredRows.length > 0 && (
        <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            Page {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRows.length)}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span key={`dots-${index}`} className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      safePage === page
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                        ? "text-white/60 hover:bg-white/5"
                        : "text-[#666] hover:bg-zinc-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
