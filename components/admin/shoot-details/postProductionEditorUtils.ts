export type EditorCategory = "internal" | "external" | "unknown";
export type EditorAvailability =
  | "available"
  | "limited"
  | "unavailable"
  | "unknown";

export interface PostProductionEditor {
  id: number;
  name: string;
  role: string;
  category: EditorCategory;
  specialty?: string;
  email?: string;
  avatarUrl?: string;
  activeShoots?: number;
  availability: EditorAvailability;
  agreementType?: string;
  agreementVersion?: string;
  compensation?: string | number | null;
  assignmentStatus?: string;
}

export type RawPostProductionMember = Record<string, unknown>;

export const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const readText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = readText(value);
    if (text) return text;
  }
  return "";
};

const firstNumeric = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return undefined;
};

const isTrue = (value: unknown): boolean =>
  value === true || value === 1 || value === "1" || value === "true";

const isFalse = (value: unknown): boolean =>
  value === false || value === 0 || value === "0" || value === "false";

const classifyEditor = (
  item: RawPostProductionMember,
  profile: RawPostProductionMember,
  role: string,
): EditorCategory => {
  const external =
    item.is_external ??
    profile.is_external ??
    item.external ??
    profile.external;
  if (external !== null && external !== undefined) {
    if (isTrue(external)) return "external";
    if (isFalse(external)) return "internal";
  }
  const label = [
    item.editor_type,
    item.user_type,
    item.member_type,
    item.role_name,
    profile.editor_type,
    profile.user_type,
    profile.member_type,
    profile.role_name,
    role,
  ]
    .map(readText)
    .join(" ")
    .toLowerCase();
  if (/\bexternal\b|freelance|contractor/.test(label)) return "external";
  if (/\binternal\b|in.house|employee/.test(label)) return "internal";
  return "unknown";
};

const resolveAvailability = (
  raw: RawPostProductionMember,
  profile: RawPostProductionMember,
): EditorAvailability => {
  const label = firstText(
    raw.availability_status,
    raw.availability,
    profile.availability_status,
    profile.availability,
  ).toLowerCase();
  if (label.includes("unavailable") || label === "busy") return "unavailable";
  if (label.includes("limited") || label.includes("capacity")) return "limited";
  if (label.includes("available")) return "available";
  return "unknown";
};

export const normalizeEditor = (
  value: unknown,
  assigned = false,
): PostProductionEditor | null => {
  const raw = asObject(value);
  if (!raw) return null;
  const profile =
    asObject(raw.post_production_member) ||
    asObject(raw.user) ||
    asObject(raw.member) ||
    raw;
  const id = Number(
    assigned
      ? (raw.post_production_member_id ?? raw.member_id ?? profile.id ?? raw.id)
      : (raw.id ?? raw.post_production_member_id ?? profile.id),
  );
  if (!Number.isInteger(id) || id <= 0) return null;

  const name =
    firstText(
      profile.name,
      profile.full_name,
      raw.name,
      raw.full_name,
      [readText(profile.first_name), readText(profile.last_name)]
        .filter(Boolean)
        .join(" "),
      [readText(raw.first_name), readText(raw.last_name)]
        .filter(Boolean)
        .join(" "),
    ) || `Editor #${id}`;
  const role = firstText(
    profile.role_name,
    profile.role,
    raw.role_name,
    raw.role,
    "Post Production",
  )
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
  const specialty = firstText(
    profile.specialty,
    profile.skills,
    profile.designation,
    raw.specialty,
    raw.designation,
  );
  const avatarUrl = firstText(
    profile.avatar_url,
    profile.avatar,
    profile.profile_image,
    profile.profile_picture,
    profile.image_url,
    profile.photo_url,
    raw.avatar_url,
    raw.avatar,
    raw.image_url,
  );
  const category = classifyEditor(raw, profile, role);
  const activeShoots = firstNumeric(
    raw.active_shoots,
    raw.active_shoots_count,
    raw.activeShoots,
    profile.active_shoots,
    profile.active_shoots_count,
    profile.activeShoots,
  );

  const compensation = raw.compensation ?? raw.total_compensation;

  return {
    id,
    name,
    role,
    specialty: specialty || undefined,
    email: firstText(profile.email, raw.email) || undefined,
    avatarUrl: avatarUrl || undefined,
    category,
    activeShoots,
    availability: resolveAvailability(raw, profile),
    agreementType:
      firstText(raw.agreement_type, profile.agreement_type) || undefined,
    agreementVersion:
      firstText(
        raw.agreement_version,
        raw.version,
        profile.agreement_version,
      ) || undefined,
    compensation:
      typeof compensation === "string" || typeof compensation === "number"
        ? compensation
        : undefined,
    assignmentStatus:
      firstText(raw.assignment_status, raw.status) ||
      (assigned ? "Assigned" : undefined),
  };
};

export const normalizeAssignedEditors = (
  value: unknown,
): PostProductionEditor[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<number>();
  return value.reduce<PostProductionEditor[]>((result, item) => {
    const raw = asObject(item);
    if (
      raw &&
      ((raw.is_active !== undefined && isFalse(raw.is_active)) ||
        readText(raw.status).toLowerCase() === "removed")
    )
      return result;
    const editor = normalizeEditor(item, true);
    if (editor && !ids.has(editor.id)) {
      ids.add(editor.id);
      result.push(editor);
    }
    return result;
  }, []);
};

export const normalizeEditorOptions = (
  value: unknown,
): PostProductionEditor[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<number>();
  return value.reduce<PostProductionEditor[]>((result, item) => {
    const raw = asObject(item);
    if (!raw) return result;
    if (
      isFalse(raw.is_active) ||
      isFalse(raw.active) ||
      readText(raw.status).toLowerCase() === "inactive"
    )
      return result;
    const editor = normalizeEditor(item);
    if (!editor) return result;
    const role = [readText(raw.role_name), readText(raw.role), editor.role]
      .join(" ")
      .toLowerCase()
      .replace(/[_-]/g, " ");
    if (
      /\b(client|customer|creative partner|crew member|sales|salesperson|affiliate)\b/.test(
        role,
      )
    )
      return result;
    if (/\bproducer\b/.test(role) && !/\beditor\b/.test(role)) return result;
    if (!ids.has(editor.id)) {
      ids.add(editor.id);
      result.push(editor);
    }
    return result;
  }, []);
};

export const getApiError = (response: unknown, fallback: string): string => {
  const object = asObject(response);
  return firstText(object?.error, object?.message) || fallback;
};

export const isApiSuccess = (response: unknown): boolean => {
  const obj = asObject(response);
  return Boolean(
    obj &&
    (obj.success === true || (obj.error === false && obj.success !== false)),
  );
};

export const getNotificationStatus = (response: unknown): boolean | null => {
  const raw = asObject(response);
  const details = asObject(raw?.data);
  const value =
    details?.notification_sent ??
    details?.email_notification_sent ??
    raw?.notification_sent ??
    raw?.email_notification_sent;
  if (value === undefined || value === null) return null;
  return isTrue(value);
};
