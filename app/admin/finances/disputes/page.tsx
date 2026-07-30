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
import ResolveDisputeModal, {
  type ResolveDisputeFormData,
} from "@/components/admin/finances/ResolveDisputeModal";
import ConfirmResolutionModal, {
  type DisputeResolutionData,
} from "@/components/admin/finances/ConfirmResolutionModal";
import ResolutionSuccessfulModal from "@/components/admin/finances/ResolutionSuccessfulModal";
import ProcessingResolutionModal from "@/components/admin/finances/ProcessingResolutionModal";
import RejectDisputeModal, {
  type RejectDisputeFormData,
} from "@/components/admin/finances/RejectDisputeModal";
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

const parseMoneyValue = (value: number | string | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const amount = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
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

const formatRaisedRole = (value: string | null | undefined) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "creator") return "CP";
  return titleize(value) || "Admin";
};

const formatResolutionType = (value: string | null | undefined) => {
  const normalized = String(value || "").toLowerCase();
  const labels: Record<string, string> = {
    payout_release: "Payout Release",
    refund: "Refund",
    partial_refund: "Partial Refund",
    credit_compensation: "Beige Credits",
    payout_adjustment: "Payout Adjustment",
    no_action: "No Action",
    other: "Other",
  };
  return labels[normalized] || titleize(value);
};

const isProofAttachmentType = (type: string | null | undefined) =>
  type === "refund_proof" || type === "payout_proof";

const mapStatus = (status: string | null | undefined): DisputeHistoryItem["status"] => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "in_review") return "In Review";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "escalated") return "Escalated";
  return "Open";
};

const inferRejectedFromResolution = (item: AdminFinanceDisputeDetailsApiRow) => {
  const resolutionText = `${item.resolution?.type || ""} ${item.resolution?.notes || ""}`.toLowerCase();
  return item.status === "resolved" && /\breject(ed|ing)?\b|no_action|invalid claim/.test(resolutionText);
};

const buildResolutionSummary = (
  item: AdminFinanceDisputeDetailsApiRow,
  status: DisputeHistoryItem["status"]
): DisputeDetailsRecord["resolutionSummary"] => {
  if (status !== "Resolved" && status !== "Rejected") return null;
  const latestCloseEvent = [...(item.timeline || [])]
    .reverse()
    .find((event) => event.to_status === "resolved" || event.to_status === "rejected");
  const metadata = latestCloseEvent?.metadata || {};
  const metadataValue = (key: string) => {
    const value = metadata[key];
    return value === null || value === undefined || value === "" ? "" : String(value);
  };
  const resolutionType = String(item.resolution?.type || metadataValue("resolution_type") || "");
  const isCreditResolution = resolutionType === "credit_compensation";
  const details = [
    { label: "Status", value: status },
    { label: status === "Rejected" ? "Reason" : "Resolution Type", value: status === "Rejected" ? metadataValue("rejection_reason") : formatResolutionType(resolutionType) },
    { label: "Amount", value: metadataValue("resolution_amount") || metadataValue("credit_amount") || metadataValue("refund_amount") },
    { label: "Payment Method", value: metadataValue("payment_method") },
    { label: "Transaction ID", value: metadataValue("transaction_id") },
    { label: "Recipient", value: metadataValue("recipient") },
    { label: "Credit Reference", value: metadataValue("account_credit_ledger_id") ? `CR-${metadataValue("account_credit_ledger_id")}` : "" },
    { label: "Credit Use", value: isCreditResolution ? "Added to the client account for future bookings." : "" },
    { label: "Notes", value: item.resolution?.notes || latestCloseEvent?.notes || "" },
  ].filter((detail) => detail.value);

  return {
    label: status === "Rejected" ? "Rejection Details" : "Resolution Details",
    details: details.length ? details : [{ label: "Status", value: status }],
  };
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

const disputeOriginTabs = [
  { label: "All", value: "All" },
  { label: "Client", value: "Client" },
  { label: "Creator/CP", value: "Creator" },
];

const mapDisputeItem = (item: AdminFinanceDisputeApiRow): DisputeHistoryItem => ({
  disputeId: item.dispute_id || item.dispute_code || "",
  rawStatus: item.status || "open",
  id: item.dispute_code || (item.dispute_id ? `DIS-${item.dispute_id}` : "-"),
  shootId: formatShootId(item.booking_id || item.shoot_id),
  invoiceId: item.invoice_id || (item.invoice_send_history_id ? `INV-${item.invoice_send_history_id}` : "-"),
  category: item.issue_type || titleize(item.category) || "Other",
  description: item.description || item.subject || "-",
  raisedBy: item.raised_by?.name || item.client?.name || item.creator?.name || "-",
  raisedRole: formatRaisedRole(item.raised_by?.type),
  raisedDate: formatDate(item.created_at),
  disputedAmount: formatCurrency(item.disputed_amount),
  payoutHold: formatCurrency(item.impacted_payout_amount ?? item.payout_hold_amount),
  status: mapStatus(item.status),
});

const mapDisputeDetails = (item: AdminFinanceDisputeDetailsApiRow): DisputeDetailsRecord => {
  const row = mapDisputeItem(item);
  const status = inferRejectedFromResolution(item) ? "Rejected" : row.status;
  const isCreatorDispute = String(item.raised_by?.type || "").toLowerCase() === "creator";
  const cpCompensation = item.cp_compensation || null;
  const payoutHoldAmount = parseMoneyValue(row.payoutHold);
  const timeline = (item.timeline || []).map((event) => ({
    id: event.id,
    title: titleize(event.action) || "Updated",
    by: event.performed_by?.name || "Admin",
    at: formatDateTime(event.created_at),
    tone: event.to_status === "resolved" ? "resolved" as const : event.to_status === "in_review" || event.to_status === "escalated" ? "review" as const : "warning" as const,
  }));
  const attachments = (item.attachments || []).map((attachment) => ({
    name: attachment.file_name || "Attachment",
    url: attachment.file_url || null,
    uploadedBy: getActorRole(attachment.uploaded_by, item),
    uploadedAt: formatDateTime(attachment.created_at),
    attachmentType: attachment.attachment_type || null,
  }));

  return {
    ...row,
    status,
    createdAt: formatDate(item.created_at),
    hideImpactedPayout: isCreatorDispute,
    payoutNote: payoutHoldAmount > 0
      ? status === "Resolved" ? "Hold released after resolution" : status === "Rejected" ? "Hold reviewed with dispute" : "On hold until resolved"
      : "No payout currently impacted",
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
    attachments,
    resolutionProofs: attachments.filter((attachment) => isProofAttachmentType(attachment.attachmentType)),
    compensationSummary: isCreatorDispute ? {
      label: "CP Compensation",
      details: [
        { label: "Creative Partner", value: item.creator?.name || item.raised_by?.name || "-" },
        { label: "Creator Earning ID", value: cpCompensation?.creator_earning_id ? `CE-${cpCompensation.creator_earning_id}` : "-" },
        { label: "Total Compensation", value: formatCurrency(cpCompensation?.total_compensation ?? item.disputed_amount) },
        { label: "Paid To CP", value: formatCurrency(cpCompensation?.paid_amount) },
        { label: "Remaining Balance", value: formatCurrency(cpCompensation?.remaining_balance) },
      ],
    } : null,
    resolutionSummary: buildResolutionSummary(item, status),
  };
};

export default function AdminDisputesPage() {
  const pathname = usePathname();
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [disputeToReject, setDisputeToReject] = useState<DisputeDetailsRecord | null>(null);

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

  const openRejectFlow = (dispute: DisputeDetailsRecord) => {
    setDisputeToReject(dispute);
    setRejectModalOpen(true);
  };

  const handleResolveModalSubmit = (formData: ResolveDisputeFormData) => {
    if (!disputeToResolve) return;

    const amount = formData.resolutionType === "credits"
      ? undefined
      : formData.amount || disputeToResolve.disputedAmount;
    const creditAmount = formData.resolutionType === "credits"
      ? formatCurrency(parseMoneyValue(formData.creditAmount))
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
      const apiResolutionType =
        disputeToResolve.raisedRole === "CP"
          ? "payout_adjustment"
          : resolutionFormData?.resolutionType === "credits"
          ? "credit_compensation"
          : resolutionFormData?.resolutionType === "manual"
            ? resolutionFormData.amountType === "partial" ? "partial_refund" : "refund"
            : "payout_release";
      const resolutionAmount = parseMoneyValue(resolutionData.amount || disputeToResolve.disputedAmount);
      const creditAmount = parseMoneyValue(resolutionFormData?.creditAmount || resolutionData.creditAmount);
      const response = await financeTransactionsApi.resolveAdminDispute(disputeToResolve.disputeId, {
        resolution_type: apiResolutionType,
        release_payout_holds: true,
        amount: apiResolutionType === "credit_compensation" ? creditAmount : resolutionAmount,
        refund_amount: apiResolutionType === "refund" || apiResolutionType === "partial_refund" ? resolutionAmount : undefined,
        credit_amount: apiResolutionType === "credit_compensation" ? creditAmount : undefined,
        recipient: resolutionData.recipient,
        payment_method: apiResolutionType === "credit_compensation" ? "Beige Credits" : resolutionData.paymentMethod,
        transaction_id: resolutionData.transactionId,
        notes: resolutionFormData?.notes || (apiResolutionType === "credit_compensation"
          ? "Beige credits added to the client account for future bookings."
          : `Resolved by admin via ${formatResolutionType(apiResolutionType)}.`),
        notify_user: apiResolutionType === "credit_compensation",
      });

      if (resolutionFormData?.files.length) {
        const payload = new FormData();
        payload.append("attachment_type", apiResolutionType === "payout_release" ? "payout_proof" : "refund_proof");
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

  const submitRejectDispute = async (formData: RejectDisputeFormData) => {
    if (!disputeToReject?.disputeId) return;

    setActionLoading("reject");
    try {
      const response = await financeTransactionsApi.rejectOrRefundAdminDispute(disputeToReject.disputeId, {
        resolution_type: "no_action",
        rejection_reason: formData.reason,
        notes: formData.notes || `Rejected by admin: ${titleize(formData.reason)}`,
      });

      setSelectedDispute(mapDisputeDetails(response.data));
      setRejectModalOpen(false);
      setDisputeToReject(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to reject dispute:", error);
    } finally {
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
            {/* <Button
              onClick={() => setIsDisputeModalOpen(true)}
              disabled={!canCreate}
              title={canCreate ? "Add Dispute" : "Create permission not allowed"}
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d]"
            >
              Add Dispute
            </Button> */}
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

        <div className={`inline-flex w-full gap-1 rounded-lg border p-1 sm:w-fit ${isDark ? "border-white/10 bg-[#101010]" : "border-black/10 bg-white"}`}>
          {disputeOriginTabs.map((tab) => {
            const isActive = typeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`h-10 flex-1 rounded-md px-4 text-sm font-medium transition-colors sm:flex-none ${
                  isActive
                    ? "bg-[#E8D1AB] text-black"
                    : isDark
                      ? "text-white/65 hover:bg-white/5 hover:text-white"
                      : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

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
        onReject={openRejectFlow}
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
          amount: disputeToResolve.raisedRole === "CP"
            ? (() => {
                const remainingValue = disputeToResolve.compensationSummary?.details.find((item) => item.label === "Remaining Balance")?.value;
                return parseMoneyValue(remainingValue) > 0 ? remainingValue : disputeToResolve.disputedAmount;
              })()
            : disputeToResolve.disputedAmount,
          recipient: disputeToResolve.raisedBy,
        } : null}
        creatorDispute={disputeToResolve?.raisedRole === "CP"}
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

      <RejectDisputeModal
        open={rejectModalOpen}
        isDark={isDark}
        isSubmitting={actionLoading === "reject"}
        disputeLabel={disputeToReject ? `${disputeToReject.id} • ${disputeToReject.shootId} • ${disputeToReject.disputedAmount}` : undefined}
        onClose={() => {
          if (actionLoading === "reject") return;
          setRejectModalOpen(false);
          setDisputeToReject(null);
        }}
        onSubmit={(formData) => void submitRejectDispute(formData)}
      />
    </>
  );
}
