"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

import QuoteSummaryContent from "@/components/admin/quotes/QuoteSummaryContent";
import { Button } from "@/components/ui/button";
import type { QuoteSummarySnapshot } from "@/lib/quoteSummary";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type QuoteSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  snapshot: QuoteSummarySnapshot | null;
  onPreview: () => void;
  previewDisabled?: boolean;
};

export default function QuoteSummaryModal({
  open,
  onClose,
  snapshot,
  onPreview,
  previewDisabled = false,
}: QuoteSummaryModalProps) {
  const { isDark } = useResolvedTheme();

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[105] p-3 backdrop-blur-md sm:p-4 lg:p-6 ${
        isDark ? "bg-black/85" : "bg-black/50"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-[28px] shadow-[0_35px_120px_rgba(0,0,0,0.18)] ${
          isDark ? "border border-white/10 bg-[#111111]" : "border border-[#DFDDDD] bg-[#F4F5F7]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 ${
            isDark ? "border-b border-white/10" : "border-b border-[#DFDDDD] bg-white"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className={`h-11 rounded-xl px-4 ${
              isDark
                ? "border border-white/10 bg-[#171717] text-white hover:bg-[#1F1F1F]"
                : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
            }`}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <Button
            type="button"
            onClick={onPreview}
            disabled={!snapshot || previewDisabled}
            className="hidden lg:block h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90 disabled:opacity-60"
          >
            Preview Quote
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <QuoteSummaryContent
            snapshot={snapshot}
            onPreview={onPreview}
            previewDisabled={!snapshot || previewDisabled}
            emptyStateAction={onClose}
            emptyStateLabel="Back"
            showMobilePreviewBar={false}
          />
        </div>

         <div
          className={`flex items-center justify-between lg:hidden gap-3 px-4 py-4 sm:px-6 lg:px-8 ${
            isDark ? "border-b border-white/10" : "border-b border-[#DFDDDD] bg-white"
          }`}
        >
          <Button
            type="button"
            onClick={onPreview}
            disabled={!snapshot || previewDisabled}
            className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90 disabled:opacity-60"
          >
            Preview Quote
          </Button>
        </div>
      </div>
    </div>
  );
}
