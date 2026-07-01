"use client";

import React, { useMemo, useState, useEffect } from "react";
// Added ChevronLeft to the imports
import { X, Maximize2, MoreVertical, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProjectTimeText, getShootFilesText } from "@/lib/utils/shootDetails";
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";
import { fileManagerApi } from "@/lib/fileManagerApi";

// Imports for Tab Components
import ShootOverviewTab from "./ShootOverviewTab";
import AffiliatePreProductionTab from "@/components/affiliate/shoot-details/AffiliatePreProductionTab";
import AffiliatePostProductionTab from "@/components/affiliate/shoot-details/AffiliatePostProductionTab";
import MeetingSchedule from "@/components/admin/shoot-details/MeetingSchedule";
import MessagesTab from "@/components/admin/shoot-details/MessagesTab";

export default function ProjectDetailsContainer({ apiResponse, onBack, currentCrewMemberId }: any) {
  const [activeTab, setActiveTab] = useState("shoot-details");
  const [phaseFileCount, setPhaseFileCount] = useState<number | null>(null);

  const project = apiResponse?.project;
  const clientName =
    apiResponse?.lead_details?.client_name ||
    project?.lead_details?.client_name ||
    project?.client?.name ||
    project?.client_name ||
    project?.guest_name ||
    "Client Not Specified";
  const projectId =
    project?.stream_project_booking_id || project?.project_id || project?.id;
  const projectTimeText = getProjectTimeText(project);
  const timelineLabel = useMemo(
    () => timelineStageToHeaderLabel(resolveTimelineStage(project)),
    [project]
  );
  const projectNameInitials = useMemo(() => {
    const name = project?.project_name || "";
    return name ? name.trim().slice(0, 2).toUpperCase() : "NA";
  }, [project]);
  const locationText =
    project?.event_location ||
    [project?.location, project?.city, project?.state, project?.country]
      .filter(Boolean)
      .join(", ") ||
    "No location specified";
  const descriptionText = project?.description
    ? project.description.replace(/Matching Method:.*$/gm, "").trim()
    : "No description available.";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    const dateOnlyMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).replace(/ /g, ' ').replace(/(\w{3}) (\d{4})/, '$1, $2');
  };

  useEffect(() => {
    let isMounted = true;

    const loadPhaseFilesCount = async () => {
      if (!projectId) {
        if (isMounted) setPhaseFileCount(null);
        return;
      }

      try {
        const [preRes, postRes] = await Promise.all([
          fileManagerApi.getExternalWorkspaceFiles(projectId, "pre"),
          fileManagerApi.getExternalWorkspaceFiles(projectId, "post"),
        ]);

        const getCount = (response: any) => {
          const folders = response?.folders || [];
          const files = response?.files || [];
          const folderCount = folders.reduce(
            (sum: number, folder: any) => sum + (Number(folder.fileCount) || 0),
            0
          );
          return files.length + folderCount;
        };

        const totalCount = getCount(preRes) + getCount(postRes);
        if (isMounted) {
          setPhaseFileCount(totalCount);
        }
      } catch {
        if (isMounted) setPhaseFileCount(null);
      }
    };

    loadPhaseFilesCount();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (!apiResponse) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      
      {/* 1. TOP ID BAR - Updated with Back Button */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Back Button */}
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Vertical Divider between Back and ID */}
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* ID Display */}
          <div className="flex items-center gap-3 text-white/40 text-[11px] font-medium uppercase tracking-wider">
            <Maximize2 size={14} />
            <span>ID / {projectId || "N/A"}</span>
          </div>
        </div>

        {/* Close Icon (Right side) */}
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full lg:max-w-7xl mx-auto p-5 lg:p-8 space-y-4 lg:space-y-6">
          
          {/* 2. PROFILE HEADER */}
          <div className="flex flex-col lg:flex-row gap-2 lg:items-start justify-between">
            <div className="flex items-start gap-3 lg:gap-5">
              <div className="w-10 h-10 lg:h-20 lg:w-20 rounded-lg lg:rounded-2xl bg-blue-400/20 border border-blue-400/20 flex items-center justify-center text-blue-400 text-sm lg:text-3xl font-bold shadow-lg shrink-0">
                {projectNameInitials}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="lg:text-2xl font-bold text-white/90">
                    {clientName}
                  </h2>
                  <span className="bg-[#E8D1AB]/10 text-[#E8D1AB] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-[#E8D1AB]/10">
                    {timelineLabel}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed max-w-3xl">
                  <span className="font-bold text-white/70">Description :</span> {descriptionText}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button className="border border-red-500 text-red-500 hover:bg-red-500/10 px-6 py-2 rounded-lg text-sm font-bold transition-all">
                Cancel Shoot
              </button>
              <button className="p-2 text-white/40 border border-white/10 rounded-lg hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* 3. HORIZONTAL INFO STRIP */}
          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-y-3 lg:gap-y-4 lg:gap-x-8 p-5 rounded-xl bg-[#E8D1AB]/[0.03] border border-[#E8D1AB]/10 text-[12px]">
            <StripItem label="Shoot Date" value={formatDate(project?.event_date)} />
            <Divider />
            <StripItem label="Time" value={projectTimeText} />
            
            <div className="w-full flex flex-col lg:flex-row gap-3 lg:gap-8 pt-2 mt-2 border-t border-white/5">
                <StripItem
                  label="Shoot Files"
                  value={
                    phaseFileCount != null
                      ? `${phaseFileCount} File${phaseFileCount === 1 ? "" : "s"}`
                      : getShootFilesText(project)
                  }
                />
                <Divider />
                <StripItem label="Location" value={locationText} />
            </div>
          </div>

          {/* 4. TABS NAVIGATION */}
          <div className="flex items-center w-full overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between border-b border-[#222222]">
            <TabBtn label="Shoot Details" active={activeTab === "shoot-details"} onClick={() => setActiveTab("shoot-details")} />
            <TabBtn label="Pre Production Files" active={activeTab === "pre-prod"} onClick={() => setActiveTab("pre-prod")} />
            <TabBtn label="Post Production Files" active={activeTab === "post-prod"} onClick={() => setActiveTab("post-prod")} />
            <TabBtn label="Meetings" active={activeTab === "meetings"} onClick={() => setActiveTab("meetings")} />
            <TabBtn label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} />
          </div>

          {/* 5. TAB CONTENT */}
          <div className="pt-4 pb-20">
            {activeTab === "shoot-details" && (
                <ShootOverviewTab
                  project={project}
                  apiResponse={apiResponse}
                  currentCrewMemberId={currentCrewMemberId}
                />
            )}
            
            {activeTab === "pre-prod" && (
                <AffiliatePreProductionTab projectId={projectId} canUpload={false} />
            )}
            
            {activeTab === "post-prod" && (
                <AffiliatePostProductionTab projectId={projectId} />
            )}
            
            {activeTab === "meetings" && (
                <MeetingSchedule orderId={projectId} role="cp" />
            )}
            
            {activeTab === "messages" && (
                <MessagesTab
                  bookingId={project?.stream_project_booking_id || project?.project_id || project?.id}
                  role="cp"
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
const Divider = () => <div className="hidden lg:block h-4 w-[1px] bg-white/10" />;

function StripItem({ label, value, isLink, valueClassName }: any) {
  return (
    <div className="flex gap-2">
      <span className="text-white/40">{label} :</span>
      <span
        className={cn(
          "font-semibold",
          isLink ? "text-blue-400 underline" : "text-white/80",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TabBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-4 text-sm font-semibold transition-all relative whitespace-nowrap ${active ? "text-[#E8D1AB]" : "text-white/40 hover:text-white"}`}
    >
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E8D1AB]" />}
    </button>
  );
}
