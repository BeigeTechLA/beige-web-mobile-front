"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import { PermissionMatrixTable } from "@/components/admin/roles-permissions/PermissionMatrixTable";
import { type PermissionMatrixRow } from "@/components/admin/roles-permissions/types";
import {
  buildPermissionRows,
  extractPermissionsFromRows,
  type PermissionModuleRecord,
} from "@/components/admin/roles-permissions/utils";

export function RoleCreatePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<PermissionMatrixRow[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    tone: "default" | "danger" | "success";
  }>({
    isOpen: false,
    title: "",
    description: "",
    tone: "default",
  });

  useEffect(() => {
    let mounted = true;

    const loadPermissionRows = async () => {
      try {
        setIsLoadingPermissions(true);
        const modulesResponse = await adminApi.getPermissionModules({ scope: "admin" });
        const modules: PermissionModuleRecord[] = Array.isArray(modulesResponse?.data)
          ? modulesResponse.data
          : [];

        if (mounted) {
          setRows(buildPermissionRows(modules, "admin"));
        }
      } catch (error) {
        console.error("Failed to load permission modules:", error);
        if (mounted) {
          setRows(buildPermissionRows([], "admin"));
          setModalState({
            isOpen: true,
            title: "Permission Modules Unavailable",
            description: "Role can still be created, but permission modules could not be loaded.",
            tone: "danger",
          });
        }
      } finally {
        if (mounted) setIsLoadingPermissions(false);
      }
    };

    loadPermissionRows();

    return () => {
      mounted = false;
    };
  }, []);

  const openModal = (title: string, description: string, tone: "default" | "danger" | "success" = "default") => {
    setModalState({
      isOpen: true,
      title,
      description,
      tone,
    });
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      openModal("Role Name Required", "Please enter a role name before saving.", "default");
      return;
    }

    setIsSaving(true);

    const permissions = extractPermissionsFromRows(rows);
    const payload = {
      name: roleName,
      description: description,
      permissions,
    };

    try {
      const response = await adminApi.createRole(payload);
      if (response.success !== false) {
        const roleId = response?.data?.role_id || response?.data?.id;

        if (roleId) {
          const permissionsResponse = await adminApi.updateRole(roleId, { permissions });

          if (permissionsResponse.success === false) {
            openModal(
              "Role Created",
              permissionsResponse.error || "The role was created, but permissions could not be saved.",
              "danger",
            );
            return;
          }
        }

        router.push("/admin/roles-permissions");
      } else {
        openModal("Failed To Create Role", response.error || "Failed to create role.", "danger");
      }
    } catch (error) {
      console.error(error);
      openModal(
        "Create Role Error",
        "An error occurred while creating the role.",
        "danger",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overflow-hidden px-4 pb-16 pt-5 lg:px-10 lg:pb-24 lg:pt-8">
      <div className="mx-auto max-w-[1500px]">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 bg-transparent p-0 text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={20} />
          <span className="text-[15px] font-medium">Back</span>
        </button>

        <h1 className="text-[32px] font-bold text-white lg:text-[36px]">Add Roles</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/50 max-w-[700px]">
          Create roles to manage permissions and control what users can access on
          the platform.
        </p>

        <div className="mt-10 space-y-8">
          <div className="flex flex-col gap-3">
            <span className="text-[16px] font-semibold text-white/70">Enter Role Name</span>
            <input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="e.g. Content Manager"
              className="h-20 w-full rounded-[24px] border border-white/10 bg-[#111111] px-8 text-xl text-white outline-none transition focus:border-[#E5D5B8]/50 focus:bg-[#171717] placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[16px] font-semibold text-white/70">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the role's responsibilities..."
              className="min-h-[200px] w-full rounded-[24px] border border-white/10 bg-[#111111] px-8 py-7 text-lg text-white outline-none transition focus:border-[#E5D5B8]/50 focus:bg-[#171717] placeholder:text-white/20"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[22px] font-semibold text-white">Module Access</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171717]">
              {isLoadingPermissions ? (
                <div className="p-8 text-center text-white/50">Loading permission modules...</div>
              ) : (
                <PermissionMatrixTable
                  rows={rows}
                  onChange={setRows}
                  showSelectionColumn
                  className="border-none !bg-transparent"
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[72px] w-full rounded-[24px] border border-white/10 bg-transparent text-[20px] font-bold text-white transition-all hover:bg-white/5 sm:max-w-[240px]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingPermissions}
            className="h-[72px] w-full rounded-[24px] bg-[#E5D5B8] text-[20px] font-bold text-black transition-all hover:bg-[#d6c29b] hover:scale-[1.02] active:scale-[0.98] sm:max-w-[240px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <ActionModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState((current) => ({
            ...current,
            isOpen: false,
          }))
        }
        title={modalState.title}
        description={modalState.description}
        tone={modalState.tone}
        confirmLabel="Close"
        hideCancel
      />
    </div>
  );
}
