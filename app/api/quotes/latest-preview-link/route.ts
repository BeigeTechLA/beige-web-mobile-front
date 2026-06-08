import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const getString = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const findField = (value: unknown, fields: string[]) => {
  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const record = asRecord(current);
    if (!record) continue;

    for (const field of fields) {
      const candidate = getString(record[field]);
      if (candidate) return candidate;
    }

    queue.push(...Object.values(record));
  }

  return null;
};

const resolvePreviewUrl = (value: unknown) => {
  const url = findField(value, [
    "latest_preview_url",
    "latestPreviewUrl",
    "latest_quote_url",
    "latestQuoteUrl",
    "public_quote_url",
    "publicQuoteUrl",
    "preview_url",
    "previewUrl",
    "share_url",
    "shareUrl",
  ]);
  const key = findField(value, [
    "latest_quote_key",
    "latestQuoteKey",
    "latest_preview_key",
    "latestPreviewKey",
    "quote_key",
    "quoteKey",
    "public_quote_key",
    "publicQuoteKey",
  ]);
  const nestedKey = findField(asRecord(value)?.data, [
    "quote_key",
    "quoteKey",
    "public_quote_key",
    "publicQuoteKey",
  ]);

  if (url) return url;
  if (key) return `/quotes/preview?quoteKey=${encodeURIComponent(key)}`;
  if (nestedKey) return `/quotes/preview?quoteKey=${encodeURIComponent(nestedKey)}`;
  return null;
};

const normalizeQuoteId = (value: unknown) => {
  const id = getString(value);
  return id && /^\d+$/.test(id) ? id : null;
};

const extractRows = (value: unknown): UnknownRecord[] => {
  const record = asRecord(value);
  const dataRecord = asRecord(record?.data);
  const candidates = [
    value,
    record?.data,
    record?.quotes,
    record?.items,
    record?.rows,
    record?.results,
    dataRecord?.quotes,
    dataRecord?.items,
    dataRecord?.rows,
    dataRecord?.results,
    dataRecord?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.flatMap((item) => {
        const itemRecord = asRecord(item);
        return itemRecord ? [itemRecord] : [];
      });
    }
  }

  return [];
};

const getQuoteId = (value: unknown) =>
  normalizeQuoteId(
    findField(value, ["sales_quote_id", "salesQuoteId", "quote_id", "quoteId", "id"])
  );

const getVersionNumber = (value: unknown) => {
  const normalized = getString(
    asRecord(value)?.version_number ??
      asRecord(value)?.versionNumber ??
      asRecord(value)?.quote_version_number ??
      asRecord(value)?.quoteVersionNumber
  );
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const getApprovalStatus = (value: unknown) =>
  getString(
    asRecord(value)?.approval_status ??
      asRecord(value)?.approvalStatus ??
      asRecord(value)?.change_request_status ??
      asRecord(value)?.changeRequestStatus ??
      asRecord(value)?.review_status ??
      asRecord(value)?.reviewStatus ??
      asRecord(value)?.version_status ??
      asRecord(value)?.versionStatus
  )?.toLowerCase() || "";

const isApprovedVersion = (value: unknown) => {
  const status = getApprovalStatus(value);
  return !status || ["approved", "accepted", "current"].includes(status);
};

const isCurrentVersion = (value: unknown) => {
  const record = asRecord(value);
  return Boolean(record?.is_current || record?.isCurrent || record?.current);
};

const rowMatchesQuoteKey = (row: UnknownRecord, quoteKey: string) => {
  const key = quoteKey.toLowerCase();
  const candidates = [
    "public_quote_key",
    "publicQuoteKey",
    "quote_public_key",
    "quotePublicKey",
    "quote_key",
    "quoteKey",
    "preview_key",
    "previewKey",
    "share_key",
    "shareKey",
    "access_key",
    "accessKey",
  ];

  return candidates.some((field) => getString(row[field])?.toLowerCase() === key);
};

const createPreviewLink = async (baseUrl: string, authToken: string, quoteId: string) => {
  const versionsResponse = await fetch(`${baseUrl}/sales/quotes/${quoteId}/versions`, {
    headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
    cache: "no-store",
  }).catch(() => null);
  const versionsPayload = versionsResponse ? await versionsResponse.json().catch(() => null) : null;
  const versions = extractRows(versionsPayload);
  const latestVersion =
    versions.find((version) => isCurrentVersion(version) && isApprovedVersion(version)) ||
    versions
      .filter((version) => getVersionNumber(version) != null && isApprovedVersion(version))
      .sort((a, b) => (getVersionNumber(b) || 0) - (getVersionNumber(a) || 0))[0] ||
    null;
  const latestQuoteId = getQuoteId(latestVersion) || quoteId;

  const response = await fetch(`${baseUrl}/sales/quotes/${latestQuoteId}/preview-link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  const previewUrl = resolvePreviewUrl(payload);

  if (response.ok && previewUrl) {
    return previewUrl;
  }

  return null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const quoteKey = getString(body?.quoteKey);

    if (!quoteKey) {
      return NextResponse.json(
        { success: false, error: "A quote key is required." },
        { status: 400 }
      );
    }

    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const encodedKey = encodeURIComponent(quoteKey);
    const candidates: Array<{ url: string; init?: RequestInit }> = [
      { url: `${baseUrl}/sales/quotes/public/by-key/${encodedKey}/latest-link` },
      { url: `${baseUrl}/sales/quotes/public/by-key/${encodedKey}/latest` },
      { url: `${baseUrl}/sales/quotes/public/by-key/${encodedKey}?latest=true` },
      {
        url: `${baseUrl}/sales/quotes/public/latest-link`,
        init: {
          method: "POST",
          body: JSON.stringify({ quote_key: quoteKey, quoteKey }),
        },
      },
    ];

    let lastPayload: unknown = null;

    for (const candidate of candidates) {
      const response = await fetch(candidate.url, {
        method: candidate.init?.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: candidate.init?.body,
        cache: "no-store",
      }).catch(() => null);

      if (!response) continue;

      const payload = await response.json().catch(() => null);
      lastPayload = payload || lastPayload;
      const previewUrl = resolvePreviewUrl(payload);
      const reasonCode =
        getString(asRecord(payload)?.reason_code) ||
        getString(asRecord(payload)?.reasonCode) ||
        getString(asRecord(asRecord(payload)?.data)?.reason_code) ||
        getString(asRecord(asRecord(payload)?.data)?.reasonCode);

      if (reasonCode === "QUOTE_PREVIEW_APPROVAL_PENDING") {
        return NextResponse.json(
          {
            success: false,
            error:
              getString(asRecord(payload)?.message) ||
              "Admin approval is pending for the latest quote version.",
            data: asRecord(payload)?.data || null,
          },
          { status: 400 }
        );
      }

      if (response.ok && previewUrl) {
        return NextResponse.json({ success: true, data: { previewUrl } });
      }
    }

    const quoteId = normalizeQuoteId(
      findField(lastPayload, [
        "latest_quote_id",
        "latestQuoteId",
        "sales_quote_id",
        "salesQuoteId",
        "quote_id",
        "quoteId",
        "id",
      ])
    );
    const authToken = (await cookies()).get("revure_token")?.value;

    if (quoteId && authToken) {
      const previewUrl = await createPreviewLink(baseUrl, authToken, quoteId);
      if (previewUrl) {
        return NextResponse.json({ success: true, data: { previewUrl } });
      }
    }

    if (authToken) {
      const listResponses = await Promise.all([
        fetch(`${baseUrl}/sales/quotes?page=1&limit=200`, {
          headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
          cache: "no-store",
        }).catch(() => null),
        fetch(`${baseUrl}/sales/quotes?page=1&limit=50&search=${encodedKey}`, {
          headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
          cache: "no-store",
        }).catch(() => null),
      ]);
      const listPayloads = await Promise.all(
        listResponses.map((response) => response?.json().catch(() => null) ?? null)
      );
      const rows = listPayloads.flatMap(extractRows);
      const matchingQuote = rows.find((row) => rowMatchesQuoteKey(row, quoteKey));
      const matchingQuoteId = getQuoteId(matchingQuote);

      if (matchingQuoteId) {
        const previewUrl = await createPreviewLink(baseUrl, authToken, matchingQuoteId);
        if (previewUrl) {
          return NextResponse.json({ success: true, data: { previewUrl } });
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Latest quote link is not available yet.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to generate latest quote preview link", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate latest quote link." },
      { status: 500 }
    );
  }
}
