"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, SlidersHorizontal, Pencil, CheckCircle2, Circle, CircleX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

interface ShootHeaderProps {
  activeTab?: string;
  project?: any;
  projectId?: string;
}

export default function ShootHeader({ activeTab = "Overview", project, projectId }: ShootHeaderProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const getInitials = (name: string) => {
    if (!name) return "NA";
    const words = name.trim().split(/\s+/);
    const firstLetter = words[0]?.charAt(0) || "";
    const secondLetter = words[1]?.charAt(0) || "";
    return (firstLetter + secondLetter).toUpperCase();
  };

  return (
    <div>
      <button onClick={() => router.back()} className="lg:hidden text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-3">
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>
      {/* Top Bar */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-[#2C2C2C] border-none text-red-400 hover:bg-[#3D3D3D] hover:text-red-300 rounded-lg h-10 px-4 gap-2"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4" /> Delete Shoot
          </Button>
          {/* <Button variant="outline" className="bg-[#1A1A1A] border border-white/10 text-white hover:bg-[#2C2C2C] rounded-lg h-10 px-4 gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button> */}
          <Button
            onClick={() => router.push(`/admin/shoots/${projectId}/edit-booking`)}
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
      <div className="lg:bg-[#111111] lg:rounded-2xl lg:p-6 lg:border lg:border-[#222222] mb-6">
        <div className="flex gap-5">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl bg-[#D6E4FF] flex items-center justify-center text-[#1E40AF] text-sm lg:text-2xl font-bold">
            {getInitials(project?.project_name)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="lg:text-2xl font-bold text-white">
                {project?.project_name || "Untitled Project"}
                {project?.skills_needed && project.skills_needed !== "N/A" && <span className="text-[#888] font-normal lg:text-lg ml-2">({project.skills_needed})</span>}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {project?.status !== undefined ? (["Initiated", "Pre Production", "Post Production", "Revision", "Completed", "Cancelled"][project.status] || "Unknown") : "Pending"}
              </span>
            </div>
            <p className="text-[#888888] text-sm whitespace-pre-line leading-relaxed max-w-3xl">
              {project?.description
                ? project.description.replace(/Matching Method:.*$/gm, '').trim()
                : "No description available."}
            </p>

            <div className="hidden lg:block w-full h-px bg-[#222222] my-6" />

            <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base text-[#AAAAAA] mt-4 lg:mt-0">
              <div className="flex gap-2">
                <span>Shoot Date :</span>
                <span className="text-white font-medium">
                  {project?.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Time :</span>
                <span className="text-white font-medium">
                  {project?.start_time && project?.end_time ? (
                    `${project.start_time.split(':').slice(0, 2).join(':')} - ${project.end_time.split(':').slice(0, 2).join(':')}`
                  ) : project?.event_start_time ? (
                    new Date(project.event_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  ) : ""}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Total Value :</span>
                <span className="text-white font-medium">
                  {project?.total_paid_amount ? `$${parseFloat(project.total_paid_amount).toLocaleString()}` : "$0.00"}
                </span>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Payment Status :</span>
                <span className={cn(
                  "font-medium capitalize",
                  project?.payment_status === 'paid' ? "text-[#22C55E]" : "text-yellow-500"
                )}>
                  {project?.payment_status || "Paid"}
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-y-4 lg:gap-x-12 text-sm lg:text-base text-[#AAAAAA] mt-2 lg:mt-4">
              <div className="flex gap-2">
                <span>Folder Link :</span>
                <a href="#" className="text-[#E5D5B8] underline underline-offset-4 decoration-[#E5D5B8]/30 hover:decoration-[#E5D5B8] transition-all">
                  http://fjiejpfkmdfjief
                  {(activeTab === "Pre_Production" || activeTab === "Post_Production") && (
                    <span className="text-white"> / {activeTab.replace("_", " ")}</span>
                  )}
                </a>
              </div>
              <div className="hidden lg:block w-px h-5 bg-[#333333]" />
              <div className="flex gap-2">
                <span>Shoot Files :</span>
                <span className="text-white font-medium">200 Image & 50 Videos</span>
              </div>
            </div>

            <div className="mt-2 lg:mt-4 text-sm lg:text-base text-[#AAAAAA] flex gap-2">
              <span>Location :</span>
              <span className="text-white font-medium whitespace-pre-wrap">
                {project?.event_location || [project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") || "No location specified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
