"use client";

import React, { useState, useEffect, useMemo, useId } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

// Design icons (20×20, gold gradient). Written as JSX components rather than SVG
// strings: a string can't be rendered as <m.icon />, and SVG markup needs camelCased
// attributes in JSX. Each gradient gets a per-instance id via useId(), so the three
// cards (or several charts on one page) never point at another icon's <linearGradient>.

type IconProps = { size?: number };

const useGradientId = (name: string) => `${name}-${useId().replace(/:/g, '')}`;

const GoldGradient = ({ id, y }: { id: string; y: number }) => (
  <defs>
    <linearGradient id={id} x1="2.11" y1={y} x2="18.11" y2={y} gradientUnits="userSpaceOnUse">
      <stop stopColor="#E8D1AB" />
      <stop offset="1" stopColor="#FBD596" />
    </linearGradient>
  </defs>
);

// Gross Revenue: wallet/bag with a $
const GrossIcon = ({ size = 20 }: IconProps) => {
  const gid = useGradientId('gross');
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" className="block shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={`url(#${gid})`}
        d="M10.0407 1.04688H9.95406C9.20534 1.04685 8.58098 1.04683 8.08533 1.11347C7.56217 1.18381 7.08984 1.33853 6.71028 1.71809C6.33072 2.09765 6.17599 2.56998 6.10566 3.09315C6.05789 3.44845 6.04437 4.2981 6.04056 5.02659C4.35535 5.08163 3.34353 5.27836 2.64037 5.98152C1.66406 6.95783 1.66406 8.52918 1.66406 11.6719C1.66406 14.8146 1.66406 16.3859 2.64037 17.3622C3.61668 18.3385 5.18803 18.3385 8.33071 18.3385H11.6641C14.8067 18.3385 16.3781 18.3385 17.3544 17.3622C18.3307 16.3859 18.3307 14.8146 18.3307 11.6719C18.3307 8.52918 18.3307 6.95783 17.3544 5.98152C16.6513 5.27836 15.6394 5.08163 13.9542 5.02659C13.9504 4.2981 13.9369 3.44845 13.8891 3.09315C13.8188 2.56998 13.6641 2.09765 13.2845 1.71809C12.905 1.33853 12.4326 1.18381 11.9095 1.11347C11.4138 1.04683 10.7895 1.04685 10.0407 1.04688ZM12.704 5.00677C12.7002 4.30124 12.6882 3.54194 12.6503 3.2597C12.5986 2.87515 12.5092 2.71057 12.4006 2.60197C12.292 2.49338 12.1275 2.40403 11.7429 2.35232C11.3404 2.29821 10.8007 2.29688 9.9974 2.29688C9.19405 2.29688 8.65442 2.29821 8.25189 2.35232C7.86734 2.40403 7.70276 2.49338 7.59416 2.60197C7.48556 2.71057 7.39621 2.87515 7.34451 3.2597C7.30657 3.54194 7.29457 4.30124 7.29079 5.00677C7.61698 5.00521 7.9631 5.00521 8.33073 5.00521H11.6641C12.0317 5.00521 12.3778 5.00521 12.704 5.00677ZM9.9974 7.71354C10.3426 7.71354 10.6224 7.99336 10.6224 8.33854V8.34707C11.5297 8.57566 12.2891 9.29104 12.2891 10.283C12.2891 10.6282 12.0092 10.908 11.6641 10.908C11.3189 10.908 11.0391 10.6282 11.0391 10.283C11.0391 9.96296 10.6842 9.5191 9.9974 9.5191C9.31056 9.5191 8.95573 9.96296 8.95573 10.283C8.95573 10.603 9.31056 11.0469 9.9974 11.0469C11.1515 11.0469 12.2891 11.8467 12.2891 13.0608C12.2891 14.0527 11.5297 14.7681 10.6224 14.9967V15.0052C10.6224 15.3504 10.3426 15.6302 9.9974 15.6302C9.65222 15.6302 9.3724 15.3504 9.3724 15.0052V14.9967C8.46507 14.7681 7.70573 14.0527 7.70573 13.0608C7.70573 12.7156 7.98555 12.4358 8.33073 12.4358C8.67591 12.4358 8.95573 12.7156 8.95573 13.0608C8.95573 13.3808 9.31056 13.8247 9.9974 13.8247C10.6842 13.8247 11.0391 13.3808 11.0391 13.0608C11.0391 12.7407 10.6842 12.2969 9.9974 12.2969C8.84328 12.2969 7.70573 11.4971 7.70573 10.283C7.70573 9.29104 8.46507 8.57566 9.3724 8.34707V8.33854C9.3724 7.99336 9.65222 7.71354 9.9974 7.71354Z"
      />
      <GoldGradient id={gid} y={9.69} />
  </svg>
);
};

// Pending Revenue: gold circle with a minus
const PendingIcon = ({ size = 20 }: IconProps) => {
  const gid = useGradientId('pending');
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" className="block shrink-0">
      <circle cx="9.9974" cy="10.0052" r="8.33333" fill={`url(#${gid})`} />
      <path d="M12.5 10H7.5" stroke="#5E5E5E" strokeWidth={1.5} strokeLinecap="round" />
      <GoldGradient id={gid} y={10} />
    </svg>
  );
};

// CP Payout: gold circle with a $
const PayoutIcon = ({ size = 20 }: IconProps) => {
  const gid = useGradientId('payout');
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" className="block shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={`url(#${gid})`}
        d="M18.3346 9.9974C18.3346 14.5998 14.6037 18.3307 10.0013 18.3307C5.39893 18.3307 1.66797 14.5998 1.66797 9.9974C1.66797 5.39502 5.39893 1.66406 10.0013 1.66406C14.6037 1.66406 18.3346 5.39502 18.3346 9.9974Z"
      />
      <path
        fill="#5E5E5E"
        d="M10.625 5C10.625 4.65482 10.3452 4.375 10 4.375C9.65482 4.375 9.375 4.65482 9.375 5V5.26395C8.01631 5.50722 6.875 6.52801 6.875 7.91667C6.875 9.5143 8.38565 10.625 10 10.625C11.1471 10.625 11.875 11.3798 11.875 12.0833C11.875 12.7869 11.1471 13.5417 10 13.5417C8.85293 13.5417 8.125 12.7869 8.125 12.0833C8.125 11.7382 7.84518 11.4583 7.5 11.4583C7.15482 11.4583 6.875 11.7382 6.875 12.0833C6.875 13.472 8.01631 14.4928 9.375 14.7361V15C9.375 15.3452 9.65482 15.625 10 15.625C10.3452 15.625 10.625 15.3452 10.625 15V14.7361C11.9837 14.4928 13.125 13.472 13.125 12.0833C13.125 10.4857 11.6144 9.375 10 9.375C8.85293 9.375 8.125 8.62022 8.125 7.91667C8.125 7.21311 8.85293 6.45833 10 6.45833C11.1471 6.45833 11.875 7.21311 11.875 7.91667C11.875 8.26184 12.1548 8.54167 12.5 8.54167C12.8452 8.54167 13.125 8.26184 13.125 7.91667C13.125 6.52801 11.9837 5.50722 10.625 5.26395V5Z"
      />
      <GoldGradient id={gid} y={10} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type MetricId = 'gross' | 'pending' | 'payout';
type Range = 'week' | 'month' | 'year' | 'all';

interface Metric {
  id: MetricId;
  label: string;
  info: string;
  value: number;   // raw USD
  growth: number;  // %
  icon: React.ComponentType<IconProps>;
}

const METRIC_META: Record<MetricId, Omit<Metric, 'value' | 'growth'>> = {
  gross: {
    id: 'gross',
    label: 'Gross Revenue',
    info: 'Gross revenue generated from shoots',
    icon: GrossIcon,
  },
  pending: {
    id: 'pending',
    label: 'Pending Revenue',
    info: 'Revenue from shoots that is yet to be paid',
    icon: PendingIcon,
  },
  payout: {
    id: 'payout',
    label: 'CP Payout',
    info: 'Total amount paid/payable to Creative Partners',
    icon: PayoutIcon,
  },
};

// Summary values per range (USD) + growth vs previous period
const SUMMARY: Record<Range, Record<MetricId, { value: number; growth: number }>> = {
  week: {
    gross: { value: 480_000, growth: 2 },
    pending: { value: 61_000_000, growth: -1 },
    payout: { value: 142_000_000, growth: 4 },
  },
  month: {
    gross: { value: 1_900_000, growth: 3 },
    pending: { value: 237_000_000, growth: 3 },
    payout: { value: 571_000_000, growth: 3 },
  },
  year: {
    gross: { value: 21_400_000, growth: 12 },
    pending: { value: 1_820_000_000, growth: 8 },
    payout: { value: 6_350_000_000, growth: 10 },
  },
  all: {
    gross: { value: 58_700_000, growth: 0 },
    pending: { value: 4_960_000_000, growth: 0 },
    payout: { value: 17_200_000_000, growth: 0 },
  },
};

// Chart series per range. Values are in the unit shown on the Y axis (e.g. $K).
const CHART: Record<Range, { name: string; gross: number; pending: number; payout: number }[]> = {
  week: [
    { name: 'Mon', gross: 42, pending: 18, payout: 30 },
    { name: 'Tue', gross: 55, pending: 22, payout: 34 },
    { name: 'Wed', gross: 38, pending: 27, payout: 29 },
    { name: 'Thu', gross: 61, pending: 20, payout: 41 },
    { name: 'Fri', gross: 72, pending: 31, payout: 48 },
    { name: 'Sat', gross: 49, pending: 25, payout: 36 },
    { name: 'Sun', gross: 58, pending: 19, payout: 39 },
  ],
  // Two points per month (1st + 15th); only the 1st is labelled on the X axis
  month: [
    { name: 'Jan', gross: 35, pending: 22, payout: 28 },
    { name: 'Jan 15', gross: 41, pending: 26, payout: 31 },
    { name: 'Feb', gross: 21, pending: 30, payout: 25 },
    { name: 'Feb 15', gross: 26, pending: 34, payout: 33 },
    { name: 'Mar', gross: 28, pending: 29, payout: 37 },
    { name: 'Mar 15', gross: 42, pending: 38, payout: 44 },
    { name: 'Apr', gross: 40, pending: 41, payout: 40 },
    { name: 'Apr 15', gross: 66, pending: 45, payout: 52 },
    { name: 'May', gross: 64, pending: 43, payout: 57 },
    { name: 'May 15', gross: 77, pending: 50, payout: 61 },
    { name: 'Jun', gross: 56, pending: 47, payout: 55 },
    { name: 'Jun 15', gross: 62, pending: 52, payout: 63 },
    { name: 'Jul', gross: 48, pending: 49, payout: 58 },
    { name: 'Jul 15', gross: 62, pending: 55, payout: 64 },
  ],
  year: [
    { name: '2020', gross: 18, pending: 12, payout: 15 },
    { name: '2021', gross: 29, pending: 21, payout: 24 },
    { name: '2022', gross: 44, pending: 30, payout: 37 },
    { name: '2023', gross: 52, pending: 41, payout: 46 },
    { name: '2024', gross: 63, pending: 48, payout: 58 },
    { name: '2025', gross: 74, pending: 55, payout: 66 },
  ],
  all: [
    { name: 'Q1', gross: 30, pending: 20, payout: 24 },
    { name: 'Q2', gross: 46, pending: 33, payout: 39 },
    { name: 'Q3', gross: 58, pending: 41, payout: 50 },
    { name: 'Q4', gross: 71, pending: 52, payout: 62 },
  ],
};

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

const growthLabel = (range: Range) => {
  switch (range) {
    case 'week': return 'from last week';
    case 'month': return 'from last month';
    case 'year': return 'from last year';
    case 'all': return 'all time';
  }
};

// Active point: ring dot + speech-bubble label drawn right above it (as in the design).
// Drawn in SVG so it always sits on the point, unlike Recharts' floating tooltip box.
const ActiveDotWithBubble = ({ cx, cy, value, isDark }: any) => {
  if (cx == null || cy == null) return null;
  const text = String(value);
  const w = Math.max(44, text.length * 9 + 26);
  const h = 28;
  const bubbleY = cy - h - 16;
  const bubbleFill = isDark ? '#FFFFFF' : '#171717';
  const textFill = isDark ? '#171717' : '#FFFFFF';
  return (
    <g>
      <rect x={cx - w / 2} y={bubbleY} width={w} height={h} rx={5} fill={bubbleFill}
        style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }} />
      <path d={`M${cx - 6},${bubbleY + h - 0.5} L${cx},${bubbleY + h + 6} L${cx + 6},${bubbleY + h - 0.5} Z`} fill={bubbleFill} />
      <text x={cx} y={bubbleY + h / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={textFill}>
        {text}
      </text>
      <circle cx={cx} cy={cy} r={6.5} fill={isDark ? '#121212' : '#FFFFFF'} stroke="#E5D5B8" strokeWidth={2.5} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function RevenueOverviewChart() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricId>('gross');
  const [range, setRange] = useState<Range>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  // Simulated fetch so the loading states from the original template still show
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, [range]);

  const isDark = !mounted || theme === "dark";

  const metrics: Metric[] = useMemo(
    () => (Object.keys(METRIC_META) as MetricId[]).map((id) => ({
      ...METRIC_META[id],
      ...SUMMARY[range][id],
    })),
    [range]
  );

  const chartData = CHART[range];
  // Pre-select a point (Apr in the month view) so the bubble shows on load like the design
  const defaultIndex = range === 'month' ? 7 : Math.min(3, chartData.length - 1);

  const stopColor = isDark ? "#E5D5B8" : "#000000";
  const stopOpacityStart = isDark ? 0.12 : 0.15;

  return (
    <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 lg:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p className="font-medium text-sm lg:text-base">Overview</p>
        </div>
        <Select value={range} onValueChange={(val: string) => setRange(val as Range)}>
          <SelectTrigger className={`w-[90px] rounded-full h-8 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 lg:mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
        {metrics.map((m) => {
          const isActive = activeMetric === m.id;
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveMetric(m.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveMetric(m.id)}
              className={`relative cursor-pointer rounded-lg p-4 border transition-all duration-200 ${isActive
                ? 'bg-[#ECD7B4] text-[#171717] border-transparent'
                : (isDark ? 'bg-[#101010] text-white border-transparent hover:border-white/30' : 'bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]')
                }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium ${isActive ? 'text-[#171717]' : (isDark ? 'text-white' : 'text-[#323232]')}`}>
                    {m.label}
                  </span>
                  {/* Info tooltip */}
                  <span className="relative group/info inline-flex" onClick={(e) => e.stopPropagation()}>
                    <Info
                      size={14}
                      className={isActive ? 'text-[#171717] fill-[#171717] stroke-[#ECD7B4]' : 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]'}
                    />
                    <span className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 rounded-lg border px-3 py-2 text-[11px] leading-snug font-normal opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
                      {m.info}
                    </span>
                  </span>
                </div>
                <div className={`p-2 rounded-full flex items-center justify-center ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : (isDark ? 'bg-[#2C2C2C] text-[#E8D1AB]' : 'bg-[#fff] text-[#E8D1AB]')}`}>
                  <m.icon size={20} />
                </div>
              </div>

              <div className="text-base lg:text-[26px] font-semibold mb-2">
                {isLoading
                  ? <div className={`h-8 w-20 animate-pulse rounded ${isActive ? 'bg-black/10' : (isDark ? "bg-white/10" : "bg-zinc-200")}`} />
                  : formatCompactUSD(m.value)}
              </div>

              <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-black/70' : (isDark ? 'text-white/70' : 'text-zinc-500')}`}>
                <span className={`text-sm font-medium ${m.growth >= 0 ? (isActive ? 'text-[#047726]' : 'text-[#0DAE3D]') : 'text-red-500'}`}>
                  {m.growth > 0 ? `+${m.growth}%` : `${m.growth}%`}
                </span>
                {growthLabel(range)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[310px] lg:h-[350px] w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
            <div className="h-8 w-8 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 40, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stopColor} stopOpacity={stopOpacityStart} />
                <stop offset="95%" stopColor={stopColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              interval={range === 'month' ? 1 : 0}
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
            />
            {/* Tooltip only drives hover tracking; the visible label is the bubble on the active dot */}
            <Tooltip
              defaultIndex={defaultIndex}
              content={() => null}
              cursor={false}
            />
            <Area
              key={`${range}-${activeMetric}`}
              type="monotone"
              dataKey={activeMetric}
              stroke={isDark ? '#E5D5B8' : '#00000066'}
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#revenueChartGradient)"
              activeDot={(props: any) => <ActiveDotWithBubble {...props} isDark={isDark} />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
