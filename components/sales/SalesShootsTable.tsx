"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Grid3X3, List, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { parseDate } from "@/src/components/landing/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileShootRow } from "@/components/admin/shoot-details/MobileShootRow";
import { StatusBadge } from "../admin/StatusBadge";
import { useTheme } from "next-themes";
import { resolveTimelineStage, timelineStageToDashboardLabel } from "@/lib/utils/projectTimeline";
import Lottie from "lottie-react";
import redAnimation from "@/public/animations/Red.json";
import yellowAnimation from "@/public/animations/Yellow.json";
import { MissingFieldsModal } from "@/components/admin/MissingFieldsModal";
// import BoardMiniMapNavigator from "../admin/BoardMiniMapNavigator";

type ShootStatus = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "Shoot Day" | "PostProduction" | "Revision" | "Completed" | "Assets Delivered" | "Unknown";
interface ShootRecord {
  id: string;
  sourceProject?: Record<string, unknown>;
  customerName: string;
  initials: string;
  date: string;
  category: string;
  price: string;
  status: ShootStatus;
  needsAttention?: {
    required: boolean;
    missing_fields: string[];
  };
}

const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const SALES_KANBAN_STATUS_ORDER: ShootStatus[] = [
  "Initiated",
  "PreProduction",
  "Shoot Day",
  "PostProduction",
  "Revision",
  "Completed",
  "Assets Delivered",
  "Cancelled",
];

const getCategoryFromContentType = (contentType: string | null | undefined): string => {
  if (!contentType) return "N/A";

  const normalizedTypes = contentType
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  const hasPhotographer = normalizedTypes.includes("photographer");
  const hasVideographer = normalizedTypes.includes("videographer");

  if (hasPhotographer && hasVideographer) return "Photography & Videography";
  if (hasPhotographer) return "Photography";
  if (hasVideographer) return "Videography";

  return "N/A";
};

export default function SalesShootsTable({ externalSelectedDate,
  statusFilter,
  setStatusFilter,
  range,
  setRange }: {
    externalSelectedDate?: Date | null, statusFilter: string;
    setStatusFilter: (v: string) => void,
    range: string,
    setRange: (v: string) => void
  }) {
  const router = useRouter();
  const columnScrollRefs = React.useRef<Partial<Record<ShootStatus, HTMLDivElement | null>>>({});
  const dragAutoScrollFrameRef = React.useRef<number | null>(null);
  const dragAutoScrollStatusRef = React.useRef<ShootStatus | null>(null);
  const dragAutoScrollDirectionRef = React.useRef<"up" | "down" | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredShootId, setHoveredShootId] = useState<string | null>(null);
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState(false);
  const [selectedShootIdForMissingFields, setSelectedShootIdForMissingFields] = useState<string | null>(null);
  const [selectedShootDataForMissingFields, setSelectedShootDataForMissingFields] = useState<Record<string, unknown> | null>(null);
  const [fieldsToShow, setFieldsToShow] = useState<string[]>([]);
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [kanbanOrder, setKanbanOrder] = useState<Record<ShootStatus, string[]>>({} as Record<ShootStatus, string[]>);
  const [draggedShootId, setDraggedShootId] = useState<string | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<ShootStatus | null>(null);
  const itemsPerPage = 10;

  // New filtering states
  // const [range, setRange] = useState<string>("month");
  // const [statusFilter, setStatusFilter] = useState<string>("all");
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    return () => {
      if (dragAutoScrollFrameRef.current !== null) {
        cancelAnimationFrame(dragAutoScrollFrameRef.current);
      }
    };
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // Sync external date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("month");
    }
  }, [externalSelectedDate, range]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { range };
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const projectsResponse = await adminApi.getProjects(params);

        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const statusLabel = timelineStageToDashboardLabel(resolveTimelineStage(project)) as ShootStatus;
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
          const missingFields = Array.isArray(project.needs_attention?.missing_fields)
            ? project.needs_attention.missing_fields
            : [];

          return {
            id: `#${project.stream_project_booking_id}`,
            sourceProject: project,
            customerName,
            initials,
            date: project.event_date ? (parseDate(project.event_date) || new Date(project.event_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: getCategoryFromContentType(project.content_type),
            price: (project.total_value_amount ?? project.total_paid_amount)
              ? `$${parseFloat(project.total_value_amount ?? project.total_paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "$0.00",
            status: statusLabel,
            needsAttention: project.needs_attention ? {
              required: missingFields.length > 0,
              missing_fields: missingFields
            } : undefined,
          };
        });
        setShoots(mappedShoots);
      } catch (error) {
        console.error("Failed to fetch shoots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, statusFilter, externalSelectedDate]);

  const listTotalPages = Math.max(1, Math.ceil(shoots.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);
  const visibleKanbanStatuses = useMemo(() => SALES_KANBAN_STATUS_ORDER, []);

  useEffect(() => {
    const nextOrder = {} as Record<ShootStatus, string[]>;

    visibleKanbanStatuses.forEach((status) => {
      const currentIds = shoots
        .filter((shoot) => shoot.status === status)
        .map((shoot) => shoot.id);

      const previousIds = kanbanOrder[status] || [];
      const preservedIds = previousIds.filter((id) => currentIds.includes(id));
      const appendedIds = currentIds.filter((id) => !preservedIds.includes(id));

      nextOrder[status] = [...preservedIds, ...appendedIds];
    });

    const hasOrderChanged =
      visibleKanbanStatuses.length !== Object.keys(kanbanOrder).length ||
      visibleKanbanStatuses.some((status) => {
        const prevIds = kanbanOrder[status] || [];
        const nextIds = nextOrder[status] || [];

        if (prevIds.length !== nextIds.length) return true;
        return nextIds.some((id, index) => prevIds[index] !== id);
      });

    if (hasOrderChanged) {
      setKanbanOrder(nextOrder);
    }
  }, [shoots, visibleKanbanStatuses, kanbanOrder]);

  const kanbanColumns = useMemo(() => {
    const grouped = new Map<ShootStatus, ShootRecord[]>();
    const gridStartIndex = (currentPage - 1) * itemsPerPage;

    visibleKanbanStatuses.forEach((status) => {
      grouped.set(status, []);
    });

    shoots.forEach((shoot) => {
      if (!visibleKanbanStatuses.includes(shoot.status)) return;
      const existing = grouped.get(shoot.status) || [];
      existing.push(shoot);
      grouped.set(shoot.status, existing);
    });

    return visibleKanbanStatuses.map((status) => {
      const items = grouped.get(status) || [];
      const itemMap = new Map(items.map((item) => [item.id, item]));
      const orderedIds = kanbanOrder[status] || items.map((item) => item.id);
      const orderedItems = orderedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is ShootRecord => Boolean(item));

      return {
        status,
        totalItems: orderedItems.length,
        items: orderedItems.slice(gridStartIndex, gridStartIndex + itemsPerPage),
      };
    });
  }, [shoots, visibleKanbanStatuses, kanbanOrder, currentPage]);

  const gridTotalPages = useMemo(() => {
    const maxColumnCount = Math.max(
      0,
      ...visibleKanbanStatuses.map(
        (status) => shoots.filter((shoot) => shoot.status === status).length
      )
    );

    return Math.max(1, Math.ceil(maxColumnCount / itemsPerPage));
  }, [shoots, visibleKanbanStatuses]);

  const totalPages = viewMode === "grid" ? gridTotalPages : listTotalPages;

  useEffect(() => {
    const nextPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (id: string) => {
    // Remove the # from the ID for the URL
    const cleanId = id.replace('#', '');
    // Navigate to SALES shoots detail page (NOT admin)
    router.push(`/sales/shoots/${cleanId}`);
  };

  const reorderKanbanItems = (status: ShootStatus, draggedId: string, targetId?: string) => {
    if (draggedId === targetId) return;

    setKanbanOrder((prev) => {
      const currentIds = prev[status] || [];
      const nextIds = [...currentIds];
      const fromIndex = nextIds.indexOf(draggedId);
      const targetIndex = typeof targetId === "string" ? nextIds.indexOf(targetId) : nextIds.length;

      if (fromIndex === -1 || targetIndex === -1) return prev;

      nextIds.splice(fromIndex, 1);
      const insertIndex = typeof targetId === "string"
        ? nextIds.indexOf(targetId) + (fromIndex < targetIndex ? 1 : 0)
        : nextIds.length;
      nextIds.splice(insertIndex === -1 ? nextIds.length : insertIndex, 0, draggedId);

      return {
        ...prev,
        [status]: nextIds,
      };
    });
  };

  const stopColumnAutoScroll = () => {
    if (dragAutoScrollFrameRef.current !== null) {
      cancelAnimationFrame(dragAutoScrollFrameRef.current);
      dragAutoScrollFrameRef.current = null;
    }

    dragAutoScrollStatusRef.current = null;
    dragAutoScrollDirectionRef.current = null;
  };

  const startColumnAutoScroll = (status: ShootStatus, direction: "up" | "down") => {
    dragAutoScrollStatusRef.current = status;
    dragAutoScrollDirectionRef.current = direction;

    if (dragAutoScrollFrameRef.current !== null) {
      return;
    }

    const step = () => {
      const activeStatus = dragAutoScrollStatusRef.current;
      const activeDirection = dragAutoScrollDirectionRef.current;

      if (!activeStatus || !activeDirection) {
        dragAutoScrollFrameRef.current = null;
        return;
      }

      const container = columnScrollRefs.current[activeStatus];
      if (!container) {
        dragAutoScrollFrameRef.current = null;
        return;
      }

      container.scrollTop += activeDirection === "up" ? -18 : 18;
      dragAutoScrollFrameRef.current = requestAnimationFrame(step);
    };

    dragAutoScrollFrameRef.current = requestAnimationFrame(step);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, status: ShootStatus) => {
    if (draggedStatus !== status) return;

    const container = columnScrollRefs.current[status];
    if (!container) return;

    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 72;

    if (e.clientY < rect.top + edgeThreshold) {
      startColumnAutoScroll(status, "up");
    } else if (e.clientY > rect.bottom - edgeThreshold) {
      startColumnAutoScroll(status, "down");
    } else {
      stopColumnAutoScroll();
    }
  };

  return (
    <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3>
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={(value) => { setRange(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select> 

           <div className={`hidden md:flex items-center rounded-lg border overflow-hidden ${
            isDark ? "bg-[#202020] border-white/5" : "bg-[#FAFAFA] border-[#E5E5E5]"
          }`}>
             <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-4 py-2.5 transition-colors ${
                viewMode === "list"
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : isDark
                    ? "bg-transparent text-white/40 hover:text-white"
                    : "bg-transparent text-[#666] hover:text-black"
              }`}
            >
              <List size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  : isDark
                    ? "bg-transparent text-white/40 hover:text-white"
                    : "bg-transparent text-[#666] hover:text-black"
              }`}
            >
              <Grid3X3 size={18} />
            </button>
           
          </div> 

         </div>
      </div> 

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : shoots.length === 0 ? (
        <div className={`py-20 text-center font-instrument-sans ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
      ) : (
        <>
          <div className={`lg:hidden transition-colors duration-300 ${isDark ? "bg-[#111111]" : ""}`}>
            <div className={`flex justify-between px-5 py-3 text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
              <span>Customer Name</span>
              <span>Status</span>
            </div>

            <div className="flex flex-col gap-2 ">
              {currentShoots.map((shoot, idx) => (
                <MobileShootRow
                  key={idx}
                  shoot={shoot}
                  onRowClick={handleRowClick}
                />
              ))}
            </div>
          </div>

          {viewMode === "list" ? (
            <>
              <div className="hidden lg:block w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                      <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Shoot ID</th>
                      <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Customer Name</th>
                      <th className="py-5 px-6 font-medium">Category</th>
                      <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Price</th>
                      <th className="py-5 px-6 font-medium">Status</th>
                      <th className="py-5 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentShoots.map((shoot, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(shoot.id)}
                        className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                      >
                        <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                          <div className="flex items-center gap-2">
                            {shoot.needsAttention?.required && (
                              <div
                                className="relative flex h-8 w-8 shrink-0 items-center justify-center"
                                onMouseEnter={() => setHoveredShootId(`list-${shoot.id}`)}
                                onMouseLeave={() => setHoveredShootId(null)}
                              >
                                <Lottie animationData={shoot.needsAttention.missing_fields.length >= 3 ? redAnimation : yellowAnimation} loop={true} />
                                <AnimatePresence>
                                  {hoveredShootId === `list-${shoot.id}` && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      className={`absolute left-full ml-3 top-1/2 z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium shadow-2xl pointer-events-none ${isDark
                                        ? "border border-white/10 bg-[#222] text-white"
                                        : "border border-gray-200 bg-white text-black"
                                      }`}
                                    >
                                      <div className="flex flex-col gap-1">
                                        <span className="mb-1 border-b border-white/10 pb-1 font-bold opacity-70">
                                          Attention Required:
                                        </span>
                                        {shoot.needsAttention.missing_fields.map((field, i) => (
                                          <span key={i} className="flex items-center gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-red-500" />
                                            {toTitleCase(field)}
                                          </span>
                                        ))}
                                      </div>
                                      <div className={`absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent ${isDark ? "border-t-[#222]" : "border-t-white"}`} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                            <span>{shoot.id}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                              {shoot.initials}
                            </div>
                            <div>
                              <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                              <p className={`text-xs mt-1.5 ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{shoot.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.category}</td>
                        <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.price}</td>
                        <td className="py-5 px-6">
                          <StatusBadge status={shoot.status} />
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button className={`transition-colors`}>
                            <ChevronRight size={20} className={isDark ? "text-[#666666]" : "text-[#999]"} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="relative hidden lg:block p-6 pt-5">
                <div ref={gridScrollRef} className="overflow-x-auto overflow-y-hidden pb-6">
                  <div className="flex items-start gap-5 min-w-max">
                    {kanbanColumns.map((column) => (
                      <div
                        key={column.status}
                        className={`w-[320px] shrink-0 rounded-[24px] ${isDark ? "bg-[#141414]" : "bg-[#FBF7EF]"
                          }`}
                      >
                        <div className={`flex items-center justify-between px-5 py-4 ${isDark ? "border-b border-white/5" : "border-b border-[#E8E0D2]"
                          }`}>
                          <div className="flex items-center gap-3">
                            <h4 className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                              {column.status}
                            </h4>
                            <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium ${isDark ? "bg-[#242424] text-white/70" : "bg-white text-[#666]"
                              }`}>
                              {column.totalItems}
                            </span>
                          </div>
                          {/* <StatusBadge status={column.status} /> */}
                        </div>

                        <div
                          ref={(node) => {
                            columnScrollRefs.current[column.status] = node;
                          }}
                          className="max-h-[620px] overflow-y-auto no-scrollbar px-4 py-4 space-y-3"
                          onDragOver={(e) => {
                            if (draggedStatus !== column.status) return;
                            handleColumnDragOver(e, column.status);
                          }}
                          onDrop={(e) => {
                            if (draggedStatus !== column.status || !draggedShootId) return;
                            e.preventDefault();
                            e.stopPropagation();
                            reorderKanbanItems(column.status, draggedShootId);
                            stopColumnAutoScroll();
                            setDraggedShootId(null);
                            setDraggedStatus(null);
                          }}
                          onDragLeave={(e) => {
                            const nextTarget = e.relatedTarget as Node | null;
                            if (nextTarget && e.currentTarget.contains(nextTarget)) return;
                            stopColumnAutoScroll();
                          }}
                        >
                          {column.items.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${isDark
                                ? "border-white/10 text-white/35"
                                : "border-[#E3D9C8] text-[#9A8F7C]"
                              }`}>
                              No shoots in this stage
                            </div>
                          ) : column.items.map((shoot, idx) => {
                            const missingFields = shoot.needsAttention?.missing_fields || [];
                            const hasMissingFields = missingFields.length > 0;

                            return (
                            <div
                              key={`${column.status}-${idx}`}
                              onClick={() => handleRowClick(shoot.id)}
                              draggable
                              onDragStart={() => {
                                setDraggedShootId(shoot.id);
                                setDraggedStatus(column.status);
                              }}
                              onDragEnd={() => {
                                stopColumnAutoScroll();
                                setDraggedShootId(null);
                                setDraggedStatus(null);
                              }}
                              onDragOver={(e) => {
                                if (draggedStatus !== column.status) return;
                                handleColumnDragOver(e, column.status);
                                e.stopPropagation();
                              }}
                              onDrop={(e) => {
                                if (draggedStatus !== column.status || !draggedShootId) return;
                                e.preventDefault();
                                e.stopPropagation();
                                reorderKanbanItems(column.status, draggedShootId, shoot.id);
                                stopColumnAutoScroll();
                                setDraggedShootId(null);
                                setDraggedStatus(null);
                              }}
                              className={`group cursor-pointer rounded-2xl border p-4 transition-all ${isDark
                                  ? "border-[#2F2F2F] bg-[#151515] hover:border-[#4A4A4A] hover:bg-[#1A1A1A]"
                                  : "border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
                                } ${draggedShootId === shoot.id ? "opacity-55" : ""}`}
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-sm shrink-0 ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"
                                }`}>
                                {shoot.initials}
                              </div>

                              <div className="mt-4 space-y-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#666666]" : "text-[#A3A3A3]"}`}>
                                      {shoot.id}
                                    </p>
                                    {hasMissingFields && (
                                      <div className="relative" onMouseEnter={() => setHoveredShootId(`grid-${shoot.id}`)} onMouseLeave={() => setHoveredShootId(null)}>
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFieldsToShow(missingFields);
                                            setSelectedShootIdForMissingFields(shoot.id.replace(/^#/, "").trim());
                                            setSelectedShootDataForMissingFields(shoot.sourceProject || null);
                                            setIsMissingFieldsModalOpen(true);
                                          }}
                                          className={`cursor-pointer text-[10px] font-medium px-2 py-0.5 rounded-full transition-transform hover:scale-105 ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}
                                        >
                                          Missing Info
                                        </span>

                                        <AnimatePresence>
                                          {hoveredShootId === `grid-${shoot.id}` && (
                                            <motion.div
                                              initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                              animate={{ opacity: 1, y: 0, scale: 1 }}
                                              exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                              transition={{ duration: 0.15, ease: "easeOut" }}
                                              className={`absolute bottom-full right-0 mb-2 z-[100] px-3 py-2 rounded-lg text-xs font-medium shadow-2xl whitespace-nowrap pointer-events-none ${isDark ? "bg-[#222] border border-white/10 text-white" : "bg-white border border-gray-200 text-black"}`}
                                            >
                                              <div className="flex flex-col gap-1">
                                                <span className="font-bold opacity-70 border-b border-white/10 pb-1 mb-1 flex items-center justify-between gap-4">
                                                  Attention Required
                                                </span>
                                                {missingFields.map((field, i) => (
                                                  <span key={i} className="flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-red-500" />
                                                    {toTitleCase(field)}
                                                  </span>
                                                ))}
                                              </div>
                                              <div className={`absolute top-full right-4 border-4 border-transparent ${isDark ? "border-t-[#222]" : "border-t-white"}`} />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>
                                  <h4 className={`mt-2 text-lg font-semibold leading-snug line-clamp-2 ${isDark ? "text-white" : "text-[#111111]"}`}>
                                    {shoot.customerName}
                                  </h4>
                                  <p className={`mt-1 text-sm ${isDark ? "text-[#8B8B8B]" : "text-[#777777]"}`}>
                                    {shoot.date}
                                  </p>
                                </div>

                                <div className={`rounded-xl p-3 ${isDark ? "bg-[#101010]" : "bg-[#FAF6EE]"}`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Category</p>
                                      <p className={`mt-1 text-sm font-medium line-clamp-2 ${isDark ? "text-[#F1F1F1]" : "text-[#222222]"}`}>
                                        {shoot.category}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Price</p>
                                      <p className={`mt-1 text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                                        {shoot.price}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <StatusBadge status={shoot.status} />
                                  <span className={`text-xs ${isDark ? "text-[#5F5F5F]" : "text-[#9A9A9A]"}`}>
                                    Open details
                                  </span>
                                </div>
                              </div>
                            </div>
                            );
                          })}
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
            </>
          )}

          {/* Pagination */}
          {!loading && shoots.length > 0 && (
            <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
                {viewMode === "grid"
                  ? `Showing up to ${itemsPerPage} cards per status column`
                  : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, shoots.length)} of ${shoots.length} entries`}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}>Previous</button>
                <div className="flex gap-1">
                  {(() => {
                    const range = [];
                    const delta = 1;
                    const left = currentPage - delta;
                    const right = currentPage + delta + 1;

                    for (let i = 1; i <= totalPages; i++) {
                      if (i === 1 || i === totalPages || (i >= left && i < right)) {
                        range.push(i);
                      } else if (i === left - 1 || i === right) {
                        range.push('...');
                      }
                    }

                    return range.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
                      page === '...' ? (
                        <span key={`dots-${index}`} className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}>...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page ? (isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black") : (isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100")}`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <MissingFieldsModal
        isOpen={isMissingFieldsModalOpen}
        onClose={() => setIsMissingFieldsModalOpen(false)}
        isDark={isDark}
        fields={fieldsToShow}
        shootId={selectedShootIdForMissingFields ?? undefined}
        initialShootData={selectedShootDataForMissingFields}
      />
    </div>
  );
}
