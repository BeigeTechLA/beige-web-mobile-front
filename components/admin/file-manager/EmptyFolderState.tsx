"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyFileStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

export default function EmptyFileState({
  title = "No Project Folder Created",
  description = "No project folders have been created.",
  actionLabel,
  onAction,
  isDark = true
}: EmptyFileStateProps) {
  return (
    <div className={`flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center transition-all duration-200 ${isDark
        ? "border-white/5 bg-[#111111]"
        : "border-[#D7D7D7] bg-white shadow-sm"
      }`}>
      <Image
        src="/images/file-manager-empty-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className={`mb-2 text-[28px] font-semibold leading-tight transition-colors ${isDark ? "text-white" : "text-black"}`}>
        {title}
      </h3>

      <p className={`max-w-md text-sm transition-colors ${isDark ? "text-white/45" : "text-[#727272]"}`}>
        {description}
      </p>
    </div>
  );
}