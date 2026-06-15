import { useAppSelector } from "../redux/hooks";
import { hasModulePermission } from "../permissions";

/**
 * Custom hook to check module permissions globally.
 * @param moduleKey The key of the module (e.g., 'quotes', 'roles', 'users')
 * @returns Object containing booleans for each permission action
 */
export const usePermissions = (moduleKey?: string) => {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const permissionsVersion = useAppSelector((state) => state.auth.permissionsVersion);
  const user = useAppSelector((state) => state.auth.user);

  // If no moduleKey is provided, return all permissions
  if (!moduleKey) {
    return {
      allPermissions: permissions,
      permissionsVersion,
      isLoading: !permissions,
    };
  }

  // Check if the user is an admin
  const isAdmin = user && (
    Number(user.userTypeId) === 4 ||
    Number(user.user_type_id) === 4 ||
    user.userRole?.toLowerCase() === "admin" ||
    user.email === "admin@revure.com" ||
    user.email === "harsh.panchal@gmail.com"
  );

  // Fallback for roles_permissions module for admin users
  if (moduleKey === "roles_permissions" && isAdmin) {
    return {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      permissionsVersion,
      isLoading: false,
    };
  }

  return {
    canView: hasModulePermission(permissions, [moduleKey], "view"),
    canEdit: hasModulePermission(permissions, [moduleKey], "edit"),
    canCreate: hasModulePermission(permissions, [moduleKey], "create"),
    canDelete: hasModulePermission(permissions, [moduleKey], "delete"),
    permissionsVersion,
    isLoading: !permissions,
  };
};

