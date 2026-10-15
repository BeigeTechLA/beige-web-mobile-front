"use client";

import { useEffect, useState } from "react";

export type EditorCategory = "internal" | "external";
export type CompensationMethod = "equal" | "role" | "manual";
export type RateMethod = "flat" | "hourly";
export type AgreementMode = "individual" | "common";

export interface DemoEditor {
  id: number;
  name: string;
  category: EditorCategory;
  specialty: string;
  activeShoots: number;
  availability: "available" | "limited";
  avatarUrl?: string;
}

// Replace only this data provider when the producer/editor list API is ready.
export const DEMO_EDITORS: DemoEditor[] = [
  {
    id: 901,
    name: "Priya Shah",
    category: "internal",
    specialty: "Video Editing",
    activeShoots: 4,
    availability: "available",
  },
  {
    id: 902,
    name: "Liam Torres",
    category: "internal",
    specialty: "Color + Finishing",
    activeShoots: 2,
    availability: "available",
  },
  {
    id: 903,
    name: "Zara Khan",
    category: "external",
    specialty: "Video + Motion Graphics",
    activeShoots: 6,
    availability: "available",
  },
  {
    id: 904,
    name: "Omar Ali",
    category: "external",
    specialty: "Photography Retouching",
    activeShoots: 3,
    availability: "available",
  },
];

export interface AdvancePayment {
  amount: number;
  paymentDate: string;
  notes: string;
}

export interface EditorCompensation {
  method: CompensationMethod;
  rateMethod: RateMethod;
  base: number;
  hourlyRate: number;
  hours: number;
  editing: number;
  travel: number;
  bonus: number;
  notes: string;
  totalShootBudget: number;
  advance: AdvancePayment | null;
}

export interface EditorAssignment {
  editorId: number;
  projectName?: string;
  shootLabel?: string;
  workflow?: "normal" | "agreement";
  status: "Accepted" | "Assigned" | "Pending" | "Rejected";
  compensation: EditorCompensation | null;
  financeStatus: "not_submitted" | "submitted";
  agreementMode: AgreementMode | null;
  agreementStatus:
    | "not_started"
    | "draft"
    | "pending"
    | "accepted"
    | "rejected";
  agreementVersion: string | null;
  agreementSections: AgreementSection[];
}

export interface AgreementSection {
  id: string;
  title: string;
  content: string;
  deliverableDate?: string;
}

export const DEFAULT_SECTIONS: AgreementSection[] = [
  {
    id: "scope",
    title: "Scope of Services",
    content:
      "Edit and deliver the agreed video assets for the assigned production.",
  },
  {
    id: "deliverables",
    title: "Deliverables",
    content:
      "Provide final edited files in the requested format and resolution.",
    deliverableDate: "2026-10-28",
  },
  {
    id: "turnaround",
    title: "Expected turnaround",
    content: "Submit the first cut by the agreed deadline.",
  },
  {
    id: "revisions",
    title: "Revision expectations",
    content:
      "Include the agreed rounds of revisions and communicate any additional scope.",
  },
  {
    id: "transfer",
    title: "File transfer requirements",
    content:
      "Use the designated project folder to share source and final files securely.",
  },
  {
    id: "expenses",
    title: "Expenses, if applicable",
    content: "Additional expenses require prior written approval.",
  },
  {
    id: "instructions",
    title: "Any specific instructions",
    content:
      "Follow the shoot brief, confidentiality requirements, and production notes.",
  },
  {
    id: "version",
    title: "Agreement version",
    content: "This agreement is generated as Beige Sheet version v1.0.",
  },
];

export const createDefaultCompensation = (): EditorCompensation => ({
  method: "equal",
  rateMethod: "flat",
  base: 5000,
  hourlyRate: 100,
  hours: 50,
  editing: 750,
  travel: 500,
  bonus: 0,
  notes: "",
  totalShootBudget: 50000,
  advance: null,
});

export const getCompensationTotal = (value: EditorCompensation): number =>
  Math.max(
    0,
    (value.rateMethod === "flat"
      ? value.base
      : value.hourlyRate * value.hours) +
      value.editing +
      value.travel +
      value.bonus,
  );

export const formatUSD = (amount: number): string =>
  Number.isFinite(amount)
    ? amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      })
    : "$0.00";

export const getEditor = (id: number): DemoEditor | undefined =>
  DEMO_EDITORS.find((editor) => editor.id === id);

const storageKey = (projectId: string): string =>
  `beige:post-production-demo:v2:${projectId}`;
const changeEvent = "beige:post-production-demo:updated";
const queueKey = (projectId: string) =>
  `beige:post-production-demo:queue:v1:${projectId}`;

/** Remaining editors are resumed after the agreement page completes. */
export function savePendingEditorQueue(
  projectId: string,
  editorIds: number[],
): void {
  if (typeof window === "undefined") return;
  try {
    const filtered = Array.from(new Set(editorIds)).filter((id) =>
      Boolean(getEditor(id)),
    );
    if (!filtered.length) window.sessionStorage.removeItem(queueKey(projectId));
    else
      window.sessionStorage.setItem(
        queueKey(projectId),
        JSON.stringify(filtered),
      );
  } catch (error) {
    console.warn("Unable to store remaining demo editors", error);
  }
}

export function takePendingEditorQueue(projectId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.sessionStorage.getItem(queueKey(projectId));
    window.sessionStorage.removeItem(queueKey(projectId));
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (id): id is number =>
            typeof id === "number" && Boolean(getEditor(id)),
        )
      : [];
  } catch {
    return [];
  }
}

export function hasPendingEditorQueue(projectId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.sessionStorage.getItem(queueKey(projectId)));
  } catch {
    return false;
  }
}

export function getDemoAssignments(projectId: string): EditorAssignment[] {
  if (!projectId || typeof window === "undefined") return [];
  try {
    const value = window.sessionStorage.getItem(storageKey(projectId));
    const parsed: unknown = value ? JSON.parse(value) : [];
    if (!Array.isArray(parsed)) return [];
    // Migrate old static previews that incorrectly treated External Editors as normal assignments.
    return parsed
      .filter((item): item is EditorAssignment =>
        Boolean(
          item &&
          typeof item === "object" &&
          typeof item.editorId === "number" &&
          getEditor(item.editorId),
        ),
      )
      .map((item) =>
        getEditor(item.editorId)?.category === "external" &&
        item.workflow !== "agreement"
          ? {
              ...item,
              workflow: "agreement" as const,
              status: "Pending" as const,
            }
          : item,
      );
  } catch {
    return [];
  }
}

export function saveDemoAssignments(
  projectId: string,
  next: EditorAssignment[],
): void {
  if (!projectId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(projectId), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: projectId }));
  } catch (error) {
    console.warn("Could not save editor demo state in session storage", error);
  }
}

export function updateDemoAssignments(
  projectId: string,
  update: (current: EditorAssignment[]) => EditorAssignment[],
): void {
  saveDemoAssignments(projectId, update(getDemoAssignments(projectId)));
}

export function upsertDemoAssignment(
  projectId: string,
  patch: EditorAssignment,
  replaceEditorId?: number | null,
): void {
  updateDemoAssignments(projectId, (current) => [
    ...current.filter(
      (item) =>
        item.editorId !== patch.editorId && item.editorId !== replaceEditorId,
    ),
    patch,
  ]);
}

export function removeDemoAssignment(
  projectId: string,
  editorId: number,
): void {
  updateDemoAssignments(projectId, (current) =>
    current.filter((item) => item.editorId !== editorId),
  );
}

export function createDemoAssignment(editorId: number): EditorAssignment {
  const editor = getEditor(editorId);
  return {
    editorId,
    workflow: editor?.category === "external" ? "agreement" : "normal",
    status: editor?.category === "internal" ? "Accepted" : "Pending",
    compensation: null,
    financeStatus: "not_submitted",
    agreementMode: null,
    agreementStatus: "not_started",
    agreementVersion: null,
    agreementSections: DEFAULT_SECTIONS.map((item) => ({ ...item })),
  };
}

export function useDemoEditorAssignments(
  projectId: string,
): EditorAssignment[] {
  const [assignments, setAssignments] = useState<EditorAssignment[]>([]);
  useEffect(() => {
    setAssignments(getDemoAssignments(projectId));
    const refresh = (event: Event) => {
      if ((event as CustomEvent<string>).detail === projectId)
        setAssignments(getDemoAssignments(projectId));
    };
    window.addEventListener(changeEvent, refresh);
    return () => window.removeEventListener(changeEvent, refresh);
  }, [projectId]);
  return assignments;
}
