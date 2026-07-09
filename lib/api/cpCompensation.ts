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
  payment_history?: CpPaymentHistoryItem[];
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
  creator_earning_id?: number;
  creator_id?: number;
  creator_name?: string | null;
  cp_role?: string | null;
  type?: string | null;
  method?: string | null;
  status?: string | null;
  amount?: number | string | null;
  paid_at?: string | null;
  receipt_url?: string | null;
  receipt_download_url?: string | null;
  proof_file_name?: string | null;
  notes?: string | null;
};

export type UploadedProof = {
  file_path?: string | null;
  proof_url?: string | null;
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
    creator_count?: number;
    creators?: Array<{
      creator_earning_id?: number;
      creator_id?: number;
      creator_name?: string | null;
    }>;
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

const ROLE_LABELS: Record<string, string> = {
  "1": "Videographer",
  "2": "Photographer",
  "3": "Editor",
  "9": "Videographer",
  "10": "Photographer",
  "11": "Editor",
};

export const normalizeCpRoleLabel = (value: unknown) => {
  if (value == null) return "";

  const parseRoleValue = (roleValue: unknown): string[] => {
    if (Array.isArray(roleValue)) return roleValue.flatMap(parseRoleValue);
    const raw = String(roleValue || "").trim();
    if (!raw) return [];

    if (raw.startsWith("[") || raw.startsWith("{")) {
      try {
        return parseRoleValue(JSON.parse(raw));
      } catch {
        return [raw];
      }
    }

    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  };

  const labels = parseRoleValue(value).map((role) => ROLE_LABELS[role] || role);
  return [...new Set(labels)].join(", ");
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
  sortDate: asString(row.created_at || row.latest_activity_at || row.event_date, ""),
  dueDate: asString(row.due_date, ""),
});

export const mapCreatorRow = (row: RawCpRow): ShootCPRow => ({
  id: String(row.creator_earning_id),
  bookingId: asNumber(row.booking_id),
  creatorEarningId: asNumber(row.creator_earning_id),
  creatorId: asNumber(row.creator_id),
  shootId: String(row.booking_id),
  shootName: asString(row.shoot_name, `Shoot #${row.booking_id}`),
  creatorName: asString(row.creator_name, "Unknown Creator"),
  creatorRoles: [normalizeCpRoleLabel(row.cp_role)].filter(Boolean),
  customerName: row.customer?.name || "Unknown Customer",
  customerEmail: row.customer?.email || "",
  shootBudget: asNumber(row.shoot_amount),
  cpPayout: asNumber(row.cp_payout),
  margin: asNumber(row.margin_percent),
  status: mapCpStatusToUi(asString(row.earning_status) === "paid" ? "paid" : asString(row.status)),
  category: getCategory(asString(row.shoot_type || row.content_type)),
  avatarImage: "",
  date: asString(row.event_date || row.latest_activity_at, new Date().toISOString()),
  sortDate: asString(row.created_at || row.latest_activity_at || row.event_date, ""),
  dueDate: asString(row.due_date, ""),
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

  async submitForApproval(payload: AddCpCompensationPayload) {
    return apiClient.post<ApiEnvelope<unknown>>("sales/bookings/cp-compensation", payload);
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

  async updateDueDate(bookingId: number, dueDate: string) {
    return apiClient.patch<ApiEnvelope<{ booking_id: number; due_date: string; updated_count: number }>>(
      `finance/cp-compensation/${bookingId}/due-date`,
      { due_date: dueDate }
    );
  },

  async uploadPaymentProof(file: File, context?: { bookingId?: number | string | null; earningId?: number | string | null }) {
    const formData = new FormData();
    formData.append("proof_file", file);
    if (context?.bookingId) formData.append("booking_id", String(context.bookingId));
    if (context?.earningId) formData.append("creator_earning_id", String(context.earningId));
    const response = await apiClient.getInstance().post<ApiEnvelope<UploadedProof>>(
      "finance/cp-compensation/payment-proof",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  },

  async processPayment(earningId: number, payload: {
    amount: number;
    payment_method: "stripe" | "manual" | "outside_platform";
    payment_mode?: string;
    proof_url?: string;
    proof_file_path?: string;
    proof_file_name?: string;
    transaction_reference?: string;
    notes?: string;
    payment_scope?: "advance" | "final";
  }) {
    return apiClient.post<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/payment`, payload);
  },
};
