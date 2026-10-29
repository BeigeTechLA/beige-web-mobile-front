import apiClient from "@/lib/apiClient";

export type WorkflowStatus = "not_started" | "in_progress" | "submitted" | "revision_requested" | "resubmitted" | "approved" | "completed";

export interface WorkflowProgress { uploaded: number; required: number; remaining?: number; percent: number; label?: string }
export interface WorkflowItem {
  orderId?: string | number; bookingId: string | number; projectName?: string; shootId?: string | number;
  serviceType?: string; status: WorkflowStatus; fileCount?: number; progress?: WorkflowProgress;
  dueDate?: string | null; producer?: { name?: string } | null; editor?: { name?: string } | null;
  editorType?: string | null; brief?: string | null;
}
export interface WorkflowDetail extends WorkflowItem {
  externalId?: string | number; daysLeft?: number | null; timeline?: Array<{ status: WorkflowStatus; label?: string; done?: boolean; current?: boolean }>;
  nextAction?: { code?: string; text?: string; ctaLabel?: string; ctaAction?: string } | null;
  requirements?: { editingRequirements?: string | null; requiredFormat?: string | null; deliverablesText?: string | null; revisionRounds?: string | number | null; brief?: string | null; requiredCount?: number | null } | null;
  clientReference?: { link?: string | null; message?: string | null; receivedAt?: string | null; receivedBy?: string | null } | null;
  currentRevisionVersion?: number | null;
  statusHistory?: Array<{ status?: string; action?: string; metadata?: Record<string, unknown>; createdAt?: string }>;
}
export interface WorkflowActivityItem { status?: string; action?: string; metadata?: Record<string, unknown>; createdAt?: string }

export const workflowStatusLabel: Record<string, string> = {
  not_started: "Not Started", in_progress: "In Progress", submitted: "Submitted for Approval",
  revision_requested: "Revision Requested", resubmitted: "Resubmitted", approved: "Approved", completed: "Completed",
};
export const editorTypeLabel = (value?: string | null) => value === "internal" ? "Internal Editor" : value === "external" ? "External Editor" : "";
export const formatWorkflowBytes = (value?: number | null) => `${((Number(value || 0) / 1024 / 1024 / 1024)).toFixed(1)} GB`;

const base = "external-file-manager/workflow";
export const editorWorkflowApi = {
  async list(params: Record<string, unknown>) {
    return (await apiClient.get<{ success: boolean; data: { items: WorkflowItem[]; pagination: { page: number; limit: number; total: number; totalPages: number }; statusCounts: Record<string, number>; storage: { usedBytes: number; totalBytes: number; percent: number } } }>(base, params)).data;
  },
  async storageUsage() { return (await apiClient.get<{ success: boolean; data: { usedBytes: number; totalBytes: number; percent: number } }>(`${base}/storage-usage`)).data; },
  async get(bookingId: string) { return (await apiClient.get<{ success: boolean; data: WorkflowDetail }>(`${base}/${encodeURIComponent(bookingId)}`)).data; },
  async progress(bookingId: string) { return (await apiClient.get<{ success: boolean; data: { deliverable: WorkflowProgress; revision: WorkflowProgress & { version?: number } } }>(`${base}/${encodeURIComponent(bookingId)}/progress`)).data; },
  async timeline(bookingId: string) { return (await apiClient.get<{ success: boolean; data: Pick<WorkflowDetail, "timeline"> & { statusHistory: unknown[] } }>(`${base}/${encodeURIComponent(bookingId)}/timeline`)).data; },
  async nextAction(bookingId: string) { return (await apiClient.get<{ success: boolean; data: NonNullable<WorkflowDetail["nextAction"]> }>(`${base}/${encodeURIComponent(bookingId)}/next-action`)).data; },
  async activity(bookingId: string) { return (await apiClient.get<{ success: boolean; data: WorkflowActivityItem[] | { items?: WorkflowActivityItem[]; activity?: WorkflowActivityItem[] } }>(`${base}/${encodeURIComponent(bookingId)}/activity`)).data; },
  async beforeAfter(bookingId: string, path: string) { return (await apiClient.get<{ success: boolean; data: unknown }>(`${base}/${encodeURIComponent(bookingId)}/before-after`, { path })).data; },
  async startEditing(bookingId: string, notes?: string) { return (await apiClient.post<{ success: boolean; data: { summary?: { fileCount?: number } } }>(`${base}/${encodeURIComponent(bookingId)}/start-editing`, { notes })).data; },
  async submitApproval(bookingId: string, notes?: string) { return (await apiClient.post<{ success: boolean; data: { summary?: { fileCount?: number } } }>(`${base}/${encodeURIComponent(bookingId)}/submit-approval`, { notes })).data; },
  async submitRevision(bookingId: string, notes?: string) { return (await apiClient.post<{ success: boolean; data: { summary?: { fileCount?: number } } }>(`${base}/${encodeURIComponent(bookingId)}/submit-revision`, { notes })).data; },
};
