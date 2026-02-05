"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Pencil, Trash2, Search, Filter, ArrowUpRight, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SortDateButton } from "@/components/admin/SortDateButton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

type UserStatus = "Approved" | "Pending" | "Rejected";

interface CreativePartner {
    id: string;
    name: string;
    email: string;
    role: string;
    status: UserStatus;
    joinDate: string;
    initials: string;
    imageUrl?: string | null;
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
    const [users, setUsers] = useState<CreativePartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const router = useRouter();

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
        if (date) {
            console.log(date);
        } else {
            console.log("unfiltered");
        }
    };

    // Fetch skills on mount
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await adminApi.getSkills();
                if (response && response.data) {
                    // Create a map of id to name
                    const skillMap: Record<string, string> = {};
                    response.data.forEach((skill: any) => {
                        skillMap[skill.id?.toString()] = skill.name;
                    });
                    setSkillsMap(skillMap);
                }
            } catch (error) {
                console.error("Failed to fetch skills:", error);
            }
        };
        fetchSkills();
    }, []);

    useEffect(() => {
        const fetchCreativePartners = async () => {
            setLoading(true);
            try {
                const params: any = {
                    page: currentPage,
                    limit: limit,
                };

                if (debouncedSearch) params.search = debouncedSearch;
                if (statusFilter !== "all") params.status = statusFilter;

                const response = await adminApi.getCrewMembers(params);
                if (response && response.data) {
                    // Set pagination data
                    if (response.pagination) {
                        setTotalRecords(response.pagination.total_records || 0);
                        setTotalPages(response.pagination.total_pages || 0);
                    }

                    const data = Array.isArray(response.data) ? response.data : (response.data.items || []);

                    // Map API response to component data structure
                    const mappedUsers = data.map((member: any) => {
                        // Combine first_name and last_name
                        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || "Unknown";

                        // Role mapping: Use role.role_name if available, otherwise fallback to skills
                        let displayRole = "N/A";
                        if (member.role?.role_name) {
                            displayRole = member.role.role_name;
                        } else if (member.skills) {
                            try {
                                const skillsArray = typeof member.skills === 'string' ? JSON.parse(member.skills) : member.skills;
                                if (Array.isArray(skillsArray) && skillsArray.length > 0) {
                                    const skillNames = skillsArray
                                        .map((skillId: any) => skillsMap[skillId.toString()])
                                        .filter(Boolean);
                                    displayRole = skillNames.length > 0 ? skillNames.join(', ') : "N/A";
                                }
                            } catch (e) {
                                displayRole = "N/A";
                            }
                        }

                        // Get profile photo from crew_member_files
                        const profilePhoto = member.crew_member_files?.find(
                            (file: any) => file.file_type === 'profile_photo'
                        );
                        const imageUrl = profilePhoto
                            ? `https://beigexmemehouse.s3.amazonaws.com/beige/${profilePhoto.file_path}`
                            : null;

                        // Normalize status
                        const apiStatus = member.status?.toLowerCase() || "";
                        let displayStatus: UserStatus = "Pending";
                        if (apiStatus === "approved") displayStatus = "Approved";
                        else if (apiStatus === "rejected") displayStatus = "Rejected";

                        return {
                            id: `#${member.crew_member_id}`,
                            name: fullName,
                            email: member.email || "No Email",
                            role: displayRole,
                            status: displayStatus,
                            joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
                            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            imageUrl,
                        };
                    });
                    setUsers(mappedUsers);
                }
            } catch (error) {
                console.error("Failed to fetch creative partners:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCreativePartners();
    }, [currentPage, limit, debouncedSearch, statusFilter]);

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

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanId = id.replace('#', '');
        try {
            const response = await adminApi.verifyCrewMember({
                crew_member_id: parseInt(cleanId),
                status: 1
            });
            if (response && !response.error) {
                setUsers(users.map(u => u.id === id ? { ...u, status: "Approved" } : u));
                showSuccessToast();
            } else {
                toast.error(response.error || "Failed to approve partner");
            }
        } catch (error) {
            console.error("Approve Error:", error);
            toast.error("An unexpected error occurred");
        }
    };

    const handleDecline = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanId = id.replace('#', '');
        try {
            const response = await adminApi.verifyCrewMember({
                crew_member_id: parseInt(cleanId),
                status: 2
            });
            if (response && !response.error) {
                setUsers(users.map(u => u.id === id ? { ...u, status: 'Rejected' } : u));
                showDeclineToast();
            } else {
                toast.error(response.error || "Failed to decline partner");
            }
        } catch (error) {
            console.error("Decline Error:", error);
            toast.error("An unexpected error occurred");
        }
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
                {/* Search & Status Filter */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#555] transition-colors"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] bg-[#111] border-[#333] text-white rounded-lg h-[46px] focus:ring-0 capitalize">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
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
                    </button> */}
                    <SortDateButton
                        selectedDate={selectedDate}
                        onDateChange={handleDateSort}
                    />
                </div>
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
                        {loading && (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#888]">
                                        Loading creative partners...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && users.length === 0 && (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#888]">
                                        No creative partners found.
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && users.length > 0 && (
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
                                                {/* Avatar: Show image if available, otherwise show initials */}
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                                    {user.imageUrl ? (
                                                        <img
                                                            src={user.imageUrl}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                // Fallback to initials if image fails to load
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                if (target.parentElement) {
                                                                    target.parentElement.textContent = user.initials;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        user.initials
                                                    )}
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
                                                        {/* <button className="text-[#E0E0E0] hover:text-white transition-colors">
                                                            <Pencil size={18} />
                                                        </button> */}
                                                        {/* <button className="text-[#E0E0E0] hover:text-red-500 transition-colors">
                                                            <Trash2 size={18} />
                                                        </button> */}
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
                                                        {/* <button className="text-[#E0E0E0] hover:text-white transition-colors">
                                                            <AlertCircle size={20} />
                                                        </button> */}
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
                        )}
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center p-6 border-t border-[#333333]">
                    <div className="text-sm text-[#666666]">
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
                            {(() => {
                                const range = [];
                                const delta = 1;
                                const left = currentPage - delta;
                                const right = currentPage + delta + 1;

                                for (let i = 1; i <= totalPages; i++) {
                                    if (i === 1 || i === totalPages || (i >= left && i < right)) {
                                        range.push(i);
                                    } else if (i === left - 1 || i === right) {
                                        range.push('...');
                                    }
                                }

                                return range.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
                                    page === '...' ? (
                                        <span key={`dots-${index}`} className="px-2 py-1 text-white/30 text-xs">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page
                                                ? "bg-[#E5D5B8] text-black"
                                                : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ));
                            })()}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
