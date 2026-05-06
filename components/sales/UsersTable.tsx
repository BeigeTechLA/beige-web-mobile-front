"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronDown, Grid3X3, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { useTheme } from "next-themes";

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
  renderRow: (item: T) => React.ReactNode;
  renderMobileDetails: (item: T) => React.ReactNode;
  onPageChange: (page: number) => void;
  enableKanbanView?: boolean;
  activeStatusFilter?: string;
  kanbanStatuses?: string[];
  getItemId?: (item: T) => string;
  getItemStatus?: (item: T) => string | undefined;
  renderKanbanCard?: (item: T) => React.ReactNode;
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
  if (normalized === "payment sent") return "Payment Sent";
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
}: Props<T>) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [kanbanOrder, setKanbanOrder] = useState<Record<string, string[]>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<string | null>(null);

  const STATUS_ORDER = [
    "Booking In Progress",
    "Booked",
  "Signed Up - Lead Created",
  "Book a shoot - Lead Created",
  "Manual - Lead Created",
  
  "Proposal Sent",
  "Ready for Payment",
  "Payment Sent",
  
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

  return (
    <div className="space-y-6">
      <div className={`hidden lg:block w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#171717] border-[#333]" : "bg-white border-[#E5E5E5]"}`}>
        {canShowGrid && (
          <div className={`flex items-center justify-end gap-2 px-6 py-4 border-b ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-[#FFFCF6]"}`}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "list"
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
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "grid"
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

        {viewMode === "grid" && canShowGrid ? (
          <div className="p-6">
            {loading && data.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
              </div>
            ) : data.length === 0 ? (
              <div className={`py-20 text-center ${isDark ? "text-[#888]" : "text-[#999]"}`}>No users found.</div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
                <div className="flex items-start gap-5 min-w-max">
                  {kanbanColumns.map((column) => (
                    <div
                      key={column.status}
                      className={`w-[320px] shrink-0 rounded-[24px] ${isDark ? "bg-[#141414]" : "bg-[#FBF7EF]"}`}
                    >
                      <div className={`flex items-center justify-between px-5 py-4 ${isDark ? "border-b border-white/5" : "border-b border-[#E8E0D2]"}`}>
                        <div className="flex items-center gap-3">
                          <h4 className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                            {column.status}
                          </h4>
                          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium ${isDark ? "bg-[#242424] text-white/70" : "bg-white text-[#666]"}`}>
                            {column.totalItems}
                          </span>
                        </div>
                      </div>

                      <div
                        className="min-h-[220px] px-4 py-4 space-y-3"
                        onDragOver={(e) => {
                          if (draggedStatus !== column.status) return;
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (draggedStatus !== column.status || !draggedItemId) return;
                          e.preventDefault();
                          e.stopPropagation();
                          reorderKanbanItems(column.status, draggedItemId);
                          setDraggedItemId(null);
                          setDraggedStatus(null);
                        }}
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
      className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
        isDark
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
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-sm transition-colors duration-300 ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
                  {headers.map((header, idx) => (
                    <th key={header} className={`py-5 px-6 font-medium ${idx === headers.length - 1 ? "text-right" : ""}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={headers.length} className="py-20 text-center">
                      <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className={`py-20 text-center ${isDark ? "text-[#888]" : "text-[#999]"}`}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  data.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lg:hidden">
        {loading && data.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
          </div>
        ) : (
          data.map((item, idx) => (
            <MobileUserRow key={idx} item={item} renderMobileDetails={renderMobileDetails} />
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 border rounded-2xl gap-4 transition-all duration-300 ${isDark ? "border-[#333] bg-[#171717]" : "border-[#E5E5E5] bg-[#FFFCF6]"}`}>
          <div className={`text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            {viewMode === "grid" && canShowGrid
              ? `Showing ${(currentPage - 1) * limit + 1} to ${Math.min(currentPage * limit, totalRecords)} of ${totalRecords} results across status columns`
              : `Showing ${(currentPage - 1) * limit + 1} to ${Math.min(currentPage * limit, totalRecords)} of ${totalRecords} results`}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                    currentPage === i + 1
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
