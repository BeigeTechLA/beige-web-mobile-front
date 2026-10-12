"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface CPPayout {
  id: string;
  name: string;
  payout: number;  // raw USD
  margin: number;  // %
}

const DUMMY_CPS: CPPayout[] = [
  { id: 'cp_1', name: 'Marcus Reid', payout: 143_000_000, margin: 34.2 },
  { id: 'cp_2', name: 'Priya Nair', payout: 128_000_000, margin: 31.8 },
  { id: 'cp_3', name: 'Leon Vo', payout: 114_000_000, margin: 29.4 },
  { id: 'cp_4', name: 'Cleo Dasha', payout: 99_000_000, margin: 32.1 },
  { id: 'cp_5', name: 'Amara Sow', payout: 87_000_000, margin: 28.9 },
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
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface TopCPsByPayoutProps {
  data?: CPPayout[];
  limit?: number; /** How many CPs to show */
  title?: string;
  infoText?: string;
}

export default function TopCPsByPayout({
  data,
  limit = 5,
  title = 'Top CPs By Payout',
  infoText = 'Top 5 CPs based on total payout',
}: TopCPsByPayoutProps) {
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

  // Sort by payout (desc), keep top N, and size bars relative to the #1 CP
  const rows = useMemo(() => {
    const sorted = [...(data ?? DUMMY_CPS)].sort((a, b) => b.payout - a.payout).slice(0, limit);
    const max = sorted[0]?.payout || 1;
    return sorted.map((cp, i) => ({
      ...cp,
      rank: String(i + 1).padStart(2, '0'),
      pct: Math.max(2, (cp.payout / max) * 100),
    }));
  }, [data, limit]);

  // Colours
  const amountColor = isDark ? 'text-[#70BB8C]' : 'text-[#047726]';
  const barFill = isDark ? 'bg-[#70BB8C]' : 'bg-[#0DAE3D]';
  const barTrack = isDark ? 'bg-[#2C2C2B]' : 'bg-[#E8E8E8]';
  const mutedText = isDark ? 'text-[#999999]' : 'text-zinc-500';

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
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

      {/* List: fills the remaining height. gap-* is the minimum spacing; any extra
          height in the parent is shared out evenly between the rows (justify-between). */}
      <ul className="flex-1 flex flex-col justify-between gap-4 lg:gap-5 p-4 lg:p-5 lg:pb-6">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
            <li key={i} className="flex items-center gap-4">
              <div className={`h-3 w-5 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className={`h-4 w-28 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
                  <div className={`h-4 w-14 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
                </div>
                <div className={`h-1 w-full rounded-full ${barTrack}`} />
              </div>
              <div className={`h-3 w-14 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
            </li>
          ))
          : rows.map((cp) => (
            <li key={cp.id} className="flex items-center gap-3 sm:gap-4">
              {/* Rank */}
              <span className={`w-6 shrink-0 text-xs  ${mutedText}`}>{cp.rank}</span>

              {/* Name, amount and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-end justify-between gap-3 mb-1.5">
                  <span className="text-sm lg:text-base font-medium truncate">{cp.name}</span>
                  <span className={`text-sm lg:text-base font-semibold shrink-0 ${amountColor}`}>
                    {formatCompactUSD(cp.payout)}
                  </span>
                </div>
                <div
                  className={`h-1 w-full rounded-full overflow-hidden ${barTrack}`}
                  role="progressbar"
                  aria-label={`${cp.name} payout relative to top CP`}
                  aria-valuenow={Math.round(cp.pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${barFill}`}
                    style={{ width: `${cp.pct}%` }}
                  />
                </div>
              </div>

              {/* Margin */}
              <span
                className={`w-[68px] shrink-0 text-right text-xs ${isDark ? 'text-[#7C7777]' : 'text-zinc-500'}`}
                title="Margin"
              >
                {cp.margin.toFixed(1)}% mg
              </span>
            </li>
          ))}

        {!isLoading && rows.length === 0 && (
          <li className={`my-auto text-sm text-center py-6 ${mutedText}`}>No payouts yet.</li>
        )}
      </ul>
    </div>
  );
}
