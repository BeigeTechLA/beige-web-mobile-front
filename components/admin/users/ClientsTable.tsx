"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Search, Check, X, AlertCircle } from "lucide-react";
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

type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

interface Client {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    joinDate: string;
    initials: string;
    phoneNumber: string;
    imageUrl?: string | null;
}

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

export const ClientsTable = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const router = useRouter();

    const handleDateSort = (date: Date | null) => {
        setSelectedDate(date);
    };

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const params: any = {
                    page: currentPage,
                    limit: limit,
                };

                if (debouncedSearch) params.search = debouncedSearch;
                if (statusFilter !== "all") params.status = statusFilter;

                const response = await adminApi.getClients(params);
                if (response && response.data) {
                    if (response.pagination) {
                        setTotalRecords(response.pagination.total_records || 0);
                        setTotalPages(response.pagination.total_pages || 0);
                    } else {
                        // If no pagination provided, treat as a single page
                        setTotalRecords(Array.isArray(response.data) ? response.data.length : 0);
                        setTotalPages(1);
                    }

                    const data = Array.isArray(response.data) ? response.data : (response.data.items || []);

                    const mappedClients = data.map((client: any) => {
                        const fullName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown";
                        const statusMapping = (val: any) => {
                            if (val === 1 || val === "Active" || val === "approved") return "Active";
                            if (val === 0 || val === "Inactive" || val === "rejected") return "Inactive";
                            return "Pending";
                        };

                        return {
                            id: `#${client.user_id || client.id || client.client_id}`,
                            name: fullName,
                            email: client.email || "No Email",
                            status: statusMapping(client.status || client.is_active),
                            joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
                            initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                            phoneNumber: client.phone_number || "N/A",
                            imageUrl: client.profile_image || client.image || null,
                        };
                    });
                    setClients(mappedClients);
                }
            } catch (error) {
                console.error("Failed to fetch clients:", error);
                toast.error("Failed to load clients");
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [currentPage, limit, debouncedSearch, statusFilter]);

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        // Navigation to client profile could be added here
        // const cleanId = id.replace('#', '');
        // router.push(`/admin/users/clients/${cleanId}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Clients</h1>
                <p className="text-[#888]">Manage and review all registered clients in one place.</p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
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
                                <th className="py-5 px-6 font-medium">Client Name</th>
                                <th className="py-5 px-6 font-medium">Email ID</th>
                                <th className="py-5 px-6 font-medium">Mobile Number</th>
                                <th className="py-5 px-6 font-medium">Status</th>
                                <th className="py-5 px-6 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        {loading && (
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-[#888]">
                                        Loading clients...
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && clients.length === 0 && (
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-[#888]">
                                        No clients found.
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        {!loading && clients.length > 0 && (
                            <tbody>
                                {clients.map((client, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={(e) => handleRowClick(client.id, e)}
                                        className="border-b border-[#222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                                    >
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{client.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
                                                    {client.imageUrl ? (
                                                        <img
                                                            src={client.imageUrl}
                                                            alt={client.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                if (target.parentElement) {
                                                                    target.parentElement.textContent = client.initials;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        client.initials
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[#E0E0E0] font-medium text-[15px]">{client.name}</p>
                                                    <p className="text-[#666666] text-xs mt-0.5">{client.joinDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">{client.email}</td>
                                        <td className="py-5 px-6 text-[#E0E0E0] text-[15px]">
                                            <a href={`tel:${client.phoneNumber}`} className="hover:text-[#E5D5B8] transition-colors">
                                                {client.phoneNumber}
                                            </a>
                                        </td>
                                        <td className="py-5 px-6">
                                            <StatusBadge status={client.status} />
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button className="text-[#666] hover:text-white transition-colors">
                                                    <ChevronRight size={20} />
                                                </button>
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
