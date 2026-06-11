"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { formatRelativeOrAbsoluteDate, getColorThreshold, getDateColorThreshold, getInitials } from "@/lib/utils";
import { FinanceStatusBadge } from "../admin/finances/FinanceStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ShootCPRow = {
  id: string;
  shootName?: string;
  totalCP?: number;
  customerName: string;
  customerEmail: string;
  shootBudget: number;
  cpPayout: number;
  margin: number;
  status:
  | "Pending"
  | "Partially Paid"
  | "Finance Approval"
  | "Approved"
  | "Fully Paid";
  category: "photography" | "videography";
  avatarImage: string;
  date: string;
  creatorName?: string;
  creatorRoles?: string[];
  shootId?: string;
};

interface CPPayoutTableProps {
  rows?: ShootCPRow[];
  loading?: boolean;
  type: "shoots" | "creators";
  onRowClick: (row: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const matchesRange = (dateString: string, range: string) => {
  if (!dateString) return false;
  const rowDate = new Date(dateString);
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

  return (
    rowDate.getMonth() === now.getMonth() &&
    rowDate.getFullYear() === now.getFullYear()
  );
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const items: Array<number | "..."> = [];
  for (let page = 1; page <= totalPages; page += 1) {
    const isBoundary = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;

    if (isBoundary || isNearCurrent) {
      items.push(page);
      continue;
    }

    const previousItem = items[items.length - 1];
    if (previousItem !== "...") {
      items.push("...");
    }
  }
  return items;
};

const historyMonthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];

export default function CPPayoutTable({
  rows = [],
  loading = false,
  type,
  onRowClick,
}: CPPayoutTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fully localized state variables
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortFilter, setSortFilter] = useState("Ascending");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Internal calculations for filtering and sorting
  const processedRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (statusFilter !== "All" && row.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      if (monthFilter !== "Month" && !matchesRange(row.date, monthFilter)) {
        return false;
      }

      if (normalizedSearch) {
        const searchableValue = [
          row.shootName,
          row.customerName,
          row.customerEmail,
          row.category,
          row.creatorName || "",
          (row.creatorRoles || []).join(" "),
          row.shootId || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableValue.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortFilter === "Ascending" ? dateA - dateB : dateB - dateA;
    });
  }, [rows, monthFilter, statusFilter, sortFilter, searchQuery]);

  // Reset to first page on any query adjustment
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, monthFilter, statusFilter, sortFilter]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const visibleRows = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return processedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [processedRows, safePage]);

  const startCount = processedRows.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endCount = Math.min(safePage * itemsPerPage, processedRows.length);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  if (!mounted) return null;

  return (
    <section className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"}`}>

      {/* Header Controls Panel */}
      <div className={`flex flex-col p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>

        <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
            <h2 className={`text-sm lg:text-lg font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>
              {type === "shoots" ? "Shoots Compensation History" : "Creators Compensation History"}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Finance approval">Finance Approval</SelectItem>
                  <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortFilter} onValueChange={(v) => setSortFilter(v)}>
                <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  <SelectItem value="Ascending">Ascending</SelectItem>
                  <SelectItem value="Descending">Descending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v)}>
                <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  {historyMonthOptions.map((option, idx) => (
                    <SelectItem key={`monthFilter_${idx}`} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="relative flex items-center w-full">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`}
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={type === "shoots" ? "Search client, email..." : "Search creator, roles, ID..."}
            className={`h-10 w-full rounded-lg border pl-9 pr-4 text-sm transition-colors focus:outline-none ${isDark
              ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
              : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5D5B8] border-t-transparent" />
          <p className={`text-xs mt-3 ${isDark ? "text-white/40" : "text-black/40"}`}>Syncing ledger rows...</p>
        </div>
      ) : processedRows.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
          <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>No entries matched your filters.</p>
        </div>
      ) : (
        <>
          {/* MOBILE COMPACT ADAPTIVE LIST ACCORDION */}
          <div className="lg:hidden flex-grow overflow-visible">
            <div className={`flex justify-between text-sm font-medium p-4 border-b transition-colors duration-200 ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-black bg-[#FFFCF6] border-b-black/10"}`}>
              <span>{type === "shoots" ? "Shoot" : "Creator"}</span>
              <span className="text-right">CP Payout</span>
            </div>

            {visibleRows.map((row) => {
              const isRowExpanded = expandedId === row.id;

              return (
                <div
                  key={row.id}
                  className={`p-4 border-b last:border-0 ${isDark ? "border-b-white/5" : "border-b-black/5"} ${(isRowExpanded ? (isDark ? "bg-white/5" : "bg-black/5") : "")}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(e, row.id)}
                        className={`w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-200 shrink-0 ${isRowExpanded ? "rotate-180 border-[#E8D1AB] text-[#E8D1AB]" : isDark ? "border-white/20 text-white/40" : "border-black/30 text-black/40"}`}
                      >
                        <ChevronDown size={16} />
                      </button>

                      <div
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-medium text-[#171717]"
                        style={{ backgroundColor: "#FED1EF" }}
                      >
                        {row?.avatarImage ? (
                          <img
                            src={row?.avatarImage}
                            alt={type === "shoots" ? row.customerName : (row.creatorName || "")}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          getInitials(type === "shoots" ? row.customerName : (row.creatorName || ""))
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {type === "shoots" ? (
                          <>
                            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#323232]"}`}>
                              {row.shootName}
                            </p>
                            <p className={`text-xs capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}>
                              {row.category}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#323232]"}`}>
                              {row.creatorName || "Unknown Creator"}
                            </p>
                            <p className={`text-xs capitalize max-w-full truncate ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}>
                              {(row.creatorRoles || []).join(", ") || "No Roles Listed"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#171717]'}`}>${row.cpPayout}</p>
                        <p className="text-[11px]" style={{ color: getDateColorThreshold(row.date) }}>
                          Due: {formatRelativeOrAbsoluteDate(row.date)}
                        </p>
                      </div>

                      {/* <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row);
                        }}
                        className={`p-1.5 rounded-lg inline-flex items-center justify-center transition-colors ${isDark ? "text-white/60 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}
                      >
                        <ChevronRight size={20} />
                      </button> */}
                    </div>
                  </div>

                  {/* Mobile Dropdown Subsections */}
                  {isRowExpanded && (
                    <div className="mt-4 grid grid-cols-2 gap-y-4 px-2 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                      {type === "shoots" ? (
                        <>
                          <div>
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Customer</p>
                            <p className={`text-xs truncate font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{row.customerName}</p>
                            {/* <p className={`text-[11px] truncate ${isDark ? "text-white/40" : "text-black/40"}`}>{row.customerEmail}</p> */}
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Total CP Allotted</p>
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{row.totalCP} CPs</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot Title Context</p>
                            <p className={`text-xs truncate font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{row.shootName}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot ID</p>
                            <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-white/80" : "text-zinc-700"}`}>
                              {row.shootId || "—"}
                            </p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot  {type === "shoots" ? "Budget" : "Amount"}</p>
                        <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#323232]"}`}>{formatCurrency(row.shootBudget)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Margin</p>
                        <p className="text-sm font-bold" style={{ color: getColorThreshold(row.margin, 15, 10) }}>
                          {row.margin}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-white/40" : "text-black/40"}`}>Status</p>
                        <FinanceStatusBadge status={row.status} mobile={true} />
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Action</p>
                        <button
                          className={`text-xs font-semibold underline underline-offset-2 ${isDark ? "text-[#ECD7B4]" : "text-[#E8D1AB]"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row.id);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block w-full overflow-x-auto flex-grow">
            <table className="w-full text-left">
              <thead className={`border-b rounded-l-lg ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "bg-[#FFFCF6] border-[#E3E3E3]"}`}>
                <tr className={`text-sm font-medium capitalize ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                  <th className="px-5 py-4">
                    {type === "shoots" ? "Shoot Name" : "Creator Name"}
                  </th>
                  <th className={`px-5 py-4 ${type === "shoots" ? "text-center" : "text-left"}`}>
                    {type === "shoots" ? "Total CP" : "Shoot ID"}
                  </th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Shoot {type === "shoots" ? "Budget" : "Amount"}</th>
                  <th className="px-5 py-4">CP Payout</th>
                  <th className="px-5 py-4">Margin</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {visibleRows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className={`${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"}`}
                    >
                      <td className={`px-5 py-4 font-medium max-w-[180px] truncate ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {type === "shoots" ? (
                          <>
                            <p>{row.shootName}</p>
                            <p className={`text-xs font-normal capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}>{row.category}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div
                                className="shrink-0 relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-[15px] font-medium text-[#171717]"
                                style={{ backgroundColor: "#FED1EF" }}
                              >
                                {row?.avatarImage ? (
                                  <Image
                                    src={row?.avatarImage}
                                    alt={row.creatorName || ""}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  getInitials((row.creatorName || ""))
                                )}
                              </div>
                              <div>
                                <p>{row.creatorName || "Unknown Creator"}</p>
                                <p className={`text-xs font-normal capitalize truncate max-w-full ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}>
                                  {(row.creatorRoles || []).join(", ") || "No Roles Listed"}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </td>

                      {/* Column 2 Layout Pivot */}
                      <td className={`px-5 py-4 ${type === "shoots" ? "text-center" : "text-left"} ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {type === "shoots" ? (
                          `${row.totalCP} CPs`
                        ) : (
                          <div className="flex flex-col text-left font-normal">
                            <span className={`font-medium ${isDark ? "text-white/90" : "text-[#171717]"}`}>
                              {row.shootId || "—"}
                            </span>
                            <span className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                              Created: {new Date(row.date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {
                            type === "shoots" && (
                              <div
                                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-[15px] font-medium text-[#171717]"
                                style={{ backgroundColor: "#FED1EF" }}
                              >
                                {row?.avatarImage ? (
                                  <Image
                                    src={row?.avatarImage}
                                    alt={type === "shoots" ? row.customerName : (row.creatorName || "")}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  getInitials(type === "shoots" ? row.customerName : (row.creatorName || ""))
                                )}
                              </div>
                            )
                          }
                          <span className={`font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                            {row.customerName}
                          </span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-medium ${isDark ? "text-white/90" : "text-[#171717]"}`}>
                        {formatCurrency(row.shootBudget)}
                      </td>
                      <td className="px-5 py-4">
                        <p>${row.cpPayout}</p>
                        <p className="text-xs" style={{ color: getDateColorThreshold(row.date) }}>
                          Due: {formatRelativeOrAbsoluteDate(row.date)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p style={{ color: getColorThreshold(row.margin, 15, 10) }}>{row.margin}%</p>
                      </td>
                      <td className="px-5 py-4">
                        <FinanceStatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-right overflow-visible relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row);
                          }}
                          className={`p-1.5 rounded-lg inline-flex items-center justify-center transition-colors ${isDark ? "text-white/60 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className={`p-5 flex items-center justify-between border-t text-sm ${isDark ? "border-t-white/5 text-white/60 bg-[#141414]" : "border-t-[#E3E3E3] text-[#666] bg-white"}`}>
            <div className="hidden sm:inline">
              Showing <span className="font-semibold">{startCount}</span> to <span className="font-semibold">{endCount}</span> of <span className="font-semibold">{processedRows.length}</span> entries
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {paginationItems.map((page, index) => (
                  page === "..." ? (
                    <span key={`ell-${index}`} className="px-3 py-1">...</span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${safePage === page
                        ? "bg-[#E5D5B8] text-black border-[#E5D5B8]"
                        : isDark ? "text-white/60 border-[#333] hover:bg-white/5" : "text-[#666] border-[#E5E5E5] hover:bg-zinc-100"
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={`p-2 rounded-lg border transition-all flex items-center justify-center disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}