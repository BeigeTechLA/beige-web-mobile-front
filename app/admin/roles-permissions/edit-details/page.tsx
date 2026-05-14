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
  type UserRoleDetailsResponse,
} from "@/lib/api";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";
import {
  applyPermissionsToRows,
  buildPermissionRows,
  extractPermissionsFromRows,
} from "@/components/admin/roles-permissions/utils";

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

export default function AdminRoleEditDetailsRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("role_id");
  const userId = searchParams.get("user_id");
  const mode = roleId ? "role" : "user";

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

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      setIsLoading(true);
      setError("");

      const [modulesResponse, rolesResponse] = await Promise.all([
        adminApi.getPermissionModules(),
        adminApi.getRoles(),
      ]);

      if (!mounted) return;

      const modules: PermissionModuleRecord[] = Array.isArray(modulesResponse?.data)
        ? modulesResponse.data
        : [];
      const baseRows = buildPermissionRows(modules);

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
          setRoleName(response.data.role.name || "Role");
          setRoleDescription(response.data.role.description || "");
          setCurrentRoleId(String(response.data.role.role_id));
          setCurrentRoleLabel(response.data.role.name || "Role");
          setStatus(Number(response.data.role.is_active) === 1 ? "Active" : "In-Active");
          setCreatedAt(formatDateTime(response.data.role.created_at));
          setUpdatedAt(formatDateTime(response.data.role.updated_at));
          setRows(applyPermissionsToRows(baseRows, response.data.permissions || {}));
        } else {
          setRows(baseRows);
          setError(response?.error || response?.message || "Failed to load role details");
        }
      } else if (userId) {
        const response = await adminApi.getUserRoleDetails(userId);
        if (!mounted) return;

        const data: UserRoleDetailsResponse | undefined = response?.data;

        if (response?.success && data?.user) {
          setUserName(data.user.name || "User");
          setCurrentRoleId(data.role?.role_id ? String(data.role.role_id) : "");
          setCurrentRoleLabel(data.display_role || data.role?.name || "Unassigned");
          setStatus(data.user.status_label || "Active");
          setCreatedAt(formatDateTime(data.user.created_at));
          setUpdatedAt(formatDateTime(data.role?.updated_at || data.user.created_at));
          setRoleDescription(data.role?.description || "");
          setRows(applyPermissionsToRows(baseRows, data.permissions || {}));
        } else {
          setRows(baseRows);
          setError(response?.error || response?.message || "Failed to load user role details");
        }
      } else {
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
  };

  const handlePrimaryAction = async () => {
    if (mode === "user") {
      setIsUpdateModalOpen(true);
      return;
    }

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

    setSuccessTitle("Role Updated Successfully");
    setSuccessDescription(
      "The role details and permissions have been updated successfully. Changes will reflect immediately across the platform.",
    );
    setIsSuccessModalOpen(true);
  };

  const handleAssignRole = async () => {
    if (!userId || !currentRoleId) {
      setError("Please select a role to assign.");
      return;
    }

    setIsSaving(true);
    const response = await adminApi.assignRoleToUser({
      user_id: userId,
      role_id: currentRoleId,
    });
    setIsSaving(false);

    if (response?.success === false) {
      setError(response?.error || response?.message || "Failed to assign role");
      return;
    }

    const detailsResponse = await adminApi.getUserRoleDetails(userId);
    if (detailsResponse?.success && detailsResponse?.data) {
      const modulesResponse = await adminApi.getPermissionModules();
      const modules: PermissionModuleRecord[] = Array.isArray(modulesResponse?.data)
        ? modulesResponse.data
        : [];
      const baseRows = buildPermissionRows(modules);

      setRows(applyPermissionsToRows(baseRows, detailsResponse.data.permissions || {}));
      setCurrentRoleLabel(
        detailsResponse.data.display_role || detailsResponse.data.role?.name || currentRoleLabel,
      );
      setRoleDescription(detailsResponse.data.role?.description || "");
    }

    setSuccessTitle("Role Assigned Successfully");
    setSuccessDescription(
      "The selected role has been assigned to the user successfully. Updated permissions are now active.",
    );
    setIsSuccessModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleId) return;

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
    if (!userId) return;

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
    if (isSaving) return mode === "role" ? "Updating..." : "Assigning...";
    return mode === "role" ? "Update" : "Update";
  }, [isSaving, mode]);

  return (
    <>
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
            {mode === "role" ? (
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
        readOnly={mode === "user"}
        isLoading={isLoading}
        description={mode === "role" ? roleDescription : undefined}
        primaryActionLabel={primaryActionLabel}
        onRowsChange={setRows}
        onOpenModal={() => setIsUpdateModalOpen(true)}
        onPrimaryAction={mode === "role" ? handlePrimaryAction : handleAssignRole}
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
        onClose={() => setIsSuccessModalOpen(false)}
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
    </>
  );
}
