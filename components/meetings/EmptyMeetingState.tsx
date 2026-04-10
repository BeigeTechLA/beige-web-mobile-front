"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyMeetingStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyFileState({
  title = "No Meetings Created",
  description = "No meetings available yet. You can create one from any shoot details page.",
  actionLabel,
  onAction,
}: EmptyMeetingStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#111111] px-6 py-10 text-center">
      <Image
        src="/images/meeting-empty-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className="mb-2 text-[28px] font-semibold leading-tight text-white">{title}</h3>
      <p className="max-w-md text-sm text-white/45">{description}</p>

    </div>
  );
}
