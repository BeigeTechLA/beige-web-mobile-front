"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

import {
  Calendar,
  MapPin,
  Camera,
  ChevronDown,
  ArrowLeft,
  Percent,
  DollarSign,
  MapPinned,
  Copy,
  Plus,
  X,
  Clock,
  Circle,
  Edit,
  Pencil,
  Edit2,
  ArrowUpToLine,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetLeadByIdQuery,
  useUpdateBookingCrewMutation,
  useRemoveAssignedCrewMutation,
  useGenerateDiscountCodeMutation,
  useUpdateLeadIntentMutation
} from "@/lib/redux/features/sales/salesApi";

import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";
import { parseDate } from "@/src/components/landing/lib/utils";
import GeneratePaymentLink from "@/components/sales/GeneratePaymentLink";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import BookingStatusStepper from "@/components/sales/BookingStatusStepper";
import Topbar from "@/components/admin/Topbar";
import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreativePartnerProfile } from "@/components/admin/users/CreativePartnerProfile";
import ConvertBookingModal, {
  type ConvertBookingModalInitialData,
  type ConvertBookingModalSubmitData,
} from "@/components/admin/quotes/ConvertBookingModal";
import SalesQuoteEditAccessModal from "@/components/sales/quotes/SalesQuoteEditAccessModal";
import {
  salesApi,
  type LeadBookingSchedulePayload,
} from "@/lib/api";
import { buildBeigeInvoiceUrl } from "@/lib/invoiceUrl";
import {
  getQuoteAdditionalPaymentDetails,
  getQuotePaymentProgressDetails,
} from "@/lib/quoteDetail";
import { persistQuoteEditorEditReason, type QuoteEditorView } from "@/lib/quoteEdit";
import { getBrowserTimeZone } from "@/lib/timezone";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";
const ASSIGN_TO_ME_VALUE = "__assign_to_me__";

const resolveS3ProofUrl = (value?: string | null) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (/^https?:\/\//i.test(rawValue)) return rawValue;

  const normalizedPrefix = String(S3_PREFIX || "").replace(/\/+$/, "");
  const normalizedPath = rawValue.replace(/^\/+/, "");
  return normalizedPrefix
    ? `${normalizedPrefix}/${normalizedPath}`
    : rawValue;
};

/** 
 * UPDATED ROLE MAPPING LOGIC
 * 1 or 9 -> Videographer
 * 2 or 10 -> Photographer
 * 3 or 11 -> Editor
 */
const getRoleLabel = (roleData: any): string => {
  try {
    let roles: string[] = [];
    if (typeof roleData === 'string') {
      if (roleData.startsWith('[')) {
        roles = JSON.parse(roleData);
      } else {
        roles = [roleData];
      }
    } else if (Array.isArray(roleData)) {
      roles = roleData.map(r => r.toString());
    }

    if (roles.some(r => r === "1" || r === "9")) return "Videographer";
    if (roles.some(r => r === "2" || r === "10")) return "Photographer";
    if (roles.some(r => r === "3" || r === "11")) return "Editor";
    return "Creative Partner";
  } catch (e) {
    return "Creative Partner";
  }
};

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (status: string): string => {
  if (status === "booked") return "Booked";
  if (status === "payment_pending") return "Payment Pending";
  if (status === "abandoned") return "Cancelled";
  return "In-Progress";
};

// Helper to format date for the UI (e.g., 12 Mar 2026)
const formatDateUI = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTimeUI = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const parsedDate = parseDate(dateStr) || new Date(dateStr);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatLeadSource = (value?: string | null) => {
  if (!value) return "Website";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatStatusLabel = (value?: string | null) => {
  if (!value) return "Pending";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCurrencyValue = (value?: number | string | null) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));

  if (!Number.isFinite(numericValue)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const normalizeTimeKey = (value?: string | null) => String(value || "").slice(0, 5);

const formatTimeForApi = (value: string) => `${value}:00`;

const QUOTE_LINE_ITEM_CATEGORY_LABELS: Record<string, string> = {
  service: "Services",
  addon: "Add-ons",
  logistics: "Logistics",
  uncategorized: "Other Items",
};

type LeadActivityLike = {
  activity_type?: string;
  activity_data?: unknown;
  created_at?: string;
};

type ManualPaymentActivityMeta = {
  booking_id?: number | string | null;
  booking_manual_payment_id?: number | string | null;
  manual_payment_id?: number | string | null;
  payment_method?: string;
  payment_type?: string;
  payment_mode?: string;
  other_payment_mode?: string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
  proof_url?: string | null;
  notes?: string | null;
};

type QuoteLineItemLike = {
  line_item_id?: number;
  item_id?: number | null;
  name?: string;
  item_name?: string;
  quantity?: number | string;
  unit_price?: number | string;
  total?: number | string;
  line_total?: number | string;
  notes?: string | null;
};

type QuoteTaxDetailsLike = {
  tax_type?: string | null;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
};

type ConvertedQuoteLike = QuoteTaxDetailsLike & {
  sales_quote_id?: number | string | null;
  custom_quote_id?: number | string | null;
  pricing_mode?: string | null;
  shoot_hours?: number | string | null;
  subtotal?: number | string | null;
  discount?: number | string | null;
  discount_amount?: number | string | null;
  price_after_discount?: number | string | null;
  total?: number | string | null;
  expires_at?: string | null;
  status?: string | null;
  line_items?: QuoteLineItemLike[];
  items?: QuoteLineItemLike[];
};

type BookingDayLike = {
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type HoverTooltipProps = {
  message: string;
  isDark?: boolean;
  align?: "left" | "right";
};

function HoverTooltip({
  message,
  isDark = true,
  align = "left",
}: HoverTooltipProps) {
  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border px-3 py-2 text-xs leading-5 shadow-xl opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
        align === "right" ? "right-0" : "left-0"
      } ${
        isDark
          ? "border-[#3D3D3D] bg-[#111111] text-white/80"
          : "border-[#E7D7BC] bg-white text-black/75"
      }`}
    >
      {message}
    </div>
  );
}

export default function SalesLeadDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const leadId = params.id as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { allowed, isLoading: isPermissionLoading } = useRequireModulePermission(
    "sales_representative",
    "view",
    "/sales/dashboard",
  );

  const [discount, setDiscount] = useState("");
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [usageType, setUsageType] = useState<"one_time" | "multi_use">("one_time");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [activeCPIndex, setActiveCPIndex] = useState(0);
  const [generatedDiscountId, setGeneratedDiscountId] = useState<number | undefined>(undefined);
  const [isCPModalOpen, setIsCPModalOpen] = useState(false);
  const [selectedCPId, setSelectedCPId] = useState<string | null>(null);
  const [isEditingSalesRep, setIsEditingSalesRep] = useState(false);
  const [isUpdatingSalesRep, setIsUpdatingSalesRep] = useState(false);
  const [isLoadingSalesReps, setIsLoadingSalesReps] = useState(false);
  const [salesRepOptions, setSalesRepOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isConvertedBookingEditModalOpen, setIsConvertedBookingEditModalOpen] = useState(false);
  const [isUpdatingConvertedBooking, setIsUpdatingConvertedBooking] = useState(false);
  const [pendingEditView, setPendingEditView] = useState<QuoteEditorView | null>(null);
  const [isEditAccessSubmitting, setIsEditAccessSubmitting] = useState(false);
  const [manualPaymentType, setManualPaymentType] = useState<"full" | "partial">("full");
  const [manualPaymentAmount, setManualPaymentAmount] = useState("");
  const [manualPaymentMode, setManualPaymentMode] = useState<"cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "other" | "net30">("cash");
  const [manualPaymentOtherMode, setManualPaymentOtherMode] = useState("");
  const [manualPaymentProofUrl, setManualPaymentProofUrl] = useState("");
  const [manualPaymentProofFileName, setManualPaymentProofFileName] = useState("");
  const [isUploadingManualProof, setIsUploadingManualProof] = useState(false);
  const [manualPaymentNotes, setManualPaymentNotes] = useState("");
  const [isSubmittingManualPayment, setIsSubmittingManualPayment] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const resolvedUserId = parsedUser?.id ?? parsedUser?.user?.id;
      setCurrentUserId(resolvedUserId ? String(resolvedUserId) : "");
    } catch (error) {
      console.error("Failed to read logged in user from localStorage:", error);
      setCurrentUserId("");
    }
  }, []);

  useEffect(() => {
    const fetchSalesReps = async () => {
      setIsLoadingSalesReps(true);
      try {
        const result = await salesApi.getSalesReps();
        if (result.success && Array.isArray(result.data)) {
          setSalesRepOptions(
            result.data.map((rep: any) => ({
              label: rep.name || `${rep.first_name || ""} ${rep.last_name || ""}`.trim() || `Representative #${rep.id}`,
              value: String(rep.id),
            }))
          );
        } else {
          setSalesRepOptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch sales representatives:", error);
        setSalesRepOptions([]);
      } finally {
        setIsLoadingSalesReps(false);
      }
    };

    fetchSalesReps();
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  // Fetch real lead data
  const {
    data: leadData,
    isLoading,
    error,
    refetch
  } = useGetLeadByIdQuery(parseInt(leadId), {
    skip: !leadId,
  });

  // Discount code generation
  const [generateDiscountCode, { isLoading: isGenerating }] =
    useGenerateDiscountCodeMutation();

  const [updateLeadIntent] = useUpdateLeadIntentMutation();
  const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const lead = leadData;
  const booking = lead?.booking;
  const primaryQuote = booking?.primary_quote;
  const projectedQuote = lead?.projected_quote;
  const rawAdditionalPayment = lead?.custom_quote?.additional_payment;
  const normalizedLeadPaymentStatus = String(lead?.payment_status || "").trim().toLowerCase();
  const normalizedAdditionalPaymentStatus = String(rawAdditionalPayment?.payment_status || "").trim().toLowerCase();
  const additionalPaymentOutstandingAmount = Number(
    rawAdditionalPayment?.outstanding_amount ?? 0
  );
  const hasPendingAdditionalPayment =
    additionalPaymentOutstandingAmount > 0 &&
    !["paid", "success", "completed"].includes(
      String(rawAdditionalPayment?.payment_status || "").trim().toLowerCase()
    );

  useEffect(() => {
    // Refetch lead data on mount to ensure fresh data after navigating back from quote editor
    refetch();
  }, [refetch]);

  const additionalPaymentDetails = useMemo(() => {
    if (!rawAdditionalPayment) return null;

    const actuallyPaidAmount = Number(lead?.pricing_breakdown?.total_paid ?? 0);
    const revisedTotal = Number(
      lead?.custom_quote?.total ??
      lead?.pricing_breakdown?.total ??
      rawAdditionalPayment.revised_total ??
      0
    );
    const paymentDetails = getQuoteAdditionalPaymentDetails(
      (lead?.custom_quote ?? null) as any,
      {
        revisedTotalOverride: revisedTotal,
        previouslyPaidOverride:
          Number.isFinite(actuallyPaidAmount) && actuallyPaidAmount > 0
            ? actuallyPaidAmount
            : undefined,
      }
    );

    if (!paymentDetails) {
      return null;
    }

    if (
      Math.abs(paymentDetails.additionalAmount) <= 0.009 &&
      paymentDetails.previouslyPaidAmount <= 0 &&
      paymentDetails.revisedTotal <= 0 &&
      paymentDetails.outstandingAmount <= 0 &&
      !String(rawAdditionalPayment.payment_status || "").trim() &&
      !rawAdditionalPayment.invoice_number &&
      !rawAdditionalPayment.last_sent_at
    ) {
      return null;
    }

    const leadSignalsPaid =
      ["paid", "success", "completed"].includes(normalizedLeadPaymentStatus) ||
      Boolean(booking?.payment_id || booking?.payment_completed_at);
    const isSettledAdditionalPayment =
      leadSignalsPaid &&
      additionalPaymentOutstandingAmount <= 0.009 &&
      (normalizedAdditionalPaymentStatus === "" ||
        ["paid", "success", "completed"].includes(normalizedAdditionalPaymentStatus));

    return {
      additionalAmount: paymentDetails.additionalAmount,
      isDecrease: paymentDetails.isDecrease,
      paymentStatus: isSettledAdditionalPayment ? "paid" : paymentDetails.paymentStatus,
      paymentStatusLabel: formatStatusLabel(
        isSettledAdditionalPayment
          ? "paid"
          : (paymentDetails.paymentStatus || rawAdditionalPayment.payment_status)
      ),
      previousTotal: paymentDetails.previousTotal,
      previouslyPaidAmount: paymentDetails.previouslyPaidAmount,
      revisedTotal: paymentDetails.revisedTotal,
      outstandingAmount: isSettledAdditionalPayment ? 0 : paymentDetails.outstandingAmount,
      invoiceNumber: rawAdditionalPayment.invoice_number
        ? String(rawAdditionalPayment.invoice_number).trim()
        : null,
      lastSentAtLabel: formatDateTimeUI(rawAdditionalPayment.last_sent_at),
    };
  }, [
    rawAdditionalPayment,
    lead?.activities,
    lead?.custom_quote,
    lead?.pricing_breakdown?.total,
    lead?.pricing_breakdown?.total_paid,
    normalizedAdditionalPaymentStatus,
    normalizedLeadPaymentStatus,
    additionalPaymentOutstandingAmount,
    booking?.payment_completed_at,
    booking?.payment_id,
  ]);

  const isQuoteConvertedLead = useMemo(() => {
    const normalizedSource = String(lead?.lead_source || "").trim().toLowerCase();
    const createdActivityMatch = lead?.activities?.some((activity: LeadActivityLike) => {
      if (activity?.activity_type !== "created" || !activity?.activity_data) return false;

      try {
        const parsedData =
          typeof activity.activity_data === "string"
            ? JSON.parse(activity.activity_data)
            : activity.activity_data;

        return typeof parsedData === "object" &&
          parsedData !== null &&
          "source" in parsedData &&
          parsedData.source === "sales_quote_conversion";
      } catch {
        return false;
      }
    });

    return normalizedSource === "converted bookings" || Boolean(createdActivityMatch);
  }, [lead?.activities, lead?.lead_source]);

  const quotePricingDetails = useMemo(() => {
    if (!isQuoteConvertedLead) return null;

    const convertedQuote = (lead?.custom_quote ?? null) as ConvertedQuoteLike | null;
    const projectedQuote = lead?.projected_quote;
    const quoteTaxDetails = (convertedQuote ?? primaryQuote) as QuoteTaxDetailsLike | undefined;
    const canUseOtherQuoteFallback = !convertedQuote;
    const primaryQuoteLineItems = canUseOtherQuoteFallback ? primaryQuote?.line_items || [] : [];
    const convertedQuoteLineItems = Array.isArray(convertedQuote?.line_items)
      ? convertedQuote.line_items
      : Array.isArray(convertedQuote?.items)
        ? convertedQuote.items
        : [];
    const lineItemsSource = convertedQuote
      ? convertedQuoteLineItems
      : canUseOtherQuoteFallback && projectedQuote?.line_items?.length
        ? projectedQuote.line_items
        : primaryQuote?.line_items || [];

    const lineItems = lineItemsSource.map((item: QuoteLineItemLike, index: number) => {
      const fallbackPrimaryQuoteItem =
        canUseOtherQuoteFallback
          ? primaryQuoteLineItems[index] ||
            primaryQuoteLineItems.find((primaryItem: QuoteLineItemLike) => {
              const currentItemName = String(item?.name || item?.item_name || "").trim().toLowerCase();
              const primaryItemName = String(primaryItem?.name || primaryItem?.item_name || "").trim().toLowerCase();

              return Boolean(currentItemName) && currentItemName === primaryItemName;
            })
          : null;

      return {
        id: item?.line_item_id ?? `${item?.item_id ?? item?.name ?? item?.item_name ?? "item"}-${index}`,
        name: item?.name || item?.item_name || "Quote Item",
        quantity: Number(item?.quantity || 0),
        unitPrice: Number(item?.unit_price || 0),
        total: Number(item?.total ?? item?.line_total ?? 0),
        notes: item?.notes || fallbackPrimaryQuoteItem?.notes || null,
      };
    });

    const subtotal = Number(
      convertedQuote
        ? convertedQuote.subtotal ?? 0
        : projectedQuote?.subtotal ?? primaryQuote?.subtotal ?? 0
    );
    const discountAmount = Number(
      convertedQuote
        ? convertedQuote.discount_amount ?? convertedQuote.discount ?? 0
        : projectedQuote?.discount_amount ?? primaryQuote?.discount_amount ?? 0
    );
    const total = Number(
      convertedQuote
        ? convertedQuote.total ?? additionalPaymentDetails?.revisedTotal ?? 0
        : primaryQuote?.total ?? projectedQuote?.total ?? lead?.pricing_breakdown?.total ?? 0
    );
    const explicitTaxAmount = quoteTaxDetails?.tax_amount;
    const taxAmount = Number(explicitTaxAmount ?? Math.max(0, total - Math.max(0, subtotal - discountAmount)));
    const priceAfterDiscount = Number(
      convertedQuote
        ? convertedQuote.price_after_discount ?? Math.max(0, subtotal - discountAmount)
        : primaryQuote?.price_after_discount ?? Math.max(0, subtotal - discountAmount)
    );

    return {
      source: convertedQuote ? "custom_quote" : projectedQuote?.source || "database",
      quoteId: convertedQuote?.sales_quote_id || convertedQuote?.custom_quote_id || projectedQuote?.quote_id || primaryQuote?.quote_id || booking?.quote_id || null,
      quoteDisplayNumber: lead?.custom_quote_number
        ? String(lead.custom_quote_number).trim()
        : projectedQuote?.quote_id || primaryQuote?.quote_id || booking?.quote_id
          ? `#${projectedQuote?.quote_id || primaryQuote?.quote_id || booking?.quote_id}`
          : "N/A",
      pricingMode: convertedQuote?.pricing_mode || (canUseOtherQuoteFallback ? primaryQuote?.pricing_mode : null) || null,
      shootHours: convertedQuote?.shoot_hours || (canUseOtherQuoteFallback ? projectedQuote?.shoot_hours || primaryQuote?.shoot_hours : null) || null,
      subtotal,
      discountAmount,
      taxType: quoteTaxDetails?.tax_type || null,
      taxRate: Number(quoteTaxDetails?.tax_rate ?? (subtotal > 0 && taxAmount > 0 ? (taxAmount / Math.max(1, subtotal - discountAmount)) * 100 : 0)),
      taxAmount,
      priceAfterDiscount,
      total,
      expiresAt: convertedQuote?.expires_at || (canUseOtherQuoteFallback ? primaryQuote?.expires_at : null) || null,
      status: convertedQuote?.status || (canUseOtherQuoteFallback ? primaryQuote?.status : null) || null,
      lineItems,
    };
  }, [booking?.quote_id, isQuoteConvertedLead, lead?.custom_quote, lead?.custom_quote_number, lead?.pricing_breakdown?.total, lead?.projected_quote, primaryQuote]);

  const customQuoteId =
    lead?.custom_quote_id ?? (lead as any)?.customQuoteId ?? null;
  const editableQuoteId =
    customQuoteId ??
    quotePricingDetails?.quoteId ??
    primaryQuote?.quote_id ??
    booking?.quote_id ??
    null;
  const canEditQuote = Boolean(editableQuoteId);
  const hasQuoteLevelDiscount = Number(quotePricingDetails?.discountAmount ?? 0) > 0;
  const isDiscountLockedByQuote = isQuoteConvertedLead && hasQuoteLevelDiscount;
  const quoteDiscountLockMessage =
    "A discount is already applied in Quote Create/Edit. Update the quote there, then save it before generating the payment link.";

  const categorizedQuoteLineItems = useMemo(() => {
    if (!quotePricingDetails?.lineItems?.length) {
      return [];
    }

    const groupedItems = quotePricingDetails.lineItems.reduce<
      Record<string, typeof quotePricingDetails.lineItems>
    >((accumulator, item) => {
      const normalizedCategory =
        String(item.notes || "")
          .trim()
          .toLowerCase() || "uncategorized";

      if (!accumulator[normalizedCategory]) {
        accumulator[normalizedCategory] = [];
      }

      accumulator[normalizedCategory].push(item);
      return accumulator;
    }, {});

    const orderedCategories = ["service", "addon", "logistics"];
    const remainingCategories = Object.keys(groupedItems).filter(
      (category) => !orderedCategories.includes(category)
    );

    return [...orderedCategories, ...remainingCategories]
      .filter((category) => groupedItems[category]?.length)
      .map((category) => ({
        key: category,
        label:
          QUOTE_LINE_ITEM_CATEGORY_LABELS[category] ||
          category
            .split(/[_\s-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
        items: groupedItems[category],
      }));
  }, [quotePricingDetails]);

  const convertedBookingInitialValues = useMemo<ConvertBookingModalInitialData | null>(() => {
    if (!isQuoteConvertedLead || !booking) {
      return null;
    }

    const bookingDays = Array.isArray(booking.booking_days)
      ? (booking.booking_days as BookingDayLike[])
          .filter((day) => day?.event_date || (day as any)?.date)
          .map((day) => ({
            date: String(day.event_date || (day as any).date),
            startTime: normalizeTimeKey(day.start_time),
            endTime: normalizeTimeKey(day.end_time),
          }))
      : [];

    const isMultiDayBooking = bookingDays.length > 1;

    if (!isMultiDayBooking) {
      const singleDate = bookingDays[0]?.date || booking.event_date || "";
      const singleStartTime = bookingDays[0]?.startTime || normalizeTimeKey(booking.start_time);
      const singleEndTime = bookingDays[0]?.endTime || normalizeTimeKey(booking.end_time);

      return {
        bookingType: "single_day",
        location: booking.event_location || "",
        singleDay: {
          date: singleDate,
          startTime: singleStartTime,
          endTime: singleEndTime,
        },
      };
    }

    const normalizedDays = bookingDays.length
      ? bookingDays
      : booking.event_date
        ? [{
            date: String(booking.event_date),
            startTime: normalizeTimeKey(booking.start_time),
            endTime: normalizeTimeKey(booking.end_time),
          }]
        : [];

    const firstDay = normalizedDays[0];
    const sameTimings = normalizedDays.every(
      (day) => day.startTime === firstDay?.startTime && day.endTime === firstDay?.endTime
    );

    return {
      bookingType: "multi_day",
      location: booking.event_location || "",
      multiDay: {
        sameTimings,
        sharedStartTime: sameTimings ? firstDay?.startTime || "" : undefined,
        sharedEndTime: sameTimings ? firstDay?.endTime || "" : undefined,
        days: normalizedDays,
      },
    };
  }, [booking, isQuoteConvertedLead]);

  useEffect(() => {
    setSelectedSalesRepId(lead?.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
  }, [lead?.assigned_sales_rep?.id]);

  const salesRepDropdownOptions = useMemo(
    () =>
      currentUserId
        ? [{ label: "Assign to Me", value: ASSIGN_TO_ME_VALUE }, ...salesRepOptions]
        : salesRepOptions,
    [currentUserId, salesRepOptions]
  );

  // Filtered and Mapped CPs
  const filteredCPs = useMemo(() => {
    const crews = booking?.assigned_crews || [];
    const mapped = crews.map((crew: any) => {
      const profileFile = crew.crew_member?.crew_member_files?.[0];
      const imageUrl = profileFile?.file_path
        ? `${S3_PREFIX}${profileFile.file_path}`
        : null;

      return {
        id: crew.crew_member_id,
        name: `${crew.crew_member.first_name} ${crew.crew_member.last_name}`,
        image: imageUrl,
        status: crew.acceptance_status || "pending",
        role: getRoleLabel(crew.crew_member.primary_role),
        inviteSentAt: formatDateUI(crew.created_at),
        respondedAt: formatDateUI(crew.responded_at),
      };
    });

    if (statusFilter === "all") return mapped;
    return mapped.filter((cp: any) => cp.status === statusFilter);
  }, [booking, statusFilter]);

  const activePartner = filteredCPs[activeCPIndex % (filteredCPs.length || 1)];

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const startTime = formatTime(booking?.start_time);
  const endTime = formatTime(booking?.end_time);
  const shootTimeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : "Not set";
  const quoteEditAccessShootDateValue =
    booking?.event_date && booking?.start_time
      ? `${booking.event_date}T${String(booking.start_time).slice(0, 5)}:00`
      : booking?.event_date || null;

  // Extract data with defaults
  const clientName = lead?.client_name || lead?.guest_email || "Unknown User";
  const initials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = lead?.guest_email || "No email";
  const phone = lead?.phone || "N/A";
  const leadType = lead ? LEAD_TYPE_LABELS[lead.lead_type as keyof typeof LEAD_TYPE_LABELS] : "Unknown";
  const clientRegistrationType = lead?.user_id ? "Registered" : "Guest";
  const status = lead ? (lead.booking_status || mapLeadStatusToUI(lead.lead_status)) : "Unknown";
  const normalizedRevisionPaymentStatus = String(
    additionalPaymentDetails?.paymentStatus || ""
  )
    .trim()
    .toLowerCase();
  const isRevisionPaymentPending =
    normalizedRevisionPaymentStatus === "pending" ||
    normalizedRevisionPaymentStatus === "partially_paid";
  const isAmountPaid =
    !isRevisionPaymentPending &&
    (["paid", "success", "completed"].includes(
      String(lead?.payment_status || "").trim().toLowerCase()
    ) ||
      Boolean(booking?.payment_id || booking?.payment_completed_at));
  const showCompletedPaymentMessage =
    isAmountPaid && !hasPendingAdditionalPayment;

  const bookingDate = booking?.event_date
    ? (parseDate(booking.event_date) || new Date(booking.event_date)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Not set";
  const location = booking?.event_location || "Not specified";
  const shootType = booking?.shoot_type || booking?.event_type || "Not specified";

  // Pricing from breakdown
  const convertedQuoteTotal = isQuoteConvertedLead
    ? Number(
        lead?.custom_quote?.total ??
        additionalPaymentDetails?.revisedTotal ??
        primaryQuote?.total ??
        0
      )
    : 0;
  const basePrice = (isQuoteConvertedLead && convertedQuoteTotal > 0)
    ? convertedQuoteTotal
    : (lead?.pricing_breakdown?.shoot_cost || 0);
  const editingCost = lead?.pricing_breakdown?.editing_cost || 0;
  const additionalCreatives = lead?.pricing_breakdown?.additional_creatives_cost || 0;
  const studioCost = lead?.pricing_breakdown?.studio_cost || 0;
  const discountAmount = isQuoteConvertedLead
    ? Number(quotePricingDetails?.discountAmount ?? lead?.pricing_breakdown?.discount ?? 0)
    : Number(lead?.pricing_breakdown?.discount ?? 0);
  const creditApplied = Number(lead?.pricing_breakdown?.credit_applied || 0);
  const hasAdditionalRevisionAmount =
    Boolean(additionalPaymentDetails) &&
    Math.abs(Number(additionalPaymentDetails?.additionalAmount || 0)) > 0;
  const shouldIgnoreCreditApplied =
    hasAdditionalRevisionAmount && !additionalPaymentDetails?.isDecrease;
  const effectiveCreditApplied = shouldIgnoreCreditApplied ? 0 : creditApplied;
  const totalBeforeCredit = Number(
    lead?.pricing_breakdown?.total_before_credit ??
      primaryQuote?.total ??
      lead?.pricing_breakdown?.total ??
      0
  );
  const totalAfterCredit = Number(
    lead?.pricing_breakdown?.total_after_credit ??
      primaryQuote?.total ??
      lead?.pricing_breakdown?.total ??
      0
  );
  const total = convertedQuoteTotal > 0
    ? convertedQuoteTotal
    : (effectiveCreditApplied > 0
      ? totalAfterCredit
      : (isQuoteConvertedLead
        ? Number(primaryQuote?.total ?? totalAfterCredit)
        : totalAfterCredit));

  const referralInfo = useMemo(() => {
    const notes = booking?.primary_quote?.notes || "";
    const match = String(notes).match(/Referral applied \(([^)]+)\): -\$(\d+(?:\.\d+)?)/i);
    if (!match) return { code: null, amount: 0 };
    return { code: match[1] || null, amount: parseFloat(match[2] || "0") || 0 };
  }, [booking?.primary_quote?.notes]);

  const referralDiscountAmount = referralInfo.amount;
  const discountCodeDiscount = Math.max(0, discountAmount - referralDiscountAmount);
  const discountCodeValue = lead?.discount_codes?.[0]?.code || null;

  const latestManualPaymentEntry = useMemo(() => {
    const manualActivities = (lead?.activities || []).filter((activity: LeadActivityLike) => {
      if (activity?.activity_type !== "payment_completed" || !activity?.activity_data) return false;
      try {
        const payload = typeof activity.activity_data === "string"
          ? JSON.parse(activity.activity_data)
          : activity.activity_data;
        return typeof payload === "object" && payload !== null && (payload as ManualPaymentActivityMeta).payment_method === "manual";
      } catch {
        return false;
      }
    });

    if (!manualActivities.length) return null;

    const sortedEntries = [...manualActivities].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    const latestEntry = sortedEntries[0];
    let latestData: unknown = latestEntry.activity_data;
    if (typeof latestEntry.activity_data === "string") {
      try {
        latestData = JSON.parse(latestEntry.activity_data);
      } catch {
        latestData = {};
      }
    }

    return {
      createdAt: latestEntry.created_at,
      data: (latestData || {}) as ManualPaymentActivityMeta,
    };
  }, [lead?.activities]);

  const manualPaymentSummary = useMemo(() => {
    const manualActivities = (lead?.activities || [])
      .filter((activity: LeadActivityLike) => activity?.activity_type === "payment_completed" && activity?.activity_data)
      .map((activity: LeadActivityLike) => {
        try {
          const payload = typeof activity.activity_data === "string"
            ? JSON.parse(activity.activity_data)
            : activity.activity_data;
          if (!payload || (payload as ManualPaymentActivityMeta).payment_method !== "manual") return null;
          return payload as ManualPaymentActivityMeta;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ManualPaymentActivityMeta[];

    const hasFullPayment = manualActivities.some((entry) => entry.payment_type === "full");
    const partialPaid = manualActivities.reduce((sum, entry) => {
      if (entry.payment_type !== "partial") return sum;
      const numeric = Number(entry.amount || 0);
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);

    const resolvedTotal = total > 0 ? total : Number(latestManualPaymentEntry?.data?.total_amount || 0);
    const paymentProgress = getQuotePaymentProgressDetails(
      (lead?.custom_quote ?? null) as any,
      {
        totalAmountOverride: resolvedTotal,
        previouslyPaidOverride: Number(lead?.pricing_breakdown?.total_paid ?? 0) || undefined,
        previousTotalOverride:
          Number(lead?.pricing_breakdown?.total_amount ?? lead?.pricing_breakdown?.total ?? 0) ||
          undefined,
        collectedAmountOverride: Number(lead?.collected_amount ?? 0) || undefined,
        manualPaidOverride: hasFullPayment ? resolvedTotal : partialPaid,
      }
    );

    return {
      hasFullPayment: paymentProgress.hasFullPayment || hasFullPayment,
      paidAmount: paymentProgress.paidAmount,
      pendingAmount: paymentProgress.pendingAmount,
      isPartiallyPaid: paymentProgress.isPartiallyPaid,
      canTakePayment: paymentProgress.canTakePayment,
    };
  }, [
    lead?.activities,
    lead?.collected_amount,
    lead?.custom_quote,
    lead?.pricing_breakdown?.total,
    lead?.pricing_breakdown?.total_amount,
    lead?.pricing_breakdown?.total_paid,
    latestManualPaymentEntry?.data?.total_amount,
    total,
  ]);
  const shouldForceFullyPaid =
    isAmountPaid &&
    !hasPendingAdditionalPayment &&
    (Number(lead?.outstanding_amount ?? 0) <= 0.009 || Number(additionalPaymentDetails?.outstandingAmount ?? 0) <= 0.009);
  const effectiveManualPaymentSummary = shouldForceFullyPaid
    ? {
        ...manualPaymentSummary,
        paidAmount: Math.max(manualPaymentSummary.paidAmount, total),
        pendingAmount: 0,
        hasFullPayment: true,
        isPartiallyPaid: false,
        canTakePayment: false,
      }
    : manualPaymentSummary;
  const displayPaidAmount = Math.max(
    Number(lead?.collected_amount ?? 0),
    Number(lead?.pricing_breakdown?.total_paid ?? 0),
    Number(effectiveManualPaymentSummary.paidAmount ?? 0)
  );

  const manualPaymentEntries = useMemo(() => {
    return (lead?.activities || [])
      .filter((activity: LeadActivityLike) => activity?.activity_type === "payment_completed" && activity?.activity_data)
      .map((activity: LeadActivityLike) => {
        try {
          const payload = typeof activity.activity_data === "string"
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
      .filter(Boolean)
      .sort((a, b) => new Date(String(b?.createdAt || 0)).getTime() - new Date(String(a?.createdAt || 0)).getTime()) as Array<{
        createdAt: string | null;
        data: ManualPaymentActivityMeta;
      }>;
  }, [lead?.activities]);

  const manualPaymentStatusLabel = latestManualPaymentEntry
    ? String(latestManualPaymentEntry.data.payment_mode || "").toLowerCase() === "net30"
      ? "Payment Pending (Net30)"
      : latestManualPaymentEntry.data.payment_type === "partial"
        ? "Partially Paid (Manual)"
        : "Paid (Manual)"
    : null;

  const effectiveStatusLabel = hasPendingAdditionalPayment
    ? "Pending"
    : effectiveManualPaymentSummary.isPartiallyPaid
      ? "Partially Paid"
      : status;
  const hasManualPaymentHistory = manualPaymentEntries.length > 0;
  const paymentMethodLabel = hasManualPaymentHistory
    ? "Manual"
    : isAmountPaid
      ? "Stripe"
      : "Pending";
  const showManualPaymentPanel = !isAmountPaid || hasManualPaymentHistory;

  const handleManualPaymentSubmit = async () => {
    const proofUrl = manualPaymentProofUrl.trim();
    const otherMode = manualPaymentOtherMode.trim();
    const parsedAmount = Number(manualPaymentAmount);

    if (!proofUrl) {
      toast.error("Proof URL is required");
      return;
    }

    if (manualPaymentMode === "other" && !otherMode) {
      toast.error("Please enter payment mode details");
      return;
    }

    if (manualPaymentType === "partial") {
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Partial amount must be greater than 0");
        return;
      }
      if (parsedAmount > effectiveManualPaymentSummary.pendingAmount) {
        toast.error("Partial amount cannot exceed pending amount");
        return;
      }
    }

    setIsSubmittingManualPayment(true);
    try {
      const response = await salesApi.recordLeadManualPayment(leadId, {
        payment_type: manualPaymentType,
        amount: manualPaymentType === "partial" ? parsedAmount : undefined,
        payment_mode: manualPaymentMode,
        other_payment_mode: manualPaymentMode === "other" ? otherMode : undefined,
        proof_url: proofUrl,
        notes: manualPaymentNotes.trim() || undefined,
      });

      if (!response?.success) {
        toast.error(response?.error || response?.message || "Failed to save manual payment");
        return;
      }

      toast.success(
        manualPaymentType === "partial"
          ? "Partial payment saved successfully"
          : "Manual full payment saved successfully"
      );
      setManualPaymentAmount("");
      setManualPaymentProofUrl("");
      setManualPaymentProofFileName("");
      setManualPaymentNotes("");
      setManualPaymentOtherMode("");
      refetch();
    } catch (error) {
      console.error("Failed to save manual payment:", error);
      toast.error("Failed to save manual payment");
    } finally {
      setIsSubmittingManualPayment(false);
    }
  };

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
    } catch (error) {
      console.error("Failed to upload manual payment proof:", error);
      toast.error("Failed to upload proof");
    } finally {
      setIsUploadingManualProof(false);
    }
  };

  // Handle discount code generation
  const handleGenerateDiscount = async () => {
    if (isDiscountLockedByQuote) {
      toast.error(quoteDiscountLockMessage);
      return;
    }

    if (!discount || parseFloat(discount) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (discountType === "percentage" && parseFloat(discount) > 100) {
      toast.error("Discount cannot exceed 100%");
      return;
    }

    try {
      const response = await generateDiscountCode({
        lead_id: parseInt(leadId),
        booking_id: lead?.booking_id,
        discount_type: discountType,
        discount_value: parseFloat(discount),
        usage_type: usageType,
        max_uses: usageType === "multi_use" ? 10 : undefined,
      }).unwrap();

      if (response.success && response.data) {
        setGeneratedCode(response.data.code);
        setGeneratedDiscountId(response.data.discount_code_id);
        setShowDiscountCode(true);
        toast.success("Discount code generated successfully!");
      }
    } catch (error: any) {
      console.error("Error generating discount:", error);
      toast.error(error?.data?.message || "Failed to generate discount code");
    }
  };

  const handleEditQuoteRedirect = () => {
    if (!editableQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setPendingEditView("details");
  };

  const proceedToEditQuote = (targetView: QuoteEditorView) => {
    if (!editableQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    const query = new URLSearchParams({
      quoteId: String(editableQuoteId),
      view: targetView,
      editMode: "full",
      returnTo: pathname,
    });

    toast.success("Opening quote editor");
    window.setTimeout(() => {
      router.push(`/sales/quotes/create?${query.toString()}`);
    }, 450);
  };

  const handleEditAccessProceed = async (payload: {
    reason: string;
    opsReviewConfirmed: boolean;
  }) => {
    if (!pendingEditView || !editableQuoteId) {
      return;
    }

    setIsEditAccessSubmitting(true);

    try {
      const nextView = pendingEditView;
      persistQuoteEditorEditReason(
        String(editableQuoteId),
        payload.reason,
        payload.opsReviewConfirmed,
      );
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

  const handleUpdateIntent = async (intent: string, notes: string) => {
    try {
      await updateLeadIntent({
        lead_id: parseInt(leadId),
        intent: intent,
        notes: notes
      }).unwrap();

      toast.success("Lead intent updated successfully");
      setIsIntentModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update intent");
    }
  };

  // Handle copy code
  const handleCopyCode = async () => {
    if (generatedCode) {
      await copyToClipboard(generatedCode);
      toast.success("Code copied to clipboard!");
    }
  };

  // const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const handleRemoveCP = async (cpId: number) => {
    try {
      await removeAssignedCrew({
        client_lead_id: Number(params.id),
        crew_member_id: cpId,
      }).unwrap();

      toast.success("Crew member unassigned successfully");
    } catch (error) {
      console.error("Failed to unassign crew member:", error);
      toast.error("Failed to unassign crew member");
    }
  };

  const handleCPClick = (cpId: number) => {
    setSelectedCPId(cpId.toString());
    setIsCPModalOpen(true);
  };

  const handleUpdateSalesRep = async (salesRepId: string) => {
    if (!salesRepId) {
      toast.error("Please choose a representative");
      return;
    }

    const assignedSalesRepId = String(lead?.assigned_sales_rep?.id || "");
    const isAssignToMe = salesRepId === ASSIGN_TO_ME_VALUE;

    if (isAssignToMe && !currentUserId) {
      toast.error("Unable to resolve current user");
      return;
    }

    if ((isAssignToMe && currentUserId === assignedSalesRepId) || salesRepId === assignedSalesRepId) {
      setIsEditingSalesRep(false);
      return;
    }

    setIsUpdatingSalesRep(true);
    try {
      const result = isAssignToMe
        ? await salesApi.assignLeadToSelf(leadId)
        : await salesApi.changeLeadSalesRep(leadId, salesRepId);

      if (result.success) {
        toast.success(
          isAssignToMe
            ? "Lead assigned to you successfully"
            : "Assigned sales representative updated successfully"
        );
        if (isAssignToMe) {
          setSelectedSalesRepId(currentUserId);
        }
        setIsEditingSalesRep(false);
        refetch();
      } else {
        toast.error(result.error || result.message || "Failed to update assigned sales representative");
      }
    } catch (error) {
      console.error("Failed to update assigned sales representative:", error);
      toast.error("Failed to update assigned sales representative");
    } finally {
      setIsUpdatingSalesRep(false);
    }
  };

  const handleUpdateConvertedBooking = async (
    bookingData: ConvertBookingModalSubmitData
  ) => {
    setIsUpdatingConvertedBooking(true);

    try {
      const browserTimeZone = getBrowserTimeZone();
      let payload: LeadBookingSchedulePayload;

      if (bookingData.bookingType === "single_day") {
        if (!bookingData.singleDay) {
          throw new Error("Single day booking data is missing.");
        }

        payload = {
          booking_type: "single_day",
          time_zone: browserTimeZone,
          location: bookingData.location,
          start_date: bookingData.singleDay.date,
          start_time: formatTimeForApi(bookingData.singleDay.startTime),
          end_time: formatTimeForApi(bookingData.singleDay.endTime),
        };
      } else {
        if (!bookingData.multiDay) {
          throw new Error("Multi day booking data is missing.");
        }

        payload = {
          booking_type: "multi_day",
          time_zone: browserTimeZone,
          location: bookingData.location,
          booking_days: bookingData.multiDay.days.map((day) => ({
            date: day.date,
            start_time: formatTimeForApi(day.startTime),
            end_time: formatTimeForApi(day.endTime),
          })),
        };
      }

      const response = await salesApi.updateLeadBookingSchedule(leadId, payload);

      if (!response?.success) {
        throw new Error(response?.error || response?.message || "Failed to update booking details");
      }

      toast.success("Booking details updated successfully");
      setIsConvertedBookingEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to update converted booking details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update booking details");
    } finally {
      setIsUpdatingConvertedBooking(false);
    }
  };

  if (isPermissionLoading || !allowed) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white/60">
        {!isPermissionLoading && !allowed ? "No Permission" : null}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${isDark ? "text-white" : "text-black"} font-sans flex items-center justify-center py-20`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-[#E8D1AB]" : "border-[#B18A00]"}`}></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className={`${isDark ? "text-white" : "text-black"} font-sans`}>
        <Button
          onClick={() => router.back()}
          className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent shadow-none border-none`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>
        <div className={`${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"} border rounded-2xl p-8 text-center`}>
          <p className={isDark ? "text-white/60" : "text-black/60"}>Lead not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent shadow-none border-none ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-[#B18A00]"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (Left/Middle) */}
          <div className="lg:col-span-8 space-y-3 lg:space-y-6">
            {/* Client Details Card */}
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex justify-between items-center p-5 lg:px-9 lg:py-6 !pb-0">
                <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Client Details
                </h2>
                <Button
                  onClick={() => setIsIntentModalOpen(true)}
                  className={`h-10 border px-5 rounded-lg text-sm transition-all ${isDark
                    ? "bg-zinc-800 border-white/10 text-[#E8D1AB] hover:bg-zinc-700"
                    : "bg-[#E8D1AB] hover:bg-[#D9C19A] border-[#E8D1AB] text-black"
                    }`}
                >
                  Update Intent
                </Button>
              </div>

              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />

              <div className="flex flex-col gap-3 lg:gap-6 p-5 lg:p-9 !pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <h1 className={`lg:text-[22px] font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{clientName}</h1>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            clientRegistrationType === "Registered"
                              ? isDark
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : isDark
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {clientRegistrationType}
                        </span>
                      </div>
                      <div className=" lg:hidden">
                        <LeadsStatusBadge status={effectiveStatusLabel as any} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <IntentBadge intent={(lead.intent || "Hot") as any} />
                    <div className="hidden lg:block">
                      <LeadsStatusBadge status={effectiveStatusLabel as any} />
                    </div>
                  </div>
                </div>
                <div className={`flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#666666]"}`}>
                  <p>
                    Email ID : <span className={isDark ? "text-white" : "text-black"}>{email}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Phone Number : <span className={isDark ? "text-white" : "text-black"}>{phone}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Lead Type : <span className={isDark ? "text-white" : "text-black"}>{leadType}</span>
                  </p>
                </div>
                <div className={`flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#666666]"}`}>
                  <p>
                    Temporary Booking ID : <span className="text-[#E8D1AB]">{`TMP-${new Date(lead.created_at).getFullYear()}-${lead.booking_id?.toString().padStart(3, '0')}`}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Lead Source : <span className={isDark ? "text-white capitalize" : "text-black capitalize"}>{formatLeadSource(lead.lead_source || lead.intent_source)}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <div className="relative inline-flex items-center gap-2 flex-nowrap overflow-visible">
                    <p className="whitespace-nowrap">
                      Assigned Sales Rep : <span className={isDark ? "text-white" : "text-black"}>{lead.assigned_sales_rep?.name || "Unassigned"}</span>
                    </p>
                    <button
                      type="button"
                      aria-label={isEditingSalesRep ? "Close sales representative options" : "Edit assigned sales representative"}
                      onClick={() => {
                        if (isEditingSalesRep) {
                          setSelectedSalesRepId(lead.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
                          setIsEditingSalesRep(false);
                          return;
                        }
                        setIsEditingSalesRep(true);
                      }}
                      className={`relative z-30 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${isDark ? "text-[#E8D1AB] hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                    >
                      {isEditingSalesRep ? <X size={14} /> : <Pencil size={14} />}
                    </button>
                    {isEditingSalesRep && (
                      <>
                        <button
                          type="button"
                          aria-label="Close sales representative options"
                          onClick={() => {
                            setSelectedSalesRepId(lead.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
                            setIsEditingSalesRep(false);
                          }}
                          className="fixed inset-0 z-20 cursor-default"
                        />
                        <div className={`absolute top-full right-0 mt-2 z-30 min-w-[260px] rounded-xl border overflow-hidden shadow-xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                          {isLoadingSalesReps ? (
                            <div className={`px-4 py-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              Loading...
                            </div>
                          ) : (
                            <div className="py-1.5">
                                {salesRepDropdownOptions.map((option) => {
                                  const isSelected =
                                    option.value === ASSIGN_TO_ME_VALUE
                                      ? Boolean(currentUserId) && currentUserId === String(lead?.assigned_sales_rep?.id || "")
                                      : option.value === selectedSalesRepId;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => {
                                      if (isUpdatingSalesRep) return;
                                      setSelectedSalesRepId(option.value);
                                      handleUpdateSalesRep(option.value);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${isSelected
                                      ? (isDark ? "bg-white/5 text-[#E8D1AB]" : "bg-black/5 text-black font-medium")
                                      : (isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5")
                                      }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className={`text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#666666]"}`}>
                  Payment Via :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {paymentMethodLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned CPs Section - FLOATING UI & HOVER PILL & ACTIVE METADATA */}
            <div className={`border rounded-[32px] overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 lg:p-9 !pb-0 gap-4">
                <h2 className={`text-xl lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Assigned CPs ({filteredCPs.length.toString().padStart(2, '0')})
                </h2>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`flex items-center justify-between min-w-[140px] border rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isDark ? "bg-[#1a1a1a] border-[#3D3D3D] text-white hover:bg-[#252525]" : "bg-[#F9FAFB] border-[#D8D8D8] text-black hover:bg-[#F3F4F6]"
                        }`}
                    >
                      <span className="capitalize">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                      <ChevronDown size={16} className={`ml-2 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                        <div className={`absolute top-full right-0 mt-2 w-44 border rounded-xl shadow-2xl z-40 overflow-hidden ${isDark ? "bg-[#1a1a1a] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                          {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setStatusFilter(s as any);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors capitalize ${isDark ? "text-white hover:bg-[#E8D1AB] hover:text-black" : "text-black hover:bg-[#E8D1AB]"}`}
                            >
                              {s} Status
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    className={`h-11 font-semibold px-6 rounded-xl flex items-center gap-2 transition-all ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-black" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"}`}
                    onClick={() => router.push(`/sales/select-creatives?id=${leadId}`)}
                  >
                    <Plus size={18} /> Add More CPs
                  </Button>
                </div>
              </div>

              <hr className={`my-6 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#D8D8D8]"}`} />

              <div className="p-6 lg:p-9 !pt-0">
                <div className="relative">
                  {filteredCPs.length > 0 ? (
                    <Swiper
                      key={statusFilter}
                      effect={"coverflow"}
                      grabCursor={true}
                      centeredSlides={true}
                      slidesPerView={1.2}
                      breakpoints={{
                        768: { slidesPerView: 2.2 },
                        1024: { slidesPerView: 2.6 }
                      }}
                      coverflowEffect={{
                        rotate: 15,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: false,
                      }}
                      modules={[EffectCoverflow]}
                      onSlideChange={(swiper) => setActiveCPIndex(swiper.realIndex)}
                      className="w-full py-8"
                    >
                      {filteredCPs.map((cp, index) => (
                        <SwiperSlide key={cp.id}>
                          <div className="group relative transition-all duration-300">
                            {/* FLOATING IMAGE AREA */}
                            <div
                              onClick={() => handleCPClick(cp.id)}
                              className={`relative aspect-[1.1/1] rounded-[32px] overflow-hidden shadow-2xl mb-4 cursor-pointer ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                            >
                              {cp.image ? (
                                <img src={cp.image} alt={cp.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isDark ? "bg-zinc-700" : "bg-zinc-300"}`}>
                                  {cp.name.split(" ").map((n: string) => n[0]).join("")}
                                </div>
                              )}

                              {/* PILL ON HOVER ONLY */}
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-lg px-5 py-2.5 rounded-full border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                                Invite Sent: {cp.inviteSentAt}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCP(cp.id);
                                }}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-all z-20"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* METADATA - ONLY SHOW FOR ACTIVE CARD */}
                            <div className={`px-2 transition-all duration-500 transform ${index === activeCPIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden"}`}>
                              <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0">
                                  <h3 className={`text-xl font-bold truncate leading-tight ${isDark ? "text-white" : "text-black"}`}>{cp.name}</h3>
                                  <p className={`${isDark ? "text-[#8E8E8E]" : "text-[#666666]"} text-sm mt-0.5`}>{cp.role}</p>
                                </div>

                                <div className={`px-5 py-2 rounded-lg text-xs font-bold capitalize
                                  ${cp.status === 'accepted' ? 'bg-[#12B76A] text-white' :
                                    cp.status === 'rejected' ? 'bg-[#D92D20] text-white' :
                                      'bg-[#E8D1AB] text-black'}`}
                                >
                                  {cp.status}
                                </div>
                              </div>
                              <hr className={`mb-4 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
                              <div className={`flex items-center gap-2 ${isDark ? "text-white" : "text-black/80"} text-[11px] font-medium`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
                                <span className="capitalize">{cp.status}</span>
                                <span className="mx-0.5">—</span>
                                <span>{cp.respondedAt || "Awaiting response"}</span>
                              </div>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className={`h-[300px] flex items-center justify-center border-dashed border rounded-[32px] ${isDark ? "text-white/40 border-[#3D3D3D]" : "text-black/40 border-[#D8D8D8]"}`}>
                      No partners found matching this status.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Summary Card */}
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex justify-between items-center p-4 lg:p-9 !pb-0">
                <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Booking Summary
                </h2>
                {!isQuoteConvertedLead && (
                  <div className="group relative inline-flex">
                    <Button
                      onClick={() => router.push(`/sales/client/${params.id}/edit-booking`)}
                      className={`h-10 w-fit font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"}`}
                    >
                      Edit Details
                    </Button>
                  </div>
                )}
                {isQuoteConvertedLead && (
                  <div className="group relative inline-flex">
                    <Button
                      onClick={() => setIsConvertedBookingEditModalOpen(true)}
                      disabled={!convertedBookingInitialValues || isUpdatingConvertedBooking}
                      className={`h-10 w-fit font-semibold py-2 px-4 rounded-lg transition-all text-sm disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"}`}
                    >
                      Edit Details
                    </Button>
                  </div>
                )}
              </div>
              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />

              <div className="flex flex-col gap-3 lg:gap-5 px-4 lg:px-9">
                {Array.isArray(booking?.booking_days) && (booking?.booking_days?.length ?? 0) > 1 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 mb-1">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className={`text-xs font-medium mb-1 ${isDark ? "text-[#71717B]" : "text-[#71717B]"}`}>Shoot Schedule</p>
                        <p className="text-xs lg:text-base font-medium text-[#E8D1AB]">{booking.booking_days!.length} Day Shoot</p>
                      </div>
                    </div>
                    <div className={`ml-2 border-l-2 pl-5 flex flex-col gap-3 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
                      {booking.booking_days!.map((day: any, idx: number) => {
                        const dayDate = day.event_date
                          ? (parseDate(day.event_date) || new Date(day.event_date)).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "Not set";
                        const dayStart = formatTime(day.start_time);
                        const dayEnd = formatTime(day.end_time);
                        const dayTime = dayStart && dayEnd ? `${dayStart} - ${dayEnd}` : "Not set";
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-[#E8D1AB]/10 flex items-center justify-center text-[#E8D1AB] text-xs font-bold shrink-0">
                              D{idx + 1}
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 min-w-0">
                              <p className={`text-xs lg:text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>{dayDate}</p>
                              <div className={`hidden lg:block w-[1px] h-4 ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                              <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-[#8E8E8E]" : "text-[#666666]"}`}>
                                <Clock size={12} /> {dayTime}
                              </p>
                              {day.duration_hours && (
                                <>
                                  <div className="hidden lg:block w-[1px] h-4 bg-[#3D3D3D]" />
                                  <p className="text-xs text-[#8E8E8E]">{parseFloat(day.duration_hours)}h</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Date</p>
                        <p className="text-xs lg:text-base font-medium">{bookingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Time</p>
                        <p className="text-xs lg:text-base font-medium">{shootTimeDisplay}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                    <MapPinned size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#71717B] font-medium mb-1">Location</p>
                    <p className={`text-xs lg:text-base font-medium max-w-md ${isDark ? "text-white" : "text-black"}`}>{location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Type</p>
                    <p className="text-xs lg:text-base font-medium capitalize">{shootType}</p>
                  </div>
                </div>
              </div>
              <hr className={`my-4 lg:my-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="p-4 !pt-0 lg:p-9">
                <BookingStatusStepper currentStep={lead.booking_step || 1} isDark={isDark} />
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            <div className={`border rounded-2xl transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <h2 className={`lg:text-xl font-medium p-4 lg:p-9 !pb-0 ${isDark ? "text-white" : "text-black"}`}>
                Pricing Breakdown
              </h2>
              <hr className={`my-4 lg:my-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9 lg:pb-6">
                {isQuoteConvertedLead && (
                  <div
                    className={`rounded-2xl border px-4 py-3 ${isDark
                      ? "border-[#4A3E28] bg-[#1E1912] text-[#F5E9D2]"
                      : "border-[#E8D1AB] bg-[#FFF8E8] text-[#5C4717]"
                      }`}
                  >
                    <p className="text-sm font-medium">
                      This booking was created from a quote conversion, so pricing is locked from the approved quote and booking edits are disabled on this page.
                    </p>
                  </div>
                )}
                {additionalPaymentDetails && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark
                        ? "border-[#E8D1AB]/20 bg-[#1B1710]"
                        : "border-[#E8D1AB] bg-[#FFF8EA]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                          Additional Payment Breakdown
                        </p>
                        <p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-black/55"}`}>
                          {additionalPaymentDetails.invoiceNumber
                            ? `Invoice ${additionalPaymentDetails.invoiceNumber}`
                            : "Updated booking amount"}
                          {additionalPaymentDetails.lastSentAtLabel
                            ? ` · Sent ${additionalPaymentDetails.lastSentAtLabel}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                          hasPendingAdditionalPayment
                            ? isDark
                              ? "bg-[#E8D1AB]/15 text-[#E8D1AB]"
                              : "bg-[#FDECC8] text-[#8A5B00]"
                            : isDark
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {additionalPaymentDetails.paymentStatusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Previously Paid", additionalPaymentDetails.previouslyPaidAmount],
                        [
                          additionalPaymentDetails.isDecrease ? "Reduced Amount" : "Additional Amount",
                          additionalPaymentDetails.additionalAmount
                        ],
                        ["Revised Total", additionalPaymentDetails.revisedTotal],
                        ["Outstanding Amount", additionalPaymentDetails.outstandingAmount],
                      ].map(([label, value]) => (
                        <div
                          key={label as string}
                          className={`rounded-xl border px-3 py-3 ${
                            isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white/70"
                          }`}
                        >
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#71717B]">
                            {label}
                          </p>
                          <p className={`mt-2 text-base font-semibold ${
                            label === "Reduced Amount" || (typeof value === 'number' && value < 0)
                              ? "text-red-500"
                              : isDark ? "text-white" : "text-black"
                          }`}>
                            {label === "Reduced Amount" || label === "Additional Amount"
                              ? (additionalPaymentDetails.additionalAmount < 0 ? "-" : "+")
                              : ""}
                            {formatCurrencyValue(Math.abs(value as number))}
                          </p>
                        </div>
                      ))}
                    </div>
                    {additionalPaymentDetails.isDecrease && (
                      <p className={`mt-3 text-xs font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#7A5A00]"}`}>
                        This reduced amount will be added as Beige Credits after approval.
                      </p>
                    )}
                  </div>
                )}
                {/* <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Base Price</span>
                  <span className="text-sm lg:text-base text-white">${basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Editing Fee</span>
                  <span className="text-sm lg:text-base text-white">${editingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Additional Creatives</span>
                  <span className="text-sm lg:text-base text-white">${additionalCreatives.toLocaleString()}</span>
                </div> */}
                {[["Shoot Cost", basePrice], ["Editing Fee", editingCost], ["Studio", studioCost], ["Additional Creatives", additionalCreatives]].filter(([, val]) => Number(val) > 0).map(([label, val]) => (
                  <div key={label as string} className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">{label}</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>${(val as number).toLocaleString()}</span>
                  </div>
                ))}
                {discountCodeValue && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>{discountCodeValue}</span>
                  </div>
                )}
                {discountCodeDiscount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code Discount</span>
                    <span className="text-sm lg:text-base text-red-400">-${discountCodeDiscount.toLocaleString()}</span>
                  </div>
                )}
                {isQuoteConvertedLead && quotePricingDetails?.taxAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">
                      Tax
                      {quotePricingDetails.taxRate > 0 ? ` (${quotePricingDetails.taxRate}%)` : ""}
                    </span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>
                      {formatCurrencyValue(quotePricingDetails.taxAmount)}
                    </span>
                  </div>
                )}
                {referralInfo.code && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Code</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>{referralInfo.code}</span>
                  </div>
                )}
                {referralDiscountAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Discount</span>
                    <span className="text-sm lg:text-base text-red-400">-${referralDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                {effectiveCreditApplied > 0 && (
                  <>
                    <div className="flex justify-between font-medium">
                      <span className="text-[#71717B] text-xs">Total Before Credit</span>
                      <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>
                        ${totalBeforeCredit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-[#71717B] text-xs">Account Credit Used</span>
                      <span className="text-sm lg:text-base text-emerald-400">-${effectiveCreditApplied.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              <div className={`h-[1px] w-full ${isDark ? "bg-[#3D3D3D]" : "bg-[#E5E5E5]"}`} />
              <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Total Amount</span>
                <span className="lg:text-lg font-semibold text-[#E8D1AB]">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Restored Discount Input Validation Logic */}
          <div className="lg:col-span-4 space-y-3 lg:space-y-6">
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex items-center gap-2 p-4 lg:p-9 !pb-0">
                <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Generate Discount
                </h2>
                {isDiscountLockedByQuote && (
                  <>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${
                        isDark
                          ? "bg-white/5 text-[#E8D1AB]"
                          : "bg-[#FFF3D6] text-[#7A5A00]"
                      }`}
                    >
                      Locked
                    </span>
                    <InfoTooltip
                      message={quoteDiscountLockMessage}
                      isDark={isDark}
                      align="right"
                    />
                  </>
                )}
              </div>
              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="flex flex-col gap-6 p-5 pt-6 lg:p-9">
                <div className="relative w-full">
                  <label className={`absolute -top-2.5 left-4 px-2 text-sm capitalize tracking-widest z-20 pointer-events-none ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-black/60"}`}>
                    Discount Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDiscountLockedByQuote || isAmountPaid) return;
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      disabled={isDiscountLockedByQuote || isAmountPaid}
                      className={`flex items-center justify-between w-full border rounded-xl px-4 py-4 text-left text-base transition-all duration-300 ${isDark
                        ? `text-white ${isDropdownOpen ? "border-white/80 ring-1 ring-white/20" : "border-white/50"} hover:border-white/80`
                        : `text-black ${isDropdownOpen ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]/20" : "border-[#D8D8D8]"} hover:border-[#E8D1AB]`
                        } ${isDiscountLockedByQuote || isAmountPaid ? "cursor-not-allowed opacity-60" : ""}`}
                      title={isDiscountLockedByQuote ? quoteDiscountLockMessage : undefined}
                    >
                      {discountType === "percentage" ? "Percentage" : "Fixed Amount"}
                      <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""} ${isDark ? "text-white" : "text-black"}`} />
                    </button>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
                        <div className={`absolute top-[calc(100%+8px)] left-0 right-0 border rounded-xl overflow-hidden z-40 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark
                          ? "bg-[#0A0808] border-white/20"
                          : "bg-white border-[#D8D8D8]"
                          }`}>
                          <button
                            onClick={() => {
                              setDiscountType("percentage");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-4 transition-colors border-b ${isDark
                              ? "text-white hover:bg-white/10 border-white/5"
                              : "text-black hover:bg-gray-50 border-gray-100"
                              }`}
                          >
                            Percentage
                          </button>
                          <button
                            onClick={() => { setDiscountType("fixed_amount"); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-4 transition-colors ${isDark
                              ? "text-white hover:bg-white/10"
                              : "text-black hover:bg-gray-50"
                              }`}
                          >
                            Fixed Amount
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className={`absolute -top-2 lg:-top-2.5 left-4 px-2 text-xs lg:text-sm capitalize tracking-widest z-10 transition-colors duration-300 ${isDark
                    ? "bg-[#171717] text-white/60"
                    : "bg-white text-black/60"
                    }`}>
                    {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                  </label>
                  <div className={`flex items-center border rounded-xl px-4 py-4 bg-transparent transition-all focus-within:border-[#E8D1AB] ${isDark ? "border-white/50" : "border-[#D8D8D8]"}`}>
                    {discountType === "fixed_amount" && <DollarSign size={20} className={isDark ? "text-white mr-1" : "text-black mr-1"} />}
                    <input
                      type="number"
                      placeholder="0"
                      disabled={isDiscountLockedByQuote || isAmountPaid}
                      className={`bg-transparent w-full outline-none text-base transition-colors ${isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"}`}
                      value={discount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (discountType === "fixed_amount") {
                          setDiscount(value);
                        } else if (discountType === "percentage" && (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100))) {
                          setDiscount(value);
                        }
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                    {discountType === "percentage" && <Percent size={20} className={isDark ? "text-white" : "text-black"} />}
                  </div>
                </div>

                <Button
                  className={`h-12 w-full font-semibold py-3.5 rounded-lg transition-all text-sm ${isDark ? "bg-[#E8D1AB] text-[#101010] hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleGenerateDiscount}
                  disabled={isAmountPaid || isDiscountLockedByQuote || isGenerating || !discount || discountAmount > 0}
                  title={isDiscountLockedByQuote ? quoteDiscountLockMessage : discountAmount > 0 ? "Discount already applied" : undefined}
                >
                  {isGenerating ? "Generating..." : "Generate Code"}
                </Button>

                {showCompletedPaymentMessage && (
                  <div className={`rounded-xl border p-4 transition-colors ${isDark ? "border-emerald-500/25 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
                    <p className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                      Payment is already completed.
                    </p>
                  </div>
                )}

                {hasPendingAdditionalPayment && (
                  <div className={`rounded-xl border p-4 transition-colors ${isDark ? "border-[#E8D1AB]/25 bg-[#E8D1AB]/10" : "border-[#E7D7BC] bg-[#FFF8EA]"}`}>
                    <p className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#7A5A00]"}`}>
                      Additional payment is pending.
                    </p>
                    <p className={`mt-1 text-xs ${isDark ? "text-[#F3E6CC]/80" : "text-[#8A6A00]"}`}>
                      Outstanding amount: {formatCurrencyValue(additionalPaymentOutstandingAmount)}.
                    </p>
                  </div>
                )}

                {showDiscountCode && generatedCode && (
                  <div className={`flex flex-col gap-2 border rounded-xl p-4 transition-colors duration-300 ${isDark
                    ? "bg-[#0A0808] border-white/50"
                    : "bg-[#F3F4F6] border-[#D8D8D8]"
                    }`}>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Generated Code</p>
                    <div className="flex gap-2 items-center">
                      <div className={`flex-1 px-3 py-2 border rounded-sm text-sm font-mono transition-colors ${isDark
                        ? "bg-[#171717] border-[#3F3F46] text-[#E8D1AB]"
                        : "bg-white border-[#D8D8D8] text-[#B18A00]"
                        }`}>
                        {generatedCode}
                      </div>
                      <Button
                        className={`h-8 w-8 transition-colors ${isDark
                          ? "bg-[#171717] hover:bg-[#272626] text-white"
                          : "bg-white border border-[#D8D8D8] hover:bg-gray-100 text-black"
                          }`}
                        onClick={handleCopyCode}>
                        <Copy size={16} className={`${isDark ? "text-white" : "text-black"}`} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <UpdateLeadIntentModal
              isOpen={isIntentModalOpen}
              onClose={() => setIsIntentModalOpen(false)}
              onSave={handleUpdateIntent}
              currentIntent={lead.intent}
              isDark={isDark}
            />

            <GeneratePaymentLink
              leadId={parseInt(leadId)}
              bookingId={lead?.booking_id}
              discountCodeId={generatedDiscountId}
              discountLocked={isDiscountLockedByQuote}
              discountLockedMessage={quoteDiscountLockMessage}
              bookingStatus={status}
              isDark={isDark}
              activeLink={lead?.active_payment_link}
              additionalPaymentStatus={rawAdditionalPayment?.payment_status}
              additionalPaymentOutstandingAmount={rawAdditionalPayment?.outstanding_amount}
            />

            {showManualPaymentPanel ? (
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="p-4 lg:p-7 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                    Manual Payment Update
                  </h2>
                  {manualPaymentStatusLabel && (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${isDark ? "bg-[#E8D1AB]/15 text-[#E8D1AB]" : "bg-[#FFF3D6] text-[#7A5A00]"}`}>
                      {manualPaymentStatusLabel}
                    </span>
                  )}
                </div>

                {latestManualPaymentEntry?.createdAt && (
                  <p className={`text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                    Last updated {formatDateTimeUI(latestManualPaymentEntry.createdAt)}
                  </p>
                )}
                <div className={`rounded-lg border px-3 py-2 ${isDark ? "border-[#E8D1AB]/25 bg-[#E8D1AB]/10" : "border-[#E8D1AB] bg-[#FFF3D6]"}`}>
                  <p className={`text-xs ${isDark ? "text-white/70" : "text-black/70"}`}>
                    Paid: <span className="font-semibold text-emerald-500">{formatCurrencyValue(effectiveManualPaymentSummary.paidAmount)}</span>
                    {" · "}
                    Pending: <span className="font-semibold text-amber-500">{formatCurrencyValue(effectiveManualPaymentSummary.pendingAmount)}</span>
                  </p>
                </div>
                <p className={`text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Payment flow: <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>Manual Payment</span>
                </p>
                {effectiveManualPaymentSummary.hasFullPayment && (
                  <div className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    Full payment already completed. New payment entry is locked.
                  </div>
                )}

                {!effectiveManualPaymentSummary.hasFullPayment && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(["full", "partial"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setManualPaymentType(type)}
                          disabled={effectiveManualPaymentSummary.hasFullPayment}
                          className={`h-10 rounded-lg border text-sm font-medium transition-colors ${manualPaymentType === type
                            ? (isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/10 text-[#E8D1AB]" : "border-[#E8D1AB] bg-[#FFF3D6] text-black")
                            : (isDark ? "border-white/20 text-white/70 hover:border-white/40" : "border-[#D8D8D8] text-black/70 hover:border-[#BFA780]")
                            } ${effectiveManualPaymentSummary.hasFullPayment ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {type === "full" ? "Full Payment" : "Partial Payment"}
                        </button>
                      ))}
                    </div>

                    {manualPaymentType === "partial" && (
                      <input
                        type="number"
                        min="0"
                        max={effectiveManualPaymentSummary.pendingAmount}
                        step="0.01"
                        value={manualPaymentAmount}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          if (!nextValue) {
                            setManualPaymentAmount("");
                            return;
                          }
                          const numeric = Number(nextValue);
                          if (!Number.isFinite(numeric) || numeric < 0) return;
                          if (numeric > effectiveManualPaymentSummary.pendingAmount) {
                            setManualPaymentAmount(String(effectiveManualPaymentSummary.pendingAmount));
                            toast.error("Amount cannot exceed pending amount");
                            return;
                          }
                          setManualPaymentAmount(nextValue);
                        }}
                        placeholder={`Enter amount (max ${formatCurrencyValue(effectiveManualPaymentSummary.pendingAmount)})`}
                        disabled={effectiveManualPaymentSummary.hasFullPayment}
                        className={`h-11 rounded-lg border px-3 text-sm bg-transparent outline-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
                      />
                    )}

                    <Select
                      value={manualPaymentMode}
                      onValueChange={(value) => {
                        const nextMode = value as "cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "other" | "net30";
                        setManualPaymentMode(nextMode);
                        if (nextMode === "net30") {
                          setManualPaymentType("full");
                          setManualPaymentAmount("");
                        }
                      }}
                      disabled={effectiveManualPaymentSummary.hasFullPayment}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-lg border px-3 text-sm ${
                          isDark
                            ? "border-white/20 bg-transparent text-white"
                            : "border-[#D8D8D8] bg-transparent text-black"
                        }`}
                      >
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent
                        className={
                          isDark
                            ? "border-[#333333] bg-[#111111] text-white"
                            : "border-[#D8D8D8] bg-white text-black"
                        }
                      >
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="wire">Wire</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="venmo">Venmo</SelectItem>
                        <SelectItem value="cashapp">CashApp</SelectItem>
                        <SelectItem value="applepay">ApplePay</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {manualPaymentMode === "other" && (
                      <input
                        type="text"
                        value={manualPaymentOtherMode}
                        onChange={(event) => setManualPaymentOtherMode(event.target.value)}
                        placeholder="Enter payment mode"
                        disabled={effectiveManualPaymentSummary.hasFullPayment}
                        className={`h-11 rounded-lg border px-3 text-sm bg-transparent outline-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
                      />
                    )}

                    <div className={`rounded-lg border p-3 ${isDark ? "border-white/20" : "border-[#D8D8D8]"}`}>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">
                        Proof Upload (Required)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${isDark ? "border-white/20 hover:bg-white/5" : "border-[#D8D8D8] hover:bg-black/[0.03]"}`}>
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
                            disabled={isUploadingManualProof || effectiveManualPaymentSummary.hasFullPayment}
                          />
                        </label>
                        {isUploadingManualProof ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        {manualPaymentProofFileName ? (
                          <span className="truncate text-xs text-[#71717B]">{manualPaymentProofFileName}</span>
                        ) : null}
                      </div>
                    </div>

                    <textarea
                      value={manualPaymentNotes}
                      onChange={(event) => setManualPaymentNotes(event.target.value)}
                      placeholder="Notes (optional)"
                      rows={3}
                      disabled={effectiveManualPaymentSummary.hasFullPayment}
                      className={`rounded-lg border p-3 text-sm bg-transparent outline-none resize-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
                    />

                    <Button
                      onClick={handleManualPaymentSubmit}
                      disabled={isSubmittingManualPayment || isUploadingManualProof || effectiveManualPaymentSummary.hasFullPayment}
                      className={`h-11 text-sm font-semibold ${isDark ? "bg-[#E8D1AB] text-[#101010] hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}`}
                    >
                      {isSubmittingManualPayment ? "Saving..." : "Save Manual Payment"}
                    </Button>
                  </div>
                )}

                {manualPaymentEntries.length > 0 && (
                  <div className={`rounded-lg border p-3 ${isDark ? "border-white/15 bg-white/[0.02]" : "border-[#E4E4E7] bg-white"}`}>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">
                      Uploaded Payment Proofs
                    </p>
                    <div className="space-y-2">
                      {manualPaymentEntries.map((entry, index) => {
                        const proofUrl = resolveS3ProofUrl(entry.data.proof_url);
                        const receiptBookingId = Number(entry.data.booking_id || lead?.booking_id || 0);
                        const manualPaymentId = Number(entry.data.booking_manual_payment_id || entry.data.manual_payment_id || 0);
                        const receiptUrl =
                          Number.isFinite(receiptBookingId) &&
                          receiptBookingId > 0 &&
                          Number.isFinite(manualPaymentId) &&
                          manualPaymentId > 0
                            ? buildBeigeInvoiceUrl(receiptBookingId, {
                                receipt: true,
                                cacheBust: true,
                              }) + `&manual_payment_id=${encodeURIComponent(String(manualPaymentId))}`
                            : "";
                        const paidMode = entry.data.payment_mode
                          ? String(entry.data.payment_mode).toLowerCase() === "other" && entry.data.other_payment_mode
                            ? String(entry.data.other_payment_mode)
                            : String(entry.data.payment_mode).replace(/_/g, " ")
                          : "manual";
                        return (
                          <div
                            key={`${entry.createdAt || "entry"}-${index}`}
                            className={`rounded-md border px-3 py-2 text-xs ${isDark ? "border-white/10" : "border-[#ECECEC]"}`}
                          >
                            <p className={isDark ? "text-white/80" : "text-black/75"}>
                              {String(entry.data.payment_mode || "").toLowerCase() === "net30"
                                ? "Net 30 initiated"
                                : entry.data.payment_type === "partial"
                                ? `Partial paid ${formatCurrencyValue(entry.data.amount)}`
                                : "Full payment marked"}{" "}
                              via {paidMode}
                            </p>
                            <p className={isDark ? "text-white/45 mt-1" : "text-black/45 mt-1"}>
                              {entry.createdAt ? formatDateTimeUI(entry.createdAt) : "Date unavailable"}
                            </p>
                            {proofUrl && (
                              <a
                                href={proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-[#E8D1AB] underline underline-offset-2"
                              >
                                Download Proof
                              </a>
                            )}
                            {receiptUrl && (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 mt-1 inline-block text-[#E8D1AB] underline underline-offset-2"
                              >
                                View Receipt
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            ) : isAmountPaid ? (
              <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                <div className="p-4 lg:p-7 space-y-3">
                  <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                    Payment Details
                  </h2>
                  <div className={`rounded-lg border px-3 py-2 ${isDark ? "border-emerald-500/25 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
                    <p className={`text-sm font-medium ${isDark ? "text-emerald-200" : "text-emerald-700"}`}>
                      Payment completed via Stripe
                    </p>
                  </div>
                  <div className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                    <p>
                      Total Paid Amount:{" "}
                      <span className={isDark ? "text-white" : "text-black"}>
                        {formatCurrencyValue(displayPaidAmount)}
                      </span>
                    </p>
                    <p className="mt-1">
                      Pending Amount:{" "}
                      <span className={isDark ? "text-white" : "text-black"}>
                        {formatCurrencyValue(
                          Math.max(
                            0,
                            Number(
                              additionalPaymentDetails?.outstandingAmount ??
                                effectiveManualPaymentSummary.pendingAmount ??
                                0
                            )
                          )
                        )}
                      </span>
                      {additionalPaymentDetails?.isDecrease && (
                        <span className="ml-1 text-[10px] text-golden italic">
                          (This reduced amount will be added as Beige Credits after approval)
                        </span>
                      )}
                     </p>
                    {booking?.payment_completed_at ? (
                      <p className="mt-1">
                        Paid At:{" "}
                        <span className={isDark ? "text-white" : "text-black"}>
                          {formatDateTimeUI(booking.payment_completed_at)}
                        </span>
                      </p>
                    ) : null}
                    {booking?.payment_id ? (
                      <p className="mt-1">
                        Payment ID:{" "}
                        <span className={isDark ? "text-white" : "text-black"}>#{booking.payment_id}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {quotePricingDetails && (
              <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                <div className="p-4 lg:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                        Quote Pricing Details
                      </h2>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                        Converted from quote {quotePricingDetails.quoteDisplayNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {quotePricingDetails.status && (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${
                            isDark ? "bg-white/5 text-[#E8D1AB]" : "bg-[#FFF6D9] text-[#7A5A00]"
                          }`}
                        >
                          {quotePricingDetails.status}
                        </span>
                      )}
                      <div className="group relative inline-flex">
                        <Button
                          type="button"
                          onClick={handleEditQuoteRedirect}
                          disabled={!canEditQuote}
                          className={`h-8 w-8 p-0 text-xs font-semibold rounded-lg border transition-all ${
                            isDark
                              ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
                              : "text-black bg-white border-[#D8D8D8] hover:bg-gray-50 shadow-sm"
                          } ${!canEditQuote ? "opacity-60 cursor-not-allowed" : ""}`}
                          aria-label="Edit Quote"
                          title="Edit Quote"
                        >
                          <Edit2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-5 grid grid-cols-2 gap-3 rounded-2xl p-4 ${isDark ? "bg-[#111111]" : "bg-[#F8F8F8]"}`}>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Pricing Mode</p>
                      <p className={`mt-1 text-sm font-medium capitalize ${isDark ? "text-white" : "text-black"}`}>
                        {quotePricingDetails.pricingMode || "General"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot Hours</p>
                      <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {quotePricingDetails.shootHours || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Subtotal</p>
                      <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {formatCurrencyValue(quotePricingDetails.subtotal)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Discount</p>
                      <p className="mt-1 text-sm font-medium text-red-400">
                        {formatCurrencyValue(quotePricingDetails.discountAmount)}
                      </p>
                    </div>
                    {quotePricingDetails.taxAmount > 0 && (
                      <>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>After Discount</p>
                          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {formatCurrencyValue(quotePricingDetails.priceAfterDiscount)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                            Tax
                            {quotePricingDetails.taxRate > 0 ? ` (${quotePricingDetails.taxRate}%)` : ""}
                          </p>
                          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {formatCurrencyValue(quotePricingDetails.taxAmount)}
                          </p>
                        </div>
                      </>
                    )}
                    {quotePricingDetails.expiresAt && (
                      <div className="col-span-2">
                        <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Quote Expiry</p>
                        <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                          {formatDateUI(quotePricingDetails.expiresAt) || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Quote Line Items</p>
                      <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                        {quotePricingDetails.source === "custom_quote"
                          ? "Converted quote data"
                          : quotePricingDetails.source === "database"
                            ? "Saved quote data"
                            : "Projected quote"}
                      </p>
                    </div>

                    {categorizedQuoteLineItems.length > 0 ? (
                      categorizedQuoteLineItems.map((category) => (
                        <div key={category.key} className="space-y-3">
                          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-black/45"}`}>
                            {category.label}
                          </p>

                          <div
                            className={`rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#111111]" : "border-[#ECECEC] bg-[#FCFCFC]"}`}
                          >
                            {category.items.map((item, index) => (
                              <div
                                key={item.id}
                                className={`p-4 ${index !== category.items.length - 1 ? (isDark ? "border-b border-[#2D2D2D]" : "border-b border-[#ECECEC]") : ""}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-medium break-words ${isDark ? "text-white" : "text-black"}`}>
                                      {item.name}
                                    </p>
                                    <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                                      Qty {item.quantity} x {formatCurrencyValue(item.unitPrice)}
                                    </p>
                                  </div>
                                  <p className={`shrink-0 text-sm font-semibold text-right ${isDark ? "text-white" : "text-black"}`}>
                                    {formatCurrencyValue(item.total)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-[#3D3D3D] text-white/45" : "border-[#D8D8D8] text-black/45"}`}>
                        No quote line items were returned for this converted booking.
                      </div>
                    )}
                  </div>

                  <div className={`mt-5 flex items-center justify-between rounded-2xl px-4 py-4 ${isDark ? "bg-[#0F0F0F]" : "bg-[#F8F8F8]"}`}>
                    <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Quoted Total</span>
                    <span className="text-lg font-semibold text-[#E8D1AB]">
                      {formatCurrencyValue(quotePricingDetails.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="lg:text-right lg:mt-[82px]">
              {/* <Button
                onClick={() => router.push(`/sales/select-creatives?id=${leadId}`)}
                className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border transition-all ${isDark
                  ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
                  : "text-black bg-white border-[#D8D8D8] hover:bg-gray-50 shadow-sm"
                  }`}
              >
                Change CPs
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      <ConvertBookingModal
        open={isConvertedBookingEditModalOpen}
        onClose={() => {
          if (isUpdatingConvertedBooking) {
            return;
          }
          setIsConvertedBookingEditModalOpen(false);
        }}
        onSubmit={(data) => {
          void handleUpdateConvertedBooking(data);
        }}
        isSubmitting={isUpdatingConvertedBooking}
        isDark={isDark}
        initialData={convertedBookingInitialValues}
        title="Edit Booking Details"
        description="Update the booking type, shoot date and time, and location for this converted booking."
        submitLabel="Update Details"
      />
      <SalesQuoteEditAccessModal
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
        quoteNumber={quotePricingDetails?.quoteDisplayNumber || String(editableQuoteId || "Pending")}
        clientName={clientName}
        shootDateValue={quoteEditAccessShootDateValue}
        isSubmitting={isEditAccessSubmitting}
      />

      <Dialog open={isCPModalOpen} onOpenChange={setIsCPModalOpen}>
        <DialogContent
          className={`max-w-5xl overflow-y-auto max-h-[90vh] no-scrollbar p-0 transition-colors duration-300 border ${isDark
            ? "bg-[#101010] border-[#333] text-white"
            : "bg-white border-[#D8D8D8] text-black"
            }`}
        >
          <div className="sr-only">
            <DialogTitle>Creative Partner Profile</DialogTitle>
          </div>
          <div className="p-6">
            {selectedCPId && (
              <CreativePartnerProfile id={selectedCPId} hideActions={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
