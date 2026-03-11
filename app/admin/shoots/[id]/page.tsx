"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from 'next/navigation';
import Topbar from "@/components/admin/Topbar";
import ShootHeader from "@/components/admin/shoot-details/ShootHeader";
import ProjectTeam from "@/components/admin/shoot-details/ProjectTeam";
import AssignedCP from "@/components/admin/shoot-details/AssignedCP";
import MeetingSchedule from "@/components/admin/shoot-details/MeetingSchedule";
import ProjectTimeline from "@/components/admin/shoot-details/ProjectTimeline";
import ShootTabs from "@/components/admin/shoot-details/ShootTabs";
import PreProductionTab from "@/components/admin/shoot-details/PreProductionTab";
import PostProductionTab from "@/components/admin/shoot-details/PostProductionTab";
import MeetingOverviewChart from "@/components/admin/shoot-details/MeetingOverviewChart";
import MessagesTab from "@/components/admin/shoot-details/MessagesTab";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { CircleX, Loader2, X, SlidersHorizontal, Eye } from "lucide-react"; // Added X icon for closing
import { Button } from "@/src/components/landing/ui/button";
import { useTheme } from "next-themes";

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname();
  const { id } = use(params);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

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
          skillsList.forEach((s: any) => {
            const name = s.name || s.skill_name || s.title;
            if (s.id && name) skillsMap[s.id] = name;
          });
        }

        let projectData = projectResponse?.data?.project || projectResponse?.data || projectResponse;

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
                } catch (e) {
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
            skills_needed: skillsText || projectData.skills_needed
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

  const getInitials = (name: string) => {
    if (!name) return "??";

    // Split the name into words
    const words = name.trim().split(/\s+/);

    // Take the first letter of the first word
    const first = words[0]?.charAt(0) || "";

    // Take the first letter of the second word (if it exists)
    const second = words[1]?.charAt(0) || "";

    return (first + second).toUpperCase();
  };

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
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
              Edit Shoot
            </Button>
          </>
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 flex h-full -m-6 lg:-m-10 relative">
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
            <ShootTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="px-5 py-6 lg:py-9">
              {activeTab === "Overview" && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[572px]">
                    <ProjectTeam projectId={id} assignedMembers={project?.assigned_post_production_members} />
                    <AssignedCP projectId={id} leadId={project?.lead_id} assignedCrew={project?.assignedCrew || project?.assigned_crews || []} />
                  </div>
                  <MeetingSchedule />
                </>
              )}

              {
                (activeTab === "Pre_Production" || activeTab === "Pre Production") && (
                  <PreProductionTab />
                )
              }


              {
                (activeTab === "Post_Production" || activeTab === "Post Production") && (
                  <PostProductionTab />
                )
              }

              {
                activeTab === "Meetings" && (
                  <>
                    <MeetingSchedule />
                    <MeetingOverviewChart />
                  </>
                )
              }

              {
                activeTab === "Messages" && (
                  <MessagesTab />
                )
              }
            </div >
          </div >
        </div >

        {/* Right Sidebar (Timeline) */}
        < div className="hidden lg:block" >
          <ProjectTimeline />
        </div >

        {/* Mobile Timeline Overlay (Conditional) */}
        {
          isTimelineOpen && (
            <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 flex justify-end">
              {/* Close Backdrop Click */}
              <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

              <div className={`relative max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 ${isDark ? "bg-[#111111]" : "bg-white"}`}>
                <button onClick={() => setIsTimelineOpen(false)} className={`absolute top-3 right-3 ${isDark ? "text-white/60" : "text-black/60"}`}>
                  <X size={20} />
                </button>

                <div className="h-full overflow-y-auto">
                  <ProjectTimeline status={project?.status} />
                </div>
              </div>
            </div>
          )
        }

        {/* --- FLOATING MOBILE BUTTONS --- */}
        <div className="lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
          <div className="flex gap-2">
            <Button className="w-full bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform">
              Cancel Shoot
            </Button>
            <Button
              onClick={() => router.push(`/admin/shoots/${id}/edit-booking`)}
              className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
            >
              Edit Shoot
            </Button>
          </div>
          <Button
            onClick={() => router.push(`/admin/shoots/${id}/form-details`)}
            className="w-full bg-[#111] text-[#E5D5B8] hover:bg-[#151515] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/10 active:scale-[0.98] transition-transform"
          >
            <Eye size={18} /> View Form Details
          </Button>
        </div>
      </div>
    </>
  );
}
