"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { FinanceAnalyticsData } from '@/lib/api'; 
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type AvgMetricId = 'payout' | 'margin' | 'cps';

export interface AvgMetric {
  id: AvgMetricId;
  label: string;        // legend label
  bubbleLabel: string;  // label shown in the speech bubble over the circle
  info: string;
  value: number;
  max: number;          // bar is value / max (e.g. target or best-in-range)
  format: (n: number) => string;
}

type Averages = FinanceAnalyticsData['creative_partners']['averages'];

const formatUSD0 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// Bar lengths: margin is a percentage (max 100). The API has no target for the other two,
// so their bar is a fixed ~80%. Replace with real targets if the backend provides them.
const BAR_HEADROOM = 1.25;

const buildMetrics = (a: Averages | null | undefined): AvgMetric[] => {
  const payout = a?.payout_per_assignment ?? 0;
  const margin = a?.cp_payout_percent_of_revenue ?? 0;
  const cps = a?.cps_per_shoot ?? 0;
  return [
    {
      id: 'payout',
      label: 'Average CP Payout',
      bubbleLabel: 'Per Shoot Payout',
      info: 'Average amount paid to a CP per shoot.',
      value: payout,
      max: payout * BAR_HEADROOM,
      format: formatUSD0,
    },
    {
      id: 'margin',
      label: 'Average CP Margin',
      bubbleLabel: 'Avg Margin',
      info: 'Average margin of the payout that is going for CP payout.',
      value: margin,
      max: 100,
      format: (n) => `${n.toFixed(1)}%`,
    },
    {
      id: 'cps',
      label: 'Average CPs per Shoot',
      bubbleLabel: 'CPs per Shoot',
      info: 'Average number of CPs assigned to each shoot.',
      value: cps,
      max: cps * BAR_HEADROOM,
      format: (n) => n.toFixed(1),
    },
  ];
};

/* ------------------------------------------------------------------ */
/* Visual config                                                       */
/* ------------------------------------------------------------------ */

// Desktop diameter of the biggest circle (CP Payout), from the design: 137.888 x 138.491px.
// The cluster box is sized from it, so every other circle keeps its proportion:
//   Avg Margin    = 61.25 / 82 x 138 ~ 103px
//   CPs per Shoot = 54.25 / 82 x 138 ~ 91px
const BIGGEST_CIRCLE_PX = 138;
const BIGGEST_CIRCLE_PCT = 82; // CIRCLES.payout.size
const CLUSTER_WIDTH_PX = (BIGGEST_CIRCLE_PX / BIGGEST_CIRCLE_PCT) * 100; // ~168px

// Circle positions, measured from the design. left/size = % of box width, top = % of box height
// (box aspect 400 x 467).
// Order in this object = paint order (later sits on top).
const CIRCLES: Record<AvgMetricId, {
  left: number; top: number; size: number; z: number;
  gradient: string; bar: string; text: string;
}> = {
  payout: {
    left: 18.25, top: 0, size: 82, z: 1,
    gradient: 'linear-gradient(180deg, #508BED 0%, #FFFFFF 100%)',
    bar: 'linear-gradient(90deg, #508BED 0%, #FFFFFF 100%)',
    text: 'text-sm lg:text-lg',
  },
  cps: {
    left: 43.75, top: 53.5, size: 54.25, z: 2,
    gradient: 'linear-gradient(180deg, #D93FB2 0%, #FFFFFF 100%)',
    bar: 'linear-gradient(90deg, #D93FB2 0%, #FFFFFF 100%)',
    text: 'text-sm lg:text-lg',
  },
  margin: {
    left: 0, top: 37, size: 61.25, z: 3,
    gradient: 'linear-gradient(180deg, #179A62 0%, #FFFFFF 100%)',
    bar: 'linear-gradient(90deg, #179A62 0%, #FFFFFF 100%)',
    text: 'text-sm lg:text-lg',
  },
};

// Where the value sits inside each circle (% of circle), so overlaps don't cover it
const VALUE_POS: Record<AvgMetricId, { x: number; y: number }> = {
  payout: { x: 52, y: 42 },
  margin: { x: 50, y: 50 },
  cps: { x: 52, y: 54 },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface AvgPayoutMarginCountProps {
  data?: Averages | null;
  loading?: boolean;
  title?: string;
}

export default function AvgPayoutMarginCount({
  data = null,
  loading = false,
  title = 'Avg - Payout/Margin/Count',
}: AvgPayoutMarginCountProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<AvgMetricId | null>(null);
  // Info tooltip opened by tap (touch screens); hover still works on desktop
  const [openInfoId, setOpenInfoId] = useState<AvgMetricId | null>(null);

  // Info tooltip placement, measured so it always stays inside the card (mobile + desktop)
  const cardRef = useRef<HTMLDivElement>(null);
  const infoRefs = useRef<Partial<Record<AvgMetricId, HTMLSpanElement | null>>>({});
  const [infoPos, setInfoPos] = useState<Partial<Record<AvgMetricId, { left: number; width: number }>>>({});

  const placeInfo = useCallback((id: AvgMetricId) => {
    const card = cardRef.current?.getBoundingClientRect();
    const anchor = infoRefs.current[id]?.getBoundingClientRect();
    if (!card || !anchor) return;
    const gutter = 12;
    const width = Math.min(224, card.width - gutter * 2);
    // Start just left of the icon (as on desktop), then pull back inside the card if it would overflow
    const desired = anchor.left + anchor.width / 2 - 16;
    const clamped = Math.max(card.left + gutter, Math.min(desired, card.right - gutter - width));
    const left = clamped - anchor.left; // relative to the icon wrapper
    setInfoPos((prev) =>
      prev[id]?.left === left && prev[id]?.width === width ? prev : { ...prev, [id]: { left, width } }
    );
  }, []);

  useEffect(() => setMounted(true), []);

  // Re-measure the open tooltip on resize / rotate
  useEffect(() => {
    if (!openInfoId) return;
    placeInfo(openInfoId);
    const onResize = () => placeInfo(openInfoId);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [openInfoId, placeInfo]);

  // Close the tapped info tooltip when tapping anywhere else
  useEffect(() => {
    if (!openInfoId) return;
    const close = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-info-tooltip]')) setOpenInfoId(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [openInfoId]);

  // Simulated fetch so the loading state matches the other dashboard components
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const isDark = !mounted || theme === "dark";
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const active = activeId ? metrics.find((m) => m.id === activeId) ?? null : null;

  // Ring around each circle = card background, so overlaps read as cut-outs
  const ringColor = isDark ? '#101010' : '#FFFFFF';
  const bodyBg = isDark ? 'bg-[#101010]' : 'bg-white';

  // Paint order for circles (back -> front)
  const paintOrder: AvgMetricId[] = ['payout', 'cps', 'margin'];

  return (
    <div ref={cardRef} className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`flex items-center px-5 py-5 lg:py-6 ${isDark ? "bg-[#0A0A0A]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8 md:gap-10 items-center px-5 sm:px-8 pt-12 pb-8 lg:pb-10">
        {/* Circle cluster */}
        <div
          className="relative mx-auto"
          style={{ width: CLUSTER_WIDTH_PX, maxWidth: '100%', aspectRatio: '400 / 467' }}
          onMouseLeave={() => setActiveId(null)}
        >
          {isLoading ? (
            <div className={`absolute inset-[10%] rounded-full animate-pulse ${isDark ? 'bg-white/5' : 'bg-zinc-100'}`} />
          ) : (
            paintOrder.map((id) => {
              const m = metrics.find((x) => x.id === id);
              if (!m) return null;
              const c = CIRCLES[id];
              const isActive = id === active?.id;
              const vp = VALUE_POS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onMouseEnter={() => setActiveId(id)}
                  onFocus={() => setActiveId(id)}
                  onBlur={() => setActiveId(null)}
                  onClick={() => setActiveId((cur: AvgMetricId | null) => (cur === id ? null : id))}
                  aria-label={`${m.label}: ${m.format(m.value)}`}
                  className={`absolute rounded-full transition-transform duration-300 ease-out focus:outline-none ${isActive ? 'scale-[1.04]' : 'scale-100'}`}
                  style={{
                    left: `${c.left}%`,
                    top: `${c.top}%`,
                    width: `${c.size}%`,
                    aspectRatio: '1 / 1',
                    zIndex: c.z,
                    background: c.gradient,
                    boxShadow: `0 0 0 3px ${ringColor}`,
                  }}
                >
                  <span
                    className={`absolute -translate-x-1/2 -translate-y-1/2 font-bold text-white tabular-nums whitespace-nowrap pointer-events-none ${c.text}`}
                    style={{ left: `${vp.x}%`, top: `${vp.y}%` }}
                  >
                    {m.format(m.value)}
                  </span>
                </button>
              );
            })
          )}

          {/* Speech bubble above the hovered circle (hover / focus / tap only) */}
          {!isLoading && active && (() => {
            const c = CIRCLES[active.id];
            const cx = c.left + c.size / 2;
            // Bubble's bottom overlaps the top of its circle slightly, pointer left of centre (as designed)
            const anchorTop = c.top + 7.7;
            return (
              <div
                className="absolute z-10 pointer-events-none transition-all duration-300 ease-out"
                style={{ left: `${cx}%`, top: `${anchorTop}%`, transform: 'translate(-70%, -100%)' }}
              >
                <div className={`relative px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-bold whitespace-nowrap shadow-xl animate-in fade-in zoom-in-95 duration-150 ${isDark ? 'bg-white text-[#171717]' : 'bg-[#171717] text-white'}`}>
                  {active.bubbleLabel}
                  <span className={`absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${isDark ? 'bg-white' : 'bg-[#171717]'}`} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Legend with progress bars */}
        <ul className="space-y-8 lg:space-y-10">
          {metrics.map((m, index) => {
            const isInfoOpen = openInfoId === m.id;
            // Last row opens upwards so the tooltip isn't clipped by the card bottom
            const opensUp = index === metrics.length - 1;
            const pct = Math.max(2, Math.min(100, (m.value / (m.max || 1)) * 100));
            return (
              <li
                key={m.id}
                onMouseEnter={() => setActiveId(m.id)}
                onMouseLeave={() => setActiveId(null)}
                className="cursor-default"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs lg:text-sm font-medium">{m.label}</span>
                  <span
                    ref={(el) => { infoRefs.current[m.id] = el; }}
                    onMouseEnter={() => placeInfo(m.id)}
                    className="relative group/info inline-flex"
                    data-info-tooltip
                  >
                    <button
                      type="button"
                      aria-label={`About ${m.label}`}
                      aria-expanded={isInfoOpen}
                      onClick={() => setOpenInfoId((cur: AvgMetricId | null) => (cur === m.id ? null : m.id))}
                      className="inline-flex p-1 -m-1 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D1AB]"
                    >
                    <Info
                      size={13}
                      className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
                    />
                    </button>
                    <span
                      role="tooltip"
                      style={{ left: infoPos[m.id]?.left ?? -16, width: infoPos[m.id]?.width ?? 224 }}
                      className={`absolute ${opensUp ? 'bottom-full mb-2' : 'top-full mt-2'} rounded-lg border px-3 py-2 text-xs leading-snug font-normal transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isInfoOpen ? 'opacity-100 visible' : 'opacity-0 invisible [@media(hover:hover)]:group-hover/info:opacity-100 [@media(hover:hover)]:group-hover/info:visible'} ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}
                    >
                      {m.info}
                    </span>
                  </span>
                  {/* Value repeated on small screens, where the circles stack above */}
                  <span className="ml-auto text-sm font-bold tabular-nums md:hidden">{isLoading ? '' : m.format(m.value)}</span>
                </div>
                <div
                  className={`h-[3px] w-full rounded-full overflow-hidden ${isDark ? 'bg-[#3D3D3D]' : 'bg-[#E8E8E8]'}`}
                  role="progressbar"
                  aria-label={m.label}
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: isLoading ? '0%' : `${pct}%`, background: CIRCLES[m.id].bar }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
