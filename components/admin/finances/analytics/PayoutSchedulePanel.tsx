"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import type { FinancePayoutScheduleParams, FinancePayoutScheduleRow } from "@/lib/api";
import type { SegmentId } from "../CPPayoutTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { toast } from "sonner";

type PayoutStatus = "Pending" | "Partially Paid" | "Finance Approval" | "Approved" | "Fully Paid";
type DueTone = "amber" | "red" | "blue";

type PayoutRow = {
  id: string;
  name: string;
  roles: string;
  tint: string;
  shootId: string;
  created: string;
  customer: string;
  shootAmount: number;
  payout: number;
  due: string;
  scheduledDate: string | null;
  hasDueDate: boolean;
  dueTone: DueTone;
  pending: number;
  status: PayoutStatus;
};

const TINTS = ["#FED1EF", "#FFF6DA", "#D1FAD7", "#E5E7EB", "#FFFFFF", "#DCE7FF"];
const tintFor = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return TINTS[hash % TINTS.length];
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${month}/${day}/${year}` : value;
};

const localToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const STATUS_STYLES: Record<PayoutStatus, string> = {
  Pending: "bg-[#FFF4C9] text-[#BA6605]",
  "Partially Paid": "bg-[#DBEAFE] text-[#1D4ED8]",
  "Finance Approval": "bg-[#FFF4C9] text-[#BA6605]",
  Approved: "bg-[#D4FFE4] text-[#16A34A]",
  "Fully Paid": "bg-[#E9E5FF] text-[#6D4AE0]",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const pageList = (current: number, total: number): Array<number | "…"> => {
  const items: Array<number | "…"> = [];
  for (let p = 1; p <= total; p += 1) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) items.push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
};

/* ---------- Component ---------- */
interface PayoutSchedulePanelProps {
  open: boolean;
  bucketId: string;
  bucketLabel: string;
  loading?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  segmentId?: SegmentId;
  segmentLabel?: string;
  onScheduleUpdated?: () => void;
}

export default function PayoutSchedulePanel({ open, bucketId, bucketLabel, loading = false, startDate = null, endDate = null, segmentId, segmentLabel, onScheduleUpdated }: PayoutSchedulePanelProps) {
  const { theme, resolvedTheme } = useTheme();
  const { canEdit } = usePermissions("admin_finances_cp_compensation");
  const [mounted, setMounted] = useState(false);
  const [snapLabel, setSnapLabel] = useState(bucketLabel); // collapse vakhte title na jay
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<PayoutRow | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousBucketId = useRef(bucketId);
  const itemsPerPage = 10;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (editingRow) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [editingRow]);

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRow || !scheduledDate || !canEdit || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await adminApi.updateFinancePayoutSchedule(editingRow.id, scheduledDate);
      if (!result.success) {
        setSaveError(result.error || "Failed to update payout schedule.");
        return;
      }
      setEditingRow(null);
      setRefreshKey((value) => value + 1);
      onScheduleUpdated?.();
      toast.success("Payout schedule updated");
    } catch {
      setSaveError("Failed to update payout schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const bucketChanged = previousBucketId.current !== bucketId;
    previousBucketId.current = bucketId;
    if (!open || !bucketChanged || !panelRef.current) return;

    panelRef.current.animate(
      [
        { transform: "translateY(-2rem)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [bucketId, open]);

  // Navi bucket khule tyare reset
  useEffect(() => {
    if (!open) return;
    setSnapLabel(segmentLabel ? `${bucketLabel} · ${segmentLabel}` : bucketLabel);
    setSearch("");
    setDebouncedSearch("");
    setCurrentPage(1);
  }, [open, bucketId, bucketLabel, segmentId, segmentLabel]);

  // Smooth-scroll to the panel when a bucket is opened or switched
  useEffect(() => {
    if (!open || !bucketId) return;
    const el = wrapperRef.current;
    if (!el) return;
    let cancelled = false;

    const go = () => {
      if (cancelled) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };

    // If ANOTHER panel is still collapsing, wait for it so the final position is stable
    const others = document
      .getAnimations()
      .filter(
        (a) =>
          a instanceof CSSTransition &&
          a.transitionProperty === "grid-template-rows" &&
          (a.effect as KeyframeEffect | null)?.target !== el,
      )
      .map((a) => a.finished.catch(() => undefined));

    if (others.length) Promise.all(others).then(go);
    else go();

    return () => {
      cancelled = true;
    };
  }, [open, bucketId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setCurrentPage(1), [debouncedSearch]);

  useEffect(() => {
    if (!open || !bucketId) return;
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);
    adminApi.getFinancePayoutSchedule({
      bucket_id: bucketId as FinancePayoutScheduleParams['bucket_id'],
      segment_id: segmentId,
      search: debouncedSearch || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: currentPage,
      limit: itemsPerPage,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    }, controller.signal).then((response) => {
      if (response.canceled || controller.signal.aborted) return;
      if (!response.success || !response.data) {
        setRows([]);
        setTotalPages(1);
        setError(response.error || "Failed to load payout schedule.");
        return;
      }
      const today = localToday();
      setRows(response.data.rows.map((row: FinancePayoutScheduleRow) => ({
        id: row.id,
        name: row.creator_name,
        roles: row.creator_roles,
        tint: tintFor(String(row.creator_id)),
        shootId: row.shoot_id,
        created: formatDate(row.created_date),
        customer: row.customer_name,
        shootAmount: row.shoot_amount,
        payout: row.cp_payout,
        due: row.due_date === today ? "Today" : formatDate(row.due_date),
        scheduledDate: row.scheduled_payout_date,
        hasDueDate: Boolean(row.original_due_date),
        dueTone: row.due_date && row.due_date < today ? "red" : row.due_date && row.due_date > today ? "blue" : "amber",
        pending: row.pending_amount,
        status: row.status,
      })));
      setTotalPages(Math.max(1, response.data.pagination.total_pages));
      if (response.data.pagination.page !== currentPage) setCurrentPage(response.data.pagination.page);
    }).catch(() => {
      if (!controller.signal.aborted) { setRows([]); setError("Failed to load payout schedule."); }
    }).finally(() => {
      if (!controller.signal.aborted) setIsFetching(false);
    });
    return () => controller.abort();
  }, [open, bucketId, segmentId, startDate, endDate, debouncedSearch, currentPage, refreshKey]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = rows;
  const showLoader = loading || isFetching;

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const muted = isDark ? "text-[#FFFFFF80]" : "text-black/40";
  const dueCls = (tone: DueTone) =>
    tone === "red" ? "text-[#FF6467]" : tone === "blue" ? "text-[#5891EF]" : "text-[#E8B04B]";

  return (
    <>
    <div
      ref={wrapperRef}
      aria-hidden={!open}
      className={`grid w-full scroll-mt-24 transition-[grid-template-rows] duration-500 ease-out lg:scroll-mt-28 ${open ? "mt-3 grid-rows-[1fr] lg:mt-6" : "grid-rows-[0fr]"}`}
    >
      <div className="min-h-0 overflow-hidden">
        {/* top → bottom */}
        <section
          ref={panelRef}
          className={`w-full overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"} ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}
        >
          {/* Header */}
          <div className={`flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h3 className={`text-sm font-medium lg:text-lg ${isDark ? "text-white" : "text-[#323232]"}`}>
                {snapLabel} CP Payouts
              </h3>
            </div>
            <div className="relative w-full lg:w-[320px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creator, customer, shoot ID..."
                className={`h-10 w-full rounded-lg border pl-9 pr-4 text-sm transition-colors focus:outline-none ${isDark ? "border-[#333333] bg-zinc-900 text-white focus:border-[#E8D1AB]" : "border-[#E5E5E5] bg-white text-black focus:border-[#E8D1AB]"}`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed text-left [&_td]:align-middle">
              <thead className={`border-b ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
                <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  <th className="w-[20%] px-5 py-3">Creator Name</th>
                  <th className="w-[12%] px-4 py-3">Shoot ID</th>
                  <th className="w-[14%] px-4 py-3">Customer</th>
                  <th className="w-[12%] px-4 py-3">Shoot Amount</th>
                  <th className="w-[16%] px-4 py-3">CP Payout</th>
                  <th className="w-[16%] px-4 py-3">Status</th>
                  <th className="w-[10%] px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {showLoader ? (
                  <tr>
                    <td colSpan={7} className="h-[620px] p-0">
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#E5D5B8]" />
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-10 text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                      {error || "No payouts found."}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.id} className={isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"}>
                      <td className="px-5 py-[9px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium text-[#171717]"
                            style={{ backgroundColor: row.tint }}
                          >
                            {getInitials(row.name)}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.name}</p>
                            <p className={`truncate text-[11px] ${muted}`}>{row.roles}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-[9px]">
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.shootId}</p>
                        <p className={`text-[10px] ${muted}`}>Created on {row.created}</p>
                      </td>
                      <td className={`truncate px-4 py-[9px] text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.customer}</td>
                      <td className={`px-4 py-[9px] text-sm ${isDark ? "text-white/90" : "text-[#171717]"}`}>{formatCurrency(row.shootAmount)}</td>
                      <td className="px-4 py-[9px]">
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{formatCurrency(row.payout)}</p>
                        <p className={`text-[10px] ${dueCls(row.dueTone)}`}>Due: {row.due}</p>
                        <p className={`text-[10px] ${muted}`}>Scheduled: {formatDate(row.scheduledDate)}</p>
                        <p className={`text-[10px] ${muted}`}>Pending Amount {formatCurrency(row.pending)}</p>
                      </td>
                      <td className="px-4 py-[9px]">
                        <span className={`inline-flex min-w-[130px] items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-[9px] text-right">
                        {canEdit && <button
                          type="button"
                          aria-label={`Schedule payout for ${row.name}, shoot ${row.shootId}`}
                          title={row.hasDueDate ? "Schedule payout" : "Set a due date in CP Compensation before scheduling"}
                          disabled={!row.hasDueDate}
                          onClick={() => { setEditingRow(row); setScheduledDate(row.scheduledDate || localToday()); setSaveError(null); }}
                          className={`inline-flex items-center justify-center rounded-lg p-1 transition-colors disabled:opacity-40 ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                        >
                          <CalendarDays size={22} />
                        </button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 ${isDark ? "border-[#3D3D3D] bg-[#141414] text-white" : "border-[#E3E3E3] bg-white text-[#202020]"}`}>
            <p className="text-sm lg:text-base">Page {safePage} of {totalPages}</p>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? "text-zinc-300 hover:bg-white/5" : "text-zinc-600 hover:bg-black/5"}`}
              >
                <ChevronLeft size={18} />
              </button>
              {pageList(safePage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className={`w-9 text-center ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`h-10 w-10 rounded-lg text-sm transition-colors lg:text-base ${
                      p === safePage
                        ? isDark
                          ? "border border-[#E8D1AB]/70 bg-[#1E1B16] text-white"
                          : "border border-[#CFAF78] bg-[#FFF8EC] text-[#202020]"
                        : isDark
                          ? "text-zinc-400 hover:bg-white/5"
                          : "text-zinc-500 hover:bg-black/5"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                aria-label="Next page"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? "text-zinc-300 hover:bg-white/5" : "text-zinc-600 hover:bg-black/5"}`}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        </section>
      </div>
    </div>
    <dialog ref={dialogRef} aria-labelledby="payout-schedule-title" onCancel={(event) => { if (saving) event.preventDefault(); else setEditingRow(null); }} onClose={() => setEditingRow(null)} className={`fixed m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border p-6 shadow-2xl backdrop:bg-black/60 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      <form onSubmit={saveSchedule}>
        <h3 id="payout-schedule-title" className="text-lg font-semibold">Schedule payout</h3>
        <p className={`mt-2 text-sm ${muted}`}>{editingRow?.name} · {editingRow?.shootId}</p>
        <p className={`mt-2 text-sm ${muted}`}>Original due date: {editingRow?.due}. Scheduling sets when finance plans to pay; the original deadline stays the same.</p>
        <label htmlFor="scheduled-payout-date" className="mt-5 block text-sm">Scheduled payout date</label>
        <input id="scheduled-payout-date" type="date" required autoFocus disabled={saving} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className={`mt-2 w-full rounded-lg border p-3 ${isDark ? "bg-[#222] border-[#444] [color-scheme:dark]" : "bg-white border-[#ddd]"}`} />
        <p className={`mt-2 text-xs ${muted}`}>A past date places the payment in the Overdue row. Dates more than 27 days ahead are outside this timeline.</p>
        {saveError && <p role="alert" className="mt-3 text-sm text-red-500">{saveError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => setEditingRow(null)} className="rounded-lg border px-4 py-2 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving || !scheduledDate} className="rounded-lg bg-[#E8D1AB] px-4 py-2 text-[#171717] disabled:opacity-50">{saving ? "Saving..." : "Save schedule"}</button>
        </div>
      </form>
    </dialog>
    </>
  );
}
