"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronRight, Search, Check, X, AlertCircle, Users, User, Camera, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
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
}

// Configuration for sorting
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

    const displayStatus = styles[status] ? status : "Pending";

    return (
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[displayStatus as keyof typeof styles]}`}>
            {status}
        </span>
    );
};

export const UserManagementTabbed = () => {
    const [activeTab, setActiveTab] = useState<UserType>("All");
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortConfig, setSortConfig] = useState<SortConfig>(null); // New Sort State
    const debouncedSearch = useDebounce(searchQuery, 500);
    const router = useRouter();

    // Sorting Logic
    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? "";
                const bValue = b[sortConfig.key] ?? "";

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const requestSort = (key: keyof UserData) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof UserData) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
        return sortConfig.direction === 'asc' ? 
            <ArrowUp size={14} className="ml-1 text-[#E5D5B8]" /> : 
            <ArrowDown size={14} className="ml-1 text-[#E5D5B8]" />;
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: currentPage,
                limit: limit,
            };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter !== "all") params.status = statusFilter;

            let allUsers: UserData[] = [];
            let pagination: any = null;

            if (activeTab === "Client" || activeTab === "All") {
                const clientsRes = await adminApi.getClients(params);
                if (clientsRes?.data) {
                    const mappedClients = (Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.items || [])).map((client: any) => ({
                        id: `#${client.client_id || client.id || client.user_id}`,
                        name: client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown",
                        email: client.email || "No Email",
                        type: "Client" as UserType,
                        status: (client.status === 1 || client.status === "Active" || client.status === "approved" ? "Active" :
                            client.status === 0 || client.status === "Inactive" || client.status === "rejected" ? "Inactive" : "Pending") as UserStatus,
                        joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
                        initials: (client.name || "Unknown").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                        phoneNumber: client.phone_number || "N/A",
                        imageUrl: client.profile_image || client.image || null,
                    }));
                    allUsers = [...allUsers, ...mappedClients];
                    if (!pagination) pagination = clientsRes.pagination;
                }
            }

            if (activeTab === "Creative Partner" || activeTab === "All") {
                const creativeRes = await adminApi.getCrewMembers(params);
                if (creativeRes?.data) {
                    const mappedCreatives = (Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || [])).map((member: any) => {
                        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || "Unknown";
                        const profilePhoto = member.crew_member_files?.find((file: any) => file.file_type === 'profile_photo');
                        return {
                            id: `#${member.crew_member_id || member.id}`,
                            name: fullName,
                            email: member.email || "No Email",
                            type: "Creative Partner" as UserType,
                            status: (member.status?.toLowerCase() === "approved" ? "Approved" :
                                member.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as UserStatus,
                            joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
                            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            role: member.role?.role_name || "N/A",
                            imageUrl: profilePhoto ? `https://beigexmemehouse.s3.amazonaws.com/beige/${profilePhoto.file_path}` : null,
                        };
                    });
                    allUsers = [...allUsers, ...mappedCreatives];
                    if (!pagination) pagination = creativeRes.pagination;
                }
            }

            setUsers(allUsers);
            if (pagination) {
                setTotalRecords(pagination.total_records || allUsers.length);
                setTotalPages(pagination.total_pages || 1);
            } else {
                setTotalRecords(allUsers.length);
                setTotalPages(1);
            }

        } catch (error) {
            console.error("Failed to fetch users:", error);
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
        if (user.type === "Client") {
            router.push(`/admin/users/clients/${cleanId}`);
        } else if (user.type === "Creative Partner") {
            router.push(`/admin/users/creative-partners/${cleanId}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
                <p className="text-[#888]">Manage and review all registered users in one place.</p>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl w-fit border border-[#333]">
                {(["All", "Client", "Creative Partner"] as UserType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setCurrentPage(1);
                            setSortConfig(null); // Reset sort when changing tabs
                        }}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                            ? "bg-[#E5D5B8] text-black shadow-lg"
                            : "text-[#777] hover:text-white"
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
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
            </div>

            {/* Table */}
            <div className="w-full bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[#888] text-sm font-normal border-b border-[#333]">
                                <th 
                                    className="py-5 px-6 font-medium cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('id')}
                                >
                                    <div className="flex items-center">User ID {getSortIcon('id')}</div>
                                </th>
                                <th 
                                    className="py-5 px-6 font-medium cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('name')}
                                >
                                    <div className="flex items-center">User Name {getSortIcon('name')}</div>
                                </th>
                                <th 
                                    className="py-5 px-6 font-medium cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('type')}
                                >
                                    <div className="flex items-center">Type {getSortIcon('type')}</div>
                                </th>
                                <th className="py-5 px-6 font-medium">Contact / Role</th>
                                <th 
                                    className="py-5 px-6 font-medium cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center">Status {getSortIcon('status')}</div>
                                </th>
                                <th className="py-5 px-6 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#888]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#888]">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => handleRowClick(user)}
                                        className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                                    >
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{user.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] overflow-hidden flex items-center justify-center text-[#E5D5B8] font-semibold text-sm border border-white/5 relative">
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
                                                        <span className="text-zinc-400">{user.initials}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[#E0E0E0] font-medium text-[15px]">{user.name}</p>
                                                    <p className="text-[#666666] text-xs mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2 text-sm text-[#888]">
                                                {user.type === "Client" ? <User size={14} /> : <Camera size={14} />}
                                                <span>{user.type}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">
                                            {user.type === "Client" ? (
                                                <span className="text-zinc-500">{user.phoneNumber}</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-[#E5D5B8]/10 text-[#E5D5B8] rounded text-xs">
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <button className="text-[#666] hover:text-white transition-colors">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
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