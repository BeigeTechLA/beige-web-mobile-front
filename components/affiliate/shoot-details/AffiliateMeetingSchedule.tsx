"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import AffiliateCreateMeetingModal from "./AffiliateCreateMeetingModal";
import { useTheme } from "next-themes";

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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!mounted) return null;

  return (
    <>
      <div className={`rounded-2xl border py-6 mt-6 transition-all duration-300 ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"
        }`}>
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 mb-6 px-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className={`lg:text-lg font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Meeting Schedule
            </h3>
            <button className={`flex lg:hidden items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]" : "bg-[#F9F9F9] border-[#E5E5E5] text-black hover:bg-[#F0F0F0]"
              }`}>
              All Status <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex gap-3">
            <button className={`hidden lg:flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors ${isDark ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]" : "bg-[#F9F9F9] border-[#E5E5E5] text-black hover:bg-[#F0F0F0]"
              }`}>
              All Status <ChevronDown size={14} />
            </button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className={`flex-1 rounded-lg px-4 font-medium transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]"
                }`}
            >
              Create New Meeting
            </Button>
          </div>
        </div>

        <div className="w-full">
          {/* DESKTOP TABLE HEADER */}
          <div className={`hidden lg:grid grid-cols-4 text-base font-medium leading-none px-6 py-4 border-b transition-colors ${isDark ? "text-[#888888] border-[#222222]" : "bg-[#F4F5F7] text-[#000] border-[#E5E5E5]"
            }`}>
            <span>Date & Time</span>
            <span>Members</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          <div className={`lg:hidden flex justify-between text-sm font-medium leading-none px-6 py-4 border-b transition-colors ${isDark ? "text-[#E8D1AB] border-[#222222]" : "bg-[#F4F5F7] text-[#000] border-[#E5E5E5]"
            }`}>
            <span>Members</span>
            <span>Status</span>
          </div>

          <div className="flex flex-col">
            {meetings.map((meeting) => (
              <React.Fragment key={meeting.id}>
                {/* DESKTOP ROW */}
                <div className={`hidden lg:grid grid-cols-4 items-center py-4 px-6 transition-colors last:border-0 ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.01]"
                  }`}>
                  <span className={`text-sm lg:text-base leading-none transition-colors ${isDark ? "text-[#E0E0E0]" : "text-[#333333]"
                    }`}>
                    {meeting.date}
                  </span>
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(meeting.members, 3))].map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 relative overflow-hidden transition-colors ${isDark ? "bg-zinc-700 border-[#111111]" : "bg-zinc-200 border-white"
                        }`}>
                        <img src={`/images/crew/CREW(${i + 1}).png`} alt="Member" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {meeting.members > 3 && (
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${isDark ? "bg-[#E8D1AB] border-[#111111] text-black" : "bg-[#E8D1AB] border-white text-black"
                        }`}>
                        +{meeting.members - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <StatusBadge status={meeting.status} />
                  </div>
                  <div className="text-right">
                    <button className={`transition-colors ${isDark ? "text-[#888888] hover:text-white" : "text-[#999999] hover:text-black"}`}>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* MOBILE EXPANDABLE ROW */}
                <div className={`lg:hidden flex flex-col transition-colors px-4`}>
                  <div
                    onClick={() => toggleExpand(meeting.id)}
                    className="flex items-center justify-between py-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-all duration-200 ${expandedId === meeting.id
                        ? (isDark ? "rotate-180 text-[#E8D1AB]" : "rotate-180 text-[#000]")
                        : (isDark ? "text-[#888888]" : "text-[#999999]")
                        }`}>
                        <ChevronDown size={20} />
                      </div>
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(meeting.members, 3))].map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full border-2 relative overflow-hidden transition-colors ${isDark ? "bg-zinc-700 border-[#111111]" : "bg-zinc-200 border-white"
                            }`}>
                            <img src={`/images/crew/CREW(${i + 1}).png`} alt="Member" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {meeting.members > 3 && (
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${isDark ? "bg-[#E8D1AB] border-[#111111] text-black" : "bg-[#E8D1AB] border-white text-black"
                            }`}>
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
                        <p className={`text-xs font-medium mb-1 uppercase tracking-wider transition-colors ${isDark ? "text-[#888888]" : "text-[#999999]"
                          }`}>
                          Date & Time
                        </p>
                        <p className={`text-sm transition-colors ${isDark ? "text-white" : "text-black"}`}>
                          {meeting.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium mb-1 uppercase tracking-wider transition-colors ${isDark ? "text-[#888888]" : "text-[#999999]"
                          }`}>
                          Action
                        </p>
                        <button className={`text-sm font-semibold hover:underline transition-colors ${isDark ? "text-[#E8D1AB]" : "text-[#D9C19A]"
                          }`}>
                          Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <AffiliateCreateMeetingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isDark={isDark} />
    </>
  );
}