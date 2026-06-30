"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import ShootHeader from "@/components/admin/shoot-details/ShootHeader";
import ProjectTeam from "@/components/admin/shoot-details/ProjectTeam";
import AssignedCP from "@/components/admin/shoot-details/AssignedCP";
import MeetingSchedule from "@/components/admin/shoot-details/MeetingSchedule";
import ProjectTimeline from "@/components/admin/shoot-details/ProjectTimeline";
import ShootTabs from "@/components/admin/shoot-details/ShootTabs";
import SalesPreProductionTab from "@/components/sales/shoot-details/PreProductionTab";
import SalesPostProductionTab from "@/components/sales/shoot-details/PostProductionTab";
import MeetingOverviewChart from "@/components/admin/shoot-details/MeetingOverviewChart";
import MessagesTab from "@/components/admin/shoot-details/MessagesTab";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2, X } from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import {
  getProjectTimelineDetails,
  getTimelineDetailsFromPostProductionFiles,
  mergeProjectTimelineDetails,
} from "@/lib/utils/projectTimelineDetails";

type SkillOption = {
  id?: string | number;
  name?: string;
  skill_name?: string;
  title?: string;
};

type ProjectDetails = {
  project_name?: string;
  skills_needed?: string | Array<string | number> | null;
  postProduction?: {
    rawFilesUploaded?: boolean;
    rawFilesUploadedAt?: string | null;
    editingStatus?: "not_started" | "in_progress" | "completed" | null;
  } | null;
  revisionVersions?: Array<{
    versionNumber?: number | string;
    uploadedAt?: string | null;
  }>;
  payment_status?: string | null;
  payment_id?: string | number | null;
  lead_details?: unknown;
  assignedCrew?: unknown[];
  assigned_crews?: unknown[];
  assignedPostProductionMembers?: unknown[];
  assigned_post_production_members?: unknown[];
  [key: string]: unknown;
};

export default function SalesShootDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const activeTab = searchParams.get("tab") || "Overview";
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
const userRole = String((user as { role?: string; userRole?: string } | null)?.role || (user as { role?: string; userRole?: string } | null)?.userRole || "").trim().toLowerCase();
  const effectiveRole = userRole === "sales_admin" ? "admin" : "sales";


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
          adminApi.getSkills(),
        ]);

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
        const bookingIdForFiles =
          projectData?.booking_id || projectData?.stream_project_booking_id || id;
        let fileTimelineDetails = getTimelineDetailsFromPostProductionFiles(null);
        try {
          const postFilesResponse = await fileManagerApi.getExternalWorkspaceFiles(String(bookingIdForFiles), "post");
          fileTimelineDetails = getTimelineDetailsFromPostProductionFiles(postFilesResponse);
        } catch (error) {
          console.warn("Failed to derive timeline details from post-production files:", error);
        }
        const timelineDetails = mergeProjectTimelineDetails(
          getProjectTimelineDetails(responseData, projectData, projectResponse),
          fileTimelineDetails
        );

        if (projectData) {
          let skillsText = "";
          if (projectData.skills_needed) {
            try {
              let parsedIds = projectData.skills_needed;
              if (
                typeof projectData.skills_needed === "string" &&
                (projectData.skills_needed.trim().startsWith("[") || projectData.skills_needed.trim().startsWith("{"))
              ) {
                try {
                  parsedIds = JSON.parse(projectData.skills_needed);
                } catch {
                  parsedIds = projectData.skills_needed;
                }
              }

              if (Array.isArray(parsedIds)) {
                skillsText = parsedIds
                  .map((skillId: string | number) => skillsMap[Number(skillId)])
                  .filter(Boolean)
                  .join(", ");
              } else if (typeof parsedIds === "string") {
                skillsText = parsedIds;
              }
            } catch (e) {
              console.error("Unexpected error processing skills_needed:", e);
              skillsText = projectData.skills_needed;
            }
          }

          setProject({
            ...projectData,
            postProduction: timelineDetails.postProduction,
            revisionVersions: timelineDetails.revisionVersions,
            payment_status: responseData?.payment_status ?? projectData?.payment_status ?? null,
            payment_id: responseData?.payment_id ?? projectData?.payment_id ?? null,
            lead_details: responseData?.lead_details || projectData?.lead_details || null,
            assignedCrew: responseData?.assignedCrew || projectData?.assignedCrew || projectData?.assigned_crews || [],
            assignedPostProductionMembers:
              responseData?.assignedPostProductionMembers ||
              projectData?.assignedPostProductionMembers ||
              projectData?.assigned_post_production_members ||
              [],
            skills_needed: skillsText || projectData.skills_needed,
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-white/50" size={40} />
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 flex h-full -m-6 lg:-m-10 relative">
        <div className="flex-1 p-6 pb-15 lg:p-10 lg:pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <ShootHeader activeTab={activeTab} project={project} projectId={id} />
          <Button
            className="lg:hidden w-full bg-[#202020] text-white hover:bg-[#202020]/50 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 mb-3"
            onClick={() => setIsTimelineOpen(true)}
          >
            View Project Timeline
          </Button>

          <ShootTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {activeTab === "Overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[572px]">
                <ProjectTeam projectId={id} assignedMembers={project?.assigned_post_production_members} />
                <AssignedCP projectId={id} leadId={project?.lead_id} assignedCrew={project?.assignedCrew || project?.assigned_crews || []} />
              </div>
              <MeetingSchedule role={effectiveRole} orderId={id} />
            </>
          )}

          {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
            <SalesPreProductionTab projectId={id} />
          )}

          {(activeTab === "Post_Production" || activeTab === "Post Production") && (
            <SalesPostProductionTab projectId={id} />
          )}

          {activeTab === "Meetings" && (
            <>
              <MeetingSchedule role={effectiveRole} orderId={id} />
              <MeetingOverviewChart />
            </>
          )}

          {activeTab === "Messages" && (
            <MessagesTab
              role={effectiveRole}
              bookingId={project?.booking_id || project?.stream_project_booking_id || id}
              projectName={project?.project_name}
            />
          )}
        </div>

        <div className="hidden lg:block">
          <ProjectTimeline
            status={resolveTimelineStage(project)}
            postProduction={project?.postProduction}
            revisionVersions={project?.revisionVersions}
          />
        </div>

        {isTimelineOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 flex justify-end">
            <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

            <div className="relative w-[85%] max-w-sm bg-[#111111] h-full shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-white font-semibold">Project Timeline</h2>
                <button onClick={() => setIsTimelineOpen(false)} className="text-white/60">
                  <X size={24} />
                </button>
              </div>

              <div className="h-full overflow-y-auto">
                <ProjectTimeline
                  status={resolveTimelineStage(project)}
                  postProduction={project?.postProduction}
                  revisionVersions={project?.revisionVersions}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
