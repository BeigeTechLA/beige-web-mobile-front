"use client";

import type {
  ProducerAssignmentApi,
  ProducerOption,
  ProducerAssignmentResult,
} from "./ProjectProducer";

export const STATIC_PRODUCERS: ProducerOption[] = [
  {
    id: "demo-nafisa",
    name: "Nafisa Khan",
    role: "Producer",
    activeShoots: 4,
    availability: "available",
    isActive: true,
  },
  {
    id: "demo-sam",
    name: "Sam Rivera",
    role: "Producer",
    activeShoots: 2,
    availability: "available_today",
    isActive: true,
  },
  {
    id: "demo-alif",
    name: "Alif Rahman",
    role: "Producer",
    activeShoots: 6,
    availability: "limited_capacity",
    isActive: true,
  },
];

export type StoredProducerAssignment = {
  producerId: string | null;
  updatedAt: string;
};

const KEY = (projectId: string) =>
  `beige:project-producer:demo:v1:${projectId}`;

/** Undefined means "this shoot has no demo override"; null means "removed in demo". */
export function readProducerDemoAssignment(
  projectId: string,
): StoredProducerAssignment | undefined {
  if (!projectId || typeof window === "undefined") return undefined;
  try {
    const text = window.sessionStorage.getItem(KEY(projectId));
    if (text === null) return undefined;
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      return undefined;
    const row = value as Record<string, unknown>;
    if (row.producerId !== null && typeof row.producerId !== "string")
      return undefined;
    return {
      producerId: row.producerId as string | null,
      updatedAt: String(row.updatedAt || ""),
    };
  } catch {
    return undefined;
  }
}

export function writeProducerDemoAssignment(
  projectId: string,
  producerId: string | null,
): void {
  if (!projectId || typeof window === "undefined")
    throw new Error("A shoot ID is required.");
  window.sessionStorage.setItem(
    KEY(projectId),
    JSON.stringify({ producerId, updatedAt: new Date().toISOString() }),
  );
}

const updateProducer = async (
  projectId: string,
  producerId: string,
): Promise<ProducerAssignmentResult> => {
  const producer = STATIC_PRODUCERS.find(
    (item) => item.id === producerId && item.isActive !== false,
  );
  if (!producer)
    return { success: false, error: "This producer is not available." };
  try {
    writeProducerDemoAssignment(projectId, producerId);
    return { success: true, notificationSent: false };
  } catch {
    return {
      success: false,
      error: "Unable to save demo assignment in this browser session.",
    };
  }
};

/** The only producer data-service dependency of the UI. Replace with a real API adapter later. */
export const producerDemoService: ProducerAssignmentApi = {
  list: async () => STATIC_PRODUCERS.map((producer) => ({ ...producer })),
  assign: updateProducer,
  change: updateProducer,
  remove: async (projectId) => {
    try {
      writeProducerDemoAssignment(projectId, null);
      return { success: true, notificationSent: false };
    } catch {
      return { success: false, error: "Unable to remove the demo assignment." };
    }
  },
};
