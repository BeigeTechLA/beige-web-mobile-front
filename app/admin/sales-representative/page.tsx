"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { ChevronRight, MoreVertical, Search, Loader2, Target, ChartLine, Calendar, List, Grid3X3, SlidersHorizontal, Users, Check, X, ArrowUpToLine, Grid2x2, Filter, ChevronDown, MoreHorizontal } from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { LeadStatus, SalesLead, LEAD_TYPE_LABELS } from "@/types/sales";
import { useDebounce } from "@/hooks/use-debounce";
import { MobileLeadRow } from "@/components/admin/sales-representative/MobileDetailsBlock";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { adminApi, salesApi as salesService } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DottedDivider from "@/components/admin/DottedDivider";
import OverviewMetricCards from "@/components/admin/OverviewMetricCards";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import { BookingStatus, LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import UsersTable from "@/components/sales/UsersTable";
import LeadsTable from "@/components/sales/BookingLeadsTable";
import { IntentBadge } from "@/components/sales/IntentBadge";
import Topbar from "@/components/admin/Topbar";

type TabType = "Booking" | "Client" | "Creative Partner";
type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

interface UserData {
  id: string;
  bookingId?: string;
  name: string;
  email: string;
  type: "Client" | "Creative Partner";
  status: UserStatus;
  joinDate: string;
  initials: string;
  phoneNumber?: string;
  role?: string;
  imageUrl?: string | null;
  intent?: string;
  bookingStatus?: string;
  assignedSalesRepName?: string;
  assignedSalesRepEmail?: string;
  registrationType?: "guest" | "registered";
}

interface LeadData {
  lead_id: number;
  bookingId?: string;
  clientName: string;
  email: string;
  registrationType?: "guest" | "registered";
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

type OverviewMetric = {
  id: string;
  label: string;
  value: React.ReactNode;
  growth: number;
  icon: React.ElementType;
  color: string;
};

type DashboardOverviewPayload = {
  total_leads?: number | string;
  total_active?: number | string;
  total_active_leads?: number | string;
  active_leads?: number | string;
  sales_assisted?: number | string;
  sales_assisted_leads?: number | string;
  total_conversion?: number | string;
  total_conversion_rate?: number | string;
  conversion_rate?: number | string;
  total_bookings?: number | string;
  bookings?: number | string;
  booked_leads?: number | string;
  growth?: Partial<Record<string, number | string>>;
};

type DashboardMetricStat = {
  value?: number | string;
  change_percent?: number | string;
};


const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (
  paymentStatus: string,
): "Paid" | "In-Progress" => {
  if (paymentStatus === "paid") return "Paid";
  return "In-Progress";
};

const normalizeBookingStatusForList = (value: string): string => {
  if (String(value || "").trim().toLowerCase() === "booked") {
    return "Paid";
  }
  return value;
};

const isPaidBookingStatus = (value: unknown): boolean =>
  ["paid", "booked"].includes(String(value || "").trim().toLowerCase());

const normalizeStatusValue = (value: unknown): string =>
  String(value || "")
    .replace(/\u2013|\u2014/g, "-")
    .trim()
    .toLowerCase();

const isClosedLostStatus = (value: unknown): boolean => {
  const normalized = normalizeStatusValue(value);
  return normalized.includes("closed - lost") || normalized === "cancelled";
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `${minutes} minutes ago`;
  }
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "1 day ago";
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  return date.toLocaleDateString();
};

const OverviewFilters = ["All Time", "Month", "Week"];

const OVERVIEW_PERIOD_MAP: Record<string, string> = {
  "All Time": "all_time",
  "Month": "30days",
  "Week": "7days",
};

const isMetricStat = (value: unknown): value is DashboardMetricStat =>
  !!value && typeof value === "object" && ("value" in value || "change_percent" in value);

const normalizeOverviewSection = (section: Record<string, unknown> = {}): DashboardOverviewPayload => {
  const payload: DashboardOverviewPayload = {};
  const growth: Partial<Record<string, number | string>> = {};

  Object.entries(section).forEach(([key, rawValue]) => {
    if (isMetricStat(rawValue)) {
      payload[key as keyof DashboardOverviewPayload] = rawValue.value ?? 0;
      growth[key] = rawValue.change_percent ?? 0;
      return;
    }

    payload[key as keyof DashboardOverviewPayload] = rawValue as number | string;
  });

  payload.growth = growth;
  return payload;
};

const getOverviewPayload = (response: unknown): DashboardOverviewPayload => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data &&
    typeof response.data === "object"
  ) {
    const data = response.data as Record<string, unknown>;

    if (data.combined && typeof data.combined === "object") {
      return normalizeOverviewSection(data.combined as Record<string, unknown>);
    }

    if (data.overview && typeof data.overview === "object") {
      return normalizeOverviewSection(data.overview as Record<string, unknown>);
    }

    return data as DashboardOverviewPayload;
  }

  if (response && typeof response === "object") {
    const directResponse = response as Record<string, unknown>;

    if (directResponse.combined && typeof directResponse.combined === "object") {
      return normalizeOverviewSection(directResponse.combined as Record<string, unknown>);
    }

    if (directResponse.overview && typeof directResponse.overview === "object") {
      return normalizeOverviewSection(directResponse.overview as Record<string, unknown>);
    }

    return directResponse as DashboardOverviewPayload;
  }

  return {};
};

const toNumber = (value: unknown): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatMetricValue = (value: unknown, suffix = ""): string => {
  const numericValue = toNumber(value);
  return `${numericValue}${suffix}`;
};

const getGrowthValue = (
  growth: DashboardOverviewPayload["growth"],
  keys: string[]
): number => {
  if (!growth) return 0;

  for (const key of keys) {
    const numericValue = Number(growth[key]);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return 0;
};

const buildOverviewMetrics = (payload: DashboardOverviewPayload): OverviewMetric[] => {
  const growth = payload.growth || {};

  return [
    {
      id: "total_active",
      label: "Total Active Leads",
      value: formatMetricValue(
        payload.total_active ??
        payload.total_active_leads ??
        payload.active_leads ??
        payload.total_leads
      ),
      growth: getGrowthValue(growth, [
        "total_active",
        "total_active_leads",
        "active_leads",
        "total_leads",
      ]),
      icon: Users,
      color: "bg-[#E5D5B8]",
    },
    {
      id: "sales_assisted",
      label: "Sales Assisted Leads",
      value: formatMetricValue(payload.sales_assisted ?? payload.sales_assisted_leads),
      growth: getGrowthValue(growth, [
        "sales_assisted",
        "sales_assisted_leads",
      ]),
      icon: Target,
      color: "bg-zinc-800",
    },
    {
      id: "total_conversion",
      label: "Total Conversion Rate",
      value: formatMetricValue(
        payload.total_conversion ?? payload.total_conversion_rate ?? payload.conversion_rate,
        "%"
      ),
      growth: getGrowthValue(growth, [
        "total_conversion",
        "total_conversion_rate",
        "conversion_rate",
      ]),
      icon: ChartLine,
      color: "bg-zinc-800",
    },
    {
      id: "total_bookings",
      label: "Total Bookings",
      value: formatMetricValue(
        payload.total_bookings ?? payload.bookings ?? payload.booked_leads
      ),
      growth: getGrowthValue(growth, [
        "total_bookings",
        "bookings",
        "booked_leads",
      ]),
      icon: Calendar,
      color: "bg-zinc-800",
    },
  ];
};

const getDefaultOverviewMetrics = (): OverviewMetric[] => buildOverviewMetrics({});

const tabs: { label: string; value: TabType }[] = [
  { label: "Booking Leads", value: "Booking" },
  { label: "Client Signup", value: "Client" },
  { label: "Creative Partner Signup", value: "Creative Partner" },
];

const SALES_REP_PAGE_FILTERS_KEY = "sales-rep-management-filters";
const SALES_REP_PRESERVE_KEY = "sales-rep-management-preserve";

const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  "Signed Up - Lead Created",
  "Book a shoot - Lead Created",
  "Manual - Lead Created",
  "Booking In Progress",
  "Proposal Sent",
  "Ready for Payment",
  "Payment Sent",
  "Booked",
  "Closed – Lost",
];

const SHOOT_STAGE_OPTIONS = [
  { label: "All Shoot Stages", value: "all" },
  { label: "Initiated", value: "initiated" },
  { label: "Pre Production", value: "preproduction" },
  { label: "Shoot Day", value: "shootday" },
  { label: "Post Production", value: "postproduction" },
  { label: "Revision", value: "revision" },
  { label: "Completed", value: "completed" },
  { label: "Assets Delivered", value: "assetsdelivered" },
  { label: "Cancelled", value: "cancelled" },
] as const;

export default function AdminSaleRepManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { token } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const hasRestoredFiltersRef = useRef(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = React.useState("");
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | string | null>(null);
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<string | null>(null);
  const [selectedAllowPaymentTransaction, setSelectedAllowPaymentTransaction] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<TabType>("Booking");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // --- LEADS STATE (Booking Tab) ---
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const [leadsViewMode, setLeadsViewMode] = useState<"list" | "grid">("list");
  const leadsLimit = viewMode === "grid" ? 50 : 10;

  const [displayLeads, setDisplayLeads] = useState<LeadData[]>([]);

  // Filters state
  const [leadTypeFilter, setLeadTypeFilter] = useState("All Leads");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [intentFilter, setIntentFilter] = useState<"All" | "Hot" | "Warm" | "Cold">("All");
  const [shootStageFilter, setShootStageFilter] = useState<string>("all");
  const [assignedRepIdFilter, setAssignedRepIdFilter] = useState<string>("all");
  const [assignedRepLabelFilter, setAssignedRepLabelFilter] = useState<string>("All Representatives");
  const [clientAssignedRepIdFilter, setClientAssignedRepIdFilter] = useState<string>("all");
  const [clientAssignedRepLabelFilter, setClientAssignedRepLabelFilter] = useState<string>("All Representatives");
  const [salesRepOptions, setSalesRepOptions] = useState<{ label: string; value: string }[]>([
    { label: "All Representatives", value: "all" },
  ]);

  // --- USERS STATE (Client/CP Tabs) ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalRecords, setUsersTotalRecords] = useState(0);
  const usersLimit = viewMode === "grid" ? 50 : 10;

  const [usersStatusFilter, setUsersStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);

  const [metrics, setMetrics] = useState<OverviewMetric[]>(() => getDefaultOverviewMetrics());
  const [activeMetric, setActiveMetric] = useState('total_active');
  const [isLoading, setIsLoading] = useState(false);
  const [range, setRange] = useState('All Time');

  const fetchDashboardOverview = async () => {
    if (!token) {
      setMetrics(getDefaultOverviewMetrics());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await salesService.getDashboardOverview(
        OVERVIEW_PERIOD_MAP[range] || "all_time"
      );
      const payload = getOverviewPayload(response);
      setMetrics(buildOverviewMetrics(payload));
    } catch (error) {
      console.error("Failed to fetch admin dashboard overview:", error);
      setMetrics(getDefaultOverviewMetrics());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    try {
      const shouldPreserveFilters = window.sessionStorage.getItem(SALES_REP_PRESERVE_KEY) === "true";

      if (!shouldPreserveFilters) {
        window.sessionStorage.removeItem(SALES_REP_PAGE_FILTERS_KEY);
        return;
      }

      const savedFilters = window.sessionStorage.getItem(SALES_REP_PAGE_FILTERS_KEY);
      if (!savedFilters) return;

      const parsed = JSON.parse(savedFilters);
      if (parsed.activeTab) setActiveTab(parsed.activeTab);
      if (typeof parsed.searchQuery === "string") setSearchQuery(parsed.searchQuery);
      if (parsed.leadTypeFilter) setLeadTypeFilter(parsed.leadTypeFilter);
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
      if (parsed.intentFilter) setIntentFilter(parsed.intentFilter);
      if (parsed.shootStageFilter) setShootStageFilter(parsed.shootStageFilter);
      if (parsed.assignedRepIdFilter) setAssignedRepIdFilter(parsed.assignedRepIdFilter);
      if (parsed.clientAssignedRepIdFilter) setClientAssignedRepIdFilter(parsed.clientAssignedRepIdFilter);
      if (parsed.leadsCurrentPage) setLeadsCurrentPage(parsed.leadsCurrentPage);
      if (parsed.usersCurrentPage) setUsersCurrentPage(parsed.usersCurrentPage);
    } catch (error) {
      console.error("Failed to restore sales representative page filters:", error);
    } finally {
      window.sessionStorage.removeItem(SALES_REP_PRESERVE_KEY);
      hasRestoredFiltersRef.current = true;
    }
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // --- FILTER CHANGE LOGIC ---
  // Reset pagination when any lead filter changes
  useEffect(() => {
    setLeadsCurrentPage(1);
  }, [leadTypeFilter, statusFilter, intentFilter, shootStageFilter, assignedRepIdFilter, debouncedSearch, leadsViewMode]);

  useEffect(() => {
    setUsersCurrentPage(1);
  }, [usersStatusFilter, clientAssignedRepIdFilter, debouncedSearch]);

  useEffect(() => {
    if (!token) {
      setSalesRepOptions([{ label: "All Representatives", value: "all" }]);
      return;
    }

    const fetchSalesReps = async () => {
      try {
        const result = await salesService.getSalesReps();
        if (result.success && Array.isArray(result.data)) {
          const mappedOptions = result.data.map((rep: any) => ({
            label: rep.name || `${rep.first_name || ""} ${rep.last_name || ""}`.trim() || `Representative #${rep.id}`,
            value: String(rep.id),
            subLabel: rep.role || "",
          }));
          setSalesRepOptions([{ label: "All Representatives", value: "all" }, ...mappedOptions]);
        } else {
          setSalesRepOptions([{ label: "All Representatives", value: "all" }]);
        }
      } catch (error) {
        console.error("Failed to fetch sales representatives:", error);
        setSalesRepOptions([{ label: "All Representatives", value: "all" }]);
      }
    };

    fetchSalesReps();
  }, [token]);

  useEffect(() => {
    fetchDashboardOverview();
  }, [range, token]);

  useEffect(() => {
    const selectedBookingRep = salesRepOptions.find((option) => option.value === assignedRepIdFilter);
    setAssignedRepLabelFilter(selectedBookingRep?.label || "All Representatives");

    const selectedClientRep = salesRepOptions.find((option) => option.value === clientAssignedRepIdFilter);
    setClientAssignedRepLabelFilter(selectedClientRep?.label || "All Representatives");
  }, [salesRepOptions, assignedRepIdFilter, clientAssignedRepIdFilter]);

  useEffect(() => {
    if (!mounted || !hasRestoredFiltersRef.current) return;

    try {
      window.sessionStorage.setItem(
        SALES_REP_PAGE_FILTERS_KEY,
        JSON.stringify({
          activeTab,
          searchQuery,
          leadTypeFilter,
          statusFilter,
          intentFilter,
          shootStageFilter,
          assignedRepIdFilter,
          clientAssignedRepIdFilter,
          leadsCurrentPage,
          usersCurrentPage,
        })
      );
    } catch (error) {
      console.error("Failed to persist sales representative page filters:", error);
    }
  }, [
    mounted,
    activeTab,
    searchQuery,
    leadTypeFilter,
    statusFilter,
    intentFilter,
    shootStageFilter,
    assignedRepIdFilter,
    clientAssignedRepIdFilter,
    leadsCurrentPage,
    usersCurrentPage,
  ]);

  // --- LEADS API CALL WITH FILTERS ---
  const leadsQueryArgs = token
    ? {
      page: leadsCurrentPage,
      limit: leadsLimit,
      search: debouncedSearch || undefined,
      // Mapping the filters to API keys
      lead_type: leadTypeFilter === "Self-Serve" ? "self_serve" : leadTypeFilter === "Sales Assisted" ? "sales_assisted" : undefined,
      status:
        leadsViewMode === "grid" && shootStageFilter !== "all"
          ? shootStageFilter
          : statusFilter === "All"
            ? undefined
            : statusFilter,
      assigned_to: assignedRepIdFilter === "all" ? undefined : assignedRepIdFilter,
      // Note: If your API slice interface doesn't include 'intent', you may need to add it there too
      intent: intentFilter === "All" ? undefined : intentFilter,
    }
    : skipToken;

  const {
    data: leadsApiData,
    isLoading: leadsIsLoading,
    isFetching: leadsIsFetching,
    refetch: refetchLeads,
  } = useGetLeadsQuery(leadsQueryArgs, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Fetch users for Client and Creative Partner tabs
  const fetchUsers = async () => {
    if (!token || activeTab === "Booking") return;
    setUsersLoading(true);
    try {
      const params: any = {
        // limit: viewMode === "grid" ? 200 : usersLimit,
        // page: viewMode === "grid" ? 1 : usersCurrentPage,
        limit: 200, // Try setting both to 200 to test
        page: 1,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (usersStatusFilter !== "all") params.status = usersStatusFilter;
      if (activeTab === "Client" && clientAssignedRepIdFilter !== "all") {
        params.assigned_to = clientAssignedRepIdFilter;
      }

      let allUsers: UserData[] = [];
      let pagination: any = null;

      if (activeTab === "Client") {
        const clientsRes = await adminApi.getClients(params);

        console.log("Fetched Clients Count:", clientsRes?.data?.length);

        const clientsPayload = clientsRes?.data?.data || clientsRes?.data || {};
        const clientsList = Array.isArray(clientsPayload)
          ? clientsPayload
          : (clientsPayload.leads || clientsPayload.items || []);

        // if (clientsList.length || clientsPayload.pagination) {
        allUsers = clientsList.map((client: any) => ({
          id: `#${client.lead_id || client.user_id || client.id}`,
          bookingId: client.booking_id ? String(client.booking_id) : undefined,
          name: client.client_name || client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown",
          email: client.guest_email || client.email || "No Email",
          type: "Client" as const,
          status: (
            client.lead_status === "signed_up" || client.booking_status === "Signed Up"
              ? "Active"
              : client.status === 1 || client.status === "Active" || client.status === "approved"
                ? "Active"
                : client.status === 0 || client.status === "Inactive" || client.status === "rejected"
                  ? "Inactive"
                  : "Pending"
          ) as UserStatus,
          joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
          initials: (client.client_name || client.name || "Unknown").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
          phoneNumber: client.phone || client.phone_number || "N/A",
          imageUrl: client.profile_image || client.image || null,
          intent: client.intent || "N/A",
          bookingStatus: client.booking_status || mapLeadStatusToUI(client.payment_status),
          assignedSalesRepName: client.assigned_sales_rep?.name || "",
          assignedSalesRepEmail: client.assigned_sales_rep?.email || "",
          registrationType:
            client.registration_type === "guest" || client.client_type === "guest" || !client.user_id
              ? "guest"
              : "registered",
        }));
        // Handle Client Pagination
        const pag = clientsPayload.pagination || clientsRes?.pagination || clientsRes?.data?.pagination;
        setUsers(allUsers);

        if (pag) {
          // Use Number() to force a numeric value and || 0 as a safety net
          // const total = Number(pag.total_records || pag.total || allUsers.length);
          // const pages = Number(pag.total_pages || pag.totalPages || 1);
          const total = allUsers.length;
          setUsersTotalRecords(total);

          const calculatedPages = Math.ceil(total / usersLimit);
          setUsersTotalPages(calculatedPages || 1);
          // setUsersTotalPages(Math.ceil(allUsers.length / usersLimit) || 1);
        } else {
          // If no pagination info, use the length of the current array
          const currentCount = allUsers.length || 0;
          setUsersTotalRecords(currentCount);
          setUsersTotalPages(Math.ceil(currentCount / usersLimit) || 1);
        }
      } else if (activeTab === "Creative Partner") {
        const creativeRes = await adminApi.getPendingCP(params);
        const creativePayload = creativeRes?.data?.data || creativeRes?.data || {};
        const creativeList = Array.isArray(creativePayload) ? creativePayload : (creativePayload.items || []);


        console.log("Fetched CP Count:", creativeRes?.data?.length);

        allUsers = creativeList.map((member: any) => {
          const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || "Unknown";
          const profilePhoto = member.crew_member_files?.find((file: any) => file.file_type === 'profile_photo');
          return {
            id: `#${member.crew_member_id || member.id}`,
            name: fullName,
            email: member.email || "No Email",
            type: "Creative Partner" as const,
            status: (member.status?.toLowerCase() === "approved" ? "Approved" :
              member.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as UserStatus,
            joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            role: member.role?.role_name || member.category_name || "N/A",
            phoneNumber: member.phone_number || "N/A",
            imageUrl: profilePhoto ? `${S3_PREFIX}${profilePhoto.file_path}` : null,
          };
        });

        // Handle Creative Pagination
        const pag = creativeRes?.pagination || creativeRes?.data?.pagination || creativePayload.pagination;
        setUsers(allUsers);
        if (pag) {
          // const total = Number(pag.total_records || pag.total || allUsers.length);
          // // const pages = Number(pag.total_pages || pag.totalPages || 1);

          // setUsersTotalRecords(total);
          // setUsersTotalPages(Math.ceil(allUsers.length / usersLimit) || 1);
          const total = allUsers.length;
          setUsersTotalRecords(total);

          const calculatedPages = Math.ceil(total / usersLimit);
          setUsersTotalPages(calculatedPages || 1);
        } else {
          const currentCount = allUsers.length || 0;

          setUsersTotalRecords(currentCount);
          setUsersTotalPages(Math.ceil(currentCount / usersLimit) || 1);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "Booking") {
      fetchUsers();
    }
  }, [activeTab, debouncedSearch, usersStatusFilter, clientAssignedRepIdFilter]);
  // }, [activeTab, usersCurrentPage, debouncedSearch, usersStatusFilter, clientAssignedRepIdFilter]);

  // Smooth transition effect for Leads mapping
  useEffect(() => {
    if (!token) {
      setDisplayLeads([]);
      return;
    }

    if (leadsApiData?.leads) {
      const mapped: LeadData[] = (leadsApiData.leads || []).map((lead: any) => {
        const manualPaymentSummary = lead?.manual_payment_summary || {};
        const hasManualPaymentHistory = Boolean(
          manualPaymentSummary?.paidAmount > 0 || manualPaymentSummary?.hasFullPayment
        );
        const hasFullManualPayment = Boolean(manualPaymentSummary?.hasFullPayment);
        const isPaidByBookingStatus = isPaidBookingStatus(lead.booking_status);

        return {
          lead_id: lead.lead_id,
          bookingId: lead.booking_id ? String(lead.booking_id) : undefined,
          clientName: lead.client_name || lead.guest_email || "Unknown User",
          email: lead.guest_email || "No email",
          registrationType: lead.user_id ? "registered" : "guest",
          leadType: (lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted") as LeadData["leadType"],
          bookingStatus: hasFullManualPayment
            ? "Paid"
            : normalizeBookingStatusForList(lead.booking_status || "Unknown"),
          lastActivity: formatRelativeTime(lead.last_activity_at),
          date: new Date(lead.created_at),
          intent: lead.intent || "Hot",
          assignedSalesRepName: lead.assigned_sales_rep?.name || "",
          assignedSalesRepEmail: lead.assigned_sales_rep?.email || "",
          hasManualPaymentHistory,
          isPaymentPending: !(isPaidByBookingStatus || hasFullManualPayment),
        };
      });
      setDisplayLeads(mapped);
    } else if (leadsApiData) {
      setDisplayLeads([]); // Clear if no leads found
    }
  }, [leadsApiData]);

  const leadsTotalRecords = leadsApiData?.pagination?.total || 0;
  const leadsTotalPages = Math.ceil(leadsTotalRecords / leadsLimit);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleUserRowClick = (user: UserData) => {
    window.sessionStorage.setItem(SALES_REP_PRESERVE_KEY, "true");
    const rawId = user.id.replace('#', '');
    const basePath = activeTab === "Client"
      ? "/admin/sales-representative/client"
      : "/admin/users/creative-partners";
    router.push(`${basePath}/${rawId}`);
  };

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    client: string,
    id: number | string,
    bookingStatus?: string | null,
    allowPaymentTransaction?: boolean,
  ) => {
    e.stopPropagation();
    if (isClosedLostStatus(bookingStatus)) {
      return;
    }

    setSelectedClient(client);
    setSelectedLeadId(id);
    setSelectedBookingStatus(bookingStatus || null);
    setSelectedAllowPaymentTransaction(Boolean(allowPaymentTransaction));

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 150;
    const horizontalGap = 8;
    const viewportPadding = 12;
    const centeredY = rect.top + rect.height / 2 - menuHeight / 2;

    setMenuAnchor({
      x: Math.max(viewportPadding, rect.left - menuWidth - horizontalGap),
      y: Math.max(
        viewportPadding,
        Math.min(centeredY, window.innerHeight - menuHeight - viewportPadding)
      ),
    });
  };

  const handleRowClick = (leadId: number) => {
    window.sessionStorage.setItem(SALES_REP_PRESERVE_KEY, "true");
    router.push(`/admin/sales-representative/${leadId}`);
  };

  const getGrowthLabel = () => {
    switch (range) {
      case 'Week': return 'from last week';
      case 'Month': return 'from last month';
      case 'All Time': return 'all time';
      default: return 'all time';
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <div className="relative flex-1 max-w-lg">
              <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
              <input
                type="text"
                placeholder={activeTab === "Booking" ? "Search leads..." : "Search users..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`h-12 w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2.5 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                  ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                  : "bg-white border-black/10 text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                  }`}
              />
            </div>
            {/* <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine /> Export
            </Button> */}
            <Button
              onClick={() => router.push("/admin/sales-representative/create-new-deal")}
              className={`h-12 px-4 lg:px-7 transition-colors font-medium ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              Create new lead
            </Button>
          </>
        }
      />

      <div className={`min-h-screen pb-30 p-4 lg:p-6 lg:px-10 lg:py-9 transition-colors duration-300 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}>
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Sales Representative Management
            </h1>
            <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black/60"}`}>
              View activity, manage assignments, and monitor performance across
              your sales team.
            </p>
          </div>
        </div>

        <OverviewMetricCards
          metrics={metrics}
          activeId={activeMetric}
          onSelect={setActiveMetric}
          isLoading={isLoading}
          getGrowthLabel={() => getGrowthLabel()}
          dropdownLabel="Duration"
          dropdownValue={range}
          dropdownOptions={OverviewFilters}
          onDropdownChange={setRange}
        />

        <div className="flex flex-col gap-6 my-6">
          <div className="flex flex-col gap-4">
            <TabsSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                if (tab === "Creative Partner") {
                  setViewMode("list");
                }
                setUsersCurrentPage(1);
                setLeadsCurrentPage(1);
              }}
            />

            {/* New Section  */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              {/* Search field */}
              <div className={`relative flex w-full items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"}`}>
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
                <input
                  type="text"
                  placeholder={activeTab === "Booking" ? "Search leads..." : "Search users..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                    ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                    : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                    }`}
                />
              </div>

              <div className={`flex items-center gap-2 ${activeTab === "Creative Partner" ? "justify-end" : "justify-between"}`}>
                <Button
                  className={`h-12 px-3 lg:px-5 transition-colors text-sm font-medium border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#333]" : "bg-[#E5E5E5] text-black hover:bg-[#D9D9D9]"}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <SlidersHorizontal size={24} className={`mr-1 transition-colors ${isDark ? "text-white" : "text-black"}`} />
                  Filter
                </Button>

                {
                  activeTab !== "Creative Partner" && (
                    <div className={`h-12 flex items-center justify-end gap-2 border rounded-lg lg:rounded-xl ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                      {/* Sliding Toggle Container */}
                      <div className={`relative flex p-1 rounded-lg lg:rounded-xl ${isDark ? "bg-[#202020]" : "bg-black/5"}`}>
                        {/* Animated Slider Background */}
                        <div
                          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg lg:rounded-xl transition-all duration-300 ease-in-out ${isDark ? "bg-[#E5D5B8]" : "bg-[#E8D1AB]"
                            }`}
                          style={{
                            transform: viewMode === "grid" ? "translateX(100%)" : "translateX(0%)",
                          }}
                        />

                        {/* List Button */}
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          className={`relative z-10 inline-flex items-center justify-center rounded-lg lg:rounded-xl px-3.5 py-3 text-sm font-medium transition-colors duration-300 ${viewMode === "list"
                            ? "text-black"
                            : isDark
                              ? "text-white/60 hover:text-white"
                              : "text-[#666666] hover:text-black"
                            }`}
                        >
                          <List size={16} />
                        </button>

                        {/* Grid Button */}
                        <button
                          type="button"
                          onClick={() => setViewMode("grid")}
                          className={`relative z-10 inline-flex items-center justify-center rounded-lg lg:rounded-xl px-3.5 py-3 text-sm font-medium transition-colors duration-300 ${viewMode === "grid"
                            ? "text-black"
                            : isDark
                              ? "text-white/60 hover:text-white"
                              : "text-[#666666] hover:text-black"
                            }`}
                        >
                          <Grid2x2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                }
              </div>
            </div>

            {
              (showFilters && (activeTab !== "Creative Partner")) && (
                <div className={`${isDark ? "bg-[#171717]" : "bg-white"} rounded-lg lg:rounded-xl p-3.5 transition-colors duration-300`}>
                  {activeTab === "Booking" && (
                    <div className="flex flex-wrap gap-2 lg:justify-start lg:gap-4">

                      <BasicDropdown
                        label="Lead Type"
                        value={leadTypeFilter}
                        options={["All Leads", "Self-Serve", "Sales Assisted"]}
                        onChange={(val) => setLeadTypeFilter(val)}
                      />
                      <BasicDropdown
                        label="Client Representative"
                        value={assignedRepIdFilter}
                        options={salesRepOptions}
                        searchable
                        searchPlaceholder="Search representative..."
                        onChange={(val) => {
                          setAssignedRepIdFilter(val);
                        }}
                        openAlign={"right"}
                      />
                      <BasicDropdown
                        label="Intent Type"
                        value={intentFilter}
                        options={["All", "Hot", "Warm", "Cold"]}
                        onChange={(val) => setIntentFilter(val as any)}
                      />
                      {leadsViewMode === "grid" && (
                        <BasicDropdown
                          label="Shoot Stage"
                          value={shootStageFilter}
                          options={SHOOT_STAGE_OPTIONS as any}
                          onChange={(val) => setShootStageFilter(val)}
                        />
                      )}

                      <BasicDropdown
                        label="All Statuses"
                        value={statusFilter}
                        options={["All", ...BOOKING_STATUS_OPTIONS]}
                        onChange={(val) => setStatusFilter(val as any)}
                        openAlign={"right"}
                      />
                    </div>
                  )}

                  {activeTab === "Client" && (
                    <div className="flex flex-wrap gap-2 lg:justify-start lg:gap-4">
                      <BasicDropdown
                        label="Client Representative"
                        value={clientAssignedRepIdFilter}
                        options={salesRepOptions}
                        searchable
                        searchPlaceholder="Search representative..."
                        onChange={(val) => {
                          setClientAssignedRepIdFilter(val);
                        }}
                        openAlign={"right"}
                      />
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* <DottedDivider className="lg:hidden" /> */}

        {activeTab === "Booking" ? (
          <div className="flex flex-col gap-4">
            <div>
              <LeadsTable
                data={displayLeads}
                loading={leadsIsLoading}
                isFetching={leadsIsFetching}
                currentPage={leadsCurrentPage}
                totalPages={leadsTotalPages}
                totalRecords={leadsTotalRecords}
                limit={leadsLimit}
                activeStatusFilter={statusFilter}
                onViewModeChange={setLeadsViewMode}
                onPageChange={(page) => setLeadsCurrentPage(page)}
                onRowClick={handleRowClick}
                onOpenMenu={handleOpenMenu}
                viewMode={viewMode}
              />
            </div>

            {/* <div className="lg:hidden flex flex-col gap-2">
              {displayLeads.map((lead) => (
                <MobileLeadRow
                  key={lead.lead_id}
                  lead={lead}
                  onOpenMenu={(e) => handleOpenMenu(
                    e,
                    lead.clientName,
                    lead.lead_id,
                    lead.bookingStatus,
                    Boolean(lead.isPaymentPending || lead.hasManualPaymentHistory)
                  )}
                />
              ))}
            </div> */}
          </div>
        ) : (
          <UsersTable<UserData>
            data={users}
            loading={usersLoading}
            currentPage={usersCurrentPage}
            totalPages={usersTotalPages}
            totalRecords={usersTotalRecords}
            limit={usersLimit}
            headers={["User ID", "User Info", "Type", "Intent", "Status", "Contact Info", "Action"]}
            onPageChange={(page) => setUsersCurrentPage(page)}
            enableKanbanView
            kanbanStatuses={[...BOOKING_STATUS_OPTIONS, "Approved", "Rejected", "Pending", "Unknown"]}
            getItemId={(user) => user.id}
            getItemStatus={(user) => user.bookingStatus || user.status}
            viewMode={viewMode}
            renderRow={(user, isExpanded) => (
              <>
                {/* 1. USER ID (Desktop Only) */}
                <td className={`hidden md:table-cell py-5 px-6 text-sm transition-colors ${isDark ? "text-[#888]" : "text-[#666]"}`}>{
                  user.id}</td>
                {/* 2. USER INFO (Visible on Mobile & Desktop) */}
                <td className={`p-5 border-b lg:w-auto w-1/2 transition-colors ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Mobile Chevron Toggle */}
                    <div className={`shrink-0 md:hidden h-6 w-6 rounded-full flex items-center justify-center border transition-transform ${isExpanded ? "rotate-180 border-[#E8D1AB] bg-[#E8D1AB]/10" : "border-[#4B4B4B]"
                      }`}>
                      <ChevronDown size={14} className={isExpanded ? "text-[#E8D1AB]" : "text-[#777]"} />
                    </div>

                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isDark ? "bg-[#F5D5D5] text-black" : "bg-[#FEE2E2] text-black"
                        }`}>
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span>{user.initials}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-[15px] truncate ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>
                            {user.name}
                          </p>
                          <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${user.registrationType === "registered"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}>
                            {user.registrationType === "registered" ? "Reg" : "Guest"}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-[#666]" : "text-[#999]"}`}>{user.joinDate}</p>
                      </div>
                      {user.bookingId ? (
                        <p className={`text-xs transition-colors ${isDark ? "text-white" : "text-black"}`}>
                          #{user.bookingId}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* 3. TYPE (Desktop Only) */}
                <td className={`hidden md:table-cell p-5 border-b ${isDark ? "border-[#222] text-[#E0E0E0]" : "border-[#F0F0F0] text-[#333]"}`}>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{user.type}</span>
                    <span className={`text-xs ${isDark ? "text-[#666]" : "text-[#999]"}`}>
                      {user.registrationType === "registered" ? "Registered" : "Guest"}
                    </span>
                  </div>
                </td>

                {/* 4. INTENT (Desktop Only) */}
                <td className={`hidden md:table-cell p-5 border-b ${isDark ? "border-[#222] text-[#E0E0E0]" : "border-[#F0F0F0] text-[#333]"}`}>
                  <IntentBadge intent={(user.intent as any) || "Warm"} />
                </td>

                {/* 5. STATUS (Mobile & Desktop) */}
                <td className={`p-5 border-b text-right md:text-left ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                  <div className="flex justify-end md:justify-start">
                    <LeadsStatusBadge status={(user.bookingStatus as any) || "Booking In Progress"} />
                  </div>
                </td>

                {/* 6. CONTACT (Desktop Only) */}
                <td className={`hidden md:table-cell p-5 border-b ${isDark ? "border-[#222] text-[#E0E0E0]" : "border-[#F0F0F0] text-[#333]"}`}>
                  <div className="space-y-1 min-w-0">
                    <p>{user.phoneNumber}</p>
                    {(user.assignedSalesRepName || user.assignedSalesRepEmail) && (
                      <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                        {user.assignedSalesRepName || "Unassigned"}
                        {user.assignedSalesRepEmail ? ` • ${user.assignedSalesRepEmail}` : ""}
                      </p>
                    )}
                  </div>
                </td>

                {/* 7. ACTION (Desktop Only) */}
                <td className={`hidden md:table-cell p-5 border-b text-right ${isDark ? "border-[#222]" : "border-[#F0F0F0]"}`}>
                  <button
                    className={`transition-colors p-2 rounded-lg ${isDark ? "text-[#666] hover:text-white hover:bg-white/5" : "text-[#999] hover:text-black hover:bg-black/5"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rawId = user.id.replace('#', '');
                      handleOpenMenu(e, user.name, rawId as any, user.bookingStatus || null, false);
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </td>
              </>
            )}

            /* GRID VIEW CARD */
            renderKanbanCard={(user) => (
              <div onClick={() => handleUserRowClick(user)} className="w-full">
                {/* 1. HEADER: Avatar, Name, Date, Menu */}
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[50px] h-[50px] rounded-md bg-[#F1E4D1] flex items-center justify-center text-black font-bold text-xl shrink-0">
                      {user.imageUrl ? <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" /> : user.initials}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs uppercase tracking-widest ${isDark ? "text-[#666]" : "text-[#A3A3A3]"}`}>{user.id}</p>
                      <h4 className={`mt-1 text-base font-semibold leading-tight ${isDark ? "text-white" : "text-[#111111]"}`}>{user.name}</h4>
                    </div>
                  </div>
                  <button
                    className={`p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-white hover:text-white/60" : "text-black/40 hover:text-black"}`}
                    onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, user.name, user.id as any, user.bookingStatus as any, false); }}
                  >
                    <MoreVertical size={24} />
                  </button>
                </div>
                {/* DIVIDER */}
                <div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                {/* 2. BODY: Row-based content */}
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                      Intent
                    </span>
                    <IntentBadge intent={(user.intent || "Hot") as any} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                      Type
                    </span>
                    <span className={`text-sm font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
                      {user.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                      Contact Info
                    </span>
                    <span className={`text-sm font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>
                      {user.phoneNumber}
                    </span>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className={`h-[1px] w-full ${isDark ? "bg-white/50" : "bg-black/5"}`} />

                {/* 3. FOOTER: Status Badge */}
                <div className="flex items-center p-5">
                  <LeadsStatusBadge status={user.bookingStatus || "Unknown"} />
                </div>
              </div>
            )}

            /* MOBILE EXPANDABLE DETAILS */
            renderMobileDetails={(user) => (
              <div className="grid grid-cols-2 gap-y-5">
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Email</p>
                  <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>{user.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Type</p>
                  <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>{user.type}</p>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Intent</p>
                  <IntentBadge intent={(user.intent || "Hot") as "Hot" | "Warm" | "Cold"} />
                </div>
                <div className="space-y-1 text-right">
                  <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>Contact Info</p>
                  <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>{user.phoneNumber}</p>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-medium ${isDark ? "text-white" : "text-[#999]"}`}>Action</p>
                  <button className={`inline-flex items-center justify-center p-1 ${isDark ? "text-white" : "text-black"}`} onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, user.name, user.id as any, user.bookingStatus as any, false); }}>
                    <MoreHorizontal size={28} />
                  </button>
                </div>
              </div>
            )}
          />
        )}

        {menuAnchor && selectedLeadId && (
          <ActionMenu
            client={selectedClient}
            leadId={selectedLeadId}
            allowPaymentTransaction={selectedAllowPaymentTransaction}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            anchor={menuAnchor}
            onDeleteSuccess={() => {
              refetchLeads();
              fetchDashboardOverview();
              if (activeTab !== "Booking") {
                fetchUsers();
              }
            }}
            onManualPaymentSuccess={() => {
              refetchLeads();
              fetchDashboardOverview();
              if (activeTab !== "Booking") {
                fetchUsers();
              }
            }}
            basePath={
              activeTab === "Booking"
                ? "/admin/sales-representative"
                : activeTab === "Client"
                  ? "/admin/sales-representative/client"
                  : activeTab === "Creative Partner"
                    ? "/admin/users/creative-partners"
                    : undefined
            }
          />
        )}

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/admin/sales-representative/create-new-deal")}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Create new lead
          </Button>
        </div>
      </div>
    </>
  );
}
