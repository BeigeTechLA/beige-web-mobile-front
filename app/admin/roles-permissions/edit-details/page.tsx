"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { RoleEditDetailsPage } from "@/components/admin/roles-permissions/RoleEditDetailsPage";
import { UpdateRoleModal } from "@/components/admin/roles-permissions/UpdateRoleModal";
import { RoleUpdatedSuccessModal } from "@/components/admin/roles-permissions/RoleUpdatedSuccessModal";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import {
  adminApi,
  type AdminRoleRecord,
  type PermissionModuleRecord,
  type UserPermissionsMap,
  type UserRoleDetailsResponse,
} from "@/lib/api";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";
import {
  applyPermissionsToRows,
  buildPermissionRows,
  extractPermissionStateFromRows,
  extractPermissionsFromRows,
} from "@/components/admin/roles-permissions/utils";
import { normalizePermissionsPayload } from "@/lib/permissions";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchAndCommitUserPermissions,
} from "@/lib/permissionsActions";
import { broadcastPermissionsUpdated } from "@/lib/permissionsRefresh";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

type RoleOption = {
  value: string;
  label: string;
};

const normalizeUserPermissionsPayload = (value: unknown): UserPermissionsMap =>
  normalizePermissionsPayload(value) as UserPermissionsMap;

const resolvePermissionScope = (value?: string | null) => {
  const normalized = (value || "").toLowerCase();

  if (normalized === "sales_admin" || normalized.includes("sales admin")) return "sales_admin";
  if (normalized === "sales_rep" || normalized.includes("sales rep") || normalized.includes("sales representative")) return "sales_rep";
  if (normalized === "production_manager" || normalized.includes("production manager")) return "production_manager";
  if (normalized === "creative_partner" || normalized.includes("creative partner")) return "creative_partner";
  if (normalized === "client") return "client";
  if (normalized === "admin") return "admin";

  if (normalized.includes("sales")) return "sales_rep";
  if (
    normalized.includes("creative") ||
    normalized.includes("crew") ||
    normalized.includes("creator") ||
    normalized.includes("editor") ||
    normalized.includes("videographer") ||
    normalized.includes("photographer") ||
    normalized.includes("director")
  ) {
    return "creative_partner";
  }

  return "admin";
};

const getDeletedUserPermissionEntries = (
  previousPermissions: UserPermissionsMap,
  nextPermissions: UserPermissionsMap,
) => {
  const deletedEntries: Array<{ moduleKey: string; actionKey: PermissionColumnKey }> = [];

  Object.entries(previousPermissions).forEach(([moduleKey, actions]) => {
    (Object.keys(actions) as PermissionColumnKey[]).forEach((actionKey) => {
      if (actions[actionKey] && !nextPermissions[moduleKey]?.[actionKey]) {
        deletedEntries.push({ moduleKey, actionKey });
      }
    });
  });

  return deletedEntries;
};

export default function AdminRoleEditDetailsRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("role_id");
  const userId = searchParams.get("user_id");
  const mode = roleId ? "role" : "user";

  const dispatch = useAppDispatch();
  const { canDelete } = usePermissions("roles_permissions");
  const { allowed: canEditPage, isLoading: isPermissionLoading } = useRequireModulePermission(
    "roles_permissions",
    "edit",
    "/admin/roles-permissions",
  );
  const loggedInUser = useAppSelector((state) => state.auth.user);

  const refreshLoggedInUserPermissions = async () => {
    if (!loggedInUser?.id) return;
    await fetchAndCommitUserPermissions(dispatch, loggedInUser.id, {
      broadcast: true,
    });
  };

  const syncActivePermissions = async (userIdToRefresh?: string | number) => {
    if (!userIdToRefresh) return;

    if (String(loggedInUser?.id) === String(userIdToRefresh)) {
      await fetchAndCommitUserPermissions(dispatch, userIdToRefresh, {
        broadcast: true,
      });
      return;
    }

    broadcastPermissionsUpdated();
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Role Updated Successfully");
  const [successDescription, setSuccessDescription] = useState(
    "The user role and permissions have been updated successfully. Changes will reflect immediately across the platform.",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAccessWarningOpen, setIsAccessWarningOpen] = useState(false);
  const [accessWarningMessage, setAccessWarningMessage] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<PermissionMatrixRow[]>([]);
  const [roleName, setRoleName] = useState("Role");
  const [roleDescription, setRoleDescription] = useState("");
  const [userName, setUserName] = useState("User");
  const [status, setStatus] = useState("Active");
  const [createdAt, setCreatedAt] = useState("-");
  const [updatedAt, setUpdatedAt] = useState("-");
  const [currentRoleId, setCurrentRoleId] = useState("");
  const [currentRoleLabel, setCurrentRoleLabel] = useState("Role");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [userCustomPermissions, setUserCustomPermissions] = useState<UserPermissionsMap>({});
  const [hasUserCustomPermissions, setHasUserCustomPermissions] = useState(false);
  const [permissionScope, setPermissionScope] = useState("admin");

  const loadPermissionRows = async (scope: string) => {
    const modulesResponse = await adminApi.getPermissionModules({ scope });
    const modules: PermissionModuleRecord[] = Array.isArray(modulesResponse?.data)
      ? modulesResponse.data
      : [];
    return buildPermissionRows(modules);
  };

  useEffect(() => {
    let mounted = true;

    const loadUserPermissions = async ({
      nextUserId,
      baseRows,
      fallbackPermissions,
    }: {
      nextUserId: string;
      baseRows: PermissionMatrixRow[];
      fallbackPermissions: UserPermissionsMap;
    }) => {
      const response = await adminApi.getUserPermissions(nextUserId);

      if (!mounted) {
        return;
      }

      const normalizedPermissions = normalizeUserPermissionsPayload(response?.data);
      const hasCustomPermissions = Object.keys(normalizedPermissions).length > 0;
      const permissionsToApply = hasCustomPermissions ? normalizedPermissions : fallbackPermissions;

      setRows(applyPermissionsToRows(baseRows, permissionsToApply));
      setUserCustomPermissions(normalizedPermissions);
      setHasUserCustomPermissions(hasCustomPermissions);
    };

    const loadPage = async () => {
      setIsLoading(true);
      setError("");

      const rolesResponse = await adminApi.getRoles();

      if (!mounted) return;

      const availableRoles: AdminRoleRecord[] = Array.isArray(rolesResponse?.data)
        ? rolesResponse.data
        : [];
      setRoleOptions(
        availableRoles.map((role) => ({
          value: String(role.role_id),
          label: role.name,
        })),
      );

      if (mode === "role" && roleId) {
        const response = await adminApi.getRoleById(roleId);
        if (!mounted) return;

        if (response?.success && response?.data?.role) {
          const nextScope = resolvePermissionScope(response.data.role.name);
          const baseRows = await loadPermissionRows(nextScope);
          setRoleName(response.data.role.name || "Role");
          setRoleDescription(response.data.role.description || "");
          setCurrentRoleId(String(response.data.role.role_id));
          setCurrentRoleLabel(response.data.role.name || "Role");
          setPermissionScope(nextScope);
          setStatus(Number(response.data.role.is_active) === 1 ? "Active" : "In-Active");
          setCreatedAt(formatDateTime(response.data.role.created_at));
          setUpdatedAt(formatDateTime(response.data.role.updated_at));
          setRows(applyPermissionsToRows(baseRows, response.data.permissions || {}));
        } else {
          const baseRows = await loadPermissionRows("admin");
          setPermissionScope("admin");
          setRows(baseRows);
          setError(response?.error || response?.message || "Failed to load role details");
        }
      } else if (userId) {
        const response = await adminApi.getUserRoleDetails(userId);
        if (!mounted) return;

        const data: UserRoleDetailsResponse | undefined = response?.data;

        if (response?.success && data?.user) {
          const nextScope = resolvePermissionScope(data.display_role || data.role?.name);
          const baseRows = await loadPermissionRows(nextScope);
          setUserName(data.user.name || "User");
          setCurrentRoleId(data.role?.role_id ? String(data.role.role_id) : "");
          setCurrentRoleLabel(data.display_role || data.role?.name || "Unassigned");
          setPermissionScope(nextScope);
          setStatus(data.user.status_label || "Active");
          setCreatedAt(formatDateTime(data.user.created_at));
          setUpdatedAt(formatDateTime(data.role?.updated_at || data.user.created_at));
          setRoleDescription(data.role?.description || "");
          await loadUserPermissions({
            nextUserId: String(userId),
            baseRows,
            fallbackPermissions: normalizeUserPermissionsPayload(data.permissions || {}),
          });
        } else {
          const baseRows = await loadPermissionRows("admin");
          setPermissionScope("admin");
          setRows(baseRows);
          setError(response?.error || response?.message || "Failed to load user role details");
        }
      } else {
        const baseRows = await loadPermissionRows("admin");
        setPermissionScope("admin");
        setRows(baseRows);
        setError("Missing role or user identifier.");
      }

      setIsLoading(false);
    };

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [mode, roleId, userId]);

  const handleModalUpdate = ({
    roleId: selectedRoleId,
    roleName: nextRoleName,
    description: nextDescription,
  }: {
    roleId?: string;
    roleName: string;
    description: string;
  }) => {
    if (mode === "role") {
      setRoleName(nextRoleName);
      setCurrentRoleLabel(nextRoleName);
      setRoleDescription(nextDescription);
      setIsUpdateModalOpen(false);
      return;
    }

    setCurrentRoleId(selectedRoleId || "");
    setCurrentRoleLabel(nextRoleName);
    setIsUpdateModalOpen(false);
    if (selectedRoleId) {
      setPermissionScope(resolvePermissionScope(nextRoleName));
      void handleAssignRole(selectedRoleId, nextRoleName);
    }
  };

  const handlePrimaryAction = async () => {
    if (!roleId) return;

    setIsSaving(true);
    const response = await adminApi.updateRole(roleId, {
      name: roleName,
      description: roleDescription,
      permissions: extractPermissionsFromRows(rows),
    });
    setIsSaving(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to update role");
      return;
    }

    broadcastPermissionsUpdated();
    await refreshLoggedInUserPermissions();

    setSuccessTitle("Role Updated Successfully");
    setSuccessDescription(
      "The role details and permissions have been updated successfully. Changes will reflect immediately across the platform.",
    );
    setIsSuccessModalOpen(true);
  };

  const handleUpdateUserPermissions = async () => {
    if (!userId) return;

    setIsSaving(true);
    setError("");

    const nextPermissions = extractPermissionStateFromRows(rows);
    const deletedEntries = getDeletedUserPermissionEntries(userCustomPermissions, nextPermissions);

    if (hasUserCustomPermissions && deletedEntries.length > 0) {
      await Promise.all(
        deletedEntries.map(({ moduleKey, actionKey }) =>
          adminApi.deleteUserPermission(userId, moduleKey, actionKey),
        ),
      );
    }

    const response = hasUserCustomPermissions
      ? await adminApi.updateUserPermissions({
          user_id: userId,
          permissions: nextPermissions,
        })
      : await adminApi.assignUserPermissions({
          user_id: userId,
          permissions: nextPermissions,
        });

    setIsSaving(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to update user permissions");
      return;
    }

    await syncActivePermissions(userId);

    const baseRows = await loadPermissionRows(permissionScope);
    const permissionResponse = await adminApi.getUserPermissions(userId);
    const normalizedPermissions = normalizeUserPermissionsPayload(permissionResponse?.data);
    const permissionsToApply =
      Object.keys(normalizedPermissions).length > 0 ? normalizedPermissions : nextPermissions;

    setRows(applyPermissionsToRows(baseRows, permissionsToApply));
    setUserCustomPermissions(normalizedPermissions);
    setHasUserCustomPermissions(true);

    await refreshLoggedInUserPermissions();

    setSuccessTitle("User Permissions Updated Successfully");
    setSuccessDescription(
      "The user's custom permissions have been updated successfully. Changes will reflect immediately across the platform.",
    );
    setIsSuccessModalOpen(true);
  };

  const handleAssignRole = async (
    selectedRoleId?: string,
    selectedRoleLabel?: string,
  ) => {
    const nextRoleId = selectedRoleId || currentRoleId;

    if (!userId || !nextRoleId) {
      setError("Please select a role to assign.");
      return;
    }

    setIsSaving(true);
    const response = await adminApi.assignRoleToUser({
      user_id: userId,
      role_id: nextRoleId,
    });
    setIsSaving(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to assign role");
      return;
    }

    await syncActivePermissions(userId);

    const detailsResponse = await adminApi.getUserRoleDetails(userId);
    if (detailsResponse?.success && detailsResponse?.data) {
      const fallbackPermissions = normalizeUserPermissionsPayload(
        detailsResponse.data.permissions || {},
      );
      const baseRows = await loadPermissionRows(resolvePermissionScope(selectedRoleLabel || currentRoleLabel));
      const permissionResponse = await adminApi.getUserPermissions(userId);
      const normalizedPermissions = normalizeUserPermissionsPayload(permissionResponse?.data);
      const permissionsToApply =
        Object.keys(normalizedPermissions).length > 0 ? normalizedPermissions : fallbackPermissions;

      setRows(applyPermissionsToRows(baseRows, permissionsToApply));
      setUserCustomPermissions(normalizedPermissions);
      setHasUserCustomPermissions(Object.keys(normalizedPermissions).length > 0);
      setCurrentRoleLabel(
        detailsResponse.data.display_role ||
          detailsResponse.data.role?.name ||
          selectedRoleLabel ||
          currentRoleLabel,
      );
      setRoleDescription(detailsResponse.data.role?.description || "");
    }

    await refreshLoggedInUserPermissions();

    setSuccessTitle("Role Assigned Successfully");
    setSuccessDescription(
      "The selected role has been assigned to the user successfully. Updated permissions are now active.",
    );
    setIsSuccessModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!canDelete || !roleId) return;

    setIsDeleting(true);
    const response = await adminApi.deleteRole(roleId);
    setIsDeleting(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to delete role");
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleteModalOpen(false);
    router.push("/admin/roles-permissions");
  };

  const handleDeleteUser = async () => {
    if (!canDelete || !userId) return;

    setIsDeleting(true);
    const response = await adminApi.deleteUser(userId);
    setIsDeleting(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to delete user");
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleteModalOpen(false);
    router.push("/admin/roles-permissions");
  };

  const handleDelete = async () => {
    if (mode === "role") {
      await handleDeleteRole();
      return;
    }

    await handleDeleteUser();
  };

  const handleInvalidAccessAttempt = (
    row: PermissionMatrixRow,
    key: PermissionColumnKey,
  ) => {
    setAccessWarningMessage(
      `Please enable View Access for ${row.label} before turning on ${key.charAt(0).toUpperCase() + key.slice(1)} Access.`,
    );
    setIsAccessWarningOpen(true);
  };

  const pageTitle = mode === "role" ? roleName : userName;
  const pageRoleLabel = currentRoleLabel;
  const deleteTitle = mode === "role" ? "Delete Role" : "Delete User";
  const deleteDescription =
    mode === "role"
      ? `Are you sure you want to delete ${roleName}? This action cannot be undone.`
      : `Are you sure you want to delete ${userName}? This action cannot be undone.`;
  const deleteLabel = mode === "role" ? "Delete Role" : "Delete User";
  const primaryActionLabel = useMemo(() => {
    if (isSaving) return "Updating...";
    return mode === "role" ? "Update" : "Update";
  }, [isSaving, mode]);

  if (isPermissionLoading || !canEditPage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white/60">
        {!isPermissionLoading && !canEditPage ? "No Permission" : null}
      </div>
    );
  }

  return (
    <PermissionGuard module="roles_permissions" action="edit">
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
          "edit-details": "Edit Details",
        }}
        actions={
          <div className="flex items-center gap-3">
            {/* <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-[12px] border border-[#F04438]/20 bg-[#F04438]/10 px-6 text-[15px] font-bold text-[#F04438] transition-all hover:bg-[#F04438]/15 active:scale-95"
            >
              {deleteLabel}
            </button> */}
            {mode === "role" && canDelete ? (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex h-12 items-center justify-center rounded-[12px] border border-[#F04438]/20 bg-[#F04438]/10 px-6 text-[15px] font-bold text-[#F04438] transition-all hover:bg-[#F04438]/15 active:scale-95"
              >
                {deleteLabel}
              </button>
            ) : null}
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-[#E5D5B8] px-8 text-[15px] font-bold text-black transition-all hover:bg-[#d6c29b] active:scale-95"
            >
              {mode === "role" ? "Edit Role" : "Assign Role"}
            </button>
          </div>
        }
      />

      <RoleEditDetailsPage
        title={pageTitle}
        roleLabel={pageRoleLabel}
        status={status}
        created={createdAt}
        updated={updatedAt}
        rows={rows}
        readOnly={false}
        isLoading={isLoading}
        description={mode === "role" ? roleDescription : undefined}
        primaryActionLabel={primaryActionLabel}
        onRowsChange={setRows}
        onOpenModal={() => setIsUpdateModalOpen(true)}
        onPrimaryAction={mode === "role" ? handlePrimaryAction : handleUpdateUserPermissions}
        onInvalidAccessAttempt={handleInvalidAccessAttempt}
      />

      {error ? (
        <div className="fixed bottom-6 right-6 rounded-xl border border-red-400/20 bg-[#1a0f10] px-4 py-3 text-sm text-red-200 shadow-lg">
          {error}
        </div>
      ) : null}

      <UpdateRoleModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={handleModalUpdate}
        currentRole={currentRoleId}
        roleName={roleName}
        description={roleDescription}
        mode={mode === "role" ? "role" : "assign"}
        roles={roleOptions}
        title={mode === "role" ? "Edit Role" : "Assign Role"}
      />

      <RoleUpdatedSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
        }}
        title={successTitle}
        description={successDescription}
      />

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={deleteTitle}
        description={deleteDescription}
        tone="danger"
        confirmLabel={isDeleting ? "Deleting..." : deleteLabel}
        isLoading={isDeleting}
      />

      <ActionModal
        isOpen={isAccessWarningOpen}
        onClose={() => setIsAccessWarningOpen(false)}
        title="View Access Required"
        description={accessWarningMessage}
        tone="default"
        confirmLabel="Close"
        hideCancel
      />
    </PermissionGuard>
  );
}
