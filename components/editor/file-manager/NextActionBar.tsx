"use client";

import React from "react";
import { fmTheme } from "./theme";

export interface NextAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: React.ElementType;
  disabled?: boolean;
}

/**
 * Sticky "Next action" bar at the bottom of the folder-details screens.
 * Place it as the last child of the page; it sticks to the bottom of the scroll area.
 */
export default function NextActionBar({
  isDark,
  eyebrow = "Next Action",
  message,
  actions,
}: {
  isDark: boolean;
  eyebrow?: string;
  message: React.ReactNode;
  actions: NextAction[];
}) {
  const t = fmTheme(isDark);
  return (
    <div
      className={`sticky bottom-0 z-20 -mx-4 lg:-mx-10 mt-8 border-t p-4 lg:p-9 backdrop-blur ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white/95"}`}
      role="region"
      aria-label={eyebrow}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {/* pulsing status dot */}
          <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#452908]" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#452908] bg-[#D97706]" />
          </span>
          <div className="min-w-0">
            <p className={`text-sm lg:text-base uppercase tracking-wide ${t.gold}`}>{eyebrow}</p>
            <p className={`mt-0.5 text-base lg:text-lg font-medium ${t.strong}`}>{message}</p>
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex shrink-0 gap-2 lg:gap-3">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.onClick}
                disabled={a.disabled}
                className={`inline-flex h-12 flex-1 md:flex-none items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${a.variant === "secondary" ? t.secondaryBtn : t.primaryBtn}`}
              >
                {a.label}
                {a.icon && <a.icon size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
