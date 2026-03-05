"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, SlidersHorizontal, Pencil, CheckCircle2, Circle, CircleX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface ShootHeaderProps {
  activeTab?: string;
  project?: any;
  projectId?: string;
}

export default function ShootHeader({ activeTab = "Overview", project, projectId }: ShootHeaderProps) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const getInitials = (name: string) => {
    if (!name) return "NA";
    const words = name.trim().split(/\s+/);
    const firstLetter = words[0]?.charAt(0) || "";
    const secondLetter = words[1]?.charAt(0) || "";
    return (firstLetter + secondLetter).toUpperCase();
  };

  if (!mounted) return null;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className={`lg:hidden transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Top Bar */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`transition-colors flex items-center gap-2 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        {/* <div className="flex gap-3">
          <Button
            variant="outline"
            className={`border-none rounded-lg h-10 px-4 gap-2 transition-colors ${isDark
                ? "bg-[#2C2C2C] text-red-400 hover:bg-[#3D3D3D] hover:text-red-300"
                : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              }`}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" /> Delete Shoot
          </Button>
          <Button
            variant="outline"
            className={`rounded-lg h-10 px-4 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-white border-[#E5E5E5] text-[#666] hover:bg-zinc-50"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
          <Button className={`rounded-lg h-10 px-6 font-medium transition-all ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#B18A00] text-white hover:bg-[#967500]"
            }`}>
            Edit Shoot
          </Button>
        </div> */}
      </div>

      {/* Hero Section */}
      <div className={`transition-all duration-300 lg:rounded-2xl mb-6 lg:mb-10`}>
        <div className="flex gap-5">
          <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center text-sm lg:text-2xl font-bold ${isDark ? "bg-[#D6E4FF] text-[#1E40AF]" : "bg-[#C8E1FF] text-[#1E40AF]"
            }`}>
            {getInitials(project?.project_name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                {project?.project_name || "Untitled Project"}
                {project?.skills_needed && (
                  <span className={`font-normal lg:text-lg ml-2 ${isDark ? "text-[#888]" : "text-[#666]"}`}>
                    ({project.skills_needed})
                  </span>
                )}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {project?.status !== undefined ? (["Initiated", "Pre Production", "Post Production", "Revision", "Completed", "Cancelled"][project.status] || "Unknown") : "Pending"}
              </span>
            </div>
            <p className={`text-sm leading-relaxed max-w-3xl transition-colors ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
              {project?.description || "No description available."}
            </p>
          </div>
        </div>


        <div>
            <div className={`hidden lg:block w-full h-px my-6 transition-colors ${isDark ? "bg-[#222222]" : "bg-[#E5E5E5]"}`} />
            <div className={`flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base mt-4 lg:mt-0 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"
              }`}>
              <div className="flex gap-2">
                <span>Shoot Date :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {project?.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Time :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {project?.event_start_time ? new Date(project.event_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  {/* Duration calc could be here */}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Total Value :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                  {project?.budget ? `$${parseFloat(project.budget).toLocaleString()}` : "$0.00"}
                </span>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Payment Status :</span>
                <span className="text-[#22C55E] font-medium">Paid</span>
              </div>
            </div>

            <div className={`flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base mt-2 lg:mt-4 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"
              }`}>
              <div className="flex gap-2">
                <span>Folder Link :</span>
                <a href="#" className={`underline underline-offset-4 transition-all ${isDark
                    ? "text-[#E5D5B8] decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8]"
                    : "text-[#B18A00] decoration-[#B18A00]/30 hover:decoration-[#B18A00]"
                  }`}>
                  http://fjiejpfkmdfjief
                  {(activeTab === "Pre_Production" || activeTab === "Post_Production") && (
                    <span className={isDark ? "text-white" : "text-black"}> / {activeTab.replace("_", " ")}</span>
                  )}
                </a>
              </div>
              <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
              <div className="flex gap-2">
                <span>Shoot Files :</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>200 Image & 50 Videos</span>
              </div>
            </div>

            <div className={`mt-2 lg:mt-4 text-sm lg:text-base flex gap-2 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
              <span>Location :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {[project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") || "No location specified"}
              </span>
            </div>
        </div>
      </div>
    </div>
  );
}
