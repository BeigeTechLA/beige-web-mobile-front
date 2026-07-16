import { addDays, format, isValid, parseISO } from "date-fns";

import type { SalesQuoteDetailData, SalesQuoteDetailLineItem } from "@/lib/api";
import {
  extractQuoteLineItems,
  getQuoteDisplayShootTypeLabel,
  getQuoteNumber,
  getQuoteText,
  resolveQuoteLineItemDisplayName,
} from "@/lib/quoteDetail";

export type QuoteEditorView =
  | "selection"
  | "details"
  | "services"
  | "addons"
  | "logistics"
  | "customlineitems"
  | "discounts"
  | "tax";

export type QuoteEditorClient = {
  client_id?: string | number | null;
  user_id?: string | number | null;
  id?: string | number | null;
  client_type?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type QuoteEditorServiceItem = {
  id: string;
  label: string;
  price: number;
  createdAt?: string | null;
  originalIndex?: number;
};

export type QuoteEditorAddonItem = {
  id: string;
  label: string;
  price: number;
  createdAt?: string | null;
  originalIndex?: number;
};

export type QuoteEditorSimpleItem = {
  id: string;
  label: string;
  basePrice: number;
  sourceType?: "custom" | "catalog";
  createdAt?: string | null;
  originalIndex?: number;
};

export type QuoteEditorShootType = {
  id: string;
  label: string;
};

export type QuoteEditorServiceConfig = {
  quantity: number;
  duration: number;
  crewSize: number;
  estimatedPrice: number;
};

export type QuoteEditorAddonConfig = {
  quantity: number;
  price: number;
};

export type QuoteEditorSimplePriceConfig = {
  price: number;
};

export type QuoteEditorHydrationState = {
  selectedClient: QuoteEditorClient | null;
  clientName: string;
  emailId: string;
  phoneNumber: string;
  address: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  projectDescription: string;
  preProductionNotes: string;
  preProductionFile: {
    name: string;
    type: string;
    size: number;
    content?: string;
    path?: string;
    url?: string;
  } | null;
  validityDays: number | "custom";
  validUntil: string;
  discountEnabled: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  taxRate: number;
  taxType: string;
  selectedServices: string[];
  services: QuoteEditorServiceItem[];
  serviceConfigs: Record<string, QuoteEditorServiceConfig>;
  selectedAddons: string[];
  addons: QuoteEditorAddonItem[];
  addonConfigs: Record<string, QuoteEditorAddonConfig>;
  appliedAddonConfigs: Record<string, QuoteEditorAddonConfig>;
  logisticsItems: QuoteEditorSimpleItem[];
  logisticsConfigs: Record<string, QuoteEditorSimplePriceConfig>;
  appliedLogisticsConfigs: Record<string, QuoteEditorSimplePriceConfig>;
  lineItems: QuoteEditorSimpleItem[];
  lineItemConfigs: Record<string, QuoteEditorSimplePriceConfig>;
  appliedLineItemConfigs: Record<string, QuoteEditorSimplePriceConfig>;
  shootTypeLabel: string;
};

type BuildQuoteEditorHydrationInput = {
  quote: SalesQuoteDetailData;
  services: QuoteEditorServiceItem[];
  addons: QuoteEditorAddonItem[];
  logisticsItems: QuoteEditorSimpleItem[];
  lineItems: QuoteEditorSimpleItem[];
};

type QuoteEditorNavigationCacheEntry = {
  cachedAt: number;
  quote: SalesQuoteDetailData;
};

type QuoteEditorEditReasonCacheEntry = {
  cachedAt: number;
  reason: string;
  opsReviewConfirmed?: boolean;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isEditingServiceLabel = (label: string) =>
  /\bedit(?:ing)?\b/.test(label.trim().toLowerCase());

const hasEditingConfiguration = (lineItem: SalesQuoteDetailLineItem) => {
  if (!lineItem?.configuration || typeof lineItem.configuration !== "object") {
    return false;
  }

  const config = lineItem.configuration as Record<string, unknown>;
  return Boolean(
    config.editing_type_key ||
      config.editing_type_label ||
      config.editingTypeKey ||
      config.editingTypeLabel
  );
};
const QUOTE_EDITOR_NAVIGATION_CACHE_PREFIX = "quote-editor-navigation";
const QUOTE_EDITOR_EDIT_REASON_CACHE_PREFIX = "quote-editor-edit-reason";
const QUOTE_EDITOR_NAVIGATION_CACHE_TTL_MS = 10 * 60 * 1000;

const EDITOR_VIEW_SET = new Set<QuoteEditorView>([
  "selection",
  "details",
  "services",
  "addons",
  "logistics",
  "customlineitems",
  "discounts",
  "tax",
]);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const normalizeLabelKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const resolveDetailSection = (item: SalesQuoteDetailLineItem) => {
  const rawSection = getQuoteText(
    item.section_type,
    item.category_slug,
    item.category_name,
    item.type
  ).toLowerCase();

  if (rawSection.includes("addon")) {
    return "addon" as const;
  }

  if (
    rawSection.includes("logistic") ||
    rawSection.includes("travel") ||
    rawSection.includes("equipment") ||
    rawSection.includes("permit")
  ) {
    return "logistics" as const;
  }

  if (rawSection.includes("custom") || rawSection.includes("line")) {
    return "custom" as const;
  }

  return "service" as const;
};

const resolveItemLabel = (item: SalesQuoteDetailLineItem) => {
  return resolveQuoteLineItemDisplayName(item);
};

const resolveItemCreatedAt = (item: SalesQuoteDetailLineItem) =>
  getQuoteText(item.created_at, asRecord(item.catalog_item)?.created_at) || null;

const resolvePositiveIdString = (value: unknown) => {
  const numericValue = getQuoteNumber(value);
  if (numericValue !== undefined && Number.isInteger(numericValue) && numericValue > 0) {
    return String(numericValue);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
};

const toFiniteNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numericValue = getQuoteNumber(value);
    if (numericValue !== undefined && Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return null;
};

const resolveItemPrice = (
  item: SalesQuoteDetailLineItem,
  fallback = 0
) => {
  const directRate = getQuoteNumber(
    item.estimated_pricing,
    item.unit_rate,
    item.rate,
    item.effective_rate,
    item.price
  );
  if (directRate !== undefined) {
    return Math.max(0, directRate);
  }

  const quantity = Math.max(1, getQuoteNumber(item.quantity) ?? 1);
  const totalAmount = getQuoteNumber(item.line_total, item.total_amount, item.amount);
  if (totalAmount !== undefined) {
    return Math.max(0, totalAmount / quantity);
  }

  return Math.max(0, fallback);
};

const resolveServicePrice = (
  item: SalesQuoteDetailLineItem,
  fallback = 0
) => {
  const resolvedRate = getQuoteNumber(
    item.estimated_pricing,
    item.unit_rate,
    item.rate,
    item.effective_rate,
    item.price
  );

  return Math.max(0, resolvedRate ?? fallback);
};

const findCatalogItem = <
  T extends { id: string; label: string }
>(
  items: T[],
  item: SalesQuoteDetailLineItem
) => {
  const catalogItemId = resolvePositiveIdString(item.catalog_item_id);
  if (catalogItemId) {
    const matchedById = items.find((entry) => String(entry.id) === catalogItemId);
    if (matchedById) {
      return matchedById;
    }
  }

  const labelKey = normalizeLabelKey(resolveItemLabel(item));
  if (!labelKey) {
    return null;
  }

  return items.find((entry) => normalizeLabelKey(entry.label) === labelKey) ?? null;
};

const ensureDateInputValue = (value: string | null, fallbackDays = 7) => {
  if (value && DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  if (value) {
    const parsedValue = parseISO(value);
    if (isValid(parsedValue)) {
      return format(parsedValue, "yyyy-MM-dd");
    }
  }

  return format(addDays(new Date(), fallbackDays), "yyyy-MM-dd");
};

const getQuoteEditorNavigationCacheKey = (quoteId: string) =>
  `${QUOTE_EDITOR_NAVIGATION_CACHE_PREFIX}:${quoteId}`;

const getQuoteEditorEditReasonCacheKey = (quoteId: string) =>
  `${QUOTE_EDITOR_EDIT_REASON_CACHE_PREFIX}:${quoteId}`;

export const persistQuoteEditorNavigationCache = (
  quoteId: string,
  quote: SalesQuoteDetailData
) => {
  if (typeof window === "undefined" || !quoteId.trim()) {
    return;
  }

  try {
    const cacheEntry: QuoteEditorNavigationCacheEntry = {
      cachedAt: Date.now(),
      quote,
    };

    window.sessionStorage.setItem(
      getQuoteEditorNavigationCacheKey(quoteId),
      JSON.stringify(cacheEntry)
    );
  } catch (error) {
    console.error("Failed to store quote editor navigation cache", error);
  }
};

export const readQuoteEditorNavigationCache = (quoteId: string) => {
  if (typeof window === "undefined" || !quoteId.trim()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getQuoteEditorNavigationCacheKey(quoteId)
    );

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as QuoteEditorNavigationCacheEntry;
    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      typeof parsedValue.cachedAt !== "number" ||
      !parsedValue.quote
    ) {
      window.sessionStorage.removeItem(getQuoteEditorNavigationCacheKey(quoteId));
      return null;
    }

    if (Date.now() - parsedValue.cachedAt > QUOTE_EDITOR_NAVIGATION_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(getQuoteEditorNavigationCacheKey(quoteId));
      return null;
    }

    return parsedValue.quote;
  } catch (error) {
    console.error("Failed to read quote editor navigation cache", error);
    window.sessionStorage.removeItem(getQuoteEditorNavigationCacheKey(quoteId));
    return null;
  }
};

export const persistQuoteEditorEditReason = (
  quoteId: string,
  reason: string,
  opsReviewConfirmed = false
) => {
  if (typeof window === "undefined" || !quoteId.trim() || !reason.trim()) {
    return;
  }

  try {
    const cacheEntry: QuoteEditorEditReasonCacheEntry = {
      cachedAt: Date.now(),
      reason: reason.trim(),
      opsReviewConfirmed,
    };

    window.sessionStorage.setItem(
      getQuoteEditorEditReasonCacheKey(quoteId),
      JSON.stringify(cacheEntry)
    );
  } catch (error) {
    console.error("Failed to store quote editor edit reason", error);
  }
};

export const readQuoteEditorEditReason = (quoteId: string) => {
  if (typeof window === "undefined" || !quoteId.trim()) {
    return "";
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getQuoteEditorEditReasonCacheKey(quoteId)
    );

    if (!rawValue) {
      return "";
    }

    const parsedValue = JSON.parse(rawValue) as QuoteEditorEditReasonCacheEntry;
    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      typeof parsedValue.cachedAt !== "number" ||
      typeof parsedValue.reason !== "string"
    ) {
      window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
      return "";
    }

    if (Date.now() - parsedValue.cachedAt > QUOTE_EDITOR_NAVIGATION_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
      return "";
    }

    return parsedValue.reason.trim();
  } catch (error) {
    console.error("Failed to read quote editor edit reason", error);
    window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
    return "";
  }
};

export const readQuoteEditorOpsReviewConfirmed = (quoteId: string) => {
  if (typeof window === "undefined" || !quoteId.trim()) {
    return false;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getQuoteEditorEditReasonCacheKey(quoteId)
    );

    if (!rawValue) {
      return false;
    }

    const parsedValue = JSON.parse(rawValue) as QuoteEditorEditReasonCacheEntry;
    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      typeof parsedValue.cachedAt !== "number" ||
      typeof parsedValue.reason !== "string"
    ) {
      window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
      return false;
    }

    if (Date.now() - parsedValue.cachedAt > QUOTE_EDITOR_NAVIGATION_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
      return false;
    }

    return parsedValue.opsReviewConfirmed === true;
  } catch (error) {
    console.error("Failed to read quote editor ops review confirmation", error);
    window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
    return false;
  }
};

export const clearQuoteEditorEditReason = (quoteId: string) => {
  if (typeof window === "undefined" || !quoteId.trim()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(getQuoteEditorEditReasonCacheKey(quoteId));
  } catch (error) {
    console.error("Failed to clear quote editor edit reason", error);
  }
};

export const normalizeQuoteEditorView = (
  value: string | null | undefined,
  fallback: QuoteEditorView = "details"
) => {
  if (!value) {
    return fallback;
  }

  return EDITOR_VIEW_SET.has(value as QuoteEditorView)
    ? (value as QuoteEditorView)
    : fallback;
};

export const findShootTypeIdByLabel = (
  shootTypes: QuoteEditorShootType[],
  shootTypeLabel: string
) => {
  const normalizedTarget = normalizeLabelKey(shootTypeLabel);
  if (!normalizedTarget) {
    return null;
  }

  return (
    shootTypes.find((shootType) => normalizeLabelKey(shootType.label) === normalizedTarget)?.id ??
    null
  );
};

export const buildQuoteEditorHydrationState = ({
  quote,
  services,
  addons,
  logisticsItems,
  lineItems,
}: BuildQuoteEditorHydrationInput): QuoteEditorHydrationState => {
  const quoteLineItems = extractQuoteLineItems(quote);
  const mergedServices = [...services];
  const mergedAddons = [...addons];
  const selectedServices: string[] = [];
  const selectedAddons: string[] = [];
  const serviceConfigs: Record<string, QuoteEditorServiceConfig> = {};
  const addonConfigs: Record<string, QuoteEditorAddonConfig> = {};
  const appliedAddonConfigs: Record<string, QuoteEditorAddonConfig> = {};
  const hydratedLogisticsItems: QuoteEditorSimpleItem[] = [];
  const logisticsConfigs: Record<string, QuoteEditorSimplePriceConfig> = {};
  const appliedLogisticsConfigs: Record<string, QuoteEditorSimplePriceConfig> = {};
  const hydratedLineItems: QuoteEditorSimpleItem[] = [];
  const lineItemConfigs: Record<string, QuoteEditorSimplePriceConfig> = {};
  const appliedLineItemConfigs: Record<string, QuoteEditorSimplePriceConfig> = {};
  const usedHydratedIds = new Set<string>([
    ...mergedServices.map((item) => item.id),
    ...mergedAddons.map((item) => item.id),
    ...logisticsItems.map((item) => item.id),
    ...lineItems.map((item) => item.id),
  ]);

  const createUniqueHydratedId = (baseId: string) => {
    let nextId = baseId;
    let suffix = 1;

    while (usedHydratedIds.has(nextId)) {
      nextId = `${baseId}_${suffix}`;
      suffix += 1;
    }

    usedHydratedIds.add(nextId);
    return nextId;
  };

  quoteLineItems.forEach((lineItem, index) => {
    const section = resolveDetailSection(lineItem);
    const label = resolveItemLabel(lineItem);
    const createdAt = resolveItemCreatedAt(lineItem);

    if (section === "service") {
      const matchedService = findCatalogItem(mergedServices, lineItem);
      const resolvedService =
        matchedService ??
        {
          id: createUniqueHydratedId(
            `custom_service_${lineItem.line_item_id ?? lineItem.catalog_item_id ?? index}`
          ),
          label,
          price: resolveServicePrice(lineItem),
          createdAt,
          originalIndex: mergedServices.length + index,
        };

      if (!matchedService) {
        mergedServices.push(resolvedService);
      }

      if (!selectedServices.includes(resolvedService.id)) {
        selectedServices.push(resolvedService.id);
      }

      const isEditingService =
        isEditingServiceLabel(label) || hasEditingConfiguration(lineItem);

      serviceConfigs[resolvedService.id] = {
        quantity: 1,
        duration: Math.max(
          0,
          getQuoteNumber(lineItem.duration_hours, lineItem.duration, lineItem.hours) ?? 0
        ),
        crewSize: Math.max(
          1,
          isEditingService
            ? getQuoteNumber(lineItem.quantity) ?? 1
            : getQuoteNumber(lineItem.crew_size, lineItem.crew, lineItem.crew_count) ?? 1
        ),
        estimatedPrice: resolveServicePrice(
          lineItem,
          matchedService?.price ?? resolvedService.price
        ),
      };

      return;
    }

    if (section === "addon") {
      const matchedAddon = findCatalogItem(mergedAddons, lineItem);
      const resolvedAddon =
        matchedAddon ??
        {
          id: createUniqueHydratedId(
            `custom_addon_${lineItem.line_item_id ?? lineItem.catalog_item_id ?? index}`
          ),
          label,
          price: resolveItemPrice(lineItem),
          createdAt,
          originalIndex: mergedAddons.length + index,
        };

      if (!matchedAddon) {
        mergedAddons.push(resolvedAddon);
      }

      if (!selectedAddons.includes(resolvedAddon.id)) {
        selectedAddons.push(resolvedAddon.id);
      }

      const addonConfig = {
        quantity: Math.max(1, getQuoteNumber(lineItem.quantity) ?? 1),
        price: resolveItemPrice(lineItem, matchedAddon?.price ?? resolvedAddon.price),
      };

      addonConfigs[resolvedAddon.id] = addonConfig;
      appliedAddonConfigs[resolvedAddon.id] = addonConfig;
      return;
    }

    const sourceItems = section === "logistics" ? logisticsItems : lineItems;
    const matchedSimpleItem = findCatalogItem(sourceItems, lineItem);
    const resolvedPrice = resolveItemPrice(
      lineItem,
      matchedSimpleItem?.basePrice ?? 0
    );
    const resolvedSimpleItem = matchedSimpleItem
      ? {
          ...matchedSimpleItem,
          basePrice: resolvedPrice,
          sourceType:
            getQuoteText(lineItem.source_type).toLowerCase() === "custom"
              ? "custom"
              : matchedSimpleItem.sourceType,
        }
      : {
          id: createUniqueHydratedId(
            `custom_${section}_${lineItem.line_item_id ?? lineItem.catalog_item_id ?? index}`
          ),
          label,
          basePrice: resolvedPrice,
          sourceType:
            getQuoteText(lineItem.source_type).toLowerCase() === "custom"
              ? "custom"
              : "catalog",
          createdAt,
          originalIndex: index,
        };

    if (section === "logistics") {
      hydratedLogisticsItems.push(resolvedSimpleItem);
      logisticsConfigs[resolvedSimpleItem.id] = { price: resolvedPrice };
      appliedLogisticsConfigs[resolvedSimpleItem.id] = { price: resolvedPrice };
      return;
    }

    hydratedLineItems.push(resolvedSimpleItem);
    lineItemConfigs[resolvedSimpleItem.id] = { price: resolvedPrice };
    appliedLineItemConfigs[resolvedSimpleItem.id] = { price: resolvedPrice };
  });

  const clientUser = asRecord(quote.client_user);
  const clientId = resolvePositiveIdString(quote.client_id);
  const clientUserId = resolvePositiveIdString(quote.client_user_id ?? clientUser?.id);
  const validUntilValue = ensureDateInputValue(
    getQuoteText(quote.valid_until, quote.expires_at) || null,
    7
  );
  const quoteValidityDays = getQuoteNumber(quote.quote_validity_days);
  const normalizedDiscountType =
    ["fixed", "fixed_amount"].includes(getQuoteText(quote.discount_type).toLowerCase())
      ? "fixed"
      : "percentage";
  const normalizedDiscountValue = Math.max(0, getQuoteNumber(quote.discount_value) ?? 0);

  return {
    selectedClient: {
      ...(clientId ? { client_id: clientId, id: clientId } : {}),
      ...(clientUserId ? { user_id: clientUserId } : {}),
      client_type: clientUserId ? "registered" : clientId ? "guest" : null,
      name: getQuoteText(quote.client_name, clientUser?.name),
      email: getQuoteText(quote.client_email, quote.guest_email, clientUser?.email),
      phone: getQuoteText(quote.client_phone, clientUser?.phone),
      address: getQuoteText(quote.client_address, quote.address, quote.location),
    },
    clientName: getQuoteText(quote.client_name, clientUser?.name),
    emailId: getQuoteText(quote.client_email, quote.guest_email, clientUser?.email),
    phoneNumber: getQuoteText(quote.client_phone, clientUser?.phone),
    address: getQuoteText(quote.client_address, quote.address, quote.location),
    locationLatitude: toFiniteNumber(
      quote.location_latitude,
      quote.latitude,
      quote.converted_booking_details?.location_latitude,
      quote.converted_booking_details?.latitude
    ),
    locationLongitude: toFiniteNumber(
      quote.location_longitude,
      quote.longitude,
      quote.converted_booking_details?.location_longitude,
      quote.converted_booking_details?.longitude
    ),
    projectDescription: getQuoteText(quote.project_description),
    preProductionNotes: getQuoteText(quote.pre_production_notes),
    preProductionFile:
      getQuoteText(quote.pre_production_file_name) ||
      getQuoteText(quote.pre_production_file_url) ||
      getQuoteText(quote.pre_production_file_path)
        ? {
            name: getQuoteText(quote.pre_production_file_name) || "pre-production-file",
            type:
              getQuoteText(quote.pre_production_file_type) ||
              "application/octet-stream",
            size: Math.max(0, getQuoteNumber(quote.pre_production_file_size) ?? 0),
            path: getQuoteText(quote.pre_production_file_path),
            url: getQuoteText(quote.pre_production_file_url),
          }
        : null,
    validityDays:
      quoteValidityDays && quoteValidityDays > 0 ? quoteValidityDays : "custom",
    validUntil: validUntilValue,
    discountEnabled: normalizedDiscountValue > 0,
    discountType: normalizedDiscountType,
    discountValue: normalizedDiscountValue,
    taxRate: Math.max(0, getQuoteNumber(quote.tax_rate) ?? 0),
    taxType: getQuoteText(quote.tax_type, "Sales Tax") || "Sales Tax",
    selectedServices,
    services: mergedServices,
    serviceConfigs,
    selectedAddons,
    addons: mergedAddons,
    addonConfigs,
    appliedAddonConfigs,
    logisticsItems: hydratedLogisticsItems,
    logisticsConfigs,
    appliedLogisticsConfigs,
    lineItems: hydratedLineItems,
    lineItemConfigs,
    appliedLineItemConfigs,
    shootTypeLabel: getQuoteDisplayShootTypeLabel(quote),
  };
};
