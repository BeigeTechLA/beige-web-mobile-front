"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { ChevronRight, MoreVertical, Search, Loader2, Target, ChartLine, Calendar, ArrowUpRight, User, Camera, Users, Check, X, ArrowUpToLine, List, Grid3X3 } from "lucide-react";
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
  hasCreativePartnerAssigned?: boolean;
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
const LEADS_FILTER_ALL_LIMIT = 5000;

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

const CP_ASSIGNMENT_OPTIONS = [
  { label: "All CP Assignment", value: "all" },
  { label: "CP Assigned", value: "assigned" },
  { label: "CP Not Assigned", value: "not_assigned" },
] as const;

const PRODUCTION_FILTER_OPTIONS = [
  { label: "All Production", value: "all" },
  { label: "Pre Production - File Not Provided", value: "pre_production_file_not_provided" },
  { label: "Pre Production - Meeting Not Done", value: "pre_production_meeting_not_done" },
  { label: "Post Production - Meeting Not Done", value: "post_production_meeting_not_done" },
  { label: "Post Production - File Not Uploaded", value: "post_production_file_not_uploaded" },
] as const;

const normalizeAssignedRepFilterValue = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "all";
  const lower = raw.toLowerCase();
  if (lower === "all") return "all";
  if (lower === "unassigned") return "unassigned";
  if (/^\d+$/.test(raw)) return raw;
  return "all";
};

const PRODUCTION_FILTER_ALLOWED_VALUES = new Set(
  PRODUCTION_FILTER_OPTIONS.map((option) => option.value)
);

const normalizeProductionFilterValue = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "all";
  const lower = raw.toLowerCase();
  if (lower === "all" || lower === "all production") return "all";
  return PRODUCTION_FILTER_ALLOWED_VALUES.has(raw) ? raw : "all";
};

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

  // --- LEADS STATE (Booking Tab) ---
  const [leadsCurrentPage, setLeadsCurrentPage] = useState(1);
  const [leadsViewMode, setLeadsViewMode] = useState<"list" | "grid">("list");
  const [cpAssignmentFilter, setCpAssignmentFilter] = useState<"all" | "assigned" | "not_assigned">("all");
  const [productionFilter, setProductionFilter] = useState<string>("all");
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
  const hasAnyGridLeadFilterActive = (
    leadTypeFilter !== "All Leads" ||
    statusFilter !== "All" ||
    intentFilter !== "All" ||
    shootStageFilter !== "all" ||
    assignedRepIdFilter !== "all" ||
    cpAssignmentFilter !== "all" ||
    productionFilter !== "all" ||
    Boolean(debouncedSearch)
  );
  const leadsLimit =
    leadsViewMode === "grid"
      ? hasAnyGridLeadFilterActive
        ? LEADS_FILTER_ALL_LIMIT
        : 50
      : 10;

  // --- USERS STATE (Client/CP Tabs) ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(0);
  const [usersTotalRecords, setUsersTotalRecords] = useState(0);
  const [usersLimit] = useState(50);
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>("all");

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
      const savedFilters = window.sessionStorage.getItem(SALES_REP_PAGE_FILTERS_KEY);
      if (!savedFilters) return;

      const parsed = JSON.parse(savedFilters);
      if (parsed.activeTab) setActiveTab(parsed.activeTab);
      if (typeof parsed.searchQuery === "string") setSearchQuery(parsed.searchQuery);
      if (parsed.leadTypeFilter) setLeadTypeFilter(parsed.leadTypeFilter);
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
      if (parsed.intentFilter) setIntentFilter(parsed.intentFilter);
      if (parsed.shootStageFilter) setShootStageFilter(parsed.shootStageFilter);
      if (parsed.assignedRepIdFilter) setAssignedRepIdFilter(normalizeAssignedRepFilterValue(parsed.assignedRepIdFilter));
      if (parsed.cpAssignmentFilter) setCpAssignmentFilter(parsed.cpAssignmentFilter);
      if (parsed.productionFilter) setProductionFilter(normalizeProductionFilterValue(parsed.productionFilter));
      if (parsed.leadsViewMode === "grid" || parsed.leadsViewMode === "list") {
        setLeadsViewMode(parsed.leadsViewMode);
      }
      if (parsed.clientAssignedRepIdFilter) setClientAssignedRepIdFilter(normalizeAssignedRepFilterValue(parsed.clientAssignedRepIdFilter));
      if (parsed.leadsCurrentPage) setLeadsCurrentPage(parsed.leadsCurrentPage);
      if (parsed.usersCurrentPage) setUsersCurrentPage(parsed.usersCurrentPage);
    } catch (error) {
      console.error("Failed to restore sales representative page filters:", error);
    } finally {
      hasRestoredFiltersRef.current = true;
    }
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // --- FILTER CHANGE LOGIC ---
  // Reset pagination when any lead filter changes
  useEffect(() => {
    setLeadsCurrentPage(1);
  }, [leadTypeFilter, statusFilter, intentFilter, shootStageFilter, assignedRepIdFilter, cpAssignmentFilter, productionFilter, debouncedSearch, leadsViewMode]);

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
    const normalizedAssigned = normalizeAssignedRepFilterValue(assignedRepIdFilter);
    const normalizedClientAssigned = normalizeAssignedRepFilterValue(clientAssignedRepIdFilter);
    const validValues = new Set(salesRepOptions.map((option) => option.value));

    if (normalizedAssigned !== "all" && normalizedAssigned !== "unassigned" && !validValues.has(normalizedAssigned)) {
      setAssignedRepIdFilter("all");
    }

    if (normalizedClientAssigned !== "all" && normalizedClientAssigned !== "unassigned" && !validValues.has(normalizedClientAssigned)) {
      setClientAssignedRepIdFilter("all");
    }
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
          cpAssignmentFilter,
          productionFilter,
          clientAssignedRepIdFilter,
          leadsViewMode,
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
    cpAssignmentFilter,
    productionFilter,
    clientAssignedRepIdFilter,
    leadsViewMode,
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
        assigned_to:
          normalizeAssignedRepFilterValue(assignedRepIdFilter) === "all"
            ? undefined
            : normalizeAssignedRepFilterValue(assignedRepIdFilter),
        cp_assignment:
          leadsViewMode === "grid" && cpAssignmentFilter !== "all"
            ? cpAssignmentFilter
            : undefined,
        production_filter:
          leadsViewMode === "grid" && normalizeProductionFilterValue(productionFilter) !== "all"
            ? normalizeProductionFilterValue(productionFilter)
            : undefined,
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
        page: usersCurrentPage,
        limit: usersLimit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (usersStatusFilter !== "all") params.status = usersStatusFilter;
      const normalizedClientAssignedRep = normalizeAssignedRepFilterValue(clientAssignedRepIdFilter);
      if (activeTab === "Client" && normalizedClientAssignedRep !== "all") {
        params.assigned_to = normalizedClientAssignedRep;
      }

      let allUsers: UserData[] = [];
      let pagination: any = null;

      if (activeTab === "Client") {
        const clientsRes = await adminApi.getClients(params);
        const clientsPayload = clientsRes?.data?.data || clientsRes?.data || {};
        const clientsList = Array.isArray(clientsPayload)
          ? clientsPayload
          : (clientsPayload.leads || clientsPayload.items || []);

        if (clientsList.length || clientsPayload.pagination) {
          const mappedClients = clientsList.map((client: any) => ({
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
          allUsers = mappedClients;
          pagination = clientsPayload.pagination || clientsRes?.pagination;
        }
      } else if (activeTab === "Creative Partner") {
        const creativeRes = await adminApi.getPendingCP(params);
        if (creativeRes?.data) {
          const mappedCreatives = (Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || [])).map((member: any) => {
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
          allUsers = mappedCreatives;
          pagination = creativeRes.pagination;
        }
      }

      setUsers(allUsers);
      if (pagination) {
        setUsersTotalRecords(pagination.total_records || allUsers.length);
        setUsersTotalPages(pagination.total_pages || 1);
      } else {
        setUsersTotalRecords(allUsers.length);
        setUsersTotalPages(1);
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
  }, [activeTab, usersCurrentPage, debouncedSearch, usersStatusFilter, clientAssignedRepIdFilter]);

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
        hasCreativePartnerAssigned: Array.isArray(lead.selected_crew_ids) && lead.selected_crew_ids.length > 0,
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
        {/* <DottedDivider /> */}

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <TabsSwitcher
                tabs={tabs}
                activeTab={activeTab}
                onChange={(tab) => {
                  setActiveTab(tab);
                  setUsersCurrentPage(1);
                  setLeadsCurrentPage(1);
                }}
              />

            </div>

            <div className="flex w-full items-center gap-2">
              <div
                className={`relative flex-1 p-1 rounded-xl border transition-all duration-300 ${
                  isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"
                }`}
              >
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
                <input
                  type="text"
                  placeholder={activeTab === "Booking" ? "Search leads..." : "Search users..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-9 w-full min-w-0 pl-10 pr-4 rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${
                    isDark
                      ? "bg-[#18181b] text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                      : "bg-[#F8F8F8] text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                  }`}
                />
              </div>

              {activeTab === "Booking" && (
                <div
                  className={`h-11 shrink-0 flex items-center gap-1 p-1 rounded-xl border transition-all duration-300 ${
                    isDark ? "bg-[#111] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLeadsViewMode("list")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                      leadsViewMode === "list"
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/60 hover:bg-white/5"
                          : "text-[#666666] hover:bg-black/5"
                    }`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadsViewMode("grid")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                      leadsViewMode === "grid"
                        ? isDark
                          ? "bg-[#E5D5B8] text-black"
                          : "bg-[#E8D1AB] text-black"
                        : isDark
                          ? "text-white/60 hover:bg-white/5"
                          : "text-[#666666] hover:bg-black/5"
                    }`}
                  >
                    <Grid3X3 size={14} />
                  </button>
                </div>
              )}
            </div>

            {activeTab === "Booking" && leadsViewMode !== "grid" && (
              <div className="flex flex-wrap gap-2">
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
                    setAssignedRepIdFilter(normalizeAssignedRepFilterValue(val));
                  }}
                  openAlign={"right"}
                />
                <BasicDropdown
                  label="Intent Type"
                  value={intentFilter}
                  options={["All", "Hot", "Warm", "Cold"]}
                  onChange={(val) => setIntentFilter(val as any)}
                />
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
              <div className="flex flex-wrap gap-2">
                <BasicDropdown
                  label="Client Representative"
                  value={clientAssignedRepIdFilter}
                  options={salesRepOptions}
                  searchable
                  searchPlaceholder="Search representative..."
                  onChange={(val) => {
                    setClientAssignedRepIdFilter(normalizeAssignedRepFilterValue(val));
                  }}
                  openAlign={"right"}
                />
              </div>
            )}

            {activeTab === "Booking" && leadsViewMode === "grid" && (
              <div className="flex flex-wrap gap-2">
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
                    setAssignedRepIdFilter(normalizeAssignedRepFilterValue(val));
                  }}
                  openAlign={"right"}
                />
                <BasicDropdown
                  label="Intent Type"
                  value={intentFilter}
                  options={["All", "Hot", "Warm", "Cold"]}
                  onChange={(val) => setIntentFilter(val as any)}
                />
                <BasicDropdown
                  label="Shoot Stage"
                  value={shootStageFilter}
                  options={SHOOT_STAGE_OPTIONS as any}
                  onChange={(val) => setShootStageFilter(val)}
                />
                <BasicDropdown
                  label="CP Assignment"
                  value={cpAssignmentFilter}
                  options={CP_ASSIGNMENT_OPTIONS as any}
                  onChange={(val) => setCpAssignmentFilter(val as "all" | "assigned" | "not_assigned")}
                />
                {/* <BasicDropdown
                  label="Production"
                  value={productionFilter}
                  options={PRODUCTION_FILTER_OPTIONS as any}
                  onChange={(val) => setProductionFilter(normalizeProductionFilterValue(val))}
                /> */}
                <BasicDropdown
                  label="All Statuses"
                  value={statusFilter}
                  options={["All", ...BOOKING_STATUS_OPTIONS]}
                  onChange={(val) => setStatusFilter(val as any)}
                  openAlign={"right"}
                />
              </div>
            )}
          </div>
        </div>

        <DottedDivider className="lg:hidden" />

        {activeTab === "Booking" ? (
          <div className="flex flex-col gap-4">
            <div className="hidden lg:block">
              <LeadsTable
                data={displayLeads}
                loading={leadsIsLoading}
                isFetching={leadsIsFetching}
                currentPage={leadsCurrentPage}
                totalPages={leadsTotalPages}
                totalRecords={leadsTotalRecords}
                limit={leadsLimit}
                activeStatusFilter={statusFilter}
                viewMode={leadsViewMode}
                showViewSwitcher={false}
                onViewModeChange={setLeadsViewMode}
                onPageChange={(page) => setLeadsCurrentPage(page)}
                onRowClick={handleRowClick}
                onOpenMenu={handleOpenMenu}
              />
            </div>

            <div className="lg:hidden flex flex-col gap-2">
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
            </div>
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
            renderRow={(user) => (
              <tr
                key={user.id}
                className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222] hover:bg-white/[0.02]" : "border-[#E5E5E5] hover:bg-black/[0.01]"
                  }`}
                onClick={() => handleUserRowClick(user)}
              >
                <td className={`py-5 px-6 text-[14px] transition-colors ${isDark ? "text-[#888]" : "text-[#666]"}`}>{user.id}</td>
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${isDark ? "bg-[#F5D5D5] text-black" : "bg-[#FEE2E2] text-black"
                      }`}>
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span>{user.initials}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-[15px] transition-colors ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.name}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            user.registrationType === "registered"
                              ? isDark
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : isDark
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {user.registrationType === "registered" ? "Registered" : "Guest"}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 transition-colors ${isDark ? "text-[#666666]" : "text-[#999999]"}`}>
                        {user.joinDate}
                      </p>
                      {user.bookingId ? (
                        <p className={`text-xs transition-colors ${isDark ? "text-white" : "text-black"}`}>
                          #{user.bookingId}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className={`py-5 px-6 text-[14px] transition-colors ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
                  <div className="flex flex-col gap-1">
                    <span>{user.type}</span>
                    <span className={`text-xs ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
                      {user.registrationType === "registered" ? "Registered" : "Guest"}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <IntentBadge intent={(user.intent as any) || "Warm"} />
                </td>
                <td className="py-5 px-6">
                  <LeadsStatusBadge status={(user.bookingStatus as any) || "Booking In Progress"} />
                </td>
                <td className={`py-5 px-6 text-[14px] transition-colors ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>
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
                <td className="py-5 px-6 text-right">
                  <button
                    className={`transition-colors p-1 ${isDark ? "text-[#666] hover:text-white" : "text-[#999] hover:text-black"}`}
                    onClick={(e) => {
                      const rawId = user.id.replace('#', '');
                      handleOpenMenu(e, user.name, rawId as any, user.bookingStatus || null, false);
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            )}
            renderKanbanCard={(user) => (
              <div
                onClick={() => handleUserRowClick(user)}
                className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                  isDark
                    ? "border-[#2F2F2F] bg-[#151515] hover:border-[#4A4A4A] hover:bg-[#1A1A1A]"
                    : "border-[#EAE3D6] bg-white hover:border-[#D9C7A0] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden ${
                      isDark ? "bg-[#F5D5D5] text-black" : "bg-[#FEE2E2] text-black"
                    }`}>
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-[#666666]" : "text-[#A3A3A3]"}`}>
                        {user.id}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <h4 className={`text-lg font-semibold leading-snug line-clamp-2 ${
                          isDark ? "text-white" : "text-[#111111]"
                        }`}>
                          {user.name}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            user.registrationType === "registered"
                              ? isDark
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : isDark
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {user.registrationType === "registered" ? "Registered" : "Guest"}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm truncate ${isDark ? "text-[#8B8B8B]" : "text-[#777777]"}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                      isDark ? "text-[#B9B9B9] hover:bg-white/10 hover:text-white" : "text-[#666] hover:bg-[#F8F4EA] hover:text-black"
                    }`}
                    onClick={(e) => {
                      const rawId = user.id.replace('#', '');
                      handleOpenMenu(e, user.name, rawId as any, user.bookingStatus || null, false);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className={`rounded-xl p-3 ${isDark ? "bg-[#101010]" : "bg-[#FAF6EE]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Type</p>
                        <p className={`mt-1 text-sm font-medium ${isDark ? "text-[#F1F1F1]" : "text-[#222222]"}`}>
                          {user.type}
                          <span className={`ml-2 text-xs font-normal ${isDark ? "text-[#B0B0B0]" : "text-[#666666]"}`}>
                            ({user.registrationType === "registered" ? "Registered" : "Guest"})
                          </span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs ${isDark ? "text-[#727272]" : "text-[#8B8B8B]"}`}>Intent</p>
                        <div className="mt-1">
                          <IntentBadge intent={(user.intent as any) || "Warm"} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LeadsStatusBadge status={(user.bookingStatus as any) || user.status || "Unknown"} />
                    <p className={`text-sm ${isDark ? "text-[#B9B9B9]" : "text-[#555555]"}`}>
                      {user.phoneNumber || "N/A"}
                    </p>
                    {(user.assignedSalesRepName || user.assignedSalesRepEmail) && (
                      <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                        {user.assignedSalesRepName || "Unassigned"}
                        {user.assignedSalesRepEmail ? ` • ${user.assignedSalesRepEmail}` : ""}
                      </p>
                    )}
                    <p className={`text-xs ${isDark ? "text-[#5F5F5F]" : "text-[#9A9A9A]"}`}>
                      {user.joinDate}
                    </p>
                  </div>
                </div>
              </div>
            )}
            renderMobileDetails={(user) => (
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-[10px] uppercase ${isDark ? "text-white/40" : "text-black/40"}`}>Email</p>
                  <p className={`text-sm truncate ${isDark ? "text-white" : "text-black"}`}>{user.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] uppercase ${isDark ? "text-white/40" : "text-black/40"}`}>Type</p>
                  <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>{user.type}</p>
                </div>
                <div className="">
                  <p className={`text-[10px] uppercase ${isDark ? "text-white/40" : "text-black/40"}`}>Intent</p>
                  <div className="">
                    <IntentBadge intent={(user.intent as any) || "Hot"} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] uppercase ${isDark ? "text-white/40" : "text-black/40"}`}>Contact Info</p>
                  <div className="space-y-1">
                    <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>{user.phoneNumber}</p>
                    {(user.assignedSalesRepName || user.assignedSalesRepEmail) && (
                      <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-black/50"}`}>
                        {user.assignedSalesRepName || "Unassigned"}
                        {user.assignedSalesRepEmail ? ` • ${user.assignedSalesRepEmail}` : ""}
                      </p>
                    )}
                  </div>
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
