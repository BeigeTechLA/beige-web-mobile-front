"use client";

import React from "react";

type TabOption<T extends string> = {
  label: string;
  value: T;
};

interface TabsSwitcherProps<T extends string> {
  tabs: readonly TabOption<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function TabsSwitcher<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsSwitcherProps<T>) {
  return (
    <div
      className={`flex items-center gap-1 bg-[#111] p-1 rounded-xl w-fit border border-[#333] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
              isActive
                ? "bg-[#E5D5B8] text-black shadow-lg"
                : "text-[#777] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
