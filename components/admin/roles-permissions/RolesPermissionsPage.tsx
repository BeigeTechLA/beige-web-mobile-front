"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
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

type RolesPermissionsPageProps = {
  searchQuery?: string;
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

const formatDateTime = (value: string | null) => {
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
});

export function RolesPermissionsPage({
  searchQuery = "",
}: RolesPermissionsPageProps) {
  const router = useRouter();
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

  useEffect(() => {
    let mounted = true;

    const loadRoles = async () => {
      setIsLoadingRoles(true);
      setRolesError("");

      const response = await adminApi.getRoles({
        search: searchQuery,
        sort_by: "created_at",
        order: sortOrder,
      });

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
        setRolesError(response?.error || response?.message || "Failed to load roles");
      }

      setIsLoadingRoles(false);
    };

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError("");

      const response = await adminApi.getUsersWithRoles({
        search: searchQuery,
        sort_by: "created_at",
        order: "desc",
      });

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        setUsers(response.data.map(mapUserToPermissionUser));
      } else {
        setUsers([]);
        setUsersError(response?.error || response?.message || "Failed to load users");
      }

      setIsLoadingUsers(false);
    };

    void Promise.all([loadRoles(), loadUsers()]);

    return () => {
      mounted = false;
    };
  }, [searchQuery, sortOrder]);

  const roleCards = useMemo<RoleCardData[]>(() => {
    return roles.map((role, index) => {
      const roleUsers = users.filter(
        (user) => user.role_id != null && user.role_id === role.role_id,
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

    setUsers((current) => current.filter((user) => user.id !== selectedUser.id));
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <div className="overflow-hidden px-4 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-10">
        <div className="mx-auto w-full max-w-[1270px]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[610px]">
                <h1 className="text-[32px] font-bold tracking-tight text-white lg:text-[36px]">
                  Roles & Permissions
                </h1>
                <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-white/50">
                  A role provided access to predefined menus and features so that
                  depending on assigned role an administrator can have access to what
                  user needs.
                </p>
                <p className="mt-3 text-sm text-white/35">{rolesSummary}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
                }
                className="inline-flex h-12 items-center gap-3 rounded-full border border-white/10 bg-transparent px-6 text-[15px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
                {sortOrder === "desc" ? (
                  <ArrowDownAZ size={18} className="text-white/40" />
                ) : (
                  <ArrowUpAZ size={18} className="text-white/40" />
                )}
              </button>
            </div>

            <div className="border-t border-dashed border-white/10" />

            <div className="grid justify-items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {!isLoadingRoles &&
                roleCards.map((card) => (
                <RoleCard
                  key={card.id}
                  card={card}
                  onEdit={canEdit ? (id) => router.push(`/admin/roles-permissions/edit-details?role_id=${id}`) : undefined}
                  onViewUsers={(id) => {
                    const role = roles.find((item) => String(item.role_id) === String(id));
                    router.push(
                      `/admin/roles-permissions/role-users?role_id=${id}&role_name=${encodeURIComponent(
                        role?.name || "Role",
                      )}`,
                    );
                  }}
                />
              ))}

              {isLoadingRoles && (
                <div className="col-span-full rounded-[32px] border border-white/10 bg-[#111111] px-6 py-10 text-center text-white/50">
                  Loading roles...
                </div>
              )}

              {!isLoadingRoles && !roles.length && (
                <div className="col-span-full rounded-[32px] border border-white/10 bg-[#111111] px-6 py-10 text-center text-white/50">
                  {rolesError || "No roles found."}
                </div>
              )}
            </div>

            <PermissionUsersTable
              users={users}
              isLoading={isLoadingUsers}
              error={usersError}
              onEdit={handleOpenUserDetails}
              onRowClick={handleOpenUserDetails}
              onDelete={canDelete ? handleOpenDeleteModal : undefined}
            />
          </div>
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
    </>
  );
}
