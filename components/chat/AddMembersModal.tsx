"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Users, Check } from "lucide-react";
import { ExternalChatUser } from "@/lib/externalChatApi";

interface AddMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (selectedMemberIds: string[]) => void;
    existingMembers: ExternalChatUser[];
    directory: {
        staff?: ExternalChatUser[];
        clients?: ExternalChatUser[];
        creativePartners?: ExternalChatUser[];
    };
    isDark?: boolean;
}

const getInitials = (name?: string | null) =>
    String(name || "U")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

const getRoleLabel = (role?: string) => {
    if (role === "client") return "Client";
    if (role === "cp") return "Creative Partner";
    if (role === "sales_rep") return "Sales Rep";
    if (role === "admin") return "Admin";
    if (role === "pm") return "Project Manager";
    if (role === "production") return "Production";
    if (role === "manager") return "Manager";
    return "Member";
};

export default function AddMembersModal({
    isOpen,
    onClose,
    onSubmit,
    existingMembers,
    directory,
    isDark = true,
}: AddMembersModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    const allMembers = useMemo(() => {
        const members = Array.from(
            new Map(
                [
                    ...(directory.staff || []),
                    ...(directory.clients || []),
                    ...(directory.creativePartners || []),
                ].map(member => [String(member.id), member])
            ).values()
        );

        const existingIds = new Set(existingMembers.map((m) => String(m.id)));

        return members.filter((member) => !existingIds.has(String(member.id)));
    }, [directory, existingMembers]);

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return allMembers;

        const query = searchQuery.toLowerCase();
        return allMembers.filter((member) => {
            const name = String(member.name || "").toLowerCase();
            const email = String(member.email || "").toLowerCase();
            const role = String(member.role || "").toLowerCase();

            return name.includes(query) || email.includes(query) || role.includes(query);
        });
    }, [allMembers, searchQuery]);

    const toggleMemberSelection = (memberId: string) => {
        setSelectedMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedMemberIds([]);
    };

    const handleSubmit = () => {
        onSubmit(selectedMemberIds);
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 backdrop-blur-sm transition-colors ${isDark ? "bg-black/80" : "bg-black/40"}`}
                onClick={() => {
                    handleReset();
                    onClose();
                }}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#000] shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">
                            Add New Members
                        </h2>
                        <p className="mt-1 text-sm text-white/50">
                            Admins can include any member, even if they are not linked to the shoot.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            handleReset();
                            onClose();
                        }}
                        className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/15"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    {/* Search Input */}
                    <div className="relative mb-5">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by member by name, email or role.."
                            className="h-12 w-full rounded-xl border border-white/10 bg-[#101010] pl-12 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/20"
                        />
                    </div>

                    {/* Members List */}
                    <div className="max-h-[calc(100vh-280px)] space-y-0 rounded-xl overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-track-[#0f0f0f] scrollbar-thumb-[#333] border border-white/10 bg-[#0f0f0f]">
                        {filteredMembers.map((member, index) => {
                            const memberId = String(member.id);
                            const isSelected = selectedMemberIds.includes(memberId);
                            const showDivider = index < filteredMembers.length - 1;

                            return (
                                <div
                                    key={memberId}
                                    onClick={() => toggleMemberSelection(memberId)}
                                    className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition ${isSelected ? "bg-[#E8D1AB]/10" : ""}`}
                                >
                                    {/* Avatar */}
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#edf6dc] to-[#bcd8f0] text-sm font-semibold text-[#222]">
                                        {member.profileImage ? (
                                            <img
                                                src={member.profileImage}
                                                alt={member.name || ""}
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getInitials(member.name)
                                        )}
                                    </div>

                                    {/* Member Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-white">
                                                {member.name || member.email || "Member"}
                                            </p>
                                            {member.role && (
                                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                                                    {getRoleLabel(member.role)}
                                                </span>
                                            )}
                                        </div>
                                        {member.email && (
                                            <p className="mt-0.5 text-xs text-white/50">
                                                {member.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Checkbox */}
                                    <label className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-white/20 bg-transparent transition hover:border-white/40">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMemberSelection(memberId);
                                            }}
                                            className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition
                                            ${isSelected
                                                    ? isDark ? "text-white" : "text-black"
                                                    : isDark ? "text-white/50 hover:bg-white/5" : "text-black/60 hover:bg-black/5"
                                                }`}
                                        >

                                            <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all
                                            ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]" : isDark ? "border-white/30" : "border-black/20"}`}>
                                                {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                                            </div>
                                        </div>

                                    </label>
                                </div>
                            );
                        })}

                        {filteredMembers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-sm text-white/40">
                                    No members found matching your search.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Selection Summary */}
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#101010] px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <Users className="h-4 w-4 text-[#E5D5B8]" />
                        </div>
                        <p className="text-sm text-white/60">
                            {selectedMemberIds.length} Extra Member{selectedMemberIds.length === 1 ? "" : "s"} Selected
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => {
                            handleReset();
                            onClose();
                        }}
                        className="rounded-lg border border-white/10 bg-[#171717] px-7 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedMemberIds.length === 0}
                        className="rounded-lg bg-[#E5D5B8] px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#d4c19f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Start Chat
                    </button>
                </div>
            </div>
        </div>
    );
}