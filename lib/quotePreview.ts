import type { SalesQuoteDetailData } from "@/lib/api";

type QuotePreviewLinkOptions = {
  quoteId?: string | number | null;
  quoteKey?: string | number | null;
};

type UnknownRecord = Record<string, unknown>;

export const QUOTE_PREVIEW_SUPERSEDED_REASON = "QUOTE_PREVIEW_SUPERSEDED";

export class QuotePreviewFetchError extends Error {
  reasonCode: string | null;
  payload: unknown;

  constructor(message: string, reasonCode?: string | null, payload?: unknown) {
    super(message);
    this.name = "QuotePreviewFetchError";
    this.reasonCode = reasonCode || null;
    this.payload = payload;
  }
}

const QUOTE_PREVIEW_KEY_FIELDS = [
  "public_quote_key",
  "publicQuoteKey",
  "quote_public_key",
  "quotePublicKey",
  "public_quote_token",
  "publicQuoteToken",
  "quote_preview_token",
  "quotePreviewToken",
  "preview_token",
  "previewToken",
  "preview_key",
  "previewKey",
  "share_token",
  "shareToken",
  "share_key",
  "shareKey",
  "access_key",
  "accessKey",
  "public_access_key",
  "publicAccessKey",
  "quote_uuid",
  "quoteUuid",
  "uuid",
  "public_id",
  "publicId",
  "quote_key",
  "quoteKey",
];

const QUOTE_PREVIEW_URL_FIELDS = [
  "public_quote_url",
  "publicQuoteUrl",
  "share_url",
  "shareUrl",
  "preview_url",
  "previewUrl",
  "public_url",
  "publicUrl",
];

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const getNormalizedString = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const getQuotePreviewErrorReasonCode = (value: unknown) => {
  const record = asRecord(value);
  const dataRecord = asRecord(record?.data);
  return (
    getNormalizedString(record?.reason_code) ||
    getNormalizedString(record?.reasonCode) ||
    getNormalizedString(record?.code) ||
    getNormalizedString(dataRecord?.reason_code) ||
    getNormalizedString(dataRecord?.reasonCode) ||
    getNormalizedString(dataRecord?.code)
  );
};

const getQuotePreviewErrorMessage = (value: unknown) => {
  const record = asRecord(value);
  return (
    getNormalizedString(record?.error) ||
    getNormalizedString(record?.message) ||
    "Failed to fetch quote preview."
  );
};

const isOpaqueQuotePreviewKey = (value: string | null) => {
  if (!value) {
    return false;
  }

  return !/^\d+$/.test(value);
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

const extractQuotePreviewKeyFromUrl = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://placeholder.local");
    const queryQuoteKey = getNormalizedString(parsed.searchParams.get("quoteKey"));

    if (isOpaqueQuotePreviewKey(queryQuoteKey)) {
      return queryQuoteKey;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = getNormalizedString(segments.at(-1) ?? null);

    if (isOpaqueQuotePreviewKey(lastSegment)) {
      return lastSegment;
    }
  } catch {
    return null;
  }

  return null;
};

export const normalizeQuotePreviewUrlForClient = (
  value?: string | null,
  quoteKey?: string | null
) => {
  const normalizedValue = getNormalizedString(value);
  const normalizedQuoteKey = getNormalizedString(quoteKey);

  if (typeof window === "undefined") {
    if (normalizedValue) {
      return normalizedValue;
    }

    if (normalizedQuoteKey) {
      return buildQuotePreviewPath({ quoteKey: normalizedQuoteKey });
    }

    return null;
  }

  if (normalizedQuoteKey) {
    return `${window.location.origin}${buildQuotePreviewPath({ quoteKey: normalizedQuoteKey })}`;
  }

  if (!normalizedValue) {
    return null;
  }

  try {
    const parsed = new URL(normalizedValue, window.location.origin);
    return `${window.location.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return normalizedValue.startsWith("/")
      ? `${window.location.origin}${normalizedValue}`
      : normalizedValue;
  }
};

export const resolveSecureQuotePreviewKey = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  const queue: unknown[] = [quote];
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

    for (const field of QUOTE_PREVIEW_KEY_FIELDS) {
      const candidate = getNormalizedString(record[field]);

      if (isOpaqueQuotePreviewKey(candidate)) {
        return candidate;
      }
    }

    for (const field of QUOTE_PREVIEW_URL_FIELDS) {
      const candidate = getNormalizedString(record[field]);
      const extractedKey = extractQuotePreviewKeyFromUrl(candidate);

      if (extractedKey) {
        return extractedKey;
      }
    }

    queue.push(...getNestedCandidates(record));
  }

  return null;
};

export const resolveSecureQuotePreviewUrl = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  const queue: unknown[] = [quote];
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

    for (const field of QUOTE_PREVIEW_URL_FIELDS) {
      const candidate = getNormalizedString(record[field]);

      if (!candidate) {
        continue;
      }

      if (extractQuotePreviewKeyFromUrl(candidate)) {
        return candidate;
      }
    }

    queue.push(...getNestedCandidates(record));
  }

  return null;
};

export const buildQuotePreviewPath = ({
  quoteId,
  quoteKey,
}: QuotePreviewLinkOptions = {}) => {
  const normalizedQuoteKey = getNormalizedString(quoteKey);

  if (normalizedQuoteKey) {
    return `/quotes/preview?quoteKey=${encodeURIComponent(normalizedQuoteKey)}`;
  }

  const normalizedQuoteId = getNormalizedString(quoteId);

  if (!normalizedQuoteId) {
    return "/quotes/preview";
  }

  return `/quotes/preview?quoteId=${encodeURIComponent(normalizedQuoteId)}`;
};

export const buildAbsoluteQuotePreviewUrl = ({
  quoteId,
  quoteKey,
}: QuotePreviewLinkOptions = {}) => {
  const previewPath = buildQuotePreviewPath({ quoteId, quoteKey });

  if (typeof window === "undefined") {
    return previewPath;
  }

  return `${window.location.origin}${previewPath}`;
};

export const createSignedQuotePreviewUrl = async (
  quoteId?: string | number | null
) => {
  const normalizedQuoteId = getNormalizedString(quoteId);

  if (!normalizedQuoteId) {
    throw new Error("A valid quote id is required.");
  }

  const response = await fetch("/api/quotes/preview-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteId: normalizedQuoteId,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        error?: string;
        data?: {
          previewUrl?: string;
        } | null;
      }
    | null;

  if (!response.ok || data?.success === false) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Failed to create quote preview link."
    );
  }

  const previewUrl = normalizeQuotePreviewUrlForClient(
    getNormalizedString(data?.data?.previewUrl),
    getNormalizedString(data?.data?.quoteKey)
  );

  if (!previewUrl) {
    throw new Error("Quote preview link is unavailable.");
  }

  return previewUrl;
};

export const fetchQuotePreviewByKey = async (quoteKey?: string | null) => {
  const normalizedQuoteKey = getNormalizedString(quoteKey);

  if (!normalizedQuoteKey) {
    throw new Error("A valid quote key is required.");
  }

  const response = await fetch(
    `/api/quotes/preview?quoteKey=${encodeURIComponent(normalizedQuoteKey)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new QuotePreviewFetchError(
      getQuotePreviewErrorMessage(data),
      getQuotePreviewErrorReasonCode(data),
      data
    );
  }

  return data;
};
