"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
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
  MessageCirclePlus,
  X,
  Smile,
  Send,
  MoreHorizontal,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";
import Lottie from "lottie-react";
import redAnimation from "@/public/animations/Red.json";
import yellowAnimation from "@/public/animations/Yellow.json";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
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
import { MissingFieldsModal } from "./MissingFieldsModal";
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
  sourceProject?: Record<string, unknown>;
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
  needsAttention?: {
    required: boolean;
    missing_fields: string[];
  };
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
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState(false);
  const [selectedShootIdForMissingFields, setSelectedShootIdForMissingFields] = useState<string | null>(null);
  const [selectedShootDataForMissingFields, setSelectedShootDataForMissingFields] = useState<Record<string, unknown> | null>(null);
  const [fieldsToShow, setFieldsToShow] = useState<string[]>([]);

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
          const resolvedLocation =
            typeof project.event_location === "string"
              ? project.event_location.trim()
              : typeof project.location === "string"
                ? project.location.trim()
                : project.event_location?.address?.trim?.() || project.location?.address?.trim?.() || "";
          const missingFields = Array.isArray(project.needs_attention?.missing_fields)
            ? project.needs_attention.missing_fields.filter((field: string) => {
                const normalizedField = String(field).toLowerCase();
                if ((normalizedField === "location" || normalizedField === "event_location") && resolvedLocation) {
                  return false;
                }
                return true;
              })
            : [];

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
            sourceProject: project,
            customerName,
            email: project.guest_email || "",
            phone: extractedPhone,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            location: resolvedLocation,
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
            needsAttention: project.needs_attention ? {
              required: missingFields.length > 0,
              missing_fields: missingFields
            } : undefined
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

  const getApiShootId = (id: string) => id.replace(/^#/, '').trim();

  const handleMissingFieldsSaved = (updated: {
    shootId: string;
    location?: string;
    bookingType: "single_day" | "multi_day";
    dateLabel?: string;
    rawDate?: number;
    startTime?: string;
    endTime?: string;
    bookingDays?: Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;
    remainingMissingFields: string[];
  }) => {
    setShoots((prev) =>
      prev.map((shoot) => {
        const currentId = shoot.id.replace(/^#/, "").trim();
        if (currentId !== updated.shootId) return shoot;

        return {
          ...shoot,
          location: updated.location ?? shoot.location,
          date: updated.dateLabel ?? shoot.date,
          rawDate: updated.rawDate ?? shoot.rawDate,
          needsAttention: updated.remainingMissingFields.length > 0
            ? {
                required: true,
                missing_fields: updated.remainingMissingFields,
              }
            : undefined,
        };
      })
    );
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
                                        setFieldsToShow(shoot.needsAttention?.missing_fields || []);
                                        setSelectedShootIdForMissingFields(getApiShootId(shoot.id));
                                        setIsMissingFieldsModalOpen(true);
                                      }}
                                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isDark ? "text-[#E8D1AB] hover:bg-white/10" : "text-[#8C6A00] hover:bg-[#F8F4EA]"
                                        }`}
                                    >
                                      <AlertCircle size={16} />
                                      Actions
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
                            {/* FOOTER */}
                            <div
                              className="flex items-center justify-between p-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StatusBadge status={shoot.status} />
                              {shoot.needsAttention?.required && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                                  Missing Info
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setChatOpen(shoot.id); // Store the shoot ID instead of boolean
                                }}
                                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                              >
                                <MessageCirclePlus
                                  size={20}
                                  className={`${isDark ? "text-[#888]" : "text-[#666]"} hover:text-white transition-colors`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {chatOpen && (
                <NotesDrawer
                  isOpen={!!chatOpen}
                  onClose={() => setChatOpen(null)}
                  shootId={chatOpen} // Pass the shoot ID
                />
              )}
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
            <div className="hidden lg:block w-full">
              <table className="w-full text-left border-separate border-spacing-0">
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
                <tbody>
                  {currentShoots.map((shoot, idx) => {
                    const isMissingDate = !shoot.date || shoot.date === "No Date";
                    const needsAttention = shoot.needsAttention?.required;
                    const missingFields = shoot.needsAttention?.missing_fields || [];
                    const hasMissingFields = missingFields.length > 0;
                    const isMissingLocation = !shoot.location;
                    const isMissingInfo = isMissingDate || isMissingLocation || Boolean(needsAttention);
                    const borderClass = isDark ? "border-[#333333]" : "border-[#E5E5E5]";
                    const rowBgClass = isDark ? "hover:bg-white/[0.02]" : "hover:bg-zinc-50";

                    const animationData = missingFields.length >= 3 ? redAnimation : yellowAnimation;

                    return (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(shoot.id)}
                        className={`group border-b transition-colors last:border-0 cursor-pointer relative ${isMissingInfo
                          ? (isDark ? "bg-red-500/[0.03] border-red-500/20 hover:bg-red-500/[0.08]" : "bg-red-50/50 border-red-100 hover:bg-red-50")
                          : (isDark ? `border-[#222222] ${rowBgClass}` : `border-[#F5F5F5] ${rowBgClass}`)
                          }`}
                      >
                        <td className={`py-5 px-6 text-base leading-none tracking-normal border-y border-l ${borderClass} ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                              {hasMissingFields && (
                                <Lottie animationData={animationData} loop={true} />
                              )}
                            </div>
                            {shoot.id}
                          </div>
                        </td>
                        <td className={`py-5 px-6 relative border-y ${borderClass}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                              {shoot.initials}
                            </div>
                            <div>
                              <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                              <div className="flex items-center gap-2 mt-1.5 ">
                                <p className={`text-xs ${isDark ? "text-[#666666]" : "text-[#999]"} ${isMissingDate ? "text-red-400 font-medium" : ""}`}>{shoot.date}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`py-5 px-6 text-base leading-none tracking-normal border-y ${borderClass} ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.category}</td>
                        <td className={`py-5 px-6 text-base leading-none tracking-normal border-y ${borderClass} ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.price}</td>
                        <td className={`py-5 px-6 border-y ${borderClass}`}>
                          <StatusBadge status={shoot.status} />
                        </td>
                        <td className={`py-5 px-6 text-right border-y border-r ${borderClass}`}>
                          <div className="relative flex justify-end" data-card-actions>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCardActionId((current) => current === shoot.id ? null : shoot.id);
                              }}
                              className={`p-1 transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                              aria-label="Actions"
                            >
                              <MoreVertical size={24} />
                            </button>

                            {openCardActionId === shoot.id && (
                              <div
                                className={`absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border p-1 shadow-xl text-left ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"
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
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-[#222222] hover:bg-[#F8F4EA]"
                                    }`}
                                >
                                  <ChevronRight size={16} />                                  Open details
                                </button>
                                
                                <button
                                  type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenCardActionId(null);
                                  setFieldsToShow(missingFields);
                                  setSelectedShootIdForMissingFields(getApiShootId(shoot.id));
                                  setSelectedShootDataForMissingFields(shoot.sourceProject || null);
                                  setIsMissingFieldsModalOpen(true);
                                }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-[#E8D1AB] hover:bg-white/10" : "text-[#8C6A00] hover:bg-[#F8F4EA]"}`}
                                >
                                  <AlertCircle size={16} />
                                  Actions
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenCardActionId(null);
                                    handleDeleteClick(e, shoot.id);
                                  }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${isDark ? "text-red-400 hover:bg-white/10" : "text-red-600 hover:bg-red-50"
                                    }`}
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <MissingFieldsModal
        isOpen={isMissingFieldsModalOpen}
        onClose={() => {
          setIsMissingFieldsModalOpen(false);
          setSelectedShootIdForMissingFields(null);
          setSelectedShootDataForMissingFields(null);
        }}
        isDark={isDark}
        fields={fieldsToShow}
        shootId={selectedShootIdForMissingFields ?? undefined}
        initialShootData={selectedShootDataForMissingFields}
        onSaved={handleMissingFieldsSaved}
      />

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



//Types############################################################################################################################################

//import { useState, useRef, useEffect } from 'react';

//import { X, ThumbsUp, Smile, Send, MoreHorizontal } from 'lucide-react';


// Quick reactions for emoji picker
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"] as const;
const EMOJI_TO_REACTION: Record<string, string> = {
  "👍": "like",
  "❤️": "love",
  "😂": "laugh",
  "😮": "wow",
  "😢": "sad",
};
const REACTION_TO_EMOJI: Record<string, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
};

type NoteUiItem = {
  id: number;
  user: { name: string; avatar: string };
  timestamp: { date: string; time: string };
  message: string;
  likes: number;
  likedByMe: boolean;
  myReactions: string[];
  reactionCounts: Record<string, number>;
  replies: Array<{
    id: number;
    user: { name: string; avatar: string };
    timestamp: { date: string; time: string };
    message: string;
  }>;
};

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=11";

const formatNoteTimestamp = (value: unknown) => {
  try {
    const parsed = typeof value === "string" ? new Date(value) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      return { date: "Unknown date", time: "" };
    }
    return {
      date: format(parsed, "MMM d, yyyy"),
      time: format(parsed, "hh:mm a"),
    };
  } catch {
    return { date: "Unknown date", time: "" };
  }
};

const mapShootNotesToUi = (payload: any): NoteUiItem[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notes)
      ? payload.notes
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return list.map((note: any) => {
    const ts = formatNoteTimestamp(note?.created_at || note?.createdAt);
    const replies = Array.isArray(note?.replies) ? note.replies : [];
    const reactions = Array.isArray(note?.reactions) ? note.reactions : [];
    const reactionCounts: Record<string, number> = {};
    reactions.forEach((r: any) => {
      const key = String(r?.reaction || "").toLowerCase().trim();
      if (!key) return;
      reactionCounts[key] = (reactionCounts[key] || 0) + 1;
    });
    if (!reactionCounts.like && Number(note?.like_count || 0) > 0) {
      reactionCounts.like = Number(note.like_count);
    }
    const likes = Number(reactionCounts.like || 0);
    const myReactions = Array.isArray(note?.my_reactions)
      ? note.my_reactions.map((x: any) => String(x || "").toLowerCase()).filter(Boolean)
      : [];

    return {
      id: Number(note?.note_id || note?.id || 0),
      user: {
        name: note?.user?.name || note?.created_by?.name || "Unknown User",
        avatar: note?.user?.avatar || note?.created_by?.avatar || FALLBACK_AVATAR,
      },
      timestamp: ts,
      message: note?.message || note?.note || "",
      likes,
      likedByMe: myReactions.includes("like") || Boolean(note?.reacted_by_me),
      myReactions: myReactions || [],
      reactionCounts: reactionCounts || {},
      replies: replies.map((reply: any) => {
        const replyTs = formatNoteTimestamp(reply?.created_at || reply?.createdAt);
        return {
          id: Number(reply?.note_id || reply?.id || 0),
          user: {
            name: reply?.user?.name || reply?.created_by?.name || "Unknown User",
            avatar: reply?.user?.avatar || reply?.created_by?.avatar || FALLBACK_AVATAR,
          },
          timestamp: replyTs,
          message: reply?.message || reply?.note || "",
        };
      }),
    };
  });
};


// Main Notes Drawer Component
export default function NotesDrawer({
  isOpen,
  onClose,
  shootId,
  isDark = true
}: {
  isOpen: boolean;
  onClose: () => void;
  shootId?: string;
  isDark?: boolean;
}) {
  const [notes, setNotes] = useState<NoteUiItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showComposerEmojis, setShowComposerEmojis] = useState(false);
  const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null);
  const composerEmojiRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const bookingId = String(shootId || "").replace("#", "");

  const fetchNotes = async () => {
    if (!bookingId) return;
    setLoadingNotes(true);
    const response = await adminApi.getShootNotes(bookingId);
    if (!response?.success) {
      toast.error(response?.error || "Failed to fetch notes");
      setLoadingNotes(false);
      return;
    }
    setNotes(mapShootNotesToUi(response?.data));
    setLoadingNotes(false);
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchNotes();
    }
  }, [isOpen, bookingId]);

  // Click outside to close composer emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (composerEmojiRef.current && !composerEmojiRef.current.contains(event.target as Node)) {
        setShowComposerEmojis(false);
      }
    };

    if (showComposerEmojis) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showComposerEmojis]);

  // Click outside to close reaction picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPickerId(null);
      }
    };

    if (showReactionPickerId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionPickerId]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setShowComposerEmojis(false);
        setShowReactionPickerId(null);
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    const noteText = inputValue.trim();
    if (!noteText || !bookingId) return;

    setIsSubmitting(true);
    const response = replyingToId
      ? await adminApi.replyToShootNote(bookingId, replyingToId, { note: noteText })
      : await adminApi.addShootNote(bookingId, { note: noteText });

    if (!response?.success) {
      toast.error(response?.error || (replyingToId ? "Failed to add reply" : "Failed to add note"));
      setIsSubmitting(false);
      return;
    }

    setInputValue('');
    setReplyingToId(null);
    await fetchNotes();
    setIsSubmitting(false);
  };

  const appendEmojiToDraft = (emoji: string) => {
    setInputValue((current) => `${current}${emoji}`);
  };

  const handleComposerEmojiClick = (emojiData: EmojiClickData) => {
    appendEmojiToDraft(emojiData.emoji);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!bookingId) return;
    const reaction = EMOJI_TO_REACTION[emoji] || "like";
    const response = await adminApi.reactToShootNote(bookingId, messageId, { reaction });
    if (!response?.success) {
      toast.error(response?.error || "Reaction not supported by backend");
      setShowReactionPickerId(null);
      return;
    }
    await fetchNotes();
    setShowReactionPickerId(null);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!bookingId) return;
    const response = await adminApi.deleteShootNote(bookingId, noteId);
    if (!response?.success) {
      toast.error(response?.error || "Failed to delete note");
      return;
    }
    toast.success("Note deleted");
    await fetchNotes();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 backdrop-blur-[3px] z-40"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#0a0a0a] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a] px-7 py-6 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-bold text-white tracking-tight">Notes</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loadingNotes ? (
                <div className="py-8 flex items-center justify-center text-white/60 text-sm">Loading notes...</div>
              ) : null}
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isDark={isDark}
                  onReact={handleReaction}
                  onReply={(id) => setReplyingToId(id)}
                  onDelete={handleDeleteNote}
                  showReactionPickerId={showReactionPickerId}
                  setShowReactionPickerId={setShowReactionPickerId}
                  reactionPickerRef={reactionPickerRef}
                />
              ))}
            </div>

            {/* Bottom Composer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] px-6 py-5 border-t border-white/10">
              {replyingToId ? (
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span>Replying to note #{replyingToId}</span>
                  <button className="text-white/70 hover:text-white" onClick={() => setReplyingToId(null)}>Cancel</button>
                </div>
              ) : null}
              <div className="flex items-center gap-3 bg-[#161616] rounded-full px-5 py-3.5 border border-white/5 focus-within:border-white/10 transition-colors relative">
                <button
                  className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
                  onClick={() => setShowComposerEmojis((current) => !current)}
                >
                  <Smile size={20} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Write a Note.."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                <button
                  onClick={handleSubmit}
                  className={`flex-shrink-0 transition-colors ${inputValue.trim()
                    ? 'text-[#E8D1AB] hover:text-[#dccaa9]'
                    : 'text-white/30 cursor-not-allowed'
                    }`}
                  disabled={!inputValue.trim() || isSubmitting}
                >
                  <Send size={16} />
                </button>

                {showComposerEmojis && (
                  <div
                    ref={composerEmojiRef}
                    className={`absolute bottom-[calc(100%+12px)] right-4 z-30 w-[320px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border shadow-2xl lg:right-8 transition-colors ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"
                      }`}
                  >
                    <EmojiPicker
                      onEmojiClick={handleComposerEmojiClick}
                      theme={isDark ? Theme.DARK : Theme.LIGHT}
                      width="100%"
                      height={340}
                      searchPlaceholder="Search emojis..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Note Card Component
function NoteCard({
  note,
  isDark = true,
  onReact,
  onReply,
  onDelete,
  showReactionPickerId,
  setShowReactionPickerId,
  reactionPickerRef
}: {
  note: NoteUiItem;
  isDark?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (noteId: number) => void;
  onDelete?: (noteId: number) => void;
  showReactionPickerId: string | null;
  setShowReactionPickerId: (id: string | null) => void;
  reactionPickerRef: React.RefObject<HTMLDivElement>;
}) {
  const hasReplies = note.replies && note.replies.length > 0;

  return (
    <div className="bg-[#161616] rounded-[22px] p-5 border border-white/5 relative">
      {/* Parent Note */}
      <div className="flex gap-4">
        <img
          src={note.user.avatar}
          alt={note.user.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{note.user.name}</span>
              <span className="text-xs text-white/30 whitespace-nowrap">
                {note.timestamp.date} • {note.timestamp.time}
              </span>
            </div>
            <button
              className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 -mr-1 p-1"
              onClick={() => onDelete?.(note.id)}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mb-3">
            {note.message}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-1 relative">
            <button
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${note.likedByMe || note.likes > 0 ? 'text-[#E8D1AB]' : 'text-white/40 hover:text-white/70'
                }`}
              onClick={() => onReact?.(note.id.toString(), "👍")}
            >
              <ThumbsUp
                size={14}
                strokeWidth={2}
                className={note.likedByMe ? "fill-current" : ""}
              />
              {note.likes > 0 ? note.likes : 'Like'}
            </button>
            <span className="w-px h-3 bg-white/10" />
            <button
              className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5"
              onClick={() => onReply?.(note.id)}
            >
              Reply
            </button>
            <span className="w-px h-3 bg-white/10" />
            <button
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5 relative"
              onClick={() => setShowReactionPickerId((current) => (current === note.id.toString() ? null : note.id.toString()))}
            >
              <Smile size={14} strokeWidth={2} />
              React
            </button>

            {/* Reaction Picker Popup */}
            {showReactionPickerId === note.id.toString() && (
              <div
                ref={reactionPickerRef}
                className={`absolute bottom-full left-0 mb-2 z-20 flex items-center gap-1 rounded-full border px-2 py-1 shadow-2xl ${isDark ? "border-white/10 bg-[#151515]" : "border-zinc-200 bg-white"
                  }`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={`${note.id}-picker-${emoji}`}
                    type="button"
                    onClick={() => {
                      onReact?.(note.id.toString(), emoji);
                      setShowReactionPickerId(null);
                    }}
                    className="rounded-full px-1.5 text-lg transition hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {Object.keys(note.reactionCounts || {}).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(note.reactionCounts || {}).map(([reaction, count]) => {
                const emoji = REACTION_TO_EMOJI[reaction] || "🙂";
                const reactedByMe = note.myReactions.includes(reaction);
                return (
                  <button
                    key={`${note.id}-${reaction}`}
                    type="button"
                    onClick={() => onReact?.(note.id.toString(), emoji)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      reactedByMe
                        ? "border-[#E8D1AB]/40 bg-[#E8D1AB]/15 text-[#E8D1AB]"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {emoji} {count}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Thread Replies */}
      {hasReplies && (
        <div className="mt-4 ml-5 pl-5 border-l border-white/10 space-y-3">
          {note.replies.map((reply) => (
            <NoteReply key={reply.id} reply={reply} isDark={isDark} />
          ))}
        </div>
      )}
    </div>
  );
}

// Thread Reply Component
function NoteReply({
  reply,
  isDark = true
}: {
  reply: NoteUiItem["replies"][0];
  isDark?: boolean;
}) {
  return (
    <div className="bg-[#161616] rounded-[18px] p-4 border border-white/5">
      <div className="flex gap-3">
        <img
          src={reply.user.avatar}
          alt={reply.user.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{reply.user.name}</span>
              <span className="text-xs text-white/30 whitespace-nowrap">
                {reply.timestamp.date} • {reply.timestamp.time}
              </span>
            </div>
            <button className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 -mr-1 p-1">
              <MoreHorizontal size={14} />
            </button>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mb-2.5">
            {reply.message}
          </p>

          {/* Action Row - Smaller */}
          <div className="flex items-center gap-1">
            <button className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              Like
            </button>
            <span className="w-px h-2.5 bg-white/10" />
            <button className="text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              Reply
            </button>
            <span className="w-px h-2.5 bg-white/10" />
            <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 font-medium transition-colors px-0.5">
              <Smile size={13} strokeWidth={2} />
              React
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
