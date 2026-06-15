"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Loader2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import Lottie from "lottie-react";
import redAnimation from "@/public/animations/Red.json";
import yellowAnimation from "@/public/animations/Yellow.json";
import Cookies from "js-cookie";
import { affiliateApi } from "@/lib/api";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "../admin/StatusBadge";
import { useTheme } from "next-themes";
import { MobileShootRow } from "../admin/shoot-details/MobileShootRow";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { resolveTimelineStage, timelineStageToDashboardLabel } from "@/lib/utils/projectTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";

type Status = "Initiated" | "PreProduction" | "Shoot Day" | "PostProduction" | "Revision" | "Completed" | "Assets Delivered" | "Pending" | "Cancelled" | "Unknown";

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
  paymentStatus: "paid" | "pending";
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
  const itemsPerPage = 10;
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { canEdit } = usePermissions("shoots");

  // Filtering states
  const [range, setRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredShootId, setHoveredShootId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const router = useRouter();

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
    key: 'rawDate',
    direction: null,
  });
  useEffect(() => { setMounted(true); }, []);

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
            paymentStatus: project.payment_status === "paid" || !!project.payment_id ? "paid" : "pending",
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
      return <ArrowUpDown size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
      : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
  };

  const totalPages = Math.ceil(processedShoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = processedShoots.slice(startIndex, startIndex + itemsPerPage);

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
    <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="relative w-full md:w-[300px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder="Search Shoots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
              {FILTER_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
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
        </div>
      </div>

      {/* Table Grid */}
      < div className="w-full">
        {/* --- MOBILE VIEW (Accordion) --- */}
        <div className={`lg:hidden transition-colors duration-300 w-full overflow-hidden ${isDark ? "bg-[#111111]" : "bg-[#FAFAFA]"}`}>
          {/* Table Header Section */}
          <div className={`flex justify-between items-center px-5 py-3 text-sm font-medium tracking-wide transition-colors ${isDark ? "text-[#E8D1AB] bg-white/[0.02] border-b border-white/5" : "bg-[#FFFCF6] text-[#000000] border-b border-[#E8D1AB]/20"}`}>
            <span>Customer Name</span>
            <span>Status</span>
          </div>

          {currentShoots.map((shoot, idx) => {
            const isExpanded = expandedId === shoot.id;
            return (
              <div
                key={shoot.id}
                className={`transition-all duration-300 ${isDark
                  ? isExpanded ? "bg-[#1E1E1E] shadow-[0_4px_20px_rgba(0,0,0,0.4)]" : "bg-[#171717]"
                  : isExpanded ? "bg-[#F5F5F7] shadow-sm" : "bg-white shadow-sm"
                  }`}
              >
                {/* Header Row */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer gap-2"
                  onClick={(e) => toggleExpand(e, shoot.id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Circular Chevron Toggle */}
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
                      ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
                      : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
                      }`}>
                      <ChevronDown size={16} />
                    </div>

                    {/* Customer Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${isDark ? "bg-[#FCF6E8] text-[#000000] border border-white/10" : "bg-[#F4F5F7] text-black border border-black/5"}`}>
                      {shoot.initials}
                    </div>

                    {/* Customer Text Block - Formatted to wrap/truncate without leaking */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>
                        {shoot.customerName}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-[#727272]"}`}>
                        {shoot.date}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge - Anchored to prevent compression */}
                  <div className="shrink-0 ml-auto pl-1">
                    <StatusBadge status={shoot.status} mobile />
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className={`grid grid-cols-2 gap-y-4 px-4 pb-4 pt-3`}>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666666]"}`}>Shoot ID</p>
                      <p className={`text-sm font-medium mt-0.5 truncate ${isDark ? "text-white" : "text-black"}`}>{shoot.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666666]"}`}>Price</p>
                      <p className={`text-sm font-medium mt-0.5 ${isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"}`}>{shoot.price}</p>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666666]"}`}>Category</p>
                      <p className={`text-sm font-medium mt-0.5 truncate ${isDark ? "text-white" : "text-black"}`}>{shoot.category}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-white/40" : "text-[#666666]"}`}>Payment</p>
                      <p className={`text-sm font-medium mt-0.5 ${shoot.paymentStatus === "paid"
                        ? (isDark ? "text-emerald-400" : "text-emerald-600")
                        : (isDark ? "text-amber-400" : "text-amber-600")
                        }`}>
                        {shoot.paymentStatus === "paid" ? "Done" : "Pending"}
                      </p>
                    </div>
                    {/* Action Buttons Container */}
                    <div className="col-span-2 pt-2 space-y-2">
                      {shoot.paymentStatus === "pending" && (
                        <button
                          onClick={(e) => handleActionClick(e, shoot.bookingId, shoot.hasQuote)}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all bg-[#E8D1AB] text-black hover:bg-[#dcb98a]`}
                        >
                          {shoot.hasQuote ? "Proceed to Payment" : "Complete Booking"}
                        </button>
                      )}
                      <button
                        onClick={() => handleRowClick(shoot.id)}
                        className={`w-full py-2.5 border rounded-lg text-sm font-semibold transition-all ${isDark
                          ? "bg-white/5 border-white/10 text-[#E8D1AB] hover:bg-white/10"
                          : "bg-white border-[#D7D7D7] text-zinc-800 hover:bg-zinc-50 shadow-sm"}`}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- DESKTOP TABLE VIEW (Original) --- */}
        <div className="hidden lg:block w-full overflow-x-auto flex-grow">
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
                <th className="py-5 px-6 font-medium">Payment</th>
                <th className="py-5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="p-5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                    </div>
                  </td>
                </tr>
              ) : currentShoots.length > 0 ? (
                currentShoots.map((shoot, idx) => {
                  const missingFields = shoot.needsAttention?.missing_fields || [];
                  const hasMissingFields = missingFields.length > 0;
                  const animationData = missingFields.length >= 3 ? redAnimation : yellowAnimation;

                  return (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(shoot.id)}
                      className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                    >
                      {/* ID */}
                      <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 shrink-0 flex items-center justify-center relative"
                            onMouseEnter={() => setHoveredShootId(`list-${shoot.id}`)}
                            onMouseLeave={() => setHoveredShootId(null)}
                          >
                            {hasMissingFields && (
                              <div>
                                <Lottie animationData={animationData} loop />
                                <AnimatePresence>
                                  {hoveredShootId === `list-${shoot.id}` && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100] px-3 py-2 rounded-lg text-xs font-medium shadow-2xl whitespace-nowrap pointer-events-none ${isDark
                                        ? "bg-[#222] border border-white/10 text-white"
                                        : "bg-white border border-gray-200 text-black"
                                        }`}
                                    >
                                      <div className="flex flex-col gap-1">
                                        <span className="font-bold opacity-70 border-b border-white/10 pb-1 mb-1">
                                          Attention Required:
                                        </span>
                                        {missingFields.map((field, i) => (
                                          <span key={i} className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-500" />
                                            {toTitleCase(field)}
                                          </span>
                                        ))}
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

                      {/* Customer Info */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                            {shoot.initials}
                          </div>
                          <div>
                            <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                            <p className={`text-xs mt-1.5 ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{shoot.date}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.category}</td>
                      {/* Price */}
                      <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.price}</td>
                      {/* Status */}
                      <td className="py-5 px-6">
                        <StatusBadge status={shoot.status} />
                      </td>

                      {/* Payment */}
                      <td className="py-5 px-6">
                        <span className={`px-4 py-1 text-xs lg:px-6 lg:py-2 lg:text-sm rounded-full font-semibold ${shoot.paymentStatus === "paid" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                          {shoot.paymentStatus === "paid" ? "Done" : "Pending"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {shoot.paymentStatus === "pending" && (
                            <button
                              onClick={(e) => handleActionClick(e, shoot.bookingId, shoot.hasQuote)}
                              className="px-3 py-1.5 rounded-lg bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-xs font-semibold"
                            >
                              {shoot.hasQuote ? "Proceed to Payment" : "Complete Booking"}
                            </button>
                          )}
                          <button className={isDark ? "text-[#666666]" : "text-[#999]"}>
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/50">
                    No shoots found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {
        !loading && processedShoots.length > 0 && (
          <div className={`p-4 lg:p-6 border-t w-full overflow-hidden transition-colors duration-300 min-w-0 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between w-full overflow-hidden min-w-0">

              {/* Pagination Entries Info */}
              <div className={`hidden lg:block text-sm truncate max-w-xs shrink ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedShoots.length)} of {processedShoots.length} entries
              </div>

              {/* Pagination Controls Wrapper */}
              <div className="flex gap-2 items-center justify-center lg:justify-end w-full max-w-full min-w-0 overflow-hidden">

                {/* Previous Button: Text on desktop, Icon on mobile */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark
                    ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10"
                    : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"
                    }`}
                >
                  <span className="hidden lg:inline">Previous</span>
                  <ChevronLeft className="w-4 h-4 lg:hidden" />
                </button>

                {/* Page Numbers - Flex-1 wrapper eliminates viewport clipping under arrows */}
                <div className="flex-1 sm:flex-none flex gap-1 items-center justify-center overflow-x-auto no-scrollbar min-w-0 px-1 py-0.5">
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
                        /* Rendered as an unbonded span node to save space and prevent arrow overlaps */
                        <span
                          key={`dots-${index}`}
                          className={`px-1 text-center text-xs font-semibold select-none shrink-0 min-w-[16px] ${isDark ? "text-white/30" : "text-[#999]"
                            }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center text-xs lg:text-sm font-medium rounded-lg transition-all shrink-0 ${currentPage === page
                            ? (isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black")
                            : (isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100")
                            }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>

                {/* Next Button: Text on desktop, Icon on mobile */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 lg:w-auto lg:px-4 lg:py-2 text-sm font-medium rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-30 ${isDark
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
        )
      }
    </div>
  );
};
