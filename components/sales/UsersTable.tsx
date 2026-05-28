"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, List, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { useTheme } from "next-themes";
// import BoardMiniMapNavigator from "../admin/BoardMiniMapNavigator";

type MobileUserLike = {
  imageUrl?: string | null;
  name?: string;
  initials?: string;
  joinDate?: string;
  id?: string;
  bookingId?: string;
  bookingStatus?: string;
  status?: string;
};

function MobileUserRow<T>({
  item,
  renderMobileDetails
}: {
  item: T;
  renderMobileDetails: (item: T) => React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const data = item as MobileUserLike;

  return (
    <div className={`border rounded-xl overflow-hidden mb-3 lg:hidden transition-all duration-300 ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-[#E5E5E5]"}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`shrink-0 p-1 rounded-full border transition-all duration-300 ${isExpanded ? "rotate-180 border-[#E5D5B8]" : isDark ? "border-white/10" : "border-black/10"}`}>
            <ChevronDown size={14} className={isDark ? "text-white/60" : "text-black/60"} />
          </div>
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#F5D5D5] flex items-center justify-center text-black font-bold text-xs overflow-hidden">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <span>{data.initials}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-[#171717]"}`}>{data.name}</span>
            <span className={`text-[10px] truncate ${isDark ? "text-white/40" : "text-[#999]"}`}>
              {data.joinDate || data.id}
            </span>
            {data.bookingId ? (
              <span className={`text-[10px] truncate ${isDark ? "text-white" : "text-[#171717]"}`}>
                #{data.bookingId}
              </span>
            ) : null}
          </div>
        </div>
        <LeadsStatusBadge status={data.bookingStatus || data.status || "Unknown"} />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t transition-colors duration-300 ${isDark ? "border-white/5 bg-black/20" : "border-[#F0F0F0] bg-[#FFFCF6]"}`}
          >
            {renderMobileDetails(item)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props<T> {
  data: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  headers: string[];
  renderRow: (item: T, isExpanded: boolean) => React.ReactNode;
  renderMobileDetails: (item: T) => React.ReactNode;
  onPageChange: (page: number) => void;
  enableKanbanView?: boolean;
  activeStatusFilter?: string;
  kanbanStatuses?: string[];
  getItemId?: (item: T) => string;
  getItemStatus?: (item: T) => string | undefined;
  renderKanbanCard?: (item: T) => React.ReactNode;
  viewMode?: "list" | "grid";
  onRowClick?: (item: T) => void;
}

const normalizeKanbanStatus = (value?: string) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "Unknown";
  // Added support for multiple dash types (– and -)
  if (normalized.includes("signed up")) return "Signed Up - Lead Created";
  if (normalized.includes("book a shoot")) return "Book a shoot - Lead Created";
  if (normalized.includes("manual")) return "Manual - Lead Created";
  if (normalized.includes("in progress") || normalized === "in-progress") return "Booking In Progress";
  if (normalized.includes("proposal") || normalized.includes("link sent")) return "Proposal Sent";
  if (normalized === "ready for payment") return "Ready for Payment";
  if (normalized === "payment/invoice sent") return "Payment/Invoice Sent";
  if (normalized === "booked" || normalized === "paid") return "Booked";
  if (normalized.includes("closed") || normalized.includes("lost") || normalized === "cancelled") return "Closed - Lost";

  return value || "Unknown";
};

export default function UsersTable<T>({
  data,
  loading,
  currentPage,
  totalPages,
  totalRecords,
  limit,
  headers,
  renderRow,
  renderMobileDetails,
  onPageChange,
  enableKanbanView = false,
  activeStatusFilter = "All",
  kanbanStatuses = [],
  getItemId,
  getItemStatus,
  renderKanbanCard,
  viewMode = "list",
  onRowClick,
}: Props<T>) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [kanbanOrder, setKanbanOrder] = useState<Record<string, string[]>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<string | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const gridPanStateRef = useRef<{ startX: number; scrollLeft: number; isActive: boolean }>({
    startX: 0,
    scrollLeft: 0,
    isActive: false,
  });
  const [isGridPanning, setIsGridPanning] = useState(false);

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

  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;

  // Safety check: slice the data for List view, use all data for Grid view
  const paginatedData = viewMode === "list"
    ? data.slice(startIndex, endIndex)
    : data;

  // Logic for page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const STATUS_ORDER = [
    "Booking In Progress",
    "Booked",
    "Signed Up - Lead Created",
    "Book a shoot - Lead Created",
    "Manual - Lead Created",

    "Proposal Sent",
    "Ready for Payment",
    "Payment/Invoice Sent",

    "Approved",
    "Rejected",
    "Pending",

    "Closed - Lost",
    "Unknown"
  ];

  const canShowGrid = Boolean(enableKanbanView && getItemId && getItemStatus && renderKanbanCard);

  const visibleStatuses = useMemo(() => {
    if (activeStatusFilter !== "All") {
      return [normalizeKanbanStatus(activeStatusFilter)];
    }

    const dynamicStatuses = canShowGrid
      ? data.map((item) => normalizeKanbanStatus(getItemStatus?.(item))).filter(Boolean)
      : [];

    const merged = Array.from(new Set([
      ...kanbanStatuses.map((status) => normalizeKanbanStatus(status)),
      ...dynamicStatuses
    ]));

    const strictList = merged.filter(status =>
      STATUS_ORDER.includes(status) && status !== "Unknown"
    );

    return strictList.sort((a, b) => {
      return STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b);
    });
  }, [activeStatusFilter, canShowGrid, data, getItemStatus, kanbanStatuses]);

  useEffect(() => {
    if (!canShowGrid || !getItemId || !getItemStatus) return;

    const nextOrder: Record<string, string[]> = {};

    visibleStatuses.forEach((status) => {
      const currentIds = data
        .filter((item) => normalizeKanbanStatus(getItemStatus(item)) === status)
        .map((item) => getItemId(item));

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
  }, [canShowGrid, data, getItemId, getItemStatus, kanbanOrder, visibleStatuses]);

  const kanbanColumns = useMemo(() => {
    if (!canShowGrid || !getItemId || !getItemStatus) return [];

    return visibleStatuses.map((status) => {
      const items = data.filter((item) => normalizeKanbanStatus(getItemStatus(item)) === status);
      const itemMap = new Map(items.map((item) => [getItemId(item), item]));
      const orderedIds = kanbanOrder[status] || items.map((item) => getItemId(item));
      const orderedItems = orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is T => Boolean(item));

      return {
        status,
        totalItems: orderedItems.length,
        items: orderedItems,
      };
    });
  }, [canShowGrid, data, getItemId, getItemStatus, kanbanOrder, visibleStatuses]);

  const reorderKanbanItems = (status: string, draggedId: string, targetId?: string) => {
    if (draggedId === targetId) return;

    setKanbanOrder((prev) => {
      const currentIds = prev[status] || [];
      const nextIds = [...currentIds];
      const fromIndex = nextIds.indexOf(draggedId);
      const targetIndex = typeof targetId === "string" ? nextIds.indexOf(targetId) : nextIds.length;

      if (fromIndex === -1 || targetIndex === -1) {
        return prev;
      }

      nextIds.splice(fromIndex, 1);
      const insertIndex =
        typeof targetId === "string"
          ? nextIds.indexOf(targetId) + (fromIndex < targetIndex ? 1 : 0)
          : nextIds.length;
      nextIds.splice(insertIndex === -1 ? nextIds.length : insertIndex, 0, draggedId);

      return {
        ...prev,
        [status]: nextIds,
      };
    });
  };

  if (loading && data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
        <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${isDark ? "text-white/60 border-[#3D3D3D] bg-[#171717]" : "text-black/40 border-[#E5E5E5] bg-white"}`}>
        <p>No leads found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`w-full overflow-hidden transition-all duration-300 ${viewMode === "list"
        ? `rounded-2xl border ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`
        : "bg-transparent border-transparent"
        }`}>
        <div className={`transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>

          {viewMode === "grid" ? (
            /* GRID VIEW: Unified Mobile & Desktop per Reference */
            <div className="relative block">
              <div
                ref={gridScrollRef}
                className={`overflow-x-auto overflow-y-hidden pb-6 ${isGridPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
                onMouseDown={handleGridMouseDown}
                onMouseMove={handleGridMouseMove}
                onMouseUp={handleGridMouseEnd}
                onMouseLeave={handleGridMouseEnd}
              >
                <div className="flex items-start gap-5 min-w-max px-4">
                  {kanbanColumns.map((column) => (
                    <div
                      key={column.status}
                      className={`w-[calc(100vw-48px)] md:w-[320px] shrink-0 rounded-3xl border h-fit ${isDark ? "bg-[#0A0A0A] border-[#FFFFFF33]" : "bg-[#FBF7EF] border-[#E8E0D2]"}`}
                    >
                      <div className={`flex items-center justify-between w-full px-5 py-4 sticky top-[-1px] z-20 rounded-t-[22px] border-b ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E8D1AB] bg-[#FBF7EF]"
                        }`}>
                        <h4 className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                          {column.status}
                        </h4>
                        <span className={`text-sm font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                          {column.totalItems}
                        </span>
                      </div>

                      <div className="max-h-[620px] overflow-y-auto no-scrollbar px-4 py-4 space-y-3"
                      // onDragOver={(e) => draggedStatus === column.status && e.preventDefault()}
                      // onDrop={(e) => {
                      //   if (draggedStatus !== column.status || !draggedItemId) return;
                      //   e.preventDefault();
                      //   e.stopPropagation();
                      //   reorderKanbanItems(column.status, draggedItemId);
                      //   setDraggedItemId(null);
                      //   setDraggedStatus(null);
                      // }}
                      >
                        {column.items.length === 0 ? (
                          <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark ? "border-white/10 text-white/35" : "border-[#E3D9C8] text-[#9A8F7C]"}`}>
                            No users in this stage
                          </div>
                        ) : (
                          column.items.map((item) => {
                            const itemId = getItemId!(item);

                            return (
                              <div
                                key={itemId}
                                draggable
                                onDragStart={() => {
                                  setDraggedItemId(itemId);
                                  setDraggedStatus(column.status);
                                }}
                                onDragEnd={() => {
                                  setDraggedItemId(null);
                                  setDraggedStatus(null);
                                }}
                                onDragOver={(e) => {
                                  if (draggedStatus !== column.status) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  if (draggedStatus !== column.status || !draggedItemId) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  reorderKanbanItems(column.status, draggedItemId, itemId);
                                  setDraggedItemId(null);
                                  setDraggedStatus(null);
                                }}
                                // PERFECT SINGLE BOX WRAPPER
                                className={`group cursor-pointer rounded-2xl border transition-all duration-200 ${isDark
                                  ? "border-[#2F2F2F] bg-[#1A1A1A] hover:border-[#4A4A4A]"
                                  : "border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
                                  } ${draggedItemId === itemId ? "opacity-50 scale-95" : "opacity-100"}`}
                              >
                                {renderKanbanCard!(item)}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/*
              <BoardMiniMapNavigator
                boardRef={gridScrollRef}
                segmentCount={kanbanColumns.length}
                isDark={isDark}
                visible={viewMode === "grid"}
                syncKey={kanbanColumns.map((column) => `${column.status}:${column.items.length}`).join("|")}
              />
              */}
            </div>
          ) : (
            /* LIST VIEW: Responsive Table with Expandable Rows (No MobileUserRow) */
            <div className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0 table-fixed lg:table-auto">
                  <thead>
                    {/* Desktop Header */}
                    <tr className={`hidden md:table-row text-sm font-medium ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"}`}>
                      {headers.map((header, idx) => (
                        <th key={header} className={`p-5 border-b ${isDark ? "border-[#333]" : "border-[#E5E5E5]"} ${idx === 0 ? "rounded-tl-2xl" : ""} ${idx === headers.length - 1 ? "rounded-tr-2xl text-right" : ""}`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                    {/* Mobile Header */}
                    <tr className={`md:hidden text-sm font-medium ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"}`}>
                      <th className={`p-4 border-b w-1/2 rounded-tl-2xl ${isDark ? "border-[#333]" : "border-[#E5E5E5]"}`}>User Info</th>
                      <th className={`p-4 border-b w-1/2 text-right rounded-tr-2xl ${isDark ? "border-[#333]" : "border-[#E5E5E5]"}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => {
                      const id = getItemId!(item);
                      const isExpanded = expandedRowId === id;
                      return (
                        <React.Fragment key={id}>
                          <tr
                            onClick={() => {
                              setExpandedRowId(isExpanded ? null : id);
                              onRowClick?.(item);
                            }}
                            className={`group transition-colors cursor-pointer ${isDark ? "bg-[#171717] hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"} ${isExpanded && isDark ? "bg-[#202020]" : ""}`}
                          >
                            {/* This td renders the custom renderRow content but logic wraps it for mobile toggle */}
                            {renderRow(item, isExpanded)}
                          </tr>
                          {isExpanded && (
                            <tr className="md:hidden">
                              <td colSpan={headers.length} className={`p-5 pt-0 border-b ${isDark ? "bg-[#202020] border-[#3D3D3D]" : "bg-[#F9F9F9] border-[#F0F0F0]"}`}>
                                {renderMobileDetails!(item)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER - Integrated inside the list container */}
              {!loading && totalPages > 1 && (
                <div className={`p-4 md:p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
                  <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
                    {/* Showing Count */}
                    <div className={`hidden lg:block text-sm font-medium ${isDark ? "text-white/40" : "text-[#999]"}`}>
                      {paginatedData.length > 0 ? (
                        <>
                          Showing{" "}
                          <span className={isDark ? "text-white/80" : "text-black"}>
                            {/* Start: (Current Page - 1) * Limit + 1 */}
                            {((currentPage - 1) * limit) + 1}
                          </span>{" "}
                          to{" "}
                          <span className={isDark ? "text-white/80" : "text-black"}>
                            {/* End: Current Start + current slice length */}
                            {Math.min(((currentPage - 1) * limit) + paginatedData.length, totalRecords)}
                          </span>{" "}
                          of{" "}
                          <span className={isDark ? "text-white/80" : "text-black"}>
                            {/* Total: The total records from the API */}
                            {Number(totalRecords) || 0}
                          </span>{" "}
                          results
                        </>
                      ) : (
                        "No results found"
                      )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); onPageChange(Math.max(1, currentPage - 1)); }}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                          }`}
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-1">
                        {getPageNumbers().map((page, idx) => (
                          <button
                            key={idx}
                            disabled={page === "..."}
                            onClick={(e) => { e.stopPropagation(); typeof page === "number" && onPageChange(page); }}
                            className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg transition-all ${page === currentPage
                              ? "bg-[#E5D5B8] text-black shadow-sm"
                              : page === "..."
                                ? "cursor-default opacity-50"
                                : isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-black/5"
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onPageChange(Math.min(totalPages, currentPage + 1)); }}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
