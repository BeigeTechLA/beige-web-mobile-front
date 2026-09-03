"use client";

import { ADMIN_PERMISSION_MENU_HIERARCHY } from "@/lib/permissions/menuHierarchy";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionActionsMap = Record<PermissionAction, boolean>;
export type PermissionsMap = Record<string, Partial<PermissionActionsMap>>;

type AdminRouteRule = {
  prefix: string;
  permissionKeys?: string[];
};

type PortalKey = "admin" | "affiliate" | "sales" | "production-manager" | "creator";

const MODULE_ALIASES: Record<string, string[]> = {
  admin_dashboard: ["dashboard", "sales_admin_dashboard", "sales_rep_dashboard", "client_dashboard", "crew_dashboard", "production_manager_dashboard"],
  admin_availability: ["availability"],
  admin_file_manager: ["file_manager", "file-manager"],
  admin_finances: [
    "finances",
    "payouts",
    "admin_finances_transactions",
    "admin_finances_disputes",
    "admin_finances_beige_credit_points",
    "admin_finances_cp_compensation",
  ],
  admin_finances_transactions: ["admin_finances", "finances", "payouts"],
  admin_finances_disputes: ["admin_finances", "finances", "payouts"],
  admin_finances_beige_credit_points: ["admin_finances", "finances", "payouts"],
  admin_finances_cp_compensation: ["admin_finances", "finances", "payouts"],
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
  availability: ["admin_availability", "sales_rep_availability", "production_manager_availability", "crew_availability"],
  dashboard: ["admin_dashboard", "sales_admin_dashboard", "sales_rep_dashboard", "sales_rep_sales", "client_dashboard", "crew_dashboard", "production_manager_dashboard"],
  file_manager: ["admin_file_manager", "sales_admin_file_manager", "sales_rep_file_manager", "client_file_manager", "crew_file_manager", "production_manager_file_manager", "file-manager"],
  file_manager_view: ["admin_file_manager", "sales_admin_file_manager", "sales_rep_file_manager", "file-manager"],
  finances: [
    "admin_finances",
    "payouts",
    "admin_finances_transactions",
    "admin_finances_disputes",
    "admin_finances_beige_credit_points",
    "admin_finances_cp_compensation",
    "client_finances",
    "crew_payouts",
  ],
  invoices: ["admin_invoices", "sales_admin_invoices", "sales_rep_invoices", "client_finances"],
  meetings: ["admin_meetings", "sales_admin_meetings", "sales_rep_meetings", "client_meetings", "crew_meetings", "production_manager_meetings"],
  messages: ["admin_messages", "sales_admin_messages", "sales_rep_messages", "client_messages", "crew_messages", "production_manager_messages"],
  profile: ["profile", "crew_profile", "client_profile"],
  quotes: ["admin_quotes", "sales_admin_quotes", "sales_rep_quotes", "client_quotes"],
  request_shoots: ["request_shoots", "request-shoots", "crew_request_shoots", "client_book_a_shoot"],
  affiliate: ["crew_affiliate", "client_affiliate_overview"],
  roles_permissions: ["roles_permissions", "roles-permissions", "admin_users"],
  sales: ["sales", "sales_rep_sales"],
  sales_representative: ["admin_sales_representative", "sales_admin_sales_people", "sales_representative", "sales-representative", "users"],
  settings: ["settings", "crew_settings", "crew_profile", "client_profile"],
  shoots: ["admin_shoots", "sales_admin_shoots", "sales_rep_shoots", "client_shoots", "client_find_yourself", "production_manager_shoots"],
  users: ["admin_users", "sales_admin_sales_people", "client_affiliate_overview", "production_manager_creative_partner"],
};

const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/admin/shoots", permissionKeys: ["shoots"] },
  { prefix: "/admin/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/admin/meetings", permissionKeys: ["meetings"] },
  { prefix: "/admin/messages", permissionKeys: ["messages"] },
  { prefix: "/admin/availability", permissionKeys: ["availability"] },
  {
    prefix: "/admin/sales-representative/shift-management",
    permissionKeys: [
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_sales_representative.children[1],
    ],
  },
  {
    prefix: "/admin/sales-representative",
    permissionKeys: [
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_sales_representative.children[0],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_sales_representative.children[1],
      "admin_sales_representative",
    ],
  },
  { prefix: "/admin/invoice", permissionKeys: ["invoices"] },
  {
    prefix: "/admin/finances/transactions",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[0]],
  },
  {
    prefix: "/admin/finances/disputes",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[1]],
  },
  {
    prefix: "/admin/finances/creditPoints",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[2]],
  },
  {
    prefix: "/admin/finances/cpCompensation",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[3]],
  },
  {
    prefix: "/admin/finances",
    permissionKeys: [
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[0],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[1],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[2],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_finances.children[3],
      "admin_finances",
    ],
  },
  {
    prefix: "/admin/users/all",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[0]],
  },
  {
    prefix: "/admin/users/clients",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[1]],
  },
  {
    prefix: "/admin/users/creative-partners",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[2]],
  },
  {
    prefix: "/admin/users",
    permissionKeys: [
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[0],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[1],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_users.children[2],
      "admin_users",
    ],
  },
  {
    prefix: "/admin/quotes/change-requests",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_quotes.children[1]],
  },
  {
    prefix: "/admin/quotes/pricing",
    permissionKeys: [ADMIN_PERMISSION_MENU_HIERARCHY.admin_quotes.children[2]],
  },
  {
    prefix: "/admin/quotes",
    permissionKeys: [
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_quotes.children[0],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_quotes.children[1],
      ADMIN_PERMISSION_MENU_HIERARCHY.admin_quotes.children[2],
      "admin_quotes",
    ],
  },
  { prefix: "/admin/roles-permissions", permissionKeys: ["roles_permissions"] },
  { prefix: "/admin/settings", permissionKeys: ["finances", "payouts"] },
  { prefix: "/admin/finances", permissionKeys: ["finances", "payouts"] },
  { prefix: "/admin/internal-credentials", permissionKeys: ["users"] },
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
  { prefix: "/sales/sales-people", permissionKeys: ["sales_representative"] },
  { prefix: "/sales/sales-representative", permissionKeys: ["sales_representative"] },
  { prefix: "/sales/create-new-deal", permissionKeys: ["sales_representative"] },
  { prefix: "/sales/leads", permissionKeys: ["sales_representative"] },
  { prefix: "/sales/client", permissionKeys: ["sales_representative"] },
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

const CREATOR_ROUTE_RULES: AdminRouteRule[] = [
  { prefix: "/creator/dashboard/request", permissionKeys: ["shoots", "request_shoots"] },
  { prefix: "/creator/dashboard/file-manager", permissionKeys: ["file_manager"] },
  { prefix: "/creator/dashboard/meetings", permissionKeys: ["meetings"] },
  { prefix: "/creator/dashboard/messages", permissionKeys: ["messages"] },
  { prefix: "/creator/dashboard/affiliate", permissionKeys: ["affiliate"] },
  { prefix: "/creator/dashboard/availability", permissionKeys: ["availability"] },
  { prefix: "/creator/dashboard/profile", permissionKeys: ["settings", "profile"] },
  { prefix: "/creator/dashboard", permissionKeys: ["dashboard"] },
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
  "/admin/finances/cpCompensation",
  "/admin/users/all",
  "/admin/quotes",
];

const PORTAL_ROUTE_RULES: Record<PortalKey, AdminRouteRule[]> = {
  admin: ADMIN_ROUTE_RULES,
  affiliate: AFFILIATE_ROUTE_RULES,
  sales: SALES_ROUTE_RULES,
  "production-manager": PRODUCTION_MANAGER_ROUTE_RULES,
  creator: CREATOR_ROUTE_RULES,
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
    "/sales/sales-people",
    "/sales/sales-representative",
    "/sales/create-new-deal",
    "/sales/leads",
    "/sales/client",
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
  creator: [
    "/creator/dashboard",
    "/creator/dashboard/request",
    "/creator/dashboard/file-manager",
    "/creator/dashboard/meetings",
    "/creator/dashboard/messages",
    "/creator/dashboard/affiliate",
    "/creator/dashboard/availability",
    "/creator/dashboard/profile",
  ],
};

const getPortalForPathname = (pathname: string): PortalKey | null => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/affiliate")) return "affiliate";
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/production-manager")) return "production-manager";
  if (pathname.startsWith("/creator/dashboard")) return "creator";
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

  // Bypass route access check for affiliate (client) and creator (creative partner) portals
  if (portal === "affiliate" || portal === "creator") return true;

  if (pathname === `/${portal}` || pathname === `/${portal}/dashboard`) {
    if (portal === "admin" || portal === "sales" || portal === "production-manager") {
      return hasModulePermission(permissions, ["dashboard"], "view");
    }

    return hasAnyPermission(permissions);
  }

  const matchedRule = PORTAL_ROUTE_RULES[portal].find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasModulePermission(permissions, matchedRule.permissionKeys, "view");
};

export const getUserTypeId = (user: { user_type_id?: number; userTypeId?: number } | null | undefined) => {
  if (!user) return null;

  return user.user_type_id ?? user.userTypeId ?? null;
};

export const isSuperAdminUser = (user: { user_type_id?: number; userTypeId?: number } | null | undefined) =>
  getUserTypeId(user) === 8;

export const getSuperAdminPermissions = (): PermissionsMap =>
  Object.fromEntries(
    [
      "dashboard",
      "availability",
      "file_manager",
      "finances",
      "invoices",
      "meetings",
      "messages",
      "quotes",
      "roles_permissions",
      "sales_representative",
      "shoots",
      "users",
      "settings",
      "profile",
      "affiliate",
      "request_shoots",
    ].map((moduleKey) => [
      moduleKey,
      { view: true, create: true, edit: true, delete: true },
    ]),
  ) as PermissionsMap;
