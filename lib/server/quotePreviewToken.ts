import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

type QuotePreviewTokenPayload = {
  qid: string;
  exp: number;
};

const DEFAULT_QUOTE_PREVIEW_SECRET =
  "local-dev-quote-preview-secret-change-me";
const DEFAULT_QUOTE_PREVIEW_TTL_SECONDS = 60 * 60 * 24 * 7;

const getQuotePreviewSecret = () =>
  process.env.QUOTE_PREVIEW_SECRET ||
  process.env.DO_SECRET ||
  DEFAULT_QUOTE_PREVIEW_SECRET;

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const signPayload = (payload: string) =>
  createHmac("sha256", getQuotePreviewSecret())
    .update(payload)
    .digest("base64url");

export const createQuotePreviewToken = (
  quoteId: string,
  expiresInSeconds = DEFAULT_QUOTE_PREVIEW_TTL_SECONDS
) => {
  const payload: QuotePreviewTokenPayload = {
    qid: quoteId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

export const verifyQuotePreviewToken = (
  token: string
): QuotePreviewTokenPayload | null => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as QuotePreviewTokenPayload;

    if (!payload?.qid || !payload?.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
