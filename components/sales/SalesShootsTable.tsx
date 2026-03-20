"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useEffect, useState } from "react";
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
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New filtering states
  const [range, setRange] = useState<string>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    <div className="w-full bg-[#111111] rounded-2xl border border-[#333333] overflow-hidden" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center p-4 lg:p-6 border-b border-[#333333] gap-2 ">
        <h3 className="text-xl font-semibold text-white">All Shoots</h3>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-zinc-900 border-[#333333] rounded-lg h-10 text-sm text-white/70 focus:ring-0 capitalize">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-[#333333]">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
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

      {loading ? (
        <div className="text-center py-20">
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-[#666]" size={32} />
          </div>
        </div>
      ) : shoots.length === 0 ? (
        <div className="py-20 text-center text-white/50 font-instrument-sans">No shoots found.</div>
      ) : (
        <>
          {/* MOBILE ONLY VIEW (Visible on small screens, hidden on lg) */}
          <div className="lg:hidden p-3 bg-[#111111]">
            <div className="flex justify-between px-5 py-3 text-[#E8D1AB] text-sm font-medium">
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
                <tr className="text-[#E8D1AB] text-base font-medium border-b border-[#333333] cursor-pointer leading-none tracking-normal">
                  <th className="py-5 px-6 font-medium">Shoot ID</th>
                  <th className="py-5 px-6 font-medium">Customer Name</th>
                  <th className="py-5 px-6 font-medium">Category</th>
                  <th className="py-5 px-6 font-medium">Price</th>
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
                    {/* ID */}
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.id}</td>

                    {/* Customer Info */}
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

                    {/* Category */}
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.category}</td>

                    {/* Price */}
                    <td className="py-5 px-6 text-[#E0E0E0] text-base font-medium leading-none tracking-normal">{shoot.price}</td>

                    {/* Status */}
                    <td className="py-5 px-6">
                      <StatusBadge status={shoot.status} />
                    </td>

                    {/* Action */}
                    <td className="py-5 px-6 text-right">
                      <button className="text-white hover:text-white transition-colors">
                        <ChevronRight size={20} className="text-[#666666]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && shoots.length > 0 && (
            <div className="flex justify-between items-center p-6 border-t border-[#333333]">
              <div className="hidden lg:block text-sm text-[#666666]">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, shoots.length)} of {shoots.length} entries
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
        </>
          )}
        </div>
      );
}
