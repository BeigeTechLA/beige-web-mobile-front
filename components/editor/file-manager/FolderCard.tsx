"use client";

import React from "react";
import { Folder, Info } from "lucide-react";
import { fmTheme, formatStamp } from "./theme";
import { Callout, InitialsAvatar, KebabMenu, LinkedPill, TagPill, type MenuAction } from "./ui";
import type { FolderItem, ViewMode } from "./types";

/** Folder tile used on the File Manager tab and inside folders (grid / list / compact). */
export default function FolderCard({
  isDark,
  folder,
  view = "grid",
  onOpen,
  actions = [],
}: {
  isDark: boolean;
  folder: FolderItem;
  view?: ViewMode;
  onOpen: () => void;
  actions?: MenuAction[];
}) {
  const t = fmTheme(isDark);

  const name = (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <p className={`truncate text-sm font-medium ${t.strong}`}>{folder.name}</p>
      {folder.info && (
        <span title={folder.info} className={`${t.faint} cursor-help`} aria-label={folder.info}>
          <Info size={12} />
        </span>
      )}
      {folder.callout && <Callout label={folder.callout} />}
    </div>
  );

  const footer = folder.uploaded ? (
    <>
      <InitialsAvatar person={folder.uploaded.by} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs lg:text-sm ${t.strong}`}>Uploaded by {folder.uploaded.by.name}</p>
        <p className={`text-[10px] ${t.faint}`}>{formatStamp(folder.uploaded.at)}</p>
      </div>
    </>
  ) : folder.opened ? (
    <>
      <InitialsAvatar person={folder.opened.by} />
      <span className={`flex-1 text-xs ${isDark ? "text-white/70" : "text-black/60"}`}>{folder.opened.label}</span>
    </>
  ) : null;

  const menu = actions.length > 0 && <KebabMenu isDark={isDark} actions={actions} label={`${folder.name} actions`} />;
  const open = (e: React.KeyboardEvent) => e.key === "Enter" && onOpen();

  if (view === "list") {
    return (
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={open} className={`flex cursor-pointer flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}>
        <div className="flex min-w-0 items-center gap-3 sm:w-[40%]">
          <Folder size={20} className="shrink-0 fill-[#E8D1AB] text-[#E8D1AB]" />
          <div className="min-w-0">
            {name}
            <p className="text-[11px] text-[#E8D1AB]">{folder.countLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-1">
          {folder.tag && <TagPill isDark={isDark} label={folder.tag} />}
          {folder.isLinked && <LinkedPill small />}
        </div>
        <div className="flex items-center gap-2 sm:w-[30%]">{footer}{menu}</div>
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={open} className={`cursor-pointer rounded-xl border p-4 transition-colors ${t.card} ${t.cardHover}`}>
        <div className="flex items-start justify-between">
          <Folder size={32} className="fill-[#E8D1AB] text-[#E8D1AB]" />
          {menu}
        </div>
        <p className={`mt-3 truncate text-sm font-medium ${t.strong}`}>{folder.name}</p>
        <p className="text-[11px] text-[#E8D1AB]">{folder.countLabel}</p>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={open}
      className={`cursor-pointer rounded-xl border transition-colors ${t.card} ${t.cardHover}`}
    >
      <div className="space-y-3 px-4 pt-4 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <Folder size={18} className="mt-0.5 shrink-0 fill-[#E8D1AB] text-[#E8D1AB]" />
            <div className="min-w-0">
              {name}
              <p className="text-[11px] text-[#E8D1AB]">{folder.countLabel}</p>
            </div>
          </div>
          {/* "Uploaded by" folders carry the menu in the footer instead */}
          {!folder.uploaded && menu}
        </div>
        {(folder.tag || folder.isLinked) && (
          <div className="flex flex-wrap items-center gap-2">
            {folder.tag && <TagPill isDark={isDark} label={folder.tag} />}
            {folder.isLinked && <LinkedPill small />}
          </div>
        )}
      </div>
      {footer && <div className={`flex items-center gap-3 border-t px-4 py-3 ${t.divider}`}>{footer}{folder.uploaded && menu}</div>}
    </div>
  );
}
