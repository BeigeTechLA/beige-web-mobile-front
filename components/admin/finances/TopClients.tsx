"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Info, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type ClientStatus = 'active' | 'inactive' | 'new';
type Period = 'this_month' | 'last_month' | 'last_3_months';
type ClientType = 'brand' | 'agency' | 'studio';
type SortKey = 'shoots' | 'spend';

export interface TopClient {
  id: string;
  name: string;
  avatarUrl?: string;   // optional – falls back to initials on a pastel tile
  shoots: number;
  spend: number;        // USD
  status: ClientStatus;
  period: Period;
  type: ClientType;
}

const NAMES = [
  'Prince Carter', 'Ethan Carter', 'Sophia Johnson', 'Maya Ross', 'John Lee', 'Arvi Ross',
  'Daniel Roberts', 'Raj Yadhav', 'Lena Hart', 'Omar Haddad', 'Grace Kim', 'Victor Hale',
  'Nina Patel', 'Lucas Gray', 'Ivy Chen', 'Mateo Cruz', 'Zara Ali', 'Owen Price',
  'Aisha Khan', 'Leo Brooks', 'Chloe Martin', 'Kai Tanaka', 'Ruby Evans', 'Sam Okafor',
];
const STATUSES: ClientStatus[] = ['active', 'active', 'new', 'inactive'];
const PERIODS: Period[] = ['this_month', 'this_month', 'last_month', 'last_3_months'];
const TYPES: ClientType[] = ['brand', 'agency', 'studio'];

const DUMMY_CLIENTS: TopClient[] = NAMES.map((name, i) => ({
  id: `client_${i + 1}`,
  name,
  shoots: [45, 10, 20, 16, 9, 11, 38, 40, 27, 6, 33, 14, 22, 8, 19, 30, 12, 25, 5, 17, 28, 7, 13, 21][i],
  spend: [188, 45, 95, 100, 150, 70, 20, 35, 64, 12, 88, 40, 57, 18, 49, 76, 30, 61, 9, 44, 72, 15, 26, 53][i] * 1_000_000,
  status: STATUSES[i % STATUSES.length],
  period: PERIODS[i % PERIODS.length],
  type: TYPES[i % TYPES.length],
}));

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
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface TopClientsProps {
  /** Pass real data later; falls back to dummy data */
  data?: TopClient[];
  pageSize?: number;
  title?: string;
}

// Default tooltip text per tab
const DEFAULT_INFO: Record<SortKey, string> = {
  shoots: 'Top 10 Clients with the highest number of shoots',
  spend: 'Top 10 Clients with the highest amount spent',
};

export default function TopClients({
  data,
  pageSize = 8,
  title = 'Top Clients',
}: TopClientsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('shoots');
  const [status, setStatus] = useState<'all' | ClientStatus>('all');
  const [period, setPeriod] = useState<'all' | Period>('all');
  const [type, setType] = useState<'all' | ClientType>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setMounted(true), []);

  // Simulated fetch whenever filters that would hit the API change
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [sortKey, status, period, type]);

  // Back to page 1 when the result set changes
  useEffect(() => setPage(1), [sortKey, status, period, type, query]);

  const isDark = !mounted || theme === "dark";

  // Tooltip follows the selected tab (By Shoot / By Spend)
  const tooltipText = DEFAULT_INFO[sortKey];

  // Filter → search → sort by the toggle (desc)
  const filtered: TopClient[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? DUMMY_CLIENTS)
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => period === 'all' || c.period === period)
      .filter((c) => type === 'all' || c.type === type)
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (sortKey === 'shoots' ? b.shoots - a.shoots : b.spend - a.spend));
  }, [data, status, period, type, query, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Colours
  const cardCls = isDark ? 'bg-[#101010] border-[#3D3D3D] text-white' : 'bg-white border-[#E5E5E5] text-[#202020]';
  const headerBg = isDark ? 'bg-[#090909]' : 'bg-[#F4F5F7]';
  const divider = isDark ? 'border-[#3D3D3D]' : 'border-[#E5E5E5]';
  const gold = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const triggerCls = `w-auto min-w-[48px] gap-2 rounded-full h-8 px-2.5 text-[10px] focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3E3E3] text-[#323232]"}`;
  const contentCls = isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]";
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${cardCls}`}>
      {/* Header: title, toggle, filters, search */}
      <div className={`shrink-0 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <p className="text-sm lg:text-base shrink-0">{title}</p>
              <span className="relative group/info inline-flex">
                <Info
                  size={13}
                  className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
                />
                <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-lg border px-3 py-2 text-xs leading-snug font-normal opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
                  {tooltipText}
                </span>
              </span>
            </div>

            {/* By Shoot / By Spend toggle */}
            <div role="tablist" aria-label="Rank clients by" className={`flex items-center rounded-full border p-0.5 ${isDark ? 'bg-[#171717] border-[#807E7E]' : 'border-[#E3E3E3] bg-white'}`}>
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
                <SelectValue placeholder="Status">{status === 'all' ? 'Status' : status[0].toUpperCase() + status.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v: string) => setPeriod(v as 'all' | Period)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Month">
                  {period === 'all' ? 'Month' : period === 'this_month' ? 'This Month' : period === 'last_month' ? 'Last Month' : '3 Months'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(v: string) => setType(v as 'all' | ClientType)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="All">{type === 'all' ? 'All' : type[0].toUpperCase() + type.slice(1)}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All clients</SelectItem>
                <SelectItem value="brand">Brands</SelectItem>
                <SelectItem value="agency">Agencies</SelectItem>
                <SelectItem value="studio">Studios</SelectItem>
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
                <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}>
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
                  No clients match these filters.
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
