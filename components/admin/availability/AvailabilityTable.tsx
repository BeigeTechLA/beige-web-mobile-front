"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Search, Filter, ArrowUpRight, Calendar, Eye } from "lucide-react";
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

export const AvailabilityTable = () => {
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
    };

    // Fetch skills on mount
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await adminApi.getSkills();
                if (response && response.data) {
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
                    if (response.pagination) {
                        setTotalRecords(response.pagination.total_records || 0);
                        setTotalPages(response.pagination.total_pages || 0);
                    }

                    const data = Array.isArray(response.data) ? response.data : (response.data.items || []);

                    const mappedUsers = data.map((member: any) => {
                        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || "Unknown";

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

                        const profilePhoto = member.crew_member_files?.find(
                            (file: any) => file.file_type === 'profile_photo'
                        );
                        const imageUrl = profilePhoto
                            ? `https://beigexmemehouse.s3.amazonaws.com/beige/${profilePhoto.file_path}`
                            : null;

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

    const handleViewAvailability = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanId = id.replace('#', '');
        // For now, let's just show a toast or log, or maybe navigate to a details page if one exists
        // Since the requirement is just the UI for now, we'll keep the interaction minimal or placeholder
        toast.info(`View availability for user ${id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white mb-1">Availability Management</h1>
                        {/* {totalRecords > 0 && (
                            <span className="bg-[#2a2a2a] text-[#E5D5B8] text-xs px-2 py-0.5 rounded border border-[#E5D5B8]/20">
                                {String(totalRecords).padStart(2, '0')} Available CPS
                            </span>
                        )} */}
                        <span className="bg-[#2a2a2a] text-[#E5D5B8] text-xs px-2 py-0.5 rounded border border-[#E5D5B8]/20">
                            09 Available CPS
                        </span>
                    </div>
                    <p className="text-[#888]">Manage and review all onboarded creative professionals in one place.</p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors text-sm">
                        <span>Sort by Date</span>
                        <Calendar size={16} />
                    </button>
                </div>
            </div>

            <div className="w-full h-px bg-[#333] my-6 border-dashed border-b border-white/10" />


            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#555] transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px] bg-[#111] border-[#333] text-white rounded-lg h-[42px] focus:ring-0 capitalize">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#333] text-white rounded-lg hover:bg-[#222] transition-colors">
                        <ArrowUpRight size={16} />
                        <span>Export</span>
                    </button>
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
                                <th className="py-5 px-6 font-medium text-center">Availability</th>
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#888]">
                                        Loading availability data...
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
                                        className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0"
                                    >
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                                    {user.imageUrl ? (
                                                        <img
                                                            src={user.imageUrl}
                                                            alt={user.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
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
                                        <td className="py-5 px-6 text-center">
                                            <button
                                                onClick={(e) => handleViewAvailability(user.id, e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors mx-auto"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
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
