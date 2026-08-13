"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Download, Loader2, ArrowUpToLine, ChevronLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SortDateButton } from "@/components/admin/SortDateButton"; // Re-added your theme component
import {
  format,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/Datepicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useTheme } from 'next-themes';
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import ActionSuccessModal from "@/components/admin/ActionSuccessModal";
import { TabsSwitcher } from "../TabsSwitcher";
import Link from "next/link";

type UserStatus = "Active" | "Inactive" | "Pending" | "Approved" | "Rejected";
type ClientsTab = "active" | "all" | "archived";

const CLIENTS_FILTERS_STORAGE_KEY = "admin-users-clients-filters";

type PersistedClientsFilters = {
  currentPage: number;
  range: string;
  selectedDate: string | null;
  searchQuery: string;
  statusFilter: string;
  activeTab: ClientsTab;
};

interface Client {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  joinDate: string;
  initials: string;
  phoneNumber: string;
  imageUrl?: string | null;
  referralCode?: string | null;
  clientType?: "guest" | "registered";
  isArchived?: boolean;
}

const StatusBadge = ({ status }: { status: UserStatus }) => {
  const styles = {
    Active: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
    Approved: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]/20",
    Pending: "bg-[#FFF4C9] text-[#BA6605] border-[#B18A00]/20",
    Inactive: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
    Archived: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
    Rejected: "bg-[#FEF3F2] text-[#B42318] border-[#FEF3F2]/20",
  };
  const displayStatus = styles[status] ? status : "Pending";
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium border ${styles[displayStatus as keyof typeof styles]}`}>
      {status}
    </span>
  );
};

const tabs: { label: string; value: ClientsTab }[] = [
  { label: "All Clients", value: "all" },
  { label: "Active Clients", value: "active" },
  { label: "Archived Clients", value: "archived" },
];

const ClientTypeBadge = ({ type }: { type?: "guest" | "registered" }) => {
  const normalized = type === "registered" ? "registered" : "guest";
  const label = normalized === "registered" ? "Registered" : "Guest";
  const styles = normalized === "registered"
    ? "bg-[#E8F2FF] text-[#246BCE] border-[#246BCE]/20"
    : "bg-[#FFF4E5] text-[#B66A00] border-[#B66A00]/20";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  );
};

export const ClientsTable = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<ClientsTab>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [selectedClientIsArchived, setSelectedClientIsArchived] = useState(false);
  const [isProcessingClientAction, setIsProcessingClientAction] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [completedAction, setCompletedAction] = useState<"delete" | "restore" | null>(null);
  const [completedClientName, setCompletedClientName] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Accordion state tracking for mobile card rows
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [exportStartDate, setExportStartDate] =
    useState<Date | null>(null);

  const [exportEndDate, setExportEndDate] =
    useState<Date | null>(null);

  // --- DATE FILTER STATES ---
  const [range, setRange] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const router = useRouter();

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(CLIENTS_FILTERS_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters) as Partial<PersistedClientsFilters>;

        if (typeof parsedFilters.searchQuery === "string") {
          setSearchQuery(parsedFilters.searchQuery);
        }

        if (typeof parsedFilters.statusFilter === "string") {
          setStatusFilter(parsedFilters.statusFilter);
        }

        if (typeof parsedFilters.range === "string") {
          setRange(parsedFilters.range);
        }

        if (typeof parsedFilters.selectedDate === "string") {
          const restoredDate = new Date(parsedFilters.selectedDate);
          if (!Number.isNaN(restoredDate.getTime())) {
            setSelectedDate(restoredDate);
          }
        }

        if (typeof parsedFilters.currentPage === "number" && parsedFilters.currentPage > 0) {
          setCurrentPage(parsedFilters.currentPage);
        }

        if (parsedFilters.activeTab && ["all", "active", "archived"].includes(parsedFilters.activeTab)) {
          setActiveTab(parsedFilters.activeTab as ClientsTab);
        }
      }
    } catch (error) {
      console.error("Failed to restore client filters:", error);
    } finally {
      setFiltersInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;

    const filtersToPersist: PersistedClientsFilters = {
      currentPage,
      range,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      searchQuery,
      statusFilter,
      activeTab,
    };

    localStorage.setItem(CLIENTS_FILTERS_STORAGE_KEY, JSON.stringify(filtersToPersist));
  }, [currentPage, range, selectedDate, searchQuery, statusFilter, activeTab, filtersInitialized]);

  // Handle single date selection from theme datepicker
  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setRange("custom");
    } else {
      setRange("all");
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: limit,
        };

        if (range !== "all") {
          params.range = range;
        }

        if (activeTab === "all") {
          params.include_archived = true;
        } else if (activeTab === "archived") {
          params.archived_only = true;
        }

        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== "all") params.status = statusFilter;

        // If custom date is picked via SortDateButton, send it as start/end
        if (range === "custom" && selectedDate) {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          params.start_date = formattedDate;
          params.end_date = formattedDate;
        }

        const response = await adminApi.getAdminClients(params);
        if (response && response.data) {
          const pagination = response.pagination;
          setTotalRecords(pagination?.total_records || 0);
          setTotalPages(pagination?.total_pages || 1);

          const data = Array.isArray(response.data) ? response.data : (response.data.items || []);

          const mappedClients = data.map((client: any) => {
            const fullName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || "Unknown";
            const archivedIndicator = client.is_archived ?? client.archived ?? client.is_deleted ?? client.deleted_at ?? client.client_status ?? client.status;
            const statusMapping = (val: any) => {
              if (val === 1 || val === "Active" || val === "approved") return "Active";
              if (val === 0 || val === "Inactive" || val === "rejected") return "Archived";
              if (String(val).toLowerCase() === "archived") return "Inactive";
              return "Pending";
            };

            return {
              id: `#${client.client_id || client.id || client.user_id}`,
              name: fullName,
              email: client.email || "No Email",
              status: statusMapping(client.status || client.is_active),
              joinDate: client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : "N/A",
              initials: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
              phoneNumber: client.phone_number || "N/A",
              imageUrl: client.profile_image || client.image || null,
              referralCode: client.referral_code || null,
              clientType: (client.client_type === "registered" ? "registered" : "guest"),
              isArchived:
                archivedIndicator === true ||
                archivedIndicator === 1 ||
                String(archivedIndicator).toLowerCase() === "archived" ||
                String(archivedIndicator).toLowerCase() === "deleted" ||
                String(archivedIndicator).toLowerCase() === "inactive" && Boolean(client.deleted_at),
            };
          });
          setClients(mappedClients);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    if (!filtersInitialized) return;
    fetchClients();
  }, [activeTab, currentPage, limit, debouncedSearch, statusFilter, range, selectedDate, filtersInitialized, refreshKey]);

  // const handleRowClick = (id: string) => {
  //     // const cleanId = id.replace('#', '');
  //     // router.push(`/admin/users/clients/${cleanId}`);
  // };

  const handleRowClick = (id: string) => {
    const cleanId = id.replace('#', '');
    router.push(`/admin/users/clients/${cleanId}`);
  };
  const getClientDetailHref = (id: string) => {
    const cleanId = id.replace('#', '');
    return `/admin/users/clients/${cleanId}`;
  };

  const handleTabChange = (tab: ClientsTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleActionClick = (client: Client, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedClient(client);
    setSelectedClientIsArchived(Boolean(client.isArchived));
    setIsActionModalOpen(true);
  };

  const handleConfirmClientAction = async () => {
    if (!selectedClient) return;

    const cleanId = selectedClient.id.replace("#", "");
    setIsProcessingClientAction(true);

    try {
      const response = selectedClientIsArchived
        ? await adminApi.restoreClient(cleanId)
        : await adminApi.deleteClient(cleanId);

      if (response && response.success !== false) {
        setIsActionModalOpen(false);
        setSelectedClient(null);
        setSelectedClientIsArchived(false);
        setCompletedAction(selectedClientIsArchived ? "restore" : "delete");
        setCompletedClientName(selectedClient.name);
        setIsSuccessModalOpen(true);
        setRefreshKey((current) => current + 1);
      } else {
        const friendlyMessage = selectedClientIsArchived
          ? "Unable to restore this client because the account is linked to an active creative partner profile."
          : "Unable to delete this client right now. Please try again.";

        toast.error(
          friendlyMessage
        );
        console.error("Client action failed:", response);
      }
    } catch (error) {
      console.error("Client action error:", error);
      toast.error(
        selectedClientIsArchived
          ? "Unable to restore this client right now."
          : "Unable to delete this client right now."
      );
    } finally {
      setIsProcessingClientAction(false);
    }
  };
  const handleExportClients = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStartDate(null);
    setExportEndDate(null);

    try {
      const startDate = exportStartDate;
      const endDate = exportEndDate;

      if (Boolean(startDate) !== Boolean(endDate)) {
        throw new Error("Select both dates or leave both blank to export all records.");
      }
      const hasExportDateRange = Boolean(startDate && endDate);

      const exportParams: {
        start_date?: string;
        end_date?: string;
        status?: string;
        search?: string;
      } = {
        status:
          activeTab === "archived"
            ? "archived"
            : activeTab === "active"
              ? "active"
              : "all",
        search: searchQuery.trim() || undefined,
      };

      if (
        !hasExportDateRange &&
        range === "custom" &&
        selectedDate
      ) {
        const formattedSelectedDate = format(
          selectedDate,
          "yyyy-MM-dd"
        );

        exportParams.start_date = formattedSelectedDate;
        exportParams.end_date = formattedSelectedDate;
      }
      let fileName = "clients-all-records.csv";


      if (!hasExportDateRange) {
        const today = new Date();

        if (range === "week") {
          exportParams.start_date = format(
            startOfWeek(today, { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );

          exportParams.end_date = format(
            endOfWeek(today, { weekStartsOn: 1 }),
            "yyyy-MM-dd"
          );
        }

        if (range === "month") {
          exportParams.start_date = format(
            startOfMonth(today),
            "yyyy-MM-dd"
          );

          exportParams.end_date = format(
            endOfMonth(today),
            "yyyy-MM-dd"
          );
        }

        if (range === "year") {
          exportParams.start_date = format(
            startOfYear(today),
            "yyyy-MM-dd"
          );

          exportParams.end_date = format(
            endOfYear(today),
            "yyyy-MM-dd"
          );
        }

        if (range === "custom" && selectedDate) {
          const formattedSelectedDate = format(
            selectedDate,
            "yyyy-MM-dd"
          );

          exportParams.start_date = formattedSelectedDate;
          exportParams.end_date = formattedSelectedDate;
        }
      }

      if (startDate && endDate) {
        const normalizedStartDate = startOfDay(startDate);
        const normalizedEndDate = startOfDay(endDate);
        const today = startOfDay(new Date());

        if (
          normalizedStartDate > today ||
          normalizedEndDate > today
        ) {
          throw new Error("Future dates are not allowed.");
        }

        if (normalizedStartDate > normalizedEndDate) {
          throw new Error("Start date cannot be after end date.");
        }

        const formattedStartDate = format(
          normalizedStartDate,
          "yyyy-MM-dd"
        );

        const formattedEndDate = format(
          normalizedEndDate,
          "yyyy-MM-dd"
        );

        exportParams.start_date = formattedStartDate;
        exportParams.end_date = formattedEndDate;
        fileName = `clients-${formattedStartDate}-to-${formattedEndDate}.csv`;
      }

      const blob = await adminApi.exportClientsCsv({
        ...exportParams,
      });

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Invalid or empty export response.");
      }

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const downloadLink =
        document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setIsExportOpen(false);
      toast.success("Clients exported successfully.");
    } catch (error) {
      console.error("Export Clients Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to export clients."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-[#323232]"}`}>Users</h1>
          <p className={isDark ? "text-[#888]" : "text-[#666]"}>Manage and review all registered users in one place.</p>
        </div>

        {/* Theme Datepicker Component */}
        <div className="flex items-center gap-3">
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />

          <Popover
            open={isExportOpen}
            onOpenChange={(open) => {
              if (!isExporting) {
                setIsExportOpen(open);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                disabled={isExporting}
                aria-label="Export clients"
                title="Export clients"
                className={`h-[46px] px-4 rounded-lg flex items-center justify-center gap-2 ${isDark
                  ? "bg-[#111] border border-[#333] text-white hover:bg-[#1A1A1A]"
                  : "bg-white border border-[#E3E3E3] text-[#323232] hover:bg-[#F7F7F7]"
                  }`}
              >
                {isExporting ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <ArrowUpToLine size={18} />
                )}

                <span className="hidden lg:inline">
                  {isExporting
                    ? "Exporting..."
                    : "Export"}
                </span>
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={10}
              className={`w-[340px] rounded-2xl border p-5 ${isDark
                ? "border-[#333] bg-[#111] text-white"
                : "border-[#E3E3E3] bg-white text-[#323232]"
                }`}
            >
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold">Export Clients</h3>
                  <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                    Leave both dates blank to download all client records, or pick a range to filter the export.
                  </p>
                </div>

                <DatePicker
                  label="Start Date"
                  value={exportStartDate}
                  onChange={(date) => {
                    if (!date) {
                      setExportStartDate(null);
                      return;
                    }

                    const normalizedDate =
                      startOfDay(date);

                    const today =
                      startOfDay(new Date());

                    if (normalizedDate > today) {
                      return;
                    }

                    setExportStartDate(
                      normalizedDate
                    );

                    if (
                      exportEndDate &&
                      normalizedDate >
                      startOfDay(exportEndDate)
                    ) {
                      setExportEndDate(
                        normalizedDate
                      );
                    }
                  }}
                  maxDate={
                    exportEndDate
                      ? startOfDay(exportEndDate)
                      : startOfDay(new Date())
                  }
                  disabled={isExporting}
                  isDark={isDark}
                  disablePortal
                  format="MM/dd/yyyy"
                  sx={{ height: "42px" }}
                />

                <DatePicker
                  label="End Date"
                  value={exportEndDate}
                  onChange={(date) => {
                    if (!date) {
                      setExportEndDate(null);
                      return;
                    }

                    const normalizedDate =
                      startOfDay(date);

                    const today =
                      startOfDay(new Date());

                    if (normalizedDate > today) {
                      return;
                    }

                    if (
                      exportStartDate &&
                      normalizedDate <
                      startOfDay(exportStartDate)
                    ) {
                      return;
                    }

                    setExportEndDate(
                      normalizedDate
                    );
                  }}
                  minDate={
                    exportStartDate
                      ? startOfDay(exportStartDate)
                      : undefined
                  }
                  maxDate={startOfDay(new Date())}
                  disabled={isExporting}
                  isDark={isDark}
                  disablePortal
                  format="MM/dd/yyyy"
                  sx={{ height: "42px" }}
                />

                {(exportStartDate || exportEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setExportStartDate(null);
                      setExportEndDate(null);
                    }}
                    disabled={isExporting}
                    className={`text-xs font-medium underline underline-offset-4 transition-colors ${isDark
                      ? "text-white/70 hover:text-white"
                      : "text-black/60 hover:text-black"
                      }`}
                  >
                    Reset dates
                  </button>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    disabled={isExporting}
                    onClick={() =>
                      setIsExportOpen(false)
                    }
                    className={
                      isDark
                        ? "border border-[#333] bg-transparent text-white hover:bg-white/5"
                        : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    disabled={isExporting}
                    onClick={() => {
                      void handleExportClients();
                    }}
                    className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3]"
                  >
                    {isExporting ? (
                      <>
                        <Loader2
                          size={16}
                          className="mr-2 animate-spin"
                        />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download
                          size={16}
                          className="mr-2"
                        />
                        Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/30" : "text-[#32323266]"}`} size={18} />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm focus:outline-none focus:ring-1 ${isDark
                ? "border-white/20 bg-[#202020] text-white placeholder:text-[#727272] focus:ring-[#E8D1AB]/50"
                : "border-[#E3E3E3] bg-white text-[#323232] placeholder:text-[#32323266] focus:ring-[#C9A96E]/40"}`}
            />
          </div>

          {/* Status Select */}
          {/* <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[140px] bg-[#111] border-[#333] text-white rounded-lg h-[46px] focus:ring-0 capitalize">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-[#333] text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select> */}

          {/* Range Select */}
          <Select value={range} onValueChange={(val) => {
            setRange(val);
            if (val !== "custom") setSelectedDate(null);
            setCurrentPage(1);
          }}>
            <SelectTrigger className={`w-[180px] rounded-lg h-12 capitalize transition-colors ${isDark ? "border-white/20 bg-[#202020] text-[#C4C4C4] hover:bg-[#252525]" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F7F7F7]"}`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={isDark ? "border-white/20 bg-[#202020] text-white" : "border-[#E3E3E3] bg-white text-[#323232]"}>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className={isDark
        ? "overflow-hidden rounded-2xl border border-[#3D3D3D] bg-[#171717]"
        : "overflow-hidden rounded-2xl border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"}>
        {/* DESKTOP TABLE VIEW (≥ 1024px) */}
        <div className="hidden lg:block w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className={`border-b text-left text-sm font-medium ${isDark ? "border-[#3D3D3D] bg-[#101010] text-[#E8D1AB]" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#101010]"}`}>
                  <th className="w-[10%] p-5 font-medium rounded-bl-xl">User ID</th>
                  <th className="w-[20%] p-5 font-medium">User Name</th>
                  <th className="w-[18%] p-5 font-medium">Email ID</th>
                  <th className="w-[14%] p-5 font-medium">Mobile Number</th>
                  <th className="w-[11%] p-5 font-medium">Status</th>
                  <th className="w-[12%] p-5 font-medium">Client Type</th>
                  <th className="w-[15%] p-5 font-medium text-center">Referral Code</th>
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
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`py-10 text-center text-sm ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
                      No users found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  clients.map((client, idx) => {
                    const clientDetailHref = getClientDetailHref(client.id);
                    return (
                    <tr
                      key={client.id || idx}
                      className={`relative ${isDark ? "group text-white transition-colors hover:bg-[#202020]" : "group text-[#323232] transition-colors hover:bg-black/[0.015]"}`}
                    >
                      <td className="relative py-3 px-6">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{client.id}</span>
                      </td>
                        <td className="relative py-3 px-6">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none flex items-center gap-3 min-w-0">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-bold border overflow-hidden ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#FDF8EE] text-[#B18A00]"}`}>
                            {client.imageUrl ? (
                              <img
                                src={client.imageUrl}
                                alt={client.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  if (target.parentElement) {
                                    target.parentElement.textContent = client.initials;
                                  }
                                }}
                              />
                            ) : (
                              client.initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-base font-medium transition-colors capitalize ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-[#101010] group-hover:text-[#8E6A2A]"}`}>
                              {client.name}
                            </p>
                            <p className={`mt-1 truncate text-xs ${isDark ? "text-white/40" : "text-[#32323266]"}`}>{client.joinDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="relative py-3 px-6 text-sm truncate">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{client.email}</span>
                      </td>
                      <td className="relative py-3 px-6 text-sm whitespace-nowrap">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <span className="relative z-10 pointer-events-none">{client.phoneNumber}</span>
                      </td>
                      <td className="relative py-3 px-6">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none inline-block">
                          <StatusBadge status={client.status} />
                        </div>
                      </td>
                      <td className="relative py-3 px-6">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none inline-block">
                          <ClientTypeBadge type={client.clientType} />
                        </div>
                      </td>
                      <td className="relative py-3 px-6 text-center">
                        <Link href={clientDetailHref} className="absolute inset-0 z-20" aria-label={`Open client ${client.name}`} prefetch={false} />
                        <div className="relative z-10 pointer-events-none">
                          {client.referralCode ? (
                            <span className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#F5F0E8] text-[#8B7E66]"}`}>{client.referralCode}</span>
                          ) : (
                            <span className="opacity-40">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          {client.isArchived ? (
                            <button
                              type="button"
                              onClick={(event) => handleActionClick(client, event)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDark
                                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                                }`}
                              title={`Restore ${client.name}`}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => handleActionClick(client, event)}
                              className={`${isDark ? "text-[#666] hover:text-red-400" : "text-[#888] hover:text-red-500"} transition-colors`}
                              title={`Delete ${client.name}`}
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
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
          ) : clients.length === 0 ? (
            <div className={`px-4 py-10 text-center ${isDark ? "text-white/50" : "text-[#32323266]"}`}>
              No users found for the selected filters.
            </div>
          ) : (
            clients.map((client, idx) => {
              const isExpanded = expandedRowId !== null && String(expandedRowId) === String(client.id);
              return (
                <div
                  key={client.id || idx}
                  className={`p-5 transition-colors ${isDark ? "text-white" : "text-[#323232]"} ${isExpanded ? (isDark ? "bg-[#202020]" : "bg-[#F9F9F9]") : "bg-transparent"}`}
                >
                  {/* Clickable Header Segment */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRowId(isExpanded ? null : client.id)}
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
                          {client.imageUrl ? (
                            <img
                              src={client.imageUrl}
                              alt={client.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.parentElement) {
                                  target.parentElement.textContent = client.initials;
                                }
                              }}
                            />
                          ) : (
                            client.initials
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-sm ${isDark ? "text-white" : "text-[#101010]"}`}>
                            {client.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>

                  {/* Expandable Details Frame Grid */}
                  {isExpanded && (
                    <div className="pt-4 space-y-4 min-w-0">
                      <div className="grid grid-cols-2 gap-y-4 text-xs">
                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>User ID</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{client.id}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Mobile Number</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{client.phoneNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Client Type</p>
                          <div className="flex justify-start mt-0.5">
                            <ClientTypeBadge type={client.clientType} />
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Join Date</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{client.joinDate}</p>
                        </div>
                      </div>

                      {/* Email Breakout Zone */}
                      <div className="space-y-1">
                        <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Email ID</p>
                        <p className={`text-sm break-all ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>{client.email}</p>
                      </div>

                      {/* Lower Section Grid for Bottom Fields */}
                      <div className="grid grid-cols-2 gap-y-4 pt-1">
                        <div className="space-y-1">
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Referral Code</p>
                          <p className={`text-sm ${isDark ? "text-[#A1A1A1]" : "text-[#323232]"}`}>
                            {client.referralCode || "—"}
                          </p>
                        </div>
                        <div className="space-y-1 text-right" onClick={(e) => e.stopPropagation()}>
                          <p className={`text-xs font-medium ${isDark ? "text-white" : "text-black"}`}>Action</p>
                          <div className="flex justify-end gap-2 mt-1 text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleRowClick(client.id)}
                              className={`inline-flex items-center gap-1 underline ${isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]"}`}
                            >
                              Details
                            </button>
                            <span className="opacity-20">|</span>
                            {client.isArchived ? (
                              <button
                                type="button"
                                onClick={(event) => handleActionClick(client, event)}
                                className="text-emerald-500 underline"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(event) => handleActionClick(client, event)}
                                className="text-red-500 underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => {
          if (isProcessingClientAction) return;
          setIsActionModalOpen(false);
          setSelectedClient(null);
          setSelectedClientIsArchived(false);
        }}
        onConfirm={handleConfirmClientAction}
        isLoading={isProcessingClientAction}
        title={selectedClientIsArchived ? "Restore User" : "Delete User"}
        description={
          selectedClient
            ? selectedClientIsArchived
              ? `Are you sure you want to restore ${selectedClient.name}? This will move the user back to the active user list.`
              : `Are you sure you want to delete ${selectedClient.name}? This action cannot be undone.`
            : "Are you sure you want to update this user?"
        }
        confirmLabel={selectedClientIsArchived ? "Restore" : "Delete"}
        tone={selectedClientIsArchived ? "success" : "danger"}
      />

      <ActionSuccessModal
        isOpen={isSuccessModalOpen}
        onSubmit={() => {
          setIsSuccessModalOpen(false);
          setCompletedAction(null);
          setCompletedClientName("");
        }}
        title={completedAction === "restore" ? "User Restored Successfully" : "User Deleted Successfully"}
        subtext={
          completedAction === "restore"
            ? `${completedClientName || "The user"} has been restored successfully and moved back to the active user list.`
            : `${completedClientName || "The user"} has been deleted successfully.`
        }
        buttonText="Done"
      />
    </div>
  )
};
