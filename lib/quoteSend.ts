import type { SalesQuoteDetailData } from "@/lib/api";
import { getQuoteText } from "@/lib/quoteDetail";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const withPeriod = (value: string) => (/[.!?]$/.test(value) ? value : `${value}.`);

export const getQuoteSendStatus = (quote: SalesQuoteDetailData | null | undefined) =>
  getQuoteText(quote?.status, quote?.quote_status).trim().toLowerCase();

export const isQuoteAlreadySent = (quote: SalesQuoteDetailData | null | undefined) =>
  getQuoteSendStatus(quote) === "sent";

export const getQuoteSendSuccessMessage = (
  quote: SalesQuoteDetailData | null | undefined
) => {
  const activities = Array.isArray(quote?.activities) ? quote.activities : [];
  const sentActivity =
    activities.find((activity) => getQuoteText(asRecord(activity)?.activity_type).toLowerCase() === "sent") ??
    activities[0];
  const activityRecord = asRecord(sentActivity);
  const metadata =
    asRecord(activityRecord?.metadata) ?? asRecord(activityRecord?.metadata_json);
  const toEmail = getQuoteText(
    metadata?.to_email,
    quote?.client_email,
    quote?.guest_email
  );
  const activityMessage = getQuoteText(activityRecord?.message);

  if (activityMessage && toEmail) {
    return withPeriod(`${activityMessage} to ${toEmail}`);
  }

  if (toEmail) {
    return `Quote proposal email was sent to ${toEmail}.`;
  }

  if (activityMessage) {
    return withPeriod(activityMessage);
  }

  return "Quote proposal email was sent to the client successfully.";
};
