"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { Info, ArrowUpRight } from 'lucide-react';
import DisputeHistoryPanel, { type DisputeHistoryItem } from '@/components/admin/finances/analytics/DisputeHistoryPanel';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before
import { financeTransactionsApi, type AdminFinanceDisputeApiRow } from '@/lib/api/financeTransactions';

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

const DISPUTES_PER_PAGE = 10;
const METRIC_STATUSES: Partial<Record<DisputeMetricId, string[]>> = {
  resolved: ['resolved'],
  pending: ['open'],
  active: ['in_review', 'escalated'],
};
const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value || 0);
  return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
const formatDisputeStatus = (value: string | null | undefined): DisputeHistoryItem['status'] => {
  const status = String(value || '').toLowerCase();
  if (status === 'in_review') return 'In Review';
  if (status === 'resolved') return 'Resolved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'escalated') return 'Escalated';
  return 'Open';
};
const mapDispute = (row: AdminFinanceDisputeApiRow): DisputeHistoryItem => {
  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const resolvedAt = row.resolved_at ? new Date(row.resolved_at) : null;
  const role = String(row.raised_by?.type || '').toLowerCase();
  const bookingId = String(row.booking_id || row.shoot_id || '').replace(/^SH-/i, '');
  return {
    disputeId: row.dispute_id || row.dispute_code || '',
    rawStatus: row.status || 'open',
    id: row.dispute_code || (row.dispute_id ? `DIS-${row.dispute_id}` : '—'),
    shootId: bookingId ? `SH-${bookingId.padStart(3, '0')}` : '—',
    invoiceId: row.invoice_id || (row.invoice_send_history_id ? `INV-${row.invoice_send_history_id}` : '—'),
    category: row.issue_type || row.category || 'Other',
    description: row.description || row.subject || '—',
    raisedBy: row.raised_by?.name || row.client?.name || row.creator?.name || '—',
    raisedRole: role === 'creator' ? 'Creator' : role === 'admin' ? 'Admin' : 'Client',
    raisedDate: createdAt && !Number.isNaN(createdAt.getTime()) ? format(createdAt, 'dd-MM-yyyy') : '—',
    resolvedDate: resolvedAt && !Number.isNaN(resolvedAt.getTime()) ? format(resolvedAt, 'dd-MM-yyyy') : '—',
    disputedAmount: formatMoney(row.disputed_amount),
    payoutHold: formatMoney(row.impacted_payout_amount ?? row.payout_hold_amount),
    status: formatDisputeStatus(row.status),
  };
};
const getPeriodRange = (period: string): { date_from?: string; date_to?: string } => {
  if (period === 'Month') return {};
  const end = new Date();
  const start = new Date(end);
  if (period === 'Last 30 Days') start.setTime(subDays(end, 29).getTime());
  else if (period === 'This Quarter') start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  else if (period === 'This Year') start.setMonth(0, 1);
  return { date_from: format(start, 'yyyy-MM-dd'), date_to: format(end, 'yyyy-MM-dd') };
};

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
  startDate?: string | null;
  endDate?: string | null;
}

export default function DisputesSummary({ data = null, loading = false, startDate = null, endDate = null }: DisputesSummaryProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const max = Math.max(1, ...metrics.map((m) => m.value));

  // Which metric row is expanded
  const [expandedId, setExpandedId] = useState<DisputeMetricId | null>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const expandedRowRef = useRef<HTMLLIElement>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('Month');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [disputes, setDisputes] = useState<DisputeHistoryItem[]>([]);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const periodRange = useMemo(() => getPeriodRange(monthFilter), [monthFilter]);
  const dateFrom = startDate && periodRange.date_from ? (startDate > periodRange.date_from ? startDate : periodRange.date_from) : startDate || periodRange.date_from;
  const dateTo = endDate && periodRange.date_to ? (endDate < periodRange.date_to ? endDate : periodRange.date_to) : endDate || periodRange.date_to;
  const totalPages = Math.max(1, Math.ceil(totalDisputes / DISPUTES_PER_PAGE));
  const metricStatuses = expandedId ? METRIC_STATUSES[expandedId] : undefined;
  const selectedApiStatus = statusFilter === 'All' ? undefined : statusFilter.toLowerCase().replaceAll(' ', '_');
  const matchingMetricStatuses = metricStatuses?.filter((value) => !selectedApiStatus || value === selectedApiStatus);
  const statusParam = metricStatuses
    ? matchingMetricStatuses?.length ? matchingMetricStatuses.join(',') : '__no_matching_status__'
    : selectedApiStatus;

  useEffect(() => {
    if (!expandedId || !historyPanelRef.current) return;
    historyPanelRef.current.animate(
      [
        { transform: 'translateY(-2rem)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: 300, easing: 'ease-out' },
    );
  }, [expandedId]);

  useEffect(() => {
    if (!expandedId) return;
    const timer = window.setTimeout(() => {
      expandedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [expandedId, currentPage, disputesLoading]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => setCurrentPage(1), [debouncedSearch, statusFilter, monthFilter, typeFilter, expandedId, startDate, endDate]);

  useEffect(() => {
    if (!expandedId) return;
    let cancelled = false;
    setDisputesLoading(true);
    setDisputes([]);
    setTotalDisputes(0);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDisputesLoading(false);
      return () => { cancelled = true; };
    }
    void financeTransactionsApi.listAdminDisputes({
      page: currentPage,
      limit: DISPUTES_PER_PAGE,
      search: debouncedSearch || undefined,
      status: statusParam,
      raised_by_type: typeFilter === 'All' ? undefined : typeFilter.toLowerCase(),
      sort_by: expandedId === 'resolved' ? 'resolved_at' : 'created_at',
      sort_dir: 'DESC',
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      date_field: expandedId === 'resolved' ? 'resolved_at' : 'created_at',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    }).then((response) => {
      if (cancelled) return;
      const result = response.data;
      const nextRows = result?.rows || [];
      setDisputes(nextRows.map(mapDispute));
      setTotalDisputes(Number(result?.pagination?.total || 0));
      const apiPage = Number(result?.pagination?.page || currentPage);
      if (apiPage !== currentPage) setCurrentPage(apiPage);
    }).catch((error) => {
      if (cancelled) return;
      console.error('Failed to load analytics dispute history:', error);
      setDisputes([]);
      setTotalDisputes(0);
    }).finally(() => {
      if (!cancelled) setDisputesLoading(false);
    });
    return () => { cancelled = true; };
  }, [expandedId, currentPage, debouncedSearch, statusParam, typeFilter, dateFrom, dateTo]);

  return (
    <div data-tooltip-bounds className={`[overflow-anchor:none] transition-colors duration-300 border rounded-2xl w-full p-5 ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      <ul className="space-y-5 lg:space-y-6">
        {metrics.map((m) => {
          const color = isDark ? COLORS[m.id].dark : COLORS[m.id].light;
          const pct = Math.max(6, (m.value / max) * 100);
          return (
            <li
              key={m.id}
              ref={expandedId === m.id ? expandedRowRef : undefined}
              className={`scroll-mt-4 transition-opacity duration-300 ${expandedId !== null && expandedId !== m.id ? 'opacity-40' : 'opacity-100'}`}
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
                        onClick={() => setExpandedId((prev) => {
                          if (prev === m.id) return null;
                          setStatusFilter('All');
                          return m.id;
                        })}
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
                <div ref={historyPanelRef} className="mt-4">
                  <DisputeHistoryPanel
                    items={disputes}
                    showResolvedDate={expandedId === 'resolved'}
                    loading={disputesLoading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    statusValue={statusFilter}
                    onStatusChange={setStatusFilter}
                    monthValue={monthFilter}
                    onMonthChange={setMonthFilter}
                    typeValue={typeFilter}
                    onTypeChange={setTypeFilter}
                    currentPage={currentPage}
                    totalItems={totalDisputes}
                    totalPages={totalPages}
                    itemsPerPage={DISPUTES_PER_PAGE}
                    onPageChange={setCurrentPage}
                    onViewDetails={(item) => {
                      if (item.disputeId) router.push(`/admin/finances/disputes?dispute_id=${encodeURIComponent(item.disputeId)}`);
                    }}
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
