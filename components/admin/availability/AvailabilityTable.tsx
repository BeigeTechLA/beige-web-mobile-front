"use client";

import React, { useState, useEffect } from "react";
import { Eye, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";

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
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[status] || styles.Pending}`}>
            {status}
        </span>
    );
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

interface AvailabilityTableProps {
    isDark?: boolean;
}
export const AvailabilityTable = ({ isDark = true }: AvailabilityTableProps) => {
    const [users, setUsers] = useState<CreativePartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});

    // Search, Date and Sort States
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ASC' | 'DESC' }>({
        key: 'crew_member_id',
        direction: 'DESC'
    });

    const router = useRouter();

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
        setCurrentPage(1);
    };

    const toggleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC'
        }));
        setCurrentPage(1);
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className={isDark ? "text-[#666]" : "text-[#999]"} />;
        return sortConfig.direction === 'ASC'
            ? <ArrowUp size={14} className={isDark ? "text-[#E5D5B8]" : "text-black"} />
            : <ArrowDown size={14} className={isDark ? "text-[#E5D5B8]" : "text-black"} />;
    };

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await adminApi.getSkills();
                if (response?.data) {
                    const skillMap: Record<string, string> = {};
                    response.data.forEach((skill: any) => {
                        skillMap[skill.id?.toString()] = skill.name;
                    });
                    setSkillsMap(skillMap);
                }
            } catch (error) { console.error("Skills fetch error:", error); }
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
                    search: debouncedSearch,
                    sort_by: sortConfig.key,
                    sort_order: sortConfig.direction
                };

                if (selectedDate) {
                    const dateStr = format(selectedDate, "yyyy-MM-dd");
                    params.start_date = dateStr;
                    params.end_date = dateStr;
                }

                const response = await adminApi.getapprovedCrewMembers(params);
                if (response && response.data) {
                    if (response.pagination) {
                        setTotalRecords(response.pagination.total_records || 0);
                        setTotalPages(response.pagination.total_pages || 0);
                    }

                    const data = Array.isArray(response.data) ? response.data : (response.data.items || []);
                    const mappedUsers = data.map((member: any) => {
                        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || "Unknown";
                        const profilePhoto = member.crew_member_files?.find((f: any) => f.file_type === 'profile_photo');

                        // Map status correctly
                        const apiStatus = member.status?.toLowerCase();
                        let displayStatus: UserStatus = "Pending";
                        if (apiStatus === "approved" || member.is_crew_verified === 1) displayStatus = "Approved";
                        else if (apiStatus === "rejected") displayStatus = "Rejected";

                        return {
                            id: `#${member.crew_member_id}`,
                            name: fullName,
                            email: member.email || "No Email",
                            role: member.role?.role_name || "N/A",
                            status: displayStatus,
                            joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
                            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            imageUrl: profilePhoto ? `${S3_PREFIX}${profilePhoto.file_path}` : null,
                        };
                    });
                    setUsers(mappedUsers);
                }
            } catch (error) { console.error("Fetch error:", error); }
            finally { setLoading(false); }
        };
        fetchCreativePartners();
    }, [currentPage, limit, debouncedSearch, selectedDate, sortConfig]);

    return (
        <div className={`space-y-6 font-instrument-sans transition-colors duration-300`}>
            <div>
                <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
                    }`}>Availability Management</h1>
                <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"
                    }`}>Manage and review all onboarded creative professionals in one place.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search name, email or ID..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className={`w-full border pl-10 pr-4 py-2.5 rounded-lg focus:outline-none transition-all ${isDark
                                ? "bg-[#111] border-[#333] text-white focus:border-[#555]"
                                : "bg-white border-[#D8D8D8] text-black focus:border-black"
                            }`}
                    />
                </div>
                <SortDateButton selectedDate={selectedDate} onDateChange={handleDateSort} />
            </div>

            <div className={`w-full rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-white border-[#D8D8D8]"}`}>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-sm font-normal border-b transition-colors ${isDark ? "text-[#888] border-[#333]" : "bg-[#FFFCF6] text-black border-[#E5E5E5]"
                                }`}>
                                <th className="py-5 px-6 font-medium cursor-pointer group" onClick={() => toggleSort('crew_member_id')}>
                                    <div className={`flex items-center gap-2 transition-colors ${isDark ? "group-hover:text-white" : "group-hover:text-black"}`}>
                                        User ID {getSortIcon('crew_member_id')}
                                    </div>
                                </th>
                                <th className="py-5 px-6 font-medium cursor-pointer group" onClick={() => toggleSort('first_name')}>
                                    <div className={`flex items-center gap-2 transition-colors ${isDark ? "group-hover:text-white" : "group-hover:text-black"}`}>
                                        Creative Name {getSortIcon('first_name')}
                                    </div>
                                </th>
                                <th className="py-5 px-6 font-medium">Email ID</th>
                                <th className="py-5 px-6 font-medium">Roles</th>
                                <th className="py-5 px-6 font-medium cursor-pointer group">
                                    <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                                        Status
                                    </div>
                                </th>
                                <th className="py-5 px-6 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? "border-[#E5D5B8]" : "border-black/70"}`} />
                                            <span className={isDark ? "text-[#888]" : "text-black/50"}>Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={`py-20 text-center ${isDark ? "text-[#888]" : "text-black/50"}`}>No partners found.</td>
                                </tr>
                            ) : (
                                users.map((user, idx) => (
                                    <tr key={idx} onClick={() => router.push(`/admin/availability/${user.id.replace('#', '')}`)}
                                        className={`border-b cursor-pointer transition-colors last:border-0 ${isDark ? "border-[#222] hover:bg-white/[0.04]" : "border-[#F5F5F5] hover:bg-black/[0.02]"
                                            }`}>
                                        <td className={`py-5 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-gray-100 text-black"
                                                    }`}>
                                                    {user.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : user.initials}
                                                </div>
                                                <div>
                                                    <p className={`font-medium text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.name}</p>
                                                    <p className={`text-xs mt-0.5 ${isDark ? "text-[#666]" : "text-black/40"}`}>{user.joinDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`py-5 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.email}</td>
                                        <td className={`py-5 px-6 text-[15px] ${isDark ? "text-[#E0E0E0]" : "text-black"}`}>{user.role}</td>
                                        <td className="py-5 px-6"><StatusBadge status={user.status} /></td>
                                        <td className="py-5 px-6 text-center">
                                            <button className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/20 text-white/80 hover:bg-white/10" : "border-black/10 text-black/60 hover:bg-black/5"
                                                }`}>
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && totalPages > 1 && (
                    <div className={`flex justify-between items-center p-6 border-t transition-colors ${isDark ? "border-[#333]" : "border-[#E5E5E5]"
                        }`}>
                        <div className={`text-sm ${isDark ? "text-[#666]" : "text-black/50"}`}>
                            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className={`px-4 py-2 text-sm rounded-lg border disabled:opacity-30 transition-all ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333]" : "bg-white text-black/60 border-[#D8D8D8]"
                                    }`}>
                                Previous
                            </button>
                            {/* Simple pagination numbers */}
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1
                                            ? "bg-[#E5D5B8] text-black"
                                            : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                                        }`}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className={`px-4 py-2 text-sm rounded-lg border disabled:opacity-30 transition-all ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333]" : "bg-white text-black/60 border-[#D8D8D8]"
                                    }`}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};