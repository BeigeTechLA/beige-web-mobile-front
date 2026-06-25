import { usePathname } from "next/navigation";
import { useAppSelector } from "../redux/hooks";
import { hasModulePermission, isSuperAdminUser } from "../permissions";

/**
 * Custom hook to check module permissions globally.
 * @param moduleKey The key of the module (e.g., 'quotes', 'roles', 'users')
 * @returns Object containing booleans for each permission action
 */
export const usePermissions = (moduleKey?: string) => {
  const pathname = usePathname();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const permissionsVersion = useAppSelector((state) => state.auth.permissionsVersion);
  const user = useAppSelector((state) => state.auth.user);

  const isBypassedPortal = pathname?.startsWith("/affiliate") || pathname?.startsWith("/creator");
  const isSuperAdmin = isSuperAdminUser(user);

  // If no moduleKey is provided, return all permissions
  if (!moduleKey) {
    return {
      allPermissions: permissions,
      permissionsVersion,
      isLoading: isBypassedPortal || isSuperAdmin ? false : !permissions,
    };
  }

  if (isBypassedPortal || isSuperAdmin) {
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
