"use client";

import React from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Copy,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "react-hot-toast";

import QuotePreviewDocument from "@/components/admin/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import type { SalesQuoteDetailData } from "@/lib/api";
import { getQuoteText } from "@/lib/quoteDetail";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

type QuotePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  quote: SalesQuoteDetailData | null;
  quoteId?: string | null;
  isLoading?: boolean;
};

const PreviewActionButton = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <Button type="button" onClick={onClick} className={className}>
    {children}
  </Button>
);

export default function QuotePreviewModal({
  open,
  onClose,
  quote,
  quoteId,
  isLoading = false,
}: QuotePreviewModalProps) {
  if (!open) {
    return null;
  }

  const quoteData = unwrapSalesQuoteDetail(quote);
  const resolvedQuoteId = String(
    quoteData?.sales_quote_id ?? quoteData?.quote_id ?? quoteData?.id ?? quoteId ?? ""
  );
  const quoteNumber =
    getQuoteText(quoteData?.quote_number) ||
    (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const shareValue =
      typeof window !== "undefined" && resolvedQuoteId
        ? `${window.location.origin}${window.location.pathname}?quoteId=${resolvedQuoteId}`
        : quoteNumber;

    await navigator.clipboard.writeText(shareValue);
    toast.success("Quote link copied");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSendQuote = () => {
    toast("Send quote action is not available yet.");
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/85 p-3 backdrop-blur-md sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-[1520px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/10 bg-[#171717] px-4 text-white hover:bg-[#1F1F1F]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <div className="hidden items-center gap-3 md:flex">
            <PreviewActionButton
              onClick={() => {
                void handleCopy();
              }}
              className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
            >
              <Copy size={18} className="mr-2" />
              Copy Link
            </PreviewActionButton>
            <PreviewActionButton
              onClick={handlePrint}
              className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
            >
              <ArrowDownToLine size={18} className="mr-2" />
              Download PDF
            </PreviewActionButton>
            <PreviewActionButton
              onClick={handleSendQuote}
              className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
            >
              <Send size={18} className="mr-2" />
              Send Quote
            </PreviewActionButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center text-[#CFCFD3]">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Loading quote preview...
            </div>
          ) : !quoteData ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/10 bg-[#151515] px-6 text-center">
              <p className="text-lg font-semibold text-white">Preview data unavailable</p>
              <p className="text-sm text-[#8B8B90]">
                The quote was saved, but the preview response could not be loaded.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 lg:mb-8">
                <div className="flex flex-col gap-2 md:hidden">
                  <PreviewActionButton
                    onClick={() => {
                      void handleCopy();
                    }}
                    className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                  >
                    <Copy size={18} className="mr-2" />
                    Copy Link
                  </PreviewActionButton>
                  <div className="grid grid-cols-2 gap-2">
                    <PreviewActionButton
                      onClick={handlePrint}
                      className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                    >
                      <ArrowDownToLine size={18} className="mr-2" />
                      PDF
                    </PreviewActionButton>
                    <PreviewActionButton
                      onClick={handleSendQuote}
                      className="h-11 rounded-xl bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                    >
                      <Send size={18} className="mr-2" />
                      Send
                    </PreviewActionButton>
                  </div>
                </div>

                <div>
                  <h2 className="text-[20px] font-medium text-white lg:text-[30px]">Quote Preview</h2>
                  <p className="text-[14px] text-[#A1A1AA]">Review before sending to client</p>
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
