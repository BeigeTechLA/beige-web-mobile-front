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
      <p className={`truncate text-sm font-semibold ${t.strong}`}>{folder.name}</p>
      {folder.info && (
        <span title={folder.info} className={`cursor-help ${isDark?"text-black":"text-white"}`} aria-label={folder.info}>
          <Info size={14} fill="#E8D1AB" strokeWidth={1.5} />
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
        <p className={`text-xs ${isDark ? "text-[#CDC5C5]" : "text-black/60"}`}>{formatStamp(folder.uploaded.at)}</p>
      </div>
    </>
  ) : folder.opened ? (
    <>
      <InitialsAvatar person={folder.opened.by} />
      <span className={`flex-1 text-xs lg:text-sm ${isDark ? "text-[#CDC5C5]" : "text-black/60"}`}>{folder.opened.label}</span>
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
      <div className="space-y-3 p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20" fill="none">
              <path d="M14.4586 3H20.4316C20.8485 2.99996 21.2608 3.0868 21.6423 3.25499C22.0237 3.42317 22.3659 3.66902 22.6471 3.97683C22.9282 4.28465 23.1421 4.64768 23.2751 5.04276C23.4081 5.43785 23.4574 5.85633 23.4196 6.2715L22.4641 16.7715C22.3964 17.5169 22.0525 18.21 21.4999 18.7148C20.9474 19.2197 20.2261 19.4997 19.4776 19.5H3.95413C3.20568 19.4997 2.48438 19.2197 1.93182 18.7148C1.37926 18.21 1.03536 17.5169 0.967627 16.7715L0.012127 6.2715C-0.0505173 5.57678 0.130883 4.88194 0.525127 4.3065L0.466627 3C0.466627 2.20435 0.782698 1.44129 1.34531 0.87868C1.90792 0.316071 2.67098 0 3.46663 0H8.97463C9.77021 0.000169912 10.5331 0.316352 11.0956 0.879L12.3376 2.121C12.9001 2.68365 13.663 2.99983 14.4586 3ZM1.97563 3.18C2.29763 3.061 2.63963 3.001 3.00163 3H11.0956L10.0351 1.9395C9.75389 1.65818 9.37242 1.50008 8.97463 1.5H3.46663C3.07369 1.49993 2.69642 1.65405 2.41592 1.92922C2.13542 2.20439 1.97409 2.57864 1.96663 2.9715L1.97563 3.18Z" fill="#E8D1AB" />
            </svg>
            <div className="min-w-0">
              {name}
              <p className="text-xs text-[#E8D1AB]">{folder.countLabel}</p>
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
      {footer && <div className={`flex items-center gap-3 border-t p-4 lg:p-5 ${isDark ? "border-white/50" : "border-[#EEEEEE]"}`}>{footer}{folder.uploaded && menu}</div>}
    </div>
  );
}
