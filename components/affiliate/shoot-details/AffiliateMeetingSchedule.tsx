"use client";

import React, { useState } from "react";
import { ChevronDown, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import AffiliateCreateMeetingModal from "./AffiliateCreateMeetingModal";
import { cn } from "@/lib/utils";

const meetings = [
  { id: 1, date: "26 Nov 2024 at 12:00 pm", status: "Initiated", members: 4 },
  { id: 2, date: "26 Nov 2024 at 12:00 pm", status: "Pre Production", members: 2 },
  { id: 3, date: "26 Nov 2024 at 12:00 pm", status: "Revision", members: 1 },
  { id: 4, date: "26 Nov 2024 at 12:00 pm", status: "Completed", members: 3 },
  { id: 5, date: "26 Nov 2024 at 12:00 pm", status: "Pre Production", members: 1 },
  { id: 6, date: "26 Nov 2024 at 12:00 pm", status: "Completed", members: 2 },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Initiated: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
    "Pre Production": "bg-[#FDF4FF] text-[#C065F0] border-[#C065F0]/20",
    Revision: "bg-[#E6F0FF] text-[#3B82F6] border-[#3B82F6]/20",
    Completed: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
  };

  return (
    <span className={`px-5 py-1.5 rounded-full text-sm font-medium border ${styles[status] || styles.Initiated}`}>
      {status}
    </span>
  );
};

export default function AffiliateMeetingSchedule() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <div className="bg-[#111111] rounded-2xl border border-[#222222] p-6 mt-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 mb-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-white lg:text-lg font-bold">Meeting Schedule</h3>
            <button className="flex lg:hidden items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white hover:bg-[#2C2C2C] transition-colors">
              All Status <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="hidden lg:flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white hover:bg-[#2C2C2C] transition-colors">
              All Status <ChevronDown size={14} />
            </button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-lg px-4 font-medium"
            >
              Create New Meeting
            </Button>
          </div>
        </div>

        <div className="w-full">
          {/* DESKTOP TABLE HEADER */}
          <div className="hidden lg:grid grid-cols-4 text-[#888888] text-base font-medium leading-none pb-4 px-2 border-b border-[#222222]">
            <span>Date & Time</span>
            <span>Members</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className=" lg:hidden flex justify-between text-[#E8D1AB] text-sm font-medium leading-none pb-4 px-2 border-b border-[#222222]">
            <span>Members</span>
            <span>Status</span>
          </div>

          <div className="flex flex-col">
            {meetings.map((meeting) => (
              <React.Fragment key={meeting.id}>
                {/* DESKTOP ROW */}
                <div className="hidden lg:grid grid-cols-4 items-center py-4 px-2 border-b border-[#222222] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <span className="text-[#E0E0E0] text-base font-medium leading-none">{meeting.date}</span>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(meeting.members, 3))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#111111] relative overflow-hidden">
                        {/* Placeholder Avatars */}
                        <img src={`/images/crew/CREW(${i + 1}).png`} alt="Member" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {meeting.members > 3 && (
                      <div className="w-8 h-8 rounded-full bg-[#E5D5B8] border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold text-black z-10">
                        +{meeting.members - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <div className="text-right">
                    <button className="text-[#888888] hover:text-white transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* MOBILE EXPANDABLE ROW */}
                <div className="lg:hidden flex flex-col border-b border-[#222222] last:border-0">
                  <div
                    onClick={() => toggleExpand(meeting.id)}
                    className="flex items-center justify-between py-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("transition-transform duration-200", expandedId === meeting.id ? "rotate-180 text-[#E8D1AB]" : "text-[#888888]")}>
                        <ChevronDown size={20} className="" />
                      </div>
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(meeting.members, 3))].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#111111] relative overflow-hidden">
                            <img src={`/images/crew/CREW(${i + 1}).png`} alt="Member" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {meeting.members > 3 && (
                          <div className="w-8 h-8 rounded-full bg-[#E5D5B8] border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold text-black z-10">
                            +{meeting.members - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={meeting.status} />
                  </div>

                  {/* EXPANDED DETAILS */}
                  {expandedId === meeting.id && (
                    <div className="pb-6 grid grid-cols-2 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <p className="text-[#888888] text-xs font-medium mb-1 uppercase tracking-wider">Date & Time</p>
                        <p className="text-white text-sm">{meeting.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#888888] text-xs font-medium mb-1 uppercase tracking-wider">Action</p>
                        <button className="text-[#E5D5B8] text-sm font-semibold hover:underline">Details</button>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <AffiliateCreateMeetingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}