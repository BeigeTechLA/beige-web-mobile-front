"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Search,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
  ChevronUp,
  TrendingDown
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  salesApi,
  type QuoteChangeRequestItem,
  type QuoteChangeRequestsResponse,
  type QuotesListPagination,
} from "@/lib/api";

const REQUESTS_PER_PAGE = 10;

type SharedTopbarProps = {
  pathname: string;
  actions?: React.ReactNode;
  title?: string;
  breadcrumbOverrides?: Record<string, string>;
};

type QuoteChangeRequestsWorkspaceProps = {
  TopbarComponent: React.ComponentType<SharedTopbarProps>;
  title?: string;
  description?: string;
  detailsHrefBase: string;
};

type QuoteChangeRequestState = {
  rows: QuoteChangeRequestItem[];
  pagination: QuotesListPagination | null;
};

type PaginationItem = number | "...";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}

const extractRequestState = (
  data: QuoteChangeRequestsResponse["data"]
): QuoteChangeRequestState => {
  if (Array.isArray(data)) {
    return {
      rows: data,
      pagination: null,
    };
  }

  if (!data || typeof data !== "object") {
    return {
      rows: [],
      pagination: null,
    };
  }

  const rows = [
    data.items,
    data.rows,
    data.results,
    data.list,
    data.data,
  ].find(Array.isArray) as QuoteChangeRequestItem[] | undefined;

  return {
    rows: rows ?? [],
    pagination: data.pagination ?? null,
  };
};

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not available";

  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;

  return format(parsed, "d MMM, yyyy h:mm a");
};

const formatShortDateTime = (value: string | null | undefined) => {
  if (!value) return "Not available";

  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;

  return format(parsed, "d MMM, yyyy h:mm a");
};

const normalizeStatus = (value: string | null | undefined) =>
  String(value || "pending").trim().toLowerCase();

const normalizeRequestType = (value: string | null | undefined) =>
  String(value || "unknown").trim().toLowerCase();

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

const getStatusBadgeClass = (status: string) => {
  switch (normalizeStatus(status)) {
    case "approved":
      return "bg-[#D4FFE4] text-[#1F9D4A]";
    case "rejected":
      return "bg-[#FFC9C9] text-[#E44E4E]";
    default:
      return "bg-[#F5E2AF] text-[#C87913]";
  }
};

const getRequestTypeMeta = (requestType: string, isDark: boolean) => {
  if (normalizeRequestType(requestType) === "increase") {
    return {
      label: "Increase",
      amountClass: isDark ? "text-[#22c55e]" : "text-[#16a34a]",
      Icon: TrendingUp,
      iconWrapClass: isDark ? "bg-[#232323] text-[#22c55e]" : "bg-[#000000]/[0.05] text-[#16a34a]",
    };
  }

  return {
    label: "Decrease",
    amountClass: isDark ? "text-[#ef4444]" : "text-[#dc2626]", // Adjusted slightly for light mode readability
    Icon: TrendingDown,
    iconWrapClass: isDark ? "bg-[#232323] text-[#ef4444]" : "bg-[#000000]/[0.05] text-[#dc2626]",
  };
};

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

const AVATAR_SWATCHES = [
  "bg-[#F2DFB9] text-[#1D1D1D]",
  "bg-[#C5D9F7] text-[#1D1D1D]",
  "bg-[#E9E0D0] text-[#1D1D1D]",
  "bg-[#D7F0B8] text-[#1D1D1D]",
  "bg-[#F1C5E8] text-[#1D1D1D]",
  "bg-[#FFB680] text-[#1D1D1D]",
  "bg-[#A78BFA] text-white",
  "bg-[#EBC9F5] text-[#1D1D1D]",
  "bg-[#FFC1C1] text-[#1D1D1D]",
  "bg-[#F1E3CC] text-[#1D1D1D]",
];

const getAvatarClass = (value: string) => {
  const charCode = value.charCodeAt(0) || 0;
  return AVATAR_SWATCHES[charCode % AVATAR_SWATCHES.length];
};

const toNumber = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const TableRow = ({
  request,
  onView,
  isExpanded,
  onToggle,
  isDark = true,
}: {
  request: QuoteChangeRequestItem;
  onView: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}) => {
  const quoteLabel = request.quote_number || `Beige - ${request.quote_id ?? "-"}`;
  const clientName = request.client_name || "Client not available";
  const requestTypeMeta = getRequestTypeMeta(request.request_type || "", isDark);
  const changeAmount =
    normalizeRequestType(request.request_type) === "increase"
      ? request.extra_amount
      : request.reduced_amount;
  const status = normalizeStatus(request.approval_status);

  return (
    <React.Fragment>
      <tr
        onClick={() => {
          if (window.innerWidth < 1024) onToggle();
        }}
        className={`border-t transition-colors lg:cursor-default ${window.innerWidth < 1024 ? "cursor-pointer" : ""} ${isDark
          ? (isExpanded ? "bg-[#202020]" : "border-white/[0.05] hover:bg-white/[0.02]")
          : "border-[#E3E3E3] hover:bg-black/[0.02]"
          }`}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Mobile Chevron Indicator */}
            <div
              className={`lg:hidden border rounded-full w-6 h-6 flex items-center justify-center transition-colors shrink-0 ${isExpanded
                ? isDark
                  ? "border-[#E8D1AB] text-[#E8D1AB]"
                  : "border-black text-black"
                : isDark
                  ? "border-[#4B4B4B] text-[#777674]"
                  : "border-[#E3E3E3] text-black/40"
                }`}
            >
              {isExpanded ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} />
              )}
            </div>

            <div className="flex items-center gap-3">
              {window.innerWidth < 1024 ? (
                <div className="flex items-center gap-2">
                  <div className={`flex w-5 h-5 lg:h-10 lg:w-10 shrink-0 items-center justify-center overflow-hidden rounded-md lg:rounded-lg text-[9px] lg:text-sm font-semibold ${getAvatarClass(clientName)}`}>
                    {getInitials(clientName)}
                  </div>
                  <div>
                    <div className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                      {clientName}
                    </div>
                    <div className={`mt-0.5 text-xs lg:hidden ${isDark ? "text-white/40" : "text-black/40"}`}>
                      {`Booking ID #${request.booking_id ?? "1234"}`}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                    {quoteLabel}
                  </div>
                  <div className={`mt-1 text-sm hidden lg:block ${isDark ? "text-white/40" : "text-black/40"}`}>
                    {`Activity #${request.activity_id ?? "-"}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Desktop Columns */}
        <td className={`px-4 py-4 hidden lg:table-cell ${isDark ? "text-white" : "text-black"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex w-5 h-5 lg:h-10 lg:w-10 shrink-0 items-center justify-center overflow-hidden rounded-md lg:rounded-lg text-[9px] lg:text-sm font-semibold ${getAvatarClass(clientName)}`}>
              {getInitials(clientName)}
            </div>
            <div>
              <div className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {clientName}
              </div>
              <div className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                {`Booking ID #${request.booking_id ?? "1234"}`}
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 hidden lg:table-cell">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${requestTypeMeta.iconWrapClass}`}>
              <requestTypeMeta.Icon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div
                className={`text-base font-semibold ${requestTypeMeta.amountClass}`}
              >
                {formatCurrency(changeAmount)}
              </div>
              <div
                className={`text-xs ${isDark ? "text-white/38" : "text-black/45"}`}
              >
                {requestTypeMeta.label}
              </div>
            </div>
          </div>
        </td>

        <td className={`px-4 py-4 hidden lg:table-cell text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>
          <div>{`Before: ${formatCurrency(request.previous_total)}`}</div>
          <div>{`After : ${formatCurrency(request.new_total)}`}</div>
        </td>

        <td className="px-4 py-4 text-right lg:text-left">
          <span
            className={`inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-xs font-medium capitalize whitespace-nowrap ${getStatusBadgeClass(
              status
            )}`}
          >
            {status}
          </span>
        </td>

        <td className={`px-4 py-4 hidden lg:table-cell ${isDark ? "text-white/60" : "text-black/60"}`}>
          {formatDateTime(request.created_at)}
        </td>

        <td className="px-4 py-4 text-center hidden lg:table-cell">
          <button
            onClick={onView}
            className={`h-9 w-9 flex items-center justify-center rounded-full border transition-colors ${isDark
              ? "border-white/12 text-white hover:bg-white/[0.06]"
              : "border-black/10 text-black hover:bg-black/5"
              }`}
          >
            <Eye size={17} />
          </button>
        </td>
      </tr>

      {/* Mobile Expanded Details Section */}
      {isExpanded && (
        <tr className={`lg:hidden transition-colors ${isDark ? "bg-[#202020]" : "bg-black/[0.02]"}`}>
          <td
            colSpan={2}
            className={`px-4 py-6 border-t ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"
              }`}
          >
            <div className="pl-14 space-y-4">
              <div className="flex flex-col gap-y-4">
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-[#F5F5F5]" : "text-black/50"}`}>
                    Quote
                  </p>
                  <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>
                    {quoteLabel}
                  </p>
                </div>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-[#F5F5F5]" : "text-black/50"}`}>
                    Changes
                  </p>
                  <p className={`text-sm ${requestTypeMeta.amountClass}`}>
                    <TrendingUp size={16} className="inline mr-1" /> {formatCurrency(changeAmount)} / <span className={isDark ? "text-white/40" : "text-black/50"}>{requestTypeMeta.label}</span>
                  </p>
                </div>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-[#F5F5F5]" : "text-black/50"}`}>
                    Total Amount
                  </p>
                  <div className={`text-xs leading-relaxed ${isDark ? "text-[#A1A1A1]" : "text-black/70"}`}>
                    Before: {formatCurrency(request.previous_total)} / After: {formatCurrency(request.new_total)}
                  </div>
                </div>
                <div>
                  <p className={`text-xs mb-1 ${isDark ? "text-[#F5F5F5]" : "text-black/50"}`}>
                    Requested At
                  </p>
                  <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-black"}`}>
                    {formatDateTime(request.created_at)}
                  </p>
                </div>
              </div>
              <div>
                <p className={`text-xs mb-1 ${isDark ? "text-[#F5F5F5]" : "text-black/50"}`}>
                  Action
                </p>
                <button
                  onClick={onView}
                  className={`w-full rounded-xl font-medium text-sm transition-all text-left p-0 ${isDark
                    ? "text-[#E8D1AB] hover:bg-[#E8D1AB] hover:text-black"
                    : " text-black hover:bg-black hover:text-white"
                    }`}
                >
                  View Details
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

const RequestDetailsModal = ({
  request,
  detailsHrefBase,
  onClose,
  onApprove,
  onReject,
  processingAction,
  isDark = true,
}: {
  request: QuoteChangeRequestItem;
  detailsHrefBase: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  processingAction: "approve" | "reject" | null;
  isDark?: boolean;
}) => {
  const status = normalizeStatus(request.approval_status);
  const requestType = normalizeRequestType(request.request_type);
  const canReview = status === "pending";
  const extraAmount = toNumber(request.extra_amount);
  const reducedAmount = toNumber(request.reduced_amount);
  const previousTotal = toNumber(request.previous_total);
  const newTotal = toNumber(request.new_total);
  const changeSummary = request.overall_change_summary?.summary;
  const summaryLines = request.overall_change_summary?.lines ?? [];
  const requestTypeMeta = getRequestTypeMeta(request.request_type || "", isDark);

  return (
    <div className={`fixed inset-0 z-[160] flex items-center justify-center px-0 pt-7 pb-0 lg:p-4 backdrop-blur-md no-scrollbar ${isDark ? "bg-black/80" : "bg-white/20"}`}>
      <div
        className={`relative flex flex-col lg:block max-h-[95vh] lg:max-h-[90vh] w-full max-w-[1120px] overflow-hidden lg:overflow-y-auto rounded-t-3xl lg:rounded-3xl border transition-colors mx-5 ${isDark
          ? "border-white/20 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_120px_rgba(0,0,0,0.72)]"
          : "border-[#000000]/10 bg-white text-[#000000] shadow-[0_30px_120px_rgba(0,0,0,0.15)]"}`}
      >
        {/* Header: Fixed at the top */}
        <div className={`flex items-center justify-between gap-6 border-b px-4 py-7 lg:px-9 shrink-0 ${isDark ? " border-[CACACA]" : "border-[#000000]/10"}`}>
          <h2 className="lg:text-xl lg:text-[30px] font-bold leading-none">View Details</h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex w-11 h-11 lg:h-15 lg:w-15 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#2D2725] text-white hover:bg-[#39312E]" : "bg-[#000000]/5 text-[#000000] hover:bg-[#000000]/10"}`}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content: Scrollable on mobile (flex-1), static on desktop */}
        <div className="flex-1 overflow-y-auto lg:overflow-visible space-y-5 px-6 py-6 lg:px-9 lg:py-7">
          <div className="flex gap-5 flex-row items-center justify-between">
            <div>
              <h3 className={`text-lg lg:text-[26px] font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>
                {request.quote_number || `BEIGE-${request.quote_id ?? "117"}`}
              </h3>
              <p className={`lg:mt-2 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#000000]/60"}`}>
                Review the quote change request details and approve or reject from this popup.
              </p>
            </div>
            <span className={`inline-flex h-fit min-w-[110px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium capitalize ${getStatusBadgeClass(status)}`}>
              {status}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-[#e3e3e3] bg-[#F4F5F7]"}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isDark ? "bg-[#1B2840] text-[#58A6FF]" : "bg-[#58A6FF]/15 text-[#0052CC]"}`}>
                <CalendarDays size={24} />
              </div>
              <div className={`min-w-0 text-sm leading-7 lg:text-base ${isDark ? "text-white/60" : "text-[#000000]/60"}`}>
                <span>Requested At : </span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{formatShortDateTime(request.created_at)}</span>
              </div>
            </div>

            <div className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-[#e3e3e3] bg-[#F4F5F7]"}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isDark ? "bg-[#17331E] text-[#1ED760]" : "bg-emerald-500/10 text-emerald-600"}`}>
                <TrendingUp size={24} />
              </div>
              <div className={`min-w-0 text-sm leading-7 lg:text-base ${isDark ? "text-white/60" : "text-[#000000]/60"}`}>
                <span>Request Type : </span>
                <span className={requestTypeMeta.amountClass}>{requestTypeMeta.label}</span>
              </div>
            </div>
          </div>

          <section className={`rounded-2xl border p-4 lg:p-5 ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-[#000000]/10 bg-[#000000]/[0.01]"}`}>
            <h4 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-[#000000]"}`}>Request Info</h4>

            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Booking ID:",
                  value: `B - ${request.booking_id ?? "1234"}`,
                  icon: ClipboardList,
                  valueClass: isDark ? "text-white" : "text-[#000000]",
                },
                {
                  label: "Client Name:",
                  value: request.client_name || "Ethan Carter",
                  icon: UserRound,
                  valueClass: isDark ? "text-white" : "text-[#000000]",
                },
                {
                  label: "Requested By:",
                  value: request.requested_by?.name || "Admin",
                  icon: UsersRound,
                  valueClass: isDark ? "text-white" : "text-[#000000]",
                },
                {
                  label: "Assigned Sales Rep:",
                  value: request.assigned_sales_rep?.name || "Beige Sales",
                  icon: UserRound,
                  valueClass: isDark ? "text-[#E7D2AB]" : "text-[#02020285] font-semibold",
                },
              ].map(({ label, value, icon: Icon, valueClass }, index) => (
                <div
                  key={label}
                  className={`flex lg:flex-col items-center gap-2.5 lg:items-start ${index < 3 ? (isDark ? "lg:border-r lg:border-white/10 lg:pr-6" : "lg:border-r lg:border-[#000000]/10 lg:pr-6") : ""}`}
                >
                  <div className={`flex h-9 w-9 lg:h-11 lg:w-11 items-center justify-center rounded-lg ${isDark ? "bg-[#EFD6A9] text-black" : "bg-[#F2F3F5] text-[#8E8E8E]"}`}>
                    <Icon size={22} />
                  </div>
                  <div className={`lg:mt-3 text-sm lg:text-base ${isDark ? "text-white/60" : "text-[#000000]/50"}`}>{label}</div>
                  <div className={`lg:mt-1 text-sm lg:text-base font-medium lg:text-lg ${valueClass}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#0B0B0B]" : "border-[#000000]/10 bg-white"}`}>
              <div className={`border-b px-5 py-5 lg:text-xl font-medium ${isDark ? "border-white/10 text-[#E7D2AB]" : "border-[#000000]/10 text-[#02020285]"}`}>
                Total Amount
              </div>
              <div className="grid gap-4 px-5 py-5 grid-cols-[1fr_auto]">
                <div className={`space-y-2 text-sm lg:text-base leading-8 ${isDark ? "text-white/60" : "text-[#000000]/60"}`}>
                  <div>Previous Total</div>
                  <div>Increase Amount</div>
                  <div>Reduced Amount</div>
                  <div>New Total</div>
                </div>
                <div className="space-y-2 text-right text-sm lg:text-base leading-8">
                  <div className={`font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{formatCurrency(previousTotal)}</div>
                  <div className={`font-semibold ${isDark ? "text-[#1ED760]" : "text-emerald-600"}`}>{formatCurrency(extraAmount)}</div>
                  <div className={`font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{formatCurrency(reducedAmount)}</div>
                  <div className={`font-semibold ${isDark ? "text-[#E7D2AB]" : "text-[#02020285]"}`}>{formatCurrency(newTotal)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className={`rounded-2xl border p-4 lg:p-5 ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-[#000000]/10 bg-[#000000]/[0.01]"}`}>
            <h4 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-[#000000]"}`}>Change Summary</h4>
            <div className={`mt-5 overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#0B0B0B]" : "border-[#000000]/10 bg-white"}`}>
              <div className={`border-b p-4 lg:px-5 lg:py-6 text-sm lg:text-lg font-semibold leading-5 lg:leading-8 ${isDark ? "border-white/10 text-[#E7D2AB]" : "border-[#000000]/10 text-[#02020285]"}`}>
                {changeSummary ||
                  `Quote total changed from ${formatCurrency(previousTotal)} to ${formatCurrency(
                    newTotal
                  )} (${requestType === "increase" ? "+" : "-"}${formatCurrency(
                    requestType === "increase" ? extraAmount : reducedAmount
                  )}) across 1 update.`}
              </div>
              <div className={`space-y-4 p-4 lg:p-5 text-sm leading-5 lg:leading-7 lg:text-base ${isDark ? "text-white/70" : "text-[#000000]/70"}`}>
                {summaryLines.length > 0 ? (
                  summaryLines.map((line, index) => (
                    <p key={`${request.activity_id}-line-${index}`}>{line}</p>
                  ))
                ) : (
                  <p>This request contains quote updates that require review before approval.</p>
                )}

                {request.quote_id ? (
                  <Link href={`${detailsHrefBase}/${request.quote_id}`}>
                    <Button
                      type="button"
                      className={`mt-2 h-14 rounded-lg lg:rounded-2xl px-5 text-sm lg:text-base font-semibold w-full lg:w-fit bg-[#EED4A7] text-black hover:bg-[#EED4A7]/90`}
                    >
                      View Full Quote Details
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          {/* Desktop Footer Actions */}
          <div className="hidden lg:flex flex-col gap-4 pt-1 lg:flex-row lg:items-center lg:justify-between mt-10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`h-15 rounded-2xl px-7 text-base border transition-colors ${isDark ? "border-white/10 bg-[#111111] text-white hover:bg-[#181818]" : "border-[#000000]/10 bg-white text-[#000000] hover:bg-[#000000]/5"}`}
            >
              Close
            </Button>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                onClick={onReject}
                disabled={!canReview}
                isLoading={processingAction === "reject"}
                className={`h-15 min-w-[180px] rounded-2xl border px-7 text-base font-semibold transition-all ${isDark ? "border-[#A31D1D] bg-[#2A0E0E] text-[#FF7B7B] hover:bg-[#341111]" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                <X size={20} />
                Reject
              </Button>
              <Button
                type="button"
                onClick={onApprove}
                disabled={!canReview}
                isLoading={processingAction === "approve"}
                className={`h-15 min-w-[180px] rounded-2xl px-7 text-base font-semibold text-black transition-all ${isDark ? "bg-[#22C55E] hover:bg-[#28d165]" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
              >
                <Check size={20} />
                Accept
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Footer Actions: Mobile viewports only */}
        <div className={`relative lg:hidden shrink-0 p-6 pt-4 border-t ${isDark ? "bg-[#0B0B0B] border-white/5" : "bg-white border-[#000000]/5"}`}>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              onClick={onClose}
              className={`underline bg-transparent py-5 min-w-[166px] text-sm font-medium transition-all ${isDark ? "text-white hover:bg-[#181818]" : "text-[#000000] hover:bg-[#000000]/5"}`}
            >
              Close
            </Button>
            <div className="flex gap-4 sm:flex-row">
              <Button
                type="button"
                onClick={onReject}
                disabled={!canReview}
                isLoading={processingAction === "reject"}
                className={`h-14 w-full rounded-lg border text-sm font-semibold transition-all ${isDark ? "border-[#A31D1D] bg-[#2A0E0E] text-[#FF7B7B]" : "border-red-200 bg-red-50 text-red-600"}`}
              >
                <X size={20} />
                Reject
              </Button>
              <Button
                type="button"
                onClick={onApprove}
                disabled={!canReview}
                isLoading={processingAction === "approve"}
                className={`h-14 w-full rounded-lg text-sm font-semibold transition-all ${isDark ? "bg-[#22C55E] text-black" : "bg-emerald-500 text-white"}`}
              >
                <Check size={20} />
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuoteChangeRequestsWorkspace({
  TopbarComponent,
  title = "Quote Change Request",
  description = "Click any request to open its details popup.",
  detailsHrefBase,
}: QuoteChangeRequestsWorkspaceProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<QuoteChangeRequestItem[]>([]);
  const [pagination, setPagination] = useState<QuotesListPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<QuoteChangeRequestItem | null>(null);
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);

  const isDark = !mounted || theme === "dark";
  const searchQuery = useDebounce(searchInput.trim(), 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [approvalStatusFilter, requestTypeFilter, searchQuery]);

  const loadRequests = useCallback(async () => {
    setLoading(true);

    const response = await salesApi.getQuoteChangeRequests({
      page,
      limit: REQUESTS_PER_PAGE,
      search: searchQuery || undefined,
      approval_status: approvalStatusFilter,
      request_type: requestTypeFilter,
    });

    if (response?.success) {
      const state = extractRequestState(response.data);
      setRequests(state.rows);
      setPagination(state.pagination);
    } else {
      setRequests([]);
      setPagination(null);
      toast.error(response?.message || response?.error || "Failed to load change requests");
    }

    setLoading(false);
  }, [approvalStatusFilter, page, requestTypeFilter, searchQuery]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const totalItems = pagination?.total ?? requests.length;
  const totalPages = Math.max(
    Number(
      pagination?.total_pages ??
      pagination?.totalPages ??
      (totalItems > 0 ? Math.ceil(totalItems / REQUESTS_PER_PAGE) : 1)
    ),
    1
  );
  const safeCurrentPage = pagination?.page ?? Math.min(page, totalPages);
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleReview = async (decision: "approve" | "reject") => {
    if (!selectedRequest?.activity_id) {
      toast.error("Activity id is missing");
      return;
    }

    setProcessingAction(decision);

    const response =
      decision === "approve"
        ? await salesApi.approveQuoteChangeRequest(selectedRequest.activity_id)
        : await salesApi.rejectQuoteChangeRequest(selectedRequest.activity_id);

    setProcessingAction(null);

    if (!response?.success) {
      toast.error(response?.message || response?.error || `Failed to ${decision} request`);
      return;
    }
    
    setSelectedRequest(null);
    await loadRequests();

    toast.success(
      response.message ||
      (decision === "approve"
        ? "Quote change request approved successfully"
        : "Quote change request rejected successfully")
    );
  };

  return (
    <div className="relative overflow-hidden">
      <TopbarComponent pathname={pathname} />
      <div
        className={`min-h-screen px-4 pb-12 pt-6 lg:px-10 lg:pt-10 lg:pb-16 lg:pt-8 ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-[#101010]"}`}
      >
        <div className="w-full">
          <div className="mb-6">
            <h1 className={`lg:text-[22px] font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>{title}</h1>
            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/70" : "text-[#101010]/70"}`}>{description}</p>
          </div>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            {/* Search Bar Container */}
            <div
              className={`flex min-w-0 flex-1 items-center rounded-lg lg:rounded-2xl border transition-colors px-4 py-3 ${isDark
                ? "border-white/10 bg-[#242424]"
                : "border-[#000000]/10 bg-white"
                }`}
            >
              <Search size={17} className={`mr-3 ${isDark ? "text-white/35" : "text-[#000000]/40"}`} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search quotes, booking, Client, rep"
                className={`w-full bg-transparent text-sm outline-none transition-colors ${isDark
                  ? "text-white placeholder:text-white/40"
                  : "text-[#000000] placeholder:text-[#000000]/40"
                  }`}
              />
            </div>

            <div className="flex w-full lg:w-auto gap-3">
              {/* Request Type Selector */}
              <div className="relative flex-1 lg:w-auto">
                <select
                  value={requestTypeFilter}
                  onChange={(event) => setRequestTypeFilter(event.target.value)}
                  className={`h-11 appearance-none rounded-lg lg:rounded-2xl border pl-4 pr-10 text-sm outline-none w-full lg:w-auto transition-colors ${isDark
                    ? "border-white/10 bg-[#242424] text-white [&>option]:bg-[#242424] [&>option]:text-white"
                    : "border-[#000000]/10 bg-white text-[#000000] [&>option]:bg-white [&>option]:text-[#000000]"
                    }`}
                >
                  <option value="all">All Types</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
                <ChevronDown
                  size={16}
                  className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/60" : "text-[#000000]/50"}`}
                />
              </div>

              {/* Approval Status Selector */}
              <div className="relative flex-1 lg:w-auto">
                <select
                  value={approvalStatusFilter}
                  onChange={(event) => setApprovalStatusFilter(event.target.value)}
                  className={`h-11 appearance-none rounded-lg lg:rounded-2xl border pl-4 pr-10 text-sm outline-none w-full lg:w-auto transition-colors ${isDark
                    ? "border-white/10 bg-[#242424] text-white [&>option]:bg-[#242424] [&>option]:text-white"
                    : "border-[#000000]/10 bg-white text-[#000000] [&>option]:bg-white [&>option]:text-[#000000]"
                    }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown
                  size={16}
                  className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-white/60" : "text-[#000000]/50"
                    }`}
                />
              </div>
            </div>
          </div>

          <div className={`overflow-hidden rounded-lg lg:rounded-2xl border transition-colors ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                {/* Desktop Headers */}
                <tr
                  className={`hidden lg:table-row border-b text-left text-sm transition-colors ${isDark
                    ? "border-white/[0.04] bg-[#101010] text-[#E7D2AB]"
                    : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                >
                  {[
                    "Quote",
                    "Client",
                    "Changes",
                    "Total Amount",
                    "Status",
                    "Requested At",
                    "Action",
                  ].map((label) => (
                    <th key={label} className="px-4 py-4 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
                {/* Mobile Headers */}
                <tr
                  className={`lg:hidden border-b text-sm transition-colors ${isDark
                    ? "border-white/[0.04] bg-[#101010] text-[#E7D2AB]"
                    : "border-[#E5E5E5] bg-[#FFFCF6] text-black"
                    }`}
                >
                  <th className="px-4 py-4 font-medium">Client</th>
                  <th className="px-4 py-4 text-right font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr
                      key={index}
                      className={`border-t ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"
                        }`}
                    >
                      <td colSpan={7} className="px-4 py-4">
                        <div
                          className={`h-5 animate-pulse rounded ${isDark ? "bg-white/5" : "bg-black/5"
                            }`}
                        />
                      </td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className={`px-6 py-20 text-center ${isDark ? "text-white/50" : "text-black/45"
                        }`}
                    >
                      No change requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <TableRow
                      key={String(request.activity_id)}
                      request={request}
                      isDark={isDark}
                      isExpanded={expandedRowId === request.activity_id}
                      onToggle={() => {
                        const currentId = request.activity_id ?? null; // Fallback to null if undefined
                        setExpandedRowId(expandedRowId === currentId ? null : currentId);
                      }}
                      onView={() => setSelectedRequest(request)}
                    />
                  ))
                )}
              </tbody>

              {/* Integrated Pagination Footer */}
              {!loading && requests.length > 0 && (
                <tfoot>
                  <tr
                    className={`border-t transition-colors ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}
                  >
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex gap-4 items-center justify-center lg:justify-between">
                        <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#999]"}`}>
                          {`Page ${safeCurrentPage} to ${totalPages}`}
                        </div>
                        <div className="flex items-center gap-2 self-auto">
                          <button
                            type="button"
                            onClick={() =>
                              setPage((currentValue) => Math.max(1, currentValue - 1))
                            }
                            disabled={safeCurrentPage === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30  ${isDark
                              ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                              : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                              }`}
                          >
                            <ChevronLeft size={24} />
                          </button>

                          {paginationItems.map((item, index) =>
                            item === "..." ? (
                              <span
                                key={`ellipsis-${index}`}
                                className={`px-2 text-sm ${isDark ? "text-white/60" : "text-[#666]"}`}
                              >
                                ...
                              </span>
                            ) : (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${safeCurrentPage === item
                                  ? "bg-[#E5D5B8] text-black"
                                  : isDark
                                    ? "text-white/60 hover:bg-white/5"
                                    : "text-[#666] hover:bg-black/5"
                                  }`}
                              >
                                {item}
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setPage((currentValue) =>
                                Math.min(totalPages, currentValue + 1)
                              )
                            }
                            disabled={safeCurrentPage === totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark
                              ? "bg-[#111] text-white/60 border-[#333] hover:bg-white/10 hover:text-white"
                              : "bg-white text-[#333] border-[#E5E5E5] hover:bg-black/5"
                              }`}
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

          {/* <div className="space-y-3 p-4 lg:hidden">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
                    <div className="h-4 animate-pulse rounded bg-white/8" />
                    <div className="mt-3 h-4 animate-pulse rounded bg-white/8" />
                    <div className="mt-3 h-10 animate-pulse rounded bg-white/8" />
                  </div>
                ))
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-white/70">No change requests found</div>
              ) : (
                requests.map((request) => {
                  const clientName = request.client_name || "Client not available";
                  const requestTypeMeta = getRequestTypeMeta(request.request_type || "");
                  const status = normalizeStatus(request.approval_status);
                  const changeAmount =
                    normalizeRequestType(request.request_type) === "increase"
                      ? request.extra_amount
                      : request.reduced_amount;

                  return (
                    <button
                      key={String(request.activity_id)}
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="w-full rounded-2xl border border-white/10 bg-[#141414] p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-medium text-white">
                            {request.quote_number || `Beige - ${request.quote_id ?? "-"}`}
                          </div>
                          <div className="mt-1 text-xs text-white/40">{clientName}</div>
                        </div>
                        <span
                          className={`inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${requestTypeMeta.iconWrapClass}`}
                          >
                            <requestTypeMeta.Icon size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className={`text-base font-semibold ${requestTypeMeta.amountClass}`}>
                              {formatCurrency(changeAmount)}
                            </div>
                            <div className="mt-0.5 text-xs text-white/40">
                              {requestTypeMeta.label}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs leading-5 text-white/48">
                          {formatDateTime(request.created_at)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {!loading && requests.length > 0 ? (
              <div className="flex flex-col gap-4 border-t border-white/[0.05] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-white/70">{`Page ${safeCurrentPage} to ${totalPages}`}</div>

                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/48 transition-colors hover:bg-white/[0.04] disabled:opacity-35"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {paginationItems.map((item, index) =>
                    item === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm text-white/40">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition-colors ${safeCurrentPage === item
                          ? "border border-[#5A4A32] bg-[#221B13] text-[#E7D2AB]"
                          : "text-white/70 hover:bg-white/[0.04]"
                          }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setPage((currentValue) => Math.min(totalPages, currentValue + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/48 transition-colors hover:bg-white/[0.04] disabled:opacity-35"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null} */}
        </div>
      </div>

      {selectedRequest ? (
        <RequestDetailsModal
          request={selectedRequest}
          detailsHrefBase={detailsHrefBase}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => void handleReview("approve")}
          onReject={() => void handleReview("reject")}
          processingAction={processingAction}
          isDark={isDark}
        />
      ) : null}
    </div>
  );
}
