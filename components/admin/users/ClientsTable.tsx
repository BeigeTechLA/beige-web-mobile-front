"use client";

import React, { useState, useEffect } from "react";
import {Search,Trash2,Download, Loader2, ArrowUpToLine} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SortDateButton } from "@/components/admin/SortDateButton"; // Re-added your theme component
import {
    format,
    startOfDay,
    subDays,
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
        Active: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
        Approved: "bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20",
        Pending: "bg-[#FFF9E5] text-[#B18A00] border-[#B18A00]/20",
        Inactive: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
        Archived: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
        Rejected: "bg-[#FFEBEB] text-[#EF4444] border-[#EF4444]/20",
    };
    const displayStatus = styles[status] ? status : "Pending";
    return (
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[displayStatus as keyof typeof styles]}`}>
            {status}
        </span>
    );
};

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
    const [limit] = useState(20);
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

const [exportStartDate, setExportStartDate] =
    useState<Date | null>(subDays(new Date(), 30));

const [exportEndDate, setExportEndDate] =
    useState<Date | null>(new Date());

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

    if (!exportStartDate || !exportEndDate) {
        toast.error("Please select start and end dates.");
        return;
    }

    const normalizedStartDate = startOfDay(exportStartDate);
    const normalizedEndDate = startOfDay(exportEndDate);
    const today = startOfDay(new Date());

    if (
        normalizedStartDate > today ||
        normalizedEndDate > today
    ) {
        toast.error("Future dates are not allowed.");
        return;
    }

    if (normalizedStartDate > normalizedEndDate) {
        toast.error("Start date cannot be after end date.");
        return;
    }

    const formattedStartDate = format(
        normalizedStartDate,
        "yyyy-MM-dd"
    );

    const formattedEndDate = format(
        normalizedEndDate,
        "yyyy-MM-dd"
    );

    setIsExporting(true);

    try {
        const blob = await adminApi.exportClientsCsv({
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            status:
                activeTab === "archived"
                    ? "archived"
                    : activeTab === "active"
                        ? "active"
                        : "all",
            search: debouncedSearch || undefined,
        });

        if (!(blob instanceof Blob) || blob.size === 0) {
            throw new Error("Invalid or empty export response.");
        }

        const downloadUrl =
            window.URL.createObjectURL(blob);

        const downloadLink =
            document.createElement("a");

        downloadLink.href = downloadUrl;
        downloadLink.download =
            `clients-${formattedStartDate}-to-${formattedEndDate}.csv`;

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
            <div>
                <h1 className={`text-lg lg:text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-[#323232]"}`}>Users</h1>
                <p className={isDark ? "text-[#888]" : "text-[#666]"}>Manage and review all registered users in one place.</p>
            </div>

            <div className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"}`}>
                {[
                    { key: "all", label: "All Clients" },
                    { key: "active", label: "Active Clients" },
                    { key: "archived", label: "Archived Clients" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabChange(tab.key as ClientsTab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.key
                                ? "bg-[#E5D5B8] text-black shadow-lg"
                                : isDark ? "text-[#777] hover:text-white" : "text-[#666] hover:text-black"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1 w-full">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md min-w-[240px]">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={18} />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
                                }`}
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
                        <SelectTrigger className={`w-[180px] rounded-lg h-[46px] capitalize transition-colors ${isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"
                            }`}>
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent className={isDark ? "bg-[#111] border-[#333] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Theme Datepicker Component */}
               {/* Date filter and export */}
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
                className={`h-[46px] px-4 rounded-lg flex items-center justify-center gap-2 ${
                    isDark
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
            className={`w-[340px] rounded-2xl border p-5 ${
                isDark
                    ? "border-[#333] bg-[#111] text-white"
                    : "border-[#E3E3E3] bg-white text-[#323232]"
            }`}
        >
            <div className="space-y-5">
                <div>
                    <h3 className="text-sm font-semibold">
                        Export Clients
                    </h3>

                    <p
                        className={`mt-1 text-xs ${
                            isDark
                                ? "text-white/55"
                                : "text-black/55"
                        }`}
                    >
                        Select a date range to download client data.
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
                        disabled={
                            isExporting ||
                            !exportStartDate ||
                            !exportEndDate
                        }
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

            {/* Table */}
            <div className={`w-full rounded-2xl border overflow-hidden transition-colors ${isDark ? "bg-[#111] border-[#333]" : "bg-white border-[#E3E3E3] shadow-sm"
                }`}>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-sm font-normal border-b ${isDark ? "text-[#888] border-[#333]" : "bg-[#FFFCF6] text-[#000] border-[#E5E5E5]"}`}>
                                <th className="py-5 px-6 font-medium">User ID</th>
                                <th className="py-5 px-6 font-medium">User Name</th>
                                <th className="py-5 px-6 font-medium">Email ID</th>
                                <th className="py-5 px-6 font-medium">Mobile Number</th>
                                <th className="py-5 px-6 font-medium">Status</th>
                                <th className="py-5 px-6 font-medium">Client Type</th>
                                <th className="py-5 px-6 font-medium">Referral Code</th>
                                <th className="py-5 px-6 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center text-[#888]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
                                            <span>Loading users...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center text-[#888]">
                                        No users found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => handleRowClick(client.id)}
                                        className={`border-b cursor-pointer transition-colors ${isDark ? "border-[#222] hover:bg-white/[0.02] text-[#E0E0E0]" : "border-[#F0F0F0] hover:bg-black/[0.01] text-[#000]"
                                            }`}>
                                        <td className="py-5 px-6 text-[15px]">{client.id}</td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] overflow-hidden flex items-center justify-center text-black font-semibold text-sm relative">
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
                                                <div>
                                                    <p className="font-medium text-[15px]">{client.name}</p>
                                                    <p className={`${isDark ? "text-[#666]" : "text-[#999]"} text-[10px] mt-0.5 uppercase tracking-wider font-bold`}>{client.joinDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-[15px]">{client.email}</td>
                                        <td className="py-5 px-6 text-[15px]">
                                            {client.phoneNumber}
                                        </td>
                                        <td className="py-5 px-6">
                                            <StatusBadge status={client.status} />
                                        </td>
                                        <td className="py-5 px-6">
                                            <ClientTypeBadge type={client.clientType} />
                                        </td>
                                        <td className={`py-5 px-6 text-sm ${isDark ? "text-[#888]" : "text-[#666]"}`}>
                                            {client.referralCode ? (
                                                <span className={`px-3 py-1 rounded-md text-xs font-mono font-medium ${isDark ? "bg-[#E5D5B8]/10 text-[#E5D5B8]" : "bg-[#F5F0E8] text-[#8B7E66]"}`}>{client.referralCode}</span>
                                            ) : (
                                                <span className="opacity-40">—</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            {client.isArchived ? (
                                                <button
                                                    type="button"
                                                    onClick={(event) => handleActionClick(client, event)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDark
                                                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                            : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                                                        }`}
                                                    aria-label={`Restore ${client.name}`}
                                                    title={`Restore ${client.name}`}
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(event) => handleActionClick(client, event)}
                                                    className={`${isDark ? "text-[#666] hover:text-red-400" : "text-[#888] hover:text-red-500"} transition-colors`}
                                                    aria-label={`Delete ${client.name}`}
                                                    title={`Delete ${client.name}`}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Logic */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center p-6 border-t border-[#333333]">
                    <div className="text-sm text-[#666666]">
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
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
                                        <span key={`dots-${index}`} className="px-2 py-1 text-white/30 text-xs">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page
                                                ? "bg-[#E5D5B8] text-black"
                                                : "bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ));
                            })()}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1A1A1A] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

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
    );
};
