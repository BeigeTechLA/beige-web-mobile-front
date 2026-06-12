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
  admin_dashboard: ["dashboard", "sales_admin_dashboard", "sales_rep_dashboard"],
  admin_availability: ["availability"],
  admin_file_manager: ["file_manager", "file-manager"],
  admin_finances: ["finances", "payouts"],
  admin_invoices: ["invoices"],
  admin_meetings: ["meetings"],
  admin_messages: ["messages"],
  admin_quotes: ["quotes"],
  admin_sales_representative: ["sales_representative", "sales-representative"],
  admin_shoots: ["shoots"],
  admin_users: ["users"],
  sales_admin_dashboard: ["dashboard", "admin_dashboard", "sales_rep_dashboard"],
  sales_admin_file_manager: ["file_manager", "file-manager", "admin_file_manager"],
  sales_admin_invoices: ["invoices", "admin_invoices"],
  sales_admin_meetings: ["meetings", "admin_meetings"],
  sales_admin_messages: ["messages", "admin_messages"],
  sales_admin_quotes: ["quotes", "admin_quotes"],
  sales_admin_sales_people: ["sales_representative", "sales-representative", "users"],
  sales_admin_shoots: ["shoots", "admin_shoots"],
  sales_rep_dashboard: ["dashboard", "admin_dashboard", "sales_admin_dashboard"],
  sales_rep_file_manager: ["file_manager", "file-manager", "admin_file_manager"],
  sales_rep_invoices: ["invoices", "admin_invoices"],
  sales_rep_meetings: ["meetings", "admin_meetings"],
  sales_rep_messages: ["messages", "admin_messages"],
  sales_rep_quotes: ["quotes", "admin_quotes"],
  sales_rep_shoots: ["shoots", "admin_shoots"],
  availability: ["admin_availability"],
  dashboard: ["admin_dashboard"],
  file_manager: ["admin_file_manager", "sales_admin_file_manager", "sales_rep_file_manager", "file-manager"],
  file_manager_view: ["admin_file_manager", "sales_admin_file_manager", "sales_rep_file_manager", "file-manager"],
  finances: ["admin_finances", "payouts"],
  invoices: ["admin_invoices", "sales_admin_invoices", "sales_rep_invoices"],
  meetings: ["admin_meetings", "sales_admin_meetings", "sales_rep_meetings"],
  messages: ["admin_messages", "sales_admin_messages", "sales_rep_messages"],
  profile: ["profile"],
  quotes: ["admin_quotes", "sales_admin_quotes", "sales_rep_quotes"],
  request_shoots: ["request_shoots", "request-shoots"],
  roles_permissions: ["roles_permissions", "roles-permissions"],
  sales: ["sales"],
  sales_representative: ["admin_sales_representative", "sales_admin_sales_people", "sales_representative", "sales-representative", "users"],
  settings: ["settings"],
  shoots: ["admin_shoots", "sales_admin_shoots", "sales_rep_shoots"],
  users: ["admin_users", "sales_admin_sales_people"],
};

const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/admin/shoots", permissionKeys: ["shoots"] },
  { prefix: "/admin/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/admin/meetings", permissionKeys: ["meetings"] },
  { prefix: "/admin/messages", permissionKeys: ["messages"] },
  { prefix: "/admin/availability", permissionKeys: ["availability"] },
  { prefix: "/admin/sales-representative", permissionKeys: ["sales_representative"] },
  { prefix: "/admin/invoice", permissionKeys: ["invoices"] },
  { prefix: "/admin/finances", permissionKeys: ["finances", "payouts"] },
  { prefix: "/admin/users", permissionKeys: ["users"] },
  { prefix: "/admin/quotes", permissionKeys: ["quotes"] },
];

const AFFILIATE_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/affiliate/dashboard", permissionKeys: ["dashboard"] },
  { prefix: "/affiliate/overview", permissionKeys: ["users"] },
  { prefix: "/affiliate/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/affiliate/find-yourself", permissionKeys: ["shoots"] },
  { prefix: "/affiliate/meetings", permissionKeys: ["meetings"] },
  { prefix: "/affiliate/messages", permissionKeys: ["messages"] },
  { prefix: "/affiliate/shoots", permissionKeys: ["shoots"] },
  { prefix: "/affiliate/quotes", permissionKeys: ["quotes"] },
  { prefix: "/affiliate/finances", permissionKeys: ["invoices"] },
  { prefix: "/affiliate/profile", permissionKeys: ["settings"] },
];

const SALES_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/sales/dashboard", permissionKeys: ["dashboard"] },
  { prefix: "/sales/availability", permissionKeys: ["availability"] },
  { prefix: "/sales/shoots", permissionKeys: ["shoots"] },
  { prefix: "/sales/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/sales/meetings", permissionKeys: ["meetings"] },
  { prefix: "/sales/messages", permissionKeys: ["messages"] },
  { prefix: "/sales/quotes", permissionKeys: ["quotes"] },
  { prefix: "/sales/invoice", permissionKeys: ["invoices"] },
];

const PRODUCTION_MANAGER_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/production-manager/dashboard", permissionKeys: ["dashboard"] },
  { prefix: "/production-manager/creative-partners", permissionKeys: ["users"] },
  { prefix: "/production-manager/shoots", permissionKeys: ["shoots"] },
  { prefix: "/production-manager/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/production-manager/meetings", permissionKeys: ["meetings"] },
  { prefix: "/production-manager/messages", permissionKeys: ["messages"] },
  { prefix: "/production-manager/availability", permissionKeys: ["availability"] },
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
    pathname === `/${portal}` ||
    pathname === `/${portal}/dashboard`
  ) {
    return hasAnyPermission(permissions);
  }

  const matchedRule = PORTAL_ROUTE_RULES[portal].find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasModulePermission(permissions, matchedRule.permissionKeys, "view");
};
