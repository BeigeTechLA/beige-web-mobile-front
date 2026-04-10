"use client";

import React, { useState } from "react";
import { X, Maximize2, MoreVertical } from "lucide-react";

// Imports for Tab Components
import ShootOverviewTab from "./ShootOverviewTab";
import PreProductionTab from "@/components/admin/shoot-details/PreProductionTab";
import PostProductionTab from "@/components/admin/shoot-details/PostProductionTab";
import MeetingSchedule from "@/components/admin/shoot-details/MeetingSchedule";
import MessagesTab from "@/components/admin/shoot-details/MessagesTab";

export default function ProjectDetailsContainer({ apiResponse, onBack }: any) {
  const [activeTab, setActiveTab] = useState("shoot-details");

  if (!apiResponse) return null;

  const project = apiResponse.project;
  const crew = apiResponse.assignedCrew?.[0]?.crew_member;
  const projectId =
    project?.stream_project_booking_id || project?.project_id || project?.id;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      
      {/* 1. TOP ID BAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-3 text-white/40 text-[11px] font-medium uppercase tracking-wider">
          <Maximize2 size={14} />
          <span>ID / {project?.stream_project_booking_id}</span>
        </div>
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
                {project?.project_name?.slice(0, 2).toUpperCase()}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="lg:text-2xl font-bold text-white/90">
                    {crew ? `${crew.first_name} ${crew.last_name}` : "Unassigned"} ({project?.skills_needed || "Videography"})
                  </h2>
                  <span className="bg-[#E8D1AB]/10 text-[#E8D1AB] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-[#E8D1AB]/10">
                    {project?.is_active ? "Pending" : "Completed"}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed max-w-3xl">
                  <span className="font-bold text-white/70">Description :</span> {project?.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
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
            <StripItem label="Shoot Date" value={project?.event_date} />
            <Divider />
            <StripItem label="Time" value={`${project?.start_time?.slice(0,5)} - ${project?.duration_hours} Hours (${project?.duration_hours} Hours Duration)`} />
            <Divider />
            <StripItem label="Total Value" value={`$${project?.budget}`} />
            <Divider />
            <StripItem label="Payment Status" value={project?.payment_id ? "Paid" : "Pending"} />
            
            <div className="w-full flex flex-col lg:flex-row gap-3 lg:gap-8 pt-2 mt-2 border-t border-white/5">
                <StripItem label="Folder Link" value="http://drive.link/folder" isLink />
                <Divider />
                <StripItem label="Shoot Files" value="200 Image & 50 Videos" />
                <Divider />
                <StripItem label="Location" value={project?.event_location?.split(',')[0]} />
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

          {/* 5. TAB CONTENT - Condition Rendering for each Tab */}
          <div className="pt-4 pb-20">
            {activeTab === "shoot-details" && (
                <ShootOverviewTab project={project} />
            )}
            
            {activeTab === "pre-prod" && (
                <PreProductionTab projectId={projectId} />
            )}
            
            {activeTab === "post-prod" && (
                <PostProductionTab projectId={projectId} />
            )}
            
            {activeTab === "meetings" && (
                <MeetingSchedule project={project} />
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

function StripItem({ label, value, isLink }: any) {
  return (
    <div className="flex gap-2">
      <span className="text-white/40">{label} :</span>
      <span className={`font-semibold ${isLink ? "text-blue-400 underline" : "text-white/80"}`}>{value}</span>
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
