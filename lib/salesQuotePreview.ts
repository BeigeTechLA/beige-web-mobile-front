import type { SalesQuoteDetailData } from "@/lib/api";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const extractPositiveId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim();
    const numeric = Number(normalized);

    if (Number.isInteger(numeric) && numeric > 0) {
      return String(numeric);
    }
  }

  return null;
};

const hasResponseEnvelope = (record: UnknownRecord) => {
  return "success" in record || "error" in record || "message" in record;
};

const looksLikeQuoteRecord = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  return [
    "quote_id",
    "quote_number",
    "quote_status",
    "client_name",
    "project_description",
    "line_items",
    "total_amount",
  ].some((key) => key in record);
};

const getNestedCandidates = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const dataRecord = asRecord(record.data);

  return [
    record.data,
    record.quote,
    record.item,
    record.result,
    record.details,
    dataRecord?.quote,
    dataRecord?.item,
    dataRecord?.result,
  ].filter(Boolean);
};

export const extractQuoteIdFromResponse = (value: unknown): string | null => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    const record = asRecord(current);
    if (!record) {
      continue;
    }

    const directId = extractPositiveId(
      record.quote_id ?? record.quoteId ?? record["quoteID"]
    );
    if (directId) {
      return directId;
    }

    const fallbackId = extractPositiveId(record.id);
    if (fallbackId && (looksLikeQuoteRecord(record) || !hasResponseEnvelope(record))) {
      return fallbackId;
    }

    queue.push(...getNestedCandidates(record));
  }

  return null;
};

export const unwrapSalesQuoteDetail = (
  value: SalesQuoteDetailData | null | undefined
): SalesQuoteDetailData | null => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (looksLikeQuoteRecord(current)) {
      return current as SalesQuoteDetailData;
    }

    queue.push(...getNestedCandidates(current));
  }

  return asRecord(value) as SalesQuoteDetailData | null;
};
