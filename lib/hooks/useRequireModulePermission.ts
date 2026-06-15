import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "./usePermissions";
import type { PermissionAction } from "../permissions";

/**
 * Gate a page or section on a module permission.
 * Optionally redirects when permission is denied after load.
 */
export function useRequireModulePermission(
  moduleKey: string,
  action: PermissionAction,
  redirectTo?: string,
) {
  const router = useRouter();
  const permissions = usePermissions(moduleKey);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const allowed =
    action === "view"
      ? permissions.canView
      : action === "create"
        ? permissions.canCreate
        : action === "edit"
          ? permissions.canEdit
          : permissions.canDelete;

  useEffect(() => {
    if (!mounted || permissions.isLoading || allowed || !redirectTo) return;
    router.replace(redirectTo);
  }, [mounted, permissions.isLoading, allowed, redirectTo, router]);

  return {
    allowed,
    isLoading: !mounted || permissions.isLoading,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
  };
}
