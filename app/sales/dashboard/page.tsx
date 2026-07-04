"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { MoreVertical, Search, Target, ChartLine, Calendar, Users, Loader2, List, Grid3X3 } from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { useDebounce } from "@/hooks/use-debounce";
import { MobileLeadRow } from "@/components/admin/sales-representative/MobileDetailsBlock";
import { useSalesStatus } from "@/context/SalesStatusContext";
import { toast } from "sonner";
import { adminApi, salesApi as salesService } from "@/lib/api";
import { completedCrewRegistrationParams, isCrewRegistrationComplete } from "@/lib/crewRegistration";
import { useAppSelector } from "@/lib/redux/hooks";
import { parseSalesAvailabilityStatus } from "@/lib/sales-status";
import { useTheme } from "next-themes";
import DottedDivider from "@/components/admin/DottedDivider";
import OverviewMetricCards from "@/components/admin/OverviewMetricCards";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import { BookingStatus, LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import UsersTable from "@/components/sales/UsersTable";
import LeadsTable from "@/components/sales/BookingLeadsTable";
import { IntentBadge } from "@/components/sales/IntentBadge";
import Topbar from "@/components/admin/Topbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
}

interface LeadData {
  lead_id: number;
  bookingId?: string;
  clientName: string;
  email: string;
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
const SALES_DASHBOARD_FILTERS_KEY = "sales-dashboard-filters";
const SALES_DASHBOARD_PRESERVE_KEY = "sales-dashboard-preserve";
const LEADS_FILTER_ALL_LIMIT = 5000;

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (
  paymentStatus: string,
): "Paid" | "In-Progress" => {
  if (paymentStatus === "paid") return "Paid";
  return "In-Progress";
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

const canUseSalesDashboardRepFilters = (userTypeId: number | null) =>
  userTypeId === 5 || userTypeId === 7;

const isMetricStat = (value: unknown): value is DashboardMetricStat =>
  !!value && typeof value === "object" && ("value" in value || "change_percent" in value);

const normalizeOverviewSection = (section: Record<string, unknown> = {}): DashboardOverviewPayload => {
  const payload: DashboardOverviewPayload = {};
  const growth: Partial<Record<string, number | string>> = {};

  Object.entries(section).forEach(([key, rawValue]) => {
    if (key === "growth") return;
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
      value: formatMetricValue(
        payload.sales_assisted ?? payload.sales_assisted_leads
      ),
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

const normalizeProductionFilterValue = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "all";
  const lower = raw.toLowerCase();
  if (lower === "all" || lower === "all production") return "all";
  return (PRODUCTION_FILTER_ALLOWED_VALUES.has(raw) ? raw : "all") as "all" | "pre_production_file_not_provided" | "pre_production_meeting_not_done" | "post_production_meeting_not_done" | "post_production_file_not_uploaded";
};

export default function SalesLeadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { user, token } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const hasRestoredFiltersRef = useRef(false);
  const [isUserTypeSeven, setIsUserTypeSeven] = useState(false);
  const [canManageSalesDashboardFilters, setCanManageSalesDashboardFilters] = useState(false);

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
  const [productionFilter, setProductionFilter] = useState<"all" | "pre_production_file_not_provided" | "pre_production_meeting_not_done" | "post_production_meeting_not_done" | "post_production_file_not_uploaded">("all");
  const [displayLeads, setDisplayLeads] = useState<LeadData[]>([]);

  // Filters state
  const [leadTypeFilter, setLeadTypeFilter] = useState("All Leads");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "All">("All");
  const [intentFilter, setIntentFilter] = useState<"All" | "Hot" | "Warm" | "Cold">("All");
  const [shootStageFilter, setShootStageFilter] = useState<string>("all");
  const [assignedRepIdFilter, setAssignedRepIdFilter] = useState<string>("all");
  const [clientAssignedRepIdFilter, setClientAssignedRepIdFilter] = useState<string>("all");
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
  const [inactiveReasonDraft, setInactiveReasonDraft] = useState("");
  const [isInactiveReasonDialogOpen, setIsInactiveReasonDialogOpen] = useState(false);
  const sessionIdentity = `${token ?? "anonymous"}:${user?.id ?? user?.email ?? "no-user"}`;
  const {
    isManagedUser: isAvailabilityToggleVisible,
    isSalesAvailable,
    unavailableReason: salesUnavailableReason,
    isLoading: isAvailabilityLoading,
    isUpdating: isAvailabilityUpdating,
    setIsUpdating: setIsAvailabilityUpdating,
    setSalesStatus,
  } = useSalesStatus();

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
      console.error("Failed to fetch dashboard overview:", error);
      setMetrics(getDefaultOverviewMetrics());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userTypeId = Number(
        parsedUser?.user_type_id ?? parsedUser?.userTypeId
      );
      const canManageFilters = canUseSalesDashboardRepFilters(
        Number.isFinite(userTypeId) ? userTypeId : null
      );

      setIsUserTypeSeven(userTypeId === 7);
      setCanManageSalesDashboardFilters(canManageFilters);

      const savedFilters = window.sessionStorage.getItem(SALES_DASHBOARD_FILTERS_KEY);
      if (!savedFilters) {
        hasRestoredFiltersRef.current = true;
        return;
      }

      const parsedFilters = JSON.parse(savedFilters);
      if (parsedFilters.activeTab) setActiveTab(parsedFilters.activeTab);
      if (typeof parsedFilters.searchQuery === "string") setSearchQuery(parsedFilters.searchQuery);
      if (parsedFilters.leadTypeFilter) setLeadTypeFilter(parsedFilters.leadTypeFilter);
      if (parsedFilters.statusFilter) setStatusFilter(parsedFilters.statusFilter);
      if (parsedFilters.intentFilter) setIntentFilter(parsedFilters.intentFilter);
      if (parsedFilters.shootStageFilter) setShootStageFilter(parsedFilters.shootStageFilter);
      if (parsedFilters.cpAssignmentFilter) setCpAssignmentFilter(parsedFilters.cpAssignmentFilter);
      if (parsedFilters.productionFilter) setProductionFilter(normalizeProductionFilterValue(parsedFilters.productionFilter));
      if (parsedFilters.leadsViewMode === "grid" || parsedFilters.leadsViewMode === "list") {
        setLeadsViewMode(parsedFilters.leadsViewMode);
      }

      if (canManageFilters) {
        if (parsedFilters.assignedRepIdFilter) setAssignedRepIdFilter(normalizeAssignedRepFilterValue(parsedFilters.assignedRepIdFilter));
        if (parsedFilters.clientAssignedRepIdFilter) setClientAssignedRepIdFilter(normalizeAssignedRepFilterValue(parsedFilters.clientAssignedRepIdFilter));
      }

      if (parsedFilters.leadsCurrentPage) setLeadsCurrentPage(parsedFilters.leadsCurrentPage);
      if (parsedFilters.usersCurrentPage) setUsersCurrentPage(parsedFilters.usersCurrentPage);
    } catch (error) {
      console.error("Failed to restore sales dashboard filters:", error);
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
    if (!token || !canManageSalesDashboardFilters) {
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
  }, [canManageSalesDashboardFilters, token]);

  useEffect(() => {
    fetchDashboardOverview();
  }, [range, sessionIdentity]);

  useEffect(() => {
    if (!mounted || !hasRestoredFiltersRef.current) return;

    try {
      window.sessionStorage.setItem(
        SALES_DASHBOARD_FILTERS_KEY,
        JSON.stringify({
          activeTab,
          searchQuery,
          leadTypeFilter,
          statusFilter,
          intentFilter,
          shootStageFilter,
          cpAssignmentFilter,
          productionFilter,
          assignedRepIdFilter,
          clientAssignedRepIdFilter,
          leadsViewMode,
          leadsCurrentPage,
          usersCurrentPage,
        })
      );
    } catch (error) {
      console.error("Failed to persist sales dashboard filters:", error);
    }
  }, [
    mounted,
    activeTab,
    searchQuery,
    leadTypeFilter,
    statusFilter,
    intentFilter,
    shootStageFilter,
    cpAssignmentFilter,
    productionFilter,
    assignedRepIdFilter,
    clientAssignedRepIdFilter,
    leadsViewMode,
    leadsCurrentPage,
    usersCurrentPage,
  ]);

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
          canManageSalesDashboardFilters && normalizeAssignedRepFilterValue(assignedRepIdFilter) !== "all"
            ? normalizeAssignedRepFilterValue(assignedRepIdFilter)
            : undefined,
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
      if (activeTab === "Client" && canManageSalesDashboardFilters && normalizedClientAssignedRep !== "all") {
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
          }));
          allUsers = mappedClients;
          pagination = clientsPayload.pagination || clientsRes?.pagination;
        }
      } else if (activeTab === "Creative Partner") {
        const creativeRes = await adminApi.getPendingCP({ ...params, ...completedCrewRegistrationParams });
        if (creativeRes?.data) {
          const mappedCreatives = (Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || []))
          .filter(isCrewRegistrationComplete)
          .map((member: any) => {
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
  }, [activeTab, usersCurrentPage, debouncedSearch, usersStatusFilter, clientAssignedRepIdFilter, canManageSalesDashboardFilters, sessionIdentity]);

  useEffect(() => {
    setDisplayLeads([]);
    setUsers([]);
    setUsersTotalPages(0);
    setUsersTotalRecords(0);
    setLeadsCurrentPage(1);
    setUsersCurrentPage(1);
  }, [sessionIdentity]);

  // Smooth transition effect for Leads mapping
  useEffect(() => {
    if (!token) {
      setDisplayLeads([]);
      return;
    }

    if (leadsApiData?.leads) {
      const mapped: LeadData[] = (leadsApiData.leads || []).map((lead: any) => ({
        lead_id: lead.lead_id,
        bookingId: lead.booking_id ? String(lead.booking_id) : undefined,
        clientName: lead.client_name || lead.guest_email || "Unknown User",
        email: lead.guest_email || "No email",
        leadType: (lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted") as LeadData["leadType"],
        bookingStatus: lead.booking_status || "Unknown",
        lastActivity: formatRelativeTime(lead.last_activity_at),
        date: new Date(lead.created_at),
        intent: lead.intent || "Hot",
        assignedSalesRepName: lead.assigned_sales_rep?.name || "",
        assignedSalesRepEmail: lead.assigned_sales_rep?.email || "",
        hasManualPaymentHistory: Boolean(
          lead?.manual_payment_summary?.paidAmount > 0 ||
            lead?.manual_payment_summary?.hasFullPayment
        ),
        isPaymentPending: !["paid", "booked"].includes(
          String(lead.booking_status || "").trim().toLowerCase()
        ),
      }));
      setDisplayLeads(mapped);
    } else if (leadsApiData) {
      setDisplayLeads([]); // Clear if no leads found
    }
  }, [leadsApiData]);

  const leadsTotalRecords = leadsApiData?.pagination?.total || 0;
  const leadsTotalPages = Math.ceil(leadsTotalRecords / leadsLimit);

  const handleUserRowClick = (user: UserData) => {
    if (isAvailabilityToggleVisible && !isAvailabilityLoading && !isSalesAvailable) {
      toast.error("Set your sales status to active before opening details.");
      return;
    }

    window.sessionStorage.setItem(SALES_DASHBOARD_PRESERVE_KEY, "true");
    const rawId = user.id.replace('#', '');
    const basePath = activeTab === "Client"
      ? "/sales/client"
      : "/sales/creative-partner";
      
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
    if (isAvailabilityToggleVisible && !isAvailabilityLoading && !isSalesAvailable) {
      toast.error("Set your sales status to active before opening details.");
      return;
    }

    window.sessionStorage.setItem(SALES_DASHBOARD_PRESERVE_KEY, "true");
    router.push(`/sales/leads/${leadId}`);
  };

  const getGrowthLabel = () => {
    switch (range) {
      case 'Week': return 'from last week';
      case 'Month': return 'from last month';
      case 'All Time': return 'all time';
      default: return 'all time';
    }
  };

  const handleToggleSalesAvailability = async () => {
    if (!isAvailabilityToggleVisible || !token || isAvailabilityLoading || isAvailabilityUpdating) {
      return;
    }

    const nextIsAvailable = !isSalesAvailable;

    if (!nextIsAvailable) {
      setInactiveReasonDraft(salesUnavailableReason || "");
      setIsInactiveReasonDialogOpen(true);
      return;
    }

    setIsAvailabilityUpdating(true);

    try {
      const response = await salesService.toggleSalesStatus({ is_available: 1 });

      if (response?.success === false && response?.error) {
        throw new Error(response.error);
      }

      const nextStatus = parseSalesAvailabilityStatus(response);
      const resolvedIsAvailable =
        response?.data || response?.is_available !== undefined
          ? nextStatus.isAvailable
          : nextIsAvailable;

      setSalesStatus({
        isAvailable: resolvedIsAvailable,
        reason: resolvedIsAvailable ? "" : nextStatus.reason || salesUnavailableReason || "",
      });
      setInactiveReasonDraft("");

      toast.success(
        resolvedIsAvailable
          ? "Sales status changed to active."
          : "Sales status changed to inactive."
      );
    } catch (error) {
      console.error("Failed to update sales status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update sales status"
      );
    } finally {
      setIsAvailabilityUpdating(false);
    }
  };

  const handleConfirmInactiveStatus = async () => {
    if (!token || isAvailabilityLoading || isAvailabilityUpdating) {
      return;
    }

    const normalizedReason = inactiveReasonDraft.trim();

    if (!normalizedReason) {
      toast.error("Please enter a reason before setting status to inactive.");
      return;
    }

    setIsAvailabilityUpdating(true);

    try {
      const response = await salesService.toggleSalesStatus({
        is_available: 0,
        reason: normalizedReason,
      });

      if (response?.success === false && response?.error) {
        throw new Error(response.error);
      }

      const nextStatus = parseSalesAvailabilityStatus(response);
      const resolvedReason = nextStatus.reason || normalizedReason;

      setSalesStatus({ isAvailable: false, reason: resolvedReason });
      setInactiveReasonDraft(resolvedReason);
      setIsInactiveReasonDialogOpen(false);
      toast.success("Sales status changed to inactive.");
    } catch (error) {
      console.error("Failed to update sales status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update sales status"
      );
    } finally {
      setIsAvailabilityUpdating(false);
    }
  };

  const handleCreateNewLead = () => {
    if (isAvailabilityToggleVisible && isAvailabilityLoading) {
      toast.error("Please wait until your status is loaded.");
      return;
    }

    if (isAvailabilityToggleVisible && !isSalesAvailable) {
      toast.error("Please set your status to active before creating a new lead.");
      return;
    }

    router.push("/sales/create-new-deal");
  };

  const renderSalesAvailabilityToggle = (className = "") => (
    <button
      type="button"
      onClick={() => {
        void handleToggleSalesAvailability();
      }}
      disabled={isAvailabilityLoading || isAvailabilityUpdating}
      aria-pressed={isSalesAvailable}
      className={`flex h-12 items-center gap-3 rounded-lg border px-4 transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
        isDark
          ? isSalesAvailable
            ? "border-[#E5D5B8]/40 bg-[#E5D5B8]/12 text-[#F3E2C2] hover:bg-[#E5D5B8]/18"
            : "border-white/10 bg-[#18181b] text-white/85 hover:bg-white/5"
          : isSalesAvailable
            ? "border-[#D8BE93] bg-[#F6E7C8] text-[#4F3B1F] hover:bg-[#F1DDB5]"
            : "border-[#D8D8D8] bg-white text-[#303030] hover:bg-[#F7F7F7]"
      } ${className}`}
    >
      {isAvailabilityLoading || isAvailabilityUpdating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSalesAvailable
              ? "bg-[#CFA96A]"
              : isDark
                ? "bg-zinc-700"
                : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              isSalesAvailable ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </span>
      )}
      <span className="text-sm font-medium">
        {isAvailabilityLoading
          ? "Loading status..."
          : isAvailabilityUpdating
            ? "Updating..."
            : isSalesAvailable
              ? "Active"
              : "Inactive"}
      </span>
    </button>
  );

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
            {isAvailabilityToggleVisible ? renderSalesAvailabilityToggle() : null}
            {/* <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine /> Export
            </Button> */}
            <Button
              onClick={handleCreateNewLead}
              className={`h-12 px-4 lg:px-7 transition-colors font-medium ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              Create New Lead
            </Button>
          </>
        }
      />

      <div className={`min-h-screen p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 transition-colors duration-300 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}>
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Sales Leads Management
            </h1>
            <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black/60"}`}>
              View activity, manage assignments, and monitor performance across
              your sales team.
            </p>
          </div>
          {isAvailabilityToggleVisible ? (
            <div className="w-full lg:hidden">
              {renderSalesAvailabilityToggle("w-full justify-between")}
            </div>
          ) : null}
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

              {activeTab === "Booking" && leadsViewMode !== "grid" && (
                <div className="flex flex-wrap gap-2 lg:justify-end lg:gap-4">
                  <BasicDropdown
                    label="Lead Type"
                    value={leadTypeFilter}
                    options={["All Leads", "Self-Serve", "Sales Assisted"]}
                    onChange={(val) => setLeadTypeFilter(val)}
                  />
                  {canManageSalesDashboardFilters && (
                    <BasicDropdown
                      label="Sales Representative"
                      value={assignedRepIdFilter}
                      options={salesRepOptions}
                      searchable
                      searchPlaceholder="Search representative..."
                      onChange={(val) => setAssignedRepIdFilter(normalizeAssignedRepFilterValue(val))}
                      openAlign={"right"}
                    />
                  )}
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

              {activeTab === "Client" && canManageSalesDashboardFilters && (
                <div className="flex flex-wrap gap-2 lg:justify-end lg:gap-4">
                  <BasicDropdown
                    label="Sales Representative"
                    value={clientAssignedRepIdFilter}
                    options={salesRepOptions}
                    searchable
                    searchPlaceholder="Search representative..."
                    onChange={(val) => setClientAssignedRepIdFilter(normalizeAssignedRepFilterValue(val))}
                    openAlign={"right"}
                  />
                </div>
              )}
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

            {activeTab === "Booking" && leadsViewMode === "grid" && (
              <div className="flex flex-wrap gap-2">
                <BasicDropdown
                  label="Lead Type"
                  value={leadTypeFilter}
                  options={["All Leads", "Self-Serve", "Sales Assisted"]}
                  onChange={(val) => setLeadTypeFilter(val)}
                />
                {canManageSalesDashboardFilters && (
                  <BasicDropdown
                    label="Sales Representative"
                    value={assignedRepIdFilter}
                    options={salesRepOptions}
                    searchable
                    searchPlaceholder="Search representative..."
                    onChange={(val) => setAssignedRepIdFilter(normalizeAssignedRepFilterValue(val))}
                    openAlign={"right"}
                  />
                )}
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
                  onOpenMenu={(e) =>
                    handleOpenMenu(
                      e,
                      lead.clientName,
                      lead.lead_id,
                      lead.bookingStatus,
                      Boolean(lead.isPaymentPending || lead.hasManualPaymentHistory)
                    )
                  }
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
            headers={["Lead ID", "User Info", "Type", "Intent", "Status", "Contact Info", "Action"]}
            onPageChange={(page) => setUsersCurrentPage(page)}
            onRowClick={handleUserRowClick}
            enableKanbanView
            kanbanStatuses={[...BOOKING_STATUS_OPTIONS, "Approved", "Rejected", "Pending", "Unknown"]}
            getItemId={(user) => user.id}
            getItemStatus={(user) => user.bookingStatus || user.status}
            renderRow={(user) => (
              <>
                <td className={`py-5 px-6 border-b text-[14px] transition-colors ${isDark ? "border-[#222] text-[#888]" : "border-[#E5E5E5] text-[#666]"}`}>{user.id}</td>
                <td className={`py-5 px-6 border-b transition-colors ${isDark ? "border-[#222]" : "border-[#E5E5E5]"}`}>
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
                      <p className={`font-medium text-[15px] transition-colors ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.name}</p>
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
                <td className={`py-5 px-6 border-b text-[14px] transition-colors ${isDark ? "border-[#222] text-[#E0E0E0]" : "border-[#E5E5E5] text-[#333]"}`}>{user.type}</td>
                <td className={`py-5 px-6 border-b transition-colors ${isDark ? "border-[#222]" : "border-[#E5E5E5]"}`}>
                  <IntentBadge intent={(user.intent as any) || "Warm"} />
                </td>
                <td className={`py-5 px-6 border-b transition-colors ${isDark ? "border-[#222]" : "border-[#E5E5E5]"}`}>
                  <LeadsStatusBadge status={(user.bookingStatus as any) || "Booking In Progress"} />
                </td>
                <td className={`py-5 px-6 border-b text-[14px] transition-colors ${isDark ? "border-[#222] text-[#E0E0E0]" : "border-[#E5E5E5] text-[#333]"}`}>
                  <div className="space-y-1 min-w-0">
                    <p>{user.phoneNumber}</p>
                    {isUserTypeSeven && (user.assignedSalesRepName || user.assignedSalesRepEmail) && (
                      <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-[#777]"}`}>
                        {user.assignedSalesRepName || "Unassigned"}
                        {user.assignedSalesRepEmail ? ` • ${user.assignedSalesRepEmail}` : ""}
                      </p>
                    )}
                  </div>
                </td>
                <td className={`py-5 px-6 border-b text-right transition-colors ${isDark ? "border-[#222]" : "border-[#E5E5E5]"}`}>
                  <button
                      className={`transition-colors p-1 ${isDark ? "text-[#666] hover:text-white" : "text-[#999] hover:text-black"}`}
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
                      <h4 className={`mt-2 text-lg font-semibold leading-snug line-clamp-2 ${
                        isDark ? "text-white" : "text-[#111111]"
                      }`}>
                        {user.name}
                      </h4>
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
                    {isUserTypeSeven && (user.assignedSalesRepName || user.assignedSalesRepEmail) && (
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
                    {isUserTypeSeven && (user.assignedSalesRepName || user.assignedSalesRepEmail) && (
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
            hideDelete={!isUserTypeSeven}
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
                ? "/sales/leads"
                : activeTab === "Client"
                ? "/sales/client"
                : activeTab === "Creative Partner"
                  ? "/sales/creative-partner"
                  : undefined
            }
          />
        )}


        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={handleCreateNewLead}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Create New Lead
          </Button>
        </div>

        <Dialog
          open={isInactiveReasonDialogOpen}
          onOpenChange={(open) => {
            setIsInactiveReasonDialogOpen(open);

            if (!open) {
              setInactiveReasonDraft(salesUnavailableReason || "");
            }
          }}
        >
          <DialogContent
            className={`border transition-colors ${
              isDark
                ? "border-white/10 bg-[#111111] text-white"
                : "border-[#E5D5B8] bg-[#FFFDFC] text-[#1F1F1F]"
            }`}
          >
            <DialogHeader>
              <DialogTitle className={isDark ? "text-white" : "text-[#1F1F1F]"}>
                Set Status To Inactive
              </DialogTitle>
              <DialogDescription className={isDark ? "text-white/60" : "text-[#6B6256]"}>
                Enter the reason that should be sent when your sales status becomes inactive.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Textarea
                value={inactiveReasonDraft}
                onChange={(e) => setInactiveReasonDraft(e.target.value)}
                placeholder="For example: On break"
                className={`min-h-[110px] ${
                  isDark
                    ? "border-white/10 bg-[#181818] text-white placeholder:text-white/30"
                    : "border-[#D8C29A] bg-white text-[#1F1F1F] placeholder:text-[#9D8C75]"
                }`}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsInactiveReasonDialogOpen(false);
                  setInactiveReasonDraft(salesUnavailableReason || "");
                }}
                className={isDark ? "border border-white/10 bg-transparent text-white hover:bg-white/5" : "border border-[#D8D8D8] bg-white text-[#303030] hover:bg-[#F7F7F7]"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void handleConfirmInactiveStatus();
                }}
                disabled={isAvailabilityUpdating}
                className={isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}
              >
                {isAvailabilityUpdating ? "Saving..." : "Set Inactive"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
