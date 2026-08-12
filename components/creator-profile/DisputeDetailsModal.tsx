"use client";

import React, { useState } from "react";
import {
    AlertTriangle,
    Calendar,
    Clock3,
    Download,
    File,
    FileText,
    Send,
    Upload,
    X,
    User,
} from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
    disputeStatusStyles,
    type DisputeHistoryItem,
} from "@/components/admin/finances/DisputeHistoryList";

type DisputeTimelineEvent = {
    title: string;
    by: string;
    at: string;
    tone: "warning" | "review";
};

type DisputeComment = {
    author: string;
    role: "Client" | "Admin" | "CP";
    message: string;
    at: string;
};

type Attachment = {
    name: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
    url?: string | null;
};

export type DisputeDetailsRecord = DisputeHistoryItem & {
    bookingId: string;
    invoiceId: string;
    raisedBy: string;
    raisedRole: string;
    createdAt: string;
    timeline: DisputeTimelineEvent[];
    comments: DisputeComment[];
    attachments: Attachment[];
    compensation?: {
        total: string;
        paid: string;
        remaining: string;
        extra?: string;
    };
};

interface DisputeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dispute: DisputeDetailsRecord | null;
}

const timelineStyles: Record<
    DisputeTimelineEvent["tone"],
    { icon: React.ReactNode; ring: string; iconColor: string; bg: string }
> = {
    warning: {
        icon: <AlertTriangle size={14} />,
        ring: "border-[#D4971B]/30",
        iconColor: "text-[#D4971B]",
        bg: "bg-[#2C2419]",
    },
    review: {
        icon: <Clock3 size={14} />,
        ring: "border-[#3B82F6]/30",
        iconColor: "text-[#3B82F6]",
        bg: "bg-[#17263D]",
    },
};

export default function DisputeDetailsModal({
    isOpen,
    onClose,
    dispute,
}: DisputeDetailsModalProps) {
    const { isDark } = useResolvedTheme();
    const [commentText, setCommentText] = useState("");

    if (!isOpen || !dispute) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            {/* Backdrop Trigger Dismissal */}
            <div className="absolute inset-0" onClick={onClose} aria-hidden={true} />

            {/* Main Container Card Frame */}
            <div
                className={`relative h-full w-full max-w-[560px] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ${isDark
                    ? "bg-[#0A0A0A] border-l border-white/10 text-white"
                    : "bg-white border-l border-black/10 text-black"
                    }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? "border-white/10" : "border-black/10"
                        }`}
                >
                    <h2 className="text-2xl font-semibold">Dispute Details</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDark
                            ? "bg-[#1F1F1F] text-white hover:bg-[#2A2A2A]"
                            : "bg-[#F0F0F0] text-black hover:bg-[#E0E0E0]"
                            }`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
                    {/* Dispute ID and Status */}
                    <div className="mb-6 flex items-center justify-between">
                        <p className={`text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {dispute.id}
                        </p>
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${disputeStatusStyles[dispute.status]
                                }`}
                        >
                            {dispute.status}
                        </span>
                    </div>

                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div
                            className={`rounded-lg border px-4 py-3 ${isDark
                                ? "bg-[#171717] border-[#2A2A2A]"
                                : "bg-[#F9F9F9] border-[#E5E5E5]"
                                }`}
                        >
                            <div className={`flex items-center gap-2 mb-2 text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                <FileText size={14} />
                                <span>Booking ID</span>
                            </div>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {dispute.bookingId}
                            </p>
                        </div>

                        <div
                            className={`rounded-lg border px-4 py-3 ${isDark
                                ? "bg-[#171717] border-[#2A2A2A]"
                                : "bg-[#F9F9F9] border-[#E5E5E5]"
                                }`}
                        >
                            <div className={`flex items-center gap-2 mb-2 text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                <FileText size={14} />
                                <span>Invoice ID</span>
                            </div>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {dispute.invoiceId}
                            </p>
                        </div>

                        <div
                            className={`rounded-lg border px-4 py-3 ${isDark
                                ? "bg-[#171717] border-[#2A2A2A]"
                                : "bg-[#F9F9F9] border-[#E5E5E5]"
                                }`}
                        >
                            <div className={`flex items-center gap-2 mb-2 text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                <User size={14} />
                                <span>Raised By</span>
                            </div>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {dispute.raisedBy}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                ({dispute.raisedRole})
                            </p>
                        </div>

                        <div
                            className={`rounded-lg border px-4 py-3 ${isDark
                                ? "bg-[#171717] border-[#2A2A2A]"
                                : "bg-[#F9F9F9] border-[#E5E5E5]"
                                }`}
                        >
                            <div className={`flex items-center gap-2 mb-2 text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                <Calendar size={14} />
                                <span>Created</span>
                            </div>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {dispute.createdAt}
                            </p>
                        </div>
                    </div>

                    {dispute.compensation ? (
                        <div className="mb-6">
                            <p className={`mb-3 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                CP Compensation
                            </p>
                            <div className={`grid gap-2 rounded-lg border p-3 ${dispute.compensation.extra ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"} ${isDark ? "border-[#2A2A2A] bg-[#171717]" : "border-[#E5E5E5] bg-[#F9F9F9]"}`}>
                                <div>
                                    <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>Total</p>
                                    <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{dispute.compensation.total}</p>
                                </div>
                                <div>
                                    <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>Paid</p>
                                    <p className="mt-1 text-sm font-medium text-[#10B981]">{dispute.compensation.paid}</p>
                                </div>
                                {dispute.compensation.extra ? (
                                    <div>
                                        <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>Dispute Extra</p>
                                        <p className="mt-1 text-sm font-medium text-[#7DB0FF]">{dispute.compensation.extra}</p>
                                    </div>
                                ) : null}
                                <div>
                                    <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>Remaining</p>
                                    <p className="mt-1 text-sm font-medium text-[#E8D1AB]">{dispute.compensation.remaining}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Issue Type */}
                    <div className="mb-6">
                        <p className={`mb-3 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            Issue Type
                        </p>
                        <div
                            className={`rounded-lg px-4 py-3 text-sm ${isDark
                                ? "bg-[#171717] border border-[#2A2A2A] text-white"
                                : "bg-[#F9F9F9] border border-[#E5E5E5] text-black"
                                }`}
                        >
                            {dispute.category}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <p className={`mb-3 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            Description
                        </p>
                        <div
                            className={`rounded-lg px-4 py-3 text-sm ${isDark
                                ? "bg-[#171717] border border-[#2A2A2A] text-[#A0A0A0]"
                                : "bg-[#F9F9F9] border border-[#E5E5E5] text-black/70"
                                }`}
                        >
                            {dispute.description}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-6">
                        <p className={`mb-4 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            Timeline
                        </p>
                        <div className="space-y-4">
                            {dispute.timeline.map((event, index) => {
                                const style = timelineStyles[event.tone];
                                return (
                                    <div key={`${event.title}-${event.at}`} className="relative flex gap-3">
                                        {index < dispute.timeline.length - 1 && (
                                            <div
                                                className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${isDark ? "bg-white/10" : "bg-black/10"
                                                    }`}
                                            />
                                        )}
                                        <div
                                            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${style.ring} ${style.bg} ${style.iconColor}`}
                                        >
                                            {style.icon}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                                {event.title}
                                            </p>
                                            <p className={`mt-1 text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                                by {event.by} • {event.at}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="mb-6">
                        <p className={`mb-3 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            Attachments ({dispute.attachments.length})
                        </p>
                        <div className="space-y-2">
                            {dispute.attachments.map((attachment) => (
                                <div
                                    key={attachment.name}
                                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${isDark
                                        ? "bg-[#171717] border-[#2A2A2A]"
                                        : "bg-[#F9F9F9] border-[#E5E5E5]"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <File size={16} className={isDark ? "text-[#A0A0A0]" : "text-black/50"} />
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>
                                                {attachment.name}
                                            </p>
                                            <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                                {attachment.size} • Uploaded by {attachment.uploadedBy} on {attachment.uploadedAt}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => attachment.url && window.open(attachment.url, "_blank", "noopener,noreferrer")}
                                        disabled={!attachment.url}
                                        className={`p-2 rounded transition-colors ${isDark
                                            ? "text-[#D4B896] hover:bg-[#1F1F1F]"
                                            : "text-[#B8966E] hover:bg-[#F0F0F0]"
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="mb-6">
                        <p className={`mb-4 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            Comments ({dispute.comments.length})
                        </p>
                        <div className="space-y-3">
                            {dispute.comments.map((comment) => (
                                <div
                                    key={`${comment.author}-${comment.at}`}
                                    className={`rounded-lg px-4 py-3 ${isDark ? "bg-[#171717]" : "bg-[#F9F9F9]"
                                        }`}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                                {comment.author}
                                            </p>
                                            <span
                                                className={`rounded px-2 py-0.5 text-[10px] font-medium ${comment.role === "Client"
                                                    ? "bg-[#3B82F6]/20 text-[#3B82F6]"
                                                    : comment.role === "CP"
                                                        ? "bg-[#E8D1AB]/20 text-[#E8D1AB]"
                                                        : "bg-[#10B981]/20 text-[#10B981]"
                                                    }`}
                                            >
                                                {comment.role}
                                            </span>
                                        </div>
                                        <p className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-black/50"}`}>
                                            {comment.at}
                                        </p>
                                    </div>
                                    <p className={`text-sm ${isDark ? "text-[#A0A0A0]" : "text-black/70"}`}>
                                        {comment.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Action Area */}
                <div
                    className={`border-t px-6 py-5 ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-black/10 bg-white"
                        }`}
                >
                    {/* Comment Input */}
                    <div className="mb-4">
                        <label className={`mb-2 block text-xs font-medium ${isDark ? "text-[#A0A0A0]" : "text-black/60"}`}>
                            Comment
                        </label>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add your comment..."
                            rows={3}
                            className={`w-full resize-none rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8D1AB]/20 ${isDark
                                ? "bg-[#171717] border-[#2A2A2A] text-white placeholder:text-[#666666]"
                                : "bg-[#F9F9F9] border-[#E5E5E5] text-black placeholder:text-black/40"
                                }`}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${isDark
                                ? "border-[#2A2A2A] bg-[#171717] text-white hover:bg-[#1F1F1F]"
                                : "border-[#E5E5E5] bg-[#F9F9F9] text-black hover:bg-[#F0F0F0]"
                                }`}
                        >
                            <Upload size={16} />
                            Upload File
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-[#F5EBD8]"
                        >
                            <Send size={16} />
                            Send Comments
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
