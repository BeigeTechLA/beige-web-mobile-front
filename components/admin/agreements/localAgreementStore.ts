"use client";

export type LocalAgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

export type LocalAgreementType = "general" | "shoot";

export type LocalAgreementSection = {
  id: number;
  title: string;
  content: string;
  description?: string;
};

export type LocalGeneralAgreement = {
  id: string;
  agreementName: string;
  agreementTitle: string;
  description: string;
  effectiveDate: string;
  currentVersion: string;
  updatedAt: string;
  createdAt: string;
  isActive: boolean;
  sections: LocalAgreementSection[];
};

export type LocalAgreementVersionSnapshot = {
  id: string;
  agreementId: string;
  version: string;
  agreementName: string;
  agreementTitle: string;
  description: string;
  effectiveDate: string;
  sections: LocalAgreementSection[];
  createdAt: string;
  author: string;
  reason: string;
};

export type LocalAgreementHistoryItem = {
  id: number;
  cpName: string;
  cpId?: string;
  cpInitials: string;
  cpDate: string;
  avatarTone: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  status: LocalAgreementStatus;
  agreementType: LocalAgreementType;
  admin: string;
  sendDate: string;
  createdAt: string;
  agreementId?: string;
};

export type LocalShootAgreementSection = {
  id: string;
  title: string;
  content: string;
  isOpen?: boolean;
};

export type LocalShootAgreementCreator = {
  creatorId: number;
  creatorName: string;
  creatorEmail?: string | null;
  role: string;
  rateType?: "flat" | "hourly";
  totalCompensation: number;
  basePayout?: number;
  editingPayout?: number;
  travelAdjustment?: number;
  bonusAdjustment?: number;
  notes?: string;
  advanceAmount?: number;
  advancePaymentDate?: string;
  advanceNotes?: string;
};

export type LocalShootAgreementRecord = {
  id: string;
  agreementId: string;
  shootId: string;
  bookingId: number;
  projectName: string;
  projectCode?: string;
  assignmentId?: string;
  productionDate?: string | null;
  location?: string;
  callTime?: string;
  expectedEndTime?: string;
  shootAmount?: number;
  compensationMethod?: string;
  creators: LocalShootAgreementCreator[];
  mode: "individual" | "common";
  version: string;
  status: LocalAgreementStatus;
  sentAt: string;
  createdAt: string;
  commonSections: LocalShootAgreementSection[];
  individualSections: Record<string, LocalShootAgreementSection[]>;
};


type LocalAgreementState = {
  generalAgreements: LocalGeneralAgreement[];
  history: LocalAgreementHistoryItem[];
  versions: Record<string, LocalAgreementVersionSnapshot[]>;
  shootAgreements: Record<string, LocalShootAgreementRecord>;
  shootVersions: Record<string, LocalShootAgreementRecord[]>;
};

const STORAGE_KEY = "beige_admin_agreements_local_v3";
const LEGACY_STORAGE_KEYS = ["beige_admin_agreements_local_v2"];

export const DEFAULT_GENERAL_AGREEMENT: LocalGeneralAgreement = {
  id: "general-1",
  agreementName: "Beige General Agreement",
  agreementTitle: "BEIGE CREATIVE PARTNER AGREEMENT",
  description:
    "This Creative Partner Agreement (the “Agreement”) governs participation as a creative professional on the Beige platform and the performance of photography, videography, production, post-production, livestreaming, editing, audio, and other creative or production services arranged through Beige.\n\nThis Agreement is between Beige Corporation, a Delaware corporation (“Beige,” “we,” “us,” or “our”), and the individual or entity accepting this Agreement (“Creative Partner,” “you,” or “your”).\n\nBy creating a Creative Partner account and affirmatively accepting this Agreement, you acknowledge that you have read, understood, and agree to be bound by it.",
  effectiveDate: "2026-09-01",
  currentVersion: "v1.0",
  updatedAt: "2026-09-01T10:00:00.000Z",
  createdAt: "2026-01-01T10:00:00.000Z",
  isActive: true,
  sections: [
    {
      id: 1,
      title: "Creative Partner Relationship",
      content:
        "Beige operates a technology platform and production network through which independent creative professionals may receive opportunities to provide services for Beige and Beige clients.\n\nYou participate as an independent contractor and not as an employee, agent, partner, joint venturer, or representative of Beige.\n\nSubject to applicable law, you are responsible for your own taxes, equipment, business expenses, licenses, registrations, insurance, and other obligations associated with operating as an independent professional.\n\nNothing in this Agreement guarantees any minimum number of assignments, minimum compensation, minimum hours, or continuing relationship with Beige.\n\nExcept as expressly authorized by Beige in writing, you have no authority to enter into agreements, modify project terms, provide refunds or credits, make commitments, incur obligations, or otherwise bind Beige.",
    },
    {
      id: 2,
      title: "Project Assignments and Beige Sheets",
      content:
        "Beige may offer individual projects or assignments to you from time to time (each, an “Assignment”).\n\nEach Assignment will be documented through a digital project assignment, production sheet, deal sheet, booking record, or similar electronic record issued through Beige (a “Beige Sheet”).",
    },
  ],
};

const DEFAULT_HISTORY: LocalAgreementHistoryItem[] = [
  {
    id: 1,
    cpName: "John Doe",
    cpId: "101",
    cpInitials: "JD",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#DDEBFA]",
    projectName: "ABC Corporate Shoot",
    projectId: "ASN-2012",
    role: "Videographer",
    version: "v1.0",
    status: "Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 10:32 AM",
    createdAt: "2026-01-13T10:32:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 2,
    cpName: "Rami Guzman",
    cpId: "102",
    cpInitials: "RG",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#D4E9FF]",
    projectName: "Fashion Editorial",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    status: "Expired",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 11:10 AM",
    createdAt: "2026-01-13T11:10:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 3,
    cpName: "Jhas Lee",
    cpId: "103",
    cpInitials: "JL",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#F2E6CF]",
    projectName: "Product Shoot — Skincare",
    projectId: "ASN-2001",
    role: "Editor",
    version: "v1.0",
    status: "Expired",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 12:05 PM",
    createdAt: "2026-01-13T12:05:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 4,
    cpName: "Kevin Brooks",
    cpId: "104",
    cpInitials: "KB",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#D8F5C8]",
    projectName: "Podcast Shoot",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    status: "Not Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 01:20 PM",
    createdAt: "2026-01-13T13:20:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 5,
    cpName: "Yuki Tanaka",
    cpId: "105",
    cpInitials: "YT",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#FFF0BD]",
    projectName: "Corporate Photography",
    projectId: "ASN-2001",
    role: "Videographer",
    version: "v1.0",
    status: "Pending",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 02:15 PM",
    createdAt: "2026-01-13T14:15:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 6,
    cpName: "Lisa Anderson",
    cpId: "106",
    cpInitials: "LA",
    cpDate: "Jan 13, 2026",
    avatarTone: "bg-[#F8C9E8]",
    projectName: "Music Video",
    projectId: "ASN-2001",
    role: "Photographer",
    version: "v1.0",
    status: "Not Accepted",
    agreementType: "general",
    admin: "Admin",
    sendDate: "Jan 13, 2026, 03:40 PM",
    createdAt: "2026-01-13T15:40:00.000Z",
    agreementId: "general-1",
  },
  {
    id: 7,
    cpName: "John Doe",
    cpId: "101",
    cpInitials: "JD",
    cpDate: "Sep 15, 2026",
    avatarTone: "bg-[#DDEBFA]",
    projectName: "ABC Corporate Shoot",
    projectId: "ASN-2012",
    role: "Videographer",
    version: "v1.0",
    status: "Accepted",
    agreementType: "shoot",
    admin: "Admin",
    sendDate: "Sep 15, 2026, 10:32 AM",
    createdAt: "2026-09-15T10:32:00.000Z",
  },
];

const cloneSections = (sections: LocalAgreementSection[]) =>
  sections.map((section) => ({ ...section }));

const snapshotFromAgreement = (
  agreement: LocalGeneralAgreement,
  reason = "Initial agreement creation",
): LocalAgreementVersionSnapshot => ({
  id: `${agreement.id}-${agreement.currentVersion}`,
  agreementId: agreement.id,
  version: agreement.currentVersion,
  agreementName: agreement.agreementName,
  agreementTitle: agreement.agreementTitle,
  description: agreement.description,
  effectiveDate: agreement.effectiveDate,
  sections: cloneSections(agreement.sections),
  createdAt: agreement.updatedAt || agreement.createdAt,
  author: "Admin",
  reason,
});

const defaultState = (): LocalAgreementState => ({
  generalAgreements: [DEFAULT_GENERAL_AGREEMENT],
  history: DEFAULT_HISTORY,
  versions: {
    [DEFAULT_GENERAL_AGREEMENT.id]: [snapshotFromAgreement(DEFAULT_GENERAL_AGREEMENT)],
  },
  shootAgreements: {},
  shootVersions: {},
});

const canUseStorage = () => typeof window !== "undefined";

const normalizeState = (parsed?: Partial<LocalAgreementState>): LocalAgreementState => {
  const seeded = defaultState();
  const generalAgreements =
    Array.isArray(parsed?.generalAgreements) && parsed!.generalAgreements!.length > 0
      ? parsed!.generalAgreements!
      : seeded.generalAgreements;
  const history = Array.isArray(parsed?.history) ? parsed!.history! : seeded.history;
  const versions: Record<string, LocalAgreementVersionSnapshot[]> = {
    ...(parsed?.versions || {}),
  };

  generalAgreements.forEach((agreement) => {
    if (!Array.isArray(versions[agreement.id]) || versions[agreement.id].length === 0) {
      versions[agreement.id] = [snapshotFromAgreement(agreement)];
    }
  });

  const shootAgreements = parsed?.shootAgreements && typeof parsed.shootAgreements === "object"
    ? parsed.shootAgreements as Record<string, LocalShootAgreementRecord>
    : {};
  const shootVersions = parsed?.shootVersions && typeof parsed.shootVersions === "object"
    ? parsed.shootVersions as Record<string, LocalShootAgreementRecord[]>
    : {};

  return { generalAgreements, history, versions, shootAgreements, shootVersions };
};

export const getLocalAgreementState = (): LocalAgreementState => {
  if (!canUseStorage()) return defaultState();

  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacy = window.localStorage.getItem(legacyKey);
        if (legacy) {
          raw = legacy;
          break;
        }
      }
    }

    if (!raw) {
      const seeded = defaultState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const normalized = normalizeState(JSON.parse(raw) as Partial<LocalAgreementState>);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return defaultState();
  }
};

export const saveLocalAgreementState = (state: LocalAgreementState) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("beige-agreements-local-updated"));
};

export const getLocalGeneralAgreement = (id?: string | number | null) => {
  const state = getLocalAgreementState();
  if (id !== undefined && id !== null) {
    const match = state.generalAgreements.find((item) => String(item.id) === String(id));
    if (match) return match;
  }
  return (
    state.generalAgreements.find((item) => item.isActive) ||
    state.generalAgreements[0] ||
    DEFAULT_GENERAL_AGREEMENT
  );
};

export const findLocalGeneralAgreement = (id?: string | number | null) => {
  if (id === undefined || id === null) return undefined;
  return getLocalAgreementState().generalAgreements.find(
    (item) => String(item.id) === String(id),
  );
};

const nextVersion = (value: string) => {
  const match = String(value || "v1.0").match(/(\d+)\.(\d+)/);
  if (!match) return "v1.1";
  return `v${match[1]}.${Number(match[2]) + 1}`;
};

const formatLocalHistoryDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatLocalSendDate = (date: Date) =>
  date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const saveLocalGeneralAgreement = (input: {
  id?: string | null;
  agreementName: string;
  agreementTitle: string;
  description: string;
  effectiveDate: string;
  sections: LocalAgreementSection[];
  reason?: string;
}) => {
  const state = getLocalAgreementState();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const existing = input.id
    ? state.generalAgreements.find((item) => String(item.id) === String(input.id))
    : null;

  const id = existing?.id || `general-${Date.now()}`;
  const currentVersion = existing ? nextVersion(existing.currentVersion) : "v1.0";
  const record: LocalGeneralAgreement = {
    id,
    agreementName: input.agreementName,
    agreementTitle: input.agreementTitle,
    description: input.description,
    effectiveDate: input.effectiveDate,
    currentVersion,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
    isActive: true,
    sections: cloneSections(input.sections),
  };

  const generalAgreements = state.generalAgreements.map((item) => ({
    ...item,
    isActive: item.id === id,
  }));
  const index = generalAgreements.findIndex((item) => item.id === id);
  if (index >= 0) generalAgreements[index] = record;
  else generalAgreements.unshift(record);

  const versions = { ...state.versions };
  const previousVersions = Array.isArray(versions[id]) ? [...versions[id]] : [];
  previousVersions.push(
    snapshotFromAgreement(
      record,
      input.reason || (existing ? "Agreement updated" : "Initial agreement creation"),
    ),
  );
  versions[id] = previousVersions;

  const newHistory: LocalAgreementHistoryItem = {
    id: Math.max(0, ...state.history.map((item) => Number(item.id) || 0)) + 1,
    cpName: "John Doe",
    cpId: "101",
    cpInitials: "JD",
    cpDate: formatLocalHistoryDate(nowDate),
    avatarTone: "bg-[#DDEBFA]",
    projectName: input.agreementName || "General Agreement",
    projectId: "ASN-LOCAL",
    role: "Videographer",
    version: record.currentVersion,
    status: "Pending",
    agreementType: "general",
    admin: "Admin",
    sendDate: formatLocalSendDate(nowDate),
    createdAt: now,
    agreementId: id,
  };

  saveLocalAgreementState({
    ...state,
    generalAgreements,
    history: [newHistory, ...state.history],
    versions,
  });
  return record;
};

export const getLocalAgreementHistory = () => getLocalAgreementState().history;

export const getLocalGeneralAgreementVersions = (agreementId: string | number) => {
  const state = getLocalAgreementState();
  const id = String(agreementId);
  const versions = Array.isArray(state.versions[id]) ? state.versions[id] : [];
  return [...versions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getLocalGeneralAgreementVersion = (
  agreementId: string | number,
  version: string,
) =>
  getLocalGeneralAgreementVersions(agreementId).find(
    (item) => item.version.toLowerCase() === String(version).toLowerCase(),
  );

export const resendLocalAgreementHistoryItem = (historyId: string | number) => {
  const state = getLocalAgreementState();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  let updated: LocalAgreementHistoryItem | undefined;

  const history = state.history.map((item) => {
    if (String(item.id) !== String(historyId)) return item;
    updated = {
      ...item,
      status: "Pending",
      cpDate: formatLocalHistoryDate(nowDate),
      sendDate: formatLocalSendDate(nowDate),
      createdAt: now,
    };
    return updated;
  });

  if (updated) {
    const shootAgreements = { ...state.shootAgreements };
    if (updated.agreementType === "shoot" && updated.agreementId && shootAgreements[updated.agreementId]) {
      shootAgreements[updated.agreementId] = {
        ...shootAgreements[updated.agreementId],
        status: "Pending",
        sentAt: now,
      };
    }
    saveLocalAgreementState({ ...state, history, shootAgreements });
  }
  return updated;
};

export const deleteLocalAgreementHistoryItem = (historyId: string | number) => {
  const state = getLocalAgreementState();
  const nextHistory = state.history.filter((item) => String(item.id) !== String(historyId));
  if (nextHistory.length === state.history.length) return false;
  saveLocalAgreementState({ ...state, history: nextHistory });
  return true;
};

export const revertLocalGeneralAgreementVersion = (
  agreementId: string | number,
  sourceVersion: string,
) => {
  const state = getLocalAgreementState();
  const id = String(agreementId);
  const current = state.generalAgreements.find((item) => String(item.id) === id);
  const source = (state.versions[id] || []).find(
    (item) => item.version.toLowerCase() === sourceVersion.toLowerCase(),
  );
  if (!current || !source) return null;

  return saveLocalGeneralAgreement({
    id,
    agreementName: source.agreementName,
    agreementTitle: source.agreementTitle,
    description: source.description,
    effectiveDate: source.effectiveDate,
    sections: cloneSections(source.sections),
    reason: `Reverted to ${source.version}`,
  });
};

export const setLocalGeneralAgreementActive = (agreementId: string | number) => {
  const state = getLocalAgreementState();
  const id = String(agreementId);
  if (!state.generalAgreements.some((item) => String(item.id) === id)) return false;
  saveLocalAgreementState({
    ...state,
    generalAgreements: state.generalAgreements.map((item) => ({
      ...item,
      isActive: String(item.id) === id,
    })),
  });
  return true;
};

const cloneShootSections = (sections: LocalShootAgreementSection[] = []) =>
  sections.map((section) => ({ ...section }));

const cloneShootAgreement = (record: LocalShootAgreementRecord): LocalShootAgreementRecord => ({
  ...record,
  creators: record.creators.map((creator) => ({ ...creator })),
  commonSections: cloneShootSections(record.commonSections),
  individualSections: Object.fromEntries(
    Object.entries(record.individualSections || {}).map(([creatorId, sections]) => [
      creatorId,
      cloneShootSections(sections),
    ]),
  ),
});

const resolveShootAgreementId = (state: LocalAgreementState, id: string | number) => {
  const key = String(id);
  if (state.shootAgreements[key]) return key;
  const historyMatch = state.history.find(
    (item) => item.agreementType === "shoot" && String(item.id) === key,
  );
  if (historyMatch?.agreementId && state.shootAgreements[historyMatch.agreementId]) {
    return historyMatch.agreementId;
  }
  const direct = Object.values(state.shootAgreements).find(
    (item) => String(item.shootId) === key || String(item.bookingId) === key,
  );
  return direct?.agreementId || null;
};

export const getLocalShootAgreement = (id: string | number) => {
  const state = getLocalAgreementState();
  const agreementId = resolveShootAgreementId(state, id);
  if (!agreementId) return undefined;
  const record = state.shootAgreements[agreementId];
  return record ? cloneShootAgreement(record) : undefined;
};

export const getLocalShootAgreementVersions = (id: string | number) => {
  const state = getLocalAgreementState();
  const agreementId = resolveShootAgreementId(state, id) || String(id);
  const versions = state.shootVersions[agreementId] || [];
  return versions
    .map(cloneShootAgreement)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
};

export const saveLocalShootAgreement = (
  input: Omit<LocalShootAgreementRecord, "id" | "agreementId" | "version" | "status" | "sentAt" | "createdAt"> & {
    agreementId?: string;
    version?: string;
    status?: LocalAgreementStatus;
    createdAt?: string;
  },
  options?: { createNewVersion?: boolean },
) => {
  const state = getLocalAgreementState();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const agreementId = input.agreementId || `shoot-${input.shootId}`;
  const existing = state.shootAgreements[agreementId];
  const version = options?.createNewVersion && existing
    ? nextVersion(existing.version)
    : existing?.version || input.version || "v1.0";

  const record: LocalShootAgreementRecord = {
    ...input,
    id: agreementId,
    agreementId,
    shootId: String(input.shootId),
    version,
    status: input.status || "Pending",
    sentAt: now,
    createdAt: existing?.createdAt || input.createdAt || now,
    creators: input.creators.map((creator) => ({ ...creator })),
    commonSections: cloneShootSections(input.commonSections),
    individualSections: Object.fromEntries(
      Object.entries(input.individualSections || {}).map(([creatorId, sections]) => [
        creatorId,
        cloneShootSections(sections),
      ]),
    ),
  };

  const shootAgreements = { ...state.shootAgreements, [agreementId]: record };
  const shootVersions = { ...state.shootVersions };
  const previousVersions = [...(shootVersions[agreementId] || [])];
  const versionIndex = previousVersions.findIndex((item) => item.version === version);
  if (versionIndex >= 0 && !options?.createNewVersion) previousVersions[versionIndex] = cloneShootAgreement(record);
  else previousVersions.push(cloneShootAgreement(record));
  shootVersions[agreementId] = previousVersions;

  let nextHistoryId = Math.max(0, ...state.history.map((item) => Number(item.id) || 0)) + 1;
  const history = [...state.history];
  record.creators.forEach((creator) => {
    const existingIndex = history.findIndex(
      (item) =>
        item.agreementType === "shoot" &&
        item.agreementId === agreementId &&
        String(item.cpId || "") === String(creator.creatorId),
    );
    const historyItem: LocalAgreementHistoryItem = {
      id: existingIndex >= 0 ? history[existingIndex].id : nextHistoryId++,
      cpName: creator.creatorName || `Creative Partner #${creator.creatorId}`,
      cpId: String(creator.creatorId),
      cpInitials: (creator.creatorName || "CP")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      cpDate: formatLocalHistoryDate(nowDate),
      avatarTone: existingIndex >= 0 ? history[existingIndex].avatarTone : "bg-[#DDEBFA]",
      projectName: record.projectName || `Shoot #${record.bookingId}`,
      projectId: record.assignmentId || record.projectCode || `ASSIGN-${record.bookingId}`,
      role: creator.role || "Creative Partner",
      version,
      status: "Pending",
      agreementType: "shoot",
      admin: "Admin",
      sendDate: formatLocalSendDate(nowDate),
      createdAt: now,
      agreementId,
    };
    if (existingIndex >= 0) history[existingIndex] = historyItem;
    else history.unshift(historyItem);
  });

  saveLocalAgreementState({
    ...state,
    history,
    shootAgreements,
    shootVersions,
  });
  return cloneShootAgreement(record);
};

export const resendLocalShootAgreement = (
  agreementIdOrHistoryId: string | number,
  creatorId?: string | number,
) => {
  const state = getLocalAgreementState();
  const agreementId = resolveShootAgreementId(state, agreementIdOrHistoryId);
  if (!agreementId) return undefined;
  const existing = state.shootAgreements[agreementId];
  if (!existing) return undefined;
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const nextRecord = { ...existing, status: "Pending" as LocalAgreementStatus, sentAt: now };
  const history = state.history.map((item) => {
    if (item.agreementType !== "shoot" || item.agreementId !== agreementId) return item;
    if (creatorId !== undefined && String(item.cpId || "") !== String(creatorId)) return item;
    return {
      ...item,
      status: "Pending" as LocalAgreementStatus,
      cpDate: formatLocalHistoryDate(nowDate),
      sendDate: formatLocalSendDate(nowDate),
      createdAt: now,
    };
  });
  saveLocalAgreementState({
    ...state,
    history,
    shootAgreements: { ...state.shootAgreements, [agreementId]: nextRecord },
  });
  return cloneShootAgreement(nextRecord);
};

export const revertLocalShootAgreementVersion = (
  agreementIdOrHistoryId: string | number,
  sourceVersion: string,
) => {
  const state = getLocalAgreementState();
  const agreementId = resolveShootAgreementId(state, agreementIdOrHistoryId);
  if (!agreementId) return null;
  const source = (state.shootVersions[agreementId] || []).find(
    (item) => item.version.toLowerCase() === sourceVersion.toLowerCase(),
  );
  if (!source) return null;
  const {
    id: _id,
    agreementId: _agreementId,
    version: _version,
    status: _status,
    sentAt: _sentAt,
    createdAt,
    ...input
  } = source;
  return saveLocalShootAgreement(
    { ...input, agreementId, createdAt, status: "Pending" },
    { createNewVersion: true },
  );
};

export const resetLocalAgreementDemo = () => {
  const seeded = defaultState();
  saveLocalAgreementState(seeded);
  return seeded;
};
