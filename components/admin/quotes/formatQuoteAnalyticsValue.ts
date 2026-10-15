const COMPACT_UNITS = [
  { threshold: 1_000_000_000_000, suffix: "T" },
  { threshold: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, suffix: "M" },
  { threshold: 1_000, suffix: "K" },
] as const;

const getCompactFractionDigits = (scaledValue: number) => {
  const absoluteValue = Math.abs(scaledValue);
  if (absoluteValue >= 100) return 0;
  if (absoluteValue >= 10) return 1;
  return 2;
};

export const formatQuoteAnalyticsNumber = (
  value: number,
  { currency = false }: { currency?: boolean } = {}
) => {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const absoluteValue = Math.abs(numericValue);
  const prefix = currency ? "$" : "";
  const unit = COMPACT_UNITS.find((item) => absoluteValue >= item.threshold);

  if (!unit) {
    return `${prefix}${numericValue.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;
  }

  const scaledValue = numericValue / unit.threshold;
  return `${prefix}${scaledValue.toLocaleString("en-US", {
    maximumFractionDigits: getCompactFractionDigits(scaledValue),
  })}${unit.suffix}`;
};

export const formatQuoteAnalyticsCurrency = (value: number) =>
  formatQuoteAnalyticsNumber(value, { currency: true });
