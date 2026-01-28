"use client";

import React from "react";
import { cn } from "@/lib/utils";

const tabs = [
  "Overview",
  "Pre_Production",
  "Post_Production",
  "Meetings",
  "Messages",
];

interface ShootTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ShootTabs({ activeTab, onTabChange }: ShootTabsProps) {
  return (
    <div className="w-full border-b border-[#222222] mb-6">
      <div className="flex items-center justify-between w-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "pb-4 text-base font-medium transition-all duration-300 relative tracking-normal px-2",
              activeTab === tab
                ? "text-[#E5D5B8]"
                : "text-[#666666] hover:text-white"
            )}
          >
            {tab.replace("_", " ")}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E5D5B8] rounded-t-full shadow-[0_-2px_6px_rgba(229,213,184,0.4)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
