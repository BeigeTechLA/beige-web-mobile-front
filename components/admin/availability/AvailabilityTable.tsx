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

export const AvailabilityTable = () => {
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
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-[#666]" />;
        return sortConfig.direction === 'ASC' 
            ? <ArrowUp size={14} className="text-[#E5D5B8]" /> 
            : <ArrowDown size={14} className="text-[#E5D5B8]" />;
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
        <div className="space-y-6 font-instrument-sans">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Availability Management</h1>
                <p className="text-[#888]">Manage and review all onboarded creative professionals in one place.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, email or ID..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#555] transition-all"
                    />
                </div>
                <SortDateButton selectedDate={selectedDate} onDateChange={handleDateSort} />
            </div>

            <div className="w-full bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[#888] text-sm font-normal border-b border-[#333]">
                                <th className="py-5 px-6 font-medium cursor-pointer group" onClick={() => toggleSort('crew_member_id')}>
                                    <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                                        User ID {getSortIcon('crew_member_id')}
                                    </div>
                                </th>
                                <th className="py-5 px-6 font-medium cursor-pointer group" onClick={() => toggleSort('first_name')}>
                                    <div className="flex items-center gap-2 group-hover:text-white transition-colors">
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
                                    <td colSpan={6} className="py-20 text-center text-[#888]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
                                            <span>Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-[#888]">No partners found.</td>
                                </tr>
                            ) : (
                                users.map((user, idx) => (
                                    <tr key={idx} onClick={() => router.push(`/admin/availability/${user.id.replace('#','')}`)}
                                        className="border-b border-[#222] hover:bg-white/[0.04] cursor-pointer transition-colors last:border-0">
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm">
                                                    {user.imageUrl ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" /> : user.initials}
                                                </div>
                                                <div>
                                                    <p className="text-[#E0E0E0] font-medium text-[15px]">{user.name}</p>
                                                    <p className="text-[#666] text-xs mt-0.5">{user.joinDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.email}</td>
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.role}</td>
                                        <td className="py-5 px-6"><StatusBadge status={user.status} /></td>
                                        <td className="py-5 px-6 text-center">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10 mx-auto transition-colors">
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
                    <div className="flex justify-between items-center p-6 border-t border-[#333]">
                        <div className="text-sm text-[#666]">
                            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="px-4 py-2 text-sm rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] disabled:opacity-30">
                                Previous
                            </button>
                            {/* Simple pagination numbers */}
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1 ? "bg-[#E5D5B8] text-black" : "text-white/60 hover:bg-white/5"}`}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] disabled:opacity-30">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};