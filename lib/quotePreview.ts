export const buildQuotePreviewPath = (quoteId?: string | number | null) => {
  const normalizedQuoteId = String(quoteId ?? "").trim();

  if (!normalizedQuoteId) {
    return "/quotes/preview";
  }

  return `/quotes/preview?quoteId=${encodeURIComponent(normalizedQuoteId)}`;
};

export const buildAbsoluteQuotePreviewUrl = (quoteId?: string | number | null) => {
  const previewPath = buildQuotePreviewPath(quoteId);

  if (typeof window === "undefined") {
    return previewPath;
  }

  return `${window.location.origin}${previewPath}`;
};
