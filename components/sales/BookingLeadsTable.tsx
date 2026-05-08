"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { MoreVertical, Loader2, Grid3X3, List } from "lucide-react";
import { LeadsStatusBadge, BookingStatus } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "./IntentBadge";
import { useTheme } from "next-themes";

interface LeadData {
  lead_id: number;
  bookingId?: string;
  clientName: string;
  email: string;
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
  onViewModeChange?: (mode: "list" | "grid") => void;
  onPageChange: (page: number) => void;
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
  onViewModeChange,
  onPageChange,
  onRowClick,
  onOpenMenu,
}: LeadsTableProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [kanbanOrder, setKanbanOrder] = useState<Record<string, number[]>>({});
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<string | null>(null);

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [onViewModeChange, viewMode]);

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

  if (loading && data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${
          isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
        }`}
      >
        <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center py-20 border rounded-2xl transition-colors duration-300 ${
          isDark ? "text-white/60 border-[#3D3D3D] bg-[#171717]" : "text-black/40 border-[#E5E5E5] bg-white"
        }`}
      >
        <p>No leads found</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"
      }`}
    >
      {/* <div
        className={`hidden lg:flex items-center justify-end gap-2 px-6 py-4 border-b ${
          isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-[#FFFCF6]"
        }`}
      >
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
      </div> */}

      <div className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
        {viewMode === "grid" ? (
          <div className="hidden lg:block p-6">
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
              <div className="flex items-start gap-5 min-w-max">
                {kanbanColumns.map((column) => (
                  <div
                    key={column.status}
                    className={`w-[320px] shrink-0 rounded-[24px] ${
                      isDark ? "bg-[#141414]" : "bg-[#FBF7EF]"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between px-5 py-4 ${
                        isDark ? "border-b border-white/5" : "border-b border-[#E8E0D2]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <h4 className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                          {column.status}
                        </h4>
                        <span
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium ${
                            isDark ? "bg-[#242424] text-white/70" : "bg-white text-[#666]"
                          }`}
                        >
                          {column.totalItems}
                        </span>
                      </div>
                    </div>

                    <div
                      className="h-[500px] overflow-y-auto  px-4 py-4 space-y-3 no-scrollbar"
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
                        <div
                          className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${
                            isDark ? "border-white/10 text-white/35" : "border-[#E3D9C8] text-[#9A8F7C]"
                          }`}
                        >
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
    className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
      isDark
        ? "border-[#2F2F2F] bg-[#1A1A1A] hover:border-[#4A4A4A]"
        : "border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
    } ${draggedLeadId === lead.lead_id ? "opacity-50 scale-95" : "opacity-100"}`}
  >
    {/* 1. HEADER: Avatar, Name, Date, Menu */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-sm shrink-0">
          {lead.clientName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)}
        </div>
        <div>
          <h4 className={`text-[16px] font-semibold leading-tight ${isDark ? "text-white" : "text-[#111111]"}`}>
            {lead.clientName}
          </h4>
          <p className={`text-sm mt-1 font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
            {format(lead.date, "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={isActionDisabled}
        className={`p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black"}`}
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
        <MoreVertical size={20} />
      </button>
    </div>

    {/* DIVIDER */}
    <div className={`my-4 h-[1px] w-full ${isDark ? "bg-white/10" : "bg-black/5"}`} />

    {/* 2. BODY: Row-based content */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isDark ? "text-[#C5A47E]" : "text-[#8C6A00]"}`}>
          Intent Type
        </span>
        <IntentBadge intent={(lead.intent || "Hot") as any} size="sm" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className={`text-sm font-medium ${isDark ? "text-[#C5A47E]" : "text-[#8C6A00]"}`}>
          Email ID
        </span>
        <span className={`text-sm truncate max-w-[160px] text-right font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
          {lead.email}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isDark ? "text-[#C5A47E]" : "text-[#8C6A00]"}`}>
          Lead Type
        </span>
        <span className={`text-sm font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
          {lead.leadType}
        </span>
      </div>
    </div>

    {/* DIVIDER */}
    <div className={`my-4 h-[1px] w-full ${isDark ? "bg-white/10" : "bg-black/5"}`} />

    {/* 3. FOOTER: Status Badge */}
    <div className="flex items-center">
      <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
    </div>
  </div>
);
})
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"
                  }`}
                >
                  <th className={`p-3 lg:py-5 font-medium border-b rounded-tl-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Client Name
                  </th>
                  <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Email ID
                  </th>
                  <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Lead Type
                  </th>
                  <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Intent
                  </th>
                  <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Booking Status
                  </th>
                  <th className={`p-3 lg:py-5 font-medium border-b ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Last Activity
                  </th>
                  <th className={`p-3 lg:py-5 font-medium text-right border-b rounded-tr-2xl ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className={`transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
                {data.map((lead) => {
                  const isActionDisabled = isClosedLostStatus(String(lead.bookingStatus || ""));

                  return (
                  <tr
                    key={lead.lead_id}
                    onClick={() => onRowClick(lead.lead_id)}
                    className={`group transition-colors cursor-pointer ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                  >
                    <td className={`p-3 lg:py-5 border-b group-last:border-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:h-[50px] lg:w-[50px] rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-semibold text-base lg:text-xl">
                          {lead.clientName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <p className={`font-medium text-sm lg:text-base ${isDark ? "text-white" : "text-[#171717]"}`}>{lead.clientName}</p>
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
                    <td
                      className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 text-balance ${
                        isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                      }`}
                    >
                      {lead.email}
                    </td>
                    <td
                      className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${
                        isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                      }`}
                    >
                      {lead.leadType}
                    </td>
                    <td
                      className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${
                        isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                      }`}
                    >
                      <IntentBadge intent={(lead.intent || "Hot") as "Hot" | "Warm" | "Cold"} />
                    </td>
                    <td className={`p-3 lg:py-5 border-b group-last:border-0 shrink-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                      <LeadsStatusBadge status={lead.bookingStatus || "Unknown"} />
                    </td>
                    <td
                      className={`p-3 lg:py-5 text-sm lg:text-base border-b group-last:border-0 ${
                        isDark ? "text-white/80 border-[#222]" : "text-[#333] border-[#F0F0F0]"
                      }`}
                    >
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
                    <td className={`p-3 lg:py-5 text-right border-b group-last:border-0 ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                      <button
                        type="button"
                        disabled={isActionDisabled}
                        className={`p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white/40 hover:text-white" : "text-[#999] hover:text-[#171717]"}`}
                        onClick={(e) =>
                          onOpenMenu(
                            e,
                            lead.clientName,
                            lead.lead_id,
                            String(lead.bookingStatus || ""),
                            Boolean(lead.isPaymentPending || lead.hasManualPaymentHistory)
                          )
                        }
                        title={isActionDisabled ? "Actions are disabled for Closed - Lost leads" : "Open actions"}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div
          className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${
            isDark ? "border-t-[#3D3D3D] bg-[#171717]" : "border-t-[#E5E5E5] bg-[#FFFCF6]"
          }`}
        >
          <div className={`text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
            {viewMode === "grid"
              ? `Showing ${((currentPage - 1) * limit) + 1} to ${Math.min(currentPage * limit, totalRecords)} of ${totalRecords} leads across status columns`
              : `Showing ${((currentPage - 1) * limit) + 1} to ${Math.min(currentPage * limit, totalRecords)} of ${totalRecords} leads`}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                  : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
              }`}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageChange(i + 1);
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                onPageChange(Math.min(totalPages, currentPage + 1));
              }}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${
                isDark
                  ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
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
