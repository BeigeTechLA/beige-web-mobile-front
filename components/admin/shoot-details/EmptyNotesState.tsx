"use client";

import React from "react";
import Image from "next/image";

interface EmptyNotesStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
}

export default function EmptyNotesState({
  title = "No Notes Found",
  description = "You don’t have any notes yet. Create your first note to get started.",
  actionLabel = "Create Note",
  onAction,
  isDark = true,
}: EmptyNotesStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center px-6 py-10 text-center">
      <Image
        src="/images/empty-notes-state.png"
        alt="Empty notes state"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className={`mb-2 text-[28px] font-semibold leading-tight transition-colors ${isDark ? "text-white" : "text-[#171717]"}`}>
        {title}
      </h3>

      <p className={`max-w-md text-sm leading-6 transition-colors ${ isDark ? "text-white/50" : "text-[#667085]"}`}>
        {description}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#E8D1AB] px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}