"use client";

import React from "react";
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

  return format(parsed, "MMMM d, yyyy\nh:mm a");
};

const formatShortDateTime = (value: string | null | undefined) => {
  if (!value) return "Not available";

  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;

  return format(parsed, "MMM d, yyyy h:mm a");
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
      return "bg-[#C8F5D2] text-[#1F9D4A]";
    case "rejected":
      return "bg-[#FFC9C9] text-[#E44E4E]";
    default:
      return "bg-[#F5E2AF] text-[#C87913]";
  }
};

const getRequestTypeMeta = (requestType: string) => {
  if (normalizeRequestType(requestType) === "increase") {
    return {
      label: "Increase",
      amountClass: "text-[#22c55e]",
      Icon: ArrowUpRight,
      iconWrapClass: "bg-[#232323] text-[#22c55e]",
    };
  }

  return {
    label: "Decrease",
    amountClass: "text-[#ef4444]",
    Icon: ArrowDownRight,
    iconWrapClass: "bg-[#232323] text-[#ef4444]",
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
}: {
  request: QuoteChangeRequestItem;
  onView: () => void;
}) => {
  const quoteLabel = request.quote_number || `Beige - ${request.quote_id ?? "-"}`;
  const clientName = request.client_name || "Client not available";
  const requestTypeMeta = getRequestTypeMeta(request.request_type || "");
  const changeAmount =
    normalizeRequestType(request.request_type) === "increase"
      ? request.extra_amount
      : request.reduced_amount;
  const status = normalizeStatus(request.approval_status);

  return (
    <tr className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]">
      <td className="px-4 py-4">
        <div className="text-[15px] font-medium text-white">{quoteLabel}</div>
        <div className="mt-1 text-xs text-white/28">{`Activity #${request.activity_id ?? "-"}`}</div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] text-sm font-semibold ${getAvatarClass(
              clientName
            )}`}
          >
            {getInitials(clientName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-white">{clientName}</div>
            <div className="mt-1 truncate text-xs text-white/28">
              {`Booking ID #${request.booking_id ?? "1234"}`}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${requestTypeMeta.iconWrapClass}`}
          >
            <requestTypeMeta.Icon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className={`text-[16px] font-semibold ${requestTypeMeta.amountClass}`}>
              {formatCurrency(changeAmount)}
            </div>
            <div className="mt-1 text-[13px] text-white/38">{requestTypeMeta.label}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-[14px] leading-6 text-white/84">
        <div>{`Before: ${formatCurrency(request.previous_total)}`}</div>
        <div>{`After : ${formatCurrency(request.new_total)}`}</div>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClass(
            status
          )}`}
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="text-[14px] leading-5 text-white whitespace-pre-line">
          {formatDateTime(request.created_at)}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-transparent text-white/90 transition-colors hover:bg-white/[0.06]"
          aria-label="View details"
        >
          <Eye size={17} />
        </button>
      </td>
    </tr>
  );
};

const RequestDetailsModal = ({
  request,
  detailsHrefBase,
  onClose,
  onApprove,
  onReject,
  processingAction,
}: {
  request: QuoteChangeRequestItem;
  detailsHrefBase: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  processingAction: "approve" | "reject" | null;
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
  const requestTypeMeta = getRequestTypeMeta(request.request_type || "");

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-[1120px] overflow-y-auto rounded-[24px] border border-[rgba(255,255,255,0.18)] bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_120px_rgba(0,0,0,0.72)]">
        <div className="flex items-start justify-between gap-6 border-b border-white/20 px-6 py-6 lg:px-9 lg:py-7">
          <h2 className="text-[28px] font-semibold leading-none lg:text-[38px]">View Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#2D2725] text-white transition-colors hover:bg-[#39312E]"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6 lg:px-9 lg:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-[26px] font-semibold text-white">
                {request.quote_number || `BEIGE-${request.quote_id ?? "117"}`}
              </h3>
              <p className="mt-2 text-[14px] text-white/58 lg:text-[16px]">
                Review the quote change request details and approve or reject from this popup.
              </p>
            </div>
            <span
              className={`inline-flex h-fit min-w-[110px] items-center justify-center rounded-full px-5 py-2.5 text-[14px] font-medium capitalize ${getStatusBadgeClass(
                status
              )}`}
            >
              {status}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex items-center gap-4 rounded-[16px] border border-white/10 bg-[#1A1A1A] px-4 py-4">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[12px] bg-[#1B2840] text-[#58A6FF]">
                <CalendarDays size={24} />
              </div>
              <div className="min-w-0 text-[15px] leading-7 text-white/62 lg:text-[16px]">
                <span className="text-white/62">Requested At : </span>
                <span className="font-semibold text-white">{formatShortDateTime(request.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[16px] border border-white/10 bg-[#1A1A1A] px-4 py-4">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[12px] bg-[#17331E] text-[#1ED760]">
                <TrendingUp size={24} />
              </div>
              <div className="min-w-0 text-[15px] leading-7 text-white/62 lg:text-[16px]">
                <span className="text-white/62">Request Type : </span>
                <span className={requestTypeMeta.amountClass}>{requestTypeMeta.label}</span>
              </div>
            </div>
          </div>

          <section className="rounded-[16px] border border-white/10 bg-[#1A1A1A] p-4 lg:p-5">
            <h4 className="text-[21px] font-medium text-white">Request Info</h4>

            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Booking ID:",
                  value: `B - ${request.booking_id ?? "1234"}`,
                  icon: ClipboardList,
                  valueClass: "text-white",
                },
                {
                  label: "Client Name:",
                  value: request.client_name || "Ethan Carter",
                  icon: UserRound,
                  valueClass: "text-white",
                },
                {
                  label: "Requested By:",
                  value: request.requested_by?.name || "Admin",
                  icon: UsersRound,
                  valueClass: "text-white",
                },
                {
                  label: "Assigned Sales Rep:",
                  value: request.assigned_sales_rep?.name || "Beige Sales",
                  icon: UserRound,
                  valueClass: "text-[#E7D2AB]",
                },
              ].map(({ label, value, icon: Icon, valueClass }, index) => (
                <div
                  key={label}
                  className={`flex flex-col items-start ${
                    index < 3 ? "lg:border-r lg:border-white/12 lg:pr-6" : ""
                  }`}
                >
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-[#EFD6A9] text-black">
                    <Icon size={22} />
                  </div>
                  <div className="mt-3 text-[15px] text-white/58 lg:text-[16px]">{label}</div>
                  <div className={`mt-1 text-[17px] font-medium lg:text-[18px] ${valueClass}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[12px] border border-white/12 bg-[#0B0B0B]">
              <div className="border-b border-white/10 px-5 py-5 text-[21px] font-medium text-[#E7D2AB]">
                Total Amount
              </div>
              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_auto]">
                <div className="space-y-2 text-[16px] leading-8 text-white/62">
                  <div>Previous Total</div>
                  <div>Increase Amount</div>
                  <div>Reduced Amount</div>
                  <div>New Total</div>
                </div>
                <div className="space-y-2 text-right text-[16px] leading-8">
                  <div className="font-semibold text-white">{formatCurrency(previousTotal)}</div>
                  <div className="font-semibold text-[#1ED760]">{formatCurrency(extraAmount)}</div>
                  <div className="font-semibold text-white">{formatCurrency(reducedAmount)}</div>
                  <div className="font-semibold text-[#E7D2AB]">{formatCurrency(newTotal)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-white/10 bg-[#1A1A1A] p-4 lg:p-5">
            <h4 className="text-[21px] font-medium text-white">Change Summary</h4>

            <div className="mt-5 overflow-hidden rounded-[12px] border border-white/12 bg-[#0B0B0B]">
              <div className="border-b border-white/10 px-5 py-6 text-[18px] font-semibold leading-8 text-[#E7D2AB]">
                {changeSummary ||
                  `Quote total changed from ${formatCurrency(previousTotal)} to ${formatCurrency(
                    newTotal
                  )} (${requestType === "increase" ? "+" : "-"}${formatCurrency(
                    requestType === "increase" ? extraAmount : reducedAmount
                  )}) across 1 update.`}
              </div>
              <div className="space-y-4 px-5 py-5 text-[15px] leading-8 text-white/58 lg:text-[16px]">
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
                      className="mt-2 h-[54px] rounded-[14px] bg-[#EED4A7] px-5 text-[15px] font-semibold text-black hover:bg-[#EED4A7]/92"
                    >
                      View Full Quote Details
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-[58px] rounded-[14px] border-white/12 bg-[#111111] px-7 text-[16px] text-white hover:bg-[#181818]"
            >
              Close
            </Button>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                type="button"
                onClick={onReject}
                disabled={!canReview}
                isLoading={processingAction === "reject"}
                className="h-[58px] min-w-[180px] rounded-[14px] border border-[#A31D1D] bg-[#2A0E0E] px-7 text-[16px] text-[#FF7B7B] hover:bg-[#341111]"
              >
                <X size={20} />
                Reject
              </Button>
              <Button
                type="button"
                onClick={onApprove}
                disabled={!canReview}
                isLoading={processingAction === "approve"}
                className="h-[58px] min-w-[180px] rounded-[14px] bg-[#22C55E] px-7 text-[16px] font-semibold text-black hover:bg-[#28d165]"
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
  description = "Dynamic list from `sales/dashboard/quote-change-requests`. Click any request to open its details popup.",
  detailsHrefBase,
}: QuoteChangeRequestsWorkspaceProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  const [requests, setRequests] = React.useState<QuoteChangeRequestItem[]>([]);
  const [pagination, setPagination] = React.useState<QuotesListPagination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = React.useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = React.useState("all");
  const [selectedRequest, setSelectedRequest] = React.useState<QuoteChangeRequestItem | null>(null);
  const [processingAction, setProcessingAction] = React.useState<"approve" | "reject" | null>(null);

  const isDark = !mounted || theme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setPage(1);
  }, [approvalStatusFilter, requestTypeFilter, searchQuery]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const loadRequests = React.useCallback(async () => {
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

  React.useEffect(() => {
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

  React.useEffect(() => {
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

    const updatedRequest = response.data?.request ?? null;
    setSelectedRequest(updatedRequest);
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
        className={`min-h-screen px-4 pb-12 pt-6 lg:px-5 lg:pb-16 lg:pt-8 ${
          isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-[#101010]"
        }`}
      >
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-white">{title}</h1>
            <p className="mt-1 text-sm text-white/45">{description}</p>
          </div>

          <div className="mb-4 border-t border-dashed border-white/10" />

          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <div className="flex min-w-0 flex-1 items-center rounded-[14px] border border-white/10 bg-[#242424] px-4 py-3">
              <Search size={17} className="mr-3 text-white/35" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search quotes, booking, Client , rep"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={requestTypeFilter}
                  onChange={(event) => setRequestTypeFilter(event.target.value)}
                  className="h-[46px] appearance-none rounded-[14px] border border-white/10 bg-[#242424] pl-4 pr-10 text-sm text-white outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                />
              </div>

              <div className="relative">
                <select
                  value={approvalStatusFilter}
                  onChange={(event) => setApprovalStatusFilter(event.target.value)}
                  className="h-[46px] appearance-none rounded-[14px] border border-white/10 bg-[#242424] pl-4 pr-10 text-sm text-white outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#171717]">
            <div className="hidden lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-[#141414] text-left text-[11px] text-[#E7D2AB]">
                    {["Quote", "Client", "Changes", "Total Amount", "Status", "Requested At", "Action"].map(
                      (label) => (
                        <th key={label} className="px-4 py-4 font-medium">
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index} className="border-t border-white/[0.05]">
                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4">
                            <div className="h-5 animate-pulse rounded bg-white/8" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-white/58">
                        No change requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <TableRow
                        key={String(request.activity_id)}
                        request={request}
                        onView={() => setSelectedRequest(request)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-[16px] border border-white/10 bg-[#141414] p-4">
                    <div className="h-4 animate-pulse rounded bg-white/8" />
                    <div className="mt-3 h-4 animate-pulse rounded bg-white/8" />
                    <div className="mt-3 h-10 animate-pulse rounded bg-white/8" />
                  </div>
                ))
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-white/58">No change requests found</div>
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
                      className="w-full rounded-[16px] border border-white/10 bg-[#141414] p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-medium text-white">
                            {request.quote_number || `Beige - ${request.quote_id ?? "-"}`}
                          </div>
                          <div className="mt-1 text-xs text-white/28">{clientName}</div>
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
                            <div className={`text-[15px] font-semibold ${requestTypeMeta.amountClass}`}>
                              {formatCurrency(changeAmount)}
                            </div>
                            <div className="mt-0.5 text-xs text-white/28">
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
                <div className="text-sm text-white/58">{`Page ${safeCurrentPage} to ${totalPages}`}</div>

                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/48 transition-colors hover:bg-white/[0.04] disabled:opacity-35"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {paginationItems.map((item, index) =>
                    item === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm text-white/28">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm transition-colors ${
                          safeCurrentPage === item
                            ? "border border-[#5A4A32] bg-[#221B13] text-[#E7D2AB]"
                            : "text-white/58 hover:bg-white/[0.04]"
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
                    className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/48 transition-colors hover:bg-white/[0.04] disabled:opacity-35"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
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
        />
      ) : null}
    </div>
  );
}
