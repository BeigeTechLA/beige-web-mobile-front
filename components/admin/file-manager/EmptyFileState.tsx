"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyFileStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyFileState({
  title = "No File Uploaded",
  description = "No files have been uploaded for this project yet.",
  actionLabel,
  onAction,
}: EmptyFileStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#111111] px-6 py-10 text-center">
      <Image
        src="/images/file-manager-empty-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className="mb-2 text-[28px] font-semibold leading-tight text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/45">{description}</p>

      {actionLabel && onAction ? (
        <Button
          onClick={onAction}
          className="mt-6 h-11 rounded-xl bg-[#E5D5B8] px-6 text-sm font-semibold text-black hover:bg-[#d4c3a3]"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
