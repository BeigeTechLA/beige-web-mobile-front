"use client";

import React from "react";
import { Upload } from "lucide-react";
import { fmTheme } from "./theme";
import Image from "next/image";

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
      <Image
        src="/images/file-manager-empty-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        // className="mb-6 h-auto w-[150px] lg:w-[184px]"
        className={`h-auto w-[130px] lg:w-[184px] ${isDark ? "" : "invert brightness-100 hue-rotate-180"}`}
        priority
      />
      <p className={`mt-5 text-base lg:text-2xl font-medium ${t.strong}`}>{title}</p>
      <p className={`mt-1 text-sm lg:text-base ${isDark ? "text-[#848484]":"text-black/70"}`}>{subtitle}</p>
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
