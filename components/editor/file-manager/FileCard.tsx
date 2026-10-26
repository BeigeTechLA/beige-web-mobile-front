"use client";

import React, { useState } from "react";
import { ChevronDown, Download, Eye, FileDown, ImageIcon, MessageCircle } from "lucide-react";
import { fmTheme, formatStamp } from "./theme";
import { Checkbox, InitialsAvatar, KebabMenu, LatestBadge, StatusTag, type MenuAction } from "./ui";
import type { FileItem, FileStatus, ViewMode } from "./types";

export const FILE_STATUS: Record<FileStatus, { label: string; tone: "purple" | "pink" | "blue" }> = {
  selected_for_edits: { label: "File Selected For Edits", tone: "purple" },
  ready_for_approval: { label: "Ready for Approval", tone: "purple" },
  submitted_for_approval: { label: "Submitted for Approval", tone: "pink" },
};

/** Thumbnail / placeholder for a file */
export function FilePreview({ file, isDark, className = "" }: { file: FileItem; isDark: boolean; className?: string }) {
  if (file.previewUrl && file.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.previewUrl} alt={file.name} className={`h-full w-full object-cover ${className}`} />;
  }
  if (file.previewUrl && file.kind === "video") {
    return <video src={file.previewUrl} className={`h-full w-full object-cover ${className}`} muted playsInline preload="metadata" />;
  }
  const Icon = file.kind === "image" ? ImageIcon : FileDown;
  return (
    <div className={`flex h-full w-full items-center justify-center ${isDark ? "bg-[#262626]" : "bg-[#EFEFEF]"} ${className}`}>
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? "bg-[#4A4A4A] text-white" : "bg-[#CFCFCF] text-[#333]"}`}>
        <Icon size={26} />
      </span>
    </div>
  );
}

/** File tile (grid / list / compact) with selection, references and uploader footer. */
export default function FileCard({
  isDark,
  file,
  view = "grid",
  selectable = false,
  selected = false,
  onToggleSelect,
  onOpen,
  onDownload,
  extraActions = [],
}: {
  isDark: boolean;
  file: FileItem;
  view?: ViewMode;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (v: boolean) => void;
  onOpen: () => void;
  onDownload?: () => void;
  extraActions?: MenuAction[];
}) {
  const t = fmTheme(isDark);
  const [refsOpen, setRefsOpen] = useState(false);
  const status = FILE_STATUS[file.status];
  const hasRefs = !!(file.referenceLink || file.referenceMessage);

  const actions: MenuAction[] = [
    { label: "Preview", icon: Eye, onSelect: onOpen },
    ...(onDownload ? [{ label: "Download", icon: Download, onSelect: onDownload }] : []),
    ...extraActions,
  ];

  const check = selectable && (
    <Checkbox isDark={isDark} checked={selected} onChange={(v) => onToggleSelect?.(v)} label={`Select ${file.name}`} />
  );

  const titleRow = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <p className={`truncate text-xs lg:text-sm ${t.strong}`} title={`${file.name} - ${file.version}`}>
          {file.name} - {file.version}
        </p>
        {file.isLatest && <LatestBadge version={view === "grid" && file.status !== "selected_for_edits" ? `V${file.versionNumber}` : undefined} />}
      </div>
      <span className={`flex shrink-0 items-center gap-1 text-xs ${t.strong}`} aria-label={`${file.comments.length} comments`}>
        {file.comments.length} <MessageCircle size={14} />
      </span>
    </div>
  );

  const ring = selected ? "ring-2 ring-[#E8D1AB]/70" : "";

  if (view === "list") {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${selected ? (isDark ? "bg-[#E8D1AB]/5" : "bg-[#FFF8EC]") : ""}`}>
        {check}
        <button type="button" onClick={onOpen} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg" aria-label={`Preview ${file.name}`}>
          <FilePreview file={file} isDark={isDark} />
        </button>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpen}>
          {titleRow}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusTag label={status.label} tone={status.tone} />
            <span className={`text-[11px] ${t.faint}`}>ID : {file.code} · {file.sizeLabel}</span>
          </div>
        </div>
        <KebabMenu isDark={isDark} actions={actions} label={`${file.name} actions`} />
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className={`overflow-hidden rounded-xl border ${t.card} ${ring}`}>
        <div className="relative aspect-square cursor-pointer" onClick={onOpen}>
          <FilePreview file={file} isDark={isDark} />
          {selectable && <div className="absolute left-2 top-2">{check}</div>}
        </div>
        <div className="flex items-center justify-between gap-1 px-3 py-2">
          <p className={`truncate text-[11px] ${t.strong}`}>{file.name}</p>
          <KebabMenu isDark={isDark} actions={actions} label={`${file.name} actions`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-xl border ${t.card} ${ring}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          {check}
          <span className={`text-xs ${t.strong}`}>ID : {file.code}</span>
        </div>
        <span className={`text-xs ${t.strong}`}>{file.sizeLabel}</span>
      </div>

      {/* Preview */}
      <button type="button" onClick={onOpen} className="mx-4 mt-3 aspect-[4/3] overflow-hidden rounded-lg" aria-label={`Preview ${file.name}`}>
        <FilePreview file={file} isDark={isDark} />
      </button>

      {/* Name + status */}
      <div className="space-y-2 px-4 py-3">
        {titleRow}
        <StatusTag label={status.label} tone={status.tone} />
      </div>

      {/* References (expandable) */}
      {hasRefs && (
        <div className={`border-t px-4 py-3 ${t.divider}`}>
          <div className="flex items-start justify-between gap-2">
            <div className={`min-w-0 space-y-2 text-[11px] leading-4 ${t.faint}`}>
              {file.referenceLink && (
                <p className={refsOpen ? "" : "line-clamp-2"}>
                  Reference Link for Edits :{" "}
                  <a
                    href={file.referenceLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`underline underline-offset-2 break-all ${t.strong}`}
                  >
                    {file.referenceLink}
                  </a>
                </p>
              )}
              {file.referenceMessage && (refsOpen || !file.referenceLink) && (
                <p className={refsOpen ? "" : "line-clamp-2"}>
                  Reference Message for Edits : <span className={t.strong}>{file.referenceMessage}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRefsOpen((v) => !v)}
              aria-expanded={refsOpen}
              aria-label={refsOpen ? "Hide references" : "Show references"}
              className={`shrink-0 rounded p-0.5 ${t.strong}`}
            >
              <ChevronDown size={16} className={`transition-transform ${refsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Uploader */}
      <div className={`mt-auto flex items-center gap-3 border-t px-4 py-3 ${t.divider}`}>
        <InitialsAvatar person={file.uploadedBy} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs lg:text-sm ${t.strong}`}>Uploaded by {file.uploadedBy.name}</p>
          <p className={`text-[10px] ${t.faint}`}>{formatStamp(file.uploadedAt)}</p>
        </div>
        <KebabMenu isDark={isDark} actions={actions} label={`${file.name} actions`} />
      </div>
    </div>
  );
}
