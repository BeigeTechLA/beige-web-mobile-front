import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";

import { getDefaultQuoteTermsText } from "@/lib/quoteTerms";

type QuoteDraftSectionType = "service" | "addon" | "logistics" | "custom";

type QuoteDraftCatalogItem = {
  id: string | number;
  label?: string;
  price?: number;
  basePrice?: number;
  sourceType?: "custom" | "catalog";
};

type QuoteDraftClient = {
  client_id?: string | number | null;
  user_id?: string | number | null;
  id?: string | number | null;
  name?: string;
  email?: string;
  phone?: string;
};

type QuoteDraftShootType = {
  id: string | number;
  label?: string;
  key?: string;
  isCustom?: boolean;
};

type QuoteDraftServiceConfig = {
  quantity: number;
  duration: number;
  crewSize: number;
  estimatedPrice: number;
};

type QuoteDraftLineItemConfiguration = {
  editing_type_key: string;
  editing_type_label: string;
  is_custom_editing_type: boolean;
};

type QuoteDraftAddonConfig = {
  quantity: number;
  price: number;
};

type QuoteDraftSimplePriceConfig = {
  price: number;
};

export interface QuoteDraftPayload {
  pricing_mode: "general";
  client_user_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  project_description?: string;
  video_shoot_type?: string;
  quote_validity_days?: number;
  discount_type?: "percentage" | "fixed_amount";
  discount_value?: number;
  tax_type?: string;
  tax_rate?: number;
  terms_conditions?: string;
  line_items?: QuoteDraftLineItem[];
}

export interface QuoteUpdatePayload
  extends QuoteDraftPayload {
  is_draft?: boolean;
}

type QuoteDraftLineItem = {
  catalog_item_id?: number;
  source_type?: "custom";
  section_type: QuoteDraftSectionType;
  item_name?: string;
  rate_type?: "flat" | "per_hour";
  unit_rate?: number;
  quantity: number;
  duration_hours?: number;
  crew_size?: number;
  estimated_pricing?: number;
  configuration?: QuoteDraftLineItemConfiguration;
};

export interface BuildQuoteDraftPayloadInput {
  selectedClient: QuoteDraftClient | null;
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
  shootTypes: QuoteDraftShootType[];
  selectedEditingType: string;
  editingTypeOptions: QuoteDraftShootType[];
  selectedServices: string[];
  services: QuoteDraftCatalogItem[];
  serviceConfigs: Record<string, QuoteDraftServiceConfig>;
  selectedAddons: string[];
  addons: QuoteDraftCatalogItem[];
  appliedAddonConfigs: Record<string, QuoteDraftAddonConfig>;
  logisticsItems: QuoteDraftCatalogItem[];
  appliedLogisticsConfigs: Record<string, QuoteDraftSimplePriceConfig>;
  lineItems: QuoteDraftCatalogItem[];
  appliedLineItemConfigs: Record<string, QuoteDraftSimplePriceConfig>;
  termsConditions?: string;
  maxStep?: QuoteDraftStep;
}

export type QuoteDraftStep =
  | "selection"
  | "details"
  | "services"
  | "addons"
  | "logistics"
  | "customlineitems"
  | "discounts"
  | "tax";

const QUOTE_DRAFT_STEP_ORDER: QuoteDraftStep[] = [
  "selection",
  "details",
  "services",
  "addons",
  "logistics",
  "customlineitems",
  "discounts",
  "tax",
];

export function buildQuoteDraftPayload(
  input: BuildQuoteDraftPayloadInput
): QuoteDraftPayload {
  const clientUserId = getPositiveInteger(
    input.selectedClient?.client_id ??
      input.selectedClient?.user_id ??
      input.selectedClient?.id
  );
  const shootTypeLabel =
    input.shootTypes.find((type) => String(type.id) === input.selectedShootType)?.label ??
    toTitleCase(input.selectedShootType);
  const includeSelection = hasReachedStep(input.maxStep, "selection");
  const includeDetails = hasReachedStep(input.maxStep, "details");
  const includeServices = hasReachedStep(input.maxStep, "services");
  const includeAddons = hasReachedStep(input.maxStep, "addons");
  const includeLogistics = hasReachedStep(input.maxStep, "logistics");
  const includeCustomLineItems = hasReachedStep(input.maxStep, "customlineitems");
  const includeDiscounts = hasReachedStep(input.maxStep, "discounts");
  const includeTax = hasReachedStep(input.maxStep, "tax");

  const lineItems: QuoteDraftLineItem[] = [
    ...(includeServices
      ? buildServiceItems(
          input.selectedServices,
          input.services,
          input.serviceConfigs,
          input.selectedEditingType,
          input.editingTypeOptions
        )
      : []),
    ...(includeAddons
      ? buildAddonItems(input.selectedAddons, input.addons, input.appliedAddonConfigs)
      : []),
    ...(includeLogistics
      ? buildSimpleItems("logistics", input.logisticsItems, input.appliedLogisticsConfigs)
      : []),
    ...(includeCustomLineItems
      ? buildSimpleItems("custom", input.lineItems, input.appliedLineItemConfigs)
      : []),
  ];

  const payload: QuoteDraftPayload = {
    pricing_mode: "general",
    ...(clientUserId ? { client_user_id: clientUserId } : {}),
  };

  if (includeSelection) {
    payload.client_name = input.clientName.trim() || input.selectedClient?.name?.trim() || "";
    payload.client_email = input.emailId.trim() || input.selectedClient?.email?.trim() || "";
    payload.client_phone = input.phoneNumber.trim() || input.selectedClient?.phone?.trim() || "";
  }

  if (includeDetails) {
    payload.client_address = input.address.trim();
    payload.project_description = input.projectDescription.trim();
    payload.quote_validity_days = resolveQuoteValidityDays(input.validityDays, input.validUntil);
  }

  if (includeServices) {
    payload.video_shoot_type = shootTypeLabel;
  }

  if (includeDiscounts) {
    payload.discount_type =
      input.discountType === "fixed" ? "fixed_amount" : "percentage";
    payload.discount_value = input.discountEnabled ? normalizeNumber(input.discountValue) : 0;
  }

  if (includeTax) {
    payload.tax_type = input.taxLabel.trim() || "Sales Tax";
    payload.tax_rate = normalizeNumber(input.normalizedTaxRate);
  }

  if (includeTax || input.maxStep === undefined) {
    payload.terms_conditions =
      input.termsConditions?.trim() || getDefaultQuoteTermsText(input.validUntil);
  }

  if (lineItems.length > 0 || includeServices || includeAddons || includeLogistics || includeCustomLineItems) {
    payload.line_items = lineItems;
  }

  return payload;
}

export function buildQuoteUpdatePayload(
  input: BuildQuoteDraftPayloadInput
): QuoteUpdatePayload {
  const draftPayload = buildQuoteDraftPayload(input);
  return {
    ...draftPayload,
    line_items: draftPayload.line_items?.map((lineItem) => {
      if (!lineItem.configuration) {
        return lineItem;
      }

      return {
        ...lineItem,
        configuration: lineItem.configuration.is_custom_editing_type
          ? {
              editing_type_label: lineItem.configuration.editing_type_label,
              is_custom_editing_type: true,
            }
          : {
              editing_type_key: lineItem.configuration.editing_type_key,
              is_custom_editing_type: false,
            },
      };
    }),
  };
}

function buildServiceItems(
  selectedServices: string[],
  services: QuoteDraftCatalogItem[],
  serviceConfigs: Record<string, QuoteDraftServiceConfig>,
  selectedEditingType: string,
  editingTypeOptions: QuoteDraftShootType[]
): QuoteDraftLineItem[] {
  const selectedEditingTypeOption = editingTypeOptions.find(
    (option) => String(option.id) === String(selectedEditingType)
  );

  return selectedServices
    .map((serviceId) => {
      const service = services.find((item) => String(item.id) === serviceId);
      const config = serviceConfigs[serviceId];

      if (!service || !config) {
        return null;
      }

      const catalogItemId = getPositiveInteger(service.id);
      const quantity = 1;
      const estimatedPricing = Math.max(
        0,
        normalizeNumber(config.estimatedPrice || service.price)
      );
      const serviceLabel = service.label?.trim() || "";
      const editingConfiguration =
        isEditingServiceLabel(serviceLabel) &&
        selectedEditingTypeOption?.label?.trim()
          ? {
              editing_type_key:
                selectedEditingTypeOption.key?.trim() ||
                buildEditingTypeKey(selectedEditingTypeOption.label),
              editing_type_label: selectedEditingTypeOption.label.trim(),
              is_custom_editing_type: Boolean(selectedEditingTypeOption.isCustom),
            }
          : undefined;

      if (catalogItemId) {
        return {
          catalog_item_id: catalogItemId,
          section_type: "service",
          quantity,
          duration_hours: Math.max(0, normalizeNumber(config.duration)),
          crew_size: Math.max(1, normalizeNumber(config.crewSize)),
          estimated_pricing: estimatedPricing,
          ...(editingConfiguration ? { configuration: editingConfiguration } : {}),
        };
      }

      return {
        source_type: "custom",
        section_type: "service",
        item_name: service.label || "Custom Service",
        rate_type: "per_hour",
        unit_rate: estimatedPricing,
        quantity,
        duration_hours: Math.max(0, normalizeNumber(config.duration)),
        crew_size: Math.max(1, normalizeNumber(config.crewSize)),
        estimated_pricing: estimatedPricing,
        ...(editingConfiguration ? { configuration: editingConfiguration } : {}),
      };
    })
    .filter((item): item is QuoteDraftLineItem => item !== null);
}

function isEditingServiceLabel(label: string) {
  return /\bedit(?:ing)?\b/.test(label.trim().toLowerCase());
}

function buildEditingTypeKey(label?: string) {
  const normalizedLabel = (label || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedLabel || "custom_editing_type";
}

function buildAddonItems(
  selectedAddons: string[],
  addons: QuoteDraftCatalogItem[],
  appliedAddonConfigs: Record<string, QuoteDraftAddonConfig>
): QuoteDraftLineItem[] {
  return selectedAddons
    .map((addonId) => {
      const addon = addons.find((item) => String(item.id) === addonId);
      const config = appliedAddonConfigs[addonId];

      if (!addon) {
        return null;
      }

      const quantity = Math.max(1, normalizeNumber(config?.quantity ?? 1));
      const catalogItemId = getPositiveInteger(addon.id);
      const estimatedPricing = Math.max(
        0,
        normalizeNumber(config?.price ?? addon.price)
      );

      if (catalogItemId) {
        return {
          catalog_item_id: catalogItemId,
          section_type: "addon",
          quantity,
          estimated_pricing: estimatedPricing,
        };
      }

      return {
        source_type: "custom",
        section_type: "addon",
        item_name: addon.label || "Custom Add-on",
        rate_type: "flat",
        unit_rate: estimatedPricing,
        quantity,
        estimated_pricing: estimatedPricing,
      };
    })
    .filter((item): item is QuoteDraftLineItem => item !== null);
}

function buildSimpleItems(
  sectionType: "logistics" | "custom",
  items: QuoteDraftCatalogItem[],
  appliedConfigs: Record<string, QuoteDraftSimplePriceConfig>
): QuoteDraftLineItem[] {
  return items
    .map((item) => {
      const price = Math.max(
        0,
        normalizeNumber(appliedConfigs[String(item.id)]?.price ?? item.basePrice ?? item.price)
      );
      const catalogItemId = getPositiveInteger(item.id);
      const isCustomItem = item.sourceType === "custom" || !catalogItemId;

      if (sectionType === "custom") {
        return {
          ...(catalogItemId ? { catalog_item_id: catalogItemId } : {}),
          source_type: "custom",
          section_type: sectionType,
          item_name: item.label?.trim() || "Custom Item",
          rate_type: "flat",
          unit_rate: price,
          quantity: 1,
          estimated_pricing: price,
        };
      }

      if (!isCustomItem && catalogItemId) {
        return {
          catalog_item_id: catalogItemId,
          section_type: sectionType,
          quantity: 1,
          estimated_pricing: price,
        };
      }

      return {
        source_type: "custom",
        section_type: sectionType,
        item_name: item.label?.trim() || "Custom Item",
        rate_type: "flat",
        unit_rate: price,
        quantity: 1,
        estimated_pricing: price,
      };
    })
    .filter((item): item is QuoteDraftLineItem => item !== null);
}

function resolveQuoteValidityDays(
  validityDays: number | "custom",
  validUntil: string
): number {
  if (typeof validityDays === "number" && Number.isFinite(validityDays)) {
    return Math.max(1, Math.round(validityDays));
  }

  if (!validUntil) {
    return 7;
  }

  const parsedDate = parseISO(validUntil);
  if (!isValid(parsedDate)) {
    return 7;
  }

  return Math.max(
    1,
    differenceInCalendarDays(startOfDay(parsedDate), startOfDay(new Date()))
  );
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getPositiveInteger(value: unknown): number | undefined {
  const parsed = normalizeNumber(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasReachedStep(maxStep: QuoteDraftStep | undefined, targetStep: QuoteDraftStep) {
  if (!maxStep) {
    return true;
  }

  return QUOTE_DRAFT_STEP_ORDER.indexOf(maxStep) >= QUOTE_DRAFT_STEP_ORDER.indexOf(targetStep);
}
