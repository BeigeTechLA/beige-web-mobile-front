"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface OutstandingPaymentData {
  paid: number;        // USD
  remaining: number;   // USD
  recovered: number;   // USD recovered in the period
  /** Recovery trend for the sparkline */
  recoveredSeries: { name: string; value: number }[];
}

const DUMMY: OutstandingPaymentData = {
  paid: 800_000,
  remaining: 1_300_000,
  recovered: 357_495,
  recoveredSeries: [
    { name: 'W1', value: 32 }, { name: 'W2', value: 38 }, { name: 'W3', value: 35 },
    { name: 'W4', value: 31 }, { name: 'W5', value: 36 }, { name: 'W6', value: 33 },
    { name: 'W7', value: 18 }, { name: 'W8', value: 20 }, { name: 'W9', value: 6 },
    { name: 'W10', value: 36 }, { name: 'W11', value: 40 }, { name: 'W12', value: 58 },
    { name: 'W13', value: 66 }, { name: 'W14', value: 60 }, { name: 'W15', value: 62 },
  ],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatCompactUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface OutstandingPaymentProps {
  /** Pass real data later; falls back to dummy data */
  data?: OutstandingPaymentData;
  title?: string;
  infoText?: string;
}

export default function OutstandingPayment({
  data,
  title = 'Outstanding Payment',
  infoText = 'Total payment pending from clients against gross revenue.',
}: OutstandingPaymentProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hovered, setHovered] = useState<'paid' | 'remaining' | null>(null);

  useEffect(() => setMounted(true), []);

  // Simulated fetch so the loading state matches the other dashboard components
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const isDark = !mounted || theme === "dark";
  const d = data ?? DUMMY;

  const total = d.paid + d.remaining;
  const paidPct = total ? Math.round((d.paid / total) * 100) : 0;
  const remainingPct = total ? 100 - paidPct : 0;

  // Colours (warm red-tinted card, like TopOverdueCPs)
  const cardCls = isDark ? 'bg-[#231B1B] border-[#FF6467] text-white' : 'bg-[#FFF8F7] border-[#E7A3A6] text-[#202020]';
  const divider = isDark ? 'border-[#FF6467]/60' : 'border-[#E7A3A6]';
  const mutedText = isDark ? 'text-white/70' : 'text-zinc-500';
  const PAID = '#54B98B';
  const REMAINING = '#FF6467';

  const legend = [
    { id: 'paid' as const, label: 'Paid', color: PAID, value: d.paid, pct: paidPct },
    { id: 'remaining' as const, label: 'Remaining', color: REMAINING, value: d.remaining, pct: remainingPct },
  ];

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${cardCls}`}>
      {/* Header */}
      <div className={`flex items-center gap-1.5 p-5 pt-6 border-b ${divider}`}>
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

      <div className="p-5 space-y-5">
        {/* Total */}
        <div className="flex items-end justify-between gap-4">
          {isLoading
            ? <div className={`h-12 w-36 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
            : <p className={`text-xl lg:text-4xl font-semibold leading-none ${isDark ? 'text-[#EAD6B5]' : 'text-[#9C7B45]'}`}>{formatCompactUSD(total)}</p>}
          <p className={`text-sm lg:text-xl ${mutedText}`}>Total Outstanding</p>
        </div>

        {/* Paid / remaining split bar */}
        <div className={`flex h-[42px] w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`}>
          {!isLoading && legend.map((s) => (
            <div
              key={s.id}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              className="h-full transition-[width,opacity] duration-700 ease-out"
              style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: hovered && hovered !== s.id ? 0.5 : 1 }}
              aria-label={`${s.label}: ${formatCompactUSD(s.value)} (${s.pct}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <ul className="space-y-5">
          {legend.map((s) => (
            <li
              key={s.id}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-3 text-sm lg:text-base">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="text-base lg:text-lg">
                {isLoading ? '' : (
                  <>
                    {formatCompactUSD(s.value)} <span className={mutedText}>/ {s.pct}%</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Payment recovered card */}
        <div
          className="relative rounded-lg overflow-hidden text-black"
          style={{
            background:
              'radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%),' +
              'radial-gradient(90% 90% at 85% 100%, rgba(80,60,30,0.35) 0%, rgba(80,60,30,0) 70%),' +
              'linear-gradient(160deg, #E9D9B9 0%, #CDB792 55%, #9E8A68 100%)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 p-6">
            <div>
              {isLoading
                ? <div className="h-10 w-40 rounded bg-black/10 animate-pulse mb-3" />
                : <p className="text-xl lg:text-[42px] font-bold leading-none">$ {formatUSD(d.recovered)}</p>}
              <p className="mt-1.5 text-lg lg:text-3xl font-medium leading-tight">Payment Recovered</p>
            </div>
            <div className="h-[120px]">
              {!isLoading && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.recoveredSeries} margin={{ top: 8, right: 6, left: 6, bottom: 8 }}>
                    <YAxis hide domain={['dataMin - 4', 'dataMax + 4']} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0B0B0B"
                      strokeWidth={4}
                      strokeLinecap="round"
                      dot={false}
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
