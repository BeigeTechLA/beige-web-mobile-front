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
import { ChevronDown, ChevronUp, SquarePen, ChevronLeft, ChevronRight } from "lucide-react";
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
  Copy,
  DollarSign,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  Search,
  XCircle,
} from "lucide-react";
import QuoteEditAccessModal, {
  type QuoteEditAccessModalProps,
} from "@/components/admin/quotes/QuoteEditAccessModal";
import { toast } from "react-hot-toast";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  persistQuoteEditorEditReason,
  persistQuoteEditorNavigationCache,
} from "@/lib/quoteEdit";
import { extractQuoteIdFromResponse, unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { usePermissions } from "@/lib/hooks/usePermissions";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
};

type QuotesDashboardPageProps = {
  createHref: string;
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
  EditAccessModalComponent?: React.ComponentType<QuoteEditAccessModalProps>;
};

const CustomDollarIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/images/socmed/Dollar.svg" width={size} height={size} alt="dollar" />
);

const CustomCrossIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/images/socmed/Cross.svg" width={size} height={size} alt="cross" />
);

const CustomClockIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/images/socmed/Clock.svg" width={size} height={size} alt="clock" />
);

const CustomCalendarIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/images/socmed/Calendar.svg" width={size} height={size} alt="calendar" />
);

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
  leadId: string; 
  bookingStatus: string;
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
  salespersonId: string;
  salespersonKey: string;
  createdAtRaw: string;
  shootDateValue: string;
  searchValue: string;
};

type SalesRepOption = {
  id: string;
  name: string;
  role?: string;
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

type PaginationItem = number | "...";

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
type QuoteChartMetricKey =
  | "total"
  | "accepted"
  | "pending"
  | "draft"
  | "rejected"
  | "expired";

type QuoteChartBucket = {
  key: string;
  name: string;
};

type QuoteActionMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails: () => void;
  onGoToLead?: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onPaymentTransaction: () => void;
  onReject: () => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;
  mobile?: boolean;
  disabled?: boolean;
  isDark?: boolean;
};

type QuoteActionMenuButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "default" | "danger";
  isDark?: boolean;
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
const QUOTES_PER_PAGE = 10;

const QuoteActionMenuButton = ({
  icon,
  label,
  onClick,
  variant = "default",
  isDark = true,
}: QuoteActionMenuButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[14px] font-medium transition-colors lg:text-[15px] ${variant === "danger"
      ? "text-[#F04438] hover:bg-[#F04438]/10"
      : isDark
        ? "text-white hover:bg-white/5"
        : "text-[#000000] hover:bg-[#000000]/5"
      }`}
  >
    <span
      className={
        variant === "danger"
          ? "text-[#F04438]"
          : isDark
            ? "text-white/70"
            : "text-[#000000]/60"
      }
    >
      {icon}
    </span>
    {label}
  </button>
);

const QuoteActionMenu = ({
  open,
  onOpenChange,
  onViewDetails,
  onGoToLead,
  onDuplicate,
  onEdit,
  onPaymentTransaction,
  onReject,
  allowEdit = true,
  allowDelete = true,
  allowDuplicate = true,
  mobile = false,
  disabled = false,
  isDark = true,
}: QuoteActionMenuProps) => {
  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={`flex transition-colors outline-none ${mobile
            ? isDark
              ? "items-end justify-end text-[#E8D1AB] w-full"
              : "items-end justify-end text-[#8E826A] w-full"
            : isDark
              ? "items-center justify-center text-[#E8D1AB] hover:text-white"
              : "items-center justify-center text-[#8E826A] hover:text-[#000000]"
            } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
          aria-label="Quote actions"
        >
          {mobile ? <MoreHorizontal size={18} /> : <MoreVertical size={18} />}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={15}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={`z-[999] w-[220px] rounded-[20px] border p-0 shadow-[0_28px_80px_rgba(0,0,0,0.55)] transition-colors ${isDark
          ? "border-white/10 bg-[#0A0A0A] text-white"
          : "border-[#000000]/10 bg-white text-[#000000]"
          }`}
      >
        <div className="flex flex-col p-1.5" onClick={(e) => e.stopPropagation()}>
          {onGoToLead ? (
            <QuoteActionMenuButton
              icon={<ChevronRight size={18} />}
              label="Go to Lead"
              onClick={handleAction(onGoToLead)}
              isDark={isDark}
            />
          ) : null}
          <QuoteActionMenuButton
            icon={<FileText size={18} />}
            label="View Details"
            onClick={handleAction(onViewDetails)}
            isDark={isDark}
          />
          {allowDuplicate && (
            <QuoteActionMenuButton
              icon={<Copy size={18} />}
              label="Duplicate"
              onClick={handleAction(onDuplicate)}
              isDark={isDark}
            />
          )}
          {allowEdit && (
            <QuoteActionMenuButton
              icon={<SquarePen size={18} />}
              label="Edit"
              onClick={handleAction(onEdit)}
              isDark={isDark}
            />
          )}
          <QuoteActionMenuButton
            icon={<DollarSign size={18} />}
            label="Record Payment"
            onClick={handleAction(onPaymentTransaction)}
            isDark={isDark}
          />

          {/* Divider line using theme opacity logic */}
          <div className={`my-1 h-[1px] w-full ${isDark ? "bg-white/10" : "bg-[#000000]/10"}`} />

          {allowDelete && (
            <QuoteActionMenuButton
              icon={<XCircle size={18} />}
              label="Reject Quote"
              onClick={handleAction(onReject)}
              variant="danger"
              isDark={isDark}
            />
          )}
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

const getQuoteShootDateValue = (quote: SalesQuoteListItem) => {
  const quoteRecord = quote as Record<string, unknown>;
  const convertedBookingDetails = getRecord(quoteRecord.converted_booking_details);
  const quoteBookingDays = Array.isArray(quoteRecord.booking_days) ? quoteRecord.booking_days : [];
  const convertedBookingDays = Array.isArray(convertedBookingDetails?.booking_days)
    ? convertedBookingDetails.booking_days
    : [];
  const firstBookingDay =
    getRecord(convertedBookingDays[0]) || getRecord(quoteBookingDays[0]);
  const dateValue = getText(
    firstBookingDay?.date,
    firstBookingDay?.event_date,
    quoteRecord.start_date,
    quoteRecord.shoot_date,
    convertedBookingDetails?.start_date
  );
  const startTimeValue = getText(
    firstBookingDay?.start_time,
    quoteRecord.start_time,
    convertedBookingDetails?.start_time
  );

  if (!dateValue) {
    return "";
  }

  if (!startTimeValue) {
    return dateValue;
  }

  const normalizedTime = startTimeValue.length === 5 ? `${startTimeValue}:00` : startTimeValue;
  return `${dateValue}T${normalizedTime}`;
};

const formatLabel = (value: string) =>
  value
    .replace(/_quotes$/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatGrowthValue = (value: number) => {
  const roundedValue = Number(value.toFixed(2));

  if (roundedValue > 0) {
    return `+${roundedValue}%`;
  }

  return `${roundedValue}%`;
};

const getChartMetricKey = (selectedStat: string): QuoteChartMetricKey => {
  switch (selectedStat) {
    case "Accepted Quotes":
      return "accepted";
    case "Pending Quotes":
      return "pending";
    case "Draft Quotes":
      return "draft";
    case "Rejected Quotes":
      return "rejected";
    case "Expired Quotes":
      return "expired";
    default:
      return "total";
  }
};

const getStatusFilterForStat = (selectedStat: string) => {
  switch (selectedStat) {
    case "Accepted Quotes":
      return "accepted";
    case "Pending Quotes":
      return "pending";
    case "Draft Quotes":
      return "draft";
    case "Rejected Quotes":
      return "rejected";
    case "Expired Quotes":
      return "expired";
    default:
      return "all";
  }
};

const getSelectedStatForStatus = (statusFilter: string) => {
  switch (statusFilter) {
    case "accepted":
    case "confirmed":
    case "paid":
      return "Accepted Quotes";
    case "pending":
    case "sent":
    case "viewed":
    case "partially_paid":
      return "Pending Quotes";
    case "draft":
      return "Draft Quotes";
    case "rejected":
    case "cancelled":
      return "Rejected Quotes";
    case "expired":
      return "Expired Quotes";
    default:
      return "Total Quotes";
  }
};

const normalizeStatusForChart = (
  statusKey: string
): keyof Omit<ChartPoint, "name"> | null => {
  switch (statusKey) {
    case "accepted":
    case "confirmed":
      return "accepted";
    case "pending":
    case "partially_paid":
      return "pending";
    case "sent":
    case "viewed":
      return null;
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
    const chartStatusKey = normalizeStatusForChart(getPaymentAwareStatusKey(quote));
    if (chartStatusKey) {
      point[chartStatusKey] += 1;
    }
  });

  return buckets.map((bucket) => chartMap.get(bucket.key) ?? createEmptyChartPoint(bucket.name));
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "partially paid":
    case "partial_paid":
    case "partially_paid":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
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

const toNumericOrNull = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getPaymentAwareStatusKey = (quote: SalesQuoteListItem) => {
  const quoteRecord = quote as Record<string, unknown>;
  const paymentStatus = getText(quoteRecord.payment_status).toLowerCase();
  const normalizedQuoteStatus = getText(quote.status, quote.quote_status, "draft").toLowerCase() || "draft";
  if (normalizedQuoteStatus === "rejected" || normalizedQuoteStatus === "cancelled") {
    return "rejected";
  }
  const paymentSummary = getRecord(quoteRecord.payment_summary);
  const summaryPaymentStatus = getText(paymentSummary?.payment_status).toLowerCase();
  const summaryPaidAmount = Math.max(
    0,
    (toNumericOrNull(paymentSummary?.paid_amount) ?? 0) +
    (toNumericOrNull(paymentSummary?.credit_used_amount) ?? 0),
  );
  const summaryDueAmount = Math.max(
    0,
    toNumericOrNull(paymentSummary?.due_amount) ??
    toNumericOrNull(paymentSummary?.pending_amount) ??
    0,
  );
  const manualPaymentSummary = getRecord(quoteRecord.manual_payment_summary);
  const manualPaidAmount = Math.max(
    0,
    toNumericOrNull(manualPaymentSummary?.paidAmount) ??
    toNumericOrNull(manualPaymentSummary?.paid_amount) ??
    0,
  );
  const manualPendingAmount = Math.max(
    0,
    toNumericOrNull(manualPaymentSummary?.pendingAmount) ??
    toNumericOrNull(manualPaymentSummary?.pending_amount) ??
    0,
  );
  const hasManualFullPayment =
    Boolean(manualPaymentSummary?.hasFullPayment) ||
    (manualPaidAmount > 0 && manualPendingAmount <= 0);
  const hasManualPartialPayment =
    Boolean(manualPaymentSummary?.isPartiallyPaid) ||
    (manualPaidAmount > 0 && manualPendingAmount > 0);
  const collectedAmount = Math.max(
    0,
    toNumericOrNull(quoteRecord.collected_amount) ??
    toNumericOrNull(quoteRecord.collectedAmount) ??
    toNumericOrNull(getRecord(quoteRecord.partial_payment)?.previously_paid_amount) ??
    manualPaidAmount ??
    0,
  );
  const outstandingAmount = Math.max(
    0,
    toNumericOrNull(quoteRecord.outstanding_amount) ??
    toNumericOrNull(quoteRecord.outstandingAmount) ??
    toNumericOrNull(getRecord(quoteRecord.additional_payment)?.outstanding_amount) ??
    toNumericOrNull(getRecord(quoteRecord.partial_payment)?.outstanding_amount) ??
    manualPendingAmount ??
    0,
  );
  const quoteTotal = Math.max(
    0,
    getOptionalNumber(quoteRecord.total, quoteRecord.total_amount, quoteRecord.amount) ?? 0,
  );

  if (paymentStatus === "paid" || paymentStatus === "completed" || paymentStatus === "success") {
    return "paid";
  }

  if (paymentStatus === "partially_paid" || paymentStatus === "partial_paid") {
    return "partially_paid";
  }

  if (
    summaryPaymentStatus === "paid" ||
    summaryPaymentStatus === "completed" ||
    summaryPaymentStatus === "success"
  ) {
    return summaryDueAmount > 0 ? "partially_paid" : "paid";
  }

  if (
    summaryPaymentStatus === "partially_paid" ||
    summaryPaymentStatus === "partial_paid" ||
    summaryPaymentStatus === "partially paid"
  ) {
    return "partially_paid";
  }

  if (summaryPaidAmount > 0 && summaryDueAmount > 0) {
    return "partially_paid";
  }

  if (paymentSummary && summaryDueAmount > 0) {
    return normalizedQuoteStatus;
  }

  if (hasManualFullPayment) {
    return "paid";
  }

  if (hasManualPartialPayment) {
    return "partially_paid";
  }

  if (collectedAmount > 0 && outstandingAmount > 0) {
    return "partially_paid";
  }

  if (quoteTotal > 0 && collectedAmount > 0 && collectedAmount < quoteTotal) {
    return "partially_paid";
  }

  if (collectedAmount > 0 && outstandingAmount <= 0) {
    return "paid";
  }

  return normalizedQuoteStatus;
};

const buildStatusSummary = (rows: SalesQuoteListItem[]) =>
  rows.reduce<Record<string, number>>((summary, quote) => {
    const statusKey = getPaymentAwareStatusKey(quote);

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
    return quoteStatusKey === "accepted" || quoteStatusKey === "confirmed" || quoteStatusKey === "paid";
  }

  if (filterValue === "pending") {
    return quoteStatusKey === "pending" || quoteStatusKey === "sent" || quoteStatusKey === "viewed" || quoteStatusKey === "partially_paid";
  }

  if (filterValue === "rejected") {
    return quoteStatusKey === "rejected" || quoteStatusKey === "cancelled";
  }

  return quoteStatusKey === filterValue;
};

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) {
    return [1];
  }

  const items: PaginationItem[] = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  items.push(1);

  if (left > 2) {
    items.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("...");
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
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
  const statusKey = getPaymentAwareStatusKey(quote);
  const quoteNumber = getText(quote.quote_number);
  const location = getText(
    quote.location,
    quote.client_address,
    quote.address,
    "Location not specified"
  );
  const amountValue = getNumber(quote.total_amount, quote.total, quote.amount);
  const leadId = quote.lead_id ? String(quote.lead_id) : "";
  const bookingStatus = quote.lead_id ? "Converted to Booking" : "Pending Booking";



  return {
    id: String(quote.sales_quote_id ?? quote.quote_id ?? quote.id ?? index),
    quoteNumber,
    leadId,
    bookingStatus,
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
    salespersonId: String(
      quote.assigned_sales_rep?.id ?? quote.created_by?.id ?? ""
    ),
    salespersonKey: salesperson.toLowerCase(),
    createdAtRaw: getText(quote.created_at, quote.updated_at),
    shootDateValue: getQuoteShootDateValue(quote),
    searchValue: [
      client,
      project,
      leadId,
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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function QuotesDashboardPage({
  createHref,
  TopbarComponent,
  EditAccessModalComponent = QuoteEditAccessModal,
}: QuotesDashboardPageProps) {
  const { isDark } = useResolvedTheme();
  const { canCreate, canEdit, canDelete } = usePermissions("quotes");
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
  // const [searchTerm, setSearchTerm] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [salespersonOptions, setSalespersonOptions] = useState<SalesRepOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null);
  const [duplicatingQuoteId, setDuplicatingQuoteId] = useState<string | null>(null);
  const [editAccessState, setEditAccessState] = useState<{
    quoteId: string;
    quoteNumber: string;
    clientName: string;
    targetView: string;
    shootDateValue?: string;
  } | null>(null);
  const [isEditAccessSubmitting, setIsEditAccessSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (selectedDate) {
      setChartRange("custom");
      return;
    }

    setChartRange((prev) => (prev === "custom" ? "all" : prev));
  }, [selectedDate]);

  useEffect(() => {
    const fetchSalesReps = async () => {
      const response = await salesApi.getSalesReps();
      if (!response?.success || !Array.isArray(response.data)) {
        setSalespersonOptions([]);
        return;
      }

      const uniqueSalespersonMap = new Map<string, SalesRepOption>();
      response.data.forEach((salesRep) => {
        const id = String(salesRep?.id ?? "").trim();
        const name = String(salesRep?.name ?? "").trim();
        if (!id || !name || uniqueSalespersonMap.has(id)) return;
        uniqueSalespersonMap.set(id, { id, name, role: String(salesRep?.role ?? "").trim() || undefined });
      });

      setSalespersonOptions(Array.from(uniqueSalespersonMap.values()));
    };

    void fetchSalesReps();
  }, []);

  useEffect(() => {
    const fetchQuotesData = async () => {
      const isFirstLoad = loading;
      if (!isFirstLoad) {
        setIsRefreshing(true);
      }

      try {
        const effectiveRange = selectedDate ? "custom" : chartRange;
        const effectiveDateOn = selectedDate
          ? formatDateFns(selectedDate, "yyyy-MM-dd")
          : undefined;
        const dashboardParams = {
          range: effectiveRange,
          ...(effectiveDateOn ? { date_on: effectiveDateOn } : {}),
          ...(selectedSalesperson !== "all"
            ? { assigned_sales_rep_id: selectedSalesperson }
            : {}),
        };

        const [dashboardResponse, listResponse] = await Promise.all([
          salesApi.getQuotesDashboard(dashboardParams),
          salesApi.getQuotesList({
            page: currentPage,
            limit: QUOTES_PER_PAGE,
            ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(selectedStatusFilter !== "all"
              ? { status: selectedStatusFilter === "partially_paid" ? "pending" : selectedStatusFilter }
              : {}),
            ...(selectedSalesperson !== "all"
              ? { assigned_sales_rep_id: selectedSalesperson }
              : {}),
            range: effectiveRange,
            ...(effectiveDateOn ? { date_on: effectiveDateOn } : {}),
          }),
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
        setIsRefreshing(false);
      }
    };

    fetchQuotesData();
  }, [
    chartRange,
    currentPage,
    debouncedSearch,
    selectedDate,
    selectedSalesperson,
    selectedStatusFilter,
  ]);

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

  const handleDuplicateQuote = async (quoteId: string) => {
    setOpenActionMenuId(null);

    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    if (duplicatingQuoteId === quoteId) {
      return;
    }

    setDuplicatingQuoteId(quoteId);

    try {
      const response = await salesApi.duplicateQuote(quoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to duplicate quote"
        );
      }

      const duplicatedQuote = unwrapSalesQuoteDetail(response?.data ?? null);
      const duplicatedQuoteId =
        extractQuoteIdFromResponse(response) ?? extractQuoteIdFromResponse(duplicatedQuote);

      if (!duplicatedQuoteId) {
        throw new Error("Duplicated quote id is missing.");
      }

      if (duplicatedQuote) {
        persistQuoteEditorNavigationCache(duplicatedQuoteId, duplicatedQuote);
      }

      toast.success("Quote duplicated successfully");

      const query = new URLSearchParams({
        quoteId: duplicatedQuoteId,
        view: "details",
        editMode: "full",
        duplicate: "1",
        returnTo: pathname,
      });

      window.setTimeout(() => {
        router.push(`${createHref}?${query.toString()}`);
      }, 450);
    } catch (error) {
      console.error("Failed to duplicate quote", error);
      toast.error(error instanceof Error ? error.message : "Failed to duplicate quote");
    } finally {
      setDuplicatingQuoteId(null);
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

  const handleGoToLead = (leadId: string) => {
    if (!leadId) {
      toast.error("Lead id is missing.");
      return;
    }

    setOpenActionMenuId(null);
    router.push(`/admin/sales-representative/${leadId}`);
  };

  const handlePaymentTransaction = (quoteId: string) => {
    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }
    setOpenActionMenuId(null);
    router.push(`${detailBaseHref}/${quoteId}?action=payment`);
  };

  const proceedToEditQuote = (quoteId: string, targetView: string = "details") => {
    if (!quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setOpenActionMenuId(null);
    const query = new URLSearchParams({
      quoteId: quoteId,
      view: targetView,
      editMode: "full",
      returnTo: pathname,
    });

    router.push(`${createHref}?${query.toString()}`);
  };

  const handleEditQuote = (quote: DisplayQuoteRow, targetView: string = "details") => {
    if (!quote.id) {
      toast.error("Quote id is missing.");
      return;
    }

    setOpenActionMenuId(null);
    setEditAccessState({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber || quote.id,
      clientName: quote.client,
      targetView,
      shootDateValue: quote.shootDateValue,
    });
  };

  const handleEditAccessProceed = async (payload: {
    reason: string;
    opsReviewConfirmed: boolean;
  }) => {
    if (!editAccessState?.quoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setIsEditAccessSubmitting(true);

    try {
      const { quoteId, targetView } = editAccessState;
      persistQuoteEditorEditReason(quoteId, payload.reason, payload.opsReviewConfirmed);
      setEditAccessState(null);
      proceedToEditQuote(quoteId, targetView);
    } catch (error) {
      console.error("Failed to confirm restricted quote edit access", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to confirm restricted quote edit access"
      );
    } finally {
      setIsEditAccessSubmitting(false);
    }
  };

  const renderBookingStatus = (bookingStatus: string, leadId?: string) => {
    if (bookingStatus === "Converted to Booking") {
      return (
        <span
          onClick={(e) => {
            if (leadId) {
              e.preventDefault();
              e.stopPropagation();
              handleGoToLead(leadId);
            }
          }}
          className="inline-flex whitespace-nowrap items-center justify-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 border-transparent bg-[#DCFCE7] text-[#27AE60] cursor-pointer hover:bg-[#cbf9da] transition-colors relative z-30"
        >
          {bookingStatus}
        </span>
      );
    }

    return (
      <span className="inline-flex whitespace-nowrap items-center justify-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 border-transparent bg-[#FFECCF] text-[#C26A00]">
        {bookingStatus}
      </span>
    );
  };
  const statsIcons: Record<string, React.ReactNode> = {
    "Total Quotes": <CustomDollarIcon size={20} />,
    "Rejected Quotes": <CustomCrossIcon size={20} />,
    "Pending Quotes": <CustomClockIcon size={20} />,
    "Draft Quotes": <CustomCalendarIcon size={20} />,
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
        (rowStatusSummary.pending ?? 0),
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
  const growthData = dashboardData?.growth;
  const growthCompareLabel = growthData?.compare_label ?? "vs previous period";

  const displayStats = [
    {
      title: "Total Quotes",
      value: String(overviewData.total_quotes ?? 0),
      growth: Number(growthData?.total_quotes ?? 0),
    },
    {
      title: "Rejected Quotes",
      value: String(overviewData.rejected_quotes ?? 0),
      growth: Number(growthData?.rejected_quotes ?? 0),
    },
    {
      title: "Pending Quotes",
      value: String(overviewData.pending_quotes ?? 0),
      growth: Number(growthData?.pending_quotes ?? 0),
    },
    {
      title: "Draft Quotes",
      value: String(overviewData.draft_quotes ?? 0),
      growth: Number(growthData?.draft_quotes ?? 0),
    },
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

  const dashboardChartData = useMemo<ChartPoint[]>(
    () =>
      (activeChartRange === "all" ? (dashboardData?.chart ?? []).slice(-6) : dashboardData?.chart ?? []).map((item, index) => ({
        ...createEmptyChartPoint(item.label || `Item ${index + 1}`),
        total: Number(item.quote_count ?? 0),
        accepted: Number(item.accepted_count ?? 0),
        pending: Number(item.pending_count ?? 0),
        draft: Number(item.draft_count ?? 0),
        rejected: Number(item.rejected_count ?? 0),
        expired: Number(item.expired_count ?? 0),
      })),
    [activeChartRange, dashboardData]
  );

  const displayChartData = useMemo(
    () =>
      dashboardChartData.some(
        (point) =>
          point.total > 0 ||
          point.accepted > 0 ||
          point.pending > 0 ||
          point.draft > 0 ||
          point.rejected > 0 ||
          point.expired > 0
      )
        ? dashboardChartData
        : derivedChartData,
    [dashboardChartData, derivedChartData]
  );

  const hasChartData = useMemo(
    () => displayChartData.some((point) => Number(point[activeChartMetric] ?? 0) > 0),
    [activeChartMetric, displayChartData]
  );

  const statusOptions = useMemo(
    () => [
      "accepted",
      "draft",
      "pending",
      "rejected",
      "sent",
      "paid",
      "partially_paid",
      "expired",
    ],
    []
  );

  const filteredQuotesData = useMemo(() => {
    if (selectedStatusFilter === "all") {
      return displayQuotesData;
    }

    return displayQuotesData.filter((quote) => {
      const statusKey = quote.statusKey;

      // Strict filtering as requested by the user
      if (selectedStatusFilter === "accepted") {
        return statusKey === "accepted";
      }

      if (selectedStatusFilter === "pending") {
        return statusKey === "pending";
      }

      if (selectedStatusFilter === "rejected") {
        return statusKey === "rejected";
      }

      return statusKey === selectedStatusFilter;
    });
  }, [displayQuotesData, selectedStatusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [chartRange, debouncedSearch, selectedDate, selectedSalesperson, selectedStatusFilter]);

  const totalFilteredQuotes = quotePagination?.total ?? filteredQuotesData.length;
  const totalListPages = Math.max(1, quotePagination?.totalPages ?? 1);
  const safeCurrentPage = quotePagination?.page ?? Math.min(currentPage, totalListPages);
  const listStartIndex =
    totalFilteredQuotes === 0
      ? 0
      : (safeCurrentPage - 1) * (quotePagination?.limit ?? QUOTES_PER_PAGE);
  const paginatedQuotesData = filteredQuotesData;
  const paginationItems = buildPaginationItems(safeCurrentPage, totalListPages);

  useEffect(() => {
    if (currentPage > totalListPages) {
      setCurrentPage(totalListPages);
    }
  }, [currentPage, totalListPages]);

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

  const hasActiveFilters =
    selectedSalesperson !== "all" ||
    selectedStatusFilter !== "all" ||
    Boolean(debouncedSearch.trim()) ||
    Boolean(selectedDate);

  // Show full empty-state only when there is genuinely no quotes data and
  // no active filter/search/date constraints. Otherwise keep filters visible
  // so user can change selection back.
  const showEmptyState =
    !loading &&
    !hasOverviewData &&
    displayQuotesData.length === 0 &&
    !hasActiveFilters;

  return (
    <div className={`min-h-screen overflow-x-clip ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <TopbarComponent
        pathname={pathname}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={
                isDark
                  ? "border-[#FFFFFF33] bg-[#202020] text-white hover:bg-[#202020]/50"
                  : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
              }
            >
              <Download size={18} className="mr-2" />
              Export
            </Button>
            {canCreate && (
              <Link href={createHref}>
                <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]">
                  Create New Quote
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="p-4 pb-8 lg:p-10">
        <div className="mb-8 flex items-start justify-between">
          <div className="max-w-1/2">
            <h1 className="mb-2 font-semibold lg:text-2xl">Quotes Module</h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-[#FFFFFFB2]" : "text-[#000000B2]"}`}>
              Manage and track all your client quotations.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {hasOverviewData && (
          <div className={`rounded-2xl lg:rounded-3xl p-5 lg:p-6 ${isDark ? "border border-[#3D3D3D] bg-[#171717]" : "border border-[#E5E5E5] bg-white"}`}>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-[#E5D5B8]" />
              <span className="text-sm font-medium">Overview</span>
              <div className="ml-auto">
                <Select
                  value={activeChartRange}
                  onValueChange={(value) => setChartRange(value as QuoteChartRange)}
                >
                  <SelectTrigger
                    className={`h-9 w-[130px] rounded-full text-[10px] focus:ring-0 lg:text-xs ${isDark
                      ? "border-[#3D3D3D] bg-zinc-900 text-zinc-400"
                      : "border-[#E3E3E3] bg-[#F9F9F9] text-[#444444]"
                      }`}
                  >
                    <SelectValue placeholder="Range" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDark
                        ? "border-[#3D3D3D] bg-[#111111] text-white"
                        : "border-[#E3E3E3] bg-white text-black"
                    }
                  >
                    <SelectItem value="all">Last 6 Months</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    {selectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={`mb-8 grid grid-cols-1 gap-4 rounded-xl p-4 md:grid-cols-2 lg:grid-cols-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
              {displayStats.map((stat) => {
                const isSelected = selectedStat === stat.title;
                const bgColor = isSelected
                  ? isDark
                    ? "bg-[#E5D5B8]"
                    : "bg-[#ECD7B4]"
                  : isDark
                    ? "bg-[#161616]"
                    : "bg-white";
                const textColor = isSelected ? "text-[#101010]" : isDark ? "text-white" : "text-black";
                const iconBg = isSelected ? "bg-[#171717]" : isDark ? "bg-white/5" : "bg-[#F4F5F7]";
                const growthToneClass =
                  stat.growth > 0
                    ? "text-[#16A34A]"
                    : stat.growth < 0
                      ? "text-[#F04438]"
                      : isSelected
                        ? "text-[#101010]/70"
                        : isDark
                          ? "text-white/60"
                          : "text-black/60";

                return (
                  <div
                    key={stat.title}
                    onClick={() => {
                      if (selectedStat === stat.title) {
                        setSelectedStat("Total Quotes");
                        setSelectedStatusFilter("all");
                      } else {
                        setSelectedStat(stat.title);
                        setSelectedStatusFilter(getStatusFilterForStat(stat.title));
                      }
                    }}
                    className={`${bgColor} ${textColor} flex gap-6 cursor-pointer flex-col justify-between rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium opacity-80">{stat.title}</span>
                      <div className={`${iconBg} rounded-full p-2 text-[#E8D1AB]`}>
                        {statsIcons[stat.title]}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-2xl font-bold lg:text-4xl">{stat.value}</div>
                      <div className="flex items-center gap-2 text-xs lg:text-sm">
                        <span className={`font-semibold ${growthToneClass}`}>
                          {formatGrowthValue(stat.growth)}
                        </span>
                        <span className={isSelected ? "text-[#101010]/70" : isDark ? "text-white/60" : "text-black/60"}>
                          {growthCompareLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-10 h-[300px] w-full lg:h-[350px]">
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
                    <CartesianGrid
                      vertical={false}
                      stroke={isDark ? "#27272a" : "#E3E3E3"}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#ffffff66" : "#32323266", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? "#ffffff66" : "#32323266", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                        borderRadius: "8px",
                        border: `1px solid ${isDark ? "#3D3D3D" : "#E3E3E3"}`,
                        color: isDark ? "#fff" : "#171717",
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
                      stroke={isDark ? "#E5D5B8" : "#00000066"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#quotesChartGradient)"
                      activeDot={{
                        r: 6,
                        fill: isDark ? "#121212" : "#FFFFFF",
                        stroke: "#E5D5B8",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className={`flex h-full items-center justify-center rounded-2xl border border-dashed text-sm ${isDark
                    ? "border-[#3D3D3D] bg-[#101010] text-white/45"
                    : "border-[#E3E3E3] bg-[#FAFAFA] text-black/45"
                    }`}
                >
                  No chart data available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div
            className={`mt-8 flex min-h-[320px] items-center justify-center rounded-[32px] ${isDark ? "border border-[#3D3D3D] bg-[#161616]" : "border border-[#E5E5E5] bg-white"
              }`}
          >
            <div className={`flex items-center gap-3 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              <Loader2 size={18} className="animate-spin text-[#E5D5B8]" />
              Loading quotes...
            </div>
          </div>
        ) : showEmptyState ? (
          <QuotesEmptyState createHref={createHref} />
        ) : (
          <div className="mb-20 lg:mb-2">
            {/* Filter Section */}
            <div className="mb-6 mt-8 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-zinc-500" : "text-black/70"}`}
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by client name, quote number..."
                  className={`w-full rounded-xl border py-3 pl-12 pr-4 text-sm transition-colors focus:outline-none ${isDark ? "border-[#FFFFFF33] bg-[#202020]" : "border-[#E3E3E3] bg-white"
                    }`}
                />
                {isRefreshing && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#E5D5B8]" size={18} />}
              </div>
              <div className="flex gap-4 flex-row">
                <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                  <SelectTrigger
                    className={`min-w-[170px] rounded-xl text-sm focus:ring-[#E5D5B8]/40 ${isDark
                      ? "border-[#3D3D3D] bg-[#161616] text-white/70"
                      : "border-[#E3E3E3] bg-white text-black/70"
                      }`}
                  >
                    <SelectValue placeholder="All Salesperson" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white"
                        : "border-[#E3E3E3] bg-white text-black"
                    }
                  >
                    <SelectItem value="all">All Salesperson</SelectItem>
                    {salespersonOptions.map((salesperson) => (
                      <SelectItem key={salesperson.id} value={salesperson.id}>
                        <div className="flex flex-col leading-tight">
                          <span>{salesperson.name}</span>
                          {salesperson.role ? (
                            <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                              {salesperson.role}
                            </span>
                          ) : null}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatusFilter}
                  onValueChange={(value) => {
                    setSelectedStatusFilter(value);
                    setSelectedStat(getSelectedStatForStatus(value));
                  }}
                >
                  <SelectTrigger
                    className={`min-w-[170px] rounded-xl text-sm focus:ring-[#E5D5B8]/40 ${isDark
                      ? "border-[#3D3D3D] bg-[#161616] text-white/70"
                      : "border-[#E3E3E3] bg-white text-black/70"
                      }`}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent
                    className={
                      isDark
                        ? "border-[#3D3D3D] bg-[#161616] text-white"
                        : "border-[#E3E3E3] bg-white text-black"
                    }
                  >
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

            {/* Table Section */}
             <div className={`mb-5 lg:mb-20 overflow-x-auto overflow-y-hidden rounded-2xl md:mb-0 [-webkit-overflow-scrolling:touch] ${isDark ? "border border-[#3D3D3D] bg-[#161616]" : "border border-[#E5E5E5] bg-white"}`}>
              <table className="min-w-full text-left border-collapse">
                <thead>
                  {/* Desktop Headers */}
                  <tr
                    className={`hidden rounded-b-lg border-b text-sm capitalize md:table-row ${isDark
                      ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]"
                      : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                      }`}
                  >
                    <th className="px-6 py-4 font-medium w-[25%]">Client Name</th>
                    <th className="px-6 py-4 font-medium w-[10%]">Project</th>
                    <th className="px-6 py-4 font-medium w-[10%]">Booking Status</th>
                    <th className="px-6 py-4 font-medium w-[10%]">Amount</th>
                    <th className="px-6 py-4 font-medium w-[17%]">Quote Status</th>
                    <th className="px-6 py-4 font-medium w-[16%]">Valid Until</th>
                    <th className="px-6 py-4 font-medium w-[13%]">Salesperson</th>
                    <th className="px-6 py-4 text-right font-medium w-[10%]">Action</th>
                  </tr>
                  {/* Mobile Headers */}
                  <tr className={`border-b text-sm md:hidden ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E5E5E5] bg-[#FFFCF6] text-black"}`}>
                    <th className="px-4 py-4 font-medium">Client Name</th>
                    <th className="px-4 py-4 text-right font-medium">Quote Status</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {paginatedQuotesData.length > 0 ? (
                    paginatedQuotesData.map((quote) => {
                      const isExpanded = expandedRowId === quote.id;

                      return (
                        <React.Fragment key={quote.id}>
                          {/* Main Row */}
                          <tr
                             onClick={() => {
                              if (window.innerWidth < 768) {
                                setExpandedRowId(isExpanded ? null : quote.id);
                              }
                            }}
                            className={`relative group cursor-pointer rounded-b-lg border-b transition-colors ${isDark ? "border-[#3D3D3D]/50 hover:bg-white/5" : "border-[#E3E3E3] hover:bg-black/5"} ${isExpanded ? (isDark ? "bg-[#202020] border-none" : "bg-[#F9F9F9] border-none") : ""}`}
                          >
                              <td className="px-4 py-4 md:px-6">
                             <Link
                                href={`${detailBaseHref}/${quote.id}`}
                                className="absolute inset-0 z-0 hidden md:block"
                                aria-label={`Open quote ${quote.quoteNumber}`}
                                prefetch={false}
                              />
                              <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                                {/* Mobile Chevron */}
                                <div
                                  className={`shrink-0 md:hidden border rounded-full w-6 h-6 flex items-center justify-center transition-colors  pointer-events-auto ${isExpanded
                                    ? isDark
                                      ? "border-[#E8D1AB] text-[#E8D1AB]"
                                      : "border-black text-black"
                                    : isDark
                                      ? "border-[#4B4B4B] text-[#777674]"
                                      : "border-[#E3E3E3] text-black"
                                    }`}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                <div className={`flex h-5 w-5 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-sm lg:rounded-xl ${quote.color} font-medium lg:font-semibold text-[10px] lg:text-sm`}>
                                  {quote.initials}
                                </div>
                                <div className="relative z-20">
                                  <div className="lg:font-medium">{quote.client}</div>
                                </div>
                              </div>
                            </td>

                            {/* Desktop Specific Cells */}
                            <td className="hidden px-6 py-4 md:table-cell max-w-0 w-full"><p className="truncate">{quote.project}</p></td>
                            <td className="hidden px-6 py-4 md:table-cell align-middle">
                                {renderBookingStatus(quote.bookingStatus, quote.leadId)}
                            </td>
                            <td className="hidden px-6 py-4 font-medium md:table-cell">{formatCurrency(quote.amountValue)}</td>

                            {/* Status Cell (Responsive alignment) */}
                            <td className="px-4 py-4 text-right md:px-6 md:text-left">
                              <span className={`inline-flex whitespace-nowrap items-center justify-center rounded-full border px-3 py-1 text-xs font-medium shrink-0 ${quote.statusColor}`}>
                                {quote.status}
                              </span>
                            </td>

                            <td className="hidden px-6 py-4 md:table-cell">{quote.validUntil}</td>
                            <td className="hidden px-6 py-4 md:table-cell">{quote.salesperson}</td>
                            <td className="relative z-20 hidden px-6 py-4 text-right md:table-cell">                              
                              <QuoteActionMenu
                                disabled={quote.statusKey === "rejected" || quote.statusKey === "cancelled"}
                                open={openActionMenuId === `desktop-${quote.id}`}
                                onOpenChange={(open) => setOpenActionMenuId(open ? `desktop-${quote.id}` : null)}
                                onViewDetails={() => {
                                  handleViewQuoteDetails(quote.id);
                                }}
                                onGoToLead={quote.leadId ? () => handleGoToLead(quote.leadId) : undefined}
                                onDuplicate={() => {
                                  void handleDuplicateQuote(quote.id);
                                }}
                                onEdit={() => handleEditQuote(quote)}
                                onPaymentTransaction={() => handlePaymentTransaction(quote.id)}
                                onReject={() => {
                                  void handleRejectQuote(quote.id, quote.statusKey);
                                }}
                                allowEdit={canEdit && quote.statusKey !== "expired"}
                                allowDelete={canDelete}
                                allowDuplicate={canCreate}
                                isDark={isDark}
                              />
                            </td>
                          </tr>

                          {/* Mobile Expanded Detail Row */}
                          {isExpanded && (
                            <tr className={`lg:hidden ${isDark ? "bg-[#202020]" : "bg-[#F9F9F9]"}`}>
                              <td colSpan={2} className="relative overflow-visible pl-14 pr-4 pb-4 pt-0">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div>
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Project</p>
                                      <p className={`font-medium truncate ${isDark ? "text-[#A1A1A1]" : "text-[#505050]"}`}>{quote.project}</p>
                                    </div>
                                    <div>
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Booking Status</p>
                                        {renderBookingStatus(quote.bookingStatus, quote.leadId)}
                                    </div>
                                    <div className="text-right">
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Amount</p>
                                      <p className={`font-medium ${isDark ? "text-[#A1A1A1]" : "text-[#505050]"}`}>{formatCurrency(quote.amountValue)}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                                    <div>
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Valid Until</p>
                                      <p className={`font-medium ${isDark ? "text-[#A1A1A1]" : "text-[#505050]"}`}>{quote.validUntil}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Salesperson</p>
                                      <p className={`font-medium ${isDark ? "text-[#A1A1A1]" : "text-[#505050]"}`}>{quote.salesperson}</p>
                                    </div>
                                    <div className="flex flex-col justify-end items-end relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                                      <p className={`mb-1 ${isDark ? "text-white" : "text-black"}`}>Action</p>
                                      <QuoteActionMenu
                                        mobile={true}
                                        disabled={quote.statusKey === "rejected" || quote.statusKey === "cancelled"}
                                        open={openActionMenuId === `mobile-${quote.id}`}
                                        onOpenChange={(open) => setOpenActionMenuId(open ? `mobile-${quote.id}` : null)}
                                        onViewDetails={() => {
                                          handleViewQuoteDetails(quote.id);
                                        }}
                                        onGoToLead={quote.leadId ? () => handleGoToLead(quote.leadId) : undefined}
                                        onDuplicate={() => {
                                          void handleDuplicateQuote(quote.id);
                                        }}
                                        onEdit={() => handleEditQuote(quote)}
                                        onPaymentTransaction={() => handlePaymentTransaction(quote.id)}
                                        onReject={() => {
                                          void handleRejectQuote(quote.id, quote.statusKey);
                                        }}
                                        allowEdit={canEdit && quote.statusKey !== "expired"}
                                allowDelete={canDelete}
                                allowDuplicate={canCreate}
                                        isDark={isDark}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center">
                        No results found.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* 1. Integrated Pagination Row */}
                {filteredQuotesData.length > 0 && totalListPages > 1 && (
                  <tfoot>
                    <tr className={isDark ? "bg-[#101010]" : "bg-[#fff]"}>
                      <td colSpan={8} className="px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className={`hidden lg:block text-sm ${isDark ? "text-white/45" : "text-[#999]"}`}>
                            Showing {listStartIndex + 1} to {Math.min(listStartIndex + QUOTES_PER_PAGE, totalFilteredQuotes)} of {totalFilteredQuotes}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={safeCurrentPage === 1}
                              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                                ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                                : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                                }`}
                            >
                              <ChevronLeft size={24} />
                            </button>
                            <div className="flex items-center gap-1">
                              {paginationItems.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => typeof item === 'number' && setCurrentPage(item)}
                                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all  ${safeCurrentPage === item ? ("bg-[#E5D5B8] text-black") : isDark
                                    ? "text-white/60 hover:bg-white/5"
                                    : "text-[#666] hover:bg-black/5"
                                    }`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalListPages, p + 1))}
                              disabled={safeCurrentPage === totalListPages}
                              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"}`}
                            >
                              <ChevronRight size={24} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {!loading && !showEmptyState && (
          <div className="mt-6 pb-[env(safe-area-inset-bottom)] lg:hidden">
            <Button
              onClick={() => router.push(createHref)}
              className="h-14 w-full rounded-md border border-white/20 bg-[#E5D5B8] text-sm font-semibold text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-transform hover:bg-[#d4c3a3] active:scale-[0.98]"
            >
              Create New Quote
            </Button>
          </div>
        )}
      </div>

      <EditAccessModalComponent
        open={Boolean(editAccessState)}
        onClose={() => {
          if (isEditAccessSubmitting) {
            return;
          }
          setEditAccessState(null);
        }}
        onProceed={(payload) => {
          void handleEditAccessProceed(payload);
        }}
        quoteNumber={editAccessState?.quoteNumber || "Pending"}
        clientName={editAccessState?.clientName || "Client"}
        shootDateValue={editAccessState?.shootDateValue}
        isSubmitting={isEditAccessSubmitting}
      />

    </div>
  );
}
