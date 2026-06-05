"use client";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionActionsMap = Record<PermissionAction, boolean>;
export type PermissionsMap = Record<string, Partial<PermissionActionsMap>>;

type AdminRouteRule = {
  prefix: string;
  permissionKeys?: string[];
};

type PortalKey = "admin" | "affiliate" | "sales" | "production-manager";

const MODULE_ALIASES: Record<string, string[]> = {
  file_manager: ["file_manager", "file-manager"],
  file_manager_view: ["file_manager", "file-manager"],
  request_shoots: ["request_shoots", "request-shoots"],
  roles_permissions: ["roles_permissions", "roles-permissions"],
  sales_representative: ["sales_representative", "sales-representative"],
};

const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/admin/dashboard", permissionKeys: ["admin_dashboard", "dashboard"] },
  { prefix: "/admin/shoots", permissionKeys: ["admin_shoots", "shoots"] },
  { prefix: "/admin/file-manager", permissionKeys: ["admin_file_manager", "file_manager"] },
  { prefix: "/admin/meetings", permissionKeys: ["admin_meetings", "meetings"] },
  { prefix: "/admin/messages", permissionKeys: ["admin_messages", "messages"] },
  { prefix: "/admin/availability", permissionKeys: ["admin_availability", "availability"] },
  { prefix: "/admin/sales-representative", permissionKeys: ["admin_sales_representative", "sales_representative"] },
  { prefix: "/admin/invoice", permissionKeys: ["admin_invoices", "invoices"] },
  { prefix: "/admin/finances", permissionKeys: ["admin_finances", "finances", "payouts"] },
  { prefix: "/admin/roles-permissions" },
  { prefix: "/admin/users", permissionKeys: ["admin_users", "users"] },
  { prefix: "/admin/quotes", permissionKeys: ["admin_quotes", "quotes"] },
];

const AFFILIATE_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/affiliate/dashboard", permissionKeys: ["client_dashboard", "dashboard"] },
  { prefix: "/affiliate/overview", permissionKeys: ["client_affiliate_overview", "users"] },
  { prefix: "/affiliate/file-manager", permissionKeys: ["client_file_manager", "file_manager"] },
  { prefix: "/affiliate/find-yourself", permissionKeys: ["client_find_yourself", "shoots"] },
  { prefix: "/affiliate/meetings", permissionKeys: ["client_meetings", "meetings"] },
  { prefix: "/affiliate/messages", permissionKeys: ["client_messages", "messages"] },
  { prefix: "/affiliate/shoots", permissionKeys: ["client_shoots", "shoots"] },
  { prefix: "/affiliate/quotes", permissionKeys: ["client_quotes", "quotes"] },
  { prefix: "/affiliate/finances", permissionKeys: ["client_finances", "invoices"] },
  { prefix: "/affiliate/profile", permissionKeys: ["client_profile", "profile", "settings"] },
];

const SALES_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/sales/dashboard", permissionKeys: ["sales_admin_dashboard", "sales_rep_sales", "dashboard"] },
  { prefix: "/sales/sales-people", permissionKeys: ["sales_admin_sales_people", "users"] },
  { prefix: "/sales/availability", permissionKeys: ["sales_rep_availability", "availability"] },
  { prefix: "/sales/shoots", permissionKeys: ["sales_rep_shoots", "sales_admin_shoots", "shoots"] },
  { prefix: "/sales/file-manager", permissionKeys: ["sales_rep_file_manager", "sales_admin_file_manager", "file_manager"] },
  { prefix: "/sales/meetings", permissionKeys: ["sales_rep_meetings", "sales_admin_meetings", "meetings"] },
  { prefix: "/sales/messages", permissionKeys: ["sales_rep_messages", "sales_admin_messages", "messages"] },
  { prefix: "/sales/quotes", permissionKeys: ["sales_rep_quotes", "sales_admin_quotes", "quotes"] },
  { prefix: "/sales/invoice", permissionKeys: ["sales_admin_invoices", "invoices"] },
];

const PRODUCTION_MANAGER_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/production-manager/dashboard", permissionKeys: ["production_manager_dashboard", "dashboard"] },
  { prefix: "/production-manager/creative-partners", permissionKeys: ["production_manager_creative_partner", "users"] },
  { prefix: "/production-manager/shoots", permissionKeys: ["production_manager_shoots", "shoots"] },
  { prefix: "/production-manager/file-manager", permissionKeys: ["production_manager_file_manager", "file_manager"] },
  { prefix: "/production-manager/meetings", permissionKeys: ["production_manager_meetings", "meetings"] },
  { prefix: "/production-manager/messages", permissionKeys: ["production_manager_messages", "messages"] },
  { prefix: "/production-manager/availability", permissionKeys: ["production_manager_availability", "availability"] },
];

const DASHBOARD_FALLBACK_PATHS = [
  "/admin/dashboard",
  "/admin/shoots",
  "/admin/file-manager",
  "/admin/meetings",
  "/admin/messages",
  "/admin/availability",
  "/admin/sales-representative",
  "/admin/invoice",
  "/admin/roles-permissions",
  "/admin/finances/transactions",
  "/admin/users/all",
  "/admin/quotes",
];

const PORTAL_ROUTE_RULES: Record<PortalKey, AdminRouteRule[]> = {
  admin: ADMIN_ROUTE_RULES,
  affiliate: AFFILIATE_ROUTE_RULES,
  sales: SALES_ROUTE_RULES,
  "production-manager": PRODUCTION_MANAGER_ROUTE_RULES,
};

const PORTAL_FALLBACK_PATHS: Record<PortalKey, string[]> = {
  admin: DASHBOARD_FALLBACK_PATHS,
  affiliate: [
    "/affiliate/dashboard",
    "/affiliate/overview",
    "/affiliate/file-manager",
    "/affiliate/find-yourself",
    "/affiliate/meetings",
    "/affiliate/messages",
    "/affiliate/shoots",
    "/affiliate/quotes",
    "/affiliate/finances",
    "/affiliate/profile",
  ],
  sales: [
    "/sales/dashboard",
    "/sales/availability",
    "/sales/shoots",
    "/sales/file-manager",
    "/sales/meetings",
    "/sales/messages",
    "/sales/quotes",
    "/sales/invoice",
  ],
  "production-manager": [
    "/production-manager/dashboard",
    "/production-manager/creative-partners",
    "/production-manager/shoots",
    "/production-manager/file-manager",
    "/production-manager/meetings",
    "/production-manager/messages",
    "/production-manager/availability",
  ],
};

const getPortalForPathname = (pathname: string): PortalKey | null => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/affiliate")) return "affiliate";
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/production-manager")) return "production-manager";
  return null;
};

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

export const expandPermissionKeys = (moduleKeys: string[] = []) => {
  const expanded = new Set<string>();

  moduleKeys.forEach((moduleKey) => {
    const normalized = normalizeKey(moduleKey);
    expanded.add(normalized);

    const aliases = MODULE_ALIASES[normalized] || [];
    aliases.forEach((alias) => expanded.add(normalizeKey(alias)));

    Object.entries(MODULE_ALIASES).forEach(([canonicalKey, aliasList]) => {
      if (canonicalKey === normalized || aliasList.some((alias) => normalizeKey(alias) === normalized)) {
        expanded.add(normalizeKey(canonicalKey));
        aliasList.forEach((alias) => expanded.add(normalizeKey(alias)));
      }
    });
  });

  return Array.from(expanded);
};

export const normalizePermissionsPayload = (
  value: unknown,
): PermissionsMap => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source =
    "permissions" in value &&
    value.permissions &&
    typeof value.permissions === "object" &&
    !Array.isArray(value.permissions)
      ? value.permissions
      : value;

  const normalizedPermissions: PermissionsMap = {};

  Object.entries(source as Record<string, unknown>).forEach(([moduleKey, actionsValue]) => {
    const normalizedModuleKey = normalizeKey(moduleKey);

    if (Array.isArray(actionsValue)) {
      normalizedPermissions[normalizedModuleKey] = {
        view: actionsValue.includes("view"),
        create: actionsValue.includes("create"),
        edit: actionsValue.includes("edit"),
        delete: actionsValue.includes("delete"),
      };
      return;
    }

    if (!actionsValue || typeof actionsValue !== "object") {
      return;
    }

    normalizedPermissions[normalizedModuleKey] = {
      view: Boolean((actionsValue as Record<string, unknown>).view),
      create: Boolean((actionsValue as Record<string, unknown>).create),
      edit: Boolean((actionsValue as Record<string, unknown>).edit),
      delete: Boolean((actionsValue as Record<string, unknown>).delete),
    };
  });

  return normalizedPermissions;
};

export const hasModulePermission = (
  permissions: PermissionsMap | null | undefined,
  moduleKeys: string[] = [],
  action: PermissionAction = "view",
) => {
  if (!permissions || !moduleKeys.length) return false;

  const expandedKeys = expandPermissionKeys(moduleKeys);

  return expandedKeys.some((key) => Boolean(permissions[key]?.[action]));
};

export const hasAnyPermission = (permissions: PermissionsMap | null | undefined) => {
  if (!permissions) return false;

  return Object.values(permissions).some((modulePermissions) =>
    Object.values(modulePermissions || {}).some(Boolean),
  );
};

export const getFirstAllowedAdminPath = (permissions: PermissionsMap | null | undefined) => {
  if (!permissions) return null;

  if (hasAnyPermission(permissions)) {
    for (const path of DASHBOARD_FALLBACK_PATHS) {
      if (canAccessAdminPath(path, permissions)) {
        return path;
      }
    }
  }

  return null;
};

export const getFirstAllowedPortalPath = (
  portal: PortalKey,
  permissions: PermissionsMap | null | undefined,
) => {
  if (!permissions) return null;

  if (hasAnyPermission(permissions)) {
    for (const path of PORTAL_FALLBACK_PATHS[portal]) {
      if (canAccessPortalPath(path, permissions)) {
        return path;
      }
    }
  }

  return null;
};

export const canAccessAdminPath = (
  pathname: string,
  permissions: PermissionsMap | null | undefined,
) => {
  return canAccessPortalPath(pathname, permissions);
};

export const canAccessPortalPath = (
  pathname: string,
  permissions: PermissionsMap | null | undefined,
) => {
  const portal = getPortalForPathname(pathname);
  if (!portal) return true;

  if (
    pathname === `/${portal}`
  ) {
    return hasAnyPermission(permissions);
  }

  const matchedRule = PORTAL_ROUTE_RULES[portal].find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasModulePermission(permissions, matchedRule.permissionKeys, "view");
};
