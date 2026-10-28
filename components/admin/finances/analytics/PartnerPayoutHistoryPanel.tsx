"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { adminApi } from "@/lib/api";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HistoryRow = {
  id: string;
  shootId: string;
  project: string;
  date: string;
  tint: string;
  service: string;
  payout: number;
  method: string;
  status: "Completed" | "Pending";
};

const BASE: Omit<HistoryRow, "id">[] = [
  { shootId: "#1234", project: "Music Video", date: "Jan 13, 2026", tint: "#FED1EF", service: "Videography", payout: 12000, method: "Stripe", status: "Completed" },
  { shootId: "#1234", project: "Baby Shower Shoot", date: "Jan 13, 2026", tint: "#FFF6DA", service: "Photography", payout: 8000, method: "Bank Transfer", status: "Completed" },
  { shootId: "#1234", project: "Ring Ceremony Shoot", date: "Jan 13, 2026", tint: "#FFFFFF", service: "Photography", payout: 14000, method: "Stripe", status: "Completed" },
  { shootId: "#1234", project: "Maya Product Shoot", date: "Jan 13, 2026", tint: "#D1FAD7", service: "Photo + Video", payout: 4000, method: "Stripe", status: "Completed" },
  { shootId: "#1234", project: "Gym Opening Shoot", date: "Jan 13, 2026", tint: "#FFF6DA", service: "Photo + Video", payout: 15000, method: "Stripe", status: "Completed" },
  { shootId: "#1234", project: "Wedding Shoot", date: "Jan 13, 2026", tint: "#FFFFFF", service: "Photography", payout: 6000, method: "Bank Transfer", status: "Completed" },
  { shootId: "#1234", project: "Podcast Shoot", date: "Jan 13, 2026", tint: "#FFFFFF", service: "Videography", payout: 8200, method: "Bank Transfer", status: "Pending" },
  { shootId: "#1234", project: "Collab Shoot", date: "Jan 13, 2026", tint: "#E5E7EB", service: "Videography", payout: 4500, method: "Stripe", status: "Completed" },
];



const STATUS_STYLES: Record<HistoryRow["status"], string> = {
  Pending: "bg-[#FFF4C9] text-[#BA6605]",
  Completed: "bg-[#D4FFE4] text-[#16A34A]",
};

const TINTS = ["#FED1EF", "#FFF6DA", "#FFFFFF", "#D1FAD7", "#E5E7EB"];
const tintFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
};

const formatRowDate = (d: string | null) => {
  if (!d) return "—";
  try { return format(parseISO(d), "MMM dd, yyyy"); } catch { return d; }
};

const PERIOD_PARAM: Record<string, "last_30_days" | "this_quarter" | "this_year" | undefined> = {
  "Month": undefined,
  "Last 30 Days": "last_30_days",
  "This Quarter": "this_quarter",
  "This Year": "this_year",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const formatCompactUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);

const pageList = (current: number, total: number): Array<number | "…"> => {
  const items: Array<number | "…"> = [];
  for (let p = 1; p <= total; p += 1) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) items.push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
};

/* ---------- Component ---------- */
interface PartnerPayoutHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  cpId: string;
  cpName: string;
  totalPayout: number;
  /** Page-level date range (yyyy-MM-dd), same as the analytics request */
  startDate?: string | null;
  endDate?: string | null;
  /** API loading state (aave tyare page thi pass karvu) */
  loading?: boolean;
}

export default function PartnerPayoutHistoryPanel({
  open,
  onClose,
  cpId,
  cpName,
  totalPayout,
  startDate = null,
  endDate = null,
  loading = false,
}: PartnerPayoutHistoryPanelProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [snap, setSnap] = useState({ cpName, totalPayout }); // collapse vakhte header na jay
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const previousCpId = useRef(cpId);
  const itemsPerPage = 10;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const cpChanged = previousCpId.current !== cpId;
    previousCpId.current = cpId;
    if (!open || !cpChanged || !panelRef.current) return;

    panelRef.current.animate(
      [
        { transform: "translateY(-2rem)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [cpId, open]);

  // Navo CP khule tyare reset
  useEffect(() => {
    if (!open) return;
    setSnap({ cpName, totalPayout });
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setMonthFilter("Month");
    setTypeFilter("All");
    setCurrentPage(1);
    setRows([]);
    setError(null);
  }, [open, cpId, cpName, totalPayout]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setCurrentPage(1), [debouncedSearch, statusFilter, monthFilter, typeFilter]);
  useEffect(() => {
    if (!open || !cpId) return;
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    adminApi
      .getFinanceCpPayoutHistory(
        {
          creator_id: cpId,
          search: debouncedSearch || undefined,
          status: statusFilter === "All" ? undefined : (statusFilter as "Completed" | "Pending"),
          period: PERIOD_PARAM[monthFilter],
          service_type: typeFilter === "All" ? undefined : typeFilter,
          page: currentPage,
          limit: itemsPerPage,
          ...(startDate && endDate ? { start_date: startDate, end_date: endDate } : {}),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        },
        controller.signal,
      )
      .then((res) => {
        if (res.canceled) return;
        if (!res.success || !res.data) {
          setRows([]);
          setTotalPages(1);
          setError(res.error || "Failed to load payout history.");
        } else {
          setRows(
            res.data.rows.map((r) => ({
              id: r.id,
              shootId: r.shoot_id,
              project: r.project_name,
              date: formatRowDate(r.date),
              tint: tintFor(r.project_name),
              service: r.service_type,
              payout: r.payout,
              method: r.payment_method,
              status: r.status,
            })),
          );
          setTotalPages(Math.max(1, res.data.pagination.total_pages));
          if (res.data.pagination.page !== currentPage) setCurrentPage(res.data.pagination.page);
        }
        setIsFetching(false);
      });

    return () => controller.abort();
  }, [open, cpId, startDate, endDate, debouncedSearch, statusFilter, monthFilter, typeFilter, currentPage]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = rows;
  const showLoader = loading || isFetching;

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const muted = isDark ? "text-[#FFFFFF80]" : "text-black/40";
  const triggerCls = `h-8 w-[100px] rounded-full text-[10px] focus:ring-0 lg:text-xs ${isDark ? "border-[#3D3D3D] bg-zinc-900 text-white/70" : "border-[#E3E3E3] bg-white text-[#323232]"}`;
  const contentCls = isDark ? "border-[#3D3D3D] bg-[#111111]" : "border-[#E3E3E3] bg-white text-black";

  return (
    <div
      aria-hidden={!open}
      className={`grid w-full transition-[grid-template-rows] duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr] !mt-0"}`}
    >
      <div className="min-h-0 overflow-hidden">
        {/* top → bottom */}
        <section
          ref={panelRef}
          className={`w-full overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"} ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}
        >
          {/* CP header */}
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-3 ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-medium text-[#171717]"
                style={{ backgroundColor: "#FFF6DA" }}
              >
                {getInitials(snap.cpName)}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium lg:text-lg ${isDark ? "text-white" : "text-[#171717]"}`}>{snap.cpName}</p>
                <p className={`text-xs lg:text-sm ${isDark ? "text-[#70BB8C]" : "text-[#047726]"}`}>
                  Total Payout - {formatCompactUSD(snap.totalPayout)}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/5 text-black hover:bg-black/10"}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Title + filters + search */}
          <div className={`flex flex-col gap-4 border-b p-5 ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
                <h3 className={`text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-[#323232]"}`}>Payout History</h3>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={triggerCls}><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="All">Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className={triggerCls}><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Month">Month</SelectItem>
                    <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                    <SelectItem value="This Quarter">This Quarter</SelectItem>
                    <SelectItem value="This Year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className={triggerCls}><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Videography">Videography</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Photo + Video">Photo + Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative w-full">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-[#666]" : "text-[#999]"}`} size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Shoot ID and Project Name..."
                className={`h-10 w-full rounded-lg border pl-9 pr-4 text-sm transition-colors focus:outline-none ${isDark ? "border-[#333333] bg-zinc-900 text-white focus:border-[#E8D1AB]" : "border-[#E5E5E5] bg-white text-black focus:border-[#E8D1AB]"}`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-left [&_td]:align-middle">
              <thead className={`border-b ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
                <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  <th className="w-[10%] px-5 py-3">Shoot ID</th>
                  <th className="w-[24%] px-4 py-3">Project Name</th>
                  <th className="w-[15%] px-4 py-3">Service Type</th>
                  <th className="w-[12%] px-4 py-3">Net Payout</th>
                  <th className="w-[16%] px-4 py-3">Payment Method</th>
                  <th className="w-[15%] px-4 py-3">Status</th>
                  <th className="w-[8%] px-5 py-3 text-right">Action</th>
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
                      {error ?? "No payouts found."}                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.id} className={isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"}>
                      <td className={`px-5 py-[9px] text-sm ${isDark ? "text-white" : "text-[#171717]"}`}>{row.shootId}</td>
                      <td className="px-4 py-[9px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium text-[#171717]"
                            style={{ backgroundColor: row.tint }}
                          >
                            {getInitials(row.project)}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>{row.project}</p>
                            <p className={`text-xs ${muted}`}>{row.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-[9px] text-sm ${isDark ? "text-white/90" : "text-[#171717]"}`}>{row.service}</td>
                      <td className={`px-4 py-[9px] text-sm font-medium ${isDark ? "text-white/90" : "text-[#171717]"}`}>{formatCurrency(row.payout)}</td>
                      <td className={`px-4 py-[9px] text-sm ${isDark ? "text-white/90" : "text-[#171717]"}`}>{row.method}</td>
                      <td className="px-4 py-[9px]">
                        <span className={`inline-flex min-w-[110px] items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-[9px]">
                        <div className={`flex items-center justify-end gap-3 ${isDark ? "text-white" : "text-black"}`}>
                          <AlertCircle size={20} />
                          <ChevronRight size={20} />
                        </div>
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
  );
}
