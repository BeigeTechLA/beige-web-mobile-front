"use client";

import React from "react";
import { ArrowDownToLine, ArrowLeft, Copy, Loader2, Send } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

import QuotePreviewDocument from "@/components/admin/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { getQuoteText } from "@/lib/quoteDetail";
import {
  buildPreviewQuoteFromSummary,
  readQuoteSummarySnapshot,
} from "@/lib/quoteSummary";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
  title?: string;
  breadcrumbOverrides?: Record<string, string>;
};

type QuotePreviewPageShellProps = {
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
  baseHref: string;
  createHref: string;
  summaryStorageKey: string;
};

const ActionButton = ({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) => (
  <Button type="button" onClick={onClick} className={className}>
    {children}
  </Button>
);

export default function QuotePreviewPageShell({
  TopbarComponent,
  baseHref,
  createHref,
  summaryStorageKey,
}: QuotePreviewPageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryQuoteId = searchParams.get("quoteId");

  const [quote, setQuote] = React.useState<SalesQuoteDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadQuotePreview = async () => {
      setLoading(true);
      setErrorMessage(null);

      if (!queryQuoteId) {
        const snapshot = readQuoteSummarySnapshot(summaryStorageKey);

        if (!isMounted) {
          return;
        }

        if (!snapshot) {
          setQuote(null);
          setErrorMessage("No preview data is available.");
          setLoading(false);
          return;
        }

        setQuote(buildPreviewQuoteFromSummary(snapshot));
        setLoading(false);
        return;
      }

      try {
        const response = await salesApi.getQuoteDetail(queryQuoteId);

        if (response?.error || response?.success === false) {
          throw new Error(
            typeof response?.error === "string" ? response.error : "Failed to fetch quote preview"
          );
        }

        const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);

        if (!quoteDetail) {
          throw new Error("Quote preview is unavailable");
        }

        if (!isMounted) {
          return;
        }

        setQuote(quoteDetail);
      } catch (error) {
        console.error("Failed to load quote preview", error);

        if (!isMounted) {
          return;
        }

        setQuote(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to fetch quote preview"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadQuotePreview();

    return () => {
      isMounted = false;
    };
  }, [queryQuoteId, summaryStorageKey]);

  const quoteNumber =
    getQuoteText(quote?.quote_number) ||
    (queryQuoteId ? `Q-${queryQuoteId}` : "Draft Quote");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(baseHref);
  };

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const shareValue =
      typeof window !== "undefined" && queryQuoteId ? window.location.href : quoteNumber;

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

  const breadcrumbOverrides = React.useMemo(
    () => ({
      quotes: "Quote",
      preview: "Quote Preview",
    }),
    []
  );

  const topbarActions = (
    <>
      <ActionButton
        onClick={() => {
          void handleCopy();
        }}
        className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
      >
        <Copy size={18} className="mr-2" />
        Copy Link
      </ActionButton>
      <ActionButton
        onClick={handlePrint}
        className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
      >
        <ArrowDownToLine size={18} className="mr-2" />
        Download PDF
      </ActionButton>
      <ActionButton
        onClick={handleSendQuote}
        className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
      >
        <Send size={18} className="mr-2" />
        Send Quote
      </ActionButton>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <TopbarComponent
        pathname={pathname}
        actions={topbarActions}
        breadcrumbOverrides={breadcrumbOverrides}
      />

      <div className="px-4 pb-10 pt-6 lg:px-9 lg:pb-14 lg:pt-8">
        <div className="mb-6 flex flex-col gap-2 lg:hidden">
          <ActionButton
            onClick={() => {
              void handleCopy();
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
          >
            <Copy size={18} className="mr-2" />
            Copy Link
          </ActionButton>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              onClick={handlePrint}
              className="h-11 rounded-xl border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
            >
              <ArrowDownToLine size={18} className="mr-2" />
              PDF
            </ActionButton>
            <ActionButton
              onClick={handleSendQuote}
              className="h-11 rounded-xl bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
            >
              <Send size={18} className="mr-2" />
              Send
            </ActionButton>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-[15px] text-[#D4D4D4] transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6 lg:mb-8">
          <h2 className="text-[20px] font-medium text-white lg:text-[30px]">Quote Preview</h2>
          <p className="text-[14px] text-[#A1A1AA]">Review before sending to client</p>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-white/10 bg-[#171717] text-[#CFCFD3]">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Loading quote preview...
          </div>
        ) : quote ? (
          <QuotePreviewDocument quote={quote} quoteId={queryQuoteId} />
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-white/10 bg-[#151515] px-6 text-center">
            <p className="text-lg font-semibold text-white">Preview data unavailable</p>
            <p className="max-w-[480px] text-sm text-[#8B8B90]">
              {errorMessage || "The quote preview could not be loaded."}
            </p>
            <Button
              type="button"
              onClick={() => router.push(createHref)}
              className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
            >
              Go to Quote Builder
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
