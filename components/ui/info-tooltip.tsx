"use client";

import * as React from "react";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  message: string;
  isDark?: boolean;
  align?: "left" | "right";
  className?: string;
};

export function InfoTooltip({
  message,
  isDark = true,
  align = "left",
  className,
}: InfoTooltipProps) {
  return (
    <div className={cn("group relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label="More information"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full border transition-all",
          isDark
            ? "border-white/10 bg-white/5 text-[#E8D1AB] hover:border-[#E8D1AB]/30 hover:bg-[#E8D1AB]/10"
            : "border-[#E7D7BC] bg-[#FFF8EA] text-[#7A5A00] hover:border-[#D9BE88] hover:bg-[#FDF2D8]",
        )}
      >
        <Info size={14} />
      </button>

      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border px-3 py-2 text-xs leading-5 shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
          align === "right" ? "right-0" : "left-0",
          isDark
            ? "border-[#3D3D3D] bg-[#111111] text-white/80"
            : "border-[#E7D7BC] bg-white text-black/75",
        )}
      >
        {message}
      </div>
    </div>
  );
}
