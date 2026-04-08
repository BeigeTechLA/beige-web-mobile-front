"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi, adminApi } from "@/lib/api";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "../admin/StatusBadge";
import { useTheme } from "next-themes";
import { MobileShootRow } from "../admin/shoot-details/MobileShootRow";
import { AnimatePresence, motion } from "framer-motion";

type Status = "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Pending" | "Cancelled" | "Unknown";

interface ShootRecord {
  id: string;
  bookingId: string;
  customerName: string;
  initials: string;
  date: string;
  rawDate: number; // Added for correct chronological sorting
  category: string;
  price: string;
  rawPrice: number; // Added for correct numerical sorting
  status: Status;
  hasQuote: boolean;
  paymentStatus: "paid" | "pending";
}

const STATUS_LABEL_MAP: Record<number, string> = {
  0: "Initiated",
  1: "PreProduction",
  2: "PostProduction",
  3: "Revision",
  4: "Completed",
  5: "Cancelled",
};

const parseSkills = (skills: string | number[] | null | undefined, skillMap: Record<number, string>): string => {
  if (!skills) return "N/A";

  let parsedSkills: any[] = [];

  if (Array.isArray(skills)) {
    parsedSkills = skills;
  } else if (typeof skills === "string") {
    try {
      if (skills.trim().startsWith("[") && skills.trim().endsWith("]")) {
        parsedSkills = JSON.parse(skills);
      } else {
        parsedSkills = skills.split(',').map(s => s.trim());
      }
    } catch (e) {
      parsedSkills = [skills.replace(/[\[\]"]/g, "")];
    }
  }

  const skillNames = parsedSkills.map(skill => {
    const skillId = Number(skill);
    if (!isNaN(skillId) && skillMap[skillId]) {
      return skillMap[skillId];
    }
    return String(skill).replace(/["]/g, "");
  });

  return skillNames.join(", ");
};

interface AffiliateShootsTableProps {
  // onShootClick: (shootId: string) => void;
  externalSelectedDate?: Date | null;
}

export const AffiliateShootsTable: React.FC<AffiliateShootsTableProps> = ({ onShootClick, externalSelectedDate }) => {
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Filtering states
  const [range, setRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
    key: 'rawDate',
    direction: null,
  });
  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");


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

        const [projectsResponse, skillsResponse] = await Promise.all([
          affiliateApi.getMyShoots(token, params),
          adminApi.getSkills()
        ]);

        // Create Skill Map: ID -> Name
        const skillMap: Record<number, string> = {};
        if (skillsResponse && skillsResponse.data) {
          const skillsList = Array.isArray(skillsResponse.data) ? skillsResponse.data : (skillsResponse.data?.data || []);
          skillsList.forEach((s: any) => {
            const name = s.name || s.skill_name || s.title;
            if (s.id && name) {
              skillMap[s.id] = name;
            }
          });
        }

        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const hasQuote = project.quote_id !== null && project.quote_id !== undefined;
          const statusLabel = hasQuote ? (STATUS_LABEL_MAP[project.status] || "Unknown") : "Pending";
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

          // Use quote total if available, otherwise budget
          const quoteTotal = project.quote_total;
          const budgetTotal = project.budget;
          const displayAmount = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : budgetTotal;

          // Categorization: Use labels if available, otherwise event_type mapping
          const category = project.event_type_labels || project.event_type || "Uncategorized";

          return {
            id: `#${project.stream_project_booking_id}`,
            bookingId: String(project.stream_project_booking_id),
            customerName,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: category,
            price: displayAmount ? `$${parseFloat(displayAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
            status: statusLabel as Status,
            hasQuote,
            paymentStatus: project.payment_status === "paid" || !!project.payment_id ? "paid" : "pending",
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

  // --- CLIENT-SIDE PROCESSING (Search + Sort) ---
  const processedShoots = useMemo(() => {
    // 1. Filter
    let result = shoots.filter((shoot) =>
      shoot.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shoot.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort
    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'id') {
          aValue = parseInt(a.id.replace('#', ''), 10);
          bValue = parseInt(b.id.replace('#', ''), 10);
        } else if (sortConfig.key === 'customerName') {
          // As requested: clicking Project Name sorts by Date
          aValue = a.rawDate;
          bValue = b.rawDate;
        } else if (sortConfig.key === 'price') {
          aValue = a.rawPrice;
          bValue = b.rawPrice;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [shoots, searchQuery, sortConfig]);

  const requestSort = (key: keyof ShootRecord) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ShootRecord) => {
    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ArrowUpDown size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
      : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
  };

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
    router.push(`/affiliate/shoots/${cleanId}`);
    // onShootClick(cleanId);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents triggering handleRowClick if they overlap
    setExpandedId(expandedId === id ? null : id);
  };

  const handleActionClick = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    onShootClick(bookingId);
  };

  if (!mounted) return null;

  return (
    <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <div className="relative w-full md:w-[300px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
          <input
            type="text"
            placeholder="Search Shoots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
              }`}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
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
      < div className="w-full">
        {/* --- MOBILE VIEW (Accordion) --- */}
        <div className={`lg:hidden transition-colors duration-300 ${isDark ? "bg-[#111111]" : ""}`}>
          <div className={`flex justify-between px-5 py-3 text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
            <span>Customer Name</span>
            <span>Status</span>
          </div>
          {currentShoots.map((shoot, idx) => {
            const isExpanded = expandedId === shoot.id;
            return (
              <div key={shoot.id} className={`px-4 rounded-lg transition-all duration-300 ${isDark ? "bg-[#171717] border border-white/5" : ((isExpanded ? "bg-[#F9F9F9]" : "bg-white"))}`}>
                {/* Header Row */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => toggleExpand(window.event as any, shoot.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Circular Chevron Toggle */}
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
                      ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
                      : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
                      }`}>
                      <ChevronDown size={16} className="" />
                    </div>

                    {/* Customer Avatar & Name */}
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-xs">
                      {shoot.initials}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{shoot.customerName}</p>
                      <p className="text-[#666666] text-[10px]">{shoot.date}</p>
                    </div>
                  </div>
                  <StatusBadge status={shoot.status} mobile />
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div>
                      <p className="text-[#666666] text-[10px] uppercase tracking-wider">Shoot ID</p>
                      <p className="text-white text-sm">{shoot.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666666] text-[10px] uppercase tracking-wider">Price</p>
                      <p className="text-white text-sm">{shoot.price}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#666666] text-[10px] uppercase tracking-wider">Category</p>
                      <p className="text-white text-sm truncate pr-2">{shoot.category}</p>
                    </div>
                    <div>
                      <p className="text-[#666666] text-[10px] uppercase tracking-wider">Payment</p>
                      <p className={`text-sm font-medium ${shoot.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                        {shoot.paymentStatus === "paid" ? "Done" : "Pending"}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2">
                      {shoot.paymentStatus === "pending" && (
                        <button
                          onClick={(e) => handleActionClick(e, shoot.bookingId)}
                          className="w-full mb-2 py-2 bg-[#E8D1AB] hover:bg-[#dcb98a] rounded-lg text-black text-sm font-semibold"
                        >
                          {shoot.hasQuote ? "Proceed to Payment" : "Complete Booking"}
                        </button>
                      )}
                      <button
                        onClick={() => handleRowClick(shoot.id)}
                        className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[#E8D1AB] text-sm font-medium"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- DESKTOP TABLE VIEW (Original) --- */}
        <div className="hidden lg:block w-full overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                <th
                  className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors"
                  onClick={() => requestSort('id')}>
                  <div className="flex items-center">Shoot ID {getSortIcon('id')}</div>
                </th>
                <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors" onClick={() => requestSort('customerName')}>
                  <div className="flex items-center">Project Name {getSortIcon('customerName')}</div>
                </th>
                <th className="py-5 px-6 font-medium">Category</th>
                <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors" onClick={() => requestSort('price')}>
                  <div className="flex items-center">Price {getSortIcon('price')}</div>
                </th>
                <th className="py-5 px-6 font-medium">Status</th>
                <th className="py-5 px-6 font-medium">Payment</th>
                <th className="py-5 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="p-5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                    </div>
                  </td>
                </tr>
              ) : currentShoots.length > 0 ? (
                currentShoots.map((shoot, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(shoot.id)}
                    className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                  >
                    {/* ID */}
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.id}</td>

                    {/* Customer Info */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                          {shoot.initials}
                        </div>
                        <div>
                          <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                          <p className={`text-xs mt-1.5 ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{shoot.date}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.category}</td>
                    {/* Price */}
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.price}</td>
                    {/* Status */}
                    <td className="py-5 px-6">
                      <StatusBadge status={shoot.status} />
                    </td>

                    {/* Payment */}
                    <td className="py-5 px-6">
                      <span className={`px-4 py-1 text-xs lg:px-6 lg:py-2 lg:text-sm rounded-full font-semibold ${shoot.paymentStatus === "paid" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                        {shoot.paymentStatus === "paid" ? "Done" : "Pending"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shoot.paymentStatus === "pending" && (
                          <button
                            onClick={(e) => handleActionClick(e, shoot.bookingId)}
                            className="px-3 py-1.5 rounded-lg bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-xs font-semibold"
                          >
                            {shoot.hasQuote ? "Proceed to Payment" : "Complete Booking"}
                          </button>
                        )}
                        <button className={isDark ? "text-[#666666]" : "text-[#999]"}>
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/50">
                    No shoots found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {
        !loading && processedShoots.length > 0 && (
          <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
            <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedShoots.length)} of {processedShoots.length} entries
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}>Previous</button>
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
                        className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page ? (isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E8D1AB] text-black") : (isDark ? "text-white/60 hover:bg-white/5" : "text-[#666] hover:bg-zinc-100")}`}
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
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-30 ${isDark ? "bg-[#1A1A1A] text-white/60 border-[#333] hover:bg-white/10" : "bg-white text-[#333] border-[#E5E5E5] hover:bg-zinc-50"}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
};
