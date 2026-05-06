"use client";

import React from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

import {
  disputeStatusStyles,
  type DisputeHistoryItem,
} from "@/components/admin/finances/DisputeHistoryList";

type DisputeTimelineEvent = {
  title: string;
  by: string;
  at: string;
  tone: "warning" | "review" | "resolved";
};

type DisputeComment = {
  author: string;
  message: string;
  at: string;
};

export type DisputeDetailsRecord = DisputeHistoryItem & {
  createdAt: string;
  payoutNote: string;
  timeline: DisputeTimelineEvent[];
  internalComments: DisputeComment[];
};

interface DisputeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeDetailsRecord | null;
}

const timelineStyles: Record<
  DisputeTimelineEvent["tone"],
  { icon: React.ReactNode; ring: string; iconColor: string }
> = {
  warning: {
    icon: <AlertTriangle size={12} />,
    ring: "border-[#6B542C] bg-[#2C2419]",
    iconColor: "text-[#D4971B]",
  },
  review: {
    icon: <Clock3 size={12} />,
    ring: "border-[#2A4C7A] bg-[#17263D]",
    iconColor: "text-[#4F93FF]",
  },
  resolved: {
    icon: <CheckCircle2 size={12} />,
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helperText?: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`rounded-lg border border-white/10 bg-[#1F1F1F] p-3 ${className}`}>
      <div className="mb-2 flex items-center gap-2 text-[11px] text-white/45">
        <span className="text-white/35">{icon}</span>
        <span>{label}</span>
      </div>
      <p className={`text-lg leading-tight text-white ${valueClassName}`}>{value}</p>
      {helperText ? <p className="mt-1 text-[11px] text-white/35">{helperText}</p> : null}
    </div>
  );
}

export default function DisputeDetailsModal({
  isOpen,
  onClose,
  dispute,
}: DisputeDetailsModalProps) {
  if (!isOpen || !dispute) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-[121] flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 lg:px-6">
          <h2 className="text-[18px] font-semibold text-white">Dispute Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
            aria-label="Close dispute details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 lg:px-6 lg:py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-base font-medium text-white">{dispute.id}</p>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm ${disputeStatusStyles[dispute.status]}`}
            >
              {dispute.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailCard icon={<FileText size={12} />} label="Shoot ID" value={dispute.shootId} className="bg-[#17120D]" />
            <DetailCard icon={<FileText size={12} />} label="Invoice ID" value={dispute.invoiceId} />
            <DetailCard
              icon={<UserRound size={12} />}
              label="Raised By"
              value={dispute.raisedBy}
              helperText={`(${dispute.raisedRole})`}
            />
            <DetailCard icon={<CalendarDays size={12} />} label="Created" value={dispute.createdAt} />
            <DetailCard
              icon={<CreditCard size={12} />}
              label="Disputed Amount"
              value={dispute.disputedAmount}
              className="border-[#4A1515] bg-[#250B0B]"
              valueClassName="text-[#FF6A5F]"
            />
            <DetailCard
              icon={<ShieldAlert size={12} />}
              label="Impacted Payout"
              value={dispute.payoutHold}
              helperText={dispute.payoutNote}
              className="border-[#5A4312] bg-[#241805]"
              valueClassName="text-[#E0AC21]"
            />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-sm text-white">Issue Type</p>
              <div className="rounded-lg bg-[#1F1F1F] px-4 py-3 text-sm text-white/90">
                {dispute.category}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white">Description</p>
              <div className="rounded-lg bg-[#1F1F1F] px-4 py-3 text-sm text-white/75">
                {dispute.description}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-white">Timeline</p>
              <div className="space-y-4">
                {dispute.timeline.map((event, index) => {
                  const style = timelineStyles[event.tone];
                  return (
                    <div key={`${event.title}-${event.at}`} className="relative flex gap-3">
                      {index < dispute.timeline.length - 1 ? (
                        <div className="absolute left-[11px] top-6 h-[calc(100%+6px)] w-px bg-white/10" />
                      ) : null}
                      <div className={`relative z-10 mt-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border ${style.ring} ${style.iconColor}`}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="text-sm text-white/90">{event.title}</p>
                        <p className="mt-1 text-[11px] text-white/35">
                          by {event.by} | {event.at}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-white">Internal Comments</p>
              <div className="space-y-3">
                {dispute.internalComments.map((comment) => (
                  <div key={`${comment.author}-${comment.at}`} className="rounded-lg bg-[#1F1F1F] px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm text-white">{comment.author}</p>
                      <p className="text-[11px] text-white/35">{comment.at}</p>
                    </div>
                    <p className="text-sm text-white/45">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-white/10 p-5 lg:grid-cols-3 lg:px-6">
          <button
            type="button"
            className="rounded-lg bg-[#20C997] px-3 py-3 text-xs font-medium text-black transition-colors hover:bg-[#1fb48b]"
          >
            Resolve &amp; Release Payout
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#FF4D4F] px-3 py-3 text-xs font-medium text-white transition-colors hover:bg-[#eb3e40]"
          >
            Reject &amp; Refund Client
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#1F1F1F] px-3 py-3 text-xs font-medium text-white transition-colors hover:bg-[#292929]"
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
