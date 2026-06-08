"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Copy, Loader2, Send } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import QuotePreviewBrandBlock from "@/components/quotes/QuotePreviewBrandBlock";
import QuotePreviewDocument from "@/components/quotes/QuotePreviewDocument";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import {
  QUOTE_PREVIEW_SUPERSEDED_REASON,
  QuotePreviewFetchError,
  createSignedQuotePreviewUrl,
  fetchQuotePreviewByKey,
  normalizeQuotePreviewUrlForClient,
} from "@/lib/quotePreview";
import { getQuoteSendSuccessMessage, isQuoteAlreadySent } from "@/lib/quoteSend";
import {
  buildPreviewQuoteFromSummary,
  readQuoteSummarySnapshot,
} from "@/lib/quoteSummary";
import { getLatestQuotePaymentChangeBlockMessage } from "@/lib/quotePaymentApproval";
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

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const getNormalizedString = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const getNestedRecords = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const dataRecord = asRecord(record.data);
  const latestRecord = asRecord(record.latest_quote);
  const latestVersionRecord = asRecord(record.latest_version);

  return [
    record.data,
    record.quote,
    record.item,
    record.result,
    record.details,
    record.latest_quote,
    record.latestQuote,
    record.latest_version,
    record.latestVersion,
    dataRecord?.quote,
    dataRecord?.item,
    dataRecord?.result,
    dataRecord?.latest_quote,
    dataRecord?.latestQuote,
    dataRecord?.latest_version,
    dataRecord?.latestVersion,
    latestRecord?.quote,
    latestVersionRecord?.quote,
  ].filter(Boolean);
};

const findFirstStringField = (value: unknown, fields: string[]) => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = asRecord(current);
    if (!record) {
      continue;
    }

    for (const field of fields) {
      const candidate = getNormalizedString(record[field]);
      if (candidate) {
        return candidate;
      }
    }

    queue.push(...getNestedRecords(record));
  }

  return null;
};

const findFirstMatchingText = (value: unknown, matcher: (text: string) => string | null) => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (typeof current === "string" || typeof current === "number") {
      const match = matcher(String(current));
      if (match) {
        return match;
      }
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = asRecord(current);
    if (!record) {
      continue;
    }

    queue.push(...Object.values(record));
  }

  return null;
};

const findLatestRecord = (value: unknown) => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = asRecord(current);
    if (!record) {
      continue;
    }

    const latest =
      asRecord(record.latest_quote) ||
      asRecord(record.latestQuote) ||
      asRecord(record.latest_version) ||
      asRecord(record.latestVersion);

    if (latest) {
      return latest;
    }

    queue.push(...getNestedRecords(record));
  }

  return null;
};

const findBookingId = (value: unknown) => {
  const directBookingId = findFirstStringField(value, [
    "booking_id",
    "bookingId",
    "stream_project_booking_id",
    "streamProjectBookingId",
    "project_booking_id",
    "projectBookingId",
    "converted_booking_id",
    "convertedBookingId",
    "shoot_id",
    "shootId",
  ]);

  if (directBookingId) {
    return directBookingId;
  }

  return findFirstMatchingText(value, (text) => {
    const match =
      text.match(/\bbooking\s*#?\s*(\d+)\b/i) ||
      text.match(/\bbooking[_\s-]*id\s*[:#]?\s*(\d+)\b/i) ||
      text.match(/\bshoot\s*#?\s*(\d+)\b/i);

    return match?.[1] ?? null;
  });
};

const hasSignedOrAcceptedQuoteState = (value: unknown) => {
  const status = findFirstStringField(value, [
    "quote_status",
    "quoteStatus",
    "status",
    "signature_status",
    "signatureStatus",
  ])?.toLowerCase();

  return Boolean(
    findFirstStringField(value, [
      "signed_at",
      "signedAt",
      "accepted_at",
      "acceptedAt",
      "signature_base64",
      "signatureBase64",
      "signature_path",
      "signaturePath",
      "signature_url",
      "signatureUrl",
      "signer_name",
      "signerName",
    ]) ||
      (status &&
        [
          "accepted",
          "signed",
          "converted",
          "converted_to_booking",
          "booking_created",
        ].includes(status))
  );
};

const buildQuoteStatePatch = (value: unknown): Partial<SalesQuoteDetailData> => {
  const patch: Partial<SalesQuoteDetailData> = {};
  const bookingId = findBookingId(value);
  const signedAt = findFirstStringField(value, ["signed_at", "signedAt", "accepted_at", "acceptedAt"]);
  const signatureBase64 = findFirstStringField(value, ["signature_base64", "signatureBase64"]);
  const signaturePath = findFirstStringField(value, ["signature_path", "signaturePath"]);
  const signatureUrl = findFirstStringField(value, ["signature_url", "signatureUrl"]);
  const signerName = findFirstStringField(value, ["signer_name", "signerName"]);

  if (bookingId) {
    patch.booking_id = bookingId;
    patch.converted_booking_details = { booking_id: bookingId };
  }

  if (signedAt) {
    patch.signed_at = signedAt;
    patch.accepted_at = signedAt;
  }

  if (signatureBase64) patch.signature_base64 = signatureBase64;
  if (signaturePath) patch.signature_path = signaturePath;
  if (signatureUrl) (patch as Record<string, unknown>).signature_url = signatureUrl;
  if (signerName) (patch as Record<string, unknown>).signer_name = signerName;

  if (hasSignedOrAcceptedQuoteState(value)) {
    patch.status = "accepted";
    patch.quote_status = "accepted";
  }

  return patch;
};

const hasQuoteStatePatch = (patch: Partial<SalesQuoteDetailData>) => Object.keys(patch).length > 0;

const resolveLatestPreviewLink = (value: unknown) => {
  const latestUrl = findFirstStringField(value, [
    "latest_preview_url",
    "latestPreviewUrl",
    "latest_quote_url",
    "latestQuoteUrl",
    "latest_public_quote_url",
    "latestPublicQuoteUrl",
  ]);
  const latestKey = findFirstStringField(value, [
    "latest_quote_key",
    "latestQuoteKey",
    "latest_public_quote_key",
    "latestPublicQuoteKey",
    "latest_preview_key",
    "latestPreviewKey",
  ]);

  if (latestUrl || latestKey) {
    return normalizeQuotePreviewUrlForClient(latestUrl, latestKey);
  }

  const latestRecord = findLatestRecord(value);
  const nestedLatestUrl = findFirstStringField(latestRecord, [
    "public_quote_url",
    "publicQuoteUrl",
    "preview_url",
    "previewUrl",
    "share_url",
    "shareUrl",
  ]);
  const nestedLatestKey = findFirstStringField(latestRecord, [
    "quote_key",
    "quoteKey",
    "public_quote_key",
    "publicQuoteKey",
    "preview_key",
    "previewKey",
  ]);

  return normalizeQuotePreviewUrlForClient(nestedLatestUrl, nestedLatestKey);
};

const getLatestApprovalStatus = (value: unknown) => {
  return findFirstStringField(value, [
    "latest_approval_status",
    "latestApprovalStatus",
    "approval_status",
    "approvalStatus",
    "change_request_status",
    "changeRequestStatus",
    "review_status",
    "reviewStatus",
  ])?.toLowerCase() || null;
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
  const [errorReasonCode, setErrorReasonCode] = useState<string | null>(null);
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);
  const [latestPreviewApprovalStatus, setLatestPreviewApprovalStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreparingLink, setIsPreparingLink] = useState(false);
  const [isGeneratingLatestLink, setIsGeneratingLatestLink] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [acceptServiceAgreement, setAcceptServiceAgreement] = useState(true);
  const [isServiceAgreementOpen, setIsServiceAgreementOpen] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const enrichmentLookupRef = useRef<string | null>(null);
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
      setErrorReasonCode(null);
      setLatestPreviewUrl(null);
      setLatestPreviewApprovalStatus(null);

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
        const previewError = error instanceof QuotePreviewFetchError ? error : null;
        setErrorReasonCode(previewError?.reasonCode ?? null);
        setLatestPreviewUrl(resolveLatestPreviewLink(previewError?.payload));
        setLatestPreviewApprovalStatus(getLatestApprovalStatus(previewError?.payload));
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

  useEffect(() => {
    if (
      quoteDetailMode !== "public" ||
      loading ||
      !quote ||
      !resolvedQuoteId ||
      enrichmentLookupRef.current === resolvedQuoteId
    ) {
      return;
    }

    enrichmentLookupRef.current = resolvedQuoteId;
    let isMounted = true;

    const enrichPublicQuoteState = async () => {
      try {
        const [publicDetailResult, signatureResult, authenticatedDetailResult] = await Promise.allSettled([
          salesApi.getPublicQuoteDetail(resolvedQuoteId),
          salesApi.getSignatureByQuote(resolvedQuoteId),
          salesApi.getQuoteDetail(resolvedQuoteId),
        ]);

        if (!isMounted) {
          return;
        }

        const publicDetail =
          publicDetailResult.status === "fulfilled" ? publicDetailResult.value : null;
        const signatureDetail =
          signatureResult.status === "fulfilled" ? signatureResult.value : null;
        const authenticatedDetail =
          authenticatedDetailResult.status === "fulfilled" ? authenticatedDetailResult.value : null;
        const publicQuote = unwrapSalesQuoteDetail(publicDetail?.data ?? null);
        const authenticatedQuote = unwrapSalesQuoteDetail(authenticatedDetail?.data ?? null);

        const publicPatch = {
          ...(publicQuote || {}),
          ...buildQuoteStatePatch(publicDetail),
          ...buildQuoteStatePatch(publicQuote),
        };
        const signaturePatch = buildQuoteStatePatch(signatureDetail);
        const authenticatedPatch = {
          ...(authenticatedQuote || {}),
          ...buildQuoteStatePatch(authenticatedDetail),
          ...buildQuoteStatePatch(authenticatedQuote),
        };
        const nextBookingId =
          findBookingId(publicDetail) ||
          findBookingId(publicQuote) ||
          findBookingId(signatureDetail) ||
          findBookingId(authenticatedDetail) ||
          findBookingId(authenticatedQuote);

        if (nextBookingId) {
          setPaymentBookingId(nextBookingId);
        }

        if (
          publicQuote ||
          authenticatedQuote ||
          hasQuoteStatePatch(publicPatch) ||
          hasQuoteStatePatch(signaturePatch) ||
          hasQuoteStatePatch(authenticatedPatch)
        ) {
          setQuote((current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              ...publicQuote,
              ...authenticatedQuote,
              ...publicPatch,
              ...authenticatedPatch,
              ...signaturePatch,
              converted_booking_details: {
                ...(current.converted_booking_details || {}),
                ...(publicQuote?.converted_booking_details || {}),
                ...(authenticatedQuote?.converted_booking_details || {}),
                ...(publicPatch.converted_booking_details || {}),
                ...(authenticatedPatch.converted_booking_details || {}),
                ...(signaturePatch.converted_booking_details || {}),
              },
            };
          });
        }
      } catch (error) {
        console.error("Failed to enrich public quote state", error);
      }
    };

    void enrichPublicQuoteState();

    return () => {
      isMounted = false;
    };
  }, [loading, quote, quoteDetailMode, resolvedQuoteId]);

  const isQuoteSigned = hasSignedOrAcceptedQuoteState(quote);
  const existingBookingId = React.useMemo(() => {
    const directBookingId = findBookingId(quote);

    if (directBookingId) {
      return directBookingId;
    }

    const quoteActivities = Array.isArray(quote?.activities) ? quote.activities : [];
    for (const activity of quoteActivities) {
      const activityBookingId = getActivityBookingId(activity as QuoteActivityLike);
      if (activityBookingId) {
        return activityBookingId;
      }
    }

    return "";
  }, [quote]);
  const quoteSent = isQuoteAlreadySent(quote);
  const canSendQuote =
    showActionButtons && !loading && Boolean(resolvedQuoteId);
  const copyQuoteUrl =
    generatedPreviewUrl ||
    (typeof window !== "undefined" && queryQuoteKey
      ? `${window.location.origin}/quotes/preview?quoteKey=${encodeURIComponent(queryQuoteKey)}`
      : null);
  const effectivePaymentBookingId = String(paymentBookingId || existingBookingId || "").trim();
  const paymentStatus = String(
    quote?.additional_payment?.payment_status ||
    asRecord((quote as Record<string, unknown> | null)?.payment_summary)?.payment_status ||
    (quote as Record<string, unknown> | null)?.payment_status ||
    ""
  )
    .trim()
    .toLowerCase();
  const normalizedQuoteStatus = String(quote?.quote_status || quote?.status || "")
    .trim()
    .toLowerCase();
  const outstandingAmount = Number(quote?.additional_payment?.outstanding_amount);
  const previouslyPaidAmount = Number(quote?.additional_payment?.previously_paid_amount);
  const isMarkedFullyPaid =
    ["paid", "completed", "success"].includes(paymentStatus) ||
    ["paid", "completed", "success"].includes(
      String((quote as Record<string, unknown> | null)?.payment_status || "")
        .trim()
        .toLowerCase()
    );
  const isZeroOutstanding =
    Number.isFinite(outstandingAmount) && outstandingAmount <= 0 && previouslyPaidAmount > 0;
  const isPublicPaymentAllowedStatus = !["rejected", "cancelled", "expired"].includes(normalizedQuoteStatus);
  const isPaymentPending =
    !paymentStatus ||
    ["pending", "unpaid", "payment_pending", "partially_paid", "partial_paid", "requires_payment"].includes(paymentStatus);
  const hasValidPublicQuotePreview =
    quoteDetailMode === "public" && !loading && Boolean(quote) && !errorMessage;
  const latestVersionApprovalPending =
    errorReasonCode === QUOTE_PREVIEW_SUPERSEDED_REASON &&
    latestPreviewApprovalStatus &&
    !["approved", "accepted"].includes(latestPreviewApprovalStatus);
  const unavailableMessage =
    latestVersionApprovalPending
      ? "A newer quote version is available, but admin approval is pending. Please check back once it is approved."
      : errorReasonCode === QUOTE_PREVIEW_SUPERSEDED_REASON
      ? latestPreviewUrl
        ? "Your old version link has expired because a new quote version was created. Open the latest approved version below."
        : "Your old version link has expired because a new quote version was created. Generate a latest quote link below."
      : errorMessage || "The quote preview could not be loaded.";
  const canContinueToPayment =
    hasValidPublicQuotePreview &&
    Boolean(effectivePaymentBookingId) &&
    isPublicPaymentAllowedStatus &&
    !isMarkedFullyPaid &&
    (!isZeroOutstanding || isPaymentPending);

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

  const validateBeforeShareQuote = async () => {
    const blockMessage = await getLatestQuotePaymentChangeBlockMessage({
      quote,
      quoteId: resolvedQuoteId,
    });

    if (blockMessage) {
      toast.error(blockMessage);
      return false;
    }

    return true;
  };

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Copy is not supported in this browser");
      return;
    }

    try {
      const canContinue = await validateBeforeShareQuote();
      if (!canContinue) {
        return;
      }

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

    const canContinue = await validateBeforeShareQuote();
    if (!canContinue) {
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

  const handleContinueToPayment = () => {
    const bookingId = effectivePaymentBookingId;
    if (!bookingId) {
      toast.error("Booking id missing for payment.");
      return;
    }
    router.push(`/search-results/payment?shootId=${encodeURIComponent(bookingId)}`);
  };

  const handleGenerateLatestQuoteLink = async () => {
    if (latestPreviewUrl) {
      window.location.href = latestPreviewUrl;
      return;
    }

    if (!queryQuoteKey) {
      toast.error("Old quote key is missing.");
      return;
    }

    setIsGeneratingLatestLink(true);
    try {
      const response = await fetch("/api/quotes/latest-preview-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteKey: queryQuoteKey }),
      });
      const data = await response.json().catch(() => null);
      const previewUrl = normalizeQuotePreviewUrlForClient(
        getNormalizedString(data?.data?.previewUrl),
        getNormalizedString(data?.data?.quoteKey)
      );

      if (!response.ok || data?.success === false || !previewUrl) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Latest quote link is not available yet."
        );
      }

      window.location.href = previewUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate latest quote link");
    } finally {
      setIsGeneratingLatestLink(false);
    }
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
      {hasValidPublicQuotePreview && !isQuoteSigned && (
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
            : "border border-[#00000033] bg-[#FFF] text-black hover:bg-[#E5E7EB]"
            }`}
        >
          Sign Quote
        </ActionButton>
      )}
      {canContinueToPayment && (
        <ActionButton
          onClick={handleContinueToPayment}
          className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
        >
          Continue to Payment
        </ActionButton>
      )}
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
            {hasValidPublicQuotePreview && (
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
                    : "border border-[#00000033] bg-[#FFF] text-black hover:bg-[#E5E7EB]"
                    }`}
                >
                  Sign Quote
                </ActionButton>
              ) : null
            )}
            {canContinueToPayment && (
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
            className={`mb-6 flex items-center gap-2 text-[15px] transition-colors ${isDark ? "text-[#D4D4D4] hover:text-white" : "text-black/70 hover:text-black"}`}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        ) : null}

        {showIntroHeader ? (
          <div
            className={`mb-6 rounded-[24px] px-5 py-5 lg:mb-8 lg:px-7 lg:py-6 ${isDark ? "border border-white/10 bg-[#171717]" : "border border-[#DFDDDD] bg-white"}`}
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
            onOpenServiceAgreement={() => {
              setIsServiceAgreementOpen(true);
            }}
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
              {unavailableMessage}
            </p>
            {createHref ? (
              <Button
                type="button"
                onClick={() => router.push(createHref)}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                Go to Quote Builder
              </Button>
            ) : errorReasonCode === QUOTE_PREVIEW_SUPERSEDED_REASON && !latestVersionApprovalPending ? (
              <Button
                type="button"
                onClick={() => {
                  void handleGenerateLatestQuoteLink();
                }}
                disabled={isGeneratingLatestLink}
                className="h-11 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#E5D5B8]/90"
              >
                {isGeneratingLatestLink ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : latestPreviewUrl ? (
                  "Open Latest Quote Version"
                ) : (
                  "Generate Latest Quote Link"
                )}
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

      {/* FIXED: Placed at root layout level so it is always mounted across mobile & desktop viewports */}
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
        isDark={isDark}
      />

      {showSignature && (
        <SignatureModal
          quoteId={resolvedQuoteId}
          signerName={quote?.client_name ?? "Client"}
          signerEmail={quote?.client_email ?? quote?.guest_email ?? ""}
          onClose={() => setShowSignature(false)}
          onSuccess={async (signatureData) => {
            toast.success("Quote signed successfully!");
            setAcceptServiceAgreement(true);
            let refreshedQuote: SalesQuoteDetailData | null = null;
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
                if (updated) {
                  refreshedQuote = updated;
                  setQuote(updated);
                }
              } else {
                const refreshed = await salesApi.getQuoteDetail(resolvedQuoteId);
                const updated = unwrapSalesQuoteDetail(refreshed?.data ?? null);
                if (updated) {
                  refreshedQuote = updated;
                  setQuote(updated);
                }
              }

              if (quoteDetailMode === "public") {
                const bookingId = findBookingId(signatureData) || findBookingId(refreshedQuote) || findBookingId(quote);
                if (bookingId) {
                  setPaymentBookingId(bookingId);
                  toast.success(`Booking #${bookingId} is ready. Continue to payment.`);
                }
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to prepare payment flow");
            }
          }}
        />
      )}
    </div>
  );
}
