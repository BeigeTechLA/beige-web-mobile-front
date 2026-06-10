type UserLike = {
  user_type_id?: number;
  userTypeId?: number;
} | null;

type PermissionsLike = Record<string, Record<string, boolean>> | null | undefined;

type PortalKey = "admin" | "sales" | "production-manager" | "affiliate" | "creator";

type PortalRouteRule = {
  path: string;
  permissionKeys: string[];
};

type PermissionActions = {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
};

type PermissionsLikeMap = Record<string, PermissionActions> | null | undefined;

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

const normalizePermissionKey = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

const hasPermissionAction = (
  permissions: PermissionsLikeMap,
  moduleKeys: string[] = [],
  action: keyof PermissionActions = "view",
) => {
  if (!permissions) return false;

  const normalizedKeys = moduleKeys.map(normalizePermissionKey);

  return Object.entries(permissions).some(([moduleKey, actions]) => {
    if (!normalizedKeys.includes(normalizePermissionKey(moduleKey))) {
      return false;
    }

    return Boolean(actions?.[action]);
  });
};

const PORTAL_PRIORITY: Array<{
  portal: PortalKey;
  permissionKeys: string[];
}> = [
  { portal: "admin", permissionKeys: ["admin_dashboard", "dashboard"] },
  { portal: "sales", permissionKeys: ["sales_admin_dashboard", "sales_rep_sales", "dashboard"] },
  { portal: "production-manager", permissionKeys: ["production_manager_dashboard", "dashboard"] },
  { portal: "affiliate", permissionKeys: ["client_dashboard", "dashboard"] },
  { portal: "creator", permissionKeys: ["creator_dashboard", "dashboard"] },
];

const PORTAL_ROUTE_RULES: Record<PortalKey, PortalRouteRule[]> = {
  admin: [
    { path: "/admin/dashboard", permissionKeys: ["admin_dashboard", "dashboard"] },
    { path: "/admin/shoots", permissionKeys: ["admin_shoots", "shoots"] },
    { path: "/admin/file-manager", permissionKeys: ["admin_file_manager", "file_manager"] },
    { path: "/admin/meetings", permissionKeys: ["admin_meetings", "meetings"] },
    { path: "/admin/messages", permissionKeys: ["admin_messages", "messages"] },
    { path: "/admin/availability", permissionKeys: ["admin_availability", "availability"] },
    { path: "/admin/sales-representative", permissionKeys: ["admin_sales_representative", "sales_representative"] },
    { path: "/admin/invoice", permissionKeys: ["admin_invoices", "invoices"] },
    { path: "/admin/finances", permissionKeys: ["admin_finances", "finances", "payouts"] },
    { path: "/admin/users/all", permissionKeys: ["admin_users", "users"] },
    { path: "/admin/quotes", permissionKeys: ["admin_quotes", "quotes"] },
  ],
  sales: [
    { path: "/sales/dashboard", permissionKeys: ["sales_admin_dashboard", "sales_rep_sales", "dashboard"] },
    { path: "/sales/availability", permissionKeys: ["sales_rep_availability", "availability"] },
    { path: "/sales/shoots", permissionKeys: ["sales_rep_shoots", "sales_admin_shoots", "shoots"] },
    { path: "/sales/file-manager", permissionKeys: ["sales_rep_file_manager", "sales_admin_file_manager", "file_manager"] },
    { path: "/sales/meetings", permissionKeys: ["sales_rep_meetings", "sales_admin_meetings", "meetings"] },
    { path: "/sales/messages", permissionKeys: ["sales_rep_messages", "sales_admin_messages", "messages"] },
    { path: "/sales/quotes", permissionKeys: ["sales_rep_quotes", "sales_admin_quotes", "quotes"] },
    { path: "/sales/invoice", permissionKeys: ["sales_admin_invoices", "invoices"] },
  ],
  "production-manager": [
    { path: "/production-manager/dashboard", permissionKeys: ["production_manager_dashboard", "dashboard"] },
    { path: "/production-manager/creative-partners", permissionKeys: ["production_manager_creative_partner", "users"] },
    { path: "/production-manager/shoots", permissionKeys: ["production_manager_shoots", "shoots"] },
    { path: "/production-manager/file-manager", permissionKeys: ["production_manager_file_manager", "file_manager"] },
    { path: "/production-manager/meetings", permissionKeys: ["production_manager_meetings", "meetings"] },
    { path: "/production-manager/messages", permissionKeys: ["production_manager_messages", "messages"] },
    { path: "/production-manager/availability", permissionKeys: ["production_manager_availability", "availability"] },
  ],
  affiliate: [
    { path: "/affiliate/dashboard", permissionKeys: ["client_dashboard", "dashboard"] },
    { path: "/affiliate/overview", permissionKeys: ["client_affiliate_overview", "users"] },
    { path: "/affiliate/file-manager", permissionKeys: ["client_file_manager", "file_manager"] },
    { path: "/affiliate/find-yourself", permissionKeys: ["client_find_yourself", "shoots"] },
    { path: "/affiliate/meetings", permissionKeys: ["client_meetings", "meetings"] },
    { path: "/affiliate/messages", permissionKeys: ["client_messages", "messages"] },
    { path: "/affiliate/shoots", permissionKeys: ["client_shoots", "shoots"] },
    { path: "/affiliate/quotes", permissionKeys: ["client_quotes", "quotes"] },
    { path: "/affiliate/finances", permissionKeys: ["client_finances", "invoices"] },
    { path: "/affiliate/profile", permissionKeys: ["client_profile", "profile", "settings"] },
  ],
  creator: [
    { path: "/creator/dashboard", permissionKeys: ["creator_dashboard", "dashboard"] },
  ],
};

const DASHBOARD_FALLBACK_ROUTES = [
  { path: "/admin/dashboard", permissionKeys: ["admin_dashboard", "dashboard"] },
  { path: "/admin/shoots", permissionKeys: ["admin_shoots", "shoots"] },
  { path: "/admin/file-manager", permissionKeys: ["admin_file_manager", "file_manager"] },
  { path: "/admin/meetings", permissionKeys: ["admin_meetings", "meetings"] },
  { path: "/admin/messages", permissionKeys: ["admin_messages", "messages"] },
  { path: "/admin/availability", permissionKeys: ["admin_availability", "availability"] },
  { path: "/admin/sales-representative", permissionKeys: ["admin_sales_representative", "sales_representative"] },
  { path: "/admin/invoice", permissionKeys: ["admin_invoices", "invoices"] },
  { path: "/admin/finances", permissionKeys: ["admin_finances", "finances", "payouts"] },
  { path: "/admin/users/all", permissionKeys: ["admin_users", "users"] },
  { path: "/admin/quotes", permissionKeys: ["admin_quotes", "quotes"] },
  { path: "/sales/dashboard", permissionKeys: ["sales_admin_dashboard", "sales_rep_sales", "dashboard"] },
  { path: "/sales/availability", permissionKeys: ["sales_rep_availability", "availability"] },
  { path: "/sales/shoots", permissionKeys: ["sales_rep_shoots", "sales_admin_shoots", "shoots"] },
  { path: "/sales/file-manager", permissionKeys: ["sales_rep_file_manager", "sales_admin_file_manager", "file_manager"] },
  { path: "/sales/meetings", permissionKeys: ["sales_rep_meetings", "sales_admin_meetings", "meetings"] },
  { path: "/sales/messages", permissionKeys: ["sales_rep_messages", "sales_admin_messages", "messages"] },
  { path: "/sales/quotes", permissionKeys: ["sales_rep_quotes", "sales_admin_quotes", "quotes"] },
  { path: "/sales/invoice", permissionKeys: ["sales_admin_invoices", "invoices"] },
  { path: "/production-manager/dashboard", permissionKeys: ["production_manager_dashboard", "dashboard"] },
  { path: "/production-manager/creative-partners", permissionKeys: ["production_manager_creative_partner", "users"] },
  { path: "/production-manager/shoots", permissionKeys: ["production_manager_shoots", "shoots"] },
  { path: "/production-manager/file-manager", permissionKeys: ["production_manager_file_manager", "file_manager"] },
  { path: "/production-manager/meetings", permissionKeys: ["production_manager_meetings", "meetings"] },
  { path: "/production-manager/messages", permissionKeys: ["production_manager_messages", "messages"] },
  { path: "/production-manager/availability", permissionKeys: ["production_manager_availability", "availability"] },
  { path: "/affiliate/dashboard", permissionKeys: ["client_dashboard", "dashboard"] },
  { path: "/affiliate/overview", permissionKeys: ["client_affiliate_overview", "users"] },
  { path: "/affiliate/file-manager", permissionKeys: ["client_file_manager", "file_manager"] },
  { path: "/affiliate/find-yourself", permissionKeys: ["client_find_yourself", "shoots"] },
  { path: "/affiliate/meetings", permissionKeys: ["client_meetings", "meetings"] },
  { path: "/affiliate/messages", permissionKeys: ["client_messages", "messages"] },
  { path: "/affiliate/shoots", permissionKeys: ["client_shoots", "shoots"] },
  { path: "/affiliate/quotes", permissionKeys: ["client_quotes", "quotes"] },
  { path: "/affiliate/finances", permissionKeys: ["client_finances", "invoices"] },
  { path: "/affiliate/profile", permissionKeys: ["client_profile", "profile", "settings"] },
];

export const PROTECTED_PREFIXES = Object.values(ROLE_ROUTE_PREFIXES);

export function getUserTypeId(user: UserLike) {
  if (!user) {
    return null;
  }

  return user.user_type_id ?? user.userTypeId ?? null;
}

export function getPortalFromPermissions(permissions?: PermissionsLikeMap) {
  if (!permissions) {
    return null;
  }

  return PORTAL_PRIORITY.find((route) => hasPermissionAction(permissions, route.permissionKeys, "view"))?.portal ?? null;
}

export function getPortalFromPermissionsOrRoutes(permissions?: PermissionsLikeMap) {
  if (!permissions) {
    return null;
  }

  const portal = getPortalFromPermissions(permissions);
  if (portal) {
    return portal;
  }

  for (const candidate of PORTAL_PRIORITY.map((item) => item.portal)) {
    const firstAllowedPath = PORTAL_ROUTE_RULES[candidate].find((route) =>
      hasPermissionAction(permissions, route.permissionKeys, "view"),
    )?.path;
    if (firstAllowedPath) {
      return candidate;
    }
  }

  return null;
}

export function getPortalsFromPermissionsOrRoutes(permissions?: PermissionsLikeMap) {
  if (!permissions) {
    return [];
  }

  const portals = new Set<PortalKey>();

  for (const candidate of PORTAL_PRIORITY.map((item) => item.portal)) {
    const firstAllowedPath = PORTAL_ROUTE_RULES[candidate].find((route) =>
      hasPermissionAction(permissions, route.permissionKeys, "view"),
    )?.path;

    if (firstAllowedPath) {
      portals.add(candidate);
    }
  }

  return Array.from(portals);
}

export function getBestAllowedPathForPermissions(permissions?: PermissionsLikeMap) {
  if (!permissions) {
    return null;
  }

  const portal = getPortalFromPermissionsOrRoutes(permissions);
  if (portal) {
    return PORTAL_ROUTE_RULES[portal].find((route) =>
      hasPermissionAction(permissions, route.permissionKeys, "view"),
    )?.path ?? null;
  }

  return DASHBOARD_FALLBACK_ROUTES.find((route) =>
    hasPermissionAction(permissions, route.permissionKeys, "view"),
  )?.path ?? null;
}

export function getDashboardPathForUser(user: UserLike, permissions?: PermissionsLikeMap) {
  const permissionPath = getBestAllowedPathForPermissions(permissions);
  if (permissionPath) {
    return permissionPath;
  }

  const userTypeId = getUserTypeId(user);
  if (!userTypeId) {
    return "/";
  }

  return ROLE_DASHBOARD_ROUTES[userTypeId] ?? "/";
}

export function getAllowedPrefixForUser(user: UserLike, permissions?: PermissionsLikeMap) {
  const bestPath = getBestAllowedPathForPermissions(permissions);
  if (bestPath) {
    if (bestPath.startsWith("/admin")) return "/admin";
    if (bestPath.startsWith("/sales")) return "/sales";
    if (bestPath.startsWith("/production-manager")) return "/production-manager";
    if (bestPath.startsWith("/affiliate")) return "/affiliate";
    if (bestPath.startsWith("/creator")) return "/creator";
  }

  const userTypeId = getUserTypeId(user);

  if (!userTypeId) {
    return null;
  }

  return ROLE_ROUTE_PREFIXES[userTypeId] ?? null;
}

export function getAllowedPrefixesFromPermissions(permissions?: PermissionsLikeMap) {
  if (!permissions) {
    return [];
  }

  const prefixes = new Set<string>();

  for (const portal of Object.keys(PORTAL_ROUTE_RULES) as PortalKey[]) {
    const hasAccess = PORTAL_ROUTE_RULES[portal].some((route) =>
      hasPermissionAction(permissions, route.permissionKeys, "view"),
    );

    if (hasAccess) {
      prefixes.add(`/${portal}`);
    }
  }

  return Array.from(prefixes);
}

export function canAccessPathForPermissions(
  pathname: string,
  permissions?: PermissionsLikeMap,
) {
  const portal = getPortalFromPermissionsOrRoutes(permissions);
  if (!portal) {
    return true;
  }

  if (pathname === `/${portal}`) {
    return true;
  }

  const matchedRule = PORTAL_ROUTE_RULES[portal].find((rule) => pathname.startsWith(rule.path));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasPermissionAction(permissions, matchedRule.permissionKeys, "view");
}
