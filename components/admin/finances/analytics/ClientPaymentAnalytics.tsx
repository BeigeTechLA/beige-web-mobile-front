"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = { isDark: boolean; selectedDate?: Date | null };

const paymentStatuses = [
  { label: "Fully Paid", percent: 52, color: "#29C56A" },
  { label: "Partially Paid", percent: 18, color: "#AB82F0" },
  { label: "Pending", percent: 30, color: "#FFB81F" },
];

const recoveryTrend = [30, 35, 33, 36, 25, 13, 35, 32, 53, 49].map(
  (value, index) => ({ index, value }),
);

export default function ClientPaymentAnalytics({ isDark }: Props) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const panel = isDark
    ? "border-[#303030] bg-[#101010] text-white"
    : "border-[#E5E5E5] bg-white text-[#202020]";
  const muted = isDark ? "text-white/60" : "text-black/55";
  const heading = `flex min-h-[54px] items-center gap-2 border-b px-5 py-4 text-sm font-medium lg:text-base ${isDark ? "border-[#242424] bg-[#080808]" : "border-[#EAEAEA] bg-[#FFFCF6]"}`;
  const circumference = 2 * Math.PI * 78;
  const arcGap = 5;
  const segments = paymentStatuses.map((status, index) => ({
    ...status,
    start: paymentStatuses
      .slice(0, index)
      .reduce((sum, item) => sum + item.percent, 0),
  }));
  const activeSegment =
    hoveredSegment === null ? null : segments[hoveredSegment];
  const tooltipAngle = activeSegment
    ? ((activeSegment.start + activeSegment.percent / 2) / 100) * 2 * Math.PI -
      Math.PI / 2
    : 0;
  const tooltipPosition = {
    left: `${50 + ((Math.cos(tooltipAngle) * 78) / 220) * 100}%`,
    top: `${50 + ((Math.sin(tooltipAngle) * 78) / 220) * 100}%`,
  };

  return (
    <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1fr_1.85fr]">
      <div className={`min-w-0 overflow-hidden rounded-2xl border ${panel}`}>
        <div className={heading}>
          Client Payment Overview <Info size={12} className="text-[#E8D1AB]" />
        </div>
        <div className="flex h-full flex-col px-5 pb-6 pt-5">
          <div className="relative mx-auto my-2 aspect-square w-full max-w-[245px]">
            <svg
              viewBox="0 0 220 220"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label="Preview payment statuses: 52% fully paid, 18% partially paid, 30% pending"
            >
              <circle
                cx="110"
                cy="110"
                r="78"
                fill="none"
                stroke={isDark ? "#090909" : "#F3F3F3"}
                strokeWidth="49"
              />
              {segments.map((segment, index) => (
                <circle
                  key={segment.color}
                  onMouseEnter={(event) => {
                    setHoveredSegment(index);
                    setHoverPoint({ x: event.clientX, y: event.clientY });
                  }}
                  onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
                  onMouseLeave={() => { setHoveredSegment(null); setHoverPoint(null); }}
                  onFocus={(event) => {
                    setHoveredSegment(index);
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setHoverPoint({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
                  }}
                  onBlur={() => { setHoveredSegment(null); setHoverPoint(null); }}
                  tabIndex={0}
                  aria-label={`${segment.label}: ${segment.percent}%`}
                  className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150 focus:opacity-80"
                  cx="110"
                  cy="110"
                  r="78"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="43"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, ((segment.percent - arcGap) / 100) * circumference)} ${circumference}`}
                  strokeDashoffset={
                    -(((segment.start + arcGap / 2) / 100) * circumference)
                  }
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold lg:text-[26px]">Total</span>
              <span className={`text-xs lg:text-sm ${muted}`}>100 Clients</span>
            </div>
            {activeSegment && hoverPoint && typeof document !== "undefined"
              ? createPortal(
                  <div
                    className="pointer-events-none fixed whitespace-nowrap rounded-md bg-[#E8D1AB] px-3 py-2 text-xs font-semibold text-black shadow-lg after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-x-[6px] after:border-t-[7px] after:border-x-transparent after:border-t-[#E8D1AB]"
                    style={{
                      left: Math.max(45, Math.min(window.innerWidth - 45, hoverPoint.x)),
                      top: hoverPoint.y - 16,
                      transform: "translate(-50%, -100%)",
                      zIndex: 2147483647,
                    }}
                    role="status"
                  >
                    {activeSegment.percent}%
                  </div>,
                  document.body,
                )
              : null}
          </div>
          <div className="mt-4 space-y-3 pt-5">
            {paymentStatuses.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className={muted}>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`min-w-0 overflow-hidden rounded-2xl border ${isDark ? "border-[#7D4247] bg-[#251C1D] text-white" : "border-[#E7BFC0] bg-[#FFF5F5] text-[#202020]"}`}
      >
        <div
          className={`flex min-h-[54px] items-center gap-2 border-b px-5 py-4 text-sm font-medium lg:text-base ${isDark ? "border-[#793F45]" : "border-[#E7BFC0]"}`}
        >
          Outstanding Payment <Info size={12} className="text-[#E8D1AB]" />
        </div>
        <div className="p-4 lg:p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <p className="text-[30px] font-semibold leading-none text-[#E8D1AB] lg:text-4xl">
              $2.1M
            </p>
            <span className={`text-xs lg:text-sm ${muted}`}>
              Total Outstanding
            </span>
          </div>
          <div className="flex h-9 overflow-hidden rounded-full">
            <div className="h-full bg-[#55B98F]" style={{ width: "38%" }} />
            <div className="h-full bg-[#FF616B]" style={{ width: "62%" }} />
          </div>
          <div className="mt-5 space-y-3 text-xs lg:text-sm">
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-[#55B98F]" />
                Paid
              </span>
              <span>
                $0.8M / <span className={muted}>38%</span>
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-[#FF616B]" />
                Remaining
              </span>
              <span>
                $1.3M / <span className={muted}>62%</span>
              </span>
            </div>
          </div>
          <div className="relative mt-5 grid min-h-[160px] grid-cols-1 overflow-hidden rounded-xl bg-gradient-to-br from-[#EBD5AF] via-[#D7BF97] to-[#AB9675] px-5 py-5 text-black sm:grid-cols-[minmax(0,1fr)_1.1fr] sm:items-center">
            <div className="relative z-10">
              <p className="text-3xl font-bold tracking-tight lg:text-4xl">
                $357,495
              </p>
              <p className="mt-2 text-lg font-medium lg:text-xl">
                Payment Recovered
              </p>
            </div>
            <div className="relative z-10 h-[95px] min-w-0 sm:h-[125px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={recoveryTrend}
                  margin={{ top: 10, right: 0, bottom: 5, left: 0 }}
                >
                  <Tooltip content={() => null} cursor={false} />
                  <Area
                    dataKey="value"
                    type="monotone"
                    stroke="#111111"
                    strokeWidth={3}
                    dot={false}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
