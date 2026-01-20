"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

type Activity = {
  id: number;
  color: string;
  text: string;
  time: string;
};

const activities: Activity[] = [
  {
    id: 1,
    color: "bg-[#A989EF]",
    text: "Update of calendar events & Added new events in next week.",
    time: "4:45PM",
  },
  {
    id: 2,
    color: "bg-[#A989EF]",
    text: "New theme for Spruko Website completed",
    time: "3 hrs Ago",
  },
  {
    id: 3,
    color: "bg-emerald-400",
    text: "Created a New Task today",
    time: "22 hrs Ago",
  },
  {
    id: 4,
    color: "bg-yellow-400",
    text: "32 New people joined summit.",
    time: "Yesterday",
  },
  {
    id: 5,
    color: "bg-pink-400",
    text: "New member @andreas gurrero added today to AI Summit.",
    time: "24 hrs Ago",
  },
];

export default function RecentActivity() {
  return (
    <div className="w-full bg-[#171717] rounded-2xl text-white border border-[#3D3D3D] md:h-[392px] flex flex-col overflow-hidden">
      {/* Header (fixed) */}
      <div className="bg-[#101010] flex justify-between items-center border-b border-[#3D3D3D] p-5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2>Recent Activity</h2>
        </div>

        <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
          View All
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Timeline (scrollable) */}
      <div className="relative flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index !== activities.length - 1 && (
              <span className="absolute left-[7px] top-5 h-full w-px bg-white/15" />
            )}

            {/* Dot */}
            <span
              className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${activity.color} shadow-[0_0_0_4px_rgba(255,255,255,0.05)]`}
            />

            {/* Content */}
            <div className="flex-1">
              <p className="text-xs text-white/80 leading-relaxed">
                {activity.text}
              </p>
            </div>

            {/* Time */}
            <span className="whitespace-nowrap text-xs text-white/40">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
