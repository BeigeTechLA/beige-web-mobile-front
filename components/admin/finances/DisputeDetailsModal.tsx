"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  CircleX,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Send,
  ShieldAlert,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

import {
  disputeStatusStyles,
  type DisputeHistoryItem,
} from "@/components/admin/finances/DisputeHistoryList";

type DisputeTimelineEvent = {
  id?: string | number | null;
  title: string;
  by: string;
  at: string;
  tone: "warning" | "review" | "resolved";
};

type DisputeComment = {
  author: string;
  role?: string;
  message: string;
  at: string;
};

type DisputeAttachment = {
  name: string;
  url?: string | null;
  uploadedBy?: string;
  uploadedAt?: string;
  attachmentType?: string | null;
};

export type DisputeDetailsRecord = DisputeHistoryItem & {
  createdAt: string;
  payoutNote: string;
  hideImpactedPayout?: boolean;
  invoiceUrl?: string | null;
  timeline: DisputeTimelineEvent[];
  internalComments: DisputeComment[];
  attachments?: DisputeAttachment[];
  resolutionProofs?: DisputeAttachment[];
  compensationSummary?: {
    label: string;
    details: Array<{ label: string; value: string }>;
  } | null;
  resolutionSummary?: {
    label: string;
    details: Array<{ label: string; value: string }>;
  } | null;
};

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeDetailsRecord | null;
  actionLoading?: "review" | "resolve" | "reject" | "escalate" | "comment" | "attachment" | null;
  onMarkInReview?: (dispute: DisputeDetailsRecord) => void;
  onResolve?: (dispute: DisputeDetailsRecord) => void;
  onReject?: (dispute: DisputeDetailsRecord) => void;
  // onEscalate?: (dispute: DisputeDetailsRecord) => void;
  onAddComment?: (dispute: DisputeDetailsRecord, body: string) => void;
  onAddAttachment?: (dispute: DisputeDetailsRecord, files: File[]) => void;
  onOpenInvoice?: (dispute: DisputeDetailsRecord) => void;
}

const timelineStyles: Record<
  DisputeTimelineEvent["tone"],
  { icon: React.ReactNode; ring: string; iconColor: string }
> = {
  warning: {
    icon: <AlertTriangle size={16} />,
    ring: "border-[#6B542C] bg-[#2C2419]",
    iconColor: "text-[#D4971B]",
  },
  review: {
    icon: <Clock3 size={16} />,
    ring: "border-[#2A4C7A] bg-[#17263D]",
    iconColor: "text-[#4F93FF]",
  },
  resolved: {
    icon: <CheckCircle2 size={16} />,
    ring: "border-[#1F5B49] bg-[#10352A]",
    iconColor: "text-[#22C55E]",
  },
};

const isResolutionProof = (file: DisputeAttachment) =>
  file.attachmentType === "refund_proof" || file.attachmentType === "payout_proof";

function DetailCard({
  icon,
  label,
  value,
  helperText,
  className = "",
  valueClassName = "",
  isDark = true
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helperText?: string;
  className?: string;
  valueClassName?: string;
  isDark?: boolean;
}) {
  const finalContainerClass = className
    ? className
    : (isDark ? "bg-[#1F1F1F] border-white/10 text-white" : "bg-[#F5F5F5] border-black/10 text-black");

  // If no explicit valueClassName is passed, apply default weight and color
  const finalValueClass = valueClassName
    ? valueClassName
    : (isDark ? "text-white" : "text-black");

  return (
    <div className={`rounded-lg border ${finalContainerClass} p-3`}>
      <div className={`mb-1 flex items-center gap-2 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`text-lg lg:text-xl leading-tight ${finalValueClass}`}>{value}</p>
      {helperText ? <p className={`mt-1 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>{helperText}</p> : null}
    </div>
  );
}

export default function DisputeDetailsModal({
  isOpen,
  onClose,
  dispute,
  actionLoading = null,
  onMarkInReview,
  onResolve,
  onReject,
  // onEscalate,
  onAddComment,
  onAddAttachment,
  onOpenInvoice,
}: DisputeDetailsModalProps) {
  const { isDark } = useResolvedTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  if (!isOpen || !dispute) return null;
  const isClosed = dispute.status === "Resolved" || dispute.status === "Rejected";
  const allAttachments = dispute.attachments || [];
  const resolutionProofs = dispute.resolutionProofs?.length
    ? dispute.resolutionProofs
    : allAttachments.filter(isResolutionProof);
  const attachments = allAttachments.filter((file) => !isResolutionProof(file));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200 p-0">
      {/* Backdrop Trigger Dismissal */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden={true} />

      {/* Main Container Card Frame */}
      <div className={`relative h-full w-full lg:max-w-2xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:p-9">
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">Dispute Details</h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-3 lg:p-4 rounded-full transition-colors border ${isDark ? "bg-[#2B2626] text-white hover:text-white/90 border-[#2B2626]" : "bg-[#F0F0F0] text-black hover:text-black/90 border-[#F0F0F0]"}`}
          >
            <X size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        <div className="overflow-y-auto p-4 lg:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className={`text-lg lg:text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{dispute.id}</p>
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm ${disputeStatusStyles[dispute.status]}`}>
              {dispute.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard
              icon={<FileText size={16} />}
              label="Shoot ID"
              value={dispute.shootId}
              className={isDark ? "border-[#D4B89633] bg-[#17120D]" : "bg-[#E8D1AB]/40 border-[#E8D1AB]"}
              isDark={isDark}
            />
            <DetailCard
              icon={<FileText size={16} />}
              label="Invoice ID"
              value={dispute.invoiceId}
              isDark={isDark}
            />
            <DetailCard
              icon={<UserRound size={16} />}
              label="Raised By"
              value={dispute.raisedBy}
              helperText={`(${dispute.raisedRole})`}
              isDark={isDark}
            />
            <DetailCard
              icon={<CalendarDays size={16} />}
              label="Created"
              value={dispute.createdAt}
              isDark={isDark} />
            <DetailCard
              icon={<CreditCard size={16} />}
              label="Disputed Amount"
              value={dispute.disputedAmount}
              className={isDark ? "border-[#4A1515] bg-[#250B0B]" : "bg-[#FEF3F2] border-[#FEF3F2]"}
              valueClassName="text-[#FF6A5F]"
              isDark={isDark}
            />
            {!dispute.hideImpactedPayout ? (
              <DetailCard
                icon={<ShieldAlert size={16} />}
                label="Impacted Payout"
                value={dispute.payoutHold}
                helperText={dispute.payoutNote}
                className={isDark ? "border-[#5A4312] bg-[#241805]" : "border-[#FFF4C9] bg-[#FFF4C9]"}
                valueClassName="text-[#E0AC21]"
                isDark={isDark}
              />
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => onOpenInvoice?.(dispute)}
              disabled={!dispute.invoiceUrl}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                isDark
                  ? "border-white/10 bg-[#171717] text-white hover:bg-[#222]"
                  : "border-black/10 bg-white text-black hover:bg-[#F7F7F7]"
              }`}
            >
              <FileText size={16} />
              Open Parent Invoice
            </button>

            {dispute.compensationSummary ? (
              <div>
                <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {dispute.compensationSummary.label}
                </p>
                <div className={`space-y-2 rounded-lg border px-4 py-3.5 ${isDark ? "border-white/10 bg-[#1F1F1F]" : "border-black/10 bg-[#F3F4F6]"}`}>
                  {dispute.compensationSummary.details.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                      <span className={isDark ? "text-[#A0A0A0]" : "text-black/50"}>{item.label}</span>
                      <span className={`text-right ${isDark ? "text-white" : "text-black"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {dispute.resolutionSummary ? (
              <div>
                <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {dispute.resolutionSummary.label}
                </p>
                <div className={`space-y-2 rounded-lg border px-4 py-3.5 ${isDark ? "border-white/10 bg-[#1F1F1F]" : "border-black/10 bg-[#F3F4F6]"}`}>
                  {dispute.resolutionSummary.details.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                      <span className={isDark ? "text-[#A0A0A0]" : "text-black/50"}>{item.label}</span>
                      <span className={`text-right ${isDark ? "text-white" : "text-black"}`}>{item.value}</span>
                    </div>
                  ))}
                  {resolutionProofs.length > 0 ? (
                    <div className={`mt-3 border-t pt-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                      <p className={`mb-2 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>Payment Proof</p>
                      <div className="space-y-2">
                        {resolutionProofs.map((file, index) => (
                          <div key={`${file.name}-${file.url || ""}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className={`min-w-0 truncate ${isDark ? "text-white" : "text-black"}`}>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => file.url && window.open(file.url, "_blank", "noopener,noreferrer")}
                              disabled={!file.url}
                              className={`shrink-0 ${isDark ? "text-white/70" : "text-black/60"} disabled:opacity-40`}
                              aria-label={`Download ${file.name}`}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Issue Type</p>
              <div className={`rounded-lg px-4 py-3.5 text-base h-14 ${isDark ? "bg-[#1F1F1F] text-white" : "bg-[#F3F4F6] text-black/90"}`}>
                {dispute.category}
              </div>
            </div>

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Description</p>
              <div className={`rounded-lg px-4 py-3.5 text-base ${isDark ? "bg-[#1F1F1F] text-[#A0A0A0]" : "bg-[#F3F4F6] text-black/80"}`}>
                {dispute.description}
              </div>
            </div>

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Timeline</p>
              <div className="space-y-4">
                {dispute.timeline.map((event, index) => {
                  const style = timelineStyles[event.tone];
                  const timelineKey = [
                    event.id || "timeline",
                    event.title,
                    event.at,
                    index,
                  ].join("-");
                  return (
                    <div key={timelineKey} className="relative flex gap-3">
                      {index < dispute.timeline.length - 1 ? (
                        <div className={`absolute left-[11px] top-6 h-[calc(100%+6px)] w-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />
                      ) : null}
                      <div className={`relative z-10 mt-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border ${style.ring} ${style.iconColor}`}>
                        {style.icon}
                      </div>
                      <div>
                        <p className={`text-base ${isDark ? "text-white" : "text-black"}`}>{event.title}</p>
                        <p className={`mt-1 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>
                          by {event.by} | {event.at}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                Attachments ({attachments.length})
              </p>
              <div className="space-y-3">
                {attachments.length > 0 ? attachments.map((file, index) => (
                  <div key={`${file.name}-${file.url || ""}-${index}`} className={`flex items-center justify-between rounded-lg ${isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"} px-4 py-3`}>
                    <div className="min-w-0">
                      <p className={`truncate ${isDark ? "text-white" : "text-black"}`}>{file.name}</p>
                      {file.uploadedAt ? (
                        <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                          Uploaded by {file.uploadedBy || "-"} {file.uploadedAt !== "-" ? `on ${file.uploadedAt}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => file.url && window.open(file.url, "_blank", "noopener,noreferrer")}
                      disabled={!file.url}
                      className={`${isDark ? "text-white/70" : "text-black/60"} disabled:opacity-40`}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                )) : (
                  <div className={`rounded-lg px-4 py-3 text-sm ${isDark ? "bg-[#1F1F1F] text-white/45" : "bg-[#F4F5F7] text-black/45"}`}>
                    No attachments added.
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Comments ({dispute.internalComments.length})</p>
              <div className="space-y-3">
                {dispute.internalComments.map((comment) => (
                  <div key={`${comment.author}-${comment.at}`} className={`rounded-lg ${isDark ? "bg-[#1F1F1F] " : "bg-[#F4F5F7]"} px-4 py-3`}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-base">
                      <p className={`${isDark ? "text-white" : "text-black"}`}>
                        {comment.author}
                        {comment.role ? <span className="ml-2 rounded-full bg-[#1E3A8A] px-2 py-0.5 text-xs text-[#6EA0FF]">{comment.role}</span> : null}
                      </p>
                      <p className={`text-sm ${isDark ? "text-[#A0A0A0]":"text-black/50"}`}>{comment.at}</p>
                    </div>
                    <p className={isDark ? "text-[#A0A0A0]":"text-black/50"}>{comment.message}</p>
                  </div>
                ))}
                {!dispute.internalComments.length ? (
                  <div className={`rounded-lg px-4 py-3 text-sm ${isDark ? "bg-[#1F1F1F] text-white/45" : "bg-[#F4F5F7] text-black/45"}`}>
                    No comments yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <fieldset className={`rounded-[12px] border px-4 pb-4 pt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <legend className={`px-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>Add Comment</legend>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  placeholder="Write a comment visible to client and admin..."
                  className={`min-h-[96px] w-full resize-none border-0 bg-transparent px-0 py-1 text-sm outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"}`}
                />
              </fieldset>
              {pendingFiles.length > 0 ? (
                <p className="text-xs text-[#E8D1AB]">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} selected
                </p>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => setPendingFiles(Array.from(event.target.files || []))}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium ${isDark ? "border-white/10 bg-[#171717] text-white hover:bg-[#222]" : "border-black/10 bg-white text-black hover:bg-[#F7F7F7]"}`}
                >
                  <Upload size={16} />
                  Select Attachment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingFiles.length) {
                      onAddAttachment?.(dispute, pendingFiles);
                      setPendingFiles([]);
                    }
                  }}
                  disabled={!pendingFiles.length || Boolean(actionLoading)}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] text-sm font-medium text-black hover:bg-[#d9c08a] disabled:opacity-50"
                >
                  <Upload size={16} />
                  {actionLoading === "attachment" ? "Uploading..." : "Upload"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!comment.trim()) return;
                  onAddComment?.(dispute, comment.trim());
                  setComment("");
                }}
                disabled={!comment.trim() || Boolean(actionLoading)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] text-sm font-medium text-black hover:bg-[#d9c08a] disabled:opacity-50"
              >
                <Send size={16} />
                {actionLoading === "comment" ? "Sending..." : "Send Comment"}
              </button>
            </div>
          </div>
        </div>

        {!isClosed ? (
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-4 lg:px-6">
            <button
              type="button"
              onClick={() => onMarkInReview?.(dispute)}
              disabled={dispute.status === "In Review" || Boolean(actionLoading)}
              className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs ${isDark ? "bg-[#1F1F1F] text-white hover:bg-[#292929]" : "bg-[#F0F0F0] text-black hover:bg-[#E9E9E9]"}`}
            >
              <Clock3 size={16} className="shrink-0" />
              {actionLoading === "review" ? "Updating..." : "Mark In Review"}
            </button>
            <button
              type="button"
              onClick={() => onResolve?.(dispute)}
              disabled={Boolean(actionLoading)}
              className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-2 py-3 text-center text-[11px] font-medium leading-tight text-white transition-colors hover:bg-[#1fb48b] sm:text-xs"
            >
              <CircleCheckBig size={16} className="shrink-0" />
              {actionLoading === "resolve" ? "Resolving..." : "Resolve & Release Payout"}
            </button>
            <button
              type="button"
              onClick={() => onReject?.(dispute)}
              disabled={Boolean(actionLoading)}
              className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#EF4444] px-2 py-3 text-center text-[11px] font-medium leading-tight text-white transition-colors hover:bg-[#eb3e40] sm:text-xs"
            >
              <CircleX size={16} className="shrink-0" />
              {actionLoading === "reject" ? "Rejecting..." : "Reject"}
            </button>
            {/* Escalate is hidden for now. Keep the handler wired in props so it can be restored quickly. */}
          </div>
        ) : null}
      </div>
    </div>
  );
}
