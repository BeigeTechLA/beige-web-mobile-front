"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface EmptyChatStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyChatState({
  title = "No Messages Found",
  actionLabel,
  onAction,
}: EmptyChatStateProps) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center px-6 py-10 text-center">
      <Image
        src="/images/empty-msg-state.png"
        alt="No file uploaded"
        width={184}
        height={164}
        className="mb-6 h-auto w-[150px] lg:w-[184px]"
        priority
      />

      <h3 className="mb-2 text-[28px] font-semibold leading-tight text-white">{title}</h3>

    </div>
  );
}
