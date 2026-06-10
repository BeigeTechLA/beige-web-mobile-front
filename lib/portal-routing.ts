type PortalKey = "admin" | "affiliate" | "sales" | "production-manager";

type AdminRouteRule = {
  prefix: string;
  permissionKeys?: string[];
};

type PermissionActions = {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type PermissionsMap = Record<string, Partial<PermissionActions>>;

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/-/g, "_");

export const hasModulePermission = (
  permissions: PermissionsMap | null | undefined,
  moduleKeys: string[] = [],
  action: keyof PermissionActions = "view",
) => {
  if (!permissions || !moduleKeys.length) return false;

  const normalizedModuleKeys = moduleKeys.map((key) => normalizeKey(key));

  for (const key of normalizedModuleKeys) {
    if (permissions[key]?.[action]) {
      return true;
    }
  }

  return false;
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

const PORTAL_ROUTE_RULES: Record<PortalKey, AdminRouteRule[]> = {
  admin: ADMIN_ROUTE_RULES,
  affiliate: AFFILIATE_ROUTE_RULES,
  sales: SALES_ROUTE_RULES,
  "production-manager": PRODUCTION_MANAGER_ROUTE_RULES,
};

const getPortalForPathname = (pathname: string): PortalKey | null => {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/affiliate")) return "affiliate";
  if (pathname.startsWith("/sales")) return "sales";
  if (pathname.startsWith("/production-manager")) return "production-manager";
  return null;
};

export const canAccessPortalPath = (
  pathname: string,
  permissions: PermissionsMap | null | undefined,
) => {
  const portal = getPortalForPathname(pathname);
  if (!portal) return true;

  if (pathname === `/${portal}`) {
    return Boolean(permissions && Object.keys(permissions).length);
  }

  const matchedRule = PORTAL_ROUTE_RULES[portal].find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule?.permissionKeys?.length) {
    return true;
  }

  return hasModulePermission(permissions, matchedRule.permissionKeys, "view");
};
