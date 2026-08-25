"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */


import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  X,
  Edit2,
  History,
  Plus,
  Search,
  Settings2,
  Users,
  Loader2,
} from "lucide-react";
import { Area, AreaChart, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import OverviewMetricCards from "@/components/admin/OverviewMetricCards";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import TimePicker from "@/components/ui/Timepicker";
import Topbar from "@/components/admin/Topbar";
import { useDebounce } from "@/hooks/use-debounce";
import { shiftManagementApi } from "@/lib/api";
//import AssignmentHistoryView from "@/components/admin/sales-representative/AssignmentHistoryView";
import RoundRobinConfigurationView from "@/components/admin/sales-representative/RoundRobinConfigurationView";
import ShiftDetailView, { type ShiftDetail } from "@/components/admin/sales-representative/ShiftDetailView";
import SalespeopleDetailView, { type SalespeopleProfile } from "@/components/admin/sales-representative/SalespeopleDetailView";
import { toast } from "sonner";

type Metric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  icon: React.ElementType;
};

type ShiftRow = {
  id?: number | string;
  name: string;
  hours: string;
  days: string[];
  status: "active" | "inactive";
  stored_status?: "active" | "inactive";
  people: string[];
  salespeople?: Array<{ id?: number | string; sales_rep_id?: number | string; name?: string; initials?: string }>;
  salespeopleCount?: number;
  extra?: number;
};

type RecentAssignmentRow = {
  id: string;
  company: string;
  person: string;
  status: string;
};

type LeadVolumeRow = {
  hour: number;
  time: string;
  leads: number;
  quotes: number;
};

type ShiftPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type SalespeopleOption = {
  sales_rep_id: string;
  name: string;
};

type ShiftManagementRouteView = "dashboard" | "shift" | "round-robin" | "salesperson";

type ShiftManagementPageProps = {
  routeView?: ShiftManagementRouteView;
  routeShiftId?: string;
  routeSalesRepId?: string;
};

const SHIFT_MANAGEMENT_BASE_PATH = "/admin/sales-representative/shift-management";

const metrics: Metric[] = [
  { id: "active", label: "Active Shifts", value: "00", delta: "0%", icon: Clock3 },
  { id: "assigned", label: "Leads Assigned Today", value: "0", delta: "0%", icon: BriefcaseBusiness },
  { id: "quotes", label: "Total Quote Created Today", value: "0", delta: "0%", icon: BriefcaseBusiness },
  { id: "people", label: "Active Salespeople", value: "0", delta: "0%", icon: Users },
];

const quickActions = [
  { title: "Create Shift", subtitle: "Set up a new working shift", icon: Plus },
  { title: "Manage Salespeople", subtitle: "Add or remove team members", icon: Users },
  { title: "Configure RR Order", subtitle: "Adjust assignment sequence", icon: Settings2 },
  { title: "View History", subtitle: "Browse all Past Assignments", icon: History },
];

const OVERVIEW_PERIOD_MAP: Record<string, string> = {
  "All Time": "all_time",
  Month: "30days",
  Week: "7days",
};

const SHIFT_STATUS_MAP: Record<string, string> = {
  Active: "active",
  "In Active": "inactive",
};

const unwrapData = (response: any) => response?.data?.data || response?.data || response;
const unwrapList = (response: any, keys: string[] = []) => {
  const data = unwrapData(response);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getInitials = (name?: string) =>
  String(name || "NA")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const firstNonEmpty = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && text.toLowerCase() !== "n/a" && text.toLowerCase() !== "null") return text;
  }
  return "";
};

const MAX_VISIBLE_SALEPEOPLE_AVATARS = 3;

const getSalespersonKey = (person: any) =>
  String(
    person?.sales_rep_id ||
    person?.id ||
    person?.user_id ||
    person?.email ||
    person?.salesperson_name ||
    person?.name ||
    ""
  ).trim().toLowerCase();

const normalizeSalespeople = (rows: any[]) => {
  const seen = new Set<string>();
  return rows.filter((person) => {
    const key = getSalespersonKey(person);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeBookingStatusLabel = (value: unknown) => {
  const text = firstNonEmpty(value);
  const normalized = text.replace(/[–—]/g, "-").trim().toLowerCase();
  const labels: Record<string, string> = {
    "book a shoot - lead created": "Book a shoot - Lead Created",
    "manual - lead created": "Manual - Lead Created",
    "signed up - lead created": "Signed Up - Lead Created",
    "booking in progress": "Booking In Progress",
    "ready for payment": "Ready for Payment",
    "proposal sent": "Proposal Sent",
    "payment sent": "Payment Sent",
    "payment link sent": "Payment Link Sent",
    booked: "Booked",
    paid: "Paid",
    "partially paid": "Partially Paid",
    "closed - lost": "Closed - Lost",
  };
  return labels[normalized] || text || "Unknown";
};

const formatChartHour = (hour: number) => {
  if (hour === 0) return "12AM";
  if (hour === 12) return "12PM";
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
};

const parseChartHour = (value: unknown) => {
  if (typeof value === "number") return value;
  const text = String(value || "").trim();
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric;

  const match = text.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (!match) return Number.NaN;
  let hour = Number(match[1]);
  const meridiem = match[2].toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour;
};

const isSameLocalDate = (date: Date | null, compareDate = new Date()) => (
  Boolean(date) &&
  date?.getFullYear() === compareDate.getFullYear() &&
  date.getMonth() === compareDate.getMonth() &&
  date.getDate() === compareDate.getDate()
);

const getLeadVolumeEndHour = (selectedDate: Date | null, dataMaxHour: number) => {
  const currentHour = new Date().getHours();
  if (!selectedDate || isSameLocalDate(selectedDate)) {
    return Math.min(23, Math.max(currentHour, dataMaxHour, 1));
  }
  return 23;
};

const getLeadVolumeTicks = (rows: LeadVolumeRow[]) => {
  if (!rows.length) return [];
  const interval = rows.length <= 12 ? 1 : rows.length <= 18 ? 2 : 3;
  const tickSet = new Set<string>();

  rows.forEach((row, index) => {
    if (index === 0 || index === rows.length - 1 || row.hour % interval === 0 || row.leads > 0) {
      tickSet.add(row.time);
    }
  });

  return rows.filter((row) => tickSet.has(row.time)).map((row) => row.time);
};

const formatDisplayTime = (time?: string) => {
  if (!time) return "";
  const match = String(time).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return String(time);

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const displayHour = hour % 12 || 12;
  const displayMeridiem = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${minute} ${displayMeridiem}`;
};

const normalizeLeadVolumeRows = (rows: any[], selectedDate: Date | null = null, quoteRows: any[] = []): LeadVolumeRow[] => {
  const leadCountByHour = new Map<number, number>();
  const quoteCountByHour = new Map<number, number>();
  let dataMaxHour = 0;

  const addCountByHour = (items: any[], target: Map<number, number>) => {
    items.forEach((item) => {
    const rawHour = item?.hour ?? item?.time ?? item?.label;
    const hour = parseChartHour(rawHour);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return;

    const safeHour = Math.trunc(hour);
    dataMaxHour = Math.max(dataMaxHour, safeHour);
      target.set(safeHour, Number(item?.count ?? item?.leads ?? item?.quotes ?? item?.lead_count ?? item?.quote_count ?? 0));
    });
  };

  addCountByHour(rows, leadCountByHour);
  addCountByHour(quoteRows, quoteCountByHour);

  const endHour = getLeadVolumeEndHour(selectedDate, dataMaxHour);
  return Array.from({ length: endHour + 1 }, (_, hour) => ({
    hour,
    time: formatChartHour(hour),
    leads: leadCountByHour.get(hour) || 0,
    quotes: quoteCountByHour.get(hour) || 0,
  }));
};

const normalizeSalespeopleOptions = (rows: any[]): SalespeopleOption[] => {
  const unique = new Map<string, SalespeopleOption>();
  rows.filter((person) => person?.shift_id === null).forEach((person) => {
    const salesRepId = String(person?.sales_rep_id || person?.id || person?.user_id || "");
    if (!salesRepId || unique.has(salesRepId)) return;
    unique.set(salesRepId, {
      sales_rep_id: salesRepId,
      name: person?.name || person?.salesperson_name || person?.email || "Unnamed",
    });
  });
  return Array.from(unique.values());
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  if (totalPages <= 1) return [1];
  const delta = 1;
  const pages: Array<number | "..."> = [1];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  if (left > 2) pages.push("...");
  for (let page = left; page <= right; page += 1) pages.push(page);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
};

const normalizeShiftStatus = (value: unknown): "active" | "inactive" =>
  String(value ?? "").toLowerCase() === "active" ? "active" : "inactive";

const formatStatusLabel = (value: unknown): "Active" | "In Active" => {
  return normalizeShiftStatus(value) === "active" ? "Active" : "In Active";
};

const formatShiftHours = (shift: any) => {
  const start = shift?.start_time || shift?.startTime || shift?.start || "";
  const end = shift?.end_time || shift?.endTime || shift?.end || "";
  if (start && end) return `${formatDisplayTime(start)} - ${formatDisplayTime(end)}`;

  const rawHours = shift?.hours || shift?.working_hours || "";
  if (rawHours.includes("-")) {
    const [rawStart, rawEnd] = rawHours.split("-").map((part: string) => part.trim());
    if (rawStart && rawEnd) return `${formatDisplayTime(rawStart)} - ${formatDisplayTime(rawEnd)}`;
  }

  return rawHours || "N/A";
};

const mapShift = (shift: any): ShiftRow => {
  const rawPeople =
    shift?.salespeople_avatars ||
    shift?.salespeople ||
    shift?.sales_people ||
    shift?.assigned_salespeople ||
    shift?.sales_reps ||
    [];

  const salespeople = Array.isArray(rawPeople) ? rawPeople : [];
  const salespeopleCount = Number(
    shift?.salespeople_count ??
    shift?.assigned_salespeople_count ??
    salespeople.length ??
    0
  );

  return {
    id: shift?.id || shift?.shift_id,
    name: shift?.name || shift?.shift_name || "Untitled Shift",
    hours: formatShiftHours(shift),
    days: shift?.active_days || shift?.days || [],
    status: normalizeShiftStatus(shift?.status ?? shift?.stored_status),
    stored_status: normalizeShiftStatus(shift?.stored_status ?? shift?.status),

    people: salespeople
      .slice(0, MAX_VISIBLE_SALEPEOPLE_AVATARS)
      .map((person: any) => getInitials(person?.name || person?.salesperson_name || person?.email)),
    salespeople,
    salespeopleCount,

    extra: Math.max(0, salespeopleCount - MAX_VISIBLE_SALEPEOPLE_AVATARS),
  };
};

const formatApiTime = (date: Date | null) =>
  date
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "";

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseShiftTime = (value?: string) => {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const getOverviewStat = (
  overview: Record<string, any>,
  objectKey: string,
  fallbackValueKeys: string[],
  fallbackChangeKeys: string[],
  fallbackCount: string | number,
  fallbackChange: string | number
) => {
  const stat = overview?.[objectKey];
  if (stat && typeof stat === "object") {
    return {
      count: stat.count ?? fallbackCount,
      change: stat.change_percent ?? fallbackChange,
    };
  }

  return {
    count: fallbackValueKeys.reduce((value, key) => value ?? overview?.[key], undefined as any) ?? stat ?? fallbackCount,
    change: fallbackChangeKeys.reduce((value, key) => value ?? overview?.[key], undefined as any) ?? fallbackChange,
  };
};

const avatarColors = ["#F3D9C8", "#E5D5B8", "#D7E1D3", "#F4CFCF"];

function AvatarStack({
  salespeople,
  extra,
  onAdd,
}: {
  salespeople: Array<{ name?: string; salesperson_name?: string; email?: string }>;
  extra?: number;
  onAdd?: () => void;
}) {
  const [tooltip, setTooltip] = useState<{ name: string; left: number; top: number } | null>(null);

  const showTooltip = (event: React.PointerEvent<HTMLDivElement>, name: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      name,
      left: rect.left + rect.width / 2,
      top: rect.top - 10,
    });
  };

  return (
    <div className="flex items-center">
      {tooltip && typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div
              className="pointer-events-none fixed z-[9999]"
              style={{ left: tooltip.left, top: tooltip.top }}
            >
              <div className="relative -translate-x-1/2 -translate-y-full rounded-md bg-white px-2.5 py-1 text-[11px] font-bold leading-none text-black shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                {tooltip.name}
                <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white shadow-[2px_2px_6px_rgba(0,0,0,0.08)]" />
              </div>
            </div>,
            document.body
          )
        : null}
      {salespeople.slice(0, MAX_VISIBLE_SALEPEOPLE_AVATARS).map((person, index) => {
        const fullName = person?.name || person?.salesperson_name || person?.email || "Unnamed";
        const initials = getInitials(fullName);

        return (
          <div
            key={`${fullName}-${index}`}
            className="-ml-2 first:ml-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#151515] text-[10px] font-semibold text-black"
            style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
            onPointerEnter={(event) => showTooltip(event, fullName)}
            onPointerMove={(event) => showTooltip(event, fullName)}
            onPointerLeave={() => setTooltip(null)}
          >
            {initials}
          </div>
        );
      })}
      {extra ? (
        <div className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#151515] bg-[#E5D5B8] text-xs font-semibold text-black">
          +{extra}
        </div>
      ) : null}
      {onAdd ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className={`${salespeople.length || extra ? "-ml-2" : ""} flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[#E5D5B8]/45 bg-[#242424] text-[#E5D5B8] transition hover:border-[#E5D5B8] hover:bg-[#2C2C2C]`}
          aria-label="Add salespeople"
        >
          <Plus size={16} />
        </button>
      ) : null}
    </div>
  );
}

function TextTooltip({
  text,
  className = "max-w-[160px]",
  capitalize = false,
}: {
  text: string;
  className?: string;
  capitalize?: boolean;
}) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);

  const showTooltip = (
    event: React.PointerEvent<HTMLSpanElement>,
    text: string
  ) => {
    const element = event.currentTarget;
    if (element.scrollWidth <= element.clientWidth) {
      setTooltip(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTooltip({text, left: rect.left + rect.width / 2, top: rect.top - 10});
  };

  return (
    <>
      {tooltip && typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div className="pointer-events-none fixed z-[9999]" style={{left: tooltip.left, top: tooltip.top}}>
              <div className="relative max-w-[250px] -translate-x-1/2 -translate-y-full whitespace-normal break-words rounded-md bg-white px-3 py-2 text-left text-[11px] font-bold leading-[16px] text-black shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                {tooltip.text}
                <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white shadow-[2px_2px_6px_rgba(0,0,0,0.08)]" />
              </div>
            </div>,
            document.body
          )
        : null}
      <span
        className={`block truncate ${capitalize ? "capitalize" : ""} ${className}`}
        onPointerEnter={(event) => showTooltip(event, text)}
        onPointerMove={(event) => showTooltip(event, text)}
        onPointerLeave={() => setTooltip(null)}
      >
        {text}
      </span>
    </>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
      <h2 className="text-lg font-semibold text-white">{children}</h2>
    </div>
  );
}

export default function ShiftManagementPage({
  routeView = "dashboard",
  routeShiftId,
  routeSalesRepId,
}: ShiftManagementPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeMetric, setActiveMetric] = useState("active");
  const [overviewRange, setOverviewRange] = useState("All Time");
  const [statusFilter, setStatusFilter] = useState("Status");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [allFilter, setAllFilter] = useState("All");
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDetail | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  const [shiftNameError, setShiftNameError] = useState("");
  const [enabledDays, setEnabledDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [isShiftEnabled, setIsShiftEnabled] = useState(true);
  const [selectedShift, setSelectedShift] = useState<ShiftDetail | null>(null);
  const [shiftDetailRefreshKey, setShiftDetailRefreshKey] = useState(0);
  const [isAddSalespeopleOpen, setIsAddSalespeopleOpen] = useState(false);
  const [addSalespeopleShift, setAddSalespeopleShift] = useState<ShiftDetail | null>(null);
  const [routeSalespersonProfile, setRouteSalespersonProfile] = useState<SalespeopleProfile | null>(null);
  const [isRouteShiftLoading, setIsRouteShiftLoading] = useState(Boolean(routeShiftId));
  const [isRouteSalespersonLoading, setIsRouteSalespersonLoading] = useState(routeView === "salesperson");
  const [isShiftSelectModalOpen, setIsShiftSelectModalOpen] = useState(false);
  const [shiftSelectMode, setShiftSelectMode] = useState<"rr" | "manage" | null>(null);
  const [shiftRows, setShiftRows] = useState<ShiftRow[]>([]);
  const [shiftCurrentPage, setShiftCurrentPage] = useState(1);
  const [shiftPagination, setShiftPagination] = useState<ShiftPagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [overviewMetrics, setOverviewMetrics] = useState<Metric[]>(metrics);
  const [activeNowRows, setActiveNowRows] = useState<ShiftRow[]>([]);
  const [recentAssignmentRows, setRecentAssignmentRows] = useState<RecentAssignmentRow[]>([]);
  const [leadVolumeRows, setLeadVolumeRows] = useState<LeadVolumeRow[]>(() => normalizeLeadVolumeRows([]));
  const [salespeopleOptions, setSalespeopleOptions] = useState<SalespeopleOption[]>([]);
  const [selectedSalespersonIds, setSelectedSalespersonIds] = useState<string[]>([]);
  const [isSalespersonDropdownOpen, setIsSalespersonDropdownOpen] = useState(false);
  const [salespersonSearch, setSalespersonSearch] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [isSavingShift, setIsSavingShift] = useState(false);
  const [isAddingSalesperson, setIsAddingSalesperson] = useState(false);
  const [isShiftsLoading, setIsShiftsLoading] = useState(false);
  const [shiftSearch, setShiftSearch] = useState("");
  const debouncedShiftSearch = useDebounce(shiftSearch, 300);
  const selectedDateParam = selectedDate ? formatDateParam(selectedDate) : undefined;
  const selectedDateParams = selectedDateParam ? { date: selectedDateParam } : {};
  const salespersonDropdownRef = useRef<HTMLDivElement | null>(null);

  const activeNow = useMemo(() => activeNowRows, [activeNowRows]);
  const leadVolumeTicks = useMemo(() => getLeadVolumeTicks(leadVolumeRows), [leadVolumeRows]);
  const selectedSalespersonOptions = useMemo(
    () => salespeopleOptions.filter((person) => selectedSalespersonIds.includes(person.sales_rep_id)),
    [salespeopleOptions, selectedSalespersonIds]
  );
  const filteredSalespeopleOptions = useMemo(
    () =>
      salespeopleOptions.filter((person) =>
        person.name.toLowerCase().includes(salespersonSearch.trim().toLowerCase())
      ),
    [salespeopleOptions, salespersonSearch]
  );
  const shiftSelectOptions = useMemo(
    () =>
      shiftRows
        .filter((shift) => shift.id && ((shift.salespeopleCount || 0) > 0 || (shift.salespeople?.length || 0) > 0))
        .map((shift) => ({ label: shift.name, value: String(shift.id) })),
    [shiftRows]
  );
  const shiftTotalPages = Math.max(1, shiftPagination.pages);
  const safeShiftPage = Math.min(Math.max(shiftPagination.page || shiftCurrentPage, 1), shiftTotalPages);
  const shiftPaginationItems = useMemo(
    () => buildPaginationItems(safeShiftPage, shiftTotalPages),
    [safeShiftPage, shiftTotalPages]
  );
  const shiftShowingFrom = shiftPagination.total > 0 ? ((safeShiftPage - 1) * shiftPagination.limit) + 1 : 0;
  const shiftShowingTo = Math.min(safeShiftPage * shiftPagination.limit, shiftPagination.total);
  const isShiftModalOpen = isCreateShiftOpen || Boolean(editingShift);
  const canSaveShift =
    Boolean(shiftName.trim()) &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    enabledDays.length > 0 &&
    (!startTime || !endTime || endTime.getTime() >= startTime.getTime() + 60 * 60 * 1000);
  const getGrowthLabel = () => {
    if (selectedDate) return "on selected date";

    switch (overviewRange) {
      case "Week":
        return "from last week";
      case "Month":
        return "from last month";
      case "All Time":
        return "all time";
      default:
        return "all time";
    }
  };

  const resetShiftForm = () => {
    setShiftName("");
    setStartTime(null);
    setEndTime(null);
    setStartTimeError("");
    setEndTimeError("");
    setShiftNameError("");
    setEnabledDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    setIsShiftEnabled(true);
  };
  const closeShiftModal = () => {
    setIsCreateShiftOpen(false);
    setEditingShift(null);
    resetShiftForm();
  };

  const openCreateShiftModal = () => {
    setEditingShift(null);
    resetShiftForm();
    setIsCreateShiftOpen(true);
  };

  const openEditShiftModal = async (shift: ShiftDetail) => {
    const response = shift.id ? await shiftManagementApi.getShiftDetail(shift.id) : null;
    const detail = response?.data?.data || response?.data || shift;
    const editShift = mapShift(detail);
    setEditingShift({ ...editShift, id: editShift.id || shift.id });
    setShiftName(detail?.name || detail?.shift_name || shift.name || "");
    setStartTime(parseShiftTime(detail?.start_time || detail?.startTime || editShift.hours.split("-")[0]));
    setEndTime(parseShiftTime(detail?.end_time || detail?.endTime || editShift.hours.split("-")[1]));
    setEnabledDays(Array.isArray(detail?.active_days) ? detail.active_days : editShift.days);
    setIsShiftEnabled(String(detail?.stored_status || detail?.status || "inactive").toLowerCase() === "active");
    setIsCreateShiftOpen(false);
  };

  const loadSelectedShift = async () => {
    if (!routeShiftId) {
      setSelectedShift(null);
      setIsRouteShiftLoading(false);
      return null;
    }

    const normalizedShiftId = String(routeShiftId).trim();

    if (!normalizedShiftId || normalizedShiftId === "view-history") {
      console.error("Invalid shift id:", normalizedShiftId);
      setSelectedShift(null);
      setIsRouteShiftLoading(false);
      return null;
    }

    setIsRouteShiftLoading(true);
    try {
      const response = await shiftManagementApi.getShiftDetail(normalizedShiftId);
      const detail = response?.data?.data || response?.data;
      if (!detail) {
        setSelectedShift(null);
        return null;
      }

      const mappedShift = mapShift(detail);

      const nextShift: ShiftDetail = {
        ...mappedShift,
        id:
          mappedShift.id ||
          normalizedShiftId,
      };

      setSelectedShift(nextShift);

      return nextShift;
    } catch (error) {
      console.error("Failed to load shift detail:", error);
      setSelectedShift(null);
      return null;
    } finally {
      setIsRouteShiftLoading(false);
    }
  };

  const loadRouteSalesperson = async () => {
    if (routeView !== "salesperson" || !routeShiftId || !routeSalesRepId) {
      setRouteSalespersonProfile(null);
      setIsRouteSalespersonLoading(false);
      return null;
    }

    setIsRouteSalespersonLoading(true);

    try {
      const response = await shiftManagementApi.getShiftSalespeople(routeShiftId, {
        page: 1,
        limit: 100,
      });
      const data = response?.data?.data || response?.data;
      const list = Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data)
          ? data
          : (data?.salespeople || data?.sales_people || data?.items || []);

      const person = Array.isArray(list)
        ? list.find((item: any) =>
            String(item?.sales_rep_id || item?.id || item?.user_id || "") === String(routeSalesRepId)
          )
        : null;

      if (!person) {
        setRouteSalespersonProfile(null);
        return null;
      }

      const name = person?.name || person?.salesperson_name || person?.email || "Unnamed";
      const rawUserStatus = person?.user_status ?? person?.enabled ?? person?.is_enabled ?? person?.is_active;
      const enabled =
        rawUserStatus === true ||
        Number(rawUserStatus) === 1 ||
        String(rawUserStatus || "").toLowerCase() === "active";

      const profile: SalespeopleProfile = {
        id: person?.id || person?.sales_rep_id || person?.user_id || routeSalesRepId,
        sales_rep_id: person?.sales_rep_id || person?.id || person?.user_id || routeSalesRepId,
        name,
        email: person?.email || "No email",
        initials: person?.initials || getInitials(name),
        color: person?.color || "#F5C5E4",
        enabled,
        status: enabled ? "Active" : "In Active",
        lastActivity: person?.last_activity || person?.last_activity_at || "N/A",
      };

      setRouteSalespersonProfile(profile);
      return profile;
    } catch (error) {
      console.error("Failed to load salesperson detail:", error);
      setRouteSalespersonProfile(null);
      return null;
    } finally {
      setIsRouteSalespersonLoading(false);
    }
  };

  const fetchOverview = async () => {
    const overviewParams = selectedDateParam
      ? { range: "custom", date_on: selectedDateParam, date: selectedDateParam }
      : { period: OVERVIEW_PERIOD_MAP[overviewRange] || "30days" };
    const overviewRes = await shiftManagementApi.getOverview(overviewParams);
    const overview = unwrapData(overviewRes) || {};
    const activeShiftsStat = getOverviewStat(overview, "active_shifts_count", ["active_shifts", "total_active_shifts", "active"], ["active_shifts_change", "active_change"], 0, 0);
    const assignedTodayStat = getOverviewStat(overview, "leads_assigned_today", ["assigned_today"], ["leads_assigned_change", "assigned_change"], 0, 0);
    const quotesCreatedTodayStat = getOverviewStat(overview, "total_quote_created_today", ["quotes_created_today", "total_quotes_created_today"], ["quotes_created_change", "quotes_change"], 0, 0);
    const activePeopleStat = getOverviewStat(overview, "active_salespeople_count", ["active_salespeople", "active_sales_people"], ["active_salespeople_change", "people_change"], 0, 0);

    setOverviewMetrics([
      { id: "active", label: "Active Shifts", value: String(activeShiftsStat.count).padStart(2, "0"), delta: `${activeShiftsStat.change}%`, icon: Clock3 },
      { id: "assigned", label: "Leads Assigned Today", value: String(assignedTodayStat.count), delta: `${assignedTodayStat.change}%`, icon: BriefcaseBusiness },
      { id: "quotes", label: "Total Quote Created Today", value: String(quotesCreatedTodayStat.count), delta: `${quotesCreatedTodayStat.change}%`, icon: BriefcaseBusiness },
      { id: "people", label: "Active Salespeople", value: String(activePeopleStat.count), delta: `${activePeopleStat.change}%`, icon: Users },
    ]);
  };

  const fetchShifts = async (params?: Record<string, unknown>) => {
  setIsShiftsLoading(true); 
  const shiftsRes = await shiftManagementApi.getShifts({
      page: shiftCurrentPage,
      limit: 10,
      status: statusFilter === "Status" ? undefined : SHIFT_STATUS_MAP[statusFilter],
      search: debouncedShiftSearch || undefined,
      sort_by: "created_at",
      sort_order: "desc",
      ...selectedDateParams,
      ...params,
    });
    const shiftData = unwrapData(shiftsRes);
    const apiShifts = Array.isArray(shiftData?.rows) ? shiftData.rows : unwrapList(shiftsRes, ["shifts", "items", "rows"]);
    const pagination = shiftData?.pagination || {};
    const mappedShifts = apiShifts.map(mapShift);
    const filteredShifts = allFilter === "Assigned"
      ? mappedShifts.filter((shift) => (shift.salespeopleCount || 0) > 0 || (shift.salespeople?.length || 0) > 0)
      : allFilter === "Unassigned"
        ? mappedShifts.filter((shift) => (shift.salespeopleCount || 0) === 0 && (shift.salespeople?.length || 0) === 0)
        : mappedShifts;
    setShiftRows(filteredShifts);
    setShiftPagination({
      page: Number(pagination.page || params?.page || shiftCurrentPage || 1),
      limit: Number(pagination.limit || params?.limit || 10),
      total: allFilter === "All" ? Number(pagination.total || apiShifts.length || 0) : filteredShifts.length,
      pages: allFilter === "All"
        ? Number(pagination.pages || pagination.total_pages || pagination.totalPages || 1)
        : Math.max(1, Math.ceil(filteredShifts.length / Number(pagination.limit || params?.limit || 10))),
    });
    setIsShiftsLoading(false);
    return filteredShifts;
  };

  const enrichActiveShifts = async (shiftsToEnrich: ShiftRow[]) => {
    if (!shiftsToEnrich.length) {
      setActiveNowRows([]);
      return;
    }

    const enrichedActiveShifts = await Promise.all(
      shiftsToEnrich.map(async (shift) => {
        if (!shift.id) return { ...shift, people: [], extra: 0 };

        const peopleRes = await shiftManagementApi.getShiftSalespeople(shift.id, { page: 1, limit: 100 });
        const peopleData = peopleRes?.data?.data || peopleRes?.data;
        const peopleList = Array.isArray(peopleData?.rows)
          ? peopleData.rows
          : Array.isArray(peopleData)
            ? peopleData
            : (peopleData?.salespeople || peopleData?.sales_people || peopleData?.items || []);
        const activePeopleList = Array.isArray(peopleList)
          ? peopleList.filter((person: any) => person?.user_status === true)
          : [];

        if (!activePeopleList.length) {
          return { ...shift, people: [], salespeople: [], extra: 0 };
        }

        return {
          ...shift,
          people: activePeopleList.slice(0, MAX_VISIBLE_SALEPEOPLE_AVATARS).map((person: any) => getInitials(person?.name || person?.salesperson_name || person?.email)),
          salespeople: activePeopleList,
          extra: Math.max(0, activePeopleList.length - MAX_VISIBLE_SALEPEOPLE_AVATARS),
        };
      })
    );
    setActiveNowRows(enrichedActiveShifts);
  };

  const fetchActiveShiftsNow = async () => {
    const activeNowRes = await shiftManagementApi.getActiveNow(selectedDateParams);
    const apiActiveNow = unwrapList(activeNowRes, ["shifts", "active_shifts", "items"]);
    if (apiActiveNow.length) {
      await enrichActiveShifts(apiActiveNow.map(mapShift));
      return;
    }

    const fallbackRes = await shiftManagementApi.getShifts({ page: 1, limit: 100, status: "active", ...selectedDateParams });
    const fallbackShifts = unwrapList(fallbackRes, ["shifts", "items", "rows"]).map(mapShift);
      await enrichActiveShifts(fallbackShifts.filter((shift) => shift.status === "active"));
  };

  const fetchSecondaryWidgets = async () => {
    const [recentRes, chartRes, allSalespeopleRes] = await Promise.all([
      shiftManagementApi.getRecentAssignments(selectedDateParams),
      shiftManagementApi.getHourlyLeadVolume(selectedDateParams),
      shiftManagementApi.getAllSalespeople({ limit: 100 }),
    ]);

    const apiRecent = unwrapList(recentRes, ["assignments", "items", "rows"]);
    setRecentAssignmentRows(apiRecent.map((item: any, index: number) => ({
        id: String(item.id || item.assignment_id || `${item.lead_id || "lead"}-${item.sales_rep_id || "rep"}-${item.assigned_at || index}`),
        company: firstNonEmpty(item.company, item.client_name, item.lead_name, item.client_email, item.guest_email) || "Unknown Client",
        person: firstNonEmpty(item.person, item.salesperson_name, item.sales_rep_name, item.sales_rep?.name, item.sales_rep_email, item.sales_rep?.email) || "Unassigned",
        status: normalizeBookingStatusLabel(item.status || item.assignment_status),
    })));

    const chartData = unwrapData(chartRes);
    const apiChart = Array.isArray(chartData)
      ? chartData
      : unwrapList(chartRes, ["leads", "chart", "items", "data"]);
    const apiQuoteChart = Array.isArray(chartData?.quotes) ? chartData.quotes : [];
    setLeadVolumeRows(normalizeLeadVolumeRows(apiChart, selectedDate, apiQuoteChart));

    const apiPeopleData = allSalespeopleRes?.data;
    const apiPeople = Array.isArray(apiPeopleData?.rows) ? apiPeopleData.rows : [];
    setSalespeopleOptions(normalizeSalespeopleOptions(apiPeople));
  };

  const refreshShiftData = async (shiftParams?: Record<string, unknown>) => {
    await Promise.all([
      fetchShifts(shiftParams),
      fetchOverview(),
      fetchActiveShiftsNow(),
    ]);
  };

  const loadShiftDashboard = async () => {
    await Promise.all([
      fetchShifts(),
      fetchOverview(),
      fetchActiveShiftsNow(),
      fetchSecondaryWidgets(),
    ]);
  };

  useEffect(() => {
    if (routeView !== "dashboard") return;
    void loadShiftDashboard();
  }, [routeView, overviewRange, selectedDate, statusFilter, debouncedShiftSearch, allFilter, shiftCurrentPage]);

  useEffect(() => {
    setShiftCurrentPage(1);
  }, [statusFilter, debouncedShiftSearch, allFilter]);

  useEffect(() => {
    if (shiftCurrentPage <= shiftTotalPages) return;
    setShiftCurrentPage(shiftTotalPages);
  }, [shiftCurrentPage, shiftTotalPages]);

  useEffect(() => {
    if (!routeShiftId) {
      setSelectedShift(null);
      setIsRouteShiftLoading(false);
      return;
    }

    void loadSelectedShift();
  }, [routeShiftId]);

  useEffect(() => {
    void loadRouteSalesperson();
  }, [routeView, routeShiftId, routeSalesRepId]);

  useEffect(() => {
    if (!isAddSalespeopleOpen) return;
    const loadSalespeopleOptions = async () => {
      const response = await shiftManagementApi.getAllSalespeople({ limit: 100 });
      const rows = Array.isArray(response?.data?.rows) ? response.data.rows : [];
      setSalespeopleOptions(normalizeSalespeopleOptions(rows));
    };
    void loadSalespeopleOptions();
  }, [isAddSalespeopleOpen]);

  useEffect(() => {
    if (!isSalespersonDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (salespersonDropdownRef.current?.contains(event.target as Node)) return;
      setIsSalespersonDropdownOpen(false);
      setSalespersonSearch("");
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSalespersonDropdownOpen]);

  useEffect(() => {
    if (!selectedSalespersonIds.length) return;
    const validIds = new Set(salespeopleOptions.map((person) => person.sales_rep_id));
    const filteredIds = selectedSalespersonIds.filter((id) => validIds.has(id));
    if (filteredIds.length !== selectedSalespersonIds.length) {
      setSelectedSalespersonIds(filteredIds);
    }
  }, [salespeopleOptions, selectedSalespersonIds]);

  useEffect(() => {
    if (routeView === "dashboard") return;
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [routeView, routeShiftId, routeSalesRepId]);

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "sales-representative": "Sales Representative",
          "shift-management": "Shift Management",
          "view-history": "View History",
          "round-robin": "Round Robin",
          salespeople: "Salespeople",
          ...(routeShiftId && selectedShift
            ? { [String(routeShiftId)]: `${selectedShift.name}`}
            : {}),
          ...(routeSalesRepId && routeSalespersonProfile
            ? { [String(routeSalesRepId)]: `${routeSalespersonProfile.name}` }
            : {}),
        }}
        actions={
          routeView === "shift" && selectedShift ? (
            <button
              type="button"
              onClick={() => {
                setAddSalespeopleShift(selectedShift);
                setSelectedSalespersonIds([]);
                setIsAddSalespeopleOpen(true);
              }}
              className="rounded-lg bg-[#E5D5B8] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#D9C49E]"
            >
              Add Salespeople
            </button>
          ) : routeView === "dashboard" ? (
            <button
              type="button"
              onClick={openCreateShiftModal}
              className="rounded-lg bg-[#E5D5B8] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#D9C49E]"
            >
              Create Shift
            </button>
          ) : null
        }
      />

      {routeView === "round-robin" ? (
        isRouteShiftLoading ? (
          <div className="flex min-h-[420px] items-center justify-center bg-[#101010]">
            <Loader2 className="animate-spin text-[#BFA780]" size={40} />
          </div>
        ) : selectedShift ? (
          <RoundRobinConfigurationView
            shiftId={selectedShift.id}
            shiftName={selectedShift.name}
            onBack={() => router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${selectedShift.id}`)}
          />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-[#101010] text-white">
            <p className="text-sm text-white/55">Shift not found</p>
            <button type="button" onClick={() => router.push(SHIFT_MANAGEMENT_BASE_PATH)} className="rounded-lg bg-[#E5D5B8] px-5 py-2 text-sm font-semibold text-black">
              Back to Shift Management
            </button>
          </div>
        )
      ) : routeView === "salesperson" ? (
        isRouteShiftLoading || isRouteSalespersonLoading ? (
          <div className="flex min-h-[420px] items-center justify-center bg-[#101010]">
            <Loader2 className="animate-spin text-[#BFA780]" size={40} />
          </div>
        ) : selectedShift && routeSalespersonProfile ? (
          <SalespeopleDetailView
            profile={routeSalespersonProfile}
            shiftId={selectedShift.id}
            onBack={() => router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${selectedShift.id}`)}
            onRefresh={async () => {
              await Promise.all([loadSelectedShift(), loadRouteSalesperson()]);
            }}
          />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-[#101010] text-white">
            <p className="text-sm text-white/55">Salesperson not found in this shift</p>
            <button
              type="button"
              onClick={() => router.push(routeShiftId ? `${SHIFT_MANAGEMENT_BASE_PATH}/shift/${routeShiftId}` : SHIFT_MANAGEMENT_BASE_PATH)}
              className="rounded-lg bg-[#E5D5B8] px-5 py-2 text-sm font-semibold text-black"
            >
              Back
            </button>
          </div>
        )
      ) : routeView === "shift" ? (
        isRouteShiftLoading ? (
          <div className="flex min-h-[420px] items-center justify-center bg-[#101010]">
            <Loader2 className="animate-spin text-[#BFA780]" size={40} />
          </div>
        ) : selectedShift ? (
          <ShiftDetailView
            shift={selectedShift}
            onBack={() => router.push(SHIFT_MANAGEMENT_BASE_PATH)}
            onConfigureChange={(isConfiguring) => {
              if (!isConfiguring || !selectedShift.id) return;
              router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${selectedShift.id}/round-robin`);
            }}
            onSalespersonChange={(profile) => {
              if (!profile || !selectedShift.id) return;
              const salesRepId = profile.sales_rep_id || profile.id;
              if (!salesRepId) return;
              router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${selectedShift.id}/salespeople/${salesRepId}`);
            }}
            onRefresh={async () => {
              await loadSelectedShift();
            }}
            onEditShift={openEditShiftModal}
            refreshKey={shiftDetailRefreshKey}
          />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-[#101010] text-white">
            <p className="text-sm text-white/55">Shift not found</p>
            <button type="button" onClick={() => router.push(SHIFT_MANAGEMENT_BASE_PATH)} className="rounded-lg bg-[#E5D5B8] px-5 py-2 text-sm font-semibold text-black">
              Back to Shift Management
            </button>
          </div>
        )
      ) : (
        <div className="min-h-full bg-[#101010] px-4 py-6 font-[var(--font-geist-sans)] text-white lg:px-9 lg:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">Shift Management System</h1>
            <p className="mt-1 text-sm text-white/45">Shift-based Round Robin Lead Assignment System</p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <OverviewMetricCards
          metrics={overviewMetrics.map((metric) => ({
            ...metric,
            growth: Number(metric.delta.replace("%", "")),
          }))}
          activeId={activeMetric}
          onSelect={setActiveMetric}
          getGrowthLabel={() => getGrowthLabel()}
          dropdownLabel="Duration"
          dropdownValue={selectedDate ? "Selected Date" : overviewRange}
          dropdownOptions={selectedDate ? ["All Time", "Month", "Week", "Selected Date"] : ["All Time", "Month", "Week"]}
          onDropdownChange={(value) => {
            if (value === "Selected Date") return;
            setSelectedDate(null);
            setOverviewRange(value);
          }}
        />

        <section className="mt-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => {
                    if (action.title === "Create Shift") {
                      openCreateShiftModal();
                    }

                    if (action.title === "View History") {
                      router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/view-history`);
                    }

                    if (action.title === "Manage Salespeople") {
                      setShiftSelectMode("manage");
                      setIsShiftSelectModalOpen(true);
                    }

                    if (action.title === "Configure RR Order") {
                      setShiftSelectMode("rr");
                      setIsShiftSelectModalOpen(true);
                    }
                  }}
                  className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#2D2D2D] bg-[#171717] px-4 text-left transition hover:border-[#E5D5B8]/45"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A241D] text-[#E5D5B8]">
                    <Icon size={15} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{action.title}</span>
                    <span className="mt-0.5 block text-xs text-white/45">{action.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#111]">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <PanelTitle>Shift History</PanelTitle>
            <div className="flex flex-wrap gap-2">
              <BasicDropdown label="Status" value={statusFilter} options={["Status", "Active", "In Active"]} onChange={setStatusFilter} roundedFull styles="text-white/70 text-xs" />
              <BasicDropdown label="Month" value={monthFilter} options={["Month", "Week", "Year"]} onChange={setMonthFilter} roundedFull styles="text-white/70 text-xs" />
              <BasicDropdown label="All" value={allFilter} options={["All", "Assigned", "Unassigned"]} onChange={setAllFilter} roundedFull styles="text-white/70 text-xs" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
              <input
                value={shiftSearch}
                onChange={(event) => setShiftSearch(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#2D2D2D] bg-[#242424] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35"
                placeholder="Search Shift..."
              />
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-y border-[#242424] bg-[#101010] text-xs font-medium text-[#E5D5B8]">
                <tr>
                  <th className="px-5 py-4">Shift Name</th>
                  <th className="px-5 py-4">Working Hours</th>
                  <th className="px-5 py-4">Active Days</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Salespeople</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="relative">
                {isShiftsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20">
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin text-[#BFA780]" size={40} />
                      </div>
                    </td>
                  </tr>
                ) : shiftRows.length > 0 ? (
                shiftRows.map((shift) => (
                <tr
                  key={shift.id}
                  onClick={() => {
                    if (!shift.id) return;
                    
                    router.push(
                      `${SHIFT_MANAGEMENT_BASE_PATH}/shift/${shift.id}`
                    );
                  }}
                  className="cursor-pointer border-b border-[#242424] text-sm text-white/85 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B665]" />
                      <TextTooltip text={shift.name} capitalize/>
                    </div>
                  </td>
                  <td className="px-5 py-4">{shift.hours}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {shift.days.map((day) => (
                        <span key={day} className="rounded bg-[#E5D5B8] px-1.5 py-1 text-[10px] text-black">
                          {day}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-5 py-2 text-xs font-medium ${
                        shift.status === "active"
                          ? "bg-[#B9F8CF] text-[#0D542B]"
                          : "bg-[#FFF5F5] text-[#FF4D4D] border-[#FF4D4D]/20"
                      }`}
                    >
                      {formatStatusLabel(shift.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AvatarStack
                      salespeople={shift.salespeople || []}
                      extra={shift.extra}
                      onAdd={() => {
                        setAddSalespeopleShift(shift);
                        setSelectedSalespersonIds([]);
                        setIsAddSalespeopleOpen(true);
                      }}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-4 text-white/70">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void openEditShiftModal(shift);
                        }}
                        aria-label={`Edit ${shift.name}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <ChevronRight size={18} />
                    </div>
                  </td>
                </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-white/45">
                      No shifts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-4 text-sm text-white/70">
            <span>
              {shiftPagination.total > 0
                ? `Showing ${shiftShowingFrom} to ${shiftShowingTo} of ${shiftPagination.total} entries`
                : "Showing 0 entries"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShiftCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeShiftPage === 1}
                className="h-9 rounded-lg bg-[#171717] px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/20"
                aria-label="Previous shift page"
              >
                Previous
              </button>
              {shiftPaginationItems.map((page, index) =>
                page === "..." ? (
                  <span key={`shift-page-gap-${index}`} className="px-2 text-white/45">...</span>
                ) : (
                  <button
                    key={`shift-page-${page}`}
                    type="button"
                    onClick={() => setShiftCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                      page === safeShiftPage
                        ? "bg-[#E5D5B8] text-black"
                        : "text-white/65 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setShiftCurrentPage((page) => Math.min(shiftTotalPages, page + 1))}
                disabled={safeShiftPage === shiftTotalPages}
                className="h-9 rounded-lg bg-[#171717] px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/20"
                aria-label="Next shift page"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr_1.8fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold">Active Shifts Now</h2>
            <div className="flex h-[254px] flex-col overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#171717]">
              {activeNow.length ? (
                <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
                  {activeNow.map((shift) => (
                    <div key={`now-${shift.id || shift.name}`} className="rounded-xl border border-[#2D2D2D] bg-[#171717] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B665]" />
                            <TextTooltip text={shift.name} capitalize className="max-w-[110px]"/>
                          </p>
                          <p className="mt-1 text-xs text-white/45">{shift.hours}</p>
                        </div>
                        {shift.salespeople?.length ? (<div className="shrink-0"><AvatarStack salespeople={shift.salespeople} extra={shift.extra} /></div>) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/45">
                  No active shifts now
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Recent Assignments</h2>
            <div className="flex h-[254px] flex-col overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#171717]">
              {recentAssignmentRows.length ? (
                <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
                  {recentAssignmentRows.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-[10px] text-white/65">{getInitials(item.person)}</span>
                        <div className="min-w-0 flex-1">
                          <TextTooltip text={item.company} className="max-w-[160px] text-sm font-medium"/>
                          <TextTooltip text={item.person} className="max-w-[160px] text-xs text-white/45"/>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <LeadsStatusBadge status={item.status} size="compact" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/45">
                  No recent assignments
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Hourly Lead & Quote Volume</h2>
            <div className="h-[254px] rounded-xl border border-[#2D2D2D] bg-[#171717] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadVolumeRows} margin={{ left: -18, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leadVolume" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#E5D5B8" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#E5D5B8" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="quoteVolume" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#9DDDF8" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#9DDDF8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    ticks={leadVolumeTicks}
                    interval={0}
                    minTickGap={8}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,.28)", fontSize: 8 }}
                  />
                  <YAxis
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(1, dataMax)]}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,.28)", fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="#E5D5B8"
                    strokeWidth={2}
                    fill="url(#leadVolume)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="quotes"
                    name="Quotes"
                    stroke="#9DDDF8"
                    strokeWidth={2}
                    fill="url(#quoteVolume)"
                    dot={false}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ color: "rgba(255,255,255,.55)", fontSize: 11, paddingBottom: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
        </div>
      )}

      {isShiftModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm md:py-12">
          <div className="my-auto w-full max-w-[570px] overflow-hidden rounded-2xl border border-[#3D3D3D] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] px-7 py-6">
              <h2 className="text-[28px] font-bold leading-none text-white">{editingShift ? "Edit Shift" : "Create Shift"}</h2>
              <button
                type="button"
                onClick={closeShiftModal}
                className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-[#2A2527] text-white transition hover:bg-[#343033]"
                aria-label={editingShift ? "Close edit shift" : "Close create shift"}
              >
                <X size={29} />
              </button>
            </div>

            <div className="no-scrollbar max-h-[calc(100vh-220px)] space-y-7 overflow-y-auto px-7 py-8">
              <label className="relative block">
                <span className={`absolute -top-3 left-3 bg-black px-2 text-base leading-6 ${shiftNameError ? "text-[#FF4D4D]" : "text-white/45"}`}>Shift Name*</span>
                <input
                  type="text"
                  value={shiftName}
                  onChange={(event) => {
                    setShiftName(event.target.value);
                    if (event.target.value.trim()) setShiftNameError("");
                  }}
                  placeholder="Eg : Morning Shift"
                  className={`h-[82px] w-full rounded-xl border ${shiftNameError ? "border-[#FF4D4D]" : "border-[#3D3D3D]"} bg-black px-7 text-base text-white outline-none placeholder:text-white/25 focus:border-[#E5D5B8]`}
                />
                {shiftNameError && (
                  <p className="mt-1.5 ml-2 text-xs text-[#FF4D4D]">
                    {shiftNameError}
                  </p>
                )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <TimePicker
                  label="Start Time*"
                  value={startTime}
                  onChange={(time) => {
                  setStartTime(time);

                  if (time) {
                    setStartTimeError("");
                  }

                  if (time && endTime) {
                    const minimumEndTime = new Date(time.getTime() + 60 * 60 * 1000);

                    if (endTime < minimumEndTime) {
                      setEndTime(null);
                      setEndTimeError("End Time must be at least 1 hour after Start Time");
                    }
                  }
                }}
                  isDark
                  height="72px"
                  fontSize="16px"
                  labelFontSize="16px"
                  colors={{
                    inputBorder: startTimeError ? "#FF4D4D" : "#3D3D3D",
                    inputBorderHover: startTimeError ? "#FF4D4D" : "rgba(255,255,255,0.35)",
                    inputBackground: "#000000",
                    labelText: startTimeError ? "#FF4D4D" : "rgba(255,255,255,0.62)",
                    iconColor: "#FFFFFF",
                  }}
                    />
                {startTimeError && (
                  <p className="mt-1.5 text-xs text-[#FF4D4D]">
                    {startTimeError}
                  </p>
                )}
              </div>

              <div>
                <TimePicker
                  label="End Time*"
                  value={endTime}
                  onChange={(time) => {
                    setEndTime(time);

                    if (time) {
                      setEndTimeError("");
                    }
                  }}
                  minTime={
                    startTime
                      ? new Date(startTime.getTime() + 60 * 60 * 1000)
                      : undefined
                  }
                  isDark
                  height="72px"
                  fontSize="16px"
                  labelFontSize="16px"
                  colors={{
                    inputBorder: endTimeError ? "#FF4D4D" : "#3D3D3D",
                    inputBorderHover: endTimeError ? "#FF4D4D" : "rgba(255,255,255,0.35)",
                    inputBackground: "#000000",
                    labelText: endTimeError ? "#FF4D4D" : "rgba(255,255,255,0.62)",
                    iconColor: "#FFFFFF",
                  }}
                  />
                  {endTimeError && (
                    <p className="mt-1.5 text-xs text-[#FF4D4D]">
                      {endTimeError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-4 text-lg font-medium text-white">Active Days</p>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                    const isSelected = enabledDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setEnabledDays((current) =>
                            current.includes(day)
                              ? current.filter((item) => item !== day)
                              : [...current, day],
                          );
                        }}
                        className={`h-10 rounded-md px-3 text-lg font-medium transition ${
                          isSelected
                            ? "bg-[#E5D5B8] text-black hover:bg-[#D9C49E]"
                            : "bg-[#3A3A3A] text-white/55 hover:bg-[#454545]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#3D3D3D] bg-[#121212] px-6 py-5">
                <div>
                  <p className="text-lg font-semibold text-white">Enable Shift</p>
                  <p className="mt-1 text-sm text-white/45">Receives lead assignments immediately</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShiftEnabled((current) => !current)}
                  className={`relative h-[26px] w-[42px] rounded-lg p-1 transition ${
                    isShiftEnabled ? "bg-[#E5D5B8]" : "bg-[#3A3A3A]"
                  }`}
                  aria-label={isShiftEnabled ? "Disable shift" : "Enable shift"}
                >
                  <span
                    className={`absolute left-1 top-1 h-[18px] w-[18px] rounded-md bg-white transition-transform ${
                      isShiftEnabled ? "translate-x-[16px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeShiftModal}
                  className="h-12 rounded-lg bg-[#202020] text-sm font-semibold text-white transition hover:bg-[#2B2B2B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingShift}
                  onClick={async () => {
                   let hasError = false;

                    if (!shiftName.trim()) {
                      setShiftNameError("Shift Name is required");
                      hasError = true;
                    }

                    if (!startTime) {
                      setStartTimeError("Start Time is required");
                      hasError = true;
                    }

                    if (!endTime) {
                      setEndTimeError("End Time is required");
                      hasError = true;
                    }

                    if (enabledDays.length === 0) {
                      toast.error("Please select at least one active day");
                      hasError = true;
                    }

                    if (hasError || !startTime || !endTime) {
                      return;
                    }

                    const minimumEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);

                    if (endTime < minimumEndTime) {
                      setEndTimeError("End Time must be at least 1 hour after Start Time");
                      return;
                    }
                    setIsSavingShift(true);
                    const payload = {
                      name: shiftName.trim(),
                      start_time: formatApiTime(startTime),
                      end_time: formatApiTime(endTime),
                      active_days: enabledDays,
                      status: isShiftEnabled ? "active" : "inactive",
                    };
                    const response = editingShift?.id
                      ? await shiftManagementApi.updateShift(editingShift.id, payload)
                      : await shiftManagementApi.createShift(payload);
                    setIsSavingShift(false);
                    if (!response.success) {
                      toast.error(response.error || `Failed to ${editingShift ? "update" : "create"} shift`);
                      return;
                    }
                    toast.success(editingShift ? "Shift updated successfully" : "Shift created successfully");
                    setStatusFilter("Status");
                    setMonthFilter("Month");
                    setShiftSearch("");
                    setShiftCurrentPage(1);
                    const updatedShift = response?.data?.data || response?.data;
                    if (editingShift && selectedShift) {
                      const detailResponse = selectedShift.id ? await shiftManagementApi.getShiftDetail(selectedShift.id) : null;
                      const detail = detailResponse?.data?.data || detailResponse?.data;
                      const mappedShift = mapShift(detail || updatedShift || {
                        ...selectedShift,
                        name: payload.name,
                        start_time: payload.start_time,
                        end_time: payload.end_time,
                        active_days: payload.active_days,
                        status: payload.status,
                      });
                      setSelectedShift({ ...selectedShift, ...mappedShift, id: selectedShift.id });
                    }
                    closeShiftModal();
                    if (routeView === "dashboard") {
                      await refreshShiftData({ page: 1, status: undefined, search: undefined });
                    } else if (routeShiftId) {
                      await loadSelectedShift();
                      setShiftDetailRefreshKey((current) => current + 1);
                    }
                  }}
                  className={`h-12 rounded-lg text-sm font-semibold transition ${
                    canSaveShift
                      ? "bg-[#E5D5B8] text-black hover:bg-[#D9C49E]"
                      : "bg-[#E5D5B8]/50 text-black"
                  } ${isSavingShift ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  {isSavingShift ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isShiftSelectModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-[456px] rounded-2xl border border-[#3D3D3D] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] px-6 py-6">
              <h2 className="text-2xl font-bold leading-none text-white">
                {shiftSelectMode === "manage" ? "Manage Salespeople" : "Select Shift"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsShiftSelectModalOpen(false);
                  setShiftSelectMode(null);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2A2527] text-white transition hover:bg-[#343033]"
                aria-label="Close select shift"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-7">
              <div className="relative block">
                <span className="absolute -top-3 left-5 z-10 bg-black px-3 text-sm text-white/50">Select Shift*</span>
                <BasicDropdown
                  label="Select Shift"
                  value="Select Shift"
                  options={[{ label: "Select Shift", value: "Select Shift" }, ...shiftSelectOptions]}
                  width="w-full"
                  styles="w-full justify-between text-white/70 text-sm"
                  onChange={(value) => {
                    if (value === "Select Shift") return;
                    const shift = shiftRows.find((item) => String(item.id) === value);
                    if (!shift) {
                      toast.error("Shift not found");
                      return;
                    }
                    const nextMode = shiftSelectMode;
                    setIsShiftSelectModalOpen(false);
                    setShiftSelectMode(null);

                    if (nextMode === "rr") {
                      router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${shift.id}/round-robin`);
                      return;
                    }

                    router.push(`${SHIFT_MANAGEMENT_BASE_PATH}/shift/${shift.id}`);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsShiftSelectModalOpen(false);
                  setShiftSelectMode(null);
                }}
                className="h-10 w-full rounded-md bg-[#202020] text-sm font-semibold text-white transition hover:bg-[#2B2B2B]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddSalespeopleOpen && addSalespeopleShift ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm">
          <div className="no-scrollbar max-h-[calc(100vh-80px)] w-full max-w-[456px] overflow-y-auto rounded-2xl border border-[#3D3D3D] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] px-6 py-6">
              <h2 className="text-2xl font-bold leading-none text-white">Add Salespeople</h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddSalespeopleOpen(false);
                  setAddSalespeopleShift(null);
                  setIsSalespersonDropdownOpen(false);
                  setSalespersonSearch("");
                  setSelectedSalespersonIds([]);
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2A2527] text-white transition hover:bg-[#343033]"
                aria-label="Close add salespeople"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-7">
              <label className="relative block">
                <span className="absolute -top-3 left-5 bg-black px-3 text-sm text-white/50">Select Shift</span>
                <div className="flex h-[66px] items-center rounded-lg border border-[#3D3D3D] bg-black px-5 text-sm text-white">
                  <span>{addSalespeopleShift.name}</span>
                </div>
              </label>

              <div className="relative block" ref={salespersonDropdownRef}>
                <span className="absolute -top-3 left-5 bg-black px-3 text-sm text-white/50">Select Salespeople Name*</span>
                <button
                  type="button"
                  onClick={() => setIsSalespersonDropdownOpen((current) => !current)}
                  className={`flex h-[66px] w-full items-center justify-between rounded-lg border bg-black px-5 text-left text-sm text-white outline-none transition ${
                    isSalespersonDropdownOpen ? "border-[#E5D5B8] ring-1 ring-[#E5D5B8]/25" : "border-[#3D3D3D] hover:border-[#E5D5B8]/50"
                  }`}
                >
                  <span className={selectedSalespersonOptions.length ? "text-white" : "text-white/45"}>
                    {selectedSalespersonOptions.length
                      ? selectedSalespersonOptions.map((person) => person.name).join(", ")
                      : "Select Salespeople Name"}
                  </span>
                  <ChevronRight
                    size={18}
                    className={`text-white/65 transition-transform ${isSalespersonDropdownOpen ? "-rotate-90 text-[#E5D5B8]" : "rotate-90"}`}
                  />
                </button>

                {isSalespersonDropdownOpen ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-[#FFFFFF80] bg-[#0F0F0F] shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
                    <div className="border-b border-[#FFFFFF80] p-3">
                      <div className="flex items-center gap-2 rounded-xl border border-[#3B3B46] bg-[#1A1A1F] px-4 py-2.5">
                        <Search size={16} className="shrink-0 text-[#6B6B6B]" />
                        <input
                          type="text"
                          value={salespersonSearch}
                          onChange={(event) => setSalespersonSearch(event.target.value)}
                          placeholder="Search Salespeople..."
                          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#6B6B6B]"
                          autoFocus
                        />
                        {salespersonSearch ? (
                          <button
                            type="button"
                            onClick={() => setSalespersonSearch("")}
                            className="text-sm text-[#6B6B6B] transition hover:text-white"
                          >
                            x
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="no-scrollbar max-h-[150px] overflow-y-auto p-2.5">
                      {filteredSalespeopleOptions.length ? (
                        filteredSalespeopleOptions.map((person) => {
                          const isSelected = selectedSalespersonIds.includes(person.sales_rep_id);
                          return (
                            <button
                              key={person.sales_rep_id}
                              type="button"
                              onClick={() => {
                                setSelectedSalespersonIds((current) =>
                                  current.includes(person.sales_rep_id)
                                    ? current.filter((id) => id !== person.sales_rep_id)
                                    : [...current, person.sales_rep_id]
                                );
                              }}
                              className={`group mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-all ${
                                isSelected
                                  ? "bg-[#FFFCE8] text-[#171717]"
                                  : "text-[#FFFFFF85] hover:bg-[#FFFCE8] hover:text-[#171717]"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                                  isSelected
                                    ? "border-[#E8D1AB] bg-[#E8D1AB]"
                                    : "border-[#FFFFFF85] group-hover:border-[#171717]"
                                }`}
                              >
                                {isSelected ? <span className="h-2.5 w-2.5 rounded-sm bg-[#101010]" /> : null}
                              </span>
                              <span className="truncate font-medium">{person.name}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-sm text-[#6B6B6B]">No salespeople found</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSalespeopleOpen(false);
                    setAddSalespeopleShift(null);
                    setSelectedSalespersonIds([]);
                    setIsSalespersonDropdownOpen(false);
                    setSalespersonSearch("");
                  }}
                  className="h-10 rounded-md bg-[#202020] text-sm font-semibold text-white transition hover:bg-[#2B2B2B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAddingSalesperson}
                  onClick={async () => {
                    if (!addSalespeopleShift?.id || !selectedSalespersonIds.length) {
                      toast.error("Please select shift and salespeople");
                      return;
                    }
                    setIsAddingSalesperson(true);
                    const responses = await Promise.all(
                      selectedSalespersonIds.map((salespersonId) =>
                        shiftManagementApi.addSalespersonToShift(addSalespeopleShift.id, salespersonId)
                      )
                    );
                    setIsAddingSalesperson(false);
                    const failedResponse = responses.find((response) => !response.success);
                    if (failedResponse) {
                      toast.error(failedResponse.error || "Failed to add salespeople");
                      return;
                    }
                    toast.success("Salespeople added successfully");
                    setIsAddSalespeopleOpen(false);
                    setAddSalespeopleShift(null);
                    setSelectedSalespersonIds([]);
                    setIsSalespersonDropdownOpen(false);
                    setSalespersonSearch("");
                    if (selectedShift?.id && String(selectedShift.id) === String(addSalespeopleShift.id)) {
                      setShiftDetailRefreshKey((current) => current + 1);
                    }
                    if (routeView === "dashboard") {
                      await loadShiftDashboard();
                    } else if (routeShiftId) {
                      await loadSelectedShift();
                    }
                  }}
                  className="h-10 rounded-md bg-[#E5D5B8] text-sm font-semibold text-black transition hover:bg-[#D9C49E]"
                >
                  {isAddingSalesperson ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}