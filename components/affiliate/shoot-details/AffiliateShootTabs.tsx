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

interface AffiliateShootTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AffiliateShootTabs({ activeTab, onTabChange }: AffiliateShootTabsProps) {
  return (
    <div className="w-full border-b border-[#222222] mt-4 lg:mt-0 mb-6">
      <div
        className={cn(
          "flex items-center w-full overflow-x-auto no-scrollbar",
          "gap-6 lg:gap-0 lg:justify-between"
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "pb-2 lg:pb-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0",
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