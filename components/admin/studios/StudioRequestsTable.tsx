"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Trash2, CircleAlert } from "lucide-react";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudioStatusBadge } from "./StudioStatusBadge";
import { DeleteConfirmationModal } from "../DeleteConfirmationModal";
import { getInitials } from "@/lib/utils";

type Status = "Approved" | "Pending" | "Rejected";

interface StudioRecord {
  id: string;
  studio_booking_id?: string | number;
  hostName: string;
  spaceName: string;
  location: string;
  spaceType: string;
  capacity: string;
  status: Status;
  date: string;
}

type ApiRequest = {
  studio_booking_id?: number;
  studio_id?: number;
  host_name?: string | null;
  host_email?: string | null;
  space_name?: string | null;
  studio_name?: string | null;
  location?: string | null;
  space_type?: string | null;
  capacity_label?: string | null;
  status?: string;
  booking_date?: string | null;
  request_date?: string | null;
  studio?: {
    studio_name?: string | null;
    city?: string | null;
    state?: string | null;
    space_type?: string | null;
    capacity_min?: number | null;
    capacity_max?: number | null;
  };
};

const normalizeStatus = (status?: string): Status => {
  const value = String(status || "").toLowerCase();
  if (value === "confirmed" || value === "approved") return "Approved";
  if (value === "rejected" || value === "declined" || value === "cancelled") return "Rejected";
  return "Pending";
};

const normalizeRecord = (record: ApiRequest): StudioRecord => {
  const cityState = [record.studio?.city, record.studio?.state].filter(Boolean).join(", ");
  const location = record.location || cityState || "—";
  const capacity = record.capacity_label || (
    record.studio?.capacity_min && record.studio?.capacity_max
      ? `${record.studio.capacity_min} - ${record.studio.capacity_max} ppl`
      : "—"
  );

  return {
    id: String(record.studio_booking_id || record.studio_id || `${record.host_name}-${record.space_name}`),
    studio_booking_id: record.studio_booking_id,
    hostName: record.host_name || "Unknown",
    spaceName: record.space_name || record.studio_name || record.studio?.studio_name || "Studio",
    location,
    spaceType: record.space_type || record.studio?.space_type || "—",
    capacity,
    status: normalizeStatus(record.status),
    date: record.booking_date || record.request_date || new Date().toISOString().slice(0, 10),
  };
};

interface Props {
  isDark?: boolean;
  searchQuery?: string;
  selectedDate?: Date | null;
}

export const StudioRequestsTable = ({ isDark = true, searchQuery = "", selectedDate }: Props) => {
  const router = useRouter();
  const [studios, setStudios] = useState<StudioRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<string | null>(null);
  const [range, setRange] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [totalItems, setTotalItems] = useState(0);

  const month = useMemo(() => {
    if (!selectedDate) return undefined;
    return format(selectedDate, "yyyy-MM");
  }, [selectedDate]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getStudioRequests({
        page: currentPage,
        limit: itemsPerPage,
        status,
        search: searchQuery?.trim() || undefined,
        month: range === "all" ? month : month,
      });

      const rows = Array.isArray(response?.data?.rows)
        ? response.data.rows
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setStudios(rows.map(normalizeRecord));
      setTotalItems(Number(response?.data?.count || response?.pagination?.total || rows.length));
    } catch (error) {
      console.error(error);
      setStudios([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, status, searchQuery, month, range]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, status, month, range]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudios = studios;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShootToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shootToDelete) return;
    setIsDeleting(true);
    try {
      const response = await adminApi.deleteProject(shootToDelete.replace("#", ""));
      if (response?.success || response?.message === "Project deleted successfully") {
        setStudios((prev) => prev.filter((studio) => studio.id !== shootToDelete));
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

  const approveRequest = async (studio: StudioRecord) => {
    const bookingId = studio.studio_booking_id;
    if (!bookingId) {
      toast.error("Missing studio_booking_id for this request");
      return;
    }
    try {
      const response = await adminApi.approveStudioRequest(bookingId, "approve");
      if (response?.success) {
        toast.success(response?.message || "Studio request approved successfully");
        await fetchRequests();
      } else {
        toast.error(response?.error || response?.message || "Failed to approve studio request");
      }
    } catch (error) {
      console.error("Approve failed", error);
      toast.error("An error occurred while approving");
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/admin/studios/${id.replace("#", "")}`);
  };

  return (
    <div className={`w-full rounded-2xl border transition-colors duration-300 overflow-hidden mt-5 lg:mt-8 min-h-[400px] flex flex-col ${isDark ? "bg-[#171717] border-white/5" : "bg-[#FFF] border-[#E3E3E3]"}`}>
      <div className={`flex flex-row justify-between items-center p-5 border-b transition-colors duration-300 gap-4 ${isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={isDark ? "text-white" : "text-[#323232]"}>Studio Requests</h3>
        </div>
        <div className="flex gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className={`flex-1 sm:w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-[#111111] border-[#3D3D3D]" : "text-black bg-white border-[#E3E3E3]"}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`flex-1 sm:w-[120px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-white/70" : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"}`}>
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

      <div className="lg:hidden flex-grow space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#E8D1AB]" /></div>
        ) : currentStudios.length > 0 ? (
          <>
            <div className={`flex justify-between text-sm font-medium p-4 mb-4 rounded-b-2xl border-b ${isDark ? "text-[#E8D1AB] bg-[#101010] border-b-white/5" : "text-[#BFA780] bg-[#FFFCF6] border-b-[#E3E3E3]"}`}>
              <span>Project Name</span>
              <span>Status</span>
            </div>
            {currentStudios.map((studio) => (
              <div key={studio.id} className={`px-4 border-b pb-4 last:border-0 ${isDark ? "border-white/5" : "border-[#E3E3E3]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleExpand(studio.id)} className={`w-6 h-6 flex items-center justify-center rounded-full border ${expandedId === studio.id ? 'border-[#E8D1AB] text-[#E8D1AB]' : 'border-[#777674] text-[#777674]'} shrink-0`}>
                      {expandedId === studio.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-sm">{getInitials(studio.hostName)}</div>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.hostName}</p>
                  </div>
                  <StudioStatusBadge status={studio.status} mobile />
                </div>
                {expandedId === studio.id && (
                  <div className="mt-4 grid grid-cols-2 gap-y-4 px-2">
                    <div><p className="text-[#666] text-[10px] uppercase tracking-wider">Space Name</p><p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceName}</p></div>
                    <div className="text-right"><p className="text-[#666] text-[10px] uppercase tracking-wider">Type</p><p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceType}</p></div>
                    <div><p className="text-[#666] text-[10px] uppercase tracking-wider">Location</p><p className={`text-sm ${isDark ? "text-white" : "text-[#323232]"} pr-2`}>{studio.location}</p></div>
                    <div className="text-right"><p className="text-[#666] text-[10px] uppercase tracking-wider">Capacity</p><p className={`text-sm ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>{studio.capacity}</p></div>
                    <div><p className="text-[#666] text-[10px] uppercase tracking-wider">Action</p>{studio.status === "Approved" ? <button onClick={(e) => handleDeleteClick(e, studio.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}><Trash2 size={18} /></button> : studio.status === "Rejected" ? <button className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"}`}><CircleAlert size={18} /></button> : <div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); void approveRequest(studio); }} className="px-3 h-8 rounded-lg text-xs bg-[#EBFFF0] text-[#16A34A]">Accept</button><button className="text-xs underline text-[#F98A84]">Decline</button></div>}</div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : <div className="text-center py-10 text-white/50">No studios found.</div>}
      </div>

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
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10"><Loader2 className="animate-spin text-[#E8D1AB] mx-auto" size={32} /></td></tr>
            ) : currentStudios.length > 0 ? (
              currentStudios.map((studio) => (
                <tr key={studio.id} onClick={() => handleRowClick(studio.id)} className={`group transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"}`}>
                  <td className="py-2 lg:py-4 px-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#F5F5F5] text-black font-semibold text-lg">{getInitials(studio.hostName)}</div><div><p className={`font-semibold text-base max-w-[200px] truncate ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.hostName}</p><p className={`${isDark ? "text-[#666666]" : "text-[#32323266]"} text-sm mt-0.5`}>{format(new Date(studio.date), "MMM dd, yyyy")}</p></div></div></td>
                  <td className={`py-2 lg:py-4 px-4 text-base ${isDark ? "text-white/90" : "text-[#323232]"}`}>{studio.spaceName}</td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium ${isDark ? "text-white/90" : "text-[#323232]"}`}>{studio.location}</td>
                  <td className={`py-2 lg:py-4 px-4 font-medium ${isDark ? "text-white" : "text-[#323232]"}`}>{studio.spaceType}</td>
                  <td className={`py-2 lg:py-4 px-4 text-base font-medium ${isDark ? "text-[#F6A554]" : "text-[#323232]"}`}>{studio.capacity}</td>
                  <td className="py-2 lg:py-4 px-4"><StudioStatusBadge status={studio.status} /></td>
                  <td className="py-2 lg:py-4 px-4 text-right">
                    {studio.status === "Approved" ? <button onClick={(e) => handleDeleteClick(e, studio.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"} hover:text-red-500`}><Trash2 size={18} /></button> : studio.status === "Rejected" ? <button className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-[#32323266]"}`}><CircleAlert size={18} /></button> : <div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); void approveRequest(studio); }} className="px-3 h-8 rounded-lg text-xs bg-[#EBFFF0] text-[#16A34A]">Accept</button><button className={`text-xs underline ${isDark ? "text-[#F98A84]" : "text-[#32323266]"}`}>Decline</button></div>}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-10 text-white/50">No Studios found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalItems > 0 && (
        <div className={`flex justify-between items-center p-4 border-t transition-colors duration-300 ${isDark ? "bg-[#101010] border-white/5" : "bg-white border-[#E3E3E3]"}`}>
          <div className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#32323266]"}`}>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries</div>
          <div className="flex gap-2 items-center">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#323232] border-[#E3E3E3] hover:bg-zinc-50"}`}>Previous</button>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? "bg-[#1A1A1A] text-white/60 border-white/5 hover:bg-white/10" : "bg-white text-[#323232] border-[#E3E3E3] hover:bg-zinc-50"}`}>Next</button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Studio"
        description="Are you sure you want to delete this studio? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
