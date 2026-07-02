import apiClient from "@/lib/apiClient";
import type { ShootCPRow } from "@/components/admin/finances/CPPayoutTable";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type RawCpRow = Record<string, unknown> & {
  customer?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export type CpStatus = "pending_approval" | "approved" | "paid" | "rejected" | "mixed" | "draft";

export type CpCompensationItem = {
  compensation_item_id?: number;
  label: string;
  amount: number;
};

export type CpCompensationCreator = {
  creator_earning_id: number;
  creator_id: number;
  creator_name: string | null;
  creator_email?: string | null;
  cp_role?: string | null;
  approval_status: CpStatus;
  earning_status?: string;
  compensation_method?: string | null;
  total_compensation: number;
  advance_paid: number;
  paid_total?: number;
  remaining_balance: number;
  compensation_items: CpCompensationItem[];
  advances?: Array<{
    advance_id: number;
    amount: number;
    status: string;
    processed_at?: string | null;
    notes?: string | null;
  }>;
  timeline?: Array<{
    timeline_event_id?: number;
    event_type?: string;
    label?: string;
    sub_label?: string | null;
    amount?: number | null;
    is_completed?: boolean;
    event_date?: string | null;
    sort_order?: number;
  }>;
};

export type CpPaymentHistoryItem = {
  id?: string | number;
  type?: string | null;
  method?: string | null;
  status?: string | null;
  amount?: number | string | null;
  paid_at?: string | null;
  receipt_url?: string | null;
  receipt_download_url?: string | null;
  notes?: string | null;
};

export type CpCompensationDetails = {
  booking_id: number;
  shoot_name: string;
  shoot_type?: string | null;
  content_type?: string | null;
  event_date?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  };
  summary: {
    total_cp_payout: number;
    shoot_amount: number;
    margin_amount: number;
    margin_percent: number | null;
    status: CpStatus;
  };
  creators: CpCompensationCreator[];
  payment_history?: CpPaymentHistoryItem[];
  history?: CpPaymentHistoryItem[];
  audit_logs?: Array<{
    action: string;
    label?: string;
    notes?: string | null;
    created_at?: string | null;
  }>;
};

export type PendingCompensationShoot = {
  booking_id: number;
  shoot_name: string;
  shoot_type?: string | null;
  content_type?: string | null;
  event_date?: string | null;
  shoot_amount: number;
  margin_percent?: number | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  };
  creators: Array<{
    creator_id: number;
    creator_name: string | null;
    creator_email?: string | null;
    cp_role?: string | null;
    hourly_rate?: number;
  }>;
};

export type AddCpCompensationPayload = {
  booking_id: number;
  compensation_method: "equal_split" | "role_based" | "manual";
  creators: Array<{
    creator_id: number;
    rate_type: "flat" | "hourly";
    items: CpCompensationItem[];
    notes?: string | null;
    advance?: {
      amount: number;
      payment_date?: string;
      notes?: string;
    };
  }>;
};

export const mapCpStatusToUi = (status?: string): ShootCPRow["status"] => {
  switch (status) {
    case "pending_approval":
      return "Finance Approval";
    case "approved":
      return "Approved";
    case "paid":
      return "Fully Paid";
    case "rejected":
      return "Pending";
    default:
      return "Pending";
  }
};

const getCategory = (value?: string | null): ShootCPRow["category"] => {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes("photo") ? "photography" : "videography";
};

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const asNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const mapShootRow = (row: RawCpRow): ShootCPRow => ({
  id: String(row.booking_id),
  bookingId: asNumber(row.booking_id),
  shootName: asString(row.shoot_name, `Shoot #${row.booking_id}`),
  totalCP: asNumber(row.total_cps),
  customerName: row.customer?.name || "Unknown Customer",
  customerEmail: row.customer?.email || "",
  shootBudget: asNumber(row.shoot_amount),
  cpPayout: asNumber(row.cp_payout),
  margin: asNumber(row.margin_percent),
  status: mapCpStatusToUi(asString(row.status)),
  category: getCategory(asString(row.shoot_type || row.content_type)),
  avatarImage: row.customer?.image || "",
  date: asString(row.event_date || row.latest_activity_at, new Date().toISOString()),
});

export const mapCreatorRow = (row: RawCpRow): ShootCPRow => ({
  id: String(row.creator_earning_id),
  bookingId: asNumber(row.booking_id),
  creatorEarningId: asNumber(row.creator_earning_id),
  creatorId: asNumber(row.creator_id),
  shootId: String(row.booking_id),
  shootName: asString(row.shoot_name, `Shoot #${row.booking_id}`),
  creatorName: asString(row.creator_name, "Unknown Creator"),
  creatorRoles: [asString(row.cp_role)].filter(Boolean),
  customerName: row.customer?.name || "Unknown Customer",
  customerEmail: row.customer?.email || "",
  shootBudget: asNumber(row.shoot_amount),
  cpPayout: asNumber(row.cp_payout),
  margin: asNumber(row.margin_percent),
  status: mapCpStatusToUi(asString(row.earning_status) === "paid" ? "paid" : asString(row.status)),
  category: getCategory(asString(row.shoot_type || row.content_type)),
  avatarImage: "",
  date: asString(row.event_date || row.latest_activity_at, new Date().toISOString()),
});

export const cpCompensationApi = {
  async list(view: "shoots" | "creators") {
    const response = await apiClient.get<ApiEnvelope<{ rows: RawCpRow[] }>>("finance/cp-compensation", {
      page: 1,
      limit: 100,
      view,
    });
    return (response.data.rows || []).map(view === "shoots" ? mapShootRow : mapCreatorRow);
  },

  async details(bookingId: number) {
    const response = await apiClient.get<ApiEnvelope<CpCompensationDetails>>(`finance/cp-compensation/${bookingId}`);
    return response.data;
  },

  async pendingShoots() {
    const response = await apiClient.get<ApiEnvelope<{ rows: PendingCompensationShoot[] }>>(
      "finance/cp-compensation/pending-shoots"
    );
    return response.data.rows || [];
  },

  async add(payload: AddCpCompensationPayload) {
    return apiClient.post<ApiEnvelope<unknown>>("finance/cp-compensation", payload);
  },

  async approve(earningId: number, notes?: string) {
    return apiClient.patch<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/approve`, { notes });
  },

  async reject(earningId: number, rejection_reason: string) {
    return apiClient.patch<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/reject`, { rejection_reason });
  },

  async modify(earningId: number, payload: { modification_reason: string; items: CpCompensationItem[] }) {
    return apiClient.patch<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/modify`, payload);
  },

  async addAdvance(earningId: number, payload: { amount: number; payment_date?: string; notes?: string }) {
    return apiClient.post<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/advance`, payload);
  },

  async processPayment(earningId: number, payload: {
    amount: number;
    payment_method: "stripe" | "manual" | "outside_platform";
    payment_mode?: string;
    proof_url?: string;
    transaction_reference?: string;
    notes?: string;
    payment_scope?: "advance" | "final";
  }) {
    return apiClient.post<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/payment`, payload);
  },
};
