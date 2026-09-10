"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  DollarSign,
  HandCoins,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { disputeStatusStyles, type DisputeStatus } from "@/components/admin/finances/DisputeHistoryList";
import DisputeDetailsModal, { type DisputeDetailsRecord } from "@/components/creator-profile/DisputeDetailsModal";
import RaiseDisputeModal, { type RaiseDisputeData } from "@/components/creator-profile/RaiseDisputeModal";
import { getCreatorEarningsList } from "@/lib/api";
import { financeTransactionsApi, type AdminFinanceDisputeDetailsApiRow } from "@/lib/api/financeTransactions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { formatCurrency } from "@/lib/utils";

type CreatorEarningRow = {
  creator_earning_id: number | string;
  booking_id: number | string;
  shoot_name?: string | null;
  client_name?: string | null;
  event_date?: string | null;
  due_date?: string | null;
  status?: string | null;
  status_label?: string | null;
  total_compensation?: number | string | null;
  advance_paid?: number | string | null;
  paid_amount?: number | string | null;
  remaining_balance?: number | string | null;
  compensation_items?: Array<{ label?: string; amount?: number | string | null }>;
};

type CreatorDisputeItem = {
  id: string;
  disputeId?: string | number;
  creatorEarningId?: string | number | null;
  bookingId: string;
  bookingIdRaw: string | number;
  title: string;
  status: DisputeStatus;
  payoutStatus: string;
  createdAt: string;
  createdAtRaw: string | null;
  payoutDate: string;
  totalEarnings: number;
  paidAmount: number;
  extraAmount: number;
  remainingBalance: number;
  finalPayout: number;
  raisedBy: string;
  raisedRole: string;
  category: string;
  description: string;
};

const CATEGORY_BY_TYPE: Record<string, string> = {
  "Payment Not Received": "payment_delay",
  "Incorrect Amount": "payout_issues",
  Other: "other",
};

const DISPUTES_PER_PAGE = 10;

const titleize = (value: string | null | undefined) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

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

const mapDisputeStatus = (status: string | null | undefined): DisputeStatus => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "in_review") return "In Review";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "escalated") return "Escalated";
  return "Open";
};

const isSameLocalDate = (value: string | null | undefined, selectedDate: Date | null) => {
  if (!selectedDate) return true;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate()
  );
};

const isWithinRange = (value: string | null | undefined, range: string) => {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;

  if (range === "week") {
    start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "year") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  return date >= start && date <= end;
};

const getStatusBadge = (status: string) => {
  const direct = disputeStatusStyles[status as DisputeStatus];
  const className = direct || "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
      {status}
    </span>
  );
};

const buildIssueType = (category?: string | null) => {
  const labels: Record<string, string> = {
    payment_delay: "Payment Not Received",
    payout_issues: "Incorrect Amount",
    other: "Other",
  };
  return labels[String(category || "")] || titleize(category) || "Other";
};

const mapDisputeRow = (dispute: AdminFinanceDisputeDetailsApiRow, fallback?: CreatorEarningRow): CreatorDisputeItem => {
  const cp = dispute.cp_compensation || {};
  const bookingId = dispute.booking_id || cp.booking_id || fallback?.booking_id || "";
  const compensationAmount = parseMoneyValue(cp.total_compensation ?? dispute.disputed_amount ?? fallback?.total_compensation);
  const paidAmount = Math.max(parseMoneyValue(cp.paid_amount), parseMoneyValue(fallback?.paid_amount));
  const extraAmount = Math.max(paidAmount - compensationAmount, 0);
  const basePaidAmount = Math.max(paidAmount - extraAmount, 0);
  const remainingBalance = paidAmount > 0
    ? Math.max(compensationAmount - basePaidAmount, 0)
    : parseMoneyValue(cp.remaining_balance ?? fallback?.remaining_balance);

  return {
    id: dispute.dispute_code || (dispute.dispute_id ? `DIS-${dispute.dispute_id}` : "-"),
    disputeId: dispute.dispute_id || dispute.dispute_code || undefined,
    creatorEarningId: cp.creator_earning_id || fallback?.creator_earning_id || null,
    bookingId: formatShootId(bookingId),
    bookingIdRaw: bookingId,
    title: cp.shoot_name || fallback?.shoot_name || dispute.project?.name || `Shoot ${formatShootId(bookingId)}`,
    status: mapDisputeStatus(dispute.status),
    payoutStatus: fallback?.status_label || titleize(fallback?.status) || "Compensation Added",
    createdAt: formatDate(dispute.created_at),
    createdAtRaw: dispute.created_at || null,
    payoutDate: formatDate(fallback?.due_date || dispute.created_at),
    totalEarnings: compensationAmount,
    paidAmount,
    extraAmount,
    remainingBalance,
    finalPayout: Math.max(paidAmount, compensationAmount),
    raisedBy: dispute.raised_by?.name || dispute.creator?.name || "You",
    raisedRole: "CP",
    category: buildIssueType(dispute.category),
    description: dispute.description || dispute.subject || "-",
  };
};

const mapDetails = (dispute: AdminFinanceDisputeDetailsApiRow, fallback?: CreatorDisputeItem): DisputeDetailsRecord => {
  const apiRow = mapDisputeRow(dispute);
  const row = fallback ? {
    ...apiRow,
    totalEarnings: fallback.totalEarnings,
    paidAmount: fallback.paidAmount,
    extraAmount: fallback.extraAmount,
    remainingBalance: fallback.remainingBalance,
    finalPayout: fallback.finalPayout,
  } : apiRow;
  return {
    id: row.id,
    disputeId: dispute.dispute_id || row.disputeId,
    rawStatus: dispute.status || "open",
    shootId: row.bookingId,
    invoiceId: "-",
    category: row.category,
    description: row.description,
    raisedBy: row.raisedBy,
    raisedRole: "CP",
    raisedDate: formatDate(dispute.created_at),
    disputedAmount: formatCurrency(row.totalEarnings),
    payoutHold: formatCurrency(row.remainingBalance),
    status: row.status,
    bookingId: row.bookingId,
    createdAt: formatDate(dispute.created_at),
    timeline: (dispute.timeline || []).map((event) => ({
      title: titleize(event.action) || "Updated",
      by: event.performed_by?.name || (event.action === "created" ? row.raisedBy : "Admin"),
      at: formatDateTime(event.created_at),
      tone: event.to_status === "in_review" || event.to_status === "escalated" ? "review" as const : "warning" as const,
    })).concat((dispute.timeline || []).length ? [] : [{
      title: "Dispute Created",
      by: row.raisedBy,
      at: formatDateTime(dispute.created_at),
      tone: "warning" as const,
    }]),
    comments: (dispute.internal_comments || []).map((comment) => ({
      author: comment.created_by?.name || comment.created_by_creator?.name || "Admin",
      role: comment.created_by_creator ? "CP" as const : "Admin" as const,
      message: comment.body || "-",
      at: formatDateTime(comment.created_at),
    })),
    attachments: (dispute.attachments || []).map((attachment) => ({
      name: attachment.file_name || "Attachment",
      size: "",
      uploadedBy: attachment.uploaded_by?.name || row.raisedBy,
      uploadedAt: formatDateTime(attachment.created_at),
      url: attachment.file_url || null,
    })),
    compensation: {
      total: formatCurrency(row.totalEarnings),
      paid: formatCurrency(row.paidAmount),
      remaining: formatCurrency(row.remainingBalance),
      extra: row.extraAmount > 0 ? formatCurrency(row.extraAmount) : undefined,
    },
  };
};

export default function DisputesPage() {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMetric, setActiveMetric] = useState("amount");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [overviewRange, setOverviewRange] = useState("month");
  const [disputedRange, setDisputedRange] = useState("month");
  const [disputedStatus, setDisputedStatus] = useState("all");
  const [disputedStat, setDisputedStat] = useState("all");
  const [isRaiseDisputeOpen, setIsRaiseDisputeOpen] = useState(false);
  const [earnings, setEarnings] = useState<CreatorEarningRow[]>([]);
  const [disputes, setDisputes] = useState<AdminFinanceDisputeDetailsApiRow[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailsRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<"comment" | "attachment" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [earningsResponse, disputesResponse] = await Promise.all([
          getCreatorEarningsList({ page: 1, limit: 100, status: "all", search: "" }),
          financeTransactionsApi.listCreatorDisputes({ page: 1, limit: 100, sort_by: "created_at", sort_dir: "DESC" }),
        ]);
        if (isCancelled) return;
        setEarnings(earningsResponse?.data?.rows || []);
        setDisputes(disputesResponse.data?.rows || []);
      } catch (error) {
        console.error("Failed to fetch creator disputes:", error);
        if (!isCancelled) {
          setEarnings([]);
          setDisputes([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void fetchData();
    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  const earningById = useMemo(() => {
    const map = new Map<string, CreatorEarningRow>();
    earnings.forEach((earning) => map.set(String(earning.creator_earning_id), earning));
    return map;
  }, [earnings]);

  const activeDisputeEarningIds = useMemo(() => new Set(
    disputes
      .filter((dispute) => !["resolved", "rejected"].includes(String(dispute.status || "").toLowerCase()))
      .map((dispute) => String(dispute.cp_compensation?.creator_earning_id || ""))
      .filter(Boolean)
  ), [disputes]);

  const disputeItems = useMemo(() => disputes.map((dispute) => {
    const earning = earningById.get(String(dispute.cp_compensation?.creator_earning_id || ""));
    return mapDisputeRow(dispute, earning);
  }), [disputes, earningById]);

  const filteredDisputes = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return disputeItems.filter((dispute) => {
      const statusMatches =
        disputedStatus === "all" ||
        dispute.status.toLowerCase().replace(/\s+/g, "_") === disputedStatus;

      const closedMatches =
        disputedStat === "all" ||
        (disputedStat === "active" && !["Resolved", "Rejected"].includes(dispute.status)) ||
        (disputedStat === "resolved" && ["Resolved", "Rejected"].includes(dispute.status));

      const dateMatches = selectedDate
        ? isSameLocalDate(dispute.createdAtRaw, selectedDate)
        : isWithinRange(dispute.createdAtRaw, disputedRange);

      const searchMatches =
        !search ||
        [dispute.id, dispute.bookingId, dispute.title, dispute.category]
          .join(" ")
          .toLowerCase()
          .includes(search);

      return statusMatches && closedMatches && dateMatches && searchMatches;
    });
  }, [disputeItems, disputedRange, disputedStat, disputedStatus, searchQuery, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredDisputes.length / DISPUTES_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [disputedRange, disputedStat, disputedStatus, searchQuery, selectedDate]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * DISPUTES_PER_PAGE;
    return filteredDisputes.slice(start, start + DISPUTES_PER_PAGE);
  }, [currentPage, filteredDisputes]);

  const shootOptions = useMemo(() => earnings
    .filter((earning) => !activeDisputeEarningIds.has(String(earning.creator_earning_id)))
    .map((earning) => ({
      creatorEarningId: earning.creator_earning_id,
      bookingId: earning.booking_id,
      label: `${formatShootId(earning.booking_id)} - ${earning.shoot_name || `Shoot #${earning.booking_id}`}`,
      amountLabel: formatCurrency(earning.total_compensation),
    })), [activeDisputeEarningIds, earnings]);

  const metrics = useMemo(() => {
    const totalExtraAmount = disputeItems.reduce((sum, dispute) => sum + dispute.extraAmount, 0);
    const resolvedCount = disputeItems.filter((dispute) => dispute.status === "Resolved").length;
    const pendingCount = disputeItems.filter((dispute) => !["Resolved", "Rejected"].includes(dispute.status)).length;

    return [
      { id: "amount", label: "Total Dispute Amount", value: totalExtraAmount, helper: "Extra paid by admin", icon: DollarSign },
      { id: "count", label: "Total Disputes Raised", value: disputes.length, helper: "Disputes submitted", icon: HandCoins, isCount: true },
      { id: "resolved", label: "Resolved Disputes", value: resolvedCount, helper: "Disputes resolved", icon: CheckCircle2, isCount: true },
      { id: "pending", label: "Pending Dispute", value: pendingCount, helper: "Open disputes", icon: AlertCircle, isCount: true },
    ];
  }, [disputeItems, disputes.length]);

  const handleRaiseDisputeSubmit = async (data: RaiseDisputeData) => {
    const selectedShoot = shootOptions.find((shoot) => String(shoot.bookingId) === String(data.shootId));
    const payload = new FormData();
    payload.append("booking_id", data.shootId);
    if (data.creatorEarningId) payload.append("creator_earning_id", String(data.creatorEarningId));
    payload.append("category", CATEGORY_BY_TYPE[data.disputeType] || "other");
    payload.append("subject", data.disputeType);
    payload.append("description", data.description.trim());
    if (data.file) payload.append("attachments", data.file);

    const response = await financeTransactionsApi.createCreatorDispute(payload);
    const dispute = response.data;
    setRefreshKey((current) => current + 1);
    return {
      disputeId: dispute.dispute_code || (dispute.dispute_id ? `DIS-${dispute.dispute_id}` : "-"),
      bookingId: formatShootId(dispute.booking_id || data.shootId),
      shootLabel: selectedShoot?.label || formatShootId(dispute.booking_id || data.shootId),
      disputeType: data.disputeType,
      status: "Dispute Open",
    };
  };

  const handleViewDetails = async (dispute: CreatorDisputeItem) => {
    if (!dispute.disputeId) return;
    setSelectedDispute(mapDetails({
      dispute_id: dispute.disputeId,
      dispute_code: dispute.id,
      status: dispute.status.toLowerCase(),
      booking_id: dispute.bookingIdRaw,
      category: dispute.category,
      description: dispute.description,
      disputed_amount: dispute.totalEarnings,
      cp_compensation: {
        creator_earning_id: dispute.creatorEarningId,
        booking_id: dispute.bookingIdRaw,
        shoot_name: dispute.title,
        total_compensation: dispute.totalEarnings,
        paid_amount: dispute.paidAmount,
        remaining_balance: dispute.remainingBalance,
        extra_amount: dispute.extraAmount,
      },
      created_at: dispute.createdAtRaw || dispute.createdAt,
      raised_by: { type: "creator", name: dispute.raisedBy },
    }, dispute));

    try {
      const response = await financeTransactionsApi.getCreatorDisputeDetails(dispute.disputeId);
      setSelectedDispute(mapDetails(response.data, dispute));
    } catch (error) {
      console.error("Failed to fetch creator dispute details:", error);
    }
  };

  const refreshSelectedDispute = async (disputeId?: string | number) => {
    if (!disputeId) return;
    const response = await financeTransactionsApi.getCreatorDisputeDetails(disputeId);
    setSelectedDispute(mapDetails(response.data));
  };

  const handleAddComment = async (dispute: DisputeDetailsRecord, body: string) => {
    if (!dispute.disputeId) return;
    setActionLoading("comment");
    try {
      await financeTransactionsApi.addCreatorDisputeComment(dispute.disputeId, body);
      await refreshSelectedDispute(dispute.disputeId);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to add creator dispute comment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAttachment = async (dispute: DisputeDetailsRecord, files: File[]) => {
    if (!dispute.disputeId || !files.length) return;
    setActionLoading("attachment");
    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("attachments", file));
      await financeTransactionsApi.addCreatorDisputeAttachment(dispute.disputeId, payload);
      await refreshSelectedDispute(dispute.disputeId);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      console.error("Failed to add creator dispute attachment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button
            onClick={() => setIsRaiseDisputeOpen(true)}
            className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
          >
            Raise New Dispute
          </Button>
        }
      />

      <div
        className={`mx-4 lg:mx-8 mt-6 mb-20 rounded-2xl transition-all duration-700 overflow-hidden ${
          isDark
            ? "bg-[#0A0A0A] border border-[#E8D1AB]/30 shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]"
            : "bg-white border border-zinc-200 shadow-sm"
        }`}
      >
        <div className={`p-8 lg:p-16 space-y-8 lg:space-y-12 pb-24 ${isDark ? "text-white" : "text-[#202020]"}`}>
        <div className="mx-auto w-full max-w-[1800px] space-y-4 lg:space-y-8">
          <div className="mb-3 flex items-center justify-between lg:mb-6">
            <div>
              <h1 className="text-base lg:text-3xl font-bold">Disputes</h1>
              <p className={`text-xs lg:text-base ${isDark ? "text-white/60" : "text-[#202020]/60"}`}>Resolve payout disputes linked to your compensated shoots</p>
            </div>
            <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>

          <div className={`transition-colors duration-300 border rounded-2xl p-4 lg:p-5 w-full mt-5 lg:mt-9 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
            <div className="flex justify-between items-center mb-5 lg:mb-8">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
                <p className="font-medium text-sm lg:text-base">Overview</p>
              </div>
              <Select value={overviewRange} onValueChange={setOverviewRange}>
                <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 rounded-xl p-3 lg:p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
              {metrics.map((metric) => {
                const isActive = activeMetric === metric.id;
                return (
                  <button
                    key={metric.id}
                    type="button"
                    onClick={() => setActiveMetric(metric.id)}
                    className={`relative text-left rounded-lg p-4 border transition-all duration-200 ${isActive ? "bg-[#ECD7B4] text-[#171717] border-transparent" : (isDark ? "bg-[#101010] text-white border-transparent hover:border-white/30" : "bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]")}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-sm font-medium ${isActive ? "text-black/70" : (isDark ? "text-zinc-400" : "text-zinc-500")}`}>{metric.label}</span>
                      <div className={`p-2 rounded-full ${isActive ? "bg-[#171717] text-[#E8D1AB]" : (isDark ? "bg-[#2C2C2C] text-[#E8D1AB]" : "bg-white text-[#E8D1AB]")}`}>
                        <metric.icon size={20} />
                      </div>
                    </div>
                    <div className="text-2xl lg:text-[26px] font-bold mb-2">
                      {isLoading ? <div className={`h-8 w-12 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} /> : metric.isCount ? metric.value : formatCurrency(metric.value)}
                    </div>
                    <p className={`text-xs ${isActive ? "text-[#101010]/70" : (isDark ? "text-white/70" : "text-zinc-500")}`}>{metric.helper}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`mb-6 overflow-hidden rounded-2xl border transition-colors duration-300 ${
              isDark
                ? "border-[#3D3D3D] bg-[#171717]"
                : "border-[#E5E5E5] bg-white"
            }`}
          >
            <div
              className={`border-b p-4 transition-colors duration-300 lg:p-6 ${
                isDark
                  ? "border-[#3D3D3D] bg-[#101010]"
                  : "border-[#E5E5E5] bg-[#FAFAFA]"
              }`}
            >
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
                  <p className="text-sm font-medium lg:text-base">Dispute History</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Select value={disputedStatus} onValueChange={setDisputedStatus}>
                    <SelectTrigger
                      className={`h-9 w-[94px] rounded-full text-[10px] focus:ring-0 lg:text-xs ${
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#D8D8D8] bg-white text-[#555555]"
                      }`}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#E3E3E3] bg-white text-[#323232]"
                      }
                    >
                      <SelectItem value="all">Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={disputedRange} onValueChange={setDisputedRange}>
                    <SelectTrigger
                      className={`h-9 w-[94px] rounded-full text-[10px] focus:ring-0 lg:text-xs ${
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#D8D8D8] bg-white text-[#555555]"
                      }`}
                    >
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#E3E3E3] bg-white text-[#323232]"
                      }
                    >
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={disputedStat} onValueChange={setDisputedStat}>
                    <SelectTrigger
                      className={`h-9 w-[78px] rounded-full text-[10px] focus:ring-0 lg:text-xs ${
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#D8D8D8] bg-white text-[#555555]"
                      }`}
                    >
                      <SelectValue placeholder="Stat" />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        isDark
                          ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4]"
                          : "border-[#E3E3E3] bg-white text-[#323232]"
                      }
                    >
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                    isDark ? "text-gray-500" : "text-zinc-400"
                  }`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by Dispute ID, Shoot ID, or Shoot Name..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={`w-full rounded-lg border py-3 pl-12 pr-4 text-sm transition-colors focus:border-[#E5D5B8] focus:outline-none ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#202020] text-white placeholder:text-gray-500"
                      : "border-[#DADADA] bg-white text-[#202020] placeholder:text-zinc-400"
                  }`}
                />
              </div>
            </div>

            <div
              className={`space-y-3 p-4 transition-colors duration-300 lg:p-6 ${
                isDark ? "bg-[#171717]" : "bg-white"
              }`}
            >
              {isLoading ? (
                <div
                  className={`rounded-2xl border p-8 text-center text-sm ${
                    isDark
                      ? "border-[#262626] bg-[#0D0D0D] text-white/55"
                      : "border-[#E5E5E5] bg-[#FAFAFA] text-zinc-500"
                  }`}
                >
                  Loading disputes...
                </div>
              ) : filteredDisputes.length === 0 ? (
                <div
                  className={`rounded-2xl border p-8 text-center text-sm ${
                    isDark
                      ? "border-[#262626] bg-[#0D0D0D] text-white/55"
                      : "border-[#E5E5E5] bg-[#FAFAFA] text-zinc-500"
                  }`}
                >
                  No CP disputes found.
                </div>
              ) : (
                paginatedDisputes.map((dispute) => {
                  const isExpanded = expandedId === dispute.id;

                  return (
                    <div
                      key={dispute.id}
                      className={`overflow-hidden rounded-2xl border-[0.5px] transition-colors duration-300 ${
                        isExpanded
                          ? "border-[#E8D1AB]"
                          : isDark
                            ? "border-[#262626]"
                            : "border-[#E2E2E2]"
                      } ${isDark ? "bg-[#0D0D0D]" : "bg-white"}`}
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                        className={`flex cursor-pointer flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between lg:p-5 ${
                          isDark ? "hover:bg-[#1A1A1A]" : "hover:bg-[#F7F7F7]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {isExpanded ? (
                            <ChevronUp size={20} className="shrink-0 text-[#E8D1AB]" />
                          ) : (
                            <ChevronDown
                              size={20}
                              className={`shrink-0 ${isDark ? "text-gray-400" : "text-zinc-500"}`}
                            />
                          )}

                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-3 text-base lg:text-lg">
                              <h3 className="truncate font-normal">{dispute.title}</h3>
                              {getStatusBadge(dispute.status)}
                            </div>

                            <div
                              className={`flex flex-wrap items-center gap-2 text-sm ${
                                isDark ? "text-[#A0A0A0]" : "text-zinc-500"
                              }`}
                            >
                              <span>{dispute.bookingId}</span>
                              <span>•</span>
                              <AlertCircle
                                size={14}
                                className={
                                  dispute.status === "Resolved"
                                    ? "text-[#10B981]"
                                    : "text-[#EF4444]"
                                }
                              />
                              <span
                                className={
                                  dispute.status === "Resolved"
                                    ? "text-[#10B981]"
                                    : "text-[#EF4444]"
                                }
                              >
                                {dispute.status === "Resolved" ? "Resolved" : "Dispute Active"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xl font-normal text-[#10B981] lg:text-2xl">
                            {formatCurrency(dispute.finalPayout)}
                          </p>
                          <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-zinc-500"}`}>
                            CP Compensation
                          </p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          className={`border-t px-4 py-5 transition-colors lg:px-5 ${
                            isDark
                              ? "border-[#262626] bg-[#0A0A0A]"
                              : "border-[#E5E5E5] bg-[#FAFAFA]"
                          }`}
                        >
                          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div
                              className={`rounded-lg border p-5 ${
                                isDark
                                  ? "border-[#262626] bg-[#141414]"
                                  : "border-[#E5E5E5] bg-white"
                              }`}
                            >
                              <h4 className="mb-4 text-base font-normal">Compensation Breakdown</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between gap-4 text-base">
                                  <span className={isDark ? "text-[#A0A0A0]" : "text-zinc-500"}>
                                    Total Compensation
                                  </span>
                                  <span>{formatCurrency(dispute.totalEarnings)}</span>
                                </div>

                                <div className="flex justify-between gap-4 text-base">
                                  <span className={isDark ? "text-[#A0A0A0]" : "text-zinc-500"}>
                                    Paid to You
                                  </span>
                                  <span className="text-[#10B981]">
                                    {formatCurrency(dispute.paidAmount)}
                                  </span>
                                </div>

                                {dispute.extraAmount > 0 ? (
                                  <div className="flex justify-between gap-4 text-base">
                                    <span className={isDark ? "text-[#A0A0A0]" : "text-zinc-500"}>
                                      Extra Due to Dispute
                                    </span>
                                    <span className={isDark ? "text-[#7DB0FF]" : "text-[#3B75C7]"}>
                                      {formatCurrency(dispute.extraAmount)}
                                    </span>
                                  </div>
                                ) : null}

                                <div
                                  className={`mt-3 border-t-[0.5px] pt-3 ${
                                    isDark ? "border-[#262626]" : "border-[#E5E5E5]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4 text-base">
                                    <span className="font-normal">Remaining Balance</span>
                                    <span
                                      className={`text-xl font-normal ${
                                        isDark ? "text-[#E8D1AB]" : "text-[#9C7A45]"
                                      }`}
                                    >
                                      {formatCurrency(dispute.remainingBalance)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`rounded-xl border p-5 ${
                                isDark
                                  ? "border-[#2A2A2A] bg-[#171717]"
                                  : "border-[#E5E5E5] bg-white"
                              }`}
                            >
                              <h4 className="mb-4 text-base font-normal">Dispute Status</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                  <span
                                    className={`text-base ${
                                      isDark ? "text-[#A0A0A0]" : "text-zinc-500"
                                    }`}
                                  >
                                    Status
                                  </span>
                                  {getStatusBadge(dispute.status)}
                                </div>

                                <div className="flex justify-between gap-4 text-base">
                                  <span className={isDark ? "text-[#A0A0A0]" : "text-zinc-500"}>
                                    Created
                                  </span>
                                  <span>{dispute.createdAt}</span>
                                </div>

                                <div className="flex justify-between gap-4 text-base">
                                  <span className={isDark ? "text-[#A0A0A0]" : "text-zinc-500"}>
                                    Reason
                                  </span>
                                  <span className="text-right">{dispute.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border-[0.5px] border-[#EF4444]/20 bg-[#EF4444]/5 p-5">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                              <div className="flex min-w-0 items-start gap-3">
                                <AlertCircle className="mt-0.5 shrink-0 text-[#EF4444]" size={20} />
                                <div className="min-w-0">
                                  <h4 className="mb-1 font-normal">Dispute: {dispute.id}</h4>
                                  <p
                                    className={`break-words text-sm ${
                                      isDark ? "text-[#A0A0A0]" : "text-zinc-600"
                                    }`}
                                  >
                                    {dispute.description}
                                  </p>
                                </div>
                              </div>

                              <Button
                                onClick={() => void handleViewDetails(dispute)}
                                className="shrink-0 rounded-lg bg-[#E8D1AB] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#F5EBD8]"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div
              className={`flex flex-col gap-4 border-t px-3.5 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                isDark
                  ? "border-[#3D3D3D] bg-[#101010]"
                  : "border-[#E5E5E5] bg-[#FAFAFA]"
              }`}
            >
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-zinc-500"}`}>
                {filteredDisputes.length === 0
                  ? "Showing 0 to 0 of 0"
                  : `Showing ${(currentPage - 1) * DISPUTES_PER_PAGE + 1} to ${Math.min(
                      currentPage * DISPUTES_PER_PAGE,
                      filteredDisputes.length,
                    )} of ${filteredDisputes.length}`}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                  className={`rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? "border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A]"
                      : "border-[#D8D8D8] bg-white text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="h-9 w-9 rounded-lg bg-[#E5D5B8] text-sm font-medium text-black"
                >
                  {currentPage}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isDark
                      ? "border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A]"
                      : "border-[#D8D8D8] bg-white text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <RaiseDisputeModal
          open={isRaiseDisputeOpen}
          onOpenChange={setIsRaiseDisputeOpen}
          onSubmit={handleRaiseDisputeSubmit}
          shootOptions={shootOptions}
        />

        <DisputeDetailsModal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          dispute={selectedDispute}
          onAddComment={(dispute, body) => void handleAddComment(dispute, body)}
          onAddAttachment={(dispute, files) => void handleAddAttachment(dispute, files)}
          actionLoading={Boolean(actionLoading)}
        />
        </div>
      </div>
    </>
  );
}