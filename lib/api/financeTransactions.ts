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

export type ClientFinanceInvoiceApiRow = {
  invoice_send_history_id?: number | string | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  invoice_url?: string | null;
  invoice_pdf?: string | null;
  payment_status?: string | null;
  sent_at?: string | null;
};

export type ClientFinanceDisputeApiRow = {
  dispute_id?: number | string | null;
  dispute_code?: string | null;
  status?: string | null;
  category?: string | null;
  subject?: string | null;
  created_at?: string | null;
  raised_by?: AdminFinanceDisputeApiRow["raised_by"];
  client?: AdminFinanceDisputeApiRow["client"];
  creator?: AdminFinanceDisputeApiRow["creator"];
};

export type ClientFinanceDisputeDetailsApiRow = ClientFinanceDisputeApiRow & {
  booking_id?: number | string | null;
  shoot_id?: string | null;
  description?: string | null;
  invoice?: ClientFinanceInvoiceApiRow | null;
  resolution?: AdminFinanceDisputeDetailsApiRow["resolution"];
  timeline?: AdminFinanceDisputeDetailsApiRow["timeline"];
  internal_comments?: AdminFinanceDisputeDetailsApiRow["internal_comments"];
  attachments?: Array<{
    id?: number | string | null;
    file_name?: string | null;
    file_url?: string | null;
    file_path?: string | null;
    attachment_type?: string | null;
    created_at?: string | null;
    uploaded_by?: {
      id?: number | string | null;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      user_type?: number | string | null;
    } | null;
  }>;
};

export type ClientFinancePaymentApiRow = {
  booking_id?: number | string | null;
  shoot_id?: string | null;
  shoot_type?: string | null;
  project_name?: string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  invoices_count?: number | null;
  invoices?: ClientFinanceInvoiceApiRow[];
  latest_invoice?: ClientFinanceInvoiceApiRow | null;
  date_time?: string | null;
  event_date?: string | null;
  payment_method?: string | null;
  status?: string | null;
  payment_status?: string | null;
  cost_breakdown?: {
    base_cost?: number | string | null;
    add_ons?: number | string | null;
    taxes?: number | string | null;
    discounts?: number | string | null;
    total_amount?: number | string | null;
    collected_amount?: number | string | null;
    outstanding_amount?: number | string | null;
    currency?: string | null;
  } | null;
  transactions?: FinanceTransactionApiRow[];
  transactions_count?: number | null;
  dispute?: ClientFinanceDisputeApiRow | null;
  actions?: {
    can_view_details?: boolean;
    can_view_invoice?: boolean;
    can_download_invoice?: boolean;
    can_raise_dispute?: boolean;
  } | null;
};

export type AdminFinanceDisputeApiRow = {
  dispute_id?: number | string | null;
  dispute_code?: string | null;
  status?: string | null;
  priority?: string | null;
  issue_type?: string | null;
  category?: string | null;
  shoot_id?: string | null;
  booking_id?: number | string | null;
  invoice_id?: string | null;
  invoice_send_history_id?: number | string | null;
  subject?: string | null;
  description?: string | null;
  disputed_amount?: number | string | null;
  payout_hold_amount?: number | string | null;
  impacted_payout_amount?: number | string | null;
  raised_by?: {
    type?: string | null;
    id?: number | string | null;
    name?: string | null;
    initials?: string | null;
  } | null;
  client?: {
    id?: number | string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  creator?: {
    id?: number | string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
  actions?: {
    can_update?: boolean;
    can_add_comment?: boolean;
    can_hold_payout?: boolean;
    can_resolve?: boolean;
    can_reject?: boolean;
    can_escalate?: boolean;
  } | null;
};

export type AdminFinanceDisputeDetailsApiRow = AdminFinanceDisputeApiRow & {
  project?: {
    id?: number | string | null;
    name?: string | null;
    guest_email?: string | null;
  } | null;
  invoice?: ClientFinanceInvoiceApiRow | null;
  resolution?: {
    type?: string | null;
    notes?: string | null;
    resolved_at?: string | null;
    resolved_by?: {
      id?: number | string | null;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  timeline?: Array<{
    id?: number | string | null;
    action?: string | null;
    from_status?: string | null;
    to_status?: string | null;
    amount?: number | string | null;
    notes?: string | null;
    created_at?: string | null;
    performed_by?: {
      id?: number | string | null;
      name?: string | null;
      email?: string | null;
    } | null;
    metadata?: Record<string, unknown> | null;
  }>;
  internal_comments?: Array<{
    id?: number | string | null;
    body?: string | null;
    created_at?: string | null;
    created_by?: {
      id?: number | string | null;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      user_type?: number | string | null;
    } | null;
    created_by_creator?: {
      name?: string | null;
      email?: string | null;
    } | null;
  }>;
  attachments?: Array<{
    id?: number | string | null;
    file_name?: string | null;
    file_url?: string | null;
    file_path?: string | null;
    attachment_type?: string | null;
    created_at?: string | null;
    uploaded_by?: {
      id?: number | string | null;
      name?: string | null;
      email?: string | null;
      role?: string | null;
      user_type?: number | string | null;
    } | null;
  }>;
};

export type AdminFinanceDisputesDashboard = {
  overview?: {
    total_disputes?: number;
    open_disputes?: number;
    in_review?: number;
    resolved_last_30d?: number;
    impacted_payout_total?: number | string;
  };
  recent_disputes?: AdminFinanceDisputeApiRow[];
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

export type AdminFinanceDisputeListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  raised_by_type?: string;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
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

  listClientPayments(params: FinanceTransactionListParams = {}) {
    return apiClient.get<ApiEnvelope<FinanceListResponse<ClientFinancePaymentApiRow>>>(
      "finance/client/payments",
      cleanParams(params)
    );
  },

  listClientDisputes(params: AdminFinanceDisputeListParams = {}) {
    return apiClient.get<ApiEnvelope<FinanceListResponse<ClientFinanceDisputeDetailsApiRow>>>(
      "finance/client/disputes",
      cleanParams(params)
    );
  },

  async createClientDispute(payload: FormData) {
    const response = await apiClient.getInstance().post<ApiEnvelope<ClientFinanceDisputeDetailsApiRow>>(
      "finance/client/disputes",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  getClientDisputeDetails(disputeId: number | string) {
    return apiClient.get<ApiEnvelope<ClientFinanceDisputeDetailsApiRow>>(
      `finance/client/disputes/${disputeId}`
    );
  },

  addClientDisputeComment(disputeId: number | string, body: string) {
    return apiClient.post<ApiEnvelope<unknown>>(
      `finance/client/disputes/${disputeId}/comments`,
      { body }
    );
  },

  async addClientDisputeAttachment(disputeId: number | string, payload: FormData) {
    const response = await apiClient.getInstance().post<ApiEnvelope<unknown>>(
      `finance/client/disputes/${disputeId}/attachments`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  getAdminDisputesDashboard(params: AdminFinanceDisputeListParams = {}) {
    return apiClient.get<ApiEnvelope<AdminFinanceDisputesDashboard>>(
      "finance/admin/disputes/dashboard",
      cleanParams(params)
    );
  },

  listAdminDisputes(params: AdminFinanceDisputeListParams = {}) {
    return apiClient.get<ApiEnvelope<FinanceListResponse<AdminFinanceDisputeApiRow>>>(
      "finance/admin/disputes",
      cleanParams(params)
    );
  },

  getAdminDisputeDetails(disputeId: number | string) {
    return apiClient.get<ApiEnvelope<AdminFinanceDisputeDetailsApiRow>>(
      `finance/admin/disputes/${disputeId}`
    );
  },

  updateAdminDispute(disputeId: number | string, payload: Record<string, unknown> = {}) {
    return apiClient.patch<ApiEnvelope<AdminFinanceDisputeDetailsApiRow>>(
      `finance/admin/disputes/${disputeId}`,
      payload
    );
  },

  addAdminDisputeComment(disputeId: number | string, body: string) {
    return apiClient.post<ApiEnvelope<unknown>>(
      `finance/admin/disputes/${disputeId}/comments`,
      { body, visibility: "all", comment_type: "status_update" }
    );
  },

  async addAdminDisputeAttachment(disputeId: number | string, payload: FormData) {
    const response = await apiClient.getInstance().post<ApiEnvelope<unknown>>(
      `finance/admin/disputes/${disputeId}/attachments`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  holdAdminDisputePayout(disputeId: number | string, payload: Record<string, unknown> = {}) {
    return apiClient.post<ApiEnvelope<unknown>>(
      `finance/admin/disputes/${disputeId}/hold-payout`,
      payload
    );
  },

  resolveAdminDispute(disputeId: number | string, payload: Record<string, unknown> = {}) {
    return apiClient.post<ApiEnvelope<AdminFinanceDisputeDetailsApiRow>>(
      `finance/admin/disputes/${disputeId}/resolve`,
      payload
    );
  },

  rejectOrRefundAdminDispute(disputeId: number | string, payload: Record<string, unknown> = {}) {
    return apiClient.post<ApiEnvelope<AdminFinanceDisputeDetailsApiRow>>(
      `finance/admin/disputes/${disputeId}/reject-refund`,
      payload
    );
  },

  escalateAdminDispute(disputeId: number | string, payload: Record<string, unknown> = {}) {
    return apiClient.post<ApiEnvelope<AdminFinanceDisputeDetailsApiRow>>(
      `finance/admin/disputes/${disputeId}/escalate`,
      payload
    );
  },
};
