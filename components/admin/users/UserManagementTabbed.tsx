"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { getLatestProfilePhoto } from "@/lib/crewFiles";
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { TabsSwitcher } from "../TabsSwitcher";
import Link from "next/link";

type UserType = "All" | "Client" | "Creative Partner";
type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";

const USER_FILTERS_STORAGE_KEY = "admin-users-tabbed-filters";

type PersistedUserFilters = {
  activeTab: UserType;
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
};

interface UserData {
  id: string;
  name: string;
  email: string;
  type: UserType;
  status: UserStatus;
  joinDate: string;
  initials: string;
  phoneNumber?: string;
  role?: string;
  imageUrl?: string | null;
  referralCode?: string | null;
  clientType?: "Registered" | "Guest" | "Not Applicable";
}

type SortConfig = {
  key: keyof UserData;
  direction: 'asc' | 'desc';
} | null;

type UserFetchParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
};

type PaginationData = {
  total_records?: number;
  total_pages?: number;
};

type RawClient = {
  client_id?: string | number;
  id?: string | number;
  name?: string;
  email?: string;
  is_active?: boolean | number;
  created_at?: string;
  phone_number?: string;
  profile_image?: string | null;
  referral_code?: string | null;
  client_type?: string;
};

type CrewMemberFile = {
  file_type?: string;
  file_path?: string;
};

type RawCrewMember = {
  crew_member_id?: string | number;
  id?: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  status?: string;
  created_at?: string;
  role?: {
    role_name?: string;
  };
  crew_member_files?: CrewMemberFile[];
  referral_code?: string | null;
};

const StatusBadge = ({ status }: { status: UserStatus }) => {
  const styles = {
    Active: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
    Approved: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
    Pending: "bg-[#FFF4C9] text-[#BA6605] border-[#B18A00]/20",
    Inactive: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
    Rejected: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

const tabs: { label: string; value: UserType }[] = [
  { label: "All", value: "All" },
  { label: "Users", value: "Client" },
  { label: "Creative Partners", value: "Creative Partner" },
];

const ClientTypeBadge = ({
  clientType,
  isDark,
}: {
  clientType: UserData["clientType"];
  isDark: boolean;
}) => {
  if (clientType === "Registered") {
    return (
      <span className="px-4 py-1.5 rounded-full text-sm font-semibold border bg-[#E7F0FF] text-[#2563EB] border-[#2563EB]/20">
        Registered
      </span>
    );
  }

  if (clientType === "Guest") {
    return (
      <span className="px-4 py-1.5 rounded-full text-sm font-semibold border bg-[#FFF7E8] text-[#C27C2C] border-[#C27C2C]/20">
        Guest
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${isDark ? "bg-white/5 text-[#A1A1AA] border-white/10" : "bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]"}`}>
      Not Applicable
    </span>
  );
};

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

export const UserManagementTabbed = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  const [activeTab, setActiveTab] = useState<UserType>("All");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Accordion state tracking for mobile card rows
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const router = useRouter();

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(USER_FILTERS_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters) as Partial<PersistedUserFilters>;

        if (parsedFilters.activeTab && ["All", "Client", "Creative Partner"].includes(parsedFilters.activeTab)) {
          setActiveTab(parsedFilters.activeTab as UserType);
        }

        if (typeof parsedFilters.searchQuery === "string") {
          setSearchQuery(parsedFilters.searchQuery);
        }

        if (typeof parsedFilters.statusFilter === "string") {
          setStatusFilter(parsedFilters.statusFilter);
        }

        if (typeof parsedFilters.currentPage === "number" && parsedFilters.currentPage > 0) {
          setCurrentPage(parsedFilters.currentPage);
        }
      }
    } catch (error) {
      console.error("Failed to restore user filters:", error);
    } finally {
      setFiltersInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;

    const filtersToPersist: PersistedUserFilters = {
      activeTab,
      currentPage,
      searchQuery,
      statusFilter,
    };

    localStorage.setItem(USER_FILTERS_STORAGE_KEY, JSON.stringify(filtersToPersist));
  }, [activeTab, currentPage, searchQuery, statusFilter, filtersInitialized]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig) return users;

    const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
    const statusRank: Record<UserStatus, number> = {
      Active: 1,
      Approved: 2,
      Pending: 3,
      Inactive: 4,
      Rejected: 5,
    };
    const typeRank: Record<UserType, number> = {
      All: 0,
      Client: 1,
      "Creative Partner": 2,
    };

    const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

    return users
      .map((user, index) => ({ user, index }))
      .sort((aItem, bItem) => {
        const a = aItem.user;
        const b = bItem.user;
        const key = sortConfig.key;
        let compareResult = 0;

        if (key === "id") {
          const aNum = parseInt(String(a.id).replace("#", ""), 10);
          const bNum = parseInt(String(b.id).replace("#", ""), 10);
          compareResult = (isNaN(aNum) ? 0 : aNum) - (isNaN(bNum) ? 0 : bNum);
        } else if (key === "status") {
          compareResult = (statusRank[a.status] ?? 999) - (statusRank[b.status] ?? 999);
        } else if (key === "type") {
          compareResult = (typeRank[a.type] ?? 999) - (typeRank[b.type] ?? 999);
        } else if (key === "joinDate") {
          const aTime = new Date(a.joinDate).getTime() || 0;
          const bTime = new Date(b.joinDate).getTime() || 0;
          compareResult = aTime - bTime;
        } else {
          const aText = normalizeText(a[key]);
          const bText = normalizeText(b[key]);
          compareResult = aText.localeCompare(bText, undefined, {
            sensitivity: "base",
            numeric: true,
          });
        }

        if (compareResult === 0) {
          return aItem.index - bItem.index;
        }
        return compareResult * directionMultiplier;
      })
      .map((item) => item.user);
  }, [users, sortConfig]);

  const requestSort = (key: keyof UserData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof UserData, isDark: boolean) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ?
      <ArrowUp size={14} className={`ml-1 ${isDark ? "text-[#E8D1AB]" : " text-[#666]"}`} /> :
      <ArrowDown size={14} className={`ml-1 ${isDark ? "text-[#E8D1AB]" : " text-[#666]"}`} />;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Filter logic based on requirements
      const isCreativeStatus = ["approved", "pending", "rejected"].includes(statusFilter);
      const isActiveFilter = statusFilter === "active";

      // Determine if we should call the Client API
      const shouldFetchClients =
        activeTab === "Client" ||
        (activeTab === "All" && !isCreativeStatus);

      // Determine if we should call the Creative Partner API
      const shouldFetchCreatives =
        activeTab === "Creative Partner" ||
        (activeTab === "All" && !isActiveFilter);

      const isCombinedAllUsers = shouldFetchClients && shouldFetchCreatives;
      const sourceLimit = isCombinedAllUsers ? Math.ceil(limit / 2) : limit;
      const params: UserFetchParams = { page: currentPage, limit: sourceLimit };
      if (debouncedSearch) params.search = debouncedSearch;

      let allUsers: UserData[] = [];
      let paginationData: PaginationData | null = null;
      let clientTotalRecords = 0;
      let creativeTotalRecords = 0;

      if (shouldFetchClients) {
        const clientsRes = await adminApi.getAdminClients(params);
        if (clientsRes?.data) {
          const clientPagination = clientsRes.pagination as PaginationData | undefined;
          const items = Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.items || []);
          const mapped = items.map((client: RawClient) => ({
            id: `#${client.client_id || client.id}`,
            name: client.name || "Unknown",
            email: client.email || "No Email",
            type: "Client" as UserType,
            status: (client.is_active === 1 || client.is_active === true ? "Active" : "Inactive") as UserStatus,
            joinDate: client.created_at ? new Date(client.created_at).toLocaleDateString() : "N/A",
            initials: (client.name || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            phoneNumber: client.phone_number || "N/A",
            imageUrl: client.profile_image || null,
            referralCode: client.referral_code || null,
            clientType: client?.client_type === "registered" ? "Registered" : "Guest",
          }));
          allUsers = [...allUsers, ...mapped];
          clientTotalRecords = clientPagination?.total_records || mapped.length;
          paginationData = clientPagination || null;
        }
      }

      if (shouldFetchCreatives) {
        const creativeParams = { ...params };
        // If we are in the Creative Tab or All Tab with a specific creative status, pass the status
        if (isCreativeStatus) creativeParams.status = statusFilter;

        const creativeRes = await adminApi.getCrewMembers(creativeParams);
        if (creativeRes?.data) {
          const creativePagination = creativeRes.pagination as PaginationData | undefined;
          const items = Array.isArray(creativeRes.data) ? creativeRes.data : (creativeRes.data.items || []);
          const mapped = items.map((member: RawCrewMember) => {
            const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.name || "Unknown";
            const profilePhoto = getLatestProfilePhoto(member.crew_member_files);
            return {
              id: `#${member.crew_member_id || member.id}`,
              name: fullName,
              email: member.email || "No Email",
              type: "Creative Partner" as UserType,
              status: (member.status?.toLowerCase() === "approved" ? "Approved" :
                member.status?.toLowerCase() === "rejected" ? "Rejected" : "Pending") as UserStatus,
              joinDate: member.created_at ? new Date(member.created_at).toLocaleDateString() : "N/A",
              initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
              role: member.role?.role_name || "N/A",
              imageUrl: profilePhoto ? `${S3_PREFIX}${profilePhoto.file_path}` : null,
              referralCode: member.referral_code || null,
              clientType: "Not Applicable" as const,
            };
          });
          allUsers = [...allUsers, ...mapped];
          creativeTotalRecords = creativePagination?.total_records || mapped.length;
          if (!paginationData) paginationData = creativePagination || null;
        }
      }

      const combinedTotalRecords = clientTotalRecords + creativeTotalRecords;
      const resolvedTotalRecords = isCombinedAllUsers
        ? combinedTotalRecords || allUsers.length
        : paginationData?.total_records || allUsers.length;

      setUsers(allUsers.slice(0, limit));
      setTotalRecords(resolvedTotalRecords);
      setTotalPages(
        isCombinedAllUsers
          ? Math.max(1, Math.ceil(resolvedTotalRecords / limit))
          : paginationData?.total_pages || 1
      );
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, debouncedSearch, limit, statusFilter]);

  useEffect(() => {
    if (!filtersInitialized) return;
    fetchUsers();
  }, [fetchUsers, filtersInitialized]);

  const handleRowClick = (user: UserData) => {
    const cleanId = user.id.replace('#', '');
    router.push(`/admin/users/${user.type === "Client" ? "clients" : "creative-partners"}/${cleanId}`);
  };

  const getUserDetailHref = (user: UserData) => {
    const cleanId = user.id.replace('#', '');
    return `/admin/users/${user.type === "Client" ? "clients" : "creative-partners"}/${cleanId}`;
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      <div>
        <h1 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>User Management</h1>
        <p className={isDark ? "text-[#888]" : "text-[#666]"}>Manage and review all registered users in one place.</p>
      </div>

      {/* Tabs */}
      <TabsSwitcher
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
          setStatusFilter("all");
        }}
      />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 w-full md:flex-1">
          <div className="relative flex-1 w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`} size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${isDark
                ? "border-white/20 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
                : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40"}`}
            />
          </div>

          {/* Conditional Select Rendering */}
          {activeTab !== "Client" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-[180px] rounded-lg h-12 capitalize transition-colors ${isDark ? "border-white/20 bg-[#202020] text-[#C4C4C4] hover:bg-[#252525]" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"}`}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "border-white/20 bg-[#202020] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}>
                <SelectItem value="all">All Status</SelectItem>

                {/* Show Active only on the "All" tab */}
                {activeTab === "All" && (
                  <SelectItem value="active">Active (Clients)</SelectItem>
                )}

                {/* Statuses for Creative Partners */}
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className={isDark
        ? "overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]"
        : "overflow-hidden rounded-2xl border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"}>
        {/* DESKTOP TABLE VIEW (≥ 1024px) */}
        <div className="hidden lg:block w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className={`border-b text-left text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
                  <th className="w-[10%] p-5 font-medium cursor-pointer rounded-bl-xl" onClick={() => requestSort('id')}>
                    <div className="flex items-center gap-1">User ID {getSortIcon('id', isDark)}</div>
                  </th>
                  <th className="w-[20%] p-5 font-medium cursor-pointer" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1">User Name {getSortIcon('name', isDark)}</div>
                  </th>
                  {
                    activeTab == "All" &&
                    <th className="w-[15%] p-5 font-medium cursor-pointer" onClick={() => requestSort('type')}>
                      <div className="flex items-center gap-1">Type {getSortIcon('type', isDark)}</div>
                    </th>
                  }
                  <th className="w-[15%] p-5 font-medium">{activeTab !== "Creative Partner" ? "Contact / Role" : "Role"}</th>
                  <th className="w-[11%] p-5 font-medium cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">Status {getSortIcon('status', isDark)}</div>
                  </th>
                  {
                    activeTab !== "Creative Partner" &&
                    <th className="w-[12%] p-5 font-medium">Client Type</th>
                  }
                  <th className="w-[14%] p-5 font-medium text-center">Referral Code</th>
                  <th className="w-[10%] p-5 font-medium text-right rounded-br-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                    </td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`py-10 text-center text-sm ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user, idx) => {
                    const userDetailHref = getUserDetailHref(user);
                    return (
                      <tr
                        key={user.id || idx}
                        className={`relative ${isDark ? "group text-white transition-colors hover:bg-[#202020]" : "group text-[#323232] transition-colors hover:bg-black/[0.015]"}`}
                      >
                        <td className="relative py-3 px-6">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <span className="relative z-10 pointer-events-none">{user.id}</span>
                        </td>
                        <td className="relative py-3 px-6">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <div className="relative z-10 pointer-events-none flex items-center gap-3 min-w-0">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-bold border overflow-hidden ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                              {user.imageUrl ? (
                                <img src={user.imageUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span>{user.initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-base font-medium transition-colors capitalize ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-[#101010] group-hover:text-[#8E6A2A]"}`}>
                                {user.name}
                              </p>
                              <p className={`mt-1 truncate text-xs ${isDark ? "text-white/40" : "text-[#32323266]"}`}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        {
                          activeTab === "All" &&
                          <td className="relative py-3 px-6">
                            <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                            <div className="relative z-10 pointer-events-none flex items-center gap-2 truncate font-medium">
                              {user.type}
                            </div>
                          </td>
                        }

                        <td className="relative py-3 px-6">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <span className="relative z-10 pointer-events-none">{user.type === "Client" ? user.phoneNumber : user.role}</span>
                        </td>
                        <td className="relative py-3 px-6">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <div className="relative z-10 pointer-events-none inline-block">
                            <StatusBadge status={user.status} />
                          </div>
                        </td>
                        {
                          activeTab !== "Creative Partner" &&
                         <td className="relative py-3 px-6">
                            <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                            <div className="relative z-10 pointer-events-none inline-block">
                              <ClientTypeBadge clientType={user.clientType} isDark={isDark} />
                            </div>
                          </td>
                        }
                        <td className="relative py-3 px-6 text-center">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <div className="relative z-10 pointer-events-none">
                            {user.referralCode ? (
                              <span className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#F5F0E8] text-[#8B7E66]"}`}>{user.referralCode}</span>
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </div>
                        </td>
                        <td className="relative py-3 px-6 text-right">
                          <Link href={userDetailHref} className="absolute inset-0 z-20" aria-label={`Open user ${user.name}`} prefetch={false} />
                          <div className="relative z-10 pointer-events-none flex items-center justify-end">
                            <ChevronRight size={20} className={isDark ? "text-[#666]" : "text-[#999]"} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE LIST ACCORDION VIEW (< 1024px) */}
        <div className="block lg:hidden w-full">
          <div className={`flex justify-between p-5 rounded-b-xl border-y text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
            <p>Name</p>
            <p>Status</p>
          </div>
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className={`animate-spin inline ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className={`px-4 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
              No users found.
            </div>
          ) : (
            sortedUsers.map((user, idx) => {
              const isExpanded = expandedRowId === user.id;
              return (
                <div
                  key={user.id || idx}
                  className={`p-5 transition-colors ${isDark ? "text-white" : "text-[#323232]"} ${isExpanded ? (isDark ? "bg-[#202020]" : "bg-[#F9F9F9]") : "bg-transparent"}`}
                >
                  {/* Clickable Header Segment */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRowId(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-center gap-2 shrink-0 min-w-0">
                      <button
                        type="button"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 border ${isDark ? "border-[#777674] text-[#777674]" : "border-[#32323299] text-[#32323299]"} ${isExpanded ? "rotate-180 border-[#E8D1AB]" : "rotate-0"}`}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold border overflow-hidden ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                          {user.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" alt="" /> : <span>{user.initials}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-sm ${isDark ? "text-white" : "text-[#101010]"}`}>
                            {user.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={user.status} />
                  </div>

                  {/* Expandable Details Frame Grid */}
                  {isExpanded && (
                    <div className="pt-4 space-y-4 min-w-0">
                      {/* Upper Section Grid for Standard 2-Column Fields */}
                      <div className="grid grid-cols-2 gap-y-4 text-xs">
                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>User ID</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{user.id}</p>
                        </div>

                        {/* Conditional Column Check: Type */}
                        {activeTab === "All" && (
                          <div className="space-y-1 text-right">
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Type</p>
                            <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{user.type}</p>
                          </div>
                        )}

                        <div className={`space-y-1 ${activeTab === "All" ? "" : "text-right"}`}>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {activeTab !== "Creative Partner" ? "Contact / Role" : "Role"}
                          </p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                            {user.type === "Client" ? user.phoneNumber : user.role}
                          </p>
                        </div>

                        {/* Conditional Column Check: Client Type */}
                        {activeTab !== "Creative Partner" && (
                          <div className={`space-y-1 ${activeTab === "All" ? "text-right" : ""}`}>
                            <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Client Type</p>
                            <div className={`flex mt-0.5 ${activeTab === "All" ? "justify-end" : ""}`}>
                              <ClientTypeBadge clientType={user.clientType} isDark={isDark} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Email Breakout Zone (Rendered dynamically outside of the grids to prevent column misalignments) */}
                      {activeTab === "All" && (
                        <div className="space-y-1 text-xs">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Email</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{user.email}</p>
                        </div>
                      )}

                      {activeTab !== "All" && (
                        <div className="space-y-1 text-xs">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Email</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{user.email}</p>
                        </div>
                      )}

                      {/* Lower Section Grid for Bottom Fields */}
                      <div className="grid grid-cols-2 gap-y-4 text-xs">
                        <div className={`space-y-1`}>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Referral Code</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                            {user.referralCode || "—"}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Action</p>
                          <button
                            type="button"
                            onClick={() => handleRowClick(user)}
                            className={`inline-flex items-center gap-1 text-xs font-semibold underline mt-1 ${isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]"}`}
                          >
                            Open Details <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                  }
                </div>
              );
            })
          )}
        </div>

        {/* Shared Footer Pagination Wrapper Zone */}
        {!loading && totalPages > 1 && (
          <div className={`flex flex-col gap-4 border-t px-6 py-3 lg:flex-row lg:items-center lg:justify-between ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <p className={`hidden lg:block text-sm whitespace-nowrap ${isDark ? "text-white/40" : "text-[#32323266]"}`}>
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
            </p>

            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-end w-full max-w-full min-w-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark
                  ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {(() => {
                const rangePages = [];
                const delta = 1;
                const left = currentPage - delta;
                const right = currentPage + delta + 1;

                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= left && i < right)) {
                    rangePages.push(i);
                  } else if (i === left - 1 || i === right) {
                    rangePages.push('...');
                  }
                }

                return rangePages.filter((val, index, arr) => val !== '...' || arr[index - 1] !== '...').map((page, index) => (
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-10 w-10 items-center justify-center text-sm text-white/30"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page as number)}
                      className={`flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${currentPage === page
                        ? "border-[#E8D1AB] bg-[#E8D1AB] text-[#111111]"
                        : (isDark
                          ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                          : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]")
                        }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center justify-center rounded-lg border p-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${isDark
                  ? "border-white/10 bg-[#171717] text-[#6D6D6D] hover:bg-white/[0.06] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-black/[0.03] hover:text-[#101010]"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};
