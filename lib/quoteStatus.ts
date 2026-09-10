import type { SalesQuoteListItem } from "@/lib/api";

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getOptionalNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const toNumericOrNull = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const formatQuoteStatusLabel = (value: string) =>
  value
    .replace(/_quotes$/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const getQuoteStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "partially paid":
    case "partial_paid":
    case "partially_paid":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
    case "accepted":
    case "confirmed":
      return "bg-[#D6FFE6] text-[#27AE60] border-transparent";
    case "draft":
      return "bg-[#D1D5DB] text-[#4B5563] border-transparent";
    case "pending":
    case "sent":
      return "bg-[#D6E6FF] text-[#4A90E2] border-transparent";
    case "viewed":
      return "bg-[#E6DBFF] text-[#9070FF] border-transparent";
    case "rejected":
    case "cancelled":
      return "bg-[#FFD1D1] text-[#EB5757] border-transparent";
    case "expired":
      return "bg-[#FFF6E9] text-[#D4A017] border-transparent";
    default:
      return "bg-white/10 text-white border-transparent";
  }
};

export const getPaymentAwareQuoteStatusKey = (quote: SalesQuoteListItem) => {
  const quoteRecord = quote as Record<string, unknown>;
  const paymentStatus = getText(quoteRecord.payment_status).toLowerCase();
  const normalizedQuoteStatus = getText(quote.status, quote.quote_status, "draft").toLowerCase() || "draft";
  if (normalizedQuoteStatus === "rejected" || normalizedQuoteStatus === "cancelled") {
    return "rejected";
  }
  const paymentSummary = getRecord(quoteRecord.payment_summary);
  const summaryPaymentStatus = getText(paymentSummary?.payment_status).toLowerCase();
  const summaryPaidAmount = Math.max(
    0,
    (toNumericOrNull(paymentSummary?.paid_amount) ?? 0) +
    (toNumericOrNull(paymentSummary?.credit_used_amount) ?? 0)
  );
  const summaryDueAmount = Math.max(
    0,
    toNumericOrNull(paymentSummary?.due_amount) ??
    toNumericOrNull(paymentSummary?.pending_amount) ??
    0
  );
  const manualPaymentSummary = getRecord(quoteRecord.manual_payment_summary);
  const manualPaidAmount = Math.max(
    0,
    toNumericOrNull(manualPaymentSummary?.paidAmount) ??
    toNumericOrNull(manualPaymentSummary?.paid_amount) ??
    0
  );
  const manualPendingAmount = Math.max(
    0,
    toNumericOrNull(manualPaymentSummary?.pendingAmount) ??
    toNumericOrNull(manualPaymentSummary?.pending_amount) ??
    0
  );
  const hasManualFullPayment =
    Boolean(manualPaymentSummary?.hasFullPayment) ||
    (manualPaidAmount > 0 && manualPendingAmount <= 0);
  const hasManualPartialPayment =
    Boolean(manualPaymentSummary?.isPartiallyPaid) ||
    (manualPaidAmount > 0 && manualPendingAmount > 0);
  const collectedAmount = Math.max(
    0,
    toNumericOrNull(quoteRecord.collected_amount) ??
    toNumericOrNull(quoteRecord.collectedAmount) ??
    toNumericOrNull(getRecord(quoteRecord.partial_payment)?.previously_paid_amount) ??
    manualPaidAmount ??
    0
  );
  const outstandingAmount = Math.max(
    0,
    toNumericOrNull(quoteRecord.outstanding_amount) ??
    toNumericOrNull(quoteRecord.outstandingAmount) ??
    toNumericOrNull(getRecord(quoteRecord.additional_payment)?.outstanding_amount) ??
    toNumericOrNull(getRecord(quoteRecord.partial_payment)?.outstanding_amount) ??
    manualPendingAmount ??
    0
  );
  const quoteTotal = Math.max(
    0,
    getOptionalNumber(quoteRecord.total, quoteRecord.total_amount, quoteRecord.amount) ?? 0
  );

  if (paymentStatus === "paid" || paymentStatus === "completed" || paymentStatus === "success") {
    return "paid";
  }

  if (paymentStatus === "partially_paid" || paymentStatus === "partial_paid") {
    return "partially_paid";
  }

  if (
    summaryPaymentStatus === "paid" ||
    summaryPaymentStatus === "completed" ||
    summaryPaymentStatus === "success"
  ) {
    return summaryDueAmount > 0 ? "partially_paid" : "paid";
  }

  if (
    summaryPaymentStatus === "partially_paid" ||
    summaryPaymentStatus === "partial_paid" ||
    summaryPaymentStatus === "partially paid"
  ) {
    return "partially_paid";
  }

  if (summaryPaidAmount > 0 && summaryDueAmount > 0) {
    return "partially_paid";
  }

  if (paymentSummary && summaryDueAmount > 0) {
    return normalizedQuoteStatus;
  }

  if (hasManualFullPayment) {
    return "paid";
  }

  if (hasManualPartialPayment) {
    return "partially_paid";
  }

  if (collectedAmount > 0 && outstandingAmount > 0) {
    return "partially_paid";
  }

  if (quoteTotal > 0 && collectedAmount > 0 && collectedAmount < quoteTotal) {
    return "partially_paid";
  }

  if (collectedAmount > 0 && outstandingAmount <= 0) {
    return "paid";
  }

  return normalizedQuoteStatus;
};

export const buildQuoteStatusSummary = (rows: SalesQuoteListItem[]) =>
  rows.reduce<Record<string, number>>((summary, quote) => {
    const statusKey = getPaymentAwareQuoteStatusKey(quote);

    if (!statusKey) {
      return summary;
    }

    summary[statusKey] = (summary[statusKey] ?? 0) + 1;
    return summary;
  }, {});

export const matchesQuoteStatusFilter = (quoteStatusKey: string, filterValue: string) => {
  if (filterValue === "all") {
    return true;
  }

  if (filterValue === "accepted") {
    return quoteStatusKey === "accepted" || quoteStatusKey === "confirmed" || quoteStatusKey === "paid";
  }

  if (filterValue === "pending") {
    return quoteStatusKey === "pending" || quoteStatusKey === "sent" || quoteStatusKey === "viewed" || quoteStatusKey === "partially_paid";
  }

  if (filterValue === "rejected") {
    return quoteStatusKey === "rejected" || quoteStatusKey === "cancelled";
  }

  return quoteStatusKey === filterValue;
};
