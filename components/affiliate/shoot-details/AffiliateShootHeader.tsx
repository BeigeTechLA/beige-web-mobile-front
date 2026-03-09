"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, SlidersHorizontal, Pencil, CheckCircle2, Circle, CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AffiliateShootHeaderProps {
  activeTab?: string;
  project?: any;
  onBack?: () => void;
}

export default function AffiliateShootHeader({ activeTab = "Overview", project, onBack }: AffiliateShootHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div>
      <button onClick={handleBack} className="lg:hidden text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-3">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>
      {/* Top Bar */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        {/* <div className="flex gap-3">
          <Button variant="outline" className="bg-[#2C2C2C] border-none text-red-400 hover:bg-[#3D3D3D] hover:text-red-300 rounded-lg h-10 px-4 gap-2">
            <CircleX className="w-4 h-4" /> Cancel Shoot
          </Button>
          <Button variant="outline" className="bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#2C2C2C] rounded-lg h-10 px-4 gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
          <Button className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium">
            Edit Shoot
          </Button>
        </div> */}
      </div>

      {/* Hero Section */}
      <div className="lg:bg-[#111111] lg:rounded-2xl lg:p-6 lg:border lg:border-[#222222] mb-6">
        <div className="flex gap-5">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl bg-[#D6E4FF] flex items-center justify-center text-[#1E40AF] text-sm lg:text-2xl font-bold">
            {project?.project_name ? project.project_name.substring(0, 2).toUpperCase() : "NA"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="lg:text-2xl font-bold text-white">
                {project?.project_name || "Untitled Project"}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {project?.status !== undefined ? (["Initiated", "Pre-Production", "Post-Production", "Revision", "Completed", "Cancelled"][project.status] || "Unknown") : "Pending"}
              </span>
            </div>
            {project?.skills_needed && project.skills_needed !== "N/A" && (
              <p className="text-[#888] font-normal text-sm lg:text-base mb-2">({project.skills_needed})</p>
            )}
            <p className="text-[#888888] text-sm leading-relaxed max-w-3xl">
              {(project?.description || "No description available.").replace(/Matching Method: ai_matchmaker/gi, "").trim()}
            </p>

            <div className="hidden lg:block w-full h-px bg-[#222222] my-6" />

            <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base text-[#AAAAAA] mt-4 lg:mt-0">
              <div className="flex gap-2">
                <span>Shoot Date :</span>
                <span className="text-white font-medium">
                  {project?.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Time :</span>
                <span className="text-white font-medium">
                  {project?.start_time ? project.start_time : "N/A"}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Total Value :</span>
                <span className="text-white font-medium">
                  {project?.quote_total ? `$${parseFloat(project.quote_total).toLocaleString()}` : (project?.budget ? `$${parseFloat(project.budget).toLocaleString()}` : "$0.00")}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Payment Status :</span>
                {project?.payment_id || project?.payment_status === "paid" ? (
                  <span className="text-[#22C55E] font-medium">Paid</span>
                ) : (
                  <span className="text-yellow-400 font-medium">Pending</span>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base text-[#AAAAAA] mt-2 lg:mt-4">
              <div className="flex gap-2">
                <span>Folder Link :</span>
                <a href={project?.reference_links || "#"} target="_blank" rel="noopener noreferrer" className="text-[#E5D5B8] underline underline-offset-4 decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8] transition-all">
                  {project?.reference_links ? "View Folder" : "No Link Available"}
                  {(activeTab === "Pre_Production" || activeTab === "Post_Production") && project?.reference_links && (
                    <span className="text-white"> / {activeTab.replace("_", " ")}</span>
                  )}
                </a>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Shoot Files :</span>
                <span className="text-white font-medium">Coming Soon</span>
              </div>
            </div>

            <div className="mt-2 lg:mt-4 text-sm lg:text-base text-[#AAAAAA] flex gap-2">
              <span>Location :</span>
              <span className="text-white font-medium">
                {project?.event_location || [project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") || "No location specified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
