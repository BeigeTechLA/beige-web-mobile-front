"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileShootRow } from "@/components/admin/shoot-details/MobileShootRow";
import { StatusBadge } from "./StatusBadge";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

type ShootStatus = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Unknown";

interface ShootRecord {
  id: string;
  customerName: string;
  initials: string;
  date: string;
  rawDate: number; // Added for correct chronological sorting
  category: string;
  price: string;
  rawPrice: number; // Added for correct numerical sorting
  status: ShootStatus;
}

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

interface ShootsTableProps {
  externalSelectedDate?: Date | null;
  detailBasePath?: string;
  enablePriceSort?: boolean;
}

export const ShootsTable = ({
  externalSelectedDate,
  detailBasePath = "/admin/shoots",
  enablePriceSort = true,
}: ShootsTableProps) => {
  const router = useRouter();
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtering states
  const [range, setRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShootRecord; direction: 'asc' | 'desc' | null }>({
    key: 'rawDate',
    direction: null,
  });

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shootToDelete, setShootToDelete] = useState<string | null>(null);

  // Sync external date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("all");
    }
  }, [externalSelectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: any = { range };
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        if (categoryFilter !== "all") {
          params.category = categoryFilter;
        }

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const projectsResponse = await adminApi.getProjects(params);
        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const statusLabel = STATUS_LABEL_MAP[project.status] || "Unknown" as ShootStatus;
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

          // Sorting Helpers
          const dateObj = project.event_date ? parseISO(project.event_date) : new Date(0);
          const priceValue = project.total_paid_amount
            ? parseFloat(project.total_paid_amount)
            : project.budget ? parseFloat(project.budget) : 0;

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName,
            initials,
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            rawDate: dateObj.getTime(),
            category: project.event_type_labels || "N/A",
            price: project.total_paid_amount
              ? `$${parseFloat(project.total_paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : project.budget
                ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "$0.00",
            rawPrice: priceValue,
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
  }, [range, statusFilter, categoryFilter, externalSelectedDate]);

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
      return <ArrowUpDown size={14} className="ml-2 text-[#666] opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className="ml-2 text-[#E8D1AB]" />
      : <ChevronDown size={14} className="ml-2 text-[#E8D1AB]" />;
  };

  const totalPages = Math.ceil(processedShoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = processedShoots.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (id: string) => {
    const cleanId = id.replace('#', '');
    router.push(`${detailBasePath}/${cleanId}`);
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
    <div className="w-full bg-[#111111] rounded-2xl border border-[#333333] overflow-hidden" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b border-[#333333] gap-4">
        <h3 className="text-xl font-semibold text-white">All Shoots</h3>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
            <input
              type="text"
              placeholder="Search project name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-[280px] bg-zinc-900 border border-[#333333] rounded-lg h-10 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E8D1AB] transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] bg-zinc-900 border-[#333333] rounded-lg h-10 text-sm text-white/70 focus:ring-0 capitalize">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#333333]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="private">Private Events</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="social">Social Content</SelectItem>
                <SelectItem value="podcasts">Podcasts</SelectItem>
                <SelectItem value="music">Music Videos</SelectItem>
                <SelectItem value="narrative">Narrative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px] bg-zinc-900 border-[#333333] rounded-lg h-10 text-sm text-white/70 focus:ring-0 capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#333333]">
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

            <Select value={range} onValueChange={(v) => { setRange(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px] bg-zinc-900 border-[#333333] rounded-lg h-10 text-sm text-white/70 focus:ring-0">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-[#333333]">
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : processedShoots.length === 0 ? (
        <div className="py-20 text-center text-white/50 font-instrument-sans">No shoots found.</div>
      ) : (
        <>
          {/* MOBILE ONLY VIEW */}
          <div className="lg:hidden p-3 bg-[#111111]">
            <div className="flex justify-between px-5 py-3 text-[#E8D1AB] text-sm font-medium">
              <span>Project Name</span>
              <span>Status</span>
            </div>

            <div className="flex flex-col gap-2 ">
              {currentShoots.map((shoot, idx) => (
                <MobileShootRow
                  key={idx}
                  shoot={shoot}
                  onRowClick={handleRowClick}
                />
              ))}
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#E8D1AB] text-base font-medium border-b border-[#333333] leading-none tracking-normal">
                  <th
                    className="py-5 px-6 font-medium cursor-pointer group hover:text-white transition-colors"
                    onClick={() => requestSort('id')}
                  >
                    <div className="flex items-center">Shoot ID {getSortIcon('id')}</div>
                  </th>
                  <th
                    className="py-5 px-6 font-medium cursor-pointer group hover:text-white transition-colors"
                    onClick={() => requestSort('customerName')}
                  >
                    <div className="flex items-center">Project Name {getSortIcon('customerName')}</div>
                  </th>
                  <th className="py-5 px-6 font-medium">Category</th>
                  {enablePriceSort ? (
                    <th
                      className="py-5 px-6 font-medium cursor-pointer group hover:text-white transition-colors"
                      onClick={() => requestSort('price')}
                    >
                      <div className="flex items-center">Price {getSortIcon('price')}</div>
                    </th>
                  ) : (
                    <th className="py-5 px-6 font-medium">Price</th>
                  )}
                  <th className="py-5 px-6 font-medium">Status</th>
                  <th className="py-5 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentShoots.map((shoot, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(shoot.id)}
                    className="border-b border-[#222222] hover:bg-white/[0.02] transition-colors last:border-0 cursor-pointer"
                  >
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.id}</td>
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
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.category}</td>
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.price}</td>
                    <td className="py-5 px-6">
                      <StatusBadge status={shoot.status} />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDeleteClick(e, shoot.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#666] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="text-white hover:text-white transition-colors">
                          <ChevronRight size={20} className="text-[#666666]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination - Exact Logic Preserved */}
      {!loading && processedShoots.length > 0 && (
        <div className="flex justify-between items-center p-6 border-t border-[#333333]">
          <div className="hidden lg:block text-sm text-[#666666]">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedShoots.length)} of {processedShoots.length} entries
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
                const rangeArr = [];
                const delta = 1;
                const left = currentPage - delta;
                const right = currentPage + delta + 1;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= left && i < right)) {
                    rangeArr.push(i);
                  } else if (i === left - 1 || i === right) {
                    rangeArr.push('...');
                  }
                }

                return rangeArr.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
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
