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

export type QuoteAdditionalPaymentDetails = {
  additionalAmount: number;
  totalDelta: number;
  displayAmount: number;
  isDecrease: boolean;
  paymentStatus: string;
  previousTotal: number;
  previouslyPaidAmount: number;
  revisedTotal: number;
  outstandingAmount: number;
};

export type QuotePaymentProgressDetails = {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  hasFullPayment: boolean;
  isPartiallyPaid: boolean;
  canTakePayment: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
};

const getActivityMetadataRecord = (activity: unknown) => {
  const activityRecord = asRecord(activity);
  if (!activityRecord) {
    return null;
  }

  const directMetadata = asRecord(activityRecord.metadata);
  if (directMetadata) {
    return directMetadata;
  }

  if (typeof activityRecord.metadata_json === "string" && activityRecord.metadata_json.trim()) {
    try {
      return asRecord(JSON.parse(activityRecord.metadata_json));
    } catch {
      return null;
    }
  }

  return asRecord(activityRecord.metadata_json);
};

const getLatestQuotePaymentSummaryMetadata = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  if (!Array.isArray(quote?.activities) || quote.activities.length === 0) {
    return null;
  }

  let latestMetadata: Record<string, unknown> | null = null;
  let latestSortKey = Number.NEGATIVE_INFINITY;

  quote.activities.forEach((activity, index) => {
    const activityRecord = asRecord(activity);
    const metadata = getActivityMetadataRecord(activity);

    if (!activityRecord || !metadata) {
      return;
    }

    const changeSummary = asRecord(metadata.change_summary);
    const amountSummary = asRecord(changeSummary?.amount_summary);
    const hasRelevantPaymentSummary =
      getQuoteNumber(
        metadata.extra_amount,
        metadata.reduced_amount,
        metadata.collected_amount,
        metadata.amount_paid,
        metadata.new_total,
        metadata.previous_total,
        amountSummary?.new_total,
        amountSummary?.total_delta
      ) !== undefined || Boolean(getQuoteText(metadata.payment_status));

    if (!hasRelevantPaymentSummary) {
      return;
    }

    const createdAt = getQuoteText(activityRecord.created_at);
    const timestamp = createdAt ? new Date(createdAt).getTime() : Number.NaN;
    const sortKey = Number.isFinite(timestamp) ? timestamp : index;

    if (sortKey >= latestSortKey) {
      latestSortKey = sortKey;
      latestMetadata = metadata;
    }
  });

  return latestMetadata;
};

const PAID_PAYMENT_STATUSES = new Set(["paid", "success", "completed"]);

const getHistoricalConfirmedPaidAmount = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  if (!Array.isArray(quote?.activities) || quote.activities.length === 0) {
    return undefined;
  }

  let maxConfirmedPaidAmount: number | undefined;

  quote.activities.forEach((activity) => {
    const activityRecord = asRecord(activity);
    const metadata = getActivityMetadataRecord(activity);

    if (!activityRecord || !metadata) {
      return;
    }

    const paymentStatus = getQuoteText(metadata.payment_status, metadata.status).toLowerCase();
    const collectedAmount = getQuoteNumber(metadata.collected_amount, metadata.amount_paid);
    const activityType = getQuoteText(activityRecord.activity_type).toLowerCase();

    const candidates: number[] = [];

    // Use only explicit collected/paid values from payment-related activity metadata.
    // Do not infer paid amount from quote totals or "extra/reduced" deltas, because those
    // fields represent quote changes, not guaranteed money collected.
    if (
      collectedAmount !== undefined &&
      (activityType === "payment_completed" ||
        (activityType === "status_changed" && PAID_PAYMENT_STATUSES.has(paymentStatus)))
    ) {
      candidates.push(collectedAmount);
    }

    if (activityType === "status_changed" && paymentStatus === "paid") {
      if (collectedAmount !== undefined) {
        candidates.push(collectedAmount);
      }
    }

    candidates.forEach((candidate) => {
      if (!Number.isFinite(candidate)) {
        return;
      }

      maxConfirmedPaidAmount =
        maxConfirmedPaidAmount === undefined
          ? candidate
          : Math.max(maxConfirmedPaidAmount, candidate);
    });
  });

  return maxConfirmedPaidAmount;
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

  // The quote editor normalizes the service catalog label from "Location" to "Studio".
  // Keep detail/review normalization aligned so change diffs do not show mismatched labels.
  if (normalizedValue === "location") {
    return "Studio";
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

export const getQuoteAdditionalPaymentDetails = (
  quote: SalesQuoteDetailData | null | undefined,
  options?: {
    revisedTotalOverride?: number | null;
    previouslyPaidOverride?: number | null;
    previousTotalOverride?: number | null;
  }
): QuoteAdditionalPaymentDetails | null => {
  const additionalPayment = asRecord(quote?.additional_payment);
  const latestPaymentMetadata = getLatestQuotePaymentSummaryMetadata(quote);
  const latestChangeSummary = asRecord(latestPaymentMetadata?.change_summary);
  const latestAmountSummary = asRecord(latestChangeSummary?.amount_summary);
  const revisedTotalOverride = getQuoteNumber(options?.revisedTotalOverride);
  const previouslyPaidOverride = getQuoteNumber(options?.previouslyPaidOverride);
  const previousTotalOverride = getQuoteNumber(options?.previousTotalOverride);
  const historicalConfirmedPaidAmount = getHistoricalConfirmedPaidAmount(quote);
  const hasRevisionContext =
    Boolean(additionalPayment) ||
    Boolean(latestPaymentMetadata) ||
    Boolean(latestAmountSummary) ||
    revisedTotalOverride !== undefined ||
    previouslyPaidOverride !== undefined ||
    previousTotalOverride !== undefined ||
    getQuoteNumber(quote?.previous_total) !== undefined;

  if (!hasRevisionContext) {
    return null;
  }

  const previouslyPaidAmount = Math.max(
    0,
    previouslyPaidOverride !== undefined
      ? previouslyPaidOverride
      : getQuoteNumber(
          latestPaymentMetadata?.collected_amount,
          latestPaymentMetadata?.amount_paid,
          additionalPayment?.previously_paid_amount
        ) ?? 0
  );
  const previousTotal = Math.max(
    0,
    getQuoteNumber(
      previousTotalOverride,
      latestAmountSummary?.previous_total,
      latestPaymentMetadata?.previous_total,
      additionalPayment?.previous_total,
      quote?.previous_total,
      quote?.final_total,
      quote?.total_amount,
      quote?.total
    ) ?? 0
  );
  const revisedTotal = Math.max(
    0,
    getQuoteNumber(
      revisedTotalOverride,
      latestAmountSummary?.new_total,
      latestPaymentMetadata?.new_total,
      additionalPayment?.revised_total,
      quote?.final_total,
      quote?.total_amount,
      quote?.total
    ) ?? 0
  );
  const totalDelta = revisedTotal - previousTotal;
  const effectivePaidAmount =
    totalDelta < -0.009
      ? Math.max(previouslyPaidAmount, historicalConfirmedPaidAmount ?? 0)
      : previouslyPaidAmount;
  const derivedAdditionalAmount =
    revisedTotal > 0 || effectivePaidAmount > 0
      ? revisedTotal - effectivePaidAmount
      : 0;

  const metadataExtraAmount = getQuoteNumber(latestPaymentMetadata?.extra_amount);
  const metadataReducedAmount = getQuoteNumber(latestPaymentMetadata?.reduced_amount);
  const paymentStatus = getQuoteText(
    latestPaymentMetadata?.payment_status,
    additionalPayment?.payment_status
  ).toLowerCase();

  let effectiveMetadataAmount = metadataExtraAmount;
  if (
    metadataReducedAmount !== undefined &&
    metadataReducedAmount > 0 &&
    (metadataExtraAmount === undefined || metadataExtraAmount === 0)
  ) {
    effectiveMetadataAmount = -metadataReducedAmount;
  }

  const additionalAmount = derivedAdditionalAmount;
  const outstandingAmount = Math.max(0, additionalAmount);
  const displayAmount = Math.abs(additionalAmount);
  const isDecrease = additionalAmount < -0.009;

  if (
    displayAmount <= 0.009 &&
    previousTotal <= 0 &&
    previouslyPaidAmount <= 0 &&
    revisedTotal <= 0 &&
    outstandingAmount <= 0 &&
    !hasRevisionContext
  ) {
    return null;
  }

  return {
    additionalAmount,
    totalDelta,
    displayAmount,
    isDecrease,
    paymentStatus,
    previousTotal,
    previouslyPaidAmount: effectivePaidAmount,
    revisedTotal,
    outstandingAmount,
  };
};

export const getQuotePaymentProgressDetails = (
  quote: SalesQuoteDetailData | null | undefined,
  options?: {
    totalAmountOverride?: number | null;
    previouslyPaidOverride?: number | null;
    previousTotalOverride?: number | null;
    collectedAmountOverride?: number | null;
    manualPaidOverride?: number | null;
  }
): QuotePaymentProgressDetails => {
  const totalAmount = Math.max(
    0,
    getQuoteNumber(
      options?.totalAmountOverride,
      quote?.final_total,
      quote?.total_amount,
      quote?.total
    ) ?? 0
  );

  const additionalPaymentDetails = getQuoteAdditionalPaymentDetails(quote, {
    revisedTotalOverride: totalAmount,
    previouslyPaidOverride: getQuoteNumber(options?.previouslyPaidOverride),
    previousTotalOverride: getQuoteNumber(options?.previousTotalOverride),
  });

  const paidAmount = Math.max(
    additionalPaymentDetails?.previouslyPaidAmount ?? 0,
    getQuoteNumber(options?.collectedAmountOverride) ?? 0,
    getQuoteNumber(options?.manualPaidOverride) ?? 0,
    0
  );
  const pendingAmount = totalAmount - paidAmount;
  const normalizedPaymentStatus = additionalPaymentDetails?.paymentStatus ?? "";
  const isRevisionPending =
    normalizedPaymentStatus === "pending" || normalizedPaymentStatus === "partially_paid";
  const hasFullPayment = pendingAmount <= 0.009 && paidAmount > 0 && !isRevisionPending;

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    hasFullPayment,
    isPartiallyPaid:
      isRevisionPending || (!hasFullPayment && paidAmount > 0 && pendingAmount > 0.009),
    canTakePayment: pendingAmount > 0.009,
  };
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
