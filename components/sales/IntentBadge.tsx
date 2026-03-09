"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export type IntentType = "Hot" | "Warm" | "Cold";

interface IntentBadgeProps {
  intent: IntentType;
  className?: string;
  size?: "sm" | "md";
}

const INTENT_STYLES: Record<IntentType, { dark: string; light: string }> = {
  Hot: {
    dark: "bg-[#311F14] text-[#E6570C]",
    light: "bg-[#FFF2EB] text-[#E6570C]"
  },
  Warm: {
    dark: "bg-[#3A2A05] text-[#FBBF24]",
    light: "bg-[#FFFBEB] text-[#B45309]" // Darker amber text for light mode legibility
  },
  Cold: {
    dark: "bg-[#132A3E] text-[#60A5FA]",
    light: "bg-[#EFF6FF] text-[#1D4ED8]" // Darker blue text for light mode legibility
  },
};

export const IntentBadge = ({
  intent,
  className,
  size = "md"
}: IntentBadgeProps) => {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const currentStyles = INTENT_STYLES[intent] || INTENT_STYLES.Warm;
  const activeClasses = isDark ? currentStyles.dark : currentStyles.light;

  return (
    <span
      className={cn(
        "rounded-full font-medium transition-colors inline-flex items-center justify-center",
        size === "sm" ? "px-3 py-1 text-[10px] lg:text-xs" : "px-4 py-1.5 text-sm lg:text-base",
        activeClasses,
        className
      )}
    >
      {intent}
    </span>
  );
};