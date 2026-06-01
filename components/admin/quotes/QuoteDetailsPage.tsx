"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpToLine,
  Camera,
  DollarSign,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Radio,
  Scissors,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ConvertBookingModal, {
  type ConvertBookingModalInitialData,
  type ConvertBookingModalSubmitData,
} from "@/components/admin/quotes/ConvertBookingModal";
import QuoteEditAccessModal, {
  type QuoteEditAccessModalProps,
} from "@/components/admin/quotes/QuoteEditAccessModal";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { Button } from "@/components/ui/button";
import {
  salesApi,
  type SalesQuoteConvertToBookingPayload,
  type SalesQuoteDetailData,
} from "@/lib/api";
import { salesApi as salesRtkApi, useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  persistQuoteEditorEditReason,
  persistQuoteEditorNavigationCache,
  type QuoteEditorView,
} from "@/lib/quoteEdit";
import {
  formatQuoteCurrency,
  formatQuoteDate,
  getQuoteDisplayShootTypeLabel,
  getQuoteNumber,
  getQuoteSalesperson,
  getQuoteText,
  normalizeQuoteLineItems,
  normalizeQuoteTerms,
  type NormalizedQuoteLineItem,
} from "@/lib/quoteDetail";
import { getDefaultQuoteTerms } from "@/lib/quoteTerms";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { getBrowserTimeZone } from "@/lib/timezone";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { getInitials } from "@/lib/utils";
import { buildBeigeInvoiceUrl } from "@/lib/invoiceUrl";

type TopbarComponentProps = {
  pathname: string;
  actions?: React.ReactNode;
  title?: string;
  breadcrumbOverrides?: Record<string, string>;
};

type QuoteDetailsPageProps = {
  quoteId: string;
  baseHref: string;
  TopbarComponent: React.ComponentType<TopbarComponentProps>;
  EditAccessModalComponent?: React.ComponentType<QuoteEditAccessModalProps>;
};

type OtherDetailsTab = "discounts" | "tax";
type QuoteConvertIntent = "convert_only" | "send_invoice" | "view_invoice";

type QuoteActivityLike = {
  activity_type?: string;
  message?: string;
  activity_data?: unknown;
  metadata?: {
    booking_id?: number | string;
    lead_id?: number | string;
    [key: string]: unknown;
  } | null;
  metadata_json?: string | null;
  created_at?: string | null;
  performed_by?: {
    name?: string;
    [key: string]: unknown;
  } | null;
};

type QuoteConvertedBookingDayLike = {
  date?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type QuoteConvertedBookingDetailsLike = {
  booking_type?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  booking_days?: QuoteConvertedBookingDayLike[] | null;
};
const S3_PREFIX =
  process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

const joinAssetUrl = (baseUrl: string, assetPath: string) => {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = assetPath.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const resolveS3ProofUrl = (value?: string | null) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (/^https?:\/\//i.test(rawValue)) return rawValue;
  return joinAssetUrl(S3_PREFIX, rawValue);
};

const resolveSignatureSource = (rawData: any) => {
  const nested = rawData?.data;
  const source =
    rawData?.signature_base64 ??
    nested?.signature_base64 ??
    rawData?.signature_path ??
    nested?.signature_path ??
    rawData?.file_path ??
    nested?.file_path ??
    rawData?.signature_url ??
    nested?.signature_url ??
    rawData?.file_url ??
    nested?.file_url;

  if (!source) return null;
  if (typeof source !== "string") return null;

  const value = source.trim();
  if (!value) return null;

  if (value.startsWith("data:")) {
    return value;
  }

  // Some responses send plain base64 without data URI prefix.
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.length > 80) {
    return `data:image/png;base64,${value}`;
  }

  if (/^https?:\/\//i.test(value) && !/localhost|127\.0\.0\.1|::1/i.test(value)) {
    return value;
  }

  const normalizedPath = (value.match(/(?:^|\/)(signatures\/.+)$/i)?.[1] ?? value).replace(/^\/+/, "");
  return joinAssetUrl(S3_PREFIX, normalizedPath);
};

const normalizeConvertModalTime = (value?: string | null) =>
  typeof value === "string" && value.length >= 5 ? value.slice(0, 5) : "";

const buildConvertModalInitialData = (
  booking?: QuoteConvertedBookingDetailsLike | null
): ConvertBookingModalInitialData | null => {
  if (!booking) {
    return null;
  }

  const bookingDays = Array.isArray(booking.booking_days)
    ? booking.booking_days
      .map((day) => ({
        date: String(day?.date || day?.event_date || ""),
        startTime: normalizeConvertModalTime(day?.start_time),
        endTime: normalizeConvertModalTime(day?.end_time),
      }))
      .filter((day) => day.date)
    : [];

  if (
    String(booking.booking_type || "").trim().toLowerCase() === "multi_day" ||
    bookingDays.length > 1
  ) {
    const [firstDay] = bookingDays;
    const sameTimings =
      bookingDays.length > 0
        ? bookingDays.every(
          (day) =>
            day.startTime === (firstDay?.startTime || "") &&
            day.endTime === (firstDay?.endTime || "")
        )
        : true;

    return {
      bookingType: "multi_day",
      location: booking.location || "",
      multiDay: {
        sameTimings,
        sharedStartTime: sameTimings ? firstDay?.startTime || "" : undefined,
        sharedEndTime: sameTimings ? firstDay?.endTime || "" : undefined,
        days: bookingDays,
      },
    };
  }

  const singleDate = bookingDays[0]?.date || booking.start_date || "";
  const singleStartTime =
    bookingDays[0]?.startTime || normalizeConvertModalTime(booking.start_time);
  const singleEndTime =
    bookingDays[0]?.endTime || normalizeConvertModalTime(booking.end_time);

  if (!singleDate) {
    return null;
  }

  return {
    bookingType: "single_day",
    location: booking.location || "",
    singleDay: {
      date: singleDate,
      startTime: singleStartTime,
      endTime: singleEndTime,
    },
  };
};

const mergeVersionQuoteWithPrimaryContext = (
  current: SalesQuoteDetailData | null,
  incoming: SalesQuoteDetailData
): SalesQuoteDetailData => {
  if (!current) return incoming;

  const incomingLeadId = incoming?.lead_id;
  const incomingBookingId = (incoming as Record<string, unknown>)?.booking_id;
  const incomingActivities = Array.isArray(incoming?.activities) ? incoming.activities : [];

  return {
    ...incoming,
    quote_status: current.quote_status ?? incoming.quote_status,
    status: current.status ?? incoming.status,
    lead_id:
      incomingLeadId !== undefined && incomingLeadId !== null && String(incomingLeadId).trim()
        ? incomingLeadId
        : current.lead_id,
    booking_id:
      incomingBookingId !== undefined && incomingBookingId !== null && String(incomingBookingId).trim()
        ? incomingBookingId
        : (current as Record<string, unknown>)?.booking_id,
    // For historical version views, never inherit activities from the currently loaded quote.
    // Inheriting current activities leaks newer change metadata (e.g. reduced/additional amounts)
    // into older versions like Version 1.
    activities: incomingActivities,
    converted_booking_details:
      incoming.converted_booking_details || current.converted_booking_details,
    signature_base64: incoming.signature_base64 ?? current.signature_base64,
    signature_path: incoming.signature_path ?? current.signature_path,
    signature_url:
      (incoming as Record<string, unknown>)?.signature_url ??
      (current as Record<string, unknown>)?.signature_url,
    signed_at: incoming.signed_at ?? current.signed_at,
    signer_name:
      (incoming as Record<string, unknown>)?.signer_name ??
      (current as Record<string, unknown>)?.signer_name,
  };
};

const getQuoteEditShootDateValue = (quote?: SalesQuoteDetailData | null) => {
  const bookingDays = quote?.converted_booking_details?.booking_days ?? [];
  const firstBookingDay = Array.isArray(bookingDays) ? bookingDays[0] : null;
  const dateValue = getQuoteText(
    firstBookingDay?.date,
    firstBookingDay?.event_date,
    quote?.converted_booking_details?.start_date
  );
  const startTimeValue = getQuoteText(
    firstBookingDay?.start_time,
    quote?.converted_booking_details?.start_time
  );

  if (!dateValue) {
    return "";
  }

  if (!startTimeValue) {
    return dateValue;
  }

  const normalizedTime = startTimeValue.length === 5 ? `${startTimeValue}:00` : startTimeValue;
  return `${dateValue}T${normalizedTime}`;
};

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

const getStatusStyles = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase();

  if (["paid"].includes(normalizedStatus)) {
    return "border border-[#86EFAC]/20 bg-[#DCFCE7] text-[#166534]";
  }

  if (normalizedStatus === "partially paid") {
    return "border border-[#FCD34D]/25 bg-[#FEF3C7] text-[#92400E]";
  }

  if (["accepted", "approved", "confirmed"].includes(normalizedStatus)) {
    return "border border-[#86EFAC]/20 bg-[#DCFCE7] text-[#166534]";
  }

  if (["pending", "sent", "viewed"].includes(normalizedStatus)) {
    return "border border-[#93C5FD]/20 bg-[#BFDBFE] text-[#1D4ED8]";
  }

  if (["rejected", "cancelled"].includes(normalizedStatus)) {
    return "border border-[#FECACA]/20 bg-[#FEE2E2] text-[#DC2626]";
  }

  if (["expired"].includes(normalizedStatus)) {
    return "border border-white/10 bg-[#FFF6E9] text-[#D4A017]";
  }

  return "border border-[#E8D1AB]/20 bg-[#2A2418] text-[#E8D1AB]";
};

const formatStatusLabel = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const INVOICE_ACTION_VISIBLE_STATUSES = new Set([
  "accepted",
  "approved",
  "confirmed",
  "pending",
  "sent",
  "viewed",
  "paid",
  "partially paid",
  "partial_paid",
  "partially_paid",
]);

const getServiceIcon = (name: string) => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("photo")) {
    return <Camera size={22} />;
  }

  if (normalizedName.includes("edit")) {
    return <Scissors size={22} />;
  }

  if (normalizedName.includes("live")) {
    return <Radio size={22} />;
  }

  if (normalizedName.includes("studio") || normalizedName.includes("location")) {
    return <MapPin size={22} />;
  }

  return <Video size={22} />;
};

const SectionActionButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <Button
    type="button"
    onClick={onClick}
    className="h-10 rounded-lg lg:rounded-xl bg-[#E8D1AB] px-4 text-sm font-semibold text-black hover:bg-[#E8D1AB]/90"
  >
    {label}
  </Button>
);

const SectionShell = ({
  title,
  actionLabel,
  onAction,
  children,
  isDark = true,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}) => (
  <section className={`rounded-lg lg:rounded-[26px] border transition-colors ${isDark ? "border-[#2B2B2B] bg-[#171717]" : "border-[#000000]/10 bg-white"}`}>
    <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
      <h2 className={`lg:text-lg font-semibold lg:text-xl transition-colors ${isDark ? "text-white" : "text-[#000000AD]"}`}>
        {title}
      </h2>
      {actionLabel && onAction ? (
        <SectionActionButton
          label={actionLabel}
          onClick={onAction}
        />
      ) : null}
    </div>

    {/* Dashed Separator Line */}
    <div className={`border-t transition-colors ${isDark ? "border-[#343434]" : "border-[#2B2B2B]"}`} />

    <div className="px-5 py-5 lg:px-8 lg:py-7">{children}</div>
  </section>
);

const ServiceLineCard = ({
  item,
  shootType,
}: {
  item: NormalizedQuoteLineItem;
  shootType: string;
}) => {
  const detailLabel = item.subtitle || (shootType ? `(${shootType})` : "");

  return (
    <div className="rounded-lg lg:rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
            {getServiceIcon(item.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="break-words lg:text-lg font-semibold leading-5 lg:leading-7 text-white"
              title={detailLabel ? `${item.name} - ${detailLabel}` : item.name}
            >
              {item.name}
              {detailLabel ? <span className="text-[#E8D1AB]"> - {detailLabel}</span> : null}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-[#2B2B2B]" />

      <div className="mt-5 grid gap-2 lg:gap-4 grid-cols-2">
        <div className="space-y-2 lg:space-y-3 text-[#8F8F95]">
          <p className="text-sm lg:text-base">Quantity</p>
          <p className="text-sm lg:text-base">Duration</p>
          <p className="text-sm lg:text-base">Crew Size</p>
          <p className="text-sm lg:text-base">Estimate Pricing</p>
        </div>
        <div className="space-y-2 lg:space-y-3 text-left text-sm lg:lg:text-lg font-semibold text-white lg:text-right">
          <p>{String(item.quantity).padStart(2, "0")}</p>
          <p>{item.duration > 0 ? `${String(item.duration).padStart(2, "0")} Hours` : "-"}</p>
          <p>{item.crew > 0 ? String(item.crew).padStart(2, "0") : "-"}</p>
          <p>{formatQuoteCurrency(item.unitRate)}</p>
        </div>
      </div>
    </div>
  );
};

const QuoteTopActions = ({
  onReject,
  onConvert,
  onPaymentTransaction,
  onPreview,
  previewDisabled,
  rejectDisabled,
  convertDisabled,
  paymentDisabled,
  isRejecting,
  isRejected,
  isConverting,
  versions,
  selectedVersionId,
  onVersionChange,
}: {
  onReject: () => void;
  onConvert: () => void;
  onPaymentTransaction: () => void;
  onPreview: () => void;
  previewDisabled: boolean;
  rejectDisabled: boolean;
  convertDisabled: boolean;
  paymentDisabled: boolean;
  isRejecting: boolean;
  isRejected: boolean;
  isConverting: boolean;
  versions: any[];
  selectedVersionId: string | null;
  onVersionChange: (val: string) => void;
}) => (
  <div className="flex items-center gap-1 lg:gap-3">
    {versions.length > 0 && (
      <div className="mr-1 lg:mr-2 flex items-center gap-1 lg:gap-2">
        <span className="text-sm font-medium text-[#8F8F95]">Version:</span>
        <Select value={selectedVersionId || ""} onValueChange={onVersionChange}>
          <SelectTrigger className="h-11 w-[120px] md:w-[140px] rounded-xl border-white/10 bg-[#1B1B1B] text-white">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1B1B1B] text-white">
            {versions
              .map((v, index) => {
                const rawVersionNumber = v?.version_number;
                if (rawVersionNumber == null) {
                  return null;
                }
                return (
                  <SelectItem key={`${rawVersionNumber}-${index}`} value={String(rawVersionNumber)}>
                    Version {v?.version_number ?? index + 1}
                  </SelectItem>
                );
              })
              .filter(Boolean)}
          </SelectContent>
        </Select>
      </div>
    )}
    <Button
      type="button"
      onClick={onReject}
      disabled={rejectDisabled}
      className="hidden lg:flex h-11 rounded-xl border border-[#FCA5A5]/20 bg-[#FECACA] px-4 text-[#DC2626] hover:bg-[#FECACA]/90"
    >
      {isRejecting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
      {isRejecting ? "Rejecting..." : isRejected ? "Rejected" : "Reject Quote"}
    </Button>
    <Button
      type="button"
      onClick={onPaymentTransaction}
      disabled={paymentDisabled || isRejected}
      variant="outline"
      className="h-11 rounded-xl border-[#E8D1AB]/30 bg-[#201A10] px-4 text-[#E8D1AB] hover:bg-[#2A2114] disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed"
    >
      <DollarSign size={18} />
      Record Payment
    </Button>
    <Button
      type="button"
      onClick={onPreview}
      disabled={previewDisabled || isRejected}
      className="hidden lg:flex h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed"
    >
      <Eye size={18} />
      Preview Quote
    </Button>
  </div>
);

const DetailRow = ({ label, value, isDark = true }: { label: string; value: string; isDark?: boolean; }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 lg:py-4">
    <p className={`shrink-0 text-sm lg:text-base transition-colors ${isDark ? "text-[#8F8F95]" : "text-[#000000]/50"
      }`}>
      {label}
    </p>
    <p className={`max-w-[65%] break-words text-right text-sm lg:text-base font-semibold transition-colors ${isDark ? "text-white" : "text-[#000000]"
      }`}>
      {value}
    </p>
  </div>
);

const resolveSignatureImageUrl = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^(data:|https?:\/\/)/i.test(raw)) {
    return raw;
  }

  const prefix = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");
  if (!prefix) return raw;

  return `${prefix}/${raw.replace(/^\/+/, "")}`;
};

const mergeQuoteSignatureFields = (
  quoteDetail: SalesQuoteDetailData,
  rawData: Record<string, unknown> | null
): SalesQuoteDetailData => {
  if (!rawData) {
    return quoteDetail;
  }

  const nestedData =
    rawData.data && typeof rawData.data === "object"
      ? (rawData.data as Record<string, unknown>)
      : null;

  const signatureBase64 =
    typeof rawData.signature_base64 === "string"
      ? rawData.signature_base64
      : typeof nestedData?.signature_base64 === "string"
        ? nestedData.signature_base64
        : undefined;
  const signaturePath =
    typeof rawData.signature_path === "string"
      ? rawData.signature_path
      : typeof nestedData?.signature_path === "string"
        ? nestedData.signature_path
        : undefined;
  const signatureUrl =
    typeof rawData.signature_url === "string"
      ? rawData.signature_url
      : typeof nestedData?.signature_url === "string"
        ? nestedData.signature_url
        : undefined;
  const signerName =
    typeof rawData.signer_name === "string"
      ? rawData.signer_name
      : typeof nestedData?.signer_name === "string"
        ? nestedData.signer_name
        : undefined;
  const signedAt =
    typeof rawData.signed_at === "string"
      ? rawData.signed_at
      : typeof nestedData?.signed_at === "string"
        ? nestedData.signed_at
        : undefined;

  return {
    ...quoteDetail,
    ...(signatureBase64 ? { signature_base64: signatureBase64 } : {}),
    ...(signaturePath ? { signature_path: signaturePath } : {}),
    ...(signatureUrl ? { signature_url: signatureUrl } : {}),
    ...(signerName ? { signer_name: signerName } : {}),
    ...(signedAt ? { signed_at: signedAt } : {}),
  } as SalesQuoteDetailData;
};

export default function QuoteDetailsPage({
  quoteId,
  baseHref,
  TopbarComponent,
  EditAccessModalComponent = QuoteEditAccessModal,
}: QuoteDetailsPageProps) {
  const dispatch = useAppDispatch();
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPaymentSummaryOverrides, setPreviewPaymentSummaryOverrides] = useState<{
    previousTotal?: number;
    revisedTotal?: number;
  } | undefined>(undefined);
  const [otherDetailsTab, setOtherDetailsTab] = useState<OtherDetailsTab>("discounts");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertIntent, setConvertIntent] = useState<QuoteConvertIntent>("convert_only");
  const [pendingEditView, setPendingEditView] = useState<QuoteEditorView | null>(null);
  const [isEditAccessSubmitting, setIsEditAccessSubmitting] = useState(false);
  const [convertModalInitialDataOverride, setConvertModalInitialDataOverride] =
    useState<ConvertBookingModalInitialData | null>(null);
  const [convertedBookingIdOverride, setConvertedBookingIdOverride] = useState<string | null>(null);
  const [isConvertedOverride, setIsConvertedOverride] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [signerName, setSignerName] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [manualPaymentType, setManualPaymentType] = useState<"full" | "partial">("full");
  const [manualPaymentAmount, setManualPaymentAmount] = useState("");
  const [manualPaymentMode, setManualPaymentMode] = useState<ManualPaymentMode>("cash");
  const [manualPaymentOtherMode, setManualPaymentOtherMode] = useState("");
  const [manualPaymentNotes, setManualPaymentNotes] = useState("");
  const [manualPaymentProofUrl, setManualPaymentProofUrl] = useState("");
  const [manualPaymentProofFileName, setManualPaymentProofFileName] = useState("");
  const [isUploadingManualProof, setIsUploadingManualProof] = useState(false);
  const [isSubmittingManualPayment, setIsSubmittingManualPayment] = useState(false);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredPaymentActionRef = useRef(false);

  const refreshSignedQuoteState = useCallback(async () => {
    try {
      const response = await salesApi.getQuoteDetail(quoteId);
      if (response?.error || response?.success === false) {
        return;
      }

      const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
      if (!quoteDetail) {
        return;
      }

      const rawData =
        response?.data && typeof response.data === "object"
          ? (response.data as Record<string, unknown>)
          : null;
      const normalizedQuoteDetail = mergeQuoteSignatureFields(quoteDetail, rawData);
      const nestedData =
        rawData?.data && typeof rawData.data === "object"
          ? (rawData.data as Record<string, unknown>)
          : null;
      const sig = resolveSignatureSource(rawData);
      const nextSignerName =
        typeof rawData?.signer_name === "string"
          ? rawData.signer_name
          : typeof nestedData?.signer_name === "string"
            ? nestedData.signer_name
            : null;
      const nextSignedAt =
        typeof rawData?.signed_at === "string"
          ? rawData.signed_at
          : typeof nestedData?.signed_at === "string"
            ? nestedData.signed_at
            : null;

      setQuote((current) =>
        current
          ? ({
            ...current,
            signature_base64: normalizedQuoteDetail.signature_base64 ?? current.signature_base64,
            signature_path: normalizedQuoteDetail.signature_path ?? current.signature_path,
            signature_url:
              (normalizedQuoteDetail as Record<string, unknown>)?.signature_url ??
              (current as Record<string, unknown>)?.signature_url,
            signed_at: normalizedQuoteDetail.signed_at ?? current.signed_at,
            signer_name:
              (normalizedQuoteDetail as Record<string, unknown>)?.signer_name ??
              (current as Record<string, unknown>)?.signer_name,
          } as SalesQuoteDetailData)
          : normalizedQuoteDetail
      );
      setSignatureBase64(sig);
      setSignerName(nextSignerName);
      setSignedAt(nextSignedAt);
    } catch (error) {
      console.error("Failed to refresh signed quote state", error);
    }
  }, [quoteId]);

  useEffect(() => {
    let isMounted = true;

    const fetchQuoteDetails = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await salesApi.getQuoteDetail(quoteId);

        if (response?.error || response?.success === false) {
          throw new Error(
            typeof response?.error === "string" ? response.error : "Failed to fetch quote details"
          );
        }

        const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);

        if (!quoteDetail) {
          throw new Error("Quote details are unavailable");
        }

        const rawData =
          response?.data && typeof response.data === "object"
            ? (response.data as Record<string, unknown>)
            : null;
        const normalizedQuoteDetail = mergeQuoteSignatureFields(quoteDetail, rawData);

        if (!isMounted) {
          return;
        }

        setQuote(normalizedQuoteDetail);
        const nestedData =
          rawData?.data && typeof rawData.data === "object"
            ? (rawData.data as Record<string, unknown>)
            : null;
        const sig = resolveSignatureSource(rawData);
        if (sig) {
          setSignatureBase64(sig);
          setSignerName(
            typeof rawData?.signer_name === "string"
              ? rawData.signer_name
              : typeof nestedData?.signer_name === "string"
                ? nestedData.signer_name
                : null
          );
          setSignedAt(
            typeof rawData?.signed_at === "string"
              ? rawData.signed_at
              : typeof nestedData?.signed_at === "string"
                ? nestedData.signed_at
                : null
          );
        } else {
          setSignatureBase64(null);
          setSignerName(null);
          setSignedAt(null);
        }

        const versionsRes = await salesApi.getQuoteVersions(quoteId);
        if (versionsRes?.success && isMounted) {
          const versionsData = Array.isArray(versionsRes.data) ? versionsRes.data : versionsRes.data?.versions || [];
          setVersions(versionsData);
          // Set initial selected version to the current one if found
          const currentVersion =
            versionsData.find((v: any) => v?.is_current && v?.version_number != null) ||
            versionsData.find((v: any) => v?.version_number != null);
          const currentVersionNumber = currentVersion?.version_number;
          if (currentVersionNumber != null && !selectedVersionId) {
            setSelectedVersionId(String(currentVersionNumber));
          }
        }
      } catch (error) {
        console.error("Failed to load quote details", error);

        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Failed to fetch quote details";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchQuoteDetails();

    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  useEffect(() => {
    if (!selectedVersionId) return;

    let isMounted = true;
    const fetchVersionDetail = async () => {
      setLoading(true);
      try {
        const response = await salesApi.getQuoteVersionDetail(quoteId, selectedVersionId);
        if (response?.success && isMounted) {
          const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
          if (quoteDetail) {
            setQuote((current) =>
              mergeVersionQuoteWithPrimaryContext(current, quoteDetail)
            );

            const selectedVersionNumber = Number(selectedVersionId);
            const revisedTotal = getQuoteNumber(
              quoteDetail.total,
              quoteDetail.total_amount,
              quoteDetail.final_total
            );

            if (
              Number.isFinite(selectedVersionNumber) &&
              selectedVersionNumber > 1 &&
              revisedTotal !== undefined
            ) {
              const previousVersionResponse = await salesApi.getQuoteVersionDetail(
                quoteId,
                String(selectedVersionNumber - 1)
              );
              const previousVersionQuote = unwrapSalesQuoteDetail(previousVersionResponse?.data ?? null);
              const previousTotal = getQuoteNumber(
                previousVersionQuote?.total,
                previousVersionQuote?.total_amount,
                previousVersionQuote?.final_total
              );

              if (
                previousTotal !== undefined &&
                Math.abs(revisedTotal - previousTotal) > 0.009
              ) {
                setPreviewPaymentSummaryOverrides({
                  previousTotal,
                  revisedTotal,
                });
              } else {
                setPreviewPaymentSummaryOverrides(undefined);
              }
            } else {
              setPreviewPaymentSummaryOverrides(undefined);
            }
          } else {
            setPreviewPaymentSummaryOverrides(undefined);
          }
        }
      } catch (error) {
        console.error("Failed to fetch quote version detail", error);
        if (isMounted) {
          setPreviewPaymentSummaryOverrides(undefined);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchVersionDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedVersionId, quoteId]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void refreshSignedQuoteState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshSignedQuoteState();
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSignedQuoteState]);

  useEffect(() => {
    const editViews: QuoteEditorView[] = [
      "details",
      "services",
      "addons",
      "logistics",
      "customlineitems",
      "discounts",
    ];

    editViews.forEach((view) => {
      router.prefetch(
        `${baseHref}/create?quoteId=${encodeURIComponent(quoteId)}&view=${encodeURIComponent(view)}`
      );
    });
  }, [baseHref, quoteId, router]);

  const lineItems = useMemo(
    () => (quote ? normalizeQuoteLineItems(quote) : []),
    [quote]
  );

  const serviceItems = lineItems.filter((item) => item.section === "service");
  const addonItems = lineItems.filter((item) => item.section === "addon");
  const logisticsItems = lineItems.filter((item) => item.section === "logistics");
  const customItems = lineItems.filter((item) => item.section === "custom");

  const subtotal = quote ? getQuoteNumber(quote.subtotal) ?? lineItems.reduce((sum, item) => sum + item.amount, 0) : 0;
  const discountValue = quote ? getQuoteNumber(quote.discount_value) ?? 0 : 0;
  const discountType = quote ? getQuoteText(quote.discount_type).toLowerCase() : "";
  const isFixedDiscount = ["fixed", "fixed_amount"].includes(discountType);
  const rawDiscountAmount = quote
    ? getQuoteNumber(quote.discount_amount) ??
    (discountType.includes("percent")
      ? subtotal * (discountValue / 100)
      : discountValue)
    : 0;
  const discountAmount = Math.min(rawDiscountAmount, subtotal);
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const taxRate = quote ? getQuoteNumber(quote.tax_rate) ?? 0 : 0;
  const taxType = quote ? getQuoteText(quote.tax_type, "Sales Tax") || "Sales Tax" : "Sales Tax";
  const taxAmount = quote
    ? getQuoteNumber(quote.tax_amount, quote.sales_tax) ?? discountedSubtotal * (taxRate / 100)
    : 0;
  const amountAfterTax = quote
    ? getQuoteNumber(quote.amount_after_tax, quote.total_after_tax) ?? discountedSubtotal + taxAmount
    : 0;
  const finalTotal = quote
    ? getQuoteNumber(
      quote.final_total,
      quote.total_amount,
      quote.amount_after_discount
    ) ?? amountAfterTax
    : 0;

  const clientName = getQuoteText(quote?.client_name, "Client");
  const clientEmail = getQuoteText(quote?.client_email, quote?.guest_email, "N/A") || "N/A";
  const clientPhone = getQuoteText(quote?.client_phone, quote?.phone, "N/A") || "N/A";
  const clientAddress =
    getQuoteText(quote?.client_address, quote?.address, quote?.location, "Address not available") ||
    "Address not available";
  const projectDescription =
    getQuoteText(quote?.project_description, "Project description not available") ||
    "Project description not available";
  const salesperson = getQuoteSalesperson(quote);
  const quoteStatus =
    getQuoteText(quote?.quote_status, quote?.status, "Draft") || "Draft";
  const normalizedQuoteStatus = quoteStatus.trim().toLowerCase();
  const selectedVersionMeta = useMemo(() => {
    if (!selectedVersionId || versions.length === 0) return null;
    return (
      versions.find(
        (version) =>
          version?.version_number != null &&
          String(version.version_number) === selectedVersionId
      ) || null
    );
  }, [selectedVersionId, versions]);
  const latestVersionMeta = useMemo(() => {
    if (versions.length === 0) return null;
    const currentFlagged =
      versions.find((version) => Boolean(version?.is_current)) || null;
    if (currentFlagged) return currentFlagged;

    return versions.reduce((latest: any, candidate: any) => {
      const latestNo = Number(latest?.version_number || 0);
      const candidateNo = Number(candidate?.version_number || 0);
      return candidateNo > latestNo ? candidate : latest;
    }, versions[0]);
  }, [versions]);
  const isSelectedCurrentVersion = useMemo(() => {
    if (versions.length === 0) return true;
    if (!latestVersionMeta) return false;

    const latestVersionNumber = Number(latestVersionMeta?.version_number);
    const selectedVersionNumber =
      Number(selectedVersionMeta?.version_number ?? selectedVersionId);

    if (!Number.isFinite(latestVersionNumber) || !Number.isFinite(selectedVersionNumber)) {
      return Boolean(selectedVersionMeta?.is_current);
    }

    return selectedVersionNumber === latestVersionNumber;
  }, [latestVersionMeta, selectedVersionId, selectedVersionMeta, versions.length]);
  const canEditSelectedVersion =
    isSelectedCurrentVersion &&
    !["rejected", "cancelled", "expired"].includes(normalizedQuoteStatus);
  const quoteNumber = getQuoteText(quote?.quote_number, quoteId) || quoteId;
  const validUntil = formatQuoteDate(getQuoteText(quote?.valid_until, quote?.expires_at) || null);
  const shootType = getQuoteDisplayShootTypeLabel(quote);
  const editAccessShootDateValue = getQuoteEditShootDateValue(quote);
  const terms = normalizeQuoteTerms(
    quote?.terms_conditions,
    getDefaultQuoteTerms(getQuoteText(quote?.valid_until, quote?.expires_at) || null)
  );
  const resolvedQuoteId = String(
    quote?.sales_quote_id ?? quote?.quote_id ?? quote?.id ?? quoteId
  );
  const quoteLeadId = useMemo(() => {
    const quoteRecord = quote as Record<string, unknown> | null;
    const directLeadId = Number(quoteRecord?.["lead_id"]);
    if (Number.isInteger(directLeadId) && directLeadId > 0) {
      return directLeadId;
    }

    const activityLeadId = Number(
      ((quote?.activities as QuoteActivityLike[] | undefined) || []).find(
        (activity) => activity?.metadata?.lead_id !== undefined && activity?.metadata?.lead_id !== null
      )?.metadata?.lead_id
    );

    return Number.isInteger(activityLeadId) && activityLeadId > 0 ? activityLeadId : null;
  }, [quote]);
  const { data: linkedLeadDetails, refetch: refetchLeadDetails } = useGetLeadByIdQuery(quoteLeadId ?? 0, {
    skip: !quoteLeadId,
  });
  const refreshQuotePrimaryContext = useCallback(async () => {
    try {
      const response = await salesApi.getQuoteDetail(quoteId);

      if (response?.error || response?.success === false) {
        return;
      }

      const latestQuoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
      if (!latestQuoteDetail) {
        return;
      }

      setQuote((current) => mergeVersionQuoteWithPrimaryContext(current, latestQuoteDetail));
    } catch (error) {
      console.error("Failed to refresh quote details", error);
    }
  }, [quoteId]);
  const syncConvertedQuoteState = useCallback(async (bookingId?: number | string | null) => {
    const normalizedBookingId =
      bookingId !== undefined && bookingId !== null && String(bookingId).trim()
        ? String(bookingId)
        : null;

    if (normalizedBookingId) {
      setConvertedBookingIdOverride(normalizedBookingId);
    }

    setIsConvertedOverride(true);
    setQuote((current) =>
      current
        ? {
          ...current,
          ...(normalizedBookingId ? { booking_id: normalizedBookingId } : {}),
        }
        : current
    );

    await refreshQuotePrimaryContext();
    if (quoteLeadId) {
      void refetchLeadDetails();
    }
    dispatch(salesRtkApi.util.invalidateTags([{ type: "Lead", id: "LIST" }]));
  }, [dispatch, quoteLeadId, refetchLeadDetails, refreshQuotePrimaryContext]);
  const conversionActivity = useMemo(() => {
    const activities = (quote?.activities as QuoteActivityLike[] | undefined) || [];

    return activities.find((activity) => {
      const message = String(activity?.message || "").toLowerCase();
      const activityType = String(activity?.activity_type || "").toLowerCase();
      const bookingId = getActivityBookingId(activity);
      return (
        Boolean(bookingId) &&
        (
          message.includes("converted to booking") ||
          message.includes("conversion reopened") ||
          activityType === "accepted" ||
          activityType === "updated"
        )
      );
    }) || null;
  }, [quote]);

  const convertedBookingId = useMemo(() => {
    if (convertedBookingIdOverride) return convertedBookingIdOverride;

    const directBookingId = quote?.booking_id;
    if (directBookingId !== undefined && directBookingId !== null && String(directBookingId).trim()) {
      return String(directBookingId);
    }

    const activityBookingId = conversionActivity?.metadata?.booking_id;
    if (activityBookingId !== undefined && activityBookingId !== null && String(activityBookingId).trim()) {
      return String(activityBookingId);
    }

    const parsedActivityBookingId = getActivityBookingId(conversionActivity);
    if (parsedActivityBookingId) {
      return parsedActivityBookingId;
    }

    return null;
  }, [conversionActivity, convertedBookingIdOverride, quote]);

  const convertModalInitialData = useMemo(
    () =>
      convertModalInitialDataOverride ||
      buildConvertModalInitialData(
        (quote?.converted_booking_details as QuoteConvertedBookingDetailsLike | undefined) ?? null
      ),
    [convertModalInitialDataOverride, quote]
  );

  const isConvertedToBooking = isConvertedOverride || Boolean(convertedBookingId) || Boolean(conversionActivity);
  const conversionMessage = isConvertedToBooking
    ? `Your quote has been converted into booking${convertedBookingId ? ` #${convertedBookingId}` : ""}. You can view it from Leads and continue with payments there.`
    : null;
  const conversionMetaLabel = conversionActivity?.created_at
    ? `Converted on ${formatQuoteDate(conversionActivity.created_at)}${conversionActivity?.performed_by?.name ? ` by ${conversionActivity.performed_by.name}` : ""}`
    : null;
  const bookingIdFromQuote = Number(convertedBookingId ?? quote?.booking_id);
  const resolvedBookingId = Number.isInteger(bookingIdFromQuote) && bookingIdFromQuote > 0 ? bookingIdFromQuote : null;
  const manualPaymentEntries = useMemo<ManualPaymentEntry[]>(() => {
    const parseEntries = (activities: Array<{ activity_type?: string; activity_data?: unknown; created_at?: string | null }> | undefined) =>
      (activities || [])
        .filter((activity) => activity?.activity_type === "payment_completed" && activity?.activity_data)
        .map((activity) => {
          try {
            const payload =
              typeof activity.activity_data === "string"
                ? JSON.parse(activity.activity_data)
                : activity.activity_data;
            if (!payload || (payload as ManualPaymentActivityMeta).payment_method !== "manual") return null;
            return {
              createdAt: activity.created_at || null,
              data: payload as ManualPaymentActivityMeta,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ManualPaymentEntry[];

    const leadEntries = parseEntries(linkedLeadDetails?.activities);
    const quoteEntries = parseEntries(quote?.activities as Array<{ activity_type?: string; activity_data?: unknown; created_at?: string | null }> | undefined);
    const merged = [...leadEntries, ...quoteEntries];

    const unique = merged.filter((entry, index, arr) => {
      const key = `${entry.createdAt || ""}|${entry.data.payment_type || ""}|${entry.data.amount || ""}|${entry.data.proof_url || ""}`;
      return index === arr.findIndex((candidate) => {
        const candidateKey = `${candidate.createdAt || ""}|${candidate.data.payment_type || ""}|${candidate.data.amount || ""}|${candidate.data.proof_url || ""}`;
        return candidateKey === key;
      });
    });

    return unique.sort(
      (a, b) =>
        new Date(String(b.createdAt || 0)).getTime() -
        new Date(String(a.createdAt || 0)).getTime()
    );
  }, [linkedLeadDetails?.activities, quote?.activities]);
  const leadPaymentStatus = String(linkedLeadDetails?.payment_status || "").toLowerCase();
  const totalPaymentAmount = Number(finalTotal || linkedLeadDetails?.pricing_breakdown?.total || 0);

  // Account for previous payments from lead or quote context
  const leadCollectedAmount = Number(linkedLeadDetails?.collected_amount) || 0;
  const quotePreviouslyPaid = Number(quote?.additional_payment?.previously_paid_amount) || 0;
  const summaryPaidAmount = Number(quote?.payment_summary?.paid_amount) || 0;
  const summaryCreditUsedAmount = Number(quote?.payment_summary?.credit_used_amount) || 0;
  const effectivePreviouslyPaid = Math.max(
    leadCollectedAmount + summaryCreditUsedAmount,
    quotePreviouslyPaid + summaryCreditUsedAmount,
    summaryPaidAmount + summaryCreditUsedAmount
  );

  const hasFullPaymentFromActivity = manualPaymentEntries.some((entry) => entry.data.payment_type === "full");
  const partialPaidFromActivity = manualPaymentEntries.reduce((sum, entry) => {
    if (entry.data.payment_type !== "partial") return sum;
    const numeric = Number(entry.data.amount || 0);
    return sum + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);
  const quotePaymentStatus = String(quote?.additional_payment?.payment_status || "").toLowerCase();
  const quoteOutstandingAmount = Number(quote?.additional_payment?.outstanding_amount) || 0;

  const hasFullPayment =
    (hasFullPaymentFromActivity || ["paid", "success", "completed"].includes(leadPaymentStatus)) &&
    quotePaymentStatus !== "pending" &&
    quoteOutstandingAmount <= 0;
  const paidAmount = hasFullPayment ? totalPaymentAmount : (effectivePreviouslyPaid || partialPaidFromActivity);
  const pendingAmount = totalPaymentAmount - paidAmount;
  const isPartiallyPaid = !hasFullPayment && paidAmount > 0 && pendingAmount > 0;
  const latestManualPaymentEntry = manualPaymentEntries[0] || null;
  const canTakeManualPayment = !hasFullPayment && pendingAmount > 0;
  const displayStatus = hasFullPayment
    ? "Paid"
    : isPartiallyPaid
      ? "Partially Paid"
      : quoteStatus;
  const normalizedDisplayStatus = displayStatus.trim().toLowerCase();
  const hasInvoiceablePaymentContext =
    effectivePreviouslyPaid > 0 ||
    partialPaidFromActivity > 0 ||
    quoteOutstandingAmount > 0 ||
    Boolean(quote?.additional_payment?.last_sent_at) ||
    Boolean(quote?.additional_payment?.invoice_url) ||
    Boolean(signedAt);
  const canSendInvoiceFromDetails =
    isSelectedCurrentVersion &&
    normalizedQuoteStatus !== "expired" &&
    (
      INVOICE_ACTION_VISIBLE_STATUSES.has(normalizedQuoteStatus) ||
      INVOICE_ACTION_VISIBLE_STATUSES.has(normalizedDisplayStatus) ||
      hasInvoiceablePaymentContext
    );
  const canViewInvoiceFromDetails = canSendInvoiceFromDetails;

  const ensureBookingForPayment = useCallback(async () => {
    if (resolvedBookingId) {
      return { bookingId: resolvedBookingId, leadId: quoteLeadId ?? undefined };
    }
    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return null;
    }

    const convertedDetails = (quote?.converted_booking_details as QuoteConvertedBookingDetailsLike | undefined) ?? null;
    const booking = linkedLeadDetails?.booking;
    const startDate = String(convertedDetails?.start_date || booking?.event_date || "").trim();
    const startTime = String(convertedDetails?.start_time || booking?.start_time || "").slice(0, 5);
    const endTime = String(convertedDetails?.end_time || booking?.end_time || "").slice(0, 5);
    if (!startDate || !startTime || !endTime) {
      toast.error("Missing booking date/time to auto-convert. Please convert once, then continue payment.");
      return null;
    }

    const response = await salesApi.convertQuoteToBooking(resolvedQuoteId, {
      booking_type: "single_day",
      time_zone: getBrowserTimeZone(),
      start_date: startDate,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      location: convertedDetails?.location || "",
    });

    if (!response?.success || !response?.data?.booking_id) {
      toast.error(response?.error || "Failed to convert quote to booking");
      return null;
    }

    setConvertedBookingIdOverride(String(response.data.booking_id));
    setIsConvertedOverride(true);
    toast.success(`Converted to booking #${response.data.booking_id}`);
    return {
      bookingId: Number(response.data.booking_id),
      leadId: quoteLeadId ?? (response.data.lead_id ? Number(response.data.lead_id) : undefined),
    };
  }, [linkedLeadDetails?.booking, quote, quoteLeadId, resolvedBookingId, resolvedQuoteId]);

  const handleManualProofUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingManualProof(true);
    try {
      const response = await salesApi.uploadManualPaymentProof(file);
      if (!response?.success || !response?.data?.proof_url) {
        toast.error(response?.error || response?.message || "Failed to upload proof");
        return;
      }
      setManualPaymentProofUrl(response.data.proof_url);
      setManualPaymentProofFileName(file.name);
      toast.success("Proof uploaded successfully");
    } finally {
      setIsUploadingManualProof(false);
    }
  };

  const handleManualPaymentSubmit = async () => {
    if (!quoteLeadId) {
      toast.error("Lead not linked with this quote");
      return;
    }
    if (!manualPaymentProofUrl.trim()) {
      toast.error("Proof upload is required");
      return;
    }
    if (manualPaymentType === "partial") {
      const amount = Number(manualPaymentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter valid partial amount");
        return;
      }
      if (amount > pendingAmount) {
        toast.error("Partial amount cannot exceed pending amount");
        return;
      }
    }

    const ensured = await ensureBookingForPayment();
    if (!ensured) return;

    setIsSubmittingManualPayment(true);
    try {
      const amount = Number(manualPaymentAmount);
      const response = await salesApi.recordLeadManualPayment(ensured.leadId ?? quoteLeadId, {
        payment_type: manualPaymentType,
        amount: manualPaymentType === "partial" ? amount : undefined,
        payment_mode: manualPaymentMode,
        other_payment_mode: manualPaymentMode === "other" ? manualPaymentOtherMode.trim() : undefined,
        proof_url: manualPaymentProofUrl.trim(),
        notes: manualPaymentNotes.trim() || undefined,
      });
      if (!response?.success) {
        toast.error(response?.error || response?.message || "Failed to save payment");
        return;
      }
      toast.success("Manual payment saved");
      setManualPaymentAmount("");
      setManualPaymentOtherMode("");
      setManualPaymentNotes("");
      setManualPaymentProofUrl("");
      setManualPaymentProofFileName("");
      void refetchLeadDetails();
    } finally {
      setIsSubmittingManualPayment(false);
    }
  };

  const handlePaymentTransactionAction = useCallback(async () => {
    if (!quoteLeadId) {
      toast.error("Lead is not linked with this quote yet.");
      return;
    }
    await ensureBookingForPayment();
    paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ensureBookingForPayment, quoteLeadId]);

  useEffect(() => {
    if (searchParams.get("action") !== "payment") return;
    if (!quote || hasTriggeredPaymentActionRef.current) return;
    hasTriggeredPaymentActionRef.current = true;
    void handlePaymentTransactionAction();
  }, [handlePaymentTransactionAction, quote, searchParams]);

  const breadcrumbOverrides = useMemo(
    () => ({
      quotes: "Quote",
      [quoteId]: "Quotes Details",
    }),
    [quoteId]
  );

  const handleRejectQuote = async () => {
    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    if (["rejected", "cancelled"].includes(normalizedQuoteStatus)) {
      toast("Quote is already rejected.");
      return;
    }

    setIsRejecting(true);
    try {
      const response = await salesApi.updateQuoteStatus(resolvedQuoteId, "rejected");

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to reject quote"
        );
      }

      const updatedQuote = unwrapSalesQuoteDetail(response?.data ?? null);
      setQuote((current) =>
        updatedQuote ?? (current ? { ...current, quote_status: "rejected", status: "rejected" } : current)
      );
      toast.success("Quote rejected successfully");
    } catch (error) {
      console.error("Failed to reject quote", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject quote");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConvertQuoteToBooking = async () => {
    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setConvertModalInitialDataOverride(
      buildConvertModalInitialData(
        (quote?.converted_booking_details as QuoteConvertedBookingDetailsLike | undefined) ?? null
      )
    );
    setConvertIntent("convert_only");
    setIsConvertModalOpen(true);
  };

  const handleViewInvoice = async () => {
    if (!isSelectedCurrentVersion) {
      toast.error("Invoices can only be viewed for the latest quote version.");
      return;
    }

    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setIsViewingInvoice(true);
    try {
      const response = await salesApi.previewQuoteInvoice(resolvedQuoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to preview invoice"
        );
      }

      const hostedInvoiceUrl = response.data?.invoiceUrl || null;
      const invoicePdfUrl = response.data?.invoicePdf || null;
      const invoiceBookingId =
        response.data?.booking_id !== undefined &&
          response.data?.booking_id !== null &&
          String(response.data.booking_id).trim()
          ? String(response.data.booking_id)
          : convertedBookingId;
      if (invoiceBookingId) {
        await syncConvertedQuoteState(invoiceBookingId);
      } else {
        await refreshQuotePrimaryContext();
      }
      const isManualInvoicePdf =
        typeof invoicePdfUrl === "string" &&
        /[?&]manual=(1|true)\b/i.test(invoicePdfUrl);
      const brandedPdfUrl = invoiceBookingId
        ? buildBeigeInvoiceUrl(invoiceBookingId, {
            manual: isManualInvoicePdf,
            cacheBust: true,
          })
        : null;
      const brandedDownloadUrl = invoiceBookingId
        ? buildBeigeInvoiceUrl(invoiceBookingId, {
            manual: isManualInvoicePdf,
            download: true,
            cacheBust: true,
          })
        : null;

      if (!hostedInvoiceUrl && !invoicePdfUrl) {
        throw new Error("Invoice preview URL is not available");
      }

      if (hostedInvoiceUrl && !invoicePdfUrl) {
        window.open(hostedInvoiceUrl, "_blank", "noopener,noreferrer");
      }

      if (invoicePdfUrl) {
        const link = document.createElement("a");
        if (!brandedDownloadUrl && !brandedPdfUrl) {
          throw new Error("Invoice PDF URL is not available");
        }
        link.href = brandedDownloadUrl || brandedPdfUrl || invoicePdfUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }

      toast.success("Invoice opened successfully");
    } catch (error) {
      console.error("Failed to preview invoice", error);
      toast.error(error instanceof Error ? error.message : "Failed to preview invoice");
    } finally {
      setIsViewingInvoice(false);
    }
  };

  const sendQuoteInvoiceRequest = async () => {
    if (!isSelectedCurrentVersion) {
      toast.error("Invoices can only be sent for the latest quote version.");
      return false;
    }

    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return false;
    }

    setIsSendingInvoice(true);
    try {
      const response = await salesApi.sendQuoteInvoice(resolvedQuoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string" ? response.error : "Failed to send quote invoice"
        );
      }

      if (response?.data?.booking_id) {
        await syncConvertedQuoteState(response.data.booking_id);
      } else {
        await refreshQuotePrimaryContext();
      }

      toast.success(response?.message || "Invoice sent successfully");
      return true;
    } catch (error) {
      console.error("Failed to send quote invoice", error);
      toast.error(error instanceof Error ? error.message : "Failed to send quote invoice");
      return false;
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    await sendQuoteInvoiceRequest();
  };

  const handleConvertBookingSubmit = async (
    bookingData: ConvertBookingModalSubmitData
  ) => {
    setIsConverting(true);
    try {
      const browserTimeZone = getBrowserTimeZone();
      let payload: SalesQuoteConvertToBookingPayload;

      if (bookingData.bookingType === "single_day") {
        if (!bookingData.singleDay) {
          throw new Error("Single day booking data is missing.");
        }

        payload = {
          booking_type: "single_day",
          time_zone: browserTimeZone,
          start_date: bookingData.singleDay.date,
          start_time: `${bookingData.singleDay.startTime}:00`,
          end_time: `${bookingData.singleDay.endTime}:00`,
        };
      } else {
        if (!bookingData.multiDay) {
          throw new Error("Multi day booking data is missing.");
        }

        payload = {
          booking_type: "multi_day",
          time_zone: browserTimeZone,
          booking_days: bookingData.multiDay.days.map((day) => ({
            date: day.date,
            start_time: `${day.startTime}:00`,
            end_time: `${day.endTime}:00`,
          })),
        };
      }

      const response = await salesApi.convertQuoteToBooking(resolvedQuoteId, payload);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : "Failed to convert quote to booking"
        );
      }

      const bookingId = response?.data?.booking_id;
      const alreadyConverted = Boolean(response?.data?.already_converted);
      const nextBookingId =
        bookingId !== undefined && bookingId !== null && String(bookingId).trim()
          ? String(bookingId)
          : null;

      if (nextBookingId) {
        setConvertedBookingIdOverride(nextBookingId);
      }
      setIsConvertedOverride(true);
      setConvertModalInitialDataOverride(bookingData);
      setQuote((current) =>
        current
          ? {
            ...current,
            ...(nextBookingId ? { booking_id: nextBookingId } : {}),
            converted_booking_details: {
              booking_type: bookingData.bookingType,
              location:
                bookingData.location ??
                ((current.converted_booking_details as QuoteConvertedBookingDetailsLike | undefined)
                  ?.location || ""),
              ...(bookingData.bookingType === "single_day" && bookingData.singleDay
                ? {
                  start_date: bookingData.singleDay.date,
                  start_time: `${bookingData.singleDay.startTime}:00`,
                  end_time: `${bookingData.singleDay.endTime}:00`,
                  booking_days: [
                    {
                      date: bookingData.singleDay.date,
                      start_time: `${bookingData.singleDay.startTime}:00`,
                      end_time: `${bookingData.singleDay.endTime}:00`,
                    },
                  ],
                }
                : {}),
              ...(bookingData.bookingType === "multi_day" && bookingData.multiDay
                ? {
                  booking_days: bookingData.multiDay.days.map((day) => ({
                    date: day.date,
                    start_time: `${day.startTime}:00`,
                    end_time: `${day.endTime}:00`,
                  })),
                }
                : {}),
            },
          }
          : current
      );

      toast.success(
        alreadyConverted
          ? `Your quote has already been converted into booking${bookingId ? ` #${bookingId}` : ""}. You can view it from Leads and continue with payments there.`
          : `Your quote has been converted into booking${bookingId ? ` #${bookingId}` : ""}. You can view it from Leads and continue with payments there.`
      );
      dispatch(salesRtkApi.util.invalidateTags([{ type: "Lead", id: "LIST" }]));
      setIsConvertModalOpen(false);
    } catch (error) {
      console.error("Failed to convert quote to booking", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to convert quote to booking"
      );
    } finally {
      setIsConverting(false);
    }
  };

  const proceedToEditQuote = (targetView: QuoteEditorView) => {
    if (!canEditSelectedVersion) {
      toast.error("Only the latest quote version can be edited.");
      return;
    }

    if (quote) {
      persistQuoteEditorNavigationCache(quoteId, quote);
    }

    toast.success("Opening quote editor");
    window.setTimeout(() => {
      router.push(
        `${baseHref}/create?quoteId=${encodeURIComponent(quoteId)}&view=${encodeURIComponent(targetView)}&editMode=full&returnTo=${encodeURIComponent(pathname)}`
      );
    }, 450);
  };

  const handleEditAccessProceed = async (payload: {
    reason: string;
    opsReviewConfirmed: boolean;
  }) => {
    if (!pendingEditView) {
      return;
    }

    setIsEditAccessSubmitting(true);

    try {
      const nextView = pendingEditView;
      persistQuoteEditorEditReason(quoteId, payload.reason, payload.opsReviewConfirmed);
      setPendingEditView(null);
      proceedToEditQuote(nextView);
    } catch (error) {
      console.error("Failed to confirm restricted quote edit access", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to confirm restricted quote edit access"
      );
    } finally {
      setIsEditAccessSubmitting(false);
    }
  };

  const topbarActions = (
    <QuoteTopActions
      onReject={() => {
        void handleRejectQuote();
      }}
      onConvert={() => {
        void handleConvertQuoteToBooking();
      }}
      onPaymentTransaction={() => {
        void handlePaymentTransactionAction();
      }}
      onPreview={() => setIsPreviewOpen(true)}
      previewDisabled={!quote || loading || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      rejectDisabled={!quote || loading || isRejecting || isConverting || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      convertDisabled={!quote || loading || isRejecting || isConverting || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      paymentDisabled={!quote || loading || isRejecting || isConverting || isSubmittingManualPayment || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      isRejecting={isRejecting}
      isConverting={isConverting}
      isRejected={["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      versions={versions}
      selectedVersionId={selectedVersionId}
      onVersionChange={(val) => setSelectedVersionId(val)}
    />
  );

  const selectedVersionNumber = selectedVersionMeta?.version_number ?? null;

  return (
    <div className={`quote-editor-theme min-h-screen ${isDark ? "quote-editor-theme-dark bg-[#0f0f0f] text-white" : "quote-editor-theme-light bg-[#F4F5F7] text-black"}`}>
      <TopbarComponent pathname={pathname} actions={topbarActions} breadcrumbOverrides={breadcrumbOverrides} />

      <div className="px-4 pb-10 pt-6 lg:px-9 lg:pb-14 lg:pt-8">
        <div className="mb-6 flex flex-col gap-4 lg:hidden">
          {topbarActions}
        </div>

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => router.push(baseHref)}
            className="flex items-center gap-2 text-[15px] text-[#D4D4D4] transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {!loading && quote && (
            <div className="flex lg:flex-wrap items-center gap-3">
              {canViewInvoiceFromDetails && (
                <Button
                  type="button"
                  onClick={() => {
                    void handleViewInvoice();
                  }}
                  disabled={isViewingInvoice || isSendingInvoice || isConverting}
                  variant="outline"
                  className={`h-11 rounded-xl border px-5 w-full lg:w-auto ${isDark ? "border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323]" : "border-[#0000004D] bg-white text-black hover:bg-[#F4F5F7]"}`}
                >
                  {isViewingInvoice ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                  {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
                </Button>
              )}
              {canSendInvoiceFromDetails && (
                <Button
                  type="button"
                  onClick={() => {
                    void handleSendInvoice();
                  }}
                  disabled={isViewingInvoice || isSendingInvoice || isConverting}
                  className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90 w-full lg:w-auto"
                >
                  {isSendingInvoice ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {isSendingInvoice ? "Sending Invoice..." : "Send Invoice"}
                </Button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className={`flex min-h-[360px] items-center justify-center rounded-[26px] border transition-colors ${isDark
            ? "border-[#2B2B2B] bg-[#171717]"
            : "border-[#000000]/10 bg-white"
            }`}
          >
            <div
              className={`flex items-center gap-3 text-base transition-colors ${isDark ? "text-[#D4D4D8]" : "text-[#000000]/60"
                }`}
            >
              <Loader2 size={18} className="animate-spin text-[#E8D1AB]" />
              Loading quote details...
            </div>
          </div>
        ) : !quote ? (
          <div
            className={`rounded-[26px] border p-8 text-center transition-colors ${isDark
              ? "border-[#2B2B2B] bg-[#171717]"
              : "border-[#000000]/10 bg-white"
              }`}
          >
            <p className={`text-xl font-semibold transition-colors ${isDark ? "text-white" : "text-[#000000]"}`}>
              Quote details unavailable
            </p>
            <p className={`mt-3 text-sm transition-colors ${isDark ? "text-[#A1A1AA]" : "text-[#000000]/50"}`}>
              {errorMessage || "The selected quote could not be loaded."}
            </p>
            <Button
              type="button"
              onClick={() => router.push(baseHref)}
              className="mt-6 bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
            >
              Back to Quotes
            </Button>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-6 pb-12 lg:pb-0">
            <SectionShell
              title="Client Information"
              actionLabel={canEditSelectedVersion ? "Edit Details" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("details") : undefined}
              isDark={isDark}
            >
              <div className="flex flex-col gap-3 lg:gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 lg:h-[74px] lg:w-[74px] shrink-0 items-center justify-center rounded-xl lg:rounded-[22px] bg-[#F3D9A7] text-lg lg:text-2xl font-semibold text-black">
                      {getInitials(clientName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between lg:justify-start gap-3">
                        <p className="break-words text-lg lg:text-[26px] font-semibold leading-tight text-white">
                          {clientName}
                        </p>
                        {selectedVersionNumber && (
                          <div className="flex flex-col items-start gap-1">
                            <span className={`text-nowrap rounded-full px-3 py-1 text-xs font-semibold border border-[#E8D1AB]/20 ${isDark ? "text-[#E8D1AB] bg-[#E8D1AB]/10" : "text-[#71717B] bg-[#E8D1AB]/30"}`}>
                              Quote Version {selectedVersionNumber}
                            </span>
                            {quote?.edit_reason && (
                              <p className="max-w-[300px] text-[13px] italic text-[#8F8F95] line-clamp-2" title={quote.edit_reason}>
                                "{quote.edit_reason}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 lg:text-2xl font-medium text-[#D8BC87]">
                        Amount: {formatQuoteCurrency(finalTotal)}
                      </p>
                      <p className="mt-2 text-xs lg:text-sm text-[#7E7E85]">Quote Number: {quoteNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col lg:items-end gap-2">
                    <span
                      className={`inline-flex h-fit w-fit items-center rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyles(
                        displayStatus
                      )}`}
                    >
                      {formatStatusLabel(displayStatus)}
                    </span>
                    {signatureBase64 && (
                      <div className="mt-3 flex flex-col items-center lg:items-end gap-2">
                        <div className="border border-white/10 rounded-lg p-2 bg-white">
                          <img src={signatureBase64} alt="Signature" className="max-h-16 max-w-[180px] object-contain" />
                        </div>
                        <p className="text-xs text-[#8F8F95]">{signerName ?? "Client"}</p>
                        {signedAt && <p className="text-xs text-[#8F8F95]">{formatQuoteDate(signedAt)}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {isConvertedToBooking ? (
                  <div className="rounded-lg lg:rounded-[20px] border border-[#86EFAC]/20 bg-[#DCFCE7] p-3 lg:px-5 lg:py-4">
                    <p className="text-xs lg:text-sm font-semibold text-[#166534]">
                      {conversionMessage}
                    </p>
                    {conversionMetaLabel ? (
                      <p className="mt-1 text-xs text-[#15803D]">{conversionMetaLabel}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs lg:text-sm transition-colors ${isDark ? "text-[#9B9BA1]" : "text-[#000000]/70"}`}>
                  <span>
                    Email ID :{" "}
                    <a
                      href={`mailto:${clientEmail}`}
                      title="Email ID"
                      className="break-all text-white transition-colors hover:opacity-80"
                    >
                      {clientEmail}
                    </a>
                  </span>
                  <span className={`hidden lg:inline transition-colors ${isDark ? "text-[#4B4B4F]" : "text-[#565656]/70"}`}>|</span>

                  <span>
                    Phone Number :{" "}
                    <a
                      href={`tel:${String(clientPhone).replace(/[^\d+]/g, "")}`}
                      title="Phone Number"
                      className="break-all text-white transition-colors hover:opacity-80"
                    >
                      {clientPhone}
                    </a>
                  </span>
                  <span className={`hidden lg:inline transition-colors ${isDark ? "text-[#4B4B4F]" : "text-[#565656]/70"}`}>|</span>

                  <span>{`Valid Until : ${validUntil}`}</span>
                  <span className={`hidden lg:inline transition-colors ${isDark ? "text-[#4B4B4F]" : "text-[#565656]/70"}`}>|</span>

                  <span className="break-words">{`Salesperson : ${salesperson}`}</span>
                </div>

                <p className={`break-words text-xs lg:text-sm leading-7 ${isDark ? "text-[#B3B3B8]" : "text-[#000000]/70"}`}>
                  <span className={isDark ? "text-[#8F8F95]" : "text-[#000000]/70"}>Project Description :</span> {projectDescription}
                </p>

                <div className={`flex items-start gap-2 text-xs lg:text-sm ${isDark ? "text-[#9B9BA1]" : "text-[#000000]/70"}`}>
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                  <span className="break-words">{clientAddress}</span>
                </div>
              </div>
            </SectionShell>

            {!["rejected", "cancelled"].includes(normalizedQuoteStatus) && (
              <SectionShell title="Payment" isDark={isDark}>
                <div className="space-y-4" ref={paymentSectionRef}>
                  {quoteLeadId ? (
                    <div className="rounded-lg lg:rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-4">
                      <h3 className="text-base font-semibold text-white">Manual Payment Update</h3>
                      {latestManualPaymentEntry?.createdAt ? (
                        <p className="mt-1 text-xs text-white/55">
                          Last updated {formatQuoteDate(latestManualPaymentEntry.createdAt)}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-white/70">
                        Paid: <span className="text-emerald-400">{formatQuoteCurrency(paidAmount)}</span>
                        {" · "}
                        Pending:{" "}
                        <span className={pendingAmount < 0 ? "text-red-400" : "text-amber-400"}>
                          {pendingAmount < 0 ? "-" : ""}
                          {formatQuoteCurrency(Math.abs(pendingAmount))}
                        </span>
                        {pendingAmount < 0 && (
                          <span className="ml-1 text-[10px] text-golden italic">
                            (This reduced amount will be added as Beige Credits after approval)
                          </span>
                        )}
                      </p>
                      {hasFullPayment ? (
                        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                          Full payment already completed. New payment entry is locked.
                        </div>
                      ) : null}

                      {canTakeManualPayment ? (
                        <>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {(["full", "partial"] as const).map((type) => {
                              const isActive = manualPaymentType === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setManualPaymentType(type)}
                                  disabled={hasFullPayment}
                                  className={`h-10 rounded-lg border text-sm font-medium transition-colors ${isActive
                                    ? isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/10 text-[#E8D1AB]" : "border-[#E8D1AB] bg-[#FFF7E6] text-[#000]"
                                    : isDark
                                      ? "border-white/20 text-white/70 hover:bg-white/5"
                                      : "border-[#000000]/15 text-[#000000]/70 hover:bg-[#000000]/5"
                                    }`}
                                >
                                  {type === "full" ? "Full Payment" : "Partial Payment"}
                                </button>
                              )
                            })}
                          </div>

                          {manualPaymentType === "partial" ? (
                            <input
                              type="number"
                              value={manualPaymentAmount}
                              onChange={(event) => setManualPaymentAmount(event.target.value)}
                              placeholder="Enter partial amount"
                              className={`mt-3 h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition-colors ${isDark
                                ? "border-white/20 text-white placeholder:text-white/40"
                                : "border-[#000000]/15 text-[#000000] placeholder:text-[#000000]/40"
                                }`}
                            />
                          ) : null}

                          <Select value={manualPaymentMode} onValueChange={(value) => setManualPaymentMode(value as ManualPaymentMode)}>
                            <SelectTrigger className={`mt-3 h-11 rounded-lg border bg-transparent px-3 text-sm transition-colors ${isDark ? "border-white/20 text-white" : "border-[#000000]/15 text-[#000000]"}`}>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent
                              className={`transition-colors ${isDark
                                ? "border-[#333333] bg-[#111111] text-white"
                                : "border-[#000000]/10 bg-white text-[#000000]"
                                }`}
                            >
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="wire">Wire</SelectItem>
                              <SelectItem value="ach">ACH</SelectItem>
                              <SelectItem value="zelle">Zelle</SelectItem>
                              <SelectItem value="venmo">Venmo</SelectItem>
                              <SelectItem value="cashapp">CashApp</SelectItem>
                              <SelectItem value="applepay">ApplePay</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>

                          {manualPaymentMode === "other" ? (
                            <input
                              type="text"
                              value={manualPaymentOtherMode}
                              onChange={(event) => setManualPaymentOtherMode(event.target.value)}
                              placeholder="Enter payment mode"
                              className={`mt-3 h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition-colors ${isDark
                                ? "border-white/20 text-white placeholder:text-white/40"
                                : "border-[#000000]/15 text-[#000000] placeholder:text-[#000000]/40"
                                }`}
                            />
                          ) : null}

                          <div
                            className={`mt-3 rounded-lg border p-3 transition-colors ${isDark ? "border-white/20" : "border-[#000000]/15"
                              }`}
                          >
                            <label className={`mb-2 block text-xs transition-colors ${isDark ? "text-[#71717B]" : "text-[#000000]/50"}`}>
                              Proof Upload (Required)
                            </label>
                            <label
                              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${isDark
                                ? "border-white/20 text-white hover:bg-white/5"
                                : "border-[#000000]/15 text-[#000000] hover:bg-[#000000]/5"
                                }`}
                            >
                              <ArrowUpToLine size={14} />
                              {isUploadingManualProof ? "Uploading..." : "Choose File"}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0] || null;
                                  void handleManualProofUpload(file);
                                }}
                              />
                            </label>
                            {manualPaymentProofFileName ? (
                              <p className={`mt-2 text-xs transition-colors ${isDark ? "text-[#71717B]" : "text-[#000000]/50"}`}>
                                {manualPaymentProofFileName}
                              </p>
                            ) : null}
                          </div>

                          <textarea
                            value={manualPaymentNotes}
                            onChange={(event) => setManualPaymentNotes(event.target.value)}
                            placeholder="Add notes"
                            className={`mt-3 min-h-[84px] w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors ${isDark
                              ? "border-white/20 text-white placeholder:text-white/40"
                              : "border-[#000000]/15 text-[#000000] placeholder:text-[#000000]/40"
                              }`}
                          />

                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              onClick={() => {
                                void handleManualPaymentSubmit();
                              }}
                              disabled={isSubmittingManualPayment || isUploadingManualProof || hasFullPayment}
                              className="h-11 rounded-lg lg:rounded-xl bg-[#E8D1AB] px-6 text-black hover:bg-[#E8D1AB]/90 w-full lg:w-auto flex items-center gap-2 justify-center"
                            >
                              {isSubmittingManualPayment ? <Loader2 size={16} className="animate-spin" /> : null}
                              {isSubmittingManualPayment ? "Saving..." : "Save Manual Payment"}
                            </Button>
                          </div>
                        </>
                      ) : null}

                      {manualPaymentEntries.length > 0 ? (
                        <div className="mt-3 rounded-lg border border-white/15 bg-white/[0.02] p-3">
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">
                            Uploaded Payment Proofs
                          </p>
                          <div className="space-y-2">
                            {manualPaymentEntries.map((entry, index) => {
                              const proofUrl = resolveS3ProofUrl(entry.data.proof_url);
                              const paidMode = entry.data.payment_mode
                                ? String(entry.data.payment_mode).replace(/_/g, " ")
                                : "manual";

                              return (
                                <div
                                  key={`${entry.createdAt || "entry"}-${index}`}
                                  className="rounded-md border border-white/10 px-3 py-2 text-xs"
                                >
                                  <p className="text-white/80">
                                    {entry.data.payment_type === "partial"
                                      ? `Partial paid ${formatQuoteCurrency(Number(entry.data.amount || 0))}`
                                      : "Full payment marked"}{" "}
                                    via {paidMode}
                                  </p>
                                  <p className="mt-1 text-white/45">
                                    {entry.createdAt ? formatQuoteDate(entry.createdAt) : "Date unavailable"}
                                  </p>
                                  {proofUrl ? (
                                    <a
                                      href={proofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1 inline-block text-[#E8D1AB] underline underline-offset-2"
                                    >
                                      Download Proof
                                    </a>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : isConvertedToBooking ? (
                    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                      <p className="text-sm text-emerald-200">
                        This quote is already converted to booking
                        {convertedBookingId ? ` #${convertedBookingId}` : ""}.
                      </p>
                      <p className="mt-1 text-xs text-emerald-300/90">
                        <Loader2 />
                        Lead linkage is unavailable in this response, so manual payment updates from this panel are hidden.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#8F8F95]">Lead is not linked with this quote yet.</p>
                  )}
                </div>
              </SectionShell>
            )}

            <SectionShell
              title={`Service Includes (${String(serviceItems.length).padStart(2, "0")})`}
              actionLabel={canEditSelectedVersion ? "Edit Services" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("services") : undefined}
              isDark={isDark}
            >
              {serviceItems.length > 0 ? (
                <div className="space-y-4">
                  {serviceItems.map((item) => (
                    <ServiceLineCard
                      key={item.id}
                      item={item}
                      shootType={shootType}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No services added to this quote.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Add-On Includes"
              actionLabel={canEditSelectedVersion ? "Edit Add ons" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("addons") : undefined}
              isDark={isDark}
            >
              {addonItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {addonItems.map((item) => (
                    <div
                      key={item.id}
                      title={`${item.name} x ${item.quantity}`}
                      className={`min-w-0 max-w-full rounded-lg lg:rounded-[14px] border p-3 lg:px-5 lg:py-4 sm:max-w-[360px] transition-colors ${isDark
                        ? "border-[#2B2B2B] bg-[#111111]"
                        : "border-[#000000]/10 bg-white"
                        }`}
                    >
                      <p className="truncate text-sm lg:text-lg font-medium text-[#D8BC87]">{item.name}</p>
                      <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-[#8F8F95]" : "text-[#000000]/50"}`}>Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No add-ons included.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Logistics"
              actionLabel={canEditSelectedVersion ? "Edit Logistics" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("logistics") : undefined}
              isDark={isDark}
            >
              {logisticsItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {logisticsItems.map((item) => (
                    <div
                      key={item.id}
                      title={item.name}
                      className={`min-w-0 max-w-full rounded-lg lg:rounded-[14px] border p-3 lg:px-5 lg:py-4 text-sm lg:text-lg sm:max-w-[360px] transition-colors ${isDark
                        ? "border-[#2B2B2B] bg-[#111111] text-[#9B9BA1]"
                        : "border-[#000000]/10 bg-white text-[#000000]/60"
                        }`}
                    >
                      <p className="truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No logistics items added.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Custom Line Item"
              actionLabel={canEditSelectedVersion ? "Edit Items" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("customlineitems") : undefined}
              isDark={isDark}
            >
              {customItems.length > 0 ? (
                <div className="space-y-3">
                  {customItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-1.5 lg:gap-3 rounded-lg lg:rounded-[18px] border p-3 lg:px-5 lg:py-4 lg:flex-row lg:items-center lg:justify-between transition-colors ${isDark
                        ? "border-[#2B2B2B] bg-[#111111]"
                        : "border-[#000000]/10 bg-white"
                        }`}
                    >
                      <span
                        className="min-w-0 flex-1 break-words pr-0 text-sm lg:text-[20px] font-medium text-white lg:pr-6"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span className="shrink-0 text-sm lg:text-[22px] font-semibold text-[#D8BC87]">
                        {formatQuoteCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No custom line items added.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Other Details"
              actionLabel={canEditSelectedVersion ? "Edit Tax & Discounts" : undefined}
              onAction={canEditSelectedVersion ? () => setPendingEditView("discounts") : undefined}
              isDark={isDark}
            >
              <div className="space-y-3 lg:space-y-6">
                <div className="inline-flex rounded-lg lg:rounded-2xl border border-[#2B2B2B] bg-[#111111] p-1">
                  <button
                    type="button"
                    onClick={() => setOtherDetailsTab("discounts")}
                    className={`rounded-xl lg:rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${otherDetailsTab === "discounts"
                      ? "bg-[#E8D1AB] text-black"
                      : "text-[#8F8F95]"
                      }`}
                  >
                    Discounts
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtherDetailsTab("tax")}
                    className={`rounded-xl lg:rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${otherDetailsTab === "tax"
                      ? "bg-[#E8D1AB] text-black"
                      : "text-[#8F8F95]"
                      }`}
                  >
                    Tax
                  </button>
                </div>

                {otherDetailsTab === "discounts" ? (
                  <div
                    className={`rounded-lg lg:rounded-[22px] border px-4 lg:px-5 py-2 transition-colors ${isDark
                      ? "border-[#2B2B2B] bg-[#111111]"
                      : "border-[#000000]/10 bg-white"
                      }`}
                  >
                    <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className={`lg:text-2xl font-semibold transition-colors ${isDark ? "text-white" : "text-[#000000]"}`}>
                          Discount Type
                        </p>
                        <p className={`mt-1 text-xs lg:text-sm transition-colors ${isDark ? "text-[#8F8F95]" : "text-[#000000]/50"}`}>
                          {isFixedDiscount ? "$ off subtotal" : "% off subtotal"}
                        </p>
                      </div>

                      {/* Type Badge Metric Display */}
                      <div className={`inline-flex items-center gap-3 rounded-lg lg:rounded-2xl px-4 py-3 transition-colors ${isDark ? "bg-[#1A1A1A]" : "bg-[#000000]/[0.02] border border-[#000000]/5"}`}>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors bg-[#E8D1AB] text-black`}>
                          {isFixedDiscount ? <DollarSign size={20} /> : <Percent size={20} />}
                        </div>
                        <div>
                          <p className={`lg:text-lg font-semibold transition-colors ${isDark ? "text-white" : "text-[#000000]"}`}>
                            {isFixedDiscount ? "Fixed Amount" : "Percentage"}
                          </p>
                          <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-[#8F8F95]" : "text-[#000000]/50"}`}>
                            {isFixedDiscount ? formatQuoteCurrency(discountValue) : `${discountValue}%`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Row Data Metrics Panels */}
                    <div className={`border-t transition-colors ${isDark ? "border-[#2B2B2B]" : "border-[#000000]/10"}`} />
                    <DetailRow
                      label="Discount Amount"
                      value={formatQuoteCurrency(discountAmount)}
                      isDark={isDark}
                    />

                    <div className={`border-t transition-colors ${isDark ? "border-[#2B2B2B]" : "border-[#000000]/10"}`} />
                    <DetailRow
                      label="Total After Discount"
                      value={formatQuoteCurrency(discountedSubtotal)}
                      isDark={isDark}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg lg:rounded-[22px] border border-[#2B2B2B] bg-[#111111] px-4 lg:px-5 py-2">
                    <DetailRow label="Tax Type" value={taxType} isDark={isDark} />
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Tax Rate" value={`${taxRate}%`} isDark={isDark} />
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Tax Amount" value={formatQuoteCurrency(taxAmount)} isDark={isDark} />
                  </div>
                )}

                <div className="rounded-lg lg:rounded-[22px] border border-[#2B2B2B] bg-[#111111] px-4 lg:px-5 py-2">
                  <DetailRow label="Subtotal" value={formatQuoteCurrency(subtotal)} isDark={isDark} />
                  {discountAmount > 0 ? (
                    <>
                      <div className="border-t border-[#2B2B2B]" />
                      <DetailRow label="Total After Discount" value={formatQuoteCurrency(discountedSubtotal)} isDark={isDark} />
                    </>
                  ) : null}
                  <div className="border-t border-[#2B2B2B]" />
                  <DetailRow label="Final Total" value={formatQuoteCurrency(finalTotal)} isDark={isDark} />
                </div>

                {terms.length > 0 ? (
                  <div className="rounded-lg lg:rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-4 lg:p-5">
                    <p className="lg:text-lg font-semibold text-white">Terms & Conditions</p>
                    <div className={`mt-4 lg:space-y-2 text-xs lg:text-sm leading-4 lg:leading-7 ${isDark ? "text-[#B3B3B8]" : "text-[#71717B]"}`}>
                      {terms.map((term, index) => (
                        <p key={`${term}-${index}`}>{term}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionShell>

            {/* --- FLOATING MOBILE BUTTON --- */}
            <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#0f0f0f]`}>

              <Button
                type="button"
                onClick={handleRejectQuote}
                disabled={!quote || loading || isRejecting || isConverting || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
                className="h-11 rounded-xl border border-[#FCA5A5]/20 bg-[#FECACA] px-4 text-[#DC2626] hover:bg-[#FECACA]/90 w-full"
              >
                {isRejecting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                {isRejecting ? "Rejecting..." : ["rejected", "cancelled"].includes(normalizedQuoteStatus) ? "Rejected" : "Reject Quote"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                disabled={(!quote || loading || ["rejected", "cancelled"].includes(normalizedQuoteStatus)) || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
                className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed w-full"
              >
                <Eye size={18} />
                Preview Quote
              </Button>
            </div>
          </div>
        )}
      </div>

      <QuotePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={quote}
        quoteId={quoteId}
        showShareActions={isSelectedCurrentVersion}
        paymentSummaryOverrides={previewPaymentSummaryOverrides}
      />
      <EditAccessModalComponent
        open={pendingEditView !== null}
        onClose={() => {
          if (isEditAccessSubmitting) {
            return;
          }
          setPendingEditView(null);
        }}
        onProceed={(payload) => {
          void handleEditAccessProceed(payload);
        }}
        quoteNumber={quoteNumber}
        clientName={clientName}
        shootDateValue={editAccessShootDateValue}
        isSubmitting={isEditAccessSubmitting}
      />
      <ConvertBookingModal
        open={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSubmit={(data) => {
          void handleConvertBookingSubmit(data);
        }}
        isSubmitting={isConverting}
        isDark={isDark}
        initialData={convertModalInitialData}
        showLocationField={false}
        title={
          isConvertedToBooking
            ? "Update Booking"
            : "Convert to Booking"
        }
        description={
          isConvertedToBooking
            ? "Review or update the existing booking date and time below."
            : "Select booking type, shoot date and time before continuing."
        }
        submitLabel={
          isConvertedToBooking
            ? "Save Booking Details"
            : "Convert to Booking"
        }
      />
    </div>
  );
}
