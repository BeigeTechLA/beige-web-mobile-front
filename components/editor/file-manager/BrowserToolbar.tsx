"use client";

import React from "react";
import { SearchInput, ViewToggle } from "./ui";
import type { ViewMode } from "./types";

/** Search on the left; optional controls + view toggle on the right. */
export default function BrowserToolbar({
  isDark,
  search,
  onSearch,
  view,
  onView,
  children,
}: {
  isDark: boolean;
  search: string;
  onSearch: (v: string) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  /** Extra controls (Status, Select All, Upload Files …) shown before the toggle */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput isDark={isDark} value={search} onChange={onSearch} className="sm:max-w-[320px]" />
      <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-3">
        {children}
        <ViewToggle isDark={isDark} value={view} onChange={onView} />
      </div>
    </div>
  );
}

/** Grid / list / compact wrapper so every listing lays out the same way. */
export function ItemsLayout({ isDark, view, children }: { isDark: boolean; view: ViewMode; children: React.ReactNode }) {
  if (view === "list") {
    return (
      <div className={`rounded-xl border divide-y ${isDark ? "border-white/10 divide-white/10 bg-[#1C1C1C]" : "border-[#ECECEC] divide-[#EEEEEE] bg-white"}`}>
        {children}
      </div>
    );
  }
  if (view === "compact") {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{children}</div>;
  }
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:gap-4">{children}</div>;
}
