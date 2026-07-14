"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Search,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Trash2,
  Loader2,
  Download,
  ArrowUpToLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import {
  format,
  startOfDay,
  subDays,
} from "date-fns";

import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/Datepicker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTheme } from 'next-themes';
import { formatCreatorRoles } from "@/lib/creatorRoles";

type UserStatus = "Approved" | "Pending" | "Rejected";

const CREATIVE_PARTNERS_FILTERS_STORAGE_KEY = "admin-users-creative-partners-filters";

type PersistedCreativePartnersFilters = {
  currentPage: number;
  searchQuery: string;
  locationQuery: string;
  statusFilter: string;
};

interface CreativePartner {
  id: string;
  name: string;
  email: string;
  location: string;
  role: string;
  status: UserStatus;
  joinDate: string;
  initials: string;
  imageUrl?: string | null;
}

const formatLocation = (locationInput?: unknown) => {
  const raw =
    typeof locationInput === "string"
      ? locationInput.trim()
      : locationInput && typeof locationInput === "object"
        ? String((locationInput as any).address || (locationInput as any).location || (locationInput as any).full_address || "").trim()
        : String(locationInput || "").trim();
  if (!raw) return "N/A";

  let addressStr = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      addressStr = String(parsed.address || parsed.location || parsed.full_address || raw);
    }
  } catch {
    // Not JSON, use raw string.
  }

  const normalizeSegment = (segment: string) =>
    segment
      .replace(/^\d{3,}(?:-\d+)?\s+/, "")
      .replace(/^\d{3,}(?:\s+\d{3,})*\s+/, "")
      .trim();

  const parts = addressStr
    .split(/[,،，]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return addressStr;

  if (parts.length >= 4) {
    const country = normalizeSegment(parts[parts.length - 1]);
    const middle = normalizeSegment(parts[parts.length - 2] || "");
    const city = normalizeSegment(parts[parts.length - 3]);
    return [city, middle, country].filter(Boolean).join(", ");
  }

  if (parts.length === 3) {
    const secondPartLooksLikeCity = !/^\d/.test(parts[1]);
    if (secondPartLooksLikeCity) {
      return parts.map(normalizeSegment).join(", ");
    }

    const country = normalizeSegment(parts[2]);
    const city = normalizeSegment(parts[1]);
    return [city, country].filter(Boolean).join(", ");
  }

  const country = normalizeSegment(parts[parts.length - 1]);
  return [normalizeSegment(parts[0]), country].filter(Boolean).join(", ");
};

const INITIAL_DATA: CreativePartner[] = [
  { id: "#123456", name: "Ethan Carter", email: "ethanc4519@yahoo.com", location: "N/A", role: "Videographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "EC" },
  { id: "#123456", name: "Lana Guzman", email: "lanaguzman@gmail.com", location: "N/A", role: "Photographer", status: "Pending", joinDate: "Jan 13, 2026", initials: "LG" },
  { id: "#123456", name: "John Lee", email: "johnlee45@gmail.com", location: "N/A", role: "Photographer", status: "Pending", joinDate: "Jan 13, 2026", initials: "JL" },
  { id: "#123456", name: "Maya Ross", email: "mayaross@yahoo.com", location: "N/A", role: "Director", status: "Rejected", joinDate: "Jan 13, 2026", initials: "MR" },
  { id: "#123456", name: "Emily Davis", email: "emilydavis@yahoo.com", location: "N/A", role: "Producer", status: "Pending", joinDate: "Jan 13, 2026", initials: "ED" },
  { id: "#123456", name: "Prince Carter", email: "princecarter@yahoo.com", location: "N/A", role: "Videographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "PC" },
  { id: "#123456", name: "Daniel Roberts", email: "danielrobert@gmail.com", location: "N/A", role: "Photographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "DR" },
  { id: "#123456", name: "Jake Ross", email: "jakeross25@yahoo.com", location: "N/A", role: "Photographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "JR" },
  { id: "#123456", name: "Sophia Johnson", email: "sophiaJ6545@yahoo.com", location: "N/A", role: "Director", status: "Rejected", joinDate: "Jan 13, 2026", initials: "SJ" },
];

const StatusBadge = ({ status, mobile }: { status: UserStatus; mobile?: boolean }) => {
  const styles = {
    Approved: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    Rejected: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
  };

  const padding = mobile ? "px-4 py-1 text-xs" : "px-6 py-2 text-sm";
  return (
    <span className={`${padding} rounded-full font-semibold border  ${styles[status]}`}>
      {status}
    </span>
  );
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

const normalizeSearchQuery = (value: string) => value.trim().replace(/\s+/g, " ");

const getCrewSearchParam = (value: string) => {
  const tokens = normalizeSearchQuery(value).split(" ").filter(Boolean);
  if (tokens.length <= 1) return value;

  return tokens.reduce((longest, token) => (token.length > longest.length ? token : longest), tokens[0]);
};

const matchesCreativePartnerSearch = (user: CreativePartner, searchValue: string) => {
  const tokens = normalizeSearchQuery(searchValue).toLowerCase().split(" ").filter(Boolean);
  if (tokens.length === 0) return true;

  const searchableText = [
    user.id,
    user.name,
    user.email,
    user.location,
    user.role,
    user.status,
    user.joinDate,
  ].join(" ").toLowerCase();

  return tokens.every((token) => searchableText.includes(token));
};

export const CreativePartnersTable = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [users, setUsers] = useState<CreativePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const debouncedLocation = useDebounce(locationQuery, 500);
  const normalizedSearch = normalizeSearchQuery(debouncedSearch);
  const normalizedLocation = debouncedLocation.trim();
  const hasMultiWordSearch = normalizedSearch.includes(" ");
  const crewSearchParam = getCrewSearchParam(normalizedSearch);
  const lastAppliedFilterKeyRef = useRef("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState<"hard_delete" | "soft_delete" | "blocked" | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string>("");
  const [deleteBlockedData, setDeleteBlockedData] = useState<any[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [exportStartDate, setExportStartDate] =
    useState<Date | null>(subDays(new Date(), 30));

  const [exportEndDate, setExportEndDate] =
    useState<Date | null>(new Date());

  const router = useRouter();

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(CREATIVE_PARTNERS_FILTERS_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters) as Partial<PersistedCreativePartnersFilters>;

        if (typeof parsedFilters.searchQuery === "string") {
          setSearchQuery(parsedFilters.searchQuery);
        }

        if (typeof parsedFilters.locationQuery === "string") {
          setLocationQuery(parsedFilters.locationQuery);
        }

        if (typeof parsedFilters.statusFilter === "string") {
          setStatusFilter(parsedFilters.statusFilter);
        }

        if (typeof parsedFilters.currentPage === "number" && parsedFilters.currentPage > 0) {
          setCurrentPage(parsedFilters.currentPage);
        }
      }
    } catch (error) {
      console.error("Failed to restore creative partner filters:", error);
    } finally {
      setFiltersInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;

    const filtersToPersist: PersistedCreativePartnersFilters = {
      currentPage,
      searchQuery,
      locationQuery,
      statusFilter,
    };

    localStorage.setItem(CREATIVE_PARTNERS_FILTERS_STORAGE_KEY, JSON.stringify(filtersToPersist));
  }, [currentPage, searchQuery, locationQuery, statusFilter, filtersInitialized]);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  useEffect(() => {
    const fetchCreativePartners = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: hasMultiWordSearch ? 1 : currentPage,
          limit: hasMultiWordSearch ? 200 : limit,
        };

        if (crewSearchParam) params.search = crewSearchParam;
        if (normalizedLocation) params.location = normalizedLocation;
        if (statusFilter !== "all") params.status = statusFilter;

        const response = await adminApi.getCrewMembers(params);
        if (response && response.data) {
          // Set pagination data
          if (response.pagination) {
            setTotalRecords(response.pagination.total_records || 0);
            setTotalPages(response.pagination.total_pages || 0);
          }

          const data = Array.isArray(response.data) ? response.data : (response.data.items || []);

          // Map API response to component data structure
          const mappedUsers = data.map((member: any) => {
            // Combine first_name and last_name
            const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || "Unknown";

            // Role mapping: show actual creator roles only. Skills are not roles.
            let displayRole = formatCreatorRoles(member.primary_role, "");
            if (!displayRole && member.role?.role_name) {
              displayRole = member.role.role_name;
            }
            if (!displayRole) displayRole = "N/A";

            // Get profile photo from crew_member_files
            const profilePhoto = member.crew_member_files?.find(
              (file: any) => file.file_type === 'profile_photo'
            );
            const imageUrl = profilePhoto
              ? `${S3_PREFIX}${profilePhoto.file_path}`
              : null;
            const location = formatLocation(
              member.location || member.address || member.full_address || member.city || ""
            );

            // Normalize status
            const apiStatus = member.status?.toLowerCase() || "";
            let displayStatus: UserStatus = "Pending";
            if (apiStatus === "approved") displayStatus = "Approved";
            else if (apiStatus === "rejected") displayStatus = "Rejected";

            return {
              id: `#${member.crew_member_id}`,
              name: fullName,
              email: member.email || "No Email",
              location,
              role: displayRole,
              status: displayStatus,
              joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
              initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
              imageUrl,
            };
          });
          const visibleUsers = normalizedSearch
            ? mappedUsers.filter((user: CreativePartner) => matchesCreativePartnerSearch(user, normalizedSearch))
            : mappedUsers;

          setUsers(visibleUsers);
          if (hasMultiWordSearch) {
            setTotalRecords(visibleUsers.length);
            setTotalPages(1);
          }
        }
      } catch (error) {
        console.error("Failed to fetch creative partners:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!filtersInitialized) return;

    const filterKey = [
      normalizedSearch,
      normalizedLocation,
      statusFilter,
    ].join("::");

    if (lastAppliedFilterKeyRef.current !== filterKey) {
      lastAppliedFilterKeyRef.current = filterKey;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchCreativePartners();
  }, [currentPage, limit, normalizedSearch, hasMultiWordSearch, crewSearchParam, normalizedLocation, statusFilter, filtersInitialized]);

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;

    const cleanId = id.replace('#', '');
    router.push(`/admin/users/creative-partners/${cleanId}`);
  };

  const showSuccessToast = () => {
    toast.custom((t) => (
      <div className="flex items-center gap-3 w-full max-w-[400px] bg-[#111] border border-[#222] p-4 rounded-xl shadow-lg relative">
        <div className="w-8 h-8 rounded-full border border-green-500/30 flex items-center justify-center text-green-500 bg-green-500/10">
          <Check size={16} strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-green-500 font-medium text-base">Creative Partner approved</h3>
          <p className="text-[#888] text-sm">The creative partner has been approved successfully.</p>
        </div>
        <button onClick={() => toast.dismiss(t)} className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
    ));
  };

  const showDeclineToast = () => {
    toast.custom((t) => (
      <div className="flex items-center gap-3 w-full max-w-[400px] bg-[#111] border border-[#222] p-4 rounded-xl shadow-lg relative">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff6b6b]">
          <AlertCircle size={24} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[#ff6b6b] font-medium text-base">Creative Partner rejected</h3>
          <p className="text-[#888] text-sm">The creative partner has been rejected.</p>
        </div>
        <button onClick={() => toast.dismiss(t)} className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
    ));
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanId = id.replace('#', '');
    try {
      const response = await adminApi.verifyCrewMember({
        crew_member_id: parseInt(cleanId),
        status: 1
      });
      if (response && !response.error) {
        setUsers(users.map(u => u.id === id ? { ...u, status: "Approved" } : u));
        showSuccessToast();
      } else {
        toast.error(response.error || "Failed to approve partner");
      }
    } catch (error) {
      console.error("Approve Error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDecline = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanId = id.replace('#', '');
    try {
      const response = await adminApi.verifyCrewMember({
        crew_member_id: parseInt(cleanId),
        status: 2
      });
      if (response && !response.error) {
        setUsers(users.map(u => u.id === id ? { ...u, status: 'Rejected' } : u));
        showDeclineToast();
      } else {
        toast.error(response.error || "Failed to decline partner");
      }
    } catch (error) {
      console.error("Decline Error:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const toggleRow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const cleanId = id.replace('#', '');
    setIsDeleting(true); // Re-use isDeleting state for the loading spinner or just to prevent multiple clicks

    try {
      const response = await adminApi.checkCpDeleteStatus(cleanId);
      if (response && response.success !== false) {
        // If API is successful, THEN open the modal and set the ID
        setSelectedDeleteId(id);
        setDeleteActionType(response.action_type || "hard_delete");
        setDeleteMessage(response.message || "Are you sure you want to delete this creative partner?");
        setDeleteBlockedData(response.data || []);
        setDeleteModalOpen(true);
      } else {
        toast.error(response?.error || response?.message || "Failed to check delete status");
      }
    } catch (error) {
      console.error("Delete check error", error);
      toast.error("An error occurred while checking delete status");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeleteId) return;

    // If it's blocked, we shouldn't be able to delete, but just in case
    if (deleteActionType === 'blocked') {
      setDeleteModalOpen(false);
      return;
    }

    const cleanId = selectedDeleteId.replace('#', '');
    setIsDeleting(true);
    try {
      const response = await adminApi.deleteCp(cleanId);
      if (response && response.success !== false) {
        toast.success(response.message || "Creative partner deleted successfully");
        setUsers(users.filter(u => u.id !== selectedDeleteId));
        setDeleteModalOpen(false);
        setSelectedDeleteId(null);
      } else {
        toast.error(response?.error || response?.message || "Failed to delete creative partner");
      }
    } catch (error) {
      console.error("Delete error", error);
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExportCreativePartners = async () => {
  if (isExporting) return;

  if (!exportStartDate || !exportEndDate) {
    toast.error("Please select start and end dates.");
    return;
  }

  const normalizedStartDate =
    startOfDay(exportStartDate);

  const normalizedEndDate =
    startOfDay(exportEndDate);

  const today = startOfDay(new Date());

  if (
    normalizedStartDate > today ||
    normalizedEndDate > today
  ) {
    toast.error("Future dates are not allowed.");
    return;
  }

  if (normalizedStartDate > normalizedEndDate) {
    toast.error(
      "Start date cannot be after end date."
    );
    return;
  }

  const formattedStartDate = format(
    normalizedStartDate,
    "yyyy-MM-dd"
  );

  const formattedEndDate = format(
    normalizedEndDate,
    "yyyy-MM-dd"
  );

  setIsExporting(true);

  try {
    const exportLocation = locationQuery.trim();

    const blob =
      await adminApi.exportCrewMembersCsv({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        status:
          statusFilter !== "all"
            ? statusFilter
            : undefined,
        search:
          normalizedSearch || undefined,
        location:
          exportLocation || undefined,
      });

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error(
        "Invalid or empty export response."
      );
    }

    const downloadUrl =
      window.URL.createObjectURL(blob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download =
      `creative-partners-${formattedStartDate}-to-${formattedEndDate}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    window.URL.revokeObjectURL(downloadUrl);

    setIsExportOpen(false);

    toast.success(
      "Creative partners exported successfully."
    );
  } catch (error) {
    console.error(
      "Export Creative Partners Error:",
      error
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to export creative partners."
    );
  } finally {
    setIsExporting(false);
  }
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-lg lg:text-2xl font-semibold mb-2 ${isDark ? "text-white" : "text-[#323232]"}`}>Creative Partners</h1>
        <p className={`${isDark ? "text-[#888]" : "text-[#666]"} text-xs lg:text-base leading-none`}>Manage and review all onboarded creative professionals in one place.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
                }`} />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[180px] rounded-lg h-[46px] capitalize transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Popover
              open={isExportOpen}
              onOpenChange={(open) => {
                if (!isExporting) {
                  setIsExportOpen(open);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  disabled={isExporting}
                  aria-label="Export creative partners"
                  title="Export creative partners"
                  className={`h-[46px] px-4 rounded-lg flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-[#111] border border-[#333] text-white hover:bg-[#1A1A1A]"
                      : "bg-white border border-[#E3E3E3] text-[#323232] hover:bg-[#F7F7F7]"
                  }`}
                >
                  {isExporting ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowUpToLine size={18} />
                  )}

                  <span className="hidden lg:inline">
                    {isExporting
                      ? "Exporting..."
                      : "Export"}
                  </span>
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={10}
                className={`w-[340px] rounded-2xl border p-5 ${
                  isDark
                    ? "border-[#333] bg-[#111] text-white"
                    : "border-[#E3E3E3] bg-white text-[#323232]"
                }`}
              >
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Export Creative Partners
                    </h3>

                    <p
                      className={`mt-1 text-xs ${
                        isDark
                          ? "text-white/55"
                          : "text-black/55"
                      }`}
                    >
                      Select a date range to download creative partner data.
                    </p>
                  </div>

                  <DatePicker
                    label="Start Date"
                    value={exportStartDate}
                    onChange={(date) => {
                      if (!date) {
                        setExportStartDate(null);
                        return;
                      }

                      const normalizedDate =
                        startOfDay(date);

                      const today =
                        startOfDay(new Date());

                      if (normalizedDate > today) {
                        return;
                      }

                      setExportStartDate(
                        normalizedDate
                      );

                      if (
                        exportEndDate &&
                        normalizedDate >
                          startOfDay(exportEndDate)
                      ) {
                        setExportEndDate(
                          normalizedDate
                        );
                      }
                    }}
                    maxDate={
                      exportEndDate
                        ? startOfDay(exportEndDate)
                        : startOfDay(new Date())
                    }
                    disabled={isExporting}
                    isDark={isDark}
                    disablePortal
                    format="MM/dd/yyyy"
                    sx={{ height: "42px" }}
                  />

                  <DatePicker
                    label="End Date"
                    value={exportEndDate}
                    onChange={(date) => {
                      if (!date) {
                        setExportEndDate(null);
                        return;
                      }

                      const normalizedDate =
                        startOfDay(date);

                      const today =
                        startOfDay(new Date());

                      if (normalizedDate > today) {
                        return;
                      }

                      if (
                        exportStartDate &&
                        normalizedDate <
                          startOfDay(exportStartDate)
                      ) {
                        return;
                      }

                      setExportEndDate(
                        normalizedDate
                      );
                    }}
                    minDate={
                      exportStartDate
                        ? startOfDay(exportStartDate)
                        : undefined
                    }
                    maxDate={startOfDay(new Date())}
                    disabled={isExporting}
                    isDark={isDark}
                    disablePortal
                    format="MM/dd/yyyy"
                    sx={{ height: "42px" }}
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      disabled={isExporting}
                      onClick={() =>
                        setIsExportOpen(false)
                      }
                      className={
                        isDark
                          ? "border border-[#333] bg-transparent text-white hover:bg-white/5"
                          : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                      }
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      disabled={
                        isExporting ||
                        !exportStartDate ||
                        !exportEndDate
                      }
                      onClick={() => {
                        void handleExportCreativePartners();
                      }}
                      className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
                    >
                      {isExporting ? (
                        <>
                          <Loader2
                            size={16}
                            className="mr-2 animate-spin"
                          />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download
                            size={16}
                            className="mr-2"
                          />
                          Download CSV
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="relative w-full lg:w-[280px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search by location..."
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
              }}
              className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors h-[46px] ${
                isDark
                  ? "bg-[#111] border-[#333] text-white"
                  : "bg-white border-[#E3E3E3] text-[#323232]"
              }`}
            />
          </div>
          {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <span>All Status</span>
                        <ChevronRight className="rotate-90" size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <ArrowUpRight size={16} />
                        <span>Export</span>
                    </button>
                    <button className="px-6 py-2.5 bg-[#E5D5B8] text-black font-semibold rounded-lg hover:bg-[#d4c3a3] transition-colors">
                        Book a Shoot
                    </button> */}
          {/* <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          /> */}
        </div>
      </div>

      {/* Table */}
      <div className={`w-full rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-white border-[#E3E3E3] shadow-sm"}`}>
        {/* --- DESKTOP TABLE VIEW --- */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-sm font-medium border-b cursor-pointer leading-none tracking-normal ${isDark ? "text-[#888] border-[#333]" : "bg-[#FFFCF6] text-[#000] border-[#E5E5E5]"}`}>
                <th className="py-5 px-6 font-medium">User ID</th>
                <th className="py-5 px-6 font-medium">
                  <div className="flex flex-col">
                    <span>Creative Name / Email Id</span>
                  </div>
                </th>
                <th className="py-5 px-6 font-medium">Roles</th>
                <th className="py-5 px-6 font-medium">Location</th>
                <th className="py-5 px-6 font-medium">Status</th>
                <th className="py-5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            {loading && (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#888]">
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  </td>
                </tr>
              </tbody>
            )}
            {!loading && users.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#888]">
                    No creative partners found.
                  </td>
                </tr>
              </tbody>
            )}
            {!loading && users.length > 0 && (
              <tbody>
                {users.map((user, idx) => (
                  <tr
                    key={idx}
                    onClick={(e) => handleRowClick(user.id, e)}
                    className={`border-b cursor-pointer transition-colors ${isDark ? "border-[#222] hover:bg-white/[0.02] text-[#E0E0E0]" : "border-[#F0F0F0] hover:bg-black/[0.01] text-[#000]"}`}>
                    <td className="py-5 px-6">{user.id}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        {/* Avatar: Show image if available, otherwise show initials */}
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.textContent = user.initials;
                                }
                              }}
                            />
                          ) : (
                            user.initials
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className={`${isDark ? "text-[#666]" : "text-[#999]"} text-sm mt-0.5 break-all`}>{user.email}</p>
                          <p className={`${isDark ? "text-[#666]" : "text-[#999]"} text-[10px] mt-0.5 uppercase tracking-wider font-bold`}>
                            {user.joinDate}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">{user.role}</td>
                    <td className="py-5 px-6">{user.location}</td>
                    <td className="py-5 px-6">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {user.status === 'Approved' && (
                          <>
                            <button
                              onClick={(e) => handleDeleteClick(user.id, e)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors`}>
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}
                        {user.status === 'Pending' && (
                          <>
                            <button
                              onClick={(e) => handleDeleteClick(user.id, e)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={(e) => handleApprove(user.id, e)}
                              className="px-3 py-1 bg-[#F0FFF4] text-[#22C55E] text-xs font-semibold rounded hover:bg-[#dcfce4] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => handleDecline(user.id, e)}
                              className="px-3 py-1 text-[#EF4444] text-xs font-semibold hover:bg-[#FFEBEB] rounded transition-colors underline decoration-1 underline-offset-2"
                            >
                              Decline
                            </button>
                            <button className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors`}>
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}
                        {user.status === 'Rejected' && (
                          <>
                            <button
                              onClick={(e) => handleDeleteClick(user.id, e)}
                              className="text-[#E0E0E0] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors`}>
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* --- MOBILE COLLAPSIBLE VIEW (Visible below lg) --- */}
        <div className={`lg:hidden divide-y ${isDark ? "divide-[#333]" : "divide-gray-200"}`}>
          {loading && <div className={`py-10 text-center ${isDark ? "text-[#888]" : "text-gray-500"}`}>Loading partners...  </div>}
          {!loading && users.length === 0 && (
            <div className={`py-10 text-center ${isDark ? "text-[#888]" : "text-gray-500"}`}>
              No partners found.
            </div>
          )}

          {!loading && users.map((user) => {
            const isExpanded = expandedRows.has(user.id);
            return (
              <div key={user.id} className={`transition-colors ${isDark ? "bg-[#111]" : "bg-white"}`}>
                <div
                  className={`flex items-center gap-2 p-4 cursor-pointer transition-colors ${isDark ? "active:bg-white/5" : "active:bg-gray-100"}`}
                  onClick={(e) => handleRowClick(user.id, e)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleRow(user.id, e)}
                      className={`p-1 rounded-full  transition-transform duration-200 border ${isExpanded ? (isDark ? 'rotate-180 border-[#E8D1AB]' : 'rotate-180 border-[#000000]') : 'border-[#777674]'}`}
                    >
                      <ChevronDown size={16} className={`${isExpanded ? (isDark ? 'text-[#E8D1AB]' : 'text-[#000]') : 'text-[#777674]'}`} />
                    </button>
                  </div>

                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : user.initials}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.name}</p>
                        <p className={`${isDark ? "text-[#666]" : "text-[#999]"} text-[10px] mt-0.5 uppercase tracking-wider font-bold`}>
                          {user.joinDate}
                        </p>
                        <p className={`${isDark ? "text-[#666]" : "text-[#999]"} text-xs mt-0.5 break-all`}>{user.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={user.status} mobile />
                  </div>
                </div>

                {/* Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`overflow-hidden border-t ${isDark ? "bg-white/[0.02] border-[#222]" : "bg-gray-50 border-gray-100"}`}>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className={`text-xs ${isDark ? "text-[#F5F5F5]" : "text-gray-500"}`}>User ID</p>
                            <p className={`text-xs break-all ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.id}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs ${isDark ? "text-[#F5F5F5]" : "text-gray-500"}`}>Role</p>
                            <p className={`text-xs ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.role}</p>
                          </div>
                          {/* <div >
                            <p className={`text-xs ${isDark ? "text-[#F5F5F5]" : "text-gray-500"}`}>Email ID</p>
                            <p className={`text-xs break-all ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.email}</p>
                          </div> */}
                          <div>
                            <p className={`text-xs ${isDark ? "text-[#F5F5F5]" : "text-gray-500"}`}>Location</p>
                            <p className={`text-xs break-words ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.location}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end justify-between gap-3">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleDeleteClick(user.id, e)}
                              className="px-4 py-2 text-[#EF4444] text-xs font-semibold hover:bg-[#EF4444]/10 rounded-lg transition-colors border border-[#EF4444]/20"
                            >
                              <Trash2 size={18} />
                            </button>
                            {user.status === 'Pending' && (
                              <>
                                <button
                                  onClick={(e) => handleDecline(user.id, e)}
                                  className="px-4 py-2 text-[#EF4444] text-xs font-semibold hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={(e) => handleApprove(user.id, e)}
                                  className="px-4 py-2 bg-[#22C55E]/10 text-[#22C55E] text-xs font-semibold rounded-lg hover:bg-[#22C55E]/20 transition-colors border border-[#22C55E]/20"
                                >
                                  Approve
                                </button>
                              </>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleRowClick(user.id, e)}
                            className="flex items-center gap-1 text-[#fff] text-xs font-semibold px-2 py-2"
                          >
                            <ChevronRight size={30} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className={`flex justify-between items-center p-6 border-t transition-colors ${isDark ? "border-[#333333]" : "border-gray-200"}`}>
          <div className={`hidden lg:block text-sm font-medium ${isDark ? "text-[#666666]" : "text-gray-500"}`}>
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark
                ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black shadow-sm"
                }`}
            >
              Previous
            </button>
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
                    <span key={`dots-${index}`} className={`px-2 py-1 text-xs self-center ${isDark ? "text-white/30" : "text-gray-400"
                      }`}>...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-lg transition-all ${currentPage === page
                        ? "bg-[#E5D5B8] text-black shadow-lg"
                        : (isDark
                          ? "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                          : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-black")
                        }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark
                ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black shadow-sm"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className={`border transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-gray-200 text-black"}`}>
          <DialogHeader>
            <DialogTitle>
              {deleteActionType === 'blocked' ? "Action Blocked" : "Delete Creative Partner"}
            </DialogTitle>
            <DialogDescription className="text-[#888]">
              {deleteMessage}
            </DialogDescription>
            {deleteActionType === 'blocked' && (
              <DialogDescription className="text-[#E8D1AB] mt-2 font-medium">
                To delete this creative partner, you must first reassign their upcoming shoots to another professional.
              </DialogDescription>
            )}
          </DialogHeader>

          {deleteActionType === 'blocked' && deleteBlockedData && deleteBlockedData.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Assigned Shoots:</h4>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {deleteBlockedData.map((shoot: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${isDark
                      ? "bg-[#1A1A1A] border-[#333]"
                      : "bg-gray-50 border-gray-100"
                      }`}
                  >
                    <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{shoot.name}</span>
                    <span className={`text-xs ${isDark ? "text-[#888]" : "text-gray-400"}`}>{new Date(shoot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all ${isDark
                ? "bg-[#1A1A1A] text-white border-[#333] hover:bg-white/10"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {deleteActionType === 'blocked' ? "Close" : "Cancel"}
            </button>
            {deleteActionType !== 'blocked' && (
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
