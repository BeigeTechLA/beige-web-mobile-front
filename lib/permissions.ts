"use client";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionActionsMap = Record<PermissionAction, boolean>;
export type PermissionsMap = Record<string, Partial<PermissionActionsMap>>;

type AdminRouteRule = {
  prefix: string;
  permissionKeys?: string[];
};

const MODULE_ALIASES: Record<string, string[]> = {
  availability: ["availability"],
  dashboard: ["dashboard"],
  file_manager: ["file_manager", "file-manager"],
  file_manager_view: ["file_manager", "file-manager"],
  finances: ["finances", "payouts"],
  invoices: ["invoices"],
  meetings: ["meetings"],
  messages: ["messages"],
  profile: ["profile", "users"],
  quotes: ["quotes", "sales"],
  request_shoots: ["request_shoots", "request-shoots", "shoots"],
  roles_permissions: ["roles_permissions", "roles-permissions", "settings"],
  sales: ["sales", "quotes"],
  sales_representative: ["sales_representative", "sales-representative"],
  settings: ["settings", "roles_permissions", "roles-permissions"],
  shoots: ["shoots", "request_shoots", "request-shoots"],
  users: ["users", "profile"],
};

const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/admin/shoots", permissionKeys: ["request_shoots"] },
  { prefix: "/admin/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/admin/meetings", permissionKeys: ["meetings"] },
  { prefix: "/admin/messages", permissionKeys: ["messages"] },
  { prefix: "/admin/availability", permissionKeys: ["availability"] },
  { prefix: "/admin/sales-representative", permissionKeys: ["sales_representative"] },
  { prefix: "/admin/invoice", permissionKeys: ["invoices"] },
  { prefix: "/admin/roles-permissions", permissionKeys: ["settings"] },
  { prefix: "/admin/finances", permissionKeys: ["finances", "payouts"] },
  { prefix: "/admin/users", permissionKeys: ["profile"] },
  { prefix: "/admin/quotes", permissionKeys: ["sales"] },
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

export const canAccessAdminPath = (
  pathname: string,
  permissions: PermissionsMap | null | undefined,
) => {
  if (!pathname.startsWith("/admin")) return true;

  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return hasAnyPermission(permissions);
  }

  const matchedRule = ADMIN_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasModulePermission(permissions, matchedRule.permissionKeys, "view");
};
