type UserLike = {
  user_type_id?: number;
  userTypeId?: number;
} | null;

export const ROLE_ROUTE_PREFIXES: Record<number, string> = {
  1: "/admin",
  2: "/creator",
  3: "/affiliate",
  4: "/sales",
  5: "/sales",
  7: "/sales",
  6: "/production-manager",
};

export const ROLE_DASHBOARD_ROUTES: Record<number, string> = {
  1: "/admin/dashboard",
  2: "/creator/dashboard",
  3: "/affiliate/dashboard",
  4: "/sales/dashboard",
  5: "/sales/dashboard",
  7: "/sales/dashboard",
  6: "/production-manager/dashboard",
};

export const PROTECTED_PREFIXES = Object.values(ROLE_ROUTE_PREFIXES);

export function getUserTypeId(user: UserLike) {
  if (!user) {
    return null;
  }

  return user.user_type_id ?? user.userTypeId ?? null;
}

export function getDashboardPathForUser(user: UserLike) {
  const userTypeId = getUserTypeId(user);

  if (!userTypeId) {
    return "/";
  }

  return ROLE_DASHBOARD_ROUTES[userTypeId] ?? "/";
}

export function getAllowedPrefixForUser(user: UserLike) {
  const userTypeId = getUserTypeId(user);

  if (!userTypeId) {
    return null;
  }

  return ROLE_ROUTE_PREFIXES[userTypeId] ?? null;
}
