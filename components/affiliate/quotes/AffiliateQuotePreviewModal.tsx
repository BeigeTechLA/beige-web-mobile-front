"use client";

import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import QuotePreviewDocument from "@/components/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { type SalesQuoteDetailData } from "@/lib/api";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AffiliateQuotePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  quote: SalesQuoteDetailData | null;
  quoteId?: string | null;
  isLoading?: boolean;
};

export default function AffiliateQuotePreviewModal({
  open,
  onClose,
  quote,
  quoteId,
  isLoading = false,
}: AffiliateQuotePreviewModalProps) {
  const { isDark } = useResolvedTheme();
  const quoteData = unwrapSalesQuoteDetail(quote);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[110] p-3 backdrop-blur-md sm:p-4 lg:p-6 ${
        isDark ? "bg-black/85" : "bg-black/50"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto flex h-full w-full max-w-[1520px] flex-col overflow-hidden rounded-[28px] shadow-[0_35px_120px_rgba(0,0,0,0.18)] ${
          isDark ? "border border-white/10 bg-[#111111]" : "border border-[#DFDDDD] bg-[#F4F5F7]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 ${
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
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          {isLoading ? (
            <div
              className={`flex min-h-[420px] items-center justify-center ${
                isDark ? "text-[#CFCFD3]" : "text-[#60646C]"
              }`}
            >
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Loading quote preview...
            </div>
          ) : !quoteData ? (
            <div
              className={`flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[24px] px-6 text-center ${
                isDark
                  ? "border border-dashed border-white/10 bg-[#151515]"
                  : "border border-dashed border-[#DFDDDD] bg-white"
              }`}
            >
              <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>
                Preview data unavailable
              </p>
              <p className={`text-sm ${isDark ? "text-[#8B8B90]" : "text-[#60646C]"}`}>
                The quote was saved, but the preview response could not be loaded.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:mb-8">
                <div>
                  <h2 className={`text-[20px] font-medium lg:text-[30px] ${isDark ? "text-white" : "text-black"}`}>
                    Quote Preview
                  </h2>
                  <p className={`text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-[#60646C]"}`}>
                    Review quote details
                  </p>
                </div>
              </div>

              <QuotePreviewDocument quote={quoteData} quoteId={quoteId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
