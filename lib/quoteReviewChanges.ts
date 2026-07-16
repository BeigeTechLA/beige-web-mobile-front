import { format, isValid, parseISO } from "date-fns";

import type { SalesQuoteDetailData } from "@/lib/api";
import type { QuoteDraftBookingSchedule, QuoteDraftPayload } from "@/lib/quoteDraft";
import {
  formatQuoteItemDisplayName,
  getQuoteDisplayShootTypeLabel,
  getQuoteNumber,
  getQuoteText,
  normalizeQuoteLineItems,
} from "@/lib/quoteDetail";

export type QuoteReviewLineChange = {
  id: string;
  label: string;
  section: "service" | "addon" | "logistics" | "custom";
  changeType: "added" | "removed" | "updated";
  previousAmount: number;
  nextAmount: number;
  delta: number;
};

export type QuoteReviewFieldChange = {
  id: string;
  label: string;
  previousValue: string;
  nextValue: string;
};

export type QuoteReviewComparableItem = {
  id: string;
  key: string;
  label: string;
  name: string;
  subtitle?: string;
  section: "service" | "addon" | "logistics" | "custom";
  amount: number;
};

type QuoteReviewCatalogEntry = {
  id: string;
  label?: string;
  name?: string;
};

type BuildCurrentDraftReviewItemsInput = {
  draftLineItems: QuoteDraftPayload["line_items"];
  services: QuoteReviewCatalogEntry[];
  addons: QuoteReviewCatalogEntry[];
  logisticsItems: QuoteReviewCatalogEntry[];
  lineItems: QuoteReviewCatalogEntry[];
};

type BuildQuoteReviewChangesDataInput = {
  quote: SalesQuoteDetailData | null | undefined;
  currentDraftLineItems: QuoteReviewComparableItem[];
  bookingSchedule?: QuoteDraftBookingSchedule | null;
  nextTotal: number;
  clientName: string;
  emailId: string;
  phoneNumber: string;
  address: string;
  projectDescription: string;
  preProductionNotes?: string;
  preProductionFileName?: string;
  validUntil: string;
  discountEnabled: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number | string;
  normalizedTaxRate: number;
  taxLabel: string;
  shootTypeLabel: string;
};

const normalizeReviewKeyPart = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const buildReviewItemKey = (
  section: string,
  name: string,
  subtitle?: string | null,
) =>
  [
    normalizeReviewKeyPart(section),
    normalizeReviewKeyPart(name),
    normalizeReviewKeyPart(subtitle || ""),
  ].join("|");

const formatReviewDisplayLabel = (name: string, subtitle?: string | null) =>
  subtitle ? `${name} - ${subtitle.replace(/^\(|\)$/g, "")}` : name;

const buildReviewItemGroups = (items: QuoteReviewComparableItem[]) => {
  const groupedItems = new Map<string, QuoteReviewComparableItem>();

  items.forEach((item) => {
    const existingItem = groupedItems.get(item.key);
    if (existingItem) {
      groupedItems.set(item.key, {
        ...existingItem,
        amount: existingItem.amount + item.amount,
      });
      return;
    }

    groupedItems.set(item.key, { ...item });
  });

  return groupedItems;
};

const formatReviewValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const formatFileReviewValue = (name: unknown, size?: unknown) => {
  const fileName = formatReviewValue(name);
  if (!fileName) {
    return "";
  }

  const fileSize = Number(size || 0);
  return Number.isFinite(fileSize) && fileSize > 0
    ? `${fileName} (${Math.round(fileSize)} bytes)`
    : fileName;
};

const formatEditorDate = (value: string) => {
  if (!value) {
    return "";
  }

  const parsedDate = parseISO(value);
  return isValid(parsedDate) ? format(parsedDate, "MMMM d, yyyy") : value;
};

type ReviewBookingDay = {
  date?: string | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type ReviewBookingScheduleLike = {
  booking_type?: string | null;
  time_zone?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  booking_days?: ReviewBookingDay[] | null;
  converted_booking_details?: ReviewBookingScheduleLike | null;
} | null | undefined;

const formatEditorTime = (value?: string | null) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed.slice(0, 5) : "";
};

const resolveReviewBookingSchedule = (
  value: ReviewBookingScheduleLike,
): ReviewBookingScheduleLike => {
  if (!value) {
    return null;
  }

  return value.converted_booking_details ?? value;
};

const formatBookingScheduleForReview = (
  value: ReviewBookingScheduleLike,
) => {
  const schedule = resolveReviewBookingSchedule(value);
  if (!schedule) {
    return "";
  }

  const bookingDays = Array.isArray(schedule.booking_days)
    ? schedule.booking_days
        .map((day) => {
          const date = getQuoteText(day?.date, day?.event_date);
          const startTime = formatEditorTime(day?.start_time);
          const endTime = formatEditorTime(day?.end_time);
          return date && startTime && endTime
            ? { date, startTime, endTime }
            : null;
        })
        .filter(
          (day): day is { date: string; startTime: string; endTime: string } =>
            Boolean(day),
        )
    : [];
  const hasAnyBookingFields =
    Boolean(schedule.booking_type) ||
    Boolean(schedule.start_date) ||
    Boolean(schedule.start_time) ||
    Boolean(schedule.end_time) ||
    bookingDays.length > 0;

  if (schedule.booking_type === "tbd" || !hasAnyBookingFields) {
    return "TBD";
  }

  const shouldUseMultiDay =
    schedule.booking_type === "multi_day" || bookingDays.length > 1;

  if (shouldUseMultiDay) {
    if (!bookingDays.length) {
      return "Multiple Days";
    }

    return `Multiple Days: ${bookingDays
      .map((day) => `${formatEditorDate(day.date)} ${day.startTime} - ${day.endTime}`)
      .join("; ")}`;
  }

  const startDate = getQuoteText(schedule.start_date, bookingDays[0]?.date);
  const startTime = formatEditorTime(schedule.start_time) || bookingDays[0]?.startTime || "";
  const endTime = formatEditorTime(schedule.end_time) || bookingDays[0]?.endTime || "";

  if (!startDate || !startTime || !endTime) {
    return "Date & time not set";
  }

  return `Single Day: ${formatEditorDate(startDate)} ${startTime} - ${endTime}`;
};

export const buildCurrentDraftReviewItems = ({
  draftLineItems,
  services,
  addons,
  logisticsItems,
  lineItems,
}: BuildCurrentDraftReviewItemsInput): QuoteReviewComparableItem[] => {
  const lineItemCatalog = new Map<string, { label: string; section: string }>();

  services.forEach((item) => {
    lineItemCatalog.set(String(item.id), {
      label: String(item.label || item.name || "Service"),
      section: "service",
    });
  });
  addons.forEach((item) => {
    lineItemCatalog.set(String(item.id), {
      label: String(item.label || item.name || "Add-on"),
      section: "addon",
    });
  });
  logisticsItems.forEach((item) => {
    lineItemCatalog.set(String(item.id), {
      label: String(item.label || item.name || "Logistics"),
      section: "logistics",
    });
  });
  lineItems.forEach((item) => {
    lineItemCatalog.set(String(item.id), {
      label: String(item.label || item.name || "Custom Item"),
      section: "custom",
    });
  });

  return (draftLineItems || []).map((item, index) => {
    const catalogMeta = item.catalog_item_id
      ? lineItemCatalog.get(String(item.catalog_item_id))
      : null;
    const rawSubtitle =
      typeof item.configuration?.editing_type_label === "string"
        ? item.configuration.editing_type_label.trim()
        : "";
    const subtitle = rawSubtitle ? `(${rawSubtitle})` : undefined;
    const section =
      item.section_type === "addon" ||
      item.section_type === "logistics" ||
      item.section_type === "custom"
        ? item.section_type
        : "service";
    const name = formatQuoteItemDisplayName(
      String(
        item.item_name ||
          catalogMeta?.label ||
          (section === "service"
            ? "Service"
            : section === "addon"
              ? "Add-on"
              : section === "logistics"
                ? "Logistics"
                : "Custom Item"),
      ).trim(),
    );
    const quantity = Math.max(1, Number(item.quantity || 1));
    const duration = Math.max(0, Number(item.duration_hours || 0));
    const crew = Math.max(0, Number(item.crew_size || 0));
    const unitRate = Math.max(
      0,
      Number(item.estimated_pricing ?? item.unit_rate ?? 0),
    );
    const amount =
      section === "service" && !subtitle
        ? quantity * Math.max(duration, 1) * Math.max(crew, 1) * unitRate
        : quantity * unitRate;

    return {
      id: `${section}-${item.catalog_item_id || item.item_name || index}`,
      key: buildReviewItemKey(section, name, subtitle),
      label: formatReviewDisplayLabel(name, subtitle),
      name,
      subtitle,
      section,
      amount,
    };
  });
};

export const buildQuoteReviewChangesData = ({
  quote,
  currentDraftLineItems,
  bookingSchedule,
  nextTotal,
  clientName,
  emailId,
  phoneNumber,
  address,
  projectDescription,
  preProductionNotes = "",
  preProductionFileName = "",
  validUntil,
  discountEnabled,
  discountType,
  discountValue,
  normalizedTaxRate,
  taxLabel,
  shootTypeLabel,
}: BuildQuoteReviewChangesDataInput) => {
  const originalLineItems = quote ? normalizeQuoteLineItems(quote) : [];
  const previousBookingSchedule = quote?.converted_booking_details ?? quote;
  const previousTotal = Math.max(
    0,
    getQuoteNumber(
      quote?.final_total,
      quote?.total_amount,
      quote?.amount_after_tax,
      quote?.amount_after_discount,
      quote?.total,
    ) ?? 0,
  );
  const normalizedNextTotal = Math.max(0, nextTotal);
  const currentItemMap = buildReviewItemGroups(currentDraftLineItems);
  const originalItemMap = buildReviewItemGroups(
    originalLineItems.map((item) => ({
      id: item.id,
      key: buildReviewItemKey(item.section, item.name, item.subtitle),
      label: formatReviewDisplayLabel(item.name, item.subtitle),
      name: item.name,
      subtitle: item.subtitle,
      section: item.section,
      amount: Number(item.amount || 0),
    })),
  );

  const lineChanges: QuoteReviewLineChange[] = [];

  currentItemMap.forEach((item, key) => {
    const previous = originalItemMap.get(key);
    if (!previous) {
      lineChanges.push({
        id: `${key}-added`,
        label: item.label,
        section: item.section,
        changeType: "added",
        previousAmount: 0,
        nextAmount: item.amount,
        delta: item.amount,
      });
      return;
    }

    const previousAmount = Number(previous.amount || 0);
    const nextAmount = Number(item.amount || 0);
    if (Math.abs(previousAmount - nextAmount) > 0.009) {
      lineChanges.push({
        id: `${key}-updated`,
        label: item.label,
        section: item.section,
        changeType: "updated",
        previousAmount,
        nextAmount,
        delta: nextAmount - previousAmount,
      });
    }
  });

  originalItemMap.forEach((item, key) => {
    if (currentItemMap.has(key)) {
      return;
    }

    lineChanges.push({
      id: `${key}-removed`,
      label: formatReviewDisplayLabel(item.name, item.subtitle),
      section: item.section,
      changeType: "removed",
      previousAmount: Number(item.amount || 0),
      nextAmount: 0,
      delta: -Number(item.amount || 0),
    });
  });

  const fieldChangeCandidates: QuoteReviewFieldChange[] = [
    {
      id: "client_name",
      label: "Client Name",
      previousValue: formatReviewValue(getQuoteText(quote?.client_name, quote?.client_user?.name)),
      nextValue: formatReviewValue(clientName),
    },
    {
      id: "email_id",
      label: "Email ID",
      previousValue: formatReviewValue(
        getQuoteText(quote?.client_email, quote?.guest_email, quote?.client_user?.email),
      ),
      nextValue: formatReviewValue(emailId),
    },
    {
      id: "phone_number",
      label: "Phone Number",
      previousValue: formatReviewValue(getQuoteText(quote?.client_phone, quote?.client_user?.phone)),
      nextValue: formatReviewValue(phoneNumber),
    },
    {
      id: "address",
      label: "Address",
      previousValue: formatReviewValue(
        getQuoteText(quote?.client_address, quote?.address, quote?.location),
      ),
      nextValue: formatReviewValue(address),
    },
    {
      id: "project_description",
      label: "Project Description",
      previousValue: formatReviewValue(quote?.project_description),
      nextValue: projectDescription.trim(),
    },
    {
      id: "pre_production_notes",
      label: "Pre-production Notes",
      previousValue: formatReviewValue(quote?.pre_production_notes),
      nextValue: preProductionNotes.trim(),
    },
    {
      id: "pre_production_file",
      label: "Pre-production File",
      previousValue: formatFileReviewValue(
        quote?.pre_production_file_name,
        quote?.pre_production_file_size,
      ),
      nextValue: preProductionFileName.trim(),
    },
    {
      id: "shoot_type",
      label: "Shoot Type",
      previousValue: formatReviewValue(getQuoteDisplayShootTypeLabel(quote)),
      nextValue: formatReviewValue(shootTypeLabel),
    },
    {
      id: "valid_until",
      label: "Quote Valid Until",
      previousValue: formatEditorDate(String(quote?.valid_until || "")),
      nextValue: formatEditorDate(validUntil),
    },
    {
      id: "discount",
      label: "Discount",
      previousValue:
        Number(getQuoteNumber(quote?.discount_value) ?? 0) > 0
          ? `${getQuoteText(quote?.discount_type) === "fixed_amount" ? "$" : ""}${getQuoteNumber(quote?.discount_value) ?? 0}${getQuoteText(quote?.discount_type) === "percentage" ? "%" : ""}`
          : "None",
      nextValue:
        discountEnabled && Number(discountValue || 0) > 0
          ? `${discountType === "fixed" ? "$" : ""}${Number(discountValue || 0)}${discountType === "percentage" ? "%" : ""}`
          : "None",
    },
    {
      id: "tax_rate",
      label: "Tax Rate",
      previousValue: `${getQuoteNumber(quote?.tax_rate) ?? 0}%`,
      nextValue: `${normalizedTaxRate}%`,
    },
    {
      id: "tax_type",
      label: "Tax Type",
      previousValue: getQuoteText(quote?.tax_type, "Sales Tax") || "Sales Tax",
      nextValue: taxLabel || "Sales Tax",
    },
    {
      id: "booking_schedule",
      label: "Booking Date & Time",
      previousValue: formatBookingScheduleForReview(previousBookingSchedule as ReviewBookingScheduleLike),
      nextValue: formatBookingScheduleForReview(bookingSchedule as ReviewBookingScheduleLike),
    },
  ];

  const fieldChanges = fieldChangeCandidates.filter(
    (entry) => entry.previousValue !== entry.nextValue,
  );

  return {
    previousTotal,
    nextTotal: normalizedNextTotal,
    delta: normalizedNextTotal - previousTotal,
    lineChanges,
    serviceChanges: lineChanges.filter((item) => item.section === "service"),
    addonChanges: lineChanges.filter((item) => item.section === "addon"),
    logisticsChanges: lineChanges.filter((item) => item.section === "logistics"),
    customChanges: lineChanges.filter((item) => item.section === "custom"),
    fieldChanges,
  };
};
