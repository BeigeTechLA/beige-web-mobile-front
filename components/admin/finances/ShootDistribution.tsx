"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

export interface ClientShoots {
  id: string;
  name: string;
  shoots: number;
}

const DUMMY_CLIENTS: ClientShoots[] = [
  { id: 'c_1', name: 'Lumino Studio', shoots: 31 },
  { id: 'c_2', name: 'Velo Creative', shoots: 27 },
  { id: 'c_3', name: 'Marz Agency', shoots: 24 },
  { id: 'c_4', name: 'Orion Brands', shoots: 22 },
  { id: 'c_5', name: 'RV Music Studio', shoots: 15 },
  { id: 'c_6', name: 'Nike Campaign', shoots: 10 },
  { id: 'c_7', name: 'DP Editing Studio', shoots: 5 },
  { id: 'c_8', name: 'Joh Photography Agency', shoots: 1 },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface ShootDistributionProps {
  /** Pass real data later; falls back to dummy data */
  data?: ClientShoots[];
  /** Max rows shown */
  limit?: number;
  title?: string;
  /** Optional – shows an info icon next to the title when set */
  infoText?: string;
}

export default function ShootDistribution({
  data,
  limit = 8,
  title = 'Shoot Distribution',
  infoText,
}: ShootDistributionProps) {
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

  // Sort by shoots (desc), keep top N, size bars against the busiest client
  const rows: (ClientShoots & { pct: number })[] = useMemo(() => {
    const sorted = [...(data ?? DUMMY_CLIENTS)].sort((a, b) => b.shoots - a.shoots).slice(0, limit);
    const max = sorted[0]?.shoots || 1;
    return sorted.map((c) => ({ ...c, pct: Math.max(2, (c.shoots / max) * 100) }));
  }, [data, limit]);

  const countColor = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const barFill = isDark ? 'bg-[#E8D1AB]' : 'bg-[#CFAF78]';
  const barTrack = isDark ? 'bg-[#535353]' : 'bg-[#E8E8E8]';
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
       <div className={`shrink-0 flex items-center gap-1.5 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
        {infoText && (
          <span className="relative group/info inline-flex">
            <Info
              size={13}
            className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
            />
          <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-lg border px-3 py-2 text-xs leading-snug font-normal opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
              {infoText}
            </span>
          </span>
        )}
      </div>

      {/* List */}
      <ul className="px-5 pt-5 pb-6 space-y-5">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
            <li key={i}>
              <div className="flex justify-between mb-2">
                <div className={`h-4 w-32 rounded animate-pulse ${skeleton}`} />
                <div className={`h-4 w-16 rounded animate-pulse ${skeleton}`} />
              </div>
              <div className={`h-1 w-full rounded-full ${barTrack}`} />
            </li>
          ))
          : rows.map((c) => (
            <li key={c.id}>
              <div className="flex items-end justify-between gap-3 mb-2">
                <span className="text-xs truncate">{c.name}</span>
                <span className={`text-xs shrink-0 ${countColor}`}>
                  {c.shoots} {c.shoots === 1 ? 'shoot' : 'shoots'}
                </span>
              </div>
              <div
                className={`h-1 w-full rounded-full overflow-hidden ${barTrack}`}
                role="progressbar"
                aria-label={`${c.name} shoots relative to top client`}
                aria-valuenow={Math.round(c.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${barFill}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </li>
          ))}

        {!isLoading && rows.length === 0 && (
          <li className={`text-sm text-center py-6 ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>No shoots yet.</li>
        )}
      </ul>
    </div>
  );
}
