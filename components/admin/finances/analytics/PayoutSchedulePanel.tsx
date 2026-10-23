"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, EllipsisVertical, Loader2, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";

/* ---------- Static mock data (API aave tyare replace karvu) ---------- */
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
  dueTone: DueTone;
  pending: number;
  status: PayoutStatus;
};

const BASE: Omit<PayoutRow, "id">[] = [
  { name: "Raj Verma", roles: "Videographer", tint: "#FED1EF", shootId: "#12345", created: "01/06/2026", customer: "Alex Morgan", shootAmount: 50000, payout: 12500, due: "10/06/2026", dueTone: "amber", pending: 5000, status: "Pending" },
  { name: "Daniel Foster", roles: "Videographer + Photographer", tint: "#FFF6DA", shootId: "#12345", created: "01/06/2026", customer: "Ethan Carter", shootAmount: 20000, payout: 10000, due: "Today", dueTone: "red", pending: 4000, status: "Partially Paid" },
  { name: "Liam Parker", roles: "Videographer + Photographer", tint: "#D1FAD7", shootId: "#12345", created: "01/06/2026", customer: "Maya Ross", shootAmount: 45000, payout: 25000, due: "Today", dueTone: "red", pending: 10000, status: "Finance Approval" },
  { name: "Noah Bennett", roles: "Photographer", tint: "#FFF6DA", shootId: "#12345", created: "01/06/2026", customer: "John Lee", shootAmount: 10000, payout: 5000, due: "15/06/2026", dueTone: "blue", pending: 2000, status: "Approved" },
  { name: "James Carter", roles: "Videographer + Photographer", tint: "#E5E7EB", shootId: "#12345", created: "01/06/2026", customer: "Raj Yadhav", shootAmount: 100000, payout: 64000, due: "10/06/2026", dueTone: "amber", pending: 5000, status: "Fully Paid" },
  { name: "Lucas Reed", roles: "Videographer + Photographer", tint: "#FFFFFF", shootId: "#12345", created: "01/06/2026", customer: "Daniel Roberts", shootAmount: 200000, payout: 110000, due: "10/06/2026", dueTone: "amber", pending: 5000, status: "Pending" },
];

// 12 rows = 2 pages (10 + 2)
const MOCK_ROWS: PayoutRow[] = [...BASE, ...BASE].map((r, i) => ({ ...r, id: String(i + 1) }));

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
  /** API loading state (aave tyare page thi pass karvu) */
  loading?: boolean;
}

export default function PayoutSchedulePanel({ open, bucketId, bucketLabel, loading = false }: PayoutSchedulePanelProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [snapLabel, setSnapLabel] = useState(bucketLabel); // collapse vakhte title na jay
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => setMounted(true), []);

  // Navi bucket khule tyare reset
  useEffect(() => {
    if (!open) return;
    setSnapLabel(bucketLabel);
    setSearch("");
    setCurrentPage(1);
  }, [open, bucketId, bucketLabel]);

  useEffect(() => setCurrentPage(1), [search]);

  // TEMP: fake loading (open / bucket / page change). API aave tyare delete karo.
  useEffect(() => {
    if (!open) return;
    setIsFetching(true);
    const t = setTimeout(() => setIsFetching(false), 1000);
    return () => clearTimeout(t);
  }, [open, bucketId, currentPage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_ROWS;
    return MOCK_ROWS.filter((r) => `${r.name} ${r.customer} ${r.shootId}`.toLowerCase().includes(q));
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const showLoader = loading || isFetching;

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const muted = isDark ? "text-[#FFFFFF80]" : "text-black/40";
  const dueCls = (tone: DueTone) =>
    tone === "red" ? "text-[#FF6467]" : tone === "blue" ? "text-[#5891EF]" : "text-[#E8B04B]";

  return (
    <div
      aria-hidden={!open}
      className={`grid w-full transition-[grid-template-rows] duration-500 ease-out ${open ? "mt-3 grid-rows-[1fr] lg:mt-6" : "grid-rows-[0fr]"}`}
    >
      <div className="min-h-0 overflow-hidden">
        {/* top → bottom */}
        <section
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
                      No payouts found.
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
                        <p className={`text-[10px] ${muted}`}>Pending Amount {formatCurrency(row.pending)}</p>
                      </td>
                      <td className="px-4 py-[9px]">
                        <span className={`inline-flex min-w-[130px] items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-[9px] text-right">
                        <button
                          type="button"
                          aria-label="Open row actions"
                          className={`inline-flex items-center justify-center rounded-lg p-1 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                        >
                          <EllipsisVertical size={26} strokeWidth={2.5} />
                        </button>
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