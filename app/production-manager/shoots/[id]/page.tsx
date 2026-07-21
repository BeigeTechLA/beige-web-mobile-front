"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Topbar from "@/components/production-manager/Topbar";
import ShootHeader from "@/components/production-manager/shoot-details/ShootHeader";
import ProjectTeam from "@/components/production-manager/shoot-details/ProjectTeam";
import AssignedCP from "@/components/production-manager/shoot-details/AssignedCP";
import MeetingSchedule from "@/components/production-manager/shoot-details/MeetingSchedule";
import ProjectTimeline from "@/components/production-manager/shoot-details/ProjectTimeline";
import ShootTabs from "@/components/production-manager/shoot-details/ShootTabs";
import PreProductionTab from "@/components/production-manager/shoot-details/PreProductionTab";
import PostProductionTab from "@/components/production-manager/shoot-details/PostProductionTab";
import MeetingOverviewChart from "@/components/production-manager/shoot-details/MeetingOverviewChart";
import MessagesTab from "@/components/production-manager/shoot-details/MessagesTab";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { CircleX, Loader2, X, SlidersHorizontal, Eye } from "lucide-react"; // Added X icon for closing
import { Button } from "@/src/components/landing/ui/button";
import { useTheme } from "next-themes";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";

type SkillOption = {
  id?: string | number;
  name?: string;
  skill_name?: string;
  title?: string;
};

type ProjectDetails = {
  project_name?: string;
  skills_needed?: string | Array<string | number> | null;
  payment_status?: string | null;
  payment_id?: string | number | null;
  [key: string]: unknown;
};

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canEdit, canDelete } = usePermissions("shoots");
  const activeTab = searchParams.get("tab") || "Overview";
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";
  const shootBasePath = "/production-manager/shoots";
  const handleTabChange = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fetchProjectAndSkills = async () => {
      try {
        const [projectResponse, skillsResponse] = await Promise.all([
          adminApi.getProjectDetails(id),
          adminApi.getSkills()
        ]);

        // 1. Create Skills Map
        const skillsMap: Record<number, string> = {};
        if (skillsResponse && skillsResponse.data) {
          const skillsList = Array.isArray(skillsResponse.data) ? skillsResponse.data : (skillsResponse.data?.data || []);
          skillsList.forEach((s: SkillOption) => {
            const name = s.name || s.skill_name || s.title;
            if (s.id && name) skillsMap[s.id] = name;
          });
        }

        const responseData = projectResponse?.data || null;
        const projectData: ProjectDetails = responseData?.project || responseData || projectResponse;

        if (projectData) {
          // 3. Map Skills Needed to Names
          let skillsText = "";
          if (projectData.skills_needed) {
            try {
              let parsedIds = projectData.skills_needed;

              // Only attempt to parse if it's a string that looks like JSON (starts with [ or {)
              if (typeof projectData.skills_needed === 'string' &&
                (projectData.skills_needed.trim().startsWith('[') || projectData.skills_needed.trim().startsWith('{'))) {
                try {
                  parsedIds = JSON.parse(projectData.skills_needed);
                } catch {
                  // If parsing fails, keep it as a string
                  parsedIds = projectData.skills_needed;
                }
              }

              if (Array.isArray(parsedIds)) {
                skillsText = parsedIds
                  .map(id => skillsMap[Number(id)])
                  .filter(Boolean)
                  .join(", ");
              } else if (typeof parsedIds === 'string') {
                // If it's a plain string, use it directly
                skillsText = parsedIds;
              }
            } catch (e) {
              console.error("Unexpected error processing skills_needed:", e);
              skillsText = projectData.skills_needed;
            }
          }

          setProject({
            ...projectData,
            payment_status: responseData?.payment_status ?? projectData?.payment_status ?? null,
            payment_id: responseData?.payment_id ?? projectData?.payment_id ?? null,
            skills_needed: skillsText || projectData.skills_needed || "N/A"
          });
        }
      } catch (error) {
        console.error("Failed to fetch shoot details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProjectAndSkills();
  }, [id]);

  if (!mounted) return null;

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm("Are you sure you want to delete this shoot? This action cannot be undone.")) {
      try {
        const response = await adminApi.deleteProject(id);
        if (response?.success || response?.message === "Project deleted successfully") { // Adjust based on actual API response
          toast.success("Shoot deleted successfully");
          router.push('/admin/shoots');
        } else {
          toast.error(response?.error || "Failed to delete shoot");
        }
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("An error occurred while deleting");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/30"}`} size={40} />
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <Button
              className="text-sm font-semibold text-[#BD1010] h-12 px-4 lg:px-7 rounded-lg bg-[#FFC3C3] border border-white/20 hover:bg-[#FFC3C3]/80 transition-colors "
              onClick={handleDelete}
              disabled={!canEdit}
              title={canEdit ? "Cancel Shoot" : "Edit permission not allowed"}
            >
              <CircleX /> Cancel Shoot
            </Button>
            <Button
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-white border-[#E5E5E5] text-[#666] hover:bg-zinc-50"
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
            <Button
              // onClick={() => router.push("/book-a-shoot")}
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7"
              disabled={!canEdit}
              title={canEdit ? "Edit Shoot" : "Edit permission not allowed"}
            >
              Edit Shoot
            </Button>
          </>
        }
      />

      <div className="overflow-hidden pb-20 lg:pb-0 flex h-full lg:m-0 relative">
        {/* Main Content (Left) */}
        <div className="flex-1 p-6 pb-30 lg:p-10 lg:pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ">
          <ShootHeader activeTab={activeTab} project={project} projectId={id} />
          <Button
            className={`lg:hidden w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border mb-3 transition-all ${isDark
              ? "bg-[#202020] text-white border-white/20 hover:bg-[#202020]/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              : "bg-white text-black border-[#E5E5E5] hover:bg-zinc-50"
              }`}
            onClick={() => setIsTimelineOpen(true)}
          >
            View Project Timeline
          </Button>

          <div className={`rounded-lg lg:rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"} `}>
            <ShootTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <div className="px-5 py-6 lg:py-9">
              {activeTab === "Overview" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[500px]">
                    <ProjectTeam projectId={id} />
                    <AssignedCP projectId={id} />
                  </div>
                  <MeetingSchedule role="pm" orderId={id} />
                </>
              )}

              {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
                <PreProductionTab isDark={isDark} />
              )}

              {(activeTab === "Post_Production" || activeTab === "Post Production") && (
                <PostProductionTab isDark={isDark} />
              )}

                {activeTab === "Meetings" && (
                    <>
                        <MeetingSchedule role="pm" orderId={id} />
                        <MeetingOverviewChart />
                    </>
                )}

                {activeTab === "Messages" && (
                    <MessagesTab bookingId={id} />
                )}
                </div>
                </div>
            </div>

        {/* Right Sidebar (Timeline) */}
        < div className="hidden lg:block" >
          <ProjectTimeline status={resolveTimelineStage(project)} />
        </div>

        {/* Mobile Timeline Overlay (Conditional) */}
        {isTimelineOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 flex justify-end">
            {/* Close Backdrop Click */}
            <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

            <div className={`relative max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 ${isDark ? "bg-[#111111]" : "bg-white"}`}>
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-white font-semibold">Project Timeline</h2>
                <button onClick={() => setIsTimelineOpen(false)} className={`absolute top-3 right-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="h-full overflow-y-auto">
                <ProjectTimeline status={resolveTimelineStage(project)} />
              </div>
            </div>
          </div>
        )}

        {/* --- FLOATING MOBILE BUTTONS --- */}
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f]' : 'bg-white border-t border-[#E3E3E3] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              disabled={!canEdit}
              title={canEdit ? "Cancel Shoot" : "Edit permission not allowed"}
              className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#FFF0F0] text-[#D32F2F] hover:bg-[#FFE5E5] border border-[#FFC3C3]'}`}
            >
              Cancel Shoot
            </Button>
            <Button
              onClick={() => router.push(`${shootBasePath}/${id}/edit-booking`)}
              disabled={!canEdit}
              title={canEdit ? "Edit Shoot" : "Edit permission not allowed"}
              className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] border border-[#d4c3a3]'}`}
            >
              Edit Shoot
            </Button>
          </div>
          <Button
            onClick={() => router.push(`${shootBasePath}/${id}/form-details`)}
            className={`w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#111] text-[#E5D5B8] hover:bg-[#151515] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#F3F3F3] text-zinc-600 hover:bg-[#EAEAEA] border border-[#E3E3E3]'}`}
          >
            <Eye size={18} /> View Form Details
          </Button>
        </div>
      </div>
    </>
  );
}
