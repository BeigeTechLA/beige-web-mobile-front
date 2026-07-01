"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi, adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "../admin/StatusBadge";
import { resolveTimelineStage, timelineStageToDashboardLabel } from "@/lib/utils/projectTimeline";

type Status = "Initiated" | "PreProduction" | "Shoot Day" | "PostProduction" | "Revision" | "Completed" | "Assets Delivered" | "Cancelled" | "Pending" | "Unknown";

interface ShootRecord {
  id: string;
  customerName: string;
  customerImage: string;
  date: string;
  category: string;
  price: string;
  status: Status;
}

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
        // If comma separated string
        parsedSkills = skills.split(',').map(s => s.trim());
      }
    } catch (e) {
      // ignore parse error, treat as single string
      parsedSkills = [skills.replace(/[\[\]"]/g, "")];
    }
  }

  // Map IDs to names if possible
  const skillNames = parsedSkills.map(skill => {
    // If it's a number or a string that looks like a number, try to map it
    const skillId = Number(skill);
    if (!isNaN(skillId) && skillMap[skillId]) {
      return skillMap[skillId];
    }
    // Return original if not a mapped ID (remove quotes if any) OR if mapping not found
    return String(skill).replace(/["]/g, "");
  });

  return skillNames.join(", ");
};

export const AffiliateOverallShootsTable = ({ externalSelectedDate }: { externalSelectedDate?: Date | null }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canDelete } = usePermissions("shoots");
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 5;

  // Filtering states
  const [range, setRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sync external selected date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("month");
    }
  }, [externalSelectedDate]);

  useEffect(() => {
    setMounted(true);
  }, [])

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

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const [projectsResponse] = await Promise.all([
          affiliateApi.getMyShoots(token, params),
        ]);

        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const hasQuote = project.quote_id !== null && project.quote_id !== undefined;
          const statusLabel = hasQuote
            ? timelineStageToDashboardLabel(resolveTimelineStage(project))
            : "Pending";

          // Use quote total if available, otherwise budget
          const quoteTotal = project.quote_total;
          const budgetTotal = project.budget;
          const displayAmount = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : budgetTotal;

          // Categorization
          const category = project.event_type_labels || project.event_type || "N/A";

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName: project.project_name || "Untitled Project",
            customerImage: project.user_image || "/images/avatar.png",
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: category,
            price: displayAmount ? `$${parseFloat(displayAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
            status: statusLabel as Status,
          };
        });
        setShoots(mappedShoots);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range, statusFilter, externalSelectedDate]);

  const isDark = !mounted || theme === "dark";
  const totalPages = Math.ceil(shoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents triggering handleRowClick if they overlap
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const cleanId = id.replace('#', '');

    if (window.confirm("Are you sure you want to delete this shoot?")) {
      try {
        const response = await adminApi.deleteProject(cleanId);
        if (response?.success || response?.message === "Project deleted successfully") {
          setShoots(prev => prev.filter(shoot => shoot.id !== id));
          toast.success("Shoot deleted successfully");
        } else {
          toast.error(response?.error || "Failed to delete shoot");
        }
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("An error occurred while deleting");
      }
    }
  };

  const handleRowClick = (id: string) => {
    const cleanId = id.replace('#', '');
    router.push(`/affiliate/shoots/${cleanId}`);
  };

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-white border-[#E3E3E3]"}`}>
      {/* Table Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Overall Shoots</h3>
        </div>

        <div className="flex gap-3">
          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[110px] bg-[#1A1A1A] border-white/10 rounded-full h-8 text-[10px] text-white/70 focus:ring-0 capitalize px-3">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-white/10">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select> */}

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`flex-1 sm:w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/*  MOBILE VIEW (Card Accordion)  */}
      <div className="lg:hidden flex-grow space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#E8D1AB]" /></div>
        ) : currentShoots.length > 0 ? (
          <>
            <div className={`flex justify-between text-sm font-medium p-4 mb-4 rounded-b-2xl border-b ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#BFA780] bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
              <span>Customer Name</span>
              <span>Status</span>
            </div>
            {currentShoots.map((shoot) => (
              <div key={shoot.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleExpand(e, shoot.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === shoot.id ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                    >
                      <ChevronDown size={16} className="" />
                    </button>
                    <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-white/10">
                      <Image src={shoot.customerImage} alt="" fill className="object-cover" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.customerName}</p>
                    </div>
                  </div>
                  <StatusBadge status={shoot.status} mobile />
                </div>

                {/* Expanded Details */}
                {expandedId === shoot.id && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Shoot ID</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Price</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.price}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Category</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"} pr-2`}>{shoot.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Action</p>
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={(e) => {
                            if (!canDelete) return;
                            handleDelete(e, shoot.id);
                          }}
                          disabled={!canDelete}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "hover:bg-white/10 text-[#666]" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRowClick(shoot.id)}
                          className="text-[#E5D5B8] text-sm font-medium">Details</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-10 text-white/50">No shoots found.</div>
        )}
      </div>

      {/*  DESKTOP VIEW (Standard Table)  */}
      <div className="hidden lg:block w-full overflow-x-auto flex-grow">
        <table className="w-full text-left">
          <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
            <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
              <th className={`p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Shoot ID</th>
              <th className={`p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Customer Name</th>
              <th className={`p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Category</th>
              <th className={`p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Price</th>
              <th className={`p-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Status</th>
              <th className={`p-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Action</th>
            </tr>
          </thead>
          <tbody className="p-5">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  <div className="flex justify-center items-center">
                    <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
                  </div>
                </td>
              </tr>
            ) : currentShoots.length > 0 ? (
              currentShoots.map((shoot, idx) => (
                <tr key={idx}
                  onClick={() => handleRowClick(shoot.id)}
                  className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                >
                  {/* ID */}
                  <td className={`py-2 px-4 font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.id}</td>

                  {/* Customer Info */}
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10">
                        <Image
                          src={shoot.customerImage}
                          alt={shoot.customerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className={`font-semibold text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#323232]"}`} title={shoot.customerName}>{shoot.customerName}</p>
                        <p className={`${isDark ? "text-[#666666]" : "text-[#32323266]"} text-sm mt-0.5`}>{shoot.date}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className={`py-2 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{shoot.category}</td>

                  {/* Price */}
                  <td className={`py-2 px-4 text-base font-medium ${isDark ? "text-white/90" : "text-[#323232]"}`}>{shoot.price}</td>

                  {/* Status */}
                  <td className="py-2 px-4">
                    <StatusBadge status={shoot.status} />
                  </td>

                  {/* Action */}
                  <td className="py-2 px-4 text-right">
                    <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                      <ChevronRight size={24} />
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

      {/* Pagination Controls */}
      {!loading && shoots.length > 0 && (
        <div className={`flex justify-between items-center p-4 border-t transition-colors duration-300 ${isDark ? "bg-[#101010] border-white/5" : "bg-white border-[#E3E3E3]"
          }`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shoots.length)} of {shoots.length} entries
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed transition-all ${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#323232] border-[#E3E3E3] hover:bg-zinc-50"
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
                    <span key={`dots-${index}`} className="px-2 py-1 text-white/30 text-xs">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`min-w-[32px] h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all border ${currentPage === page
                        ? "bg-[#E5D5B8] text-black border-[#E5D5B8]"
                        : isDark ? "bg-transparent text-white/60 border-transparent hover:bg-white/5" : "bg-transparent text-[#323232] border-transparent hover:bg-black/5"
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
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed transition-all${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#323232] border-[#E3E3E3] hover:bg-zinc-50"
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
