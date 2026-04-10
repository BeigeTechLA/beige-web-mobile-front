"use client";

import React from "react";
import { ArrowLeft, Check, Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import QuotePreviewDocument from "@/components/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import {
  buildAbsoluteQuotePreviewUrl,
  createSignedQuotePreviewUrl,
  normalizeQuotePreviewUrlForClient,
  resolveSecureQuotePreviewKey,
  resolveSecureQuotePreviewUrl,
} from "@/lib/quotePreview";
import { getQuoteSendSuccessMessage, isQuoteAlreadySent } from "@/lib/quoteSend";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

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
  const { isDark } = useResolvedTheme();
  const [copied, setCopied] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isPreparingLink, setIsPreparingLink] = React.useState(false);
  const [hasSentQuote, setHasSentQuote] = React.useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = React.useState<string | null>(null);
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
  const secureQuotePreviewKey = resolveSecureQuotePreviewKey(quoteData);
  const secureQuotePreviewUrl =
    normalizeQuotePreviewUrlForClient(
      resolveSecureQuotePreviewUrl(quoteData),
      secureQuotePreviewKey
    ) ??
    (secureQuotePreviewKey
      ? buildAbsoluteQuotePreviewUrl({ quoteKey: secureQuotePreviewKey })
      : null);
  const copyQuoteUrl = secureQuotePreviewUrl ?? generatedPreviewUrl;
  const quoteSentFromData = isQuoteAlreadySent(quoteData);
  const quoteSent = hasSentQuote || quoteSentFromData;
  const canSendQuote = Boolean(resolvedQuoteId) && !isLoading && !isSending && !quoteSent;

  React.useEffect(() => {
    setHasSentQuote(quoteSentFromData);
  }, [quoteSentFromData, resolvedQuoteId]);

  if (!open) {
    return null;
  }

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Copy is not supported in this browser");
      return;
    }

    try {
      let shareValue = copyQuoteUrl;

      if (!shareValue) {
        if (!resolvedQuoteId) {
          throw new Error("Save the quote before copying the preview link.");
        }

        setIsPreparingLink(true);
        shareValue = await createSignedQuotePreviewUrl(resolvedQuoteId);
        setGeneratedPreviewUrl(shareValue);
      }

      await navigator.clipboard.writeText(shareValue);
      setCopied(true);

      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);

      toast.success("Quote link copied successfully");
    } catch (error) {
      console.error("Failed to copy quote preview link", error);
      toast.error(error instanceof Error ? error.message : "Failed to copy quote link");
    } finally {
      setIsPreparingLink(false);
    }
  };

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

          <div className="hidden items-center gap-3 md:flex">
            <PreviewActionButton
              onClick={() => {
                void handleCopy();
              }}
              disabled={isPreparingLink}
              className={`h-11 rounded-xl px-4 ${
                isDark
                  ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                  : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
              }`}
            >
              {isPreparingLink ? <Loader2 size={18} className="mr-2 animate-spin" /> : copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {isPreparingLink ? "Preparing..." : copied ? "Copied" : "Copy Link"}
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
            <div className={`flex min-h-[420px] items-center justify-center ${isDark ? "text-[#CFCFD3]" : "text-[#60646C]"}`}>
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
                <div className="flex flex-col gap-2 md:hidden">
                  <PreviewActionButton
                    onClick={() => {
                      void handleCopy();
                    }}
                    disabled={isPreparingLink}
                    className={`h-11 rounded-xl ${
                      isDark
                        ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                        : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
                    }`}
                  >
                    {isPreparingLink ? <Loader2 size={18} className="mr-2 animate-spin" /> : copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                    {isPreparingLink ? "Preparing..." : copied ? "Copied" : "Copy Link"}
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
                  <h2 className={`text-[20px] font-medium lg:text-[30px] ${isDark ? "text-white" : "text-black"}`}>
                    Quote Preview
                  </h2>
                  <p className={`text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-[#60646C]"}`}>
                    Review before sending to client
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
