"use client";

import React from "react";
import { fmTheme } from "./theme";
import { StatusTag } from "./ui";
import type { ActivityEntry } from "./types";

/** "October 16 - 4:10PM" */
const formatActivityTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "");
  return `${date} - ${time}`;
};

/** Activity History card: green check per entry, joined by a vertical line (newest first). */
export default function ActivityTimeline({
  isDark,
  entries,
  title = "Activity History",
}: {
  isDark: boolean;
  entries: ActivityEntry[];
  title?: string;
}) {
  const t = fmTheme(isDark);
  const items = [...entries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <section className={`rounded-2xl border ${isDark ? "bg-[#0C0C0C] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
      <h2 className={`p-4 lg:p-5 text-xs lg:text-sm font-semibold border-b ${t.strong} ${isDark ? "border-[#242422]" : "border-[#E5E5E5]"}`}>{title}</h2>

      {items.length === 0 ? (
        <p className={`px-5 py-12 text-center text-sm ${t.faint}`}>No activity yet.</p>
      ) : (
        <ol className="p-4 lg:p-5">
          {items.map((entry, i) => {
            const last = i === items.length - 1;
            return (
              <li key={entry.id} className="relative flex gap-3 lg:gap-4 items-start">
                {/* check + connector */}
                <div className="relative flex w-7 shrink-0 flex-col items-center">
                  <span className="flex h-7 w-7 lg:w-9 lg:h-9 items-center justify-center rounded-full bg-[#1B2920] text-[#6C9176]" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4.16406 12.0859C4.16406 12.0859 5.41406 12.0859 7.08073 15.0026C7.08073 15.0026 11.7131 7.36372 15.8307 5.83594" stroke="#6C9176" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {!last && <span className={`h-12 w-px shrink-0 ${isDark ? "bg-white/35" : "bg-black/10"}`} aria-hidden="true" />}
                </div>

                <div className={`flex min-w-0 flex-1 flex-col gap-1 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${last ? "" : "pb-4"}`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className={`text-base lg:text-lg font-medium ${t.strong}`}>{entry.title}</p>
                    {entry.tag && <StatusTag label={entry.tag.label} tone={entry.tag.tone} />}
                  </div>
                  <time dateTime={entry.at} className={`shrink-0 whitespace-nowrap text-sm lg:text-base ${isDark ? "text-[#8C9097]" : "text-black/60"}`}>
                    {formatActivityTime(entry.at)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
