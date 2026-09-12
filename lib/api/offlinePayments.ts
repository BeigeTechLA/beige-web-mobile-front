import apiClient from "@/lib/apiClient";

export type OfflinePaymentMethod = "wire_transfer" | "zelle";
export type OfflineSubmissionStatus = "pending_verification" | "paid" | "partially_paid" | "rejected" | "needs_follow_up";

export interface OfflinePaymentInstructions {
  booking_id: number;
  payment_reference: string;
  amount_due: number;
  zelle: { recipient_name: string; recipient_contact: string };
  wire_transfer: {
    bank_name: string;
    account_holder_name: string;
    routing_number: string;
    account_number: string;
    swift_bic: string;
  };
}

export interface OfflineSubmission {
  id: number;
  submission_id?: number;
  booking_id?: number;
  booking_name?: string;
  project_name?: string;
  guest_email?: string;
  payment_method: OfflinePaymentMethod;
  payment_amount: number;
  payment_reference?: string;
  customer_note?: string | null;
  proof_file_url?: string | null;
  status: OfflineSubmissionStatus;
  submitted_at?: string;
  created_at?: string;
  reviewed_by?: string | { name?: string; email?: string } | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
}

type Envelope<T> = { success: boolean; message?: string; data: T };

const unwrap = <T>(response: Envelope<T>) => response.data;

export const offlinePaymentsApi = {
  getInstructions: (token: string) =>
    apiClient.get<Envelope<OfflinePaymentInstructions>>(`payments/offline/${encodeURIComponent(token)}/instructions`).then(unwrap),

  submitConfirmation: (token: string, formData: FormData) =>
    apiClient.getInstance()
      .post<Envelope<{ submission_id: number; status: OfflineSubmissionStatus }>>(
        `payments/offline/${encodeURIComponent(token)}/confirmations`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((response) => unwrap(response.data)),

  listSubmissions: (status: OfflineSubmissionStatus) =>
    apiClient
      .get<Envelope<OfflineSubmission[] | { rows?: OfflineSubmission[]; submissions?: OfflineSubmission[] }>>(
        "payments/offline/submissions",
        { status },
      )
      .then((response) => {
        const data = unwrap(response);
        return Array.isArray(data) ? data : data.rows || data.submissions || [];
      }),

  getSubmission: (id: number) =>
    apiClient.get<Envelope<OfflineSubmission>>(`payments/offline/submissions/${id}`).then(unwrap),

  reviewSubmission: (id: number, status: Exclude<OfflineSubmissionStatus, "pending_verification">, review_notes?: string) =>
    apiClient
      .patch<Envelope<OfflineSubmission>>(`payments/offline/submissions/${id}`, { status, review_notes: review_notes || undefined })
      .then(unwrap),
};
