"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { fmTheme } from "./theme";
import { LinkedPill } from "./ui";
import type { ShootFolderSummary } from "./types";

/** Shoot identity header shown on every folder-details screen. */
export default function FolderHeader({
  isDark,
  shoot,
  onBack,
}: {
  isDark: boolean;
  shoot: ShootFolderSummary;
  onBack: () => void;
}) {
  const t = fmTheme(isDark);
  const meta = [
    { label: "Project / Shoot", value: shoot.projectName },
    { label: "Producer", value: shoot.producer },
    { label: "Editor Type", value: shoot.editorType },
  ];
  const dueLabel = shoot.dueInDays <= 0 ? "Edits Due Today" : `Edits Due in ${shoot.dueInDays} Day${shoot.dueInDays === 1 ? "" : "s"}`;

  return (
    <div className="space-y-3 lg:space-y-5">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/85 hover:text-white" : "text-black/70 hover:text-black"}`}
      >
        <ArrowLeft size={18} strokeWidth={1.7} /> Back
      </button>

      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-15 w-15 lg:h-21 lg:w-21 shrink-0 items-center justify-center rounded-2xl bg-[#C8E1FF] text-xl lg:text-3xl font-semibold text-black">
            {shoot.initials}
          </div>
          <div className="min-w-0">
            <p className={`text-sm lg:text-base font-semibold uppercase tracking-wide ${t.gold}`}>
              {shoot.shootCode} · {shoot.service}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className={`text-lg lg:text-2xl font-semibold ${t.strong}`}>{shoot.title}</h1>
              {shoot.isLinked && <LinkedPill small />}
            </div>
            <dl className="mt-2 flex flex-wrap gap-y-1">
              {meta.map((m, i) => (
                <div key={m.label} className={`pr-4 lg:pr-6 ${i > 0 ? `pl-4 lg:pl-5 border-l ${isDark ? "border-white/20" : "border-black/10"}` : ""}`}>
                  <dt className={`text-[10px] lg:text-xs uppercase tracking-wider ${t.faint}`}>{m.label}</dt>
                  <dd className={`text-xs lg:text-sm font-medium ${t.strong}`}>{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <span
          className={`self-start sm:self-center inline-flex shrink-0 items-center rounded-full border p-4 lg:px-9 text-sm lg:text-lg leading-none ${shoot.dueInDays <= 2
            ? "border-[#B33A3A] bg-[#2A1212] text-[#FF8A8A]"
            : isDark ? "border-[#D98F06] bg-[#D98F06]/10 text-[#E8A72E]" : "border-[#E9C987] bg-[#FFF6E3] text-[#B07A12]"}`}
        >
          {dueLabel}
        </span>
      </div>
    </div>
  );
}
