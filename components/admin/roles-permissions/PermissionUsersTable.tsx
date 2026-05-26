"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PermissionStatus,
  PermissionUser,
} from "@/components/admin/roles-permissions/types";

type PermissionUsersTableProps = {
  users: PermissionUser[];
  isLoading?: boolean;
  error?: string;
  onEdit?: (user: PermissionUser) => void;
  onDelete?: (user: PermissionUser) => void;
  onRowClick?: (user: PermissionUser) => void;
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

export function PermissionUsersTable({
  users,
  isLoading = false,
  error = "",
  onEdit,
  onDelete,
  onRowClick,
}: PermissionUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesRole =
        roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesMonth =
        monthFilter === "all" ||
        user.subtitle.toLowerCase().includes(monthFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesRole && matchesMonth;
    });
  }, [monthFilter, roleFilter, searchQuery, statusFilter, users]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role).filter(Boolean))).sort();
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const paginationItems = buildPaginationItems(safeCurrentPage, totalPages);
  const canOpenUser = Boolean(onEdit || onRowClick);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, monthFilter, roleFilter]);

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

  return (
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
                <SelectItem value="jan">Jan</SelectItem>
                <SelectItem value="feb">Feb</SelectItem>
                <SelectItem value="mar">Mar</SelectItem>
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-left text-[14px] font-semibold text-[#D9C8A3]">
              <th className="px-6 py-5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                />
              </th>
              <th className="px-6 py-5">Names</th>
              <th className="px-6 py-5">Roles</th>
              <th className="px-6 py-5">Created</th>
              <th className="px-6 py-5">Updated</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-white/50">
                  Loading users...
                </td>
              </tr>
            )}

            {!isLoading && !!error && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-red-300/80">
                  {error}
                </td>
              </tr>
            )}

            {!isLoading && !error && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-white/50">
                  No users found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className={`group text-white transition-colors hover:bg-white/[0.02] ${
                  canOpenUser ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() => onRowClick?.(user)}
              >
                <td className="px-6 py-6">
                  <Checkbox
                    checked={selectedRows.includes(user.id)}
                    onCheckedChange={(value) => toggleOne(user.id, value === true)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                  />
                </td>

                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold ${user.badgeTone}`}
                    >
                      {user.badge}
                    </div>
                    <div>
                      <p className="text-[16px] font-bold text-white group-hover:text-[#E5D5B8] transition-colors">
                        {user.name}
                      </p>
                      <p className="mt-1 text-[13px] text-white/40">{user.subtitle}</p>
                    </div>
                  </div>
                </td>

                {/* Roles column: Plain text with chevron as per Figma design (No background pill) */}
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-[15px] font-medium text-white/90">
                    <span>{user.role}</span>
                  </div>
                </td>

                <td className="px-6 py-6 text-[15px] text-white/60">
                  {user.created}
                </td>

                <td className="px-6 py-6 text-[15px] text-white/60">
                  {user.updated}
                </td>

                <td className="px-6 py-6">
                  <StatusPill status={user.status} />
                </td>

                <td className="px-6 py-6">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      type="button"
                      disabled={!onEdit}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(user);
                      }}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      disabled={!onDelete}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(user);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      type="button"
                      disabled={!canOpenUser}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (onEdit) {
                          onEdit(user);
                          return;
                        }
                        onRowClick?.(user);
                      }}
                    >
                      <ChevronRight size={20} />
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
  );
}
