"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */


import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Edit2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { shiftManagementApi } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import RoundRobinConfigurationView from "@/components/admin/sales-representative/RoundRobinConfigurationView";
import SalespeopleDetailView, { type SalespeopleProfile } from "@/components/admin/sales-representative/SalespeopleDetailView";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import { toast } from "sonner";

export type ShiftDetail = {
  id?: number | string;
  name: string;
  hours: string;
  days: string[];
  status: "active" | "inactive";
  stored_status?: "active" | "inactive";
  shift_overlapping?: boolean;
};

type SalesMember = {
  id?: number | string;
  sales_rep_id?: number | string;
  name: string;
  email: string;
  enabled: boolean;
  lastActivity: string;
  initials: string;
  color: string;
  overlap?: boolean;
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const avatarColors = ["#F5C5E4", "#D6E6FF", "#F5E9D5", "#D8C3F4", "#D7F5D2", "#F3D9C8"];

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

function TablePagination({
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
            <span key={`manage-salespeople-page-gap-${index}`} className="px-2 text-white/45">...</span>
          ) : (
            <button
              key={`manage-salespeople-page-${page}`}
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

function getInitials(name?: string) {
  return String(name || "NA")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function parseDateValue(value?: string | null) {
  if (!value || String(value).trim().toLowerCase() === "n/a") return null;
  const normalized = String(value).includes("T") ? String(value) : String(value).replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShortDate(value?: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return "N/A";
  return `${parsed.getDate()} ${parsed.toLocaleString("en-US", { month: "short" })}, ${parsed.getFullYear()}`;
}

function normalizeStatus(value: any): "active" | "inactive" {
  return String(value || "").toLowerCase() === "active" || value === true ? "active" : "inactive";
}

function formatStatusLabel(value: any): "Active" | "In Active" {
  return normalizeStatus(value) === "active" ? "Active" : "In Active";
}

function formatDisplayTime(time?: string) {
  if (!time) return "";
  const match = String(time).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return String(time);

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const displayHour = hour % 12 || 12;
  const displayMeridiem = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${minute} ${displayMeridiem}`;
}

function formatShiftHours(detail: any, fallbackHours?: string) {
  const start = detail?.start_time || detail?.startTime || detail?.start || "";
  const end = detail?.end_time || detail?.endTime || detail?.end || "";
  if (start && end) return `${formatDisplayTime(start)} - ${formatDisplayTime(end)}`;

  const rawHours = detail?.working_hours || detail?.hours || fallbackHours || "";
  if (rawHours.includes("-")) {
    const [rawStart, rawEnd] = rawHours.split("-").map((part: string) => part.trim());
    if (rawStart && rawEnd) return `${formatDisplayTime(rawStart)} - ${formatDisplayTime(rawEnd)}`;
  }

  return rawHours || "N/A";
}

function DayPill({ day }: { day: string }) {
  return (
    <span className="rounded bg-[#E5D5B8] px-1.5 py-1 text-[10px] font-medium text-black">
      {day}
    </span>
  );
}

function StatusPill({ status }: { status: "active" | "inactive" }) {
  return (
    <span className={`inline-flex rounded-full px-5 py-2 text-xs font-medium ${status === "active" ? "bg-[#B9F8CF] text-[#0D542B]" : "bg-[#FFF5F5] text-[#FF4D4D] border-[#FF4D4D]/20"}`}>
      {formatStatusLabel(status)}
    </span>
  );
}

function MemberToggle({ enabled, onClick }: { enabled: boolean; onClick: React.MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[24px] w-[38px] rounded-md p-1 transition ${enabled ? "bg-[#E5D5B8]" : "bg-[#454545]"}`}
      aria-label={enabled ? "Disable user" : "Enable user"}
    >
      <span className={`absolute left-1 top-1 h-4 w-4 rounded bg-white transition-transform ${enabled ? "translate-x-[14px]" : "translate-x-0"}`} />
    </button>
  );
}

export default function ShiftDetailView({
  shift,
  onBack,
  onConfigureChange,
  onSalespersonChange,
  onRefresh,
  onEditShift,
  refreshKey,
}: {
  shift: ShiftDetail;
  onBack: () => void;
  onConfigureChange?: (isConfiguring: boolean) => void;
  onSalespersonChange?: (isOpen: boolean) => void;
  onRefresh?: () => void | Promise<void>;
  onEditShift?: (shift: ShiftDetail) => void;
  refreshKey?: number;
}) {
  const [statusFilter, setStatusFilter] = useState("User Status");
  const [isConfiguringOrder, setIsConfiguringOrder] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<SalespeopleProfile | null>(null);
  const [shiftDetail, setShiftDetail] = useState(shift);
  const [salesMembers, setSalesMembers] = useState<SalesMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPagination, setMemberPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [deleteMember, setDeleteMember] = useState<SalesMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const debouncedMemberSearch = useDebounce(memberSearch, 350);

  const handleConfigureChange = (nextValue: boolean) => {
    setIsConfiguringOrder(nextValue);
    onConfigureChange?.(nextValue);
  };

  const handleSalespersonChange = (profile: SalespeopleProfile | null) => {
    setSelectedSalesperson(profile);
    onSalespersonChange?.(Boolean(profile));
  };

  const handleConfirmRemoveSalesperson = async () => {
    if (!shift.id || !deleteMember?.sales_rep_id) return;
    setIsDeletingMember(true);
    const response = await shiftManagementApi.removeShiftSalesperson(shift.id, deleteMember.sales_rep_id);
    setIsDeletingMember(false);
    if (!response.success) {
      toast.error(response.error || "Failed to remove salesperson");
      return;
    }
    toast.success("Salesperson removed");
    setDeleteMember(null);
    await loadShiftDetail();
    await onRefresh?.();
  };

  useEffect(() => {
    if (!selectedSalesperson && !isConfiguringOrder) return;
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedSalesperson, isConfiguringOrder]);

  useEffect(() => {
    setShiftDetail(shift);
  }, [shift]);

  const loadShiftDetail = async () => {
  if (!shift.id) return;

  setIsLoadingMembers(true);

  try {
    const [detailRes, peopleRes] = await Promise.all([
      shiftManagementApi.getShiftDetail(shift.id),
      shiftManagementApi.getShiftSalespeople(shift.id, {
        search: debouncedMemberSearch || undefined,
        user_status: statusFilter === "User Status" ? undefined : statusFilter,
        page: memberPage,
        limit: 10,
      }),
    ]);

    const detail = detailRes?.data?.data || detailRes?.data;
    if (detail) {
      setShiftDetail({
        id: detail.id || detail.shift_id || shift.id,
        name: detail.name || detail.shift_name || shift.name,
        hours: formatShiftHours(detail, shift.hours),
        days: detail.active_days || detail.days || shift.days,
        status: normalizeStatus(detail.status ?? detail.stored_status),
        stored_status: normalizeStatus(detail.stored_status ?? detail.status),
        shift_overlapping: Boolean(detail.shift_overlapping),
      });
    }

    const data = peopleRes?.data?.data || peopleRes?.data;
    const list = Array.isArray(data?.rows) ? data.rows : [];
    const pagination = data?.pagination || {};
    setMemberPagination({
      page: Number(pagination.page || memberPage || 1),
      limit: Number(pagination.limit || 10),
      total: Number(pagination.total || list.length || 0),
      pages: Number(pagination.pages || Math.max(1, Math.ceil(Number(pagination.total || list.length || 0) / Number(pagination.limit || 10)))),
    });
    setSalesMembers(
      list.map((person: any, index: number) => {
        const email = person.email || "No email";
        const name = person.name || person.salesperson_name || email;
        return {
          id: person.id || person.sales_rep_id || person.user_id,
          sales_rep_id: person.sales_rep_id || person.id || person.user_id,
          name,
          email,
          enabled: Boolean(person.user_status ?? person.enabled ?? person.is_enabled ?? person.is_active),
          lastActivity: formatShortDate(person.last_activity || person.last_activity_at),
          initials: person.initials || getInitials(name),
          color: person.color || avatarColors[index % avatarColors.length],
          overlap: Boolean(person.shift_overlapping || person.overlap),
        };
      })
    );
  } finally {
    setIsLoadingMembers(false);
  }
};

  useEffect(() => {
    void loadShiftDetail();
  }, [shift.id, debouncedMemberSearch, statusFilter, memberPage, refreshKey]);

  useEffect(() => {
    setMemberPage(1);
  }, [shift.id, debouncedMemberSearch, statusFilter]);

  if (isConfiguringOrder) {
    return <RoundRobinConfigurationView shiftId={shift.id} shiftName={shift.name} onBack={() => handleConfigureChange(false)} />;
  }

  if (selectedSalesperson) {
    return (
      <SalespeopleDetailView
        profile={selectedSalesperson}
        shiftId={shift.id}
        onRefresh={async () => {
          await loadShiftDetail();
          await onRefresh?.();
        }}
        onBack={() => {
          handleSalespersonChange(null);
          void loadShiftDetail();
        }}
      />
    );
  }

  return (
    <div className="min-h-full bg-[#101010] font-[var(--font-geist-sans)] text-white">
      {shiftDetail.shift_overlapping ? (
        <div className="border-b border-[#E5D5B8]/30 bg-[#2A241B]/55 px-6 py-4 lg:px-9">
          <p className="flex items-center gap-2 text-sm text-[#E5D5B8]">
            <AlertTriangle size={15} />
            Overlapping shift conflict detected. One or more salespeople are assigned to concurrent shifts.
          </p>
        </div>
      ) : null}

      <div className="px-4 py-6 lg:px-9 lg:py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-7 flex items-center gap-2 text-sm text-white/85 transition hover:text-[#E5D5B8]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="rounded-2xl border border-[#2D2D2D] bg-[#171717] px-6 py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold capitalize">{shiftDetail.name}</h1>
              <StatusPill status={shiftDetail.status} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span>Working Hours : <span className="text-white">{shiftDetail.hours}</span></span>
                <span className="hidden h-5 w-px bg-white/30 sm:block" />
                <div className="flex items-center gap-2">
                  <span>Active Days :</span>
                  <div className="flex gap-1">
                    {shiftDetail.days.map((day, index) => (
                      <DayPill key={`${day}-${index}`} day={day} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleConfigureChange(true)}
                className="flex h-12 items-center gap-2 rounded-lg border border-[#2D2D2D] bg-[#202020] px-5 text-sm font-semibold text-white transition hover:border-[#E5D5B8]/40"
              >
                <RefreshCw size={16} />
                Configure RR Order
              </button>
              <button
                type="button"
                onClick={() => onEditShift?.(shiftDetail)}
                className="flex h-12 items-center gap-2 rounded-lg bg-[#E5D5B8] px-6 text-sm font-semibold text-black transition hover:bg-[#D9C49E]"
              >
                <Edit2 size={16} />
                Edit Shift
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#111]">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <span className="h-[30px] w-[3px] bg-[#E5D5B8]" />
              <h2 className="text-lg font-medium">Manage Salespeople</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <BasicDropdown label="User Status" value={statusFilter} options={["User Status", "Active", "In Active"]} onChange={setStatusFilter} roundedFull styles="text-white/70 text-xs" />
            </div>
          </div>

          <div className="px-5 pb-5">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
              <input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} className="h-11 w-full rounded-lg border border-[#2D2D2D] bg-[#242424] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35" placeholder="Search Members..." />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-y border-[#242424] bg-[#101010] text-xs font-medium text-[#E5D5B8]">
                <tr>
                  <th className="px-5 py-4">Sales People Name</th>
                  <th className="px-5 py-4">Email ID</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">User Status</th>
                  <th className="px-5 py-4">Last Activity</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
             <tbody>
              {isLoadingMembers ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10">
                    <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                      <Loader2 className="h-5 w-5 animate-spin text-[#E5D5B8]" />
                      Loading salespeople...
                    </div>
                  </td>
                </tr>
              ) : salesMembers.length ? salesMembers.map((member) => (
                  <tr
                    key={member.sales_rep_id || member.email}
                    onClick={() => handleSalespersonChange(member)}
                    className="cursor-pointer border-b border-[#242424] text-sm text-white/85 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-md text-base font-semibold text-black" style={{ backgroundColor: member.color }}>{member.initials}</span>
                        <div>
                          <p>{member.name}</p>
                          {member.overlap ? (
                            <p className="mt-1 flex items-center gap-1 text-xs text-[#F5C84B]">
                              <AlertTriangle size={13} />
                              Shift Overlapping
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{member.email}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={member.enabled ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-4">
                      <MemberToggle
                        enabled={member.enabled}
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (!shift.id || !member.sales_rep_id) return;
                          const nextUserStatus = !member.enabled;
                          const response = await shiftManagementApi.toggleShiftSalesperson(shift.id, member.sales_rep_id, nextUserStatus);
                          if (!response.success) {
                            toast.error(response.error || "Failed to toggle salesperson");
                            return;
                          }
                          setSalesMembers((current) =>
                            current.map((item) =>
                              String(item.sales_rep_id) === String(member.sales_rep_id)
                                ? { ...item, enabled: nextUserStatus }
                                : item
                            )
                          );
                          toast.success("Salesperson updated");
                          await loadShiftDetail();
                        }}
                      />
                    </td>
                    <td className="px-5 py-4">{member.lastActivity}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-5 text-white/80">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteMember(member);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-[#F05454]/15 hover:text-[#F05454]"
                          aria-label={`Remove ${member.name}`}
                        >
                          <Trash2 size={19} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSalespersonChange(member);
                          }}
                          aria-label={`Open ${member.name}`}
                        >
                          <ChevronRight size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-white/45">No salespeople found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination pagination={memberPagination} onPageChange={setMemberPage} />
        </section>
      </div>
      <DeleteConfirmationModal
        isOpen={Boolean(deleteMember)}
        onClose={() => setDeleteMember(null)}
        onConfirm={handleConfirmRemoveSalesperson}
        title="Remove Salesperson"
        description={`Are you sure you want to remove ${deleteMember?.name || "this salesperson"} from this shift?`}
        confirmLabel="Remove"
        loadingLabel="Removing..."
        isLoading={isDeletingMember}
      />
    </div>
  );
}
