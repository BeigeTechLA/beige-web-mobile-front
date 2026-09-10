type UserLike = {
  user_type_id?: number;
  userTypeId?: number;
  is_internal_member?: boolean | number;
} | null;

export const ROLE_ROUTE_PREFIXES: Record<number, string> = {
  1: "/admin",
  8: "/admin",
  2: "/creator",
  3: "/affiliate",
  4: "/creator",
  5: "/admin",
  6: "/admin",
  7: "/admin",
};

export const ROLE_DASHBOARD_ROUTES: Record<number, string> = {
  1: "/admin/dashboard",
  8: "/admin/dashboard",
  2: "/creator/dashboard",
  3: "/affiliate/dashboard",
  4: "/creator/dashboard",
  5: "/admin/dashboard",
  6: "/admin/dashboard",
  7: "/admin/dashboard",
};

export const PROTECTED_PREFIXES = Array.from(new Set([
  ...Object.values(ROLE_ROUTE_PREFIXES),
  "/sales",
  "/production-manager",
]));

export function getUserTypeId(user: UserLike) {
  if (!user) {
    return null;
  }

  return user.user_type_id ?? user.userTypeId ?? null;
}

export function getDashboardPathForUser(user: UserLike) {
  const userTypeId = getUserTypeId(user);

  if (user?.is_internal_member === true || user?.is_internal_member === 1) {
    return "/admin/dashboard";
  }

  if (!userTypeId) {
    return "/";
  }

  return ROLE_DASHBOARD_ROUTES[userTypeId] ?? "/";
}

export function getAllowedPrefixForUser(user: UserLike) {
  const userTypeId = getUserTypeId(user);

  if (user?.is_internal_member === true || user?.is_internal_member === 1) {
    return "/admin";
  }

  if (!userTypeId) {
    return null;
  }

  return ROLE_ROUTE_PREFIXES[userTypeId] ?? null;
}
