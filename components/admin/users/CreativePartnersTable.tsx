"use client";

import React, { useState } from "react";
import { ChevronRight, Pencil, Trash2, Search, Filter, ArrowUpRight, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UserStatus = "Approved" | "Pending" | "Rejected";

interface CreativePartner {
    id: string;
    name: string;
    email: string;
    role: string;
    status: UserStatus;
    joinDate: string;
    initials: string;
}

const INITIAL_DATA: CreativePartner[] = [
    { id: "#123456", name: "Ethan Carter", email: "ethanc4519@yahoo.com", role: "Videographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "EC" },
    { id: "#123456", name: "Lana Guzman", email: "lanaguzman@gmail.com", role: "Photographer", status: "Pending", joinDate: "Jan 13, 2026", initials: "LG" },
    { id: "#123456", name: "John Lee", email: "johnlee45@gmail.com", role: "Photographer", status: "Pending", joinDate: "Jan 13, 2026", initials: "JL" },
    { id: "#123456", name: "Maya Ross", email: "mayaross@yahoo.com", role: "Director", status: "Rejected", joinDate: "Jan 13, 2026", initials: "MR" },
    { id: "#123456", name: "Emily Davis", email: "emilydavis@yahoo.com", role: "Producer", status: "Pending", joinDate: "Jan 13, 2026", initials: "ED" },
    { id: "#123456", name: "Prince Carter", email: "princecarter@yahoo.com", role: "Videographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "PC" },
    { id: "#123456", name: "Daniel Roberts", email: "danielrobert@gmail.com", role: "Photographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "DR" },
    { id: "#123456", name: "Jake Ross", email: "jakeross25@yahoo.com", role: "Photographer", status: "Approved", joinDate: "Jan 13, 2026", initials: "JR" },
    { id: "#123456", name: "Sophia Johnson", email: "sophiaJ6545@yahoo.com", role: "Director", status: "Rejected", joinDate: "Jan 13, 2026", initials: "SJ" },
];

const StatusBadge = ({ status }: { status: UserStatus }) => {
    const styles = {
        Approved: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
        Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
        Rejected: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
    };

    return (
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[status]}`}>
            {status}
        </span>
    );
};

export const CreativePartnersTable = () => {
    const [users, setUsers] = useState<CreativePartner[]>(INITIAL_DATA);
    const router = useRouter();

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) return;

        const cleanId = id.replace('#', '');
        router.push(`/admin/users/creative-partners/${cleanId}`);
    };

    const showSuccessToast = () => {
        toast.custom((t) => (
            <div className="flex items-center gap-3 w-full max-w-[400px] bg-[#111] border border-[#222] p-4 rounded-xl shadow-lg relative">
                <div className="w-8 h-8 rounded-full border border-green-500/30 flex items-center justify-center text-green-500 bg-green-500/10">
                    <Check size={16} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-green-500 font-medium text-base">Shoot request accepted</h3>
                    <p className="text-[#888] text-sm">Youv'e successfully accepted the CP</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
        ));
    };

    const showDeclineToast = () => {
        toast.custom((t) => (
            <div className="flex items-center gap-3 w-full max-w-[400px] bg-[#111] border border-[#222] p-4 rounded-xl shadow-lg relative">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff6b6b]">
                    <AlertCircle size={24} strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-[#ff6b6b] font-medium text-base">Request Declined</h3>
                    <p className="text-[#888] text-sm">The CP request has been declined.</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
        ));
    };

    const handleApprove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setUsers(users.map(u => u.id === id ? { ...u, status: "Approved" } : u));
        showSuccessToast();
    };

    const handleDecline = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setUsers(users.map(u => u.id === id ? { ...u, status: 'Rejected' } : u));
        showDeclineToast();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Creative Partners</h1>
                <p className="text-[#888]">Manage and review all onboarded creative professionals in one place.</p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#555] transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <span>All Status</span>
                        <ChevronRight className="rotate-90" size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <ArrowUpRight size={16} />
                        <span>Export</span>
                    </button>
                    <button className="px-6 py-2.5 bg-[#E5D5B8] text-black font-semibold rounded-lg hover:bg-[#d4c3a3] transition-colors">
                        Book a Shoot
                    </button>
                </div>
            </div>

            {/* Pagination/Sort info */}
            <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] text-white rounded-full text-sm hover:bg-[#222] transition-colors">
                    <span>Sort by Date</span>
                    <Filter size={14} />
                </button>
            </div>

            {/* Table */}
            <div className="w-full bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[#888] text-sm font-normal border-b border-[#333]">
                                <th className="py-5 px-6 font-medium">User ID</th>
                                <th className="py-5 px-6 font-medium">Creative Name</th>
                                <th className="py-5 px-6 font-medium">Email ID</th>
                                <th className="py-5 px-6 font-medium">Roles</th>
                                <th className="py-5 px-6 font-medium">Status</th>
                                <th className="py-5 px-6 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr
                                    key={idx}
                                    onClick={(e) => handleRowClick(user.id, e)}
                                    className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                                >
                                    <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.id}</td>
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar: If no image, show initials */}
                                            <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-[#E0E0E0] font-medium text-[15px]">{user.name}</p>
                                                <p className="text-[#666666] text-xs mt-0.5">{user.joinDate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.email}</td>
                                    <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.role}</td>
                                    <td className="py-5 px-6">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {user.status === 'Approved' && (
                                                <>
                                                    <button className="text-[#E0E0E0] hover:text-white transition-colors">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button className="text-[#E0E0E0] hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button className="text-[#666] hover:text-white transition-colors">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'Pending' && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleApprove(user.id, e)}
                                                        className="px-3 py-1 bg-[#F0FFF4] text-[#22C55E] text-xs font-semibold rounded hover:bg-[#dcfce4] transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDecline(user.id, e)}
                                                        className="px-3 py-1 text-[#EF4444] text-xs font-semibold hover:bg-[#FFEBEB] rounded transition-colors underline decoration-1 underline-offset-2"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button className="text-[#666] hover:text-white transition-colors ml-1">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'Rejected' && (
                                                <>
                                                    <button className="text-[#E0E0E0] hover:text-white transition-colors">
                                                        <AlertCircle size={20} />
                                                    </button>
                                                    <button className="text-[#666] hover:text-white transition-colors">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
