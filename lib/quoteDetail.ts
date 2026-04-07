import type { SalesQuoteDetailData, SalesQuoteDetailLineItem } from "@/lib/api";
import { getDefaultQuoteTerms, isGeneratedDefaultQuoteTerms } from "@/lib/quoteTerms";

export type NormalizedQuoteLineItemSection = "service" | "addon" | "logistics" | "custom";

export type NormalizedQuoteLineItem = {
  id: string;
  name: string;
  section: NormalizedQuoteLineItemSection;
  quantity: number;
  duration: number;
  crew: number;
  unitRate: number;
  amount: number;
  subtitle?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
};

export const getQuoteText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const formatQuoteItemDisplayName = (value: string) => {
  const normalizedValue = value.trim().toLowerCase().replace(/[_\s]+/g, " ");

  if (normalizedValue === "ai editing") {
    return "Editing";
  }

  return value.trim();
};

export const getQuoteNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

export const formatQuoteCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatQuoteDate = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const resolveSection = (
  item: SalesQuoteDetailLineItem
): NormalizedQuoteLineItemSection => {
  const rawSection = getQuoteText(
    item.section_type,
    item.category_slug,
    item.category_name,
    item.type
  ).toLowerCase();

  if (rawSection.includes("addon")) {
    return "addon";
  }

  if (
    rawSection.includes("logistic") ||
    rawSection.includes("travel") ||
    rawSection.includes("equipment") ||
    rawSection.includes("permit")
  ) {
    return "logistics";
  }

  if (rawSection.includes("custom") || rawSection.includes("line")) {
    return "custom";
  }

  return "service";
};

export const extractQuoteLineItems = (quote: SalesQuoteDetailData) => {
  if (Array.isArray(quote.line_items)) {
    return quote.line_items;
  }

  if (Array.isArray(quote.items)) {
    return quote.items;
  }

  if (Array.isArray(quote.quote_items)) {
    return quote.quote_items;
  }

  if (Array.isArray(quote.rows)) {
    return quote.rows;
  }

  if (Array.isArray(quote.data)) {
    return quote.data as SalesQuoteDetailLineItem[];
  }

  return [];
};

const resolveLineItemConfiguration = (item: SalesQuoteDetailLineItem) => {
  const directConfiguration = asRecord(item.configuration);
  if (directConfiguration) {
    return directConfiguration;
  }

  if (typeof item.configuration_json === "string" && item.configuration_json.trim()) {
    try {
      const parsedConfiguration = JSON.parse(item.configuration_json);
      return asRecord(parsedConfiguration);
    } catch {
      return null;
    }
  }

  return asRecord(item.configuration_json);
};

export type QuoteLineItemEditingTypeConfiguration = {
  editingTypeKey: string;
  editingTypeLabel: string;
  isCustomEditingType: boolean;
};

export const getQuoteLineItemEditingTypeConfiguration = (
  item: SalesQuoteDetailLineItem
): QuoteLineItemEditingTypeConfiguration | null => {
  const configuration = resolveLineItemConfiguration(item);
  if (!configuration) {
    return null;
  }

  const editingTypeLabel = getQuoteText(
    configuration.editing_type_label,
    configuration.editingTypeLabel
  );
  if (!editingTypeLabel) {
    return null;
  }

  const editingTypeKey =
    getQuoteText(configuration.editing_type_key, configuration.editingTypeKey) ||
    editingTypeLabel
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") ||
    "custom_editing_type";

  return {
    editingTypeKey,
    editingTypeLabel,
    isCustomEditingType:
      configuration.is_custom_editing_type === true ||
      configuration.isCustomEditingType === true ||
      Number(
        configuration.is_custom_editing_type ??
          configuration.isCustomEditingType ??
          0
      ) === 1,
  };
};

export const getQuoteLineItemEditingTypeLabel = (
  item: SalesQuoteDetailLineItem
) =>
  getQuoteLineItemEditingTypeConfiguration(item)?.editingTypeLabel || "";

const normalizeShootTypeLabelKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const parseStoredShootTypeLabels = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { video: "", photo: "", editing: "", isStructured: false };
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

  return { video, photo, editing, isStructured: Boolean(video || photo || editing) };
};

const buildStoredShootTypeLabel = ({
  video,
  photo,
  editing,
}: {
  video: string;
  photo: string;
  editing: string;
}) => {
  const entries = [
    video.trim() ? { prefix: "Video", label: video.trim() } : null,
    photo.trim() ? { prefix: "Photo", label: photo.trim() } : null,
    editing.trim() ? { prefix: "Editing", label: editing.trim() } : null,
  ].filter((entry): entry is { prefix: string; label: string } => Boolean(entry?.label));

  if (entries.length === 0) {
    return "";
  }

  const normalizedLabels = new Set(
    entries.map((entry) => normalizeShootTypeLabelKey(entry.label))
  );

  if (normalizedLabels.size === 1 || entries.length === 1) {
    return entries[0].label;
  }

  return entries.map((entry) => `${entry.prefix}: ${entry.label}`).join(" | ");
};

export const getQuoteDisplayShootTypeLabel = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  const rawShootTypeLabel = getQuoteText(quote?.video_shoot_type);
  const parsedShootTypeLabels = parseStoredShootTypeLabels(rawShootTypeLabel);
  const editingConfiguration = quote
    ? extractQuoteLineItems(quote)
        .map((item) => getQuoteLineItemEditingTypeConfiguration(item))
        .find((item): item is QuoteLineItemEditingTypeConfiguration => Boolean(item)) || null
    : "";
  const editingTypeLabel = editingConfiguration?.editingTypeLabel || "";

  if (!editingTypeLabel) {
    return rawShootTypeLabel;
  }

  if (!parsedShootTypeLabels.isStructured) {
    return editingTypeLabel;
  }

  return buildStoredShootTypeLabel({
    video: parsedShootTypeLabels.video,
    photo: parsedShootTypeLabels.photo,
    editing: editingTypeLabel || parsedShootTypeLabels.editing,
  });
};

export const normalizeQuoteLineItems = (
  quote: SalesQuoteDetailData
): NormalizedQuoteLineItem[] =>
  extractQuoteLineItems(quote).map((item, index) => {
    const section = resolveSection(item);
    const quantity = Math.max(1, getQuoteNumber(item.quantity) ?? 1);
    const duration = Math.max(
      0,
      getQuoteNumber(item.duration_hours, item.duration, item.hours) ?? 0
    );
    const crew = Math.max(
      0,
      getQuoteNumber(item.crew_size, item.crew, item.crew_count) ?? 0
    );
    const unitRate =
      getQuoteNumber(
        item.estimated_pricing,
        item.unit_rate,
        item.rate,
        item.effective_rate,
        item.price
      ) ?? 0;

    let amount = getQuoteNumber(item.line_total, item.total_amount, item.amount) ?? unitRate;

    if (getQuoteNumber(item.line_total, item.total_amount, item.amount) === undefined) {
      if (section === "service") {
        amount = quantity * (duration > 0 ? duration : 1) * (crew > 0 ? crew : 1) * unitRate;
      } else {
        amount = quantity * unitRate;
      }
    }

    const catalogItem = asRecord(item.catalog_item);
    const editingTypeLabel = getQuoteLineItemEditingTypeLabel(item);
    const directSubtitle = getQuoteText(item.subtitle);
    const resolvedName = editingTypeLabel
      ? getQuoteText(catalogItem?.name, item.name, item.label, item.item_name, "Line Item")
      : getQuoteText(item.item_name, item.name, item.label, catalogItem?.name, "Line Item");

    return {
      id: String(item.line_item_id ?? item.catalog_item_id ?? item.item_id ?? item.id ?? index),
      name: formatQuoteItemDisplayName(resolvedName),
      section,
      quantity,
      duration,
      crew,
      unitRate,
      amount,
      subtitle: editingTypeLabel ? `(${editingTypeLabel})` : directSubtitle || undefined,
    };
  });

export const normalizeQuoteTerms = (
  value: unknown,
  fallbackTerms: string[] = getDefaultQuoteTerms()
) => {
  const normalizeParsedTerms = (terms: string[]) => {
    if (terms.length === 0) {
      return fallbackTerms;
    }

    return isGeneratedDefaultQuoteTerms(terms) ? fallbackTerms : terms;
  };

  if (Array.isArray(value)) {
    const terms = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);

    return normalizeParsedTerms(terms);
  }

  if (typeof value === "string" && value.trim()) {
    const trimmedValue = value.trim();

    if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
      try {
        const parsedValue = JSON.parse(trimmedValue);

        if (Array.isArray(parsedValue)) {
          const terms = parsedValue
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean);

          return normalizeParsedTerms(terms);
        }
      } catch {
        // Fall back to plain-text parsing below.
      }
    }

    const normalizedValue = trimmedValue.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

    const terms = normalizedValue
      .split(/\r?\n|â€¢|•/)
      .map((item) => item.trim())
      .filter(Boolean);

    return normalizeParsedTerms(terms);
  }

  return fallbackTerms;
};

export const getQuoteSalesperson = (quote: SalesQuoteDetailData | null) => {
  if (!quote) {
    return "N/A";
  }

  const assignedSalesRep = asRecord(quote["assigned_sales_rep"]);
  const createdBy = asRecord(quote["created_by"]);

  return (
    getQuoteText(
      assignedSalesRep?.name,
      createdBy?.name,
      quote["salesperson"],
      quote["sales_person"],
      quote["sales_rep_name"],
      quote["created_by_name"]
    ) || "N/A"
  );
};
