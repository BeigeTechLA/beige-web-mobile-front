"use client";

import React, { useRef, useState } from "react";
import {
  CalendarDays,
  Download,
  FileText,
  Send,
  UserRound,
  Upload,
  X,
  AlertTriangle,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AffiliateDisputeTimelineEvent = {
  title: string;
  by: string;
  at: string;
  tone: "warning" | "review" | "resolved";
};

type AffiliateDisputeComment = {
  author: string;
  role: string;
  message: string;
  at: string;
};

export type AffiliateDisputeDetailsRecord = {
  id: string;
  bookingId: string;
  invoiceId: string;
  raisedBy: string;
  raisedRole: string;
  createdAt: string;
  status: "Dispute - Open" | "Under Review" | "Resolved";
  issueType: string;
  description: string;
  timeline: AffiliateDisputeTimelineEvent[];
  attachments: Array<{
    name: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
    url?: string | null;
  }>;
  comments: AffiliateDisputeComment[];
  invoiceUrl?: string | null;
};

type AffiliateDisputeDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  dispute: AffiliateDisputeDetailsRecord | null;
  actionLoading?: "comment" | "attachment" | null;
  onAddComment?: (dispute: AffiliateDisputeDetailsRecord, body: string) => void;
  onAddAttachment?: (dispute: AffiliateDisputeDetailsRecord, files: File[]) => void;
  onOpenInvoice?: (dispute: AffiliateDisputeDetailsRecord) => void;
};

const timelineStyles: Record<
  AffiliateDisputeTimelineEvent["tone"],
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

function DetailCard({
  icon,
  label,
  value,
  helperText,
  className = "",
  valueClassName = "",
  isDark = true,
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
    : isDark
      ? "bg-[#1F1F1F] border-white/10 text-white"
      : "bg-[#F5F5F5] border-black/10 text-black";

  const finalValueClass = valueClassName
    ? valueClassName
    : isDark
      ? "text-white"
      : "text-black";

  return (
    <div className={`rounded-lg border p-3 ${finalContainerClass}`}>
      <div className={`mb-1 flex items-center gap-2 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`text-lg leading-tight lg:text-xl ${finalValueClass}`}>{value}</p>
      {helperText ? <p className={`mt-1 text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>{helperText}</p> : null}
    </div>
  );
}

export default function AffiliateDisputeDetailsModal({
  isOpen,
  onClose,
  dispute,
  actionLoading = null,
  onAddComment,
  onAddAttachment,
  onOpenInvoice,
}: AffiliateDisputeDetailsModalProps) {
  const { isDark } = useResolvedTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  if (!isOpen || !dispute) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-stretch justify-end bg-[#101010CC] font-sans backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative flex h-full w-full flex-col overflow-hidden border animate-in slide-in-from-right duration-200 lg:w-[50vw] lg:max-w-[760px] lg:rounded-l-2xl ${
          isDark
            ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
            : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:p-9">
          <h2 className="text-xl font-bold tracking-tight lg:text-3xl">Dispute Details</h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border p-3 transition-colors lg:p-4 ${
              isDark
                ? "border-[#2B2626] bg-[#2B2626] text-white hover:text-white/90"
                : "border-[#F0F0F0] bg-[#F0F0F0] text-black hover:text-black/90"
            }`}
          >
            <X size={28} className="h-6 w-6 lg:h-7 lg:w-7" />
          </button>
        </div>

        <hr className={`border-t ${isDark ? "border-[#CACACA]" : "border-[#000000]/30"}`} />

        <div className="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar lg:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className={`text-lg font-semibold lg:text-xl ${isDark ? "text-white" : "text-black"}`}>
              {dispute.id.replace(/^DIS-/, "Dispute ID - ")}
            </p>
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm ${
              dispute.status === "Resolved"
                ? "border-[#1F5B49] bg-[#10352A] text-[#22C55E]"
                : dispute.status === "Under Review"
                  ? "border-[#2A4C7A] bg-[#17263D] text-[#4F93FF]"
                  : "border-[#8F2525] bg-[#2A1717] text-[#E26E67]"
            }`}>
              {dispute.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard
              icon={<FileText size={16} />}
              label="Booking ID"
              value={dispute.bookingId}
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
              isDark={isDark}
            />
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

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Issue Type</p>
              <div className={`h-14 rounded-lg px-4 py-3.5 text-base ${isDark ? "bg-[#1F1F1F] text-white" : "bg-[#F3F4F6] text-black/90"}`}>
                {dispute.issueType}
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
                  return (
                    <div key={`${event.title}-${event.at}`} className="relative flex gap-3">
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
                Attachments ({dispute.attachments.length})
              </p>
              <div className="space-y-3">
                {dispute.attachments.map((file) => (
                  <div
                    key={file.name}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="shrink-0 text-[#E8D1AB]" />
                      <div>
                        <p className={`${isDark ? "text-white" : "text-black"}`}>{file.name}</p>
                        <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/45"}`}>
                          {file.size} · Uploaded by {file.uploadedBy}{file.uploadedAt && file.uploadedAt !== "-" ? ` on ${file.uploadedAt}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => file.url && window.open(file.url, "_blank", "noopener,noreferrer")}
                      disabled={!file.url}
                      className={`${isDark ? "text-white/70" : "text-black/60"} disabled:opacity-40`}
                      aria-label={`Download ${file.name}`}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))}
                {!dispute.attachments.length ? (
                  <div className={`rounded-lg px-4 py-3 text-sm ${isDark ? "bg-[#1F1F1F] text-white/45" : "bg-[#F4F5F7] text-black/45"}`}>
                    No attachments added.
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <p className={`mb-3.5 text-base font-medium ${isDark ? "text-white" : "text-black"}`}>
                Comments ({dispute.comments.length.toString().padStart(2, "0")})
              </p>
              <div className="space-y-3">
                {dispute.comments.map((comment) => (
                  <div
                    key={`${comment.author}-${comment.at}`}
                    className={`rounded-lg px-4 py-3 ${isDark ? "bg-[#1F1F1F]" : "bg-[#F4F5F7]"}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-base">
                      <p className={`${isDark ? "text-white" : "text-black"}`}>
                        {comment.author} <span className="ml-2 rounded-full bg-[#1E3A8A] px-2 py-0.5 text-xs text-[#6EA0FF]">{comment.role}</span>
                      </p>
                      <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>{comment.at}</p>
                    </div>
                    <p className={isDark ? "text-[#A0A0A0]" : "text-black/50"}>{comment.message}</p>
                  </div>
                ))}
                {!dispute.comments.length ? (
                  <div className={`rounded-lg px-4 py-3 text-sm ${isDark ? "bg-[#1F1F1F] text-white/45" : "bg-[#F4F5F7] text-black/45"}`}>
                    No comments yet.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="pt-1">
              <fieldset className={`rounded-[16px] border px-4 pb-4 pt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <legend className={`px-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>Comment</legend>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Add your comment..."
                  className={`min-h-[120px] w-full resize-none border-0 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-sm ${
                    isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"
                  }`}
                />
              </fieldset>
              {pendingFiles.length > 0 ? (
                <p className="mt-3 text-xs text-[#E8D1AB]">
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

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                    isDark
                      ? "border-white/10 bg-[#171717] text-white hover:bg-[#1f1f1f]"
                      : "border-[#E5E5E5] bg-white text-[#111] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <Upload size={16} />
                  Select File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!pendingFiles.length) return;
                    onAddAttachment?.(dispute, pendingFiles);
                    setPendingFiles([]);
                  }}
                  disabled={!pendingFiles.length || Boolean(actionLoading)}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] px-4 text-sm font-semibold text-black hover:bg-[#d9c08a]"
                >
                  <Upload size={16} />
                  {actionLoading === "attachment" ? "Uploading..." : "Upload File"}
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
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] px-4 text-sm font-semibold text-black hover:bg-[#d9c08a] disabled:opacity-50"
              >
                <Send size={16} />
                {actionLoading === "comment" ? "Sending..." : "Send Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
