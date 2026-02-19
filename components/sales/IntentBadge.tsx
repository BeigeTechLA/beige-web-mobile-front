"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type IntentType = "Hot" | "Warm" | "Cold";

interface IntentBadgeProps {
  intent: IntentType;
  className?: string;
  size?: "sm" | "md";
}

const INTENT_STYLES: Record<IntentType, { bg: string; text: string }> = {
  Hot: { bg: "bg-[#311F14]", text: "text-[#E6570C]" },
  Warm: { bg: "bg-[#3A2A05]", text: "text-[#FBBF24]" },
  Cold: { bg: "bg-[#132A3E]", text: "text-[#60A5FA]" },
};

export const IntentBadge = ({
  intent,
  className,
  size = "md"
}: IntentBadgeProps) => {
  const styles = INTENT_STYLES[intent] || INTENT_STYLES.Warm;

  return (
    <span
      className={cn(
        "rounded-full font-medium transition-colors inline-flex items-center justify-center text-sm lg:text-base px-4 py-1.5 ",
        styles.bg,
        styles.text,
        className
      )}
    >
      {intent}
    </span>
  );
};