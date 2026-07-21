import apiClient from "@/lib/apiClient";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type FinanceTransactionStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "void"
  | "cancelled";

export type FinanceTransactionApiRow = {
  finance_transaction_id?: number | null;
  transaction_id?: string | null;
  transaction_code?: string | null;
  booking_id?: number | string | null;
  shoot_id?: number | string | null;
  payment_id?: number | string | null;
  quote_id?: number | string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  shoot_type?: string | null;
  project_name?: string | null;
  event_date?: string | null;
  transaction_date?: string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  payment_method?: string | null;
  status?: FinanceTransactionStatus | string | null;
  transaction_type?: string | null;
  source?: string | null;
  external_reference?: string | null;
  receipt_number?: string | null;
  invoice_number?: string | null;
  receipt_url?: string | null;
  receipt_download_url?: string | null;
  manual_payment_id?: number | string | null;
  invoices_count?: number | null;
  latest_invoice?: unknown;
  metadata?: unknown;
};

export type FinanceShootApiRow = {
  booking_id?: number | string | null;
  shoot_id?: string | null;
  shoot_type?: string | null;
  project_name?: string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  invoices_count?: number | null;
  invoices?: unknown[];
  latest_invoice?: unknown;
  date_time?: string | null;
  event_date?: string | null;
  payment_method?: string | null;
  status?: FinanceTransactionStatus | string | null;
  payment_status?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  } | null;
  client?: {
    name?: string | null;
    email?: string | null;
  } | null;
  transactions?: FinanceTransactionApiRow[];
  cost_breakdown?: {
    total_amount?: number | string | null;
    collected_amount?: number | string | null;
    outstanding_amount?: number | string | null;
    currency?: string | null;
  } | null;
};

export type FinancePagination = {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
};

export type FinanceListResponse<T> = {
  rows?: T[];
  pagination?: FinancePagination;
};

export type FinanceTransactionListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  transaction_type?: string;
  payment_method?: string;
  booking_id?: number | string;
  date_from?: string;
  date_to?: string;
};

export type FinanceShootListParams = {
  page?: number;
  limit?: number;
  search?: string;
  payment_status?: string;
  payment_method?: string;
};

const cleanParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

export const financeTransactionsApi = {
  listTransactions(params: FinanceTransactionListParams = {}) {
    return apiClient.get<ApiEnvelope<FinanceListResponse<FinanceTransactionApiRow>>>(
      "finance/transactions",
      cleanParams(params)
    );
  },

  listShoots(params: FinanceShootListParams = {}) {
    return apiClient.get<ApiEnvelope<FinanceListResponse<FinanceShootApiRow>>>(
      "finance/shoots",
      cleanParams(params)
    );
  },
};
