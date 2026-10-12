import apiClient from "@/lib/apiClient";

export type AgreementType = "general" | "shoot";
export type AgreementStatus = "draft" | "pending_acceptance" | "accepted" | "rejected" | "cancelled" | "expired";

export interface AgreementSnapshot {
  assignment_id?: number;
  booking_id?: number;
  creative_partner?: { name?: string; email?: string; role?: string };
  shoot?: {
    name?: string;
    type?: string;
    date?: string;
    location?: string;
    start_time?: string;
    end_time?: string;
    scope?: string;
    equipment?: string | string[];
    deliverables?: string | string[];
    special_instructions?: string;
  };
  compensation?: { creator_earning_id?: number; amount?: number; currency?: string };
  extras?: Record<string, unknown>;
}

export interface AgreementDocument {
  agreement_document_id: number;
  agreement_type: AgreementType;
  agreement_template_id?: number | null;
  creator_id?: number | null;
  booking_id?: number | null;
  assignment_id?: number | null;
  version_no: number;
  display_version: string;
  status: AgreementStatus;
  is_current: boolean;
  title: string;
  content_html: string;
  content_json?: unknown;
  snapshot?: AgreementSnapshot;
  currency?: string;
  compensation_amount?: number | null;
  sent_at?: string | null;
  due_at?: string | null;
  responded_at?: string | null;
  created_at?: string;
}

export interface AgreementTemplate {
  agreement_template_id: number;
  title: string;
  description?: string | null;
  version: string;
  status: "draft" | "published" | "retired";
  content_html: string;
  content_json?: unknown;
  effective_at?: string | null;
  published_at?: string | null;
}

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export const agreementApi = {
  listGeneralTemplates: () => apiClient.get<ApiResponse<AgreementTemplate[]>>("agreements/admin/general"),
  getGeneralTemplate: (templateId: number) => apiClient.get<ApiResponse<AgreementTemplate>>(`agreements/admin/general/${templateId}`),
  createGeneralTemplate: (payload: Pick<AgreementTemplate, "title" | "description" | "content_html" | "content_json"> & { is_mandatory?: boolean; source_template_id?: number; effective_at?: string | null }) =>
    apiClient.post<ApiResponse<AgreementTemplate>>("agreements/admin/general", payload),
  updateGeneralTemplate: (templateId: number, payload: Partial<AgreementTemplate>) =>
    apiClient.patch<ApiResponse<AgreementTemplate>>(`agreements/admin/general/${templateId}`, payload),
  deleteGeneralTemplate: (templateId: number) =>
    apiClient.delete<ApiResponse<{ agreement_template_id: number; deleted: boolean }>>(`agreements/admin/general/${templateId}`),
  publishGeneralTemplate: (templateId: number) =>
    apiClient.post<ApiResponse<AgreementTemplate>>(`agreements/admin/general/${templateId}/publish`),

  listAdminAgreements: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<AgreementDocument[]>>("agreements/admin", params),
  getAdminAgreement: (agreementId: number) => apiClient.get<ApiResponse<{ agreement: AgreementDocument; responses: unknown[]; events: unknown[] }>>(`agreements/admin/${agreementId}`),
  createShootAgreement: (bookingId: number, assignmentId: number, payload: { title?: string; content_html: string; content_json?: unknown; due_at?: string; snapshot_overrides?: Record<string, unknown> }) =>
    apiClient.post<ApiResponse<AgreementDocument>>(`agreements/admin/shoots/${bookingId}/assignments/${assignmentId}`, payload),
  updateShootAgreement: (agreementId: number, payload: Partial<Pick<AgreementDocument, "title" | "content_html" | "content_json" | "due_at">>) =>
    apiClient.patch<ApiResponse<AgreementDocument>>(`agreements/admin/${agreementId}`, payload),
  sendShootAgreement: (agreementId: number) => apiClient.post<ApiResponse<AgreementDocument>>(`agreements/admin/${agreementId}/send`),
  reviseShootAgreement: (agreementId: number, payload: Partial<Pick<AgreementDocument, "title" | "content_html" | "content_json" | "due_at">>) =>
    apiClient.post<ApiResponse<AgreementDocument>>(`agreements/admin/${agreementId}/revise`, payload),
  cancelAgreement: (agreementId: number) => apiClient.post<ApiResponse<AgreementDocument>>(`agreements/admin/${agreementId}/cancel`),

  getCurrentGeneralAgreement: () => apiClient.get<ApiResponse<{ acceptance_required: boolean; agreement: AgreementDocument }>>("agreements/creator/general/current"),
  acceptGeneralAgreement: (agreementId: number, signer_name?: string) =>
    apiClient.post<ApiResponse<AgreementDocument>>(`agreements/creator/general/${agreementId}/accept`, { accepted_terms: true, signer_name }),
  listCreatorAgreements: (params?: Record<string, unknown>) => apiClient.get<ApiResponse<AgreementDocument[]>>("agreements/creator", params),
  getCreatorAgreement: (agreementId: number) => apiClient.get<ApiResponse<{ agreement: AgreementDocument; responses: unknown[]; events: unknown[] }>>(`agreements/creator/${agreementId}`),
  acceptShootAgreement: (agreementId: number, signer_name?: string) =>
    apiClient.post<ApiResponse<AgreementDocument>>(`agreements/creator/${agreementId}/accept`, { accepted_terms: true, signer_name }),
  rejectShootAgreement: (agreementId: number, rejection_reason: string, comments?: string) =>
    apiClient.post<ApiResponse<AgreementDocument>>(`agreements/creator/${agreementId}/reject`, { rejection_reason, comments }),
};
