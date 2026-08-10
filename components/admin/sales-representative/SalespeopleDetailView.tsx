"use client";


import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  DollarSign,
  FileText,
  Grid2X2,
  List,
  MoreVertical,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash2,
  XCircle,
} from "lucide-react";
import ActionMenu from "@/components/admin/sales-representative/ActionMenu";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import DottedDivider from "@/components/admin/DottedDivider";
import { useDebounce } from "@/hooks/use-debounce";
import { salesApi, shiftManagementApi } from "@/lib/api";
import { toast } from "sonner";

export type SalespeopleProfile = {
  id?: number | string;
  sales_rep_id?: number | string;
  name: string;
  email: string;
  initials: string;
  color: string;
  enabled: boolean;
  status?: "Active" | "In Active";
  lastActivity?: string;
};

function getInitials(name?: string) {
  return String(name || "NA")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLocation(location?: string) {
  if (!location) return "";
  const parts = location.split(/[,،]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return location;

  const cleanPart = (part: string) => part.replace(/\d+/g, "").replace(/\s+/g, " ").trim();
  const looksLikeStreetAddress = (part: string) => (
    /\b(avenue|ave|circle|road|rd|ring|highway|hwy|flyover|garden|gardens|square|street|st|near|off|opp|opposite|tower|complex|society|apartment|apartments|residency|nagar|marg|lane|cross|bridge)\b/i.test(part)
  );

  const country = cleanPart(parts[parts.length - 1]);
  const stateOrCity = cleanPart(parts[parts.length - 2]);
  const possibleCity = parts.length >= 3 ? cleanPart(parts[parts.length - 3]) : "";
  const city = possibleCity && !looksLikeStreetAddress(possibleCity) ? possibleCity : "";
  const locationParts = [city, stateOrCity, country].filter(Boolean);

  return locationParts.join(", ");
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <span className={`relative inline-flex h-[24px] w-[38px] rounded-md ${enabled ? "bg-[#E5D5B8]" : "bg-[#454545]"}`}>
      <span className={`absolute left-1 top-1 h-4 w-4 rounded bg-white ${enabled ? "translate-x-[14px]" : ""}`} />
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Hot: "bg-[#4A1F0E] text-[#F26B2A]",
    Warm: "bg-[#4A3700] text-[#E7B320]",
    Cold: "bg-[#0E3858] text-[#55A7DC]",
    "Booking In Progress": "bg-[#FFF2C5] text-[#B97300]",
    "Book a Shoot - Lead Created": "bg-[#BFE0FF] text-[#1E65C8]",
    Booked: "bg-[#B9F8CF] text-[#0D542B]",
    "Manual - Lead Created": "bg-[#9DEBFA] text-[#12788B]",
    "Signed Up - Lead Created": "bg-[#D7C4FF] text-[#6E4BD9]",
    Paid: "bg-[#D6FFE6] text-[#27AE60]",
    "Partially Paid": "bg-[#FFF6E9] text-[#D4A017]",
    Sent: "bg-[#D6E6FF] text-[#4A90E2]",
    Viewed: "bg-[#D2BCFF] text-[#754AD8]",
    Pending: "bg-[#D6E6FF] text-[#4A90E2]",
    Accepted: "bg-[#D6FFE6] text-[#27AE60]",
    Draft: "bg-[#D1D5DB] text-[#4B5563]",
    Rejected: "bg-[#FFD1D1] text-[#EB5757]",
    Expired: "bg-[#FFF6E9] text-[#D4A017]",
    Active: "bg-[#B9F8CF] text-[#0D542B]",
    "In Active": "bg-[#2B2B2B] text-white/45",
  };

  return <span className={`inline-flex rounded-full px-4 py-2 text-xs font-medium ${styles[value] || "bg-[#2B2B2B] text-white/60"}`}>{value}</span>;
}

function QuoteDetailsActionMenu({
  open,
  anchor,
  onClose,
  onGoToLead,
  onViewDetails,
  onDuplicate,
  onEdit,
  onPaymentTransaction,
  onReject,
}: {
  open: boolean;
  anchor: { x: number; y: number };
  onClose: () => void;
  onGoToLead?: () => void;
  onViewDetails: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onPaymentTransaction: () => void;
  onReject: () => void;
}) {
  if (!open) return null;

  const handleAction = (action: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    action();
    onClose();
  };

  const menuItems = [
    ...(onGoToLead ? [{ icon: ChevronRight, label: "Go to Lead", onClick: onGoToLead, danger: false }] : []),
    { icon: FileText, label: "View Details", onClick: onViewDetails, danger: false },
    { icon: Copy, label: "Duplicate", onClick: onDuplicate, danger: false },
    { icon: SquarePen, label: "Edit", onClick: onEdit, danger: false },
    { icon: DollarSign, label: "Record Payment", onClick: onPaymentTransaction, danger: false },
    { icon: XCircle, label: "Reject Quote", onClick: onReject, danger: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[220px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0A0A] p-1.5 text-white shadow-2xl shadow-black/50"
        style={{ top: anchor.y, left: anchor.x }}
      >
        {menuItems.map(({ icon: Icon, label, onClick, danger }) => (
          <React.Fragment key={label}>
            {label === "Reject Quote" ? <div className="my-1 h-px w-full bg-white/10" /> : null}
            <button
              type="button"
              onClick={handleAction(onClick)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[15px] font-medium transition ${
                danger ? "text-[#F04438] hover:bg-[#F04438]/10" : "text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} className={danger ? "text-[#F04438]" : "text-white/70"} />
              {label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

function AvatarName({ initials, color, name, meta }: { initials: string; color: string; name: string; meta: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-black" style={{ backgroundColor: color }}>{initials}</span>
      <div>
        <p className="text-sm text-white">{name}</p>
        <p className="mt-0.5 text-xs text-white/45">{meta}</p>
      </div>
    </div>
  );
}

const leadTypeParam: Record<string, string> = {
  "Self-Serve": "self_serve",
  "Sales Assisted": "sales_assisted",
  Manual: "manual",
};

const quoteStatusParam: Record<string, string> = {
  Pending: "pending",
  Sent: "sent",
  Accepted: "accepted",
  Draft: "draft",
  Rejected: "rejected",
  Expired: "expired",
  Paid: "paid",
  "Partially Paid": "partially_paid",
};

const quoteBookingTypeParam: Record<string, string> = {
  "Single Day": "single_day",
  "Multi Day": "multi_day",
};


function Pagination() {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm text-white/70">
      <span>Page 1 to 10</span>
      <div className="flex items-center gap-3">
        <span className="text-white/30">‹</span>
        {[1, 2, 3].map((page) => (
          <button key={page} className={`h-8 w-8 rounded-lg text-sm ${page === 1 ? "border border-[#E5D5B8] text-[#E5D5B8]" : "text-white/45"}`}>{page}</button>
        ))}
        <span className="text-white/35">...</span>
        <span className="text-white/45">›</span>
      </div>
    </div>
  );
}

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  if (totalPages <= 1) return [1];
  const delta = 1;
  const pages: Array<number | "..."> = [1];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  if (left > 2) pages.push("...");
  for (let page = left; page <= right; page += 1) pages.push(page);
  if (right < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages.filter((page, index, array) => page !== array[index - 1]);
};

function SalesPagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, pagination.pages);
  const safePage = Math.min(Math.max(pagination.page || 1, 1), totalPages);
  const showingFrom = pagination.total > 0 ? ((safePage - 1) * pagination.limit) + 1 : 0;
  const showingTo = Math.min(safePage * pagination.limit, pagination.total);
  const paginationItems = buildPaginationItems(safePage, totalPages);

  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm text-white/70">
      <span>
        {pagination.total > 0
          ? `Showing ${showingFrom} to ${showingTo} of ${pagination.total} entries`
          : "Showing 0 entries"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="h-9 rounded-lg bg-[#171717] px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/20"
        >
          Previous
        </button>
        {paginationItems.map((page, index) =>
          page === "..." ? (
            <span key={`salesperson-page-gap-${index}`} className="px-2 text-white/45">...</span>
          ) : (
            <button
              key={`salesperson-page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                page === safePage
                  ? "bg-[#E5D5B8] text-black"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="h-9 rounded-lg bg-[#171717] px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:text-white/20"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function SalespeopleDetailView({
  profile,
  shiftId,
  onRefresh,
  onBack,
}: {
  profile: SalespeopleProfile;
  shiftId?: number | string;
  onRefresh?: () => void | Promise<void>;
  onBack: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"booking" | "quotes">("booking");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [leadRows, setLeadRows] = useState<any[]>([]);
  const [salesQuoteRows, setSalesQuoteRows] = useState<any[]>([]);
  const [leadPage, setLeadPage] = useState(1);
  const [quotePage, setQuotePage] = useState(1);
  const [leadPagination, setLeadPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [quotePagination, setQuotePagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingSalesperson, setIsDeletingSalesperson] = useState(false);
  const [leadActionMenu, setLeadActionMenu] = useState<{
    id: number | string;
    client: string;
    anchor: { x: number; y: number };
  } | null>(null);
  const [quoteActionMenu, setQuoteActionMenu] = useState<{
    id: number | string;
    leadId?: number | string;
    status?: string;
    anchor: { x: number; y: number };
  } | null>(null);
  const [draggedCard, setDraggedCard] = useState<{
    id: number | string;
    status: string;
    type: "booking" | "quotes";
  } | null>(null);
  const [filters, setFilters] = useState({
    all: "All",
    lead: "All Lead",
    status: "Status",
    booking: "Booking Type",
    cp: "Creative Partners",
  });
  const statusOptions = activeTab === "booking"
    ? ["Status", "Booking In Progress", "Book a Shoot - Lead Created", "Booked", "Manual - Lead Created", "Signed Up - Lead Created", "Ready for Payment", "Closed - Lost"]
    : ["All Status", "Accepted", "Draft", "Pending", "Rejected", "Sent", "Paid", "Partially Paid", "Expired"];
  const bookingTypeOptions = activeTab === "booking"
    ? ["Booking Type", "Self-Serve", "Sales Assisted", "Manual"]
    : ["Booking Type", "Single Day", "Multi Day"];
  const salesRepId = profile.sales_rep_id || profile.id;
  const bookingGridColumns = useMemo(() => {
    const baseStatuses = ["Booking In Progress", "Booked", "Signed Up - Lead Created", "Book a Shoot - Lead Created", "Manual - Lead Created", "Ready for Payment", "Closed - Lost"];
    const statuses = Array.from(new Set([...baseStatuses, ...leadRows.map((row) => row.status || "N/A")]));
    return statuses
      .map((status) => ({ status, items: leadRows.filter((row) => (row.status || "N/A") === status) }))
      .filter((column) => column.items.length > 0 || filters.status === "Status");
  }, [leadRows, filters.status]);
  const quoteGridColumns = useMemo(() => {
    const baseStatuses = ["Accepted", "Draft", "Pending", "Rejected", "Sent", "Paid", "Partially Paid", "Expired"];
    const statuses = Array.from(new Set([...baseStatuses, ...salesQuoteRows.map((row) => row.status || "Draft")]));
    return statuses
      .map((status) => ({ status, items: salesQuoteRows.filter((row) => (row.status || "Draft") === status) }))
      .filter((column) => column.items.length > 0 || filters.status === "All Status");
  }, [salesQuoteRows, filters.status]);

  const openLeadActionMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setLeadActionMenu({
      id: row.lead_id,
      client: row.name,
      anchor: { x: Math.max(12, rect.right - 220), y: rect.bottom + 8 },
    });
  };

  const openQuoteActionMenu = (event: React.MouseEvent<HTMLButtonElement>, row: any) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setQuoteActionMenu({
      id: row.sales_quote_id,
      leadId: row.lead_id,
      status: row.status,
      anchor: { x: Math.max(12, rect.right - 220), y: rect.bottom + 8 },
    });
  };

  const duplicateQuote = async (quoteId: number | string) => {
    const response = await salesApi.duplicateQuote(quoteId);
    if (response?.error || response?.success === false) {
      toast.error(typeof response?.error === "string" ? response.error : "Failed to duplicate quote");
      return;
    }
    toast.success("Quote duplicated successfully");
  };

  const rejectQuote = async (quoteId: number | string) => {
    const response = await salesApi.updateQuoteStatus(quoteId, "rejected");
    if (response?.error || response?.success === false) {
      toast.error(typeof response?.error === "string" ? response.error : "Failed to reject quote");
      return;
    }
    toast.success("Quote rejected successfully");
    setSalesQuoteRows((rows) => rows.map((row) => (
      String(row.sales_quote_id) === String(quoteId) ? { ...row, status: "Rejected" } : row
    )));
  };

  const reorderGridCards = (status: string, draggedId: number | string, targetId?: number | string) => {
    if (String(draggedId) === String(targetId || "")) return;

    if (activeTab === "booking") {
      setLeadRows((rows) => {
        const sameStatusRows = rows.filter((row) => row.status === status);
        const orderedIds = sameStatusRows.map((row) => String(row.lead_id));
        const fromIndex = orderedIds.indexOf(String(draggedId));
        if (fromIndex === -1) return rows;

        const [movedId] = orderedIds.splice(fromIndex, 1);
        const targetIndex = targetId ? orderedIds.indexOf(String(targetId)) : -1;
        orderedIds.splice(targetIndex === -1 ? orderedIds.length : targetIndex, 0, movedId);

        const rank = new Map(orderedIds.map((id, index) => [id, index]));
        return [...rows].sort((a, b) => {
          if (a.status !== status || b.status !== status) return 0;
          return (rank.get(String(a.lead_id)) ?? 0) - (rank.get(String(b.lead_id)) ?? 0);
        });
      });
      return;
    }

    setSalesQuoteRows((rows) => {
      const sameStatusRows = rows.filter((row) => row.status === status);
      const orderedIds = sameStatusRows.map((row) => String(row.sales_quote_id));
      const fromIndex = orderedIds.indexOf(String(draggedId));
      if (fromIndex === -1) return rows;

      const [movedId] = orderedIds.splice(fromIndex, 1);
      const targetIndex = targetId ? orderedIds.indexOf(String(targetId)) : -1;
      orderedIds.splice(targetIndex === -1 ? orderedIds.length : targetIndex, 0, movedId);

      const rank = new Map(orderedIds.map((id, index) => [id, index]));
      return [...rows].sort((a, b) => {
        if (a.status !== status || b.status !== status) return 0;
        return (rank.get(String(a.sales_quote_id)) ?? 0) - (rank.get(String(b.sales_quote_id)) ?? 0);
      });
    });
  };

  const handleDelete = async () => {
    if (!shiftId || !salesRepId) {
      toast.error("Missing shift or salesperson details");
      return;
    }

    setIsDeletingSalesperson(true);
    const response = await shiftManagementApi.removeShiftSalesperson(shiftId, salesRepId);
    setIsDeletingSalesperson(false);
    if (!response.success) {
      toast.error(response.error || "Failed to remove salesperson");
      return;
    }
    toast.success("Salesperson removed successfully");
    setIsDeleteModalOpen(false);
    onBack();
    await onRefresh?.();
  };

  useEffect(() => {
    const load = async () => {
      const repId = salesRepId;
      if (!repId) return;
      if (activeTab === "booking") {
        setSalesQuoteRows([]);
        const response = await shiftManagementApi.getSalesRepLeads(repId, {
          search: debouncedSearch || undefined,
          lead_type: filters.booking === "Booking Type" ? undefined : leadTypeParam[filters.booking],
          intent: filters.lead === "All Lead" ? undefined : filters.lead,
          status: filters.status === "Status" ? undefined : filters.status,
          page: leadPage,
          limit: 10,
        });
        const data = response?.data?.data || response?.data;
        const list = Array.isArray(data?.rows) ? data.rows : [];
        const filteredList = filters.cp === "Assigned"
          ? list.filter((row: any) => Array.isArray(row?.creative_partners) && row.creative_partners.length > 0)
          : filters.cp === "Unassigned"
            ? list.filter((row: any) => !Array.isArray(row?.creative_partners) || row.creative_partners.length === 0)
            : list;
        const pagination = data?.pagination || {};
        setLeadPagination({
          page: Number(pagination.page || leadPage || 1),
          limit: Number(pagination.limit || 10),
          total: filters.cp === "Creative Partners" ? Number(pagination.total || list.length || 0) : filteredList.length,
          pages: filters.cp === "Creative Partners" ? Number(pagination.pages || pagination.total_pages || pagination.totalPages || 1) : Math.max(1, Math.ceil(filteredList.length / 10)),
        });
        setLeadRows(filteredList
          .filter((row: any) => !(row?.sales_quote_id && !row?.lead_id && !row?.email_id && !row?.booking_status))
          .map((row: any) => ({
            lead_id: row.lead_id || row.id || row.email_id || row.client_name,
            bookingId: row.booking_id || row.bookingId || row.lead_id || row.id,
            name: row.client_name || "Unknown Client",
            meta: row.date || "",
            email: row.email_id || "No email",
            type: row.lead_type || "N/A",
            intent: row.intent || "N/A",
            status: row.booking_status || "N/A",
            activity: row.last_activity || "N/A",
            initials: row.initials || getInitials(row.client_name),
            color: row.color || "#F5E9D5",
          })));
      } else {
        setLeadRows([]);
        const response = await shiftManagementApi.getSalesRepQuotes(repId, {
          search: debouncedSearch || undefined,
          status: filters.status === "All Status" ? undefined : quoteStatusParam[filters.status],
          booking_type: filters.booking === "Booking Type" ? undefined : quoteBookingTypeParam[filters.booking],
          page: quotePage,
          limit: 10,
        });
        const data = response?.data?.data || response?.data;
        const list = Array.isArray(data?.rows) ? data.rows : [];
        const pagination = data?.pagination || {};
        setQuotePagination({
          page: Number(pagination.page || quotePage || 1),
          limit: Number(pagination.limit || 10),
          total: Number(pagination.total || list.length || 0),
          pages: Number(pagination.pages || pagination.total_pages || pagination.totalPages || 1),
        });
        setSalesQuoteRows(list
          .filter((row: any) => !(row?.lead_id && !row?.sales_quote_id && !row?.project && !row?.quote_status))
          .map((row: any) => ({
            sales_quote_id: row.sales_quote_id || row.id || row.project || row.client_name,
            lead_id: row.lead_id || row.booking_id || row.converted_booking_id || row.booking_lead_id,
            quoteNumber: row.quote_number || row.sales_quote_id || row.id,
            name: row.client_name || "Unknown Client",
            meta: formatLocation(row.client_location),
            project: row.project || "Untitled project",
            amount: row.amount || "0.00",
            status: row.quote_status || "Draft",
            valid: row.valid_until || "N/A",
            initials: row.initials || getInitials(row.client_name),
            color: row.color || "#F5E9D5",
          })));
      }
    };
    void load();
  }, [activeTab, salesRepId, debouncedSearch, filters.lead, filters.status, filters.booking, filters.cp, leadPage, quotePage]);

  useEffect(() => {
    if (activeTab === "booking") {
      setLeadPage(1);
    } else {
      setQuotePage(1);
    }
  }, [activeTab, debouncedSearch, filters.lead, filters.status, filters.booking, filters.cp]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      lead: "All Lead",
      status: activeTab === "booking" ? "Status" : "All Status",
      booking: "Booking Type",
      cp: "Creative Partners",
    }));
  }, [activeTab]);

  return (
    <div className="min-h-full bg-[#101010] px-4 py-6 font-[var(--font-geist-sans)] text-white lg:px-9 lg:py-8">
      <button type="button" onClick={onBack} className="mb-7 flex items-center gap-2 text-sm text-white/85 transition hover:text-[#E5D5B8]">
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-lg text-2xl font-semibold text-black" style={{ backgroundColor: profile.color }}>{profile.initials}</span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{profile.name}</h1>
              <Toggle enabled={profile.enabled} />
            </div>
            <p className="mt-3 text-sm text-white/60">Email ID : <span className="text-white/80">{profile.email}</span><span className="mx-4 text-white/30">|</span>Last Activity : <span className="text-white/80">{profile.lastActivity || "N/A"}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={profile.status || (profile.enabled ? "Active" : "In Active")} />
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F05454] text-white transition hover:bg-[#E04040]"
            aria-label={`Remove ${profile.name} from shift`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <DottedDivider className="my-6 lg:my-6" />

      <div className="mt-5 inline-flex rounded-lg border border-[#2D2D2D] bg-[#171717] p-1">
        <button onClick={() => setActiveTab("booking")} className={`h-10 rounded-md px-6 text-sm ${activeTab === "booking" ? "bg-[#E5D5B8] text-black" : "text-white/70"}`}>Booking Leads</button>
        <button onClick={() => setActiveTab("quotes")} className={`h-10 rounded-md px-8 text-sm ${activeTab === "quotes" ? "bg-[#E5D5B8] text-black" : "text-white/70"}`}>Quotes</button>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 w-full rounded-lg border border-[#2D2D2D] bg-[#242424] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35" placeholder="Search" />
        </label>
        <button className="flex h-12 items-center gap-2 rounded-lg bg-[#242424] px-5 text-sm font-medium text-white"><SlidersHorizontal size={16} />Filters</button>
        <div className="flex rounded-lg bg-[#242424] p-1">
          <button onClick={() => setViewMode("list")} className={`flex h-10 w-12 items-center justify-center rounded-md ${viewMode === "list" ? "bg-[#E5D5B8] text-black" : "text-white/65"}`}><List size={17} /></button>
          <button onClick={() => setViewMode("grid")} className={`flex h-10 w-12 items-center justify-center rounded-md ${viewMode === "grid" ? "bg-[#E5D5B8] text-black" : "text-white/65"}`}><Grid2X2 size={17} /></button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-3">
          <BasicDropdown label="All" value={filters.all} options={["All", "Month", "Week"]} onChange={(value) => setFilters((current) => ({ ...current, all: value }))} />
          {activeTab === "booking" ? (
            <BasicDropdown label="All Lead" value={filters.lead} options={["All Lead", "Hot", "Warm", "Cold"]} onChange={(value) => setFilters((current) => ({ ...current, lead: value }))} />
          ) : null}
          <BasicDropdown label="Status" value={filters.status} options={statusOptions} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
          <BasicDropdown label="Booking Type" value={filters.booking} options={bookingTypeOptions} onChange={(value) => setFilters((current) => ({ ...current, booking: value }))} />
          {activeTab === "booking" ? (
            <BasicDropdown label="Creative Partners" value={filters.cp} options={["Creative Partners", "Assigned", "Unassigned"]} onChange={(value) => setFilters((current) => ({ ...current, cp: value }))} />
          ) : null}
        </div>
      </div>

      <section className={viewMode === "grid" ? "mt-5" : "mt-5 overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#111]"}>
        <div className={viewMode === "grid" ? "" : "overflow-x-auto"}>
          {viewMode === "grid" ? (
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
              <div className="flex min-w-max items-start gap-5">
              {(activeTab === "booking" ? bookingGridColumns : quoteGridColumns).map((column) => (
                <div
                  key={`grid-column-${column.status}`}
                  onDragOver={(event) => {
                    if (draggedCard?.status !== column.status || draggedCard.type !== activeTab) return;
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (draggedCard?.status !== column.status || draggedCard.type !== activeTab) return;
                    event.preventDefault();
                    reorderGridCards(column.status, draggedCard.id);
                    setDraggedCard(null);
                  }}
                  className="h-fit w-[320px] shrink-0 rounded-3xl border border-[#FFFFFF33] bg-[#0A0A0A]"
                >
                  <div className="sticky top-[-1px] z-20 flex w-full items-center justify-between rounded-3xl rounded-b-xl border-b border-white/5 bg-[#202020] px-5 py-4">
                    <h3 className="truncate text-sm font-medium text-[#E8D1AB]">{column.status}</h3>
                    <span className="inline-flex h-6 min-w-6 items-center justify-center px-2 text-sm font-medium text-white/70">{column.items.length}</span>
                  </div>
                  <div className="no-scrollbar max-h-[620px] space-y-3 overflow-y-auto px-4 py-4">
                    {column.items.length ? column.items.map((row: any) => (
                      <div
                        key={`grid-card-${activeTab}-${activeTab === "booking" ? row.lead_id : row.sales_quote_id}`}
                        draggable
                        onDragStart={(event) => {
                          const id = activeTab === "booking" ? row.lead_id : row.sales_quote_id;
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", String(id));
                          setDraggedCard({ id, status: column.status, type: activeTab });
                        }}
                        onDragEnd={() => setDraggedCard(null)}
                        onDragOver={(event) => {
                          if (draggedCard?.status !== column.status || draggedCard.type !== activeTab) return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (draggedCard?.status !== column.status || draggedCard.type !== activeTab) return;
                          event.preventDefault();
                          event.stopPropagation();
                          reorderGridCards(column.status, draggedCard.id, activeTab === "booking" ? row.lead_id : row.sales_quote_id);
                          setDraggedCard(null);
                        }}
                        onClick={() => {
                          if (activeTab === "booking" && row.lead_id) router.push(`/admin/sales-representative/${row.lead_id}`);
                          if (activeTab === "quotes" && row.sales_quote_id) router.push(`/admin/quotes/${row.sales_quote_id}?from=shift-management`);
                        }}
                        className={`group cursor-pointer rounded-2xl bg-[#202020] transition-all duration-200 hover:bg-[#1A1A1A] active:cursor-grabbing ${
                          String(draggedCard?.id || "") === String(activeTab === "booking" ? row.lead_id : row.sales_quote_id) ? "scale-95 opacity-50" : "opacity-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 p-5">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-md text-xl font-bold text-black" style={{ backgroundColor: row.color }}>{row.initials}</span>
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-semibold leading-tight text-white" title={row.name}>{row.name}</h4>
                              <p className="mt-1 whitespace-nowrap text-sm font-medium text-white/40">{row.meta}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => activeTab === "booking" ? openLeadActionMenu(event, row) : openQuoteActionMenu(event, row)}
                            className="shrink-0 p-1 text-white transition-colors hover:text-white/60"
                            aria-label={`Open actions for ${row.name}`}
                          >
                            <MoreVertical size={24} />
                          </button>
                        </div>
                        <div className="h-[1px] w-full bg-white/50" />
                        <div className="space-y-4 p-5 text-sm">
                          {activeTab === "booking" ? (
                            <>
                              <div className="flex items-center justify-between"><span className="text-sm font-medium text-[#E8D1AB]">Intent Type</span><StatusBadge value={row.intent} /></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Email ID</span><span className="max-w-[160px] truncate text-right text-sm font-medium text-white/90" title={row.email}>{row.email}</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Booking ID</span><span className="text-sm font-medium text-white/90">#{row.bookingId}</span></div>
                              <div className="flex items-center justify-between"><span className="text-sm font-medium text-[#E8D1AB]">Lead Type</span><span className="text-sm font-medium text-white/90">{row.type}</span></div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Project</span><span className="max-w-[160px] truncate text-right text-sm font-medium text-white/90" title={row.project}>{row.project}</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Amount</span><span className="text-sm font-medium text-white/90">{row.amount}</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Quote ID</span><span className="text-sm font-medium text-white/90">#{row.quoteNumber}</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium text-[#E8D1AB]">Valid Until</span><span className="text-sm font-medium text-white/90">{row.valid}</span></div>
                            </>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35">
                        {activeTab === "booking" ? "No leads in this stage" : "No quotes in this stage"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : activeTab === "booking" ? (
            <table className="w-full min-w-[920px] text-left">
              <thead className="border-b border-[#242424] text-xs font-medium text-[#E5D5B8]">
                <tr><th className="px-5 py-4">Client Name</th><th>Email ID</th><th>Lead Type</th><th>Intent</th><th>Booking Status</th><th>Last Activity</th><th className="pr-5 text-right">Action</th></tr>
              </thead>
              <tbody>{leadRows.length ? leadRows.map((row) => (
                <tr
                  key={row.lead_id}
                  onClick={() => row.lead_id && router.push(`/admin/sales-representative/${row.lead_id}`)}
                  className="cursor-pointer border-b border-[#242424] text-sm text-white/85 transition hover:bg-white/5"
                >
                  <td className="px-5 py-3"><AvatarName {...row} /></td><td>{row.email}</td><td>{row.type}</td><td><StatusBadge value={row.intent} /></td><td><StatusBadge value={row.status} /></td><td>{row.activity}</td><td className="pr-5 text-right">
                    <button
                      type="button"
                      onClick={(event) => openLeadActionMenu(event, row)}
                      className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[#E5D5B8] transition hover:bg-white/5 hover:text-white"
                      aria-label={`Open actions for ${row.name}`}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                  <tr key="no-leads"><td colSpan={7} className="px-5 py-8 text-center text-sm text-white/45">No booking leads found</td></tr>
              )}</tbody>
            </table>
          ) : (
            <table className="w-full min-w-[920px] text-left">
              <thead className="border-b border-[#242424] text-xs font-medium text-[#E5D5B8]">
                <tr><th className="px-5 py-4">Client Name</th><th>Project</th><th>Amount</th><th>Quote Status</th><th>Valid Until</th><th className="pr-5 text-right">Action</th></tr>
              </thead>
              <tbody>{salesQuoteRows.length ? salesQuoteRows.map((row) => (
                <tr
                  key={row.sales_quote_id}
                  onClick={() => row.sales_quote_id && router.push(`/admin/quotes/${row.sales_quote_id}?from=shift-management`)}
                  className="cursor-pointer border-b border-[#242424] text-sm text-white/85 transition hover:bg-white/5"
                >
                  <td className="px-5 py-3"><AvatarName {...row} /></td><td>{row.project}</td><td>{row.amount}</td><td><StatusBadge value={row.status} /></td><td>{row.valid}</td><td className="pr-5 text-right">
                    <button
                      type="button"
                      onClick={(event) => openQuoteActionMenu(event, row)}
                      className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[#E5D5B8] transition hover:bg-white/5 hover:text-white"
                      aria-label={`Open actions for ${row.name}`}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-white/45">No quotes found</td></tr>
              )}</tbody>
            </table>
          )}
        </div>
        <SalesPagination
          pagination={activeTab === "booking" ? leadPagination : quotePagination}
          onPageChange={activeTab === "booking" ? setLeadPage : setQuotePage}
        />
      </section>
      <ActionMenu
        isOpen={Boolean(leadActionMenu)}
        onClose={() => setLeadActionMenu(null)}
        anchor={leadActionMenu?.anchor || { x: 0, y: 0 }}
        client={leadActionMenu?.client || null}
        leadId={leadActionMenu?.id || ""}
        basePath="/admin/sales-representative"
        allowPaymentTransaction={false}
      />
      <QuoteDetailsActionMenu
        open={Boolean(quoteActionMenu)}
        anchor={quoteActionMenu?.anchor || { x: 0, y: 0 }}
        onClose={() => setQuoteActionMenu(null)}
        onGoToLead={quoteActionMenu?.leadId ? () => router.push(`/admin/sales-representative/${quoteActionMenu.leadId}`) : undefined}
        onViewDetails={() => {
          if (quoteActionMenu?.id) router.push(`/admin/quotes/${quoteActionMenu.id}?from=shift-management`);
        }}
        onDuplicate={() => {
          if (quoteActionMenu?.id) void duplicateQuote(quoteActionMenu.id);
        }}
        onEdit={() => {
          if (!quoteActionMenu?.id) return;
          const query = new URLSearchParams({
            quoteId: String(quoteActionMenu.id),
            view: "details",
            editMode: "full",
            returnTo: "/admin/sales-representative/shift-management",
          });
          router.push(`/admin/quotes/create?${query.toString()}`);
        }}
        onPaymentTransaction={() => {
          if (quoteActionMenu?.id) router.push(`/admin/quotes/${quoteActionMenu.id}?action=payment&from=shift-management`);
        }}
        onReject={() => {
          if (quoteActionMenu?.id) void rejectQuote(quoteActionMenu.id);
        }}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Salesperson"
        description={`Are you sure you want to remove ${profile.name} from this shift?`}
        confirmLabel="Remove"
        loadingLabel="Removing..."
        isLoading={isDeletingSalesperson}
      />
    </div>
  );
}
