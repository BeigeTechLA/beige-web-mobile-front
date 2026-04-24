"use client";

import React from "react";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  RefreshCcw,
  Search,
  User2,
  XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  return format(parsed, "MMM d, yyyy h:mm a");
};

const normalizeStatus = (value: string | null | undefined) =>
  String(value || "pending").trim().toLowerCase();

const normalizeRequestType = (value: string | null | undefined) =>
  String(value || "unknown").trim().toLowerCase();

const getStatusBadgeClass = (isDark: boolean, value: string | null | undefined) => {
  switch (normalizeStatus(value)) {
    case "approved":
      return isDark
        ? "border-[#28533B] bg-[#102317] text-[#88E0AD]"
        : "border-[#D5F0DF] bg-[#F2FCF5] text-[#15803D]";
    case "rejected":
      return isDark
        ? "border-[#5B2A2A] bg-[#261313] text-[#FFB4B4]"
        : "border-[#F3D4D4] bg-[#FFF1F1] text-[#C62828]";
    default:
      return isDark
        ? "border-[#614C28] bg-[#20170D] text-[#E8D1AB]"
        : "border-[#E9DEC9] bg-[#FBF6EC] text-[#8A6A30]";
  }
};

const getTypeBadgeClass = (isDark: boolean, value: string | null | undefined) => {
  switch (normalizeRequestType(value)) {
    case "increase":
      return isDark
        ? "border-[#1E4568] bg-[#0F1E2B] text-[#8CC8FF]"
        : "border-[#D4E6FA] bg-[#F4F9FF] text-[#1D4ED8]";
    case "decrease":
      return isDark
        ? "border-[#694221] bg-[#24170E] text-[#FFC088]"
        : "border-[#F4DEC8] bg-[#FFF7ED] text-[#C2410C]";
    default:
      return isDark
        ? "border-white/10 bg-white/5 text-white/70"
        : "border-black/10 bg-black/[0.03] text-black/60";
  }
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
  const [approvalStatusFilter, setApprovalStatusFilter] = React.useState("pending");
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
  const listStartIndex =
    totalItems === 0
      ? 0
      : (safeCurrentPage - 1) * (pagination?.limit ?? REQUESTS_PER_PAGE);
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

  const renderDelta = (request: QuoteChangeRequestItem) => {
    const requestType = normalizeRequestType(request.request_type);
    const isIncrease = requestType === "increase";
    const amount = isIncrease ? request.extra_amount : request.reduced_amount;

    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
            isIncrease
              ? isDark
                ? "bg-[#102235] text-[#8CC8FF]"
                : "bg-[#EFF6FF] text-[#1D4ED8]"
              : isDark
                ? "bg-[#2A1A10] text-[#FFC088]"
                : "bg-[#FFF7ED] text-[#C2410C]"
          }`}
        >
          {isIncrease ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        </span>
        <div>
          <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
            {formatCurrency(amount)}
          </div>
          <div className={`text-xs capitalize ${isDark ? "text-white/45" : "text-black/45"}`}>
            {requestType}
          </div>
        </div>
      </div>
    );
  };

  const selectedStatus = normalizeStatus(selectedRequest?.approval_status);
  const canReviewSelected = selectedStatus === "pending";
  const selectedSummaryLines = selectedRequest?.overall_change_summary?.lines ?? [];

  return (
    <div className="relative overflow-hidden">
      <TopbarComponent
        pathname={pathname}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadRequests()}
            className={
              isDark
                ? "border-white/10 bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                : "border-[#E4E4E4] bg-white text-[#101010] hover:bg-[#F5F5F5]"
            }
          >
            <RefreshCcw size={16} />
            Refresh
          </Button>
        }
      />

      <div
        className={`min-h-screen px-4 pb-16 pt-6 lg:px-10 lg:pb-20 lg:pt-9 ${
          isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-[#101010]"
        }`}
      >
        <div className="mb-6 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold lg:text-2xl">{title}</h1>
            <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-black/50"}`}>
              {description}
            </p>
          </div>

          <div
            className={`grid gap-3 rounded-2xl border p-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px] ${
              isDark ? "border-white/10 bg-[#171717]" : "border-[#E4E4E4] bg-white"
            }`}
          >
            <div
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 ${
                isDark ? "border-white/10 bg-[#111111]" : "border-[#E4E4E4] bg-[#FAFAFA]"
              }`}
            >
              <Search size={16} className={isDark ? "text-white/35" : "text-black/35"} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search quote, booking, client, rep"
                className={`w-full bg-transparent text-sm outline-none ${
                  isDark ? "placeholder:text-white/25" : "placeholder:text-black/25"
                }`}
              />
            </div>

            <select
              value={approvalStatusFilter}
              onChange={(event) => setApprovalStatusFilter(event.target.value)}
              className={`rounded-2xl border px-4 py-3 text-sm outline-none ${
                isDark ? "border-white/10 bg-[#111111] text-white" : "border-[#E4E4E4] bg-[#FAFAFA] text-[#101010]"
              }`}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Statuses</option>
            </select>

            <select
              value={requestTypeFilter}
              onChange={(event) => setRequestTypeFilter(event.target.value)}
              className={`rounded-2xl border px-4 py-3 text-sm outline-none ${
                isDark ? "border-white/10 bg-[#111111] text-white" : "border-[#E4E4E4] bg-[#FAFAFA] text-[#101010]"
              }`}
            >
              <option value="all">All Types</option>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-3xl border ${
            isDark ? "border-white/10 bg-[#171717]" : "border-[#E7E7E7] bg-white shadow-sm"
          }`}
        >
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full">
              <thead>
                <tr className={isDark ? "bg-[#111111]" : "bg-[#FBFBFB]"}>
                  {["Quote", "Client", "Change", "Totals", "Status", "Requested At", "View"].map((label) => (
                    <th
                      key={label}
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] ${
                        isDark ? "text-white/35" : "text-black/35"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className={isDark ? "border-t border-white/5" : "border-t border-black/5"}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-5">
                          <div className={`h-4 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <FileText size={32} className={isDark ? "text-[#E8D1AB]" : "text-[#8A6A30]"} />
                        <p className="mt-4 text-lg font-semibold">No change requests found</p>
                        <p className={`mt-2 text-sm ${isDark ? "text-white/50" : "text-black/45"}`}>
                          When a quote update requires review, it will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr
                      key={String(request.activity_id)}
                      onClick={() => setSelectedRequest(request)}
                      className={`cursor-pointer transition-colors ${
                        isDark
                          ? "border-t border-white/5 hover:bg-white/[0.03]"
                          : "border-t border-black/5 hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold">
                          {request.quote_number || `Quote #${request.quote_id ?? "-"}`}
                        </div>
                        <div className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Activity #{request.activity_id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-medium">{request.client_name || "Client not available"}</div>
                        <div className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>
                          Booking #{request.booking_id ?? "-"}
                        </div>
                      </td>
                      <td className="px-6 py-5">{renderDelta(request)}</td>
                      <td className="px-6 py-5">
                        <div className="text-sm">
                          <div>Before: {formatCurrency(request.previous_total)}</div>
                          <div>After: {formatCurrency(request.new_total)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(
                            isDark,
                            request.approval_status
                          )}`}
                        >
                          {normalizeStatus(request.approval_status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm">{formatDateTime(request.created_at)}</td>
                      <td className="px-6 py-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRequest(request);
                          }}
                          className={
                            isDark
                              ? "border-white/10 bg-[#111111] text-white hover:bg-[#1D1D1D] hover:text-white"
                              : "border-[#E4E4E4] bg-white text-[#101010] hover:bg-[#F4F4F4]"
                          }
                        >
                          <Eye size={16} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 lg:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E4E4E4] bg-white"}`}
                >
                  <div className={`mb-3 h-4 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                  <div className={`mb-3 h-4 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                  <div className={`h-10 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={30} className={`mx-auto ${isDark ? "text-[#E8D1AB]" : "text-[#8A6A30]"}`} />
                <p className="mt-4 text-lg font-semibold">No change requests found</p>
              </div>
            ) : (
              requests.map((request) => (
                <button
                  key={String(request.activity_id)}
                  type="button"
                  onClick={() => setSelectedRequest(request)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    isDark ? "border-white/10 bg-[#171717]" : "border-[#E4E4E4] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">
                        {request.quote_number || `Quote #${request.quote_id ?? "-"}`}
                      </div>
                      <div className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-black/50"}`}>
                        {request.client_name || "Client not available"}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(
                        isDark,
                        request.approval_status
                      )}`}
                    >
                      {normalizeStatus(request.approval_status)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    {renderDelta(request)}
                    <div className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                      {formatDateTime(request.created_at)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {!loading && requests.length > 0 && totalPages > 1 ? (
          <div
            className={`mt-5 flex flex-col gap-4 rounded-2xl border px-5 py-4 md:flex-row md:items-center md:justify-between ${
              isDark
                ? "border-[#3D3D3D] bg-[#161616]"
                : "border-[#E5E5E5] bg-[#FFFCF6]"
            }`}
          >
            <div className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
              Showing {listStartIndex + 1} to{" "}
              {Math.min(listStartIndex + (pagination?.limit ?? REQUESTS_PER_PAGE), totalItems)} of{" "}
              {totalItems} results
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
                disabled={safeCurrentPage === 1}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  isDark
                    ? "border-[#333333] bg-[#101010] text-white/60 hover:bg-white/10 hover:text-white"
                    : "border-[#E5E5E5] bg-white text-[#333333] hover:bg-black/5"
                }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {paginationItems.map((item, index) =>
                  item === "..." ? (
                    <span
                      key={`pagination-gap-${index}`}
                      className={`px-2 text-xs ${isDark ? "text-white/30" : "text-black/30"}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        safeCurrentPage === item
                          ? "bg-[#E5D5B8] text-black"
                          : isDark
                            ? "text-white/60 hover:bg-white/5 hover:text-white"
                            : "text-[#666666] hover:bg-black/5"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setPage((currentValue) => Math.min(totalPages, currentValue + 1))}
                disabled={safeCurrentPage === totalPages}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  isDark
                    ? "border-[#333333] bg-[#101010] text-white/60 hover:bg-white/10 hover:text-white"
                    : "border-[#E5E5E5] bg-white text-[#333333] hover:bg-black/5"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent
          className={`max-h-[90vh] max-w-3xl overflow-y-auto border ${
            isDark ? "border-[#2E2E2E] bg-[#171717] text-white" : "border-[#E4E4E4] bg-white text-[#101010]"
          }`}
        >
          {selectedRequest ? (
            <>
              <DialogHeader>
                <DialogTitle className={isDark ? "text-white" : "text-[#101010]"}>
                  {selectedRequest.quote_number || `Quote #${selectedRequest.quote_id ?? "-"}`}
                </DialogTitle>
                <DialogDescription className={isDark ? "text-white/55" : "text-black/50"}>
                  Review the quote change request details and approve or reject from this popup.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                      Status
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(
                          isDark,
                          selectedRequest.approval_status
                        )}`}
                      >
                        {normalizeStatus(selectedRequest.approval_status)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                      Request Type
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(
                          isDark,
                          selectedRequest.request_type
                        )}`}
                      >
                        {normalizeRequestType(selectedRequest.request_type)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                      Requested At
                    </div>
                    <div className="mt-3 text-sm font-medium">{formatDateTime(selectedRequest.created_at)}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className={`rounded-2xl border p-5 ${
                      isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <User2 size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#8A6A30]"} />
                      <h3 className="font-semibold">Request Info</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className={isDark ? "text-white/40" : "text-black/40"}>Client</div>
                        <div className="font-medium">{selectedRequest.client_name || "Not available"}</div>
                      </div>
                      <div>
                        <div className={isDark ? "text-white/40" : "text-black/40"}>Booking Id</div>
                        <div className="font-medium">{selectedRequest.booking_id ?? "-"}</div>
                      </div>
                      <div>
                        <div className={isDark ? "text-white/40" : "text-black/40"}>Requested By</div>
                        <div className="font-medium">{selectedRequest.requested_by?.name || "System"}</div>
                      </div>
                      <div>
                        <div className={isDark ? "text-white/40" : "text-black/40"}>Assigned Sales Rep</div>
                        <div className="font-medium">{selectedRequest.assigned_sales_rep?.name || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-5 ${
                      isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Clock3 size={16} className={isDark ? "text-[#E8D1AB]" : "text-[#8A6A30]"} />
                      <h3 className="font-semibold">Totals</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={isDark ? "text-white/40" : "text-black/40"}>Previous Total</span>
                        <span className="font-semibold">{formatCurrency(selectedRequest.previous_total)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? "text-white/40" : "text-black/40"}>New Total</span>
                        <span className="font-semibold">{formatCurrency(selectedRequest.new_total)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? "text-white/40" : "text-black/40"}>Increase Amount</span>
                        <span className="font-semibold">{formatCurrency(selectedRequest.extra_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? "text-white/40" : "text-black/40"}>Reduced Amount</span>
                        <span className="font-semibold">{formatCurrency(selectedRequest.reduced_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${
                    isDark ? "border-white/10 bg-[#111111]" : "border-[#ECECEC] bg-[#FAFAFA]"
                  }`}
                >
                  <h3 className="mb-3 font-semibold">Change Summary</h3>
                  <p className={`text-sm leading-6 ${isDark ? "text-white/70" : "text-black/65"}`}>
                    {selectedRequest.overall_change_summary?.summary ||
                      "This request contains quote changes that require admin review."}
                  </p>

                  {selectedSummaryLines.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {selectedSummaryLines.map((line, index) => (
                        <div
                          key={`${selectedRequest.activity_id}-summary-${index}`}
                          className={`rounded-xl px-4 py-3 text-sm ${
                            isDark ? "bg-[#171717] text-white/75" : "bg-white text-black/70"
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {selectedRequest.quote_id ? (
                  <div className="text-sm">
                    <Link
                      href={`${detailsHrefBase}/${selectedRequest.quote_id}`}
                      className={`font-medium underline-offset-4 hover:underline ${
                        isDark ? "text-[#E8D1AB]" : "text-[#8A6A30]"
                      }`}
                    >
                      Open full quote details
                    </Link>
                  </div>
                ) : null}
              </div>

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className={
                    isDark
                      ? "border-white/10 bg-[#111111] text-white hover:bg-[#1D1D1D] hover:text-white"
                      : "border-[#E4E4E4] bg-white text-[#101010] hover:bg-[#F4F4F4]"
                  }
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleReview("reject")}
                  disabled={!canReviewSelected}
                  isLoading={processingAction === "reject"}
                  className={
                    isDark
                      ? "bg-[#2A1414] text-[#FFB4B4] hover:bg-[#351818]"
                      : "bg-[#FFF1F1] text-[#C62828] hover:bg-[#FFE4E4]"
                  }
                >
                  <XCircle size={16} />
                  Reject
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleReview("approve")}
                  disabled={!canReviewSelected}
                  isLoading={processingAction === "approve"}
                  className="bg-[#E5D5B8] text-black hover:bg-[#d7c7aa]"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
