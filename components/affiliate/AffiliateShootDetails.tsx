"use client";

import React, { useState, useEffect } from "react";
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
import { Button } from "@/src/components/landing/ui/button";
import { Loader2, X } from "lucide-react"; // Added X icon for closing
import Cookies from "js-cookie";

interface AffiliateShootDetailsProps {
  shootId: string;
  onBack: () => void;
}

export default function AffiliateShootDetails({ shootId, onBack }: AffiliateShootDetailsProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State to handle mobile timeline visibility
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  useEffect(() => {
    const fetchProjectAndSkills = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        const [projectResponse, skillsResponse] = await Promise.all([
          affiliateApi.getProjectDetails(token, shootId),
          adminApi.getSkills()
        ]);

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
          let skillsText = "";
          if (projectData.skills_needed) {
            try {
              let parsedIds = projectData.skills_needed;
              if (typeof projectData.skills_needed === 'string' &&
                (projectData.skills_needed.trim().startsWith('[') || projectData.skills_needed.trim().startsWith('{'))) {
                try {
                  parsedIds = JSON.parse(projectData.skills_needed);
                } catch (e) {
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
            ...projectData,
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
        <Loader2 className="animate-spin text-white/50" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-full -m-6 lg:-m-10 relative">

      {/* Main Content (Left) */}
      <div className="flex-1 p-6 pb-15 lg:p-10 lg:pb-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <AffiliateShootHeader activeTab={activeTab} project={project} onBack={onBack} />
        <Button
          className="w-full bg-[#202020] text-white hover:bg-[#202020]/50 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 mb-3"
          onClick={() => setIsTimelineOpen(true)}
        >
          View Project Timeline
        </Button>


        <AffiliateShootTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "Overview" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[500px]">
              <AffiliateProjectTeam projectId={shootId} />
              <AffiliateAssignedCP projectId={shootId} />
            </div>
            <AffiliateMeetingSchedule />
          </>
        )}

        {(activeTab === "Pre_Production" || activeTab === "Pre Production") && (
          <AffiliatePreProductionTab />
        )}

        {(activeTab === "Post_Production" || activeTab === "Post Production") && (
          <AffiliatePostProductionTab />
        )}

        {activeTab === "Meetings" && (
          <>
            <AffiliateMeetingSchedule />
            <AffiliateMeetingOverviewChart />
          </>
        )}

        {activeTab === "Messages" && (
          <AffiliateMessagesTab />
        )}
      </div>

      {/* Right Sidebar (Timeline) */}
      <div className="hidden lg:block">
        <AffiliateProjectTimeline />
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
              <AffiliateProjectTimeline />
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING MOBILE BUTTONS --- */}
      <div className="lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
        <Button className="w-full bg-[#FFC3C3] text-[#BD1010] hover:bg-[#FFC3C3]/80 h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform">
          Cancel Shoot
        </Button>
        <Button className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform">
          Edit Shoot
        </Button>
      </div>
    </div>
  );
}
