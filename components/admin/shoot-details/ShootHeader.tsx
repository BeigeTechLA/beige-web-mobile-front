"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import {
  getPaymentStatusMeta,
  getProjectFolderLink,
  getProjectTimeText,
  getShootFilesText,
} from "@/lib/utils/shootDetails";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils"
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";

import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

type ShootHeaderProject = {
  payment_status?: string | null;
  payment_id?: string | number | null;
  project_name?: string;
  skills_needed?: string;
  status?: number;
  timeline_status?: number;
  timeline_label?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_start_time?: string;
  total_paid_amount?: string | number;
  event_location?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
};

interface ShootHeaderProps {
  activeTab?: string;
  project?: ShootHeaderProject;
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [workspaceFolderLink, setWorkspaceFolderLink] = React.useState("");
  const [workspaceFileCount, setWorkspaceFileCount] = React.useState<number | null>(null);
  const shootBasePath = pathname?.startsWith("/sales") ? "/sales/shoots" : "/admin/shoots";
  const paymentStatus = getPaymentStatusMeta(project?.payment_status, project?.payment_id);
  const folderLink = workspaceFolderLink || getProjectFolderLink(project);
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : getShootFilesText(project);

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
  const projectTimeText = getProjectTimeText(project);
  const resolvedStatusLabel =
    project?.timeline_label ||
    timelineStageToHeaderLabel(resolveTimelineStage(project));

  const handleDelete = async () => {
    if (!projectId) return;
    setIsDeleting(true);

    try {
      const response = await adminApi.deleteProject(projectId);
      if (response?.success || response?.message === "Project deleted successfully") {
        toast.success("Shoot deleted successfully");
        router.push('/admin/shoots');
      } else {
        toast.error(response?.error || "Failed to delete shoot");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
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

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-[#2C2C2C] border-none text-[#E5D5B8] hover:bg-[#3D3D3D] hover:text-[#f0e4d0] rounded-lg h-10 px-4 gap-2"
            onClick={() => router.push(`${shootBasePath}/${projectId}/form-details`)}
          >
            <Eye className="w-4 h-4" /> View Form Details
          </Button>
          <Button
            onClick={() => router.push(`${shootBasePath}/${projectId}/edit-booking`)}
            className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium"
          >
            Edit Shoot
          </Button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Shoot"
        description="Are you sure you want to delete this shoot? This action cannot be undone."
        isLoading={isDeleting}
      />

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
                {resolvedStatusLabel}
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
                {project?.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
              </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Time :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {project?.start_time && project?.end_time ? (
                  `${project.start_time.split(':').slice(0, 2).join(':')} - ${project.end_time.split(':').slice(0, 2).join(':')}`
                ) : project?.event_start_time ? (
                  new Date(project.event_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                ) : ""}
              </span>
            </div>
            <div className={`hidden lg:block w-px h-5 ${isDark ? "bg-[#333333]" : "bg-[#E5E5E5]"}`} />
            <div className="flex gap-2">
              <span>Total Value :</span>
              <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                {project?.total_paid_amount ? `$${parseFloat(project.total_paid_amount).toLocaleString()}` : "$0.00"}
              </span>
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

          <div className={`mt-2 lg:mt-4 text-sm lg:text-base flex gap-2 ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
            <span>Location :</span>
            <span className={`${isDark ? "text-white" : "text-black"} font-medium whitespace-pre-wrap`}>
              {project?.event_location || [project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") || "No location specified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
