import { usePathname } from "next/navigation";
import { useAppSelector } from "../redux/hooks";
import { hasModulePermission } from "../permissions";

/**
 * Custom hook to check module permissions globally.
 * @param moduleKey The key of the module (e.g., 'quotes', 'roles', 'users')
 * @returns Object containing booleans for each permission action
 */
export const usePermissions = (moduleKey?: string) => {
  const pathname = usePathname();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const user = useAppSelector((state) => state.auth.user);
  const isPrivilegedAdminAccount = Boolean(
    user?.email === "admin@revure.com" ||
    user?.email === "harsh.panchal@gmail.com",
  );
  const isAdmin = Boolean(
    user && (
      Number(user.userTypeId) === 1 ||
      Number(user.user_type_id) === 1 ||
      user.userRole?.toLowerCase() === "admin"
    ),
  );

  // If no moduleKey is provided, return all permissions
  if (!moduleKey) {
    return {
      allPermissions: permissions,
      isLoading: !permissions && !isAdmin,
    };
  }

  if (isPrivilegedAdminAccount && moduleKey === "roles_permissions") {
    return {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      isLoading: false,
    };
  }

  const getPortalSpecificKeys = (key: string) => {
    if (key === "dashboard") {
      if (pathname.startsWith("/admin")) return ["admin_dashboard"];
      if (pathname.startsWith("/sales")) return ["sales_admin_dashboard", "sales_rep_sales"];
      if (pathname.startsWith("/affiliate")) return ["client_dashboard"];
      if (pathname.startsWith("/production-manager")) return ["production_manager_dashboard"];
    }

    if (key !== "quotes") return [key];

    if (pathname.startsWith("/admin")) return ["admin_quotes"];
    if (pathname.startsWith("/sales")) return ["sales_rep_quotes", "sales_admin_quotes"];
    if (pathname.startsWith("/affiliate")) return ["client_quotes"];
    return [key];
  };

  const moduleKeys = getPortalSpecificKeys(moduleKey);

  return {
    canView: hasModulePermission(permissions, moduleKeys, "view"),
    canEdit: hasModulePermission(permissions, moduleKeys, "edit"),
    canCreate: hasModulePermission(permissions, moduleKeys, "create"),
    canDelete: hasModulePermission(permissions, moduleKeys, "delete"),
    isLoading: !permissions,
  };
};
