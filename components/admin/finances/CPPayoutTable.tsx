"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Calendar, ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Eye, History, Search } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { getColorThreshold, getInitials } from "@/lib/utils";
import { FinanceStatusBadge } from "./FinanceStatusBadge";
import { DatePickerFloating } from "../DatePickerFloating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip";

export type ShootCPRow = {
  id: string;
  bookingId?: number;
  creatorEarningId?: number;
  creatorId?: number;
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
  sortDate?: string;
  dueDate?: string | null;
  creatorName?: string;
  creatorRoles?: string[];
  shootId?: string;
};

interface CPPayoutTableProps {
  rows?: ShootCPRow[];
  loading?: boolean;
  type: "shoots" | "creators";
  onRowClick: (row: ShootCPRow) => void;
  onViewHistory?: (row: ShootCPRow) => void;
  onDueDateChange?: (row: ShootCPRow, dueDate: Date) => Promise<void>;
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

const parseRowDate = (dateString: string) => {
  if (!dateString) return null;
  const normalized = dateString.includes("T") ? dateString : `${dateString}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseSortDate = (dateString?: string | null) => {
  if (!dateString) return null;
  const normalized = dateString.includes("T") ? dateString : `${dateString}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getDefaultDueDate = (dateString: string) => {
  const shootDate = parseRowDate(dateString);
  return shootDate ? addDays(shootDate, 15) : null;
};

const getDueDateMeta = (date: Date | null) => {
  if (!date) return { label: "", className: "text-blue-400", icon: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (daysUntilDue < 0) {
    return { label: "Overdue", className: "text-red-400", icon: true };
  }
  if (daysUntilDue <= 3) {
    return { label: "Due soon", className: "text-amber-300", icon: true };
  }
  if (daysUntilDue <= 7) {
    return { label: "Upcoming", className: "text-amber-200", icon: false };
  }
  return { label: "", className: "text-blue-400", icon: false };
};

export default function CPPayoutTable({
  rows = [],
  loading = false,
  type,
  onRowClick,
  onViewHistory,
  onDueDateChange,
}: CPPayoutTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [dueDateModalRowId, setDueDateModalRowId] = useState<string | null>(null);
  const [rowDueDates, setRowDueDates] = useState<Record<string, Date | null>>({});
  const [dueDateDraft, setDueDateDraft] = useState<Date | null>(null);
  const [isSavingDueDate, setIsSavingDueDate] = useState(false);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fully localized state variables
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [statusFilter, setStatusFilter] = useState("All");

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
      const dateA = parseSortDate(a.sortDate || a.date)?.getTime() || 0;
      const dateB = parseSortDate(b.sortDate || b.date)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [rows, monthFilter, statusFilter, searchQuery]);

  // Reset to first page on any query adjustment
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, monthFilter, statusFilter]);

  useEffect(() => {
    if (!openActionMenuId) return;

    const handleDocumentClick = () => {
      setOpenActionMenuId(null);
      setActionMenuPosition(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [openActionMenuId]);

  const handleOpenHistory = (row: ShootCPRow) => {
    setOpenActionMenuId(null);
    onViewHistory?.(row);
  };

  const handleOpenDueDate = (row: ShootCPRow) => {
    setOpenActionMenuId(null);
    setActionMenuPosition(null);
    setDueDateModalRowId(row.id);
    setDueDateDraft(rowDueDates[row.id] || parseRowDate(row.dueDate || "") || getDefaultDueDate(row.date));
  };

  const handleSaveDueDate = () => {
    if (!dueDateModalRowId) return;
    if (!dueDateDraft) return;
    const selectedRow = processedRows.find((row) => row.id === dueDateModalRowId);
    if (!selectedRow) return;
    setIsSavingDueDate(true);
    Promise.resolve(onDueDateChange?.(selectedRow, dueDateDraft))
      .then(() => {
        setRowDueDates((current) => ({
          ...current,
          [dueDateModalRowId]: dueDateDraft,
        }));
        setDueDateModalRowId(null);
        setDueDateDraft(null);
      })
      .catch(() => undefined)
      .finally(() => setIsSavingDueDate(false));
  };

  const totalPages = Math.max(1, Math.ceil(processedRows.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const visibleRows = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return processedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [processedRows, safePage]);

  const startCount = processedRows.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endCount = Math.min(safePage * itemsPerPage, processedRows.length);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  const getRowDueDate = (row: ShootCPRow) => rowDueDates[row.id] || parseRowDate(row.dueDate || "") || getDefaultDueDate(row.date);

  const formatDueDate = (dateValue: string | Date | null) => {
    const date = dateValue instanceof Date ? dateValue : parseRowDate(dateValue || "");
    if (!date) return "No Date";

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  };

  if (!mounted) return null;

  const renderDueDate = (row: ShootCPRow, className = "text-xs") => {
    const dueDate = getRowDueDate(row);
    const meta = getDueDateMeta(dueDate);
    return (
      <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`}>
        <span className={meta.className}>Due: {formatDueDate(dueDate)}</span>
        {meta.label && (
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${meta.className} ${isDark ? "bg-white/5" : "bg-black/5"}`}>
            {meta.icon && <AlertTriangle className="h-3 w-3" />}
            {meta.label}
          </span>
        )}
      </div>
    );
  };

  const openRowActionMenu = (rowId: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 132;
    const top = rect.bottom + menuHeight + 8 > window.innerHeight
      ? Math.max(8, rect.top - menuHeight - 8)
      : rect.bottom + 8;
    if (openActionMenuId === rowId) {
      setOpenActionMenuId(null);
      setActionMenuPosition(null);
      return;
    }
    setActionMenuPosition({
      top,
      left: Math.max(8, Math.min(window.innerWidth - 196, rect.right - 180)),
    });
    setOpenActionMenuId(rowId);
  };

  const actionMenuRow = openActionMenuId
    ? processedRows.find((row) => row.id === openActionMenuId) || null
    : null;

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
                  {/* <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem> */}
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Finance approval">Finance Approval</SelectItem>
                  <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* <Select value={sortFilter} onValueChange={(v) => setSortFilter(v)}>
                <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
                  <SelectItem value="Ascending">Ascending</SelectItem>
                  <SelectItem value="Descending">Descending</SelectItem>
                </SelectContent>
              </Select> */}

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
                  role="button"
                  tabIndex={0}
                  onClick={() => onRowClick(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={`relative p-4 border-b last:border-0 cursor-pointer ${isDark ? "border-b-white/5" : "border-b-black/5"} ${(isRowExpanded ? (isDark ? "bg-white/5" : "bg-black/5") : "")}`}
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
                            <TruncatedTableText
                              text={row.shootName || "Untitled Shoot"}
                              isDark={isDark}
                              className="block max-w-full text-sm font-semibold"
                            />
                            <TruncatedTableText
                              text={row.category || "No Category"}
                              isDark={isDark}
                              className={`block max-w-full text-xs capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}
                            />
                          </>
                        ) : (
                          <>
                            <TruncatedTableText
                              text={row.creatorName || "Unknown Creator"}
                              isDark={isDark}
                              className="block max-w-full text-sm font-semibold"
                            />
                            <TruncatedTableText
                              text={(row.creatorRoles || []).join(", ") || "No Roles Listed"}
                              isDark={isDark}
                              className={`block max-w-full text-xs capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#171717]'}`}>${row.cpPayout}</p>
                        {renderDueDate(row, "justify-end text-[11px]")}
                      </div>

                      <button
                        type="button"
                        aria-label="Open row actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRowActionMenu(row.id, e.currentTarget);
                        }}
                        className={`p-1.5 rounded-lg inline-flex items-center justify-center transition-colors ${isDark ? "text-white/60 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}
                      >
                        <EllipsisVertical size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Dropdown Subsections */}
                  {isRowExpanded && (
                    <div className="mt-4 grid grid-cols-2 gap-y-4 px-2 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                      {type === "shoots" ? (
                        <>
                          <div>
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Customer</p>
                            <TruncatedTableText
                              text={row.customerName}
                              isDark={isDark}
                              className="block text-xs font-medium"
                            />
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
                            <TruncatedTableText
                              text={row.shootName || "Untitled Shoot"}
                              isDark={isDark}
                              className="block text-xs font-medium"
                            />
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] uppercase font-semibold ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot ID</p>
                            <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? "text-white/80" : "text-zinc-700"}`}>
                              {row.shootId || "-"}
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
                            onRowClick(row);
                          }}
                        >
                          View Details
                        </button>
                        {onViewHistory && (
                          <button
                            type="button"
                            className={`mt-2 block text-xs font-semibold underline underline-offset-2 ${isDark ? "text-white/60" : "text-black/50"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHistory(row);
                            }}
                          >
                            View History
                          </button>
                        )}
                        <button
                          type="button"
                          className={`mt-2 block text-xs font-semibold underline underline-offset-2 ${isDark ? "text-white/60" : "text-black/50"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDueDate(row);
                          }}
                        >
                          Due Date
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
                      onClick={() => onRowClick(row)}
                      className={`${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"} cursor-pointer`}
                    >
                      <td className={`px-5 py-4 font-medium max-w-[180px] truncate ${isDark ? "text-white" : "text-[#171717]"}`}>
                        {type === "shoots" ? (
                          <>
                            <TruncatedTableText
                              text={row.shootName || "Untitled Shoot"}
                              isDark={isDark}
                              className="block"
                            />
                            <p className={`text-xs font-normal capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}>{row.category}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
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
                              <div className="min-w-0 flex-1">
                                <TruncatedTableText
                                  text={row.creatorName || "Unknown Creator"}
                                  isDark={isDark}
                                  className="block max-w-full"
                                />
                                <TruncatedTableText
                                  text={(row.creatorRoles || []).join(", ") || "No Roles Listed"}
                                  isDark={isDark}
                                  className={`block max-w-full text-xs font-normal capitalize ${isDark ? "text-[#FFFFFF80]" : "text-black/40"}`}
                                />
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
                              {row.shootId || "-"}
                            </span>
                            <span className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                              Created: {formatDueDate(row.date)}
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
                        {renderDueDate(row)}
                      </td>
                      <td className="px-5 py-4">
                        <p style={{ color: getColorThreshold(row.margin, 15, 10) }}>{row.margin}%</p>
                      </td>
                      <td className="px-5 py-4">
                        <FinanceStatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-4 text-right overflow-visible relative">
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            aria-label="Open row actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRowActionMenu(row.id, e.currentTarget);
                            }}
                            className={`p-2 rounded-lg inline-flex items-center justify-center transition-colors ${isDark ? "text-white/60 hover:bg-white/10" : "text-black/60 hover:bg-black/5"}`}
                          >
                            <EllipsisVertical size={18} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {actionMenuRow && actionMenuPosition && (
            <div
              className={`fixed z-[160] min-w-[180px] rounded-xl border p-1 shadow-2xl text-left ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}
              style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  setActionMenuPosition(null);
                  onRowClick(actionMenuRow);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"}`}
              >
                <Eye size={16} className="opacity-70" />
                View details
              </button>
              {onViewHistory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuPosition(null);
                    handleOpenHistory(actionMenuRow);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"}`}
                >
                  <History size={16} className="opacity-70" />
                  View history
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuPosition(null);
                  handleOpenDueDate(actionMenuRow);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"}`}
              >
                <Calendar size={16} className="opacity-70" />
                Due date
              </button>
            </div>
          )}

          {dueDateModalRowId && (
            <div
              className={`fixed inset-0 z-[140] flex items-center justify-center p-4 backdrop-blur-md ${isDark ? "bg-black/80" : "bg-white/80"}`}
              onClick={() => {
                setDueDateModalRowId(null);
                setDueDateDraft(null);
              }}
            >
              <div
                className={`w-full max-w-lg rounded-2xl border p-4 shadow-2xl ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Set Due Date</h3>
                    <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                      {processedRows.find((row) => row.id === dueDateModalRowId)?.shootName || processedRows.find((row) => row.id === dueDateModalRowId)?.customerName || "Selected row"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDueDateModalRowId(null);
                      setDueDateDraft(null);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"}`}
                    aria-label="Close due date modal"
                  >
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </div>

                <div className="mt-4">
                  <DatePickerFloating
                    label="Due Date"
                    selectedDate={dueDateDraft}
                    onDateChange={setDueDateDraft}
                    width="w-full"
                    classnames="w-full"
                    labelClasses={isDark ? "bg-[#111111] text-white/60" : "bg-white text-black/60"}
                  />
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDueDateModalRowId(null);
                      setDueDateDraft(null);
                    }}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${isDark ? "border-white/10 text-white hover:bg-white/5" : "border-[#E5E5E5] text-black hover:bg-black/5"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDueDate}
                    disabled={!dueDateDraft || isSavingDueDate}
                    className="rounded-xl bg-[#E8D1AB] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#dec28f]"
                  >
                    {isSavingDueDate ? "Saving..." : "Save Due Date"}
                  </button>
                </div>
              </div>
            </div>
          )}

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

const TruncatedTableText = ({
  text,
  isDark,
  className = "",
}: {
  text: string;
  isDark: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    const element = textRef.current;
    if (element) {
      setIsOpen(element.scrollWidth > element.offsetWidth);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild>
          <span
            ref={textRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`min-w-0 truncate cursor-default ${isDark ? "text-white" : "text-[#171717]"} ${className}`}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
