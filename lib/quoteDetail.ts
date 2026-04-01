import type { SalesQuoteDetailData, SalesQuoteDetailLineItem } from "@/lib/api";

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
        item.unit_rate,
        item.estimated_pricing,
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

    return {
      id: String(item.line_item_id ?? item.catalog_item_id ?? item.item_id ?? item.id ?? index),
      name: formatQuoteItemDisplayName(
        getQuoteText(item.item_name, item.name, item.label, "Line Item")
      ),
      section,
      quantity,
      duration,
      crew,
      unitRate,
      amount,
    };
  });

export const normalizeQuoteTerms = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    const terms = value
      .split(/\r?\n|â€¢|•/)
      .map((item) => item.trim())
      .filter(Boolean);

    return terms.length > 0 ? terms : [value.trim()];
  }

  return ["50% deposit required before production starts."];
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
