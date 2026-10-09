"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Info, Search } from 'lucide-react';
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

type OverdueStatus = 'overdue' | 'partial' | 'on_hold';
type Period = 'this_month' | 'last_month' | 'last_3_months';
type CPRole = 'photographer' | 'videographer';

export interface OverdueCP {
  id: string;
  name: string;
  avatarUrl?: string;     // optional – falls back to initials
  amount: number;         // USD
  daysOverdue: number;
  status: OverdueStatus;
  period: Period;         // when the payout fell due
  role: CPRole;
}

const DUMMY_CPS: OverdueCP[] = [
  { id: 'cp_1', name: 'Ethan Carter', amount: 10_000, daysOverdue: 12, status: 'overdue', period: 'this_month', role: 'photographer' },
  { id: 'cp_2', name: 'Sophia Johnson', amount: 7_560, daysOverdue: 9, status: 'partial', period: 'this_month', role: 'videographer' },
  { id: 'cp_3', name: 'John Lee', amount: 5_125, daysOverdue: 7, status: 'overdue', period: 'this_month', role: 'photographer' },
  { id: 'cp_4', name: 'Arvi Ross', amount: 3_456, daysOverdue: 5, status: 'on_hold', period: 'this_month', role: 'videographer' },
  { id: 'cp_5', name: 'Raj Yadav', amount: 1_500, daysOverdue: 1, status: 'overdue', period: 'this_month', role: 'photographer' },
  { id: 'cp_6', name: 'Maya Chen', amount: 8_900, daysOverdue: 34, status: 'overdue', period: 'last_month', role: 'videographer' },
  { id: 'cp_7', name: 'Leo Martins', amount: 4_200, daysOverdue: 28, status: 'partial', period: 'last_month', role: 'photographer' },
  { id: 'cp_8', name: 'Nora Blake', amount: 12_300, daysOverdue: 61, status: 'on_hold', period: 'last_3_months', role: 'videographer' },
];

const STATUS_LABEL: Record<OverdueStatus, string> = {
  overdue: 'Overdue',
  partial: 'Partially Paid',
  on_hold: 'On Hold',
};

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
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface TopOverdueCPsProps {
  /** Pass real data later; falls back to dummy data */
  data?: OverdueCP[];
  /** Max rows shown */
  limit?: number;
  title?: string;
  infoText?: string;
}

export default function TopOverdueCPs({
  data,
  limit = 5,
  title = 'Top Overdue CPs',
  infoText = 'CPs with overdue payments, ranked by highest outstanding amount.',
}: TopOverdueCPsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'all' | OverdueStatus>('all');
  const [period, setPeriod] = useState<Period>('this_month');
  const [role, setRole] = useState<'all' | CPRole>('all');
  const [query, setQuery] = useState('');

  useEffect(() => setMounted(true), []);

  // Simulated fetch whenever filters that would hit the API change
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [status, period, role]);

  const isDark = !mounted || theme === "dark";

  // Filter → search → sort by amount (desc) → top N
  const rows: OverdueCP[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? DUMMY_CPS)
      .filter((cp) => status === 'all' || cp.status === status)
      .filter((cp) => cp.period === period)
      .filter((cp) => role === 'all' || cp.role === role)
      .filter((cp) => !q || cp.name.toLowerCase().includes(q))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }, [data, status, period, role, query, limit]);

  // Colours (warm red-tinted card from the design)
  const cardCls = isDark ? 'bg-[#231B1B] border-[#FF6467] text-white' : 'bg-[#FFF8F7] border-[#E7A3A6] text-[#202020]';
  const divider = isDark ? 'border-[#FF6467]/60' : 'border-[#E7A3A6]';
  const headCls = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const amountCls = isDark ? 'text-[#E8D1AB]' : 'text-[#7A5A24]';
  const daysCls = isDark ? 'text-[#FF6467]' : 'text-[#C93A3A]';
  const triggerCls = `w-auto min-w-[48px] gap-2 rounded-full h-7 px-2.5 text-[10px] focus:ring-0 ${isDark ? "bg-[#171717] border-[#807E7E] text-[#C4C4C4]" : "bg-white border-[#E3D2D2] text-[#323232]"}`;
  const contentCls = isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]";

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${cardCls}`}>
      {/* Header + filters */}
      <div className="p-5 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm lg:text-base">{title}</p>
            <span className="relative group/info inline-flex">
              <Info
                size={13}
                className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
              />
              <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-lg border px-3 py-2 text-xs leading-snug font-normal opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
                {infoText}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v: string) => setStatus(v as 'all' | OverdueStatus)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Status">{status === 'all' ? 'Status' : STATUS_LABEL[status as OverdueStatus]}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v: string) => setPeriod(v as Period)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Month">{period === 'this_month' ? 'Month' : period === 'last_month' ? 'Last Month' : '3 Months'}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={role} onValueChange={(v: string) => setRole(v as 'all' | CPRole)}>
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="All">{role === 'all' ? 'All' : role === 'photographer' ? 'Photo' : 'Video'}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentCls}>
                <SelectItem value="all">All CPs</SelectItem>
                <SelectItem value="photographer">Photographers</SelectItem>
                <SelectItem value="videographer">Videographers</SelectItem>
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
      <div className="overflow-x-auto">
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
                <tr key={cp.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'}`}>
                  <td className={`px-5 py-2 ${i === 0 ? 'pt-5' : ''} ${i === rows.length - 1 ? 'pb-5' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {cp.avatarUrl ? (
                        <img src={cp.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-[#FFF6DA]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0 bg-[#FFF6DA] text-[#171717] flex items-center justify-center text-sm font-semibold">
                          {initials(cp.name)}
                        </div>
                      )}
                      <span className="text-xs lg:text-sm font-medium truncate">{cp.name}</span>
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
                  No overdue CPs match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
