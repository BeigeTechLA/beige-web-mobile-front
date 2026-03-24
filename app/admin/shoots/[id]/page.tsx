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

import { adminApi } from "@/lib/api";
import { CircleX, Loader2, X, Eye } from "lucide-react"; // Added X icon for closing
import { Button } from "@/src/components/landing/ui/button";

export default function ShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const pathname = usePathname();
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("Overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-white/50" size={40} />
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            {/* Need to add filters  */}
            <Button className="text-sm font-semibold text-[#BD1010] h-12 px-4 lg:px-7 rounded-lg bg-[#FFC3C3] border border-white/20 hover:bg-[#FFC3C3]/80 transition-colors ">
              <CircleX /> Cancel Shoot
            </Button>
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
              Book a Shoot
            </Button>
          </>
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 flex h-full -m-6 lg:-m-10 relative">
        {/* Main Content (Left) */}
        <div className="flex-1 p-6 pb-15 lg:p-10 lg:pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <ShootHeader activeTab={activeTab} project={project} projectId={id} />
          <Button
            className="lg:hidden w-full bg-[#202020] text-white hover:bg-[#202020]/50 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 mb-3"
            onClick={() => setIsTimelineOpen(true)}
          >
            View Project Timeline
          </Button>

          <ShootTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === "Overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[572px]">
                <ProjectTeam projectId={id} assignedMembers={project?.assigned_post_production_members} />
                <AssignedCP projectId={id} leadId={project?.lead_id} assignedCrew={project?.assignedCrew || project?.assigned_crews || []} />
              </div>
              <MeetingSchedule />
            </>
          )}

          {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
            <PreProductionTab />
          )}

          {(activeTab === "Post_Production" || activeTab === "Post Production") && (
            <PostProductionTab />
          )}

          {activeTab === "Meetings" && (
            <>
              <MeetingSchedule />
              <MeetingOverviewChart />
            </>
          )}

          {activeTab === "Messages" && (
            <MessagesTab />
          )}
        </div>

        {/* Right Sidebar (Timeline) */}
        <div className="hidden lg:block h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <ProjectTimeline status={project?.status} />
        </div>

        {/* Mobile Timeline Overlay (Conditional) */}
        {isTimelineOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 flex justify-end">
            {/* Close Backdrop Click */}
            <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

            <div className="relative w-[85%] max-w-sm bg-[#111111] h-full shadow-2xl animate-in slide-in-from-right duration-300">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-white font-semibold">Project Timeline</h2>
                <button onClick={() => setIsTimelineOpen(false)} className="text-white/60">
                  <X size={24} />
                </button>
              </div>

              <div className="h-full overflow-y-auto">
                <ProjectTimeline status={project?.status} />
              </div>
            </div>
          </div>
        )}

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
