"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { FinanceAnalyticsData } from '@/lib/api';
import { ArrowUpRight, Info } from 'lucide-react';
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

const capitalizeFirstLetter = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface SelectedPayoutCP {
  id: string;
  name: string;
  payout: number;
}

interface TopCPsByPayoutProps {
  data?: FinanceAnalyticsData['creative_partners']['top_by_payout'] | null;
  loading?: boolean;
  limit?: number; /** How many CPs to show */
  title?: string;
  infoText?: string;
  selectedId?: string | null;
  onSelectCP?: (cp: SelectedPayoutCP | null) => void;
}

export default function TopCPsByPayout({
  data,
  loading = false,
  limit = 5,
  title = 'Top CPs By Payout',
  infoText = 'Top 5 CPs based on total payout',
  selectedId = null,
  onSelectCP,
}: TopCPsByPayoutProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isLoading = loading;

  // Info tooltip: hover on desktop, tap on touch screens; position measured so it stays inside the card
  const cardRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLSpanElement>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoPos, setInfoPos] = useState<{ left: number; width: number } | null>(null);

  const placeInfo = useCallback(() => {
    const card = cardRef.current?.getBoundingClientRect();
    const anchor = infoRef.current?.getBoundingClientRect();
    if (!card || !anchor) return;
    const gutter = 12;
    const width = Math.min(224, card.width - gutter * 2);
    // Centred on the icon, then pulled back inside the card if it would overflow
    const desired = anchor.left + anchor.width / 2 - width / 2;
    const clamped = Math.max(card.left + gutter, Math.min(desired, card.right - gutter - width));
    const left = clamped - anchor.left; // relative to the icon wrapper
    setInfoPos((prev) => (prev?.left === left && prev?.width === width ? prev : { left, width }));
  }, []);

  useEffect(() => setMounted(true), []);

  // Re-measure while open (resize / rotate) and close on a tap anywhere else
  useEffect(() => {
    if (!isInfoOpen) return;
    placeInfo();
    const onResize = () => placeInfo();
    const onPointerDown = (e: PointerEvent) => {
      if (!infoRef.current?.contains(e.target as Node)) setIsInfoOpen(false);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isInfoOpen, placeInfo]);

  const isDark = !mounted || theme === "dark";

  // Sort by payout (desc), keep top N, and size bars relative to the #1 CP
  const rows = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => b.payout - a.payout).slice(0, limit);
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
    <div ref={cardRef} className={`transition-colors duration-300 border rounded-2xl w-full h-full flex flex-col overflow-hidden ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className={`shrink-0 flex items-center gap-1.5 p-5 ${isDark ? "bg-[#090909]" : "bg-[#F4F5F7]"}`}>
        <p className="text-sm lg:text-base">{title}</p>
        {/* Info tooltip */}
        <span ref={infoRef} onMouseEnter={placeInfo} className="relative group/info inline-flex">
          <button
            type="button"
            aria-label={`About ${title}`}
            aria-expanded={isInfoOpen}
            onClick={() => setIsInfoOpen((open) => !open)}
            className="inline-flex p-1 -m-1 rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D1AB]"
          >
          <Info
            size={13}
            className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
          />
          </button>
          <span
            role="tooltip"
            style={{ left: infoPos?.left ?? -105, width: infoPos?.width ?? 224 }}
            className={`absolute top-full mt-2 rounded-lg border px-3 py-2 text-xs leading-snug font-normal transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isInfoOpen ? 'opacity-100 visible' : 'opacity-0 invisible [@media(hover:hover)]:group-hover/info:opacity-100 [@media(hover:hover)]:group-hover/info:visible'} ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
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
            <li
              key={cp.id}
              className={`flex items-center gap-3 sm:gap-4 transition-opacity duration-300 ${
                selectedId && selectedId !== cp.id ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Rank */}
              <span className={`w-6 shrink-0 text-xs  ${mutedText}`}>{cp.rank}</span>

              {/* Name, amount and bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-end justify-between gap-3 mb-1.5">
                  <span className="text-sm lg:text-base font-medium truncate">{capitalizeFirstLetter(cp.name)}</span>
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
                {cp.margin.toFixed(1)}%
              </span>

              {/* Open / close arrow: ↗ closed, ↘ open */}
              <button
                type="button"
                aria-label={selectedId === cp.id ? `Close ${capitalizeFirstLetter(cp.name)} payout history` : `Open ${capitalizeFirstLetter(cp.name)} payout history`}
                aria-expanded={selectedId === cp.id}
                onClick={() => onSelectCP?.(selectedId === cp.id ? null : { id: cp.id, name: capitalizeFirstLetter(cp.name), payout: cp.payout })}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isDark ? 'bg-[#2C2C2B] text-white hover:bg-[#3A3A39]' : 'bg-[#E8E8E8] text-[#171717] hover:bg-[#DADADA]'
                }`}
              >
                <ArrowUpRight
                  size={16}
                  className={`transition-transform duration-300 ${selectedId === cp.id ? 'rotate-90' : 'rotate-0'}`}
                />
              </button>
            </li>
          ))}

        {!isLoading && rows.length === 0 && (
          <li className={`my-auto text-sm text-center py-6 ${mutedText}`}>No payouts yet.</li>
        )}
      </ul>
    </div>
  );
}
