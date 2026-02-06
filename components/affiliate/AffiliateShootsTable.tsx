"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi, adminApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

type ShootStatus = "Initiated" | "Pre Production" | "Post Production" | "Revision" | "Completed";

interface ShootRecord {
    id: string;
    customerName: string;
    initials: string;
    date: string;
    category: string;
    price: string;
    status: string;
}

// internal status mapping for styles
const STATUS_STYLES = {
    "Initiated": "bg-[#FFF9E5] text-[#B18A00]",
    "PreProduction": "bg-[#FDF4FF] text-[#C065F0]",
    "PostProduction": "bg-[#EAEAEA] text-[#666666]",
    "Revision": "bg-[#E6F0FF] text-[#3B82F6]",
    "Completed": "bg-[#F0FFF4] text-[#22C55E]",
    "Cancelled": "bg-[#FFF5F5] text-[#EF4444]",
};

const STATUS_LABEL_MAP: Record<number, string> = {
    0: "Initiated",
    1: "PreProduction",
    2: "PostProduction",
    3: "Revision",
    4: "Completed",
    5: "Cancelled",
};

const StatusBadge = ({ status }: { status: string }) => {
    const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#F3F4F6] text-[#6B7280]";

    return (
        <span className={`px-6 py-2.5 rounded-full text-base font-medium leading-none ${style}`}>
            {status}
        </span>
    );
};

interface AffiliateShootsTableProps {
    onShootClick: (shootId: string) => void;
    externalSelectedDate?: Date | null;
}

export const AffiliateShootsTable: React.FC<AffiliateShootsTableProps> = ({ onShootClick, externalSelectedDate }) => {
    const [shoots, setShoots] = useState<ShootRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filtering states
    const [range, setRange] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 500);

    // Sync external selected date with range
    useEffect(() => {
        if (externalSelectedDate) {
            setRange("custom");
        } else if (range === "custom") {
            setRange("month");
        }
    }, [externalSelectedDate]);

    useEffect(() => {
        const fetchData = async () => {
            const token = Cookies.get("revure_token");
            if (!token) return;

            setLoading(true);
            try {
                const params: any = { range };
                if (statusFilter !== "all") {
                    params.status = statusFilter;
                }
                if (debouncedSearch) {
                    params.search = debouncedSearch;
                }

                if (externalSelectedDate && range === 'custom') {
                    params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
                }

                const [projectsResponse] = await Promise.all([
                    affiliateApi.getMyShoots(token, params),
                ]);

                const projectsList = projectsResponse?.data?.projects || [];

                const mappedShoots = projectsList.map((item: any) => {
                    const project = item.project || item;
                    const statusLabel = STATUS_LABEL_MAP[project.status] || "Unknown";
                    const customerName = project.project_name || "Untitled Project";
                    const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

                    return {
                        id: `#${project.stream_project_booking_id}`,
                        customerName,
                        initials,
                        date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
                        category: project.event_type_labels || "N/A",
                        price: project.budget ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
                        status: statusLabel,
                    };
                });
                setShoots(mappedShoots);
            } catch (error) {
                console.error("Failed to fetch shoots:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [range, statusFilter, debouncedSearch, externalSelectedDate]);

    const totalPages = Math.ceil(shoots.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleRowClick = (id: string) => {
        // Remove the # from the ID
        const cleanId = id.replace('#', '');
        onShootClick(cleanId);
    };

    return (
        <div className="w-full bg-[#111111] rounded-2xl border border-[#333333] overflow-hidden" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            {/* Table Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-[#333333] gap-4">
                <div className="relative w-full md:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
                    <input
                        type="text"
                        placeholder="Search Shoots..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-[#666666] outline-none focus:border-[#E8D1AB]/50 transition-colors"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[130px] bg-[#1A1A1A] border-[#3D3D3D] rounded-xl h-11 text-sm text-white/70 focus:ring-0 capitalize">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-[#3D3D3D]">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-full md:w-[120px] bg-[#1A1A1A] border-[#3D3D3D] rounded-xl h-11 text-sm text-white/70 focus:ring-0">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-[#3D3D3D]">
                            <SelectItem value="all">All time</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                            {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Table Grid */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[#AAAAAA] text-base font-medium border-b border-[#333333] cursor-pointer leading-none tracking-normal">
                            <th className="py-5 px-6 font-medium">Shoot ID</th>
                            <th className="py-5 px-6 font-medium">Customer Name</th>
                            <th className="py-5 px-6 font-medium">Category</th>
                            <th className="py-5 px-6 font-medium">Price</th>
                            <th className="py-5 px-6 font-medium">Status</th>
                            <th className="py-5 px-6 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-20">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="animate-spin text-[#666]" size={32} />
                                    </div>
                                </td>
                            </tr>
                        ) : currentShoots.length > 0 ? (
                            currentShoots.map((shoot, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => handleRowClick(shoot.id)}
                                    className="border-b border-[#222222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                                >
                                    {/* ID */}
                                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.id}</td>

                                    {/* Customer Info */}
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-sm">
                                                {shoot.initials}
                                            </div>
                                            <div>
                                                <p className="text-[#E0E0E0] font-medium text-base leading-none tracking-normal">{shoot.customerName}</p>
                                                <p className="text-[#666666] text-xs mt-1.5">{shoot.date}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.category}</td>

                                    {/* Price */}
                                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.price}</td>

                                    {/* Status */}
                                    <td className="py-5 px-6">
                                        <StatusBadge status={shoot.status} />
                                    </td>

                                    {/* Action */}
                                    <td className="py-5 px-6 text-right">
                                        <button className="text-white hover:text-white transition-colors">
                                            <ChevronRight size={20} className="text-[#666666]" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-white/50">
                                    No shoots found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {
                !loading && shoots.length > 0 && (
                    <div className="flex justify-between items-center p-6 border-t border-[#333333]">
                        <div className="text-sm text-[#666666]">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shoots.length)} of {shoots.length} entries
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
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
                                                onClick={() => handlePageChange(page as number)}
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
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
