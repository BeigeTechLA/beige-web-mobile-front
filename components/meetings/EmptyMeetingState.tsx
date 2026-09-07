"use client";

import React from "react";
import Image from "next/image";

interface EmptyMeetingStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

export default function EmptyMeetingState({
  title = "No Meetings Created",
  description = "No meetings available yet. You can create one from any shoot details page.",
  actionLabel,
  onAction,
  isDark = true,
}: EmptyMeetingStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center px-6 py-10 text-center">
      <Image
        src="/images/meeting-empty-state.png"
        alt="No meetings created"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className={`mb-2 text-[28px] font-semibold leading-tight transition-colors ${ isDark ? "text-white" : "text-[#171717]"}`}>
        {title}
      </h3>

      <p className={`max-w-md text-sm leading-6 transition-colors ${isDark ? "text-white/45" : "text-[#667085]"}`}>
        {description}
      </p>

      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#E8D1AB] px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#dcc59f]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}