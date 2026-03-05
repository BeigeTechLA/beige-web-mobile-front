"use client";

import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
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
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[status]}`}>
            {status}
        </span>
    );
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const AvailabilityTable = () => {
    const [users, setUsers] = useState<CreativePartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [skillsMap, setSkillsMap] = useState<Record<string, string>>({});
    const router = useRouter();

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
        <div className="space-y-6 font-instrument-sans">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white mb-1">Availability Management</h1>
                    </div>
                    <p className="text-[#888]">Manage and review all onboarded creative professionals in one place.</p>
                </div>
            </div>

            {/* <div className="w-full h-px bg-[#333] my-6 border-dashed border-b border-white/10" /> */}

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
                                        No creative partners found (or access restricted).
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && users.length > 0 && (
                            <tbody>
                                {users.map((user, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={(e) => handleViewAvailability(user.id, e)}
                                        className="border-b border-[#222] hover:bg-white/[0.04] cursor-pointer transition-colors last:border-0"
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
