"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface ClientSpendSummary {
  avgSpendPerShoot: number;   // USD
  subtitle: string;
  topClient: string;
  topSpend: number;           // USD
  /** Spend over time for the sparkline (USD) */
  series: { name: string; spend: number }[];
}

const DUMMY: ClientSpendSummary = {
  avgSpendPerShoot: 2433,
  subtitle: 'Total across all active clients',
  topClient: 'Lumino Studio',
  topSpend: 188_400_000,
  series: [
    { name: 'Jan', spend: 18_000_000 },
    { name: 'Feb', spend: 34_000_000 },
    { name: 'Mar', spend: 40_000_000 },
    { name: 'Apr', spend: 34_000_000 },
    { name: 'May', spend: 62_000_000 },
    { name: 'Jun', spend: 66_000_000 },
    { name: 'Jul', spend: 75_000_000 },
    { name: 'Aug', spend: 70_000_000 },
    { name: 'Sep', spend: 48_000_000 },
    { name: 'Oct', spend: 52_000_000 },
    { name: 'Nov', spend: 68_000_000 },
    { name: 'Dec', spend: 46_000_000 },
    { name: 'Jan ', spend: 22_000_000 },
  ],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, useGrouping: false }).format(n);

const formatCompactUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);

// Active point: filled gold dot with a dark ring, a thin stem, and a "$75M Spend" bubble on top
// Recharts passes an Area's activeDot `value` as a [base, value] pair (not a number),
// which formatted as NaN. Read the real number from the data point instead.
const pointValue = ({ payload, dataKey, value }: any): number => {
  const fromPayload = payload && dataKey != null ? payload[dataKey] : undefined;
  const raw = fromPayload ?? (Array.isArray(value) ? value[value.length - 1] : value);
  return Number(raw);
};

const ActiveDotWithBubble = (props: any) => {
  const { cx, cy, isDark } = props;
  const value = pointValue(props);
  if (cx == null || cy == null || !Number.isFinite(value)) return null;
  const text = `${formatCompactUSD(value)} Spend`;
  const w = text.length * 8 + 30;
  const h = 32;
  const stem = 34;
  const bubbleY = cy - stem - h;
  const bubbleFill = isDark ? '#FFFFFF' : '#171717';
  const textFill = isDark ? '#171717' : '#FFFFFF';
  const ring = isDark ? '#121212' : '#FFFFFF';
  return (
    <g>
      <line x1={cx} x2={cx} y1={bubbleY + h} y2={cy} stroke={isDark ? '#FFFFFF' : '#171717'} strokeWidth={1.5} />
      <circle cx={cx} cy={bubbleY + h + 2} r={2.5} fill={isDark ? '#171717' : '#FFFFFF'} />
      <rect x={cx - w / 2} y={bubbleY} width={w} height={h} rx={6} fill={bubbleFill}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }} />
      <text x={cx} y={bubbleY + h / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={textFill}>
        {text}
      </text>
      <circle cx={cx} cy={cy} r={10} fill={ring} />
      <circle cx={cx} cy={cy} r={7} fill="#E8D1AB" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface AvgClientSpendPerShootProps {
  /** Pass real data later; falls back to dummy data */
  data?: ClientSpendSummary;
  title?: string;
  infoText?: string;
}

export default function AvgClientSpendPerShoot({
  data,
  title = 'Average Client Spend Per Shoot',
  infoText = 'Average amount a client spends per shoot.',
}: AvgClientSpendPerShootProps) {
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
  const d = data ?? DUMMY;

  // Pre-select the peak so the bubble shows on load like the design
  const peakIndex = d.series.reduce((best, p, i, arr) => (p.spend > arr[best].spend ? i : best), 0);

  const mutedText = isDark ? 'text-[#9A9A9A]' : 'text-zinc-500';
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center gap-1.5 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
        {/* Info tooltip */}
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

      {/* Summary */}
      <div className="px-5 pt-5">
        {isLoading
          ? <div className={`h-10 w-32 rounded animate-pulse mb-2 ${skeleton}`} />
          : <p className="text-xl lg:text-[28px] font-semibold">{formatUSD(d.avgSpendPerShoot)}</p>}
        <p className={`text-xs lg:text-sm mt-1 ${mutedText}`}>{d.subtitle}</p>

        <div className={`border-t my-4 ${isDark ? 'border-[#4E4E4E]' : 'border-[#E5E5E5]'}`} />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className={`text-xs lg:text-sm ${mutedText}`}>Top client</span>
            {isLoading
              ? <div className={`h-4 w-28 rounded animate-pulse ${skeleton}`} />
              : <span className={`text-xs lg:text-sm font-medium truncate ${isDark ? 'text-[#E8E8E7]' : 'text-zinc-500'}`}>{d.topClient}</span>}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={`text-xs lg:text-sm ${mutedText}`}>Top spend</span>
            {isLoading
              ? <div className={`h-4 w-20 rounded animate-pulse ${skeleton}`} />
              : <span className={`text-xs lg:text-sm font-semibold ${isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]'}`}>{formatCompactUSD(d.topSpend)}</span>}
          </div>
        </div>
      </div>

      {/* Edge-to-edge sparkline (no axes, like the design) */}
      <div className="h-[230px] lg:h-[190px] w-full relative -mt-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-8 w-8 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={isLoading ? [] : d.series} margin={{ top: 70, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="clientSpendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8D1AB" stopOpacity={isDark ? 0.28 : 0.35} />
                <stop offset="100%" stopColor="#E8D1AB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" hide padding={{ left: 0, right: 0 }} />
            <YAxis hide domain={[0, 'dataMax']} />
            {/* Tooltip only drives hover; the visible label is the bubble on the dot */}
            <Tooltip defaultIndex={peakIndex} content={() => null} cursor={false} />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#E8D1AB"
              strokeWidth={2.5}
              fill="url(#clientSpendGradient)"
              fillOpacity={1}
              activeDot={(props: any) => <ActiveDotWithBubble {...props} isDark={isDark} />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
