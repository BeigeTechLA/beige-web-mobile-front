"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  MoreVertical,
  ReceiptText,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TransactionStatus = "Paid" | "Pending" | "Failed";
type TransactionView = "Transactions ID" | "Shoot ID";

export type TransactionDetailRow = {
  id: string;
  transactionId: string;
  date: string;
  method: string;
  status: TransactionStatus;
  amount: string;
  feeNote: string;
};

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
  transactionCount?: number;
  transactionDetails?: TransactionDetailRow[];
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
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  action?: (row: TransactionRow, event?: React.MouseEvent) => void;

}

export const transactionStatusPillStyles: Record<TransactionStatus, string> = {
  Paid: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
  Pending: "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]/20",
  Failed: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
};

export const TransactionStatusBadge = ({
  status,
  mobile,
}: {
  status: TransactionStatus;
  mobile?: boolean;
}) => {
  const padding = mobile ? "px-4 py-1 text-xs" : "px-5 py-2 text-sm";
  return (
    <span className={`${padding} rounded-full font-medium border ${transactionStatusPillStyles[status]}`}>
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
  currentPage,
  totalPages: controlledTotalPages,
  totalItems,
  onPageChange,
  action
}: TransactionsTableProps) {
  const { isDark } = useResolvedTheme();
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(rows[0]?.id ?? null);
  const isControlledPagination = typeof currentPage === "number" && typeof onPageChange === "function";
  const activePage = isControlledPagination ? Math.max(currentPage || 1, 1) : localCurrentPage;

  useEffect(() => {
    if (!isControlledPagination) {
      setLocalCurrentPage(1);
    }
  }, [rows, searchValue, statusValue, monthValue, typeValue, viewValue, isControlledPagination]);

  useEffect(() => {
    setExpandedRowId(rows[0]?.id ?? null);
  }, [rows, viewValue]);

  const totalPages = Math.max(1, controlledTotalPages || Math.ceil(rows.length / itemsPerPage));
  const safePage = Math.min(activePage, totalPages);
  const startIndex = isControlledPagination ? 0 : (safePage - 1) * itemsPerPage;
  const visibleRows = useMemo(
    () => isControlledPagination ? rows : rows.slice(startIndex, startIndex + itemsPerPage),
    [rows, startIndex, itemsPerPage, isControlledPagination]
  );
  const paginationItems = buildPaginationItems(safePage, totalPages);
  const displayTotal = totalItems ?? rows.length;
  const displayStart = displayTotal === 0 ? 0 : isControlledPagination ? ((safePage - 1) * itemsPerPage) + 1 : startIndex + 1;
  const displayEnd = isControlledPagination
    ? Math.min((safePage - 1) * itemsPerPage + rows.length, displayTotal)
    : Math.min(startIndex + itemsPerPage, rows.length);

  const primaryIdLabel = viewValue === "Transactions ID" ? "Transaction ID" : "Shoot ID";
  const isShootIdView = viewValue === "Shoot ID";

  const toggleRow = (id: string) => {
    setExpandedRowId((current) => (current === id ? null : id));
  };

  const DetailPanelContent = ({ row }: { row: TransactionRow }) => (
    <div className={`p-5 lg:px-5 lg:py-6 ${isDark ? "bg-[#0A0A0A]" : "bg-[#FAFAFA]"}`}>
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText size={16} className={isDark ? "text-[#D3B98A]" : "text-[#8B6B36]"} />
        <p className={`text-base font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
          Transactions for {row.shootId || "Shoot"}
        </p>
      </div>

      <div className="space-y-3">
        {(row.transactionDetails || []).length > 0 ? (row.transactionDetails || []).map((transaction) => {
          const isCardPayment = transaction.method.toLowerCase().includes("card") || transaction.method.toLowerCase().includes("stripe");

          return (
            <div key={transaction.id}>
              <div

                className={`hidden lg:flex items-center justify-between rounded-lg border p-4 ${isDark ? "border-[#262626] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="min-w-0">
                    <p className={`text-sm lg:text-base leading-none font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transaction.transactionId}
                    </p>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#777]"}`}>
                      {transaction.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCardPayment ? (
                      <CreditCard size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                    ) : (
                      <Landmark size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                    )}
                    <span className={`text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#666]"}`}>
                      {transaction.method}
                    </span>
                  </div>

                  <TransactionStatusBadge status={transaction.status} mobile={true} />
                </div>

                <div className="ml-4 flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm lg:text-lg leading-none font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transaction.amount}
                    </p>
                    <p className={`mt-1 text-[10px] lg:text-xs ${isDark ? "text-[#A0A0A0]" : "text-[#8A8A8A]"}`}>
                      {transaction.feeNote}
                    </p>
                  </div>
                  <ChevronRight size={20} className={isDark ? "text-[#A0A0A0]" : "text-[#676767]"} />
                </div>
              </div>
              <div
                className={`lg:hidden rounded-lg border ${isDark ? "border-[#262626] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
              >
                <div className={`p-4 flex justify-between items-start border-b ${isDark ? "border-[#3D3D3D]" : "border-white/30"}`}>
                  <div className="min-w-0">
                    <p className={`text-sm lg:text-base leading-none font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transaction.transactionId}
                    </p>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#777]"}`}>
                      {transaction.date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm lg:text-lg leading-none font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {transaction.amount}
                    </p>
                    <p className={`mt-1 text-[10px] lg:text-xs ${isDark ? "text-[#A0A0A0]" : "text-[#8A8A8A]"}`}>
                      {transaction.feeNote}
                    </p>
                  </div>
                </div>
                <div className={`p-4 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {isCardPayment ? (
                        <CreditCard size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                      ) : (
                        <Landmark size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                      )}
                      <span className={`text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#666]"}`}>
                        {transaction.method}
                      </span>
                    </div>

                    <TransactionStatusBadge status={transaction.status} mobile={true} />
                  </div>
                  <ChevronRight size={20} className={isDark ? "text-[#A0A0A0]" : "text-[#676767]"} />
                </div>
              </div>
            </div>
          );
        }) : (
          <div className={`rounded-lg border p-4 text-sm ${isDark ? "border-[#262626] bg-[#141414] text-white/50" : "border-[#E5E5E5] bg-white text-[#777]"}`}>
            No transactions found for this shoot.
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailPanel = (row: TransactionRow) => (
    <tr key={`${row.id}-details`}>
      <td colSpan={isShootIdView ? 8 : 7}>
        <DetailPanelContent row={row} />
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"}`}
      >
        {(["Transactions ID", "Shoot ID"] as TransactionView[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onViewChange(option)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewValue === option
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

      <section className={`w-full rounded-2xl border overflow-visible transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`}>
        <div className={`flex flex-col gap-4 p-5 lg:p-6 border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-6 bg-[#E5D5B8]" />
              <h3 className={isDark ? "text-white text-[18px]" : "text-[#323232] text-[18px]"}>
                {primaryIdLabel}
              </h3>
            </div>

            <div className="flex gap-2">
              <Select value={statusValue} onValueChange={onStatusChange}>
                <SelectTrigger className={`w-[110px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
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
                <SelectTrigger className={`w-[110px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
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
                <SelectTrigger className={`w-[90px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
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
              className={`w-full border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark
                ? "bg-[#202020] border-[#FFFFFF33] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                }`}
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* DESKTOP VIEW TABLE LAYOUT                  */}
        {/* ========================================== */}
        <div className="hidden lg:block w-full overflow-hidden">
          <table className="w-full text-left table-fixed border-collapse">
            <thead>
              <tr className={`text-sm font-medium border-b ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                <th className={`py-5 px-4 font-medium truncate ${isShootIdView ? "w-[13%]" : "w-[16%]"}`}>{primaryIdLabel}</th>
                <th className="py-5 px-4 font-medium w-[22%] truncate">Client Name</th>
                <th className="py-5 px-4 font-medium w-[14%] truncate">Shoot Type</th>
                <th className="py-5 px-4 font-medium w-[12%] truncate">Total Amount</th>
                {isShootIdView && <th className="py-5 px-4 font-medium w-[13%] truncate">Transactions</th>}
                <th className="py-5 px-4 font-medium w-[14%] truncate">Payment Method</th>
                <th className="py-5 px-4 font-medium w-[10%] truncate">Status</th>
                <th className="py-5 px-4 font-medium text-right w-[8%] truncate">Action</th>
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
                      <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {isShootIdView ? (
                          <div className="flex items-center gap-3 truncate">
                            <ChevronDown
                              size={24}
                              className={`transition-transform shrink-0 ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/70" : "text-[#666]"}`}
                            />
                            <span className="truncate">{row.shootId}</span>
                          </div>
                        ) : (
                          row.transactionId
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-3 truncate">
                          <div
                            className="relative w-13 h-13 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-black font-medium text-xl"
                            style={{ backgroundColor: row.avatarColor }}
                          >
                            {row.avatarImage ? (
                              <Image src={row.avatarImage} alt={row.clientName} fill className="object-cover" />
                            ) : (
                              row.initials
                            )}
                          </div>
                          <div className="truncate">
                            <p className={`truncate font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                              {row.clientName}
                            </p>
                            <p className={`text-sm truncate ${isDark ? "text-white/40" : "text-[#666]"}`}>
                              {row.date}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.shootType}
                      </td>
                      <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.totalAmount}
                      </td>
                      {isShootIdView && (
                        <td className="p-5">
                          <span
                            className={`inline-flex min-w-[108px] items-center justify-center rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${isDark ? "bg-[#312D2D] text-[#D3B98A]" : "bg-[#F2EEE7] text-[#8B6B36]"}`}
                          >
                            {String(row.transactionCount ?? row.transactionDetails?.length ?? 0).padStart(2, "0")} Transactions
                          </span>
                        </td>
                      )}
                      <td className={`p-5 truncate ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        {row.paymentMethod}
                      </td>
                      <td className="p-5 whitespace-nowrap">
                        <TransactionStatusBadge status={row.status} />
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex min-h-[44px] items-center justify-end">
                          <button
                            type="button"
                            onClick={(event) => action?.(row, event)}
                            className={isDark ? "text-white" : "text-[#171717]"}
                          >
                            <MoreVertical size={30} />
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

        {/* ========================================================================= */}
        {/* NEW MOBILE RESPONSIVE CARD DRAWER LAYOUT                                  */}
        {/* ========================================================================= */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
            </div>
          ) : visibleRows.length > 0 ? (
            visibleRows.map((row) => {
              const isExpanded = expandedRowId === row.id;
              return (
                <div
                  key={row.id}
                  className={`transition-all duration-200 overflow-hidden ${isDark ? "bg-[#171717]" : "bg-white shadow-xs"}`}
                >
                  <div
                    onClick={() => toggleRow(row.id)}
                    className="flex items-center justify-between p-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Circle Rotation Trigger Indicator Wrapper */}
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-white/20 text-white/80" : "border-black/20 text-black/80"}`}>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-180"}`}
                        />
                      </div>

                      {/* Initials/Avatar Container Block */}
                      <div
                        className="relative w-12 h-12 rounded-sm flex items-center justify-center text-black font-semibold text-sm shrink-0"
                        style={{ backgroundColor: row.avatarColor }}
                      >
                        {row.avatarImage ? (
                          <div className="relative w-full h-full rounded-sm overflow-hidden">
                            <Image src={row.avatarImage} alt={row.clientName} fill className="object-cover" />
                          </div>
                        ) : (
                          row.initials
                        )}
                      </div>

                      {/* Metadata Content Stack Labels */}
                      <div>
                        <p className={`text-sm leading-tight font-medium ${isDark ? "text-white" : "text-black"}`}>
                          {row.clientName}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
                          {row.date}
                        </p>
                      </div>
                    </div>

                    {/* Right Status Badge Segment */}
                    <TransactionStatusBadge status={row.status} mobile={true} />
                  </div>

                  {/* Expanded Mobile Interface Drawer configuration matrix */}
                  {isExpanded && (
                    <div className="space-y-4">
                      {/* Primary Data Grid Properties Matrix */}
                      <div className={`grid grid-cols-2 gap-y-4 gap-x-2 text-sm pr-4 pl-14`}>
                        <div>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>{primaryIdLabel}</p>
                          <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>
                            {isShootIdView ? row.shootId : row.transactionId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Shoot Type</p>
                          <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.shootType}</p>
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Payment Method</p>
                          <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Amount</p>
                          <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>{row.totalAmount}</p>
                        </div>
                        {isShootIdView && (
                          <div className="col-span-2">
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Transactions</p>
                            <p className={`mt-1 ${isDark ? "text-[#A1A1A1]" : "text-black/90"}`}>
                              {String(row.transactionCount ?? row.transactionDetails?.length ?? 0).padStart(2, "0")} Transactions
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions row structure */}
                      <div className={`flex items-center justify-between pr-4 pt-1 pl-14`}>
                        <span className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Actions</span>
                        <button
                          type="button"
                          onClick={(event) => action?.(row, event)}
                          className={`p-1 ${isDark ? "text-white hover:text-white/70" : "text-black/70 hover:text-black"}`}
                        >
                          <MoreVertical size={24} />
                        </button>
                      </div>

                      {/* Embedded detail sub-panel execution layer */}
                      {isShootIdView && (
                        <div className="pt-2">
                          <DetailPanelContent row={row} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={`py-8 text-center text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
              No transactions found.
            </div>
          )}
        </div>

        {/* Footer Navigation Section */}
        {!loading && rows.length > 0 && (
          <div className={`flex justify-center lg:justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
              Showing {displayStart} to {displayEnd} of {displayTotal}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => isControlledPagination ? onPageChange?.(safePage - 1) : setLocalCurrentPage(safePage - 1)}
                disabled={safePage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                  }`}
              >
                <span className="hidden lg:block">Previous</span>
                <ChevronLeft size={24} className="block lg:hidden" />
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
                      onClick={() => isControlledPagination ? onPageChange?.(page) : setLocalCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${safePage === page
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
                onClick={() => isControlledPagination ? onPageChange?.(safePage + 1) : setLocalCurrentPage(safePage + 1)}
                disabled={safePage === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                  }`}
              >
                <span className="hidden lg:block">Next</span>
                <ChevronRight size={24} className="block lg:hidden" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
