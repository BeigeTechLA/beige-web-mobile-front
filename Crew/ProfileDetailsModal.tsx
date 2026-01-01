'use client';

import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose 
} from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, Video, Package, X } from "lucide-react";

const platformNames: Record<number, string> = {
  1: "Twitch", 2: "Youtube", 3: "Facebook", 4: "Twitter", 5: "LinkedIn", 6: "Custom RTMP",
};

const roleOptions = [
  { value: "1", label: "Director" }, { value: "2", label: "Camera Operator" },
  { value: "3", label: "Audio Engineer" }, { value: "4", label: "Lighting Technician" },
  { value: "5", label: "Video Editor" }, { value: "6", label: "Stream Engineer" },
  { value: "7", label: "Production Manager" }, { value: "8", label: "Graphics Designer" },
  { value: "9", label: "Videographer" }, { value: "10", label: "Photographer" },
];

const StatusBadge = ({ project }: { project: any }) => {
  const getStatus = () => {
    if (project?.is_completed) return { label: "Completed", class: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    if (project?.is_cancelled) return { label: "Cancelled", class: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (project?.is_draft) return { label: "Draft", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };
    return { label: "Active", class: "bg-green-500/10 text-green-400 border-green-500/20" };
  };
  const status = getStatus();
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status.class}`}>
      {status.label}
    </span>
  );
};

const ProjectDetailsModal = ({ open, onOpenChange, project }: any) => {
  if (!project) return null;

  const streamingPlatforms = project?.project?.streaming_platforms || [];
  const assignedCrew = project?.assignedCrew || [];
  const assignedEquipments = project?.assignedEquipment || [];
  
  const fetchRole = (roleId: any) => {
    const role = roleOptions.find((r) => r.value === String(roleId));
    return role?.label || "Crew";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed inset-y-0 right-0 left-auto translate-x-0 translate-y-0 h-full w-full sm:max-w-[500px] bg-[#0A0A0A] border-l border-white/10 p-0 shadow-2xl rounded-none flex flex-col focus-visible:outline-none"
      >
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 bg-[#0D0D0D]">
          <DialogClose className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </DialogClose>
          <DialogHeader className="text-left">
            <div className="mb-4"><StatusBadge project={project.project} /></div>
            <DialogTitle className="text-2xl font-bold text-white leading-tight">
              {project.project.project_name}
            </DialogTitle>
            <div className="flex flex-col gap-2 mt-4 text-white/50 text-sm">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-[#E8D1AB]"/> {project.project.event_date}</div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-[#E8D1AB]"/> Location Details</div>
            </div>
          </DialogHeader>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-20">
          
          {/* DISTRIBUTION */}
          {streamingPlatforms?.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8D1AB] mb-4">Distribution Platforms</h4>
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(streamingPlatforms) ? streamingPlatforms : JSON.parse(streamingPlatforms)).map((id: number) => (
                  <div key={id} className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-white/5 rounded-lg text-xs text-white/80">
                    <Video size={14} className="text-blue-400" /> {platformNames[id]}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PRODUCTION CREW - Horizontal Scroll */}
          {assignedCrew?.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8D1AB] mb-4">
                Production Crew ({assignedCrew.length})
              </h4>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-horizontal-scrollbar">
                {assignedCrew.map((crew: any, index: number) => (
                  <div key={index} className="flex flex-col items-center p-5 bg-[#0D0D0D] border border-white/5 rounded-2xl w-40 shrink-0">
                    <div className="relative w-16 h-16 mb-4">
                      <Image
                        src="https://i.pravatar.cc/100"
                        alt="avatar"
                        fill
                        unoptimized
                        className="rounded-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-bold text-white mb-1 truncate w-full text-center">{crew.crew_member.first_name}</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest text-center">
                      {fetchRole(crew.crew_member?.primary_role)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* GEAR & EQUIPMENT - Horizontal Scroll */}
          {assignedEquipments?.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8D1AB] mb-4">
                Gear & Equipment ({assignedEquipments.length})
              </h4>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-horizontal-scrollbar">
                {assignedEquipments.map((eq: any, index: number) => (
                  <div key={index} className="flex flex-col p-5 bg-[#0D0D0D] border border-white/5 rounded-2xl w-44 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/5 rounded-lg"><Package size={18} className="text-white/40" /></div>
                        <span className="text-[8px] font-bold text-[#E8D1AB] uppercase bg-[#E8D1AB]/10 px-2 py-0.5 rounded">Included</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1 line-clamp-2 min-h-[40px] leading-snug">
                        {eq.equipment.equipment_name}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-auto">Kit Component</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BUDGET SUMMARY */}
          <section className="bg-gradient-to-tr from-[#111] to-[#0D0D0D] p-6 rounded-2xl border border-white/10">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6">Estimated Totals</h4>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] uppercase text-white/40 mb-1">Total Project Budget</p>
                    <p className="text-3xl font-bold text-[#E8D1AB]">${Number(project.project.budget).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase text-white/40 mb-1">Duration</p>
                    <p className="text-xl font-bold text-white">{project.project.duration_hours} Hrs</p>
                </div>
            </div>
          </section>
        </div>

        {/* CUSTOM SCROLLBAR CSS */}
        <style jsx global>{`
          /* Horizontal Scrollbar Styling */
          .custom-horizontal-scrollbar::-webkit-scrollbar {
            height: 6px; /* Height of the horizontal bar */
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
            background: #E8D1AB; /* Gold color to match theme */
            border-radius: 10px;
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d4be9a;
          }

          /* General Vertical Scrollbar Styling */
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;