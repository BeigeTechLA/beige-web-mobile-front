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

export type TransactionStatus = "Paid" | "Pending" | "Failed";
type TransactionView = "Transactions ID" | "Shoot ID";

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

interface TransactionsTableProps {
  rows: TransactionRow[];
  loading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  monthValue: string;
  onMonthChange: (value: string) => void;
  typeValue: string;
  onTypeChange: (value: string) => void;
  viewValue: TransactionView;
  onViewChange: (value: TransactionView) => void;
  itemsPerPage?: number;
}

export const transactionStatusPillStyles: Record<TransactionStatus, string> = {
  Paid: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
  Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
  Failed: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
};

const TransactionStatusBadge = ({
  status,
}: {
  status: TransactionStatus;
}) => {
  return (
    <span
      className={`inline-flex rounded-full border px-6 py-2 text-sm font-semibold ${transactionStatusPillStyles[status]}`}
    >
      {status}
    </span>
  );
};

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "..."> => {
  const range: Array<number | "..."> = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;

  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i);
    } else if (i === left - 1 || i === right) {
      range.push("...");
    }
  }

  return range.filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...");
};

export default function TransactionsTable({
  rows,
  loading = false,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  monthValue,
  onMonthChange,
  typeValue,
  onTypeChange,
  viewValue,
  onViewChange,
  itemsPerPage = 7,
}: TransactionsTableProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(rows[0]?.id ?? null);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, searchValue, statusValue, monthValue, typeValue, viewValue]);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleRows = useMemo(
    () => rows.slice(startIndex, startIndex + itemsPerPage),
    [rows, startIndex, itemsPerPage]
  );
  const paginationItems = buildPaginationItems(safePage, totalPages);

  const primaryIdLabel = viewValue === "Transactions ID" ? "Transaction ID" : "Shoot ID";
  const isShootIdView = viewValue === "Shoot ID";

  const toggleRow = (id: string) => {
    setExpandedRowId((current) => (current === id ? null : id));
  };

  const renderDetailPanel = (row: TransactionRow) => (
    <tr key={`${row.id}-details`}>
      <td colSpan={isShootIdView ? 8 : 7} className="px-5 pb-6 pt-0">
        <div className={`rounded-b-2xl px-4 py-5 lg:px-6 ${isDark ? "bg-[#0D0D0D]" : "bg-[#FAFAFA]"}`}>
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText size={16} className={isDark ? "text-[#D3B98A]" : "text-[#8B6B36]"} />
            <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
              Invoices for SH-001
            </p>
          </div>

          <div className="space-y-3">
            {(row.invoiceDetails || []).map((invoice) => {
              const isCardPayment = invoice.method.toLowerCase().includes("card");

              return (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-4 ${
                    isDark ? "border-[#222222] bg-[#171717]" : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="min-w-0">
                      <p className={`text-[22px] leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {invoice.id}
                      </p>
                      <p className={`mt-2 text-sm ${isDark ? "text-white/45" : "text-[#777]"}`}>
                        {invoice.date}
                      </p>
                    </div>

                    <div className={`hidden h-10 w-px lg:block ${isDark ? "bg-[#2A2A2A]" : "bg-[#E5E5E5]"}`} />

                    <div className="flex items-center gap-2">
                      {isCardPayment ? (
                        <CreditCard size={14} className={isDark ? "text-white/45" : "text-[#777]"} />
                      ) : (
                        <Landmark size={14} className={isDark ? "text-white/45" : "text-[#777]"} />
                      )}
                      <span className={`text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>
                        {invoice.method}
                      </span>
                    </div>

                    <TransactionStatusBadge status={invoice.status} />
                  </div>

                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-[28px] leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {invoice.amount}
                      </p>
                      <p className={`mt-2 text-xs ${isDark ? "text-white/35" : "text-[#8A8A8A]"}`}>
                        {invoice.feeNote}
                      </p>
                    </div>
                    <ChevronRight size={18} className={isDark ? "text-white/45" : "text-[#676767]"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-colors ${
          isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"
        }`}
      >
        {(["Transactions ID", "Shoot ID"] as TransactionView[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onViewChange(option)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              viewValue === option
                ? "bg-[#E5D5B8] text-black shadow-lg"
                : isDark
                ? "text-[#777] hover:text-white"
                : "text-[#666] hover:text-black"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <section
        className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${
          isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"
        }`}
      >
        <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <h3 className={isDark ? "text-white text-[18px]" : "text-[#323232] text-[18px]"}>
                {primaryIdLabel}
              </h3>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={statusValue} onValueChange={onStatusChange}>
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

              <Select value={monthValue} onValueChange={onMonthChange}>
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

              <Select value={typeValue} onValueChange={onTypeChange}>
                <SelectTrigger className={`w-[90px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search by Transaction ID, Client Name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
                isDark
                  ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                  : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
            />
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-base font-medium border-b ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                <th className="py-5 px-6 font-medium">{primaryIdLabel}</th>
                <th className="py-5 px-6 font-medium">Client Name</th>
                <th className="py-5 px-6 font-medium">Shoot Type</th>
                <th className="py-5 px-6 font-medium">Total Amount</th>
                {isShootIdView && <th className="py-5 px-6 font-medium">Invoices</th>}
                <th className="py-5 px-6 font-medium">Payment Method</th>
                <th className="py-5 px-6 font-medium">Status</th>
                <th className="py-5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isShootIdView ? 8 : 7} className="h-[360px] text-center align-middle">
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
                      onClick={() => isShootIdView && toggleRow(row.id)}
                      className={`border-b transition-colors ${isShootIdView ? "cursor-pointer" : ""} ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                    >
                      <td className={`py-6 px-6 whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {isShootIdView ? (
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                            />
                            <span>{row.shootId}</span>
                          </div>
                        ) : (
                          row.transactionId
                        )}
                      </td>
                      <td className="py-6 px-6 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-black font-medium text-[18px]"
                            style={{ backgroundColor: row.avatarColor }}
                          >
                            {row.avatarImage ? (
                              <Image src={row.avatarImage} alt={row.clientName} fill className="object-cover" />
                            ) : (
                              row.initials
                            )}
                          </div>
                          <div>
                            <p className={`max-w-[170px] truncate font-medium text-[18px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                              {row.clientName}
                            </p>
                            <p className={`${isDark ? "text-white/40" : "text-[#666]"} text-sm mt-1`}>
                              {row.date}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`py-6 px-6 min-w-[190px] whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.shootType}
                      </td>
                      <td className={`py-6 px-6 whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.totalAmount}
                      </td>
                      {isShootIdView && (
                        <td className="py-6 px-6">
                          <span
                            className={`inline-flex min-w-[108px] items-center justify-center rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${
                              isDark
                                ? "bg-[#312D2D] text-[#D3B98A]"
                                : "bg-[#F2EEE7] text-[#8B6B36]"
                            }`}
                          >
                            {String((row.invoiceIds || []).length).padStart(2, "0")} Invoices
                          </span>
                        </td>
                      )}
                      <td className={`py-6 px-6 min-w-[150px] whitespace-nowrap text-[18px] ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.paymentMethod}
                      </td>
                      <td className="py-6 px-6">
                        <TransactionStatusBadge status={row.status} />
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="flex min-h-[44px] items-center justify-end">
                          <button onClick={(e) => e.stopPropagation()} className={isDark ? "text-white/80" : "text-[#171717]"}>
                            <MoreVertical size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>,
                    ...(isShootIdView && isExpanded ? [renderDetailPanel(row)] : []),
                  ];
                })
              ) : (
                <tr>
                  <td colSpan={isShootIdView ? 8 : 7} className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
            </div>
          ) : visibleRows.length > 0 ? (
            visibleRows.map((row) => (
              <article
                key={row.id}
                className={`rounded-[20px] border p-4 ${
                  isDark ? "border-[#252525] bg-[#111111]" : "border-[#EFE4D6] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  {isShootIdView ? (
                    <button type="button" onClick={() => toggleRow(row.id)} className="flex items-center gap-3">
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${expandedRowId === row.id ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                      />
                      <span className={isDark ? "text-white" : "text-[#171717]"}>{row.shootId}</span>
                    </button>
                  ) : (
                    <span className={isDark ? "text-white" : "text-[#171717]"}>
                      {row.transactionId}
                    </span>
                  )}
                  <TransactionStatusBadge status={row.status} />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="relative w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-black font-medium text-[18px]"
                    style={{ backgroundColor: row.avatarColor }}
                  >
                    {row.avatarImage ? (
                      <Image src={row.avatarImage} alt={row.clientName} fill className="object-cover" />
                    ) : (
                      row.initials
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.clientName}</p>
                    <p className={`${isDark ? "text-white/40" : "text-[#666]"} text-sm`}>{row.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#666]"}>Shoot Type</p>
                    <p className={isDark ? "text-white" : "text-[#171717]"}>{row.shootType}</p>
                  </div>
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#666]"}>Amount</p>
                    <p className={isDark ? "text-white" : "text-[#171717]"}>{row.totalAmount}</p>
                  </div>
                  <div>
                    <p className={isDark ? "text-white/40" : "text-[#666]"}>Method</p>
                    <p className={isDark ? "text-white" : "text-[#171717]"}>{row.paymentMethod}</p>
                  </div>
                  {isShootIdView && (
                    <div className="col-span-2">
                      <p className={isDark ? "text-white/40" : "text-[#666]"}>Invoices</p>
                      <p className={isDark ? "text-white" : "text-[#171717]"}>
                        {String((row.invoiceIds || []).length).padStart(2, "0")} Invoices
                      </p>
                    </div>
                  )}
                </div>

                {isShootIdView && expandedRowId === row.id && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? "border-[#2A2A2A]" : "border-[#E5E5E5]"}`}>
                    <div className="space-y-2 text-sm">
                      {(row.invoiceDetails || []).slice(0, 2).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between gap-3">
                          <span className={isDark ? "text-white/75" : "text-[#171717]"}>
                            {invoice.id}
                          </span>
                          <TransactionStatusBadge status={invoice.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className={`py-10 text-center ${isDark ? "text-white/50" : "text-[#777]"}`}>
              No transactions found.
            </div>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
              Page {startIndex + 1} to {Math.min(startIndex + itemsPerPage, rows.length)}
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
    </div>
  );
}
