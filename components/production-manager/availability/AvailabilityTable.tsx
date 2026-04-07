"use client";

import React, { useState, useEffect } from "react";
import { Eye, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

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

interface AvailabilityTableProps {
    isDark?: boolean;
}
const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const AvailabilityTable = ({ isDark = true }: AvailabilityTableProps) => {
    const [users, setUsers] = useState<CreativePartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ASC' | 'DESC' }>({
        key: 'crew_member_id',
        direction: 'DESC'
    });
    const router = useRouter();

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

    // Fetch skills on mount
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                // Check if this API is restricted. If so, suppression needed.
                // Assuming skills might be shared/public or catch error.
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
                // Production Manager has restricted access.
                // Attempt to fetch, but handle 403 gracefully.
                const params: any = {
                    page: currentPage,
                    limit: limit,
                    sort_by: sortConfig.key,
                    sort_order: sortConfig.direction
                };

                const response = await adminApi.getapprovedCrewMembers(params);
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
                            ? `${S3_PREFIX}${profilePhoto.file_path}`
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
            } catch (error: any) {
                console.error("Failed to fetch creative partners:", error);
                // Graceful fallback for 403 or other errors
                if (error.response?.status === 403) {
                    setUsers([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCreativePartners();
    }, [currentPage, limit, skillsMap]); // Added skillsMap to deps to ensure roles map correctly if skills load late, though uncommon.

    // Navigate to detail page
    const handleViewAvailability = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanId = id.replace('#', '');
        router.push(`/production-manager/availability/${cleanId}`);
    };

    return (
        <div className={`space-y-6 font-instrument-sans transition-colors duration-300`}>
            {/* Header */}
            {/* <div className="flex items-center gap-4"> */}
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
                            }`}>Availability Management</h1>
                    </div>
                    <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>Manage and review all onboarded creative professionals in one place.</p>
                </div>
            {/* </div> */}

            {/* <div className="w-full h-px bg-[#333] my-6 border-dashed border-b border-white/10" /> */}

            {/* Table */}
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
                                    <td colSpan={6} className={`py-20 text-center ${isDark ? "text-[#888]" : "text-black/50"}`}> No creative partners found (or access restricted).</td>
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
                                                    {user.imageUrl ?
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
                                                        /> : user.initials}
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
                                            <button
                                                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${isDark ? "border-white/20 text-white/80 hover:bg-white/10" : "border-black/10 text-black/60 hover:bg-black/5"
                                                    }`}
                                                onClick={(e) => handleViewAvailability(user.id, e)}
                                            >
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