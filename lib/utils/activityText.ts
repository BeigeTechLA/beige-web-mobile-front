const ACTIVITY_ROLE_LABELS: Record<string, string> = {
  "1": "Videography",
  "2": "Photography",
  "9": "Videography",
  "10": "Photography",
};

const getRoleLabels = (value: string) => {
  const roleIds = value.match(/\d+/g) || [];
  const labels = roleIds
    .map((roleId) => ACTIVITY_ROLE_LABELS[roleId])
    .filter(Boolean);

  if (!labels.length || labels.length !== roleIds.length) {
    return null;
  }

  return Array.from(new Set(labels)).join(", ");
};

export const formatActivityDescription = (value: unknown) => {
  if (value == null) {
    return "No description provided";
  }

  return String(value)
    .replace(/\((\s*\[\s*(?:"\d+"|\d+)(?:\s*,\s*(?:"\d+"|\d+))*\s*\]\s*)\)/g, (_match, roles) => {
      const label = getRoleLabels(roles);
      return label ? `(${label})` : _match;
    })
    .replace(/\((\s*(?:"\d+"|\d+)(?:\s*,\s*(?:"\d+"|\d+))*\s*)\)/g, (_match, roles) => {
      const label = getRoleLabels(roles);
      return label ? `(${label})` : _match;
    })
    .replace(/\[\s*(?:"\d+"|\d+)(?:\s*,\s*(?:"\d+"|\d+))*\s*\]/g, (match) => {
      return getRoleLabels(match) || match;
    });
};
