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
  source?: string | null;
  dispute_id?: string | number | null;
  dispute_code?: string | null;
  dispute_original_compensation?: number | string | null;
  dispute_extra_amount?: number | string | null;
  approved_by_user_id?: number | null;
  approved_by_name?: string | null;
  processed_by_user_id?: number | null;
  processed_by_name?: string | null;
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
    performed_by_user_id?: number | null;
    performed_by_name?: string | null;
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
    /** Present when the CP has already been persisted in assigned_crew. */
    assignment_id?: number;
    creator_id: number;
    creator_name: string | null;
    creator_email?: string | null;
    cp_role?: string | null;
    hourly_rate?: number;
  }>;
};

export type CpCompensationOverview = {
  total_amount: number;
  paid_amount: number;
  payable_amount: number;
  paid_assignments: number;
  payable_assignments: number;
  total_assignments: number;
};

export type AddCpCompensationPayload = {
  booking_id: number;
  compensation_method: "equal_split" | "role_based" | "manual";
  send_email?: boolean;
  new_shoot_request_creator_ids?: number[];
  creators: Array<{
    creator_id: number;
    rate_type: "flat" | "hourly";
    items: CpCompensationItem[];
    notes?: string | null;
    advance?: {
      amount: number;
      payment_date?: string;
      notes?: string;
      proof_url?: string;
      proof_file_path?: string;
      proof_file_name?: string;
      payment_mode?: string;
      transaction_reference?: string;
    };
  }>;
};

export const mapCpStatusToUi = (status?: string): ShootCPRow["status"] => {
  switch (status) {
    case "pending_approval":
      return "Approval Pending";
    case "approved":
      return "Approved";
    case "partially_paid":
      return "Partially Paid";
    case "paid":
      return "Fully Paid";
    case "rejected":
      return "Rejected";
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

export type CpCalendarItem = {
  id: string;
  bookingId: number;
  creatorEarningId: number;
  creatorId: number;
  creatorName: string;
  creatorRoles: string[];
  shootName: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: ShootCPRow["status"];
  category: ShootCPRow["category"];
  dueDate: string; // YYYY-MM-DD
  isDefaultDueDate: boolean; // true when calculated as event date + 15 days
};

const toDateKey = (value?: string | null) => String(value || "").slice(0, 10);

const addDaysToDateKey = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const mapCalendarItem = (
  row: ShootCPRow,
  rawRow?: RawCpRow,
): CpCalendarItem | null => {
  // Fully paid compensation has no due date
  if (row.status === "Fully Paid") return null;

  const explicitDue = toDateKey(row.dueDate);
  const defaultDue = addDaysToDateKey(toDateKey(row.date), 15);
  const dueDate = explicitDue || defaultDue;
  if (!dueDate) return null;
    const paidAmount = asNumber(
    rawRow?.paid_total ?? rawRow?.advance_paid,
  );

  const remainingAmount = Math.max(
    0,
    asNumber(rawRow?.remaining_balance, row.cpPayout - paidAmount),
  );

  return {
    id: row.id,
    bookingId: row.bookingId || Number(row.shootId) || 0,
    creatorEarningId: row.creatorEarningId || 0,
    creatorId: row.creatorId || 0,
    creatorName: row.creatorName || "Unknown Creator",
    creatorRoles: row.creatorRoles || [],
    shootName: row.shootName || "Untitled Shoot",
    customerName: row.customerName,
    amount: row.cpPayout,
    paidAmount,
    remainingAmount,
    status: row.status,
    category: row.category,
    dueDate,
    isDefaultDueDate: !explicitDue,
  };
};

export const cpCompensationApi = {
  async overview(period: "all_time" | "this_month" | "last_3_months" | "this_year" = "all_time") {
    const response = await apiClient.get<ApiEnvelope<CpCompensationOverview>>(
      "finance/cp-compensation/overview",
      { period },
    );
    return response.data;
  },

  async list(view: "shoots" | "creators") {
    const response = await apiClient.get<ApiEnvelope<{ rows: RawCpRow[] }>>("finance/cp-compensation", {
      page: 1,
      limit: 100,
      view,
    });
    return (response.data.rows || []).map(view === "shoots" ? mapShootRow : mapCreatorRow);
  },

  async calendarItems(range: { start: string; end: string; status?: string }) {
    const response = await apiClient.get<ApiEnvelope<{ rows: RawCpRow[] }>>(
      "finance/cp-compensation/calendar",
      {
        start_date: range.start,
        end_date: range.end,
        ...(range.status ? { status: range.status } : {}),
      }
    );
     return (response.data.rows || [])
      .map((rawRow) => ({
        rawRow,
        creatorRow: mapCreatorRow(rawRow),
      }))
      .map(({ rawRow, creatorRow }) => mapCalendarItem(creatorRow, rawRow))
      .filter((item): item is CpCalendarItem => item !== null);
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
    advance_id?: number;
    payment_date?: string;
  }) {
    return apiClient.post<ApiEnvelope<unknown>>(`finance/cp-compensation/${earningId}/payment`, payload);
  },
};
