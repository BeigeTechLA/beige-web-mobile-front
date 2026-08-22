"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

type TabOption<T extends string> = {
  label: React.ReactNode;
  value: T;
  disabled?: boolean;
};

interface TabsSwitcherProps<T extends string> {
  tabs: readonly TabOption<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  buttonSize?: string;
  textCenter?: boolean;
}

export function TabsSwitcher<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  buttonSize = "regular",
  textCenter = false,
}: TabsSwitcherProps<T>) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const buttonLength = buttonSize == "regular" ? "" : "w-auto lg:w-[146px]";

  if (!mounted) return null;

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl w-full max-w-[568px] border transition-all duration-300 ${
        isDark ? "bg-[#171717] border-[#333]" : "bg-[#fff] border-[#E5E5E5]"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            type="button"
            disabled={tab.disabled}
            className={`flex-1 px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap ${textCenter ? "text-center" : ""} ${buttonLength} transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive
                ? isDark
                  ? "bg-[#E5D5B8] text-black shadow-lg"
                  : "bg-[#E8D1AB] text-black shadow-sm"
                : isDark
                  ? "text-[#777] hover:text-white"
                  : "text-[#888] hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
