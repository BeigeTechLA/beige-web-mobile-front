"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AffiliateShootHeader from "./shoot-details/AffiliateShootHeader";
import AffiliateProjectTeam from "./shoot-details/AffiliateProjectTeam";
import AffiliateAssignedCP from "./shoot-details/AffiliateAssignedCP";
import AffiliateMeetingSchedule from "./shoot-details/AffiliateMeetingSchedule";
import AffiliateProjectTimeline from "./shoot-details/AffiliateProjectTimeline";
import AffiliateShootTabs from "./shoot-details/AffiliateShootTabs";
import AffiliatePreProductionTab from "./shoot-details/AffiliatePreProductionTab";
import AffiliatePostProductionTab from "./shoot-details/AffiliatePostProductionTab";
import AffiliateMeetingOverviewChart from "./shoot-details/AffiliateMeetingOverviewChart";
import AffiliateMessagesTab from "./shoot-details/AffiliateMessagesTab";

import { affiliateApi, adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import { Button } from "@/src/components/landing/ui/button";
import { Loader2, X, Eye } from "lucide-react";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import { resolveTimelineStage } from "@/lib/utils/projectTimeline";
import {
  getProjectTimelineDetails,
  getTimelineDetailsFromPostProductionFiles,
  mergeProjectTimelineDetails,
} from "@/lib/utils/projectTimelineDetails";
import type { PostProductionTimelineDetails, RevisionVersionTimelineDetails } from "@/lib/types";

interface AffiliateShootDetailsProps {
  shootId: string;
  onBack?: () => void; // Added from Dev 2
}

type AffiliateProjectDetails = {
  postProduction?: PostProductionTimelineDetails | null;
  revisionVersions?: RevisionVersionTimelineDetails[] | null;
  [key: string]: unknown;
};

type SkillOption = {
  id?: string | number;
  name?: string;
  skill_name?: string;
  title?: string;
};

export default function AffiliateShootDetails({ shootId, onBack }: AffiliateShootDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeTab = searchParams.get("tab") || "Overview";
  const [project, setProject] = useState<AffiliateProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const shootBasePath = "/affiliate/shoots";

  const handleTabChange = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fetchProjectAndSkills = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        const [projectResponse, skillsResponse] = await Promise.all([
          affiliateApi.getProjectDetails(token, shootId),
          adminApi.getSkills()
        ]);

        // Skills mapping logic
        const skillsMap: Record<number, string> = {};
        if (skillsResponse && skillsResponse.data) {
          const skillsList = Array.isArray(skillsResponse.data) ? skillsResponse.data : (skillsResponse.data?.data || []);
          skillsList.forEach((s: SkillOption) => {
            const name = s.name || s.skill_name || s.title;
            if (s.id && name) skillsMap[Number(s.id)] = name;
          });
        }

        // --- MERGED CONFLICT AREA: Data Extraction ---
        const responseData = projectResponse?.data || null;
        const projectData = responseData?.project || responseData || projectResponse;
        const bookingIdForFiles =
          projectData?.booking_id || projectData?.stream_project_booking_id || shootId;
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
              if (typeof projectData.skills_needed === 'string' &&
                (projectData.skills_needed.trim().startsWith('[') || projectData.skills_needed.trim().startsWith('{'))) {
                try {
                  parsedIds = JSON.parse(projectData.skills_needed);
                } catch {
                  parsedIds = projectData.skills_needed;
                }
              }

              if (Array.isArray(parsedIds)) {
                skillsText = parsedIds
                  .map(id => skillsMap[Number(id)])
                  .filter(Boolean)
                  .join(", ");
              } else if (typeof parsedIds === 'string') {
                skillsText = parsedIds;
              }
            } catch (e) {
              console.error("Unexpected error processing skills_needed:", e);
              skillsText = projectData.skills_needed;
            }
          }

          setProject({
            ...(responseData || {}),
            ...projectData,
            postProduction: timelineDetails.postProduction,
            revisionVersions: timelineDetails.revisionVersions,
            skills_needed: skillsText || projectData.skills_needed || "N/A"
          });
        }
      } catch (error) {
        console.error("Failed to fetch shoot details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (shootId) {
      fetchProjectAndSkills();
    }
  }, [shootId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <Loader2 className={`animate-spin ${isDark ? "text-white/50" : "text-black/30"}`} size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-64px)] overflow-hidden relative">
      {/* Main Content (Left Scroll Window) */}
      <div className="flex-1 min-h-0 w-full p-4 pb-[260px] lg:p-10 lg:pb-10 overflow-y-auto no-scrollbar">
        <AffiliateShootHeader
          activeTab={activeTab}
          project={project}
          projectId={shootId}
          onBack={onBack}
        />

        <Button
          className={`lg:hidden w-full h-14 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border mb-3 transition-all ${isDark
            ? "bg-[#202020] text-white border-white/20 hover:bg-[#202020]/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
            : "bg-white text-black border-[#E5E5E5] hover:bg-zinc-50"
            }`}
          onClick={() => setIsTimelineOpen(true)}
        >
          View Project Timeline
        </Button>

        <div className={`rounded-lg lg:rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
          <AffiliateShootTabs activeTab={activeTab} onTabChange={handleTabChange} />

          <div className={`${activeTab === "Meetings" ? "pb-6 lg:pb-9" : "py-6 lg:py-9"}`}>
            {activeTab === "Overview" && (
              <>
                <div className="px-5 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[572px]">
                  <AffiliateProjectTeam projectId={shootId} />
                  <AffiliateAssignedCP projectId={shootId} />
                </div>
                <AffiliateMeetingSchedule role="client" orderId={shootId} />
              </>
            )}

            {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
              <div className="px-5">
                <AffiliatePreProductionTab projectId={shootId} />
              </div>
            )}

            {(activeTab === "Post_Production" || activeTab === "Post Production") && (
              <div className="px-5">
                <AffiliatePostProductionTab projectId={shootId} />
              </div>
            )}

            {activeTab === "Meetings" && (
              <>
                <AffiliateMeetingSchedule role="client" orderId={shootId} />
                <AffiliateMeetingOverviewChart />
              </>
            )}

            {activeTab === "Messages" && (
              <div className="px-5">
                <AffiliateMessagesTab bookingId={shootId} />
              </div>
            )}
          </div>
        </div>
      </div >

      {/* Right Sidebar (Timeline) */}
      <div className="hidden lg:block">
        <AffiliateProjectTimeline
          status={resolveTimelineStage(project)}
          postProduction={project?.postProduction}
          revisionVersions={project?.revisionVersions}
        />
      </div>

      {/* Mobile Timeline Overlay */}
      {isTimelineOpen && (
        <div className={`lg:hidden fixed inset-0 z-[100] flex justify-end  ${isDark ? "bg-black/80" : "bg-white/80"}`}>
          <div className="absolute inset-0" onClick={() => setIsTimelineOpen(false)} />

          <div className={`relative w-[85%] max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 ${isDark ? "bg-[#111111]" : "bg-white"}`}>
            {/* Header with Title and Close Button (Merged Design) */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
              <h2 className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>Project Timeline</h2>
              <button onClick={() => setIsTimelineOpen(false)} className={`${isDark ? "text-white/60" : "text-black/60"}`}>
                <X size={24} />
              </button>
            </div>

            <div className="h-full overflow-y-auto">
              <AffiliateProjectTimeline
                status={resolveTimelineStage(project)}
                postProduction={project?.postProduction}
                revisionVersions={project?.revisionVersions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Mobile Action Buttons (Dev 1) */}
      <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-300 ${isDark ? 'bg-[#0f0f0f]' : 'bg-[#F4F5F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
        <div className="flex gap-2">
          <Button className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#FFF0F0] text-[#D32F2F] hover:bg-[#FFE5E5] border border-[#FFC3C3]'}`}>
            Cancel Shoot
          </Button>
          <Button
            onClick={() => router.push(`${shootBasePath}/${shootId}/edit-booking`)}
            className={`w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]' : 'bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] border border-[#d4c3a3]'}`}>
            Edit Shoot</Button>
        </div>
        <Button
          onClick={() => router.push(`${shootBasePath}/${shootId}/form-details`)}
          className={`w-full h-14 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${isDark ? 'bg-[#111] text-[#E5D5B8] hover:bg-[#151515] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-[#F3F3F3] text-zinc-600 hover:bg-[#EAEAEA] border border-[#E3E3E3]'}`}
        >
          <Eye size={18} /> View Form Details
        </Button>
      </div>
    </div>
  );
}
