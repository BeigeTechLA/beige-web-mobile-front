"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye, Trash2, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import {
  getProjectDateText,
  getPaymentStatusMeta,
  getProjectFolderLink,
  getProjectScheduleTimeText,
  getShootFilesText,
} from "@/lib/utils/shootDetails";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils"
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";

interface ShootHeaderProps {
  activeTab?: string;
  project?: any;
  projectId?: string;
}

export default function ShootHeader({ activeTab = "Overview", project, projectId }: ShootHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const paymentStatus = getPaymentStatusMeta(project?.payment_status, project?.payment_id);
  const folderLink = getProjectFolderLink(project);
  const [workspaceFolderLink, setWorkspaceFolderLink] = React.useState("");
  const [workspaceFileCount, setWorkspaceFileCount] = React.useState<number | null>(null);
  const projectDateText = getProjectDateText(project);
  const projectTimeText = getProjectScheduleTimeText(project);
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : getShootFilesText(project);
  const resolvedStatusLabel =
    project?.timeline_label ||
    timelineStageToHeaderLabel(resolveTimelineStage(project));

  React.useEffect(() => {
    let isMounted = true;

    const loadWorkspaceSummary = async () => {
      if (!projectId) return;

      try {
        const response = await fileManagerApi.getExternalWorkspace(projectId);
        if (!isMounted) return;

        setWorkspaceFolderLink(response.workspace.consoleUrl || "");
        setWorkspaceFileCount(
          typeof response.workspace.fileCount === "number" ? response.workspace.fileCount : null
        );
      } catch (error) {
        if (!isMounted) return;
        setWorkspaceFolderLink("");
        setWorkspaceFileCount(null);
      }
    };

    loadWorkspaceSummary();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

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
            // className="bg-[#2C2C2C] border-none text-[#E5D5B8] hover:bg-[#3D3D3D] hover:text-[#f0e4d0] rounded-lg h-10 px-4 gap-2"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" /> Delete Shoot
          </Button>
          <Button variant="outline" className="bg-[#2C2C2C] border-none text-[#E5D5B8] hover:bg-[#3D3D3D] hover:text-[#f0e4d0] rounded-lg h-10 px-4 gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
          <Button className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium">
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
                {project?.skills_needed && project.skills_needed !== "N/A" && <span className={`font-normal lg:text-lg ml-2 ${isDark ? "text-[#888]" : "text-[#666]"}`}>({project.skills_needed})</span>}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {resolvedStatusLabel || "Pending"}
              </span>
            </div>
            <p className={`text-sm leading-relaxed max-w-3xl transition-colors whitespace-pre-line leading-relaxed ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
              {project?.description
                ? project.description.replace(/Matching Method:.*$/gm, '').trim()
                : "No description available."}
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
                {projectDateText}
              </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Time :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {projectTimeText}
              </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Total Value :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
              {project?.total_value_amount ? `$${parseFloat(project.total_value_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}  </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Payment Status :</span>
              <span className={cn("font-medium", paymentStatus.className)}>
                {paymentStatus.label}
              </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Shoot Files :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{shootFilesText}</span>
            </div>
          </div>

          <div className={`flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base mt-0 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"
            }`}>
            {/* <div className="flex gap-2">
              <span>Folder Link :</span>
              <a
                href={folderLink || "#"}
                target={folderLink ? "_blank" : undefined}
                rel={folderLink ? "noopener noreferrer" : undefined}
                className={cn(
                  "underline underline-offset-4 transition-all",
                  folderLink
                    ? isDark ? "text-[#E5D5B8] decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8]" : "text-[#B18A00] decoration-[#B18A00]/30 hover:decoration-[#B18A00]"
                    : isDark ? "text-white/50 decoration-white/10 pointer-events-none" : "text-black/50 decoration-black/10 pointer-events-none"
                )}

              >
                {folderLink || "No Link Available"}
                {folderLink && (activeTab === "Pre_Production" || activeTab === "Post_Production") && (
                  <span className={isDark ? "text-white" : "text-black"}> / {activeTab.replace("_", " ")}</span>
                )}
              </a>
            </div> */}
          </div>

          <div className={`mt-2 text-sm lg:text-base flex gap-2 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
            <span>Location :</span>
            <span className={`${isDark ? "text-white" : "text-black"} font-medium whitespace-pre-wrap`}>
              {[project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") || "No location specified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
