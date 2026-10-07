"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Loader2, Search } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionModal } from "@/components/admin/roles-permissions/ActionModal";
import ActionSuccessModal from "@/components/admin/ActionSuccessModal";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { formatQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quoteStatus";

export type RecordType = "Lead" | "Quote";

export type ReassignRecord = {
  id: string;
  clientName: string;
  type: RecordType;
  status: string;
  amount?: number | null;
};

export type SalesRep = { id: string; name: string; email?: string; roleLabel?: string };

export type AssignmentHistoryItem = {
  recordId: string;
  action: string;
  from: string;
  to: string;
  date: string;
};

type ReassignRecordsPageProps = {
  user: { name: string; roleLabel: string };
  records: ReassignRecord[];
  reps: SalesRep[];
  totalRecords: number;
  totalLeads: number;
  totalQuotes: number;
  page: number;
  typeFilter: "all" | RecordType;
  recordsLoading?: boolean;
  recordsError?: string;
  onSearchChange?: (search: string) => void;
  onPageChange: (page: number) => void;
  onTypeFilterChange: (type: "all" | RecordType) => void;
  history?: AssignmentHistoryItem[];
  pageSize?: number;
  onReassign?: (assignments: RecordAssignment[]) => Promise<number | void> | number | void;
  onAllReassigned?: () => void;
};

type RecordAssignment = { recordId: string; repId: string };
type Pending = { assignments: RecordAssignment[] } | null;

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "NA";

const formatAmount = (amount?: number | null) =>
  amount == null ? "—" : `$${amount.toLocaleString("en-US")}`;

export function ReassignRecordsPage({
  user,
  records: initialRecords,
  reps,
  totalRecords,
  totalLeads,
  totalQuotes,
  page,
  typeFilter,
  recordsLoading = false,
  recordsError = "",
  onSearchChange,
  onPageChange,
  onTypeFilterChange,
  history: initialHistory = [],
  pageSize = 10,
  onReassign,
  onAllReassigned,
}: ReassignRecordsPageProps) {
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const tableRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(page);
  const shouldScrollToTableRef = useRef(false);
  const pageLoadStartedRef = useRef(false);

  const [records, setRecords] = useState(initialRecords);
  const [history, setHistory] = useState(initialHistory);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkRepId, setBulkRepId] = useState("");
  const [rowRepIds, setRowRepIds] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reassignError, setReassignError] = useState("");
  const [isAssignmentSuccessOpen, setIsAssignmentSuccessOpen] = useState(false);
  const [successAssignments, setSuccessAssignments] = useState<RecordAssignment[]>([]);
  const [canDeactivate, setCanDeactivate] = useState(false);

  useEffect(() => {
    setRecords(initialRecords);
    setSelected([]);
    setRowRepIds({});
  }, [initialRecords]);

  useEffect(() => {
    if (previousPageRef.current === page) return;
    previousPageRef.current = page;
    shouldScrollToTableRef.current = true;
    pageLoadStartedRef.current = false;
  }, [page]);

  useEffect(() => {
    if (!shouldScrollToTableRef.current) return;
    if (recordsLoading) {
      pageLoadStartedRef.current = true;
      return;
    }
    if (!pageLoadStartedRef.current) return;

    shouldScrollToTableRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      const table = tableRef.current;
      if (!table) return;

      const scrollContainer = getScrollableParent(table);
      if (scrollContainer) {
        const tableTop = table.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
        scrollContainer.scrollTo({
          top: Math.max(0, scrollContainer.scrollTop + tableTop - 16),
          behavior: "smooth",
        });
        return;
      }

      const tableTop = table.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(0, window.scrollY + tableTop - 16), behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [recordsLoading]);

  useEffect(() => setHistory(initialHistory), [initialHistory]);
  const openLeads = totalLeads;
  const openQuotes = totalQuotes;
  const remaining = totalRecords;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const showingFrom = totalRecords ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = Math.min(currentPage * pageSize, totalRecords);
  const pageRows = records;
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const canAssignSelected = selected.length > 0 && selected.every((id) => Boolean(rowRepIds[id]));

  const syncBulkRep = (recordIds: string[], assignments: Record<string, string>) => {
    const selectedRepIds = recordIds.map((id) => assignments[id]);
    const firstRepId = selectedRepIds[0];
    setBulkRepId(
      firstRepId && selectedRepIds.every((repId) => repId === firstRepId) ? firstRepId : "",
    );
  };

  const toggleRow = (id: string) => {
    const nextSelected = selected.includes(id)
      ? selected.filter((selectedId) => selectedId !== id)
      : [...selected, id];
    setSelected(nextSelected);
    syncBulkRep(nextSelected, rowRepIds);
  };

  const toggleAllOnPage = () => {
    const nextSelected = allOnPageSelected
      ? selected.filter((id) => !pageRows.some((r) => r.id === id))
      : Array.from(new Set([...selected, ...pageRows.map((r) => r.id)]));
    setSelected(nextSelected);
    syncBulkRep(nextSelected, rowRepIds);
  };

  const handleRowRepChange = (recordId: string, repId: string) => {
    const nextRowRepIds = { ...rowRepIds };
    if (repId) nextRowRepIds[recordId] = repId;
    else delete nextRowRepIds[recordId];

    const nextSelected = repId
      ? Array.from(new Set([...selected, recordId]))
      : selected.filter((id) => id !== recordId);

    setRowRepIds(nextRowRepIds);
    setSelected(nextSelected);
    syncBulkRep(nextSelected, nextRowRepIds);
  };

  const handleBulkRepChange = (repId: string) => {
    setBulkRepId(repId);
    setRowRepIds((current) => {
      const next = { ...current };
      selected.forEach((recordId) => {
        if (repId) next[recordId] = repId;
        else delete next[recordId];
      });
      return next;
    });
  };

  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "";

  const handleConfirm = async () => {
    if (!pending) return;
    setIsSaving(true);
    setReassignError("");
    try {
      const remainingCount = await onReassign?.(pending.assignments);
      const assignedIds = pending.assignments.map((assignment) => assignment.recordId);
      const next = records.filter((r) => !assignedIds.includes(r.id));
      setSuccessAssignments(pending.assignments);
      setCanDeactivate(typeof remainingCount === "number" ? remainingCount === 0 : totalRecords <= assignedIds.length);
      setRecords(next);
      setSelected((prev) => prev.filter((id) => !assignedIds.includes(id)));
      setRowRepIds((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !assignedIds.includes(id))));
      setBulkRepId("");
      setPending(null);
      setIsAssignmentSuccessOpen(true);
    } catch (error) {
      setReassignError(error instanceof Error ? error.message : "Failed to reassign records.");
    } finally {
      setIsSaving(false);
    }
  };

  const muted = isDark ? "text-[#AAA7A7]" : "text-[#32323299]";
  const strong = isDark ? "text-white" : "text-[#101010]";
  const card = isDark ? "border-[#2F2F2F] bg-[#121212]" : "border-[#E3E3E3] bg-white";
  const field = isDark
    ? "border-[#2F2F2F] bg-[#171717] text-white placeholder:text-[#777]"
    : "border-[#E3E3E3] bg-white text-[#101010] placeholder:text-[#32323266]";
  const gold = isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]";
  const pendingRepNames = Array.from(
    new Set((pending?.assignments ?? []).map((assignment) => repName(assignment.repId))),
  );
  const successRecordSummary = successAssignments
    .map((assignment) => `${assignment.recordId} to ${repName(assignment.repId)}`)
    .join(", ");
  const successSubtext = `${successRecordSummary} ${successAssignments.length === 1 ? "has" : "have"} been successfully reassigned from ${user.name}.${canDeactivate
    ? ` You can now deactivate ${user.name}.`
    : ` Reassign the remaining records before deactivating ${user.name}.`}`;
  const checkboxClass = `h-5 w-5 rounded-md border transition-all duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-0 ${
    isDark
      ? "border-white/20 bg-[#101010] hover:border-[#E5D5B8]/70 focus-visible:ring-[#E5D5B8]/35 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black data-[state=indeterminate]:border-[#E5D5B8] data-[state=indeterminate]:bg-[#E5D5B8] data-[state=indeterminate]:text-black"
      : "border-[#D0D0D0] bg-white hover:border-[#C9A96E]/80 focus-visible:ring-[#C9A96E]/35 data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white data-[state=indeterminate]:border-[#C9A96E] data-[state=indeterminate]:bg-[#C9A96E] data-[state=indeterminate]:text-white"
  }`;

  return (
    <div
      className="no-scrollbar w-full min-w-0 max-w-full overflow-x-clip"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div
          className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 lg:px-10 ${
            isDark ? "border-[#3D3422] bg-[#2A241A]" : "border-[#E8D1AB] bg-[#FBF4E6]"
          }`}
        >
          <span className={`text-base ${gold}`}>
            {selected.length} {selected.length === 1 ? "record" : "records"} selected
          </span>
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <RepSelect
              value={bulkRepId}
              onChange={handleBulkRepChange}
              reps={reps}
              placeholder="Assign to Sales Rep..."
              className={`h-11 min-w-0 flex-1 sm:w-[240px] sm:flex-none ${field}`}
            />
            <button
              type="button"
              disabled={!canAssignSelected}
              onClick={() =>
                setPending({
                  assignments: selected.map((recordId) => ({
                    recordId,
                    repId: rowRepIds[recordId],
                  })),
                })
              }
              className="h-11 shrink-0 whitespace-nowrap rounded-lg bg-[#E8D1AB] px-5 text-sm font-semibold text-[#101010] transition-all hover:bg-[#d6c29b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reassign Records
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 p-4 pb-20 lg:px-10 lg:py-9">
        {/* Back + heading */}
        <div>
          <Button
            onClick={() => router.back()}
            className={`mb-5 flex items-center gap-2 p-0 text-sm font-medium transition-colors ${
              isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"
            }`}
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-xl font-semibold lg:text-2xl ${strong}`}>Reassign Records</h1>
              <p className={`mt-1 text-sm lg:text-base ${muted}`}>
                Reassign all open sales records before deactivating <span className={gold}>{user.name}</span>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-base font-semibold ${
                  isDark ? "bg-[#F1C7E6] text-black" : "bg-[#E8D1AB] text-[#101010]"
                }`}
              >
                {getInitials(user.name)}
              </div>
              <div>
                <p className={`text-base font-semibold ${strong}`}>{user.name}</p>
                <p className={`text-sm ${muted}`}>{user.roleLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div
          className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${card}`}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm lg:text-base">
            <Stat label="Open Leads" value={openLeads} valueClass="text-[#3B82F6]" muted={muted} />
            <Stat label="Open Quotes" value={openQuotes} valueClass={isDark ? "text-[#E8D1AB]" : "text-[#8E6A2A]"} muted={muted} />
            <Stat label="Remaining" value={remaining} valueClass="text-[#F5A524]" muted={muted} />
          </div>
          <p className={`flex items-center gap-2 text-sm lg:text-base ${strong}`}>
            <span className={`h-2 w-2 rounded-full ${remaining === 0 ? "bg-[#1EAD52]" : "bg-[#F5A524]"}`} />
            {remaining === 0 ? "All records reassigned" : `${remaining} records remaining`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              placeholder="Search records..."
              className={`h-12 w-full rounded-xl border pl-11 pr-4 text-sm outline-none focus:border-[#E8D1AB] ${field}`}
            />
          </div>
          <div className="flex gap-3">
            <Select value={typeFilter} onValueChange={(value) => {
              onTypeFilterChange(value as "all" | RecordType);
            }}>
              <SelectTrigger aria-label="Filter records by type" className={`h-12 min-w-[170px] rounded-xl px-4 ${field}`}>
                <SelectValue placeholder="All Records" />
              </SelectTrigger>
              <SelectContent className={field}>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="Lead">Leads</SelectItem>
                <SelectItem value="Quote">Quotes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className={`overflow-hidden rounded-2xl border ${card}`}>
          <div className={`xl:hidden ${isDark ? "divide-y divide-[#222]" : "divide-y divide-[#EEE]"}`}>
            <div className={`flex items-center gap-3 px-4 py-3 text-sm ${muted}`}>
              <Checkbox
                aria-label="Select all on this page"
                checked={
                  allOnPageSelected
                    ? true
                    : pageRows.some((r) => selected.includes(r.id))
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={toggleAllOnPage}
                className={checkboxClass}
              />
              Select all on this page
            </div>
            {recordsLoading || pageRows.length === 0 ? (
              <div className={`px-4 py-12 text-center text-sm ${muted}`}>
                {recordsLoading ? (
                  <span role="status" className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={18} className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                    Loading open records...
                  </span>
                ) : recordsError ? recordsError : remaining === 0
                  ? `All open records have been reassigned from ${user.name}.`
                  : "No records match your filters."}
              </div>
            ) : pageRows.map((r) => (
              <article key={`mobile-${r.id}`} className="space-y-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    aria-label={`Select ${r.id}`}
                    checked={selected.includes(r.id)}
                    onCheckedChange={() => toggleRow(r.id)}
                    className={checkboxClass}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${strong}`}>{r.id}</span>
                      <span className={`text-xs font-medium ${r.type === "Lead" ? "text-[#3B82F6]" : gold}`}>{r.type}</span>
                    </div>
                    <p className={`mt-1 truncate text-sm ${muted}`}>{r.clientName}</p>
                  </div>
                </div>
                <div>
                  {r.type === "Lead" ? (
                    <LeadsStatusBadge status={r.status} size="compact" />
                  ) : (
                    <span className={`inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full border px-5 py-1.5 text-sm font-semibold ${getQuoteStatusColor(r.status)}`}>
                      {formatQuoteStatusLabel(r.status)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <p className={`text-xs ${muted}`}>Current Rep</p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isDark ? "bg-[#F1C7E6] text-black" : "bg-[#E8D1AB] text-[#101010]"}`}>
                        {getInitials(user.name)}
                      </span>
                      <span className={`truncate text-sm ${strong}`}>{user.name}</span>
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className={`text-xs ${muted}`}>Amount</p>
                    <p className={`mt-2 whitespace-nowrap text-sm font-medium tabular-nums ${strong}`}>{formatAmount(r.amount)}</p>
                  </div>
                </div>
                <div>
                  <p className={`mb-1.5 text-xs ${muted}`}>Assign To Other Rep</p>
                  <RepSelect
                    value={rowRepIds[r.id] ?? ""}
                    onChange={(repId) => handleRowRepChange(r.id, repId)}
                    reps={reps}
                    placeholder="Assign to..."
                    className={`h-11 w-full min-w-0 rounded-xl text-sm ${field}`}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1200px] table-fixed text-left text-base">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[16%]" />
                <col className="w-[7%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead>
                <tr className={`${isDark ? "bg-[#0A0A0A]" : "bg-[#F4F5F7]"} ${strong}`}>
                  <th className="px-6 py-5">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={
                        allOnPageSelected
                          ? true
                          : pageRows.some((r) => selected.includes(r.id))
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAllOnPage}
                      className={`${checkboxClass} h-6 w-6`}
                    />
                  </th>
                  {["ID", "Client Name", "Current Rep", "Type", "Status", "Amount", "Assign To Other Rep"].map((h) => (
                    <th key={h} className={`px-4 py-5 text-base font-medium ${h === "Amount" ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recordsLoading || pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`px-6 py-16 text-center ${muted}`}>
                      {recordsLoading ? (
                        <span role="status" className="inline-flex items-center justify-center gap-2">
                          <Loader2
                            size={20}
                            className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}
                          />
                          Loading open records...
                        </span>
                      ) : recordsError
                          ? recordsError
                          : remaining === 0
                        ? `All open records have been reassigned from ${user.name}.`
                        : "No records match your filters."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.id} className={`h-20 border-t ${isDark ? "border-[#222] bg-[#111111]" : "border-[#EEE] bg-white"}`}>
                      <td className="px-6 py-3">
                        <Checkbox
                          aria-label={`Select ${r.id}`}
                          checked={selected.includes(r.id)}
                          onCheckedChange={() => toggleRow(r.id)}
                          className={`${checkboxClass} h-6 w-6`}
                        />
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 font-medium underline underline-offset-4 ${strong}`}>{r.id}</td>
                      <td className={`truncate px-4 py-3 ${strong}`} title={r.clientName}>{r.clientName}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                              isDark ? "bg-[#F1C7E6] text-black" : "bg-[#E8D1AB] text-[#101010]"
                            }`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <span className={`min-w-0 truncate ${strong}`} title={user.name}>{user.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${r.type === "Lead" ? "text-[#3B82F6]" : gold}`}>{r.type}</td>
                      <td className="px-4 py-3">
                        <div className="w-full min-w-0">
                          {r.type === "Lead" ? (
                            <LeadsStatusBadge status={r.status} size="compact" />
                          ) : (
                            <span
                              className={`inline-flex w-fit items-center justify-center whitespace-nowrap rounded-full border px-5 py-1.5 text-sm font-semibold ${getQuoteStatusColor(r.status)}`}
                            >
                              {formatQuoteStatusLabel(r.status)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right text-base tabular-nums ${strong}`}>{formatAmount(r.amount)}</td>
                      <td className="px-4 py-3">
                        <RepSelect
                          value={rowRepIds[r.id] ?? ""}
                          onChange={(repId) => handleRowRepChange(r.id, repId)}
                          reps={reps}
                          placeholder="Assign to..."
                          className={`h-12 w-full min-w-[200px] rounded-xl text-base ${field}`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-[#242424] bg-[#101010] text-white/70" : "border-[#E3E3E3] bg-[#FFFCF6] text-[#32323299]"}`}>
            <span className="whitespace-nowrap">
              {totalRecords > 0 ? `Showing ${showingFrom} to ${showingTo} of ${totalRecords} entries` : "Showing 0 entries"}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`h-9 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${isDark ? "border-white/5 bg-[#171717] text-white/65 hover:bg-white/5" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-zinc-50"}`}>
                Previous
              </button>
              {buildPaginationItems(currentPage, totalPages).map((item, index) => item === "..." ? (
                <span key={`page-gap-${index}`} className={`px-2 ${isDark ? "text-white/45" : "text-[#999]"}`}>...</span>
              ) : (
                <button key={item} type="button" onClick={() => onPageChange(item)} aria-current={item === currentPage ? "page" : undefined} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${item === currentPage ? "bg-[#E5D5B8] text-black" : isDark ? "text-white/65 hover:bg-white/5 hover:text-white" : "text-[#323232] hover:bg-black/5"}`}>
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`h-9 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${isDark ? "border-white/5 bg-[#171717] text-white/65 hover:bg-white/5" : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-zinc-50"}`}>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Assignment history */}
        <div className={`overflow-hidden rounded-2xl border ${card}`}>
          <h2 className={`px-5 py-4 text-base font-semibold ${strong}`}>Assignment History</h2>
          {history.length === 0 ? (
            <p className={`px-5 pb-5 text-sm ${muted}`}>Reassignments you make will show up here.</p>
          ) : (
            <ul className={isDark ? "bg-[#161616]" : "bg-[#FAFAFA]"}>
              {history.map((h, i) => (
                <li
                  key={`${h.recordId}-${i}`}
                  className={`flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:items-center ${
                    i > 0 ? (isDark ? "border-t border-[#222]" : "border-t border-[#EEE]") : ""
                  }`}
                >
                  <span className={`w-24 ${muted}`}>{h.recordId}</span>
                  <span className={`flex-1 ${muted}`}>{h.action}</span>
                  <span className={`sm:mr-8 ${muted}`}>
                    {h.from} <span className="mx-1">→</span> <span className={gold}>{h.to}</span>
                  </span>
                  <span className={strong}>{h.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ActionModal
        isOpen={!!pending}
        onClose={() => {
          if (!isSaving) setPending(null);
        }}
        onConfirm={handleConfirm}
        title={`Reassign ${pending?.assignments.length ?? 0} ${(pending?.assignments.length ?? 0) === 1 ? "record" : "records"}?`}
        description={`${user.name} will no longer be the owner of these records. ${
          pendingRepNames.length === 1
            ? `${pendingRepNames[0]} will become the new owner.`
            : `${pendingRepNames.join(", ")} will become the new owners.`
        }${reassignError ? ` ${reassignError}` : ""}`}
        confirmLabel={isSaving ? "Reassigning..." : "Confirm Reassignment"}
        isLoading={isSaving}
      />

      <ActionSuccessModal
        isOpen={isAssignmentSuccessOpen}
        onSubmit={() => {
          setIsAssignmentSuccessOpen(false);
          if (canDeactivate) onAllReassigned?.();
        }}
        title="Records Reassigned Successfully"
        subtext={successSubtext}
        buttonText={canDeactivate ? "Continue to Deactivation" : "Continue"}
      />
    </div>
  );
}
function Stat({ label, value, valueClass, muted }: { label: string; value: number; valueClass: string; muted: string }) {
  return (
    <span className={muted}>
      {label} <span className={`ml-1 text-lg font-semibold ${valueClass}`}>{value}</span>
    </span>
  );
}

const AVATAR_TINTS_DARK = ["#2E3B2E", "#3B2E2E", "#2E3B3B", "#3B3B2E", "#3B2E3B", "#2E2E3B"];
const AVATAR_TINTS_LIGHT = ["#DDEBDD", "#F0DCDC", "#DAEBEB", "#EBEBD2", "#EBDAEB", "#DADAEB"];

function RepSelect({
  value,
  onChange,
  reps,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  reps: SalesRep[];
  placeholder: string;
  className?: string;
}) {
  const { isDark } = useResolvedTheme();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = reps.find((r) => r.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuH = Math.min(reps.length * 64 + 16, 320);
        const width = rect.width;
    const openUp = rect.bottom + menuH + 8 > window.innerHeight && rect.top > menuH + 8;
    setPos({
      top: openUp ? rect.top - menuH - 8 : rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
    });
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border pl-4 pr-3 text-left outline-none focus:border-[#E8D1AB] ${className}`}
      >
        <span className={`truncate ${selected ? "" : "opacity-60"}`}>{selected ? selected.name : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[80] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: 320 }}
            className={`no-scrollbar fixed z-[81] overflow-y-auto rounded-2xl p-2 shadow-2xl ${
              isDark ? "border border-white/5 bg-[#171717]" : "border border-[#E3E3E3] bg-white"
            }`}
          >
            {selected ? (
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isDark ? "text-[#AAA] hover:bg-white/5" : "text-[#32323299] hover:bg-black/[0.03]"
                }`}
              >
                Clear selection
              </button>
            ) : null}
            {reps.map((rep, i) => (
              <button
                key={rep.id}
                type="button"
                role="option"
                aria-selected={rep.id === value}
                onClick={() => {
                  onChange(rep.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  rep.id === value
                    ? isDark
                      ? "bg-white/10"
                      : "bg-black/5"
                    : isDark
                      ? "hover:bg-white/5"
                      : "hover:bg-black/[0.03]"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isDark ? "text-white" : "text-[#101010]"
                  }`}
                  style={{
                    backgroundColor: (isDark ? AVATAR_TINTS_DARK : AVATAR_TINTS_LIGHT)[i % 6],
                  }}
                >
                  {getInitials(rep.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-base font-semibold ${isDark ? "text-white" : "text-[#101010]"}`}>
                    {rep.name}
                  </span>
                  {rep.email ? (
                    <span className={`block truncate text-sm ${isDark ? "text-[#777]" : "text-[#32323299]"}`}>
                      {rep.email}
                    </span>
                  ) : null}
                  <span className={`block truncate text-xs ${isDark ? "text-[#AAA]" : "text-[#32323299]"}`}>
                    {rep.roleLabel ?? "Sales Rep"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function buildPaginationItems(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) pages.push(pageNumber);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function getScrollableParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
