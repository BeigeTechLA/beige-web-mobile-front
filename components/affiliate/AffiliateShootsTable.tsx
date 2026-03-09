"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Calendar as CalendarIcon, Trash2, Search } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi, adminApi } from "@/lib/api";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "../admin/StatusBadge";

type Status = "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Pending" | "Cancelled" | "Unknown";

interface ShootRecord {
  id: string;
  bookingId: string;
  customerName: string;
  initials: string;
  date: string;
  category: string;
  price: string;
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
  onShootClick: (shootId: string) => void;
  externalSelectedDate?: Date | null;
}

export const AffiliateShootsTable: React.FC<AffiliateShootsTableProps> = ({ onShootClick, externalSelectedDate }) => {
  const router = useRouter();
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

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents triggering handleRowClick if they overlap
    setExpandedId(expandedId === id ? null : id);
  };

  const handleActionClick = (e: React.MouseEvent, bookingId: string, hasQuote: boolean) => {
    e.stopPropagation();
    if (!hasQuote) {
      router.push(`/affiliate/dashboard/${bookingId}/edit-booking`);
      return;
    }
    router.push(`/search-results/payment?shootId=${bookingId}`);
  };

  return (
    <div className="w-full bg-[#171717] rounded-2xl border border-white/5 overflow-hidden" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className="bg-[#101010] flex flex-row justify-between items-center p-5 border-b border-b-[#3D3D3D] gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 text-white/40 w-3 lg:w-4 h-3 lg:h-4" />
          <input
            type="text"
            placeholder="Search Shoots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2 bg-[#18181b] border border-white/10 rounded-lg text-xs lg:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#E8D1AB] transition-all"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[130px] bg-[#1A1A1A] border-[#3D3D3D] rounded-lg h-8 lg:h-10 px-3 lg:px-6 text-sm text-white/70 focus:ring-0 capitalize">
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
            <SelectTrigger className="w-full md:w-[120px] bg-[#1A1A1A] border-[#3D3D3D] rounded-lg h-8 lg:h-10 px-3 lg:px-6 text-sm text-white/70 focus:ring-0">
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
      <div className="w-full">
        {/* --- MOBILE VIEW (Accordion) --- */}
        <div className="lg:hidden flex-grow space-y-4">
          <div className="flex justify-between text-[#E8D1AB] text-sm font-medium p-4 mb-4 bg-[#101010] rounded-b-2xl border-b border-b-white/5">
            <span>Customer Name</span>
            <span>Status</span>
          </div>
          {currentShoots.map((shoot, idx) => {
            const isExpanded = expandedId === shoot.id;
            return (
              <div key={shoot.id} className="px-4 border-b border-white/5 pb-4 last:border-0">
                {/* Header Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(window.event as any, shoot.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'border-white/10 text-white/60'}`}>
                      <ChevronDown size={16} className="" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-xs">
                      {shoot.initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{shoot.customerName}</p>
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
                          onClick={(e) => handleActionClick(e, shoot.bookingId, shoot.hasQuote)}
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
          <table className="w-full text-left">
            <thead className="bg-[#101010] ">
              <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D] ">Shoot ID</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Customer Name</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Category</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Price</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Status</th>
                <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Payment</th>
                <th className="pb-4 px-4 text-right bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Action</th>
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
                    className="border-b border-[#222222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                  >
                    {/* ID */}
                    <td className="py-2 px-4 text-white font-medium">{shoot.id}</td>

                    {/* Customer Info */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-black font-semibold text-sm">
                          {shoot.initials}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-base max-w-[200px] truncate" title={shoot.customerName}>{shoot.customerName}</p>
                          <p className="text-[#666666] text-sm mt-0.5">{shoot.date}</p>
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

                    {/* Payment */}
                    <td className="py-5 px-6">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${shoot.paymentStatus === "paid" ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>
                        {shoot.paymentStatus === "paid" ? "Done" : "Pending"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shoot.paymentStatus === "pending" && (
                          <button
                            onClick={(e) => handleActionClick(e, shoot.bookingId, shoot.hasQuote)}
                            className="px-3 py-1.5 rounded-lg bg-[#E8D1AB] hover:bg-[#dcb98a] text-black text-xs font-semibold"
                          >
                            {shoot.hasQuote ? "Proceed to Payment" : "Complete Booking"}
                          </button>
                        )}
                        <button className="p-2 text-white/40 hover:text-white transition-colors">
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
      {!loading && shoots.length > 0 && (
        <div className="flex justify-between items-center p-4 border-t border-white/5 bg-[#101010]">
          <div className="hidden lg:block text-sm text-white/40">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shoots.length)} of {shoots.length} entries
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                      className={`min-w-[32px] h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all border ${currentPage === page
                        ? "bg-[#E5D5B8] text-black border-[#E5D5B8]"
                        : "bg-transparent text-white/60 border-transparent hover:bg-white/5 hover:text-white"
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
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
