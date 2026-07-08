"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Target tabs payload structure mapping labels to inner identifiers
const projectTabs = [
  { id: "shoot-details", label: "Shoot Details" },
  { id: "pre-prod", label: "Pre Production Files" },
  { id: "post-prod", label: "Post Production Files" },
  { id: "meetings", label: "Meetings" },
  { id: "messages", label: "Messages" },
];

interface ProjectDetailsTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ProjectDetailsTabs({ activeTab, onTabChange }: ProjectDetailsTabsProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <div className={cn(
      "w-full border rounded-lg lg:rounded-2xl lg:my-0 px-4 transition-all",
      isDark ? "border-[#222222] bg-[#111111]" : "border-[#E5E5E5] bg-[#FFFCF6]"
    )}>
      <div
        className={cn(
          "flex items-center w-full overflow-x-auto no-scrollbar",
          "gap-6 lg:gap-0 lg:justify-between"
        )}
      >
        {projectTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-4 text-sm lg:text-base font-medium transition-all relative tracking-normal px-2 whitespace-nowrap flex-shrink-0 focus-visible:outline-none",
                isActive
                  ? (isDark ? "text-[#E5D5B8]" : "text-[#735A2B]")
                  : (isDark ? "text-[#666666] hover:text-white" : "text-[#635F5F] hover:text-black")
              )}
            >
              {tab.label}
              {isActive && (
                <div className={cn(
                  "absolute bottom-0 left-0 w-full h-[2px] rounded-t-full transition-all",
                  isDark
                    ? "bg-[#E5D5B8] shadow-[0_-2px_6px_rgba(229,213,184,0.4)]"
                    : "bg-[#735A2B] shadow-[0_-2px_6px_rgba(115,90,43,0.15)]"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}