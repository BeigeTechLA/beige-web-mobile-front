"use client";

import React from "react";
import FolderInfoCard from "./FolderInfoCard";
import BrowserToolbar from "./BrowserToolbar";
import type { ViewMode } from "./types";

/**
 * Folder screen shell: info card ("Version 1 (25 Items)" + Linked to) → toolbar → content.
 * Same layout as the Edits / Selected for Edits / Edited Deliverables sections.
 */
export default function FileSection({
  isDark,
  title,
  badge,
  linkedTo,
  linkedOn,
  search,
  onSearch,
  view,
  onView,
  toolbar,
  children,
}: {
  isDark: boolean;
  title: string;
  badge?: React.ReactNode;
  linkedTo?: string;
  linkedOn?: string;
  search: string;
  onSearch: (v: string) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  /** Extra toolbar controls (Select All, Upload Files …) */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border ${isDark ? "bg-[#171717] border-[#242422]" : "bg-white border-[#E5E5E5]"}`}>
      <FolderInfoCard isDark={isDark} title={title} badge={badge} linkedTo={linkedTo} linkedOn={linkedOn} />
      <div className="space-y-4 p-4 lg:space-y-5 lg:p-5">
        <BrowserToolbar isDark={isDark} search={search} onSearch={onSearch} view={view} onView={onView}>
          {toolbar}
        </BrowserToolbar>
        {children}
      </div>
    </section>
  );
}
