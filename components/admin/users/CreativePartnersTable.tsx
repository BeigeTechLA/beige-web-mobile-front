"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
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
  ChevronLeft,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import {
  format,
  startOfDay,
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
import { usePermissions } from "@/lib/hooks/usePermissions";
import { formatCreatorRoles } from "@/lib/creatorRoles";
import { getLatestProfilePhoto } from "@/lib/crewFiles";
import Link from "next/link";

type UserStatus = "Approved" | "Pending" | "Rejected";
type CreativePartnerTab = "submitted" | "details_pending";

const CREATIVE_PARTNERS_FILTERS_STORAGE_KEY = "admin-users-creative-partners-filters";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

type PersistedCreativePartnersFilters = {
  currentPage: number;
  searchQuery: string;
  locationQuery: string;
  statusFilter: string;
  activeTab?: CreativePartnerTab;
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
  onboardingProgress?: number;
  onboardingMissingCount?: number;
  onboardingMissingFields?: string[];
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

const ProgressBadge = ({ value, mobile }: { value: number; mobile?: boolean }) => {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const sizeClass = mobile
    ? "px-3 py-1 text-xs"
    : "min-w-[126px] px-4 py-2 text-sm";

  return (
    <span className={`inline-flex items-center justify-center whitespace-nowrap ${sizeClass} rounded-full font-semibold border bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20`}>
      {safeValue}% completed
    </span>
  );
};

const parseMaybeJson = (value: unknown, fallback: unknown) => {
  if (!value) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const hasRequiredValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
};

const calculateOnboardingProgress = (member: any) => {
  const files = Array.isArray(member?.crew_member_files) ? member.crew_member_files : [];
  const roles = parseMaybeJson(member?.primary_role, []);
  const skills = parseMaybeJson(member?.skills, []);
  const equipment = parseMaybeJson(member?.equipment_ownership || member?.equipment, []);
  const socialLinks = parseMaybeJson(member?.social_media_links, {});
  const activeFiles = files.filter((file: any) => Number(file?.is_active ?? 1) === 1);
  const fileType = (file: any) => String(file?.file_type || "").trim().toLowerCase();
  const featuredWorkFiles = activeFiles.filter((file: any) =>
    ["recent_work", "work_sample"].includes(fileType(file)) && hasRequiredValue(file?.file_path)
  );

  const checks = [
    hasRequiredValue(member?.phone_number),
    hasRequiredValue(member?.location),
    hasRequiredValue(member?.working_distance),
    activeFiles.some((file: any) => ["profile_photo", "profile_image"].includes(fileType(file)) && hasRequiredValue(file?.file_path)),
    Array.isArray(roles) && roles.length > 0,
    hasRequiredValue(member?.years_of_experience) && Number(member?.years_of_experience) > 0,
    hasRequiredValue(member?.hourly_rate) && Number(member?.hourly_rate) > 0,
    Array.isArray(skills) && skills.length > 0,
    Array.isArray(equipment) && equipment.length > 0,
    typeof socialLinks === "object" && socialLinks !== null && Object.values(socialLinks).some(hasRequiredValue),
    featuredWorkFiles.length >= 5,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getOnboardingProgress = (member: any) => {
  const explicitProgress =
    member?.onboarding_progress_percent ??
    member?.onboarding_status?.progress_percent ??
    member?.profile_onboarding_status?.progress_percent ??
    member?.progress_percent;

  if (explicitProgress !== undefined && explicitProgress !== null && explicitProgress !== "") {
    return Number(explicitProgress) || 0;
  }

  const completedCount =
    member?.onboarding_completed_count ??
    member?.onboarding_status?.completed_count ??
    member?.profile_onboarding_status?.completed_count ??
    member?.completed_count;

  const totalRequired =
    member?.onboarding_total_required ??
    member?.onboarding_status?.total_required ??
    member?.profile_onboarding_status?.total_required ??
    member?.total_required;

  if (Number(totalRequired) > 0) {
    return Math.round((Number(completedCount || 0) / Number(totalRequired)) * 100);
  }

  return calculateOnboardingProgress(member);
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
  const { canEdit, canDelete } = usePermissions("users");
  const [mounted, setMounted] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [users, setUsers] = useState<CreativePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<CreativePartnerTab>("submitted");
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
  const [isDetailsPendingExporting, setIsDetailsPendingExporting] = useState(false);
  const [reminderSendingIds, setReminderSendingIds] = useState<Set<string>>(new Set());

  // Accordion state tracking for mobile card rows
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [exportStartDate, setExportStartDate] =
    useState<Date | null>(null);

  const [exportEndDate, setExportEndDate] =
    useState<Date | null>(null);

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

        if (parsedFilters.activeTab === "submitted" || parsedFilters.activeTab === "details_pending") {
          setActiveTab(parsedFilters.activeTab);
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
      activeTab,
    };

    localStorage.setItem(CREATIVE_PARTNERS_FILTERS_STORAGE_KEY, JSON.stringify(filtersToPersist));
  }, [currentPage, searchQuery, locationQuery, statusFilter, activeTab, filtersInitialized]);

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
        if (activeTab === "submitted" && statusFilter !== "all") params.status = statusFilter;

        const response = activeTab === "details_pending"
          ? await adminApi.getPendingCP({
            ...params,
            onboarding_status: "incomplete",
          })
          : await adminApi.getCrewMembers(params);
        if (response && response.data) {
          const rawData = Array.isArray(response.data) ? response.data : (response.data.items || []);
          const hasServerPagination = Boolean(response.pagination);
          const data = hasServerPagination || activeTab !== "details_pending" || hasMultiWordSearch
            ? rawData
            : rawData.slice((currentPage - 1) * limit, currentPage * limit);

          if (hasServerPagination) {
            setTotalRecords(response.pagination.total_records || 0);
            setTotalPages(response.pagination.total_pages || 0);
          } else if (activeTab === "details_pending") {
            const total = Number(response.total_pending || rawData.length || 0);
            setTotalRecords(total);
            setTotalPages(hasMultiWordSearch ? 1 : Math.ceil(total / limit));
          }

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

            // Get latest active profile photo from crew_member_files
            const profilePhoto = getLatestProfilePhoto(member.crew_member_files);
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

            const onboardingMissingFields = Array.isArray(member.onboarding_missing_fields)
              ? member.onboarding_missing_fields
              : Array.isArray(member.onboarding_status?.missing_fields)
                ? member.onboarding_status.missing_fields
                : Array.isArray(member.profile_onboarding_status?.missing_fields)
                  ? member.profile_onboarding_status.missing_fields
                  : Array.isArray(member.missing_fields)
                    ? member.missing_fields
                    : [];

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
              onboardingProgress: getOnboardingProgress(member),
              onboardingMissingCount: Number(
                member.onboarding_missing_count ??
                member.onboarding_status?.missing_count ??
                member.profile_onboarding_status?.missing_count ??
                member.missing_count ??
                onboardingMissingFields.length
              ),
              onboardingMissingFields,
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
      activeTab,
    ].join("::");

    if (lastAppliedFilterKeyRef.current !== filterKey) {
      lastAppliedFilterKeyRef.current = filterKey;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchCreativePartners();
  }, [currentPage, limit, normalizedSearch, hasMultiWordSearch, crewSearchParam, normalizedLocation, statusFilter, activeTab, filtersInitialized]);

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;

    const cleanId = id.replace('#', '');
    router.push(`/admin/users/creative-partners/${cleanId}`);
  };

  const getCreativePartnerDetailHref = (id: string) => {
    const cleanId = id.replace('#', '');
    return `/admin/users/creative-partners/${cleanId}`;
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

  const handleTabChange = (tab: CreativePartnerTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedRows(new Set());
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

  const handleSendProfileReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanId = id.replace("#", "");
    if (!cleanId || reminderSendingIds.has(cleanId)) return;

    setReminderSendingIds((current) => new Set(current).add(cleanId));
    try {
      const response = await adminApi.sendCreativePartnerProfileReminder(cleanId);

      if (response?.success !== false) {
        toast.success(response?.message || "Profile reminder email sent successfully.");
      } else {
        toast.error(response?.error || response?.message || "Failed to send profile reminder.");
      }
    } catch (error) {
      console.error("Send Profile Reminder Error:", error);
      toast.error("An unexpected error occurred while sending the reminder.");
    } finally {
      setReminderSendingIds((current) => {
        const next = new Set(current);
        next.delete(cleanId);
        return next;
      });
    }
  };

  const handleExportCreativePartners = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      const exportLocation = locationQuery.trim();
      const startDate = exportStartDate;
      const endDate = exportEndDate;

      if (Boolean(startDate) !== Boolean(endDate)) {
        throw new Error(
          "Select both dates or leave both blank to export all records."
        );
      }

      const exportParams: {
        start_date?: string;
        end_date?: string;
        status?: string;
        search?: string;
        location?: string;
      } = {
        status:
          statusFilter !== "all"
            ? statusFilter
            : undefined,
        search:
          normalizedSearch || undefined,
        location:
          exportLocation || undefined,
      };

      let fileName = "creative-partners-all-records.csv";

      if (startDate && endDate) {
        const normalizedStartDate = startOfDay(startDate);
        const normalizedEndDate = startOfDay(endDate);
        const today = startOfDay(new Date());

        if (
          normalizedStartDate > today ||
          normalizedEndDate > today
        ) {
          throw new Error("Future dates are not allowed.");
        }

        if (normalizedStartDate > normalizedEndDate) {
          throw new Error(
            "Start date cannot be after end date."
          );
        }

        const formattedStartDate = format(
          normalizedStartDate,
          "yyyy-MM-dd"
        );

        const formattedEndDate = format(
          normalizedEndDate,
          "yyyy-MM-dd"
        );

        exportParams.start_date = formattedStartDate;
        exportParams.end_date = formattedEndDate;
        fileName = `creative-partners-${formattedStartDate}-to-${formattedEndDate}.csv`;
      }

      const blob =
        await adminApi.exportCrewMembersCsv(exportParams);

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
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setIsExportOpen(false);
      setExportStartDate(null);
      setExportEndDate(null);

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

  const handleExportDetailsPending = async () => {
    if (isDetailsPendingExporting) return;

    setIsDetailsPendingExporting(true);

    try {
      const token = Cookies.get("revure_token");
      const response = await axios.get<Blob>(
        "admin/creative-partners/details-pending/export",
        {
          baseURL: API_BASE_URL,
          params: {
            search: normalizedSearch || undefined,
            location: normalizedLocation || undefined,
          },
          responseType: "blob",
          withCredentials: true,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const blob = response.data;

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Invalid or empty export response.");
      }

      const contentDispositionHeader = response.headers["content-disposition"];
      const filenameHeader = typeof contentDispositionHeader === "string"
        ? contentDispositionHeader
        : "";
      const utf8Match = filenameHeader.match(/filename\*=UTF-8''([^;]+)/i);
      const filenameMatch = filenameHeader.match(/filename="?([^";]+)"?/i);
      const fileName = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1].replace(/['"]/g, ""))
        : filenameMatch?.[1] || "details-pending-cps-export.xlsx";

      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Details pending creative partners exported successfully.");
    } catch (error) {
      let message = "Failed to export creative partners.";

      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (responseData instanceof Blob) {
          try {
            const errorText = await responseData.text();
            const parsedError = JSON.parse(errorText);
            message = parsedError?.message || parsedError?.error || message;
          } catch {
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      console.error("Export Details Pending Creative Partners Error:", error);

      toast.error(message);
    } finally {
      setIsDetailsPendingExporting(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Header */}
      <div>
        <h1 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>Creative Partners</h1>
        <p className={`${isDark ? "text-[#888]" : "text-[#666]"} text-xs lg:text-base leading-none`}>
          Manage submitted and incomplete creative partner profiles in one place.
        </p>
      </div>

      <div className={`inline-flex rounded-lg border p-1 ${isDark ? "border-white/10 bg-[#111]" : "border-[#E3E3E3] bg-white"}`}>
        {[
          { value: "submitted" as const, label: "Submitted CPs" },
          { value: "details_pending" as const, label: "Details Pending" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`h-10 rounded-md px-4 text-sm font-semibold transition-colors ${activeTab === tab.value
              ? "bg-[#E8D1AB] text-black"
              : isDark
                ? "text-white/60 hover:text-white"
                : "text-[#32323299] hover:text-[#323232]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Search & Status Filter */}
        <div className="flex-1 flex items-center gap-2 lg:gap-4 flex-1">
          <div className="relative flex-1 max-w-2xl min-w-[240px]">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`} size={18} />
            <input
              type="text"
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${isDark
                ? "border-white/20 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
                : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40"}`}
            />
          </div>

          {activeTab === "submitted" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[180px] rounded-lg h-12 capitalize transition-colors ${isDark ? "border-white/20 bg-[#202020] text-[#C4C4C4] hover:bg-[#252525]" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"}`}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className={isDark ? "border-white/20 bg-[#202020] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          )}

          {activeTab === "submitted" && (
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
                className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2 ${isDark
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
              className={`w-[340px] rounded-2xl border p-5 ${isDark
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
                    className={`mt-1 text-xs ${isDark
                      ? "text-white/55"
                      : "text-black/55"
                      }`}
                  >
                    Leave both dates blank to download all creative partners, or pick a range to filter the export.
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

                {(exportStartDate || exportEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setExportStartDate(null);
                      setExportEndDate(null);
                    }}
                    disabled={isExporting}
                    className={`text-xs font-medium underline underline-offset-4 transition-colors ${isDark
                      ? "text-white/70 hover:text-white"
                      : "text-black/60 hover:text-black"
                      }`}
                  >
                    Reset dates
                  </button>
                )}

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
                      isExporting
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
          )}

          {activeTab === "details_pending" && (
            <Button
              type="button"
              disabled={isDetailsPendingExporting}
              aria-label="Export details pending creative partners"
              title="Export details pending creative partners"
              onClick={() => {
                void handleExportDetailsPending();
              }}
              className={`h-12 px-4 rounded-lg flex items-center justify-center gap-2 ${isDark
                ? "bg-[#111] border border-[#333] text-white hover:bg-[#1A1A1A]"
                : "bg-white border border-[#E3E3E3] text-[#323232] hover:bg-[#F7F7F7]"
                }`}
            >
              {isDetailsPendingExporting ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <ArrowUpToLine size={18} />
              )}

              <span className="hidden lg:inline">
                {isDetailsPendingExporting
                  ? "Exporting..."
                  : "Export"}
              </span>
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-wrap items-center justify-end gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`} size={18} />
            <input
              type="text"
              placeholder="Search by location..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${isDark
                ? "border-white/20 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
                : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40"}`}
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
      <div className={isDark
        ? "overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]"
        : "overflow-hidden rounded-2xl border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"}>
        {/* --- DESKTOP TABLE VIEW --- */}
        <div className="hidden lg:block w-full overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[1540px] border-collapse">
              <thead>
                <tr className={`border-b text-left text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
                  <th className="w-[110px] p-5 font-medium rounded-bl-xl">User ID</th>
                  <th className="w-[360px] p-5 font-medium">Creative Name</th>
                  <th className="w-[320px] p-5 font-medium">Email</th>
                  <th className="w-[220px] p-5 font-medium">Roles</th>
                  <th className="w-[320px] p-5 font-medium">Location</th>
                  <th className="w-[200px] p-5 font-medium text-center">{activeTab === "details_pending" ? "Progress" : "Status"}</th>
                  <th className="w-[210px] p-5 font-medium text-right rounded-br-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#888]">
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    </td>
                  </tr>
                ) : (!loading && users.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#888]">
                      No creative partners found.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => {
                    const partnerDetailHref = getCreativePartnerDetailHref(user.id);
                    return (
                    <tr
                      key={user.id || idx}
                      className={`relative ${isDark ? "group text-white transition-colors hover:bg-[#202020]" : "group text-[#323232] transition-colors hover:bg-black/[0.015]"}`}
                    >
                      <td className="relative py-3 px-6 truncate">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{user.id}</span>
                      </td>                      
                      <td className="relative py-3 px-6">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none flex items-center gap-3 min-w-0">
                          {/* Avatar: Show image if available, otherwise show initials */}
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-bold border overflow-hidden ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                            {user.imageUrl ? (
                              <img
                                src={user.imageUrl}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
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
                          <div className="min-w-0">
                            <p className="capitalize font-medium truncate">{user.name}</p>
                            {/* <p className={`mt-1 truncate text-sm ${isDark ? "text-white/40" : "text-[#32323266]"}`}>{user.email}</p> */}
                            <p className={`mt-1 truncate text-xs ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                              {user.joinDate}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="relative py-3 px-6 truncate">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{user.email}</span>
                      </td>
                      <td className="relative py-3 px-6">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{user.role}</span>
                      </td>
                      <td className="relative py-3 px-6 whitespace-nowrap">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{user.location}</span>
                      </td>
                      <td className="relative py-3 px-6 text-center whitespace-nowrap">
                        <Link href={partnerDetailHref} className="absolute inset-0 z-20" aria-label={`Open creative partner ${user.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none inline-block">
                          {activeTab === "details_pending" ? (
                            <ProgressBadge value={user.onboardingProgress || 0} />
                          ) : (
                            <StatusBadge status={user.status} />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {activeTab === "details_pending" && (
                            <>
                              <button
                                type="button"
                                disabled={!canEdit || user.email === "No Email" || reminderSendingIds.has(user.id.replace("#", ""))}
                                onClick={(e) => handleSendProfileReminder(user.id, e)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark
                                  ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB] hover:bg-[#E8D1AB]/15"
                                  : "border-[#D7BC8A] bg-[#FFF9E5] text-[#8A6500] hover:bg-[#F7ECD3]"
                                  }`}
                              >
                                {reminderSendingIds.has(user.id.replace("#", "")) ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Mail size={14} />
                                )}
                                <span>{reminderSendingIds.has(user.id.replace("#", "")) ? "Sending..." : "Send Reminder"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRowClick(user.id, e)}
                                className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors p-1`}
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                          {activeTab === "submitted" && user.status === 'Approved' && (
                            <>
                              <button
                                type="button"
                                disabled={!canDelete}
                                onClick={(e) => handleDeleteClick(user.id, e)}
                                className="hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 p-1"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRowClick(user.id, e)}
                                className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors p-1`}
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                          {activeTab === "submitted" && user.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                disabled={!canDelete}
                                onClick={(e) => handleDeleteClick(user.id, e)}
                                className="hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40 p-1"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={(e) => handleApprove(user.id, e)}
                                className="px-3 py-1 bg-[#F0FFF4] text-[#22C55E] text-xs font-semibold rounded hover:bg-[#dcfce4] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={(e) => handleDecline(user.id, e)}
                                className="px-3 py-1 text-[#EF4444] text-xs font-semibold hover:bg-[#FFEBEB] rounded transition-colors underline decoration-1 underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRowClick(user.id, e)}
                                className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors p-1`}
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                          {activeTab === "submitted" && user.status === 'Rejected' && (
                            <>
                              <button
                                type="button"
                                disabled={!canDelete}
                                onClick={(e) => handleDeleteClick(user.id, e)}
                                className="text-[#E0E0E0] hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRowClick(user.id, e)}
                                className={`${isDark ? "text-[#666] hover:text-white" : "text-[#888] hover:text-black"} transition-colors p-1`}
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>
        {/* --- MOBILE COLLAPSIBLE VIEW (Visible below lg) --- */}
        <div className="block lg:hidden w-full">
          <div className={`flex justify-between p-5 rounded-b-xl border-y text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
            <p>Name</p>
            <p>{activeTab === "details_pending" ? "Progress" : "Status"}</p>
          </div>
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
            </div>
          ) : users.length === 0 ? (
            <div className={`px-4 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
              No users found for the selected filters.
            </div>
          ) : (
            users.map((user) => {
              const isExpanded = expandedRows.has(user.id);
              // console.log(user);

              return (
                <div
                  key={user.id}
                  className={`p-5 transition-colors ${isDark ? "text-white" : "text-[#323232]"} ${isExpanded ? (isDark ? "bg-[#202020]" : "bg-[#F9F9F9]") : "bg-transparent"}`}
                >
                  <div
                    className={`flex items-center justify-between gap-2 cursor-pointer transition-colors ${isDark ? "active:bg-white/5" : "active:bg-gray-100"}`}
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
                        </div>
                      </div>
                      {activeTab === "details_pending" ? (
                        <ProgressBadge value={user.onboardingProgress || 0} mobile />
                      ) : (
                        <StatusBadge status={user.status} mobile />
                      )}
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
                        className="pt-4 space-y-4 min-w-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>User ID</p>
                            <p className={`text-sm break-all ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.id}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Role</p>
                            <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.role}</p>
                          </div>
                          <div >
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Email ID</p>
                            <p className={`text-sm break-all ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Location</p>
                            <p className={`text-sm break-words ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>{user.location}</p>
                          </div>
                          {activeTab === "details_pending" && (
                            <div className="col-span-2">
                              <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Missing Details</p>
                              <p className={`text-sm break-words ${isDark ? "text-[#A1A1A1]" : "text-gray-700"}`}>
                                {user.onboardingMissingFields?.length ? user.onboardingMissingFields.join(", ") : "N/A"}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-end justify-between gap-3">
                          <div className="flex  gap-2">
                            {activeTab === "submitted" && user.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={(e) => handleApprove(user.id, e)}
                                  className="px-3 py-2 bg-[#EBFFF0] text-[#16A34A] text-xs font-semibold rounded-lg transition-colors border border-[#EBFFF0] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={(e) => handleDecline(user.id, e)}
                                  className=" py-2 text-[#F98A84] text-xs font-semibold hover:bg-[#EF4444]/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {activeTab === "submitted" && (
                            <button
                              type="button"
                              disabled={!canDelete}
                              onClick={(e) => handleDeleteClick(user.id, e)}
                              className=" py-2 text-[#F98A84] text-xs font-semibold hover:bg-[#EF4444]/10 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={18} />
                            </button>
                            )}
                            {activeTab === "details_pending" && (
                              <button
                                type="button"
                                disabled={!canEdit || user.email === "No Email" || reminderSendingIds.has(user.id.replace("#", ""))}
                                onClick={(e) => handleSendProfileReminder(user.id, e)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark
                                  ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/10 text-[#E8D1AB]"
                                  : "border-[#D7BC8A] bg-[#FFF9E5] text-[#8A6500]"
                                  }`}
                              >
                                {reminderSendingIds.has(user.id.replace("#", "")) ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Mail size={14} />
                                )}
                                <span>{reminderSendingIds.has(user.id.replace("#", "")) ? "Sending..." : "Reminder"}</span>
                              </button>
                            )}

                          </div>
                          <button
                            onClick={(e) => handleRowClick(user.id, e)}
                            className="flex items-center gap-1 text-[#fff] text-xs font-semibold px-2 py-2"
                          >
                            <ChevronRight size={30} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Shared Footer Pagination Wrapper Zone */}
        {!loading && totalPages > 1 && (
          <div className={`flex flex-col gap-4 border-t px-6 py-3 lg:flex-row lg:items-center lg:justify-between ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <p className={`hidden lg:block text-sm whitespace-nowrap ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
            </p>

            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-end w-full max-w-full min-w-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark
                  ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(() => {
                const rangePages = [];
                const delta = 1;
                const left = currentPage - delta;
                const right = currentPage + delta + 1;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= left && i < right)) {
                    rangePages.push(i);
                  } else if (i === left - 1 || i === right) {
                    rangePages.push('...');
                  }
                }

                return rangePages.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-10 w-10 items-center justify-center text-sm text-white/30"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${currentPage === page
                        ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#111111]"
                        : (isDark
                          ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                          : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]")
                        }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark
                  ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
    </div >
  );
};
