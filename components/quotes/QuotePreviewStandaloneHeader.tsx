"use client";

import React from "react";

import QuotePreviewBrandBlock from "@/components/quotes/QuotePreviewBrandBlock";
import type { QuotePreviewTopbarProps } from "@/components/quotes/QuotePreviewPageShell";

export default function QuotePreviewStandaloneHeader({
  actions,
}: QuotePreviewTopbarProps) {
  return (
    <header className="border-b border-white/10 bg-[#111111]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-9">
        <QuotePreviewBrandBlock />
        {actions ? <div className="hidden items-center justify-end gap-3 lg:flex">{actions}</div> : null}
      </div>
    </header>
  );
}
