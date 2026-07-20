"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, ArrowDownNarrowWide, ArrowUpAZ, ArrowUpNarrowWide } from "lucide-react";
import { useTheme } from "next-themes";
import { PermissionUsersTable } from "@/components/admin/roles-permissions/PermissionUsersTable";
import { RoleCard } from "@/components/admin/roles-permissions/RoleCard";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import {
  adminApi,
  type AdminRoleRecord,
  type AdminUserRoleRecord,
} from "@/lib/api";
import {
  type PermissionUser,
  type RoleCardData,
} from "@/components/admin/roles-permissions/types";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { USER_BADGE_TONES } from "@/components/admin/roles-permissions/data";
import { Button } from "@/components/ui/button";

type RolesPermissionsPageProps = {
  searchQuery?: string;
  canCreateUser?: boolean;
};

const CARD_TONES = [
  "bg-[#E7DDD0] text-[#161616]",
  "bg-[#F1C7E6] text-[#161616]",
  "bg-[#D9D0FF] text-[#161616]",
  "bg-[#D8ECF8] text-[#161616]",
  "bg-[#F3E8C6] text-[#161616]",
];

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const sortRolesForDisplay = (inputRoles: AdminRoleRecord[]) =>
  [...inputRoles].sort((a, b) => {
    return 0;
  });

const mapRoleToCard = (role: AdminRoleRecord, index: number): RoleCardData => ({
  id: String(role.role_id),
  roleId: role.role_id,
  name: role.name,
  usersLabel: `Total ${role.total_users} users`,
  description:
    role.description ||
    "This role provides access to predefined modules and features based on assignment.",
  members: [
    {
      id: `${role.role_id}-name-0`,
      label: "NA",
      tone: CARD_TONES[index % CARD_TONES.length],
    },
  ],
});

const mapUserToPermissionUser = (
  user: AdminUserRoleRecord,
  index: number,
): PermissionUser => ({
  id: user.user_id,
  name: user.name,
  subtitle: user.email,
  role_id: user.role_id,
  role: user.role_name || "Unassigned",
  created: formatDateTime(user.created_at),
  updated: formatDateTime(user.updated_at),
  status: user.status_label,
  badge: getInitials(user.name),
  badgeTone: USER_BADGE_TONES[index % USER_BADGE_TONES.length],
  archive_history: user.archive_history,
  last_archive_event: user.last_archive_event,
  deleted_by_name: user.deleted_by_name,
  deleted_at: user.deleted_at,
});

export function RolesPermissionsPage({
  searchQuery = "",
  canCreateUser
}: RolesPermissionsPageProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canEdit, canDelete } = usePermissions("roles_permissions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [rolesError, setRolesError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PermissionUser | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedRestoreUser, setSelectedRestoreUser] = useState<PermissionUser | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    subtext: string;
    buttonText: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    title: "",
    subtext: "",
    buttonText: "Done",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    setRolesError("");

    const response = await adminApi.getRoles({
      search: searchQuery,
      sort_by: "created_at",
      order: sortOrder,
    });

    if (response?.success && Array.isArray(response.data)) {
      setRoles(response.data);
    } else {
      setRoles([]);
      setRolesError(response?.error || response?.message || "Failed to load roles");
    }

    setIsLoadingRoles(false);
  }, [searchQuery, sortOrder]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError("");

    const response = await adminApi.getUsersWithRoles({
      search: searchQuery,
      sort_by: "created_at",
      order: sortOrder,
    });

    if (response?.success && Array.isArray(response.data)) {
      setUsers(response.data.map(mapUserToPermissionUser));
    } else {
      setUsers([]);
      setUsersError(response?.error || response?.message || "Failed to load users");
    }

    setIsLoadingUsers(false);
  }, [searchQuery, sortOrder]);

  useEffect(() => {
    const loadPage = async () => {
      await Promise.all([loadRoles(), loadUsers()]);
    };

    void loadPage();
  }, [loadRoles, loadUsers]);

  const roleCards = useMemo<RoleCardData[]>(() => {
    return sortRolesForDisplay(roles).map((role, index) => {
      const roleUsers = users.filter(
        (user) => user.role_id != null && user.role_id === role.role_id && user.status === "Active",
      );
      const badgeTexts = roleUsers
        .slice(0, 3)
        .map((user) => getInitials(user.name));
      const remainingUsers = Math.max(roleUsers.length - badgeTexts.length, 0);

      return {
        ...mapRoleToCard(role, index),
        members: [
          ...badgeTexts.map((label, badgeIndex) => ({
            id: `${role.role_id}-name-${badgeIndex}`,
            label,
            tone: CARD_TONES[(index + badgeIndex) % CARD_TONES.length],
          })),
          ...(remainingUsers > 0
            ? [
              {
                id: `${role.role_id}-count`,
                label: `+${remainingUsers}`,
                tone: "bg-[#ECD7AD] text-[#161616]",
                isCountBadge: true,
              },
            ]
            : []),
        ],
      };
    });
  }, [roles, users]);

  const rolesSummary = useMemo(() => {
    if (isLoadingRoles) return "Loading roles...";
    if (rolesError) return rolesError;
    if (!roleCards.length) return "No roles found for the current filters.";
    return `${roleCards.length} role${roleCards.length === 1 ? "" : "s"} loaded`;
  }, [isLoadingRoles, roleCards.length, rolesError]);

  const handleOpenDeleteModal = (user: PermissionUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleOpenRestoreModal = (user: PermissionUser) => {
    setSelectedRestoreUser(user);
    setIsRestoreModalOpen(true);
  };

  const handleOpenUserDetails = (user: PermissionUser) => {
    if (!canEdit) return;
    router.push(`/admin/roles-permissions/edit-details?user_id=${user.id}`);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    const response = await adminApi.deleteUser(selectedUser.id);
    setIsDeleting(false);

    if (response?.success === false) {
      setUsersError(response?.error || response?.message || "Failed to delete user");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      return;
    }

    await Promise.all([loadRoles(), loadUsers()]);
    setIsDeleteModalOpen(false);
    setSuccessModal({
      isOpen: true,
      title: "User Deleted Successfully",
      subtext: `${selectedUser.name} has been deleted successfully.`,
      buttonText: "Done",
    });
    setSelectedUser(null);
  };

  const handleConfirmRestore = async () => {
    if (!selectedRestoreUser) return;

    setIsRestoring(true);
    const response = await adminApi.restoreUser(selectedRestoreUser.id);
    setIsRestoring(false);

    if (response?.success === false) {
      setUsersError(response?.error || response?.message || "Failed to restore user");
      setIsRestoreModalOpen(false);
      setSelectedRestoreUser(null);
      return;
    }

    await Promise.all([loadRoles(), loadUsers()]);
    setIsRestoreModalOpen(false);
    setSuccessModal({
      isOpen: true,
      title: "User Restored Successfully",
      subtext: `${selectedRestoreUser.name} has been restored successfully and moved back to the active user list.`,
      buttonText: "Done",
    });
    setSelectedRestoreUser(null);
  };

  return (
    <>
      <div
        // className={`overflow-hidden px-4 pb-16 pt-6 transition-colors duration-300 lg:px-10 lg:pb-24 lg:pt-10 ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-[#323232]"}`}
        className="overflow-hidden p-4 pb-30 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 lg:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[610px]">
              <h1 className={`font-semibold lg:font-bold tracking-tight lg:text-2xl transition-colors duration-300 ${isDark ? "text-white" : "text-[#101010]"}`}>
                Roles & Permissions
              </h1>
              <p className={`mt-1 max-w-[560px] text-xs lg:text-sm lg:leading-relaxed transition-colors duration-300 ${isDark ? "text-white/70" : "text-[#323232B2]"}`}>
                A role provided access to predefined menus and features so that
                depending on assigned role an administrator can have access to what
                user needs.
              </p>
              <p className={`mt-1 lg:mt-2 text-sm transition-colors duration-300 ${isDark ? "text-white/35" : "text-[#010101]"}`}>{rolesSummary}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
              }
              className={`w-fit inline-flex h-8 lg:h-12 items-center gap-2 lg:gap-3 rounded-full border px-3 lg:px-6 text-xs lg:text-base transition-colors duration-300 ${isDark
                ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4] hover:border-white/20 hover:bg-[#161616] hover:text-white"
                : "border-[#D9D9D9] bg-white text-[#323232] hover:border-[#CFCFCF] hover:bg-[#F7F7F7] hover:text-[#101010]"
                }`}
            >
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
              {sortOrder === "desc" ? (
                <ArrowDownNarrowWide size={18} className="w-3 h-3 lg:w-5 lg:h-5 " />
              ) : (
                <ArrowUpNarrowWide size={18} className="w-3 h-3 lg:w-5 lg:h-5 " />
              )}
            </button>
          </div>

          <div className="grid justify-items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {!isLoadingRoles &&
              roleCards.map((card) => (
                <RoleCard
                  key={card.id}
                  card={card}
                  isDark={isDark}
                  onEdit={(id) => {
                    router.push(`/admin/roles-permissions/edit-details?role_id=${id}`);
                  }}
                  editDisabled={!canEdit}
                  onViewUsers={
                    (id) => {
                      const role = roles.find((item) => String(item.role_id) === String(id));
                      router.push(
                        `/admin/roles-permissions/role-users?role_id=${id}&role_name=${encodeURIComponent(
                          role?.name || "Role",
                        )}`,
                      );
                    }
                  }
                />
              ))}

            {isLoadingRoles && (
              <div className={`col-span-full rounded-[32px] border px-6 py-10 text-center transition-colors duration-300 ${isDark ? "border-white/10 bg-[#111111] text-white/50" : "border-[#E3E3E3] bg-white text-[#32323266]"
                }`}>
                Loading roles...
              </div>
            )}

            {!isLoadingRoles && !roles.length && (
              <div className={`col-span-full rounded-[32px] border px-6 py-10 text-center transition-colors duration-300 ${isDark ? "border-white/10 bg-[#111111] text-white/50" : "border-[#E3E3E3] bg-white text-[#32323266]"
                }`}>
                {rolesError || "No roles found."}
              </div>
            )}
          </div>

          <PermissionUsersTable
            users={users}
            sortOrder={sortOrder}
            isDark={isDark}
            isLoading={isLoadingUsers}
            error={usersError}
            onEdit={handleOpenUserDetails}
            onRowClick={handleOpenUserDetails}
            onDelete={canDelete ? handleOpenDeleteModal : undefined}
            onRestore={canDelete ? handleOpenRestoreModal : undefined}
            successModal={
              successModal.isOpen
                ? {
                  ...successModal,
                  onSubmit: () =>
                    setSuccessModal((current) => ({
                      ...current,
                      isOpen: false,
                    })),
                }
                : undefined
            }
          />
        </div>

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/admin/internal-credentials")}
            disabled={!canCreateUser}
            title={canCreateUser ? "Add New User" : "Create permission not allowed"}
            className="w-full bg-[#E8D1AB] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Add New User
          </Button>
        </div>
      </div>

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (isDeleting) return;
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description={
          selectedUser
            ? `Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`
            : "Are you sure you want to delete this user? This action cannot be undone."
        }
        tone="danger"
        confirmLabel={isDeleting ? "Deleting..." : "Delete User"}
        isLoading={isDeleting}
      />

      <ActionModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          if (isRestoring) return;
          setIsRestoreModalOpen(false);
          setSelectedRestoreUser(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restore User"
        description={
          selectedRestoreUser
            ? `Restore ${selectedRestoreUser.name} and move them back to the active user list?`
            : "Restore this user and move them back to the active user list?"
        }
        tone="success"
        confirmLabel={isRestoring ? "Restoring..." : "Restore User"}
        isLoading={isRestoring}
      />
    </>
  );
}
