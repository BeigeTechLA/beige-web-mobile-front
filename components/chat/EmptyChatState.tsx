"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyChatStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

export default function EmptyChatState({
  title = "No Messages Found",
  actionLabel,
  onAction,
  isDark = true,
}: EmptyChatStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center p-4 lg:px-6 lg:py-10 text-center">
      <Image
        src="/images/empty-msg-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        className={`mb-6 h-auto w-[130px] lg:w-[184px] ${isDark ? "" : "invert brightness-100 hue-rotate-180"}`}
        priority
      />

      <h3 className={`mb-2 text-lg lg:text-3xl font-semibold leading-tight transition-colors ${
        isDark ? "text-white" : "text-black"}`}>
        {title}
      </h3>

    </div>
  );
}