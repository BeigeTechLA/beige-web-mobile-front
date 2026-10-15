"use client";

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useTheme } from "next-themes";

/* ------------------------------------------------------------------ */
/* Dummy data                                                          */
/* ------------------------------------------------------------------ */

type DisputeMetricId = 'raised' | 'resolved' | 'pending' | 'active';

export interface DisputeMetric {
  id: DisputeMetricId;
  label: string;
  info: string;
  textColor: string;
  value: number;
}

const DUMMY_METRICS: DisputeMetric[] = [
  { id: 'raised', label: 'Disputes Raised', info: 'Total new Disputes raised.', value: 76, textColor: 'text-white' },
  { id: 'resolved', label: 'Resolved Disputes', info: 'Disputes resolved successfully.', value: 47, textColor: 'text-[#70BB8C]' },
  { id: 'pending', label: 'Pending Disputes', info: 'Disputes waiting for action/resolution.', value: 60, textColor: 'text-[#C9A96E]' },
  { id: 'active', label: 'Active Disputes', info: 'Disputes currently being worked on - Active/Ongoing.', value: 88, textColor: 'text-[#90C7EA]' },
];

// Bar fades from transparent (left) into the metric colour (right); value uses the same colour
const COLORS: Record<DisputeMetricId, { dark: string; light: string }> = {
  raised: { dark: '#C7C7C7', light: '#FFFFFF00' },
  resolved: { dark: '#70BB8C', light: '#FFFFFF00' },
  pending: { dark: '#F0B851', light: '#FFFFFF00' },
  active: { dark: '#5DA7D5', light: '#FFFFFF00' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface DisputesSummaryProps {
  /** Pass real data later; falls back to dummy data */
  data?: DisputeMetric[];
}

export default function DisputesSummary({ data }: DisputesSummaryProps) {
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
  const metrics = data ?? DUMMY_METRICS;
  const max = Math.max(1, ...metrics.map((m) => m.value));

  return (
    <div className={`transition-colors duration-300 border rounded-2xl w-full p-5 ${isDark ? "bg-[#101010] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      <ul className="space-y-5 lg:space-y-6">
        {metrics.map((m) => {
          const color = isDark ? COLORS[m.id].dark : COLORS[m.id].light;
          const pct = Math.max(6, (m.value / max) * 100);
          return (
            <li key={m.id}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs lg:text-sm font-medium">{m.label}</span>
                <span className="relative group/info inline-flex">
                  <Info
                    size={13}
                    className={isDark ? 'text-[#E8D1AB] fill-[#E8D1AB] stroke-[#101010]' : 'text-[#BFA780] fill-[#BFA780] stroke-[#F4F5F7]'}
                  />
                  <span className={`absolute left-1/2 -translate-x-1/2 bottom-5 mt-2 w-56 rounded-lg border px-3 py-2 text-xs leading-snug font-normal opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none shadow-2xl ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D] text-zinc-300" : "bg-white border-[#E3E3E3] text-zinc-600"}`}>
                    {m.info}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                {/* Bar */}
                <div className="flex-1 h-9 lg:h-11">
                  {isLoading ? (
                    <div className={`h-full w-2/3 rounded-full animate-pulse ${isDark ? 'bg-white/5' : 'bg-zinc-100'}`} />
                  ) : (
                    <div
                      className="h-full rounded-r-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}00 0%, ${color}55 40%, ${color} 100%)`,
                      }}
                      role="progressbar"
                      aria-label={m.label}
                      aria-valuenow={m.value}
                      aria-valuemin={0}
                      aria-valuemax={max}
                    />
                  )}
                </div>

                {/* Value */}
                <span
                  className={`w-12 sm:w-14 shrink-0 text-right text-lg lg:text-2xl font-semibold ${m.textColor}`}
                >
                  {isLoading ? '' : m.value}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
