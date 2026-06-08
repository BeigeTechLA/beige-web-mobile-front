import { useAppSelector } from "../redux/hooks";
import { hasModulePermission } from "../permissions";

/**
 * Custom hook to check module permissions globally.
 * @param moduleKey The key of the module (e.g., 'quotes', 'roles', 'users')
 * @returns Object containing booleans for each permission action
 */
export const usePermissions = (moduleKey?: string) => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const user = useAppSelector((state) => state.auth.user);
  const isPrivilegedAdminAccount = Boolean(
    user?.email === "admin@revure.com" ||
    user?.email === "harsh.panchal@gmail.com",
  );
  const isAdmin = Boolean(
    user && (
      Number(user.userTypeId) === 4 ||
      Number(user.user_type_id) === 4 ||
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

  // Admin users can access every module/action.
  if (isAdmin || (isPrivilegedAdminAccount && moduleKey === "roles_permissions")) {
    return {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      isLoading: false,
    };
  }

  return {
    canView: hasModulePermission(permissions, [moduleKey], "view"),
    canEdit: hasModulePermission(permissions, [moduleKey], "edit"),
    canCreate: hasModulePermission(permissions, [moduleKey], "create"),
    canDelete: hasModulePermission(permissions, [moduleKey], "delete"),
    isLoading: !permissions,
  };
};
