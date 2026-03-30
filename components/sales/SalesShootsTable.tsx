"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseDate } from "@/src/components/landing/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MobileShootRow } from "@/components/admin/shoot-details/MobileShootRow";
import { StatusBadge } from "../admin/StatusBadge";
import { useTheme } from "next-themes";

type ShootStatus = "Booked" | "Cancelled" | "In-Progress" | "Initiated" | "PreProduction" | "PostProduction" | "Revision" | "Completed" | "Unknown";

interface ShootRecord {
  id: string;
  customerName: string;
  initials: string;
  date: string;
  category: string;
  price: string;
  status: ShootStatus;
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

export default function SalesShootsTable({ externalSelectedDate }: { externalSelectedDate?: Date | null }) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New filtering states
  const [range, setRange] = useState<string>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // Sync external date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange("custom");
    } else if (range === "custom") {
      setRange("month");
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

        if (externalSelectedDate && range === 'custom') {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const [projectsResponse, skillsResponse] = await Promise.all([
          adminApi.getProjects(params),
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
          const statusLabel = STATUS_LABEL_MAP[project.status] || "Unknown" as ShootStatus;
          const customerName = project.project_name || "Untitled Project";
          const initials = customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName,
            initials,
            date: project.event_date ? (parseDate(project.event_date) || new Date(project.event_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: parseSkills(project.skills_needed, skillMap),
            price: project.budget ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
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
  }, [range, statusFilter, externalSelectedDate]);

  const totalPages = Math.ceil(shoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowClick = (id: string) => {
    // Remove the # from the ID for the URL
    const cleanId = id.replace('#', '');
    // Navigate to SALES shoots detail page (NOT admin)
    router.push(`/sales/shoots/${cleanId}`);
  };

  return (
    <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E5E5E5]"}`} style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className={`flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b gap-4 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
        <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>All Shoots</h3>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[130px] rounded-lg h-10 text-sm focus:ring-0 capitalize ${isDark ? "bg-zinc-900 border-[#333333] text-white/70" : "bg-white border-[#E5E5E5] text-[#666]"}`}>
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

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : shoots.length === 0 ? (
        <div className={`py-20 text-center font-instrument-sans ${isDark ? "text-white/50" : "text-[#999]"}`}>No shoots found.</div>
      ) : (
        <>
          {/* MOBILE ONLY VIEW (Visible on small screens, hidden on lg) */}
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

          {/* DESKTOP TABLE VIEW (Hidden on small screens, block on lg) */}
          <div className="hidden lg:block w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-base font-medium border-b leading-none tracking-normal transition-colors duration-300 ${isDark ? "text-[#E8D1AB] border-[#333333]" : "text-[#000000] border-[#E5E5E5] bg-[#FFFCF6]"}`}>
                  <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Shoot ID</th>
                  <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Customer Name</th>
                  <th className="py-5 px-6 font-medium">Category</th>
                  <th className="py-5 px-6 font-medium cursor-pointer group hover:text-opacity-70 transition-colors">Price</th>
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

                    {/* Action */}
                    <td className="py-5 px-6 text-right">
                      <button className={`transition-colors`}>
                        <ChevronRight size={20} className={isDark ? "text-[#666666]" : "text-[#999]"} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && shoots.length > 0 && (
            <div className={`flex justify-between items-center p-6 border-t transition-colors duration-300 ${isDark ? "border-[#333333]" : "border-[#E5E5E5]"}`}>
              <div className={`hidden lg:block text-sm ${isDark ? "text-[#666666]" : "text-[#999]"}`}>
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shoots.length)} of {shoots.length} entries
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
        </>
      )}
    </div>
  );
}
