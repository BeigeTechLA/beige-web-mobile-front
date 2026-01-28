"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";

type ShootStatus = "Pending" | "Pre Production" | "Completed" | "Rejected";

// internal status mapping for styles
const STATUS_STYLES = {
  "Initiated": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
  "PreProduction": "bg-[#FDF4FF] text-[#C065F0] border-[#C065F0]/20",
  "PostProduction": "bg-[#E0F2FE] text-[#0EA5E9] border-[#0EA5E9]/20",
  "Revision": "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
  "Completed": "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
  "Cancelled": "bg-[#FFF5F5] text-[#EF4444] border-[#EF4444]/20",
};

const STATUS_LABEL_MAP: Record<number, string> = {
  0: "Initiated",
  1: "PreProduction",
  2: "PostProduction",
  3: "Revision",
  4: "Completed",
  5: "Cancelled",
};

interface ShootRecord {
  id: string;
  customerName: string;
  customerImage: string;
  date: string;
  category: string;
  price: string;
  status: string;
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

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <span className={`px-6 py-2 rounded-full text-sm font-semibold border ${style}`}>
      {status}
    </span>
  );
};

export const OverallShootsTable = () => {
  const [shoots, setShoots] = useState<ShootRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsResponse, skillsResponse] = await Promise.all([
          adminApi.getProjects(),
          adminApi.getSkills()
        ]);

        // Create Skill Map: ID -> Name
        const skillMap: Record<number, string> = {};
        if (skillsResponse && skillsResponse.data) {
          const skillsList = Array.isArray(skillsResponse.data) ? skillsResponse.data : (skillsResponse.data?.data || []);
          skillsList.forEach((s: any) => {
            // Adapt to potential API responses: { id, name } or { id, skill_name } etc.
            // Assuming 'name' based on standard conventions, but safeguard with 'skill_name' if needed or just dump whole object to see
            const name = s.name || s.skill_name || s.title;
            if (s.id && name) {
              skillMap[s.id] = name;
            }
          });
        }

        const projectsList = projectsResponse?.data?.projects || [];

        const mappedShoots = projectsList.map((item: any) => {
          const project = item.project || item;
          const statusLabel = STATUS_LABEL_MAP[project.status] || "Unknown";

          return {
            id: `#${project.stream_project_booking_id}`,
            customerName: project.project_name || "Untitled Project",
            customerImage: project.user_image || "/images/avatar.png",
            date: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date",
            category: parseSkills(project.skills_needed, skillMap),
            price: project.budget ? `$${parseFloat(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
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
  }, []);

  const totalPages = Math.ceil(shoots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentShoots = shoots.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full bg-[#171717] rounded-2xl border border-white/5 overflow-hidden mt-8 min-h-[400px] flex flex-col">
      {/* Table Header Controls */}
      <div className="bg-[#101010] flex justify-between items-center p-5 border-b border-b-[#3D3D3D]">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className="">Overall Shoots</h3>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
            Month <ChevronDown size={14} />
          </button>
          <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
            All <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Table Grid */}
      <div className="w-full overflow-x-auto flex-grow">
        <table className="w-full text-left">
          <thead className="bg-[#101010] ">
            <tr className="text-[#E8D1AB] text-sm font-medium rounded-b-xl">
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D] ">Shoot ID</th>
              <th className="pb-4 px-4 bg-[#101010] py-4 px-4 
               border-b border-b-[#3D3D3D]">Customer Name</th>
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
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10">
                        <Image
                          src={shoot.customerImage}
                          alt={shoot.customerName}
                          fill
                          className="object-cover"
                        />
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
                    <button className="p-2 text-white/40 hover:text-white transition-colors">
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
        <div className="flex justify-between items-center p-4 border-t border-white/5 bg-[#101010]">
          <div className="text-sm text-white/40">
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
    </div>
  );
};