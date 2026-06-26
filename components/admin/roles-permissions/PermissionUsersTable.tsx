"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, History, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi, type AdminUserRoleRecord } from "@/lib/api";
import {
  PermissionStatus,
  PermissionUser,
} from "@/components/admin/roles-permissions/types";
import { USER_BADGE_TONES } from "@/components/admin/roles-permissions/data";

type PermissionUsersTableProps = {
  users: PermissionUser[];
  isLoading?: boolean;
  error?: string;
  onEdit?: (user: PermissionUser) => void;
  onDelete?: (user: PermissionUser) => void;
  onRestore?: (user: PermissionUser) => void;
  onRowClick?: (user: PermissionUser) => void;
  roleId?: string | number;
};

const ITEMS_PER_PAGE = 5;

const buildPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 1) return [1];

  const pages: Array<number | "..."> = [];
  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);

  if (left > 2) {
    pages.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    pages.push(page);
  }

  if (right < totalPages - 1) {
    pages.push("...");
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

function StatusPill({ status }: { status: PermissionStatus }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[13px] font-semibold ${active
          ? "bg-[#28C76F1A] text-[#28C76F]" // Light green background with dark green text (Vuexy Style)
          : "bg-[#EA54551A] text-[#EA5455]" // Light red background with dark red text (Vuexy Style)
        }`}
    >
      {status}
    </span>
  );
}

const formatDateParts = (value: string) => {
  if (!value) return { date: "-", time: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value, time: "" };
  }

  return {
    date: format(date, "MM/dd/yyyy"),
    time: format(date, "h:mm a"),
  };
};

const matchesMonthFilter = (value: string, monthFilter: string) => {
  if (monthFilter === "all") return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const month = format(date, "MMM").toLowerCase();
  const monthNumber = format(date, "M");

  return month.startsWith(monthFilter.toLowerCase()) || monthNumber === monthFilter;
};

const monthToNumber: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const mapApiUserToPermissionUser = (
  user: AdminUserRoleRecord,
  index: number,
): PermissionUser => ({
  id: user.user_id,
  name: user.name,
  subtitle: user.email,
  role_id: user.role_id,
  role: user.role_name || "Unassigned",
  created: user.created_at || "",
  updated: user.updated_at || user.created_at || "",
  status: user.status_label,
  archive_history: user.archive_history,
  last_archive_event: user.last_archive_event,
  deleted_by_name: user.deleted_by_name,
  deleted_at: user.deleted_at,
  badge: user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA",
  badgeTone: USER_BADGE_TONES[index % USER_BADGE_TONES.length],
});

export function PermissionUsersTable({
  users,
  isLoading = false,
  error = "",
  onEdit,
  onDelete,
  onRestore,
  onRowClick,
  roleId,
}: PermissionUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverUsers, setServerUsers] = useState<PermissionUser[]>(users);
  const [serverError, setServerError] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [historyUser, setHistoryUser] = useState<PermissionUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {};

    if (roleId != null && String(roleId).trim()) {
      params.role_id = roleId;
    }

    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }

    if (statusFilter === "active") params.status = 1;
    if (statusFilter === "in-active") params.status = 0;

    if (monthFilter !== "all") {
      const monthValue = monthToNumber[monthFilter.toLowerCase()];
      if (monthValue) {
        params.month = monthValue;
      }
    }

    if (roleFilter !== "all") {
      const selectedRole = users.find(
        (user) => user.role.toLowerCase() === roleFilter.toLowerCase(),
      );
      if (selectedRole?.role_id != null) {
        params.role_id = selectedRole.role_id;
      }
    }

    return params;
  }, [debouncedSearchQuery, monthFilter, roleFilter, roleId, users, statusFilter]);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      setServerLoading(true);
      setServerError("");

      const response = await adminApi.getUsersWithRoles(queryParams);

      if (!mounted) return;

      if (response?.success && Array.isArray(response.data)) {
        setServerUsers(
          response.data.map((user: AdminUserRoleRecord, index: number) =>
            mapApiUserToPermissionUser(user, index),
          ),
        );
      } else {
        setServerUsers([]);
        setServerError(response?.error || response?.message || "Failed to load users");
      }

      setServerLoading(false);
    };

    void loadUsers();

    return () => {
      mounted = false;
    };
  }, [queryParams]);

  useEffect(() => {
    const hasActiveFilters =
      debouncedSearchQuery || statusFilter !== "all" || monthFilter !== "all" || roleFilter !== "all";

    if (!hasActiveFilters) {
      setServerUsers(users);
    }
  }, [debouncedSearchQuery, monthFilter, roleFilter, statusFilter, users]);

  const filteredUsers = useMemo(() => {
    return serverUsers.filter((user) => {
      const matchesSearch =
        !debouncedSearchQuery ||
        user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        user.subtitle.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesRole =
        roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesMonth =
        matchesMonthFilter(user.created, monthFilter) ||
        matchesMonthFilter(user.updated, monthFilter);

      return matchesSearch && matchesStatus && matchesRole && matchesMonth;
    });
  }, [debouncedSearchQuery, monthFilter, roleFilter, serverUsers, statusFilter]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort();
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);
  const canOpenUser = Boolean(onEdit || onRowClick);
  const selectedUserHistoryGroups = useMemo(() => {
    if (!historyUser) return [];

    const historyEntries = (historyUser.archive_history || [])
      .map((entry) => ({
        ...entry,
        userId: historyUser.id,
        userName: historyUser.name,
        role: historyUser.role,
        badge: historyUser.badge,
        badgeTone: historyUser.badgeTone,
      }))
      .filter((entry) => entry.action === "deleted" || entry.action === "restored")
      .sort((first, second) => {
        const firstTime = new Date(first.created_at || "").getTime();
        const secondTime = new Date(second.created_at || "").getTime();
        return (Number.isNaN(secondTime) ? 0 : secondTime) - (Number.isNaN(firstTime) ? 0 : firstTime);
      });

    return historyEntries
      .filter((entry) => entry.action === "deleted")
      .map((deletedEntry) => {
        const deletedAt = new Date(deletedEntry.created_at || "").getTime();
        const restoreEntry = historyEntries.find((entry) => {
          if (entry.userId !== deletedEntry.userId || entry.action !== "restored") return false;
          const restoredAt = new Date(entry.created_at || "").getTime();
          return !Number.isNaN(restoredAt) && !Number.isNaN(deletedAt) && restoredAt > deletedAt;
        });

        return {
          deleted: deletedEntry,
          restored: restoreEntry || null,
        };
      })
      .slice(0, 20);
  }, [historyUser]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, monthFilter, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const allSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((user) => selectedRows.includes(user.id));

  const toggleAll = (checked: boolean) => {
    setSelectedRows((current) => {
      const visibleIds = paginatedUsers.map((user) => user.id);

      if (checked) {
        return Array.from(new Set([...current, ...visibleIds]));
      }

      return current.filter((id) => !visibleIds.includes(id));
    });
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedRows((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  };

  const showLoading = isLoading || serverLoading;
  const showError = error || serverError;

  return (
    <>
    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#111111]">
      <div className="px-6 py-6">
        {/* Table Header Section: Title and Right-aligned Filters */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
            <h2 className="text-[20px] font-semibold text-white">All Users</h2>
          </div>

          {/* Horizontal row of pill-shaped filters as per Vuexy/Figma */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 ml-auto md:ml-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 min-w-[90px] rounded-full border-white/10 bg-[#1c1c1c] px-4 text-[13px] font-medium text-white/50 transition hover:bg-[#252525] focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#171717] text-white">
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in-active">In-Active</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-10 min-w-[90px] rounded-full border-white/10 bg-[#1c1c1c] px-4 text-[13px] font-medium text-white/50 transition hover:bg-[#252525] focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#171717] text-white">
                <SelectItem value="all">Month</SelectItem>
                <SelectItem value="1">Jan</SelectItem>
                <SelectItem value="2">Feb</SelectItem>
                <SelectItem value="3">Mar</SelectItem>
                <SelectItem value="4">Apr</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">Jun</SelectItem>
                <SelectItem value="7">Jul</SelectItem>
                <SelectItem value="8">Aug</SelectItem>
                <SelectItem value="9">Sep</SelectItem>
                <SelectItem value="10">Oct</SelectItem>
                <SelectItem value="11">Nov</SelectItem>
                <SelectItem value="12">Dec</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 min-w-[70px] rounded-full border-white/10 bg-[#1c1c1c] px-4 text-[13px] font-medium text-white/50 transition hover:bg-[#252525] focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#171717] text-white">
                <SelectItem value="all">All</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role.toLowerCase()}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="relative mt-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#171717] pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E5D5B8]/50"
          />
        </div>
      </div>

      <div className="w-full">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-left text-[14px] font-semibold text-[#D9C8A3]">
              <th className="w-[5%] px-4 py-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                />
              </th>
              <th className="w-[25%] px-4 py-4">Names</th>
              <th className="w-[16%] px-4 py-4">Roles</th>
              <th className="w-[14%] px-4 py-4">Created</th>
              <th className="w-[14%] px-4 py-4">Updated</th>
              <th className="w-[11%] px-4 py-4">Status</th>
              <th className="w-[15%] px-4 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {showLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-white/50">
                  Loading users...
                </td>
              </tr>
            )}

            {!showLoading && !!showError && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-red-300/80">
                  {showError}
                </td>
              </tr>
            )}

            {!showLoading && !showError && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-white/50">
                  No users found.
                </td>
              </tr>
            )}

            {!showLoading &&
              !showError &&
              paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className={`group text-white transition-colors hover:bg-white/[0.02] ${
                  canOpenUser && user.status === "Active" ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() => {
                  if (user.status !== "Active") return;
                  onRowClick?.(user);
                }}
              >
                <td className="px-4 py-5">
                  <Checkbox
                    checked={selectedRows.includes(user.id)}
                    onCheckedChange={(value) => toggleOne(user.id, value === true)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                  />
                </td>

                <td className="px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold ${user.badgeTone}`}
                    >
                      {user.badge}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-white group-hover:text-[#E5D5B8] transition-colors">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-white/40">{user.subtitle}</p>
                      {user.status === "In-Active" && user.deleted_by_name ? (
                        <p className="mt-1 truncate text-[12px] text-[#EA5455]/80">
                          Deleted by {user.deleted_by_name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>

                {/* Roles column: Plain text with chevron as per Figma design (No background pill) */}
                <td className="px-4 py-5">
                  <div className="flex items-center gap-2 truncate text-[14px] font-medium text-white/90">
                    <span className="truncate">{user.role}</span>
                  </div>
                </td>

                <td className="px-4 py-5 text-[14px] text-white/60">
                  <div className="flex flex-col leading-tight">
                    <span>{formatDateParts(user.created).date}</span>
                    <span className="text-[12px] text-white/35">{formatDateParts(user.created).time}</span>
                  </div>
                </td>

                <td className="px-4 py-5 text-[14px] text-white/60">
                  <div className="flex flex-col leading-tight">
                    <span>{formatDateParts(user.updated).date}</span>
                    <span className="text-[12px] text-white/35">{formatDateParts(user.updated).time}</span>
                  </div>
                </td>

                <td className="px-4 py-5">
                  <StatusPill status={user.status} />
                </td>

                <td className="px-4 py-5">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      title="View user history"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[#E5D5B8]/10 hover:text-[#E5D5B8]"
                      onClick={(event) => {
                        event.stopPropagation();
                        setHistoryUser(user);
                      }}
                    >
                      <History size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={!onEdit || user.status !== "Active"}
                      title={user.status === "Active" ? "Edit user" : "Inactive users cannot be edited"}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (user.status !== "Active") return;
                        onEdit?.(user);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    {user.status === "In-Active" ? (
                      <button
                        type="button"
                        disabled={!onRestore}
                        title="Restore user"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[#28C76F]/10 hover:text-[#28C76F] disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRestore?.(user);
                        }}
                      >
                        <RotateCcw size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!onDelete}
                        title="Delete user"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete?.(user);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canOpenUser || user.status !== "Active"}
                      title={user.status === "Active" ? "Open details" : "Inactive users do not open details"}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (user.status !== "Active") return;
                        if (onEdit) {
                          onEdit(user);
                          return;
                        }
                        onRowClick?.(user);
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && filteredUsers.length > 0 ? (
        <div className="flex flex-col gap-4 border-t border-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/40">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </p>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-[#171717] px-4 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Previous
              </button>

              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-10 w-10 items-center justify-center text-sm text-white/30"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                      safeCurrentPage === item
                        ? "bg-[#E5D5B8] text-[#111111]"
                        : "border border-white/10 bg-[#171717] text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-[#171717] px-4 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    {historyUser ? (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryUser(null)}>
        <aside
          className="ml-auto flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-[#050505] text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold">Archive User History</h2>
              <p className="mt-1 truncate text-sm text-white/45">{historyUser.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryUser(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
              aria-label="Close archive users history"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {selectedUserHistoryGroups.length > 0 ? (
              <div className="space-y-3">
                {selectedUserHistoryGroups.map(({ deleted, restored }) => {
                  const deletedTime = formatDateParts(deleted.created_at || "");
                  const restoredTime = restored ? formatDateParts(restored.created_at || "") : null;
                  const deletedBy = deleted.performed_by_name || "Admin";
                  const deletedRole = deleted.performed_by_role ? ` - ${deleted.performed_by_role}` : "";
                  const restoredBy = restored?.performed_by_name || "Admin";

                  return (
                    <div key={deleted.history_id} className="rounded-lg border border-white/10 bg-[#171717] p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold ${deleted.badgeTone}`}>
                          {deleted.badge}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium leading-relaxed text-white">
                            {deleted.userName} was deleted by {deletedBy}
                            <span className="text-[#E5D5B8]">{deletedRole}</span>
                          </p>
                          <p className="mt-1 text-[11px] text-white/40">
                            {deletedTime.date} <span className="mx-1">•</span> {deletedTime.time || "N/A"}
                          </p>

                          {restored && restoredTime ? (
                            <div className="relative mt-3 pl-8">
                              <div className="absolute left-3 top-0 h-full w-px bg-white/10" />
                              <div className="rounded-md border border-white/10 bg-[#111] px-3 py-2">
                                <p className="text-[11px] font-medium text-white/85">
                                  {restored.userName} was restored by {restoredBy}
                                </p>
                                <p className="mt-1 text-[10px] text-white/35">
                                  {restoredTime.date} <span className="mx-1">•</span> {restoredTime.time || "N/A"}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-6 text-center">
                <History size={28} className="text-[#E5D5B8]" />
                <p className="mt-3 text-sm font-semibold text-white">No archive history found</p>
                <p className="mt-1 text-xs text-white/40">This user has not been deleted or restored yet.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    ) : null}
    </>
  );
}
