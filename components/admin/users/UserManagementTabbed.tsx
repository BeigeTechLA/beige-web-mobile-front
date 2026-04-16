"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronRight, Search, User, Camera, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useTheme } from 'next-themes';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

type UserType = "All" | "Client" | "Creative Partner";
type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

interface UserData {
    id: string;
    name: string;
    email: string;
    type: UserType;
    status: UserStatus;
    joinDate: string;
    initials: string;
    phoneNumber?: string;
    role?: string;
    imageUrl?: string | null;
    referralCode?: string | null;
}

type SortConfig = {
    key: keyof UserData;
    direction: 'asc' | 'desc';
} | null;

const StatusBadge = ({ status }: { status: UserStatus }) => {
    const styles = {
        Active: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
        Approved: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
        Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
        Inactive: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
        Rejected: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
    };
    return (
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[status] || styles.Pending}`}>
            {status}
        </span>
    );
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const UserManagementTabbed = () => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [activeTab, setActiveTab] = useState<UserType>("All");
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const router = useRouter();

    useEffect(() => setMounted(true), []);
    const isDark = !mounted || theme === "dark";

    const sortedUsers = useMemo(() => {
        if (!sortConfig) return users;

        const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
        const statusRank: Record<UserStatus, number> = {
            Active: 1,
            Approved: 2,
            Pending: 3,
            Inactive: 4,
            Rejected: 5,
        };
        const typeRank: Record<UserType, number> = {
            All: 0,
            Client: 1,
            "Creative Partner": 2,
        };

        const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

        return users
            .map((user, index) => ({ user, index }))
            .sort((aItem, bItem) => {
                const a = aItem.user;
                const b = bItem.user;
                const key = sortConfig.key;
                let compareResult = 0;

                if (key === "id") {
                    const aNum = parseInt(String(a.id).replace("#", ""), 10);
                    const bNum = parseInt(String(b.id).replace("#", ""), 10);
                    compareResult = (isNaN(aNum) ? 0 : aNum) - (isNaN(bNum) ? 0 : bNum);
                } else if (key === "status") {
                    compareResult = (statusRank[a.status] ?? 999) - (statusRank[b.status] ?? 999);
                } else if (key === "type") {
                    compareResult = (typeRank[a.type] ?? 999) - (typeRank[b.type] ?? 999);
                } else if (key === "joinDate") {
                    const aTime = new Date(a.joinDate).getTime() || 0;
                    const bTime = new Date(b.joinDate).getTime() || 0;
                    compareResult = aTime - bTime;
                } else {
                    const aText = normalizeText(a[key]);
                    const bText = normalizeText(b[key]);
                    compareResult = aText.localeCompare(bText, undefined, {
                        sensitivity: "base",
                        numeric: true,
                    });
                }

                if (compareResult === 0) {
                    return aItem.index - bItem.index;
                }
                return compareResult * directionMultiplier;
            })
            .map((item) => item.user);
    }, [users, sortConfig]);

    const requestSort = (key: keyof UserData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof UserData, isDark: boolean) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
        return sortConfig.direction === 'asc' ?
            <ArrowUp size={14} className={`ml-1 ${isDark ? "text-[#E5D5B8]":" text-[#666]"}`} /> :
            <ArrowDown size={14} className={`ml-1 ${isDark ? "text-[#E5D5B8]":" text-[#666]"}`} />;
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = { page: currentPage, limit: limit };
            if (debouncedSearch) params.search = debouncedSearch;

            // Filter logic based on requirements
            const isCreativeStatus = ["approved", "pending", "rejected"].includes(statusFilter);
            const isActiveFilter = statusFilter === "active";

            // Determine if we should call the Client API
            const shouldFetchClients =
                activeTab === "Client" ||
                (activeTab === "All" && !isCreativeStatus);

            // Determine if we should call the Creative Partner API
            const shouldFetchCreatives =
                activeTab === "Creative Partner" ||
                (activeTab === "All" && !isActiveFilter);

            let allUsers: UserData[] = [];
            let paginationData: any = null;

            if (shouldFetchClients) {
                const clientsRes = await adminApi.getAdminClients(params);
                if (clientsRes?.data) {
                    const items = Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.items || []);
                    const mapped = items.map((client: any) => ({
                        id: `#${client.client_id || client.id}`,
                        name: client.name || "Unknown",
                        email: client.email || "No Email",
                        type: "Client" as UserType,
                        status: (client.is_active === 1 || client.is_active === true ? "Active" : "Inactive") as UserStatus,
                        joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString() : "N/A",
                        initials: (client.name || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                        phoneNumber: client.phone_number || "N/A",
                        imageUrl: client.profile_image || null,
                        referralCode: client.referral_code || null,
                    }));
                    allUsers = [...allUsers, ...mapped];
                    paginationData = clientsRes.pagination;
                }
            }

            if (shouldFetchCreatives) {
                const creativeParams = { ...params };
                // If we are in the Creative Tab or All Tab with a specific creative status, pass the status
                if (isCreativeStatus) creativeParams.status = statusFilter;

                const creativeRes = await adminApi.getCrewMembers(creativeParams);
                if (creativeRes?.data) {
                    const items = Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || []);
                    const mapped = items.map((member: any) => {
                        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || "Unknown";
                        const profilePhoto = member.crew_member_files?.find((f: any) => f.file_type === 'profile_photo');
                        return {
                            id: `#${member.crew_member_id || member.id}`,
                            name: fullName,
                            email: member.email || "No Email",
                            type: "Creative Partner" as UserType,
                            status: (member.status?.toLowerCase() === "approved" ? "Approved" :
                                member.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as UserStatus,
                            joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A",
                            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            role: member.role?.role_name || "N/A",
                            imageUrl: profilePhoto ? `${S3_PREFIX}${profilePhoto.file_path}` : null,
                            referralCode: member.referral_code || null,
                        };
                    });
                    allUsers = [...allUsers, ...mapped];
                    if (!paginationData) paginationData = creativeRes.pagination;
                }
            }

            setUsers(allUsers);
            setTotalRecords(paginationData?.total_records || allUsers.length);
            setTotalPages(paginationData?.total_pages || 1);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab, currentPage, debouncedSearch, statusFilter]);

    const handleRowClick = (user: UserData) => {
        const cleanId = user.id.replace('#', '');
        router.push(`/admin/users/${user.type === "Client" ? "clients" : "creative-partners"}/${cleanId}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-lg lg:text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#323232]"}`}>User Management</h1>
                <p className={isDark ? "text-[#888]" : "text-[#666]"}>Manage and review all registered users in one place.</p>
            </div>

            {/* Tabs - Following button logic */}
            <div className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"
                }`}>
                {(["All", "Client", "Creative Partner"] as UserType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setCurrentPage(1); setStatusFilter("all"); }}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? "bg-[#E5D5B8] text-black shadow-lg"
                                : isDark ? "text-[#777] hover:text-white" : "text-[#666] hover:text-black"
                            }`}
                    >
                        {tab === "Creative Partner" ? "Creative Partners" : tab === "Client" ? "Users" : "All Users"}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
                                }`}
                        />
                    </div>

                    {/* Conditional Select Rendering */}
                    {activeTab !== "Client" && (
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] rounded-lg h-[46px] capitalize transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
                                }`}>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className={isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}>
                                <SelectItem value="all">All Status</SelectItem>

                                {/* Show Active only on the "All" tab */}
                                {activeTab === "All" && (
                                    <SelectItem value="active">Active (Clients)</SelectItem>
                                )}

                                {/* Statuses for Creative Partners */}
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <div className={`w-full rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-white border-[#E3E3E3] shadow-sm"
                }`}>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={` text-sm font-normal border-b ${isDark ? "text-[#888] border-[#333]":"bg-[#FFFCF6] text-[#000] border-[#E5E5E5]"}`}>
                                <th className="py-5 px-6 font-medium cursor-pointer" onClick={() => requestSort('id')}>
                                    <div className="flex items-center">User ID {getSortIcon('id', isDark)}</div>
                                </th>
                                <th className="py-5 px-6 font-medium cursor-pointer" onClick={() => requestSort('name')}>
                                    <div className="flex items-center">User Name {getSortIcon('name', isDark)}</div>
                                </th>
                                <th className="py-5 px-6 font-medium cursor-pointer" onClick={() => requestSort('type')}>
                                    <div className="flex items-center">Type {getSortIcon('type', isDark)}</div>
                                </th>
                                <th className="py-5 px-6 font-medium">Contact / Role</th>
                                <th className="py-5 px-6 font-medium cursor-pointer" onClick={() => requestSort('status')}>
                                    <div className="flex items-center">Status {getSortIcon('status', isDark)}</div>
                                </th>
                                <th className="py-5 px-6 font-medium">Referral Code</th>
                                <th className="py-5 px-6 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                  </td>
                </tr>                            ) : sortedUsers.length === 0 ? (
                                <tr><td colSpan={7} className="py-10 text-center text-[#888]">No users found.</td></tr>
                            ) : (
                                sortedUsers.map((user, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => handleRowClick(user)}
                                        className={`border-b cursor-pointer transition-colors ${isDark ? "border-[#222] hover:bg-white/[0.02] text-[#E0E0E0]" : "border-[#F0F0F0] hover:bg-black/[0.01] text-[#000]"
                                            }`}>
                                        <td className="py-5 px-6">{user.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold border overflow-hidden ${
                                                    isDark ? "bg-[#1A1A1A] text-[#E5D5B8] border-white/5" : "bg-[#F5F5F5] text-[#8B7E66] border-[#E3E3E3]"
                                                }`}>
                                                    {user.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" alt="" /> : <span>{user.initials}</span>}
                                                </div>
                                                <div>
                                                    <p className={`font-medium`}>{user.name}</p>
                                                    <p className={isDark ? "text-[#666] text-xs" : "text-[#999] text-xs"}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`py-5 px-6 text-sm ${isDark ? "text-[#888]" : "text-[#666]"}`}>
                                            <div className="flex items-center gap-2">
                                                {user.type === "Client" ? <User size={14} /> : <Camera size={14} />}
                                                {user.type}
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            {user.type === "Client" ? user.phoneNumber : <span className={`px-2 py-0.5 rounded text-xs ${isDark ? "bg-[#E5D5B8]/10 text-[#E5D5B8]": "bg-transparent text-[#000]"}`}>{user.role}</span>}
                                        </td>
                                        <td className="py-5 px-6"><StatusBadge status={user.status} /></td>
                                        <td className={`py-5 px-6 text-sm ${isDark ? "text-[#888]" : "text-[#666]"}`}>
                                            {user.referralCode ? (
                                                <span className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${isDark ? "bg-[#E5D5B8]/10 text-[#E5D5B8]" : "bg-[#F5F0E8] text-[#8B7E66]"}`}>{user.referralCode}</span>
                                            ) : (
                                                <span className="opacity-40">—</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6 text-right"><ChevronRight size={20} className={isDark ? "text-[#666]" : "text-[#999]"} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination remains the same using original totalRecords */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center p-6 border-t border-[#333333]">
                    <div className="text-sm text-[#666666]">
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === pageNum
                                            ? "bg-[#E5D5B8] text-black"
                                            : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
