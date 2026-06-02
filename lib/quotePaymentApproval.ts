import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const normalizeAmount = (value: unknown) => {
  const numericValue =
    typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getBlockedQuotePaymentChangeMessage = (
  quoteDetail: SalesQuoteDetailData | null | undefined
) => {
  if (!quoteDetail) {
    return null;
  }

  const quoteRecord = asRecord(quoteDetail);
  const additionalPayment =
    asRecord(quoteRecord?.additional_payment) ?? asRecord(quoteRecord?.partial_payment);
  const reducedPayment = asRecord(quoteRecord?.reduced_payment);

  const blockedChange = [additionalPayment, reducedPayment]
    .filter((change): change is UnknownRecord => Boolean(change))
    .map((change) => {
      const approvalStatus = String(change.approval_status ?? "").toLowerCase();
      const additionalAmount = normalizeAmount(
        change.outstanding_amount ?? change.additional_amount
      );
      const reducedAmount = normalizeAmount(
        change.reduced_amount ?? change.refund_pending_amount
      );

      return {
        approvalStatus,
        changeType: additionalAmount > 0 ? "increase" : "decrease",
        hasOpenChange: additionalAmount > 0 || reducedAmount > 0,
      };
    })
    .find((change) => change.hasOpenChange && change.approvalStatus !== "approved");

  if (!blockedChange) {
    return null;
  }

  const { approvalStatus, changeType } = blockedChange;
  return approvalStatus === "rejected"
    ? `This paid quote ${changeType} request was rejected, so it cannot be sent to the client.`
    : `This paid quote ${changeType} request is pending admin approval. Approve it before sending the quote or payment link to the client.`;
};

export const getLatestQuotePaymentChangeBlockMessage = async ({
  quote,
  quoteId,
}: {
  quote?: SalesQuoteDetailData | null;
  quoteId?: string | number | null;
}) => {
  if (quoteId) {
    try {
      const detailResponse = await salesApi.getQuoteDetail(quoteId);

      if (!detailResponse?.error && detailResponse?.success !== false) {
        const latestQuoteDetail = unwrapSalesQuoteDetail(detailResponse?.data ?? null);
        const latestBlockMessage = getBlockedQuotePaymentChangeMessage(latestQuoteDetail);

        if (latestBlockMessage) {
          return latestBlockMessage;
        }
      }
    } catch (error) {
      console.error("Failed to validate quote payment approval", error);
    }
  }

  return getBlockedQuotePaymentChangeMessage(quote);
};
