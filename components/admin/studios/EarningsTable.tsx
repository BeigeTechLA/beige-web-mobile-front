"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Trash2, CircleAlert } from "lucide-react";
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
import { StudioStatusBadge } from "./StudioStatusBadge";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";
import { getInitials } from "@/lib/utils";



interface EarningsRecord {
  id: string;
  customerName: string;
  bookingId: string;
  hours: string;
  baseRevenue: number;
  overtime: number;
  platformFee: number;
  netEarning: number;
  date: string;
}
// Placehoolder data
export const earningsData: EarningsRecord[] = [
  {
    id: "SR-1001",
    customerName: "Ava Johnson",
    bookingId: "BK-84721",
    hours: "4h",
    baseRevenue: 1800,
    overtime: 100,
    platformFee: 180,
    netEarning: 1620,
    date: "2026-03-12",
  },
  {
    id: "SR-1002",
    customerName: "Noah Williams",
    bookingId: "BK-84736",
    hours: "6h",
    baseRevenue: 2600,
    overtime: 0,
    platformFee: 260,
    netEarning: 2340,
    date: "2026-03-18",
  },
  {
    id: "SR-1003",
    customerName: "Sophia Martinez",
    bookingId: "BK-84802",
    hours: "3h",
    baseRevenue: 1200,
    overtime: 100,
    platformFee: 120,
    netEarning: 1080,
    date: "2026-03-22",
  },
  {
    id: "SR-1004",
    customerName: "Liam Brown",
    bookingId: "BK-84844",
    hours: "8h",
    baseRevenue: 3400,
    overtime: 240,
    platformFee: 340,
    netEarning: 3060,
    date: "2026-03-28",
  },
  {
    id: "SR-1005",
    customerName: "Mia Davis",
    bookingId: "BK-84910",
    hours: "5h",
    baseRevenue: 2100,
    overtime: 0,
    platformFee: 210,
    netEarning: 1890,
    date: "2026-04-02",
  },
  {
    id: "SR-1006",
    customerName: "Ethan Carter",
    bookingId: "BK-84955",
    hours: "2h",
    baseRevenue: 900,
    overtime: 0,
    platformFee: 90,
    netEarning: 810,
    date: "2026-04-06",
  },
];

export const EarningsTable = ({ isDark }: { isDark: boolean }) => {
  const router = useRouter();

  const [studios, setShoots] = useState<EarningsRecord[]>(earningsData);
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
        setShoots(prev => prev.filter(booking => booking.id !== shootToDelete));
        toast.success("Shoot deleted successfully");
      } else {
        toast.error(response?.error || "Failed to delete booking");
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
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-[#FFF] border-[#E3E3E3]"
      }`}>
      {/* Header Controls */}
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"
        }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Earnings Ledger</h3>
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
              <SelectValue placeholder="Overtime" />
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
              <span>Customer Name</span>
              <span>Net Earnings</span>
            </div>
            {currentStudios.map((booking) => (
              <div key={booking.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(booking.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === booking.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}
                    >
                      {expandedId === booking.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-sm">{getInitials(booking.customerName)}</div>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{booking.customerName}</p>
                  </div>
                  <p>
                    ${booking.netEarning}
                  </p>
                </div>
                {expandedId === booking.id && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Booking ID</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{booking.bookingId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Hours</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{booking.hours}</p>
                    </div>
                    <div>
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Base Revenue</p>
                      <p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"} pr-2`}>${booking.baseRevenue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Overtime</p>
                      <p className={`text-sm ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>{booking.overtime > 0 ? `+$${booking.overtime}` : "--"}</p>
                    </div>
                    <div className="">
                      <p className="text-[#666] text-[10px] uppercase tracking-wider">Platform Fee</p>
                      <p className={`text-sm text-[#FF7B7B]`}>-${booking.platformFee}</p>
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
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"} rounded-bl-2xl`}>Date</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Customer Name</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Booking ID</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Hours</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Base Revenue</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"}`}>Overtime</th>
              <th className={`py-4 px-4 border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"} `}>Platform Fee</th>
              <th className={`py-4 px-4 text-right border-b ${isDark ? "border-b-[#3D3D3D]" : "border-b-[#E3E3E3]"} rounded-br-2xl`}>Net Earnings</th>
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
              currentStudios.map((booking, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleRowClick(booking.id)}
                  className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}
                >
                  {/* Studio Info */}
                  <td className={`py-2 lg:py-4 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{format(new Date(booking.date), "MMM dd, yyyy")}</td>

                  <td className="py-2 lg:py-4 px-4">
                    <p className={`font-semibold text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#323232]"}`}>{booking.customerName}</p>
                  </td>
                  <td className={`py-2 lg:py-4 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{booking.bookingId}</td>
                  <td className={`py-2 lg:py-4 px-4 font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{booking.hours}</td>

                  <td className={`py-2 lg:py-4 px-4 text-base font-medium ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>${booking.baseRevenue}</td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium text-[#F6A554]`}>
                    {booking.overtime > 0 ? `+$${booking.overtime}` : "--"}
                  </td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium text-[#FF7B7B]`}>
                    -${booking.platformFee}
                  </td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium text-right ${isDark ? "text-white" : "text-[#323232]"}`}>
                    ${booking.netEarning}
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
        description="Are you sure you want to delete this booking? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
