"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

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

type Status = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Unknown";

interface ShootRecord {
  id: string;
  customerName: string;
  initials: string;
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

export const OverallShootsTable = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 5;

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<string | null>(null);

  // New filtering states
  const [range, setRange] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { range };
        if (status !== "all") {
          params.status = status;
        }

        if (range === 'custom') {
          if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
          if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
        }

        const projectsResponse = await adminApi.getProjects(params);
        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const statusLabel = STATUS_LABEL_MAP[project.status] || "Unknown" as Status;
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: project.event_type_labels || "N/A",
            price: project.total_paid_amount
              ? `$${parseFloat(project.total_paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : project.budget
                ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "$0.00",
            status: statusLabel,
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
  }, [range, status, startDate, endDate]);

  const isDark = !mounted || theme === "dark";
  const totalPages = Math.ceil(shoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShootToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shootToDelete) return;

    const cleanId = shootToDelete.replace('#', '');
    setIsDeleting(true);

    try {
      const response = await adminApi.deleteProject(cleanId);
      if (response?.success || response?.message === "Project deleted successfully") {
        setShoots(prev => prev.filter(shoot => shoot.id !== shootToDelete));
        toast.success("Shoot deleted successfully");
      } else {
        toast.error(response?.error || "Failed to delete shoot");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setShootToDelete(null);
    }
  };

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-[#FFF] border-[#E3E3E3]"
      }`}>
      {/* Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Overall Shoots</h3>
        </div>

        <div className="flex gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Initiated">Initiated</SelectItem>
              <SelectItem value="PreProduction">Pre Production</SelectItem>
              <SelectItem value="Shoot Day">Shoot Day</SelectItem>
              <SelectItem value="PostProduction">Post Production</SelectItem>
              <SelectItem value="Revision">Revision</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Assets Delivered">Assets Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`flex-1 sm:w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {/* <SelectItem value="custom">Custom</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="lg:hidden flex-grow space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#E8D1AB]" /></div>
        ) : currentShoots.length > 0 ? (
          <>
            <div className={`flex justify-between text-sm font-medium p-4 mb-4 rounded-b-2xl border-b ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#BFA780] bg-[#FFFCF6] border-b-[#E3E3E3]"
              }`}>
              <span>Project Name</span>
              <span>Status</span>
            </div>
            {currentShoots.map((shoot) => (
              <div key={shoot.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(shoot.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === shoot.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                    >
                      {expandedId === shoot.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-sm">{shoot.initials}</div>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.customerName}</p>
                  </div>
                  <StatusBadge status={shoot.status} mobile />
                </div>
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
                          onClick={(e) => handleDeleteClick(e, shoot.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-[#666]" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="text-[#E5D5B8] text-sm font-medium">Details</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : <div className="text-center py-10 text-white/50">No shoots found.</div>}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block w-full overflow-x-auto flex-grow">
        <table className="w-full text-left">
          <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
            <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Shoot ID</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Project Name</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Category</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Price</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Status</th>
              <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Action</th>
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
                <tr key={idx} className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}>
                  {/* ID */}
                  <td className={`py-2 px-4 font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.id}</td>

                  {/* Customer Info */}
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-lg">
                        {shoot.initials}
                      </div>
                      <div>
                        <p className={`font-semibold text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#323232]"}`}>{shoot.customerName}</p>
                        <p className={`${isDark ? "text-[#666666]" : "text-[#32323266]"} text-sm mt-0.5`}>{shoot.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-2 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{shoot.category}</td>
                  <td className={`py-2 px-4 text-base font-medium ${isDark ? "text-white/90" : "text-[#323232]"}`}>{shoot.price}</td>
                  <td className="py-2 px-4"><StatusBadge status={shoot.status} /></td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleDeleteClick(e, shoot.id)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                        <ChevronRight size={24} />
                      </button>
                    </div>
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
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Shoot"
        description="Are you sure you want to delete this shoot? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};