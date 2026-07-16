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
  preProductionNotes?: string;
  preProductionFile?: {
    name: string;
    type: string;
    size: number;
    content?: string;
    path?: string;
    url?: string;
  } | null;
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
  preProductionNotes?: string;
  preProductionFile?: {
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
  preProductionNotes?: string;
  preProductionFile?: unknown;
  validUntil: string;
  selectedServices: string[];
}

export interface QuoteValidationResult {
  isValid: boolean;
  missingFields: string[];
}

const hasText = (value: string) => value.trim().length > 0;

export const hasQuoteSummaryContent = (input: {
  selectedClient: QuoteClient | null;
  clientName: string;
  emailId: string;
  phoneNumber: string;
  address: string;
  projectDescription: string;
  validUntil: string;
  selectedShootType: string;
  selectedServices: string[];
  selectedAddons: string[];
  logisticsItems: QuoteCatalogItem[];
  lineItems: QuoteCatalogItem[];
  discountEnabled: boolean;
  discountValue: number | string;
  normalizedTaxRate: number;
}) =>
  Boolean(
    input.selectedClient ||
      hasText(input.clientName) ||
      hasText(input.emailId) ||
      hasText(input.phoneNumber) ||
      hasText(input.address) ||
      hasText(input.projectDescription) ||
      hasText(input.preProductionNotes || "") ||
      Boolean(input.preProductionFile) ||
      hasText(input.validUntil) ||
      hasText(input.selectedShootType) ||
      input.selectedServices.length > 0 ||
      input.selectedAddons.length > 0 ||
      input.logisticsItems.length > 0 ||
      input.lineItems.length > 0 ||
      input.discountEnabled ||
      normalizeNumber(input.discountValue) > 0 ||
      normalizeNumber(input.normalizedTaxRate) > 0
  );

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

const isEditingServiceLabel = (label: string) =>
  /\bedit(?:ing)?\b/.test(label.trim().toLowerCase());

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

const parseShootTypeLabels = (value: string) => {
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

const buildServiceItems = (
  selectedServices: string[],
  services: QuoteCatalogItem[],
  serviceConfigs: Record<string, QuoteServiceConfig>,
  shootTypeLabel: string
) => {
  const parsedShootTypeLabels = parseShootTypeLabels(shootTypeLabel);

  return selectedServices
    .map((serviceId) => {
      const service = services.find((item) => String(item.id) === serviceId);
      const config = serviceConfigs[serviceId];

      if (!service || !config) {
        return null;
      }

      const serviceName = service.label?.trim() || service.name?.trim() || "Service";
      const normalizedServiceName = serviceName.toLowerCase();
      const isEditingService = isEditingServiceLabel(normalizedServiceName);
      const quantity = isEditingService
        ? Math.max(1, normalizeNumber(config.crewSize))
        : 1;
      const duration = isEditingService
        ? 0
        : Math.max(0, normalizeNumber(config.duration));
      const crew = isEditingService
        ? 0
        : Math.max(1, normalizeNumber(config.crewSize));
      const unitRate = Math.max(
        0,
        normalizeNumber(config.estimatedPrice || service.price || service.basePrice)
      );
      const serviceShootTypeLabel =
        normalizedServiceName === "videography"
          ? parsedShootTypeLabels.video
          : normalizedServiceName === "photography"
            ? parsedShootTypeLabels.photo
            : isEditingServiceLabel(normalizedServiceName)
              ? parsedShootTypeLabels.editing
              : "";
      const shouldShowShootTypeSubtitle = Boolean(
        serviceShootTypeLabel &&
          (
            normalizedServiceName === "videography" ||
            normalizedServiceName === "photography" ||
            isEditingServiceLabel(normalizedServiceName)
          )
      );

      return {
        id: String(service.id),
        name: serviceName,
        section: "service" as const,
        quantity,
        duration,
        crew,
        unitRate,
        amount: isEditingService
          ? quantity * unitRate
          : Math.max(duration, 1) * Math.max(crew, 1) * unitRate,
        subtitle:
          shouldShowShootTypeSubtitle && serviceShootTypeLabel
            ? `(${serviceShootTypeLabel})`
            : undefined,
      };
    })
    .filter((item): item is QuoteSummaryLineItem => item !== null);
};

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
  const discountValue = Math.max(0, normalizeNumber(input.discountValue));
  const rawDiscountAmount = !input.discountEnabled
    ? 0
    : input.discountType === "percentage"
      ? subtotal * (discountValue / 100)
      : discountValue;
  const discountAmount = Math.min(rawDiscountAmount, subtotal);
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const taxRate = Math.max(0, normalizeNumber(input.normalizedTaxRate));
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const amountAfterTax = discountedSubtotal + taxAmount;
  const quoteValidityDays = resolveValidityDays(input.validityDays, input.validUntil);
  const termsConditions = hasText(input.validUntil)
    ? getDefaultQuoteTerms(input.validUntil)
    : [];

  return {
    clientName: input.clientName.trim() || input.selectedClient?.name?.trim() || "",
    clientEmail: input.emailId.trim() || input.selectedClient?.email?.trim() || "",
    clientPhone: input.phoneNumber.trim() || input.selectedClient?.phone?.trim() || "",
    clientAddress: input.address.trim(),
    projectDescription: input.projectDescription.trim(),
    preProductionNotes: input.preProductionNotes?.trim() || "",
    preProductionFile: input.preProductionFile
      ? {
          name: input.preProductionFile.name,
          type: input.preProductionFile.type || "application/octet-stream",
          size: input.preProductionFile.size,
          content: input.preProductionFile.content,
          path: input.preProductionFile.path,
          url: input.preProductionFile.url,
        }
      : null,
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
    finalTotal: amountAfterTax,
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
      subtitle: item.subtitle,
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
      subtitle: item.subtitle,
      section_type: "addon",
      quantity: item.quantity,
      unit_rate: item.unitRate,
      line_total: item.amount,
    })),
    ...snapshot.logistics.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      subtitle: item.subtitle,
      section_type: "logistics",
      quantity: item.quantity,
      unit_rate: item.unitRate,
      line_total: item.amount,
    })),
    ...snapshot.customLineItems.map((item) => ({
      line_item_id: item.id,
      item_name: item.name,
      subtitle: item.subtitle,
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
    pre_production_notes: snapshot.preProductionNotes || null,
    pre_production_file_name: snapshot.preProductionFile?.name || null,
    pre_production_file_type: snapshot.preProductionFile?.type || null,
    pre_production_file_size: snapshot.preProductionFile?.size || null,
    pre_production_file_content: snapshot.preProductionFile?.content || null,
    pre_production_file_path: snapshot.preProductionFile?.path || null,
    pre_production_file_url: snapshot.preProductionFile?.url || null,
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
