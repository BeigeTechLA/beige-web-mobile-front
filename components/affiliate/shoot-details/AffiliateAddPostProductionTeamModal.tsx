"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { affiliateApi, adminApi } from "@/lib/api";
import Cookies from "js-cookie";

interface AffiliateAddPostProductionTeamModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface PostProductionMember {
    id: number;
    name: string;
    role: string;
    email?: string;
}

const AffiliateAddPostProductionTeamModal: React.FC<AffiliateAddPostProductionTeamModalProps> = ({
    isOpen,
    projectId,
    onClose,
    onSuccess,
}) => {
    const [selectedMember, setSelectedMember] = useState<PostProductionMember | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [members, setMembers] = useState<PostProductionMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchMembers = async () => {
                const token = Cookies.get("revure_token");
                if (!token) return;

                try {
                    setLoading(true);
                    const response = await affiliateApi.getPostProductionMembers(token);
                    const membersList = response.data || response;
                    if (Array.isArray(membersList)) {
                        setMembers(membersList.map((m: any) => ({
                            id: m.post_production_member_id,
                            name: `${m.first_name} ${m.last_name}`.trim() || m.full_name || "Unknown",
                            role: m.role || "Post Production",
                            email: m.email
                        })));
                    } else if (membersList && Array.isArray(membersList.data)) {
                        setMembers(membersList.data.map((m: any) => ({
                            id: m.post_production_member_id,
                            name: `${m.first_name} ${m.last_name}`.trim() || m.full_name || "Unknown",
                            role: m.role || "Post Production",
                            email: m.email
                        })));
                    }
                } catch (error) {
                    console.error("Error fetching post production members:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!selectedMember) return;

        const token = Cookies.get("revure_token");
        if (!token) return;

        try {
            setSubmitting(true);
            const response = await affiliateApi.assignPostProductionMember(token, {
                post_production_member_id: selectedMember.id,
                project_id: Number(projectId)
            });

            if (response.success || !response.error) {
                onSuccess();
            } else {
                console.error("Failed to assign member:", response.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error assigning member:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[500px] bg-black border border-zinc-800 rounded-[24px] p-8 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-2xl font-bold">Add Post Production Team</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    <div className="relative">
                        {/* Custom Select Input */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={loading || submitting}
                            className="w-full h-14 px-4 bg-transparent border border-zinc-700 rounded-xl flex items-center justify-between group hover:border-zinc-500 transition-colors disabled:opacity-50"
                        >
                            <span className={`text-sm ${selectedMember ? 'text-white' : 'text-zinc-500'}`}>
                                {loading ? "Loading members..." : (selectedMember?.name || "Select Post Production Member")}
                            </span>
                            <ChevronDown size={20} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating Label */}
                        <span className="absolute -top-2.5 left-4 bg-black px-1 text-xs text-zinc-500">
                            Select Post Production Member
                        </span>

                        {/* Dropdown Options */}
                        {isDropdownOpen && !loading && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-zinc-800 rounded-xl overflow-y-auto max-h-60 z-20 shadow-xl">
                                {members.length > 0 ? (
                                    members.map((member, index) => (
                                        <div
                                            key={`${member.id}-${index}`}
                                            onClick={() => {
                                                setSelectedMember(member);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer text-sm"
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{member.name}</span>
                                                <span className="text-xs text-zinc-500">{member.role}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-zinc-500 text-sm">No members available</div>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-fit px-8 h-12 bg-[#E5D5B8] text-black hover:bg-[#d4c4a7] rounded-lg font-medium text-base disabled:opacity-50"
                        onClick={handleAdd}
                        disabled={!selectedMember || submitting}
                    >
                        {submitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                <span>Adding...</span>
                            </div>
                        ) : "Add"}
                    </Button>
                </div>
            </div>
        </div >
    );
};

export default AffiliateAddPostProductionTeamModal;
