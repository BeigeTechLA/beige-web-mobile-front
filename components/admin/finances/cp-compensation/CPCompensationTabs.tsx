"use client";

import React from "react";
import { useTheme } from "next-themes";

interface CPCompensationTabsProps {
  activeTab: "shoots" | "creators";
  setActiveTab: (tab: "shoots" | "creators") => void;
}

export default function CPCompensationTabs({ activeTab, setActiveTab }: CPCompensationTabsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`p-1.5 rounded-full w-fit flex gap-1 transition-all duration-300 ${
      isDark ? "bg-[#171717] border border-[#3D3D3D]" : "bg-[#F0F0F0] border border-[#E3E3E3]"
    }`}>
      <button
        onClick={() => setActiveTab("shoots")}
        className={`px-8 lg:px-10 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
          activeTab === "shoots"
            ? (isDark ? "bg-[#E5D5B8] text-black shadow-lg" : "bg-[#E8D1AB] text-black shadow-md")
            : (isDark ? "text-white/40 hover:text-white/60" : "text-[#777] hover:text-[#555]")
        }`}
      >
        SHOOTS
      </button>
      <button
        onClick={() => setActiveTab("creators")}
        className={`px-8 lg:px-10 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
          activeTab === "creators"
            ? (isDark ? "bg-[#E5D5B8] text-black shadow-lg" : "bg-[#E8D1AB] text-black shadow-md")
            : (isDark ? "text-white/40 hover:text-white/60" : "text-[#777] hover:text-[#555]")
        }`}
      >
        CREATORS
      </button>
    </div>
  );
}
