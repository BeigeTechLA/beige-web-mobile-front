"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpToLine,
  Camera,
  DollarSign,
  Eye,
  FileText,
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
import QuoteEditAccessModal from "@/components/admin/quotes/QuoteEditAccessModal";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  salesApi,
  type SalesQuoteConvertToBookingPayload,
  type SalesQuoteDetailData,
} from "@/lib/api";
import { salesApi as salesRtkApi, useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
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
};

type OtherDetailsTab = "discounts" | "tax";
type QuoteConvertIntent = "convert_only" | "send_invoice";

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

const resolveSignatureSource = (rawData: any) => {
  const source =
    rawData?.signature_base64 ??
    rawData?.data?.signature_base64 ??
    rawData?.signature_path ??
    rawData?.data?.signature_path;

  if (!source) return null;

  if (source.startsWith("http") || source.startsWith("data:")) {
    return source;
  }

  return joinAssetUrl(S3_PREFIX, source);
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
    return "border border-white/10 bg-[#E5E7EB] text-[#4B5563]";
  }

  return "border border-[#E8D1AB]/20 bg-[#2A2418] text-[#E8D1AB]";
};

const formatStatusLabel = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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
    className="h-10 rounded-xl bg-[#E8D1AB] px-4 text-sm font-semibold text-black hover:bg-[#E8D1AB]/90"
  >
    {label}
  </Button>
);

const SectionShell = ({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) => (
  <section className="rounded-[26px] border border-[#2B2B2B] bg-[#171717]">
    <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
      <h2 className="text-[18px] font-semibold text-white lg:text-[20px]">{title}</h2>
      {actionLabel && onAction ? <SectionActionButton label={actionLabel} onClick={onAction} /> : null}
    </div>
    <div className="border-t border-dashed border-[#343434]" />
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
    <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
          {getServiceIcon(item.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="break-words text-[17px] font-semibold leading-7 text-white"
            title={detailLabel ? `${item.name} - ${detailLabel}` : item.name}
          >
            {item.name}
            {detailLabel ? <span className="text-[#E8D1AB]"> - {detailLabel}</span> : null}
          </p>
        </div>
      </div>
    </div>

    <div className="mt-5 border-t border-[#2B2B2B]" />

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 text-[#8F8F95]">
        <p className="text-base">Quantity</p>
        <p className="text-base">Duration</p>
        <p className="text-base">Crew Size</p>
        <p className="text-base">Estimate Pricing</p>
      </div>
      <div className="space-y-3 text-left text-[18px] font-semibold text-white lg:text-right">
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
  onSendInvoice,
  previewDisabled,
  sendDisabled,
  rejectDisabled,
  convertDisabled,
  showSendInvoice,
  paymentDisabled,
  isRejecting,
  isConverting,
  isSendingInvoice,
  versions,
  selectedVersionId,
  onVersionChange,
}: {
  onReject: () => void;
  onConvert: () => void;
  onPaymentTransaction: () => void;
  onPreview: () => void;
  onSendInvoice: () => void;
  previewDisabled: boolean;
  sendDisabled: boolean;
  rejectDisabled: boolean;
  convertDisabled: boolean;
  showSendInvoice: boolean;
  paymentDisabled: boolean;
  isRejecting: boolean;
  isConverting: boolean;
  isSendingInvoice: boolean;
  versions: any[];
  selectedVersionId: string | null;
  onVersionChange: (val: string) => void;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    {versions.length > 0 && (
      <div className="mr-2 flex items-center gap-2">
        <span className="text-sm font-medium text-[#8F8F95]">Version:</span>
        <Select value={selectedVersionId || ""} onValueChange={onVersionChange}>
          <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-[#1B1B1B] text-white">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1B1B1B] text-white">
            {versions.map((v) => (
              <SelectItem key={v.sales_quote_version_id || v.id} value={(v.sales_quote_version_id || v.id).toString()}>
                Version {v.version_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}
    <Button
      type="button"
      onClick={onReject}
      disabled={rejectDisabled}
      className="h-11 rounded-xl border border-[#FCA5A5]/20 bg-[#FECACA] px-4 text-[#DC2626] hover:bg-[#FECACA]/90"
    >
      {isRejecting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
      {isRejecting ? "Rejecting..." : "Reject Quote"}
    </Button>
    <Button
      type="button"
      onClick={onConvert}
      disabled={convertDisabled}
      variant="outline"
      className="h-11 rounded-xl border-white/10 bg-[#1B1B1B] px-4 text-white hover:bg-[#232323]"
    >
      {isConverting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
      {isConverting ? "Converting..." : "Convert to Booking"}
    </Button>
    <Button
      type="button"
      onClick={onPaymentTransaction}
      disabled={paymentDisabled}
      variant="outline"
      className="h-11 rounded-xl border-[#E8D1AB]/30 bg-[#201A10] px-4 text-[#E8D1AB] hover:bg-[#2A2114]"
    >
      <DollarSign size={18} />
      Record Payment
    </Button>
    <Button
      type="button"
      onClick={onPreview}
      disabled={previewDisabled}
      className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90"
    >
      <Eye size={18} />
      Preview Quote
    </Button>
    {showSendInvoice ? (
      <Button
        type="button"
        onClick={onSendInvoice}
        disabled={sendDisabled}
        className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90"
      >
        {isSendingInvoice ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
        {isSendingInvoice ? "Sending Invoice..." : "Send Invoice"}
      </Button>
    ) : null}
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <p className="shrink-0 text-base text-[#8F8F95]">{label}</p>
    <p className="max-w-[65%] break-words text-right text-base font-semibold text-white">{value}</p>
  </div>
);

export default function QuoteDetailsPage({
  quoteId,
  baseHref,
  TopbarComponent,
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

        if (!isMounted) {
          return;
        }

        setQuote(quoteDetail);
        const rawData =
          response?.data && typeof response.data === "object"
            ? (response.data as Record<string, unknown>)
            : null;
        const nestedData =
          rawData?.data && typeof rawData.data === "object"
            ? (rawData.data as Record<string, unknown>)
            : null;
        const sig =
          typeof rawData?.signature_base64 === "string"
            ? rawData.signature_base64
            : typeof nestedData?.signature_base64 === "string"
              ? nestedData.signature_base64
              : null;
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
        }

        // Fetch versions after loading initial details
        const versionsRes = await salesApi.getQuoteVersions(quoteId);
        if (versionsRes?.success && isMounted) {
          const versionsData = Array.isArray(versionsRes.data) ? versionsRes.data : versionsRes.data?.versions || [];
          setVersions(versionsData);
          // Set initial selected version to the current one if found
          const currentVersion =
            versionsData.find((v: any) => v?.is_current && v?.id != null) ||
            versionsData.find((v: any) => v?.id != null);
          if (currentVersion?.id != null && !selectedVersionId) {
            setSelectedVersionId(String(currentVersion.id));
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
    
    // Skip if this is already the currently displayed quote's version
    if (quote && (quote.version_id?.toString() === selectedVersionId || quote.id?.toString() === selectedVersionId)) {
       return;
    }

    let isMounted = true;
    const fetchVersionDetail = async () => {
      setLoading(true);
      try {
        const response = await salesApi.getQuoteVersionDetail(quoteId, selectedVersionId);
        if (response?.success && isMounted) {
          const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
          if (quoteDetail) {
            setQuote(quoteDetail);
          }
        }
      } catch (error) {
        console.error("Failed to fetch quote version detail", error);
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
  const clientPhone = getQuoteText(quote?.client_phone, "N/A") || "N/A";
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
  const canSendInvoiceFromDetails = ["accepted", "approved", "confirmed"].includes(
    normalizedQuoteStatus
  );
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
    const leadId = Number((quote as Record<string, unknown> | null)?.["lead_id"]);
    return Number.isInteger(leadId) && leadId > 0 ? leadId : null;
  }, [quote]);
  const { data: linkedLeadDetails, refetch: refetchLeadDetails } = useGetLeadByIdQuery(quoteLeadId ?? 0, {
    skip: !quoteLeadId,
  });
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
  const totalPaymentAmount = Number(linkedLeadDetails?.pricing_breakdown?.total || finalTotal || 0);
  const hasFullPaymentFromActivity = manualPaymentEntries.some((entry) => entry.data.payment_type === "full");
  const partialPaidFromActivity = manualPaymentEntries.reduce((sum, entry) => {
    if (entry.data.payment_type !== "partial") return sum;
    const numeric = Number(entry.data.amount || 0);
    return sum + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);
  const hasFullPayment =
    hasFullPaymentFromActivity ||
    ["paid", "success", "completed"].includes(leadPaymentStatus);
  const paidAmount = hasFullPayment ? totalPaymentAmount : partialPaidFromActivity;
  const pendingAmount = Math.max(totalPaymentAmount - paidAmount, 0);
  const isPartiallyPaid = !hasFullPayment && paidAmount > 0 && pendingAmount > 0;
  const latestManualPaymentEntry = manualPaymentEntries[0] || null;
  const canTakeManualPayment = !hasFullPayment && pendingAmount > 0;
  const displayStatus = hasFullPayment
    ? "Paid"
    : isPartiallyPaid
      ? "Partially Paid"
      : quoteStatus;

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
    if (!resolvedQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    if (!isConvertedToBooking) {
      toast.error("Convert this quote to a booking before viewing the invoice.");
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
      const apiBase = (
        process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/"
      ).replace(/\/$/, "");
      const proxiedPdfUrl = invoiceBookingId
        ? `${apiBase}/sales/invoice-pdf/${invoiceBookingId}?t=${Date.now()}`
        : null;
      const proxiedDownloadUrl = invoiceBookingId
        ? `${apiBase}/sales/invoice-pdf/${invoiceBookingId}?download=1&t=${Date.now()}`
        : null;

      if (!hostedInvoiceUrl && !invoicePdfUrl) {
        throw new Error("Invoice preview URL is not available");
      }

      if (hostedInvoiceUrl) {
        window.open(hostedInvoiceUrl, "_blank", "noopener,noreferrer");
      }

      if (invoicePdfUrl) {
        const link = document.createElement("a");
        if (!proxiedDownloadUrl && !proxiedPdfUrl) {
          throw new Error("Invoice PDF URL is not available");
        }
        link.href = proxiedDownloadUrl || proxiedPdfUrl || invoicePdfUrl;
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
        setConvertedBookingIdOverride(String(response.data.booking_id));
        setIsConvertedOverride(true);
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

    if (!isConvertedToBooking || !convertedBookingId) {
      setConvertIntent("send_invoice");
      setIsConvertModalOpen(true);
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

      if (convertIntent === "send_invoice") {
        await sendQuoteInvoiceRequest();
      }
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
    if (quote) {
      persistQuoteEditorNavigationCache(quoteId, quote);
    }

    toast.success("Opening quote editor");
    window.setTimeout(() => {
      router.push(`${baseHref}/create?quoteId=${encodeURIComponent(quoteId)}&view=${encodeURIComponent(targetView)}`);
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
      const response = await salesApi.updateQuote(quoteId, {
        edit_reason: payload.reason,
        ops_review_confirmed: payload.opsReviewConfirmed,
      });

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : "Failed to confirm restricted edit access"
        );
      }

      const nextView = pendingEditView;
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
      onSendInvoice={() => {
        void handleSendInvoice();
      }}
      previewDisabled={!quote || loading}
      sendDisabled={!quote || loading || isRejecting || isConverting || isSendingInvoice}
      rejectDisabled={!quote || loading || isRejecting || isConverting || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      convertDisabled={!quote || loading || isRejecting || isConverting}
      showSendInvoice={Boolean(quote) && canSendInvoiceFromDetails}
      paymentDisabled={!quote || loading || isRejecting || isConverting || isSubmittingManualPayment}
      isRejecting={isRejecting}
      isConverting={isConverting}
      isSendingInvoice={isSendingInvoice}
      versions={versions}
      selectedVersionId={selectedVersionId}
      onVersionChange={(val) => setSelectedVersionId(val)}
    />
  );

  const selectedVersionNumber = useMemo(() => {
     if (!selectedVersionId || versions.length === 0) return null;
     const v = versions.find((version) => version?.id != null && String(version.id) === selectedVersionId);
     return v ? v.version_number : null;
  }, [selectedVersionId, versions]);

  return (
    <div
      className={`quote-editor-theme min-h-screen ${
        isDark
          ? "quote-editor-theme-dark bg-[#0f0f0f] text-white"
          : "quote-editor-theme-light bg-[#F4F5F7] text-black"
      }`}
    >
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
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[26px] border border-[#2B2B2B] bg-[#171717]">
            <div className="flex items-center gap-3 text-base text-[#D4D4D8]">
              <Loader2 size={18} className="animate-spin text-[#E8D1AB]" />
              Loading quote details...
            </div>
          </div>
        ) : !quote ? (
          <div className="rounded-[26px] border border-[#2B2B2B] bg-[#171717] p-8 text-center">
            <p className="text-xl font-semibold text-white">Quote details unavailable</p>
            <p className="mt-3 text-sm text-[#A1A1AA]">
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
          <div className="space-y-6">
            <SectionShell
              title="Client Information"
              actionLabel="Edit Details"
              onAction={() => setPendingEditView("details")}
            >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[22px] bg-[#F3D9A7] text-[24px] font-semibold text-black">
                      {getInitials(clientName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="break-words text-[26px] font-semibold leading-tight text-white">
                          {clientName}
                        </p>
                        {selectedVersionNumber && (
                           <div className="flex flex-col items-start gap-1">
                             <span className="rounded-full bg-[#E8D1AB]/10 px-3 py-1 text-xs font-semibold text-[#E8D1AB] border border-[#E8D1AB]/20">
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
                      <p className="mt-1 text-[24px] font-medium text-[#D8BC87]">
                        Amount: {formatQuoteCurrency(finalTotal)}
                      </p>
                      <p className="mt-2 text-sm text-[#7E7E85]">Quote Number: {quoteNumber}</p>
                    </div>
                  </div>
                      <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex h-fit items-center rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyles(
                      displayStatus
                    )}`}
                  >
                    {formatStatusLabel(displayStatus)}
                  </span>
                        {signatureBase64 && (
                          <div className="mt-3 flex flex-col items-end gap-2">
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
                  <div className="rounded-[20px] border border-[#86EFAC]/20 bg-[#DCFCE7] px-5 py-4">
                    <p className="text-sm font-semibold text-[#166534]">
                      {conversionMessage}
                    </p>
                    {conversionMetaLabel ? (
                      <p className="mt-1 text-xs text-[#15803D]">{conversionMetaLabel}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9B9BA1]">
                  <span className="break-all">{`Email ID : ${clientEmail}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span className="break-all">{`Phone Number : ${clientPhone}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span>{`Valid Until : ${validUntil}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span className="break-words">{`Salesperson : ${salesperson}`}</span>
                </div>

                <p className="break-words text-sm leading-7 text-[#B3B3B8]">
                  <span className="text-[#8F8F95]">Project Description :</span> {projectDescription}
                </p>

                <div className="flex items-start gap-2 text-sm text-[#9B9BA1]">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                  <span className="break-words">{clientAddress}</span>
                </div>
              </div>
            </SectionShell>

            <SectionShell title="Payment">
              <div className="space-y-4" ref={paymentSectionRef}>
                {quoteLeadId ? (
                  <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-4">
                    <h3 className="text-base font-semibold text-white">Manual Payment Update</h3>
                    {latestManualPaymentEntry?.createdAt ? (
                      <p className="mt-1 text-xs text-white/55">
                        Last updated {formatQuoteDate(latestManualPaymentEntry.createdAt)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-white/70">
                      Paid: <span className="text-emerald-400">{formatQuoteCurrency(paidAmount)}</span>
                      {" · "}
                      Pending: <span className="text-amber-400">{formatQuoteCurrency(pendingAmount)}</span>
                    </p>
                    {hasFullPayment ? (
                      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                        Full payment already completed. New payment entry is locked.
                      </div>
                    ) : null}

                    {canTakeManualPayment ? (
                      <>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {(["full", "partial"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setManualPaymentType(type)}
                              disabled={hasFullPayment}
                              className={`h-10 rounded-lg border text-sm font-medium ${
                                manualPaymentType === type
                                  ? "border-[#E8D1AB] bg-[#E8D1AB]/10 text-[#E8D1AB]"
                                  : "border-white/20 text-white/70"
                              }`}
                            >
                              {type === "full" ? "Full Payment" : "Partial Payment"}
                            </button>
                          ))}
                        </div>

                        {manualPaymentType === "partial" ? (
                          <input
                            type="number"
                            value={manualPaymentAmount}
                            onChange={(event) => setManualPaymentAmount(event.target.value)}
                            placeholder="Enter partial amount"
                            className="mt-3 h-11 w-full rounded-lg border border-white/20 bg-transparent px-3 text-sm text-white outline-none"
                          />
                        ) : null}

                        <Select value={manualPaymentMode} onValueChange={(value) => setManualPaymentMode(value as ManualPaymentMode)}>
                          <SelectTrigger className="mt-3 h-11 rounded-lg border border-white/20 bg-transparent px-3 text-sm text-white">
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent className="border-[#333333] bg-[#111111] text-white">
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>

                        {manualPaymentMode === "other" ? (
                          <input
                            type="text"
                            value={manualPaymentOtherMode}
                            onChange={(event) => setManualPaymentOtherMode(event.target.value)}
                            placeholder="Enter payment mode"
                            className="mt-3 h-11 w-full rounded-lg border border-white/20 bg-transparent px-3 text-sm text-white outline-none"
                          />
                        ) : null}

                        <div className="mt-3 rounded-lg border border-white/20 p-3">
                          <label className="mb-2 block text-xs text-[#71717B]">Proof Upload (Required)</label>
                          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 text-sm text-white">
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
                            <p className="mt-2 text-xs text-[#71717B]">{manualPaymentProofFileName}</p>
                          ) : null}
                        </div>

                        <textarea
                          value={manualPaymentNotes}
                          onChange={(event) => setManualPaymentNotes(event.target.value)}
                          placeholder="Add notes"
                          className="mt-3 min-h-[84px] w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none"
                        />

                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              void handleManualPaymentSubmit();
                            }}
                            disabled={isSubmittingManualPayment || isUploadingManualProof || hasFullPayment}
                            className="h-11 rounded-xl bg-[#E8D1AB] px-6 text-black hover:bg-[#E8D1AB]/90"
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
                ) : (
                  <p className="text-sm text-[#8F8F95]">Lead is not linked with this quote yet.</p>
                )}
              </div>
            </SectionShell>

            <SectionShell
              title={`Service Includes (${String(serviceItems.length).padStart(2, "0")})`}
              actionLabel="Edit Services"
              onAction={() => setPendingEditView("services")}
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
              actionLabel="Edit Add ons"
              onAction={() => setPendingEditView("addons")}
            >
              {addonItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {addonItems.map((item) => (
                    <div
                      key={item.id}
                      title={`${item.name} x ${item.quantity}`}
                      className="min-w-0 max-w-full rounded-[14px] border border-[#2B2B2B] bg-[#111111] px-5 py-4 sm:max-w-[360px]"
                    >
                      <p className="truncate text-[18px] font-medium text-[#D8BC87]">{item.name}</p>
                      <p className="mt-1 text-sm text-[#8F8F95]">Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No add-ons included.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Logistics"
              actionLabel="Edit Logistics"
              onAction={() => setPendingEditView("logistics")}
            >
              {logisticsItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {logisticsItems.map((item) => (
                    <div
                      key={item.id}
                      title={item.name}
                      className="min-w-0 max-w-full rounded-[14px] border border-[#2B2B2B] bg-[#111111] px-5 py-4 text-[18px] text-[#9B9BA1] sm:max-w-[360px]"
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
              actionLabel="Edit Items"
              onAction={() => setPendingEditView("customlineitems")}
            >
              {customItems.length > 0 ? (
                <div className="space-y-3">
                  {customItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-[18px] border border-[#2B2B2B] bg-[#111111] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <span
                        className="min-w-0 flex-1 break-words pr-0 text-[20px] font-medium text-white lg:pr-6"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[22px] font-semibold text-[#D8BC87]">
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
              actionLabel="Edit Tax & Discounts"
              onAction={() => setPendingEditView("discounts")}
            >
              <div className="space-y-6">
                <div className="inline-flex rounded-[16px] border border-[#2B2B2B] bg-[#111111] p-1">
                  <button
                    type="button"
                    onClick={() => setOtherDetailsTab("discounts")}
                    className={`rounded-[12px] px-5 py-2.5 text-sm font-semibold transition-colors ${
                      otherDetailsTab === "discounts"
                        ? "bg-[#E8D1AB] text-black"
                        : "text-[#8F8F95]"
                    }`}
                  >
                    Discounts
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtherDetailsTab("tax")}
                    className={`rounded-[12px] px-5 py-2.5 text-sm font-semibold transition-colors ${
                      otherDetailsTab === "tax"
                        ? "bg-[#E8D1AB] text-black"
                        : "text-[#8F8F95]"
                    }`}
                  >
                    Tax
                  </button>
                </div>

                {otherDetailsTab === "discounts" ? (
                  <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] px-5 py-2">
                    <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[24px] font-semibold text-white">Discount Type</p>
                          <p className="mt-1 text-sm text-[#8F8F95]">
                            {isFixedDiscount ? "$ off subtotal" : "% off subtotal"}
                          </p>
                        </div>
                      <div className="inline-flex items-center gap-3 rounded-[16px] bg-[#1A1A1A] px-4 py-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E8D1AB] text-black">
                          {isFixedDiscount ? <DollarSign size={20} /> : <Percent size={20} />}
                        </div>
                        <div>
                          <p className="text-[18px] font-semibold text-white">
                            {isFixedDiscount ? "Fixed Amount" : "Percentage"}
                          </p>
                          <p className="text-sm text-[#8F8F95]">
                            {isFixedDiscount ? formatQuoteCurrency(discountValue) : `${discountValue}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow
                      label="Discount Amount"
                      value={formatQuoteCurrency(discountAmount)}
                    />
                    <div className="border-t border-[#2B2B2B]" />
                      <DetailRow
                        label="Total After Discount"
                        value={formatQuoteCurrency(discountedSubtotal)}
                      />
                    </div>
                  ) : (
                  <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] px-5 py-2">
                    <DetailRow label="Tax Type" value={taxType} />
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Tax Rate" value={`${taxRate}%`} />
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Tax Amount" value={formatQuoteCurrency(taxAmount)} />
                  </div>
                )}

                  <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] px-5 py-2">
                    <DetailRow label="Subtotal" value={formatQuoteCurrency(subtotal)} />
                    {discountAmount > 0 ? (
                      <>
                        <div className="border-t border-[#2B2B2B]" />
                        <DetailRow label="Total After Discount" value={formatQuoteCurrency(discountedSubtotal)} />
                      </>
                    ) : null}
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Final Total" value={formatQuoteCurrency(finalTotal)} />
                  </div>

                {terms.length > 0 ? (
                  <div className="rounded-[22px] border border-[#2B2B2B] bg-[#111111] p-5">
                    <p className="text-[18px] font-semibold text-white">Terms & Conditions</p>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-[#B3B3B8]">
                      {terms.map((term, index) => (
                        <p key={`${term}-${index}`}>{term}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionShell>
          </div>
        )}
      </div>

      <QuotePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={quote}
        quoteId={quoteId}
      />
      <QuoteEditAccessModal
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
          convertIntent === "send_invoice"
            ? isConvertedToBooking
              ? "Update Booking Before Sending Invoice"
              : "Convert to Booking Before Sending Invoice"
            : isConvertedToBooking
              ? "Update Booking"
              : "Convert to Booking"
        }
        description={
          convertIntent === "send_invoice"
            ? isConvertedToBooking
              ? "Review or update the existing booking date and time below, then continue to send the invoice."
              : "This quote must be converted to a booking before an invoice can be sent. Complete the booking details below to continue."
            : isConvertedToBooking
              ? "Review or update the existing booking date and time below."
              : "Select booking type, shoot date and time before continuing."
        }
        submitLabel={
          convertIntent === "send_invoice"
            ? isConvertedToBooking
              ? "Save & Send Invoice"
              : "Convert & Send Invoice"
            : isConvertedToBooking
              ? "Save Booking Details"
              : "Convert to Booking"
        }
      />
    </div>
  );
}
