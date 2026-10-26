"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ComposedChart, Bar, Cell, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";
import type { FinanceAnalyticsData } from '@/lib/api'; // same path as before

export interface CPShoots {
  id: string;
  name: string;
  shoots: number;   // bar: shoots completed by this CP
  trend: number;    // dashed line value at this CP
}

/* ------------------------------------------------------------------ */
/* Chart rows                                                          */
/* ------------------------------------------------------------------ */

// Rows alternate: [between, CP, between, CP, ..., between].
// Bars only exist on CP rows; the dashed line runs through every row.
interface Row {
  key: string;
  label: string;          // X-axis label (empty on "between" rows)
  shoots?: number;
  trend: number;
  isCP: boolean;
}

const buildRows = (cps: CPShoots[], between: number[]): Row[] => {
  const rows: Row[] = [];
  cps.forEach((cp, i) => {
    const prevTrend = cps[i - 1]?.trend ?? cp.trend;
    rows.push({ key: `gap-${i}`, label: '', trend: between[i] ?? (prevTrend + cp.trend) / 2, isCP: false });
    rows.push({ key: cp.id, label: cp.name, shoots: cp.shoots, trend: cp.trend, isCP: true });
  });
  rows.push({ key: 'gap-end', label: '', trend: between[cps.length] ?? cps[cps.length - 1]?.trend ?? 0, isCP: false });
  return rows;
};

// Keep roughly five readable tick intervals while scaling to the live shoot counts.
const getYAxisScale = (values: number[]) => {
  const max = Math.max(0, ...values.filter(Number.isFinite));
  const roughStep = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep || 1));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude)
    .find((candidate) => candidate >= roughStep && candidate >= 1) ?? 1;
  const upper = Math.max(step, Math.ceil(max / step) * step);
  return { upper, ticks: Array.from({ length: upper / step + 1 }, (_, index) => index * step) };
};

/* ------------------------------------------------------------------ */
/* Chart pieces                                                        */
/* ------------------------------------------------------------------ */

// Active point on the dashed line: ring dot + "N Shoots" bubble above it.
// Only shown on CP rows (not on the in-between points).
const ActiveDotWithBubble = ({ cx, cy, payload, isDark }: {
  cx?: number;
  cy?: number;
  payload?: Row;
  isDark: boolean;
}) => {
  if (cx == null || cy == null || !payload?.isCP) return null;
  const text = `${payload.shoots} Shoots`;
  const w = text.length * 7.6 + 24;
  const h = 26;
  const bubbleY = cy - h - 14;
  const bubbleFill = isDark ? '#FFFFFF' : '#171717';
  const textFill = isDark ? '#171717' : '#FFFFFF';
  return (
    <g>
      <rect x={cx - w / 2} y={bubbleY} width={w} height={h} rx={5} fill={bubbleFill}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }} />
      <path d={`M${cx - 5},${bubbleY + h - 0.5} L${cx},${bubbleY + h + 5} L${cx + 5},${bubbleY + h - 0.5} Z`} fill={bubbleFill} />
      <text x={cx} y={bubbleY + h / 2 + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={textFill}>
        {text}
      </text>
      <circle cx={cx} cy={cy} r={6} fill={isDark ? '#121212' : '#FFFFFF'} stroke="#E5D5B8" strokeWidth={2.5} />
    </g>
  );
};

// Vertical dashed guide from the active point down to the axis (CP rows only)
const DashedCursor = ({ points, payload, height, top, isDark }: {
  points?: Array<{ x: number }>;
  payload?: Array<{ payload: Row }>;
  height?: number;
  top?: number;
  isDark: boolean;
}) => {
  const row = payload?.[0]?.payload;
  if (!row?.isCP || !points?.length || top == null || height == null) return null;
  const x = points[0].x;
  return (
    <line x1={x} x2={x} y1={top} y2={top + height}
      stroke={isDark ? '#FFFFFF66' : '#32323266'} strokeWidth={1} strokeDasharray="5 5" />
  );
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

export interface SelectedShootCP {
  id: string;
  name: string;
  shoots: number;
}

interface TopCPsByShootsProps {
  data?: FinanceAnalyticsData['creative_partners']['top_by_shoots'] | null;
  loading?: boolean;
  /** Line values for the points between bars (length = data.length + 1). Optional. */
  between?: number[];
  title?: string;
  infoText?: string;
  selectedId?: string | null;
  onSelectCP?: (cp: SelectedShootCP | null) => void;
}

export default function TopCPsByShoots({
  data = null,
  loading = false,
  between,
  title = 'Top CPs By Shoots',
  infoText = 'Top 10 CPs with the highest number of assigned/completed shoots .',
  selectedId = null,
  onSelectCP,
}: TopCPsByShootsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const cps: CPShoots[] = useMemo(
    () => (data ?? []).map((cp) => ({ id: cp.id, name: cp.name, shoots: cp.shoots, trend: cp.shoots })),
    [data]
  );
  const rows: Row[] = useMemo(() => buildRows(cps, between ?? []), [cps, between]);

  const { upper: yMax, ticks: yTicks } = useMemo(
    () => getYAxisScale(rows.flatMap((row) => [row.shoots ?? 0, row.trend])),
    [rows]
  );

  // Pre-select the busiest CP so the bubble shows on load (Cleo Dasha in the design)
  const defaultIndex = useMemo(() => {
    let best = -1;
    rows.forEach((r: Row, i: number) => {
      if (r.isCP && (best === -1 || (r.shoots ?? 0) > (rows[best].shoots ?? 0))) best = i;
    });
    return best === -1 ? undefined : best;
  }, [rows]);

  // Colours
  const barTop = isDark ? '#2E8BF8' : '#3B7BE6';
  const lineColor = isDark ? '#FFFFFF' : '#323232AA';
  const areaColor = isDark ? '#2E8BF826' : '#3B7BE6';
  const tickColor = isDark ? '#FFFFFF66' : '#32323266';

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

      {/* Chart — scrolls sideways on small screens so the 10 names don't overlap */}
      <div className="px-3 pt-6 pb-4 overflow-x-auto">
        <div className="h-[340px] lg:h-[420px] relative" style={{ minWidth: Math.max(720, cps.length * 105) }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
              <div className="h-8 w-8 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && cps.length === 0 && (
            <div className={`absolute inset-0 flex items-center justify-center text-sm ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>
              No shoots yet.
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={isLoading ? [] : rows}
              margin={{ top: 44, right: 10, left: -10, bottom: 0 }}
              barCategoryGap="6%"
              style={{ cursor: onSelectCP ? 'pointer' : 'default' }}
              onClick={(state: { activeTooltipIndex?: number | string | null }) => {
                const index = state?.activeTooltipIndex;
                const row = index == null ? undefined : rows[Number(index)];
                if (!row?.isCP) return;
                onSelectCP?.(selectedId === row.key ? null : { id: row.key, name: row.label, shoots: row.shoots ?? 0 });
              }}
            >
              <defs>
                {/* Bars: solid blue at the top fading out toward the axis */}
                <linearGradient id="cpShootsBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barTop} stopOpacity={0.80} />
                  <stop offset="55%" stopColor={"#7DB3F380"} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={"#FFFFFF00"} stopOpacity={0.02} />
                </linearGradient>
                {/* Selected bar: green version of the same gradient */}
                <linearGradient id="cpShootsBarGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.9} />
                  <stop offset="55%" stopColor="#4ADE80" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#FFFFFF00" stopOpacity={0.02} />
                </linearGradient>
                {/* Area under the dashed line */}
                <linearGradient id="cpShootsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaColor} stopOpacity={isDark ? 0.75 : 0.12} />
                  <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="key"
                axisLine={false}
                tickLine={false}
                interval={0}
                tickFormatter={(_: string, i: number) => rows[i]?.label ?? ''}
                tick={{ fill: isDark ? '#FFFFFFCC' : '#323232B3', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, yMax]}
                ticks={yTicks}
                tick={{ fill: tickColor, fontSize: 12 }}
              />

              {/* Tooltip only drives hover; the visible label is the bubble on the line */}
              <Tooltip
                defaultIndex={defaultIndex}
                content={() => null}
                cursor={<DashedCursor isDark={isDark} />}
              />

              {/* Area + dashed line sit behind the bars */}
              <Area
                type="linear"
                dataKey="trend"
                stroke={lineColor}
                strokeWidth={1.2}
                strokeDasharray="7 6"
                fill="url(#cpShootsAreaGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={(props) => <ActiveDotWithBubble {...props} isDark={isDark} />}
                isAnimationActive
              />
              <Bar
                dataKey="shoots"
                fill="url(#cpShootsBarGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              >
                {rows.map((r: Row) => (
                  <Cell
                    key={r.key}
                    fill={selectedId && r.key === selectedId ? 'url(#cpShootsBarGradientGreen)' : 'url(#cpShootsBarGradient)'}
                    fillOpacity={selectedId && r.key !== selectedId ? 0.35 : 1}
                    style={{ transition: 'fill-opacity 300ms ease' }}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
