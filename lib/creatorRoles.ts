export const CREATOR_ROLE_OPTIONS = [
  { value: "1", label: "Videographer" },
  { value: "2", label: "Photographer" },
  { value: "3", label: "Editor" },
];

export const CREATOR_ROLE_LABELS = CREATOR_ROLE_OPTIONS.reduce<Record<string, string>>(
  (acc, role) => {
    acc[role.value] = role.label;
    return acc;
  },
  {}
);

const parseJsonUntilStable = (value: unknown): unknown => {
  let current = value;

  for (let i = 0; i < 4; i += 1) {
    if (typeof current !== "string") return current;

    const trimmed = current.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed === current) return parsed;
      current = parsed;
    } catch {
      return current;
    }
  }

  return current;
};

export const normalizeCreatorRoleIds = (roleData: unknown): string[] => {
  const parsed = parseJsonUntilStable(roleData);
  const values = Array.isArray(parsed) ? parsed : [parsed];

  return values
    .flatMap((value) => {
      const normalized = parseJsonUntilStable(value);
      return Array.isArray(normalized) ? normalized : [normalized];
    })
    .flatMap((value) => {
      const text = String(value ?? "").trim();
      const knownRoleIds = text.match(/\b[1-3]\b/g);

      if (knownRoleIds?.length) {
        return knownRoleIds;
      }

      return [text];
    })
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
};

export const formatCreatorRoles = (roleData: unknown, fallback = "Not Specified") => {
  const labels = normalizeCreatorRoleIds(roleData)
    .map((roleId) => CREATOR_ROLE_LABELS[roleId])
    .filter(Boolean);

  return labels.length ? labels.join(", ") : fallback;
};
