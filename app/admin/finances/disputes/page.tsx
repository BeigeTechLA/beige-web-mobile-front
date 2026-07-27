"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { usePathname } from "next/navigation";
import {
  ArrowUpToLine,
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
import AddEditDisputeModal from "@/components/admin/finances/AddEditDisputeModal";
import DisputeDetailsModal, {
  type DisputeDetailsRecord,
} from "@/components/admin/finances/DisputeDetailsModal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import ResolveDisputeModal, {
  type ResolveDisputeFormData,
} from "@/components/admin/finances/ResolveDisputeModal";
import ConfirmResolutionModal, {
  type DisputeResolutionData,
} from "@/components/admin/finances/ConfirmResolutionModal";
import ResolutionSuccessfulModal from "@/components/admin/finances/ResolutionSuccessfulModal";
import ProcessingResolutionModal from "@/components/admin/finances/ProcessingResolutionModal";
import {
  financeTransactionsApi,
  type AdminFinanceDisputeApiRow,
  type AdminFinanceDisputeDetailsApiRow,
  type AdminFinanceDisputesDashboard,
} from "@/lib/api/financeTransactions";

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatShootId = (value: number | string | null | undefined) => {
  const normalized = String(value || "").replace(/^BK-/i, "").replace(/^SH-/i, "").replace(/^#/, "").replace(/^0+/, "").trim();
  return normalized ? `#${normalized}` : "-";
};

const buildParentInvoiceUrl = (bookingId: number | string | null | undefined) => {
  const normalized = String(bookingId || "").replace(/^#/, "").trim();
  return normalized ? `/beige_invoice/${encodeURIComponent(normalized)}?manual=1&t=${Date.now()}` : null;
};

const getActorRole = (
  user: { id?: number | string | null; role?: string | null; user_type?: number | string | null } | null | undefined,
  dispute?: AdminFinanceDisputeDetailsApiRow | null
) => {
  const userId = String(user?.id || "");
  const raisedById = String(dispute?.raised_by?.id || "");
  if (userId && raisedById && userId === raisedById) return titleize(dispute?.raised_by?.type) || "Client";
  const role = String(user?.role || "").toLowerCase();
  if (role.includes("admin")) return "Admin";
  if (role.includes("client") || role.includes("affiliate")) return "Client";
  if (role.includes("creator") || role.includes("cp")) return "CP";
  const userType = String(user?.user_type || "");
  if (userType === "1") return "Admin";
  return "Admin";
};

const titleize = (value: string | null | undefined) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const mapStatus = (status: string | null | undefined): DisputeHistoryItem["status"] => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "in_review") return "In Review";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "escalated") return "Escalated";
  return "Open";
};

const statusApiValue: Record<string, string | undefined> = {
  All: undefined,
  Open: "open",
  "In Review": "in_review",
  Resolved: "resolved",
  Rejected: "rejected",
  Escalated: "escalated",
};

const roleApiValue: Record<string, string | undefined> = {
  All: undefined,
  Client: "client",
  Creator: "creator",
  Admin: "admin",
};

const mapDisputeItem = (item: AdminFinanceDisputeApiRow): DisputeHistoryItem => ({
  disputeId: item.dispute_id || item.dispute_code || "",
  rawStatus: item.status || "open",
  id: item.dispute_code || (item.dispute_id ? `DIS-${item.dispute_id}` : "-"),
  shootId: formatShootId(item.booking_id || item.shoot_id),
  invoiceId: item.invoice_id || (item.invoice_send_history_id ? `INV-${item.invoice_send_history_id}` : "-"),
  category: item.issue_type || titleize(item.category) || "Other",
  description: item.description || item.subject || "-",
  raisedBy: item.raised_by?.name || item.client?.name || item.creator?.name || "-",
  raisedRole: titleize(item.raised_by?.type) || "Admin",
  raisedDate: formatDate(item.created_at),
  disputedAmount: formatCurrency(item.disputed_amount),
  payoutHold: formatCurrency(item.impacted_payout_amount ?? item.payout_hold_amount),
  status: mapStatus(item.status),
});

const mapDisputeDetails = (item: AdminFinanceDisputeDetailsApiRow): DisputeDetailsRecord => {
  const row = mapDisputeItem(item);
  const timeline = (item.timeline || []).map((event) => ({
    title: titleize(event.action) || "Updated",
    by: event.performed_by?.name || "Admin",
    at: formatDateTime(event.created_at),
    tone: event.to_status === "resolved" ? "resolved" as const : event.to_status === "in_review" || event.to_status === "escalated" ? "review" as const : "warning" as const,
  }));

  return {
    ...row,
    createdAt: formatDate(item.created_at),
    payoutNote: item.resolution?.notes || (row.status === "Resolved" ? "Released after resolution" : "On hold until resolved"),
    invoiceUrl: buildParentInvoiceUrl(item.booking_id) || item.invoice?.invoice_url || item.invoice?.invoice_pdf || null,
    timeline: timeline.length > 0 ? timeline : [{
      title: "Dispute Created",
      by: row.raisedBy,
      at: formatDateTime(item.created_at),
      tone: "warning",
    }],
    internalComments: (item.internal_comments || []).map((comment) => ({
      author: comment.created_by?.name || comment.created_by_creator?.name || "Admin",
      role: comment.created_by_creator ? "CP" : getActorRole(comment.created_by, item),
      message: comment.body || "-",
      at: formatDateTime(comment.created_at),
    })),
    attachments: (item.attachments || []).map((attachment) => ({
      name: attachment.file_name || "Attachment",
      url: attachment.file_url || null,
      uploadedBy: getActorRole(attachment.uploaded_by, item),
      uploadedAt: "-",
    })),
  };
};

export default function AdminDisputesPage() {
  const pathname = usePathname();
  const { canCreate } = usePermissions("finances");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("open");
  const [metricRange, setMetricRange] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailsRecord | null>(null);
  const [disputeItems, setDisputeItems] = useState<DisputeHistoryItem[]>([]);
  const [dashboard, setDashboard] = useState<AdminFinanceDisputesDashboard | null>(null);
  const [actionLoading, setActionLoading] = useState<"review" | "resolve" | "reject" | "escalate" | "comment" | "attachment" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Resolution modal states
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [disputeToResolve, setDisputeToResolve] = useState<DisputeDetailsRecord | null>(null);
  const [resolutionData, setResolutionData] = useState<DisputeResolutionData | null>(null);
  const [resolutionFormData, setResolutionFormData] = useState<ResolveDisputeFormData | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const [dashboardResponse, listResponse] = await Promise.all([
          financeTransactionsApi.getAdminDisputesDashboard(),
          financeTransactionsApi.listAdminDisputes({
            page: 1,
            limit: 100,
            search: searchQuery.trim() || undefined,
            status: statusApiValue[statusFilter],
            raised_by_type: roleApiValue[typeFilter],
            sort_by: "created_at",
            sort_dir: "DESC",
          }),
        ]);

        if (isCancelled) return;
        setDashboard(dashboardResponse.data || null);
        setDisputeItems((listResponse.data?.rows || []).map(mapDisputeItem));
      } catch (error) {
        console.error("Failed to fetch admin disputes:", error);
        if (!isCancelled) {
          setDashboard(null);
          setDisputeItems([]);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void fetchDisputes();
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [refreshKey, searchQuery, statusFilter, typeFilter]);

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

  const metrics: DisputeMetricCard[] = [
    {
      id: "open",
      label: "Open Disputes",
      value: String(dashboard?.overview?.open_disputes ?? 0).padStart(2, "0"),
      helperText: `${dashboard?.overview?.total_disputes ?? 0} total disputes`,
      icon: CustomCautionIcon,
    },
    {
      id: "review",
      label: "In Review",
      value: String(dashboard?.overview?.in_review ?? 0).padStart(2, "0"),
      helperText: "Pending resolution",
      icon: CustomClockIcon,
    },
    {
      id: "resolved",
      label: "Resolved (30d)",
      value: String(dashboard?.overview?.resolved_last_30d ?? 0).padStart(2, "0"),
      helperText: "Last month",
      icon: CustomCheckIcon,
    },
    {
      id: "hold",
      label: "Impacted Payouts",
      value: formatCurrency(dashboard?.overview?.impacted_payout_total),
      helperText: "Total on hold",
      icon: CustomDollarIcon,
    },
  ];

  const filteredItems = useMemo(() => {
    return disputeItems;
  }, [disputeItems]);

  const disputeShootOptions = useMemo(
    () => Array.from(new Set(disputeItems.map((item) => item.shootId))),
    [disputeItems]
  );

  const openDisputeDetails = async (item: DisputeHistoryItem) => {
    if (!item.disputeId) return;
    setSelectedDispute({
      ...item,
      createdAt: item.raisedDate,
      payoutNote: "Loading dispute details...",
      timeline: [],
      internalComments: [],
    });
    try {
      const response = await financeTransactionsApi.getAdminDisputeDetails(item.disputeId);
      setSelectedDispute(mapDisputeDetails(response.data));
    } catch (error) {
      console.error("Failed to fetch dispute details:", error);
    }
  };

  const applyDisputeAction = async (
    dispute: DisputeDetailsRecord,
    action: "review" | "resolve" | "reject" | "escalate"
  ) => {
    if (!dispute.disputeId) return;
    setActionLoading(action);
    try {
      const response =
        action === "review"
          ? await financeTransactionsApi.updateAdminDispute(dispute.disputeId, {
              status: "in_review",
              notes: "Marked in review by admin",
            })
          : action === "resolve"
          ? await financeTransactionsApi.resolveAdminDispute(dispute.disputeId, {
              resolution_type: "payout_release",
              release_payout_holds: true,
              notes: "Resolved by admin",
            })
          : action === "reject"
            ? await financeTransactionsApi.rejectOrRefundAdminDispute(dispute.disputeId, {
                resolution_type: "no_action",
                notes: "Rejected by admin",
              })
            : await financeTransactionsApi.escalateAdminDispute(dispute.disputeId, {
                priority: "high",
                notes: "Escalated by admin",
              });

      setSelectedDispute(mapDisputeDetails(response.data));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error(`Failed to ${action} dispute:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const openResolveFlow = (dispute: DisputeDetailsRecord) => {
    setDisputeToResolve(dispute);
    setResolutionData(null);
    setResolveModalOpen(true);
  };

  const handleResolveModalSubmit = (formData: ResolveDisputeFormData) => {
    if (!disputeToResolve) return;

    const amount = formData.resolutionType === "credits"
      ? undefined
      : formData.amount || disputeToResolve.disputedAmount;
    const creditAmount = formData.resolutionType === "credits"
      ? `${formData.creditAmount || "0"} credits`
      : undefined;

    setResolutionData({
      resolutionType: formData.resolutionType,
      disputeId: disputeToResolve.id,
      recipient: formData.recipient || disputeToResolve.raisedBy || "Client",
      amount,
      creditAmount,
      paymentMethod: formData.paymentMethod || "Manual Payment",
      transactionId: formData.transactionId || "-",
    });
    setResolutionFormData(formData);
    setResolveModalOpen(false);
    setConfirmResolveOpen(true);
  };

  const confirmResolveDispute = async () => {
    if (!disputeToResolve?.disputeId || !resolutionData) return;

    setConfirmResolveOpen(false);
    setIsProcessing(true);
    setActionLoading("resolve");
    try {
      const response = await financeTransactionsApi.resolveAdminDispute(disputeToResolve.disputeId, {
        resolution_type: resolutionData.resolutionType,
        release_payout_holds: true,
        amount: resolutionData.amount,
        credit_amount: resolutionData.creditAmount,
        recipient: resolutionData.recipient,
        payment_method: resolutionData.paymentMethod,
        transaction_id: resolutionData.transactionId,
        notes: resolutionFormData?.notes || `Resolved by admin via ${resolutionData.resolutionType} resolution`,
      });

      if (resolutionFormData?.files.length) {
        const payload = new FormData();
        resolutionFormData.files.forEach((file) => payload.append("attachments", file));
        await financeTransactionsApi.addAdminDisputeAttachment(disputeToResolve.disputeId, payload);
      }

      const detailsResponse = await financeTransactionsApi.getAdminDisputeDetails(disputeToResolve.disputeId);
      setSelectedDispute(mapDisputeDetails(detailsResponse.data || response.data));
      setRefreshKey((current) => current + 1);
      setIsSuccessOpen(true);
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    } finally {
      setIsProcessing(false);
      setActionLoading(null);
    }
  };

  const addDisputeComment = async (dispute: DisputeDetailsRecord, body: string) => {
    if (!dispute.disputeId) return;
    setActionLoading("comment");
    try {
      await financeTransactionsApi.addAdminDisputeComment(dispute.disputeId, body);
      const response = await financeTransactionsApi.getAdminDisputeDetails(dispute.disputeId);
      setSelectedDispute(mapDisputeDetails(response.data));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to add dispute comment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const addDisputeAttachment = async (dispute: DisputeDetailsRecord, files: File[]) => {
    if (!dispute.disputeId || !files.length) return;
    setActionLoading("attachment");
    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("attachments", file));
      await financeTransactionsApi.addAdminDisputeAttachment(dispute.disputeId, payload);
      const response = await financeTransactionsApi.getAdminDisputeDetails(dispute.disputeId);
      setSelectedDispute(mapDisputeDetails(response.data));
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to add dispute attachment:", error);
    } finally {
      setActionLoading(null);
    }
  };

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

        <DisputeHistoryList
          items={filteredItems}
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          monthValue={monthFilter}
          onMonthChange={setMonthFilter}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          onViewDetails={(item) => void openDisputeDetails(item)}
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
        actionLoading={actionLoading}
        onMarkInReview={(dispute) => void applyDisputeAction(dispute, "review")}
        onResolve={openResolveFlow}
        onReject={(dispute) => void applyDisputeAction(dispute, "reject")}
        onEscalate={(dispute) => void applyDisputeAction(dispute, "escalate")}
        onAddComment={(dispute, body) => void addDisputeComment(dispute, body)}
        onAddAttachment={(dispute, files) => void addDisputeAttachment(dispute, files)}
        onOpenInvoice={(dispute) => {
          if (dispute.invoiceUrl) window.open(dispute.invoiceUrl, "_blank", "noopener,noreferrer");
        }}
      />

      <ResolveDisputeModal
        open={resolveModalOpen}
        isDark={isDark}
        disputeData={disputeToResolve ? {
          disputeId: disputeToResolve.id,
          shootId: disputeToResolve.shootId,
          amount: disputeToResolve.disputedAmount,
          recipient: disputeToResolve.raisedBy,
        } : null}
        onClose={() => setResolveModalOpen(false)}
        onSubmit={handleResolveModalSubmit}
      />

      {resolutionData ? (
        <ConfirmResolutionModal
          open={confirmResolveOpen}
          isDark={isDark}
          isSubmitting={actionLoading === "resolve"}
          disputeData={resolutionData}
          onClose={() => setConfirmResolveOpen(false)}
          onConfirm={() => void confirmResolveDispute()}
        />
      ) : null}

      <ResolutionSuccessfulModal
        open={isSuccessOpen}
        isDark={isDark}
        disputeData={{
          paymentType: resolutionData?.resolutionType || "manual",
          disputeId: resolutionData?.disputeId || disputeToResolve?.id || "-",
          status: "Resolved - Paid",
          amount: resolutionData?.amount || disputeToResolve?.disputedAmount || "$0",
          creditAmount: resolutionData?.creditAmount || "0 credits",
        }}
        onClose={() => setIsSuccessOpen(false)}
      />

      <ProcessingResolutionModal
        open={isProcessing}
        isDark={isDark}
      />
    </>
  );
}
