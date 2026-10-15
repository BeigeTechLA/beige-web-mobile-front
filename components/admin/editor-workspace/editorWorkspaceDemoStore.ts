"use client";

import { useEffect, useState } from "react";
import {
  getDemoAssignments,
  getEditor,
  getCompensationTotal,
  upsertDemoAssignment,
  type AgreementSection,
  DEFAULT_SECTIONS,
} from "@/components/admin/shoot-details/postProductionDemoStore";

export type EditorWorkspaceRole = "internal" | "external";
export type EditingStage =
  | "Not Started"
  | "In Progress"
  | "Submitted"
  | "Revision Requested"
  | "Resubmitted"
  | "Approved"
  | "Completed";
export type ExternalAgreementStatus = "Pending" | "Accepted" | "Rejected";
export type WorkspaceFileView = "grid" | "list" | "table";

export interface WorkspaceActivity {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  category: "assignment" | "editing" | "agreement" | "finance" | "file";
}
export interface WorkspaceFile {
  id: string;
  name: string;
  size: string;
  folderId: string;
  date: string;
  uploadedBy: string;
  isDemo: boolean;
}
export interface WorkspaceFolder {
  id: string;
  name: string;
  files: number;
  linked: boolean;
  protected: boolean;
}
export interface WorkspaceShoot {
  id: string;
  name: string;
  service: string;
  date: string;
  producer: string;
  creativePartner: string;
  editingStatus: EditingStage;
  agreementStatus: ExternalAgreementStatus;
  externalAssignment: boolean;
  internalAssignment: boolean;
  editingRequirements: string;
  deliverables: string;
  requiredFormat: string;
  dueDate: string;
  revisionRequirements: string;
  brief: string;
  agreementVersion: string;
  compensation: number;
  agreementSections: AgreementSection[];
}
export interface WorkspaceRecord {
  editingStatus?: EditingStage;
  agreementStatus?: ExternalAgreementStatus;
  rejectionReason?: string;
  files?: WorkspaceFile[];
  activity?: WorkspaceActivity[];
  reviewerNotes?: string;
  reviewedAt?: string;
}

export const EDITING_STAGES: EditingStage[] = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Revision Requested",
  "Resubmitted",
  "Approved",
  "Completed",
];

const sample = (
  id: string,
  name: string,
  service: string,
  date: string,
  producer: string,
  creativePartner: string,
  editingStatus: EditingStage,
  agreementStatus: ExternalAgreementStatus,
  externalAssignment = true,
  internalAssignment = true,
): WorkspaceShoot => ({
  id,
  name,
  service,
  date,
  producer,
  creativePartner,
  editingStatus,
  agreementStatus,
  externalAssignment,
  internalAssignment,
  editingRequirements: "Campaign master + social cutdowns",
  deliverables: "7 final exports and editable archive",
  requiredFormat: "4K ProRes + H.264 social",
  dueDate: "29 Oct 2026",
  revisionRequirements: "2 rounds included",
  brief:
    "Match approved treatment and preserve project file versions. Follow producer notes and delivery requirements.",
  agreementVersion: "v1.0",
  compensation: 6250,
  agreementSections: DEFAULT_SECTIONS.map((section) => ({ ...section })),
});

export const WORKSPACE_DEMO_SHOOTS: WorkspaceShoot[] = [
  sample(
    "123456",
    "Hotel Brand Film",
    "Videography",
    "Oct 21, 2026",
    "Sam Rivera",
    "Elena Rossi",
    "Not Started",
    "Pending",
  ),
  sample(
    "123457",
    "Editorial Portraits",
    "Photography",
    "Jan 13, 2026",
    "Noah Williams",
    "Sarah Miller",
    "In Progress",
    "Accepted",
  ),
  sample(
    "123458",
    "Wedding Photoshoot",
    "Video & Photo",
    "Jan 13, 2026",
    "Noah Williams",
    "Andre Cole",
    "Submitted",
    "Rejected",
  ),
  sample(
    "123459",
    "Music Video",
    "Photography",
    "Jan 13, 2026",
    "Sam Rivera",
    "Sarah Miller",
    "Revision Requested",
    "Pending",
  ),
  sample(
    "123460",
    "Baby Shower Video",
    "Photography",
    "Jan 13, 2026",
    "Sam Rivera",
    "Andre Cole",
    "Approved",
    "Accepted",
  ),
  sample(
    "123461",
    "Product Photoshoot",
    "Video & Photo",
    "Jan 13, 2026",
    "Noah Williams",
    "Aarav Sharma",
    "Completed",
    "Pending",
  ),
  sample(
    "123462",
    "Corporate Event",
    "Videography",
    "Oct 11, 2026",
    "Sam Rivera",
    "Maya Chen",
    "Not Started",
    "Pending",
    false,
    false,
  ),
  sample(
    "123463",
    "Fashion Campaign",
    "Photography",
    "Oct 12, 2026",
    "Noah Williams",
    "Jordan Bell",
    "In Progress",
    "Accepted",
    false,
    false,
  ),
  sample(
    "123464",
    "Product Launch",
    "Video & Photo",
    "Oct 13, 2026",
    "Sam Rivera",
    "Oliver Brooks",
    "Submitted",
    "Pending",
    false,
    false,
  ),
];

export const WORKSPACE_FOLDERS: WorkspaceFolder[] = [
  { id: "raw", name: "Raw Footages", files: 24, linked: true, protected: true },
  {
    id: "client",
    name: "Client selections",
    files: 24,
    linked: true,
    protected: true,
  },
  {
    id: "post",
    name: "Post-production files",
    files: 24,
    linked: true,
    protected: true,
  },
  {
    id: "versions",
    name: "Previous versions",
    files: 24,
    linked: true,
    protected: true,
  },
  {
    id: "reference",
    name: "Reference material",
    files: 24,
    linked: true,
    protected: true,
  },
];

export function getPreviewEditorId(role: EditorWorkspaceRole): number {
  const fallback = role === "internal" ? 901 : 903;
  if (typeof window === "undefined") return fallback;
  const requestId = Number(
    new URLSearchParams(window.location.search).get("editorId"),
  );
  return Number.isInteger(requestId) && getEditor(requestId)?.category === role
    ? requestId
    : fallback;
}

const KEY = (id: string, role: EditorWorkspaceRole) =>
  `beige:editor-workspace:demo:v3:${role}:${getPreviewEditorId(role)}:${id}`;
const CHANGE_EVENT = "beige:editor-workspace:changed";
const TEXT = (v: unknown) => (typeof v === "string" ? v : "");

export function getWorkspaceRecord(
  id: string,
  role: EditorWorkspaceRole,
): WorkspaceRecord {
  if (!id || typeof window === "undefined") return {};
  try {
    const text = window.sessionStorage.getItem(KEY(id, role));
    const value: unknown = text ? JSON.parse(text) : {};
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as WorkspaceRecord)
      : {};
  } catch {
    return {};
  }
}

export function updateWorkspaceRecord(
  id: string,
  changes: Partial<WorkspaceRecord>,
  role: EditorWorkspaceRole,
): void {
  if (!id || typeof window === "undefined") return;
  const next = { ...getWorkspaceRecord(id, role), ...changes };
  window.sessionStorage.setItem(KEY(id, role), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: `${role}:${id}` }),
  );
}

export function appendWorkspaceActivity(
  id: string,
  title: string,
  detail: string,
  category: WorkspaceActivity["category"],
  role: EditorWorkspaceRole,
): void {
  const current = getWorkspaceRecord(id, role);
  const item: WorkspaceActivity = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    detail,
    category,
    createdAt: new Date().toISOString(),
  };
  updateWorkspaceRecord(
    id,
    { activity: [item, ...(current.activity || [])] },
    role,
  );
}

const seedActivities = (
  shoot: WorkspaceShoot,
  role: EditorWorkspaceRole,
): WorkspaceActivity[] => [
  {
    id: `${shoot.id}-accepted`,
    title: `${shoot.name}: ${role === "internal" ? "Internal Editor" : "External Editor"} assignment activity`,
    detail:
      role === "internal"
        ? "Internal Editor assignment · no agreement required"
        : `Initial assignment · ${shoot.agreementStatus === "Accepted" ? "Agreement v1.0 accepted" : `Agreement ${shoot.agreementStatus.toLowerCase()}`}`,
    category: "agreement",
    createdAt: "2026-10-01T09:20:00",
  },
  {
    id: `${shoot.id}-sent`,
    title: "Assignment sent to Editor.",
    detail: "Email notification and agreement preview prepared (sample data)",
    category: "assignment",
    createdAt: "2026-09-30T14:25:00",
  },
  {
    id: `${shoot.id}-finance`,
    title: "Compensation updated to $250.",
    detail:
      "Editor compensation only · CP compensation unchanged (sample activity)",
    category: "finance",
    createdAt: "2026-09-30T14:10:00",
  },
  {
    id: `${shoot.id}-assign`,
    title: `Producer assigned an Editor to ${shoot.name}.`,
    detail: "Previous editor: Unassigned (sample activity)",
    category: "assignment",
    createdAt: "2026-09-30T13:42:00",
  },
];

function fromDemoAssignments(id: string, role: EditorWorkspaceRole) {
  return getDemoAssignments(id).find(
    (assignment) => assignment.editorId === getPreviewEditorId(role),
  );
}

export function getWorkspaceShoot(
  id: string,
  role: EditorWorkspaceRole,
): WorkspaceShoot | null {
  const demoAssignment = fromDemoAssignments(id, role);
  const original =
    WORKSPACE_DEMO_SHOOTS.find((item) => item.id === id) ||
    (demoAssignment
      ? sample(
          id,
          demoAssignment.projectName || `Shoot #${id}`,
          "Video & Photo",
          "Date TBD",
          "Unassigned",
          "Not specified",
          "Not Started",
          demoAssignment.agreementStatus === "accepted"
            ? "Accepted"
            : demoAssignment.agreementStatus === "rejected"
              ? "Rejected"
              : "Pending",
          role === "external",
          role === "internal",
        )
      : null);
  if (!original) return null;
  const changes = getWorkspaceRecord(id, role);
  const agreementStatus =
    role === "external" && demoAssignment?.agreementStatus
      ? demoAssignment.agreementStatus === "accepted"
        ? "Accepted"
        : demoAssignment.agreementStatus === "rejected"
          ? "Rejected"
          : demoAssignment.agreementStatus === "pending"
            ? "Pending"
            : changes.agreementStatus || original.agreementStatus
      : changes.agreementStatus || original.agreementStatus;
  return {
    ...original,
    ...changes,
    name: demoAssignment?.projectName || original.name,
    producer:
      demoAssignment?.projectName &&
      demoAssignment.projectName !== original.name
        ? "Not provided"
        : original.producer,
    creativePartner:
      demoAssignment?.projectName &&
      demoAssignment.projectName !== original.name
        ? "Not provided"
        : original.creativePartner,
    editingStatus: changes.editingStatus || original.editingStatus,
    agreementStatus,
    internalAssignment:
      (original.internalAssignment && getPreviewEditorId("internal") === 901) ||
      Boolean(role === "internal" && demoAssignment),
    externalAssignment:
      (original.externalAssignment && getPreviewEditorId("external") === 903) ||
      Boolean(role === "external" && demoAssignment),
    agreementSections: (role === "external" &&
    demoAssignment?.agreementSections?.length
      ? demoAssignment.agreementSections
      : original.agreementSections
    ).map((item) => ({ ...item })),
    compensation:
      role === "external" && demoAssignment?.compensation
        ? getCompensationTotal(demoAssignment.compensation)
        : original.compensation,
  };
}

function discoverAssignedShootIds(role: EditorWorkspaceRole): string[] {
  if (typeof window === "undefined") return [];
  const prefix = "beige:post-production-demo:v2:";
  try {
    const ids: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const id = key.slice(prefix.length);
      if (fromDemoAssignments(id, role)) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}

export function getWorkspaceShoots(
  role: EditorWorkspaceRole,
  scope: "mine" | "all" = "mine",
): WorkspaceShoot[] {
  const ids = Array.from(
    new Set([
      ...WORKSPACE_DEMO_SHOOTS.map((item) => item.id),
      ...discoverAssignedShootIds(role),
    ]),
  );
  return ids.flatMap((id) => {
    const shoot = getWorkspaceShoot(id, role);
    if (!shoot) return [];
    if (scope === "all" && role === "internal")
      return shoot.internalAssignment ? [] : [shoot];
    if (role === "external") return shoot.externalAssignment ? [shoot] : [];
    return shoot.internalAssignment ? [shoot] : [];
  });
}

export function getWorkspaceActivity(
  id: string,
  role: EditorWorkspaceRole,
): WorkspaceActivity[] {
  const shoot = getWorkspaceShoot(id, role);
  if (!shoot) return [];
  const record = getWorkspaceRecord(id, role);
  return [...(record.activity || []), ...seedActivities(shoot, role)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function setWorkspaceEditingStage(
  id: string,
  next: EditingStage,
  role: EditorWorkspaceRole,
): void {
  const current = getWorkspaceRecord(id, role);
  updateWorkspaceRecord(id, { ...current, editingStatus: next }, role);
  appendWorkspaceActivity(
    id,
    `Editing status changed to ${next}.`,
    "Editor workspace (static demo)",
    "editing",
    role,
  );
}

export function setWorkspaceAgreementStatus(
  id: string,
  status: ExternalAgreementStatus,
  reason = "",
): void {
  const current = getWorkspaceRecord(id, "external");
  updateWorkspaceRecord(
    id,
    {
      ...current,
      agreementStatus: status,
      rejectionReason: status === "Rejected" ? reason : undefined,
    },
    "external",
  );
  appendWorkspaceActivity(
    id,
    status === "Accepted"
      ? "External Editor accepted the assignment."
      : "External Editor rejected the assignment.",
    status === "Accepted"
      ? "Agreement v1.0 accepted in the static demo"
      : `Reason: ${TEXT(reason)}`,
    "agreement",
    "external",
  );
  const previous = getDemoAssignments(id).find(
    (item) => item.editorId === getPreviewEditorId("external"),
  );
  if (previous) {
    upsertDemoAssignment(id, {
      ...previous,
      status,
      agreementStatus: status === "Accepted" ? "accepted" : "rejected",
    });
  }
}

export function getWorkspaceFiles(
  id: string,
  role: EditorWorkspaceRole,
): WorkspaceFile[] {
  return getWorkspaceRecord(id, role).files || [];
}

export function addWorkspaceFile(
  id: string,
  file: WorkspaceFile,
  role: EditorWorkspaceRole,
): void {
  const record = getWorkspaceRecord(id, role);
  updateWorkspaceRecord(id, { files: [...(record.files || []), file] }, role);
  appendWorkspaceActivity(
    id,
    `New deliverable: ${file.name}`,
    "Local file metadata added (not uploaded to server)",
    "file",
    role,
  );
}

export function useWorkspaceRecord(
  id: string,
  role: EditorWorkspaceRole,
): WorkspaceRecord {
  const editorId = getPreviewEditorId(role);
  const [record, setRecord] = useState<WorkspaceRecord>({});
  useEffect(() => {
    setRecord(getWorkspaceRecord(id, role));
    const handler = (event: Event) => {
      if ((event as CustomEvent<string>).detail === `${role}:${id}`)
        setRecord(getWorkspaceRecord(id, role));
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, [id, role, editorId]);
  return record;
}
