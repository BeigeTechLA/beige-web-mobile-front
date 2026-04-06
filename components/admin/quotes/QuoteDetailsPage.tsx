"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Percent,
  Radio,
  Scissors,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { Button } from "@/components/ui/button";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
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

type QuoteActivityLike = {
  activity_type?: string;
  message?: string;
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

const getStatusStyles = (status: string) => {
  const normalizedStatus = status.trim().toLowerCase();

  if (["paid"].includes(normalizedStatus)) {
    return "border border-[#86EFAC]/20 bg-[#DCFCE7] text-[#166534]";
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
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
          {getServiceIcon(item.name)}
        </div>
        <div>
          <p className="text-[17px] font-semibold text-white">
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
  onPreview,
  previewDisabled,
  rejectDisabled,
  convertDisabled,
  isRejecting,
  isConverting,
  isConverted,
  convertedBookingId,
}: {
  onReject: () => void;
  onConvert: () => void;
  onPreview: () => void;
  previewDisabled: boolean;
  rejectDisabled: boolean;
  convertDisabled: boolean;
  isRejecting: boolean;
  isConverting: boolean;
  isConverted: boolean;
  convertedBookingId: string | null;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    <Button
      type="button"
      onClick={onReject}
      disabled={rejectDisabled}
      className="h-11 rounded-xl border border-[#FCA5A5]/20 bg-[#FECACA] px-4 text-[#DC2626] hover:bg-[#FECACA]/90"
    >
      {isRejecting ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
      {isRejecting ? "Rejecting..." : "Reject Quote"}
    </Button>
    {isConverted ? (
      <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#86EFAC]/20 bg-[#DCFCE7] px-4 text-sm font-semibold text-[#166534]">
        <FileText size={18} />
        {convertedBookingId ? `Booking Created #${convertedBookingId}` : "Converted to Booking"}
      </div>
    ) : (
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
    )}
    <Button
      type="button"
      onClick={onPreview}
      disabled={previewDisabled}
      className="h-11 rounded-xl bg-[#E8D1AB] px-5 text-black hover:bg-[#E8D1AB]/90"
    >
      <Eye size={18} />
      Preview Quote
    </Button>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <p className="text-base text-[#8F8F95]">{label}</p>
    <p className="text-right text-base font-semibold text-white">{value}</p>
  </div>
);

export default function QuoteDetailsPage({
  quoteId,
  baseHref,
  TopbarComponent,
}: QuoteDetailsPageProps) {
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [otherDetailsTab, setOtherDetailsTab] = useState<OtherDetailsTab>("discounts");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBookingIdOverride, setConvertedBookingIdOverride] = useState<string | null>(null);
  const [isConvertedOverride, setIsConvertedOverride] = useState(false);

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
  const quoteNumber = getQuoteText(quote?.quote_number, quoteId) || quoteId;
  const validUntil = formatQuoteDate(getQuoteText(quote?.valid_until, quote?.expires_at) || null);
  const shootType = getQuoteDisplayShootTypeLabel(quote);
  const terms = normalizeQuoteTerms(
    quote?.terms_conditions,
    getDefaultQuoteTerms(getQuoteText(quote?.valid_until, quote?.expires_at) || null)
  );
  const resolvedQuoteId = String(
    quote?.sales_quote_id ?? quote?.quote_id ?? quote?.id ?? quoteId
  );
  const conversionActivity = useMemo(() => {
    const activities = (quote?.activities as QuoteActivityLike[] | undefined) || [];

    return activities.find((activity) => {
      const message = String(activity?.message || "").toLowerCase();
      return (
        activity?.activity_type === "updated" &&
        message.includes("converted to booking")
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

    if (conversionActivity?.metadata_json) {
      try {
        const parsed =
          typeof conversionActivity.metadata_json === "string"
            ? JSON.parse(conversionActivity.metadata_json)
            : conversionActivity.metadata_json;
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "booking_id" in parsed &&
          parsed.booking_id !== undefined &&
          parsed.booking_id !== null
        ) {
          return String(parsed.booking_id);
        }
      } catch {
        return null;
      }
    }

    return null;
  }, [conversionActivity, convertedBookingIdOverride, quote]);

  const isConvertedToBooking = isConvertedOverride || Boolean(convertedBookingId) || Boolean(conversionActivity);
  const conversionMessage = isConvertedToBooking
    ? `Your quote has been converted into booking${convertedBookingId ? ` #${convertedBookingId}` : ""}. You can view it from Leads and continue with payments there.`
    : null;
  const conversionMetaLabel = conversionActivity?.created_at
    ? `Converted on ${formatQuoteDate(conversionActivity.created_at)}${conversionActivity?.performed_by?.name ? ` by ${conversionActivity.performed_by.name}` : ""}`
    : null;

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

    setIsConverting(true);
    try {
      const response = await salesApi.convertQuoteToBooking(resolvedQuoteId);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : "Failed to convert quote to booking"
        );
      }

      const bookingId = response?.data?.booking_id;
      const alreadyConverted = Boolean(response?.data?.already_converted);
      if (bookingId) {
        setConvertedBookingIdOverride(String(bookingId));
      }
      setIsConvertedOverride(true);

      toast.success(
        alreadyConverted
          ? `Your quote has already been converted into booking${bookingId ? ` #${bookingId}` : ""}. You can view it from Leads and continue with payments there.`
          : `Your quote has been converted into booking${bookingId ? ` #${bookingId}` : ""}. You can view it from Leads and continue with payments there.`
      );
    } catch (error) {
      console.error("Failed to convert quote to booking", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to convert quote to booking"
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleEditQuote = (targetView: QuoteEditorView) => {
    if (quote) {
      persistQuoteEditorNavigationCache(quoteId, quote);
    }

    toast.success("Opening quote editor");
    window.setTimeout(() => {
      router.push(`${baseHref}/create?quoteId=${encodeURIComponent(quoteId)}&view=${encodeURIComponent(targetView)}`);
    }, 450);
  };

  const topbarActions = (
    <QuoteTopActions
      onReject={() => {
        void handleRejectQuote();
      }}
      onConvert={() => {
        void handleConvertQuoteToBooking();
      }}
      onPreview={() => setIsPreviewOpen(true)}
      previewDisabled={!quote || loading}
      rejectDisabled={!quote || loading || isRejecting || isConverting || ["rejected", "cancelled"].includes(normalizedQuoteStatus)}
      convertDisabled={!quote || loading || isRejecting || isConverting || isConvertedToBooking}
      isRejecting={isRejecting}
      isConverting={isConverting}
      isConverted={isConvertedToBooking}
      convertedBookingId={convertedBookingId}
    />
  );

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

        <button
          type="button"
          onClick={() => router.push(baseHref)}
          className="mb-6 flex items-center gap-2 text-[15px] text-[#D4D4D4] transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

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
              onAction={() => handleEditQuote("details")}
            >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[22px] bg-[#F3D9A7] text-[24px] font-semibold text-black">
                      {getInitials(clientName)}
                    </div>
                    <div>
                      <p className="text-[26px] font-semibold text-white">{clientName}</p>
                      <p className="mt-1 text-[24px] font-medium text-[#D8BC87]">
                        Amount: {formatQuoteCurrency(finalTotal)}
                      </p>
                      <p className="mt-2 text-sm text-[#7E7E85]">Quote Number: {quoteNumber}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex h-fit items-center rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyles(
                      quoteStatus
                    )}`}
                  >
                    {formatStatusLabel(quoteStatus)}
                  </span>
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
                  <span>{`Email ID : ${clientEmail}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span>{`Phone Number : ${clientPhone}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span>{`Valid Until : ${validUntil}`}</span>
                  <span className="hidden text-[#4B4B4F] lg:inline">|</span>
                  <span>{`Salesperson : ${salesperson}`}</span>
                </div>

                <p className="text-sm leading-7 text-[#B3B3B8]">
                  <span className="text-[#8F8F95]">Project Description :</span> {projectDescription}
                </p>

                <div className="flex items-center gap-2 text-sm text-[#9B9BA1]">
                  <MapPin size={16} className="text-[#E8D1AB]" />
                  {clientAddress}
                </div>
              </div>
            </SectionShell>

            <SectionShell
              title={`Service Includes (${String(serviceItems.length).padStart(2, "0")})`}
              actionLabel="Edit Services"
              onAction={() => handleEditQuote("services")}
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
              onAction={() => handleEditQuote("addons")}
            >
              {addonItems.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {addonItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[14px] border border-[#2B2B2B] bg-[#111111] px-5 py-4 text-[18px] text-[#D8BC87]"
                    >
                      {`${item.name} x ${item.quantity}`}
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
              onAction={() => handleEditQuote("logistics")}
            >
              {logisticsItems.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[18px] text-[#9B9BA1]">
                  {logisticsItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <span>{item.name}</span>
                      {index < logisticsItems.length - 1 ? (
                        <span className="text-[#4B4B4F]">|</span>
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-base text-[#8F8F95]">No logistics items added.</p>
              )}
            </SectionShell>

            <SectionShell
              title="Custom Line Item"
              actionLabel="Edit Items"
              onAction={() => handleEditQuote("customlineitems")}
            >
              {customItems.length > 0 ? (
                <div className="space-y-3">
                  {customItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-[18px] border border-[#2B2B2B] bg-[#111111] px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <span className="text-[20px] font-medium text-white">{item.name}</span>
                      <span className="text-[22px] font-semibold text-[#D8BC87]">
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
              onAction={() => handleEditQuote("discounts")}
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
                            {discountType === "fixed" ? "$ off subtotal" : "% off subtotal"}
                          </p>
                        </div>
                      <div className="inline-flex items-center gap-3 rounded-[16px] bg-[#1A1A1A] px-4 py-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E8D1AB] text-black">
                          {discountType === "fixed" ? <DollarSign size={20} /> : <Percent size={20} />}
                        </div>
                        <div>
                          <p className="text-[18px] font-semibold text-white">
                            {discountType === "fixed" ? "Fixed Amount" : "Percentage"}
                          </p>
                          <p className="text-sm text-[#8F8F95]">
                            {discountType === "fixed" ? formatQuoteCurrency(discountValue) : `${discountValue}%`}
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
                    <div className="border-t border-[#2B2B2B]" />
                    <DetailRow label="Total After Discount" value={formatQuoteCurrency(discountedSubtotal)} />
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
    </div>
  );
}
