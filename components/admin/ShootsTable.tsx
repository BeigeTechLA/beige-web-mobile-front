"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  ChevronRight,
  Loader2,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Grid3X3,
  List,
  MoreVertical,
  CirclePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileShootRow } from "@/components/admin/shoot-details/MobileShootRow";
import { StatusBadge } from "./StatusBadge";
import { useTheme } from "next-themes";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import { meetingsApi } from "@/lib/meetingsApi";
// import BoardMiniMapNavigator from "./BoardMiniMapNavigator";
import { useDebounce } from "@/hooks/use-debounce";

type ShootStatus =
  | "Booked"
  | "Cancelled"
  | "In-Progress"
  | "Initiated"
  | "PreProduction"
  | "Shoot Day"
  | "PostProduction"
  | "Revision"
  | "Completed"
  | "Assets Delivered"
  | "Unknown";

interface ShootRecord {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  initials: string;
  date: string;
  location: string;
  rawDate: number; // Added for correct chronological sorting
  category: string;
  price: string;
  rawPrice: number; // Added for correct numerical sorting
  status: ShootStatus;
  hasAssignedCp: boolean;
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
  initiated: "Initiated",
  preproduction: "PreProduction",
  shootday: "Shoot Day",
  postproduction: "PostProduction",
  revision: "Revision",
  completed: "Completed",
  assetsdelivered: "Assets Delivered",
  cancelled: "Cancelled",
};

const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "initiated", label: "Initiated" },
  { value: "preproduction", label: "Pre Production" },
  { value: "shootday", label: "Shoot Day" },
  { value: "postproduction", label: "Post Production" },
  { value: "revision", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "assetsdelivered", label: "Assets Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PRODUCTION_GAP_FILTER_SET = new Set([
  "pre_production_file_not_provided",
  "pre_production_meeting_not_done",
  "post_production_file_not_uploaded",
  "post_production_meeting_not_done",
]);

const isProductionGapStatusFilter = (value: string) => PRODUCTION_GAP_FILTER_SET.has(String(value || "").toLowerCase());
const isMeetingGapStatusFilter = (value: string) =>
  value === "pre_production_meeting_not_done" || value === "post_production_meeting_not_done";
const isFileGapStatusFilter = (value: string) =>
  value === "pre_production_file_not_provided" || value === "post_production_file_not_uploaded";

const normalizeStatusKey = (value: string) =>
  String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const timelineStatusKeyFromLabel = (status: ShootStatus) => {
  const normalized = normalizeStatusKey(status);
  if (normalized === "assetsdelivered") return "assetsdelivered";
  return normalized;
};

const isPostProductionEligibleStatus = (status: ShootStatus) => {
  const key = timelineStatusKeyFromLabel(status);
  return ["postproduction", "revision", "completed", "assetsdelivered"].includes(key);
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  videographer: "Videography",
  photographer: "Photography",
  video_editor: "Video Editing",
  photo_editor: "Photo Editing",
  editor: "Editing",
  cinematographer: "Cinematography",
};

const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getShootCategoryLabel = (project: any) => {
  if (typeof project.event_type_labels === "string" && project.event_type_labels.trim()) {
    return project.event_type_labels.trim();
  }

  const labels = new Set<string>();

  if (typeof project.content_type === "string" && project.content_type.trim()) {
    project.content_type
      .split(",")
      .map((item: string) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((item: string) => labels.add(CONTENT_TYPE_LABELS[item] || toTitleCase(item)));
  }

  if (!labels.size && typeof project.crew_roles === "string" && project.crew_roles.trim()) {
    try {
      const parsedCrewRoles = JSON.parse(project.crew_roles);
      Object.keys(parsedCrewRoles || {}).forEach((role) => {
        if (parsedCrewRoles[role]) {
          labels.add(CONTENT_TYPE_LABELS[role] || toTitleCase(role));
        }
      });
    } catch (error) {
      console.warn("Failed to parse crew_roles for category label", error);
    }
  }

  if (labels.size) {
    return Array.from(labels).join(", ");
  }

  if (typeof project.event_type === "string" && project.event_type.trim()) {
    return toTitleCase(project.event_type);
  }

  if (typeof project.shoot_type === "string" && project.shoot_type.trim()) {
    return toTitleCase(project.shoot_type);
  }

  return "N/A";
};

const STATUS_LABEL_MAP: Record<number, string> = {
  0: "Initiated",
  1: "PreProduction",
  2: "Shoot Day",
  3: "PostProduction",
  4: "Revision",
  5: "Completed",
  6: "Assets Delivered",
  7: "Cancelled",
};

const extractPhoneNumber = (project: any) => {
  const directPhone = project?.phone || project?.Phone;
  if (typeof directPhone === "string" && directPhone.trim()) {
    return directPhone.trim().replace(/[^\d+]/g, "");
  }

  const description = typeof project?.description === "string" ? project.description : "";
  const phoneMatch = description.match(/Phone:\s*([+\d][\d\s()-]*)/i);
  return phoneMatch ? phoneMatch[1].replace(/[^\d+]/g, "") : "";
};

interface ShootsTableProps {
  externalSelectedDate?: Date | null;
  detailBasePath?: string;
  enablePriceSort?: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  productionFilter?: string;
  setProductionFilter?: (v: string) => void;
  range: string;
  setRange: (v: string) => void;
  cpAssignmentFilter?: "all" | "assigned" | "not_assigned";
  setCpAssignmentFilter?: (v: "all" | "assigned" | "not_assigned") => void;
  viewMode?: "grid" | "list";
  setViewMode?: (v: "grid" | "list") => void;
  showHeaderControls?: boolean;
  showHeaderFilters?: boolean;
  showViewToggle?: boolean;
}

export const ShootsTable = ({
  externalSelectedDate,
  detailBasePath = "/admin/shoots",
  enablePriceSort = true,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  productionFilter = "all",
  setProductionFilter,
  range,
  setRange,
  cpAssignmentFilter,
  setCpAssignmentFilter,
  viewMode,
  setViewMode,
  showHeaderControls = true,
  showHeaderFilters = true,
  showViewToggle = true,
}: ShootsTableProps) => {
  const SHOOTS_VIEW_MODE_KEY = "admin-shoots-view-mode";
  const router = useRouter();
  const columnScrollRefs = React.useRef<Partial<Record<ShootStatus, HTMLDivElement | null>>>({});
  const gridScrollRef = React.useRef<HTMLDivElement | null>(null);
  const gridPanStateRef = React.useRef<{ startX: number; scrollLeft: number; isActive: boolean }>({
    startX: 0,
    scrollLeft: 0,
    isActive: false,
  });
  const dragAutoScrollFrameRef = React.useRef<number | null>(null);
  const dragAutoScrollStatusRef = React.useRef<ShootStatus | null>(null);
  const dragAutoScrollDirectionRef = React.useRef<"up" | "down" | null>(null);
  const latestFetchIdRef = React.useRef(0);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingGapLoading, setMeetingGapLoading] = useState(false);
  const [meetingGapBookingIds, setMeetingGapBookingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">("list");
  const [hasRestoredViewMode, setHasRestoredViewMode] = useState(false);
  const [kanbanOrder, setKanbanOrder] = useState<Record<ShootStatus, string[]>>({} as Record<ShootStatus, string[]>);
  const [draggedShootId, setDraggedShootId] = useState<string | null>(null);
  const [draggedStatus, setDraggedStatus] = useState<ShootStatus | null>(null);
  const [openCardActionId, setOpenCardActionId] = useState<string | null>(null);
  const [isGridPanning, setIsGridPanning] = useState(false);
  const itemsPerPage = 10;
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Filtering states
  const [internalCpAssignmentFilter, setInternalCpAssignmentFilter] = useState<"all" | "assigned" | "not_assigned">("all");
  const activeViewMode = viewMode ?? internalViewMode;
  const setActiveViewMode = setViewMode ?? setInternalViewMode;
  const activeCpAssignmentFilter = cpAssignmentFilter ?? internalCpAssignmentFilter;
  const setActiveCpAssignmentFilter = setCpAssignmentFilter ?? setInternalCpAssignmentFilter;
  const shouldRenderHeaderControls = showHeaderControls && (showHeaderFilters || showViewToggle);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
    key: 'rawDate',
    direction: null,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const savedViewMode = window.localStorage.getItem(SHOOTS_VIEW_MODE_KEY);
      if (savedViewMode === "grid" || savedViewMode === "list") {
        setActiveViewMode(savedViewMode);
      }
    } catch (error) {
      console.error("Failed to restore shoots view mode:", error);
    } finally {
      setHasRestoredViewMode(true);
    }
  }, [setActiveViewMode]);

  useEffect(() => {
    if (!hasRestoredViewMode) return;
    try {
      window.localStorage.setItem(SHOOTS_VIEW_MODE_KEY, activeViewMode);
    } catch (error) {
      console.error("Failed to persist shoots view mode:", error);
    }
  }, [hasRestoredViewMode, activeViewMode]);

  useEffect(() => {
    return () => {
      if (dragAutoScrollFrameRef.current !== null) {
        cancelAnimationFrame(dragAutoScrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-card-actions]")) return;
      setOpenCardActionId(null);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

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

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

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

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<string | null>(null);

  // Sync external date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("all");
    }
  }, [externalSelectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    let isCancelled = false;
    const fetchId = ++latestFetchIdRef.current;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { range };
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        if (productionFilter !== "all" && isFileGapStatusFilter(productionFilter)) {
          params.production_filter = productionFilter;
        }
        if (categoryFilter !== "all") {
          params.category = categoryFilter;
        }

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        if (activeCpAssignmentFilter !== "all") {
          params.cp_assignment = activeCpAssignmentFilter;
        }

        const projectsResponse = await adminApi.getProjects(params);
        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const resolvedStatus = resolveTimelineStage(project);
          const statusLabel = (STATUS_LABEL_MAP[resolvedStatus] || "Unknown") as ShootStatus;
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
          const extractedPhone = extractPhoneNumber(project);

          // Sorting Helpers
          const dateObj = project.event_date ? parseISO(project.event_date) : new Date(0);
          const resolvedPriceSource = project.total_value_amount ?? project.total_paid_amount ?? project.budget;
          const priceValue = resolvedPriceSource
            ? parseFloat(resolvedPriceSource)
            : project.budget ? parseFloat(project.budget) : 0;
          const selectedCrewIds = Array.isArray(project.selected_crew_ids)
            ? project.selected_crew_ids
            : [];
          const assignedCrews = Array.isArray(item?.assignedCrew)
            ? item.assignedCrew
            : Array.isArray(project.assigned_crews)
              ? project.assigned_crews
              : [];
          const hasAssignedCp = assignedCrews.length > 0 || selectedCrewIds.length > 0;

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName,
            email: project.guest_email || "", 
            phone: extractedPhone,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            location: project.event_location || project.location || "",
            rawDate: dateObj.getTime(),
            category: getShootCategoryLabel(project),
            price: resolvedPriceSource
              ? `$${parseFloat(resolvedPriceSource).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : project.budget
                ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "$0.00",
            rawPrice: priceValue,
            status: statusLabel,
            hasAssignedCp,
          };
        });
        if (!isCancelled && fetchId === latestFetchIdRef.current) {
          setShoots(mappedShoots);
        }
      } catch (error) {
        if (!isCancelled && fetchId === latestFetchIdRef.current) {
          console.error("Failed to fetch shoots:", error);
        }
      } finally {
        if (!isCancelled && fetchId === latestFetchIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [range, statusFilter, productionFilter, categoryFilter, activeCpAssignmentFilter, externalSelectedDate]);

  useEffect(() => {
    if (!isMeetingGapStatusFilter(productionFilter)) {
      setMeetingGapBookingIds(new Set());
      return;
    }

    let cancelled = false;
    const loadMeetingGap = async () => {
      try {
        setMeetingGapLoading(true);
        const meetingsResponse = await meetingsApi.listAll({
          limit: 5000,
          page: 1,
          sortBy: "meeting_date_time:desc",
        });
        if (cancelled) return;

        const meetings = Array.isArray(meetingsResponse?.results) ? meetingsResponse.results : [];
        const scheduledOrderIds = new Set<string>();

        meetings.forEach((meeting: any) => {
          const type = String(meeting?.meeting_type || "").toLowerCase();
          const status = String(meeting?.meeting_status || "").toLowerCase();
          const orderId = String(meeting?.order?.id || "").trim();
          if (!orderId) return;
          if (status === "cancelled") return;

          if (productionFilter === "pre_production_meeting_not_done" && type === "pre_production") {
            scheduledOrderIds.add(orderId);
          }
          if (productionFilter === "post_production_meeting_not_done" && type === "post_production") {
            scheduledOrderIds.add(orderId);
          }
        });

        const missingMeetingIds = new Set<string>();
        shoots.forEach((shoot) => {
          const bookingId = String(shoot.id || "").replace("#", "").trim();
          if (!bookingId) return;
          if (!scheduledOrderIds.has(bookingId)) {
            missingMeetingIds.add(bookingId);
          }
        });

        setMeetingGapBookingIds(missingMeetingIds);
      } catch (error) {
        console.error("Failed to load meetings for meeting-gap filter:", error);
        setMeetingGapBookingIds(new Set());
      } finally {
        if (!cancelled) setMeetingGapLoading(false);
      }
    };

    loadMeetingGap();
    return () => {
      cancelled = true;
    };
  }, [productionFilter, shoots]);

  // --- CLIENT-SIDE PROCESSING (Search + Sort) ---
  const processedShoots = useMemo(() => {
    // 1. Filter
    const normalizedSearchQuery = debouncedSearchQuery.toLowerCase();
    const normalizedPhoneQuery = normalizedSearchQuery.replace(/[^\d+]/g, "");
    let result = shoots.filter((shoot) => {
      const normalizedPhone = shoot.phone.toLowerCase();
      const matchesSearch =
        shoot.customerName.toLowerCase().includes(normalizedSearchQuery) ||
        shoot.id.toLowerCase().includes(normalizedSearchQuery) || 
        shoot.email.toLowerCase().includes(normalizedSearchQuery) ||
        (normalizedPhoneQuery.length > 0 && normalizedPhone.includes(normalizedPhoneQuery)); 
      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;

      if (isMeetingGapStatusFilter(productionFilter)) {
        const bookingId = String(shoot.id || "").replace("#", "").trim();
        if (!bookingId) return false;
        if (productionFilter === "post_production_meeting_not_done" && !isPostProductionEligibleStatus(shoot.status)) {
          return false;
        }
        return meetingGapBookingIds.has(bookingId);
      }

      if (isProductionGapStatusFilter(productionFilter)) {
        // Production gap filters are resolved by backend via `production_filter`.
        return true;
      }

      return timelineStatusKeyFromLabel(shoot.status) === statusFilter;
    });

    if (activeCpAssignmentFilter !== "all") {
      result = result.filter((shoot) =>
        activeCpAssignmentFilter === "assigned" ? shoot.hasAssignedCp : !shoot.hasAssignedCp
      );
    }

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
  }, [shoots, debouncedSearchQuery, sortConfig, statusFilter, productionFilter, activeCpAssignmentFilter, meetingGapBookingIds]);

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
    if (statusFilter !== "all" && !isProductionGapStatusFilter(statusFilter)) {
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
        items: orderedItems,
      };
    });
  }, [processedShoots, visibleKanbanStatuses, kanbanOrder]);

  const totalPages = listTotalPages;

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
    router.push(`${detailBasePath}/${cleanId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShootToDelete(id);
    setIsDeleteModalOpen(true);
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

      const scrollAmount = activeDirection === "up" ? -18 : 18;
      container.scrollTop += scrollAmount;
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

  const confirmDelete = async () => {
    if (!shootToDelete) return;

    const cleanId = shootToDelete.replace('#', '');
    setIsDeleting(true);

    try {
      const response = await adminApi.deleteProject(cleanId);
      if (response?.success || response?.message === "Project deleted successfully") {
        setShoots(prev => prev.filter(shoot => shoot.id !== shootToDelete));
        toast.success("Shoot deleted successfully");
      } else {
        toast.error(response?.error || "Failed to delete shoot");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setShootToDelete(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`w-full overflow-hidden transition-all duration-300 ${activeViewMode === "list"
      ? `rounded-2xl border ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`
      : "bg-transparent border-transparent"
      }`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      {shouldRenderHeaderControls && (
        <div className={`flex flex-col lg:flex-row justify-end lg:items-center px-4 lg:px-6 pt-4 lg:pt-6 pb-0 gap-4`}>
          {/* <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3> */}
          <div className="flex flex-col md:flex-row gap-3 w-full justify-end">
            {showHeaderFilters && (
              <>
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
                    className={`w-full md:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                      }`}
                  />
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
                      {FILTER_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
                  <Select value={activeCpAssignmentFilter} onValueChange={(v: "all" | "assigned" | "not_assigned") => { setActiveCpAssignmentFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className={`w-[170px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                      <SelectValue placeholder="CP Assignment" />
                    </SelectTrigger>
                    <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
                      <SelectItem value="all">All CP Assignment</SelectItem>
                      <SelectItem value="assigned">CP Assigned</SelectItem>
                      <SelectItem value="not_assigned">CP Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-3">
              {showViewToggle && (
                <div className={`hidden md:flex items-center rounded-lg border overflow-hidden ${isDark ? "bg-[#202020] border-white/5" : "bg-[#FAFAFA] border-[#E5E5E5]"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode("list")}
                    className={`px-4 py-2.5 transition-colors ${activeViewMode === "list"
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
                    onClick={() => setActiveViewMode("grid")}
                    className={`px-4 py-2.5 transition-colors ${activeViewMode === "grid"
                      ? "bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                      : isDark
                        ? "bg-transparent text-white/40 hover:text-white"
                        : "bg-transparent text-[#666] hover:text-black"
                      }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading || meetingGapLoading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : processedShoots.length === 0 ? (
        <div className={`py-20 text-center font-instrument-sans ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
      ) : (
        <>
          {/* MOBILE ONLY VIEW */}
          {activeViewMode === "list" && (
            <div className={`lg:hidden transition-colors duration-300 ${isDark ? "bg-[#111111]" : ""}`}>
              <div className={`flex justify-between px-5 py-3 text-sm font-medium border-b rounded-b-xl ${isDark ? "border-b-[#3D3D3D] text-[#E8D1AB] bg-[#101010]" : "bg-[#FFFCF6] text-[#000000] border-b-[#E5E5E5]"}`}>
                <span>Customer Name</span>
                <span>Status</span>
              </div>

              <div className="flex flex-col">
                {currentShoots.map((shoot, idx) => (
                  <MobileShootRow
                    key={idx}
                    shoot={shoot}
                    onRowClick={handleRowClick}
                  />
                ))}
              </div>
            </div>
          )}
          {/* ) : (
            <div className="lg:hidden p-4">
              <div className="space-y-4">
                {kanbanColumns.map((column) => (
                  <div key={column.status} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                        {column.status}
                      </h4>
                      <span className={`text-xs ${isDark ? "text-[#777777]" : "text-[#9A9A9A]"}`}>
                        {column.totalItems}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {column.items.map((shoot, idx) => (
                        <div
                          key={`${column.status}-${idx}`}
                          onClick={() => handleRowClick(shoot.id)}
                          className={`rounded-2xl border p-4 transition-colors ${isDark
                            ? "border-[#2F2F2F] bg-[#151515]"
                            : "border-[#EAE3D6] bg-[#FFFCF8]"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-sm shrink-0 ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"
                                }`}>
                                {shoot.initials}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#111111]"}`}>
                                  {shoot.customerName}
                                </p>
                                <p className={`text-xs mt-1 ${isDark ? "text-[#8B8B8B]" : "text-[#777777]"}`}>
                                  {shoot.id} • {shoot.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, shoot.id)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-[#666] hover:bg-white/10 hover:text-red-500" : "text-[#999] hover:bg-red-50 hover:text-red-500"
                                  }`}
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(shoot.id);
                                }}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-[#B9B9B9] hover:bg-white/10 hover:text-white" : "text-[#666] hover:bg-[#F8F4EA] hover:text-black"
                                  }`}
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>{shoot.category}</p>
                              <p className={`mt-1 text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>{shoot.price}</p>
                            </div>
                            <StatusBadge status={shoot.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {activeViewMode === "grid" ? (
            <div className="relative block pt-0">
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
                      className={`w-[calc(100vw-48px)] md:w-[320px] shrink-0 rounded-3xl border h-fit ${isDark ? "bg-[#0A0A0A] border-[#FFFFFF33]" : "bg-[#FBF7EF] border-[#E8E0D2]"
                        }`}
                    >
                      <div className={`flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 border-b ${isDark ? "border-white/5 bg-[#202020]" : "border-[#E8E0D2] bg-[#FBF7EF]"
                        }`}>
                        <h4 className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                          {column.status}
                        </h4>
                        <span className={`text-sm font-medium ${isDark ? "text-white/70" : "text-[#666]"}`}>
                          {column.totalItems}
                        </span>
                      </div>
                      {/* <StatusBadge status={column.status} /> */}

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
                            className={`group cursor-pointer rounded-2xl transition-all duration-200 ${isDark
                              ? "bg-[#202020] hover:bg-[#1A1A1A]"
                              : "border border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
                              } ${draggedShootId === shoot.id ? "opacity-50 scale-95" : "opacity-100"}`}
                          >
                            <div className="flex items-start justify-between gap-3 p-5">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className={`shrink-0 w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl`}>
                                  {shoot.initials}
                                </div>
                                <div className="min-w-0 pt-1">
                                  <h4 className={`truncate text-base font-semibold leading-tight ${isDark ? "text-white" : "text-[#111111]"}`}>
                                    {shoot.customerName}
                                  </h4>
                                  <p className={`mt-1 text-sm font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>
                                    {shoot.date}
                                  </p>
                                </div>
                              </div>
                              <div className="relative shrink-0" data-card-actions>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenCardActionId((current) => current === shoot.id ? null : shoot.id);
                                  }}
                                  className={`shrink-0 p-1 transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                                  aria-label="Card actions"
                                >
                                  <MoreVertical size={24} />
                                </button>

                                {openCardActionId === shoot.id && (
                                  <div
                                    className={`absolute right-0 top-9 z-20 min-w-[150px] rounded-xl border p-1 shadow-xl ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"
                                      }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenCardActionId(null);
                                        handleRowClick(shoot.id);
                                      }}
                                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"
                                        }`}
                                    >
                                      <ChevronRight size={16} />
                                      Open details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenCardActionId(null);
                                        handleDeleteClick(e, shoot.id);
                                      }}
                                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isDark ? "text-red-400 hover:bg-white/10" : "text-red-600 hover:bg-red-50"
                                        }`}
                                    >
                                      <Trash2 size={16} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* DIVIDER */}
                            <div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                            {/* BODY */}
                            <div className="space-y-4 p-5">
                              <div className="flex items-center justify-between gap-3">
                                <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>Shoot ID</p>
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#222222]"}`}>{shoot.id}</p>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>Category</p>
                                <p className={`text-sm text-right font-medium ${isDark ? "text-white" : "text-[#222222]"}`}>{shoot.category}</p>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>Price</p>
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#222222]"}`}>{shoot.price}</p>
                              </div>
                            </div>

                            {/* DIVIDER */}
                            <div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                            {/* FOOTER */}
                            <div className="flex items-center justify-between p-5">
                              <StatusBadge status={shoot.status} />
                              {(!shoot.date || shoot.date === "No Date" || !shoot.location) && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                                  Missing Info
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
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
                  visible={activeViewMode === "grid"}
                  syncKey={kanbanColumns.map((column) => `${column.status}:${column.items.length}`).join("|")}
              />
              */}
            </div>
          ) : (
            <div className="hidden lg:block w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                    <th
                      className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors"
                      onClick={() => requestSort('id')}>
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
                <tbody>                  {currentShoots.map((shoot, idx) => {
                    const isMissingDate = !shoot.date || shoot.date === "No Date";
                    const isMissingLocation = !shoot.location;
                    const isMissingInfo = isMissingDate || isMissingLocation;
                    
                    let missingMsg = "";
                    if (isMissingDate && isMissingLocation) missingMsg = "Date & Location missing";
                    else if (isMissingDate) missingMsg = "Date missing";
                    else if (isMissingLocation) missingMsg = "Location missing";

                    return (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(shoot.id)}
                        className={`group border-b transition-colors last:border-0 cursor-pointer relative ${
                          isMissingInfo 
                            ? (isDark ? "bg-red-500/[0.03] border-red-500/20 hover:bg-red-500/[0.08]" : "bg-red-50/50 border-red-100 hover:bg-red-50")
                            : (isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50")
                        }`}
                      >
                        <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.id}</td>
                        <td className="py-5 px-6 relative">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                              {shoot.initials}
                            </div>
                            <div>
                              <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                              <div className="flex items-center gap-2 mt-1.5 ">
                                <p className={`text-xs ${isDark ? "text-[#666666]" : "text-[#999]"} ${isMissingDate ? "text-red-400 font-medium" : ""}`}>{shoot.date}</p>
                                {isMissingInfo && (
                                  <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                                    {missingMsg}
                                  </span>
                                )}
                              </div>
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
                            <button
                              onClick={(e) => handleDeleteClick(e, shoot.id)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-[#666] hover:bg-white/10 hover:text-red-500" : "text-[#999] hover:bg-red-50 hover:text-red-500"}`}
                            >
                              <Trash2 size={18} />
                            </button>
                            <ChevronRight size={20} className={isDark ? "text-[#666666]" : "text-[#999]"} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div >
          )}
        </>
      )}

      {/* Pagination - Exact Logic Preserved */}
      {
        !loading && !meetingGapLoading && processedShoots.length > 0 && activeViewMode !== "grid" && (
          <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
              {`Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, processedShoots.length)} of ${processedShoots.length} entries`}
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
        )
      }
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Shoot"
        description="Are you sure you want to delete this shoot? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div >
  );
};
