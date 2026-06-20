"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { adminApi, type AdminUserRoleRecord } from "@/lib/api";

const formatDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";

export default function RoleUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("role_id");
  const roleName = searchParams.get("role_name") || "Role";
  const [users, setUsers] = useState<AdminUserRoleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      if (!roleId) {
        setError("Missing role_id in the URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      const response = await adminApi.getUsersWithRoles({
        role_id: roleId,
        sort_by: "created_at",
        order: "desc",
      });

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        setUsers(response.data as AdminUserRoleRecord[]);
      } else {
        setUsers([]);
        setError(response?.error || response?.message || "Failed to load role users");
      }

      setIsLoading(false);
    };

    void loadUsers();

    return () => {
      mounted = false;
    };
  }, [roleId]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.role_name || ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery, users]);

  const totalUsers = users.length;

  return (
    <PermissionGuard module="roles_permissions" action="view">
      <div className="min-h-screen bg-[#0A0A0A] px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={20} />
            <span className="text-[16px] font-medium">Back</span>
          </button>

          <div className="rounded-[32px] border border-white/10 bg-[#111111] p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#E5D5B8]/70">
                  Role Users
                </p>
                <h1 className="mt-2 text-[30px] font-bold tracking-tight text-white lg:text-[36px]">
                  {roleName}
                </h1>
                <p className="mt-2 text-[15px] text-white/45">
                  Displaying users assigned to this role.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4">
                  <p className="text-sm text-white/45">Role Name</p>
                  <p className="mt-1 text-[18px] font-semibold text-white">{roleName}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4">
                  <p className="text-sm text-white/45">Total Users</p>
                  <p className="mt-1 text-[18px] font-semibold text-white">{totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="relative mt-2">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users"
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#171717] pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E5D5B8]/50"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#111111]">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-left text-[14px] font-semibold text-[#D9C8A3]">
                    <th className="w-[11%] px-4 py-4">Avatar</th>
                    <th className="w-[18%] px-4 py-4">Name</th>
                    <th className="w-[29%] px-4 py-4">Email</th>
                    <th className="w-[15%] px-4 py-4">Status</th>
                    <th className="w-[17%] px-4 py-4">Created Date</th>
                    <th className="w-[10%] px-4 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/50">
                        <div className="inline-flex items-center gap-3">
                          <Loader2 size={18} className="animate-spin" />
                          Loading role users...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-red-300/90">
                        {error}
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/50">
                        No users found for this role.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.user_id}
                        className="cursor-pointer text-white transition-colors hover:bg-white/[0.02]"
                        onClick={() =>
                          router.push(`/admin/roles-permissions/edit-details?user_id=${user.user_id}`)
                        }
                      >
                        <td className="px-4 py-5">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5D5B8] text-[15px] font-bold text-[#111111]">
                            {getInitials(user.name)}
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <p className="truncate text-[15px] font-semibold text-white" title={user.name}>
                            {user.name}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-[14px] text-white/60">
                          <span className="block truncate" title={user.email}>{user.email}</span>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[13px] font-semibold ${user.status_label === "Active"
                                ? "bg-[#28C76F1A] text-[#28C76F]"
                                : "bg-[#EA54551A] text-[#EA5455]"
                              }`}
                          >
                            {user.status_label}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-[14px] text-white/60">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-5 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(
                                `/admin/roles-permissions/edit-details?user_id=${user.user_id}`,
                              );
                            }}
                            aria-label={`Open details for ${user.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}