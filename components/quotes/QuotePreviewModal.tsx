"use client";

import React from "react";
import { ArrowLeft, Check, Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import QuotePreviewDocument from "@/components/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { getQuoteText } from "@/lib/quoteDetail";
import { buildAbsoluteQuotePreviewUrl } from "@/lib/quotePreview";
import { getQuoteSendSuccessMessage, isQuoteAlreadySent } from "@/lib/quoteSend";
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
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) => (
  <Button type="button" onClick={onClick} disabled={disabled} className={className}>
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
  const [copied, setCopied] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [hasSentQuote, setHasSentQuote] = React.useState(false);
  const copyResetTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  const quoteData = unwrapSalesQuoteDetail(quote);
  const resolvedQuoteId = String(
    quoteData?.sales_quote_id ?? quoteData?.quote_id ?? quoteData?.id ?? quoteId ?? ""
  );
  const quoteNumber =
    getQuoteText(quoteData?.quote_number) ||
    (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");
  const quoteSentFromData = isQuoteAlreadySent(quoteData);
  const quoteSent = hasSentQuote || quoteSentFromData;
  const canSendQuote = Boolean(resolvedQuoteId) && !isLoading && !isSending && !quoteSent;

  React.useEffect(() => {
    setHasSentQuote(quoteSentFromData);
  }, [quoteSentFromData, resolvedQuoteId]);

  if (!open) {
    return null;
  }

  const handleSendQuote = async () => {
    if (!resolvedQuoteId) {
      toast.error("Save the quote before sending it.");
      return;
    }

    if (quoteSent) {
      toast("Quote proposal email has already been sent.");
      return;
    }

    setIsSending(true);

    try {
      const response = await salesApi.sendQuoteProposal(resolvedQuoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to send quote"
        );
      }

      const updatedQuote = unwrapSalesQuoteDetail(response?.data ?? null);
      setHasSentQuote(true);
      toast.success(getQuoteSendSuccessMessage(updatedQuote ?? quoteData));
    } catch (error) {
      console.error("Failed to send quote", error);
      toast.error(error instanceof Error ? error.message : "Failed to send quote");
    } finally {
      setIsSending(false);
    }
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
              className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
            >
              {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {copied ? "Copied" : "Copy Link"}
            </PreviewActionButton>
            <PreviewActionButton
              onClick={() => {
                void handleSendQuote();
              }}
              disabled={!canSendQuote}
              className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
            >
              {isSending ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : quoteSent ? (
                <Check size={18} className="mr-2" />
              ) : (
                <Send size={18} className="mr-2" />
              )}
              {isSending ? "Sending..." : quoteSent ? "Quote Sent" : "Send Quote"}
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
                    className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                  >
                    {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                    {copied ? "Copied" : "Copy Link"}
                  </PreviewActionButton>
                  <PreviewActionButton
                    onClick={() => {
                      void handleSendQuote();
                    }}
                    disabled={!canSendQuote}
                    className="h-11 rounded-xl bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="mr-2 animate-spin" />
                    ) : quoteSent ? (
                      <Check size={18} className="mr-2" />
                    ) : (
                      <Send size={18} className="mr-2" />
                    )}
                    {isSending ? "Sending..." : quoteSent ? "Quote Sent" : "Send"}
                  </PreviewActionButton>
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
