"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ChevronRight, Loader2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown, Grid3X3, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MobileShootRow } from "@/components/production-manager/shoot-details/MobileShootRow";
import { StatusBadge } from "./StatusBadge";
import { useTheme } from "next-themes";
import { resolveTimelineStage, timelineStageToDashboardLabel } from "@/lib/utils/projectTimeline";

type ShootStatus = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "Shoot Day" | "PostProduction" | "Revision" | "Completed" | "Assets Delivered" | "Unknown";

interface ShootRecord {
    id: string;
    customerName: string;
    initials: string;
    date: string;
    rawDate: number; // Added for correct chronological sorting
    category: string;
    price: string;
    rawPrice: number; // Added for correct numerical sorting
    status: ShootStatus;
}

const KANBAN_STATUS_ORDER: ShootStatus[] = [
    "Initiated",
    "PreProduction",
    "Shoot Day",
    "PostProduction",
    "Revision",
    "Completed",
    "Assets Delivered",
    "Cancelled",
];

const FILTER_STATUS_COLUMN_MAP: Record<string, ShootStatus> = {
    Initiated: "Initiated",
    PreProduction: "PreProduction",
    "Shoot Day": "Shoot Day",
    PostProduction: "PostProduction",
    Revision: "Revision",
    Completed: "Completed",
    "Assets Delivered": "Assets Delivered",
    Cancelled: "Cancelled",
};

export const ShootsTable = ({ externalSelectedDate }: { externalSelectedDate?: Date | null }) => {
    const router = useRouter();
    const { canDelete } = usePermissions("shoots");
    const columnScrollRefs = React.useRef<Partial<Record<ShootStatus, HTMLDivElement | null>>>({});
    const dragAutoScrollFrameRef = React.useRef<number | null>(null);
    const dragAutoScrollStatusRef = React.useRef<ShootStatus | null>(null);
    const dragAutoScrollDirectionRef = React.useRef<"up" | "down" | null>(null);
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [shoots, setShoots] = useState<ShootRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [kanbanOrder, setKanbanOrder] = useState<Record<ShootStatus, string[]>>({} as Record<ShootStatus, string[]>);
    const [draggedShootId, setDraggedShootId] = useState<string | null>(null);
    const [draggedStatus, setDraggedStatus] = useState<ShootStatus | null>(null);
    const itemsPerPage = 10;

    // Filtering states
    const [range, setRange] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // --- SORTING STATE ---
    const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
        key: 'rawDate',
        direction: null,
    });

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        return () => {
            if (dragAutoScrollFrameRef.current !== null) {
                cancelAnimationFrame(dragAutoScrollFrameRef.current);
            }
        };
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    useEffect(() => {
        if (externalSelectedDate) {
            setRange("custom");
        } else if (range === "custom") {
            setRange("all");
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
                if (categoryFilter !== "all") {
                    params.category = categoryFilter;
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

                    // Sorting Helpers
                    const dateObj = project.event_date ? parseISO(project.event_date) : new Date(0);
                    const priceValue = project.total_paid_amount
                        ? parseFloat(project.total_paid_amount)
                        : project.budget ? parseFloat(project.budget) : 0;

                    return {
                        id: `#${project.stream_project_booking_id}`,
                        customerName,
                        initials,
                        date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
                        rawDate: dateObj.getTime(),
                        category: project.event_type_labels || "N/A",
                        price: project.total_paid_amount
                            ? `$${parseFloat(project.total_paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : project.budget
                                ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "$0.00",
                        rawPrice: priceValue,
                        status: statusLabel,
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
    }, [range, statusFilter, categoryFilter, externalSelectedDate]);

    // --- CLIENT-SIDE PROCESSING (Search + Sort) ---
    const processedShoots = useMemo(() => {
        // 1. Filter
        let result = shoots.filter((shoot) =>
            shoot.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shoot.id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 2. Sort
        if (sortConfig.direction !== null) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'id') {
                    aValue = parseInt(a.id.replace('#', ''), 10);
                    bValue = parseInt(b.id.replace('#', ''), 10);
                } else if (sortConfig.key === 'customerName') {
                    // As requested: clicking Project Name sorts by Date
                    aValue = a.rawDate;
                    bValue = b.rawDate;
                } else if (sortConfig.key === 'price') {
                    aValue = a.rawPrice;
                    bValue = b.rawPrice;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [shoots, searchQuery, sortConfig]);

    const requestSort = (key: keyof ShootRecord) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof ShootRecord) => {
        if (sortConfig.key !== key || sortConfig.direction === null) {
            return <ArrowUpDown size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
            : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
    };

    const listTotalPages = Math.max(1, Math.ceil(processedShoots.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentShoots = processedShoots.slice(startIndex, startIndex + itemsPerPage);
    const visibleKanbanStatuses = useMemo(() => {
        if (statusFilter !== "all") {
            const selectedStatus = FILTER_STATUS_COLUMN_MAP[statusFilter];
            return selectedStatus ? [selectedStatus] : [];
        }

        return KANBAN_STATUS_ORDER;
    }, [statusFilter]);

    useEffect(() => {
        const nextOrder = {} as Record<ShootStatus, string[]>;

        visibleKanbanStatuses.forEach((status) => {
            const currentIds = processedShoots
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
    }, [processedShoots, visibleKanbanStatuses, kanbanOrder]);

    const kanbanColumns = useMemo(() => {
        const grouped = new Map<ShootStatus, ShootRecord[]>();
        const gridStartIndex = (currentPage - 1) * itemsPerPage;

        visibleKanbanStatuses.forEach((status) => {
            grouped.set(status, []);
        });

        processedShoots.forEach((shoot) => {
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
    }, [processedShoots, visibleKanbanStatuses, kanbanOrder, currentPage]);

    const gridTotalPages = useMemo(() => {
        if (!visibleKanbanStatuses.length) return 1;

        const maxColumnCount = Math.max(
            ...visibleKanbanStatuses.map(
                (status) => processedShoots.filter((shoot) => shoot.status === status).length
            )
        );

        return Math.max(1, Math.ceil(maxColumnCount / itemsPerPage));
    }, [processedShoots, visibleKanbanStatuses]);

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
        const cleanId = id.replace('#', '');
        // NOTE: This will later need to point to /production-manager/shoots/[id] once that page is created
        router.push(`/production-manager/shoots/${cleanId}`);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const cleanId = id.replace('#', '');

        if (window.confirm("Are you sure you want to delete this shoot?")) {
            try {
                const response = await adminApi.deleteProject(cleanId);
                if (response?.success || response?.message === "Project deleted successfully") {
                    setShoots(prev => prev.filter(shoot => shoot.id !== id));
                    toast.success("Shoot deleted successfully");
                } else {
                    toast.error(response?.error || "Failed to delete shoot");
                }
            } catch (error) {
                console.error("Delete failed", error);
                toast.error("An error occurred while deleting");
            }
        }
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

    if (!mounted) return null;

    return (
        <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Table Header Controls */}
            <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
                            <input
                                type="text"
                                placeholder="Search project name..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className={`w-full md:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"}`}
                            />
                        </div>

                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="corporate">Corporate</SelectItem>
                                <SelectItem value="wedding">Wedding</SelectItem>
                                <SelectItem value="private">Private Events</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                                <SelectItem value="social">Social Content</SelectItem>
                                <SelectItem value="podcasts">Podcasts</SelectItem>
                                <SelectItem value="music">Music Videos</SelectItem>
                                <SelectItem value="narrative">Narrative</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Initiated">Initiated</SelectItem>
                                <SelectItem value="PreProduction">Pre Production</SelectItem>
                                <SelectItem value="Shoot Day">Shoot Day</SelectItem>
                                <SelectItem value="PostProduction">Post Production</SelectItem>
                                <SelectItem value="Revision">Revision</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Assets Delivered">Assets Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={range} onValueChange={(v) => { setRange(v); setCurrentPage(1); }}>
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

                        {/* <div className={`hidden md:flex items-center rounded-lg border overflow-hidden ${isDark ? "bg-[#202020] border-white/5" : "bg-[#FAFAFA] border-[#E5E5E5]"}`}>
                            <button
                                type="button"
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-2.5 transition-colors ${viewMode === "list" ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90" : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-[#666] hover:text-black")}`}
                            >
                                <List size={18} />
                            </button>  
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`px-4 py-2.5 transition-colors ${viewMode === "grid" ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90" : (isDark ? "bg-transparent text-white/40 hover:text-white" : "bg-transparent text-[#666] hover:text-black")}`}
                            >
                                <Grid3X3 size={18} />
                            </button>

                        </div> */}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin text-[#666]" size={32} />
                    </div>
                </div>
            ) : processedShoots.length === 0 ? (
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
                                            <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors" onClick={() => requestSort('id')}>
                                                <div className="flex items-center">Shoot ID {getSortIcon('id')}</div>
                                            </th>
                                            <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors" onClick={() => requestSort('customerName')}>
                                                <div className="flex items-center">Project Name {getSortIcon('customerName')}</div>
                                            </th>
                                            <th className="py-5 px-6 font-medium">Category</th>
                                            <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors" onClick={() => requestSort('price')}>
                                                <div className="flex items-center">Price {getSortIcon('price')}</div>
                                            </th>
                                            <th className="py-5 px-6 font-medium">Status</th>
                                            <th className="py-5 px-6 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentShoots.map((shoot, idx) => (
                                            <tr key={idx} onClick={() => handleRowClick(shoot.id)} className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}>
                                                <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.id}</td>
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canDelete && (
                                                            <button onClick={(e) => handleDelete(e, shoot.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-[#666] hover:bg-white/10 hover:text-red-500" : "text-[#999] hover:bg-red-50 hover:text-red-500"}`}>
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                        <ChevronRight size={20} className={isDark ? "text-[#666666]" : "text-[#999]"} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="hidden lg:block p-6 pt-5">
                                <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
                                    <div className="flex items-start gap-5 min-w-max">
                                        {kanbanColumns.map((column) => (
                                            <div key={column.status} className={`w-[320px] shrink-0 rounded-[24px] ${isDark ? "bg-[#141414]" : "bg-[#FBF7EF]"}`}>
                                                <div className={`flex items-center justify-between px-5 py-4 ${isDark ? "border-b border-white/5" : "border-b border-[#E8E0D2]"}`}>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>{column.status}</h4>
                                                        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium ${isDark ? "bg-[#242424] text-white/70" : "bg-white text-[#666]"}`}>{column.totalItems}</span>
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
                                                        <div className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${
                                                            isDark
                                                                ? "border-white/10 text-white/35"
                                                                : "border-[#E3D9C8] text-[#9A8F7C]"
                                                        }`}>
                                                            No shoots in this stage
                                                        </div>
                                                    ) : column.items.map((shoot, idx) => (
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
                                                            className={`group cursor-pointer rounded-2xl border p-4 transition-all ${isDark ? "border-[#2F2F2F] bg-[#151515] hover:border-[#4A4A4A] hover:bg-[#1A1A1A]" : "border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"} ${draggedShootId === shoot.id ? "opacity-55" : ""}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-sm shrink-0 ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                                                                    {shoot.initials}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {canDelete && (
                                                                        <button onClick={(e) => handleDelete(e, shoot.id)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isDark ? "text-[#666] hover:bg-white/10 hover:text-red-500" : "text-[#999] hover:bg-red-50 hover:text-red-500"}`}>
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRowClick(shoot.id);
                                                                        }}
                                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isDark ? "text-[#B9B9B9] hover:bg-white/10 hover:text-white" : "text-[#666] hover:bg-[#F8F4EA] hover:text-black"}`}
                                                                    >
                                                                        <ChevronRight size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 space-y-4">
                                                                <div>
                                                                    <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#666666]" : "text-[#A3A3A3]"}`}>{shoot.id}</p>
                                                                    <h4 className={`mt-2 text-lg font-semibold leading-snug line-clamp-2 ${isDark ? "text-white" : "text-[#111111]"}`}>{shoot.customerName}</h4>
                                                                    <p className={`mt-1 text-sm ${isDark ? "text-[#8B8B8B]" : "text-[#777777]"}`}>{shoot.date}</p>
                                                                </div>

                                                                <div className={`rounded-xl p-3 ${isDark ? "bg-[#101010]" : "bg-[#FAF6EE]"}`}>
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div>
                                                                            <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Category</p>
                                                                            <p className={`mt-1 text-sm font-medium line-clamp-2 ${isDark ? "text-[#F1F1F1]" : "text-[#222222]"}`}>{shoot.category}</p>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Price</p>
                                                                            <p className={`mt-1 text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>{shoot.price}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between gap-3">
                                                                    <StatusBadge status={shoot.status} />
                                                                    <span className={`text-xs ${isDark ? "text-[#5F5F5F]" : "text-[#9A9A9A]"}`}>Open details</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Pagination - Exact Logic Preserved */}
            {!loading && processedShoots.length > 0 && (
                <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
                    <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
                        {viewMode === "grid"
                            ? `Showing up to ${itemsPerPage} cards per status column`
                            : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, processedShoots.length)} of ${processedShoots.length} entries`}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}>Previous</button>
                        <div className="flex gap-1">
                            {(() => {
                                const rangeArr = [];
                                const delta = 1;
                                const left = currentPage - delta;
                                const right = currentPage + delta + 1;

                                for (let i = 1; i <= totalPages; i++) {
                                    if (i === 1 || i === totalPages || (i >= left && i < right)) {
                                        rangeArr.push(i);
                                    } else if (i === left - 1 || i === right) {
                                        rangeArr.push('...');
                                    }
                                }

                                return rangeArr.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
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
        </div>
    );
};
