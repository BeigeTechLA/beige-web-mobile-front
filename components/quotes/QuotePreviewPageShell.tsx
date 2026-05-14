"use client";

import React, {useState, useEffect, useRef} from "react";
import { ArrowLeft, Check, Copy, Loader2, Send } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import QuotePreviewBrandBlock from "@/components/quotes/QuotePreviewBrandBlock";
import QuotePreviewDocument from "@/components/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import {
  createSignedQuotePreviewUrl,
  fetchQuotePreviewByKey,
} from "@/lib/quotePreview";
import { getQuoteSendSuccessMessage, isQuoteAlreadySent } from "@/lib/quoteSend";
import {
  buildPreviewQuoteFromSummary,
  readQuoteSummarySnapshot,
} from "@/lib/quoteSummary";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import SignatureModal from "@/components/signature/SignatureModal";
import { ServiceAgreementModal } from "../common/ServiceAgreementModal";

export type QuotePreviewTopbarProps = {
  pathname: string;
  actions?: React.ReactNode;
  title?: string;
  breadcrumbOverrides?: Record<string, string>;
};

type QuotePreviewPageShellProps = {
  TopbarComponent: React.ComponentType<QuotePreviewTopbarProps>;
  baseHref?: string;
  createHref?: string;
  summaryStorageKey?: string;
  fallbackHref?: string;
  showActionButtons?: boolean;
  showBackButton?: boolean;
  showIntroHeader?: boolean;
  quoteDetailMode?: "private" | "public";
};

type QuoteActivityLike = {
  metadata?: {
    booking_id?: number | string;
    [key: string]: unknown;
  } | null;
  metadata_json?: string | null;
};

const ActionButton = ({
  onClick,
  className,
  children,
  disabled = false,
}: {
  onClick: () => void;
  className: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Button type="button" onClick={onClick} disabled={disabled} className={className}>
    {children}
  </Button>
);

const getActivityBookingId = (activity: QuoteActivityLike | null | undefined) => {
  if (!activity) {
    return null;
  }

  const directBookingId = activity.metadata?.booking_id;
  if (
    directBookingId !== undefined &&
    directBookingId !== null &&
    String(directBookingId).trim()
  ) {
    return String(directBookingId);
  }

  if (activity.metadata_json) {
    try {
      const parsed =
        typeof activity.metadata_json === "string"
          ? JSON.parse(activity.metadata_json)
          : activity.metadata_json;

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "booking_id" in parsed &&
        parsed.booking_id !== undefined &&
        parsed.booking_id !== null &&
        String(parsed.booking_id).trim()
      ) {
        return String(parsed.booking_id);
      }
    } catch {
      return null;
    }
  }

  return null;
};

export default function QuotePreviewPageShell({
  TopbarComponent,
  baseHref,
  createHref,
  summaryStorageKey,
  fallbackHref = "/",
  showActionButtons = true,
  showBackButton = true,
  showIntroHeader = true,
  quoteDetailMode = "private",
}: QuotePreviewPageShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryQuoteKey = searchParams.get("quoteKey");
  const queryQuoteId = searchParams.get("quoteId");
  const { isDark } = useResolvedTheme();

  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreparingLink, setIsPreparingLink] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [acceptServiceAgreement, setAcceptServiceAgreement] = useState(true);
  const [isServiceAgreementOpen, setIsServiceAgreementOpen] = useState(false);
  const [isConvertingToBooking, setIsConvertingToBooking] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const paymentStorageKey =
    quoteDetailMode === "public"
      ? `public-quote-booking:${queryQuoteKey || queryQuoteId || "unknown"}`
      : null;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadQuotePreview = async () => {
      setLoading(true);
      setErrorMessage(null);

      if (!queryQuoteKey && !queryQuoteId) {
        if (!summaryStorageKey) {
          setQuote(null);
          setErrorMessage("No quote preview link was provided.");
          setLoading(false);
          return;
        }

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
        const response =
          quoteDetailMode === "public"
            ? queryQuoteKey
              ? await fetchQuotePreviewByKey(queryQuoteKey)
              : {
                  success: false,
                  error:
                    "Legacy quote preview links using quoteId are no longer supported. Request a new secure quote link.",
                }
            : await salesApi.getQuoteDetail(queryQuoteId);

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
  }, [queryQuoteId, queryQuoteKey, quoteDetailMode, summaryStorageKey]);

  const resolvedQuoteId = String(
    quote?.sales_quote_id ?? quote?.quote_id ?? quote?.id ?? queryQuoteId ?? ""
  ).trim();
  const isQuoteSigned = Boolean(
    quote?.signed_at ||
    quote?.signature_base64 ||
    quote?.signature_path ||
    (quote as Record<string, unknown> | null)?.["signer_name"]
  );
  const quoteActivities = Array.isArray(quote?.activities) ? quote.activities : [];
  const existingBookingId = React.useMemo(() => {
    const directBookingId = String(
      (quote as Record<string, unknown> | null)?.booking_id ??
        (quote?.converted_booking_details as Record<string, unknown> | null)?.booking_id ??
        ""
    ).trim();

    if (directBookingId) {
      return directBookingId;
    }

    for (const activity of quoteActivities) {
      const activityBookingId = getActivityBookingId(activity as QuoteActivityLike);
      if (activityBookingId) {
        return activityBookingId;
      }
    }

    return "";
  }, [quote, quoteActivities]);
  const quoteSent = isQuoteAlreadySent(quote);
  const canSendQuote =
    showActionButtons && !loading && Boolean(resolvedQuoteId);
  const copyQuoteUrl =
    generatedPreviewUrl ||
    (typeof window !== "undefined" && queryQuoteKey
      ? `${window.location.origin}/quotes/preview?quoteKey=${encodeURIComponent(queryQuoteKey)}`
      : null);
  const effectivePaymentBookingId = String(paymentBookingId || existingBookingId || "").trim();

  useEffect(() => {
    if (!paymentStorageKey || typeof window === "undefined") {
      return;
    }

    const savedBookingId = window.localStorage.getItem(paymentStorageKey);
    if (savedBookingId && String(savedBookingId).trim()) {
      setPaymentBookingId(String(savedBookingId).trim());
    }
  }, [paymentStorageKey]);

  useEffect(() => {
    if (!paymentStorageKey || typeof window === "undefined") {
      return;
    }

    if (effectivePaymentBookingId) {
      window.localStorage.setItem(paymentStorageKey, effectivePaymentBookingId);
    }
  }, [effectivePaymentBookingId, paymentStorageKey]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(baseHref || fallbackHref);
  };

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

    const isResend = quoteSent;

    setIsSending(true);

    try {
      const response = await salesApi.sendQuoteProposal(resolvedQuoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to send quote"
        );
      }

      const updatedQuote = unwrapSalesQuoteDetail(response?.data ?? null);
      setQuote((current) =>
        updatedQuote ??
        (current ? { ...current, status: "sent", quote_status: "sent" } : current)
      );

      toast.success(
        isResend
          ? "Quote resent successfully."
          : getQuoteSendSuccessMessage(updatedQuote ?? quote)
      );
    } catch (error) {
      console.error("Failed to send quote", error);
      toast.error(error instanceof Error ? error.message : "Failed to send quote");
    } finally {
      setIsSending(false);
    }
  };

  const resolveBookingTimingFromQuote = (quoteData: SalesQuoteDetailData | null) => {
    const record = (quoteData as Record<string, any> | null) || null;
    const converted = (record?.converted_booking_details || {}) as Record<string, any>;
    const convertedDays = Array.isArray(converted?.booking_days) ? converted.booking_days : [];
    const rootDays = Array.isArray(record?.booking_days) ? record.booking_days : [];
    const firstDay = convertedDays[0] || rootDays[0] || null;
    const startDate = String(
      converted?.start_date ||
      firstDay?.date ||
      firstDay?.event_date ||
      record?.event_date ||
      record?.shoot_date ||
      ""
    ).trim();
    const startTime = String(
      converted?.start_time ||
      firstDay?.start_time ||
      record?.start_time ||
      record?.event_start_time ||
      ""
    ).trim().slice(0, 5);
    const endTime = String(
      converted?.end_time ||
      firstDay?.end_time ||
      record?.end_time ||
      record?.event_end_time ||
      ""
    ).trim().slice(0, 5);
    const location = String(
      converted?.location ||
      record?.location ||
      record?.event_location ||
      ""
    ).trim();

    if (!startDate || !startTime || !endTime) {
      return null;
    }

    return {
      booking_type: "single_day" as const,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
      start_date: startDate,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      location,
    };
  };

  const convertSignedQuoteToBooking = async () => {
    if (existingBookingId) {
      setPaymentBookingId(existingBookingId);
      return existingBookingId;
    }
    if (!resolvedQuoteId) {
      throw new Error("Quote id is missing");
    }

    if (quoteDetailMode === "public") {
      const response = await fetch("/api/quotes/public-convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteKey: queryQuoteKey,
          payload: resolveBookingTimingFromQuote(quote) || {},
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false || !data?.data?.booking_id) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : "Failed to convert quote to booking"
        );
      }
      const bookingId = String(data.data.booking_id).trim();
      setPaymentBookingId(bookingId);
      setQuote((current) =>
        current
          ? ({
              ...current,
              booking_id: bookingId,
              converted_booking_details: {
                ...(current.converted_booking_details || {}),
                booking_id: bookingId,
              },
            } as SalesQuoteDetailData)
          : current
      );
      return bookingId;
    }

    const payload = resolveBookingTimingFromQuote(quote);
    if (!payload) {
      throw new Error("Booking schedule is missing on this quote. Please ask support/admin to set booking date/time.");
    }
    const response = await salesApi.convertQuoteToBooking(resolvedQuoteId, payload);
    if (response?.error || response?.success === false || !response?.data?.booking_id) {
      throw new Error(typeof response?.error === "string" ? response.error : "Failed to convert quote to booking");
    }

    const bookingId = String(response.data.booking_id).trim();
    setPaymentBookingId(bookingId);
    return bookingId;
  };

  const handleContinueToPayment = () => {
    const bookingId = effectivePaymentBookingId;
    if (!bookingId) {
      toast.error("Booking id missing for payment.");
      return;
    }
    router.push(`/search-results/payment?shootId=${encodeURIComponent(bookingId)}`);
  };

  const breadcrumbOverrides = React.useMemo(
    () => ({
      quotes: "Quote",
      preview: "Quote Preview",
    }),
    []
  );

  const topbarActions = showActionButtons ? (
    <>
      {quoteDetailMode !== "public" && (
      <ActionButton
        onClick={() => {
          void handleCopy();
        }}
        disabled={isPreparingLink}
        className={`h-11 rounded-xl px-4 ${isDark
            ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
            : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
          }`}
      >
        {isPreparingLink ? <Loader2 size={18} className="mr-2 animate-spin" /> : copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
        {isPreparingLink ? "Preparing..." : copied ? "Copied" : "Copy Link"}
      </ActionButton>
      )}
      {quoteDetailMode === "public" && !isQuoteSigned && (
        <ActionButton
          onClick={() => {
            if (!acceptServiceAgreement) {
              toast.error("Please agree to the Service Agreement before signing.");
              return;
            }
            setShowSignature(true);
          }}
          disabled={!resolvedQuoteId || loading}
          className={`h-11 rounded-xl px-4 ${isDark
            ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
            : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
            }`}
        >
          Sign Quote
        </ActionButton>
      )}
      {quoteDetailMode === "public" && effectivePaymentBookingId && (
        <ActionButton
          onClick={handleContinueToPayment}
          className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
        >
          Continue to Payment
        </ActionButton>
      )}
      <ServiceAgreementModal
        isOpen={isServiceAgreementOpen}
        initialChecked={acceptServiceAgreement}
        isAcceptedLocked={isQuoteSigned}
        onClose={() => setIsServiceAgreementOpen(false)}
        onAccept={() => {
          setAcceptServiceAgreement(true);
          setIsServiceAgreementOpen(false);
          setShowSignature(true);
        }}
      />
      {quoteDetailMode !== "public" && (
      <ActionButton
        onClick={() => {
          void handleSendQuote();
        }}
        disabled={!canSendQuote || isSending}
        className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
      >
        {isSending ? (
          <Loader2 size={18} className="mr-2 animate-spin" />
        ) : (
          <Send size={18} className="mr-2" />
        )}
        {isSending ? "Sending..." : quoteSent ? "Resend Quote" : "Send Quote"}
      </ActionButton>
      )}
    </>
  ) : undefined;

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <TopbarComponent
        pathname={pathname}
        actions={topbarActions}
        breadcrumbOverrides={breadcrumbOverrides}
      />

      <div className="px-4 pb-10 pt-6 lg:px-9 lg:pb-14 lg:pt-8">
        {showActionButtons ? (
          <div className="mb-6 flex flex-col gap-2 lg:hidden">
            {quoteDetailMode !== "public" && (
            <ActionButton
              onClick={() => {
                void handleCopy();
              }}
              disabled={isPreparingLink}
              className={`h-11 rounded-xl ${isDark
                  ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                  : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
                }`}
            >
              {isPreparingLink ? <Loader2 size={18} className="mr-2 animate-spin" /> : copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {isPreparingLink ? "Preparing..." : copied ? "Copied" : "Copy Link"}
            </ActionButton>
            )}
            {quoteDetailMode === "public" && (
              !isQuoteSigned ? (
                <ActionButton
                  onClick={() => {
                    if (!acceptServiceAgreement) {
                      toast.error("Please agree to the Service Agreement before signing.");
                      return;
                    }
                    setShowSignature(true);
                  }}
                  disabled={!resolvedQuoteId || loading}
                  className={`h-11 rounded-xl ${isDark
                    ? "border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]"
                    : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
                    }`}
                  >
                    Sign Quote
                  </ActionButton>
              ) : null
            )}
            {quoteDetailMode === "public" && effectivePaymentBookingId && (
              <ActionButton
                onClick={handleContinueToPayment}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                Continue to Payment
              </ActionButton>
            )}
            {quoteDetailMode !== "public" && (
              <ActionButton
                onClick={() => { void handleSendQuote(); }}
                disabled={!canSendQuote || isSending}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                {isSending ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Send size={18} className="mr-2" />}
                {isSending ? "Sending..." : quoteSent ? "Resend Quote" : "Send Quote"}
              </ActionButton>
            )}
          </div>
        ) : null}

        {showBackButton ? (
          <button
            type="button"
            onClick={handleBack}
            className={`mb-6 flex items-center gap-2 text-[15px] transition-colors ${isDark ? "text-[#D4D4D4] hover:text-white" : "text-black/70 hover:text-black"
              }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        ) : null}

        {showIntroHeader ? (
          <div
            className={`mb-6 rounded-[24px] px-5 py-5 lg:mb-8 lg:px-7 lg:py-6 ${isDark ? "border border-white/10 bg-[#171717]" : "border border-[#DFDDDD] bg-white"
              }`}
          >
            <QuotePreviewBrandBlock />
          </div>
        ) : null}

        {loading ? (
          <div
            className={`flex min-h-[420px] items-center justify-center rounded-[24px] ${isDark
                ? "border border-white/10 bg-[#171717] text-[#CFCFD3]"
                : "border border-[#DFDDDD] bg-white text-[#60646C]"
              }`}
          >
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Loading quote preview...
          </div>
        ) : quote ? (
          <QuotePreviewDocument
            quote={quote}
            quoteId={queryQuoteId ?? queryQuoteKey}
            showServiceAgreementAcceptance={quoteDetailMode === "public"}
            acceptServiceAgreement={isQuoteSigned ? true : acceptServiceAgreement}
            onAcceptServiceAgreementChange={setAcceptServiceAgreement}
            onOpenServiceAgreement={() => setIsServiceAgreementOpen(true)}
          />
        ) : (
          <div
            className={`flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-[24px] px-6 text-center ${isDark
                ? "border border-dashed border-white/10 bg-[#151515]"
                : "border border-dashed border-[#DFDDDD] bg-white"
              }`}
          >
            <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Preview data unavailable
            </p>
            <p className={`max-w-[480px] text-sm ${isDark ? "text-[#8B8B90]" : "text-[#60646C]"}`}>
              {errorMessage || "The quote preview could not be loaded."}
            </p>
            {createHref ? (
              <Button
                type="button"
                onClick={() => router.push(createHref)}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                Go to Quote Builder
              </Button>
            ) : showBackButton ? (
              <Button
                type="button"
                onClick={() => router.push(baseHref || fallbackHref)}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                Back
              </Button>
            ) : null}
          </div>
        )}
      </div>
      {showSignature && (
        <SignatureModal
          quoteId={resolvedQuoteId}
          signerName={quote?.client_name ?? "Client"}
          signerEmail={quote?.client_email ?? quote?.guest_email ?? ""}
          onClose={() => setShowSignature(false)}
          onSuccess={async (signatureData) => {
            toast.success("Quote signed successfully!");
            setAcceptServiceAgreement(true);
            setQuote((current) =>
              current
                ? {
                    ...current,
                    signed_at:
                      (signatureData as Record<string, unknown> | null)?.["signed_at"] as string ??
                      current.signed_at ??
                      new Date().toISOString(),
                    signature_base64:
                      ((signatureData as Record<string, unknown> | null)?.["signature_base64"] as string | undefined) ??
                      current.signature_base64,
                    signature_path:
                      ((signatureData as Record<string, unknown> | null)?.["signature_path"] as string | undefined) ??
                      current.signature_path,
                  }
                : current
            );
            try {
              if (quoteDetailMode === "public" && queryQuoteKey) {
                const refreshed = await fetchQuotePreviewByKey(queryQuoteKey);
                const updated = unwrapSalesQuoteDetail(refreshed?.data ?? null);
                if (updated) setQuote(updated);
              } else {
                const refreshed = await salesApi.getQuoteDetail(resolvedQuoteId);
                const updated = unwrapSalesQuoteDetail(refreshed?.data ?? null);
                if (updated) setQuote(updated);
              }

              if (quoteDetailMode === "public") {
                setIsConvertingToBooking(true);
                const bookingId = await convertSignedQuoteToBooking();
                if (bookingId) {
                  toast.success(`Booking #${bookingId} is ready. Continue to payment.`);
                }
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to prepare payment flow");
            } finally {
              setIsConvertingToBooking(false);
            }
          }}
        />
      )}
      {quoteDetailMode === "public" && isConvertingToBooking ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-[#111] px-6 py-4 text-white shadow-xl">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Preparing booking and payment...
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
