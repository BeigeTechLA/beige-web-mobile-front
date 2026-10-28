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
    return <img src={file.previewUrl} alt={file.name} className={`rounded-lg h-full w-full lg:h-[281px] object-cover ${className}`} />;
  }
  if (file.previewUrl && file.kind === "video") {
    return <video src={file.previewUrl} className={`rounded-lg h-full w-full lg:h-[281px] object-cover ${className}`} muted playsInline preload="metadata" />;
  }

  return (
    <div className={`rounded-lg flex h-full w-full lg:min-h-[281px] items-center justify-center ${isDark ? "bg-[#262626]" : "bg-[#EFEFEF]"} ${className}`}>
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? "bg-[#202020] text-white" : "bg-[#CFCFCF] text-[#333]"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="82" height="82" viewBox="0 0 82 82" fill="none">
          <path opacity="0.4" d="M69.9801 34.7856H60.1148C52.0245 34.7856 45.4363 28.1973 45.4363 20.1071V10.2417C45.4363 8.36425 43.9001 6.82812 42.0226 6.82812H27.5489C17.035 6.82812 8.53516 13.6553 8.53516 25.8419V56.0865C8.53516 68.2731 17.035 75.1003 27.5489 75.1003H54.3799C64.8938 75.1003 73.3937 68.2731 73.3937 56.0865V38.1992C73.3937 36.3217 71.8576 34.7856 69.9801 34.7856Z" fill="white" />
          <path d="M53.9365 7.54798C52.5369 6.1484 50.1133 7.10421 50.1133 9.04996V20.9635C50.1133 25.9473 54.3462 30.0778 59.5007 30.0778C62.7436 30.1119 67.2496 30.1119 71.107 30.1119C73.0527 30.1119 74.0768 27.8248 72.7114 26.4594C67.7958 21.5096 58.9887 12.6001 53.9365 7.54798Z" fill="white" />
          <path d="M41.9177 50.2492C40.9277 49.2592 39.2892 49.2592 38.2992 50.2492L35.8414 52.707V38.404C35.8414 37.0044 34.6808 35.8438 33.2812 35.8438C31.8817 35.8438 30.721 37.0044 30.721 38.404V52.707L28.2632 50.2492C27.2733 49.2592 25.6347 49.2592 24.6448 50.2492C23.6549 51.2391 23.6549 52.8776 24.6448 53.8676L31.472 60.6948C31.5062 60.7289 31.5403 60.7289 31.5403 60.7631C31.7451 60.9679 32.0182 61.1386 32.2913 61.2751C32.6326 61.3775 32.9399 61.4458 33.2812 61.4458C33.6226 61.4458 33.9298 61.3775 34.237 61.241C34.5443 61.1044 34.8174 60.9338 35.0904 60.6948L41.9177 53.8676C42.9076 52.8776 42.9076 51.2391 41.9177 50.2492Z" fill="white" />
        </svg>
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
        <p className={`truncate text-sm lg:text-base lg:w-[150px] ${t.strong}`} title={`${file.name} - ${file.version}`}>
          {file.name} - {file.version}
        </p>
        {file.isLatest && <LatestBadge
          version={view === "grid" && file.status !== "selected_for_edits" ? `V${file.versionNumber}` : undefined}
          cornerType="rounded-sm"
        />}
      </div>
      <span className={`flex shrink-0 items-center gap-1 text-sm lg:text-base font-medium ${t.strong}`} aria-label={`${file.comments.length} comments`}>
        {file.comments.length} <MessageCircle size={24} />
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
      <div className={`overflow-hidden rounded-xl border ${isDark ? "bg-[#111111] border-white/30" : "bg-[#FAFAFA] border-[#ECECEC]"} ${ring}`}>
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
    <div className={`flex flex-col rounded-xl border ${isDark ? "bg-[#111111] border-white/30" : "bg-[#FAFAFA] border-[#ECECEC]"} ${ring}`}>
      <div className="p-4 lg:p-5 space-y-3 lg:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {check}
            <span className={`text-sm lg:text-base ${t.strong}`}>ID : {file.code}</span>
          </div>
          <span className={`text-sm lg:text-base ${t.strong}`}>{file.sizeLabel}</span>
        </div>

        {/* Preview */}
        <button type="button" onClick={onOpen} className="w-full rounded-lg" aria-label={`Preview ${file.name}`}>
          <FilePreview file={file} isDark={isDark} />
        </button>

        {/* Name + status */}
        <div className="space-y-2">
          {titleRow}
          <StatusTag label={status.label} tone={status.tone} />
        </div>
      </div>


      {/* References + Uploaded info (expandable) */}
      {
        file.referenceLink &&
        <>
          <div className={`border-t p-4 lg:p-5 ${t.divider}`}>
            <div className="flex items-start justify-between gap-2">
              <div className={`min-w-0 space-y-3 text-xs lg:text-sm ${isDark ? "text-[#CDC5C5]/60" : "text-black/70"}`}>
                {file.referenceLink && (
                  <p className={refsOpen ? "" : "line-clamp-2"}>
                    Reference Link for Edits :{" "}
                    <a
                      href={file.referenceLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`underline underline-offset-2 break-all ${t.gold}`}
                    >
                      {file.referenceLink}
                    </a>
                  </p>
                )}
                {file.referenceMessage && (refsOpen || !file.referenceLink) && (
                  <p className={refsOpen ? "" : "line-clamp-2"}>
                    Reference Message for Edits : <span className={t.gold}>{file.referenceMessage}</span>
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
                <ChevronDown className={`h-4 w-4 lg:h-6 lg:w-6 transition-transform ${refsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </>
      }

      {/* Uploader */}
      <div className={`mt-auto flex items-center gap-3 border-t p-4 lg:p-5 ${t.divider}`}>
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
