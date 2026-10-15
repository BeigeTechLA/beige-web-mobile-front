"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; 

/* ------------------------------------------------------------------ */
/* Categories (segment colours + legend)                               */
/* ------------------------------------------------------------------ */

type SegmentId = 'upcoming' | 'dueSoon' | 'later' | 'overdue';

const SEGMENTS: { id: SegmentId; label: string; color: string }[] = [
  { id: 'upcoming', label: 'Upcoming', color: '#54B98B' },
  { id: 'dueSoon', label: 'Due Soon (1-2 Week)', color: '#965EE0' },
  { id: 'later', label: 'Later (3-4 Week)', color: '#5891EF' },
  { id: 'overdue', label: 'Overdue', color: '#DE6074' },
];

/* ------------------------------------------------------------------ */
/* Dummy data (USD)                                                    */
/* ------------------------------------------------------------------ */

export interface PayoutBucket {
  id: string;
  label: string;
  segments: Partial<Record<SegmentId, number>>;
}

const DUMMY_BUCKETS: PayoutBucket[] = [
  { id: 'this_week', label: 'This Week', segments: { upcoming: 18_000_000, dueSoon: 11_000_000, later: 19_000_000 } },
  { id: 'next_week', label: 'Next Week', segments: { upcoming: 13_000_000, dueSoon: 34_000_000, later: 25_000_000 } },
  { id: '2_4_weeks', label: '2-4 Weeks', segments: { upcoming: 30_000_000, dueSoon: 10_000_000, later: 39_000_000, overdue: 20_000_000 } },
  { id: 'overdue', label: 'Overdue', segments: { upcoming: 43_000_000, dueSoon: 6_000_000, overdue: 53_000_000 } },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatCompactUSD = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

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

interface CPPayoutTimelineProps {
  data?: FinanceAnalyticsData['creative_partners']['payout_timeline'] | null;
  loading?: boolean;
  title?: string;
  infoText?: string;
}

export default function CPPayoutTimeline({
  data = null,
  loading = false,
  title = 'CP Payout Timeline',
  infoText = 'Timeline of payments made or due to Content Partners (CPs).',
}: CPPayoutTimelineProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;
  const [hovered, setHovered] = useState<{ bucket: string; seg: SegmentId } | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  // Each bar's length = its total vs the largest total; segments split the bar by share
  const rows: (PayoutBucket & { total: number; barPct: number })[] = useMemo(() => {
    const buckets: PayoutBucket[] = data ?? [];
    const withTotals = buckets.map((b) => ({
      ...b,
      total: SEGMENTS.reduce((sum, s) => sum + (b.segments[s.id] ?? 0), 0),
    }));
    const max = Math.max(1, ...withTotals.map((b) => b.total));
    return withTotals.map((b) => ({ ...b, barPct: (b.total / max) * 100 }));
  }, [data]);

  const mutedText = isDark ? 'text-white/40' : 'text-zinc-500';

  return (
    <div data-tooltip-bounds className={`transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center gap-1.5 px-5 py-5 lg:py-6 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
        <InfoTooltip
          text={infoText}
          label={title}
          isDark={isDark}
          iconClassName={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
          />
      </div>

      <div className={`p-4`}>
        {/* Bars */}
        <ul className="space-y-5 lg:space-y-7">
          {rows.map((row) => (
            <li key={row.id} className="grid grid-cols-[50px_minmax(0,1fr)_50px] sm:grid-cols-[70px_minmax(0,1fr)_60px] items-center gap-4 sm:gap-8">
              <span className={`text-xs sm:text-sm ${mutedText}`}>{row.label}</span>

              {/* Track */}
              <div className={`relative h-8 md:h-10 rounded-lg ${isDark ? 'bg-[#1A1919]' : 'bg-[#EFEFEF]'}`}>
                {isLoading ? (
                  <div className={`h-full rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`} style={{ width: '70%' }} />
                ) : (
                  <div
                    className="flex h-full rounded-lg overflow-hidden transition-[width] duration-700 ease-out"
                    style={{ width: `${row.barPct}%` }}
                  >
                    {SEGMENTS.map((s) => {
                      const v = row.segments[s.id] ?? 0;
                      if (!v) return null;
                      const isHover = hovered?.bucket === row.id && hovered.seg === s.id;
                      const dim = hovered && !isHover;
                      return (
                        <div
                          key={s.id}
                          onMouseEnter={() => setHovered({ bucket: row.id, seg: s.id })}
                          onMouseLeave={() => setHovered(null)}
                          className="h-full transition-opacity duration-150"
                          style={{
                            width: `${(v / row.total) * 100}%`,
                            backgroundColor: s.color,
                            opacity: dim ? 0.45 : 1,
                          }}
                          aria-label={`${row.label} – ${s.label}: ${formatCompactUSD(v)}`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Segment tooltip */}
                {!isLoading && hovered?.bucket === row.id && (() => {
                  const seg = SEGMENTS.find((s) => s.id === hovered.seg)!;
                  const v = row.segments[seg.id] ?? 0;
                  // Centre the tooltip over the hovered segment
                  let start = 0;
                  for (const s of SEGMENTS) {
                    if (s.id === seg.id) break;
                    start += row.segments[s.id] ?? 0;
                  }
                  const centre = ((start + v / 2) / row.total) * row.barPct;
                  return (
                    <div
                      className="absolute bottom-full mb-2 -translate-x-1/2 z-20 pointer-events-none"
                      style={{ left: `${centre}%` }}
                    >
                      <div className={`relative whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold shadow-xl ${isDark ? 'bg-white text-[#171717]' : 'bg-[#171717] text-white'}`}>
                        <span className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle" style={{ backgroundColor: seg.color }} />
                        {seg.label}: {formatCompactUSD(v)}
                        <span className={`absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-white' : 'bg-[#171717]'}`} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <span className="text-right text-base lg:text-lg">
                {isLoading ? '' : formatCompactUSD(row.total)}
              </span>
            </li>
          ))}
        </ul>

        {/* Legend */}
        <div className={`mt-4 lg:mt-8 rounded-lg border p-3 ${isDark ? 'bg-black border-[#363636]' : 'bg-[#F4F5F7] border-[#E3E3E3]'}`}>
          <p className="font-semibold text-base lg:text-lg mb-1.5">Color Legend</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-between">
            {SEGMENTS.map((s) => (
              <li key={s.id} className={`flex items-center gap-2 text-xs lg:text-sm ${isDark ? 'text-[#737373]' : 'text-zinc-500'}`}>
                <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
