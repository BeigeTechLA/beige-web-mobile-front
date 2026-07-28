"use client";

import React, { useEffect, useRef } from "react";
import { History, X } from "lucide-react";
import { format } from "date-fns";

interface ArchiveHistoryEntry {
    history_id: number;
    target_type: string;
    target_id: number;
    user_id: number;
    action: string;
    reason: string;
    performed_by_user_id: number;
    performed_by_name: string;
    performed_by_role: string;
    previous_status: string;
    new_status: string;
    metadata: any;
    created_at: string;
}

interface ArchiveHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: ArchiveHistoryEntry[];
    clientName: string;
    isDark: boolean;
}

const getInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
};

const formatDateTime = (value?: string) => {
    if (!value) return { date: "N/A", time: "" };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: value, time: "" };
    return {
        date: format(parsed, "MMM d, yyyy"),
        time: format(parsed, "h:mm a"),
    };
};

// Generate consistent color based on name
const getAvatarColor = (name: string) => {
    const colors = [
        { bg: "#FFD5E8", text: "#000000" }, // Pink
        { bg: "#D5F5FF", text: "#000000" }, // Light Blue
        { bg: "#E8F5E9", text: "#166534" }, // Light Green
        { bg: "#FFF4E5", text: "#92400E" }, // Light Orange
        { bg: "#F5E6FF", text: "#6B21A8" }, // Light Purple
        { bg: "#FFE5E5", text: "#991B1B" }, // Light Red
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function ArchiveHistoryModal({
    isOpen,
    onClose,
    history,
    clientName,
    isDark
}: ArchiveHistoryModalProps) {
    const modalRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Process history to group archive/restore pairs
    const processedHistory = history.map((entry, index) => {
        const isArchived = entry.action === "archived";
        const isRestored = entry.action === "restored";

        // Check if next entry is a restore for this archive
        const nextEntry = history[index + 1];
        const hasNestedRestore = isArchived && nextEntry &&
            nextEntry.action === "restored" &&
            nextEntry.user_id === entry.user_id;

        return {
            entry,
            isArchived,
            isRestored,
            hasNestedRestore,
            ...formatDateTime(entry.created_at)
        };
    });

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[140] flex justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div
                ref={modalRef}
                className="relative h-full w-full max-w-[640px] bg-[#0A0A0A] border-l border-t border-[#1F1F1F] rounded-tl-2xl shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F1F1F]">
                    <h2 className="text-2xl font-bold text-white">
                        Archive Users History
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2B2B] text-white/90 transition-colors hover:bg-[#3A3A3A]"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin] [scrollbar-color:#333_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="space-y-4">
                        {processedHistory.length > 0 ? (
                            processedHistory.map(({ entry, isRestored, hasNestedRestore, date, time }, index) => {
                                const actorName = entry.performed_by_name;
                                const actionText = isRestored ? "was restored by" : "was deleted by";
                                const subject = clientName;

                                // Get avatar color based on actor name
                                const avatarColor = getAvatarColor(actorName);

                                return (
                                    <div key={entry.history_id} className="relative">
                                        {/* Main Card */}
                                        <div className="rounded-xl border border-[#262626] bg-[#1A1A1A] p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div
                                                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                                                    style={{ backgroundColor: avatarColor.bg }}
                                                >
                                                    <span
                                                        className="text-lg font-medium"
                                                        style={{ color: avatarColor.text }}
                                                    >
                                                        {getInitials(actorName)}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="min-w-0 flex-1 pt-1">
                                                    <p className="text-[15px] font-medium leading-snug text-white">
                                                        <span className="text-white/90">
                                                            {subject} {actionText} {actorName}
                                                        </span>
                                                        <span className="text-[#E5D5B8]"> - {entry.performed_by_role}</span>
                                                    </p>
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#888888]">
                                                        <span>{date}</span>
                                                        <span>•</span>
                                                        <span>{time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nested Restore Card */}
                                        {hasNestedRestore && processedHistory[index + 1] && (
                                            <div className="relative mt-4 ml-[72px]">
                                                {/* L-shaped Timeline Connector */}
                                                <div className="absolute -left-[56px] top-0 h-[calc(100%+16px)]">
                                                    <div className="absolute left-0 top-0 bottom-8 w-px bg-[#3A3A3A]" />
                                                    <div className="absolute bottom-8 left-0 w-[56px] h-px bg-[#3A3A3A]" />
                                                </div>

                                                {/* Nested Card */}
                                                <div className="rounded-lg border border-[#262626] bg-[#141414] p-4">
                                                    <div className="flex items-start gap-3">
                                                        {/* Small Avatar */}
                                                        <div
                                                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md"
                                                            style={{ backgroundColor: avatarColor.bg }}
                                                        >
                                                            <span
                                                                className="text-sm font-medium"
                                                                style={{ color: avatarColor.text }}
                                                            >
                                                                {getInitials(actorName)}
                                                            </span>
                                                        </div>

                                                        {/* Nested Content */}
                                                        <div className="min-w-0 flex-1 pt-0.5">
                                                            <p className="text-[13px] font-medium leading-snug text-white">
                                                                <span className="text-white/90">
                                                                    {clientName} was restored by {actorName}
                                                                </span>
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#888888]">
                                                                <span>{processedHistory[index + 1].date}</span>
                                                                <span>•</span>
                                                                <span>{processedHistory[index + 1].time}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#1A1A1A] p-8">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-[#E5D5B8]">
                                    <History size={20} />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-white">No archive history found.</p>
                                    <p className="text-sm text-white/45">This client has not been archived or restored yet.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}