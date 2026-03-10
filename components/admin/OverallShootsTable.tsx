"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
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
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null); // For mobile accordion
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
    <div className="w-full bg-[#171717] rounded-2xl border border-white/5 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col">
      {/* Table Header Controls */}
      <div className="bg-[#101010] flex flex-row justify-between items-center p-5 border-b border-b-[#3D3D3D] gap-4">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className="">Overall Shoots</h3>
        </div>

        <div className="flex gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="flex-1 sm:w-[120px] bg-zinc-900 border-[#3D3D3D] rounded-full h-9 text-[10px] lg:text-xs text-white/70 focus:ring-0 capitalize">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#3D3D3D]">
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
            <SelectTrigger className="flex-1 sm:w-[110px] bg-zinc-900 border-[#3D3D3D] rounded-full h-9 text-[10px] lg:text-xs text-white/70 focus:ring-0">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#3D3D3D]">
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              {/* <SelectItem value="custom">Custom</SelectItem> */}
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
            <div className="flex justify-between text-[#E8D1AB] text-sm font-medium p-4 mb-4 bg-[#101010] rounded-b-2xl border-b border-b-white/5">
              <span>Project Name</span>
              <span>Status</span>
            </div>
            {currentShoots.map((shoot) => (
              <div key={shoot.id} className="px-4 border-b border-white/5 pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(shoot.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === shoot.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                    >
                      {expandedId === shoot.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-sm">
                      {shoot.initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{shoot.customerName}</p>
                    </div>
                  </div>
                  <StatusBadge status={shoot.status} mobile />
                </div>

                {/* Expanded Details */}
                {expandedId === shoot.id && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Shoot ID</p>
                      <p className="text-white text-sm">{shoot.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Price</p>
                      <p className="text-white text-sm">{shoot.price}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Category</p>
                      <p className="text-white text-sm truncate pr-2">{shoot.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Action</p>
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={(e) => handleDeleteClick(e, shoot.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#666] hover:text-red-500 transition-colors"
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
        ) : (
          <div className="text-center py-10 text-white/50">No shoots found.</div>
        )}
      </div>

      {/*  DESKTOP VIEW (Standard Table)  */}
      <div className="hidden lg:block w-full overflow-x-auto flex-grow">
        <table className="w-full text-left">
          <thead className="bg-[#101010] ">
            <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D] ">Shoot ID</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Project Name</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Category</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Price</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Status</th>
              <th className="pb-4 px-4 text-right bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Action</th>
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
                <tr key={idx} className="group hover:bg-white/[0.02] transition-colors rounded-2xl">
                  {/* ID */}
                  <td className="py-2 px-4 text-white font-medium">{shoot.id}</td>

                  {/* Customer Info */}
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-lg">
                        {shoot.initials}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-base max-w-[200px] truncate" title={shoot.customerName}>{shoot.customerName}</p>
                        <p className="text-[#666666] text-sm mt-0.5">{shoot.date}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-2 px-4 text-white/90 text-base">{shoot.category}</td>

                  {/* Price */}
                  <td className="py-2 px-4 text-white/90 text-base font-medium">{shoot.price}</td>

                  {/* Status */}
                  <td className="py-2 px-4">
                    <StatusBadge status={shoot.status} />
                  </td>

                  {/* Action */}
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleDeleteClick(e, shoot.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-white/40 hover:text-white transition-colors">
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