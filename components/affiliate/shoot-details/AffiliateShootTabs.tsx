"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <div className={cn(
      "w-full border rounded-lg lg:rounded-2xl lg:my-0 px-4 transition-all duration-300",
      isDark ? "border-[#222222] bg-[#111111]" : "border-[#E5E5E5] bg-[#FFFCF6]"
    )}>
      <div
        className={cn(
          "flex items-center w-full overflow-x-auto no-scrollbar",
          "gap-6 lg:gap-0 lg:justify-between"
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "py-4 text-sm lg:text-base font-medium transition-all duration-300 relative tracking-normal px-2 whitespace-nowrap flex-shrink-0",
                isActive
                  ? (isDark ? "text-[#E5D5B8]" : "text-[#000]")
                  : (isDark ? "text-[#666666] hover:text-white" : "text-[#635F5F] hover:text-black")
            )}
          >
            {tab.replace("_", " ")}
              {isActive && (
                <div className={cn(
                  "absolute bottom-0 left-0 w-full h-[2px] rounded-t-full transition-all duration-300",
                  isDark 
                    ? "bg-[#E5D5B8] shadow-[0_-2px_6px_rgba(229,213,184,0.4)]" 
                    : "bg-[#000] shadow-[0_-2px_6px_rgba(177,138,0,0.2)]"
                )} />
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}