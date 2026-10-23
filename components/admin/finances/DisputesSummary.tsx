"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Info, ArrowUpRight } from 'lucide-react';
import DisputeHistoryPanel, { type DisputeHistoryItem } from '@/components/admin/finances/analytics/DisputeHistoryPanel';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type DisputeMetricId = 'raised' | 'resolved' | 'pending' | 'active';

export interface DisputeMetric {
  id: DisputeMetricId;
  label: string;
  info: string;
  textColor: string;
  value: number;
}

type Disputes = FinanceAnalyticsData['disputes'];

// TODO: replace with real API data later
const STATIC_DISPUTES: DisputeHistoryItem[] = [
  {
    id: 'DIS-001',
    shootId: 'SH-004',
    invoiceId: 'INV-004-B',
    category: 'Quality Issue',
    description: 'The final photos did not meet the agreed quality standards.',
    raisedBy: 'Emily Johnson',
    raisedRole: 'Client',
    raisedDate: '19-04-2026',
    disputedAmount: '$5,000',
    payoutHold: '$4,500',
    status: 'Open',
  },
  {
    id: 'DIS-002',
    shootId: 'SH-005',
    invoiceId: 'INV-005-A',
    category: 'Payment Delay',
    description: 'Payout has been delayed beyond the agreed timeline.',
    raisedBy: 'Ryan Cooper',
    raisedRole: 'Creator',
    raisedDate: '17-04-2026',
    disputedAmount: '$4,200',
    payoutHold: '$3,696',
    status: 'Open',
  },
  {
    id: 'DIS-003',
    shootId: 'SH-006',
    invoiceId: 'INV-006-A',
    category: 'Wrong Deliverable',
    description: 'Received wrong edited files.',
    raisedBy: 'Marcus Reid',
    raisedRole: 'Client',
    raisedDate: '22-03-2026',
    disputedAmount: '$3,200',
    payoutHold: '$1,200',
    status: 'Open',
  },
];

const buildMetrics = (d: Disputes | null | undefined): DisputeMetric[] => [
  { id: 'raised', label: 'Disputes Raised', info: 'Total new Disputes raised.', value: d?.raised ?? 0, textColor: 'text-white' },
  { id: 'resolved', label: 'Resolved Disputes', info: 'Disputes resolved successfully.', value: d?.resolved ?? 0, textColor: 'text-[#70BB8C]' },
  { id: 'pending', label: 'Pending Disputes', info: 'Disputes waiting for action/resolution.', value: d?.pending ?? 0, textColor: 'text-[#C9A96E]' },
  { id: 'active', label: 'Active Disputes', info: 'Disputes currently being worked on - Active/Ongoing.', value: d?.active ?? 0, textColor: 'text-[#90C7EA]' },
];

// Bar fades from transparent (left) into the metric colour (right); value uses the same colour
const COLORS: Record<DisputeMetricId, { dark: string; light: string }> = {
  raised: { dark: '#C7C7C7', light: '#FFFFFF00' },
  resolved: { dark: '#70BB8C', light: '#FFFFFF00' },
  pending: { dark: '#F0B851', light: '#FFFFFF00' },
  active: { dark: '#5DA7D5', light: '#FFFFFF00' },
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

interface DisputesSummaryProps {
  /** analytics.disputes */
  data?: Disputes | null;
  loading?: boolean;
}

export default function DisputesSummary({ data = null, loading = false }: DisputesSummaryProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const max = Math.max(1, ...metrics.map((m) => m.value));

  // Which metric row is expanded
  const [expandedId, setExpandedId] = useState<DisputeMetricId | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('Month');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredDisputes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return STATIC_DISPUTES.filter(
      (d) =>
        (statusFilter === 'All' || d.status === statusFilter) &&
        (typeFilter === 'All' || d.raisedRole === typeFilter) &&
        (!q || d.id.toLowerCase().includes(q) || d.raisedBy.toLowerCase().includes(q))
    );
  }, [search, statusFilter, typeFilter]);

  return (
    <div data-tooltip-bounds className={`transition-colors duration-300 border rounded-2xl w-full p-5 ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      <ul className="space-y-5 lg:space-y-6">
        {metrics.map((m) => {
          const color = isDark ? COLORS[m.id].dark : COLORS[m.id].light;
          const pct = Math.max(6, (m.value / max) * 100);
          return (
            <li
              key={m.id}
              className={`transition-opacity duration-300 ${expandedId !== null && expandedId !== m.id ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs lg:text-sm font-medium">{m.label}</span>
                <InfoTooltip
                  text={m.info}
                  label={m.label}
                  isDark={isDark}
                  placement="top"
                  iconClassName={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
                  />
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                {/* Bar */}
                <div className="flex-1 h-9 lg:h-11">
                  {isLoading ? (
                    <div className={`h-full w-2/3 rounded-full animate-pulse ${isDark ? 'bg-white/5' : 'bg-zinc-100'}`} />
                  ) : (
                    <div
                      className="relative h-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    >
                      <div
                        className="h-full w-full rounded-r-full"
                        style={{
                          background: `linear-gradient(90deg, ${color}00 0%, ${color}55 40%, ${color} 100%)`,
                        }}
                        role="progressbar"
                        aria-label={m.label}
                        aria-valuenow={m.value}
                        aria-valuemin={0}
                        aria-valuemax={max}
                      />
                      <button
                        type="button"
                        aria-label={`${expandedId === m.id ? 'Hide' : 'View'} ${m.label}`}
                        aria-expanded={expandedId === m.id}
                        onClick={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full p-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D1AB] ${isDark ? 'text-black' : 'text-[#171717]'}`}
                      >
                        <ArrowUpRight
                          size={14}
                          className={`transition-transform duration-300 ${expandedId === m.id ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Value */}
                <span
                  className={`w-12 sm:w-14 shrink-0 text-right text-lg lg:text-2xl font-semibold ${m.textColor}`}
                >
                  {isLoading ? '' : m.value}
                </span>
              </div>

              {expandedId === m.id && (
                <div className="mt-4">
                  <DisputeHistoryPanel
                    items={filteredDisputes}
                    searchValue={search}
                    onSearchChange={setSearch}
                    statusValue={statusFilter}
                    onStatusChange={setStatusFilter}
                    monthValue={monthFilter}
                    onMonthChange={setMonthFilter}
                    typeValue={typeFilter}
                    onTypeChange={setTypeFilter}
                    onViewDetails={(item) => console.log('View details', item.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
