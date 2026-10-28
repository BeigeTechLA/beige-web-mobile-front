"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Info, Search } from 'lucide-react';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type OverdueAge = 'all' | '1_30' | '31_60' | '61_90' | '90_plus';
type CPRole = 'all' | 'photographer' | 'videographer' | 'editor' | 'producer' | 'director';

export interface OverdueCP {
  id: string;
  name: string;
  avatarUrl?: string;     // optional – falls back to initials
  amount: number;         // USD
  daysOverdue: number;
  shoots: number;
  roles: string[];
}

export interface OverdueFilters {
  age: OverdueAge;
  role: CPRole;
  sort: 'amount' | 'days';
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// "12 Day", "09 Day" – zero-padded like the design
const formatDays = (n: number) => `${String(n).padStart(2, '0')} Day`;

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

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

interface TopOverdueCPsProps {
  data?: FinanceAnalyticsData['creative_partners']['top_overdue'] | null;
  loading?: boolean;
  onFiltersChange?: (filters: OverdueFilters) => void;
  /** Max rows shown */
  limit?: number;
  title?: string;
  infoText?: string;
  selectedId?: string | null;
  onSelectCP?: (cp: OverdueCP | null) => void;
  dimmed?: boolean;
}

export default function TopOverdueCPs({
  data = null,
  loading = false,
  onFiltersChange,
  limit = 5,
  title = 'Top Overdue CPs',
  infoText = 'CPs with overdue payments, ranked by highest outstanding amount.',
  selectedId = null,
  onSelectCP,
  dimmed = false,
}: TopOverdueCPsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;
  const [age, setAge] = useState<OverdueAge>('all');
  const [role, setRole] = useState<CPRole>('all');
  const [sort, setSort] = useState<'amount' | 'days'>('amount');
  const [query, setQuery] = useState('');

  useEffect(() => {
    onFiltersChange?.({ age, role, sort });
  }, [age, role, sort, onFiltersChange]);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  // Map API rows → search by name → sort by amount (desc) → top N
  const rows: OverdueCP[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .map((cp) => ({
        id: cp.id,
        name: cp.name,
        amount: cp.amount,
        daysOverdue: cp.days_overdue,
        shoots: cp.shoots,
        roles: cp.roles || [],
      }))
      .filter((cp) => age === 'all' || (age === '1_30' && cp.daysOverdue <= 30) || (age === '31_60' && cp.daysOverdue >= 31 && cp.daysOverdue <= 60) || (age === '61_90' && cp.daysOverdue >= 61 && cp.daysOverdue <= 90) || (age === '90_plus' && cp.daysOverdue > 90))
      .filter((cp) => role === 'all' || cp.roles.some((item) => item.toLowerCase() === role))
      .filter((cp) => !q || cp.name.toLowerCase().includes(q))
      .sort((a, b) => sort === 'amount' ? b.amount - a.amount : b.daysOverdue - a.daysOverdue)
      .slice(0, limit);
  }, [data, query, limit, age, role, sort]);

  // Colours (warm red-tinted card from the design)
  const cardCls = isDark ? 'bg-[#231B1B] border-[#FF6467] text-white' : 'bg-[#FFF8F7] border-[#E7A3A6] text-[#202020]';
  const divider = isDark ? 'border-[#FF6467]/60' : 'border-[#E7A3A6]';
  const headCls = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const amountCls = isDark ? 'text-[#E8D1AB]' : 'text-[#7A5A24]';
  const daysCls = isDark ? 'text-[#FF6467]' : 'text-[#C93A3A]';
  const triggerCls = `w-auto min-w-[48px] gap-2 rounded-full h-7 px-2.5 text-[10px] focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3D2D2] text-[#323232]"}`;
  const contentCls = isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]";

  return (
    <div data-tooltip-bounds className={`relative transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${cardCls}`}>
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${dimmed ? 'opacity-100' : 'opacity-0'} ${isDark ? 'bg-black/55' : 'bg-slate-900/35'}`} />
      {/* Header + filters */}
      <div className="p-5 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm lg:text-base">{title}</p>
            <InfoTooltip
              text={infoText}
              label={title}
              isDark={isDark}
              iconClassName={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
              />
          </div>

          <div className="flex items-center gap-2">
            <Select value={age} onValueChange={(v: string) => setAge(v as OverdueAge)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Age">{age === 'all' ? 'Age' : age === '1_30' ? '1–30 days' : age === '31_60' ? '31–60 days' : age === '61_90' ? '61–90 days' : '90+ days'}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All overdue</SelectItem>
                <SelectItem value="1_30">1–30 days</SelectItem>
                <SelectItem value="31_60">31–60 days</SelectItem>
                <SelectItem value="61_90">61–90 days</SelectItem>
                <SelectItem value="90_plus">90+ days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={role} onValueChange={(v: string) => setRole(v as CPRole)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Role">{role === 'all' ? 'Role' : role[0].toUpperCase() + role.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="videographer">Videographers</SelectItem>
                <SelectItem value="photographer">Photographers</SelectItem>
                <SelectItem value="editor">Editors</SelectItem>
                <SelectItem value="producer">Producers</SelectItem>
                <SelectItem value="director">Directors</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v: string) => setSort(v as 'amount' | 'days')}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Sort">{sort === 'amount' ? 'Amount' : 'Days'}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="amount">Highest amount</SelectItem>
                <SelectItem value="days">Most overdue days</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Search */}
        <label className={`flex items-center gap-3 h-12 rounded-xl border px-4 ${isDark ? 'bg-[#121212] border-[#3A3333]' : 'bg-white border-[#E3D2D2]'}`}>
          <Search size={18} className={isDark ? 'text-white/50' : 'text-zinc-400'} />
          <input
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search by CP Name..."
            className={`w-full bg-transparent outline-none text-sm placeholder:opacity-100 ${isDark ? 'text-white placeholder:text-white/40' : 'text-[#202020] placeholder:text-zinc-400'}`}
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[460px] border-collapse">
          <thead>
            <tr className={`border-y ${divider}`}>
              <th className={`text-left text-sm p-5 ${headCls}`}>CP Name</th>
              <th className={`text-left text-sm p-5 ${headCls}`}>Overdue Amount</th>
              <th className={`text-left text-sm p-5 ${headCls}`}>Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: limit }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full animate-pulse ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                      <div className={`h-4 w-28 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                    </div>
                  </td>
                  <td className="py-3.5 px-3"><div className={`h-4 w-16 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} /></td>
                  <td className="py-3.5 pl-3 pr-5"><div className={`h-4 w-14 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} /></td>
                </tr>
              ))
              : rows.map((cp: OverdueCP, i: number) => (
                <tr
                  key={cp.id}
                  onClick={() => onSelectCP?.(selectedId === cp.id ? null : cp)}
                  className={`cursor-pointer transition-colors ${selectedId === cp.id ? (isDark ? 'bg-white/[0.05]' : 'bg-black/[0.04]') : isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}
                >
                  <td className={`px-5 py-2 ${i === 0 ? 'pt-5' : ''} ${i === rows.length - 1 ? 'pb-5' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {cp.avatarUrl ? (
                        <img src={cp.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-[#FFF6DA]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0 bg-[#FFF6DA] text-[#171717] flex items-center justify-center text-sm font-semibold">
                          {initials(cp.name)}
                        </div>
                      )}
                      <span className="min-w-0">
                        <span className="block text-xs lg:text-sm font-medium truncate">{cp.name}</span>
                        <span className={`block text-[11px] lg:text-xs underline underline-offset-2 ${isDark ? 'text-white/50 decoration-white/30' : 'text-zinc-500 decoration-zinc-300'}`}>
                          Total {cp.shoots} {cp.shoots === 1 ? 'Shoot' : 'Shoots'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className={`px-5 py-2 ${i === 0 ? 'pt-5' : ''} ${i === rows.length - 1 ? 'pb-5' : ''} text-sm lg:text-base ${amountCls}`}>
                    {formatUSD(cp.amount)}
                  </td>
                  <td className={`px-5 py-2 ${i === 0 ? 'pt-5' : ''} ${i === rows.length - 1 ? 'pb-5' : ''} text-sm lg:text-base ${daysCls}`}>
                    {formatDays(cp.daysOverdue)}
                  </td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={3} className={`text-center text-sm py-10 ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>
                  {query.trim() ? 'No overdue CPs match this search.' : 'No overdue CPs found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
