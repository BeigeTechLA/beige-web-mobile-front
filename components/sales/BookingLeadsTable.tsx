"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { MoreVertical, Loader2, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { LeadsStatusBadge, BookingStatus } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "./IntentBadge";
import { useTheme } from "next-themes";

interface LeadData {
  lead_id: number;
  bookingId?: string;
  clientName: string;
  email: string;
  registrationType?: "guest" | "registered";
  leadType: "Self-Serve" | "Sales Assisted";
  bookingStatus: "Paid" | "In-Progress" | BookingStatus;
  lastActivity: string;
  date: Date;
  intent: string;
  assignedSalesRepName?: string;
  assignedSalesRepEmail?: string;
  hasManualPaymentHistory?: boolean;
  isPaymentPending?: boolean;
}

interface LeadsTableProps {
  data: LeadData[];
  loading: boolean;
  isFetching?: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  activeStatusFilter?: BookingStatus | "All";
  viewMode?: "list" | "grid";
  showViewSwitcher?: boolean;
  onViewModeChange?: (mode: "list" | "grid") => void;
  onPageChange: (page: number) => void;
  onGridColumnEndReached?: (status: string) => void;
  gridColumnLoadingByStatus?: Record<string, boolean>;
  gridColumnHasMoreByStatus?: Record<string, boolean>;
  gridColumnTotalByStatus?: Record<string, number>;
  onRowClick: (id: number) => void;
  onOpenMenu: (
    e: React.MouseEvent<HTMLButtonElement>,
    name: string,
    id: number,
    bookingStatus?: string,
    allowPaymentTransaction?: boolean
  ) => void;
}


const normalizeBookingStatus = (value?: string) => {
  if (!value) return "Unknown";

  // 1. Convert to string and trim
  // 2. Replace En-dash (–), Em-dash (—), and corrupted â€“ with a standard hyphen (-)
  // 3. Lowercase for consistent comparison
  const normalized = String(value)
    .replace(/[–—]|â€“/g, "-")
    .trim()
    .toLowerCase();

  if (normalized === "signed up" || normalized === "singed up" || normalized.includes("signed up - lead created")) {
    return "Signed Up - Lead Created";
  }
  if (normalized.includes("book a shoot - lead created")) {
    return "Book a shoot - Lead Created";
  }
  if (normalized.includes("manual - lead created")) {
    return "Manual - Lead Created";
  }
  if (normalized === "booking in progress" || normalized === "in-progress") {
    return "Booking In Progress";
  }
  if (normalized === "proposal sent" || normalized === "payment link sent" || normalized === "link sent") {
    return "Proposal Sent";
  }
  if (normalized === "ready for payment") {
    return "Ready for Payment";
  }
  if (normalized === "payment sent") {
    return "Payment Sent";
  }
  if (normalized === "booked" || normalized === "paid") {
    return "Booked";
  }
  if (normalized.includes("closed - lost") || normalized === "cancelled") {
    return "Closed - Lost";
  }
  return value.trim() || "Unknown";
};

const isClosedLostStatus = (value?: string) =>
  normalizeBookingStatus(value) === "Closed - Lost";


export default function LeadsTable({
  data,
  loading,
  isFetching,
  currentPage,
  totalPages,
  totalRecords,
  limit,
  activeStatusFilter = "All",
  viewMode,
  showViewSwitcher = true,
  onViewModeChange,
  onPageChange,
  onGridColumnEndReached,
  gridColumnLoadingByStatus,
  gridColumnHasMoreByStatus,
  gridColumnTotalByStatus,
  onRowClick,
  onOpenMenu,
}: LeadsTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const gridPanStateRef = useRef<{ startX: number; scrollLeft: number; isActive: boolean }>({
    startX: 0,
    scrollLeft: 0,
    isActive: false,
  });
  const [internalViewMode, setInternalViewMode] = useState<"list" | "grid">("list");
  const [kanbanOrder, setKanbanOrder] = useState<Record<string, number[]>>({});
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<string | null>(null);
  const [isGridPanning, setIsGridPanning] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);
  const gridSentinelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentViewMode = viewMode ?? internalViewMode;

  useEffect(() => {
    console.log(viewMode)
    onViewModeChange?.(currentViewMode);
  }, [onViewModeChange, currentViewMode]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      gridPanStateRef.current.isActive = false;
      setIsGridPanning(false);
    };

    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, []);

  const handleGridMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, [draggable='true'], [data-card-actions]")) {
      return;
    }

    const container = gridScrollRef.current;
    if (!container) return;

    gridPanStateRef.current = {
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
      isActive: true,
    };
    setIsGridPanning(true);
  };

  const handleGridMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gridPanStateRef.current.isActive) return;

    const container = gridScrollRef.current;
    if (!container) return;

    const deltaX = event.clientX - gridPanStateRef.current.startX;
    container.scrollLeft = gridPanStateRef.current.scrollLeft - deltaX;
    event.preventDefault();
  };

  const handleGridMouseEnd = () => {
    gridPanStateRef.current.isActive = false;
    setIsGridPanning(false);
  };

  const visibleStatuses = useMemo(() => {
    if (activeStatusFilter !== "All") {
      return [normalizeBookingStatus(activeStatusFilter)];
    }

    const masterStatusList = [
      "Booking In Progress",
      "Booked",
      "Signed Up - Lead Created",
      "Book a shoot - Lead Created",
      "Manual - Lead Created",
      "Proposal Sent",
      "Ready for Payment",
      "Payment Sent",
      "Closed - Lost",
    ].map(status => normalizeBookingStatus(status));

    const uniqueStatusesFromData = data
      .map((lead) => normalizeBookingStatus(lead.bookingStatus))
      .filter(status => !masterStatusList.includes(status));

    return Array.from(new Set([...masterStatusList, ...uniqueStatusesFromData]));
  }, [activeStatusFilter, data]);

  useEffect(() => {
    const nextOrder: Record<string, number[]> = {};

    visibleStatuses.forEach((status) => {
      const currentIds = data
        .filter((lead) => normalizeBookingStatus(lead.bookingStatus) === status)
        .map((lead) => lead.lead_id);

      const previousIds = kanbanOrder[status] || [];
      const preservedIds = previousIds.filter((id) => currentIds.includes(id));
      const appendedIds = currentIds.filter((id) => !preservedIds.includes(id));

      nextOrder[status] = [...preservedIds, ...appendedIds];
    });

    const hasChanged =
      visibleStatuses.length !== Object.keys(kanbanOrder).length ||
      visibleStatuses.some((status) => {
        const prev = kanbanOrder[status] || [];
        const next = nextOrder[status] || [];
        if (prev.length !== next.length) return true;
        return next.some((id, index) => prev[index] !== id);
      });

    if (hasChanged) {
      setKanbanOrder(nextOrder);
    }
  }, [data, kanbanOrder, visibleStatuses]);

  const kanbanColumns = useMemo(() => {
    return visibleStatuses.map((status) => {
      const items = data.filter((lead) => normalizeBookingStatus(lead.bookingStatus) === status);
      const itemMap = new Map(items.map((item) => [item.lead_id, item]));
      const orderedIds = kanbanOrder[status] || items.map((item) => item.lead_id);
      const orderedItems = orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is LeadData => Boolean(item));

      return {
        status,
        totalItems: orderedItems.length,
        items: orderedItems,
      };
    });
  }, [data, kanbanOrder, visibleStatuses]);

  const reorderKanbanItems = (status: string, draggedId: number, targetId?: number) => {
    if (draggedId === targetId) return;

    setKanbanOrder((prev) => {
      const currentIds = prev[status] || [];
      const nextIds = [...currentIds];
      const fromIndex = nextIds.indexOf(draggedId);
      const targetIndex = typeof targetId === "number" ? nextIds.indexOf(targetId) : nextIds.length;

      if (fromIndex === -1 || targetIndex === -1) {
        return prev;
      }

      nextIds.splice(fromIndex, 1);
      const insertIndex =
        typeof targetId === "number"
          ? nextIds.indexOf(targetId) + (fromIndex < targetIndex ? 1 : 0)
          : nextIds.length;
      nextIds.splice(insertIndex === -1 ? nextIds.length : insertIndex, 0, draggedId);

      return {
        ...prev,
        [status]: nextIds,
      };
    });
  };

  useEffect(() => {
    if (!onGridColumnEndReached || currentViewMode !== "grid") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const status = (entry.target as HTMLElement).dataset.status || "";
          if (!status) return;
          const isLoading = Boolean(gridColumnLoadingByStatus?.[status]);
          const hasMore = gridColumnHasMoreByStatus?.[status] !== false;
          if (!isLoading && hasMore) {
            onGridColumnEndReached(status);
          }
        });
      },
      { root: null, rootMargin: "200px 0px 200px 0px", threshold: 0 }
    );

    Object.values(gridSentinelRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [onGridColumnEndReached, gridColumnLoadingByStatus, gridColumnHasMoreByStatus, currentViewMode, data]);

  if (loading && data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
          }`}
      >
        <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "text-white/60 border-[#3D3D3D] bg-[#171717]" : "text-black/40 border-[#E5E5E5] bg-white"
          }`}
      >
        <p>No leads found</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden transition-all duration-300 ${currentViewMode === "list" ? `rounded-2xl border ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}` : "bg-transparent border-transparent"}`}>
      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-6 pointer-events-none">
            <div
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs shadow-sm ${isDark
                ? "bg-[#111] text-white/80 border border-[#2A2A2A]"
                : "bg-white text-[#555] border border-[#E5E5E5]"
                }`}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading latest leads...</span>
            </div>
          </div>
        )}
        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
          {currentViewMode === "grid" ? (
            <div className="block pt-0">
              <div
                ref={gridScrollRef}
                className={`overflow-x-auto overflow-y-hidden no-scrollbar pb-2 ${isGridPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
                onMouseDown={handleGridMouseDown}
                onMouseMove={handleGridMouseMove}
                onMouseUp={handleGridMouseEnd}
                onMouseLeave={handleGridMouseEnd}
              >
                <div className="flex items-start gap-5 min-w-max px-4"> {/* Added padding for mobile breathing room */}
                  {/* <div className={`w-full overflow-hidden transition-all duration-300 ${viewMode === "list" ? `rounded-2xl border ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}` : "bg-transparent border-transparent"}`}>
      {showViewSwitcher && (
        <div
          className={`hidden lg:flex items-center justify-end gap-2 px-6 py-4 border-b ${
            isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-[#FFFCF6]"
          }`}
        >
        <button
          type="button"
          onClick={() => setInternalViewMode("list")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            currentViewMode === "list"
              ? isDark
                ? "bg-[#E5D5B8] text-black"
                : "bg-[#E8D1AB] text-black"
              : isDark
                ? "text-white/60 hover:bg-white/5"
                : "text-[#666666] hover:bg-black/5"
          }`}
        >
          <List size={16} />
          
        </button>
        <button
          type="button"
          onClick={() => setInternalViewMode("grid")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            currentViewMode === "grid"
              ? isDark
                ? "bg-[#E5D5B8] text-black"
                : "bg-[#E8D1AB] text-black"
              : isDark
                ? "text-white/60 hover:bg-white/5"
                : "text-[#666666] hover:bg-black/5"
          }`}
        >
          <Grid3X3 size={16} />
          
        </button>
        </div>
      )}

      <div className="relative">
        {isFetching && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-6 pointer-events-none">
            <div
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs shadow-sm ${
                isDark
                  ? "bg-[#111] text-white/80 border border-[#2A2A2A]"
                  : "bg-white text-[#555] border border-[#E5E5E5]"
              }`}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading latest leads...</span>
            </div>
          </div>
        )}

        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
        {currentViewMode === "grid" ? (
          <div className="hidden lg:block p-6">
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
              <div className="flex items-start gap-5 min-w-max"> */}
                  {kanbanColumns.map((column) => (
                    <div
                      key={column.status}
                      className={`w-[320px] shrink-0 rounded-3xl border h-fit ${isDark ? "bg-[#0A0A0A] border-[#FFFFFF33]" : "bg-[#FBF7EF] border-[#E8E0D2]"}`}
                    >
                      <div className={`flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 ${isDark ? "border-b border-white/5 bg-[#202020]" : "border-b border-[#E8E0D2] bg-[#FBF7EF]"}`}>
                        <h4 className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                          {column.status}
                        </h4>
                        <span className={`inline-flex h-6 min-w-6 items-center justify-center  px-2 text-sm font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                          {gridColumnTotalByStatus?.[column.status] ?? column.totalItems}
                        </span>
                      </div>

                      <div
                        className="max-h-[620px] overflow-y-auto no-scrollbar px-4 py-4 space-y-3"
                        onDragOver={(e) => {
                          if (draggedStatus !== column.status) return;
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (draggedStatus !== column.status || !draggedLeadId) return;
                          e.preventDefault();
                          e.stopPropagation();
                          reorderKanbanItems(column.status, draggedLeadId);
                          setDraggedLeadId(null);
                          setDraggedStatus(null);
                        }}
                      >
                        {column.items.length === 0 ? (
                          <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/35" : "border-[#E3D9C8] text-[#9A8F7C]"}`}>
                            No leads in this stage
                          </div>
                        ) : (
                          column.items.map((lead) => {
                            const isActionDisabled = isClosedLostStatus(String(lead.bookingStatus || ""));

                            return (
                              <div
                                key={lead.lead_id}
                                onClick={() => onRowClick(lead.lead_id)}
                                draggable
                                onDragStart={() => {
                                  setDraggedLeadId(lead.lead_id);
                                  setDraggedStatus(column.status);
                                }}
                                onDragEnd={() => {
                                  setDraggedLeadId(null);
                                  setDraggedStatus(null);
                                }}
                                onDragOver={(e) => {
                                  if (draggedStatus !== column.status) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  if (draggedStatus !== column.status || !draggedLeadId) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  reorderKanbanItems(column.status, draggedLeadId, lead.lead_id);
                                  setDraggedLeadId(null);
                                  setDraggedStatus(null);
                                }}
                                className={`group cursor-pointer rounded-2xl transition-all duration-200 ${isDark
                                  ? "bg-[#202020] hover:bg-[#1A1A1A]"
                                  : "border border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
                                  } ${draggedLeadId === lead.lead_id ? "opacity-50 scale-95" : "opacity-100"}`}
                              >
                                {/* 1. HEADER: Avatar, Name, Date, Menu */}
                                <div className="flex items-start justify-between gap-3 p-5">
                                  <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className="w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl shrink-0">
                                      {lead.clientName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .substring(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <h4
                                        className={`truncate text-base font-semibold leading-tight ${isDark ? "text-white" : "text-[#111111]"}`}
                                        title={lead.clientName}
                                      >
                                        {lead.clientName}
                                      </h4>
                                      <div className="mt-1">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${lead.registrationType === "registered"
                                            ? isDark
                                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                            : isDark
                                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                              : "bg-amber-100 text-amber-700 border border-amber-200"
                                            }`}
                                        >
                                          {lead.registrationType === "registered" ? "Registered" : "Guest"}
                                        </span>
                                      </div>
                                      <p className={`text-sm mt-1 font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
                                        {format(lead.date, "MMM dd, yyyy")}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isActionDisabled}
                                    className={`shrink-0 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenMenu(
                                        e,
                                        lead.clientName,
                                        lead.lead_id,
                                        String(lead.bookingStatus || ""),
                                        Boolean(lead.isPaymentPending || lead.hasManualPaymentHistory)
                                      );
                                    }}
                                    title={isActionDisabled ? "Actions are disabled for Closed - Lost leads" : "Open actions"}
                                  >
                                    <MoreVertical size={24} />
                                  </button>
                                </div>

                                {/* DIVIDER */}
                                <div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                                {/* 2. BODY: Row-based content */}
                                <div className="space-y-4 p-5">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                                      Intent Type
                                    </span>
                                    <IntentBadge intent={(lead.intent || "Hot") as any} size="sm" />
                                  </div>

                                  <div className="flex items-center justify-between gap-4">
                                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                                      Email ID
                                    </span>
                                    <span
                                      className={`text-sm truncate max-w-[160px] text-right font-medium cursor-help ${isDark ? "text-white/90" : "text-black/80"}`}
                                      title={lead.email}// This shows the full email on hover
                                    >
                                      {lead.email}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                                      Lead Type
                                    </span>
                                    <span className={`text-sm font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
                                      {lead.leadType}
                                    </span>
                                  </div>
                                </div >

                                {/* DIVIDER */}
                                < div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`
                                } />

                                {/* 3. FOOTER: Status Badge */}
                                <div className="flex items-center p-5">
                                  <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
                                </div>
                              </div >
                            );
                          })
                        )}
                        {Boolean(gridColumnLoadingByStatus?.[column.status]) && (
                          <div
                            className={`mt-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark
                              ? "border-white/10 bg-white/[0.03] text-white/70"
                              : "border-[#E8E0D2] bg-[#FFF9EF] text-[#6B6256]"
                              }`}
                          >
                            <Loader2 size={14} className="animate-spin" />
                            <span>Loading more leads...</span>
                          </div>
                        )}
                        <div
                          ref={(el) => { gridSentinelRefs.current[column.status] = el; }}
                          data-status={column.status}
                          className="h-px w-full opacity-0"
                        />
                      </div >
                    </div >
                  ))}
                </div >
              </div >
            </div >
          ) : (
            // <div className="w-full overflow-hidden lg:overflow-x-auto rounded-2xl">
            <div className={`w-full overflow-hidden rounded-2xl border ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0 table-fixed lg:table-auto">
                  <thead>
                    {/* Desktop Header: Visible on lg and above */}
                    <tr className={`hidden md:table-row text-sm font-medium transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
                      <th className={`p-3 lg:p-5 font-medium border-b rounded-tl-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Client Name</th>
                      <th className={`p-3 lg:p-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Email ID</th>
                      <th className={`p-3 lg:p-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Lead Type</th>
                      <th className={`p-3 lg:p-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Intent</th>
                      <th className={`p-3 lg:p-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Booking Status</th>
                      <th className={`p-3 lg:p-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Last Activity</th>
                      <th className={`p-3 lg:p-5 font-medium text-right border-b rounded-tr-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Action</th>
                    </tr>

                    {/* Mobile Header: Visible below md */}
                    <tr className={`md:hidden text-sm font-medium transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"}`}>
                      <th className={`p-4 border-b w-1/2 rounded-tl-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Client Name</th>
                      <th className={`p-4 border-b w-1/2 text-right rounded-tr-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>Status</th>
                    </tr>
                  </thead>

                  <tbody className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
                    {data.map((lead) => {
                      const isActionDisabled = isClosedLostStatus(String(lead.bookingStatus || ""));
                      const isExpanded = expandedRowId === lead.lead_id;

                      return (
                        <React.Fragment key={lead.lead_id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                setExpandedRowId(isExpanded ? null : lead.lead_id);
                              } else {
                                onRowClick(lead.lead_id);
                              }
                            }}
                            className={`group transition-colors cursor-pointer ${isDark ? "bg-[#171717] hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"} ${isExpanded && isDark ? "bg-[#202020]" : ""}`}
                          >
                            {/* Client Name (Shared) */}
                            <td
                              className={`w-1/2 lg:w-auto p-5 border-b group-last:border-0 min-w-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}
                              title={lead.clientName}
                            >
                              <div className="flex items-start gap-2 lg:gap-3 min-w-0">
                                <div className={`shrink-0 md:hidden h-6 w-6 transition-transform duration-200 rounded-full flex items-center justify-center border ${isExpanded ? "rotate-180 border-[#E8D1AB]" : "rotate-0 border-[#4B4B4B]"}`}>
                                  <ChevronDown size={16} className={isExpanded ? "text-[#E8D1AB]" : (isDark ? "text-[#777674]" : "text-[#999]")} />
                                </div>
                                <div className="shrink-0 w-10 h-10 lg:h-[50px] lg:w-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-semibold text-base lg:text-xl">
                                  {lead.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-medium text-sm lg:text-base truncate ${isDark ? "text-white" : "text-[#171717]"}`}>
                                    {lead.clientName}
                                  </p>
                                  <div className="mt-1">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${lead.registrationType === "registered"
                                        ? isDark
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        : isDark
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          : "bg-amber-100 text-amber-700 border border-amber-200"
                                        }`}
                                    >
                                      {lead.registrationType === "registered" ? "Registered" : "Guest"}
                                    </span>
                                  </div>
                                  <p className={`text-xs lg:text-sm mt-1 ${isDark ? "text-white/40" : "text-[#999]"}`}>
                                    {format(lead.date, "MMM dd, yyyy")}
                                  </p>
                                  {lead.bookingId ? (
                                    <p className={`text-xs ${isDark ? "text-white" : "text-[#171717]"}`}>
                                      #{lead.bookingId}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {/* Desktop Only Columns */}
                            <td className={`hidden md:table-cell p-3 lg:p-5 text-sm lg:text-base border-b ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"}`}>{lead.email}</td>
                            <td className={`hidden md:table-cell p-3 lg:p-5 text-sm lg:text-base border-b ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"}`}>{lead.leadType}</td>
                            <td className={`hidden md:table-cell p-3 lg:p-5 text-sm lg:text-base border-b ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"}`}>
                              <IntentBadge intent={(lead.intent || "Hot") as "Hot" | "Warm" | "Cold"} />
                            </td>
                            {/* Status Column (Shared - Responsive align) */}
                            <td className={`w-1/2 lg:w-auto p-3 lg:p-5 border-b text-right md:text-left group-last:border-0 min-w-0 overflow-hidden ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                              <div className="flex justify-end lg:justify-start overflow-hidden">
                                <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
                              </div>
                            </td>

                            {/* Desktop Columns (Unchanged) */}
                            <td className={`hidden md:table-cell p-3 lg:p-5 text-sm lg:text-base border-b group-last:border-0 ${isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"}`}>
                              <div className="space-y-1 min-w-0">
                                <p>{lead.lastActivity}</p>
                                {(lead.assignedSalesRepName || lead.assignedSalesRepEmail) && (
                                  <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                                    {lead.assignedSalesRepName || "Unassigned"}
                                    {lead.assignedSalesRepEmail ? ` - ${lead.assignedSalesRepEmail}` : ""}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className={`hidden md:table-cell p-3 lg:p-5 text-right border-b group-last:border-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                              <button
                                type="button"
                                disabled={isActionDisabled}
                                className={`p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white/40 hover:text-white" : "text-[#999] hover:text-[#171717]"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenMenu(
                                    e,
                                    lead.clientName,
                                    lead.lead_id,
                                    String(lead.bookingStatus || ""),
                                    Boolean(lead.isPaymentPending || lead.hasManualPaymentHistory)
                                  )
                                }}
                                title={isActionDisabled ? "Actions are disabled for Closed - Lost leads" : "Open actions"}
                              >
                                <MoreVertical size={18} />
                              </button>
                            </td>
                          </tr>

                          {/* Mobile Expanded Details */}
                          {isExpanded && (
                            <tr className="md:hidden">
                              <td colSpan={2} className={`px-5 py-0 border-b ${isDark ? "bg-[#202020] border-[#3D3D3D]" : "bg-[#F9F9F9] border-[#F0F0F0]"}`}>
                                <div className="grid grid-cols-2 gap-y-5 py-4">
                                  <div className="space-y-1 min-w-0">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Email ID</p>
                                    <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>{lead.email}</p>
                                  </div>
                                  <div className="space-y-1 text-right">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Lead Type</p>
                                    <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>{lead.leadType}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Last Activity</p>
                                    <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>{lead.lastActivity}</p>
                                    {(lead.assignedSalesRepName || lead.assignedSalesRepEmail) && (
                                      <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                                        {lead.assignedSalesRepName || "Unassigned"}
                                        {lead.assignedSalesRepEmail ? ` - ${lead.assignedSalesRepEmail}` : ""}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-right">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Intent</p>
                                    <IntentBadge intent={(lead.intent || "Hot") as "Hot" | "Warm" | "Cold"} />
                                  </div>
                                  <div className="space-y-1">
                                    <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Action</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenMenu(e, lead.clientName, lead.lead_id, String(lead.bookingStatus || ""), !!(lead.isPaymentPending || lead.hasManualPaymentHistory));
                                      }}
                                      className={`inline-flex items-center justify-center p-1 ${isDark ? "text-white" : "text-black"}`}
                                    >
                                      <MoreHorizontal size={28} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile & Desktop Pagination Container */}
              <div className={`p-4 md:p-6 border-t ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
                <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
                  {/* Showing Count */}
                  <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#999]"}`}>
                    Showing {data.length} leads
                  </div>
                  {/* Pagination Placeholder - Replace with your actual Pagination component */}
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPageChange(Math.max(1, currentPage - 1));
                      }}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                        ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                        : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                        }`}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPageChange(i + 1);
                          }}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === i + 1
                            ? "bg-[#E5D5B8] text-black"
                            : isDark
                              ? "text-white/60 hover:bg-white/5"
                              : "text-[#666] hover:bg-black/5"
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPageChange(Math.min(totalPages, currentPage + 1));
                      }}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                        ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                        : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                        }`}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div >
      </div >
    </div >
  );
}
