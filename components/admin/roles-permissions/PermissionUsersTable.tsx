"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, History, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
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
import ActionSuccessModal from "@/components/admin/ActionSuccessModal";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type PermissionUsersTableProps = {
  users: PermissionUser[];
  sortOrder?: "asc" | "desc";
  isDark?: boolean;
  isLoading?: boolean;
  error?: string;
  onEdit?: (user: PermissionUser) => void;
  onDelete?: (user: PermissionUser) => void;
  onRestore?: (user: PermissionUser) => void;
  onRowClick?: (user: PermissionUser) => void;
  roleId?: string | number;
  successModal?: {
    isOpen: boolean;
    title: string;
    subtext: string;
    buttonText?: string;
    onSubmit: () => void;
    isSubmitting?: boolean;
  };
};

const ITEMS_PER_PAGE = 10;

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
  const displayStatus = active ? "Active" : "Archived";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs lg:text-base font-medium ${active
        ? "bg-[#D4FFE4] text-[#16A34A]" // Light green background with dark green text (Vuexy Style)
        : "bg-[#FEF3F2] text-[#B42318]" // Light red background with dark red text (Vuexy Style)
        }`}
    >
      {displayStatus}
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
    date: format(date, "d, MMMM yyyy"),
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
  sortOrder = "desc",
  isLoading = false,
  error = "",
  onEdit,
  onDelete,
  onRestore,
  onRowClick,
  roleId,
  successModal,
}: PermissionUsersTableProps) {
  const { isDark } = useResolvedTheme();
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

  // Accordion state tracking for mobile card rows
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      sort_by: "created_at",
      order: sortOrder,
    };

    if (roleId != null && String(roleId).trim()) {
      params.role_id = roleId;
    }

    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }

    if (statusFilter === "active") params.status = 1;
    if (statusFilter === "in-active") params.status = 0;

    if (monthFilter !== "all") {
      const numericValue = parseInt(monthFilter, 10);

      if (!isNaN(numericValue)) {
        params.month = numericValue;
      } else {
        const monthValue = monthToNumber[monthFilter.toLowerCase()];
        if (monthValue) {
          params.month = monthValue;
        }
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
  }, [debouncedSearchQuery, monthFilter, roleFilter, roleId, users, statusFilter, sortOrder]);

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

  const shellClass = isDark
    ? "overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]"
    : "overflow-hidden rounded-2xl border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]";
  const titleTextClass = isDark ? "text-white" : "text-[#101010]";
  const borderToneClass = isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]";
  const selectTriggerClass = isDark
    ? "border-[#807E7E] bg-[#171717] text-[#C4C4C4] hover:bg-[#252525]"
    : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]";
  const selectContentClass = isDark
    ? "border-[#807E7E] bg-[#171717] text-white"
    : "border-[#E3E3E3] bg-white text-[#323232]";
  const searchClass = isDark
    ? "border-white/20 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
    : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40";
  const rowClass = isDark
    ? "group text-white transition-colors hover:bg-[#202020]"
    : "group text-[#323232] transition-colors hover:bg-black/[0.015]";
  const paginatorSurface = isDark
    ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
    : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]";

  return (
    <>
      <div className={shellClass}>
        <div className={`p-5 ${isDark ? "bg-[#101010]" : "bg-[#FFFCF6]"}`}>
          {/* Table Header Section: Title and Right-aligned Filters */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[26px] w-[3px] rounded-full bg-[#E8D1AB]" />
              <h2 className={`text-base  transition-colors duration-300 ${titleTextClass}`}>All Users</h2>
            </div>

            {/* Horizontal row of pill-shaped filters as per Vuexy/Figma */}
            <div className="lg:ml-auto flex flex-row items-center gap-2 sm:gap-3 lg:ml-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-fit h-7 lg:h-9 min-w-[90px] rounded-full px-4 text-xs lg:text-sm transition focus:ring-0 focus:ring-offset-0 ${selectTriggerClass}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="in-active">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className={`w-fit h-7 lg:h-9 min-w-[90px] rounded-full px-4 text-xs lg:text-sm transition focus:ring-0 focus:ring-offset-0 ${selectTriggerClass}`}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
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
                <SelectTrigger className={`w-fit h-7 lg:h-9 min-w-[70px] rounded-full px-4 text-xs lg:text-sm transition focus:ring-0 focus:ring-offset-0 ${selectTriggerClass}`}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
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
          <div className="relative mt-3 lg:mt-5">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`}
              size={18}
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${searchClass}`}
            />
          </div>
        </div>

        {/* LOADING & ERROR BOUNDS FOR BOTH MOBILE AND DESKTOP VIEWS */}
        {showLoading && (
          <div className={`px-4 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
            Loading users...
          </div>
        )}

        {!showLoading && !!showError && (
          <div className="px-4 py-10 text-center text-red-300/80">
            {showError}
          </div>
        )}

        {!showLoading && !showError && filteredUsers.length === 0 && (
          <div className={`px-4 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
            No users found.
          </div>
        )}

        {!showLoading && !showError && filteredUsers.length > 0 && (
          <>
            {/* DESKTOP TABLE VIEW (≥ 1024px) */}
            <div className="hidden lg:block w-full">
              <table className={`w-full table-fixed border-collapse border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}>
                <thead>
                  <tr className={`border-b text-left text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
                    {/* <th className="w-[5%] px-4 py-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                />
              </th> */}
                    <th className="w-[25%] px-4 py-4 rounded-bl-xl">Names</th>
                    <th className="w-[16%] px-4 py-4">Roles</th>
                    <th className="w-[14%] px-4 py-4">Created</th>
                    <th className="w-[14%] px-4 py-4">Updated</th>
                    <th className="w-[11%] px-4 py-4">Status</th>
                    <th className="w-[15%] px-4 py-4 text-right rounded-br-xl">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`${rowClass} last:border-b-0 ${canOpenUser && user.status === "Active" ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => {
                        if (user.status !== "Active") return;
                        onRowClick?.(user);
                      }}
                    >
                      {/* <td className="px-4 py-5">
                        <Checkbox
                          checked={selectedRows.includes(user.id)}
                          onCheckedChange={(value) => toggleOne(user.id, value === true)}
                          onClick={(event) => event.stopPropagation()}
                          className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
                        />
                      </td> */}
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${user.badgeTone}`}
                          >
                            {user.badge}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-base font-bold transition-colors ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-[#101010] group-hover:text-[#8E6A2A]"}`}>
                              {user.name}
                            </p>
                            <p className={`mt-1 truncate text-[12px] ${isDark ? "text-white/40" : "text-[#32323266]"}`}>{user.subtitle}</p>
                            {user.status !== "Active" && user.deleted_by_name ? (
                              <p className="mt-1 truncate text-[12px] text-[#EA5455]/80">
                                Deleted by {user.deleted_by_name}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Roles column: Plain text with chevron as per Figma design (No background pill) */}
                      <td className="px-4 py-5">
                        <div className={`flex items-center gap-2 truncate text-sm font-medium ${isDark ? "text-white/90" : "text-[#323232]"}`}>
                          <span className="truncate">{user.role}</span>
                        </div>
                      </td>

                      <td className={`px-4 py-5 text-sm ${isDark ? "text-white/60" : "text-[#32323299]"}`}>
                        <div className="flex flex-col leading-tight">
                          <span>{formatDateParts(user.created).date}</span>
                          <span className="text-[12px] text-white/35">{formatDateParts(user.created).time}</span>
                        </div>
                      </td>

                      <td className={`px-4 py-5 text-sm ${isDark ? "text-white/60" : "text-[#32323299]"}`}>
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
                            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition ${isDark ? "bg-white/5 text-white/60 hover:bg-[#E8D1AB]/10 hover:text-[#E8D1AB]" : "bg-black/[0.04] text-[#32323299] hover:bg-[#E8D1AB]/10 hover:text-[#8E6A2A]"}`}
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
                            title={user.status === "Active" ? "Edit user" : "Archived users cannot be edited"}
                            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" : "bg-black/[0.04] text-[#32323299] hover:bg-black/[0.08] hover:text-[#101010]"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (user.status !== "Active") return;
                              onEdit?.(user);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          {user.status !== "Active" ? (
                            <button
                              type="button"
                              disabled={!onRestore}
                              title="Restore user"
                              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-white/5 text-white/60 hover:bg-[#28C76F]/10 hover:text-[#28C76F]" : "bg-black/[0.04] text-[#32323299] hover:bg-[#28C76F]/10 hover:text-[#28C76F]"}`}
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
                              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-white/5 text-white/60 hover:bg-red-500/10 hover:text-red-400" : "bg-black/[0.04] text-[#32323299] hover:bg-red-500/10 hover:text-red-500"}`}
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
                            title={user.status === "Active" ? "Open details" : "Archived users do not open details"}
                            className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white" : "bg-black/[0.04] text-[#32323299] hover:bg-black/[0.08] hover:text-[#101010]"}`}
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

            {/* MOBILE LIST ACCORDION VIEW (< 1024px) */}
            <div className={`block lg:hidden w-full `}>
              <div className={`flex justify-between p-5 rounded-b-xl border-y text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
                <p>Name</p>
                <p>Status</p>
              </div>
              {paginatedUsers.map((user) => {
                const isExpanded = expandedRowId === user.id;
                return (
                  <div
                    key={user.id}
                    className={`p-5 transition-colors ${isDark ? "text-white" : "text-[#323232]"} ${isExpanded ? (isDark ? "bg-[#202020]" : "bg-[#F9F9F9]") : "bg-transparent"}`}
                  >
                    {/* Primary Row Header: User details, status & expand trigger */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedRowId(isExpanded ? null : user.id)}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className={`flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 border ${isDark ? "border-[#777674] text-[#777674]" : "border-[32323299] text-[#32323299]"} ${isExpanded ? "rotate-180 border-[#E8D1AB]" : "rotate-0"}`}
                        >
                          <ChevronDown size={16} />
                        </button>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium ${user.badgeTone}`}>
                            {user.badge}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm ${isDark ? "text-white" : "text-[#101010]"}`}>
                              {user.name}
                            </p>
                            {/* <p className={`truncate text-xs ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
                              {user.subtitle}
                            </p> */}
                          </div>
                        </div>
                      </div>

                      <StatusPill status={user.status} />
                    </div>

                    {/* Expandable Panel Detail Segment */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 space-y-4 min-w-0">
                        <div className="grid grid-cols-2 gap-y-4 text-xs">
                          {/* Left Grid: Field Key labels */}
                          <div className={`space-y-1`}>
                            <p className={`text-xs font-medium`}>Role</p>
                            <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                              {user.role}
                            </p>
                          </div>
                          <div className={`space-y-1 text-right`}>
                            <p className={`text-xs font-medium`}>Email Id</p>
                            <p className={`text-sm truncate ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{user.subtitle}</p>
                          </div>
                          <div className={`space-y-1`}>
                            <p className={`text-xs font-medium`}>Created</p>
                            <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                              {formatDateParts(user.created).date}
                              <br />
                              {formatDateParts(user.created).time}
                            </p>
                          </div>
                          <div className={`space-y-1 text-right`}>
                            <p className={`text-xs font-medium`}>Updated</p>
                            <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                              {formatDateParts(user.updated).date}
                              <br />
                              {formatDateParts(user.updated).time}
                            </p>
                          </div>
                          <div className={`space-y-1`}>
                            <p className={`text-xs font-medium`}>Action</p>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                title="View user history"
                                className={`flex h-9 items-center justify-center gap-2 transition ${isDark ? "text-white" : "text-black/80"}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setHistoryUser(user);
                                }}
                              >
                                <History size={20} />
                              </button>

                              <button
                                type="button"
                                disabled={!onEdit || user.status !== "Active"}
                                title={user.status === "Active" ? "Edit user" : "Archived users cannot be edited"}
                                className={`flex h-9 items-center justify-center gap-2 transition ${isDark ? "text-white" : "text-black/80"}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (user.status !== "Active") return;
                                  onEdit?.(user);
                                }}
                              >
                                <Pencil size={20} />
                              </button>

                              {user.status !== "Active" ? (
                                <button
                                  type="button"
                                  disabled={!onRestore}
                                  className={`flex h-9 items-center justify-center gap-2 transition ${isDark ? "text-white" : "text-black/80"}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRestore?.(user);
                                  }}
                                >
                                  <RotateCcw size={20} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!onDelete}
                                  className={`flex h-9 items-center justify-center gap-2 transition ${isDark ? "text-white" : "text-black/80"}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onDelete?.(user);
                                  }}
                                >
                                  <Trash2 size={20} />
                                </button>

                              )}
                              <button
                                type="button"
                                disabled={!canOpenUser || user.status !== "Active"}
                                title={user.status === "Active" ? "Open details" : "Archived users do not open details"}
                                className={`flex h-9 items-center justify-center gap-2 transition ${isDark ? "text-white" : "text-black/80"}`}
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
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && !error && filteredUsers.length > 0 ? (
          <div className={`flex flex-col gap-4 border-t px-6 py-5 lg:flex-row lg:items-center lg:justify-between ${borderToneClass}`}>
            <p className={`hidden lg:block text-sm ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </p>

            {totalPages > 1 ? (
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-end w-full max-w-full min-w-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className={`inline-flex items-center justify-center rounded-lg border p-2  text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${paginatorSurface}`}
                >
                  <ChevronLeft className="w-4 h-4" />
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
                      className={`flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${safeCurrentPage === item
                        ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#111111]"
                        : paginatorSurface
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
                  className={`inline-flex items-center justify-center rounded-lg border p-2  text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${paginatorSurface}`}
                >
                 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {successModal ? (
        <ActionSuccessModal
          isOpen={successModal.isOpen}
          onSubmit={successModal.onSubmit}
          isSubmitting={successModal.isSubmitting}
          title={successModal.title}
          subtext={successModal.subtext}
          buttonText={successModal.buttonText ?? "Done"}
        />
      ) : null}
      {historyUser ? (
        <div className={`fixed inset-0 z-50 ${isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/30 backdrop-blur-[2px]"}`} onClick={() => setHistoryUser(null)}>
          <aside
            className={`ml-auto flex h-full w-full max-w-full lg:max-w-[50%] flex-col border-l shadow-[0_24px_80px_rgba(0,0,0,0.65)] ${isDark
              ? "border-white/[0.07] bg-[#0d0d0d] text-white"
              : "border-[#E3E3E3] bg-white text-[#323232]"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-[22px] pb-5 pt-[22px] border-b ${isDark ? "border-white/[0.08]" : "border-[#E3E3E3]"}`}>
              <h2 className="text-[19px] font-bold tracking-[-0.3px]">Archive Users History</h2>
              <button
                type="button"
                onClick={() => setHistoryUser(null)}
                className={`flex h-[38px] w-[38px] items-center justify-center rounded-full transition ${isDark ? "bg-white/[0.09] text-white/55 hover:bg-white/15 hover:text-white" : "bg-[#F0F0F0] text-[#32323299] hover:bg-[#E8E8E8] hover:text-[#101010]"
                  }`}
                aria-label="Close"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
              {selectedUserHistoryGroups.length > 0 ? (
                selectedUserHistoryGroups.map(({ deleted, restored }) => {
                  const deletedTime = formatDateParts(deleted.created_at || "");
                  const restoredTime = restored ? formatDateParts(restored.created_at || "") : null;
                  const deletedBy = deleted.performed_by_name || "Admin";
                  const deletedRole = deleted.performed_by_role ? ` – ${deleted.performed_by_role}` : "";
                  const restoredBy = restored?.performed_by_name || "Admin";

                  return (
                    <div key={deleted.history_id} className={`relative rounded-[14px] border p-4 ${isDark ? "border-white/[0.07] bg-[#1a1a1a]" : "border-[#E3E3E3] bg-[#FAFAFA]"}`}>
                      <div className="relative z-10 flex items-start gap-[13px]">

                        {/* Left col: avatar */}
                        <div className="relative z-10 flex w-[46px] shrink-0 flex-col items-center self-stretch">
                          <div className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-sm font-bold tracking-[0.3px] ${deleted.badgeTone}`}>
                            {deleted.avatarUrl
                              ? <img src={deleted.avatarUrl} alt={deleted.userName} className="h-full w-full object-cover" />
                              : deleted.badge
                            }
                          </div>
                        </div>

                        {/* Right col: text + restore card */}
                        <div className="relative z-10 flex-1 min-w-0 pt-px">
                          <p className={`text-[13.5px] font-medium leading-[1.5] ${isDark ? "text-white/90" : "text-[#101010]"}`}>
                            {deleted.userName} was deleted by {deletedBy}
                            <span className="text-[#C9A96E]">{deletedRole}</span>
                          </p>
                          <p className={`mt-1 text-[11.5px] ${isDark ? "text-white/32" : "text-[#32323266]"}`}>
                            {deletedTime.date} <span className="mx-1 opacity-50">•</span> {deletedTime.time || "N/A"}
                          </p>

                          {restored && restoredTime && (
                            <div className="relative mt-4">

                              <svg
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-[59px] top-[-58px] z-0 h-[90px] w-[165px]"
                                viewBox="0 0 165 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M 23 35 V 72 Q 23 82 33 82 H 165"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.15)"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              <div className={`relative z-10 ml-[32px] flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 ${isDark ? "border-white/[0.07] bg-[#131313]" : "border-[#E3E3E3] bg-white"}`}>
                                <div className={`h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[8px] ${isDark ? "bg-white/[0.08]" : "bg-black/[0.04]"}`}>
                                  {restored.avatarUrl
                                    ? <img src={restored.avatarUrl} alt={restoredBy} className="h-full w-full object-cover" />
                                    : <div className={`flex h-full w-full items-center justify-center text-[10px] font-bold ${isDark ? "text-white/50" : "text-[#32323280]"}`}>{restoredBy.slice(0, 2).toUpperCase()}</div>
                                  }
                                </div>
                                <div>
                                  <p className={`text-[11.5px] font-medium ${isDark ? "text-white/80" : "text-[#101010]"}`}>
                                    {restored.userName} was restored by {restoredBy}
                                  </p>
                                  <p className={`mt-0.5 text-[10.5px] ${isDark ? "text-white/28" : "text-[#32323266]"}`}>
                                    {restoredTime.date} <span className="mx-[3px] opacity-40">•</span> {restoredTime.time || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`flex h-full flex-col items-center justify-center rounded-lg border px-6 text-center ${isDark ? "border-[#333] bg-white/[0.02]" : "border-[#E3E3E3] bg-white"}`}>
                  <History size={28} className="text-[#C9A96E]" />
                  <p className={`mt-3 text-sm font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>No archive history found</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/40" : "text-[#32323266]"}`}>This user has not been deleted or restored yet.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}