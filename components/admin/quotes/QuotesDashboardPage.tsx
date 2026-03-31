"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfDay,
  format as formatDateFns,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import QuotesEmptyState from "@/components/admin/quotes/QuotesEmptyState";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  salesApi,
  type QuotesDashboardData,
  type QuotesListResponse,
  type SalesQuoteListItem,
} from "@/lib/api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  Calendar,
  Clock,
  Copy,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
};

type QuotesDashboardPageProps = {
  createHref: string;
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
};

type ChartPoint = {
  name: string;
  total: number;
  accepted: number;
  pending: number;
  draft: number;
  rejected: number;
  expired: number;
};

type DisplayQuoteRow = {
  id: string;
  quoteNumber: string;
  client: string;
  location: string;
  initials: string;
  color: string;
  project: string;
  amountValue: number;
  status: string;
  statusKey: string;
  statusColor: string;
  validUntil: string;
  salesperson: string;
  salespersonKey: string;
  createdAtRaw: string;
  searchValue: string;
};

type QuoteListPaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} | null;

type QuoteListState = {
  rows: SalesQuoteListItem[];
  summary: Record<string, number>;
  pagination: QuoteListPaginationState;
};

type QuoteOverview = {
  total_quotes: number;
  accepted_quotes: number;
  pending_quotes: number;
  draft_quotes: number;
  rejected_quotes: number;
  expired_quotes: number;
  total_amount: number;
};

type QuoteChartRange = "all" | "week" | "month" | "custom";
type QuoteChartMetricKey = "total" | "accepted" | "pending" | "draft";

type QuoteChartBucket = {
  key: string;
  name: string;
};

type QuoteActionMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onReject: () => void;
  mobile?: boolean;
};

type QuoteActionMenuButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "default" | "danger";
};

const AVATAR_COLORS = [
  "bg-[#FFF6E9] text-[#101010]",
  "bg-[#D6E6FF] text-[#4A90E2]",
  "bg-[#D6FFE6] text-[#27AE60]",
  "bg-[#FFD6E6] text-[#EB5757]",
  "bg-[#FFD1B6] text-[#D35400]",
  "bg-[#E6DBFF] text-[#9070FF]",
];

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const QuoteActionMenuButton = ({
  icon,
  label,
  onClick,
  variant = "default",
}: QuoteActionMenuButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[14px] font-medium transition-colors lg:text-[15px] ${
      variant === "danger"
        ? "text-[#F04438] hover:bg-[#F04438]/10"
        : "text-white hover:bg-white/5"
    }`}
  >
    <span className={variant === "danger" ? "text-[#F04438]" : "text-white/70"}>{icon}</span>
    {label}
  </button>
);

const QuoteActionMenu = ({
  open,
  onOpenChange,
  onViewDetails,
  onDuplicate,
  onEdit,
  onReject,
  mobile = false,
}: QuoteActionMenuProps) => {
  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleMenuAction =
    (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      action();
    };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          className={
            mobile
              ? "rounded-lg p-2 text-[#E8D1AB] transition-colors hover:bg-[#2a2a2a]"
              : "text-[#E8D1AB] transition-colors hover:text-white"
          }
          aria-label="Quote actions"
        >
          {mobile ? <MoreHorizontal size={18} /> : <MoreVertical size={18} />}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        onClick={(event) => event.stopPropagation()}
        className="w-[220px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0A0A] p-0 text-white shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex flex-col p-1.5">
          <QuoteActionMenuButton
            icon={<FileText size={18} />}
            label="View Details"
            onClick={handleMenuAction(onViewDetails)}
          />
          <QuoteActionMenuButton
            icon={<Copy size={18} />}
            label="Duplicate"
            onClick={handleMenuAction(onDuplicate)}
          />
          <QuoteActionMenuButton
            icon={<Pencil size={18} />}
            label="Edit"
            onClick={handleMenuAction(onEdit)}
          />
        </div>

        <div className="h-[1px] w-full bg-white/10" />

        <div className="flex flex-col p-1.5">
          <QuoteActionMenuButton
            icon={<XCircle size={18} />}
            label="Reject Quote"
            onClick={handleMenuAction(onReject)}
            variant="danger"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getOptionalNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const getNumber = (...values: unknown[]) => getOptionalNumber(...values) ?? 0;

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const parseDateValue = (value: string) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

const formatDate = (value: string) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = parseDateValue(value);
  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatLabel = (value: string) =>
  value
    .replace(/_quotes$/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getChartMetricKey = (selectedStat: string): QuoteChartMetricKey => {
  switch (selectedStat) {
    case "Accepted Quotes":
      return "accepted";
    case "Pending Quotes":
      return "pending";
    case "Draft Quotes":
      return "draft";
    default:
      return "total";
  }
};

const normalizeStatusForChart = (statusKey: string): keyof Omit<ChartPoint, "name"> => {
  switch (statusKey) {
    case "accepted":
    case "confirmed":
      return "accepted";
    case "pending":
    case "sent":
      return "pending";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "expired":
      return "expired";
    case "draft":
    default:
      return "draft";
  }
};

const createEmptyChartPoint = (name: string): ChartPoint => ({
  name,
  total: 0,
  accepted: 0,
  pending: 0,
  draft: 0,
  rejected: 0,
  expired: 0,
});

const buildQuoteChartBuckets = (
  range: QuoteChartRange,
  selectedDate: Date | null
): QuoteChartBucket[] => {
  if (range === "custom") {
    const baseDate = selectedDate ? startOfDay(selectedDate) : startOfDay(new Date());

    return eachHourOfInterval({
      start: baseDate,
      end: endOfDay(baseDate),
    }).map((date) => ({
      key: formatDateFns(date, "yyyy-MM-dd-HH"),
      name: formatDateFns(date, "ha"),
    }));
  }

  if (range === "week") {
    return eachDayOfInterval({
      start: startOfDay(subDays(new Date(), 6)),
      end: startOfDay(new Date()),
    }).map((date) => ({
      key: formatDateFns(date, "yyyy-MM-dd"),
      name: formatDateFns(date, "EEE"),
    }));
  }

  if (range === "month") {
    return eachDayOfInterval({
      start: startOfDay(subDays(new Date(), 29)),
      end: startOfDay(new Date()),
    }).map((date) => ({
      key: formatDateFns(date, "yyyy-MM-dd"),
      name: formatDateFns(date, "MMM d"),
    }));
  }

  return eachMonthOfInterval({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: startOfMonth(new Date()),
  }).map((date) => ({
    key: formatDateFns(date, "yyyy-MM"),
    name: formatDateFns(date, "MMM yy"),
  }));
};

const getQuoteChartBucketKey = (
  date: Date,
  range: QuoteChartRange,
  selectedDate: Date | null
) => {
  if (range === "custom") {
    const activeDate = selectedDate ? startOfDay(selectedDate) : startOfDay(new Date());
    if (formatDateFns(date, "yyyy-MM-dd") !== formatDateFns(activeDate, "yyyy-MM-dd")) {
      return null;
    }

    return formatDateFns(date, "yyyy-MM-dd-HH");
  }

  if (range === "week" || range === "month") {
    return formatDateFns(date, "yyyy-MM-dd");
  }

  return formatDateFns(date, "yyyy-MM");
};

const buildQuoteChartData = (
  rows: SalesQuoteListItem[],
  range: QuoteChartRange,
  selectedDate: Date | null
): ChartPoint[] => {
  const buckets = buildQuoteChartBuckets(range, selectedDate);
  const chartMap = new Map<string, ChartPoint>(
    buckets.map((bucket) => [bucket.key, createEmptyChartPoint(bucket.name)])
  );

  rows.forEach((quote) => {
    const createdAt = parseDateValue(getText(quote.created_at, quote.updated_at));
    if (!createdAt) {
      return;
    }

    const bucketKey = getQuoteChartBucketKey(createdAt, range, selectedDate);
    if (!bucketKey) {
      return;
    }

    const point = chartMap.get(bucketKey);
    if (!point) {
      return;
    }

    point.total += 1;
    point[normalizeStatusForChart(getText(quote.quote_status, quote.status, "draft").toLowerCase())] += 1;
  });

  return buckets.map((bucket) => chartMap.get(bucket.key) ?? createEmptyChartPoint(bucket.name));
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
    case "confirmed":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "draft":
      return "bg-[#D1D5DB] text-[#4B5563] border-transparent";
    case "pending":
    case "sent":
      return "bg-[#D6E6FF] text-[#4A90E2] border-transparent";
    case "viewed":
      return "bg-[#E6DBFF] text-[#9070FF] border-transparent";
    case "rejected":
    case "cancelled":
      return "bg-[#FFD1D1] text-[#EB5757] border-transparent";
    case "expired":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
    default:
      return "bg-white/10 text-white border-transparent";
  }
};

const buildStatusSummary = (rows: SalesQuoteListItem[]) =>
  rows.reduce<Record<string, number>>((summary, quote) => {
    const statusKey = getText(quote.quote_status, quote.status, "draft").toLowerCase();

    if (!statusKey) {
      return summary;
    }

    summary[statusKey] = (summary[statusKey] ?? 0) + 1;
    return summary;
  }, {});

const extractQuoteListState = (data: QuotesListResponse["data"]): QuoteListState => {
  if (Array.isArray(data)) {
    return {
      rows: data,
      summary: buildStatusSummary(data),
      pagination: null,
    };
  }

  if (!data || typeof data !== "object") {
    return {
      rows: [],
      summary: {},
      pagination: null,
    };
  }

  const record = getRecord(data);
  const keys = ["quotes", "items", "results", "rows", "list", "data"] as const;
  let rows: SalesQuoteListItem[] = [];

  for (const key of keys) {
    const value = record?.[key];
    if (Array.isArray(value)) {
      rows = value as SalesQuoteListItem[];
      break;
    }
  }

  const summaryRecord = getRecord(record?.summary);
  const summary = Object.entries(summaryRecord ?? {}).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      const parsedValue = getOptionalNumber(value);
      if (parsedValue !== null) {
        acc[key] = parsedValue;
      }

      return acc;
    },
    {}
  );

  const paginationRecord = getRecord(record?.pagination);
  const pagination = paginationRecord
    ? {
        page: getOptionalNumber(paginationRecord.page) ?? 1,
        limit: getOptionalNumber(paginationRecord.limit) ?? rows.length,
        total: getOptionalNumber(paginationRecord.total) ?? rows.length,
        totalPages:
          getOptionalNumber(paginationRecord.total_pages, paginationRecord.totalPages) ?? 1,
      }
    : null;

  return {
    rows,
    summary: Object.keys(summary).length > 0 ? summary : buildStatusSummary(rows),
    pagination,
  };
};

const matchesStatusFilter = (quoteStatusKey: string, filterValue: string) => {
  if (filterValue === "all") {
    return true;
  }

  if (filterValue === "accepted") {
    return quoteStatusKey === "accepted" || quoteStatusKey === "confirmed";
  }

  if (filterValue === "pending") {
    return quoteStatusKey === "pending" || quoteStatusKey === "sent";
  }

  if (filterValue === "rejected") {
    return quoteStatusKey === "rejected" || quoteStatusKey === "cancelled";
  }

  return quoteStatusKey === filterValue;
};

const normalizeQuoteRow = (quote: SalesQuoteListItem, index: number): DisplayQuoteRow => {
  const client = getText(
    quote.client_name,
    quote.client,
    quote.customer_name,
    quote.guest_email,
    quote.client_email,
    "Unknown Client"
  );
  const project = getText(
    quote.project_description,
    quote.project,
    quote.description,
    quote.video_shoot_type,
    "Project details unavailable"
  );
  const salesperson = getText(
    quote.salesperson,
    quote.sales_person,
    quote.sales_rep_name,
    quote.sales_rep,
    quote.created_by_name,
    quote.assigned_sales_rep?.name,
    quote.created_by?.name,
    "N/A"
  );
  const statusKey = getText(quote.quote_status, quote.status, "draft").toLowerCase() || "draft";
  const quoteNumber = getText(quote.quote_number);
  const location = getText(
    quote.location,
    quote.client_address,
    quote.address,
    "Location not specified"
  );
  const amountValue = getNumber(quote.total_amount, quote.total, quote.amount);

  return {
    id: String(quote.sales_quote_id ?? quote.quote_id ?? quote.id ?? index),
    quoteNumber,
    client,
    location,
    initials: getInitials(client),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    project,
    amountValue,
    status: formatLabel(statusKey),
    statusKey,
    statusColor: getStatusColor(statusKey),
    validUntil: formatDate(getText(quote.valid_until, quote.expires_at)),
    salesperson,
    salespersonKey: salesperson.toLowerCase(),
    createdAtRaw: getText(quote.created_at, quote.updated_at),
    searchValue: [
      client,
      project,
      salesperson,
      quoteNumber,
      getText(quote.client_email, quote.guest_email, quote.client_phone),
      location,
      statusKey,
    ]
      .join(" ")
      .toLowerCase(),
  };
};

export default function QuotesDashboardPage({
  createHref,
  TopbarComponent,
}: QuotesDashboardPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const detailBaseHref = createHref.endsWith("/create")
    ? createHref.slice(0, -"/create".length)
    : createHref;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [chartRange, setChartRange] = useState<QuoteChartRange>("all");
  const [selectedStat, setSelectedStat] = useState("Total Quotes");
  const [dashboardData, setDashboardData] = useState<QuotesDashboardData | null>(null);
  const [quotes, setQuotes] = useState<SalesQuoteListItem[]>([]);
  const [quoteSummary, setQuoteSummary] = useState<Record<string, number>>({});
  const [quotePagination, setQuotePagination] = useState<QuoteListPaginationState>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      setChartRange("custom");
      return;
    }

    setChartRange((prev) => (prev === "custom" ? "all" : prev));
  }, [selectedDate]);

  useEffect(() => {
    const fetchQuotesData = async () => {
      setLoading(true);

      try {
        const effectiveRange = selectedDate ? "custom" : chartRange;
        const dashboardParams = {
          range: effectiveRange,
          ...(selectedDate ? { date_on: formatDateFns(selectedDate, "yyyy-MM-dd") } : {}),
        };

        const [dashboardResponse, listResponse] = await Promise.all([
          salesApi.getQuotesDashboard(dashboardParams),
          salesApi.getQuotesList({ page: 1, limit: 1000 }),
        ]);

        const normalizedListState = listResponse.success
          ? extractQuoteListState(listResponse.data)
          : { rows: [], summary: {}, pagination: null };

        setDashboardData(dashboardResponse.success ? dashboardResponse.data : null);
        setQuotes(normalizedListState.rows);
        setQuoteSummary(normalizedListState.summary);
        setQuotePagination(normalizedListState.pagination);
      } catch (error) {
        console.error("Failed to fetch quotes data", error);
        setDashboardData(null);
        setQuotes([]);
        setQuoteSummary({});
        setQuotePagination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotesData();
  }, [chartRange, selectedDate]);

  const handleUnsupportedQuoteAction = (
    actionLabel: "Duplicate" | "Edit" | "Reject Quote"
  ) => {
    setOpenActionMenuId(null);
    toast(actionLabel === "Reject Quote"
      ? "Reject quote action is not available yet."
      : `${actionLabel} action is not available yet.`);
  };

  const handleRejectQuote = async (quoteId: string, currentStatus?: string) => {
    setOpenActionMenuId(null);

    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    if (rejectingQuoteId === quoteId) {
      return;
    }

    if (["rejected", "cancelled"].includes((currentStatus ?? "").toLowerCase())) {
      toast("Quote is already rejected.");
      return;
    }

    setRejectingQuoteId(quoteId);
    try {
      const response = await salesApi.updateQuoteStatus(quoteId, "rejected");

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to reject quote"
        );
      }

      setQuotes((currentRows) =>
        currentRows.map((quote) => {
          const currentId = String(quote.sales_quote_id ?? quote.quote_id ?? quote.id ?? "");
          if (currentId !== quoteId) {
            return quote;
          }

          return {
            ...quote,
            quote_status: "rejected",
            status: "rejected",
          };
        })
      );
      setDashboardData(null);
      setQuoteSummary({});
      toast.success("Quote rejected successfully");
    } catch (error) {
      console.error("Failed to reject quote", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject quote");
    } finally {
      setRejectingQuoteId(null);
    }
  };

  const handleViewQuoteDetails = (quoteId: string) => {
    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setOpenActionMenuId(null);
    router.push(`${detailBaseHref}/${quoteId}`);
  };

  const handleEditQuote = (quoteId: string, targetView: string = "details") => {
    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setOpenActionMenuId(null);
    router.push(`${createHref}?quoteId=${encodeURIComponent(quoteId)}&view=${encodeURIComponent(targetView)}`);
  };

  const statsIcons: Record<string, React.ReactNode> = {
    "Total Quotes": <FileText className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Accepted Quotes": <BadgeCheck className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Pending Quotes": <Clock className="fill-[#E8D1AB] stroke-black" size={20} />,
    "Draft Quotes": <Calendar className="fill-[#E8D1AB] stroke-black" size={20} />,
  };

  const fallbackOverview = useMemo<QuoteOverview>(() => {
    const rowStatusSummary = buildStatusSummary(quotes);
    const totalAmount = quotes.reduce(
      (sum, quote) => sum + getNumber(quote.total_amount, quote.total, quote.amount),
      0
    );

    return {
      total_quotes:
        getOptionalNumber(quoteSummary.total_quotes, quoteSummary.total, quotePagination?.total) ??
        quotes.length,
      accepted_quotes:
        getOptionalNumber(quoteSummary.accepted_quotes, quoteSummary.accepted) ??
        ((rowStatusSummary.accepted ?? 0) + (rowStatusSummary.confirmed ?? 0)),
      pending_quotes:
        getOptionalNumber(quoteSummary.pending_quotes, quoteSummary.pending) ??
        ((rowStatusSummary.pending ?? 0) + (rowStatusSummary.sent ?? 0)),
      draft_quotes:
        getOptionalNumber(quoteSummary.draft_quotes, quoteSummary.draft) ??
        (rowStatusSummary.draft ?? 0),
      rejected_quotes:
        getOptionalNumber(quoteSummary.rejected_quotes, quoteSummary.rejected) ??
        ((rowStatusSummary.rejected ?? 0) + (rowStatusSummary.cancelled ?? 0)),
      expired_quotes:
        getOptionalNumber(quoteSummary.expired_quotes, quoteSummary.expired) ??
        (rowStatusSummary.expired ?? 0),
      total_amount:
        getOptionalNumber(quoteSummary.total_amount, quoteSummary.totalAmount) ?? totalAmount,
    };
  }, [quotePagination, quoteSummary, quotes]);

  const overviewData = dashboardData?.overview ?? fallbackOverview;

  const displayStats = [
    { title: "Total Quotes", value: String(overviewData.total_quotes ?? 0) },
    { title: "Accepted Quotes", value: String(overviewData.accepted_quotes ?? 0) },
    { title: "Pending Quotes", value: String(overviewData.pending_quotes ?? 0) },
    { title: "Draft Quotes", value: String(overviewData.draft_quotes ?? 0) },
  ];

  const displayQuotesData = useMemo(
    () => quotes.map((quote, index) => normalizeQuoteRow(quote, index)),
    [quotes]
  );

  const activeChartMetric = useMemo(
    () => getChartMetricKey(selectedStat),
    [selectedStat]
  );

  const activeChartRange = selectedDate ? "custom" : chartRange;

  const derivedChartData = useMemo(
    () => buildQuoteChartData(quotes, activeChartRange, selectedDate),
    [activeChartRange, quotes, selectedDate]
  );

  const dashboardChartFallback = useMemo<ChartPoint[]>(
    () =>
      (activeChartRange === "all" ? (dashboardData?.chart ?? []).slice(-6) : dashboardData?.chart ?? []).map((item, index) => ({
        ...createEmptyChartPoint(item.label || `Item ${index + 1}`),
        total: Number(item.quote_count ?? 0),
      })),
    [activeChartRange, dashboardData]
  );

  const displayChartData = useMemo(
    () =>
      derivedChartData.some(
        (point) =>
          point.total > 0 ||
          point.accepted > 0 ||
          point.pending > 0 ||
          point.draft > 0 ||
          point.rejected > 0 ||
          point.expired > 0
      )
        ? derivedChartData
        : dashboardChartFallback,
    [dashboardChartFallback, derivedChartData]
  );

  const hasChartData = useMemo(
    () => displayChartData.some((point) => Number(point[activeChartMetric] ?? 0) > 0),
    [activeChartMetric, displayChartData]
  );

  const salespersonOptions = useMemo(
    () =>
      Array.from(
        new Set(
          displayQuotesData
            .map((quote) => quote.salesperson)
            .filter((salesperson) => salesperson && salesperson !== "N/A")
        )
      ).sort((left, right) => left.localeCompare(right)),
    [displayQuotesData]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(["accepted", "pending", "draft", ...displayQuotesData.map((quote) => quote.statusKey)])
      )
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [displayQuotesData]
  );

  const filteredQuotesData = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();

    return displayQuotesData.filter((quote) => {
      if (trimmedSearch && !quote.searchValue.includes(trimmedSearch)) {
        return false;
      }

      if (selectedSalesperson !== "all" && quote.salespersonKey !== selectedSalesperson) {
        return false;
      }

      if (!matchesStatusFilter(quote.statusKey, selectedStatusFilter)) {
        return false;
      }

      if (selectedDate) {
        const quoteDate = parseDateValue(quote.createdAtRaw);
        if (!quoteDate || quoteDate.toDateString() !== selectedDate.toDateString()) {
          return false;
        }
      }

      return true;
    });
  }, [displayQuotesData, searchTerm, selectedDate, selectedSalesperson, selectedStatusFilter]);

  const hasOverviewData = Boolean(
    Number(overviewData.total_quotes ?? 0) > 0 ||
      Number(overviewData.accepted_quotes ?? 0) > 0 ||
      Number(overviewData.pending_quotes ?? 0) > 0 ||
      Number(overviewData.draft_quotes ?? 0) > 0 ||
      Number(overviewData.rejected_quotes ?? 0) > 0 ||
      Number(overviewData.expired_quotes ?? 0) > 0 ||
      Number(overviewData.total_amount ?? 0) > 0 ||
      hasChartData
  );

  const showEmptyState = !loading && !hasOverviewData && displayQuotesData.length === 0;

  return (
    <div className="min-h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <TopbarComponent
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50"
            >
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <Link href={createHref}>
              <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                Create New Quote
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 lg:p-10">
        <div className="mb-8 flex items-start justify-between">
          <div className="max-w-1/2">
            <h1 className="mb-2 font-semibold lg:text-2xl">Quotes Module</h1>
            <p className="text-xs text-[#FFFFFFB2] lg:text-sm">
              Manage and track all your client quotations.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {hasOverviewData && (
          <div className="rounded-3xl border border-[#3D3D3D] bg-[#171717] p-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#E5D5B8]" />
              <span className="text-sm font-medium">Overview</span>
              <div className="ml-auto">
                <Select
                  value={activeChartRange}
                  onValueChange={(value) => setChartRange(value as QuoteChartRange)}
                >
                  <SelectTrigger className="h-9 w-[130px] rounded-full border-[#3D3D3D] bg-zinc-900 text-[10px] text-zinc-400 focus:ring-0 lg:text-xs">
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent className="border-[#3D3D3D] bg-[#111111] text-white">
                    <SelectItem value="all">Last 6 Months</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl bg-[#101010] p-4 md:grid-cols-2 lg:grid-cols-4">
              {displayStats.map((stat) => {
                const isSelected = selectedStat === stat.title;
                const bgColor = isSelected ? "bg-[#E5D5B8]" : "bg-[#161616]";
                const textColor = isSelected ? "text-[#101010]" : "text-white";
                const iconBg = isSelected ? "bg-[#171717]" : "bg-white/5";

                return (
                  <div
                    key={stat.title}
                    onClick={() => {
                      setSelectedStat(stat.title);
                      setSelectedStatusFilter(
                        stat.title === "Accepted Quotes"
                          ? "accepted"
                          : stat.title === "Pending Quotes"
                            ? "pending"
                            : stat.title === "Draft Quotes"
                              ? "draft"
                              : "all"
                      );
                    }}
                    className={`${bgColor} ${textColor} flex h-40 cursor-pointer flex-col justify-between rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium opacity-80">{stat.title}</span>
                      <div className={`${iconBg} rounded-full p-2 text-[#E8D1AB]`}>
                        {statsIcons[stat.title]}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-2xl font-bold lg:text-4xl">{stat.value}</div>
                      <span className={`text-xs ${isSelected ? "text-[#101010]/70" : "text-white/60"}`}>
                        Live data
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-10 h-[310px] w-full lg:h-[350px]">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-transparent">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5D5B8] border-t-transparent" />
                </div>
              )}

              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayChartData}>
                    <defs>
                      <linearGradient id="quotesChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E5D5B8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E5D5B8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff66", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#ffffff66", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1A1A",
                        borderRadius: "8px",
                        border: "1px solid #3D3D3D",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#BFA780" }}
                      formatter={(value: number | string) => [
                        Number(value ?? 0),
                        formatLabel(activeChartMetric),
                      ]}
                      cursor={{ stroke: "#E5D5B8", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeChartMetric}
                      stroke="#E5D5B8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#quotesChartGradient)"
                      activeDot={{ r: 6, fill: "#121212", stroke: "#E5D5B8", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#3D3D3D] bg-[#101010] text-sm text-white/45">
                  No chart data available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[32px] border border-[#3D3D3D] bg-[#161616]">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Loader2 size={18} className="animate-spin text-[#E5D5B8]" />
              Loading quotes...
            </div>
          </div>
        ) : showEmptyState ? (
          <QuotesEmptyState createHref={createHref} />
        ) : displayQuotesData.length > 0 ? (
          <>
            <div className="mb-6 mt-8 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by client name, quote number or project..."
                  className="w-full rounded-xl border border-[#FFFFFF33] bg-[#202020] py-3 pl-12 pr-4 text-sm transition-colors focus:border-[#E5D5B8]/50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger className="min-w-[170px] rounded-xl border-[#3D3D3D] bg-[#161616] text-sm text-white/70 focus:ring-[#E5D5B8]/40">
                    <SelectValue placeholder="All Salesperson" />
                  </SelectTrigger>
                  <SelectContent className="border-[#3D3D3D] bg-[#161616] text-white">
                    <SelectItem value="all">All Salesperson</SelectItem>
                    {salespersonOptions.map((salesperson) => (
                      <SelectItem key={salesperson} value={salesperson.toLowerCase()}>
                        {salesperson}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatusFilter}
                  onValueChange={(value) => {
                    setSelectedStatusFilter(value);
                    setSelectedStat(
                      value === "accepted"
                        ? "Accepted Quotes"
                        : value === "pending"
                          ? "Pending Quotes"
                          : value === "draft"
                            ? "Draft Quotes"
                            : value === "all"
                              ? "Total Quotes"
                              : ""
                    );
                  }}
                >
                  <SelectTrigger className="min-w-[170px] rounded-xl border-[#3D3D3D] bg-[#161616] text-sm text-white/70 focus:ring-[#E5D5B8]/40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-[#3D3D3D] bg-[#161616] text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-20 overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#161616] md:mb-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="hidden rounded-b-lg border-b border-[#3D3D3D] bg-[#101010] text-sm capitalize text-[#E8D1AB] md:table-row">
                    <th className="px-6 py-4 font-medium">Client Name</th>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Quote Status</th>
                    <th className="px-6 py-4 font-medium">Valid Until</th>
                    <th className="px-6 py-4 font-medium">Salesperson</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                  <tr className="border-b border-[#3D3D3D] bg-[#101010] text-sm text-[#E8D1AB] md:hidden">
                    <th className="px-4 py-4 font-medium">Client Name</th>
                    <th className="px-4 py-4 text-right font-medium">Quote Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredQuotesData.length > 0 ? (
                    filteredQuotesData.map((quote) => (
                      <tr
                        key={quote.id}
                        onClick={() => handleViewQuoteDetails(quote.id)}
                        className="group cursor-pointer border-b border-[#3D3D3D]/50 transition-colors hover:bg-white/5"
                      >
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quote.color} font-bold text-xs`}
                            >
                              {quote.initials}
                            </div>
                            <div>
                              <div className="font-medium">{quote.client}</div>
                              <div className="text-sm text-white/40 md:block">
                                {quote.location}
                              </div>
                              {quote.quoteNumber && (
                                <div className="text-xs text-white/25 md:block">
                                  {quote.quoteNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 text-white md:table-cell">
                          <p className="truncate">{quote.project}</p>
                        </td>
                        <td className="hidden px-6 py-4 font-medium md:table-cell">
                          {formatCurrency(quote.amountValue)}
                        </td>
                        <td className="px-4 py-4 text-right md:px-6 md:text-left">
                          <span
                            className={`rounded-full border px-3 py-1 text-[12px] font-medium md:text-base ${quote.statusColor}`}
                          >
                            {quote.status}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 text-white md:table-cell">
                          {quote.validUntil}
                        </td>
                        <td className="hidden px-6 py-4 text-white md:table-cell">
                          {quote.salesperson}
                        </td>
                        <td className="hidden px-6 py-4 text-right md:table-cell">
                          <QuoteActionMenu
                            open={openActionMenuId === quote.id}
                            onOpenChange={(open) => setOpenActionMenuId(open ? quote.id : null)}
                            onViewDetails={() => {
                              handleViewQuoteDetails(quote.id);
                            }}
                            onDuplicate={() => handleUnsupportedQuoteAction("Duplicate")}
                            onEdit={() => handleEditQuote(quote.id)}
                            onReject={() => {
                              void handleRejectQuote(quote.id, quote.statusKey);
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-sm text-white/45">
                        No quotes matched the current search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      {!loading && !showEmptyState && (
        <div className="fixed bottom-0 left-0 right-0 z-[40] flex gap-2 bg-[#0f0f0f] px-6 pb-6 lg:hidden">
          <Button
            onClick={() => router.push(createHref)}
            className="h-14 w-full rounded-md border border-white/20 bg-[#E5D5B8] text-sm font-semibold text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-transform hover:bg-[#d4c3a3] active:scale-[0.98]"
          >
            Create New Quote
          </Button>
        </div>
      )}

    </div>
  );
}
