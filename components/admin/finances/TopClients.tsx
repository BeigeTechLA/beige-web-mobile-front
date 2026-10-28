"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Info, Search, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SelectedShootCP } from './TopCPsByShoots';
/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SortKey = 'shoots' | 'spend';
type ClientStatus = 'fully_paid' | 'partially_paid' | 'pending';

export interface TopClient {
  id: string;
  name: string;
  avatarUrl?: string;   // optional – falls back to initials on a pastel tile
  shoots: number;
  spend: number;        // USD
  status?: ClientStatus;
}

export interface ClientFilters {
  sortKey: SortKey;
  status: 'all' | ClientStatus;
}

type ApiClients = FinanceAnalyticsData['clients'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatCompactUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

// Stable pastel tile per client (pink, mint, white, cream, blue – like the design)
const PASTELS = ['#F6CFEA', '#DDF8D2', '#FFFFFF', '#FFF2C6', '#D6E4FF'];
const pastelFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PASTELS[h % PASTELS.length];
};

// Page list with ellipsis: 1 2 3 … 10  /  1 … 4 5 6 … 10
const pageList = (current: number, total: number): (number | '…')[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, '…', total];
  if (current >= total - 2) return [1, '…', total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
};

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

interface TopClientsProps {
  /** analytics.clients.top_by_shoots */
  shootsData?: ApiClients['top_by_shoots'] | null;
  /** analytics.clients.top_by_spend */
  spendData?: ApiClients['top_by_spend'] | null;
  loading?: boolean;
  onFiltersChange?: (filters: ClientFilters) => void;
  pageSize?: number;
  title?: string;
  selectedId?: string | null;
  onSelectClient?: (client: SelectedShootCP | null) => void;
}

// Default tooltip text per tab
const DEFAULT_INFO: Record<SortKey, string> = {
  shoots: 'Top 10 Clients with the highest number of shoots',
  spend: 'Top 10 Clients with the highest amount spent',
};

export default function TopClients({
  shootsData = null,
  spendData = null,
  loading = false,
  onFiltersChange,
  pageSize = 8,
  title = 'Top Clients',
  selectedId = null,
  onSelectClient,
}: TopClientsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;
  const [sortKey, setSortKey] = useState<SortKey>('shoots');
  const [status, setStatus] = useState<'all' | ClientStatus>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setMounted(true), []);

  // Back to page 1 when the result set changes
  useEffect(() => setPage(1), [sortKey, status, query, shootsData, spendData]);

  useEffect(() => {
    onFiltersChange?.({ sortKey, status });
  }, [sortKey, status, onFiltersChange]);

  const isDark = !mounted || theme === "dark";

  // Tooltip follows the selected tab (By Shoot / By Spend)
  const tooltipText = DEFAULT_INFO[sortKey];

  // Pick the list for the active tab → search by name → sort (desc)
  const filtered: TopClient[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = (sortKey === 'shoots' ? shootsData : spendData) ?? [];
    return source
      .map((c) => ({
        id: c.id,
        name: c.name,
        shoots: c.shoots,
        spend: c.spend,
        status: (c as { status?: ClientStatus }).status,
      }))
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (sortKey === 'shoots' ? b.shoots - a.shoots : b.spend - a.spend));
  }, [shootsData, spendData, query, sortKey, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Colours
  const cardCls = isDark ? 'bg-[#101010] border-[#3D3D3D] text-white' : 'bg-white border-[#E5E5E5] text-[#202020]';
  const headerBg = isDark ? 'bg-[#090909]' : 'bg-[#F4F5F7]';
  const divider = isDark ? 'border-[#3D3D3D]' : 'border-[#E5E5E5]';
  const gold = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';
  const triggerCls = `w-auto min-w-[48px] gap-2 rounded-full h-8 px-2.5 text-[10px] focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`;
  const contentCls = isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]";

  return (
    <div data-tooltip-bounds className={`transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${cardCls}`}>
      {/* Header: title, toggle, filters, search */}
      <div className={`shrink-0 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-1">
              <p className="text-sm lg:text-base shrink-0">{title}</p>
              <InfoTooltip
                text={tooltipText}
                label={title}
                isDark={isDark}
                iconClassName={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
                />
            </div>

            {/* By Shoot / By Spend toggle */}
            <div role="tablist" aria-label="Rank clients by" className={`w-fit flex items-center rounded-full border p-0.5 ${isDark ? 'bg-[#171717] border-[#807E7E]' : 'border-[#E3E3E3] bg-white'}`}>
              {([['shoots', 'By Shoot'], ['spend', 'By Spend']] as [SortKey, string][]).map(([key, label]) => {
                const active = sortKey === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSortKey(key)}
                    className={`rounded-full px-4 py-1.5 text-[10px] transition-colors ${active
                      ? 'bg-[#E8D1AB] text-[#171717] font-medium'
                      : (isDark ? 'text-[#C4C4C4] hover:text-white' : 'text-zinc-500 hover:text-[#202020]')}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Select value={status} onValueChange={(v: string) => setStatus(v as 'all' | ClientStatus)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Status">{status === 'all' ? 'Status' : status === 'fully_paid' ? 'Fully paid' : status === 'partially_paid' ? 'Partially paid' : 'Pending'}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All payment states</SelectItem>
                <SelectItem value="fully_paid">Fully paid</SelectItem>
                <SelectItem value="partially_paid">Partially paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Search */}
        <label className={`flex items-center gap-3 h-10 rounded-lg border px-4 ${isDark ? 'bg-[#202020] border-white/20' : 'bg-white border-[#E3E3E3]'}`}>
          <Search size={18} className={isDark ? 'text-white/50' : 'text-zinc-400'} />
          <input
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search by Client Name..."
            className={`w-full bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder:text-[#727272]' : 'text-[#202020] placeholder:text-zinc-400'}`}
          />
        </label>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`border-y ${divider} ${headerBg}`}>
              <th className={`text-left font-medium text-sm p-5 ${gold}`}>Client Name</th>
              <th className={`text-center font-medium text-sm p-5 w-[90px] ${gold}`}>Shoots</th>
              <th className={`text-center font-medium text-sm p-5 w-[130px] ${gold}`}>Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i}>
                  <td className={`p-5`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 lg:w-[60px] lg:h-[60px] rounded-lg animate-pulse ${skeleton}`} />
                      <div className={`h-4 w-32 rounded animate-pulse ${skeleton}`} />
                    </div>
                  </td>
                  <td className="px-5"><div className={`h-4 w-8 mx-auto rounded animate-pulse ${skeleton}`} /></td>
                  <td className="p-5"><div className={`h-4 w-14 mx-auto rounded animate-pulse ${skeleton}`} /></td>
                </tr>
              ))
              : rows.map((c: TopClient, i: number) => (
                <tr key={c.id} className={`transition-all duration-300 ${selectedId && selectedId !== c.id ? 'opacity-40' : 'opacity-100'} ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}>
                  <td className={`p-5 ${i === 0 ? 'pt-5' : 'pt-3.5'} pb-3.5`}>
                    <div className="flex items-center gap-4 min-w-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="w-12 h-12  rounded-lg object-cover shrink-0 bg-[#FFF6DA]" />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-lg shrink-0 text-[#171717] flex items-center justify-center text-base lg:text-xl"
                          style={{ backgroundColor: pastelFor(c.id) }}
                        >
                          {initials(c.name)}
                        </div>
                      )}
                      <span className="text-sm lg:text-base truncate">{c.name}</span>
                      <button
                        type="button"
                        aria-label={selectedId === c.id ? `Close ${c.name} shoot history` : `Open ${c.name} shoot history`}
                        aria-expanded={selectedId === c.id}
                        onClick={() => onSelectClient?.(selectedId === c.id ? null : { id: c.id, name: c.name, shoots: c.shoots })}
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-[#2C2C2B] text-white hover:bg-[#3A3A39]' : 'bg-[#E8E8E8] text-[#171717] hover:bg-[#DADADA]'}`}
                      >
                        <ArrowUpRight size={14} className={`transition-transform duration-300 ${selectedId === c.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </td>
                  <td className={`p-5 text-center text-sm lg:text-base ${i === 0 ? 'pt-5' : 'pt-3.5'} pb-3.5`}>
                    {String(c.shoots).padStart(2, '0')}
                  </td>
                  <td className={`p-5 text-center text-sm lg:text-base ${gold} ${i === 0 ? 'pt-5' : 'pt-3.5'} pb-3.5`}>
                    {formatCompactUSD(c.spend)}
                  </td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={3} className={`text-center text-sm py-12 ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>
                  {query.trim() ? 'No clients match this search.' : 'No clients found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-t mt-4 px-5 py-4 ${divider}`}>
        <p className="text-sm lg:text-base">
          Page {safePage} of {totalPages}
        </p>
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
              <span key={`e${i}`} className={`w-9 text-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className={`w-10 h-10 rounded-lg text-sm lg:text-base transition-colors ${p === safePage
                  ? (isDark ? 'border border-[#E8D1AB]/70 bg-[#1E1B16] text-white' : 'border border-[#CFAF78] bg-[#FFF8EC] text-[#202020]')
                  : (isDark ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-black/5')}`}
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
