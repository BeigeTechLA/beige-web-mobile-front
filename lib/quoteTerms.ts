const DEFAULT_GENERIC_VALID_UNTIL_TEXT = "the listed expiration date";

export const LEGACY_DEFAULT_QUOTE_TERM = "50% deposit required before production starts.";

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
  "Payment is due within 30 days of quote acceptance.",
  "A 50% deposit is required before project commencement.",
  `This quote is valid until ${formatTermsDate(validUntil)}.`,
  "All prices are in USD.",
  "Changes to the scope of work may result in additional charges.",
];

export const getDefaultQuoteTermsText = (validUntil?: string | null) =>
  getDefaultQuoteTerms(validUntil).join("\n");

export const isLegacyDefaultQuoteTerms = (terms: string[]) =>
  terms.length === 1 &&
  terms[0].trim().toLowerCase() === LEGACY_DEFAULT_QUOTE_TERM.toLowerCase();
