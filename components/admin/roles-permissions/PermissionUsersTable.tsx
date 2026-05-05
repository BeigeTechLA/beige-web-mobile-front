"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
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
  onEdit?: (user: PermissionUser) => void;
};

function StatusPill({ status }: { status: PermissionStatus }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex min-w-[102px] justify-center rounded-full px-4 py-2 text-sm font-medium ${
        active
          ? "bg-[#D4F9DB] text-[#1EAD52]"
          : "bg-[#FBEFEF] text-[#D4472D]"
      }`}
    >
      {status}
    </span>
  );
}

export function PermissionUsersTable({
  users,
  onEdit,
}: PermissionUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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

  const allSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedRows.includes(user.id));

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? filteredUsers.map((user) => user.id) : []);
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedRows((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  };

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#111111]">
      <div className="border-b border-white/10 px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-[3px] rounded-full bg-[#E5D5B8]" />
            <h2 className="text-[18px] font-medium text-white">All Users</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[78px] rounded-full border-white/10 bg-[#171717] px-3 text-xs text-white/80">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in-active">In-Active</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-9 w-[78px] rounded-full border-white/10 bg-[#171717] px-3 text-xs text-white/80">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Month</SelectItem>
                <SelectItem value="jan">Jan</SelectItem>
                <SelectItem value="feb">Feb</SelectItem>
                <SelectItem value="mar">Mar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[62px] rounded-full border-white/10 bg-[#171717] px-3 text-xs text-white/80">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#222222] pl-11 pr-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-[#E5D5B8]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1140px] w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-[15px] text-[#D9C8A3]">
              <th className="px-5 py-5 lg:px-6">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => toggleAll(value === true)}
                  className="h-6 w-6 rounded-md border-white/30 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                />
              </th>
              <th className="px-5 py-5 font-medium lg:px-6">Names</th>
              <th className="px-5 py-5 font-medium lg:px-6">Roles</th>
              <th className="px-5 py-5 font-medium lg:px-6">Created</th>
              <th className="px-5 py-5 font-medium lg:px-6">Updated</th>
              <th className="px-5 py-5 font-medium lg:px-6">Status</th>
              <th className="px-5 py-5 font-medium lg:px-6 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/6 text-white transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-5 align-middle lg:px-6">
                  <Checkbox
                    checked={selectedRows.includes(user.id)}
                    onCheckedChange={(value) => toggleOne(user.id, value === true)}
                    className="h-6 w-6 rounded-md border-white/30 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                  />
                </td>

                <td className="px-5 py-5 lg:px-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl text-[18px] font-medium ${user.badgeTone}`}
                    >
                      {user.badge}
                    </div>
                    <div>
                      <p className="text-[18px] font-medium">{user.name}</p>
                      <p className="mt-1 text-sm text-white/38">{user.subtitle}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-5 lg:px-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-[18px] text-white"
                  >
                    <span>{user.role}</span>
                    <ChevronDown size={16} className="text-white/55" />
                  </button>
                </td>

                <td className="px-5 py-5 text-[16px] text-white/80 lg:px-6">
                  {user.created}
                </td>

                <td className="px-5 py-5 text-[16px] text-white/80 lg:px-6">
                  {user.updated}
                </td>

                <td className="px-5 py-5 lg:px-6">
                  <StatusPill status={user.status} />
                </td>

                <td className="px-5 py-5 lg:px-6">
                  <div className="flex items-center justify-end gap-5 text-white/80">
                    <button
                      type="button"
                      className="transition hover:text-white"
                      onClick={() => onEdit?.(user)}
                    >
                      <Pencil size={22} />
                    </button>
                    <button type="button" className="transition hover:text-white">
                      <Trash2 size={22} />
                    </button>
                    <button
                      type="button"
                      className="transition hover:text-white"
                      onClick={() => onEdit?.(user)}
                    >
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
