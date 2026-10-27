export type CPRequirements = {
  photographer: number;
  videographer: number;
  hybrid: number;
  cinematographer: number;
};

export function getCPRequirements(value: unknown): CPRequirements | null {
  let roles = value;
  if (typeof roles === "string") {
    try { roles = JSON.parse(roles); } catch { return null; }
  }
  if (!roles || typeof roles !== "object" || Array.isArray(roles)) return null;
  const record = roles as Record<string, unknown>;
  const keys = ["photographer", "videographer", "hybrid", "cinematographer"] as const;
  if (!keys.some((key) => record[key] != null)) return null;
  const counts = Object.fromEntries(keys.map((key) => {
    const count = Number(record[key] ?? 0);
    return [key, Number.isInteger(count) && count > 0 ? count : 0];
  })) as CPRequirements;
  return Object.values(counts).some(Boolean) ? counts : null;
}

export function getRequiredCPCount(crewRoles: unknown, crewSizeNeeded?: unknown): number {
  const roles = getCPRequirements(crewRoles);
  if (roles) return Object.values(roles).reduce((sum, count) => sum + count, 0);
  const total = Number(crewSizeNeeded);
  return Number.isInteger(total) && total > 0 ? total : 0;
}

export function getCPCompensationReference(shootAmount: number, requiredCount: number) {
  const budget = Number((Math.max(0, shootAmount) * 0.25).toFixed(2));
  return {
    budget,
    perCreator: Number.isInteger(requiredCount) && requiredCount > 0
      ? Number((budget / requiredCount).toFixed(2)) : 0,
  };
}
