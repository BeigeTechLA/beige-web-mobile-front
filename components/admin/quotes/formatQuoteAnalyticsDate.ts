import { format, isValid, parseISO } from "date-fns";

export const formatQuoteAnalyticsDate = (value?: string | null) => {
  if (!value) return "-";

  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM dd, yyyy") : "-";
};
