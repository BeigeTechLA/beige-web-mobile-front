import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";

import type { SalesQuoteDetailData, SalesQuoteDetailLineItem } from "@/lib/api";
import { getDefaultQuoteTerms } from "@/lib/quoteTerms";

export const ADMIN_QUOTE_SUMMARY_STORAGE_KEY = "admin-quote-summary";
export const SALES_QUOTE_SUMMARY_STORAGE_KEY = "sales-quote-summary";

export type QuoteCreateStep =
  | "selection"
  | "details"
  | "services"
  | "addons"
  | "logistics"
  | "customlineitems"
  | "discounts"
  | "tax";

type QuoteCatalogItem = {
  id: string | number;
  label?: string;
  name?: string;
  price?: number;
  basePrice?: number;
};

type QuoteClient = {
  client_id?: string | number | null;
  user_id?: string | number | null;
  id?: string | number | null;
  name?: string;
  email?: string;
  phone?: string;
};

type QuoteShootType = {
  id: string | number;
  label?: string;
};

type QuoteServiceConfig = {
  quantity: number;
  duration: number;
  crewSize: number;
  estimatedPrice: number;
};

type QuoteAddonConfig = {
  quantity: number;
  price: number;
};

type QuoteSimplePriceConfig = {
  price: number;
};

export type QuoteSummaryLineItemSection = "service" | "addon" | "logistics" | "custom";

export interface QuoteSummaryLineItem {
  id: string;
  name: string;
  section: QuoteSummaryLineItemSection;
  quantity: number;
  duration: number;
  crew: number;
  unitRate: number;
  amount: number;
  subtitle?: string;
}

export interface QuoteSummarySnapshot {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  projectDescription: string;
  validUntil: string;
  quoteValidityDays: number;
  shootTypeLabel: string;
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  amountAfterTax: number;
  discountEnabled: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  services: QuoteSummaryLineItem[];
  addons: QuoteSummaryLineItem[];
  logistics: QuoteSummaryLineItem[];
  customLineItems: QuoteSummaryLineItem[];
  termsConditions: string[];
  generatedAt: string;
}

export interface BuildQuoteSummaryInput {
  selectedClient: QuoteClient | null;
  clientName: string;
  emailId: string;
  phoneNumber: string;
  address: string;
  projectDescription: string;
  validityDays: number | "custom";
  validUntil: string;
  discountEnabled: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number | string;
  taxLabel: string;
  normalizedTaxRate: number;
  selectedShootType: string;
  shootTypes: QuoteShootType[];
  selectedServices: string[];
  services: QuoteCatalogItem[];
  serviceConfigs: Record<string, QuoteServiceConfig>;
  selectedAddons: string[];
  addons: QuoteCatalogItem[];
  appliedAddonConfigs: Record<string, QuoteAddonConfig>;
  logisticsItems: QuoteCatalogItem[];
  appliedLogisticsConfigs: Record<string, QuoteSimplePriceConfig>;
  lineItems: QuoteCatalogItem[];
  appliedLineItemConfigs: Record<string, QuoteSimplePriceConfig>;
}

export interface QuoteValidationInput {
  view: QuoteCreateStep;
  selectedClient: QuoteClient | null;
  clientName: string;
  emailId: string;
  phoneNumber: string;
  address: string;
  projectDescription: string;
  validUntil: string;
  selectedServices: string[];
}

export interface QuoteValidationResult {
  isValid: boolean;
  missingFields: string[];
}

const hasText = (value: string) => value.trim().length > 0;

const normalizeNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const resolveValidityDays = (validityDays: number | "custom", validUntil: string) => {
  if (validityDays !== "custom") {
    return Math.max(0, normalizeNumber(validityDays));
  }

  const parsedDate = parseISO(validUntil);
  if (!isValid(parsedDate)) {
    return 0;
  }

  return Math.max(
    0,
    differenceInCalendarDays(startOfDay(parsedDate), startOfDay(new Date()))
  );
};

const isValidDateString = (value: string) => {
  if (!hasText(value)) {
    return false;
  }

  return isValid(parseISO(value));
};

const resolveShootTypeLabel = (
  selectedShootType: string,
  shootTypes: QuoteShootType[]
) =>
  shootTypes.find((item) => String(item.id) === selectedShootType)?.label?.trim() ||
  toTitleCase(selectedShootType);

const buildServiceItems = (
  selectedServices: string[],
  services: QuoteCatalogItem[],
  serviceConfigs: Record<string, QuoteServiceConfig>,
  shootTypeLabel: string
): QuoteSummaryLineItem[] =>
  selectedServices
    .map((serviceId) => {
      const service = services.find((item) => String(item.id) === serviceId);
      const config = serviceConfigs[serviceId];

      if (!service || !config) {
        return null;
      }

      const quantity = 1;
      const duration = Math.max(0, normalizeNumber(config.duration));
      const crew = Math.max(1, normalizeNumber(config.crewSize));
      const unitRate = Math.max(
        0,
        normalizeNumber(config.estimatedPrice || service.price || service.basePrice)
      );
      const serviceName = service.label?.trim() || service.name?.trim() || "Service";
      const normalizedServiceName = serviceName.toLowerCase();
      const shouldShowShootTypeSubtitle =
        normalizedServiceName === "videography" || normalizedServiceName === "photography";

      return {
        id: String(service.id),
        name: serviceName,
        section: "service" as const,
        quantity,
        duration,
        crew,
        unitRate,
        amount: Math.max(duration, 1) * Math.max(crew, 1) * unitRate,
        subtitle: shouldShowShootTypeSubtitle && shootTypeLabel ? `(${shootTypeLabel})` : undefined,
      };
    })
    .filter((item): item is QuoteSummaryLineItem => item !== null);

const buildAddonItems = (
  selectedAddons: string[],
  addons: QuoteCatalogItem[],
  appliedAddonConfigs: Record<string, QuoteAddonConfig>
): QuoteSummaryLineItem[] =>
  selectedAddons
    .map((addonId) => {
      const addon = addons.find((item) => String(item.id) === addonId);
      const config = appliedAddonConfigs[addonId];

      if (!addon || !config) {
        return null;
      }

      const quantity = Math.max(1, normalizeNumber(config.quantity));
      const unitRate = Math.max(0, normalizeNumber(config.price || addon.price || addon.basePrice));

      return {
        id: String(addon.id),
        name: addon.label?.trim() || addon.name?.trim() || "Add-on",
        section: "addon" as const,
        quantity,
        duration: 0,
        crew: 0,
        unitRate,
        amount: quantity * unitRate,
      };
    })
    .filter((item): item is QuoteSummaryLineItem => item !== null);

const buildSimpleItems = (
  items: QuoteCatalogItem[],
  configs: Record<string, QuoteSimplePriceConfig>,
  section: Extract<QuoteSummaryLineItemSection, "logistics" | "custom">
): QuoteSummaryLineItem[] =>
  items
    .map((item) => {
      const config = configs[String(item.id)];

      if (!config) {
        return null;
      }

      const unitRate = Math.max(0, normalizeNumber(config.price || item.price || item.basePrice));

      return {
        id: String(item.id),
        name: item.label?.trim() || item.name?.trim() || "Line Item",
        section,
        quantity: 1,
        duration: 0,
        crew: 0,
        unitRate,
        amount: unitRate,
      };
    })
    .filter((item): item is QuoteSummaryLineItem => item !== null);

export const buildQuoteSummarySnapshot = (
  input: BuildQuoteSummaryInput
): QuoteSummarySnapshot => {
  const shootTypeLabel = resolveShootTypeLabel(input.selectedShootType, input.shootTypes);
  const services = buildServiceItems(
    input.selectedServices,
    input.services,
    input.serviceConfigs,
    shootTypeLabel
  );
  const addons = buildAddonItems(
    input.selectedAddons,
    input.addons,
    input.appliedAddonConfigs
  );
  const logistics = buildSimpleItems(
    input.logisticsItems,
    input.appliedLogisticsConfigs,
    "logistics"
  );
  const customLineItems = buildSimpleItems(
    input.lineItems,
    input.appliedLineItemConfigs,
    "custom"
  );

  const subtotal = [...services, ...addons, ...logistics, ...customLineItems].reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const taxRate = Math.max(0, normalizeNumber(input.normalizedTaxRate));
  const taxAmount = subtotal * (taxRate / 100);
  const amountAfterTax = subtotal + taxAmount;
  const discountValue = Math.max(0, normalizeNumber(input.discountValue));
  const rawDiscountAmount = !input.discountEnabled
    ? 0
    : input.discountType === "percentage"
      ? amountAfterTax * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.min(rawDiscountAmount, amountAfterTax);
  const quoteValidityDays = resolveValidityDays(input.validityDays, input.validUntil);
  const termsConditions = getDefaultQuoteTerms(input.validUntil);

  return {
    clientName: input.clientName.trim() || input.selectedClient?.name?.trim() || "Client",
    clientEmail: input.emailId.trim() || input.selectedClient?.email?.trim() || "",
    clientPhone: input.phoneNumber.trim() || input.selectedClient?.phone?.trim() || "",
    clientAddress: input.address.trim(),
    projectDescription: input.projectDescription.trim(),
    validUntil: input.validUntil,
    quoteValidityDays,
    shootTypeLabel,
    taxLabel: input.taxLabel.trim() || "Sales Tax",
    taxRate,
    taxAmount,
    subtotal,
    amountAfterTax,
    discountEnabled: input.discountEnabled,
    discountType: input.discountType,
    discountValue: input.discountEnabled ? discountValue : 0,
    discountAmount,
    finalTotal: Math.max(amountAfterTax - discountAmount, 0),
    services,
    addons,
    logistics,
    customLineItems,
    termsConditions,
    generatedAt: new Date().toISOString(),
  };
};

export const persistQuoteSummarySnapshot = (
  storageKey: string,
  snapshot: QuoteSummarySnapshot
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
};

export const readQuoteSummarySnapshot = (
  storageKey: string
): QuoteSummarySnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as QuoteSummarySnapshot;
  } catch (error) {
    console.error("Failed to parse stored quote summary", error);
    return null;
  }
};

export const validateQuoteStep = (
  input: QuoteValidationInput
): QuoteValidationResult => {
  const missingFields: string[] = [];

  if (input.view === "selection" && !input.selectedClient) {
    missingFields.push("Select client");
  }

  if (input.view === "details") {
    if (!hasText(input.clientName)) missingFields.push("Client name");
    if (!hasText(input.emailId)) missingFields.push("Email ID");
    if (!hasText(input.phoneNumber)) missingFields.push("Phone number");
    if (!hasText(input.address)) missingFields.push("Address");
    if (!hasText(input.projectDescription)) missingFields.push("Project description");
    if (!isValidDateString(input.validUntil)) missingFields.push("Quote valid until");
  }

  if (input.view === "services" && input.selectedServices.length === 0) {
    missingFields.push("At least one service");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

export const validateQuoteForReview = (
  input: Omit<QuoteValidationInput, "view" | "selectedClient"> & {
    selectedClient?: QuoteClient | null;
  }
): QuoteValidationResult => {
  const missingFields: string[] = [];

  if (!hasText(input.clientName) && !input.selectedClient?.name?.trim()) {
    missingFields.push("Client name");
  }

  if (!hasText(input.emailId) && !input.selectedClient?.email?.trim()) {
    missingFields.push("Email ID");
  }

  if (!hasText(input.phoneNumber) && !input.selectedClient?.phone?.trim()) {
    missingFields.push("Phone number");
  }

  if (!hasText(input.address)) {
    missingFields.push("Address");
  }

  if (!hasText(input.projectDescription)) {
    missingFields.push("Project description");
  }

  if (!isValidDateString(input.validUntil)) {
    missingFields.push("Quote valid until");
  }

  if (input.selectedServices.length === 0) {
    missingFields.push("At least one service");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

export const getQuoteValidationMessage = (
  validation: QuoteValidationResult
) => {
  if (validation.missingFields.length === 0) {
    return "Please complete the required fields.";
  }

  return `Please complete: ${validation.missingFields.join(", ")}`;
};

export const buildPreviewQuoteFromSummary = (
  snapshot: QuoteSummarySnapshot
): SalesQuoteDetailData => {
  const lineItems: SalesQuoteDetailLineItem[] = [
    ...snapshot.services.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      section_type: "service",
      quantity: item.quantity,
      duration_hours: item.duration,
      crew_size: item.crew,
      estimated_pricing: item.unitRate,
      line_total: item.amount,
    })),
    ...snapshot.addons.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      section_type: "addon",
      quantity: item.quantity,
      unit_rate: item.unitRate,
      line_total: item.amount,
    })),
    ...snapshot.logistics.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      section_type: "logistics",
      quantity: item.quantity,
      unit_rate: item.unitRate,
      line_total: item.amount,
    })),
    ...snapshot.customLineItems.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      section_type: "custom",
      quantity: item.quantity,
      unit_rate: item.unitRate,
      line_total: item.amount,
    })),
  ];

  return {
    client_name: snapshot.clientName,
    client_email: snapshot.clientEmail,
    client_phone: snapshot.clientPhone,
    client_address: snapshot.clientAddress,
    project_description: snapshot.projectDescription,
    video_shoot_type: snapshot.shootTypeLabel,
    quote_validity_days: snapshot.quoteValidityDays,
    valid_until: snapshot.validUntil,
    tax_type: snapshot.taxLabel,
    tax_rate: snapshot.taxRate,
    tax_amount: snapshot.taxAmount,
    discount_type: snapshot.discountEnabled ? snapshot.discountType : "none",
    discount_value: snapshot.discountEnabled ? snapshot.discountValue : 0,
    discount_amount: snapshot.discountAmount,
    subtotal: snapshot.subtotal,
    amount_after_tax: snapshot.amountAfterTax,
    amount_after_discount: snapshot.finalTotal,
    total_amount: snapshot.finalTotal,
    final_total: snapshot.finalTotal,
    terms_conditions: snapshot.termsConditions,
    line_items: lineItems,
  };
};
