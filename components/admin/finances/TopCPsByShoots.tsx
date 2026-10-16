"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ComposedChart, Bar, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface CPShoots {
  id: string;
  name: string;
  shoots: number;   // bar: shoots completed by this CP
  trend: number;    // dashed line value at this CP
}

const DUMMY_CPS: CPShoots[] = [
  { id: 'cp_1', name: 'Priya Nair', shoots: 82, trend: 31 },
  { id: 'cp_2', name: 'Marcus Reid', shoots: 36, trend: 44 },
  { id: 'cp_3', name: 'Leon Vo', shoots: 58, trend: 58 },
  { id: 'cp_4', name: 'Cleo Dasha', shoots: 93, trend: 95 },
  { id: 'cp_5', name: 'Amara Sow', shoots: 18, trend: 55 },
  { id: 'cp_6', name: 'Raj Verma', shoots: 47, trend: 53 },
  { id: 'cp_7', name: 'John Doe', shoots: 27, trend: 65 },
  { id: 'cp_8', name: 'Ethan Cater', shoots: 66, trend: 70 },
  { id: 'cp_9', name: 'Sakuna Patel', shoots: 41, trend: 85 },
  { id: 'cp_10', name: 'Amy Jason', shoots: 76, trend: 55 },
];

// Trend values for the points BETWEEN bars (before the 1st CP, between each pair, after the last).
// Length must be CPs + 1. Gives the line its own shape like the design.
const DUMMY_BETWEEN: number[] = [0, 42, 42, 67, 38, 72, 51, 77, 77, 40, 35];

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
    rows.push({ key: `gap-${i}`, label: '', trend: between[i] ?? cp.trend, isCP: false });
    rows.push({ key: cp.id, label: cp.name, shoots: cp.shoots, trend: cp.trend, isCP: true });
  });
  rows.push({ key: 'gap-end', label: '', trend: between[cps.length] ?? cps[cps.length - 1]?.trend ?? 0, isCP: false });
  return rows;
};

/* ------------------------------------------------------------------ */
/* Chart pieces                                                        */
/* ------------------------------------------------------------------ */

// Active point on the dashed line: ring dot + "N Shoots" bubble above it.
// Only shown on CP rows (not on the in-between points).
const ActiveDotWithBubble = ({ cx, cy, payload, isDark }: any) => {
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
const DashedCursor = ({ points, payload, height, top, isDark }: any) => {
  const row = payload?.[0]?.payload;
  if (!row?.isCP || !points?.length) return null;
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

interface TopCPsByShootsProps {
  /** Pass real data later; falls back to dummy data */
  data?: CPShoots[];
  /** Line values for the points between bars (length = data.length + 1). Optional. */
  between?: number[];
  title?: string;
  infoText?: string;
}

export default function TopCPsByShoots({
  data,
  between,
  title = 'Top CPs By Shoots',
  infoText = 'Top 10 CPs with the highest number of assigned/completed shoots .',
}: TopCPsByShootsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  // Simulated fetch so the loading state matches the other dashboard components
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const isDark = !mounted || theme === "dark";

  const cps = data ?? DUMMY_CPS;
  const rows: Row[] = useMemo(
    () => buildRows(cps, between ?? (data ? [] : DUMMY_BETWEEN)),
    [cps, between, data]
  );

  // Y axis: 0–100 like the design, growing in steps of 20 if data goes higher
  const maxVal = Math.max(100, ...rows.map((r: Row) => Math.max(r.shoots ?? 0, r.trend)));
  const yMax = Math.ceil(maxVal / 20) * 20;
  const yTicks = Array.from({ length: yMax / 20 + 1 }, (_, i) => i * 20);

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
        <div className="h-[340px] lg:h-[420px] min-w-[720px] relative">
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
            <ComposedChart data={isLoading ? [] : rows} margin={{ top: 44, right: 10, left: -10, bottom: 0 }} barCategoryGap="6%">
              <defs>
                {/* Bars: solid blue at the top fading out toward the axis */}
                <linearGradient id="cpShootsBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barTop} stopOpacity={0.80} />
                  <stop offset="55%" stopColor={"#7DB3F380"} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={"#FFFFFF00"} stopOpacity={0.02} />
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
                activeDot={(props: any) => <ActiveDotWithBubble {...props} isDark={isDark} />}
                isAnimationActive
              />
              <Bar
                dataKey="shoots"
                fill="url(#cpShootsBarGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
