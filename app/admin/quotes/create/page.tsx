"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Search,
  Plus,
  Save,
  Check,
  MoreVertical,
  Minus,
  Trash2,
  Pencil,
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Info,
  Percent,
  DollarSign,
  ArrowLeft,
  Eye,
  Loader2,
  Mail,
  TrendingDown,
  TriangleAlert,
  X,
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DottedDivider from "@/components/admin/DottedDivider";
import ConvertBookingModal, {
  type ConvertBookingModalInitialData,
  type ConvertBookingModalSubmitData,
} from "@/components/admin/quotes/ConvertBookingModal";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid, differenceInDays, startOfDay } from "date-fns";
import { DatePicker } from "@/components/ui/Datepicker";
import Image from "next/image";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import QuoteSummaryModal from "@/components/quotes/QuoteSummaryModal";
import {
  LocationPicker,
  darkThemeColors,
} from "@/src/components/booking/v2/component/LocationPicker";
import {
  salesApi,
  type SalesQuoteConvertToBookingPayload,
  type SalesQuoteDetailData,
} from "@/lib/api";
import {
  extractQuoteLineItems,
  formatQuoteItemDisplayName,
  getQuoteAdditionalPaymentDetails,
  getQuoteNumber,
  getQuoteText,
  getQuoteLineItemEditingTypeConfiguration,
  getQuoteLineItemEditingTypeLabel,
  normalizeQuoteLineItems,
} from "@/lib/quoteDetail";
import {
  buildQuoteEditorHydrationState,
  normalizeQuoteEditorView,
  readQuoteEditorNavigationCache,
} from "@/lib/quoteEdit";
import {
  buildQuoteDraftPayload,
  buildQuoteStepUpdatePayload,
  buildQuoteUpdatePayload,
} from "@/lib/quoteDraft";
import {
  buildQuoteSummarySnapshot,
  hasQuoteSummaryContent,
  getQuoteValidationMessage,
  validateQuoteForReview,
  validateQuoteStep,
  type QuoteSummarySnapshot,
} from "@/lib/quoteSummary";
import {
  extractQuoteIdFromResponse,
  unwrapSalesQuoteDetail,
} from "@/lib/salesQuotePreview";
import { getBrowserTimeZone } from "@/lib/timezone";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import { ClientTypeBadge } from "@/components/generic/ClientTypeBadge";
import { useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";

const clients = [
  // Dynamic client fetching replaces hardcoded array
];

type CatalogSectionItem = {
  catalog_item_id?: string | number | null;
  name?: string;
  effective_rate?: string | number | null;
  created_at?: string | null;
};

type ServiceItem = {
  id: string;
  catalogItemId?: string | number | null;
  catalog_item_id?: string | number | null;
  label: string;
  price: number;
  icon?: React.ReactNode;
  createdAt?: string | null;
  originalIndex?: number;
};

type AddonItem = {
  id: string;
  label: string;
  price: number;
  createdAt?: string | null;
  originalIndex?: number;
};

type LogisticsItem = {
  id: string;
  label: string;
  basePrice: number;
  createdAt?: string | null;
  originalIndex?: number;
};

type LineItem = {
  id: string;
  label: string;
  basePrice: number;
  createdAt?: string | null;
  originalIndex?: number;
};

type CatalogEditType = "service" | "addon" | "logistics" | "line_item";

type CatalogEditItem = {
  id: string;
  type: CatalogEditType;
  label: string;
  price: number;
};

const getCatalogEditItemLabel = (type: CatalogEditType) => {
  switch (type) {
    case "service":
      return "Service Item";
    case "addon":
      return "Add-on Item";
    case "logistics":
      return "Logistics Item";
    case "line_item":
      return "Line Item";
    default:
      return "Catalog Item";
  }
};

type ShootTypeApiItem = {
  sales_shoot_type_id?: string | number | null;
  shoot_type_id?: string | number | null;
  shootTypeId?: string | number | null;
  id?: string | number | null;
  project_type_id?: string | number | null;
  projectTypeId?: string | number | null;
  quote_shoot_type_id?: string | number | null;
  name?: string | null;
  label?: string | null;
  editing_type_label?: string | null;
  editingTypeLabel?: string | null;
  editing_type_key?: string | null;
  editingTypeKey?: string | null;
  key?: string | null;
  slug?: string | null;
  created_at?: string | null;
  is_system_default?: string | number | boolean | null;
  is_custom_editing_type?: string | number | boolean | null;
  isCustomEditingType?: string | number | boolean | null;
  isSystemDefault?: string | number | boolean | null;
  value?: string | null;
  note?: string | null;
};

type AiEditingTypeApiItem = {
  ai_editing_type_id?: string | number | null;
  editing_type_id?: string | number | null;
  id?: string | number | null;
  key?: string | null;
  value?: string | null;
  label?: string | null;
  note?: string | null;
  category?: string | null;
  type?: string | null;
  created_at?: string | null;
  is_custom?: string | number | boolean | null;
  isCustom?: string | number | boolean | null;
  is_custom_editing_type?: string | number | boolean | null;
  isCustomEditingType?: string | number | boolean | null;
  is_system_default?: string | number | boolean | null;
  isSystemDefault?: string | number | boolean | null;
};

type AiEditingTypesApiResponse = {
  video_edit_types?: AiEditingTypeApiItem[] | null;
  photo_edit_types?: AiEditingTypeApiItem[] | null;
};

type ShootTypeOption = {
  id: string;
  apiId: string | null;
  label: string;
  key: string;
  category?: "video" | "photo";
  isCustom: boolean;
  createdAt: string | null;
  isSystemDefault: boolean;
  originalIndex: number;
};

type ShootTypeKind = "video" | "photo";

type ClientDropdownItem = {
  client_id?: string | number | null;
  user_id?: string | number | null;
  id?: string | number | null;
  name?: string | number | null;
  client_name?: string | number | null;
  full_name?: string | number | null;
  email?: string | number | null;
  client_email?: string | number | null;
  guest_email?: string | number | null;
  phone?: string | number | null;
  mobile?: string | number | null;
  mobile_number?: string | number | null;
  phone_number?: string | number | null;
  client_phone?: string | number | null;
  address?: string | number | null;
  client_address?: string | number | null;
  location?: string | number | null;
  client_location?: string | number | null;
  street_address?: string | number | null;
  full_address?: string | number | null;
  client_type?: string | number | null;
};

const PROTECTED_SERVICE_ORDER = [
  "videography",
  "photography",
  "ai editing",
  "livestream production",
  "studio",
] as const;

const PROTECTED_ADDON_LABELS = [
  "4k camera upgrade",
  "drone footage",
  "additional crew member",
  "lighting package",
  "audio recording kit",
  "green screen setup",
  "teleprompter",
  "hair and makeup artist",
  "hair & makeup artist",
] as const;

const PROTECTED_LINE_ITEM_LABELS = ["rush delivery"] as const;

const LINE_ITEM_SECTION_KEYS = [
  "line_item",
  "line_items",
  "custom_line_item",
  "custom_line_items",
  "customlineitems",
  "customLineItems",
] as const;

const normalizeServiceLabel = (label: string) => label.trim().toLowerCase();
const normalizeAddonLabel = (label: string) => label.trim().toLowerCase();
const normalizeLineItemLabel = (label: string) => label.trim().toLowerCase();
const getServiceDisplayLabel = (label: string) => formatQuoteItemDisplayName(label);

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatAddonDisplayValue = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type QuoteReviewLineChange = {
  id: string;
  label: string;
  section: "service" | "addon" | "logistics" | "custom";
  changeType: "added" | "removed" | "updated";
  previousAmount: number;
  nextAmount: number;
  delta: number;
};

type QuoteReviewFieldChange = {
  id: string;
  label: string;
  previousValue: string;
  nextValue: string;
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

const formatReviewValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const MAX_QUOTE_OPTION_LABEL_LENGTH = 80;

const clampTextLength = (
  value: string,
  maxLength = MAX_QUOTE_OPTION_LABEL_LENGTH
) => value.slice(0, maxLength);

const parseRawPrice = (value: string) => {
  let cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  return cleaned;
};

const sanitizeCurrencyInput = (value: string) => parseRawPrice(value);
const parseCurrencyInput = (value: string) => {
  const parsedValue = parseFloat(parseRawPrice(value));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const normalizeConvertModalTime = (value?: string | null) => {
  if (!value) return "";
  const trimmedValue = String(value).trim();
  const match = trimmedValue.match(/^(\d{2}:\d{2})/);
  return match?.[1] || "";
};

const buildConvertModalInitialData = (
  booking?: {
    event_location?: string;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    booking_days?: Array<{
      event_date: string;
      start_time: string;
      end_time: string;
    }>;
  } | null,
): ConvertBookingModalInitialData | null => {
  if (!booking) {
    return null;
  }

  const bookingDays = Array.isArray(booking.booking_days)
    ? booking.booking_days
        .filter((day) => day?.event_date)
        .map((day) => ({
          date: day.event_date,
          startTime: normalizeConvertModalTime(day.start_time),
          endTime: normalizeConvertModalTime(day.end_time),
        }))
        .filter((day) => day.startTime && day.endTime)
    : [];

  if (bookingDays.length > 1) {
    const [firstDay] = bookingDays;
    const sameTimings = bookingDays.every(
      (day) =>
        day.startTime === firstDay.startTime && day.endTime === firstDay.endTime,
    );

    return {
      bookingType: "multi_day",
      location: booking.event_location || "",
      multiDay: {
        sameTimings,
        sharedStartTime: sameTimings ? firstDay.startTime : undefined,
        sharedEndTime: sameTimings ? firstDay.endTime : undefined,
        days: bookingDays,
      },
    };
  }

  const singleDayDate = bookingDays[0]?.date || booking.event_date || "";
  const singleDayStartTime =
    bookingDays[0]?.startTime || normalizeConvertModalTime(booking.start_time);
  const singleDayEndTime =
    bookingDays[0]?.endTime || normalizeConvertModalTime(booking.end_time);

  if (!singleDayDate || !singleDayStartTime || !singleDayEndTime) {
    return null;
  }

  return {
    bookingType: "single_day",
    location: booking.event_location || "",
    singleDay: {
      date: singleDayDate,
      startTime: singleDayStartTime,
      endTime: singleDayEndTime,
    },
  };
};

const mergeCatalogItemsById = <T extends { id: string }>(
  primaryItems: T[],
  secondaryItems: T[],
) => {
  const existingIds = new Set(primaryItems.map((item) => item.id));
  const mergedItems = [...primaryItems];

  secondaryItems.forEach((item) => {
    if (existingIds.has(item.id)) {
      return;
    }

    existingIds.add(item.id);
    mergedItems.push(item);
  });

  return mergedItems;
};

const pickFirstClientValue = (
  ...values: Array<string | number | null | undefined>
) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
};

const getClientDisplayName = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.name, client?.client_name, client?.full_name);

const getClientEmail = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.email,
    client?.client_email,
    client?.guest_email,
  );

const getClientPhone = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.phone,
    client?.mobile,
    client?.mobile_number,
    client?.phone_number,
    client?.client_phone,
  );

const getClientAddress = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.address,
    client?.client_address,
    client?.location,
    client?.client_location,
    client?.street_address,
    client?.full_address,
  );

const getClientIdentifier = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.client_id,
    client?.id,
    getClientDisplayName(client),
    getClientEmail(client),
  );

const buildCreatedClientDraft = ({
  name,
  email,
  phoneNumber,
  address,
  clientId,
}: {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  clientId?: string | number | null;
}): ClientDropdownItem => ({
  ...(clientId !== null && clientId !== undefined ? { client_id: clientId } : {}),
  client_type: "guest",
  name,
  email,
  phone_number: phoneNumber,
  address,
});

const findMatchingClient = (
  clients: ClientDropdownItem[],
  {
    name,
    email,
    phoneNumber,
  }: {
    name: string;
    email: string;
    phoneNumber: string;
  },
) => {
  const normalizedName = name.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phoneNumber.trim();

  return (
    clients.find((client) => {
      const clientName = getClientDisplayName(client).trim().toLowerCase();
      const clientEmail = getClientEmail(client).trim().toLowerCase();
      const clientPhone = getClientPhone(client).trim();

      return (
        clientName === normalizedName &&
        clientEmail === normalizedEmail &&
        clientPhone === normalizedPhone
      );
    }) || null
  );
};

const resolveShootTypeApiId = (item: ShootTypeApiItem) => {
  const preferredId =
    item.sales_shoot_type_id ??
    item.shoot_type_id ??
    item.shootTypeId ??
    item.project_type_id ??
    item.projectTypeId ??
    item.quote_shoot_type_id ??
    item.id;

  const preferredNumericId = Number(preferredId);
  if (Number.isInteger(preferredNumericId) && preferredNumericId > 0) {
    return String(preferredNumericId);
  }

  for (const [key, value] of Object.entries(item)) {
    if (!/(^id$|shoot.*id|type.*id)/i.test(key)) continue;

    const numericValue = Number(value);
    if (Number.isInteger(numericValue) && numericValue > 0) {
      return String(numericValue);
    }
  }

  return null;
};

const resolveShootTypeId = (item: ShootTypeApiItem, idx: number) => {
  return resolveShootTypeApiId(item) ?? `st-${idx}`;
};

const buildEditingTypeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "custom_editing_type";

const resolveShootTypeLabel = (item: ShootTypeApiItem) =>
  item.name?.trim() ||
  item.label?.trim() ||
  item.editing_type_label?.trim() ||
  item.editingTypeLabel?.trim() ||
  "";

const resolveEditingTypeKey = (item: ShootTypeApiItem, label: string) =>
  item.editing_type_key?.trim() ||
  item.editingTypeKey?.trim() ||
  item.key?.trim() ||
  item.slug?.trim() ||
  buildEditingTypeKey(label);

const isCustomEditingTypeOption = (item: ShootTypeApiItem) =>
  item.is_custom_editing_type === true ||
  item.isCustomEditingType === true ||
  Number(item.is_custom_editing_type ?? item.isCustomEditingType ?? 0) === 1;

const isValidShootTypeId = (id: string | number) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0;
};

const isSystemDefaultShootType = (item: ShootTypeApiItem) =>
  Number(item.is_system_default ?? item.isSystemDefault ?? 0) === 1;

const canDeleteShootTypeItem = (item: {
  id?: string | number | null;
  apiId?: string | number | null;
  isSystemDefault?: boolean;
}) => !item.isSystemDefault && isValidShootTypeId(item.apiId ?? item.id ?? "");

const isVideoServiceLabel = (label: string) =>
  normalizeServiceLabel(label) === "videography";
const isPhotoServiceLabel = (label: string) =>
  normalizeServiceLabel(label) === "photography";
const isEditingServiceLabel = (label: string) => {
  const normalizedLabel = normalizeServiceLabel(label);
  return /\bedit(?:ing)?\b/.test(normalizedLabel);
};

const getServiceIcon = (label: string) => {
  const normalizedLabel = normalizeServiceLabel(label);

  if (isVideoServiceLabel(normalizedLabel)) return <Video size={20} />;
  if (isPhotoServiceLabel(normalizedLabel)) return <Camera size={20} />;
  if (isEditingServiceLabel(normalizedLabel)) return <Scissors size={20} />;
  if (normalizedLabel.includes("livestream")) return <Radio size={20} />;
  if (normalizedLabel === "studio" || normalizedLabel === "location") {
    return <MapPin size={20} />;
  }

  return <Plus size={20} />;
};

const getPositiveCatalogItemId = (value: string | number | null | undefined) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

const resolveSelectedServiceContentTypeId = ({
  kind,
  selectedIds,
  availableServices,
}: {
  kind: ShootTypeKind | "editing";
  selectedIds: string[];
  availableServices: Array<{
    id: string;
    label: string;
    catalogItemId?: string | number | null;
    catalog_item_id?: string | number | null;
  }>;
}) => {
  const selectedService =
    kind === "editing"
      ? availableServices.find(
        (service) =>
          selectedIds.includes(service.id) && isEditingServiceLabel(service.label),
      ) ||
      availableServices.find(
        (service) =>
          selectedIds.includes(service.id) && isVideoServiceLabel(service.label),
      ) ||
      availableServices.find(
        (service) =>
          selectedIds.includes(service.id) && isPhotoServiceLabel(service.label),
      )
      : availableServices.find(
        (service) =>
          selectedIds.includes(service.id) &&
          (kind === "video"
            ? isVideoServiceLabel(service.label)
            : isPhotoServiceLabel(service.label)),
      );

  return getPositiveCatalogItemId(
    selectedService?.catalogItemId ??
    selectedService?.catalog_item_id ??
    selectedService?.id,
  );
};

const resolveServiceShootTypeKind = (label: string): ShootTypeKind | null => {
  if (isVideoServiceLabel(label)) return "video";
  if (isPhotoServiceLabel(label)) return "photo";
  return null;
};

const mapShootTypeOptions = (items: ShootTypeApiItem[]): ShootTypeOption[] => {
  const mappedShootTypes = items.map((item, idx) => {
    const apiId = resolveShootTypeApiId(item);
    const label = resolveShootTypeLabel(item);

    return {
      id: apiId ?? resolveShootTypeId(item, idx),
      apiId,
      label,
      key: resolveEditingTypeKey(item, label),
      isCustom: isCustomEditingTypeOption(item),
      createdAt: item.created_at || null,
      isSystemDefault: isSystemDefaultShootType(item),
      originalIndex: idx,
    };
  });

  return [...mappedShootTypes].sort((a, b) => {
    const aCreatedAt = a.createdAt
      ? new Date(a.createdAt).getTime()
      : Number.NaN;
    const bCreatedAt = b.createdAt
      ? new Date(b.createdAt).getTime()
      : Number.NaN;

    if (
      Number.isFinite(aCreatedAt) &&
      Number.isFinite(bCreatedAt) &&
      aCreatedAt !== bCreatedAt
    ) {
      return aCreatedAt - bCreatedAt;
    }

    const aNumericId = Number(a.id);
    const bNumericId = Number(b.id);

    if (
      Number.isFinite(aNumericId) &&
      Number.isFinite(bNumericId) &&
      aNumericId !== bNumericId
    ) {
      return aNumericId - bNumericId;
    }

    return a.originalIndex - b.originalIndex;
  });
};

const normalizeShootTypeLabelKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const findMatchingShootTypeLabel = (
  shootTypeOptions: Array<{ label: string }>,
  label: string,
) => {
  const normalizedLabel = normalizeShootTypeLabelKey(label);
  if (!normalizedLabel) {
    return null;
  }

  return (
    shootTypeOptions
      .find(
        (shootType) =>
          normalizeShootTypeLabelKey(shootType.label) === normalizedLabel,
      )
      ?.label?.trim() || null
  );
};

const getSelectedShootTypeLabel = (
  shootTypeOptions: ShootTypeOption[],
  selectedId: string,
) =>
  shootTypeOptions.find((type) => type.id === selectedId)?.label?.trim() || "";

const getSelectedShootTypeLabels = (
  shootTypeOptions: ShootTypeOption[],
  selectedIds: string[],
) =>
  selectedIds
    .map((selectedId) => getSelectedShootTypeLabel(shootTypeOptions, selectedId))
    .filter(Boolean);

const mergeShootTypeOptions = (
  currentOptions: ShootTypeOption[],
  nextOption: ShootTypeOption,
) => {
  const mergedOptions = [
    ...currentOptions.filter((option) => option.id !== nextOption.id),
    nextOption,
  ];

  return [...mergedOptions].sort((a, b) => {
    const aCreatedAt = a.createdAt
      ? new Date(a.createdAt).getTime()
      : Number.NaN;
    const bCreatedAt = b.createdAt
      ? new Date(b.createdAt).getTime()
      : Number.NaN;

    if (
      Number.isFinite(aCreatedAt) &&
      Number.isFinite(bCreatedAt) &&
      aCreatedAt !== bCreatedAt
    ) {
      return aCreatedAt - bCreatedAt;
    }

    const aNumericId = Number(a.id);
    const bNumericId = Number(b.id);

    if (
      Number.isFinite(aNumericId) &&
      Number.isFinite(bNumericId) &&
      aNumericId !== bNumericId
    ) {
      return aNumericId - bNumericId;
    }

    return a.originalIndex - b.originalIndex;
  });
};

const appendShootTypeOption = (
  currentOptions: ShootTypeOption[],
  nextOption: ShootTypeOption,
) => [
    ...currentOptions.filter((option) => option.id !== nextOption.id),
    nextOption,
  ];

const getQuoteHydrationKey = (
  quoteId: string,
  quote: SalesQuoteDetailData | null,
) => `${quoteId}:${quote?.updated_at ?? quote?.created_at ?? "base"}`;

const mapAiEditingTypeOptions = (
  data: unknown,
  {
    includeVideoTypes,
    includePhotoTypes,
  }: {
    includeVideoTypes: boolean;
    includePhotoTypes: boolean;
  },
): ShootTypeOption[] => {
  if (Array.isArray(data)) {
    return mapShootTypeOptions(data as ShootTypeApiItem[]);
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as AiEditingTypesApiResponse;
  const rawOptions: ShootTypeOption[] = [];

  const appendOptions = (
    items: AiEditingTypeApiItem[] | null | undefined,
    prefix: "video" | "photo",
  ) => {
    (items || []).forEach((item, index) => {
      const label = item.value?.trim() || item.label?.trim() || "";
      if (!label) {
        return;
      }

      const apiIdSource =
        item.ai_editing_type_id ?? item.editing_type_id ?? item.id;
      const numericApiId = Number(apiIdSource);
      const apiId =
        Number.isInteger(numericApiId) && numericApiId > 0
          ? String(numericApiId)
          : null;
      const isCustom =
        item.is_custom === true ||
        item.isCustom === true ||
        item.is_custom_editing_type === true ||
        item.isCustomEditingType === true ||
        Number(
          item.is_custom ??
          item.isCustom ??
          item.is_custom_editing_type ??
          item.isCustomEditingType ??
          0,
        ) === 1;
      const isSystemDefault =
        Number(item.is_system_default ?? item.isSystemDefault ?? 0) === 1 ||
        (!apiId && !isCustom);
      const resolvedIsCustom =
        isCustom || (Boolean(apiId) && !isSystemDefault);
      const optionKey = item.key?.trim() || buildEditingTypeKey(label);
      rawOptions.push({
        id: apiId ?? `${prefix}_${optionKey}_${index}`,
        apiId,
        label,
        key: optionKey,
        category: prefix,
        isCustom: resolvedIsCustom,
        createdAt: item.created_at || null,
        isSystemDefault,
        originalIndex: rawOptions.length,
      });
    });
  };

  if (includeVideoTypes) {
    appendOptions(response.video_edit_types, "video");
  }

  if (includePhotoTypes) {
    appendOptions(response.photo_edit_types, "photo");
  }

  return [...rawOptions].sort((a, b) => {
    if (a.isCustom !== b.isCustom) {
      return a.isCustom ? 1 : -1;
    }

    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : Number.NaN;
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : Number.NaN;

    if (Number.isFinite(aCreatedAt) && Number.isFinite(bCreatedAt) && aCreatedAt !== bCreatedAt) {
      return aCreatedAt - bCreatedAt;
    }

    const aNumericId = Number(a.apiId ?? a.id);
    const bNumericId = Number(b.apiId ?? b.id);

    if (Number.isFinite(aNumericId) && Number.isFinite(bNumericId) && aNumericId !== bNumericId) {
      return aNumericId - bNumericId;
    }

    return a.originalIndex - b.originalIndex;
  });
};

const parseStoredShootTypeLabels = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { video: "", photo: "", editing: "" };
  }

  const parts = normalizedValue
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  let video = "";
  let photo = "";
  let editing = "";

  parts.forEach((part) => {
    const [rawPrefix, ...restParts] = part.split(":");
    const prefix = rawPrefix.trim().toLowerCase();
    const label = restParts.join(":").trim();

    if (!label) {
      return;
    }

    if (prefix === "video") {
      video = label;
    } else if (prefix === "photo") {
      photo = label;
    } else if (prefix === "editing") {
      editing = label;
    }
  });

  if (video || photo || editing) {
    return { video, photo, editing };
  }

  return {
    video: normalizedValue,
    photo: normalizedValue,
    editing: normalizedValue,
  };
};

const buildStoredShootTypeLabel = ({
  hasVideoService,
  hasPhotoService,
  hasEditingService,
  videoShootTypeLabel,
  photoShootTypeLabel,
  editingShootTypeLabel,
}: {
  hasVideoService: boolean;
  hasPhotoService: boolean;
  hasEditingService: boolean;
  videoShootTypeLabel: string;
  photoShootTypeLabel: string;
  editingShootTypeLabel: string;
}) => {
  const entries = [
    hasVideoService
      ? { prefix: "Video", label: videoShootTypeLabel.trim() }
      : null,
    hasPhotoService
      ? { prefix: "Photo", label: photoShootTypeLabel.trim() }
      : null,
    hasEditingService
      ? { prefix: "Editing", label: editingShootTypeLabel.trim() }
      : null,
  ].filter(
    (entry): entry is { prefix: string; label: string } =>
      Boolean(entry?.label),
  );

  if (entries.length === 0) {
    return "";
  }

  const normalizedLabels = new Set(
    entries.map((entry) => normalizeShootTypeLabelKey(entry.label)),
  );

  if (normalizedLabels.size === 1 || entries.length === 1) {
    return entries[0].label;
  }

  return entries.map((entry) => `${entry.prefix}: ${entry.label}`).join(" | ");
};

const isProtectedServiceLabel = (label: string) =>
  PROTECTED_SERVICE_ORDER.includes(
    normalizeServiceLabel(label) as (typeof PROTECTED_SERVICE_ORDER)[number],
  );

const isProtectedAddonLabel = (label: string) =>
  PROTECTED_ADDON_LABELS.includes(
    normalizeAddonLabel(label) as (typeof PROTECTED_ADDON_LABELS)[number],
  );

const isProtectedLineItemLabel = (label: string) =>
  PROTECTED_LINE_ITEM_LABELS.includes(
    normalizeLineItemLabel(
      label,
    ) as (typeof PROTECTED_LINE_ITEM_LABELS)[number],
  );

export default function CreateQuotePage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const editQuoteId = searchParams.get("quoteId");
  const isEditMode = Boolean(editQuoteId);
  const editModeParam = searchParams.get("editMode");
  const isFullEditFlow = isEditMode && editModeParam === "full";
  const isDuplicateFlow = ["1", "true"].includes(
    String(searchParams.get("duplicate") || "").trim().toLowerCase(),
  );
  const returnToParam = searchParams.get("returnTo");
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const effectiveQuoteId = editQuoteId || createdQuoteId;
  const requestedEditView = normalizeQuoteEditorView(
    searchParams.get("view"),
    isEditMode ? "details" : "selection",
  );
  const quoteEditReturnHref =
    !isDuplicateFlow && returnToParam && returnToParam.startsWith("/")
      ? returnToParam
      : null;

  // Using a Record so it works for multiple rows/items in a list
  const [inputValue, setInputValue] = useState<Record<string, string>>({});

  // Views: 'selection' | 'details' | 'services' | 'addons' | 'logistics'
  const [view, setView] = useState<
    | "selection"
    | "details"
    | "services"
    | "addons"
    | "logistics"
    | "customlineitems"
    | "discounts"
    | "tax"
  >(requestedEditView);

  const [selectedClient, setSelectedClient] =
    useState<ClientDropdownItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailsClientDropdownOpen, setIsDetailsClientDropdownOpen] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientDropdownItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isCreateNewClientFlow, setIsCreateNewClientFlow] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [validityDays, setValidityDays] = useState<number | "custom">(7);
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );

  // Step 2: Services & Config State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVideoShootType, setSelectedVideoShootType] =
    useState<string>("");
  const [selectedPhotoShootType, setSelectedPhotoShootType] =
    useState<string>("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceCost, setCustomServiceCost] = useState("");
  const [customShootType, setCustomShootType] = useState("");
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [activeShootTypeForm, setActiveShootTypeForm] =
    useState<ShootTypeKind | null>(null);
  const [selectedEditingTypes, setSelectedEditingTypes] = useState<string[]>([]);
  const [showAddEditingTypeForm, setShowAddEditingTypeForm] = useState(false);
  const [customEditingType, setCustomEditingType] = useState("");
  const [isVideoShootTypeExpanded, setIsVideoShootTypeExpanded] =
    useState(true);
  const [isPhotoShootTypeExpanded, setIsPhotoShootTypeExpanded] =
    useState(true);
  const [isEditingTypeExpanded, setIsEditingTypeExpanded] = useState(true);

  // Step 3: Add-ons State
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonConfigs, setAddonConfigs] = useState<
    Record<string, { quantity: number; price: number }>
  >({});
  const [appliedAddonConfigs, setAppliedAddonConfigs] = useState<
    Record<string, { quantity: number; price: number }>
  >({});
  const [showAddAddonForm, setShowAddAddonForm] = useState(false);
  const [customAddonName, setCustomAddonName] = useState("");
  const [customAddonCost, setCustomAddonCost] = useState("");

  // Step 4: Logistics State
  const [selectedLogistics, setSelectedLogistics] = useState<string[]>([]);
  const [logisticsItems, setLogisticsItems] = useState<LogisticsItem[]>([]);
  const [logisticsConfigs, setLogisticsConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [appliedLogisticsConfigs, setAppliedLogisticsConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [customLogisticsName, setCustomLogisticsName] = useState("");
  const [customLogisticsCost, setCustomLogisticsCost] = useState("");
  const [showAddLogisticsForm, setShowAddLogisticsForm] = useState(false);


  //Step 5: Custom Line Items State
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCost, setCustomItemCost] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineItemConfigs, setLineItemConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [appliedLineItemConfigs, setAppliedLineItemConfigs] = useState<
    Record<string, { price: number }>
  >({});

  // Step 6: Discount
  type DiscountType = "percentage" | "fixed";
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number | string>(0);

  // Step 7: Discount
  // const [selectedTax, setSelectedTax] = useState<0 | 5 | 8.5 | 10>(0);
  const [selectedTax, setSelectedTax] = useState<number>(0);
  const [showCustomTax, setShowCustomTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number | string>(0);
  const [taxType, setTaxType] = useState("");

  // Configuration for each selected service
  const [serviceConfigs, setServiceConfigs] = useState<
    Record<
      string,
      {
        quantity: number;
        duration: number;
        crewSize: number;
        estimatedPrice: number;
      }
    >
  >({});
  const [editingTypeConfigs, setEditingTypeConfigs] = useState<
    Record<string, { quantity: number; estimatedPrice: number }>
  >({});

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [videoShootTypes, setVideoShootTypes] = useState<ShootTypeOption[]>([]);
  const [photoShootTypes, setPhotoShootTypes] = useState<ShootTypeOption[]>([]);
  const [editingTypeOptions, setEditingTypeOptions] = useState<
    ShootTypeOption[]
  >([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingShootTypes, setLoadingShootTypes] = useState(false);
  const [loadingEditingTypes, setLoadingEditingTypes] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type:
    | "service"
    | "addon"
    | "logistics"
    | "line_item"
    | "shoot_type"
    | "editing_type";
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<SalesQuoteDetailData | null>(
    null,
  );
  const [previewQuoteId, setPreviewQuoteId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isQuoteSaved, setIsQuoteSaved] = useState(false);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertIntent, setConvertIntent] = useState<"convert_only" | "send_invoice" | "view_invoice">("convert_only");
  const [convertModalInitialDataOverride, setConvertModalInitialDataOverride] =
    useState<ConvertBookingModalInitialData | null>(null);
  const [convertedBookingIdOverride, setConvertedBookingIdOverride] =
    useState<string | null>(null);
  const [isConvertedOverride, setIsConvertedOverride] = useState(false);
  const [quoteSummarySnapshot, setQuoteSummarySnapshot] =
    useState<QuoteSummarySnapshot | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] =
    React.useState<SalesQuoteDetailData | null>(null);
  const [isReviewChangesModalOpen, setIsReviewChangesModalOpen] =
    React.useState(false);
  const [reviewChangeReason, setReviewChangeReason] = React.useState("");
  const [isVersionSaveSuccessOpen, setIsVersionSaveSuccessOpen] =
    React.useState(false);
  const [isLoadingQuoteToEdit, setIsLoadingQuoteToEdit] = React.useState(false);
  const [isHydratingQuoteToEdit, setIsHydratingQuoteToEdit] =
    React.useState(false);
  const [isCatalogLoaded, setIsCatalogLoaded] = React.useState(false);
  const hydratedQuoteIdRef = React.useRef<string | null>(null);
  const hydratingQuoteIdRef = React.useRef<string | null>(null);
  const servicesRef = React.useRef(services);
  const addonsRef = React.useRef(addons);
  const selectedLogisticsRef = React.useRef(selectedLogistics);
  const logisticsItemsRef = React.useRef(logisticsItems);
  const lineItemsRef = React.useRef(lineItems);
  const editingTypeOptionsRef = React.useRef(editingTypeOptions);
  const quoteLeadId = React.useMemo(() => {
    const leadIdValue = quoteToEdit?.["lead_id"] ?? previewQuote?.["lead_id"];
    const normalizedLeadId = Number(leadIdValue);
    return Number.isInteger(normalizedLeadId) && normalizedLeadId > 0
      ? normalizedLeadId
      : null;
  }, [previewQuote, quoteToEdit]);
  const { data: linkedLeadDetails } = useGetLeadByIdQuery(quoteLeadId ?? 0, {
    skip: !quoteLeadId,
  });
  const convertModalInitialData = React.useMemo(
    () =>
      convertModalInitialDataOverride ||
      buildConvertModalInitialData(linkedLeadDetails?.booking),
    [convertModalInitialDataOverride, linkedLeadDetails],
  );

  const fetchClients = async (query?: string) => {
    setLoadingClients(true);
    try {
      const res = await salesApi.getClientDropdown(query);
      if (!res.error && Array.isArray(res.data)) {
        setClients(res.data as ClientDropdownItem[]);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const applyClientSelection = React.useCallback(
    (client: ClientDropdownItem | null) => {
      setSelectedClient(client);

      if (!client) {
        setClientName("");
        setEmailId("");
        setPhoneNumber("");
        setAddress("");
        return;
      }

      setClientName(getClientDisplayName(client));
      setEmailId(getClientEmail(client));
      setPhoneNumber(getClientPhone(client));
      setAddress(getClientAddress(client));
    },
    [],
  );

  const startCreateNewClientFlow = React.useCallback(
    (advanceToDetails: boolean) => {
      setIsCreateNewClientFlow(true);
      applyClientSelection(null);
      setIsDropdownOpen(false);
      setIsDetailsClientDropdownOpen(false);
      setSearchQuery("");

      if (advanceToDetails) {
        setView("details");
      }
    },
    [applyClientSelection],
  );

  React.useEffect(() => {
    if (!selectedClient) {
      return;
    }

    setClientName(getClientDisplayName(selectedClient));
    setEmailId(getClientEmail(selectedClient));
    setPhoneNumber(getClientPhone(selectedClient));
    setAddress(getClientAddress(selectedClient));
  }, [selectedClient]);

  React.useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search for clients
  React.useEffect(() => {
    if (view !== "selection" && !isDetailsClientDropdownOpen) return;
    const timer = setTimeout(() => {
      fetchClients(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [isDetailsClientDropdownOpen, searchQuery, view]);

  React.useEffect(() => {
    fetchCatalog();
  }, []);

  React.useEffect(() => {
    setConvertModalInitialDataOverride(null);
  }, [effectiveQuoteId]);

  React.useEffect(() => {
    servicesRef.current = services;
    addonsRef.current = addons;
    selectedLogisticsRef.current = selectedLogistics;
    logisticsItemsRef.current = logisticsItems;
    lineItemsRef.current = lineItems;
    editingTypeOptionsRef.current = editingTypeOptions;
  }, [addons, editingTypeOptions, lineItems, logisticsItems, selectedLogistics, services]);

  const fetchShootTypes = React.useCallback(
    async (
      ids: string[],
      availableServices: Array<{
        id: string;
        label: string;
        catalogItemId?: string | number | null;
        catalog_item_id?: string | number | null;
      }> = services,
    ) => {
      const hasVideo =
        ids.some((id) =>
          isVideoServiceLabel(
            availableServices.find((service) => service.id === id)?.label || "",
          ),
        ) || ids.includes("videography");
      const hasPhoto =
        ids.some((id) =>
          isPhotoServiceLabel(
            availableServices.find((service) => service.id === id)?.label || "",
          ),
        ) || ids.includes("photography");

      if (!hasVideo) {
        setVideoShootTypes([]);
      }

      if (!hasPhoto) {
        setPhotoShootTypes([]);
      }

      if (!hasVideo && !hasPhoto) {
        return {
          video: [] as ShootTypeOption[],
          photo: [] as ShootTypeOption[],
        };
      }

      const videoContentTypeId = hasVideo
        ? resolveSelectedServiceContentTypeId({
          kind: "video",
          selectedIds: ids,
          availableServices,
        })
        : null;
      const photoContentTypeId = hasPhoto
        ? resolveSelectedServiceContentTypeId({
          kind: "photo",
          selectedIds: ids,
          availableServices,
        })
        : null;

      setLoadingShootTypes(true);
      try {
        const [videoResponse, photoResponse] = await Promise.all([
          videoContentTypeId
            ? salesApi.getShootTypes(videoContentTypeId)
            : Promise.resolve(null),
          photoContentTypeId
            ? salesApi.getShootTypes(photoContentTypeId)
            : Promise.resolve(null),
        ]);

        const nextVideoShootTypes =
          hasVideo &&
            videoResponse &&
            !videoResponse.error &&
            Array.isArray(videoResponse.data)
            ? mapShootTypeOptions(videoResponse.data as ShootTypeApiItem[])
            : [];
        const nextPhotoShootTypes =
          hasPhoto &&
            photoResponse &&
            !photoResponse.error &&
            Array.isArray(photoResponse.data)
            ? mapShootTypeOptions(photoResponse.data as ShootTypeApiItem[])
            : [];

        setVideoShootTypes(nextVideoShootTypes);
        setPhotoShootTypes(nextPhotoShootTypes);
        setSelectedVideoShootType((currentValue) => {
          if (nextVideoShootTypes.length === 0) {
            return "";
          }

          return nextVideoShootTypes.some((type) => type.id === currentValue)
            ? currentValue
            : nextVideoShootTypes[0].id;
        });
        setSelectedPhotoShootType((currentValue) => {
          if (nextPhotoShootTypes.length === 0) {
            return "";
          }

          return nextPhotoShootTypes.some((type) => type.id === currentValue)
            ? currentValue
            : nextPhotoShootTypes[0].id;
        });

        return {
          video: nextVideoShootTypes,
          photo: nextPhotoShootTypes,
        };
      } catch (error) {
        console.error("Failed to fetch shoot types", error);
      } finally {
        setLoadingShootTypes(false);
      }

      return { video: [], photo: [] };
    },
    [services],
  );

  const fetchEditingTypes = React.useCallback(
    async (
      ids: string[],
      availableServices: Array<{
        id: string;
        label: string;
        catalogItemId?: string | number | null;
        catalog_item_id?: string | number | null;
      }> = services,
    ) => {
      const hasEditingService = ids.some((id) =>
        isEditingServiceLabel(
          availableServices.find((service) => service.id === id)?.label || "",
        ),
      );

      if (!hasEditingService) {
        setEditingTypeOptions([]);
        setSelectedEditingTypes([]);
        return [] as ShootTypeOption[];
      }

      setLoadingEditingTypes(true);
      try {
        const response = await salesApi.getAiEditingTypes();
        const nextEditingTypes =
          response && !response.error
            ? mapAiEditingTypeOptions(response.data, {
              includeVideoTypes: true,
              includePhotoTypes: true,
            })
            : [];
        const mergedEditingTypes = editingTypeOptionsRef.current
          .filter((type) => type.isCustom)
          .reduce(
            (mergedOptions, customType) =>
              appendShootTypeOption(mergedOptions, customType),
            nextEditingTypes,
          );

        setEditingTypeOptions(mergedEditingTypes);
        setSelectedEditingTypes((currentValue) => {
          if (mergedEditingTypes.length === 0) {
            return [];
          }

          const validSelections = currentValue.filter((id) =>
            mergedEditingTypes.some((type) => type.id === id),
          );

          if (validSelections.length > 0) {
            return validSelections;
          }

          return [mergedEditingTypes[0].id];
        });

        return mergedEditingTypes;
      } catch (error) {
        console.error("Failed to fetch editing types", error);
      } finally {
        setLoadingEditingTypes(false);
      }

      return [] as ShootTypeOption[];
    },
    [services],
  );

  React.useEffect(() => {
    if (!editQuoteId) {
      setQuoteToEdit(null);
      setIsLoadingQuoteToEdit(false);
      hydratedQuoteIdRef.current = null;
      hydratingQuoteIdRef.current = null;
      return;
    }

    let isMounted = true;
    const cachedQuoteToEdit = readQuoteEditorNavigationCache(editQuoteId);
    hydratedQuoteIdRef.current = null;
    hydratingQuoteIdRef.current = null;
    setQuoteToEdit(cachedQuoteToEdit);
    setIsLoadingQuoteToEdit(!cachedQuoteToEdit);

    const fetchQuoteToEdit = async () => {
      try {
        const response = await salesApi.getQuoteDetail(editQuoteId);

        if (response?.error || response?.success === false) {
          throw new Error(
            typeof response?.error === "string"
              ? response.error
              : "Failed to fetch quote details",
          );
        }

        const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
        if (!quoteDetail) {
          throw new Error("Quote details are unavailable");
        }

        if (!isMounted) {
          return;
        }

        setQuoteToEdit(quoteDetail);
      } catch (error) {
        console.error("Failed to load quote for edit", error);

        if (!isMounted) {
          return;
        }

        setQuoteToEdit(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load quote details",
        );
      } finally {
        if (isMounted) {
          setIsLoadingQuoteToEdit(false);
        }
      }
    };

    void fetchQuoteToEdit();

    return () => {
      isMounted = false;
    };
  }, [editQuoteId, router]);

  React.useEffect(() => {
    if (!editQuoteId || !quoteToEdit || !isCatalogLoaded) {
      return;
    }

    const hydrationKey = getQuoteHydrationKey(editQuoteId, quoteToEdit);

    if (
      hydratedQuoteIdRef.current === hydrationKey ||
      hydratingQuoteIdRef.current === hydrationKey
    ) {
      return;
    }

    let isMounted = true;
    hydratingQuoteIdRef.current = hydrationKey;
    setIsHydratingQuoteToEdit(true);

    const hydrateQuoteEditor = async () => {
      try {
        const hydratedState = buildQuoteEditorHydrationState({
          quote: quoteToEdit,
          services: servicesRef.current,
          addons: addonsRef.current,
          logisticsItems: logisticsItemsRef.current,
          lineItems: lineItemsRef.current,
        });

        if (!isMounted) {
          return;
        }

        setSelectedClient(hydratedState.selectedClient);
        setClientName(hydratedState.clientName);
        setEmailId(hydratedState.emailId);
        setPhoneNumber(hydratedState.phoneNumber);
        setAddress(hydratedState.address);
        setProjectDescription(hydratedState.projectDescription);
        setValidityDays(hydratedState.validityDays);
        setValidUntil(hydratedState.validUntil);
        setDiscountEnabled(hydratedState.discountEnabled);
        setDiscountType(hydratedState.discountType);
        setDiscountValue(hydratedState.discountValue);
        const hydratedTaxRate = Number(hydratedState.taxRate) || 0;
        const isPresetTaxRate =
          hydratedTaxRate === 0 ||
          hydratedTaxRate === 5 ||
          hydratedTaxRate === 8.5 ||
          hydratedTaxRate === 10;
        setTaxRate(hydratedTaxRate);
        setSelectedTax(isPresetTaxRate ? hydratedTaxRate : -1);
        setShowCustomTax(!isPresetTaxRate);
        setTaxType(hydratedState.taxType);
        setServices(hydratedState.services);
        setSelectedServices(hydratedState.selectedServices);
        setServiceConfigs(hydratedState.serviceConfigs);
        setAddons(hydratedState.addons);
        setSelectedAddons(hydratedState.selectedAddons);
        setAddonConfigs(hydratedState.addonConfigs);
        setAppliedAddonConfigs(hydratedState.appliedAddonConfigs);
        setLogisticsItems((prev) =>
          mergeCatalogItemsById(prev, hydratedState.logisticsItems),
        );
        setSelectedLogistics(hydratedState.logisticsItems.map((item) => item.id));
        setLogisticsConfigs(hydratedState.logisticsConfigs);
        setAppliedLogisticsConfigs(hydratedState.appliedLogisticsConfigs);
        setLineItems(hydratedState.lineItems);
        setLineItemConfigs(hydratedState.lineItemConfigs);
        setAppliedLineItemConfigs(hydratedState.appliedLineItemConfigs);
        setIsDropdownOpen(false);
        setSearchQuery("");

        const availableShootTypes =
          hydratedState.selectedServices.length > 0
            ? await fetchShootTypes(
              hydratedState.selectedServices,
              hydratedState.services,
            )
            : { video: [], photo: [] };
        let availableEditingTypes: ShootTypeOption[] = [];
        if (hydratedState.selectedServices.length > 0) {
          availableEditingTypes = await fetchEditingTypes(
            hydratedState.selectedServices,
            hydratedState.services,
          );
        }

        if (!isMounted) {
          return;
        }

        const hydratedHasVideoService =
          hydratedState.selectedServices.some((id) =>
            isVideoServiceLabel(
              hydratedState.services.find((service) => service.id === id)
                ?.label || "",
            ),
          ) || hydratedState.selectedServices.includes("videography");
        const hydratedHasPhotoService =
          hydratedState.selectedServices.some((id) =>
            isPhotoServiceLabel(
              hydratedState.services.find((service) => service.id === id)
                ?.label || "",
            ),
          ) || hydratedState.selectedServices.includes("photography");
        const hydratedHasEditingService =
          hydratedState.selectedServices.some((id) =>
            isEditingServiceLabel(
              hydratedState.services.find((service) => service.id === id)
                ?.label || "",
            ),
          ) || hydratedState.selectedServices.includes("ai_editing");
        const hydratedHasEditingTypeContext =
          hydratedHasVideoService ||
          hydratedHasPhotoService ||
          hydratedHasEditingService;
        const parsedShootTypeLabels = parseStoredShootTypeLabels(
          hydratedState.shootTypeLabel,
        );
        const assignHydratedShootType = (
          kind: ShootTypeKind,
          options: ShootTypeOption[],
          label: string,
        ) => {
          const normalizedLabel = label.trim();
          if (!normalizedLabel) {
            return;
          }

          const matchedShootType = options.find(
            (type) =>
              normalizeShootTypeLabelKey(type.label) ===
              normalizeShootTypeLabelKey(normalizedLabel),
          );

          if (matchedShootType) {
            if (kind === "video") {
              setSelectedVideoShootType(matchedShootType.id);
            } else {
              setSelectedPhotoShootType(matchedShootType.id);
            }
            return;
          }

          const fallbackShootTypeId = `edit_${kind}_shoot_type_${editQuoteId}`;
          const setShootTypeOptions =
            kind === "video" ? setVideoShootTypes : setPhotoShootTypes;
          const setSelectedShootType =
            kind === "video"
              ? setSelectedVideoShootType
              : setSelectedPhotoShootType;

          setShootTypeOptions((prev) => {
            if (findMatchingShootTypeLabel(prev, normalizedLabel)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: fallbackShootTypeId,
                apiId: null,
                label: normalizedLabel,
                key: buildEditingTypeKey(normalizedLabel),
                isCustom: false,
                createdAt: quoteToEdit.created_at || null,
                isSystemDefault: false,
                originalIndex: prev.length,
              },
            ];
          });
          setSelectedShootType(fallbackShootTypeId);
        };

        if (hydratedHasVideoService) {
          assignHydratedShootType(
            "video",
            availableShootTypes.video,
            parsedShootTypeLabels.video || hydratedState.shootTypeLabel,
          );
        }

        if (hydratedHasPhotoService) {
          assignHydratedShootType(
            "photo",
            availableShootTypes.photo,
            parsedShootTypeLabels.photo || hydratedState.shootTypeLabel,
          );
        }

        if (hydratedHasEditingTypeContext) {
          const editingLineItems = extractQuoteLineItems(quoteToEdit);
          const editingSelections = editingLineItems
            .map((lineItem) => {
              const config = getQuoteLineItemEditingTypeConfiguration(lineItem);
              const label =
                config?.editingTypeLabel ||
                getQuoteLineItemEditingTypeLabel(lineItem) ||
                "";
              return {
                label: label.trim(),
                key: config?.editingTypeKey?.trim().toLowerCase() || "",
                isCustom: config?.isCustomEditingType ?? true,
                quantity: Number(lineItem.quantity ?? 1),
                estimatedPrice: Number(
                  lineItem.estimated_pricing ??
                  lineItem.unit_rate ??
                  lineItem.unit_price ??
                  0
                ),
              };
            })
            .filter((selection) => selection.label);

          const fallbackEditingLabel =
            parsedShootTypeLabels.editing || hydratedState.shootTypeLabel;
          if (editingSelections.length === 0 && fallbackEditingLabel.trim()) {
            editingSelections.push({
              label: fallbackEditingLabel.trim(),
              key: "",
              isCustom: true,
            });
          }

          if (editingSelections.length > 0) {
            const selectedIds = new Set<string>();
            const nextOptions: ShootTypeOption[] = [];
            const nextEditingConfigs: Record<string, { quantity: number; estimatedPrice: number }> = {};
            const existingOptions = [
              ...availableEditingTypes,
              ...editingTypeOptionsRef.current,
            ];

            editingSelections.forEach((selection, index) => {
              const normalizedLabel = selection.label;
              const normalizedKey = selection.key;
              const matchedEditingType =
                existingOptions.find(
                  (type) =>
                    (normalizedKey &&
                      type.key.trim().toLowerCase() === normalizedKey) ||
                    normalizeShootTypeLabelKey(type.label) ===
                      normalizeShootTypeLabelKey(normalizedLabel),
                ) ||
                nextOptions.find(
                  (type) =>
                    (normalizedKey &&
                      type.key.trim().toLowerCase() === normalizedKey) ||
                    normalizeShootTypeLabelKey(type.label) ===
                      normalizeShootTypeLabelKey(normalizedLabel),
                );

              if (matchedEditingType) {
                selectedIds.add(matchedEditingType.id);
                nextEditingConfigs[matchedEditingType.id] = {
                  quantity: Math.max(1, Number(selection.quantity || 1)),
                  estimatedPrice: Math.max(0, Number(selection.estimatedPrice || 0)),
                };
                return;
              }

              const fallbackEditingTypeId = `edit_editing_shoot_type_${editQuoteId}_${index}`;
              if (!findMatchingShootTypeLabel(existingOptions, normalizedLabel)) {
                nextOptions.push({
                  id: fallbackEditingTypeId,
                  apiId: null,
                  label: normalizedLabel,
                  key: selection.key || buildEditingTypeKey(normalizedLabel),
                  isCustom: selection.isCustom,
                  createdAt: quoteToEdit.created_at || null,
                  isSystemDefault: false,
                  originalIndex: existingOptions.length + nextOptions.length,
                });
              }
              selectedIds.add(fallbackEditingTypeId);
              nextEditingConfigs[fallbackEditingTypeId] = {
                quantity: Math.max(1, Number(selection.quantity || 1)),
                estimatedPrice: Math.max(0, Number(selection.estimatedPrice || 0)),
              };
            });

            if (nextOptions.length) {
              setEditingTypeOptions((prev) => [...prev, ...nextOptions]);
            }
            setSelectedEditingTypes(Array.from(selectedIds));
            setEditingTypeConfigs(nextEditingConfigs);
          }
        }

        setView(requestedEditView);
        hydratedQuoteIdRef.current = hydrationKey;
      } catch (error) {
        console.error("Failed to hydrate quote editor", error);
        toast.error("Failed to preload quote details");
      } finally {
        if (hydratingQuoteIdRef.current === hydrationKey) {
          hydratingQuoteIdRef.current = null;
        }

        if (isMounted) {
          setIsHydratingQuoteToEdit(false);
        }
      }
    };

    void hydrateQuoteEditor();

    return () => {
      isMounted = false;
    };
  }, [
    editQuoteId,
    fetchEditingTypes,
    fetchShootTypes,
    isCatalogLoaded,
    quoteToEdit,
    requestedEditView,
  ]);

  React.useEffect(() => {
    if (
      !editQuoteId ||
      !hydratedQuoteIdRef.current?.startsWith(`${editQuoteId}:`)
    ) {
      return;
    }

    setView(requestedEditView);
  }, [editQuoteId, requestedEditView]);

  const handleConfigUpdate = (
    serviceId: string,
    field: string,
    value: number,
  ) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: Math.max(0, value),
      },
    }));
  };

  const getServiceDraftPrice = (serviceId: string) => {
    const config = serviceConfigs[serviceId];

    if (!config) return 0;
    return config.estimatedPrice;
  };

    const handleServicePriceUpdate = (serviceId, value) => {
    const config = serviceConfigs[serviceId];
    if (!config) return;

    const raw = parseRawPrice(value);
    const nextPrice = parseFloat(raw) || 0;
    handleConfigUpdate(serviceId, "estimatedPrice", nextPrice);
  };

  const handleAddonConfigUpdate = (
    addonId: string,
    field: string,
    value: number,
  ) => {
    const nextValue =
      field === "quantity" ? Math.max(1, value) : Math.max(0, value);

    setAddonConfigs((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        [field]: nextValue,
      },
    }));
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons((prev) => prev.filter((id) => id !== addonId));
    setAddonConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[addonId];
      return newConfigs;
    });
    setAppliedAddonConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[addonId];
      return newConfigs;
    });
  };

  const applyAddonChanges = (addonId: string, addonLabel: string) => {
    const config = addonConfigs[addonId];
    if (!config) return;

    setAppliedAddonConfigs((prev) => ({
      ...prev,
      [addonId]: { ...config },
    }));
    toast.success(`${addonLabel} changes applied!`);
  };

  const hasPendingAddonChanges = (addonId: string) => {
    const draftConfig = addonConfigs[addonId];
    const appliedConfig = appliedAddonConfigs[addonId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return (
      draftConfig.quantity !== appliedConfig.quantity ||
      draftConfig.price !== appliedConfig.price
    );
  };

  const getAddonDraftPrice = (addonId: string) => {
    const config = addonConfigs[addonId];

    if (!config) return 0;
    return config.price;
  };

  const handleAddonPriceUpdate = (addonId: string, value: string) => {
    const config = addonConfigs[addonId];
    if (!config) return;

    const nextPrice = parseCurrencyInput(value);
    handleAddonConfigUpdate(addonId, "price", nextPrice);
  };

  const removeSelectedLogistics = (itemId: string) => {
    setSelectedLogistics((prev) => prev.filter((id) => id !== itemId));
    setLogisticsConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
    setAppliedLogisticsConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
    setInputValue((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const toggleSelectedLogistics = (itemId: string) => {
    const isSelected = selectedLogistics.includes(itemId);

    if (isSelected) {
      removeSelectedLogistics(itemId);
      return;
    }

    const logisticsItem = logisticsItems.find((item) => item.id === itemId);
    if (!logisticsItem) return;

    const initialConfig = { price: logisticsItem.basePrice };
    setSelectedLogistics((prev) => [...prev, itemId]);
    setLogisticsConfigs((prev) => ({
      ...prev,
      [itemId]: prev[itemId] ?? initialConfig,
    }));
    setAppliedLogisticsConfigs((prev) => ({
      ...prev,
      [itemId]: prev[itemId] ?? initialConfig,
    }));
  };

  const removeLogisticsItem = (itemId: string) => {
    setLogisticsItems((prev) => prev.filter((item) => item.id !== itemId));
    removeSelectedLogistics(itemId);
  };

  const applyLogisticsChanges = (itemId: string, itemLabel: string) => {
    const config = logisticsConfigs[itemId];
    if (!config) return;

    setAppliedLogisticsConfigs((prev) => ({
      ...prev,
      [itemId]: { ...config },
    }));
    toast.success(`${itemLabel} changes applied!`);
  };

  const hasPendingLogisticsChanges = (itemId: string) => {
    const draftConfig = logisticsConfigs[itemId];
    const appliedConfig = appliedLogisticsConfigs[itemId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return draftConfig.price !== appliedConfig.price;
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));
    setLineItemConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
    setAppliedLineItemConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
  };

  const applyLineItemChanges = (itemId: string, itemLabel: string) => {
    const config = lineItemConfigs[itemId];
    if (!config) return;

    setAppliedLineItemConfigs((prev) => ({
      ...prev,
      [itemId]: { ...config },
    }));
    toast.success(`${itemLabel} changes applied!`);
  };

  const hasPendingLineItemChanges = (itemId: string) => {
    const draftConfig = lineItemConfigs[itemId];
    const appliedConfig = appliedLineItemConfigs[itemId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return draftConfig.price !== appliedConfig.price;
  };

  const handleServiceSelect = (serviceId: string, price: number) => {
    setSelectedServices((prev) => {
      const isSelected = prev.includes(serviceId);
      let newSelected;
      if (isSelected) {
        newSelected = prev.filter((id) => id !== serviceId);
        // Remove config if no services selected
        if (newSelected.length === 0) {
          setServiceConfigs({});
        }
      } else {
        newSelected = [...prev, serviceId];
        // Initialize config for the new service
        if (!serviceConfigs[serviceId]) {
          setServiceConfigs((prevConfigs) => ({
            ...prevConfigs,
            [serviceId]: {
              quantity: 1,
              duration: 4,
              crewSize: 1,
              estimatedPrice: price,
            },
          }));
        }
      }

      void fetchShootTypes(newSelected);
      void fetchEditingTypes(newSelected);

      return newSelected;
    });
  };

  const handleDiscountToggle = () => {
    const newState = !discountEnabled;
    setDiscountEnabled(newState);
  };

  const filteredClients = clients; // Now filtered by API
  const closeClientDropdowns = () => {
    setIsDropdownOpen(false);
    setIsDetailsClientDropdownOpen(false);
  };

  const renderClientDropdownContent = ({
    onClose,
    advanceToDetails,
  }: {
    onClose: () => void;
    advanceToDetails: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99, y: -5 }}
      transition={{ duration: 0.2 }}
      className={`absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl overflow-hidden z-50 shadow-[0_30px_60px_rgba(0,0,0,0.18)] ${isDark
        ? "bg-[#0F0F0F] border border-[#FFFFFF80]"
        : "bg-white border border-[#D7D7D7]"
        }`}
    >
      <div className={`p-3 ${isDark ? "border-b border-[#FFFFFF80]" : "border-b border-[#E5E5E5]"}`}>
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${isDark
            ? "bg-[#1A1A1F] border border-[#3B3B46]"
            : "bg-[#F4F5F7] border border-[#D7D7D7]"
            }`}
        >
          <Search size={16} className="text-[#6B6B6B] shrink-0" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent text-sm outline-none flex-1 placeholder:text-[#6B6B6B] ${isDark ? "text-white" : "text-black"
              }`}
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`text-[#6B6B6B] ${isDark ? "hover:text-white" : "hover:text-black"}`}
            >
              x
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto custom-scrollbar p-3">
        <button
          onClick={() => startCreateNewClientFlow(advanceToDetails)}
          className={`w-full flex items-center gap-4 px-5 py-4 text-[#E8D1AB] hover:bg-[#E8D1AB]/5 transition-all rounded-xl mb-2 ${isDark ? "border-b border-[#FFFFFF80]/50" : "border-b border-[#E5E5E5]"
            }`}
        >
          <div className="w-6 h-6 rounded border border-[#E8D1AB]/40 flex items-center justify-center bg-[#E8D1AB]">
            <Plus size={16} className="text-[#171717]" />
          </div>
          <span className="font-semibold text-lg">Create New Client</span>
        </button>

        {loadingClients ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8D1AB]"></div>
          </div>
        ) : (filteredClients || []).length === 0 ? (
          <div className="py-6 text-center text-[#6B6B6B] text-sm">
            No clients found
          </div>
        ) : (
          (filteredClients || []).map((client) => {
            const clientId = getClientIdentifier(client);
            const isSelectedClient =
              getClientIdentifier(selectedClient) === clientId;

            return (
              <div
                key={clientId}
                onClick={() => {
                  setIsCreateNewClientFlow(false);
                  applyClientSelection(client);
                  onClose();
                  setSearchQuery("");
                  if (advanceToDetails) {
                    setView("details");
                  }
                }}
                className={`group flex items-center gap-4 px-5 py-3 lg:py-4 rounded-xl cursor-pointer transition-all mb-1 ${isSelectedClient
                  ? "bg-[#FFFCE8] text-[#171717]"
                  : isDark
                    ? "hover:bg-[#FFFCE8] hover:text-[#171717] text-[#FFFFFF85]"
                    : "hover:bg-[#FFFCE8] hover:text-[#171717] text-black"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelectedClient
                    ? "border-[#E8D1AB] bg-[#E8D1AB]"
                    : isDark
                      ? "border-[#FFFFFF85] group-hover:border-[#171717]"
                      : "border-[#8A8A8A] group-hover:border-[#171717]"
                    }`}
                >
                  {isSelectedClient && (
                    <div className="w-2.5 h-2.5 bg-[#101010] rounded-sm" />
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-lg">
                    {getClientDisplayName(client)}
                  </span>
                  <ClientTypeBadge
                    clientType={client.client_type}
                    userId={client.user_id}
                    isDark={isDark}
                    isSelected={isSelectedClient}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );

  const renderShootTypeSection = ({
    kind,
    isExpanded,
    onToggleExpanded,
    shootTypeOptions,
    selectedId,
  }: {
    kind: ShootTypeKind;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    shootTypeOptions: ShootTypeOption[];
    selectedId: string;
  }) => {
    const isFormOpen = activeShootTypeForm === kind;
    const sectionLabel =
      kind === "video" ? "Video Shoot Type" : "Photo Shoot Type";
    const fieldLabel =
      activeShootTypeForm === "photo"
        ? "Photo Shoot Type Name"
        : "Video Shoot Type Name";

    return (
      <section className="px-4 py-5 lg:p-8">
        <button
          onClick={onToggleExpanded}
          className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
        >
          <h2 className="text-base lg:text-xl font-medium text-white">
            {sectionLabel}
          </h2>
          <div className="text-zinc-600 transition-transform duration-300">
            {isExpanded ? (
              <ChevronDown size={22} className="rotate-180" />
            ) : (
              <ChevronDown size={22} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {loadingShootTypes ? (
                  <div className="col-span-4 py-5 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8D1AB]"></div>
                  </div>
                ) : shootTypeOptions.length === 0 ? (
                  <div className="col-span-4 py-5 text-sm text-[#9A9AA4]">
                    No shoot types found.
                  </div>
                ) : (
                  shootTypeOptions.map((type) => {
                    const canDeleteShootType = canDeleteShootTypeItem(type);

                    return (
                      <div key={type.id} className="relative">
                        <button
                          onClick={() => {
                            if (kind === "video") {
                              setSelectedVideoShootType(type.id);
                            } else {
                              setSelectedPhotoShootType(type.id);
                            }
                          }}
                          className={`h-[52px] w-full rounded-xl px-5 pr-11 font-medium transition-all border text-sm lg:text-base tracking-tight text-left flex items-center ${selectedId === type.id
                            ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                            : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                            }`}
                        >
                          <span className="block w-full truncate pr-2">
                            {type.label}
                          </span>
                        </button>
                        {canDeleteShootType && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShootType(kind, type.id);
                            }}
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-500 transition-colors hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-8 space-y-6">
                <Button
                  onClick={() =>
                    setActiveShootTypeForm(isFormOpen ? null : kind)
                  }
                  className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                >
                  <Plus size={16} strokeWidth={3} />
                  {`Add ${sectionLabel}`}
                </Button>

                <AnimatePresence>
                  {isFormOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-4 items-end"
                    >
                      <div className="flex-1 relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            {fieldLabel}
                          </span>
                        </div>
                        <Input
                          placeholder="Eg : Real Estate"
                          value={customShootType}
                          onChange={(e) =>
                            setCustomShootType(clampTextLength(e.target.value))
                          }
                          maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                          className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                      <button
                        onClick={() =>
                          activeShootTypeForm &&
                          handleCreateShootType(activeShootTypeForm)
                        }
                        disabled={
                          isSubmittingShootType ||
                          !customShootType ||
                          !activeShootTypeForm
                        }
                        className={`flex-none w-[52px] h-[52px] lg:w-21 lg:h-21 rounded-xl flex items-center justify-center transition-all ${isSubmittingShootType ||
                          !customShootType ||
                          !activeShootTypeForm
                          ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                          : "bg-[#101010] text-[#16A34A]"
                          }`}
                      >
                        {isSubmittingShootType ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Check size={24} strokeWidth={3} />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  const handleValiditySelect = (days: number | "custom") => {
    setValidityDays(days);
    if (days !== "custom") {
      const newDate = addDays(new Date(), days);
      setValidUntil(format(newDate, "yyyy-MM-dd"));
    }
  };

  const formattedValidUntil = (() => {
    if (!validUntil) return "";
    const parsedDate = parseISO(validUntil);
    return isValid(parsedDate) ? format(parsedDate, "dd-MM-yyyy") : validUntil;
  })();

  const progressValue =
    view === "selection"
      ? 0
      : view === "details"
        ? 10
        : view === "services"
          ? selectedServices.length > 0
            ? 30
            : 10
          : view === "addons"
            ? 50
            : view === "logistics"
              ? 65
              : view === "customlineitems"
                ? 80
                : view === "discounts"
                  ? 90
                  : 100;

  const progressLabel = `${progressValue}%`;

  const stepNumber = ["selection", "details", "services", "addons"].includes(
    view,
  )
    ? 1
    : ["logistics", "customlineitems"].includes(view)
      ? 2
      : 3;

  const progressSegmentWidths = [0, 1, 2].map((segmentIndex) => {
    const segmentSize = 100 / 3;
    const segmentStart = segmentIndex * segmentSize;
    const segmentFill = Math.max(
      0,
      Math.min(((progressValue - segmentStart) / segmentSize) * 100, 100),
    );

    return `${segmentFill}%`;
  });

  const currentStepValidation = validateQuoteStep({
    view,
    selectedClient,
    clientName,
    emailId,
    phoneNumber,
    address,
    projectDescription,
    validUntil,
    selectedServices,
  });

  const quoteReviewValidation = validateQuoteForReview({
    selectedClient,
    clientName,
    emailId,
    phoneNumber,
    address,
    projectDescription,
    validUntil,
    selectedServices,
  });

  const canContinueToNextStep = currentStepValidation.isValid;
  const canPrimaryAction =
    isEditMode
      ? isFullEditFlow
        ? view === "tax"
          ? quoteReviewValidation.isValid && !isQuoteSaved
          : currentStepValidation.isValid
        : currentStepValidation.isValid
      : view === "tax"
        ? quoteReviewValidation.isValid && !isQuoteSaved
        : canContinueToNextStep;

  const handleContinue = async () => {
    if (!currentStepValidation.isValid) {
      toast.error(getQuoteValidationMessage(currentStepValidation));
      return;
    }

    if (view === "selection" && selectedClient) {
      applyClientSelection(selectedClient);
      setIsCreateNewClientFlow(false);
      setView("details");
    } else if (view === "details") {
      if (isCreateNewClientFlow) {
        setIsCreatingClient(true);

        try {
          const trimmedName = clientName.trim();
          const trimmedEmail = emailId.trim();
          const trimmedPhone = phoneNumber.trim();
          const trimmedAddress = address.trim();

          const response = await salesApi.createClient({
            name: trimmedName,
            email: trimmedEmail,
            phone_number: trimmedPhone,
          });

          if (response?.error || response?.success === false) {
            throw new Error(
              typeof response?.error === "string"
                ? response.error
                : "Failed to create client",
            );
          }

          const localCreatedClient = buildCreatedClientDraft({
            name: trimmedName,
            email: trimmedEmail,
            phoneNumber: trimmedPhone,
            address: trimmedAddress,
            clientId:
              (response as { data?: { client_id?: string | number; id?: string | number }; client_id?: string | number; id?: string | number })?.data?.client_id ??
              (response as { data?: { client_id?: string | number; id?: string | number }; client_id?: string | number; id?: string | number })?.data?.id ??
              (response as { data?: { client_id?: string | number; id?: string | number }; client_id?: string | number; id?: string | number })?.client_id ??
              (response as { data?: { client_id?: string | number; id?: string | number }; client_id?: string | number; id?: string | number })?.id ??
              null,
          });

          const dropdownResponse = await salesApi.getClientDropdown();
          const refreshedClients = Array.isArray(dropdownResponse?.data)
            ? (dropdownResponse.data as ClientDropdownItem[])
            : [];
          const matchedClient = findMatchingClient(refreshedClients, {
            name: trimmedName,
            email: trimmedEmail,
            phoneNumber: trimmedPhone,
          });
          const resolvedClient = matchedClient
            ? {
              ...matchedClient,
              address: getClientAddress(matchedClient) || trimmedAddress,
            }
            : localCreatedClient;

          if (refreshedClients.length > 0) {
            setClients(refreshedClients);
          } else {
            setClients((prev) => {
              const next = [localCreatedClient, ...prev];
              const seen = new Set<string>();

              return next.filter((client) => {
                const key = `${getClientDisplayName(client)}|${getClientEmail(client)}|${getClientPhone(client)}`;
                if (seen.has(key)) {
                  return false;
                }

                seen.add(key);
                return true;
              });
            });
          }

          setSelectedClient(resolvedClient);
          setClientName(trimmedName);
          setEmailId(trimmedEmail);
          setPhoneNumber(trimmedPhone);
          setAddress(trimmedAddress);
          setIsCreateNewClientFlow(false);
        } catch (error) {
          console.error("Failed to create client", error);
          toast.error(
            error instanceof Error ? error.message : "Failed to create client",
          );
          return;
        } finally {
          setIsCreatingClient(false);
        }
      }

      setView("services");
    } else if (view === "services") {
      setView("addons");
    } else if (view === "addons") {
      setView("logistics");
    } else if (view === "logistics") {
      setView("customlineitems");
    } else if (view === "customlineitems") {
      setView("discounts");
    } else if (view === "discounts") {
      setView("tax");
    } else {
      await handlePreviewQuote();
    }
  };

  const handleBack = () => {
    if (view === 'details') {
      setView('selection');
    } else if (view === 'services') {
      setView('details');
    } else if (view === 'addons') {
      setView('services');
    } else if (view === 'logistics') {
      setView('addons');
    } else if (view === 'customlineitems') {
      setView('logistics');
    } else if (view === 'discounts') {
      setView('customlineitems');
    } else if (view === 'tax') {
      setView('discounts');
      // Further steps to be added form customlineitems on wards
    } else {
      router.back();
    }
  };

  const handleDiscountTypeSelect = (type: DiscountType) => {
    setDiscountType(type);
  };

  const handleDiscountValueChange = (value: string, maxValue: number) => {
    const sanitizedValue = handleDecimalInput(value);

    if (sanitizedValue === "") {
      setDiscountValue("");
      return;
    }

    const numericValue = Number(sanitizedValue);
    if (Number.isNaN(numericValue) || numericValue > maxValue) {
      return;
    }

    setDiscountValue(sanitizedValue);
  };

  const handleDiscountValueBlur = (maxValue: number) => {
    const normalizedValue = Math.min(Math.max(0, Number(discountValue) || 0), maxValue);
    setDiscountValue(normalizedValue);
  };

  const handleWholeNumberInput = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const handleDecimalInput = (value: string) => {
    const normalizedValue = value.replace(/[^\d.]/g, "");
    const firstDecimalIndex = normalizedValue.indexOf(".");

    if (firstDecimalIndex === -1) {
      return normalizedValue;
    }

    const integerPart = normalizedValue.slice(0, firstDecimalIndex + 1);
    const decimalPart = normalizedValue
      .slice(firstDecimalIndex + 1)
      .replace(/\./g, "");
    return `${integerPart}${decimalPart}`;
  };

  // const handleTaxRate = (taxRate) => {
  //   setDiscountType(taxRate);
  // };

  const hasVideoService =
    selectedServices.some(
      (id) =>
        services.find((s) => s.id === id)?.label.toLowerCase() ===
        "videography",
    ) || selectedServices.includes("videography");
  const hasPhotoService =
    selectedServices.some(
      (id) =>
        services.find((s) => s.id === id)?.label.toLowerCase() ===
        "photography",
    ) || selectedServices.includes("photography");
  const hasEditingService =
    selectedServices.some(
      (id) =>
        isEditingServiceLabel(services.find((s) => s.id === id)?.label || ""),
    ) || selectedServices.includes("ai_editing");
  const hasEditingTypeContext = hasEditingService;
  const selectedVideoShootTypeLabel = getSelectedShootTypeLabel(
    videoShootTypes,
    selectedVideoShootType,
  );
  const selectedPhotoShootTypeLabel = getSelectedShootTypeLabel(
    photoShootTypes,
    selectedPhotoShootType,
  );
  const selectedEditingTypeLabels = getSelectedShootTypeLabels(
    editingTypeOptions,
    selectedEditingTypes,
  );
  const selectedEditingTypeLabel = selectedEditingTypeLabels.join(", ");
  const storedShootTypeLabel = buildStoredShootTypeLabel({
    hasVideoService,
    hasPhotoService,
    hasEditingService,
    videoShootTypeLabel: selectedVideoShootTypeLabel,
    photoShootTypeLabel: selectedPhotoShootTypeLabel,
    editingShootTypeLabel: selectedEditingTypeLabel,
  });
  const quoteDraftShootTypes = React.useMemo(
    () =>
      storedShootTypeLabel
        ? [{ id: "__selected_shoot_type__", label: storedShootTypeLabel }]
        : [],
    [storedShootTypeLabel],
  );
  const quoteDraftSelectedShootType = storedShootTypeLabel
    ? "__selected_shoot_type__"
    : "";
  const totalAddOnsCost = selectedAddons.reduce((total, addonId) => {
    const config = addonConfigs[addonId] ?? appliedAddonConfigs[addonId];
    if (!config) return total;
    return total + config.quantity * config.price;
  }, 0);
  const selectedLogisticsItems = selectedLogistics
    .map((itemId) => logisticsItems.find((item) => item.id === itemId))
    .filter((item): item is (typeof logisticsItems)[number] => Boolean(item));
  const totalLogisticsCost = selectedLogisticsItems.reduce((total, item) => {
    const config = appliedLogisticsConfigs[item.id];
    if (!config) return total;
    return total + config.price;
  }, 0);
  const totalLineItemsCost = lineItems.reduce((total, item) => {
    const config = appliedLineItemConfigs[item.id];
    if (!config) return total;
    return total + config.price;
  }, 0);
  const totalServicesCost = selectedServices.reduce((total, serviceId) => {
    const config = serviceConfigs[serviceId];
    if (!config) return total;
    const service = services.find((item) => item.id === serviceId);
    const isEditingService = isEditingServiceLabel(service?.label || "");
    const baseTotal = config.crewSize * config.estimatedPrice;
    if (!isEditingService) {
      return total + baseTotal * config.duration;
    }

    const editingTotal = selectedEditingTypes.reduce((sum, editingTypeId) => {
      const editingConfig = editingTypeConfigs[editingTypeId];
      const quantity = Math.max(1, Number(editingConfig?.quantity ?? config.crewSize ?? 1));
      const estimatedPrice = Math.max(0, Number(editingConfig?.estimatedPrice ?? config.estimatedPrice ?? 0));
      return sum + quantity * estimatedPrice;
    }, 0);

    return total + (selectedEditingTypes.length ? editingTotal : baseTotal);
  }, 0);
  const selectedServicesMaxDurationHours = React.useMemo(() => {
    const durations = selectedServices
      .filter((serviceId) => {
        const resolvedLabel =
          services.find((service) => service.id === serviceId)?.label || serviceId;
        return !isEditingServiceLabel(resolvedLabel);
      })
      .map((serviceId) => Number(serviceConfigs[serviceId]?.duration))
      .filter((duration) => Number.isFinite(duration) && duration > 0);

    return durations.length > 0 ? Math.max(...durations) : null;
  }, [selectedServices, serviceConfigs, services]);

  React.useEffect(() => {
    if (activeShootTypeForm === "video" && !hasVideoService) {
      setActiveShootTypeForm(null);
    }

    if (activeShootTypeForm === "photo" && !hasPhotoService) {
      setActiveShootTypeForm(null);
    }
  }, [activeShootTypeForm, hasPhotoService, hasVideoService]);

  React.useEffect(() => {
    if (hasEditingTypeContext) {
      return;
    }

    setSelectedEditingTypes([]);
    setEditingTypeOptions([]);
    setCustomEditingType("");
    setShowAddEditingTypeForm(false);
    setEditingTypeConfigs({});
  }, [hasEditingTypeContext]);

  const getEditingServiceDefaults = React.useCallback(() => {
    const editingServiceId = selectedServices.find((id) =>
      isEditingServiceLabel(services.find((service) => service.id === id)?.label || "")
    );
    const service = services.find((item) => item.id === editingServiceId);
    const config = editingServiceId ? serviceConfigs[editingServiceId] : null;

    return {
      quantity: Math.max(1, Number(config?.crewSize ?? 1)),
      estimatedPrice: Math.max(0, Number(config?.estimatedPrice ?? service?.price ?? 0)),
    };
  }, [selectedServices, serviceConfigs, services]);

  React.useEffect(() => {
    if (!hasEditingTypeContext) {
      return;
    }

    const defaults = getEditingServiceDefaults();
    setEditingTypeConfigs((prev) => {
      const next = { ...prev };
      selectedEditingTypes.forEach((id) => {
        if (!next[id]) {
          next[id] = defaults;
        }
      });
      Object.keys(next).forEach((id) => {
        if (!selectedEditingTypes.includes(id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [getEditingServiceDefaults, hasEditingTypeContext, selectedEditingTypes]);

  const quoteSubtotal =
    totalServicesCost +
    totalAddOnsCost +
    totalLogisticsCost +
    totalLineItemsCost;
  const maxDiscountValue = discountType === "percentage" ? 100 : quoteSubtotal;
  const normalizedDiscountValue = Math.min(
    Math.max(0, Number(discountValue) || 0),
    maxDiscountValue,
  );
  const rawDiscountAmount = !discountEnabled
    ? 0
    : discountType === "percentage"
      ? quoteSubtotal * (normalizedDiscountValue / 100)
      : normalizedDiscountValue;
  const discountAmount = Math.min(rawDiscountAmount, quoteSubtotal);
  const discountedSubtotal = Math.max(quoteSubtotal - discountAmount, 0);
  const normalizedTaxRate = Math.max(0, Number(taxRate) || selectedTax || 0);
  const taxAmount = discountedSubtotal * (normalizedTaxRate / 100);
  const totalAfterTax = discountedSubtotal + taxAmount;
  const totalAfterDiscount = totalAfterTax;
  const additionalPaymentDetails = React.useMemo(
    () => getQuoteAdditionalPaymentDetails(quoteToEdit ?? previewQuote),
    [previewQuote, quoteToEdit],
  );
  React.useEffect(() => {
    const currentValue = Number(discountValue);

    if (Number.isNaN(currentValue)) {
      return;
    }

    const boundedValue = Math.min(Math.max(currentValue, 0), maxDiscountValue);

    if (currentValue !== boundedValue) {
      setDiscountValue(typeof discountValue === "string" ? boundedValue.toString() : boundedValue);
    }
  }, [discountValue, maxDiscountValue]);

  // const taxLabel = taxType.trim() || "Sales Tax";
  const taxLabel = (selectedTax === -1 && taxType.trim())
    ? taxType.trim()
    : "Sales Tax";
  const canOpenQuoteSummary = hasQuoteSummaryContent({
    selectedClient,
    clientName,
    emailId,
    phoneNumber,
    address,
    projectDescription,
    validUntil,
    selectedShootType: quoteDraftSelectedShootType,
    selectedServices,
    selectedAddons,
    logisticsItems: selectedLogisticsItems,
    lineItems,
    discountEnabled,
    discountValue,
    normalizedTaxRate,
  });
  const [isSubmittingService, setIsSubmittingService] = React.useState(false);
  const [isCreatingQuoteDraft, setIsCreatingQuoteDraft] = React.useState(false);
  const [activeQuoteAction, setActiveQuoteAction] = React.useState<
    "preview" | "save" | "draft" | null
  >(null);
  const isPreviewLoading =
    isPreviewModalOpen &&
    isCreatingQuoteDraft &&
    activeQuoteAction !== "draft" &&
    !previewQuote;
  const editQuoteDetailsHref = effectiveQuoteId
    ? `/admin/quotes/${encodeURIComponent(String(effectiveQuoteId))}`
    : "/admin/quotes";
  const resolvedInvoiceQuoteId = effectiveQuoteId ? String(effectiveQuoteId) : null;
  const convertedBookingId = React.useMemo(() => {
    if (convertedBookingIdOverride) {
      return convertedBookingIdOverride;
    }

    const bookingId = quoteToEdit?.booking_id ?? previewQuote?.booking_id;
    if (bookingId === undefined || bookingId === null || !String(bookingId).trim()) {
      return null;
    }

    return String(bookingId);
  }, [convertedBookingIdOverride, previewQuote, quoteToEdit]);
  const isConvertedToBooking = isConvertedOverride || Boolean(convertedBookingId);
  const showInvoiceActions = view === "tax" && isQuoteSaved && Boolean(resolvedInvoiceQuoteId);
  const showPreviewAction = view === "tax";
  const convertBookingActionLabel = isConvertedToBooking
    ? "Update Booking"
    : "Convert to Booking";
  const getQuoteDraftPayload = (maxStep?: typeof view) =>
    buildQuoteDraftPayload({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedEditingTypes,
      editingTypeConfigs,
      editingTypeOptions,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems: selectedLogisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
      maxStep,
    });

  const getQuoteUpdatePayload = (maxStep?: typeof view) =>
    buildQuoteUpdatePayload({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedEditingTypes,
      editingTypeConfigs,
      editingTypeOptions,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems: selectedLogisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
      maxStep,
    });

  const getQuoteStepUpdatePayload = (step: typeof view = view) =>
    buildQuoteStepUpdatePayload(
      {
        selectedClient,
        clientName,
        emailId,
        phoneNumber,
        address,
        projectDescription,
        validityDays,
        validUntil,
        discountEnabled,
        discountType,
        discountValue,
        taxLabel,
        normalizedTaxRate,
        selectedShootType: quoteDraftSelectedShootType,
        shootTypes: quoteDraftShootTypes,
        selectedEditingTypes,
        editingTypeConfigs,
        editingTypeOptions,
        selectedServices,
        services,
        serviceConfigs,
        selectedAddons,
        addons,
        appliedAddonConfigs,
        logisticsItems: selectedLogisticsItems,
        appliedLogisticsConfigs,
        lineItems,
        appliedLineItemConfigs,
      },
      step,
    );

  const getQuoteSummarySnapshot = () =>
    buildQuoteSummarySnapshot({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems: selectedLogisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
    });

  const currentDraftLineItems = React.useMemo(() => {
    const payload = buildQuoteUpdatePayload({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedEditingTypes,
      editingTypeConfigs,
      editingTypeOptions,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems: selectedLogisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
    });
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
    selectedLogisticsItems.forEach((item) => {
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

    return (payload.line_items || []).map((item, index) => {
      const catalogMeta = item.catalog_item_id
        ? lineItemCatalog.get(String(item.catalog_item_id))
        : null;
      const configuration = item.configuration as
        | {
            editing_type_label?: string;
          }
        | undefined;
      const rawSubtitle = configuration?.editing_type_label?.trim() || "";
      const subtitle = rawSubtitle ? `(${rawSubtitle})` : undefined;
      const section =
        item.section_type === "addon" ||
        item.section_type === "logistics" ||
        item.section_type === "custom"
          ? item.section_type
          : "service";
      const name =
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
        ).trim();
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
  }, [
    address,
    addons,
    appliedAddonConfigs,
    appliedLineItemConfigs,
    appliedLogisticsConfigs,
    clientName,
    discountEnabled,
    discountType,
    discountValue,
    editingTypeConfigs,
    editingTypeOptions,
    emailId,
    lineItems,
    normalizedTaxRate,
    phoneNumber,
    projectDescription,
    quoteDraftSelectedShootType,
    quoteDraftShootTypes,
    selectedAddons,
    selectedClient,
    selectedEditingTypes,
    selectedLogisticsItems,
    selectedServices,
    serviceConfigs,
    services,
    taxLabel,
    validUntil,
    validityDays,
  ]);

  const reviewChangesData = React.useMemo(() => {
    const originalLineItems = quoteToEdit ? normalizeQuoteLineItems(quoteToEdit) : [];
    const previousTotal = Math.max(
      0,
      getQuoteNumber(
        quoteToEdit?.final_total,
        quoteToEdit?.total_amount,
        quoteToEdit?.amount_after_tax,
        quoteToEdit?.amount_after_discount,
        quoteToEdit?.total,
      ) ?? 0,
    );
    const nextTotal = Math.max(0, totalAfterTax);
    const currentItemMap = new Map(
      currentDraftLineItems.map((item) => [item.key, item] as const),
    );
    const originalItemMap = new Map(
      originalLineItems.map((item) => [
        buildReviewItemKey(item.section, item.name, item.subtitle),
        item,
      ] as const),
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

    const formatEditorDate = (value: string) => {
      if (!value) {
        return "";
      }
      const parsedDate = parseISO(value);
      return isValid(parsedDate) ? format(parsedDate, "MMMM d, yyyy") : value;
    };

    const fieldChangeCandidates: QuoteReviewFieldChange[] = [
      {
        id: "project_description",
        label: "Project Description",
        previousValue: formatReviewValue(quoteToEdit?.project_description),
        nextValue: projectDescription.trim(),
      },
      {
        id: "valid_until",
        label: "Quote Valid Until",
        previousValue: formatEditorDate(String(quoteToEdit?.valid_until || "")),
        nextValue: formatEditorDate(validUntil),
      },
      {
        id: "discount",
        label: "Discount",
        previousValue:
          Number(getQuoteNumber(quoteToEdit?.discount_value) ?? 0) > 0
            ? `${getQuoteText(quoteToEdit?.discount_type) === "fixed_amount" ? "$" : ""}${getQuoteNumber(quoteToEdit?.discount_value) ?? 0}${getQuoteText(quoteToEdit?.discount_type) === "percentage" ? "%" : ""}`
            : "None",
        nextValue:
          discountEnabled && Number(discountValue || 0) > 0
            ? `${discountType === "fixed" ? "$" : ""}${Number(discountValue || 0)}${discountType === "percentage" ? "%" : ""}`
            : "None",
      },
      {
        id: "tax_rate",
        label: "Tax Rate",
        previousValue: `${getQuoteNumber(quoteToEdit?.tax_rate) ?? 0}%`,
        nextValue: `${normalizedTaxRate}%`,
      },
      {
        id: "tax_type",
        label: "Tax Type",
        previousValue: getQuoteText(quoteToEdit?.tax_type, "Sales Tax") || "Sales Tax",
        nextValue: taxLabel || "Sales Tax",
      },
    ];

    const fieldChanges = fieldChangeCandidates.filter(
      (entry) => entry.previousValue !== entry.nextValue,
    );

    return {
      previousTotal,
      nextTotal,
      delta: nextTotal - previousTotal,
      lineChanges,
      serviceChanges: lineChanges.filter((item) => item.section === "service"),
      addonChanges: lineChanges.filter((item) => item.section === "addon"),
      logisticsChanges: lineChanges.filter((item) => item.section === "logistics"),
      customChanges: lineChanges.filter((item) => item.section === "custom"),
      fieldChanges,
    };
  }, [
    currentDraftLineItems,
    discountEnabled,
    discountType,
    discountValue,
    normalizedTaxRate,
    projectDescription,
    quoteToEdit,
    taxLabel,
    totalAfterTax,
    validUntil,
  ]);

  const delayAfterSuccessToast = () =>
    new Promise((resolve) => window.setTimeout(resolve, 450));

  const saveQuoteDraft = async (
    action: "preview" | "save" | "draft",
    options?: {
      suppressRedirect?: boolean;
      openPreview?: boolean;
      saveAsNewVersion?: boolean;
      versionNotes?: string;
      showVersionSuccess?: boolean;
    },
  ) => {
    if (isCreatingQuoteDraft) return;

    const isUpdatingExistingQuote = Boolean(effectiveQuoteId);
    const basePayload = getQuoteDraftPayload(
      action === "draft" ? view : undefined,
    );
    const payload = isUpdatingExistingQuote
      ? {
          ...getQuoteUpdatePayload(action === "draft" ? view : undefined),
          is_draft: action === "draft",
          ...(options?.saveAsNewVersion
            ? {
                save_as_new_version: true,
                version_notes: options.versionNotes?.trim() || undefined,
              }
            : {}),
        }
      : action === "save"
        ? {
            ...basePayload,
            is_draft: false,
          }
        : basePayload;

    setIsCreatingQuoteDraft(true);
    setActiveQuoteAction(action);

    const shouldOpenPreview = action === "preview" || Boolean(options?.openPreview);

    if (shouldOpenPreview) {
      setPreviewQuote(null);
      setPreviewQuoteId(null);
      setIsPreviewModalOpen(true);
    }

    let savedQuoteId: string | null = null;

    try {
      const response = isUpdatingExistingQuote
        ? await salesApi.updateQuote(effectiveQuoteId as string, payload)
        : await salesApi.createQuoteDraft(payload);
      const persistedQuoteSource =
        response && typeof response === "object" && "data" in response
          ? (response.data as SalesQuoteDetailData | null | undefined)
          : (response as SalesQuoteDetailData | null | undefined);
      const persistedQuote = unwrapSalesQuoteDetail(persistedQuoteSource);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : isUpdatingExistingQuote
              ? "Failed to update quote"
              : "Failed to create quote draft",
        );
      }

      savedQuoteId =
        (isUpdatingExistingQuote && effectiveQuoteId ? String(effectiveQuoteId) : null) ??
        extractQuoteIdFromResponse(response) ??
        extractQuoteIdFromResponse(persistedQuote);

      if (!createdQuoteId && savedQuoteId) {
        setCreatedQuoteId(savedQuoteId);
      }

      if (persistedQuote) {
        setQuoteToEdit(persistedQuote);
      }

      if (action === "save") {
        setIsQuoteSaved(true);
        if (options?.showVersionSuccess) {
          setIsReviewChangesModalOpen(false);
          setIsVersionSaveSuccessOpen(true);
          setReviewChangeReason("");
          return;
        }
        toast.success(
          isUpdatingExistingQuote
            ? "Quote updated successfully"
            : "Quote saved successfully",
        );
        await delayAfterSuccessToast();
        if (!shouldOpenPreview) {
          if (isEditMode && quoteEditReturnHref && !isFullEditFlow) {
            router.push(quoteEditReturnHref);
            return;
          }
          return;
        }
      }

      if (action === "draft") {
        toast.success(
          isUpdatingExistingQuote
            ? "Draft updated successfully"
            : "Draft saved successfully",
        );
        return;
      }

      if (!savedQuoteId) {
        if (persistedQuote) {
          setPreviewQuoteId(extractQuoteIdFromResponse(persistedQuote));
          setPreviewQuote(persistedQuote);
          toast.success("Quote preview loaded");
          return;
        }

        throw new Error("Quote draft was saved, but no quote id was returned");
      }

      const detailResponse = await salesApi.getQuoteDetail(savedQuoteId);

      if (detailResponse?.error || detailResponse?.success === false) {
        if (persistedQuote) {
          setPreviewQuoteId(savedQuoteId);
          setPreviewQuote(persistedQuote);
          toast.success("Quote preview loaded");
          return;
        }

        throw new Error(
          typeof detailResponse?.error === "string"
            ? detailResponse.error
            : "Failed to fetch quote detail",
        );
      }

      const quoteDetail =
        unwrapSalesQuoteDetail(detailResponse?.data ?? null) ?? persistedQuote;

      if (!quoteDetail) {
        throw new Error("Quote preview could not be loaded");
      }

      if (shouldOpenPreview) {
        setPreviewQuoteId(savedQuoteId);
        setPreviewQuote(quoteDetail);
        toast.success("Quote preview loaded");
      }
    } catch (error) {
      console.error(
        action === "preview"
          ? "Failed to load quote preview"
          : action === "draft"
            ? "Failed to save draft"
            : "Failed to save quote",
        error,
      );

      if (shouldOpenPreview) {
        setIsPreviewModalOpen(false);
      }

      const fallbackMessage =
        action === "preview" && savedQuoteId
          ? "Quote saved, but preview could not be loaded"
          : action === "preview"
            ? "Failed to load quote preview"
            : action === "draft"
              ? isUpdatingExistingQuote
                ? "Failed to update draft"
                : "Failed to save draft"
              : isUpdatingExistingQuote
                ? "Failed to update quote"
                : "Failed to save quote";

      toast.error(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsCreatingQuoteDraft(false);
      setActiveQuoteAction(null);
    }
  };

  const handlePreviewQuote = async () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    await saveQuoteDraft("save", { suppressRedirect: true, openPreview: true });
  };

  const handleSaveQuote = async () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    await saveQuoteDraft("save");
  };

  const handleOpenReviewChangesModal = () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    setIsReviewChangesModalOpen(true);
  };

  const handleSaveAsNewVersion = async () => {
    if (!effectiveQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    if (!reviewChangeReason.trim()) {
      toast.error("Please provide a reason for these changes.");
      return;
    }

    await saveQuoteDraft("save", {
      saveAsNewVersion: true,
      versionNotes: reviewChangeReason,
      showVersionSuccess: true,
    });
  };

  const handleSaveCurrentEditStep = async () => {
    if (!editQuoteId || isCreatingQuoteDraft) {
      return;
    }

    if (!currentStepValidation.isValid) {
      toast.error(getQuoteValidationMessage(currentStepValidation));
      return;
    }

    setIsCreatingQuoteDraft(true);
    setActiveQuoteAction("save");

    try {
      const response = await salesApi.updateQuote(
        editQuoteId,
        getQuoteStepUpdatePayload(view),
      );

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : "Failed to update quote",
        );
      }

      toast.success("Quote updated successfully");
      await delayAfterSuccessToast();
      if (isDuplicateFlow) {
        return;
      }

      router.push(quoteEditReturnHref || editQuoteDetailsHref);
    } catch (error) {
      console.error("Failed to save quote edit step", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update quote",
      );
    } finally {
      setIsCreatingQuoteDraft(false);
      setActiveQuoteAction(null);
    }
  };

  const handlePrimaryAction = isEditMode
    ? isFullEditFlow
      ? view === "tax"
        ? handleSaveQuote
        : handleContinue
      : handleSaveCurrentEditStep
    : view === "tax"
      ? handleSaveQuote
      : handleContinue;
  const showReviewChangesAction = isEditMode && isFullEditFlow && view === "tax";

  const primaryActionLabel = isEditMode
    ? isFullEditFlow
      ? view === "tax"
        ? isCreatingQuoteDraft && activeQuoteAction === "save"
          ? "Saving Quote..."
          : isQuoteSaved
            ? "Saved"
            : "Save Quote"
        : view === "details" && isCreatingClient
          ? "Creating Client..."
          : "Continue"
      : isCreatingQuoteDraft && activeQuoteAction === "save"
        ? "Saving..."
        : "Save"
    : view === "tax"
      ? isCreatingQuoteDraft && activeQuoteAction === "save"
        ? "Saving Quote..."
        : isQuoteSaved
          ? "Saved"
          : "Save Quote"
      : view === "details" && isCreatingClient
        ? "Creating Client..."
        : "Continue";

  const handleSaveAsDraft = async () => {
    await saveQuoteDraft("draft");
  };

  const handleOpenQuoteSummary = () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    setQuoteSummarySnapshot(getQuoteSummarySnapshot());
    setIsSummaryModalOpen(true);
  };

  const previewQuoteInvoiceRequest = async () => {
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setIsViewingInvoice(true);
    try {
      const response = await salesApi.previewQuoteInvoice(resolvedInvoiceQuoteId);

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

  const handleViewInvoice = async () => {
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    await previewQuoteInvoiceRequest();
  };

  const sendQuoteInvoiceRequest = async () => {
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return false;
    }

    setIsSendingInvoice(true);
    try {
      const response = await salesApi.sendQuoteInvoice(resolvedInvoiceQuoteId);

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
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    await sendQuoteInvoiceRequest();
  };

  const handleConvertToBooking = () => {
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setConvertIntent("convert_only");
    setIsConvertModalOpen(true);
  };

  const handleConvertBookingSubmit = async (
    bookingData: ConvertBookingModalSubmitData,
  ) => {
    if (!resolvedInvoiceQuoteId) {
      toast.error("Quote id is missing.");
      return;
    }

    setIsConverting(true);
    try {
      const wasAlreadyConverted = isConvertedToBooking;
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
          location: bookingData.location || "",
          location_latitude: bookingData.location_latitude ?? undefined,
          location_longitude: bookingData.location_longitude ?? undefined,
        };
      } else {
        if (!bookingData.multiDay) {
          throw new Error("Multi day booking data is missing.");
        }

        payload = {
          booking_type: "multi_day",
          time_zone: browserTimeZone,
          location: bookingData.location || "",
          location_latitude: bookingData.location_latitude ?? undefined,
          location_longitude: bookingData.location_longitude ?? undefined,
          booking_days: bookingData.multiDay.days.map((day) => ({
            date: day.date,
            start_time: `${day.startTime}:00`,
            end_time: `${day.endTime}:00`,
          })),
        };
      }

      const response = await salesApi.convertQuoteToBooking(
        resolvedInvoiceQuoteId,
        payload,
      );

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : "Failed to convert quote to booking",
        );
      }

      const bookingId = response?.data?.booking_id;
      const nextBookingId =
        bookingId !== undefined && bookingId !== null && String(bookingId).trim()
          ? String(bookingId)
          : null;

      if (nextBookingId) {
        setConvertedBookingIdOverride(nextBookingId);
      }
      setIsConvertedOverride(true);
      setConvertModalInitialDataOverride(bookingData);
      setQuoteToEdit((current) =>
        current
          ? {
            ...current,
            ...(nextBookingId ? { booking_id: nextBookingId } : {}),
          }
          : current,
      );

      toast.success(
        wasAlreadyConverted
          ? "Booking date and time updated. Continuing with invoice actions now."
          : `Your quote has been converted into booking${nextBookingId ? ` #${nextBookingId}` : ""}. You can continue with invoice actions now.`,
      );
      setIsConvertModalOpen(false);

      if (convertIntent === "send_invoice") {
        await sendQuoteInvoiceRequest();
      } else if (convertIntent === "view_invoice") {
        await previewQuoteInvoiceRequest();
      }
    } catch (error) {
      console.error("Failed to convert quote to booking", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to convert quote to booking",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const fetchCatalog = async () => {
    setIsCatalogLoaded(false);
    setLoadingServices(true);
    try {
      const res = await salesApi.getQuoteCatalog();
      if (!res.error && res.data) {
        const { service, addon, logistics } = res.data;

        if (service) {
          const mappedServices = service.map((item: CatalogSectionItem, idx: number) => {
            const name =
              item.name.toLowerCase() === "location" ? "Studio" : item.name;
            return {
              id: (item.catalog_item_id || `svc-${idx}`).toString(),
              catalogItemId: item.catalog_item_id ?? null,
              label: name,
              price: parseFloat(item.effective_rate) || 0,
              icon: getServiceIcon(name),
              createdAt: item.created_at || null,
              originalIndex: idx,
            };
          });

          const sortedServices = [...mappedServices].sort((a, b) => {
            const aLabel = normalizeServiceLabel(a.label);
            const bLabel = normalizeServiceLabel(b.label);
            const aProtected = isProtectedServiceLabel(a.label);
            const bProtected = isProtectedServiceLabel(b.label);

            if (aProtected && bProtected) {
              return (
                PROTECTED_SERVICE_ORDER.indexOf(
                  aLabel as (typeof PROTECTED_SERVICE_ORDER)[number],
                ) -
                PROTECTED_SERVICE_ORDER.indexOf(
                  bLabel as (typeof PROTECTED_SERVICE_ORDER)[number],
                )
              );
            }

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setServices(sortedServices);
        }

        if (addon) {
          const mappedAddons = addon.map((item: CatalogSectionItem, idx: number) => ({
            id: (item.catalog_item_id || `add-${idx}`).toString(),
            label: item.name,
            price: parseFloat(item.effective_rate) || 0,
            createdAt: item.created_at || null,
            originalIndex: idx,
          }));

          const sortedAddons = [...mappedAddons].sort((a, b) => {
            const aProtected = isProtectedAddonLabel(a.label);
            const bProtected = isProtectedAddonLabel(b.label);

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            if (aProtected && bProtected) {
              return a.originalIndex - b.originalIndex;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setAddons(sortedAddons);
        }

        if (logistics) {
          const mappedLogistics = logistics.map((item: CatalogSectionItem, idx: number) => ({
            id: (item.catalog_item_id || `log-${idx}`).toString(),
            label: item.name,
            basePrice: parseFloat(item.effective_rate) || 0,
            createdAt: item.created_at || null,
            originalIndex: idx,
          }));

          const sortedLogistics = [...mappedLogistics].sort((a, b) => {
            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          const mergedLogistics = mergeCatalogItemsById(
            sortedLogistics,
            logisticsItemsRef.current,
          );
          const nextSelectedLogistics = selectedLogisticsRef.current.filter(
            (itemId) => mergedLogistics.some((item) => item.id === itemId),
          );

          setLogisticsItems(mergedLogistics);
          setSelectedLogistics(nextSelectedLogistics);
          setLogisticsConfigs((prev) => {
            const nextConfigs: Record<string, { price: number }> = {};

            nextSelectedLogistics.forEach((itemId) => {
              const logisticsItem = mergedLogistics.find((item) => item.id === itemId);
              if (!logisticsItem) return;

              nextConfigs[itemId] = prev[itemId] ?? { price: logisticsItem.basePrice };
            });

            return nextConfigs;
          });
          setAppliedLogisticsConfigs((prev) => {
            const nextConfigs: Record<string, { price: number }> = {};

            nextSelectedLogistics.forEach((itemId) => {
              const logisticsItem = mergedLogistics.find((item) => item.id === itemId);
              if (!logisticsItem) return;

              nextConfigs[itemId] = prev[itemId] ?? { price: logisticsItem.basePrice };
            });

            return nextConfigs;
          });
        }

        const lineItemSection = LINE_ITEM_SECTION_KEYS.map(
          (key) => (res.data as Record<string, unknown>)[key],
        ).find((section): section is CatalogSectionItem[] =>
          Array.isArray(section),
        );

        if (lineItemSection) {
          const mappedLineItems = lineItemSection.map(
            (item: CatalogSectionItem, idx: number) => ({
              id: (item.catalog_item_id || `line-${idx}`).toString(),
              label: item.name,
              basePrice: parseFloat(item.effective_rate) || 0,
              createdAt: item.created_at || null,
              originalIndex: idx,
            }),
          );

          const sortedLineItems = [...mappedLineItems].sort((a, b) => {
            const aProtected = isProtectedLineItemLabel(a.label);
            const bProtected = isProtectedLineItemLabel(b.label);

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            if (aProtected && bProtected) {
              return a.originalIndex - b.originalIndex;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setLineItems((prev) => {
            const localItems = prev.filter((item) =>
              item.id?.startsWith("custom_"),
            );
            return [...sortedLineItems, ...localItems];
          });

          setLineItemConfigs((prev) => {
            const configs: Record<string, { price: number }> = {};
            Object.entries(prev).forEach(([id, value]) => {
              if (id.startsWith("custom_")) {
                configs[id] = value;
              }
            });
            sortedLineItems.forEach((item) => {
              configs[item.id] = { price: item.basePrice };
            });
            return configs;
          });

          setAppliedLineItemConfigs((prev) => {
            const configs: Record<string, { price: number }> = {};
            Object.entries(prev).forEach(([id, value]) => {
              if (id.startsWith("custom_")) {
                configs[id] = value;
              }
            });
            sortedLineItems.forEach((item) => {
              configs[item.id] = { price: item.basePrice };
            });
            return configs;
          });
        } else {
          setLineItems((prev) =>
            prev.filter((item) => item.id?.startsWith("custom_")),
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch catalog", error);
    } finally {
      setLoadingServices(false);
      setIsCatalogLoaded(true);
    }
  };

  const handleCreateService = async () => {
    const serviceName = clampTextLength(customServiceName).trim();
    if (!serviceName || !customServiceCost) return;

    setIsSubmittingService(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "service",
        name: serviceName,
        default_rate:
          parseFloat(customServiceCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "per_hour",
        rate_unit: "per hour",
      });

      if (res && !res.error) {
        // Success
        setCustomServiceName("");
        setCustomServiceCost("");
        setShowAddServiceForm(false);
        // Refetch the catalog to show the new service
        await fetchCatalog();
      } else {
        console.error(
          "Failed to create service:",
          res?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteCatalogItem = (
    id: string,
    type: "service" | "addon" | "logistics" | "line_item",
  ) => {
    const item =
      type === "service"
        ? services.find((s) => s.id === id)
        : type === "addon"
          ? addons.find((a) => a.id === id)
          : type === "logistics"
            ? logisticsItems.find((item) => item.id === id)
            : lineItems.find((item) => item.id === id);

    if (item) {
      if (type === "service" && isProtectedServiceLabel(item.label)) {
        toast.error("Default services can't be deleted");
        return;
      }

      if (type === "line_item" && isProtectedLineItemLabel(item.label)) {
        toast.error("Default line items can't be deleted");
        return;
      }

      setItemToDelete({ id, type, label: item.label });
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteShootType = (kind: ShootTypeKind | "editing", id: string) => {
    const shootTypeOptions =
      kind === "video"
        ? videoShootTypes
        : kind === "photo"
          ? photoShootTypes
          : editingTypeOptions;
    const item = shootTypeOptions.find((type) => type.id === id);
    if (!item) return;

    if (item.isSystemDefault) {
      toast.error("Default shoot types can't be deleted");
      return;
    }

    const shootTypeId = item.apiId ?? item.id;

    if (!canDeleteShootTypeItem(item)) {
      toast.error("Invalid shoot type id. Please refresh and try again.");
      return;
    }

    setItemToDelete({
      id: String(shootTypeId),
      type: kind === "editing" ? "editing_type" : "shoot_type",
      label: item.label,
    });
    setIsDeleteModalOpen(true);
  };

  const resolveEditingTypeCategory = (): "video" | "photo" | null => {
    const selectedOption = editingTypeOptions.find(
      (type) => selectedEditingTypes.includes(type.id),
    );

    if (selectedOption?.category === "video" || selectedOption?.category === "photo") {
      return selectedOption.category;
    }

    if (hasVideoService && !hasPhotoService) {
      return "video";
    }

    if (hasPhotoService && !hasVideoService) {
      return "photo";
    }

    if (hasVideoService) {
      return "video";
    }

    if (hasPhotoService) {
      return "photo";
    }

    return null;
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (
      itemToDelete.type === "line_item" &&
      itemToDelete.id.startsWith("custom_")
    ) {
      removeLineItem(itemToDelete.id);
      toast.success("Line item deleted successfully");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      return;
    }

    if (itemToDelete.type === "shoot_type" || itemToDelete.type === "editing_type") {
      const shootTypeItem = [
        ...(itemToDelete.type === "editing_type"
          ? editingTypeOptions
          : [...videoShootTypes, ...photoShootTypes]),
      ].find(
        (type) =>
          String(type.id) === itemToDelete.id ||
          String(type.apiId ?? "") === itemToDelete.id,
      );

      if (shootTypeItem?.isSystemDefault) {
        toast.error("Default shoot types can't be deleted");
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        return;
      }
    }

    setIsDeleting(true);
    try {
      const res =
        itemToDelete.type === "editing_type"
          ? await salesApi.deleteAiEditingType(itemToDelete.id)
          : itemToDelete.type === "shoot_type"
            ? await salesApi.deleteShootType(itemToDelete.id)
            : await salesApi.deleteQuoteCatalog(itemToDelete.id);
      if (res && !res.error) {
        toast.success(
          `${itemToDelete.type === "service" ? "Service" : itemToDelete.type === "addon" ? "Add-on" : itemToDelete.type === "logistics" ? "Logistics item" : itemToDelete.type === "shoot_type" ? "Shoot type" : itemToDelete.type === "editing_type" ? "Editing type" : "Line item"} deleted successfully`,
        );
        if (itemToDelete.type === "shoot_type" || itemToDelete.type === "editing_type") {
          const filterDeletedShootType = (type: { id: string; apiId: string | null }) =>
            String(type.id) !== itemToDelete.id &&
            String(type.apiId ?? "") !== itemToDelete.id;

          if (itemToDelete.type === "editing_type") {
            setEditingTypeOptions((prev) => prev.filter(filterDeletedShootType));
            setSelectedEditingTypes((prev) =>
              prev.filter(
                (editingTypeId) =>
                  String(editingTypeId) !== itemToDelete.id &&
                  String(editingTypeOptions.find((type) => type.id === editingTypeId)?.apiId ?? "") !== itemToDelete.id
              )
            );
            await fetchEditingTypes(selectedServices);
          } else {
            setVideoShootTypes((prev) => prev.filter(filterDeletedShootType));
            setPhotoShootTypes((prev) => prev.filter(filterDeletedShootType));
            await fetchShootTypes(selectedServices);
          }
        } else {
          // Refresh catalog
          await fetchCatalog();
          // Remove from selected if it was selected
          if (itemToDelete.type === "service") {
            setSelectedServices((prev) =>
              prev.filter((sid) => sid !== itemToDelete.id),
            );
          } else if (itemToDelete.type === "addon") {
            removeSelectedAddon(itemToDelete.id);
          } else if (itemToDelete.type === "logistics") {
            removeLogisticsItem(itemToDelete.id);
          } else {
            removeLineItem(itemToDelete.id);
          }
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        toast.error(`Failed to delete: ${res?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error deleting item:`, error);
      toast.error("An error occurred while deleting the item");
    } finally {
      setIsDeleting(false);
    }
  };

  const [isSubmittingShootType, setIsSubmittingShootType] =
    React.useState(false);
  const [isSubmittingEditingType, setIsSubmittingEditingType] =
    React.useState(false);

  const handleCreateShootType = async (kind: ShootTypeKind) => {
    const shootTypeName = clampTextLength(customShootType).trim();
    if (!shootTypeName) return;

    const contentTypeId = resolveSelectedServiceContentTypeId({
      kind,
      selectedIds: selectedServices,
      availableServices: services,
    });
    if (!contentTypeId) {
      toast.error("Select the matching service first");
      return;
    }

    setIsSubmittingShootType(true);
    try {
      const res = await salesApi.createShootType({
        name: shootTypeName,
        content_type: contentTypeId,
      });

      if (res && !res.error) {
        setCustomShootType("");
        setActiveShootTypeForm(null);
        await fetchShootTypes(selectedServices);
        toast.success("Shoot type added");
      } else {
        console.error(
          "Failed to create shoot type:",
          res?.error || "Unknown error",
        );
        toast.error("Failed to add shoot type");
      }
    } catch (error) {
      console.error("Error creating shoot type:", error);
      toast.error("Failed to add shoot type");
    } finally {
      setIsSubmittingShootType(false);
    }
  };

  const handleCreateEditingType = async () => {
    const editingTypeName = clampTextLength(customEditingType).trim();
    if (!editingTypeName) return;

    const editingTypeCategory = resolveEditingTypeCategory();
    if (!editingTypeCategory) {
      toast.error("Select Editing service first");
      return;
    }

    setIsSubmittingEditingType(true);
    try {
      const res = await salesApi.createAiEditingType({
        category: editingTypeCategory,
        label: editingTypeName,
      });

      if (res && !res.error) {
        const refreshedEditingTypes = await fetchEditingTypes(selectedServices);
        const matchingEditingType = refreshedEditingTypes.find(
          (type) =>
            type.label.trim().toLowerCase() === editingTypeName.toLowerCase() &&
            (type.category === editingTypeCategory || !type.category),
        );

        if (matchingEditingType) {
          setSelectedEditingTypes((prev) =>
            prev.includes(matchingEditingType.id)
              ? prev
              : [...prev, matchingEditingType.id]
          );
        }

        setCustomEditingType("");
        setShowAddEditingTypeForm(false);
        toast.success("Editing type added");
      } else {
        console.error(
          "Failed to create editing type:",
          res?.error || "Unknown error",
        );
        toast.error("Failed to add editing type");
      }
    } catch (error) {
      console.error("Error creating editing type:", error);
      toast.error("Failed to add editing type");
    } finally {
      setIsSubmittingEditingType(false);
    }
  };

  const [isSubmittingAddon, setIsSubmittingAddon] = React.useState(false);

  const handleCreateAddon = async () => {
    const addonName = clampTextLength(customAddonName).trim();
    if (!addonName || !customAddonCost) return;

    setIsSubmittingAddon(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "addon",
        name: addonName,
        default_rate: parseFloat(customAddonCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "fixed",
        rate_unit: "fixed",
      });

      if (res && !res.error) {
        setCustomAddonName("");
        setCustomAddonCost("");
        setShowAddAddonForm(false);
        // Refresh catalog
        await fetchCatalog();
      } else {
        console.error("Failed to create addon:", res?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating addon:", error);
    } finally {
      setIsSubmittingAddon(false);
    }
  };

  const [isSubmittingLogistics, setIsSubmittingLogistics] =
    React.useState(false);

  const handleCreateLogisticsItem = async () => {
    const logisticsName = clampTextLength(customLogisticsName).trim();
    if (!logisticsName || !customLogisticsCost) return;

    setIsSubmittingLogistics(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "logistics",
        name: logisticsName,
        default_rate:
          parseFloat(customLogisticsCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "fixed",
        rate_unit: "fixed",
      });

      if (res && !res.error) {
        setCustomLogisticsName("");
        setCustomLogisticsCost("");
        setShowAddLogisticsForm(false);
        await fetchCatalog();
      } else {
        console.error(
          "Failed to create logistics item:",
          res?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error creating logistics item:", error);
    } finally {
      setIsSubmittingLogistics(false);
    }
  };

  const [isSubmittingLineItem, setIsSubmittingLineItem] = React.useState(false);
  const [isSavingCatalogEdit, setIsSavingCatalogEdit] = React.useState(false);
  const [editCatalogItem, setEditCatalogItem] =
    React.useState<CatalogEditItem | null>(null);
  const [editCatalogName, setEditCatalogName] = React.useState("");
  const [editCatalogCost, setEditCatalogCost] = React.useState("");

  const handleCreateLineItem = async () => {
    if (!customItemName || !customItemCost) return;

    setIsSubmittingLineItem(true);
    try {
      const trimmedName = clampTextLength(customItemName).trim();
      const cost = parseFloat(customItemCost.replace(/[^0-9.]/g, "")) || 0;
      if (!trimmedName) {
        toast.error("Name is required");
        return;
      }

      const newId = `custom_${Date.now()}`;

      setLineItems((prev) => [
        ...prev,
        {
          id: newId,
          label: trimmedName,
          basePrice: cost,
          sourceType: "custom",
          createdAt: new Date().toISOString(),
        },
      ]);
      setLineItemConfigs((prev) => ({ ...prev, [newId]: { price: cost } }));
      setAppliedLineItemConfigs((prev) => ({
        ...prev,
        [newId]: { price: cost },
      }));
      setCustomItemName("");
      setCustomItemCost("");
    } catch (error) {
      console.error("Error creating line item:", error);
    } finally {
      setIsSubmittingLineItem(false);
    }
  };

  const getCatalogEditPayload = (type: CatalogEditType) => {
    if (type === "service") {
      return {
        section_type: "service",
        rate_type: "per_hour",
        rate_unit: "per hour",
      };
    }

    if (type === "line_item") {
      return {
        section_type: "custom",
        rate_type: "flat",
        rate_unit: null,
      };
    }

    return {
      section_type: type,
      rate_type: "flat",
      rate_unit: null,
    };
  };

  const openEditCatalogItem = (item: {
    id: string;
    label: string;
    price?: number;
    basePrice?: number;
  }, type: CatalogEditType) => {
    const numericId = getPositiveCatalogItemId(item.id);
    if (!numericId) {
      toast.error("This item can't be edited.");
      return;
    }

    const priceValue = Number(item.price ?? item.basePrice ?? 0);
    setEditCatalogItem({
      id: String(numericId),
      type,
      label: item.label,
      price: priceValue,
    });
    setEditCatalogName(item.label);
    setEditCatalogCost(
      Number.isFinite(priceValue) ? priceValue.toFixed(2) : "",
    );
  };

  const handleUpdateCatalogItem = async () => {
    if (!editCatalogItem || isSavingCatalogEdit) return;

    const trimmedName = clampTextLength(editCatalogName).trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }

    const numericRate = parseCurrencyInput(editCatalogCost);
    if (!Number.isFinite(numericRate)) {
      toast.error("Enter a valid rate");
      return;
    }

    setIsSavingCatalogEdit(true);
    try {
      const payload = getCatalogEditPayload(editCatalogItem.type);
      const res = await salesApi.updateQuoteCatalog(editCatalogItem.id, {
        ...payload,
        name: trimmedName,
        default_rate: numericRate,
      });

      if (res && !res.error) {
        toast.success(
          `${getCatalogEditItemLabel(editCatalogItem.type)} updated`,
        );
        await fetchCatalog();
        setEditCatalogItem(null);
        setEditCatalogName("");
        setEditCatalogCost("");
      } else {
        toast.error(
          res?.error ||
            `Failed to update ${getCatalogEditItemLabel(
              editCatalogItem.type,
            ).toLowerCase()}`,
        );
      }
    } catch (error) {
      console.error("Error updating catalog item:", error);
      toast.error(
        `Failed to update ${getCatalogEditItemLabel(
          editCatalogItem.type,
        ).toLowerCase()}`,
      );
    } finally {
      setIsSavingCatalogEdit(false);
    }
  };

  const quoteEditorBreadcrumbs = React.useMemo(
    () => ({
      create: isEditMode ? "Edit Quote" : "Create Quote",
    }),
    [isEditMode],
  );

  if (isEditMode && !quoteToEdit && (isLoadingQuoteToEdit || isHydratingQuoteToEdit)) {
    return (
      <div
        className={`quote-editor-theme min-h-screen ${isDark
          ? "quote-editor-theme-dark bg-[#0f0f0f] text-white"
          : "quote-editor-theme-light bg-[#F4F5F7] text-black"
          }`}
      >
        <Topbar
          pathname={pathname}
          breadcrumbOverrides={quoteEditorBreadcrumbs}
          actions={
            view === "tax" ? (
              <Button
                type="button"
                onClick={handleOpenQuoteSummary}
                disabled={!canOpenQuoteSummary}
                className="bg-[#E5D5B8] text-black disabled:opacity-60"
              >
                View Quote Summary
              </Button>
            ) : null
          }
        />

        <div className="px-4 pb-12 pt-6 lg:px-9 lg:pt-8">
          <div className="flex min-h-[420px] items-center justify-center rounded-[18px] border border-[#3D3D3D] bg-[#171717]">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D1AB] border-t-transparent" />
              Loading quote details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`quote-editor-theme min-h-screen ${isDark
        ? "quote-editor-theme-dark bg-[#0f0f0f] text-white"
        : "quote-editor-theme-light bg-[#F4F5F7] text-black"
        }`}
    >
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={quoteEditorBreadcrumbs}
        actions={
          view === "tax" ? (
            <Button
              type="button"
              onClick={handleOpenQuoteSummary}
              disabled={!canOpenQuoteSummary}
              className="bg-[#E5D5B8] text-black disabled:opacity-60"
            >
              View Quote Summary
            </Button>
          ) : null
        }
      />

      <div className="px-4 pb-30 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
        {/* Navigation & Progress Header */}
        <div className="flex justify-between items-center mb-7">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-base text-[#D4D4D4] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-right">
            {view === "tax" && (
              <Button
                type="button"
                onClick={handleOpenQuoteSummary}
                disabled={!canOpenQuoteSummary}
                className="block lg:hidden bg-[#E5D5B8] text-sm h-8 text-black disabled:opacity-60"
              >
                View Quote Summary
              </Button>
            )}
            <span className="hidden lg:block text-base font-semibold text-white">
              Step {stepNumber} - {progressLabel} Completed
            </span>
          </div>
        </div>

        <div className="block lg:hidden mb-2">
          <span className="text-sm font-semibold text-white">
            Step {stepNumber} - {progressLabel} Completed
          </span>
        </div>
        {/* Progress Bars */}
        <div className="flex gap-3 mb-8 lg:mb-9">
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[0] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[1] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[2] }}
            />
          </div>
        </div>

        {/* Main Card */}
        {/* <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] ${view === 'selection' ? 'overflow-visible' : 'p-10 overflow-hidden'}`}> */}
        <div
          className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] overflow-visible`}
        >
          {view === "logistics" ? (
            <div className="">
              <section>
                <div className="p-4 lg:p-8">
                  <h2 className="lg:text-xl font-medium leading-none mb-2 text-white">
                    Logistics
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Manage travel, equipment, permits, and other logistical
                    costs
                  </p>
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-8">
                  {logisticsItems.map((item) => (
                    <div key={item.id} className="relative">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedLogistics.includes(item.id)}
                        onClick={() => toggleSelectedLogistics(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleSelectedLogistics(item.id);
                          }
                        }}
                        className={`group relative flex h-[78px] w-full flex-col items-start overflow-hidden rounded-xl border p-5 pr-14 text-left transition-all lg:h-[98px] lg:rounded-2xl lg:p-6 ${selectedLogistics.includes(item.id)
                          ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                          : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                          }`}
                      >
                        <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditCatalogItem(item, "logistics");
                            }}
                            className="text-zinc-500 hover:text-[#E8D1AB] transition-colors"
                            title="Edit logistics"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteCatalogItem(item.id, "logistics");
                            }}
                            className="text-red-500 hover:text-red-400 transition-colors"
                            title="Delete logistics"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex w-full min-w-0 items-start gap-4">
                          <div
                            className={`w-6 h-6 rounded-[4px] border-[1.5px] mt-0.5 flex items-center justify-center transition-all ${selectedLogistics.includes(item.id)
                              ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                              : "border-zinc-700 bg-transparent"
                              }`}
                          >
                            {selectedLogistics.includes(item.id) && (
                              <Check size={14} strokeWidth={4} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="block w-full truncate font-medium text-base text-white leading-none">
                              {item.label}
                            </div>
                            <div className="block w-full truncate text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                              ${formatAddonDisplayValue(item.basePrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="p-4 lg:p-8 lg:pb-6">
                  <h3 className="lg:text-xl font-medium text-white mb-6">
                    Add Custom Logistics Item
                  </h3>
                  <AnimatePresence>
                    {showAddLogisticsForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6"
                      >
                        <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                          <div className="flex-1 relative w-full">
                            <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                              <span className="text-xs text-[#8A8A8A] font-normal">
                                Item Name
                              </span>
                            </div>
                            <Input
                              placeholder="Eg : Cleaning Services"
                              value={customLogisticsName}
                              onChange={(e) =>
                                setCustomLogisticsName(
                                  clampTextLength(e.target.value),
                                )
                              }
                              maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                              className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                            />
                          </div>
                          <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                            <div className="flex-1 relative">
                              <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                <span className="text-xs text-[#8A8A8A] font-normal">
                                  Cost
                                </span>
                              </div>
                              <Input
                                placeholder="$ 0.00"
                                value={customLogisticsCost}
                                onChange={(e) =>
                                  setCustomLogisticsCost(
                                    sanitizeCurrencyInput(e.target.value),
                                  )
                                }
                                inputMode="decimal"
                                className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                              />
                            </div>
                            <button
                              onClick={handleCreateLogisticsItem}
                              disabled={
                                isSubmittingLogistics ||
                                !customLogisticsName ||
                                !customLogisticsCost
                              }
                              className={`flex-none w-[52px] h-[52px] lg:w-21 lg:h-21 rounded-xl flex items-center justify-center transition-all ${isSubmittingLogistics ||
                                !customLogisticsName ||
                                !customLogisticsCost
                                ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                                : "bg-[#101010] text-[#16A34A]"
                                }`}
                            >
                              {isSubmittingLogistics ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <Check size={24} strokeWidth={3} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button
                    onClick={() => setShowAddLogisticsForm(!showAddLogisticsForm)}
                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add More Logistics
                  </Button>
                </div>

                {selectedLogistics.length > 0 && (
                  <>
                    <hr className="border-t border-[#3D3D3D]" />
                    <section className="p-4 lg:p-8">
                      <div className="mb-4 lg:mb-7">
                        <h2 className="text-base lg:text-xl font-medium text-white">
                          Selected Logistics
                        </h2>
                      </div>

                      <div className="space-y-4 lg:space-y-6">
                        {selectedLogisticsItems.map((item) => {
                          const config = logisticsConfigs[item.id];
                          const hasPendingChanges = hasPendingLogisticsChanges(
                            item.id,
                          );
                          if (!config) return null;

                          return (
                            <div
                              key={item.id}
                              className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-4 lg:p-6 relative overflow-hidden"
                            >
                              <div className="hidden lg:flex items-center justify-between gap-6">
                                <div className="min-w-0 flex-1 space-y-2 pr-2">
                                  <h3
                                    title={item.label}
                                    className="max-w-full truncate text-[18px] font-medium text-white leading-snug"
                                  >
                                    {item.label}
                                  </h3>
                                  <p className="text-[#F0DCB1] text-[15px] font-semibold tracking-tight leading-none">
                                    {formatCurrency(item.basePrice)}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-4">
                                 <div className="relative w-[190px] h-[50px] bg-[#1A1A1F] border border-[#3B3B46] rounded-xl flex items-center px-5 transition-all focus-within:border-[#E8D1AB]">
                                  <span className="text-white text-base font-medium mr-1 opacity-80">$</span>
                                  <input
                                    value={
                                      inputValue[item.id] !== undefined 
                                        ? inputValue[item.id] 
                                        : config.price.toFixed(2)
                                    }
                                    onChange={(e) => {
                                      const raw = parseRawPrice(e.target.value);
                                      setInputValue((prev) => ({ ...prev, [item.id]: raw }));
                                      
                                      const num = parseFloat(raw);
                                      if (!isNaN(num)) {
                                        setLogisticsConfigs((prev) => ({
                                          ...prev,
                                          [item.id]: { ...prev[item.id], price: num },
                                        }));
                                      }
                                    }}
                                    onBlur={() => {
                                      setInputValue((prev) => {
                                        const next = { ...prev };
                                        delete next[item.id];
                                        return next;
                                      });
                                    }}
                                    className="bg-transparent border-0 outline-none text-white font-normal text-base w-full p-0 focus:ring-0"
                                    inputMode="decimal"
                                  />
                                </div>

                                  <div className="flex items-center gap-5 ml-2">
                                    <button
                                      onClick={() => removeSelectedLogistics(item.id)}
                                      className="text-red-500 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        applyLogisticsChanges(item.id, item.label)
                                      }
                                      className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                    >
                                      <Check size={18} strokeWidth={3} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col lg:hidden gap-4">
                                <div className="space-y-1">
                                  <h3 className="text-sm font-medium text-white leading-snug break-words">
                                    {item.label}
                                  </h3>
                                  <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                    {formatCurrency(item.basePrice)}
                                  </p>
                                </div>
                                <hr className="border-t border-[#3D3D3D]" />
                                <div className="flex gap-3 items-center">
                                  <div className="relative flex-1">
                                    <Input
                                      value={
                                        inputValue[item.id] !== undefined
                                          ? inputValue[item.id]
                                          : `$ ${formatAddonDisplayValue(config.price)}`
                                      }
                                      onChange={(e) => {
                                        const raw = sanitizeCurrencyInput(e.target.value);
                                        setInputValue((prev) => ({
                                          ...prev,
                                          [item.id]: `$ ${raw}`,
                                        }));

                                        const numericVal = Number.parseFloat(raw);
                                        if (!Number.isNaN(numericVal)) {
                                          setLogisticsConfigs((prev) => ({
                                            ...prev,
                                            [item.id]: {
                                              ...prev[item.id],
                                              price: numericVal,
                                            },
                                          }));
                                        }
                                      }}
                                      onBlur={() => {
                                        setInputValue((prev) => {
                                          const next = { ...prev };
                                          delete next[item.id];
                                          return next;
                                        });
                                      }}
                                      inputMode="decimal"
                                      className="h-10 bg-[#1A1A1F] border-[#3B3B46] rounded-[10px] text-white text-sm pl-4"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeSelectedLogistics(item.id)}
                                    className="text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      applyLogisticsChanges(item.id, item.label)
                                    }
                                    className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                  >
                                    <Check size={18} strokeWidth={3} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 lg:mt-6 rounded-xl bg-[#2A2A2A] p-4 lg:p-6 flex items-center justify-between">
                        <span className="text-base lg:text-xl font-medium text-white">
                          Total Logistics
                        </span>
                        <span className="text-xl font-semibold tracking-tight text-[#F0DCB1]">
                          ${formatAddonDisplayValue(totalLogisticsCost)}
                        </span>
                      </div>
                    </section>
                  </>
                )}
              </section>
            </div>
          ) : view === "addons" ? (
            <div className="">
              <section>
                <div className="p-4 lg:p-8">
                  <h2 className="text-base lg:text-xl font-medium leading-none mb-2 text-white">
                    Add-ons
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Select additional items to enhance your service offering
                  </p>
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-8">
                  {(addons || []).map((addon) => {
                    return (
                      <div key={addon.id} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            const isSelected = selectedAddons.includes(
                              addon.id,
                            );
                            if (isSelected) {
                              removeSelectedAddon(addon.id);
                            } else {
                              const initialConfig = {
                                quantity: 1,
                                price: addon.price,
                              };
                              setSelectedAddons((prev) => [...prev, addon.id]);
                              setAddonConfigs((prev) => ({
                                ...prev,
                                [addon.id]: initialConfig,
                              }));
                              setAppliedAddonConfigs((prev) => ({
                                ...prev,
                                [addon.id]: initialConfig,
                              }));
                            }
                          }}
                          className={`group relative flex h-[78px] w-full flex-col items-start overflow-hidden rounded-xl border p-5 pr-14 text-left transition-all lg:h-[98px] lg:rounded-2xl lg:p-6 ${selectedAddons.includes(addon.id)
                            // ? "bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                            // : "bg-transparent border-[#303030] hover:border-zinc-700"
                            // }`}

                            //  className={`h-[52px] w-full rounded-xl px-5 pr-11 font-medium transition-all border text-sm lg:text-base tracking-tight text-left flex items-center ${selectedId === type.id
                            ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                            : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                            }`}
                        >
                          <div className="flex w-full min-w-0 items-start gap-4 pr-8">
                            <div
                              className={`w-6 h-6 rounded-[4px] border-[1.5px] mt-0.5 flex items-center justify-center transition-all ${selectedAddons.includes(addon.id)
                                ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                                : "border-zinc-700 bg-transparent"
                                }`}
                            >
                              {selectedAddons.includes(addon.id) && (
                                <Check size={14} strokeWidth={4} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="block w-full truncate font-medium text-base text-white leading-none">
                                {addon.label}
                              </div>
                              <div className="block w-full truncate text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                ${formatAddonDisplayValue(addon.price.toFixed(2))}
                              </div>
                            </div>
                          </div>
                        </button>
                        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCatalogItem(addon, "addon")}
                            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-[#E8D1AB]"
                            title="Edit add-on"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCatalogItem(addon.id, "addon")
                            }
                            className="rounded-md p-1 text-[#FF6467] transition-colors hover:bg-[#FF6467]/10 hover:text-red-500"
                            title="Delete add-on"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6 p-4 lg:p-8 !pt-0">
                  <Button
                    onClick={() => setShowAddAddonForm(!showAddAddonForm)}
                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add More Add-ons
                  </Button>

                  <AnimatePresence>
                    {showAddAddonForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-6"
                      >
                        <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                          <div className="flex-1 relative w-full">
                            <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                              <span className="text-xs text-[#8A8A8A] font-normal">
                                Add-on Name
                              </span>
                            </div>
                            <Input
                              placeholder="Eg : 4K RAW Recording"
                              value={customAddonName}
                              onChange={(e) =>
                                setCustomAddonName(
                                  clampTextLength(e.target.value),
                                )
                              }
                              maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                              className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                            />
                          </div>
                          <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                            <div className="flex-1 relative">
                              <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                <span className="text-xs text-[#8A8A8A] font-normal">
                                  Cost
                                </span>
                              </div>
                              <Input
                                placeholder="$ 0.00"
                                value={customAddonCost}
                                onChange={(e) =>
                                  setCustomAddonCost(
                                    sanitizeCurrencyInput(e.target.value),
                                  )
                                }
                                inputMode="decimal"
                                className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                              />
                            </div>
                            <button
                              onClick={handleCreateAddon}
                              disabled={
                                isSubmittingAddon ||
                                !customAddonName ||
                                !customAddonCost
                              }
                              className={`flex-none w-[52px] h-[52px] lg:w-21 lg:h-21 rounded-xl flex items-center justify-center transition-all ${isSubmittingAddon ||
                                !customAddonName ||
                                !customAddonCost
                                ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                                : "bg-[#101010] text-[#16A34A]"
                                }`}
                            >
                              {isSubmittingAddon ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <Check size={24} strokeWidth={3} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Selected Add-Ons Section */}
              {selectedAddons.length > 0 && (
                <>
                  <hr className="border-t border-[#3D3D3D]" />
                  <section className="p-4 lg:p-8">
                    <div className="mb-4 lg:mb-7">
                      <h2 className="text-base lg:text-xl font-medium text-white">
                        Selected Add-Ons
                      </h2>
                    </div>

                    <div className="space-y-4 lg:space-y-6">
                      {selectedAddons.map((addonId) => {
                        const addon = addons.find((a) => a.id === addonId);
                        const config = addonConfigs[addonId];
                        const hasPendingChanges =
                          hasPendingAddonChanges(addonId);
                        if (!addon || !config) return null;

                        return (
                          <div
                            key={addonId}
                            className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-4 lg:p-6 relative overflow-hidden"
                          >
                            {/* desktop version */}
                            <div className="hidden lg:flex items-center justify-between gap-6">
                              <div className="min-w-0 flex-1 space-y-2 pr-2">
                                <h3
                                  title={addon.label}
                                  className="max-w-full truncate text-[18px] font-medium text-white leading-snug"
                                >
                                  {addon.label}
                                </h3>
                                <p className="text-[#F0DCB1] text-[15px] font-semibold tracking-tight leading-none">
                                  {formatCurrency(addon.price)}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() =>
                                      handleAddonConfigUpdate(
                                        addonId,
                                        "quantity",
                                        config.quantity - 1,
                                      )
                                    }
                                    className="h-[50px] w-[58px] flex items-center justify-center bg-[#F0DCB1] rounded-xl text-black hover:opacity-90 transition-all active:scale-95"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <div className="h-[50px] min-w-[92px] rounded-xl border border-[#3B3B46] bg-[#1A1A1F] px-4 flex flex-col items-center justify-center">
                                    {/* <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A8A8A]">
                                      Qty
                                    </span> */}
                                    <span className="text-base font-medium text-white leading-none">
                                      {config.quantity}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleAddonConfigUpdate(
                                        addonId,
                                        "quantity",
                                        config.quantity + 1,
                                      )
                                    }
                                    className="h-[50px] w-[58px] flex items-center justify-center bg-[#F0DCB1] rounded-xl text-black hover:opacity-90 transition-all active:scale-95"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                </div>

                                {/* Price Override */}
                                <div className="relative w-[190px] h-[50px] bg-[#1A1A1F] border border-[#3B3B46] rounded-xl flex items-center px-5 transition-all focus-within:border-[#E8D1AB]">
                                  <span className="text-white text-base font-medium mr-1 opacity-80">$</span>
                                  <input
                                    value={
                                      inputValue[addonId] !== undefined 
                                        ? inputValue[addonId] 
                                        : config.price.toFixed(2)
                                    }
                                    onChange={(e) => {
                                      const raw = parseRawPrice(e.target.value);
                                      setInputValue((prev) => ({ ...prev, [addonId]: raw }));
                                      
                                      const num = parseFloat(raw);
                                      if (!isNaN(num)) {
                                        handleAddonConfigUpdate(addonId, "price", num);
                                      }
                                    }}
                                    onBlur={() => {
                                      setInputValue((prev) => {
                                        const next = { ...prev };
                                        delete next[addonId];
                                        return next;
                                      });
                                    }}
                                    className="bg-transparent border-0 outline-none text-white font-normal text-base w-full p-0 focus:ring-0"
                                    inputMode="decimal"
                                  />
                                </div>

                                <div className="flex items-center gap-5 ml-2">
                                  <button
                                    onClick={() => removeSelectedAddon(addonId)}
                                    className="text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      applyAddonChanges(addonId, addon.label)
                                    }
                                    className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                  >
                                    <Check size={18} strokeWidth={3} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* mobile version */}
                            <div className="flex flex-col lg:hidden gap-4">
                              <div className="space-y-1">
                                <h3 className="text-sm font-medium text-white leading-snug break-words">
                                  {addon.label}
                                </h3>
                                <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                  {formatCurrency(addon.price)}
                                </p>
                              </div>
                              <hr className="border-t border-[#3D3D3D]" />
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    handleAddonConfigUpdate(
                                      addonId,
                                      "quantity",
                                      config.quantity - 1,
                                    )
                                  }
                                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#F0DCB1] rounded-[10px] text-black hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <div className="h-10 min-w-[84px] rounded-[10px] border border-[#3B3B46] bg-[#1A1A1F] px-3 flex flex-col items-center justify-center">
                                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#8A8A8A]">
                                    Qty
                                  </span>
                                  <span className="text-sm font-medium text-white leading-none">
                                    {config.quantity}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleAddonConfigUpdate(
                                      addonId,
                                      "quantity",
                                      config.quantity + 1,
                                    )
                                  }
                                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#F0DCB1] rounded-[10px] text-black hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                              <div className="flex gap-3 items-center">
                                <div className="relative flex-1">
                                  <Input
                                    value={`$ ${formatAddonDisplayValue(getAddonDraftPrice(addonId))}`}
                                    onChange={(e) =>
                                      handleAddonPriceUpdate(
                                        addonId,
                                        e.target.value,
                                      )
                                    }
                                    inputMode="decimal"
                                    className="h-10 bg-[#1A1A1F] border-[#3B3B46] rounded-[10px] text-white text-sm pl-4"
                                  />
                                </div>
                                <button
                                  onClick={() => removeSelectedAddon(addonId)}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    applyAddonChanges(addonId, addon.label)
                                  }
                                  className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                >
                                  <Check size={18} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 lg:mt-6 rounded-xl bg-[#2A2A2A] p-4 lg:p-6 flex items-center justify-between">
                      <span className="text-base lg:text-xl font-medium text-white">
                        Total Add-Ons
                      </span>
                      <span className="text-xl font-semibold tracking-tight text-[#F0DCB1]">
                        ${formatAddonDisplayValue(totalAddOnsCost)}
                      </span>
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : view === "services" ? (
            <div className="">
              {/* Services Section */}
              <section>
                <div className="px-5 pt-5 lg:px-8 lg:pt-8">
                  <h2 className="text-base lg:text-xl font-medium leading-none mb-2 text-white">
                    Services
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Select services and configure pricing
                  </p>
                </div>
                <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

                <div className="px-5 pb-5 lg:px-8 lg:pb-8 space-y-4 lg:space-y-8 ">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {loadingServices ? (
                      <div className="col-span-3 py-10 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]"></div>
                      </div>
                    ) : (
                      (services || []).map((service) => {
                        const isProtectedService = isProtectedServiceLabel(
                          service.label,
                        );

                        return (
                          <div key={service.id} className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                handleServiceSelect(service.id, service.price)
                              }
                              className={`group relative flex h-[78px] w-full flex-col items-start overflow-hidden rounded-xl border p-5 pr-14 text-left transition-all lg:h-[98px] lg:rounded-2xl lg:p-6 ${selectedServices.includes(service.id)
                                ? "bg-[#1D1A15] border-[#E8D1AB] ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                                : "bg-[#101010] border-[#FFFFFF80] hover:border-white/80"
                                }`}
                            >
                              <div className="mb-2 w-full truncate pr-6 font-medium text-base leading-none text-white">
                                {getServiceDisplayLabel(service.label)}
                              </div>
                              <div className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                ${service.price.toFixed(2)}{" "}
                                <span className="text-[#71717B] font-medium text-xs lowercase ml-1">
                                  per hour
                                </span>
                              </div>
                              {selectedServices.includes(service.id) && (
                                <div
                                  className={`absolute top-6 bg-[#0DC752] text-[#09090B] text-xs font-medium px-4 py-1 rounded-[6px] leading-none ${isProtectedService ? "right-16 lg:right-16" : "right-20 lg:right-20"}`}
                                >
                                  Selected
                                </div>
                              )}
                            </button>
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditCatalogItem(service, "service")}
                                className="text-zinc-500 transition-colors hover:text-[#E8D1AB]"
                                title="Edit service"
                              >
                                <Pencil size={18} />
                              </button>
                              {!isProtectedService && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCatalogItem(service.id, "service")
                                  }
                                  className="text-zinc-500 transition-colors hover:text-red-500"
                                  title="Delete service"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 lg:mt-7 space-y-6">
                    <Button
                      onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                      className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[42px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Add Services
                    </Button>

                    <AnimatePresence>
                      {showAddServiceForm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 md:grid-cols-12 gap-6"
                        >
                          <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 relative w-full">
                              <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                <span className="text-xs text-[#8A8A8A] font-normal">
                                  Service Name
                                </span>
                              </div>
                              <Input
                                placeholder="Eg : Post Production Editing"
                                value={customServiceName}
                                onChange={(e) =>
                                  setCustomServiceName(
                                    clampTextLength(e.target.value),
                                  )
                                }
                                maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                                className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-sm lg:text-base text-white placeholder:text-[#666666]"
                              />
                            </div>
                            <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                              <div className="flex-1 relative">
                                <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                  <span className="text-xs text-[#8A8A8A] font-normal">
                                    Cost
                                  </span>
                                </div>
                                <Input
                                  placeholder="$ 0.00"
                                  value={customServiceCost}
                                  onChange={(e) =>
                                    setCustomServiceCost(
                                      sanitizeCurrencyInput(e.target.value),
                                    )
                                  }
                                  inputMode="decimal"
                                  className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-sm lg:text-base text-white placeholder:text-[#666666]"
                                />
                              </div>
                              <button
                                onClick={handleCreateService}
                                disabled={
                                  isSubmittingService ||
                                  !customServiceName ||
                                  !customServiceCost
                                }
                                className={`flex-none w-[52px] h-[52px] lg:w-21 lg:h-21 rounded-xl flex items-center justify-center transition-all ${isSubmittingService ||
                                  !customServiceName ||
                                  !customServiceCost
                                  ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                                  : "bg-[#101010] text-[#16A34A]"
                                  }`}
                              >
                                {isSubmittingService ? (
                                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                  <Check size={24} strokeWidth={3} />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Conditional Sections based on selection */}
              {selectedServices.length > 0 && (
                <>
                  {/* <div className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"> */}
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Shoot Type Section */}
                    {(hasVideoService || hasPhotoService) && (
                      <div className="">
                        <hr className="border-t border-[#3D3D3D]" />
                        {hasVideoService &&
                          renderShootTypeSection({
                            kind: "video",
                            isExpanded: isVideoShootTypeExpanded,
                            onToggleExpanded: () =>
                              setIsVideoShootTypeExpanded((prev) => !prev),
                            shootTypeOptions: videoShootTypes,
                            selectedId: selectedVideoShootType,
                          })}
                        {hasPhotoService && (
                          <>
                            {hasVideoService && (
                              <hr className="border-t border-[#3D3D3D]" />
                            )}
                            {renderShootTypeSection({
                              kind: "photo",
                              isExpanded: isPhotoShootTypeExpanded,
                              onToggleExpanded: () =>
                                setIsPhotoShootTypeExpanded((prev) => !prev),
                              shootTypeOptions: photoShootTypes,
                              selectedId: selectedPhotoShootType,
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {/* Editing Types Section */}
                    {hasEditingTypeContext && (
                      <div className="">
                        <hr className="border-t border-[#3D3D3D]" />
                        <section className="px-4 py-5 lg:p-8">
                          <button
                            onClick={() =>
                              setIsEditingTypeExpanded(!isEditingTypeExpanded)
                            }
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className="text-base lg:text-xl font-medium text-white">
                              Editing Types
                            </h2>
                            <div className="text-zinc-600 transition-transform duration-300">
                              {isEditingTypeExpanded ? (
                                <ChevronDown size={22} className="rotate-180" />
                              ) : (
                                <ChevronDown size={22} />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isEditingTypeExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {loadingEditingTypes ? (
                                    <div className="col-span-full flex justify-center py-8">
                                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E8D1AB]" />
                                    </div>
                                  ) : editingTypeOptions.length === 0 ? (
                                    <div className="col-span-full rounded-xl border border-dashed border-[#4A4A4A] px-5 py-6 text-sm text-[#8A8A8A]">
                                      No editing types found.
                                    </div>
                                  ) : (
                                    editingTypeOptions.map((type) => {
                                      const canDeleteShootType =
                                        canDeleteShootTypeItem(type);

                                      return (
                                        <div key={type.id} className="relative">
                                          <button
                                            onClick={() =>
                                              setSelectedEditingTypes((prev) =>
                                                prev.includes(type.id)
                                                  ? prev.filter((id) => id !== type.id)
                                                  : [...prev, type.id]
                                              )
                                            }
                                            className={`h-10 w-full lg:h-[52px] px-6 pr-11 rounded-xl font-medium transition-all border text-sm lg:text-base text-center lg:text-left leading-tight tracking-tight ${selectedEditingTypes.includes(type.id)
                                              ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                                              : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                                              }`}
                                          >
                                            <span className="block w-full truncate pr-2">
                                              {type.label}
                                            </span>
                                          </button>
                                          {canDeleteShootType && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteShootType("editing", type.id);
                                              }}
                                              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-500 transition-colors hover:text-red-500"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() =>
                                      setShowAddEditingTypeForm(
                                        !showAddEditingTypeForm,
                                      )
                                    }
                                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                    Add Editing Types
                                  </Button>

                                  <AnimatePresence>
                                    {showAddEditingTypeForm && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex gap-4 items-end"
                                      >
                                        <div className="flex-1 relative">
                                          <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                            <span className="text-xs text-[#8A8A8A] font-normal">
                                              Editing Type Name
                                            </span>
                                          </div>
                                          <Input
                                            placeholder="Eg : Reel Editing..."
                                            value={customEditingType}
                                            onChange={(e) =>
                                              setCustomEditingType(
                                                clampTextLength(e.target.value),
                                              )
                                            }
                                            maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                                            className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleCreateEditingType}
                                          disabled={
                                            isSubmittingEditingType ||
                                            !customEditingType.trim()
                                          }
                                          className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${isSubmittingEditingType ||
                                            !customEditingType.trim()
                                            ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                                            : "bg-[#101010] text-[#16A34A]"
                                            }`}
                                        >
                                          {isSubmittingEditingType ? (
                                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                          ) : (
                                            <Check size={22} strokeWidth={3} />
                                          )}
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>
                      </div>
                    )}

                    {/* Configure Selected Services */}
                    <>
                      <hr className="border-t border-[#3D3D3D]" />
                      <section className="px-4 py-5 lg:p-8">
                        <div className="mb-4 lg:mb-8">
                          <h2 className="text-base lg:text-xl font-medium text-white">
                            Configure Selected Services
                          </h2>
                        </div>

                        <div className="space-y-4 lg:space-y-6">
                          {(selectedServices || []).flatMap((serviceId) => {
                            const service = services.find((s) => s.id === serviceId);
                            const config = serviceConfigs[serviceId];
                            if (!service || !config) return [];

                            const isEditingService = isEditingServiceLabel(service.label);
                            const editingTypeIds = isEditingService
                              ? (selectedEditingTypes.length > 0 ? selectedEditingTypes : [""])
                              : [""];

                            return editingTypeIds.map((editingTypeId, index) => {
                              const shootTypeKind = resolveServiceShootTypeKind(
                                service.label,
                              );
                              const shootTypeLabel =
                                shootTypeKind === "video"
                                  ? selectedVideoShootTypeLabel
                                  : shootTypeKind === "photo"
                                    ? selectedPhotoShootTypeLabel
                                    : "";
                              const editingLabel = editingTypeId
                                ? getSelectedShootTypeLabel(editingTypeOptions, editingTypeId)
                                : "";
                              const editingConfig = editingTypeId
                                ? editingTypeConfigs[editingTypeId]
                                : null;
                              const quantity = Math.max(1, Number(editingConfig?.quantity ?? config.crewSize ?? 1));
                              const estimatedPrice = Math.max(0, Number(editingConfig?.estimatedPrice ?? config.estimatedPrice ?? 0));
                              const serviceTotal = isEditingService
                                ? quantity * estimatedPrice
                                : config.duration *
                                  config.crewSize *
                                  config.estimatedPrice;
                              const cardKey = isEditingService
                                ? `${serviceId}-${editingTypeId || "editing"}-${index}`
                                : serviceId;

                              return (
                                <div
                                  key={cardKey}
                                  className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-6 lg:px-7 lg:py-6 relative overflow-hidden"
                                >
                                <div className="mb-4 flex items-start justify-between gap-4 lg:mb-8">
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <h3 className="flex flex-wrap items-center gap-1.5 break-words text-[16px] font-medium leading-snug text-white">
                                      {isEditingServiceLabel(service.label) ? (
                                        <>
                                          Editing Type - <span className="break-words text-[#8E826A]">{editingLabel || "Not selected"}</span>
                                        </>
                                      ) : shootTypeLabel ? (
                                        <>
                                          {getServiceDisplayLabel(service.label)} -{" "}
                                          <span className="break-words text-[#8E826A]">
                                            ({shootTypeLabel})
                                          </span>
                                        </>
                                      ) : (
                                        <>{getServiceDisplayLabel(service.label)}</>
                                      )}
                                    </h3>
                                    <p className="text-[#8A8A8A] text-xs font-normal">
                                      Base: ${service.price.toFixed(2)} per hour
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-5">
                                    <div className="hidden lg:flex flex-col items-end gap-1">
                                      <span className="text-[#7B7B85] text-xs font-normal">
                                        Total
                                      </span>
                                      <span className="text-xl font-semibold text-[#F0DCB1] tracking-tight leading-none">
                                        ${serviceTotal.toFixed(2).toLocaleString()}
                                        {/* service.price.toFixed(2) */}
                                      </span>
                                    </div>
                                    {index === 0 && (
                                      <button
                                        onClick={() =>
                                          setSelectedServices((prev) =>
                                            prev.filter((id) => id !== serviceId),
                                          )
                                        }
                                        className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-transparent flex items-center justify-center text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="my-3 lg:my-6 border-t border-[#303030]" />

                                <div className="flex lg:hidden justify-between items-center gap-1">
                                  <span className="text-[#7B7B85] text-sm font-normal">
                                    Total
                                  </span>
                                  <span className="font-semibold text-[#F0DCB1] tracking-tight leading-none">
                                    ${serviceTotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="lg:hidden my-4 lg:my-8 border-t border-[#303030]" />

                                <div className={`grid grid-cols-1 ${isEditingService ? "md:grid-cols-2" : "md:grid-cols-3"} gap-3 lg:gap-6`}>
                                  {!isEditingService && (
                                    <div className="flex flex-col gap-2">
                                      <span className="text-sm font-normal text-[#9A9AA4]">
                                        Duration (hours)
                                      </span>
                                      <div className="flex items-center gap-2 h-9">
                                        <button
                                          onClick={() =>
                                            handleConfigUpdate(
                                              serviceId,
                                              "duration",
                                              config.duration - 0.5,
                                            )
                                          }
                                          className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                        >
                                          <Minus size={16} strokeWidth={2.5} />
                                        </button>
                                        <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                          {config.duration}
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleConfigUpdate(
                                              serviceId,
                                              "duration",
                                              config.duration + 0.5,
                                            )
                                          }
                                          className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                        >
                                          <Plus size={16} strokeWidth={2.5} />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-2">
                                    <span className="text-sm font-normal text-[#9A9AA4]">
                                      {isEditingService ? "Quantity" : "Crew Size"}
                                    </span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() =>
                                          isEditingService
                                            ? setEditingTypeConfigs((prev) => ({
                                              ...prev,
                                              [editingTypeId]: {
                                                quantity: Math.max(1, quantity - 1),
                                                estimatedPrice,
                                              },
                                            }))
                                            : handleConfigUpdate(
                                              serviceId,
                                              "crewSize",
                                              config.crewSize - 1,
                                            )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {isEditingService ? quantity : config.crewSize}
                                      </div>
                                      <button
                                        onClick={() =>
                                          isEditingService
                                            ? setEditingTypeConfigs((prev) => ({
                                              ...prev,
                                              [editingTypeId]: {
                                                quantity: Math.max(1, quantity + 1),
                                                estimatedPrice,
                                              },
                                            }))
                                            : handleConfigUpdate(
                                              serviceId,
                                              "crewSize",
                                              config.crewSize + 1,
                                            )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Estimated Pricing */}
                                  <div className="flex flex-col gap-2">
                                    <span className="text-sm font-normal text-[#9A9AA4]">
                                      Estimated Pricing
                                    </span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = isEditingService ? estimatedPrice : config.estimatedPrice;
                                          const val = Math.max(0, current - 50);
                                          if (isEditingService) {
                                            setEditingTypeConfigs(p => ({ ...p, [editingTypeId]: { ...p[editingTypeId], estimatedPrice: val } }));
                                          } else {
                                            handleConfigUpdate(serviceId, "estimatedPrice", val);
                                          }
                                        }}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>

                                      <div className="flex-1 h-full bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] flex items-center justify-center group focus-within:border-[#E8D1AB] transition-all px-2">
                                        
                                        <span className="text-white text-sm font-medium mr-1 opacity-80">$</span>
                                        
                                        <input
                                          value={
                                            inputValue[cardKey] !== undefined 
                                              ? inputValue[cardKey] 
                                              : (isEditingService ? estimatedPrice : config.estimatedPrice).toFixed(2)
                                          }
                                          onChange={(e) => {
                                            const raw = parseRawPrice(e.target.value);
                                            setInputValue((prev) => ({ ...prev, [cardKey]: raw }));
                                            
                                            const num = parseFloat(raw);
                                            if (!isNaN(num)) {
                                              if (isEditingService) {
                                                setEditingTypeConfigs(p => ({ ...p, [editingTypeId]: { ...p[editingTypeId], estimatedPrice: num } }));
                                              } else {
                                                handleConfigUpdate(serviceId, "estimatedPrice", num);
                                              }
                                            }
                                          }}
                                          onBlur={() => {
                                            setInputValue((prev) => {
                                              const next = { ...prev };
                                              delete next[cardKey];
                                              return next;
                                            });
                                          }}
                                          className="bg-transparent border-0 outline-none text-white font-normal text-sm w-[70px] p-0 focus:ring-0"
                                          inputMode="decimal"
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = isEditingService ? estimatedPrice : config.estimatedPrice;
                                          const val = current + 50;
                                          if (isEditingService) {
                                            setEditingTypeConfigs(p => ({ ...p, [editingTypeId]: { ...p[editingTypeId], estimatedPrice: val } }));
                                          } else {
                                            handleConfigUpdate(serviceId, "estimatedPrice", val);
                                          }
                                        }}
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              );
                            });
                          })}
                        </div>
                      </section>
                    </>
                  </div>
                </>
              )}
            </div>
          ) : view === "selection" ? (
            /* Client Selector View */
            <div>
              <div className="px-7 pt-7 lg:px-8 lg:pt-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Client Information
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Select an existing client or create a new one
                </p>
              </div>

              <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

              <div className="px-7 pb-9 lg:px-8 lg:pb-10">
                <div className="relative max-w-full">
                  <div className="absolute -top-3 left-5 z-10 px-3 bg-[#171717]">
                    <span className="text-sm text-[#A1A1AA] font-normal tracking-[0.01em]">
                      Select Client
                    </span>
                  </div>

                  <div className="relative border border-[#4A4A4A] rounded-xl bg-transparent">
                    <button
                      onClick={() => {
                        setIsDetailsClientDropdownOpen(false);
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      className={`w-full group bg-transparent rounded-xl px-6 py-6 flex justify-between items-center transition-all ${isDropdownOpen ? "ring-1 ring-[#8E826A]/30" : ""}`}
                    >
                      {selectedClient ? (
                        <span className="flex min-w-0 items-center gap-2 text-white text-[16px] font-normal">
                          <span className="truncate">
                            {getClientDisplayName(selectedClient)}
                          </span>
                          <ClientTypeBadge
                            clientType={selectedClient.client_type}
                            userId={selectedClient.user_id}
                            isDark={isDark}
                          />
                        </span>
                      ) : (
                        <span className="text-[#6B6B6B] text-[16px] font-normal">
                          Choose a Client...
                        </span>
                      )}
                      <ChevronDown
                        size={20}
                        className={`text-[#E5E5E5] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen &&
                        renderClientDropdownContent({
                          onClose: closeClientDropdowns,
                          advanceToDetails: true,
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : view === "customlineitems" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Custom Line Items
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Add any custom charges or fees not covered by services or
                  add-ons
                </p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 relative w-full">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-xs text-[#8A8A8A] font-normal">
                          Item Name
                        </span>
                      </div>
                      <Input
                        placeholder="Eg : Consulting Fee, Rush Delivery..."
                        value={customItemName}
                        onChange={(e) =>
                          setCustomItemName(clampTextLength(e.target.value))
                        }
                        maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                        className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                      />
                    </div>
                    <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            Cost
                          </span>
                        </div>
                      <Input
                        placeholder="$ 0.00"
                        value={customItemCost}
                        onChange={(e) =>
                          setCustomItemCost(sanitizeCurrencyInput(e.target.value))
                        }
                        inputMode="decimal"
                        className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                      />
                      </div>
                      <button
                        onClick={handleCreateLineItem}
                        disabled={
                          isSubmittingLineItem ||
                          !customItemName ||
                          !customItemCost
                        }
                        className={`flex-none w-[52px] h-[52px] lg:w-21 lg:h-21 rounded-xl flex items-center justify-center transition-all ${isSubmittingLineItem ||
                          !customItemName ||
                          !customItemCost
                          ? "bg-[#101010] text-[#16A34A] cursor-not-allowed opacity-50"
                          : "bg-[#101010] text-[#16A34A]"
                          }`}
                      >
                        {isSubmittingLineItem ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Check size={24} strokeWidth={3} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              {
                lineItems.length > 0 &&
                <div className="space-y-4 lg:space-y-6 p-4 lg:p-8 lg:pb-6">
                  {lineItems.map((item) => {
                    const config = lineItemConfigs[item.id];
                    const hasPendingChanges = hasPendingLineItemChanges(item.id);
                    const isProtectedLineItem = isProtectedLineItemLabel(
                      item.label,
                    );
                    const canEditLineItem = Boolean(
                      getPositiveCatalogItemId(item.id),
                    );

                    return (
                      <div
                        key={item.id}
                        className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-xl p-4 lg:p-5 relative overflow-hidden"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 flex-1 pr-2 lg:flex lg:flex-col lg:justify-between lg:gap-1">
                            <h3
                              title={item.label}
                              className="max-w-full truncate text-base font-medium text-white leading-snug"
                            >
                              {item.label}
                            </h3>
                            <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                              $
                              {item.basePrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>

                          <hr className="lg:hidden border-t border-[#3D3D3D]" />

                          <div className="flex shrink-0 items-center gap-6">
                            <div className="relative w-2/3 lg:w-36">
                              {/* <Input
                                value={`$ ${config?.price || 0}`}
                                onChange={(e) => {
                                  const val =
                                    parseFloat(
                                      e.target.value.replace("$ ", ""),
                                    ) || 0;
                                  setLineItemConfigs((prev) => ({
                                    ...prev,
                                    [item.id]: { price: val },
                                  }));
                                }}
                                className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
                              /> */}
                              <Input
                                value={
                                  inputValue[item.id] !== undefined
                                    ? inputValue[item.id]
                                    : (config?.price || 0).toFixed(2)
                                }
                                onChange={(e) => {
                                  const raw = parseRawPrice(e.target.value);
                                  setInputValue((prev) => ({ ...prev, [item.id]: raw }));

                                  const numericVal = parseFloat(raw);
                                  if (!isNaN(numericVal)) {
                                    setLineItemConfigs((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        price: numericVal,
                                      },
                                    }));
                                  }
                                }}
                                onBlur={() => {
                                  setInputValue((prev) => {
                                    const next = { ...prev };
                                    delete next[item.id];
                                    return next;
                                  });
                                }}
                                className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
                                inputMode="decimal"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              {canEditLineItem && (
                                <button
                                  onClick={() =>
                                    openEditCatalogItem(item, "line_item")
                                  }
                                  className="text-zinc-500 hover:text-[#E8D1AB] transition-colors"
                                  title="Edit line item"
                                >
                                  <Pencil size={18} />
                                </button>
                              )}
                              {!isProtectedLineItem && (
                                <button
                                  onClick={() =>
                                    handleDeleteCatalogItem(item.id, "line_item")
                                  }
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  applyLineItemChanges(item.id, item.label)
                                }
                                className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-700/70 hover:text-green-600"}`}
                              >
                                <Check size={18} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }

              <div className={`m-4 lg:m-8 bg-[#282727] rounded-xl p-4 lg:p-6 flex justify-between items-center border border-[#FFFFFF80]/50 ${lineItems.length > 0 ? "!mt-0" : ""}`}>
                <span className="text-sm lg:text-xl font-medium text-[#FFF]">
                  Total Custom Line Items
                </span>
                <span className="text-lg lg:text-2xl font-bold text-[#E8D1AB] tracking-tight">
                  $
                  {totalLineItemsCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ) : view === "discounts" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Discounts
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Add any custom charges or fees not covered by services or
                  add-ons
                </p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-8">
                <div
                  className={`w-full p-4 lg:p-5 rounded-2xl border transition-colors duration-300 flex items-center justify-between bg-[#101010] border-[#FFFFFF80]`}
                  style={{
                    fontFamily: "var(--font-instrument-sans), sans-serif",
                  }}
                >
                  <div className="lg:space-y-1">
                    <h3
                      className={`text-sm lg:text-lg font-medium tracking-tight text-white`}
                    >
                      Apply Discount
                    </h3>
                    <p className={`text-sm text-[#888888]`}>
                      Add a discount to this quotation
                    </p>
                  </div>

                  {/* Custom Toggle Switch */}
                  <button
                    onClick={handleDiscountToggle}
                    className={`relative w-12 h-[28px] rounded-lg p-1 transition-colors duration-300 flex items-center ${discountEnabled ? "bg-[#E8D1AB]" : "bg-[#333333]"
                      }`}
                  >
                    <motion.div
                      animate={{ x: discountEnabled ? 24 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className={`w-5 h-5 rounded-md shadow-sm transition-colors duration-300 ${discountEnabled ? "bg-white" : "bg-white"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {discountEnabled ? (
                <>
                  <hr className="border-t border-[#3D3D3D]" />
                  <div className="p-4 lg:p-8">
                    <h3
                      className={`text-base lg:text-lg font-medium tracking-tight text-white`}
                    >
                      Discount Type
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 mt-3 lg:mt-6 mb-6 lg:mb-8">
                      {/* Percentage Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("percentage")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "percentage"
                          ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                          : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                          }`}
                      >
                        <div
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "percentage"
                            ? "bg-[#E8D1AB] text-black"
                            : "bg-[#3F3F47] text-[#888888]"
                            }`}
                        >
                          <Percent size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Percentage
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            % off subtotal
                          </p>
                        </div>
                      </button>

                      {/* Fixed Amount Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("fixed")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${discountType === "fixed"
                          ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                          : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                          }`}
                      >
                        <div
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${discountType === "fixed"
                            ? "bg-[#E8D1AB] text-black"
                            : "bg-[#3F3F47] text-[#888888]"
                            }`}
                        >
                          <DollarSign size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Fixed Amount
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            $ off subtotal
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="md:col-span-8 relative">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-xs text-[#8A8A8A] font-normal">
                          Discount Value
                        </span>
                      </div>
                      <Input
                        placeholder="0.00"
                        value={discountValue}
                        onChange={(e) => handleDiscountValueChange(e.target.value, maxDiscountValue)}
                        onBlur={() => handleDiscountValueBlur(maxDiscountValue)}
                        className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                      />
                    </div>

                    <div className="my-6 flex flex-col gap-2">
                      <div className="flex justify-between text-[#9F9FA9] ">
                        <p>Subtotal</p>
                        <p>{formatCurrency(quoteSubtotal)}</p>
                      </div>
                      <div className="flex justify-between text-[#E8D1AB] font-medium ">
                        <p>Discount Applied </p>
                        <p>- {formatCurrency(discountAmount)}</p>
                      </div>
                      <div className="flex justify-between text-[#9F9FA9] ">
                        <p>Total After Discount</p>
                        <p>{formatCurrency(discountedSubtotal)}</p>
                      </div>
                    </div>

                    <div className="bg-[#282727] rounded-xl p-4 lg:p-6 flex justify-between items-center ">
                      <span className="text-sm lg:text-xl font-medium text-white">
                        After Discount
                      </span>
                      <span className="text-lg lg:text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                        {formatCurrency(totalAfterDiscount)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-5 items-center justify-center my-4 lg:my-11">
                  <Image
                    src={"/images/misc/DiscountTag.svg"}
                    width={132}
                    height={132}
                    alt="Discount Tag"
                  />
                  <p className="text-white text-base">
                    No discount applied to this quote
                  </p>
                </div>
              )}
            </div>
          ) : view === "tax" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Tax
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Configure tax rate and type for this quotation
                </p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-8">
                <h3
                  className={`text-base lg:text-lg font-medium tracking-tight text-white`}
                >
                  Common Tax Rates
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-3 lg:mt-6 ">
                  <button
                    onClick={() => {
                      setSelectedTax(0);
                      setShowCustomTax(false);
                      setTaxRate(0);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 0
                      ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                      : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                      }`}
                  >
                    <div>
                      <p
                        className={`${(selectedTax === 0 && !showCustomTax) ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        0 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(5);
                      setTaxRate(5);
                      setShowCustomTax(false);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 5
                      ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner" : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"}
                      `}
                  >
                    <div>
                      <p
                        className={`${(selectedTax === 5 && !showCustomTax) ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(8.5);
                      setTaxRate(8.5);
                      setShowCustomTax(false);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 8.5
                      ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                      : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                      }`}
                  >
                    <div>
                      <p
                        className={`${(selectedTax === 8.5 && !showCustomTax) ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        8.5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(10);
                      setTaxRate(10);
                      setShowCustomTax(false);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${selectedTax === 10
                      ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                      : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                      }`}
                  >
                    <div>
                      <p className={`${(selectedTax === 10 && !showCustomTax) ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}>
                        10 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomTax(true);
                      setSelectedTax(-1);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${showCustomTax
                      ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                      : "bg-transparent border-[#FFFFFF80] text-[#9F9FA9] hover:border-white/80"
                      }`}
                  >
                    <div>
                      <p className={`${showCustomTax ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}>
                        Add Custom Tax Rate
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {
                showCustomTax &&
                <>
                  <hr className="border-t border-[#3D3D3D]" />
                  <div className="w-full p-4 lg:p-8">
                    <h2 className="text-base lg:text-lg font-medium text-white mb-4 lg:mb-6">
                      Custom Tax Rate
                    </h2>
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-3 w-full">
                      <div className="w-full relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            Tax Rate (%)
                          </span>
                        </div>
                        <Input
                          placeholder="0.00"
                          value={taxRate === 0 || taxRate === "" ? "" : String(taxRate)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              setTaxRate(val);

                              const numericTax = parseFloat(val);
                              if (!isNaN(numericTax)) {
                                const presets = [0, 5, 8.5, 10];
                                if (presets.includes(numericTax) && !val.endsWith(".")) {
                                  setSelectedTax(numericTax);
                                  setShowCustomTax(false);
                                } else {
                                  setSelectedTax(-1);
                                  setShowCustomTax(true);
                                }
                              }
                            }
                          }}
                          // Clean up the value when the user clicks away
                          onBlur={() => {
                            setTaxRate(parseFloat(taxRate.toString()) || 0);
                          }}
                          className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                      <div className="w-full relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            Tax Type
                          </span>
                        </div>
                        <Input
                          placeholder="Sales Tax"
                          value={taxType}
                          onChange={(e) => setTaxType(e.target.value)}
                          className="h-15 lg:h-21 bg-transparent border-[#4A4A4A] rounded-xl focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                    </div>
                  </div>
                </>
              }

              <hr className="border-t border-[#3D3D3D]" />
              <div className="p-4 lg:p-8">
                <h3
                  className={`text-base lg:text-lg font-medium tracking-tight text-white mb-3 lg:mb-6`}
                >
                  Tax Calculation
                </h3>

                <div className="bg-[#282727] rounded-xl p-4 lg:p-6 ">
                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">
                      Subtotal
                    </span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      {formatCurrency(quoteSubtotal)}
                    </span>
                  </div>
                  <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">
                      Discount Applied
                    </span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                  <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />
                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">Total After Discount</span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      {formatCurrency(discountedSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">{`${taxLabel} (${normalizedTaxRate}%)`}</span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2 mb-2">
                    <span className="text-sm lg:text-base text-white font-medium">
                      Amount After Tax
                    </span>
                    <span className="text-sm lg:text-base text-white font-medium tracking-tight">
                      {formatCurrency(totalAfterTax)}
                    </span>
                  </div>
                  {additionalPaymentDetails ? (
                    <>
                      <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm lg:text-base text-[#9F9FA9]">
                            Previously Paid
                          </span>
                          <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                            {formatCurrency(additionalPaymentDetails.previouslyPaidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm lg:text-base text-[#9F9FA9]">
                            Additional Amount
                          </span>
                          <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                            {formatCurrency(additionalPaymentDetails.additionalAmount)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />

                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-xl font-medium text-white">
                      Final Total
                    </span>
                    <span className="text-sm lg:text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                      {formatCurrency(totalAfterTax)}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* Client Details View */
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="px-5 pt-5 lg:px-8 lg:pt-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Client Information
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Select an existing client or create a new one
                </p>
              </div>
              <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

              <div className="px-5 pt-4 pb-5 lg:px-8 lg:pb-10 lg:pt-2 space-y-6 lg:space-y-8 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Client Name*
                      </span>
                    </div>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 pr-14 text-sm lg:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsDetailsClientDropdownOpen((prev) => !prev);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E5E5E5] transition-colors hover:text-white"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isDetailsClientDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isDetailsClientDropdownOpen &&
                        renderClientDropdownContent({
                          onClose: closeClientDropdowns,
                          advanceToDetails: false,
                        })}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Email ID*
                      </span>
                    </div>
                    <Input
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 text-sm lg:text-base"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Phone Number*
                      </span>
                    </div>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="relative">
                  <LocationPicker
                    value={address}
                    onChange={(selectedAddress) => setAddress(selectedAddress)}
                    placeholder="Search for an address"
                    label="Address*"
                    colors={isDark ? darkThemeColors : undefined}
                  />
                </div>

                <div className="relative">
                  <div className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
                    <span className={`text-sm font-medium ${isDark ? "text-[#D3D3D3]" : "text-[#71717B]"}`}>
                      Project Description*
                    </span>
                  </div>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    autoComplete="off"
                    data-1p-ignore="true"
                    placeholder="Describe the project scope and requirements....."
                    className={`min-h-[120px] rounded-xl p-6 pt-8 text-sm lg:text-base ${isDark
                      // ? "bg-[#171717] border-[#FFFFFF80] text-white placeholder:text-[#FFFFFF4D] focus:border-[#E8D1AB]/50"
                      ? "!border-[#FFFFFF80] !bg-[#171717] !text-white !placeholder:text-[#FFFFFF4D] !focus:border-[#E8D1AB]/50"
                      : "!bg-white !border-[#D7D7D7] !text-black !placeholder:text-[#71717B] !focus:border-[#E8D1AB] !hover:border-[#C9A86A]"
                      }`}
                  />
                </div>
                {/* <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Phone Number*</span>
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-16 bg-transparent border-[#FFFFFF80] rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div> */}
                <div>
                  <h3 className="lg:text-xl font-semibold mb-6">
                    Quote Validity
                  </h3>
                  {(() => {
                    const isCustomValiditySelected = validityDays === "custom";

                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {[3, 7, 10].map((days: number) => (
                            <button
                              key={days}
                              onClick={() => handleValiditySelect(days)}
                              className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${validityDays === days
                                ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB]"
                                : "bg-transparent border-[#FFFFFF80] text-zinc-500 hover:border-zinc-700"
                                }`}
                            >
                              {days} Days
                            </button>
                          ))}
                          <button
                            onClick={() => handleValiditySelect("custom")}
                            className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${validityDays === "custom"
                              ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB]"
                              : "bg-transparent border-[#FFFFFF80] text-zinc-500 hover:border-zinc-700"
                              }`}
                          >
                            Add Custom Date
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Check size={16} className="text-[#E8D1AB]" />
                          <p className="text-[#E8D1AB]/80 font-medium">
                            This quote is valid for{" "}
                            {validityDays === "custom"
                              ? differenceInDays(
                                startOfDay(parseISO(validUntil)),
                                startOfDay(new Date()),
                              )
                              : validityDays}{" "}
                            days from today.

                            {
                              validityDays !== "custom" &&
                              <span className="ml-2 text-[#E8D1AB]/80 font-medium">
                                Quote valid until <strong>{format(parseISO(validUntil), "MM-dd-yyyy")}</strong>
                              </span>
                            }
                          </p>
                        </div>

                        {
                          validityDays === "custom" &&
                          <div className="relative mt-8">
                            <div
                              className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"
                                }`}
                            >
                              <span
                                className={`text-sm font-medium ${isDark ? "text-[#D3D3D3]" : "text-[#71717B]"
                                  }`}
                              >
                                Quote Valid Until*
                              </span>
                            </div>
                            <DatePicker
                              label=""
                              value={parseISO(validUntil)}
                              onChange={(date) => {
                                if (date && isValid(date)) {
                                  setValidUntil(format(date, "yyyy-MM-dd"));
                                }
                              }}
                              disabled={validityDays !== "custom"}
                              format="MM-dd-yyyy"
                              colors={{
                                inputBackground: isCustomValiditySelected
                                  ? isDark
                                    ? "#1D1A15"
                                    : "#FFF7E6"
                                  : "transparent",
                                inputText: isCustomValiditySelected
                                  ? isDark
                                    ? "#E8D1AB"
                                    : "#171717"
                                  : isDark
                                    ? "#F5F5F5"
                                    : "#171717",
                                inputDisabled: isDark
                                  ? "rgba(214, 195, 157, 0.9)"
                                  : "rgba(23, 23, 23, 0.65)",
                                iconColor: isCustomValiditySelected
                                  ? "#E8D1AB"
                                  : isDark
                                    ? "#FFFFFF"
                                    : "#171717",
                                labelText: isCustomValiditySelected
                                  ? isDark
                                    ? "#E8D1AB"
                                    : "#171717"
                                  : "rgba(113, 113, 122, 1)",
                                inputBorder: isDark ? "#FFFFFF80" : "#E8D1AB",
                                inputBorderHover: isDark ? "#FFFFFF" : "#BEBEBE",
                                // inputBorder: isDark
                                //     ? "#FFFFFF80"
                                //     : "#E8D1AB",
                                //   // : isDark
                                //   //   ? "rgba(39, 39, 42, 1)"
                                //   //   : "#D7D7D7",
                                // inputBorderHover: isCustomValiditySelected
                                //   ? "#E8D1AB"
                                //   : isDark
                                //     ? "rgba(63, 63, 70, 1)"
                                //     : "#BEBEBE",
                                inputBorderFocus: "#E8D1AB",
                              }}
                              sx={{
                                height: "64px", // h-16
                                borderRadius: "12px", // rounded-xl
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: isCustomValiditySelected
                                    ? isDark
                                      ? "#1D1A15"
                                      : "#FFF7E6"
                                    : "transparent",
                                  borderRadius: "12px",
                                  paddingLeft: "10px",
                                  "& fieldset": {
                                    borderColor: isDark ? "#FFFFFF80 !important" : "#E8D1AB !important",
                                    borderWidth: "1px !important",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: isDark ? "#FFFFFF !important" : "#BEBEBE !important",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#E8D1AB !important",
                                    borderWidth: "2px !important",
                                  },
                                },
                                "& .MuiInputBase-input": {
                                  fontSize: "16px",
                                  fontWeight: "500", // font-medium
                                  color: isCustomValiditySelected
                                    ? isDark
                                      ? "#E8D1AB"
                                      : "#171717"
                                    : "rgba(113, 113, 122, 1)",
                                },
                                "& .MuiInputBase-input.Mui-disabled": {
                                  WebkitTextFillColor: isDark
                                    ? "rgba(214, 195, 157, 0.9)"
                                    : "rgba(23, 23, 23, 0.65)",
                                  color: isDark
                                    ? "rgba(214, 195, 157, 0.9)"
                                    : "rgba(23, 23, 23, 0.65)",
                                  opacity: 1,
                                },
                                "& .MuiSvgIcon-root": {
                                  color: isCustomValiditySelected
                                    ? "#E8D1AB"
                                    : isDark
                                      ? "#FFFFFF"
                                      : "#171717",
                                },
                                "& .Mui-disabled .MuiSvgIcon-root": {
                                  color: isDark ? "#FFFFFF" : "#171717",
                                  opacity: 1,
                                },
                              }}
                              labelSx={{
                                position: "absolute",
                                top: "-10px",
                                left: "16px",
                                zIndex: 10,
                                backgroundColor: isDark ? "#171717" : "#FFFFFF",
                                padding: "0 8px",
                                fontSize: "12px", // text-xs
                                fontWeight: "500", // font-medium
                                color: isCustomValiditySelected
                                  ? isDark
                                    ? "#E8D1AB"
                                    : "#171717"
                                  : "rgba(113, 113, 122, 1)",
                              }}
                            />
                          </div>
                        }

                        {/* <div className="relative">
                          <div
                            className={`absolute -top-3 left-4 z-10 px-2 ${isDark ? "bg-[#171717]" : "bg-white"
                              }`}
                          >
                            <span
                              className={`text-sm font-medium ${isDark ? "text-[#D3D3D3]" : "text-[#71717B]"
                                }`}
                            >
                              Quote Valid Until*
                            </span>
                          </div>
                          <DatePicker
                            label=""
                            value={parseISO(validUntil)}
                            onChange={(date) => {
                              if (date && isValid(date)) {
                                setValidUntil(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            disabled={validityDays !== "custom"}
                            format="MM-dd-yyyy"
                            colors={{
                              inputBackground: isCustomValiditySelected
                                ? isDark
                                  ? "#1D1A15"
                                  : "#FFF7E6"
                                : "transparent",
                              inputText: isCustomValiditySelected
                                ? isDark
                                  ? "#E8D1AB"
                                  : "#171717"
                                : isDark
                                  ? "#F5F5F5"
                                  : "#171717",
                              inputDisabled: isDark
                                ? "rgba(214, 195, 157, 0.9)"
                                : "rgba(23, 23, 23, 0.65)",
                              iconColor: isCustomValiditySelected
                                ? "#E8D1AB"
                                : isDark
                                  ? "#FFFFFF"
                                  : "#171717",
                              labelText: isCustomValiditySelected
                                ? isDark
                                  ? "#E8D1AB"
                                  : "#171717"
                                : "rgba(113, 113, 122, 1)",
                              inputBorder: isDark ? "#FFFFFF80" : "#E8D1AB",
                              inputBorderHover: isDark ? "#FFFFFF" : "#BEBEBE",
                              // inputBorder: isDark
                              //     ? "#FFFFFF80"
                              //     : "#E8D1AB",
                              //   // : isDark
                              //   //   ? "rgba(39, 39, 42, 1)"
                              //   //   : "#D7D7D7",
                              // inputBorderHover: isCustomValiditySelected
                              //   ? "#E8D1AB"
                              //   : isDark
                              //     ? "rgba(63, 63, 70, 1)"
                              //     : "#BEBEBE",
                              inputBorderFocus: "#E8D1AB",
                            }}
                            sx={{
                              height: "64px", // h-16
                              borderRadius: "12px", // rounded-xl
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: isCustomValiditySelected
                                  ? isDark
                                    ? "#1D1A15"
                                    : "#FFF7E6"
                                  : "transparent",
                                borderRadius: "12px",
                                paddingLeft: "10px",
                                "& fieldset": {
                                  borderColor: isDark ? "#FFFFFF80 !important" : "#E8D1AB !important",
                                  borderWidth: "1px !important",
                                },
                                "&:hover fieldset": {
                                  borderColor: isDark ? "#FFFFFF !important" : "#BEBEBE !important",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#E8D1AB !important",
                                  borderWidth: "2px !important",
                                },
                              },
                              "& .MuiInputBase-input": {
                                fontSize: "16px",
                                fontWeight: "500", // font-medium
                                color: isCustomValiditySelected
                                  ? isDark
                                    ? "#E8D1AB"
                                    : "#171717"
                                  : "rgba(113, 113, 122, 1)",
                              },
                              "& .MuiInputBase-input.Mui-disabled": {
                                WebkitTextFillColor: isDark
                                  ? "rgba(214, 195, 157, 0.9)"
                                  : "rgba(23, 23, 23, 0.65)",
                                color: isDark
                                  ? "rgba(214, 195, 157, 0.9)"
                                  : "rgba(23, 23, 23, 0.65)",
                                opacity: 1,
                              },
                              "& .MuiSvgIcon-root": {
                                color: isCustomValiditySelected
                                  ? "#E8D1AB"
                                  : isDark
                                    ? "#FFFFFF"
                                    : "#171717",
                              },
                              "& .Mui-disabled .MuiSvgIcon-root": {
                                color: isDark ? "#FFFFFF" : "#171717",
                                opacity: 1,
                              },
                            }}
                            labelSx={{
                              position: "absolute",
                              top: "-10px",
                              left: "16px",
                              zIndex: 10,
                              backgroundColor: isDark ? "#171717" : "#FFFFFF",
                              padding: "0 8px",
                              fontSize: "12px", // text-xs
                              fontWeight: "500", // font-medium
                              color: isCustomValiditySelected
                                ? isDark
                                  ? "#E8D1AB"
                                  : "#171717"
                                : "rgba(113, 113, 122, 1)",
                            }}
                          />
                        </div> */}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            // </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="hidden lg:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pb-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818] h-[62px] min-w-[166px] rounded-xl text-xl font-medium bg-transparent transition-all"
              onClick={handleBack}
            >
              Back
            </Button>
            {!showInvoiceActions ? (
              showReviewChangesAction ? (
                <Button
                  className="bg-white text-[#1B1B1B] hover:bg-zinc-100 border-0 shadow-lg h-[62px] min-w-[166px] rounded-xl text-xl font-bold transition-all"
                  disabled={!quoteReviewValidation.isValid || isCreatingQuoteDraft}
                  onClick={handleOpenReviewChangesModal}
                >
                  Review Changes
                </Button>
              ) : (
                <Button
                  className={`${view === "tax"
                    ? "bg-white text-[#1B1B1B] hover:bg-zinc-100 border-0 shadow-lg"
                    : canPrimaryAction
                      ? "bg-[#E8D1AB] text-[#101010]"
                      : isDark
                        ? "bg-[#2A2B2D] text-zinc-600"
                        : "bg-[#A4A5A6] text-white"
                    } h-[62px] min-w-[166px] rounded-xl text-xl font-bold transition-all shadow-md`}
                  disabled={!canPrimaryAction || isCreatingQuoteDraft || isCreatingClient}
                  onClick={handlePrimaryAction}
                >
                  {primaryActionLabel}
                </Button>
              )
            ) : null}
          </div>

          <div className="flex gap-4 self-start sm:self-auto">
              {showInvoiceActions ? (
              <>
                <Button
                  type="button"
                  onClick={handleConvertToBooking}
                  disabled={isViewingInvoice || isSendingInvoice || isConverting}
                  variant="outline"
                  className="border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323] h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all shadow-lg disabled:opacity-70"
                >
                  {isConverting ? <Loader2 size={20} className="animate-spin" /> : null}
                  {isConverting ? "Converting..." : convertBookingActionLabel}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    void handleViewInvoice();
                  }}
                  disabled={isViewingInvoice || isSendingInvoice || isConverting}
                  variant="outline"
                  className="border border-white/10 bg-[#1B1B1B] text-white hover:bg-[#232323] h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all shadow-lg disabled:opacity-70"
                >
                  {isViewingInvoice ? <Loader2 size={20} className="animate-spin" /> : <Eye size={20} />}
                  {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    void handleSendInvoice();
                  }}
                  disabled={isViewingInvoice || isSendingInvoice || isConverting}
                  className="bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all border-0 shadow-lg disabled:opacity-70"
                >
                  {isSendingInvoice ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
                  {isSendingInvoice ? "Sending Invoice..." : "Send Invoice"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleSaveAsDraft}
                disabled={isCreatingQuoteDraft}
                className="bg-white text-[#1B1B1B] hover:bg-zinc-100 h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all group border-0 shadow-lg disabled:opacity-70"
              >
                <div className="flex items-center justify-center">
                  <Save
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
                {isCreatingQuoteDraft && activeQuoteAction === "draft"
                  ? "Saving Draft..."
                  : "Save as Draft"}
              </Button>
            )}
            {showPreviewAction ? (
              <Button
                type="button"
                onClick={handlePreviewQuote}
                disabled={
                  isCreatingQuoteDraft || !quoteReviewValidation.isValid
                }
                className="bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all border-0 shadow-lg disabled:opacity-70"
              >
                {isPreviewLoading
                  ? "Loading Preview..."
                  : "Preview Quote"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#0f0f0f]`}>
        {showInvoiceActions ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              onClick={handleConvertToBooking}
              disabled={isViewingInvoice || isSendingInvoice || isConverting}
              className="flex-1 bg-[#1B1B1B] text-white border border-white/10 hover:bg-[#232323] h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isConverting ? "Converting..." : convertBookingActionLabel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleViewInvoice();
              }}
              disabled={isViewingInvoice || isSendingInvoice || isConverting}
              className="flex-1 bg-white text-[#1B1B1B] hover:bg-zinc-100 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isViewingInvoice ? "Opening Invoice..." : "View Invoice"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSendInvoice();
              }}
              disabled={isViewingInvoice || isSendingInvoice || isConverting}
              className="flex-1 bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isSendingInvoice ? "Sending Invoice..." : "Send Invoice"}
            </Button>
          </div>
        ) : showPreviewAction ? (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isCreatingQuoteDraft}
              className="flex-1 bg-white text-[#1B1B1B] hover:bg-zinc-100 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isCreatingQuoteDraft && activeQuoteAction === "draft"
                ? "Saving Draft..."
                : "Save as Draft"}
            </Button>
            {showReviewChangesAction ? (
              <Button
                type="button"
                onClick={handleOpenReviewChangesModal}
                disabled={isCreatingQuoteDraft || !quoteReviewValidation.isValid}
                className="flex-1 bg-white text-[#1B1B1B] hover:bg-zinc-100 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
              >
                Review Changes
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handlePreviewQuote}
              disabled={isCreatingQuoteDraft || !quoteReviewValidation.isValid}
              className="flex-1 bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isPreviewLoading
                ? "Loading Preview..."
                : "Preview Quote"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isCreatingQuoteDraft}
            className="underline text-[#FFF] hover:text-white hover:bg-[#181818] bg-transparent h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
          >
            <div className="flex items-center justify-center">
              <Save
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
            </div>
            {isCreatingQuoteDraft && activeQuoteAction === "draft"
              ? "Saving Draft..."
              : "Save as Draft"}
          </Button>
        )}
        <div className="flex gap-2">
          {showInvoiceActions && showPreviewAction ? (
            <Button
              type="button"
              onClick={handlePreviewQuote}
              disabled={isCreatingQuoteDraft || !quoteReviewValidation.isValid}
              className="flex-1 bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isPreviewLoading
                ? "Loading Preview..."
                : "Preview Quote"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="flex-1 border border-[#363636] text-[#FFF] hover:text-white hover:bg-[#181818] h-14 min-w-[166px] rounded-xl text-sm font-medium bg-transparent transition-all"
            onClick={handleBack}
          >
            Back
          </Button>
          {!showInvoiceActions ? (
            showReviewChangesAction ? (
              <Button
                className="bg-white text-[#1B1B1B] hover:bg-zinc-100 h-14 min-w-[166px] rounded-xl text-sm font-bold transition-all shadow-md flex-1"
                disabled={!quoteReviewValidation.isValid || isCreatingQuoteDraft}
                onClick={handleOpenReviewChangesModal}
              >
                Review Changes
              </Button>
            ) : (
              <Button
                className={`${canPrimaryAction
                  ? view === "tax"
                    ? "bg-white text-[#1B1B1B]"
                    : "bg-[#E8D1AB] text-[#101010]"
                  : isDark
                    ? "bg-[#2A2B2D] text-zinc-600"
                    : "bg-[#A4A5A6] text-white"
                  } hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-bold transition-all shadow-md flex-1 `}
                disabled={!canPrimaryAction || isCreatingQuoteDraft || isCreatingClient}
                onClick={handlePrimaryAction}
              >
                {primaryActionLabel}
              </Button>
            )
          ) : null}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${itemToDelete?.type === "service" ? "Service" : itemToDelete?.type === "addon" ? "Add-on" : itemToDelete?.type === "logistics" ? "Logistics Item" : itemToDelete?.type === "shoot_type" ? "Shoot Type" : itemToDelete?.type === "editing_type" ? "Editing Type" : "Line Item"}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type === "service" ? "service" : itemToDelete?.type === "addon" ? "add-on" : itemToDelete?.type === "logistics" ? "logistics item" : itemToDelete?.type === "shoot_type" ? "shoot type" : itemToDelete?.type === "editing_type" ? "editing type" : "line item"}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
      <Dialog
        open={isReviewChangesModalOpen}
        onOpenChange={(open) => {
          if (isCreatingQuoteDraft) {
            return;
          }
          setIsReviewChangesModalOpen(open);
        }}
      >
        <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-[732px] translate-x-0 translate-y-0 rounded-none border-y-0 border-l border-r-0 border-[#2B2B2B] bg-[#050505] p-0 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] duration-300 sm:max-w-[732px]">
          <div className="flex items-start justify-between border-b border-white/10 px-7 pb-7 pt-12">
            <div>
              <DialogTitle className="text-[32px] font-semibold leading-[1.05] text-white lg:text-[33px]">
                Review Changes Before Saving
              </DialogTitle>
              <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-[#96969E]">
                Review the changes to your quote including price differences and service modifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewChangesModalOpen(false)}
              className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#2A2220] text-white transition-colors hover:bg-[#3A302D]"
            >
              <X size={24} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-218px)] overflow-y-auto px-7 py-7">
            <div className="rounded-[14px] bg-[#E7D0A4] px-5 py-4 text-black">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[16px] font-semibold">
                  {reviewChangesData.delta < 0 ? (
                    <TrendingDown size={18} />
                  ) : reviewChangesData.delta > 0 ? (
                    <TrendingDown size={18} className="rotate-180" />
                  ) : (
                    <Minus size={18} />
                  )}
                  <span>
                    {reviewChangesData.delta < 0
                      ? "Price Decrease"
                      : reviewChangesData.delta > 0
                        ? "Price Increase"
                        : "No Price Change"}
                  </span>
                </div>
                <div className="text-[22px] font-bold tracking-tight">
                  {`${reviewChangesData.delta > 0 ? "+" : reviewChangesData.delta < 0 ? "-" : ""}${formatCurrency(Math.abs(reviewChangesData.delta))}`}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] bg-[#141416] px-5 py-4">
                <p className="text-sm text-[#9C9CA3]">Old Quote Total</p>
                <p className="mt-2 text-[18px] font-semibold text-white md:text-[19px]">
                  {formatCurrency(reviewChangesData.previousTotal)}
                </p>
              </div>
              <div className="rounded-[12px] bg-[#141416] px-5 py-4">
                <p className="text-sm text-[#9C9CA3]">New Quote Total</p>
                <p className="mt-2 text-[18px] font-semibold text-white md:text-[19px]">
                  {formatCurrency(reviewChangesData.nextTotal)}
                </p>
              </div>
            </div>

            {([
              ["Service Changes", reviewChangesData.serviceChanges],
              ["Add-On Changes", reviewChangesData.addonChanges],
            ] as const).map(([title, items]) =>
              items.length ? (
                <div key={title} className="mt-5">
                  <h3 className="mb-3 text-[15px] font-medium text-[#A7A7AE]">{title}</h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const isPositive = item.delta >= 0;
                      const toneClass =
                        item.changeType === "removed"
                          ? "border-[#6C161C] bg-[#2A090C] text-[#FF6B6B]"
                          : isPositive
                            ? "border-[#0C5B35] bg-[#031A12] text-[#00E18F]"
                            : "border-[#6C161C] bg-[#2A090C] text-[#FF6B6B]";

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-[12px] border px-4 py-[15px] ${toneClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[26px] leading-none">
                              {item.changeType === "removed" ? "−" : "+"}
                            </span>
                            <div>
                              <p
                                className={`text-[16px] font-medium ${
                                  item.changeType === "removed" ? "line-through" : ""
                                }`}
                              >
                                {item.label}
                              </p>
                              {item.changeType === "updated" ? (
                                <p className="text-sm opacity-80">
                                  {formatCurrency(item.previousAmount)} to {formatCurrency(item.nextAmount)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div
                            className={`text-[16px] font-semibold ${
                              item.changeType === "removed" ? "line-through" : ""
                            }`}
                          >
                            {formatCurrency(Math.abs(item.delta))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}

            {[
              ...reviewChangesData.fieldChanges.map((item) => ({
                id: item.id,
                label: item.label,
                previousValue: item.previousValue || "None",
                nextValue: item.nextValue || "None",
              })),
              ...[...reviewChangesData.logisticsChanges, ...reviewChangesData.customChanges].map((item) => ({
                id: item.id,
                label: item.label,
                previousValue:
                  item.changeType === "added"
                    ? "None"
                    : formatCurrency(Math.abs(item.previousAmount)),
                nextValue:
                  item.changeType === "removed"
                    ? "None"
                    : formatCurrency(Math.abs(item.nextAmount)),
              })),
            ].length ? (
              <div className="mt-5">
                <h3 className="mb-3 text-[15px] font-medium text-[#A7A7AE]">Other Changes</h3>
                <div className="rounded-[12px] bg-[#141416] p-5">
                  <div className="space-y-4">
                    {[
                      ...reviewChangesData.fieldChanges.map((item) => ({
                        id: item.id,
                        label: item.label,
                        previousValue: item.previousValue || "None",
                        nextValue: item.nextValue || "None",
                      })),
                      ...[...reviewChangesData.logisticsChanges, ...reviewChangesData.customChanges].map((item) => ({
                        id: item.id,
                        label: item.label,
                        previousValue:
                          item.changeType === "added"
                            ? "None"
                            : formatCurrency(Math.abs(item.previousAmount)),
                        nextValue:
                          item.changeType === "removed"
                            ? "None"
                            : formatCurrency(Math.abs(item.nextAmount)),
                      })),
                    ].map((item) => (
                      <div key={item.id} className="rounded-[12px] bg-[#101012] p-4">
                        <p className="text-[16px] font-medium text-white">{item.label}</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-[#7D7D84]">Old:</p>
                            <p className="mt-1 text-[15px] text-[#D4D4D8]">
                              {item.previousValue || "None"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#7D7D84]">New:</p>
                            <p className="mt-1 text-[15px] text-white">
                              {item.nextValue || "None"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-7 rounded-[12px] border border-[#9A7105] bg-[#241C09] px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 text-[#F1BF3C]">
                  <TriangleAlert size={28} />
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#F4C55B]">Reason Required</p>
                  <p className="mt-1 text-sm leading-6 text-[#E2B952]">
                    Please provide a reason for these changes as they may impact shoot execution.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-[15px] font-medium text-[#9D9DA4]">
                Reason for Change*
              </label>
              <Textarea
                value={reviewChangeReason}
                onChange={(event) => setReviewChangeReason(event.target.value)}
                placeholder="Explain why these changes are being made..."
                className="min-h-[136px] rounded-[14px] border border-[#2E2E33] bg-black px-5 py-4 text-[15px] text-white placeholder:text-[#5F5F65]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 border-t border-white/10 px-7 py-7 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewChangesModalOpen(false)}
              disabled={isCreatingQuoteDraft}
              className="h-[50px] min-w-[160px] rounded-[12px] border-[#363636] bg-[#111111] text-white hover:bg-[#181818] sm:min-w-[160px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSaveAsNewVersion();
              }}
              disabled={isCreatingQuoteDraft || !reviewChangeReason.trim()}
              className="h-[50px] min-w-[230px] rounded-[12px] bg-[#E7D0A4] text-black hover:bg-[#E7D0A4]/90 sm:min-w-[230px]"
            >
              {isCreatingQuoteDraft && activeQuoteAction === "save"
                ? "Saving..."
                : "Save as New Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {isVersionSaveSuccessOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111] px-4"
          >
            <div className="relative mb-8 flex flex-col items-center justify-center">
              <div className="relative h-[220px] w-[360px] lg:h-[344px] lg:w-[548px]">
                <Image
                  src="/images/misc/PaymentSuccess.gif"
                  alt="Success Animation"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
            
            <h2 className="mb-2 text-center text-[28px] font-bold leading-tight text-white sm:text-[36px] lg:text-[40px]">
              New Quote Version Created Successfully
            </h2>
            <p className="mx-auto mb-10 max-w-[450px] text-center text-[16px] text-[#A1A1AA] sm:text-[18px]">
              A New Version Of This Quote Has Been Saved <br className="hidden sm:block" /> With Updated Changes.
            </p>
            
            <button
              type="button"
              onClick={() => {
                setIsVersionSaveSuccessOpen(false);
                const targetId = createdQuoteId || editQuoteId || effectiveQuoteId;
                const targetUrl = targetId 
                  ? `/admin/quotes/${encodeURIComponent(String(targetId))}/summary`
                  : "/admin/quotes";
                router.push(targetUrl);
              }}
              className="flex h-14 min-w-[240px] items-center justify-center rounded-[12px] bg-[#E7D0A4] px-10 text-[16px] font-semibold text-black transition-colors hover:bg-[#E7D0A4]/90 sm:h-[60px]"
            >
              View Updated Summary
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog
        open={Boolean(editCatalogItem)}
        onOpenChange={(open) => {
          if (!open) {
            setEditCatalogItem(null);
            setEditCatalogName("");
            setEditCatalogCost("");
          }
        }}
      >
        <DialogContent className="bg-[#171717] text-white border border-[#2E2E2E]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {`Edit ${getCatalogEditItemLabel(editCatalogItem?.type ?? "line_item")}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#A1A1AA]">Name</label>
              <Input
                value={editCatalogName}
                onChange={(e) =>
                  setEditCatalogName(clampTextLength(e.target.value))
                }
                maxLength={MAX_QUOTE_OPTION_LABEL_LENGTH}
                className="h-11 bg-transparent border-[#4A4A4A] rounded-xl text-white placeholder:text-[#666666]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#A1A1AA]">Rate</label>
              <Input
                value={editCatalogCost}
                onChange={(e) =>
                  setEditCatalogCost(sanitizeCurrencyInput(e.target.value))
                }
                inputMode="decimal"
                className="h-11 bg-transparent border-[#4A4A4A] rounded-xl text-white placeholder:text-[#666666]"
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="border border-[#363636] text-[#D4D4D4] hover:text-white hover:bg-[#181818]"
              onClick={() => {
                setEditCatalogItem(null);
                setEditCatalogName("");
                setEditCatalogCost("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateCatalogItem}
              disabled={isSavingCatalogEdit}
              className="bg-[#E8D1AB] text-[#101010] hover:opacity-90"
            >
              {isSavingCatalogEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        maxDurationHours={selectedServicesMaxDurationHours}
        title={
          convertIntent === "send_invoice"
            ? isConvertedToBooking
              ? "Confirm Date & Time Before Sending Invoice"
              : "Convert to Booking Before Sending Invoice"
            : convertIntent === "view_invoice"
              ? "Convert to Booking Before Viewing Invoice"
            : isConvertedToBooking
              ? "Update Booking"
              : "Convert to Booking"
        }
        description={
          convertIntent === "send_invoice"
            ? isConvertedToBooking
              ? "Review or update the booking date and time below, then continue to send the invoice."
              : "This quote must be converted to a booking before an invoice can be sent. Complete the booking details below to continue."
            : convertIntent === "view_invoice"
              ? "This quote must be converted to a booking before an invoice can be viewed. Complete the booking details below to continue."
            : isConvertedToBooking
              ? "Review or update the booking date and time below."
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
      <QuoteSummaryModal
        open={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        snapshot={quoteSummarySnapshot}
        onPreview={handlePreviewQuote}
        previewDisabled={!quoteReviewValidation.isValid}
      />
      <QuotePreviewModal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quote={previewQuote}
        quoteId={previewQuoteId}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
