"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { usePathname } from "next/navigation";
import {
  ArrowUpToLine,
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import DisputeMetricCards, {
  type DisputeMetricCard,
} from "@/components/admin/finances/DisputeMetricCards";
import DisputeHistoryList, {
  type DisputeHistoryItem,
} from "@/components/admin/finances/DisputeHistoryList";
import DottedDivider from "@/components/admin/DottedDivider";
import AddEditDisputeModal from "@/components/admin/finances/AddEditDisputeModal";
import DisputeDetailsModal, {
  type DisputeDetailsRecord,
} from "@/components/admin/finances/DisputeDetailsModal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { adminApi } from "@/lib/api";
import ResolveDisputeModal from "@/components/admin/finances/ResolveDisputeModal";
import ConfirmResolutionModal from "@/components/admin/finances/ConfirmResolutionModal";
import ResolutionSuccessfulModal from "@/components/admin/finances/ResolutionSuccessfulModal";
import ProcessingResolutionModal from "@/components/admin/finances/ProcessingResolutionModal";

type DisputeDashboardOverview = {
  totalDisputes: number;
  openDisputes: number;
  inReview: number;
  resolvedLast30d: number;
  impactedPayoutTotal: number;
};

type DisputeDashboardResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
  error?: string;
};

const defaultDashboardOverview: DisputeDashboardOverview = {
  totalDisputes: 0,
  openDisputes: 0,
  inReview: 0,
  resolvedLast30d: 0,
  impactedPayoutTotal: 0,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const pickFirstValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const pickFirstNumber = (source: Record<string, unknown>, keys: string[]) => {
  const value = pickFirstValue(source, keys);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMetricValue = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMetricRangeParams = (range: string, selectedDate: Date | null) => {
  if (selectedDate) {
    const iso = toIsoDate(selectedDate);
    return { date_from: iso, date_to: iso };
  }

  const now = new Date();
  const end = toIsoDate(now);

  if (range === "Last 30 Days") {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    return { date_from: toIsoDate(from), date_to: end };
  }

  if (range === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { date_from: toIsoDate(from), date_to: end };
  }

  if (range === "This Year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { date_from: toIsoDate(from), date_to: end };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { date_from: toIsoDate(monthStart), date_to: end };
};

const extractDashboardOverview = (response: DisputeDashboardResponse | null | undefined): DisputeDashboardOverview => {
  const responseData = asRecord(response?.data);
  const root = responseData && asRecord(responseData.data) ? asRecord(responseData.data) : responseData;
  const overviewSource =
    asRecord(pickFirstValue(root || {}, ["overview", "summary", "metrics"])) ||
    root ||
    {};

  return {
    totalDisputes: pickFirstNumber(overviewSource, ["total_disputes", "totalDisputes", "total"]),
    openDisputes: pickFirstNumber(overviewSource, ["open_disputes", "openDisputes", "open"]),
    inReview: pickFirstNumber(overviewSource, ["in_review", "inReview", "in_review_disputes"]),
    resolvedLast30d: pickFirstNumber(overviewSource, ["resolved_last_30d", "resolvedLast30d", "resolved_last_30_days"]),
    impactedPayoutTotal: pickFirstNumber(overviewSource, ["impacted_payout_total", "impactedPayoutTotal", "payout_hold_total"]),
  };
};

type DisputeListRowApi = {
  dispute_id?: number | string;
  dispute_code?: string | null;
  status?: string | null;
  issue_type?: string | null;
  category?: string | null;
  shoot_id?: string | null;
  booking_id?: number | string | null;
  invoice_id?: string | null;
  invoice_send_history_id?: number | string | null;
  subject?: string | null;
  description?: string | null;
  disputed_amount?: number | string | null;
  payout_hold_amount?: number | string | null;
  impacted_payout_amount?: number | string | null;
  raised_by?: {
    type?: string | null;
    name?: string | null;
    initials?: string | null;
  } | null;
  created_at?: string | null;
};

type DisputeListResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
  error?: string;
};

type DisputeListPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const ITEMS_PER_PAGE = 10;

const STATUS_TO_API: Record<string, string | undefined> = {
  All: undefined,
  Open: "open",
  "In Review": "in_review",
  Resolved: "resolved",
};

const LIST_TAB_TO_API: Record<string, string | undefined> = {
  All: undefined,
  Client: "client",
  Creator: "creator",
};

const getArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value
        .map((item) => asRecord(item))
        .filter(Boolean) as Record<string, unknown>[]
    : [];

const formatDateLabel = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const formatDisputeStatus = (value?: string | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "in_review" || normalized === "in review") return "In Review";
  if (normalized === "resolved") return "Resolved";
  return "Open";
};

const formatRaisedRole = (value?: string | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "creator") return "Creator";
  if (normalized === "client") return "Client";
  if (normalized === "admin") return "Admin";
  return "N/A";
};

const formatDisputeRow = (row: DisputeListRowApi, index: number): DisputeHistoryItem => {
  const disputeId = String(row.dispute_code || row.dispute_id || `DIS-${index + 1}`).trim();
  const bookingId = row.booking_id ? String(row.booking_id) : "";
  const shootId = row.shoot_id || (bookingId ? `SH-${bookingId}` : "N/A");
  const invoiceId = row.invoice_id || (row.invoice_send_history_id ? `INV-${row.invoice_send_history_id}` : "N/A");
  const amount = Number(row.disputed_amount || 0);
  const payoutHold = Number(row.payout_hold_amount ?? row.impacted_payout_amount ?? 0);

  return {
    id: disputeId,
    shootId,
    invoiceId,
    category: String(row.issue_type || row.category || "Other").replace(/_/g, " "),
    description: String(row.subject || row.description || "No description provided"),
    raisedBy: String(row.raised_by?.name || "Admin"),
    raisedRole: formatRaisedRole(row.raised_by?.type),
    raisedDate: formatDateLabel(row.created_at),
    disputedAmount: currencyFormatter.format(Number.isFinite(amount) ? amount : 0),
    payoutHold: currencyFormatter.format(Number.isFinite(payoutHold) ? payoutHold : 0),
    status: formatDisputeStatus(row.status),
  };
};

const buildDisputeDetails = (item: DisputeHistoryItem): DisputeDetailsRecord => {
  const resolved = item.status === "Resolved";
  const timeline = [
    {
      title: "Dispute Created",
      by: item.raisedBy,
      at: item.raisedDate,
      tone: "warning" as const,
    },
    {
      title: resolved ? "Resolved" : "Under Review",
      by: resolved ? "Support Team" : "Support Team",
      at: item.raisedDate,
      tone: resolved ? "resolved" as const : "review" as const,
    },
  ];

  return {
    ...item,
    createdAt: item.raisedDate,
    payoutNote: resolved ? "Released after resolution" : "On hold until resolved",
    timeline,
    internalComments: [
      {
        author: item.raisedBy,
        message: item.description,
        at: item.raisedDate,
      },
      {
        author: "Support Team",
        message: resolved
          ? "The dispute has been reviewed and marked as resolved."
          : "The dispute is currently being reviewed.",
        at: item.raisedDate,
      },
    ],
  };
};

const extractDisputeListPayload = (response: DisputeListResponse | null | undefined) => {
  const responseData = asRecord(response?.data);
  const root = responseData && asRecord(responseData.data) ? asRecord(responseData.data) : responseData;
  const listSource = root || {};
  const rows = getArray(
    pickFirstValue(listSource, ["rows", "items", "data", "list"]) ?? listSource
  );
  const pagination = asRecord(pickFirstValue(listSource, ["pagination"])) || {};

  return {
    rows,
    pagination: {
      page: pickFirstNumber(pagination, ["page"]) || 1,
      limit: pickFirstNumber(pagination, ["limit"]) || ITEMS_PER_PAGE,
      total: pickFirstNumber(pagination, ["total"]),
      totalPages: pickFirstNumber(pagination, ["total_pages", "totalPages"]) || 1,
    } as DisputeListPagination,
  };
};

export default function AdminDisputesPage() {
  const pathname = usePathname();
  const { canCreate } = usePermissions("finances");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeMetricId, setActiveMetricId] = useState("open");
  const [metricRange, setMetricRange] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailsRecord | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [disputeRows, setDisputeRows] = useState<DisputeHistoryItem[]>([]);
  const [listPagination, setListPagination] = useState<DisputeListPagination>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Resolution modal states
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dashboardOverview, setDashboardOverview] = useState<DisputeDashboardOverview>(defaultDashboardOverview);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, monthFilter, typeFilter, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setDashboardLoading(true);

      try {
        const response = await adminApi.getDisputesDashboard({
          page: 1,
          limit: 10,
          ...getMetricRangeParams(metricRange, selectedDate),
        });

        if (cancelled) return;

        setDashboardOverview(extractDashboardOverview(response));
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch disputes dashboard metrics:", error);
        setDashboardOverview(defaultDashboardOverview);
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [metricRange, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    const loadDisputes = async () => {
      setListLoading(true);

      try {
        const response = await adminApi.getDisputesList({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchQuery.trim() || undefined,
          status: STATUS_TO_API[statusFilter],
          raised_by_type: LIST_TAB_TO_API[typeFilter],
          ...getMetricRangeParams(monthFilter, selectedDate),
        });

        if (cancelled) return;

        const { rows, pagination } = extractDisputeListPayload(response);
        setDisputeRows(rows.map((row, index) => formatDisputeRow(row as DisputeListRowApi, index)));
        setListPagination(pagination);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch disputes list:", error);
        setDisputeRows([]);
        setListPagination({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          total: 0,
          total_pages: 1,
        });
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void loadDisputes();

    return () => {
      cancelled = true;
    };
  }, [currentPage, monthFilter, searchQuery, selectedDate, statusFilter, typeFilter]);

  const { isDark } = useResolvedTheme();

  const CustomClockIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Clock.svg"
      width={size}
      height={size}
      alt="video"
    />
  );
  const CustomDollarIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Dollar.svg"
      width={size}
      height={size}
      alt="camera"
    />
  );
  const CustomCheckIcon = ({ size = 16 }) => (
    <img
      src="/images/misc/overviewicons/CheckCircle.svg"
      width={size}
      height={size}
      alt="video"
    />
  );
  const CustomCautionIcon = ({ size = 16 }) => (
    <img
      src="/images/misc/overviewicons/Caution.svg"
      width={size}
      height={size}
      alt="camera"
    />
  );

  const disputeTabs = [
    { id: "All", label: "All" },
    { id: "Client", label: "Client" },
    { id: "Creator", label: "Creators" },
  ] as const;

  const metrics: DisputeMetricCard[] = useMemo(
    () => [
      {
        id: "open",
        label: "Open Disputes",
        value: dashboardLoading ? "-" : dashboardOverview.openDisputes.toLocaleString("en-US"),
        helperText:
          dashboardLoading
            ? "Loading disputes overview"
            : `Out of ${dashboardOverview.totalDisputes.toLocaleString("en-US")} total disputes`,
        icon: CustomCautionIcon,
      },
      {
        id: "review",
        label: "In Review",
        value: dashboardLoading ? "-" : dashboardOverview.inReview.toLocaleString("en-US", { minimumIntegerDigits: 2 }),
        helperText: dashboardLoading ? "Loading disputes overview" : "Pending resolution",
        icon: CustomClockIcon,
      },
      {
        id: "resolved",
        label: "Resolved (30d)",
        value: dashboardLoading ? "-" : dashboardOverview.resolvedLast30d.toLocaleString("en-US"),
        helperText: dashboardLoading ? "Loading disputes overview" : "Closed in the selected range",
        icon: CustomCheckIcon,
      },
      {
        id: "hold",
        label: "Impacted Payouts",
        value: dashboardLoading ? "-" : formatMetricValue(dashboardOverview.impactedPayoutTotal),
        helperText: dashboardLoading ? "Loading disputes overview" : "Total on hold",
        icon: CustomDollarIcon,
      },
    ],
    [dashboardLoading, dashboardOverview]
  );

  const disputeShootOptions = useMemo(
    () => Array.from(new Set(disputeRows.map((item) => item.shootId).filter(Boolean))),
    [disputeRows]
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}>
              <ArrowUpToLine /> Export
            </Button>
            <Button
              onClick={() => setIsDisputeModalOpen(true)}
              disabled={!canCreate}
              title={canCreate ? "Add Dispute" : "Create permission not allowed"}
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d]"
            >
              Add Dispute
            </Button>
          </>
        }
      />

      <div
        className="overflow-hidden p-4 pb-24 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Disputes
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Resolve disputes linked to Shoot and Invoice IDs
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <DisputeMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          rangeValue={metricRange}
          onRangeChange={setMetricRange}
        />

        <div
          className={`inline-flex max-w-full rounded-[18px] border p-1 transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#2C2C2C]" : "bg-[#111111] border-[#2C2C2C]"}`}
        >
          <div className="inline-flex gap-1">
            {disputeTabs.map((tab) => {
              const isActive = typeFilter === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`min-w-[108px] sm:min-w-[124px] h-11 px-5 rounded-[12px] text-sm lg:text-[15px] font-medium transition-all duration-200 ${isActive
                    ? "bg-[#E8D1AB] text-[#171717] shadow-[0_1px_0_rgba(255,255,255,0.25)]"
                    : "bg-transparent text-[#B2B2B2] hover:text-white hover:bg-white/5"
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <DisputeHistoryList
          items={disputeRows}
          loading={listLoading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          monthValue={monthFilter}
          onMonthChange={setMonthFilter}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          showTypeFilter={false}
          currentPage={listPagination.page}
          totalPages={listPagination.total_pages}
          totalItems={listPagination.total}
          pageSize={listPagination.limit}
          onPageChange={setCurrentPage}
          onViewDetails={(item) =>
            setSelectedDispute(buildDisputeDetails(item))
          }
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => setIsDisputeModalOpen(true)}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Add Dispute
          </Button>
        </div>
      </div>

      <AddEditDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        shootOptions={disputeShootOptions}
      />

      <DisputeDetailsModal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        dispute={selectedDispute}
        onOpenResolve={() => {
          setResolveModalOpen(true)
          setSelectedDispute(null)
        }}
      />

      <ResolveDisputeModal
        open={resolveModalOpen}
        handleResolvePayment={() => {
          setConfirmResolveOpen(true)
          setResolveModalOpen(false)
        }}
      />

      <ConfirmResolutionModal
        open={confirmResolveOpen}
        isDark={isDark}
        // isSubmitting={isSubmitting}
        disputeData={{
          resolutionType: "manual", // Options: "auto" | "credits" | "manual"
          disputeId: "DIS-001",
          recipient: "Client",
          amount: "$5,000",
          creditAmount: "454 credits",
          paymentMethod: "UPI",
          transactionId: "TXN-2026-458921"
        }}
        onClose={() => setConfirmResolveOpen(false)}
        onConfirm={() => {
          console.log("Handle function called here");
        }}
      />

      <ResolutionSuccessfulModal
        open={isSuccessOpen}
        isDark={isDark}
        disputeData={{
          paymentType: "auto", // Render layouts dynamically: "auto" | "credits" | "manual"
          disputeId: "DIS-001",
          status: "Resolved - Paid",
          amount: "$5,000",
          creditAmount: "500 Points"
        }}
        onClose={() => setIsSuccessOpen(false)}
      />

      <ProcessingResolutionModal
        open={isProcessing}
        isDark={true}
      />
    </>
  );
}
