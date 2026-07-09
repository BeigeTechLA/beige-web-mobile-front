"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, CheckCircle2, Edit3, XCircle, Clock } from "lucide-react";
import { ShootCPRow } from "@/components/admin/finances/CPPayoutTable";
import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { normalizeCpRoleLabel, type CpCompensationDetails } from "@/lib/api/cpCompensation";

interface CompensationItem {
  id: string;
  name: string;
  role: string;
  approvalStatus?: string;
  earningStatus?: string;
  paidTotal?: number;
  remainingBalance?: number;
  total: number;
  base: number;
  editing: number;
  travel: number;
  bonus: number;
  hasPendingAdvance?: boolean;
  advanceAmount?: number;
  advanceDate?: string;
}

type AuditEntry = {
  id: string;
  label: string;
  subLabel?: string | null;
  date?: string | null;
  dedupeKey: string;
};

const isPaymentEvent = (value?: string | null) => String(value || "").includes("payment");
const isFinanceApprovalTimelineEvent = (value?: string | null) => String(value || "") === "awaiting_finance_approval";

const getPaymentAmountFromText = (value?: string | null) => {
  const match = String(value || "").match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
};

const getAuditMinuteBucket = (value?: string | null) => {
  if (!value) return "no-date";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return String(value);

  return String(Math.floor(timestamp / 60000));
};

const normalizeAuditText = (value?: string | null) => String(value || "").trim().toLowerCase();

interface CompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowContext: ShootCPRow | null;
  details?: CpCompensationDetails | null;
  loading?: boolean;
  onModifyClick: (creatorEarningIds?: number[]) => void;
  onApproveClick: (creatorEarningIds?: number[]) => void;
  onRejectClick: (creatorEarningIds?: number[]) => void;
  onPaymentClick?: (creatorEarningId: number) => void;
}

export default function CompensationModal({
  isOpen,
  onClose,
  rowContext,
  details,
  loading = false,
  onModifyClick,
  onApproveClick,
  onRejectClick,
  onPaymentClick
}: CompensationModalProps) {
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  const { isDark } = useResolvedTheme()
  const compensationList: CompensationItem[] = useMemo(() => (details?.creators || []).map((creator) => {
    const itemAmount = (label: string) => creator.compensation_items.find((item) => item.label === label)?.amount || 0;
    const pendingAdvance = creator.advances?.find((advance) => !["processed", "paid", "completed"].includes(String(advance.status || "").toLowerCase()));
    return {
      id: String(creator.creator_earning_id),
      name: creator.creator_name || "Unknown Creator",
      role: normalizeCpRoleLabel(creator.cp_role) || "Creative Partner",
      approvalStatus: creator.approval_status,
      earningStatus: creator.earning_status,
      paidTotal: creator.paid_total,
      remainingBalance: creator.remaining_balance,
      total: creator.total_compensation,
      base: itemAmount("Base Payout"),
      editing: itemAmount("Editing Payout"),
      travel: itemAmount("Travel Adjustment"),
      bonus: itemAmount("Bonus/Other Adjustment"),
      hasPendingAdvance: Boolean(pendingAdvance),
      advanceAmount: pendingAdvance?.amount,
      advanceDate: pendingAdvance?.processed_at || undefined,
    };
  }), [details?.creators]);

  const auditEntries: AuditEntry[] = useMemo(() => {
    const logs: AuditEntry[] = [
      ...(details?.audit_logs || [])
        .filter((log) => !isPaymentEvent(log.action))
        .map((log) => {
          const label = log.label || log.action || "Finance activity";
          const subLabel = log.notes || null;

          return {
            id: `audit-${log.action}-${log.created_at || ""}`,
            label,
            subLabel,
            date: log.created_at,
            dedupeKey: [
              "audit",
              normalizeAuditText(label),
              normalizeAuditText(subLabel),
              getAuditMinuteBucket(log.created_at),
            ].join("|"),
          };
        }),
      ...(details?.creators || []).flatMap((creator) =>
        (creator.timeline || [])
          .filter((event) => !isFinanceApprovalTimelineEvent(event.event_type))
          .map((event) => {
            const paymentAmount = Number(event.amount) || getPaymentAmountFromText(event.sub_label);
            const isPayment = isPaymentEvent(event.event_type);
            const label = isPayment ? "Payment Processed" : event.label || event.event_type || "Finance activity";
            const subLabel = isPayment
              ? `Paid to ${creator.creator_name || "Unknown Creator"}${paymentAmount ? ` - ${formatCurrency(paymentAmount)}` : ""}`
              : event.sub_label || creator.creator_name || null;

            return {
              id: `timeline-${creator.creator_earning_id}-${event.timeline_event_id || event.event_type || ""}-${event.sort_order || ""}-${event.event_date || ""}`,
              label,
              subLabel,
              date: event.event_date,
              dedupeKey: [
                isPayment ? "payment" : "timeline",
                creator.creator_earning_id,
                normalizeAuditText(event.event_type),
                isPayment ? Number(paymentAmount || 0).toFixed(2) : normalizeAuditText(label),
                getAuditMinuteBucket(event.event_date),
              ].join("|"),
            };
          })
      ),
    ];

    const seen = new Set<string>();

    return logs
      .filter((entry) => entry.label)
      .filter((entry) => {
        if (seen.has(entry.dedupeKey)) return false;
        seen.add(entry.dedupeKey);
        return true;
      })
      .sort((a, b) => {
        const left = a.date ? new Date(a.date).getTime() : 0;
        const right = b.date ? new Date(b.date).getTime() : 0;
        return left - right;
      });
  }, [details]);

  useEffect(() => {
    setSelectedCreators(compensationList.map((creator) => creator.id));
  }, [compensationList]);

  if (!isOpen || !rowContext) return null;

  const hasPendingApproval = compensationList.some((creator) => creator.approvalStatus === "pending_approval");

  const formatAuditDate = (value?: string | null) => {
    if (!value) return "Date not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedCreators((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getSelectedCreatorIds = () => selectedCreators.map(Number).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-4 lg:p-0">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Over Drawer Container Panel */}
      <div className={`relative h-full w-full lg:max-w-3xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>
        {/* Header Block Section */}
        <div className="sticky top-0 inset-x-0 flex items-start justify-between p-5 lg:px-9 lg:py-10 bg-[#000000]  border-b border-[#CACACA]">
          <div className="flex flex-col gap-1.5 lg:gap-4">
            <h2 className="text-lg lg:text-3xl font-bold tracking-tight">
              {rowContext.shootName || "Corporate Shoot"}
            </h2>
            <p className="text-sm lg:text-base text-white/50 font-normal capitalize">
              {rowContext.category || "Videography"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 lg:p-4 rounded-full bg-[#2B2626] text-white transition-colors"
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="space-y-3 lg:space-y-5 p-5 lg:p-9">
          {loading && (
            <div className="rounded-lg border border-[#3D3D3D] bg-[#171717] p-4 text-sm text-white/60">
              Loading compensation details...
            </div>
          )}
          {/* Quick Statistics Horizontal Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Total CP Payout</p>
              <p className="text-lg lg:text-2xl font-bold text-[#83B7FA] mt-0.5 lg:mt-1">
                {formatCurrency(rowContext.cpPayout || 12500)}
              </p>
            </div>
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Shoot Amount</p>
              <p className="text-lg lg:text-2xl font-bold text-[#C97DFF] mt-0.5 lg:mt-1">
                {formatCurrency(rowContext.shootBudget || 50000)}
              </p>
            </div>
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-lg p-2.5 lg:p-4">
              <p className="text-sm text-white">Margin</p>
              <p className="text-lg lg:text-2xl font-bold text-[#10B981] mt-0.5 lg:mt-1">
                {rowContext.margin || "18.5"}%
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 lg:space-y-5 bg-[#171717] border border-[#3D3D3D] rounded-lg p-3 lg:p-4">
            {/* Dynamic Itemization List Module */}
            <div className="space-y-3">
              <h3 className="lg:text-lg text-white text-semibold capitalize">
                Compensation Breakdown ({selectedCreators.length} Selected)
              </h3>

              <div className="space-y-4 ">
                {!loading && compensationList.length === 0 && (
                  <div className="rounded-lg border border-[#FFFFFF33] bg-[#141414] p-4 text-sm text-white/60">
                    No compensation records found for this shoot.
                  </div>
                )}
                {compensationList.map((creator) => {
                  const isChecked = selectedCreators.includes(creator.id);
                  const isPendingApproval = creator.approvalStatus === "pending_approval";
                  const isApproved = creator.approvalStatus === "approved";
                  const remainingBalance = Number(creator.remainingBalance);
                  const isPaid = creator.earningStatus === "paid" || (isApproved && Number.isFinite(remainingBalance) && remainingBalance <= 0);
                  const canRecordPayment = isApproved && !isPaid && (!Number.isFinite(remainingBalance) || remainingBalance > 0);
                  return (
                    <div
                      key={creator.id}
                      className={`flex gap-3 border rounded-lg p-3 lg:p-4 bg-[#141414] transition-all ${isChecked ? "border-[#E8D1AB]" : "border-[#FFFFFF33]"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(creator.id)}
                        className="hidden lg:block mt-1 h-4 w-4 rounded border-black bg-black text-[#E8D1AB] focus:ring-0 focus:ring-offset-0 accent-[#E8D1AB]"
                      />

                      <div className="space-y-2 lg:space-y-4 w-full">
                        {/* Header Row Line item info */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                             <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(creator.id)}
                        className="lg:hidden block mt-1 h-4 w-4 rounded border-black bg-black text-[#E8D1AB] focus:ring-0 focus:ring-offset-0 accent-[#E8D1AB]"
                      />
                            <div>
                              <h4 className="text-sm lg:text-base font-medium text-[#E8D1AB]">
                                {creator.name}
                              </h4>
                              <p className="text-xs lg:text-sm text-white">{creator.role}</p>
                            </div>
                          </div>
                          <span className="lg:text-xl font-bold text-[#E8D1AB]">
                            {formatCurrency(creator.total)}
                          </span>
                        </div>

                        {/* Financial Metric Allocation Subgrid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 py-2.5 lg:py-4 border-y border-[#FFFFFF33] text-left">
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Base Payout</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.base)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Editing Payout</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.editing)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Travel Adjustment</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.travel)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm text-white/50">Bonus</p>
                            <p className="text-xs lg:text-sm text-white font-medium">
                              {formatCurrency(creator.bonus)}
                            </p>
                          </div>
                        </div>

                        {/* Context Notice Alert Safeguard */}
                        <div className="text-xs text-[#E8D1AB] bg-[#211F1C] font-medium rounded-lg p-3 w-fit">
                          {isPaid ? "Payment completed" : isApproved ? "Approved by finance. Ready for payment." : isPendingApproval ? "Note : Select and Approve to Enable Payment" : "No finance action available"}
                        </div>
                        {(isPaid || Number(creator.paidTotal || 0) > 0) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-[#10B98166] bg-[#10B9811A] px-3 py-1 font-medium text-[#34D399]">
                              Paid {formatCurrency(creator.paidTotal || creator.total)}
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/70">
                              Remaining {formatCurrency(Math.max(Number(creator.remainingBalance || 0), 0))}
                            </span>
                          </div>
                        )}

                        {/* Pre-Shoot Advance Section Drawer */}
                        {creator.hasPendingAdvance && (
                          <div className="space-y-3">
                            <div className="flex flex-col lg:flex-row items-start gap-2 lg:items-center lg:justify-between bg-[#FFFBEB] rounded-lg p-3">
                              <div className="text-xs lg:text-sm">
                                <p className="font-medium text-[#7B3306]">
                                  Approval Pending for the Advance Payment
                                </p>
                                <p className="text-[#BB4D00]">
                                  {formatCurrency(creator.advanceAmount || 0)} on {creator.advanceDate ? new Date(creator.advanceDate).toLocaleDateString() : "Pending date"}
                                </p>
                              </div>
                              <span className="text-sm lg:text-base font-semibold text-[#BA6605] bg-[#FACD9A] px-5 py-3 rounded-full">
                                Pre-shoot advance
                              </span>
                            </div>

                            <button className="w-full h-12 rounded-lg flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                              <CheckCircle2 size={16} />
                              Pay Advance Amount
                            </button>
                          </div>
                        )}

                        {/* Context Action Button Panel inside individual active items */}
                        {!creator.hasPendingAdvance && isChecked && isPendingApproval && (
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => onApproveClick([Number(creator.id)])}
                              className="lg:hidden flex h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                              <CheckCircle2 size={16} /> Approve
                            </button>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:mt-4 animate-in fade-in duration-150">
                              <button
                                onClick={() => onApproveClick([Number(creator.id)])}
                                className="hidden lg:flex h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                onClick={() => onModifyClick([Number(creator.id)])}
                                className="h-12 rounded-lg  flex items-center justify-center gap-1.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white font-semibold text-sm">
                                <Edit3 size={16} /> Modify
                              </button>
                              <button
                                onClick={() => onRejectClick([Number(creator.id)])}
                                className="h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-sm">
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                        {isChecked && canRecordPayment && (
                          <button
                            onClick={() => onPaymentClick?.(Number(creator.id))}
                            className="h-12 min-w-[180px] px-5 rounded-lg inline-flex items-center justify-center gap-2 bg-[#9810FA] hover:bg-[#9810FA]/90 text-white font-semibold text-sm whitespace-nowrap"
                          >
                            <CheckCircle2 size={16} /> Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Margin Analysis Data Grid Section */}
          <div className="flex-1 space-y-2 lg:space-y-4 bg-[#171717] border border-[#3D3D3D] rounded-lg p-4">
            <h3 className="lg:text-lg text-white text-semibold capitalize">
              Margin Analysis
            </h3>
            <div className="space-y-3 text-sm lg:text-base">
              <div className="flex justify-between items-center text-white/40">
                <span>Shoot Budget</span>
                <span className="font-semibold text-zinc-100">
                  {formatCurrency(rowContext.shootBudget || 50000)}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/40">
                <span>Total CP Payout</span>
                <span className="font-semibold text-zinc-100">
                  -{formatCurrency(rowContext.cpPayout || 12500)}
                </span>
              </div>
              <div className="w-full h-px border-b border-white/30" />
              <div className="flex justify-between items-center font-medium">
                <span className="text-white">Margin</span>
                <span className="text-[#E8D1AB] font-bold">
                  {formatCurrency((rowContext.shootBudget || 50000) - (rowContext.cpPayout || 12500))} ({rowContext.margin || "18.5"}%)
                </span>
              </div>
            </div>
          </div>

          {/* Audit Ledger Traces Trail */}
          <div className="flex-1 space-y-2 lg:space-y-4 bg-[#171717] border border-[#3D3D3D] rounded-lg p-4">
            <h3 className="lg:text-lg text-white text-semibold capitalize">
              Audit Log
            </h3>
            {auditEntries.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#141414] p-3 text-xs lg:text-sm text-white/50">
                No audit activity recorded yet.
              </div>
            ) : (
              auditEntries.map((entry, index) => (
                <div key={`${entry.id}-${index}`} className="flex items-start gap-3 text-xs lg:text-sm">
                  <Clock size={20} className="text-[#99A1AF] shrink-0" />
                  <div className="flex-1 flex flex-col lg:flex-row justify-between gap-1 lg:gap-4">
                    <div>
                      <span className="text-white">{entry.label}</span>
                      {entry.subLabel && <p className="mt-0.5 text-xs text-white/45">{entry.subLabel}</p>}
                    </div>
                    <span className="text-white/50 whitespace-nowrap text-xs">{formatAuditDate(entry.date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Persistent Base Sticky Double Action Control Drawer */}
        {hasPendingApproval && (
          <div className="sticky bottom-0 inset-x-0 bg-[#0C0C0C] p-5 lg:p-9 flex flex-col gap-3 z-10 mt-auto">
            <button
                onClick={() => onApproveClick(getSelectedCreatorIds())}
                className="h-12 rounded-lg lg:hidden flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                <CheckCircle2 size={16} /> Approve All
              </button>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              <button
                onClick={() => onApproveClick(getSelectedCreatorIds())}
                className="h-12 rounded-lg hidden lg:flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-semibold text-sm transition-colors">
                <CheckCircle2 size={16} /> Approve All
              </button>
              <button
                onClick={() => onModifyClick(getSelectedCreatorIds())}
                className="h-12 rounded-lg  flex items-center justify-center gap-1.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white font-semibold text-sm">
                <Edit3 size={16} /> Modify
              </button>
              <button
                onClick={() => onRejectClick(getSelectedCreatorIds())}
                className="h-12 rounded-lg flex items-center justify-center gap-1.5 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-sm">
                <XCircle size={16} /> Reject All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
