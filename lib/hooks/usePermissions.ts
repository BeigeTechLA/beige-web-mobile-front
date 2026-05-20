import { useAppSelector } from "../redux/hooks";
import { hasModulePermission } from "../permissions";

/**
 * Custom hook to check module permissions globally.
 * @param moduleKey The key of the module (e.g., 'quotes', 'roles', 'users')
 * @returns Object containing booleans for each permission action
 */
export const usePermissions = (moduleKey?: string) => {
  const permissions = useAppSelector((state) => state.auth.permissions);

  // If no moduleKey is provided, return all permissions
  if (!moduleKey) {
    return {
      allPermissions: permissions,
      isLoading: !permissions,
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
