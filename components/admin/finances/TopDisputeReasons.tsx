"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface DisputeReason {
  id: string;
  name: string;
  cases: number;
}

const DUMMY_REASONS: DisputeReason[] = [
  { id: 'r_1', name: 'Late Delivery', cases: 24 },
  { id: 'r_2', name: 'Quality Mismatch', cases: 18 },
  { id: 'r_3', name: 'Scope Disagreement', cases: 15 },
  { id: 'r_4', name: 'Billing Error', cases: 10 },
  { id: 'r_5', name: 'Editing Issue', cases: 5 },
  { id: 'r_6', name: 'No-show', cases: 4 },
  { id: 'r_7', name: 'Communication Gap', cases: 4 },
  { id: 'r_8', name: 'Location Access', cases: 3 },
  { id: 'r_9', name: 'Missing Files', cases: 3 },
  { id: 'r_10', name: 'Rights & Usage', cases: 2 },
  { id: 'r_11', name: 'Reschedule Conflict', cases: 2 },
  { id: 'r_12', name: 'Other', cases: 1 },
];

// Progress colours cycle down the list (gold, teal, blue, pink, coral – like the design)
const BAR_COLORS = ['#FCB859', '#A9DFD8', '#28AEF3', '#F2C8ED', '#FF6969'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Page list with ellipsis: 1 2 3 … 10  /  1 … 4 5 6 … 10
const pageList = (current: number, total: number): (number | '…')[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, '…', total];
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/* Info tooltip                                                        */
/* ------------------------------------------------------------------ */

// Hover on desktop, tap on touch screens (tap again / tap elsewhere closes).
// Position is measured so the tooltip always stays inside the card marked [data-tooltip-bounds].
interface InfoTooltipProps {
  text: string;
  label: string;
  isDark: boolean;
  iconClassName: string;
  iconSize?: number;
  width?: number;
  placement?: 'top' | 'bottom';
  textClassName?: string;
}

function InfoTooltip({
  text,
  label,
  isDark,
  iconClassName,
  iconSize = 13,
  width = 224,
  placement = 'bottom',
  textClassName = 'text-xs',
}: InfoTooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number } | null>(null);

  const place = useCallback(() => {
    const anchor = wrapRef.current?.getBoundingClientRect();
    const boundsEl = wrapRef.current?.closest('[data-tooltip-bounds]') ?? document.documentElement;
    const bounds = boundsEl.getBoundingClientRect();
    if (!anchor) return;
    const gutter = 12;
    const w = Math.min(width, bounds.width - gutter * 2);
    // Centred on the icon, then pulled back inside the card if it would overflow
    const desired = anchor.left + anchor.width / 2 - w / 2;
    const clamped = Math.max(bounds.left + gutter, Math.min(desired, bounds.right - gutter - w));
    const left = clamped - anchor.left; // relative to the icon wrapper
    setPos((prev) => (prev?.left === left && prev?.width === w ? prev : { left, width: w }));
  }, [width]);

  // While open: re-measure on resize / rotate, close on a tap anywhere else
  useEffect(() => {
    if (!open) return;
    place();
    const onResize = () => place();
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, place]);

  return (
    <span
      ref={wrapRef}
      onMouseEnter={place}
      onClick={(e) => e.stopPropagation()}
      className="relative group/info inline-flex"
    >
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex p-1 -m-1 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D1AB]"
      >
        <Info size={iconSize} className={iconClassName} />
      </button>
      <span
        role="tooltip"
        style={{ left: pos?.left ?? -(width / 2) + iconSize / 2, width: pos?.width ?? width }}
        className={`absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} rounded-lg border px-3 py-2 ${textClassName} leading-snug font-normal text-left transition-all duration-200 z-50 pointer-events-none shadow-2xl ${open ? 'opacity-100 visible' : 'opacity-0 invisible [@media(hover:hover)]:group-hover/info:opacity-100 [@media(hover:hover)]:group-hover/info:visible'} ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}
      >
        {text}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface TopDisputeReasonsProps {
  /** analytics.disputes.top_reasons */
  data?: FinanceAnalyticsData['disputes']['top_reasons'] | null;
  loading?: boolean;
  pageSize?: number;
  /**
   * Value a full progress bar represents (e.g. a case threshold).
   * Defaults to 30 for the dummy data (top reason ≈ 80%, like the design);
   * with real data and no value it falls back to the highest case count.
   */
  progressMax?: number;
  title?: string;
  infoText?: string;
}

export default function TopDisputeReasons({
  data = null,
  loading = false,
  pageSize = 5,
  progressMax,
  title = 'Top Dispute Reasons',
  infoText = "Top 5 Most common reasons for disputes",
}: TopDisputeReasonsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;
  const [page, setPage] = useState(1);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const sorted: DisputeReason[] = [...(data ?? [])].sort((a, b) => b.cases - a.cases);
  const scale = progressMax ?? Math.max(1, ...sorted.map((r) => r.cases));
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  const divider = isDark ? 'border-white/5' : 'border-[#EDEDED]';
  const mutedText = isDark ? 'text-[#87888C]' : 'text-[#6D6D6D]';
  const track = isDark ? 'bg-[#2B2B36]' : 'bg-[#ECECEF]';
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';

  return (
    <div data-tooltip-bounds className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center gap-1.5 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
        {infoText && (
          <InfoTooltip
            text={infoText}
            label={title}
            isDark={isDark}
            iconClassName={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
            />
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full lg:min-w-[520px] border-collapse">
          <thead>
            <tr className={`border-b ${divider}`}>
              <th className={`w-12 text-left font-medium text-xs lg:text-sm p-5 pb-2.5 ${mutedText}`}>#</th>
              <th className={`text-left font-medium text-xs lg:text-sm p-5 pb-2.5 w-[35%] ${mutedText}`}>Name</th>
              <th className={`text-center font-medium text-xs lg:text-sm p-5 pb-2.5 w-20 ${mutedText}`}>Cases</th>
              <th className={`text-left font-medium text-xs lg:text-sm p-5 pb-2.5 ${mutedText}`}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className={`border-b ${divider}`}>
                  <td className="py-3 pl-5 pr-2.5"><div className={`h-3 w-5 rounded animate-pulse ${skeleton}`} /></td>
                  <td className="p-3"><div className={`h-3 w-28 rounded animate-pulse ${skeleton}`} /></td>
                  <td className="p-3"><div className={`h-3 w-6 mx-auto rounded animate-pulse ${skeleton}`} /></td>
                  <td className="py-3 pl-2.5 pr-5"><div className={`h-0.5 w-full rounded-full ${track}`} /></td>
                </tr>
              ))
              : rows.map((r, i) => {
                const rank = start + i + 1;
                const pct = Math.max(1, Math.min(100, (r.cases / scale) * 100));
                const color = BAR_COLORS[(rank - 1) % BAR_COLORS.length];
                return (
                  <tr key={r.id} className={`border-b ${divider} transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}>
                    <td className={`py-3 pl-5 pr-2.5 text-xs lg:text-sm ${isDark ? 'text-[#999999]' : 'text-black/40'}`}>{pad2(rank)}</td>
                    <td className="p-3 text-xs lg:text-sm truncate max-w-[220px]">{r.name}</td>
                    <td className="p-3 text-xs lg:text-sm text-center">{pad2(r.cases)}</td>
                    <td className="py-3 pl-2.5 pr-5">
                      <div
                        className={`h-0.5 w-full rounded-full overflow-hidden ${track}`}
                        role="progressbar"
                        aria-label={`${r.name}: ${r.cases} cases`}
                        aria-valuenow={Math.round(pct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className={`text-center text-sm py-10 ${mutedText}`}>No disputes yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 ${isDark ? 'border-[#3D3D3D]' : 'border-[#E5E5E5]'}`}>
        <p className="text-sm lg:text-base">Page {safePage} of {totalPages}</p>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-600 hover:bg-black/5'}`}
          >
            <ChevronLeft size={18} />
          </button>
          {pageList(safePage, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className={`w-9 text-center ${isDark ? 'text-[#6D6D6D]' : 'text-zinc-400'}`}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className={`w-10 h-10 rounded-lg text-sm lg:text-base transition-colors ${p === safePage
                  ? (isDark ? 'border border-[#E8D1AB]/70 bg-[#1E1B16] text-white' : 'border border-[#CFAF78] bg-[#FFF8EC] text-[#202020]')
                  : (isDark ? 'text-zinc-400 hover:bg-white/5' : 'text-[#6D6D6D] hover:bg-black/5')}`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-600 hover:bg-black/5'}`}
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
}
