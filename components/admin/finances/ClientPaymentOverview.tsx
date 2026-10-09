"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type PaymentStatusId = 'fully_paid' | 'pending' | 'partially_paid';

export interface PaymentStatusSlice {
  id: PaymentStatusId;
  label: string;
  clients: number;
}

// Order = clockwise order around the donut (green → yellow → purple, like the design)
const DUMMY_SLICES: PaymentStatusSlice[] = [
  { id: 'fully_paid', label: 'Fully Paid', clients: 52 },
  { id: 'pending', label: 'Pending', clients: 30 },
  { id: 'partially_paid', label: 'Partially Paid', clients: 18 },
];

// Legend order from the design
const LEGEND_ORDER: PaymentStatusId[] = ['fully_paid', 'partially_paid', 'pending'];

const COLORS: Record<PaymentStatusId, { from: string; to: string; swatch: string }> = {
  fully_paid: { from: '#16A34A', to: '#65EA96', swatch: '#16A34A' },
  pending: { from: '#D97706', to: '#FBBF24', swatch: '#FBBF24' },
  partially_paid: { from: '#7C3AED', to: '#C4B5FD', swatch: '#7C3AED' },
};

// Donut geometry (degrees; Recharts measures counter-clockwise from 3 o'clock)
const START_ANGLE = 148;              // first slice starts upper-left
const END_ANGLE = START_ANGLE - 360;  // negative sweep = clockwise
const PADDING_ANGLE = 3;
const INNER = 56;                     // % of radius
const OUTER = 92;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface ClientPaymentOverviewProps {
  /** Pass real data later; falls back to dummy data */
  data?: PaymentStatusSlice[];
  title?: string;
  infoText?: string;
}

export default function ClientPaymentOverview({
  data,
  title = 'Client Payment Overview',
  infoText = 'Breakdown of client payments by status: paid, partially paid, and pending.',
}: ClientPaymentOverviewProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Hovered slice (or legend row); null = nothing hovered, so no bubble
  const [activeId, setActiveId] = useState<PaymentStatusId | null>(null);

  useEffect(() => setMounted(true), []);

  // Simulated fetch so the loading state matches the other dashboard components
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const isDark = !mounted || theme === "dark";
  const slices = data ?? DUMMY_SLICES;
  const total = slices.reduce((s, x) => s + x.clients, 0) || 1;

  const withPct = useMemo(
    () => slices.map((s) => ({ ...s, pct: Math.round((s.clients / total) * 100) })),
    [slices, total]
  ) as (PaymentStatusSlice & { pct: number })[];

  // Bubble position: middle angle of the active slice, just outside the ring
  const bubble = useMemo(() => {
    if (!activeId) return null;
    const sweep = 360 - PADDING_ANGLE * slices.length;
    let angle = START_ANGLE;
    for (const s of withPct) {
      const span = (s.clients / total) * sweep;
      if (s.id === activeId) {
        const mid = angle - span / 2;
        const rad = (mid * Math.PI) / 180;
        const r = (OUTER / 100) * 50 * 0.98; // % of box (box radius = 50%)
        return { x: 50 + r * Math.cos(rad), y: 50 - r * Math.sin(rad), pct: s.pct };
      }
      angle -= span + PADDING_ANGLE;
    }
    return null;
  }, [withPct, activeId, total, slices.length]);

  const mutedText = isDark ? 'text-white/80' : 'text-zinc-500';

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center gap-1.5 px-5 py-5 lg:py-6 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
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

      <div className="px-5 pt-8 pb-6">
        {/* Donut */}
        <div className="relative w-full max-w-[230px] aspect-square mx-auto">
          {/* Soft dark disc behind the ring */}
          <div className={`absolute inset-[2%] rounded-full ${isDark ? 'bg-[#101010]' : 'bg-[#F4F5F7]'}`} />

          {isLoading ? (
            <div className={`absolute inset-[6%] rounded-full border-[28px] animate-pulse ${isDark ? 'border-white/5' : 'border-zinc-200'}`} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {withPct.map((s) => (
                    <linearGradient key={s.id} id={`cpo-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={COLORS[s.id].from} />
                      <stop offset="100%" stopColor={COLORS[s.id].to} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={withPct}
                  dataKey="clients"
                  nameKey="label"
                  startAngle={START_ANGLE}
                  endAngle={END_ANGLE}
                  innerRadius={`${INNER}%`}
                  outerRadius={`${OUTER}%`}
                  paddingAngle={PADDING_ANGLE}
                  cornerRadius={8}
                  stroke="none"
                  isAnimationActive
                  onMouseEnter={(_: any, i: number) => setActiveId(withPct[i].id)}
                  onMouseLeave={() => setActiveId(null)}
                  // Touch screens have no hover: tap a slice to toggle its bubble
                  onClick={(_: any, i: number) =>
                    setActiveId((cur: PaymentStatusId | null) => (cur === withPct[i].id ? null : withPct[i].id))}
                >
                  {withPct.map((s) => (
                    <Cell
                      key={s.id}
                      fill={`url(#cpo-${s.id})`}
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        opacity: !activeId || s.id === activeId ? 1 : 0.85,
                        transition: 'opacity 150ms',
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg lg:text-2xl font-bold leading-tight">Total</span>
            <span className={`text-xs lg:text-sm ${mutedText}`}>{isLoading ? '…' : `${total} Clients`}</span>
          </div>

          {/* % bubble on the active slice */}
          {!isLoading && bubble && (
            <div
              className="absolute z-10 pointer-events-none transition-all duration-300 ease-out"
              style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, transform: 'translate(-50%, calc(-100% - 4px))' }}
            >
              <div className={`relative rounded-md px-4 py-2.5 text-sm sm:text-base font-bold shadow-xl ${isDark ? 'bg-[#F3E7D0] text-[#171717]' : 'bg-[#171717] text-white'}`}>
                {bubble.pct}%
                <span className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? 'bg-[#F3E7D0]' : 'bg-[#171717]'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <ul className="mt-8 space-y-4 lg:space-y-6">
          {LEGEND_ORDER.map((id) => {
            const s = withPct.find((x) => x.id === id);
            if (!s) return null;
            const isActive = id === activeId;
            return (
              <li
                key={id}
                onMouseEnter={() => setActiveId(id)}
                onMouseLeave={() => setActiveId(null)}
                className={`flex items-center justify-between cursor-default transition-opacity duration-150 ${isActive || !activeId ? 'opacity-100' : 'opacity-80'}`}
              >
                <span className="flex items-center gap-3 text-sm lg:text-base font-medium">
                  <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: COLORS[id].swatch }} />
                  {s.label}
                </span>
                <span className={`text-sm lg:text-lg ${mutedText}`}>{isLoading ? '' : `${s.pct}%`}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
