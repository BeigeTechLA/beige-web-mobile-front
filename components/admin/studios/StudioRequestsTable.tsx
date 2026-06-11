"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Trash2, CircleAlert } from "lucide-react";
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
import { StudioStatusBadge } from "./StudioStatusBadge";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";
import { getInitials } from "@/lib/utils";

// Placehoolder data
const studioRequests: StudioRecord[] = [
  {
    id: "studio1",
    hostName: "Prince Carter",
    spaceName: "Hollywood Production Hub",
    location: "New York, NY",
    spaceType: "Video Studio",
    capacity: "04 - 05 ppl",
    status: "Approved",
    date: "Jan 13, 2026",
  },
  {
    id: "studio2",
    hostName: "Ethan Carter",
    spaceName: "Sunset Creative Studio",
    location: "Los Angeles, CA",
    spaceType: "Photo Studio",
    capacity: "20 - 25 ppl",
    status: "Pending",
    date: "Jan 13, 2026",
  },
  {
    id: "studio3",
    hostName: "Daniel Roberts",
    spaceName: "Sunset Creative Studio",
    location: "Los Angeles, CA",
    spaceType: "Multi-purpose",
    capacity: "20 - 25 ppl",
    status: "Rejected",
    date: "Jan 13, 2026",
  },
  {
    id: "studio4",
    hostName: "Ethan Carter",
    spaceName: "Sunset Creative Studio",
    location: "Los Angeles, CA",
    spaceType: "Photo Studio",
    capacity: "20 - 25 ppl",
    status: "Pending",
    date: "Jan 13, 2026",
  },
  {
    id: "studio5",
    hostName: "Prince Carter",
    spaceName: "Hollywood Production Hub",
    location: "New York, NY",
    spaceType: "Video Studio",
    capacity: "04 - 05 ppl",
    status: "Approved",
    date: "Jan 13, 2026",
  },
  {
    id: "studio6",
    hostName: "Prince Carter",
    spaceName: "Hollywood Production Hub",
    location: "New York, NY",
    spaceType: "Video Studio",
    capacity: "04 - 05 ppl",
    status: "Approved",
    date: "Jan 13, 2026",
  },
  {
    id: "studio7",
    hostName: "Daniel Roberts",
    spaceName: "Sunset Creative Studio",
    location: "Los Angeles, CA",
    spaceType: "Multi-purpose",
    capacity: "20 - 25 ppl",
    status: "Rejected",
    date: "Jan 13, 2026",
  },
];

type Status = "Approved" | "Pending" | "Rejected";

interface StudioRecord {
  id: string;
  hostName: string;
  spaceName: string;
  location: string;
  spaceType: string;
  capacity: string;
  status: Status;
  date: string;
}

export const StudioRequestsTable = ({ isDark }: { isDark: boolean }) => {
  const router = useRouter();

  const [studios, setShoots] = useState<StudioRecord[]>(studioRequests);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<string | null>(null);

  // New filtering states
  const [range, setRange] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const totalPages = Math.ceil(studios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudios = studios.slice(startIndex, startIndex + itemsPerPage);

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
        setShoots(prev => prev.filter(studio => studio.id !== shootToDelete));
        toast.success("Shoot deleted successfully");
      } else {
        toast.error(response?.error || "Failed to delete studio");
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

  const handleRowClick = (id: string) => {
    const cleanId = id.replace('#', '');
    router.push(`/admin/studios/${cleanId}`);
  };

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-[#FFF] border-[#E3E3E3]"
      }`}>
      {/* Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Studio Requests</h3>
        </div>

        <div className="flex gap-3">
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="lg:hidden flex-grow space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#E8D1AB]" /></div>
        ) : currentStudios.length > 0 ? (
          <>
            <div className={`flex justify-between text-sm font-medium p-4 mb-4 rounded-b-2xl border-b ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#BFA780] bg-[#FFFCF6] border-b-[#E3E3E3]"
              }`}>
              <span>Project Name</span>
              <span>Status</span>
            </div>
            {currentStudios.map((studio) => (
              <div key={studio.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(studio.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === studio.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                    >
                      {expandedId === studio.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-sm">{getInitials(studio.hostName)}</div>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.hostName}</p>
                  </div>
                  <StudioStatusBadge status={studio.status} mobile />
                </div>
                {expandedId === studio.id && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Space Name</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Type</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceType}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Location</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"} pr-2`}>{studio.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Capacity</p>
                      <p className={`text-sm ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>{studio.capacity}</p>
                    </div>
                    <div className="">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Action</p>
                      <>
                        {
                          studio.status === "Approved" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteClick(e, studio.id)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                              >
                                <Trash2 size={18} />
                              </button>
                              <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                                <ChevronRight size={24} />
                              </button>
                            </div>
                          ) : studio.status === "Rejected" ? (
                            <div className="flex items-center gap-2">
                              <button
                                // onClick={(e) => handleDeleteClick(e, studio.id)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                              >
                                <CircleAlert size={18} />
                              </button>
                              <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                                <ChevronRight size={24} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                // onClick={(e) => handleDeleteClick(e, studio.id)}
                                className={`px-3 h-8 flex items-center justify-center text-xs rounded-lg transition-colors ${isDark ? "bg-[#EBFFF0] hover:bg-white/10 text-[#16A34A]" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                              >
                                Accept
                              </button>
                              <button
                                // onClick={(e) => handleDeleteClick(e, studio.id)}
                                className={`flex items-center justify-center text-xs rounded-lg transition-colors underline ${isDark ? "text-[#F98A84]" : "text-[#32323266]"} hover:text-red-500`}
                              >
                                Decline
                              </button>
                              <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                                <ChevronRight size={24} />
                              </button>
                            </div>
                          )
                        }
                      </>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : <div className="text-center py-10 text-white/50">No studios found.</div>}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block w-full overflow-x-auto flex-grow">
        <table className="w-full text-left border-separate border-spacing-0 overflow-hidden rounded-2xl">
          <thead className={isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}>
            <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"} rounded-bl-2xl`}>Host Name</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Space Name</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Location</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Space Type</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Capacity</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Status</th>
              <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"} rounded-br-2xl`}>Action</th>
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
            ) : currentStudios.length > 0 ? (
              currentStudios.map((studio, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleRowClick(studio.id)}
                  className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                >
                  {/* Studio Info */}
                  <td className="py-2 lg:py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-lg">
                        {getInitials(studio.hostName)}
                      </div>
                      <div>
                        <p className={`font-semibold text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.hostName}</p>
                        <p className={`${isDark ? "text-[#666666]" : "text-[#32323266]"} text-sm mt-0.5`}>{studio.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-2 lg:py-4 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{studio.spaceName}</td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium ${isDark ? "text-white/90" : "text-[#323232]"}`}>{studio.location}</td>
                  <td className={`py-2 lg:py-4 px-4 font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceType}</td>

                  <td className={`py-2 lg:py-4 px-4 text-base font-medium ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>{studio.capacity}</td>
                  <td className="py-2 lg:py-4 px-4"><StudioStatusBadge status={studio.status} /></td>
                  <td className="py-2 lg:py-4 px-4 text-right">
                    {
                      studio.status === "Approved" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleDeleteClick(e, studio.id)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      ) : studio.status === "Rejected" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            // onClick={(e) => handleDeleteClick(e, studio.id)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                          >
                            <CircleAlert size={18} />
                          </button>
                          <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            // onClick={(e) => handleDeleteClick(e, studio.id)}
                            className={`px-3 h-8 flex items-center justify-center text-xs rounded-lg transition-colors ${isDark ? "bg-[#EBFFF0] hover:bg-white/10 text-[#16A34A]" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}
                          >
                            Accept
                          </button>
                          <button
                            // onClick={(e) => handleDeleteClick(e, studio.id)}
                            className={`flex items-center justify-center text-xs rounded-lg transition-colors underline ${isDark ? "text-[#F98A84]" : "text-[#32323266]"} hover:text-red-500`}
                          >
                            Decline
                          </button>
                          <button className={`p-2 transition-colors ${isDark ? "text-white/40 hover:text-white" : "text-[#32323266] hover:text-[#323232]"}`}>
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      )
                    }
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-white/50">
                  No Studios found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && studios.length > 0 && (
        <div className={`flex justify-between items-center p-4 border-t transition-colors duration-300 ${isDark ? "bg-[#101010] border-white/5" : "bg-white border-[#E3E3E3]"
          }`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, studios.length)} of {studios.length} entries
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
        description="Are you sure you want to delete this studio? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
