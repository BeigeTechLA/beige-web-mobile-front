"use client";

import React, { Fragment, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { adminApi } from "@/lib/api";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  EllipsisVertical,
  FileText,
  Landmark,
  Loader2,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShootStatus = "Paid" | "Pending" | "Failed";

type InvoiceRow = {
  id: string;
  date: string;
  method: string;
  status: ShootStatus;
  amount: number;
  note: string;
};

type ShootRow = {
  id: string;
  shootId: string;
  project: string;
  date: string;
  tint: string;
  service: string;
  amount: number;
  invoiceCount: number;
  method: string;
  status: ShootStatus;
  invoices: InvoiceRow[];
};

const makeInvoices = (code: string, total: number, status: ShootStatus): InvoiceRow[] => {
  const a = Math.round(total * 0.6);
  const b = total - a;
  return [
    { id: `INV-${code}-A`, date: "2026-04-20", method: "Credit Card", status, amount: a, note: `Service: $${Math.round(a * 0.93)} + Tax: $${a - Math.round(a * 0.93)}` },
    { id: `INV-${code}-B`, date: "2026-04-21", method: "Bank Transfer", status, amount: b, note: `Service: $${Math.round(b * 0.93)} + Tax: $${b - Math.round(b * 0.93)}` },
  ];
};



const STATUS_STYLES: Record<ShootStatus, string> = {
  Paid: "bg-[#D4FFE4] text-[#16A34A]",
  Pending: "bg-[#FFF4C9] text-[#BA6605]",
  Failed: "bg-[#FEF3F2] text-[#B42318]",
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

const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(n);

const pageList = (current: number, total: number): Array<number | "…"> => {
  const items: Array<number | "…"> = [];
  for (let p = 1; p <= total; p += 1) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) items.push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
};

/* ---------- Component ---------- */
interface PartnerShootHistoryPanelProps {
  open: boolean;
  cpName: string;
  /** "cp" = Creative Partner (entityId = creator id), "client" = client (entityId = "user:<id>" | "guest:<email>") */
  entityType: "cp" | "client";
  entityId: string;
  /** Page-level date range (yyyy-MM-dd), same as the analytics request */
  startDate?: string | null;
  endDate?: string | null;
  /** API loading state (pass from page when API is ready) */
  loading?: boolean;
}

export default function PartnerShootHistoryPanel({
  open,
  cpName,
  entityType,
  entityId,
  startDate = null,
  endDate = null,
  loading = false,
}: PartnerShootHistoryPanelProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [snapName, setSnapName] = useState(cpName); // keeps the title while collapsing
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<ShootRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const itemsPerPage = 10;
  useEffect(() => setMounted(true), []);

  // Reset when a different CP / client is opened
  useEffect(() => {
    if (!open) return;
    setSnapName(cpName);
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setMonthFilter("Month");
    setTypeFilter("All");
    setCurrentPage(1);
    setExpandedId(null);
    setRows([]);
    setError(null);
  }, [open, entityType, entityId, cpName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedId(null);
  }, [debouncedSearch, statusFilter, monthFilter, typeFilter]);

  useEffect(() => {
    if (!open || !entityId) return;
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    adminApi
      .getFinanceShootHistory(
        {
          entity_type: entityType,
          entity_id: entityId,
          search: debouncedSearch || undefined,
          status: statusFilter === "All" ? undefined : (statusFilter as "Paid" | "Pending" | "Failed"),
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
          setError(res.error || "Failed to load shoot history.");
        } else {
          setRows(
            res.data.rows.map((r) => ({
              id: r.id,
              shootId: r.shoot_id,
              project: r.project_name,
              date: formatRowDate(r.date),
              tint: tintFor(r.project_name),
              service: r.service_type,
              amount: r.total_amount,
              invoiceCount: r.invoice_count,
              method: r.payment_method,
              status: r.status,
              invoices: r.invoices.map((inv) => ({
                id: inv.id,
                date: formatRowDate(inv.date),
                method: inv.method,
                status: inv.status,
                amount: inv.amount,
                note: inv.note,
              })),
            })),
          );
          setTotalPages(Math.max(1, res.data.pagination.total_pages));
          if (res.data.pagination.page !== currentPage) setCurrentPage(res.data.pagination.page);
        }
        setIsFetching(false);
      });

    return () => controller.abort();
  }, [open, entityType, entityId, startDate, endDate, debouncedSearch, statusFilter, monthFilter, typeFilter, currentPage]);

  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = rows;
  const showLoader = loading || isFetching;

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const muted = isDark ? "text-[#FFFFFF80]" : "text-black/40";
  const triggerCls = `h-8 rounded-full text-[10px] focus:ring-0 lg:text-xs ${isDark ? "border-[#3D3D3D] bg-zinc-900 text-white/70" : "border-[#E3E3E3] bg-white text-[#323232]"}`;
  const contentCls = isDark ? "border-[#3D3D3D] bg-[#111111]" : "border-[#E3E3E3] bg-white text-black";

  return (
    <div
      aria-hidden={!open}
      className={`grid w-full transition-[grid-template-rows] duration-500 ease-out ${open ? "mt-3 grid-rows-[1fr] lg:mt-6" : "grid-rows-[0fr]"}`}
    >
      <div className="min-h-0 overflow-hidden">
        {/* top → bottom: drops down from above while fading in */}
        <section
          className={`w-full overflow-hidden rounded-2xl border transition-all duration-500 ease-out ${open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"} ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-white"}`}
        >
          {/* Header + filters */}
          <div className={`flex flex-col gap-4 border-b p-5 ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-[3px] rounded-full bg-[#E5D5B8]" />
                <h3 className={`text-sm font-medium lg:text-lg ${isDark ? "text-white" : "text-[#323232]"}`}>
                  {snapName} Shoot History
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`w-[100px] ${triggerCls}`}><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="All">Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className={`w-[100px] ${triggerCls}`}><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value="Month">Month</SelectItem>
                    <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                    <SelectItem value="This Quarter">This Quarter</SelectItem>
                    <SelectItem value="This Year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className={`w-[100px] ${triggerCls}`}><SelectValue placeholder="All" /></SelectTrigger>
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
                placeholder="Search by Shoot ID, Invoice ID and Client Name..."
                className={`h-10 w-full rounded-lg border pl-9 pr-4 text-sm transition-colors focus:outline-none ${isDark ? "border-[#333333] bg-zinc-900 text-white focus:border-[#E8D1AB]" : "border-[#E5E5E5] bg-white text-black focus:border-[#E8D1AB]"}`}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left [&_td]:align-middle">
              <thead className={`border-b ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}>
                <tr className={`text-sm font-medium ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  <th className="w-[10%] px-5 py-3">Shoot ID</th>
                  <th className="w-[20%] px-4 py-3">Project Name</th>
                  <th className="w-[12%] px-4 py-3">Service Type</th>
                  <th className="w-[11%] px-4 py-3">Total Amount</th>
                  <th className="w-[13%] px-4 py-3">Invoices</th>
                  <th className="w-[13%] px-4 py-3">Payment Method</th>
                  <th className="w-[12%] px-4 py-3">Status</th>
                  <th className="w-[9%] px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {showLoader ? (
                  <tr>
                    <td colSpan={8} className="h-[620px] p-0">
                      <div className="flex h-full w-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#E5D5B8]" />
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`py-10 text-center text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                      {error ?? "No shoots found."}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const isExpanded = expandedId === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          className={`cursor-pointer transition-colors duration-300 ${isExpanded ? (isDark ? "bg-white/[0.04]" : "bg-black/[0.03]") : isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"}`}
                        >
                          <td className={`px-5 py-[9px] text-sm ${isDark ? "text-white" : "text-[#171717]"}`}>
                            <div className="flex items-center gap-2">
                              <ChevronDown size={16} className={`shrink-0 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"} ${isDark ? "text-white/60" : "text-black/50"}`} />
                              {row.shootId}
                            </div>
                          </td>
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
                          <td className={`px-4 py-[9px] text-sm font-medium ${isDark ? "text-white/90" : "text-[#171717]"}`}>{formatCurrency(row.amount)}</td>
                          <td className="px-4 py-[9px]">
                            <span className={`inline-flex min-w-[108px] items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium ${isDark ? "bg-[#312D2D] text-[#D3B98A]" : "bg-[#F2EEE7] text-[#8B6B36]"}`}>
                              {String(row.invoiceCount).padStart(2, "0")} Invoices
                            </span>
                          </td>
                          <td className={`px-4 py-[9px] text-sm ${isDark ? "text-white/90" : "text-[#171717]"}`}>{row.method}</td>
                          <td className="px-4 py-[9px]">
                            <span className={`inline-flex min-w-[84px] items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-[9px] text-right">
                            <button
                              type="button"
                              aria-label="Open row actions"
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                            >
                              <EllipsisVertical size={26} strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className={`space-y-3 px-5 py-5 ${isDark ? "bg-[#0A0A0A]" : "bg-[#FAFAFA]"}`}>
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className={isDark ? "text-[#D3B98A]" : "text-[#8B6B36]"} />
                                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                                    Invoices for {row.shootId}
                                  </p>
                                </div>
                                {row.invoices.length === 0 && (
                                  <p className={`text-xs ${muted}`}>No payment records for this shoot yet.</p>
                                )}
                                {row.invoices.map((inv) => (
                                  <div
                                    key={inv.id}
                                    className={`flex items-center justify-between rounded-lg border p-4 ${isDark ? "border-[#262626] bg-[#141414]" : "border-[#E5E5E5] bg-white"}`}
                                  >
                                    <div className="flex min-w-0 items-center gap-5">
                                      <div>
                                        <p className={`text-sm font-medium leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{inv.id}</p>
                                        <p className={`mt-1 text-xs ${isDark ? "text-[#A0A0A0]" : "text-[#777]"}`}>{inv.date}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/card|stripe/i.test(inv.method) ? (
                                          <CreditCard size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                                        ) : (
                                          <Landmark size={16} className={isDark ? "text-[#A0A0A0]" : "text-[#777]"} />
                                        )}
                                        <span className={`text-xs ${isDark ? "text-[#A0A0A0]" : "text-[#666]"}`}>{inv.method}</span>
                                      </div>
                                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className={`text-base font-semibold leading-none ${isDark ? "text-white" : "text-[#171717]"}`}>{formatCurrency(inv.amount)}</p>
                                        <p className={`mt-1 text-[10px] ${isDark ? "text-[#A0A0A0]" : "text-[#8A8A8A]"}`}>{inv.note}</p>
                                      </div>
                                      <ChevronRight size={18} className={isDark ? "text-[#A0A0A0]" : "text-[#676767]"} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
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
