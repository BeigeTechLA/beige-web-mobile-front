"use client";

import React from "react";

import QuotePreviewBrandBlock from "@/components/quotes/QuotePreviewBrandBlock";
import type { QuotePreviewTopbarProps } from "@/components/quotes/QuotePreviewPageShell";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export default function QuotePreviewStandaloneHeader({
  actions,
}: QuotePreviewTopbarProps) {
  const { isDark } = useResolvedTheme();

  return (
    <header
      className={`border-b ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-9">
        <QuotePreviewBrandBlock />
        {actions ? <div className="hidden items-center justify-end gap-3 lg:flex">{actions}</div> : null}
      </div>
    </header>
  );
}
