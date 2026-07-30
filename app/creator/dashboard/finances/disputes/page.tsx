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
  TrendingUp,
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
  payoutDate: string;
  totalEarnings: number;
  paidAmount: number;
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
  const paidAmount = parseMoneyValue(cp.paid_amount ?? fallback?.paid_amount);
  const remainingBalance = parseMoneyValue(cp.remaining_balance ?? fallback?.remaining_balance);

  return {
    id: dispute.dispute_code || (dispute.dispute_id ? `DIS-${dispute.dispute_id}` : "-"),
    disputeId: dispute.dispute_id || dispute.dispute_code || undefined,
    creatorEarningId: cp.creator_earning_id || fallback?.creator_earning_id || null,
    bookingId: formatShootId(bookingId),
    bookingIdRaw: bookingId,
    title: cp.shoot_name || fallback?.shoot_name || dispute.project?.name || `Shoot ${formatShootId(bookingId)}`,
    status: mapDisputeStatus(dispute.status),
    payoutStatus: fallback?.status_label || titleize(fallback?.status) || "Compensation Added",
    payoutDate: formatDate(fallback?.due_date || dispute.created_at),
    totalEarnings: compensationAmount,
    paidAmount,
    remainingBalance,
    finalPayout: compensationAmount,
    raisedBy: dispute.raised_by?.name || dispute.creator?.name || "You",
    raisedRole: "CP",
    category: buildIssueType(dispute.category),
    description: dispute.description || dispute.subject || "-",
  };
};

const mapDetails = (dispute: AdminFinanceDisputeDetailsApiRow, fallback?: CreatorDisputeItem): DisputeDetailsRecord => {
  const row = mapDisputeRow(dispute);
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
    },
    ...(fallback ? { raisedDate: fallback.payoutDate } : {}),
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
      const statusMatches = disputedStatus === "all" || dispute.status.toLowerCase().replace(/\s+/g, "_") === disputedStatus;
      const closedMatches = disputedStat === "all" ||
        (disputedStat === "active" && !["Resolved", "Rejected"].includes(dispute.status)) ||
        (disputedStat === "resolved" && ["Resolved", "Rejected"].includes(dispute.status));
      const searchMatches = !search || [
        dispute.id,
        dispute.bookingId,
        dispute.title,
        dispute.category,
      ].join(" ").toLowerCase().includes(search);
      return statusMatches && closedMatches && searchMatches;
    });
  }, [disputeItems, disputedStat, disputedStatus, searchQuery]);

  const shootOptions = useMemo(() => earnings
    .filter((earning) => !activeDisputeEarningIds.has(String(earning.creator_earning_id)))
    .map((earning) => ({
      creatorEarningId: earning.creator_earning_id,
      bookingId: earning.booking_id,
      label: `${formatShootId(earning.booking_id)} - ${earning.shoot_name || `Shoot #${earning.booking_id}`}`,
      amountLabel: formatCurrency(earning.total_compensation),
    })), [activeDisputeEarningIds, earnings]);

  const metrics = useMemo(() => {
    const totalAmount = disputes.reduce((sum, dispute) => sum + parseMoneyValue(dispute.disputed_amount), 0);
    const resolvedAmount = disputes
      .filter((dispute) => String(dispute.status || "").toLowerCase() === "resolved")
      .reduce((sum, dispute) => sum + parseMoneyValue(dispute.disputed_amount), 0);
    const pendingAmount = disputes
      .filter((dispute) => !["resolved", "rejected"].includes(String(dispute.status || "").toLowerCase()))
      .reduce((sum, dispute) => sum + parseMoneyValue(dispute.disputed_amount), 0);

    return [
      { id: "amount", label: "Total Dispute Amount", value: totalAmount, helper: "All CP disputes", icon: DollarSign },
      { id: "count", label: "Total Disputes Raised", value: disputes.length, helper: "Disputes submitted", icon: HandCoins, isCount: true },
      { id: "paid", label: "Paid Disputes", value: resolvedAmount, helper: "Resolved amount", icon: CheckCircle2 },
      { id: "pending", label: "Pending Dispute", value: pendingAmount, helper: "Open amount", icon: DollarSign },
    ];
  }, [disputes]);

  const handleRaiseDisputeSubmit = async (data: RaiseDisputeData) => {
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
      },
      created_at: dispute.payoutDate,
      raised_by: { type: "creator", name: dispute.raisedBy },
    }, dispute));

    try {
      const response = await financeTransactionsApi.getCreatorDisputeDetails(dispute.disputeId);
      setSelectedDispute(mapDetails(response.data, dispute));
    } catch (error) {
      console.error("Failed to fetch creator dispute details:", error);
    }
  };

  const completedBookings = earnings.filter((earning) => String(earning.status || "").toLowerCase() === "paid").length;
  const averageEarnings = earnings.length
    ? earnings.reduce((sum, earning) => sum + parseMoneyValue(earning.total_compensation), 0) / earnings.length
    : 0;

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

      <div className="overflow-hidden p-4 pb-12 text-white lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1800px] space-y-4 lg:space-y-8 bg-[#101010]">
          <div className="mb-3 flex items-center justify-between lg:mb-6">
            <div>
              <h1 className="text-base lg:text-3xl font-bold">Disputes</h1>
              <p className="text-xs lg:text-base text-white/60">Resolve payout disputes linked to your compensated shoots</p>
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

          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl mb-6">
            <div className="rounded-2xl border-[0.5px] border-[#3D3D3D] bg-[#101010] p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
                  <p className="font-medium text-sm lg:text-base">Dispute History</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Select value={disputedStatus} onValueChange={setDisputedStatus}>
                    <SelectTrigger className="w-[86px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectItem value="all">Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={disputedRange} onValueChange={setDisputedRange}>
                    <SelectTrigger className="w-[86px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={disputedStat} onValueChange={setDisputedStat}>
                    <SelectTrigger className="w-[64px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectValue placeholder="Stat" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-[#807E7E] text-[#C4C4C4]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by Dispute ID, Shoot ID, or Shoot Name..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-[#202020] border border-[#3D3D3D] rounded-lg py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E5D5B8] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3 p-6">
              {isLoading ? (
                <div className="rounded-2xl border border-[#262626] bg-[#0D0D0D] p-8 text-center text-sm text-white/55">Loading disputes...</div>
              ) : filteredDisputes.length === 0 ? (
                <div className="rounded-2xl border border-[#262626] bg-[#0D0D0D] p-8 text-center text-sm text-white/55">No CP disputes found.</div>
              ) : filteredDisputes.map((dispute) => (
                <div key={dispute.id} className={`rounded-2xl overflow-hidden bg-[#0D0D0D] ${expandedId === dispute.id ? "border-[0.5px] border-[#E8D1AB]" : "border-[0.5px] border-[#262626]"}`}>
                  <div
                    onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {expandedId === dispute.id ? <ChevronUp size={20} className="text-[#E8D1AB]" /> : <ChevronDown size={20} className="text-gray-400" />}
                      <div>
                        <div className="flex items-center gap-3 text-lg mb-1">
                          <h3 className="font-normal">{dispute.title}</h3>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                          <span>{dispute.bookingId}</span>
                          <span>•</span>
                          <AlertCircle size={14} className={dispute.status === "Resolved" ? "text-[#10B981]" : "text-[#EF4444]"} />
                          <span className={dispute.status === "Resolved" ? "text-[#10B981]" : "text-[#EF4444]"}>{dispute.status === "Resolved" ? "Resolved" : "Dispute Active"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-normal text-[#10B981]">{formatCurrency(dispute.finalPayout)}</p>
                      <p className="text-sm text-[#A0A0A0]">CP Compensation</p>
                    </div>
                  </div>

                  {expandedId === dispute.id && (
                    <div className="px-5 py-5 bg-[#0A0A0A]">
                      <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-2">
                        <div className="bg-[#141414] border border-[#262626] rounded-lg p-5">
                          <h4 className="text-base font-normal mb-4">Compensation Breakdown</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-base">
                              <span className="text-[#A0A0A0]">Total Compensation</span>
                              <span>{formatCurrency(dispute.totalEarnings)}</span>
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-[#A0A0A0]">Paid to You</span>
                              <span className="text-[#10B981]">{formatCurrency(dispute.paidAmount)}</span>
                            </div>
                            <div className="border-t-[0.5px] border-[#262626] pt-3 mt-3">
                              <div className="flex justify-between text-base">
                                <span className="font-normal">Remaining Balance</span>
                                <span className="font-normal text-xl text-[#E8D1AB]">{formatCurrency(dispute.remainingBalance)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-5">
                          <h4 className="text-base font-normal mb-4">Dispute Status</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-base text-[#A0A0A0]">Status</span>
                              {getStatusBadge(dispute.status)}
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-[#A0A0A0]">Created</span>
                              <span>{dispute.payoutDate}</span>
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-[#A0A0A0]">Reason</span>
                              <span>{dispute.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#EF4444]/5 border-[0.5px] border-[#EF4444]/20 rounded-lg p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="text-[#EF4444] mt-0.5" size={20} />
                            <div>
                              <h4 className="font-normal mb-1">Dispute: {dispute.id}</h4>
                              <p className="text-sm text-[#A0A0A0]">{dispute.description}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => void handleViewDetails(dispute)}
                            className="px-5 py-2.5 bg-[#E8D1AB] text-black rounded-lg font-medium text-sm hover:bg-[#F5EBD8] transition-colors"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-3.5 py-5 border-t border-[#3D3D3D] border-b-0 bg-[#101010]">
              <p className="text-sm text-gray-500">Showing {filteredDisputes.length} disputes</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-9 h-9 rounded-lg bg-[#E5D5B8] text-black font-medium text-sm">1</button>
                <button className="p-2 rounded-lg border border-[#3D3D3D] text-gray-400 hover:bg-[#1A1A1A] transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp size={20} className="text-[#10B981]" />
              <h2 className="text-base font-normal">Payment Summary</h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm text-[#A0A0A0] mb-1">Paid Compensation Rows</p>
                <p className="text-xl text-[#E8D1AB] font-normal">{String(completedBookings).padStart(2, "0")}</p>
              </div>
              <div>
                <p className="text-sm text-[#A0A0A0] mb-1">Average Compensation</p>
                <p className="text-xl text-[#E8D1AB] font-normal">{formatCurrency(averageEarnings)}</p>
              </div>
              <div>
                <p className="text-sm text-[#A0A0A0] mb-1">Eligible Shoots</p>
                <p className="text-xl text-[#E8D1AB] font-normal">{String(shootOptions.length).padStart(2, "0")}</p>
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
        />
      </div>
    </>
  );
}
