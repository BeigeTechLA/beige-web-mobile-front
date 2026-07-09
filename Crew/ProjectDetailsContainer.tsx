"use client";

import React, { useMemo, useState, useEffect } from "react";
// Added ChevronLeft to the imports
import { X, Maximize2, MoreVertical, ChevronLeft, ArrowLeft } from "lucide-react";
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
import Topbar from "@/components/sales/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import ProjectDetailsTabs from "./ProjectDetailsTabs";

export default function ProjectDetailsContainer({ apiResponse, onBack, currentCrewMemberId, pathname }: any) {
  const [activeTab, setActiveTab] = useState("shoot-details");
  const [phaseFileCount, setPhaseFileCount] = useState<number | null>(null);
  const { isDark } = useResolvedTheme();

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

  const pathnameUpdated = `${pathname}/${projectId}`

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
    <>
      <Topbar pathname={pathnameUpdated} />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8">

        {/* 1. TOP ID BAR - Updated with Back Button */}
        {/* <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/5 bg-[#111]">
          <div className="flex items-center gap-4 lg:gap-6">
            Back Button
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
            >
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>

            Vertical Divider between Back and ID
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

            ID Display
            <div className="flex items-center gap-3 text-white/40 text-[11px] font-medium uppercase tracking-wider">
              <Maximize2 size={14} />
              <span>ID / {projectId || "N/A"}</span>
            </div>
          </div>

          Close Icon (Right side)
          <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div> */}

        <button
          onClick={onBack}
          className={`transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"
            }`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full space-y-4 lg:space-y-6">

            {/* PROFILE HEADER BLOCK */}
            <div className="flex flex-col lg:flex-row gap-2 lg:items-start justify-between">
              <div className="flex items-start gap-3 lg:gap-5">
                {/* Initials Placeholder Emblem */}
                <div className={`w-10 h-10 lg:h-20 lg:w-20 rounded-lg lg:rounded-2xl flex items-center justify-center text-sm lg:text-3xl font-bold shadow-sm shrink-0 border ${isDark
                  ? "bg-blue-400/20 border-blue-400/20 text-blue-400"
                  : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}>
                  {projectNameInitials}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className={`lg:text-2xl font-bold ${isDark ? "text-white/90" : "text-black/90"}`}>
                      {clientName}
                    </h2>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${isDark
                      ? "bg-[#E8D1AB]/10 text-[#E8D1AB] border-[#E8D1AB]/10"
                      : "bg-[#E8D1AB]/20 text-[#735A2B] border-[#E8D1AB]/40"
                      }`}>
                      {timelineLabel}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed max-w-3xl ${isDark ? "text-white/50" : "text-black/60"}`}>
                    <span className={`font-bold ${isDark ? "text-white/70" : "text-black/80"}`}>Description :</span> {descriptionText}
                  </p>
                </div>
              </div>

              {/* Header Auxiliary Action Buttons */}
              <div className="flex items-center justify-end gap-3 self-end lg:self-start">
                <button className={`border border-red-500 text-red-500 hover:bg-red-500/10 px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isDark && "hover:bg-red-50 bg-500/60"}`}>
                  Cancel Shoot
                </button>
                <button className={`p-2 border rounded-lg transition-colors ${isDark ? "text-white/40 border-white/10 hover:text-white" : "text-black/40 border-[#E5E5E5] hover:text-black hover:bg-black/5"
                  }`}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* HORIZONTAL INFO STRIP CARD */}
            <div className={`flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-y-3 lg:gap-y-4 lg:gap-x-8 p-5 rounded-xl border text-xs transition-all ${isDark
              ? "bg-[#E8D1AB]/[0.03] border-[#E8D1AB]/10"
              : "bg-[#FFFDF9] border-[#E8D1AB]/30 shadow-sm"
              }`}>
              <StripItem label="Shoot Date" value={formatDate(project?.event_date)} isDark={isDark} />
              <Divider isDark={isDark} />
              <StripItem label="Time" value={projectTimeText} isDark={isDark} />

              <div className={`w-full flex flex-col lg:flex-row gap-3 lg:gap-8 pt-2 mt-2 border-t ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
                <StripItem
                  label="Shoot Files"
                  value={
                    phaseFileCount != null
                      ? `${phaseFileCount} File${phaseFileCount === 1 ? "" : "s"}`
                      : getShootFilesText(project)
                  }
                  isDark={isDark}
                />
                <Divider isDark={isDark} />
                <StripItem label="Location" value={locationText} isDark={isDark} />
              </div>
            </div>

            <div className={`rounded-lg lg:rounded-2xl border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
              {/* TABS NAVIGATION TRACK */}
              {/* <div className={`flex items-center w-full overflow-x-auto no-scrollbar gap-6 lg:gap-0 lg:justify-between border-b transition-colors ${isDark ? "border-[#222222]" : "border-[#E5E5E5]"
                }`}>
                <TabBtn label="Shoot Details" active={activeTab === "shoot-details"} onClick={() => setActiveTab("shoot-details")} isDark={isDark} />
                <TabBtn label="Pre Production Files" active={activeTab === "pre-prod"} onClick={() => setActiveTab("pre-prod")} isDark={isDark} />
                <TabBtn label="Post Production Files" active={activeTab === "post-prod"} onClick={() => setActiveTab("post-prod")} isDark={isDark} />
                <TabBtn label="Meetings" active={activeTab === "meetings"} onClick={() => setActiveTab("meetings")} isDark={isDark} />
                <TabBtn label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} isDark={isDark} />
              </div> */}

              <ProjectDetailsTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* TAB PANELS AREA */}
              <div className="pt-5 pb-10">
                {activeTab === "shoot-details" && (
                  <div className="px-5">
                    <ShootOverviewTab
                      project={project}
                      apiResponse={apiResponse}
                      currentCrewMemberId={currentCrewMemberId}
                      isDark={isDark}
                    />
                  </div>
                )}

                {activeTab === "pre-prod" && (
                  <div className="px-5">
                    <AffiliatePreProductionTab projectId={projectId} canUpload={false} />
                  </div>
                )}

                {activeTab === "post-prod" && (
                  <div className="px-5">
                    <AffiliatePostProductionTab projectId={projectId} />
                  </div>
                )}

                {activeTab === "meetings" && (
                  <MeetingSchedule orderId={projectId} role="cp" />
                )}

                {activeTab === "messages" && (
                  <div className="px-5">
                    <MessagesTab
                      bookingId={project?.stream_project_booking_id || project?.project_id || project?.id}
                      role="cp"
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-component and Helper Blocks
const Divider = ({ isDark }: { isDark: boolean }) => (
  <div className={`hidden lg:block h-4 w-[1px] transition-colors ${isDark ? "bg-white/10" : "bg-black/15"}`} />
);

function StripItem({ label, value, isLink, valueClassName, isDark }: any) {
  return (
    <div className="flex gap-2">
      <span className={isDark ? "text-white/40" : "text-black/50"}>{label} :</span>
      <span
        className={cn(
          "font-semibold transition-colors",
          isLink
            ? (isDark ? "text-blue-400 underline" : "text-blue-600 underline")
            : (isDark ? "text-white/80" : "text-black/80"),
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TabBtn({ label, active, onClick, isDark }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-4 text-sm font-semibold transition-all relative whitespace-nowrap ${active
        ? (isDark ? "text-[#E8D1AB]" : "text-[#735A2B]")
        : (isDark ? "text-white/40 hover:text-white" : "text-black/50 hover:text-black")
        }`}
    >
      {label}
      {active && (
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isDark ? "bg-[#E8D1AB]" : "bg-[#735A2B]"
          }`} />
      )}
    </button>
  );
}