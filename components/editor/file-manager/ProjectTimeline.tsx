"use client";

import React from "react";
import { fmTheme } from "./theme";
import { EDITING_STEPS, type EditingStep } from "./types";

/** Dashed connector + arrowhead. `stretch` lets it grow to fill the space between two steps. */
function Connector({ isDark, stretch }: { isDark: boolean; stretch: boolean }) {
  const color = isDark ? "white" : "black";

  if (!stretch) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="41" viewBox="0 0 8 41" fill="none">
        <path d="M3.33004 40.8536C3.5253 41.0488 3.84188 41.0488 4.03715 40.8536L7.21913 37.6716C7.41439 37.4763 7.41439 37.1597 7.21913 36.9645C7.02387 36.7692 6.70728 36.7692 6.51202 36.9645L3.68359 39.7929L0.855167 36.9645C0.659905 36.7692 0.343322 36.7692 0.14806 36.9645C-0.0472022 37.1597 -0.0472022 37.4763 0.14806 37.6716L3.33004 40.8536ZM4.1836 0.5C4.1836 0.223858 3.95974 1.20706e-08 3.6836 0C3.40745 -1.20706e-08 3.1836 0.223858 3.1836 0.5L3.6836 0.5L4.1836 0.5ZM4.18359 38C4.18359 37.7239 3.95974 37.5 3.68359 37.5C3.40745 37.5 3.18359 37.7239 3.18359 38L3.68359 38L4.18359 38ZM3.18359 33C3.18359 33.2761 3.40745 33.5 3.68359 33.5C3.95974 33.5 4.18359 33.2761 4.18359 33L3.68359 33L3.18359 33ZM4.18359 28C4.18359 27.7239 3.95974 27.5 3.68359 27.5C3.40745 27.5 3.18359 27.7239 3.18359 28L3.68359 28L4.18359 28ZM3.18359 23C3.18359 23.2761 3.40745 23.5 3.68359 23.5C3.95974 23.5 4.18359 23.2761 4.18359 23L3.68359 23L3.18359 23ZM4.18359 18C4.18359 17.7239 3.95974 17.5 3.68359 17.5C3.40745 17.5 3.18359 17.7239 3.18359 18L3.68359 18L4.18359 18ZM3.18359 13C3.18359 13.2761 3.40745 13.5 3.68359 13.5C3.95974 13.5 4.18359 13.2761 4.18359 13L3.68359 13L3.18359 13ZM4.1836 8C4.1836 7.72386 3.95974 7.5 3.6836 7.5C3.40745 7.5 3.1836 7.72386 3.1836 8L3.6836 8L4.1836 8ZM3.1836 3C3.1836 3.27614 3.40745 3.5 3.6836 3.5C3.95974 3.5 4.1836 3.27614 4.1836 3L3.6836 3L3.1836 3ZM3.68359 40.5L4.18359 40.5L4.18359 38L3.68359 38L3.18359 38L3.18359 40.5L3.68359 40.5ZM3.68359 33L4.18359 33L4.18359 28L3.68359 28L3.18359 28L3.18359 33L3.68359 33ZM3.68359 23L4.18359 23L4.18359 18L3.68359 18L3.18359 18L3.18359 23L3.68359 23ZM3.68359 13L4.18359 13L4.1836 8L3.6836 8L3.1836 8L3.18359 13L3.68359 13ZM3.6836 3L4.1836 3L4.1836 0.5L3.6836 0.5L3.1836 0.5L3.1836 3L3.6836 3Z" fill={color} />
      </svg>
    );
  }

  // Same look, but the dashed stem grows with the available height (min = original 41px)
  return (
    <div className="flex min-h-[41px] flex-1 flex-col items-center">
      <span
        className="w-px flex-1"
        style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0 5px, transparent 5px 10px)` }}
      />
      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 8 5" fill="none" className="-mt-px shrink-0">
        <path d="M0.5 0.5L4 4L7.5 0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Vertical editing timeline (Not Started → … → Completed). */
export default function ProjectTimeline({
  isDark,
  current,
  steps = EDITING_STEPS,
  isFullHeight = false,
}: {
  isDark: boolean;
  current: EditingStep;
  steps?: { key: EditingStep; label: string }[];
  isFullHeight?: boolean;
}) {
  const t = fmTheme(isDark);
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === current));

  return (
    <section
      className={`${isFullHeight ? "flex h-full flex-col rounded-l-2xl" : "rounded-2xl"} border min-w-[316px] ${t.panel}`}
      aria-label="Project timeline"
    >
      <h2
        className={`shrink-0 border-b ${isFullHeight ? "rounded-tl-2xl" : "rounded-2xl"} px-7 py-5 text-base lg:text-xl font-bold ${t.strong} ${isDark ? "bg-[#101010] border-b-[#3A3A3A]" : ""}`}
      >
        Project Timeline
      </h2>

      <ol className={`overflow-y-auto no-scrollbar px-7 py-5 ${isFullHeight ? "flex min-h-0 flex-1 flex-col" : "max-h-[360px]"}`}>
        {steps.map((step, i) => {
          const reached = i <= currentIndex;
          const active = i === currentIndex;
          const last = i === steps.length - 1;
          return (
            <li
              key={step.key}
              aria-current={active ? "step" : undefined}
              className={isFullHeight && !last ? "flex flex-1 flex-col" : undefined}
            >
              <div className="flex shrink-0 items-center gap-4">
                <span
                  className={`flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-full text-base lg:text-xl font-medium ${reached
                    ? "bg-[#E8D1AB] text-black"
                    : isDark ? "bg-[#101010] text-[#9C9C9C]" : "bg-[#F0F0F0] text-black/50"}`}
                >
                  {i + 1}
                </span>
                <span className={`text-base lg:text-xl font-medium ${reached ? t.gold : t.muted} ${active ? "font-medium" : ""}`}>{step.label}</span>
              </div>
              {!last && (
                <div className={`flex w-10 lg:w-12 flex-col items-center py-2 ${isFullHeight ? "flex-1" : ""}`} aria-hidden="true">
                  <Connector isDark={isDark} stretch={isFullHeight} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
