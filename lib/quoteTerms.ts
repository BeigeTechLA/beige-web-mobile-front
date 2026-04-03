const DEFAULT_GENERIC_VALID_UNTIL_TEXT = "the listed expiration date";

export const LEGACY_DEFAULT_QUOTE_TERM = "50% deposit required before production starts.";

const normalizeTermText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const formatTermsDate = (value?: string | null) => {
  if (!value) {
    return DEFAULT_GENERIC_VALID_UNTIL_TEXT;
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

export const getDefaultQuoteTerms = (validUntil?: string | null) => [
  `This quote is valid until ${formatTermsDate(validUntil)}.`,
  "Changes to the scope of work may result in additional charges.",
];

export const getDefaultQuoteTermsText = (validUntil?: string | null) =>
  getDefaultQuoteTerms(validUntil).join("\n");

export const isLegacyDefaultQuoteTerms = (terms: string[]) =>
  terms.length === 1 &&
  normalizeTermText(terms[0]) === normalizeTermText(LEGACY_DEFAULT_QUOTE_TERM);

export const isGeneratedDefaultQuoteTerms = (terms: string[]) => {
  const normalizedTerms = terms.map(normalizeTermText).filter(Boolean);

  if (normalizedTerms.length === 0) {
    return false;
  }

  if (
    normalizedTerms.length === 1 &&
    normalizedTerms[0] === normalizeTermText(LEGACY_DEFAULT_QUOTE_TERM)
  ) {
    return true;
  }

  if (
    normalizedTerms.length === 5 &&
    normalizedTerms[0] === normalizeTermText("Payment is due within 30 days of quote acceptance.") &&
    normalizedTerms[1] === normalizeTermText("A 50% deposit is required before project commencement.") &&
    /^this quote is valid until .+\.$/.test(normalizedTerms[2]) &&
    normalizedTerms[3] === normalizeTermText("All prices are in USD.") &&
    normalizedTerms[4] === normalizeTermText("Changes to the scope of work may result in additional charges.")
  ) {
    return true;
  }

  if (
    normalizedTerms.length === 2 &&
    /^this quote is valid until .+\.$/.test(normalizedTerms[0]) &&
    normalizedTerms[1] ===
      normalizeTermText("Changes to the scope of work may result in additional charges.")
  ) {
    return true;
  }

  return false;
};
