import { format, parseISO } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cookies from "js-cookie";
import { StatusBadge } from "../admin/StatusBadge";
import redAnimation from "@/public/animations/Red.json";
import yellowAnimation from "@/public/animations/Yellow.json";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { resolveTimelineStage, timelineStageToDashboardLabel } from "@/lib/utils/projectTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";
import NotesDrawer from "@/components/affiliate/shoot-details/NotesDrawer";
import { AlertCircle, ArrowUpDownIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CirclePlus, Grid3X3, List, Loader2, MessageCirclePlus, Search } from "lucide-react";
import Lottie from "lottie-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, affiliateApi } from "@/lib/api";

type Status = "Initiated" | "PreProduction" | "Shoot Day" | "PostProduction" | "Revision" | "Completed" | "Assets Delivered" | "Pending" | "Cancelled" | "Unknown";

const AFFILIATE_SHOOTS_VIEW_MODE_KEY = "affiliate-shoots-view-mode";

const GRID_STATUS_ORDER: Status[] = [
  "Pending",
  "Initiated",
  "PreProduction",
  "Shoot Day",
  "PostProduction",
  "Revision",
  "Completed",
  "Assets Delivered",
  "Cancelled",
];
const PAID_PAYMENT_STATUSES = new Set(["paid", "completed", "success", "no_payment_due"]);
const PARTIAL_PAYMENT_STATUSES = new Set(["partially_paid", "partial_paid"]);

interface ShootRecord {
  id: string;
  bookingId: string;
  customerName: string;
  initials: string;
  date: string;
  rawDate: number; // Added for correct chronological sorting
  category: string;
  price: string;
  rawPrice: number; // Added for correct numerical sorting
  status: Status;
  hasQuote: boolean;
  paymentStatus: "paid" | "partial" | "pending";
  notesCount: number;
  needsAttention?: {
    required: boolean;
    missing_fields: string[];
  };
}

interface AffiliateShootsTableProps {
  onShootClick?: (shootId: string) => void;
  externalSelectedDate?: Date | null;
}

const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "initiated", label: "Initiated" },
  { value: "preproduction", label: "Pre Production" },
  { value: "shootday", label: "Shoot Day" },
  { value: "postproduction", label: "Post Production" },
  { value: "revision", label: "Revision" },
  { value: "completed", label: "Completed" },
  { value: "assetsdelivered", label: "Assets Delivered" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

const FILTER_STATUS_TO_LABEL: Record<string, Status> = {
  initiated: "Initiated",
  preproduction: "PreProduction",
  shootday: "Shoot Day",
  postproduction: "PostProduction",
  revision: "Revision",
  completed: "Completed",
  assetsdelivered: "Assets Delivered",
  pending: "Pending",
  cancelled: "Cancelled",
};

const FILTER_CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "corporate", label: "Corporate" },
  { value: "wedding", label: "Wedding" },
  { value: "private", label: "Private Events" },
  { value: "commercial", label: "Commercial" },
  { value: "social", label: "Social Content" },
  { value: "podcasts", label: "Podcasts" },
  { value: "music", label: "Music Videos" },
  { value: "narrative", label: "Narrative" },
];

export const AffiliateShootsTable: React.FC<AffiliateShootsTableProps> = ({ onShootClick, externalSelectedDate }) => {
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const itemsPerPage = 10;
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { canEdit } = usePermissions("shoots");

  // Filtering states
  const [range, setRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [hoveredShootId, setHoveredShootId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const router = useRouter();

  const handleNotesCountChange = useCallback((shootId: string, count: number) => {
    const nextCount = Number.isFinite(count) ? Math.max(0, count) : 0;
    setShoots((currentShoots) =>
      currentShoots.map((shoot) =>
        shoot.id === shootId
          ? { ...shoot, notesCount: nextCount }
          : shoot
      )
    );
  }, []);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
    key: 'rawDate',
    direction: null,
  });
  useEffect(() => {
    setMounted(true);

    try {
      const savedViewMode = window.localStorage.getItem(AFFILIATE_SHOOTS_VIEW_MODE_KEY);
      if (savedViewMode === "list" || savedViewMode === "grid") {
        setViewMode(savedViewMode);
      }
    } catch (error) {
      console.error("Failed to restore affiliate shoots view mode:", error);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(AFFILIATE_SHOOTS_VIEW_MODE_KEY, viewMode);
    } catch (error) {
      console.error("Failed to persist affiliate shoots view mode:", error);
    }
  }, [mounted, viewMode]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const toTitleCase = (value: string) =>
    String(value || "")
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");


  // Sync external selected date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("month");
    }
  }, [externalSelectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      setLoading(true);
      try {
        const params: any = { range };
        // Client endpoint currently rejects admin-style status/category keys
        // (e.g. `initiated`, `preproduction`), so we apply those filters
        // client-side below instead of sending them as query params.
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const projectsResponse = await affiliateApi.getMyShoots(token, params);

        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const hasQuote = project.quote_id !== null && project.quote_id !== undefined;
          const statusLabel = hasQuote
            ? timelineStageToDashboardLabel(resolveTimelineStage(project))
            : "Pending";
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

          // Use quote total if available, otherwise budget
          const quoteTotal = project.quote_total;
          const budgetTotal = project.budget;
          const displayAmount = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : budgetTotal;
          const numericAmount = displayAmount ? parseFloat(displayAmount) : 0;
          const dateObj = project.event_date ? parseISO(project.event_date) : new Date(0);

          // Categorization: Use labels if available, otherwise event_type mapping
          const category = project.event_type_labels || project.event_type || "Uncategorized";

          return {
            id: `#${project.stream_project_booking_id}`,
            bookingId: String(project.stream_project_booking_id),
            customerName,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            rawDate: dateObj.getTime(),
            category: category,
            price: displayAmount ? `$${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
            rawPrice: numericAmount,
            status: statusLabel as Status,
            hasQuote,
            paymentStatus: PAID_PAYMENT_STATUSES.has(String(project.payment_status || "").toLowerCase()) || !!project.payment_id
              ? "paid"
              : PARTIAL_PAYMENT_STATUSES.has(String(project.payment_status || "").toLowerCase())
                ? "partial"
                : "pending",
            notesCount: Number.isFinite(Number(project.notes_count))
              ? Math.max(0, Number(project.notes_count))
              : 0,
            needsAttention: project.needs_attention
              ? {
                required: Boolean(project.needs_attention.required),
                missing_fields: Array.isArray(project.needs_attention.missing_fields)
                  ? project.needs_attention.missing_fields
                  : [],
              }
              : undefined,
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
  }, [range, statusFilter, categoryFilter, debouncedSearch, externalSelectedDate]);

  // --- CLIENT-SIDE PROCESSING (Search + Sort) ---
  const processedShoots = useMemo(() => {
    // 1. Filter
    let result = shoots.filter((shoot) =>
      shoot.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shoot.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (statusFilter !== "all") {
      const selectedStatus = FILTER_STATUS_TO_LABEL[statusFilter];
      if (selectedStatus) {
        result = result.filter((shoot) => shoot.status === selectedStatus);
      }
    }

    if (categoryFilter !== "all") {
      const query = categoryFilter.toLowerCase();
      result = result.filter((shoot) => shoot.category.toLowerCase().includes(query));
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
  }, [shoots, searchQuery, sortConfig, statusFilter, categoryFilter]);

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
      return <ArrowUpDownIcon size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
      : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
  };

  const totalPages = Math.max(1, Math.ceil(processedShoots.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = processedShoots.slice(startIndex, startIndex + itemsPerPage);

  const visibleGridStatuses = useMemo(() => {
    if (statusFilter !== "all") {
      const selectedStatus = FILTER_STATUS_TO_LABEL[statusFilter];
      return selectedStatus ? [selectedStatus] : [];
    }

    const statuses = [...GRID_STATUS_ORDER];

    if (
      processedShoots.some((shoot) => shoot.status === "Unknown") &&
      !statuses.includes("Unknown")
    ) {
      statuses.push("Unknown");
    }

    return statuses;
  }, [processedShoots, statusFilter]);

  const gridColumns = useMemo(
    () =>
      visibleGridStatuses.map((status) => ({
        status,
        items: processedShoots.filter((shoot) => shoot.status === status),
      })),
    [processedShoots, visibleGridStatuses],
  );

  useEffect(() => {
    if (viewMode !== "list") return;

    const nextPage = Math.min(
      Math.max(currentPage, 1),
      Math.max(totalPages, 1),
    );

    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, totalPages, viewMode]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (id: string) => {
    // Remove the # from the ID
    const cleanId = id.replace('#', '');
    router.push(`/affiliate/shoots/${cleanId}`);
    // onShootClick(cleanId);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents triggering handleRowClick if they overlap
    setExpandedId(expandedId === id ? null : id);
  };

  const handleActionClick = (e: React.MouseEvent, bookingId: string, hasQuote: boolean) => {
    e.stopPropagation();
    // Preserve parent callback support (if used) and ensure action still works if callback is missing.
    onShootClick?.(bookingId);

    if (hasQuote) {
      router.push(`/search-results/payment?shootId=${bookingId}`);
      return;
    }

    if (!canEdit) return;
    router.push(`/affiliate/shoots/${bookingId}/edit-booking`);
  };

  if (!mounted) return null;

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ${
        viewMode === "list"
          ? `rounded-2xl border ${
              isDark
                ? "bg-[#111111] border-[#333333]"
                : "bg-white border-[#E5E5E5]"
            }`
          : "bg-transparent"
      }`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Header controls */}
      <div
        className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 lg:p-6 ${
          viewMode === "list"
            ? `border-b ${
                isDark ? "border-[#333333]" : "border-[#E5E5E5]"
              }`
            : `mb-4 rounded-2xl border ${
                isDark
                  ? "bg-[#111111] border-[#333333]"
                  : "bg-white border-[#E5E5E5]"
              }`
        }`}
      >
        <div className="relative w-full xl:w-[300px]">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? "text-[#666]" : "text-[#999]"
            }`}
            size={18}
          />
          <input
            type="text"
            placeholder="Search Shoots..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full xl:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
              isDark
                ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${
                isDark
                  ? "bg-zinc-900 border-[#333333] text-white/70"
                  : "bg-white border-[#E5E5E5] text-[#666]"
              }`}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark
                  ? "bg-[#111111] border-[#333333]"
                  : "bg-white border-[#E5E5E5] text-black"
              }`}
            >
              {FILTER_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${
                isDark
                  ? "bg-zinc-900 border-[#333333] text-white/70"
                  : "bg-white border-[#E5E5E5] text-[#666]"
              }`}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark
                  ? "bg-[#111111] border-[#333333]"
                  : "bg-white border-[#E5E5E5] text-black"
              }`}
            >
              {FILTER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={range}
            onValueChange={(value) => {
              setRange(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${
                isDark
                  ? "bg-zinc-900 border-[#333333] text-white/70"
                  : "bg-white border-[#E5E5E5] text-[#666]"
              }`}
            >
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent
              className={`${
                isDark
                  ? "bg-[#111111] border-[#333333]"
                  : "bg-white border-[#E5E5E5] text-black"
              }`}
            >
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {externalSelectedDate && (
                <SelectItem value="custom">Selected Date</SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* List / Grid view toggle */}
          <div
            className={`flex items-center rounded-lg border overflow-hidden ${
              isDark
                ? "bg-[#202020] border-white/5"
                : "bg-[#FAFAFA] border-[#E5E5E5]"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-4 py-2.5 transition-colors ${
                viewMode === "list"
                  ? "bg-[#E5D5B8] text-black"
                  : isDark
                    ? "bg-transparent text-white/40 hover:text-white"
                    : "bg-transparent text-[#666] hover:text-black"
              }`}
              aria-label="List view"
              title="List view"
            >
              <List size={18} />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#E5D5B8] text-black"
                  : isDark
                    ? "bg-transparent text-white/40 hover:text-white"
                    : "bg-transparent text-[#666] hover:text-black"
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className={`py-20 text-center ${
            viewMode === "grid"
              ? `rounded-2xl border ${
                  isDark
                    ? "bg-[#111111] border-[#333333]"
                    : "bg-white border-[#E5E5E5]"
                }`
              : ""
          }`}
        >
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
          </div>
        </div>
      ) : processedShoots.length === 0 ? (
        <div
          className={`py-20 text-center ${
            isDark ? "text-white/50" : "text-[#999]"
          } ${
            viewMode === "grid"
              ? `rounded-2xl border ${
                  isDark
                    ? "bg-[#111111] border-[#333333]"
                    : "bg-white border-[#E5E5E5]"
                }`
              : ""
          }`}
        >
          No shoots found.
        </div>
      ) : viewMode === "grid" ? (
        /* GRID / KANBAN VIEW */
        <div className="relative w-full overflow-hidden">
          <div className="overflow-x-auto overflow-y-hidden pb-6">
            <div className="flex items-start gap-5 min-w-max px-1 lg:px-0">
              {gridColumns.map((column) => (
                <div
                  key={column.status}
                  className={`w-[calc(100vw-48px)] sm:w-[340px] lg:w-[360px] shrink-0 rounded-3xl border h-fit ${
                    isDark
                      ? "bg-[#0A0A0A] border-[#FFFFFF33]"
                      : "bg-[#FBF7EF] border-[#E8E0D2]"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between w-full px-5 py-4 rounded-3xl rounded-b-xl sticky top-[-1px] z-20 border-b ${
                      isDark
                        ? "border-white/5 bg-[#202020]"
                        : "border-[#E8E0D2] bg-[#FBF7EF]"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium ${
                        isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"
                      }`}
                    >
                      {column.status}
                    </h4>
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-white/70" : "text-[#666]"
                      }`}
                    >
                      {column.items.length}
                    </span>
                  </div>

                  <div className="max-h-[620px] overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
                    {column.items.length === 0 ? (
                      <div
                        className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm ${
                          isDark
                            ? "border-white/10 text-white/35"
                            : "border-[#E3D9C8] text-[#9A8F7C]"
                        }`}
                      >
                        No shoots in this stage
                      </div>
                    ) : (
                      column.items.map((shoot) => {
                        const missingFields =
                          shoot.needsAttention?.missing_fields || [];

                        return (
                          <div
                            key={`${column.status}-${shoot.id}`}
                            onClick={() => handleRowClick(shoot.id)}
                            className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 ${
                              isDark
                                ? "bg-[#202020] hover:bg-[#1A1A1A]"
                                : "border border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 p-5">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="shrink-0 w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl">
                                  {shoot.initials}
                                </div>

                                <div className="min-w-0 pt-1">
                                  <h4
                                    className={`truncate text-base font-semibold leading-tight ${
                                      isDark ? "text-white" : "text-[#111111]"
                                    }`}
                                  >
                                    {shoot.customerName}
                                  </h4>
                                  <p
                                    className={`mt-1 text-sm font-medium ${
                                      isDark
                                        ? "text-white/40"
                                        : "text-black/40"
                                    }`}
                                  >
                                    {shoot.date}
                                  </p>
                                </div>
                              </div>

                              {missingFields.length > 0 && (
                                <div
                                  className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                                    isDark
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                  title={missingFields
                                    .map((field) => toTitleCase(field))
                                    .join(", ")}
                                >
                                  <AlertCircle size={12} />
                                  Missing Info
                                </div>
                              )}
                            </div>

                            <div
                              className={`h-px w-full ${
                                isDark ? "bg-white/10" : "bg-black/5"
                              }`}
                            />

                            <div className="space-y-4 p-5">
                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className={`text-sm font-medium ${
                                    isDark
                                      ? "text-[#E8D1AB]"
                                      : "text-[#8C6A00]"
                                  }`}
                                >
                                  Shoot ID
                                </p>
                                <p
                                  className={`text-sm font-medium ${
                                    isDark ? "text-white" : "text-[#222222]"
                                  }`}
                                >
                                  {shoot.id}
                                </p>
                              </div>

                              <div className="flex items-start justify-between gap-3">
                                <p
                                  className={`text-sm font-medium shrink-0 ${
                                    isDark
                                      ? "text-[#E8D1AB]"
                                      : "text-[#8C6A00]"
                                  }`}
                                >
                                  Category
                                </p>
                                <p
                                  className={`text-sm text-right font-medium max-w-[190px] ${
                                    isDark ? "text-white" : "text-[#222222]"
                                  }`}
                                >
                                  {shoot.category}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className={`text-sm font-medium ${
                                    isDark
                                      ? "text-[#E8D1AB]"
                                      : "text-[#8C6A00]"
                                  }`}
                                >
                                  Price
                                </p>
                                <p
                                  className={`text-sm font-semibold ${
                                    isDark ? "text-white" : "text-[#222222]"
                                  }`}
                                >
                                  {shoot.price}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <p
                                  className={`text-sm font-medium ${
                                    isDark
                                      ? "text-[#E8D1AB]"
                                      : "text-[#8C6A00]"
                                  }`}
                                >
                                  Payment
                                </p>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    shoot.paymentStatus === "paid"
                                      ? "text-green-400 bg-green-400/10"
                                      : shoot.paymentStatus === "partial"
                                        ? "text-blue-300 bg-blue-400/10"
                                        : "text-yellow-400 bg-yellow-400/10"
                                  }`}
                                >
                                  {shoot.paymentStatus === "paid"
                                    ? "Done"
                                    : shoot.paymentStatus === "partial"
                                      ? "Partial"
                                      : "Pending"}
                                </span>
                              </div>

                              {shoot.paymentStatus !== "paid" && (
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleActionClick(
                                      e,
                                      shoot.bookingId,
                                      shoot.hasQuote,
                                    )
                                  }
                                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
                                >
                                  {shoot.hasQuote
                                    ? "Proceed to Payment"
                                    : "Complete Booking"}
                                </button>
                              )}
                            </div>

                            <div
                              className={`h-px w-full ${
                                isDark ? "bg-white/10" : "bg-black/5"
                              }`}
                            />

                            <div
                              className="flex items-center justify-between p-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StatusBadge status={shoot.status} />

                              <button
                                type="button"
                                onClick={() => setChatOpen(shoot.id)}
                                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 transition-colors"
                                aria-label="Open shoot notes"
                              >
                                {shoot.notesCount > 0 ? (
                                  <>
                                    <span
                                      className={`${
                                        isDark
                                          ? "text-white"
                                          : "text-[#222]"
                                      } text-base leading-none`}
                                    >
                                      {shoot.notesCount}
                                    </span>
                                    <MessageCirclePlus
                                      size={18}
                                      className={`${
                                        isDark
                                          ? "text-[#CFCFCF]"
                                          : "text-[#666]"
                                      } transition-colors`}
                                    />
                                  </>
                                ) : (
                                  <CirclePlus
                                    size={18}
                                    className={`${
                                      isDark
                                        ? "text-[#AFAFAF]"
                                        : "text-[#777]"
                                    } transition-colors`}
                                  />
                                )}
                              </button>
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
        /* LIST VIEW */
        <>
          {/* Mobile list / accordion */}
          <div
            className={`lg:hidden transition-colors duration-300 w-full overflow-hidden ${
              isDark ? "bg-[#111111]" : "bg-[#FAFAFA]"
            }`}
          >
            <div
              className={`flex justify-between items-center px-5 py-3 text-sm font-medium tracking-wide transition-colors ${
                isDark
                  ? "text-[#E8D1AB] bg-white/[0.02] border-b border-white/5"
                  : "bg-[#FFFCF6] text-[#000000] border-b border-[#E8D1AB]/20"
              }`}
            >
              <span>Customer Name</span>
              <span>Status</span>
            </div>

            {currentShoots.map((shoot) => {
              const isExpanded = expandedId === shoot.id;

              return (
                <div
                  key={shoot.id}
                  className={`transition-all duration-300 ${
                    isDark
                      ? isExpanded
                        ? "bg-[#1E1E1E] shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                        : "bg-[#171717]"
                      : isExpanded
                        ? "bg-[#F5F5F7] shadow-sm"
                        : "bg-white shadow-sm"
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer gap-2"
                    onClick={(e) => toggleExpand(e, shoot.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isExpanded
                            ? isDark
                              ? "rotate-180 border-[#E8D1AB] text-[#E8D1AB]"
                              : "rotate-180 border-[#000000] text-[#000000]"
                            : isDark
                              ? "border-white/10 text-white/60"
                              : "border-[#E5E5E5] text-[#999]"
                        }`}
                      >
                        <ChevronDown size={16} />
                      </div>

                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${
                          isDark
                            ? "bg-[#FCF6E8] text-[#000000] border border-white/10"
                            : "bg-[#F4F5F7] text-black border border-black/5"
                        }`}
                      >
                        {shoot.initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {shoot.customerName}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isDark ? "text-white/40" : "text-[#727272]"
                          }`}
                        >
                          {shoot.date}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-auto pl-1">
                      <StatusBadge status={shoot.status} mobile />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-y-4 px-4 pb-4 pt-3">
                      <div>
                        <p
                          className={`text-[10px] uppercase tracking-wider ${
                            isDark ? "text-white/40" : "text-[#666666]"
                          }`}
                        >
                          Shoot ID
                        </p>
                        <p
                          className={`text-sm font-medium mt-0.5 truncate ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {shoot.id}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-[10px] uppercase tracking-wider ${
                            isDark ? "text-white/40" : "text-[#666666]"
                          }`}
                        >
                          Price
                        </p>
                        <p
                          className={`text-sm font-medium mt-0.5 ${
                            isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"
                          }`}
                        >
                          {shoot.price}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p
                          className={`text-[10px] uppercase tracking-wider ${
                            isDark ? "text-white/40" : "text-[#666666]"
                          }`}
                        >
                          Category
                        </p>
                        <p
                          className={`text-sm font-medium mt-0.5 truncate ${
                            isDark ? "text-white" : "text-black"
                          }`}
                        >
                          {shoot.category}
                        </p>
                      </div>

                      <div>
                        <p
                          className={`text-[10px] uppercase tracking-wider ${
                            isDark ? "text-white/40" : "text-[#666666]"
                          }`}
                        >
                          Payment
                        </p>
                        <p
                          className={`text-sm font-medium mt-0.5 ${
                            shoot.paymentStatus === "paid"
                              ? isDark
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : shoot.paymentStatus === "partial"
                                ? isDark
                                  ? "text-blue-300"
                                  : "text-blue-600"
                                : isDark
                                  ? "text-amber-400"
                                  : "text-amber-600"
                          }`}
                        >
                          {shoot.paymentStatus === "paid"
                            ? "Done"
                            : shoot.paymentStatus === "partial"
                              ? "Partial"
                              : "Pending"}
                        </p>
                      </div>

                      <div className="col-span-2 pt-2 space-y-2">
                        {shoot.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleActionClick(
                                e,
                                shoot.bookingId,
                                shoot.hasQuote,
                              )
                            }
                            className="w-full py-2 rounded-lg text-sm font-semibold transition-all bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
                          >
                            {shoot.hasQuote
                              ? "Proceed to Payment"
                              : "Complete Booking"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(shoot.id);
                          }}
                          className={`w-full py-2.5 border rounded-lg text-sm font-semibold transition-all ${
                            isDark
                              ? "bg-white/5 border-white/10 text-[#E8D1AB] hover:bg-white/10"
                              : "bg-white border-[#D7D7D7] text-zinc-800 hover:bg-zinc-50 shadow-sm"
                          }`}
                        >
                          View Full Details
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatOpen(shoot.id);
                          }}
                          className={`w-full py-2.5 border rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            isDark
                              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                              : "bg-white border-[#D7D7D7] text-zinc-800 hover:bg-zinc-50 shadow-sm"
                          }`}
                        >
                          <MessageCirclePlus size={16} />
                          Notes
                          {shoot.notesCount > 0
                            ? ` (${shoot.notesCount})`
                            : ""}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block w-full overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${
                    isDark
                      ? "text-[#E8D1AB] border-[#333333]"
                      : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"
                  }`}
                >
                  <th
                    className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors"
                    onClick={() => requestSort("id")}
                  >
                    <div className="flex items-center">
                      Shoot ID {getSortIcon("id")}
                    </div>
                  </th>

                  <th
                    className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors"
                    onClick={() => requestSort("customerName")}
                  >
                    <div className="flex items-center">
                      Project Name {getSortIcon("customerName")}
                    </div>
                  </th>

                  <th className="py-5 px-6 font-medium">Category</th>

                  <th
                    className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors"
                    onClick={() => requestSort("price")}
                  >
                    <div className="flex items-center">
                      Price {getSortIcon("price")}
                    </div>
                  </th>

                  <th className="py-5 px-6 font-medium">Status</th>
                  <th className="py-5 px-6 font-medium">Payment</th>
                  <th className="py-5 px-6 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentShoots.map((shoot) => {
                  const missingFields =
                    shoot.needsAttention?.missing_fields || [];
                  const hasMissingFields = missingFields.length > 0;
                  const animationData =
                    missingFields.length >= 3
                      ? redAnimation
                      : yellowAnimation;

                  return (
                    <tr
                      key={shoot.id}
                      onClick={() => handleRowClick(shoot.id)}
                      className={`border-b transition-colors last:border-0 cursor-pointer ${
                        isDark
                          ? "border-[#222222] hover:bg-white/[0.02]"
                          : "border-[#F5F5F5] hover:bg-zinc-50"
                      }`}
                    >
                      <td
                        className={`py-5 px-6 text-base leading-none tracking-normal ${
                          isDark ? "text-[#E0E0E0]" : "text-[#333]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 shrink-0 flex items-center justify-center relative"
                            onMouseEnter={() =>
                              setHoveredShootId(`list-${shoot.id}`)
                            }
                            onMouseLeave={() => setHoveredShootId(null)}
                          >
                            {hasMissingFields && (
                              <div>
                                <Lottie
                                  animationData={animationData}
                                  loop
                                />

                                <AnimatePresence>
                                  {hoveredShootId ===
                                    `list-${shoot.id}` && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        x: -10,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        x: 0,
                                      }}
                                      exit={{
                                        opacity: 0,
                                        x: -10,
                                      }}
                                      className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] px-3 py-2 rounded-lg text-xs font-medium shadow-2xl whitespace-nowrap pointer-events-none ${
                                        isDark
                                          ? "bg-[#222] border border-white/10 text-white"
                                          : "bg-white border border-gray-200 text-black"
                                      }`}
                                    >
                                      <div className="flex flex-col gap-1">
                                        <span className="font-bold opacity-70 border-b border-white/10 pb-1 mb-1">
                                          Attention Required:
                                        </span>
                                        {missingFields.map(
                                          (field, index) => (
                                            <span
                                              key={index}
                                              className="flex items-center gap-1.5"
                                            >
                                              <span className="w-1 h-1 rounded-full bg-red-500" />
                                              {toTitleCase(field)}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>

                          <span>{shoot.id}</span>
                        </div>
                      </td>

                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${
                              isDark
                                ? "bg-[#F5F5F5] text-black"
                                : "bg-[#FDF8EE] text-[#B18A00]"
                            }`}
                          >
                            {shoot.initials}
                          </div>

                          <div>
                            <p
                              className={`font-medium text-base leading-none tracking-normal ${
                                isDark
                                  ? "text-[#E0E0E0]"
                                  : "text-[#000000]"
                              }`}
                            >
                              {shoot.customerName}
                            </p>
                            <p
                              className={`text-xs mt-1.5 ${
                                isDark
                                  ? "text-[#666666]"
                                  : "text-[#999]"
                              }`}
                            >
                              {shoot.date}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td
                        className={`py-5 px-6 text-base leading-none tracking-normal ${
                          isDark ? "text-[#E0E0E0]" : "text-[#333]"
                        }`}
                      >
                        {shoot.category}
                      </td>

                      <td
                        className={`py-5 px-6 text-base leading-none tracking-normal ${
                          isDark ? "text-[#E0E0E0]" : "text-[#333]"
                        }`}
                      >
                        {shoot.price}
                      </td>

                      <td className="py-5 px-6">
                        <StatusBadge status={shoot.status} />
                      </td>

                      <td className="py-5 px-6">
                        <span
                          className={`px-4 py-1 text-xs lg:px-6 lg:py-2 lg:text-sm rounded-full font-semibold ${
                            shoot.paymentStatus === "paid"
                              ? "text-green-400 bg-green-400/10"
                              : shoot.paymentStatus === "partial"
                                ? "text-blue-300 bg-blue-400/10"
                                : "text-yellow-400 bg-yellow-400/10"
                          }`}
                        >
                          {shoot.paymentStatus === "paid"
                            ? "Done"
                            : shoot.paymentStatus === "partial"
                              ? "Partial"
                              : "Pending"}
                        </span>
                      </td>

                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {shoot.paymentStatus !== "paid" && (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleActionClick(
                                  e,
                                  shoot.bookingId,
                                  shoot.hasQuote,
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-xs font-semibold"
                            >
                              {shoot.hasQuote
                                ? "Proceed to Payment"
                                : "Complete Booking"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatOpen(shoot.id);
                            }}
                            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/5 transition-colors"
                            aria-label="Open shoot notes"
                          >
                            {shoot.notesCount > 0 ? (
                              <>
                                <span
                                  className={`${
                                    isDark
                                      ? "text-white"
                                      : "text-[#222]"
                                  } text-base leading-none`}
                                >
                                  {shoot.notesCount}
                                </span>
                                <MessageCirclePlus
                                  size={18}
                                  className={`${
                                    isDark
                                      ? "text-[#CFCFCF]"
                                      : "text-[#666]"
                                  } transition-colors`}
                                />
                              </>
                            ) : (
                              <CirclePlus
                                size={18}
                                className={`${
                                  isDark
                                    ? "text-[#AFAFAF]"
                                    : "text-[#777]"
                                } transition-colors`}
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(shoot.id);
                            }}
                            className={
                              isDark
                                ? "text-[#666666]"
                                : "text-[#999]"
                            }
                            aria-label="Open shoot details"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* <NotesDrawer
        isOpen={!!chatOpen}
        onClose={() => setChatOpen(null)}
        shootId={chatOpen ?? undefined}
        isDark={isDark}
        onNotesCountChange={handleNotesCountChange}
      /> */}

      {/* Pagination is list-view only */}
      {!loading &&
        processedShoots.length > 0 &&
        viewMode === "list" && (
          <div
            className={`p-4 lg:p-6 border-t w-full overflow-hidden transition-colors duration-300 min-w-0 ${
              isDark ? "border-[#333333]" : "border-[#E5E5E5]"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between w-full overflow-hidden min-w-0">
              <div
                className={`hidden lg:block text-sm truncate max-w-xs shrink ${
                  isDark ? "text-[#666666]" : "text-[#999]"
                }`}
              >
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + itemsPerPage,
                  processedShoots.length,
                )}{" "}
                of {processedShoots.length} entries
              </div>

              <div className="flex gap-2 items-center justify-center lg:justify-end w-full max-w-full min-w-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${
                    isDark
                      ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                      : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                  }`}
                >
                  <span className="hidden lg:inline">
                    Previous
                  </span>
                  <ChevronLeft className="w-4 h-4 lg:hidden" />
                </button>

                <div className="flex-1 sm:flex-none flex gap-1 items-center justify-center overflow-x-auto no-scrollbar min-w-0 px-1 py-0.5">
                  {(() => {
                    const pageRange: Array<number | "..."> = [];
                    const delta = 1;
                    const left = currentPage - delta;
                    const right = currentPage + delta + 1;

                    for (
                      let page = 1;
                      page <= totalPages;
                      page += 1
                    ) {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= left && page < right)
                      ) {
                        pageRange.push(page);
                      } else if (
                        page === left - 1 ||
                        page === right
                      ) {
                        pageRange.push("...");
                      }
                    }

                    return pageRange
                      .filter(
                        (value, index, values) =>
                          value !== "..." ||
                          values[index - 1] !== "...",
                      )
                      .map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`dots-${index}`}
                            className={`px-1 text-center text-xs font-semibold select-none shrink-0 min-w-[16px] ${
                              isDark
                                ? "text-white/30"
                                : "text-[#999]"
                            }`}
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={page}
                            onClick={() =>
                              handlePageChange(page)
                            }
                            className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all shrink-0 ${
                              currentPage === page
                                ? isDark
                                  ? "bg-[#E5D5B8] text-black"
                                  : "bg-[#E8D1AB] text-black"
                                : isDark
                                  ? "text-white/60 hover:bg-white/5"
                                  : "text-[#666] hover:bg-zinc-100"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${
                    isDark
                      ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                      : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                  }`}
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight className="w-4 h-4 lg:hidden" />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};