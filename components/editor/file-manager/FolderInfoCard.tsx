"use client";

import React from "react";
import { Calendar, FolderSymlink, Link2 } from "lucide-react";
import { fmTheme, formatDate } from "./theme";

/** "Edits (3 Folders)" card with the "Linked to" box, shown at the top of a folder. */
export default function FolderInfoCard({
  isDark,
  title,
  badge,
  linkedTo,
  linkedOn,
}: {
  isDark: boolean;
  title: string;
  /** Right of the title (e.g. <LatestBadge/>) or far right on wide screens */
  badge?: React.ReactNode;
  linkedTo?: string;
  linkedOn?: string;
}) {
  const t = fmTheme(isDark);
  return (
    <section className={`rounded-2xl border p-4 lg:p-5 space-y-4 ${t.panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#262626] text-white/80" : "bg-[#F0F0F0] text-black/70"}`}>
            <FolderSymlink size={15} />
          </span>
          <h2 className={`truncate text-sm font-medium ${t.gold}`}>{title}</h2>
        </div>
        {badge}
      </div>
      {linkedTo && (
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${t.inset}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-black">
            <Link2 size={15} />
          </span>
          <div className="min-w-0">
            <p className={`truncate text-xs lg:text-sm ${t.strong}`}>Linked to: {linkedTo}</p>
            {linkedOn && (
              <p className={`mt-0.5 flex items-center gap-1 text-[11px] lg:text-xs ${t.muted}`}>
                <Calendar size={11} /> {formatDate(linkedOn)}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
