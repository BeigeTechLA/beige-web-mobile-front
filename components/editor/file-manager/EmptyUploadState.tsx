"use client";

import React from "react";
import { FileImage, Folder, Search, Upload } from "lucide-react";
import { fmTheme } from "./theme";

/** "Upload your Edited Files" empty state. Doubles as a drop zone when `onFiles` is set. */
export default function EmptyUploadState({
  isDark,
  title = "Upload your Edited Files",
  subtitle = "Upload and organize edited files for review.",
  onUploadClick,
  onFiles,
}: {
  isDark: boolean;
  title?: string;
  subtitle?: string;
  onUploadClick?: () => void;
  onFiles?: (files: FileList) => void;
}) {
  const t = fmTheme(isDark);
  const [dragging, setDragging] = React.useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (!onFiles) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!onFiles) return;
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 lg:py-20 text-center transition-colors ${dragging
        ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
        : isDark ? "border-transparent" : "border-transparent"}`}
    >
      {/* folder + photo + magnifier illustration */}
      <div className="relative h-24 w-28" aria-hidden="true">
        <FileImage size={46} strokeWidth={1} className={`absolute left-9 top-0 rotate-12 ${isDark ? "text-[#E8D1AB]/70" : "text-[#9C7B45]/70"}`} />
        <Folder size={72} strokeWidth={1} className={`absolute left-0 top-5 ${isDark ? "fill-[#1C1C1C] text-[#E8D1AB]/70" : "fill-white text-[#9C7B45]/70"}`} />
        <Search size={40} strokeWidth={1.2} className={`absolute bottom-0 right-0 ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`} />
      </div>
      <p className={`mt-6 text-base lg:text-lg font-medium ${t.strong}`}>{title}</p>
      <p className={`mt-1 text-xs lg:text-sm ${t.faint}`}>{subtitle}</p>
      {onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          className={`mt-5 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-xs lg:text-sm font-semibold transition-colors ${t.primaryBtn}`}
        >
          <Upload size={15} /> Upload Files
        </button>
      )}
    </div>
  );
}
