"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
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
import { useTheme } from "next-themes";
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  videographer: "Videography",
  photographer: "Photography",
  video_editor: "Video Editing",
  photo_editor: "Photo Editing",
  editor: "Editing",
  cinematographer: "Cinematography",
};

const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const getShootCategoryLabel = (project: any) => {
  if (typeof project.event_type_labels === "string" && project.event_type_labels.trim()) {
    return project.event_type_labels.trim();
  }

  const labels = new Set<string>();

  if (typeof project.content_type === "string" && project.content_type.trim()) {
    project.content_type
      .split(",")
      .map((item: string) => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach((item: string) => labels.add(CONTENT_TYPE_LABELS[item] || toTitleCase(item)));
  }

  if (!labels.size && typeof project.crew_roles === "string" && project.crew_roles.trim()) {
    try {
      const parsedCrewRoles = JSON.parse(project.crew_roles);
      Object.keys(parsedCrewRoles || {}).forEach((role) => {
        if (parsedCrewRoles[role]) {
          labels.add(CONTENT_TYPE_LABELS[role] || toTitleCase(role));
        }
      });
    } catch (error) {
      console.warn("Failed to parse crew_roles for category label", error);
    }
  }

  if (labels.size) {
    return Array.from(labels).join(", ");
  }

  if (typeof project.event_type === "string" && project.event_type.trim()) {
    return toTitleCase(project.event_type);
  }

  if (typeof project.shoot_type === "string" && project.shoot_type.trim()) {
    return toTitleCase(project.shoot_type);
  }

  return "N/A";
};

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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

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
            category: getShootCategoryLabel(project),
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
      return <ArrowUpDown size={14} className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-[#666]" : "text-[#999]"}`} />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />
      : <ChevronDown size={14} className={`ml-2 ${isDark ? "text-[#E8D1AB]" : "text-[#B18A00]"}`} />;
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

  if (!mounted) return null;

  return (
    <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
            <input
              type="text"
              placeholder="Search project name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full md:w-[280px] border rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none transition-colors ${isDark ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]" : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
                }`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className={`w-[140px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
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
              <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5] text-black"}`}>
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
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : processedShoots.length === 0 ? (
        <div className={`py-20 text-center font-instrument-sans ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
      ) : (
        <>
          {/* MOBILE ONLY VIEW */}
          <div className={`lg:hidden transition-colors duration-300 ${isDark ? "bg-[#111111]" : ""}`}>
            <div className={`flex justify-between px-5 py-3 text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#000000]"}`}>
              <span>Customer Name</span>
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
                  <th className="py-5 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentShoots.map((shoot, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(shoot.id)}
                    className={`border-b transition-colors last:border-0 cursor-pointer ${isDark ? "border-[#222222] hover:bg-white/[0.02]" : "border-[#F5F5F5] hover:bg-zinc-50"}`}
                  >
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.id}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm ${isDark ? "bg-[#F5F5F5] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                          {shoot.initials}
                        </div>
                        <div>
                          <p className={`font-medium text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#000000]"}`}>{shoot.customerName}</p>
                          <p className={`text-xs mt-1.5 ${isDark ? "text-[#666666]" : "text-[#999]"}`}>{shoot.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.category}</td>
                    <td className={`py-5 px-6 text-base leading-none tracking-normal ${isDark ? "text-[#E0E0E0]" : "text-[#333]"}`}>{shoot.price}</td>
                    <td className="py-5 px-6">
                      <StatusBadge status={shoot.status} />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDeleteClick(e, shoot.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isDark ? "text-[#666] hover:bg-white/10 hover:text-red-500" : "text-[#999] hover:bg-red-50 hover:text-red-500"}`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight size={20} className={isDark ? "text-[#666666]" : "text-[#999]"} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div >
        </>
      )}

      {/* Pagination - Exact Logic Preserved */}
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
        )
      }
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Shoot"
        description="Are you sure you want to delete this shoot? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div >
  );
};
