"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2, Calendar as CalendarIcon, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useGetLeadsQuery } from "@/lib/redux/features/sales/salesApi";
import { SalesLead, LeadStatus } from "@/types/sales";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";

/**
 * INTERNAL STYLE MAPPING
 * Kept exactly as your original code
 */
const STATUS_STYLES = {
    "Initiated": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Pre_Production": "bg-[#FDF4FF] text-[#C065F0] border-[#C065F0]/20",
    "Shoot Day": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Post_Production": "bg-[#E0F2FE] text-[#0EA5E9] border-[#0EA5E9]/20",
    "Revision": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Completed": "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    "Assets Delivered": "bg-[#E0F2FE] text-[#0EA5E9] border-[#0EA5E9]/20",
    "Cancelled": "bg-[#FFF5F5] text-[#EF4444] border-[#EF4444]/20",
    // Added new ones to ensure styles don't break
    "Paid": "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
    "In-Progress": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
};

const STATUS_LABEL_MAP: Record<number, string> = {
    0: "Initiated",
    1: "Pre_Production",
    2: "Shoot Day",
    3: "Post_Production",
    4: "Revision",
    5: "Completed",
    6: "Assets Delivered",
    7: "Cancelled",
};

interface LeadRecord {
    id: string;
    customerName: string;
    email: string;
    leadType: "Self-Serve" | "Sales Assisted";
    bookingStatus: "Paid" | "In-Progress"; 
    lastActivity: string;
    date: string;
}

/**
 * STATUS BADGE COMPONENT
 * Kept exactly as your original code
 */
const StatusBadge = ({ status, mobile }: { status: string; mobile?: boolean }) => {
    const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#F3F4F6] text-[#6B7280]";
    const padding = mobile ? "px-4 py-1 text-xs" : "px-6 py-2 text-sm";

    return (
        <span className={`${padding} rounded-full font-semibold border text-nowrap ${style}`}>
            {status}
        </span>
    );
};

/**
 * HELPER: Map lead status to UI format
 * Logic: If payment_status is 'paid' -> Paid, else -> In-Progress
 */
const mapLeadStatusToUI = (
    paymentStatus: string,
): "Paid" | "In-Progress" => {
    if (paymentStatus === "paid") return "Paid";
    return "In-Progress";
};

/**
 * HELPER: Format relative time
 * Kept exactly as your original code
 */
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
        const minutes = Math.floor(diffInMs / (1000 * 60));
        return `${minutes} minutes ago`;
    }
    if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return "1 day ago";
    }
    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString();
};

export const LeadsShootsTable = () => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Core Logic States
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filtering states
    const [status, setStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Ensure component is mounted to avoid hydration mismatch with themes
    useEffect(() => {
        setMounted(true);
    }, []);

    // PERSISTENT DATA STATE: This allows for smooth "direct" changes without loaders
    const [leadsData, setLeadsData] = useState<LeadRecord[]>([]);

    // Fetch real leads from API
    const { data, isLoading, isFetching } = useGetLeadsQuery({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
    });

    // Theme Detection
    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    // EFFECT: Only update leadsData when the fetch is finished. 
    // This keeps the OLD data on screen until the NEW data is ready.
    useEffect(() => {
        if (data?.leads) {
            const mapped = (data.leads || []).map((lead: any) => ({
                id: `#${lead.lead_id}`,
                customerName: lead.client_name || lead.guest_email || "Unknown User",
                email: lead.guest_email || "No email",
                leadType: lead.lead_type === "self_serve" ? "Self-Serve" : "Sales Assisted",
                bookingStatus: mapLeadStatusToUI(lead.payment_status), // Apply payment logic
                lastActivity: formatRelativeTime(lead.last_activity_at),
                date: format(new Date(lead.created_at), "MMM dd, yyyy"),
            }));
            setLeadsData(mapped);
        }
    }, [data]);

    const totalPages = data?.pagination ? Math.ceil(data.pagination.total / itemsPerPage) : 0;
    const startIndex = (currentPage - 1) * itemsPerPage;

    // We use the leadsData state directly for rendering
    const currentLeads = leadsData;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toast.info("Delete functionality coming soon");
    };

    return (
        <div className={`w-full transition-all duration-300 ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E5E5E5]"} rounded-2xl border overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col`}>
            {/* Table Header Controls */}
            <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E5E5E5]"
                }`}>
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <h3 className={`${isDark ? "text-white" : "text-[#000000]"}`}>Leads Shoots</h3>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="relative flex-1 max-w-xs">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={14} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-full h-9 pl-9 pr-3 py-2 text-[10px] lg:text-xs focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white focus:border-[#555]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                                }`}
                        />
                    </div>
                    {/* Status Select removed from API filters to focus on UI consistency as per reference */}
                </div>
            </div>

            {/*  MOBILE VIEW (Card Accordion)  */}
            <div className="lg:hidden flex-grow space-y-4">
                {/* Loader removed from here to allow smooth direct change */}
                {currentLeads.length > 0 ? (
                    <>
                        <div className={`flex justify-between text-sm font-medium p-4 mb-4 rounded-b-2xl border-b transition-colors ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#000000] bg-[#FFFCF6] border-b-[#E5E5E5]"
                            }`}>
                            <span>User Name</span>
                            <span>Status</span>
                        </div>
                        <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                            {currentLeads.map((lead) => (
                                <div key={lead.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleExpand(lead.id)}
                                                className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === lead.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                                            >
                                                {expandedId === lead.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            <div className="w-10 h-10 rounded-lg bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-sm">
                                                {lead.customerName.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#000000]"}`}>{lead.customerName}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={lead.bookingStatus} mobile />
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === lead.id && (
                                        <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                                            <div>
                                                <p className="text-[#666] text-[10px] uppercase tracking-wider">Lead ID</p>
                                                <p className={`text-sm ${isDark ? "text-white" : "text-[#333]"}`}>{lead.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#666] text-[10px] uppercase tracking-wider">Lead Type</p>
                                                <p className={`text-sm ${isDark ? "text-white" : "text-[#333]"}`}>{lead.leadType}</p>
                                            </div>
                                            <div>
                                                <p className="text-[#666] text-[10px] uppercase tracking-wider">Email</p>
                                                <p className={`text-sm truncate pr-2 ${isDark ? "text-white" : "text-[#333]"}`}>{lead.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#666] text-[10px] uppercase tracking-wider">Last Activity</p>
                                                <p className={`text-sm ${isDark ? "text-white" : "text-[#333]"}`}>{lead.lastActivity}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : !isLoading && (
                    <div className={`text-center py-10 ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
                )}
            </div>

            {/*  DESKTOP VIEW (Standard Table)  */}
            <div className="hidden lg:block w-full overflow-x-auto flex-grow">
                <table className="w-full text-left">
                    <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
                        <tr className={`text-sm font-medium transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                            <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>Lead ID</th>
                            <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>User Name</th>
                            <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>Email</th>
                            <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>Lead Type</th>
                            <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>Booking Status</th>
                            <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E5E5E5]"}`}>Last Activity</th>
                        </tr>
                    </thead>
                    {/* The table body stays visible. isFetching adds a slight opacity change for "direct" feel */}
                    <tbody className={`p-5 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                        {currentLeads.length > 0 ? (
                            currentLeads.map((lead, idx) => (
                                <tr key={idx} className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}>
                                    <td className={`py-2 px-4 ${isDark ? "text-white" : "text-[#333]"}`}>{lead.id}</td>
                                    <td className="py-2 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#FFF6D9] flex items-center justify-center text-black font-medium text-lg">
                                                {lead.customerName.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                            <div>
                                                <p className={`font-medium text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#000000]"}`} title={lead.customerName}>{lead.customerName}</p>
                                                <p className={`text-sm mt-0.5 ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{lead.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`py-2 px-4 text-base ${isDark ? "text-white/90" : "text-[#333]"}`}>{lead.email}</td>
                                    <td className={`py-2 px-4 text-base ${isDark ? "text-white/90" : "text-[#333]"}`}>{lead.leadType}</td>
                                    <td className="py-2 px-4"><StatusBadge status={lead.bookingStatus} /></td>
                                    <td className={`py-2 px-4 text-right text-base ${isDark ? "text-white/90" : "text-[#333]"}`}>{lead.lastActivity}</td>
                                </tr>
                            ))
                        ) : !isLoading && (
                            <tr>
                                <td colSpan={6} className={`text-center py-10 ${isDark ? "text-white/50" : "text-[#999]"}`}>No leads found.</td>
                            </tr>
                        )}
                        {/* If truly initial loading, we can show one subtle row spinner */}
                        {isLoading && leadsData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-20">
                                    <Loader2 className={`animate-spin mx-auto ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {leadsData.length > 0 && totalPages > 1 && (
                <div className={`flex justify-between items-center p-4 border-t transition-colors ${isDark ? "bg-[#101010] border-white/5" : "bg-[#FFFCF6] border-[#E5E5E5]"
                    }`}>
                    <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#666]"}`}>
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data?.pagination?.total || 0)} of {data?.pagination?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-100"
                                }`}
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
                                        <span key={`dots-${index}`} className={`px-2 py-1 text-xs ${isDark ? "text-white/30" : "text-[#999]"}`}>...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page as number)}
                                            className={`min-w-[32px] h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all border ${currentPage === page
                                                ? "bg-[#E5D5B8] text-black border-[#E5D5B8]"
                                                : isDark ? "bg-transparent text-white/60 border-transparent hover:bg-white/5" : "bg-transparent text-[#333] border-transparent hover:bg-black/5"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-100"
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};