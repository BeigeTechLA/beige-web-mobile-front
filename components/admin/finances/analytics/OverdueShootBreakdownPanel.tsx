"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import type { FinanceCpOverdueHistoryRow } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/landing/ui/tooltip";

type OverdueShootRow = {
  id: string;
  shootName: string;
  category: string;
  customerName: string;
  customerTint: string;
  amount: number;
  daysAgo: number;
};

const CUSTOMER_TINTS = ["#FED1EF", "#FFF6DA", "#D1FAD7", "#E5E7EB", "#DCE7FF"];
const tintFor = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return CUSTOMER_TINTS[hash % CUSTOMER_TINTS.length];
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

// Match the pagination behavior used by CPPayoutTable.
const buildPaginationItems = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const items: Array<number | "..."> = [];
  for (let page = 1; page <= totalPages; page += 1) {
    const isBoundary = page === 1 || page === totalPages;
    const isNearCurrent = Math.abs(page - currentPage) <= 1;
    if (isBoundary || isNearCurrent) {
      items.push(page);
      continue;
    }
    if (items[items.length - 1] !== "...") items.push("...");
  }
  return items;
};

const pageList = (current: number, total: number): Array<number | "…"> =>
  buildPaginationItems(current, total).map((p) => (p === "..." ? "…" : p));

/* ---------- Truncated text and tooltip, matching CPPayoutTable ---------- */
const TruncatedTableText = ({
  text,
  isDark,
  className = "",
}: {
  text: string;
  isDark: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild>
          <span
            ref={textRef}
            onMouseEnter={() => {
              const el = textRef.current;
              if (el) setIsOpen(el.scrollWidth > el.offsetWidth);
            }}
            onMouseLeave={() => setIsOpen(false)}
            className={`min-w-0 truncate cursor-default ${isDark ? "text-white" : "text-[#171717]"} ${className}`}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ---------- Component (inline expand panel) ---------- */
interface OverdueShootBreakdownPanelProps {
  open: boolean;
  onClose: () => void;
  cpId: string;
  cpName: string;
  totalOverdue: number;
  shootCount?: number;
  avatarUrl?: string;
  loading?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export default function OverdueShootBreakdownPanel({
  open,
  onClose,
  cpId,
  cpName,
  totalOverdue,
  shootCount = 0,
  avatarUrl,
  loading = false,
  startDate = null,
  endDate = null,
}: OverdueShootBreakdownPanelProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const prevCpIdRef = useRef<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [snapOut, setSnapOut] = useState(false); // card parked off-screen (no transition) before sliding in again
  const itemsPerPage = 10;
  const [isFetching, setIsFetching] = useState(false);
  const [rows, setRows] = useState<OverdueShootRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{ total_overdue: number; total_shoots: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !cpId) return;
    const controller = new AbortController();
    setIsFetching(true);
    setError(null);
    adminApi.getFinanceCpOverdueHistory({
      creator_id: cpId,
      page: currentPage,
      limit: itemsPerPage,
      ...(startDate && endDate ? { start_date: startDate, end_date: endDate } : {}),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    }, controller.signal).then((response) => {
      if (response.canceled) return;
      if (!response.success || !response.data) {
        setRows([]);
        setSummary(null);
        setTotalPages(1);
        setError(response.error || "Failed to load overdue shoots.");
        return;
      }
      setRows(response.data.rows.map((row: FinanceCpOverdueHistoryRow) => ({
        id: row.id,
        shootName: row.shoot_name,
        category: row.category,
        customerName: row.customer_name,
        customerTint: tintFor(row.customer_name),
        amount: row.amount,
        daysAgo: row.days_overdue,
      })));
      setSummary(response.data.summary);
      setTotalPages(Math.max(1, response.data.pagination.total_pages));
      if (response.data.pagination.page !== currentPage) setCurrentPage(response.data.pagination.page);
    }).finally(() => {
      if (!controller.signal.aborted) setIsFetching(false);
    });
    return () => controller.abort();
  }, [open, cpId, startDate, endDate, currentPage]);

  // Keep the last values visible in the header during the collapse animation.
  const [snap, setSnap] = useState({ cpName, totalOverdue, shootCount, avatarUrl });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setSnap({ cpName, totalOverdue, shootCount, avatarUrl });
    setCurrentPage(1);
    setRows([]);
    setSummary(null);
    setError(null);
  }, [open, cpId, cpName, totalOverdue, shootCount, avatarUrl]);

  // Panel already open and user clicks a different CP: park the card on the right, then slide it in again
  useEffect(() => {
    if (!open) {
      prevCpIdRef.current = null;
      setSnapOut(false);
      return;
    }
    const isSwitch = prevCpIdRef.current !== null && prevCpIdRef.current !== cpId;
    prevCpIdRef.current = cpId;
    if (!isSwitch) return;

    setSnapOut(true); // instantly translate-x-full, transition disabled
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSnapOut(false)); // transition back on, slides to translate-x-0
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      setSnapOut(false);
    };
  }, [open, cpId]);

  // Smooth-scroll to the panel when a CP is opened or switched
  useEffect(() => {
    if (!open || !cpId) return;
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
  }, [open, cpId]);



  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = rows;
  const paginationItems = pageList(safePage, totalPages);
  const showLoader = loading || isFetching;
  const displayTotal = summary?.total_overdue ?? snap.totalOverdue;
  const displayShootCount = summary?.total_shoots ?? snap.shootCount;

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark" || theme === "dark";
  const muted = isDark ? "text-[#FFFFFF80]" : "text-black/40";



  return (
    <div
      ref={wrapperRef}
      aria-hidden={!open}
      className={`grid w-full scroll-mt-24 transition-[grid-template-rows] duration-500 ease-out lg:scroll-mt-28 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr] !mt-0"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-h-0 overflow-hidden">
        <section
          className={`w-full overflow-hidden rounded-2xl border ${snapOut ? "transition-none" : "transition-transform duration-500 ease-out"} ${open && !snapOut ? "translate-x-0" : "translate-x-full"} ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between gap-4 border-b px-5 py-3 ${isDark ? "border-b-[#3D3D3D] bg-[#101010]" : "border-b-[#E3E3E3] bg-[#FFFCF6]"}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              {snap.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snap.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-medium text-[#171717]"
                  style={{ backgroundColor: "#FED1EF" }}
                >
                  {getInitials(snap.cpName)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-[3px] shrink-0 rounded-full bg-[#E5D5B8]" />
                  <TruncatedTableText
                    text={`${snap.cpName} (${displayShootCount} Shoots)`}
                    isDark={isDark}
                    className="block text-sm font-medium lg:text-lg"
                  />
                </div>
                <p className={`mt-0.5 text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
                  Total Overdue Amount : {formatCurrency(displayTotal)}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Allow horizontal scrolling on narrow screens. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left [&_td]:align-middle">
              <thead
                className={`border-b ${isDark ? "border-[#3D3D3D] bg-[#3D3D3D]/40" : "border-[#E3E3E3] bg-[#FFFCF6]"}`}
              >
                <tr className={`text-sm font-medium capitalize ${isDark ? "text-[#E8D1AB]" : "text-[#000000]"}`}>
                  <th className="w-[30%] px-4 py-3">Shoot Name</th>
                  <th className="w-[30%] px-4 py-3">Customer</th>
                  <th className="w-[16%] px-4 py-3">Overdue Amount</th>
                  <th className="w-[24%] px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {showLoader
                  ? (
                    <tr>
                      <td colSpan={4} className="h-[480px] p-0">
                        <div className="flex h-full w-full items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#E5D5B8]" />
                        </div>
                      </td>
                    </tr>
                  )
                  : visibleRows.map((row) => (
                  <tr key={row.id} className={isDark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.03]"}>
                    <td className={`min-w-0 px-4 py-[9px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      <TruncatedTableText text={row.shootName} isDark={isDark} className="block" />
                      <p className={`text-xs font-normal capitalize ${muted}`}>{row.category}</p>
                    </td>
                    <td className="min-w-0 px-4 py-[9px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium text-[#171717]"
                          style={{ backgroundColor: row.customerTint }}
                        >
                          {getInitials(row.customerName)}
                        </div>
                        <span title={row.customerName} className={`min-w-0 flex-1 truncate font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                          {row.customerName}
                        </span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-[9px] font-medium ${isDark ? "text-white/90" : "text-[#171717]"}`}>
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-[9px]">
                      <span className="inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full bg-[#FFD6D9] px-3 py-2 text-xs font-semibold text-[#E5484D]">
                        Overdue {row.daysAgo} day{row.daysAgo === 1 ? "" : "s"} ago
                      </span>
                    </td>
                  </tr>
                ))}
                {!showLoader && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`h-32 text-center text-sm ${muted}`}>
                      {error || "No overdue shoots found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 ${isDark ? "border-[#3D3D3D] bg-[#141414] text-white" : "border-[#E3E3E3] bg-white text-[#202020]"}`}
          >
            <p className="text-sm lg:text-base">
              Page {safePage} of {totalPages}
            </p>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? "text-zinc-300 hover:bg-white/5" : "text-zinc-600 hover:bg-black/5"}`}
              >
                <ChevronLeft size={18} />
              </button>
              {paginationItems.map((p, i) =>
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
