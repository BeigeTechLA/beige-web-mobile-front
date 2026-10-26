/* ------------------------------------------------------------------ */
/* Editor file manager – shared types                                  */
/* ------------------------------------------------------------------ */

export type ViewMode = "grid" | "list" | "compact";

export type EditingStep =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "revision_requested"
  | "resubmitted"
  | "approved"
  | "completed";

export const EDITING_STEPS: { key: EditingStep; label: string }[] = [
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In Progress" },
  { key: "submitted", label: "Submitted" },
  { key: "revision_requested", label: "Revision Requested" },
  { key: "resubmitted", label: "Resubmitted" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" },
];

export interface ShootFolderSummary {
  id: string;
  shootCode: string; // "#123456"
  service: string; // "Photo Retouching"
  title: string;
  initials: string;
  projectName: string;
  producer: string;
  editorType: string;
  /** Person notified on submission */
  reviewerName: string;
  isLinked: boolean;
  dueInDays: number;
  linkedOn: string; // ISO date
  photosToEdit: number;
  videosToEdit: number;
  /** Total edited files the editor must deliver */
  requiredDeliverables: number;
  deliverableLabel: string; // "Edited photography"
  editing: {
    requirements: string;
    deliverables: string;
    format: string;
    dueDate: string; // ISO date
    revisions: string;
    brief: string;
  };
}

export interface Person {
  name: string;
  initials: string;
}

export interface FolderItem {
  id: string;
  name: string;
  /** "800 Items", "03 Files" … */
  countLabel: string;
  /** Project tag pill ("Holiday Campaign") */
  tag?: string;
  isLinked?: boolean;
  /** Orange call-out next to the name ("Edits Needed") */
  callout?: string;
  /** Tooltip for the ⓘ next to the name */
  info?: string;
  /** Footer: "Opened 2 hours ago" style */
  opened?: { by: Person; label: string };
  /** Footer: "Uploaded by …" style */
  uploaded?: { by: Person; at: string };
}

export type FileKind = "image" | "video" | "other";

export type FileStatus = "selected_for_edits" | "ready_for_approval" | "submitted_for_approval";

export interface FileComment {
  id: string;
  author: Person;
  text: string;
  at: string; // ISO
}

export interface FileItem {
  id: string;
  code: string; // "#12345"
  name: string; // "IMG_001.jpg"
  version: string; // "RAW_V1"
  versionNumber: number;
  isLatest: boolean;
  sizeLabel: string;
  kind: FileKind;
  /** Object URL / thumbnail; falls back to a placeholder */
  previewUrl?: string;
  status: FileStatus;
  referenceLink?: string;
  referenceMessage?: string;
  uploadedBy: Person;
  uploadedAt: string; // ISO
  updatedAt: string; // ISO
  comments: FileComment[];
}
