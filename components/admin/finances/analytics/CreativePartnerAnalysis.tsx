"use client";

import CreativePartnerExtraAnalytics from "./CreativePartnerExtraAnalytics";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FinanceHoverMarker from "./FinanceHoverMarker";
import { format } from "date-fns";

import { financeTransactionsApi, type FinanceCpAnalysis, type FinanceTopCpShoot } from "@/lib/api/financeTransactions";
import {
  Bar,
  ComposedChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";

type CreativePartnerAnalysisProps = {
  isDark: boolean;
  selectedDate?: Date | null;
};

type ShootPoint = {
  name: string;
  value: number;
  hoverValue?: number;
  trend?: number;
};

function toFiniteNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function Panel({
  title,
  isDark,
  children,
  className = "",
  showInfo = true,
}: {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  className?: string;
  showInfo?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${
        isDark ? "bg-[#101010]" : "border border-[#EEEEEE] bg-white"
      } ${className}`}
    >
      <div
        className={`flex items-center border-b px-5 py-4 ${
          isDark
            ? "border-[#222222] bg-[#0A0A0A]"
            : "border-[#EEEEEE] bg-[#FFFCF6]"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium lg:text-base">{title}</span>
          {showInfo ? <Info size={11} className="text-[#E8D1AB]" /> : null}
        </div>
      </div>

      {children}
    </div>
  );
}

function BubbleTooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className: string;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, below: false });

  useLayoutEffect(() => {
    if (!visible || !buttonRef.current) return;
    const update = () => {
      const bounds = buttonRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const labelWidth = label.length * 7 + 30;
      const below = bounds.top < 55;
      setPosition({
        left: Math.max(labelWidth / 2 + 8, Math.min(window.innerWidth - labelWidth / 2 - 8, bounds.left + bounds.width / 2)),
        top: below ? bounds.bottom + 10 : bounds.top - 10,
        below,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [visible, label]);

  return (
    <div className={`group absolute ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="block rounded-full focus:outline-none"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={label}
      >
        {children}
      </button>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-[10px] font-semibold text-[#171717] shadow-xl"
              style={{
                left: position.left,
                top: position.top,
                zIndex: 2147483647,
                transform: position.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              }}
              role="status"
            >
              {label}
              <span className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent ${position.below ? "bottom-full border-b-[7px] border-b-white" : "top-full border-t-[7px] border-t-white"}`} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function ActiveShootBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
  isDark,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ShootPoint;
  isDark: boolean;
}) {
  const centerX = x + width / 2;
  const safeBottom = y + Math.max(height - 10, 10);
  const label = payload?.hoverValue ?? payload?.value ?? 0;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill="url(#finance-shoot-bar-gradient)"
      />
      <line
        x1={centerX}
        x2={centerX}
        y1={y + 6}
        y2={safeBottom}
        stroke="#A6D4FF"
        strokeOpacity="0.6"
        strokeWidth="1"
        strokeDasharray="5 6"
        pointerEvents="none"
      />
      <FinanceHoverMarker
        cx={centerX}
        cy={y - 7}
        radius={5}
        fontSize="11px"
        label={`${label} Shoots`}
        isDark={isDark}
      />
    </g>
  );
}

export default function CreativePartnerAnalysis({
  isDark,
  selectedDate,
}: CreativePartnerAnalysisProps) {
  const [analysis, setAnalysis] = useState<FinanceCpAnalysis | null>(null);
  const [shoots, setShoots] = useState<FinanceTopCpShoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const selected = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

    setLoading(true);
    setError(null);

    void Promise.all([
      financeTransactionsApi.getFinanceCpAnalysis({
        date_from: selected,
        date_to: selected,
      }),
      financeTransactionsApi.getFinanceTopCpsShoots({
        date_from: selected,
        date_to: selected,
        limit: 10,
      }),
    ])
      .then(([analysisResponse, shootsResponse]) => {
        if (!cancelled) {
          setAnalysis(analysisResponse.data);
          setShoots(shootsResponse.data);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load creative partner analytics.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const payoutRows = (analysis?.top_cps_by_payout ?? []).map((row) => ({
    rank: String(toFiniteNumber(row.rank)).padStart(2, "0"),
    name: row.name?.trim() || "Unknown",
    amount: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(toFiniteNumber(row.total_payout)),
    stat: `${toFiniteNumber(row.margin_percent)}% mg`,
    value: Math.min(100, Math.max(0, toFiniteNumber(row.bar_percent))),
  }));
  const chartData: ShootPoint[] = (shoots ?? []).map((shoot, index, items) => {
    const value = toFiniteNumber(shoot.shoots_count);
    const previous = toFiniteNumber(items[Math.max(0, index - 1)]?.shoots_count);
    const next = toFiniteNumber(items[Math.min(items.length - 1, index + 1)]?.shoots_count);

    return {
      name: shoot.name?.trim() || "Unknown",
      value,
      trend: (previous + value * 2 + next) / 4,
    };
  });
  const averages = analysis?.averages;
  return (
    <section
      className={`w-full rounded-2xl border p-5 transition-colors duration-300 lg:p-6 ${
        isDark
          ? "border-[#3D3D3D] bg-[#171717] text-white"
          : "border-[#E5E5E5] bg-white text-[#202020]"
      }`}
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="h-6 w-[3px] rounded-full bg-[#E8D1AB]" />
        <h2 className="text-sm font-medium lg:text-base">
          Creative Partner Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Top CPs By Payout" isDark={isDark}>
          <div className="space-y-3 px-5 py-5">
            {loading ? (<p className="py-8 text-center text-sm">Loading…</p>) : error ? (<p className="py-8 text-center text-sm text-red-500">{error}</p>) : payoutRows.length === 0 ? (<p className="py-8 text-center text-sm">No data found</p>) : payoutRows.map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[24px_minmax(0,1fr)_64px] items-center gap-3"
              >
                <span
                  className={`text-[10px] ${
                    isDark ? "text-white/35" : "text-black/40"
                  }`}
                >
                  {row.rank}
                </span>

                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium lg:text-sm">
                      {row.name}
                    </span>
                    <span className="text-xs font-medium text-[#55C786] lg:text-sm">
                      {row.amount}
                    </span>
                  </div>

                  <div
                    className={`h-[2px] overflow-hidden rounded-full ${
                      isDark ? "bg-white/15" : "bg-black/10"
                    }`}
                  >
                    <div
                      className="h-full bg-[#5AC98A]"
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                </div>

                <span
                  className={`text-right text-[9px] lg:text-[10px] ${
                    isDark ? "text-white/35" : "text-black/40"
                  }`}
                >
                  {row.stat}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Avg - Payout/Margin/Count"
          isDark={isDark}
          showInfo={false}
        >
          <div className="grid min-h-[220px] grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)] items-center gap-3 px-4 py-5">
            <div className="relative mx-auto h-[165px] w-[165px]">
              <BubbleTooltip
                label="Per Shoot Payout"
                className="left-[40px] top-[10px]"
              >
                <div className="flex h-[105px] w-[105px] items-center justify-center rounded-full bg-[#6399E8] text-base font-semibold text-white">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(toFiniteNumber(averages?.avg_cp_payout))}
                </div>
              </BubbleTooltip>

              <BubbleTooltip
                label="Average CP Margin"
                className="bottom-[10px] left-[0px]"
              >
                <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-[#62C89A] text-sm font-semibold text-white">
                  {toFiniteNumber(averages?.avg_cp_margin_percent)}%
                </div>
              </BubbleTooltip>

              <BubbleTooltip
                label="Average CPs per Shoot"
                className="bottom-[2px] right-[2px]"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D953B4] text-sm font-semibold text-white">
                  {toFiniteNumber(averages?.avg_cps_per_shoot)}
                </div>
              </BubbleTooltip>
            </div>

            <div className="space-y-5">
              {[
                ["Average CP Payout", "#5B94E8", "82%"],
                ["Average CP Margin", "#58C996", "62%"],
                ["Average CPs per Shoot", "#D952B4", "23%"],
              ].map(([label, color, width]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs">
                    <span>{label}</span>
                    <Info size={9} className="text-[#E8D1AB]" />
                  </div>

                  <div
                    className={`h-px ${isDark ? "bg-white/25" : "bg-black/15"}`}
                  >
                    <div
                      className="h-px"
                      style={{ width, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Top CPs By Shoots"
          isDark={isDark}
          className="xl:col-span-2"
        >
          <div className="relative h-[430px] min-w-0 px-2 pb-3 pt-4 lg:h-[490px] lg:px-4">
            {loading ? (<p className="pt-20 text-center text-sm">Loading…</p>) : error ? (<p className="pt-20 text-center text-sm text-red-500">{error}</p>) : chartData.length === 0 ? (<p className="pt-20 text-center text-sm">No data found</p>) : <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 32, right: 12, left: -10, bottom: 8 }}
                barCategoryGap="34%"
              >
                <defs>
                  <linearGradient
                    id="finance-shoot-bar-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2F91F6" />
                    <stop offset="38%" stopColor="#4389D7" />
                    <stop offset="78%" stopColor="#45596E" stopOpacity="0.78" />
                    <stop
                      offset="100%"
                      stopColor="#101214"
                      stopOpacity="0.25"
                    />
                  </linearGradient>
                  <linearGradient id="finance-shoot-trend-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#408DE4" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#101214" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={42}
                  dy={10}
                  tick={{
                    fill: isDark ? "#FFFFFF99" : "#17171799",
                    fontSize: 9,
                  }}
                />

                <YAxis
                  domain={[0, "dataMax"]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tick={{
                    fill: isDark ? "#FFFFFF55" : "#17171755",
                    fontSize: 9,
                  }}
                />

                <Tooltip content={() => null} cursor={false} />

                <Area
                  type="linear"
                  dataKey="trend"
                  stroke={isDark ? "#C5D4E4" : "#7292AE"}
                  strokeWidth={1.5}
                  strokeDasharray="8 6"
                  fill="url(#finance-shoot-trend-gradient)"
                  dot={false}
                  activeDot={false}
                  tooltipType="none"
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="value"
                  fill="url(#finance-shoot-bar-gradient)"
                  radius={[5, 5, 0, 0]}
                  barSize={40}
                  activeBar={(props: { x?: number; y?: number; width?: number; height?: number; payload?: ShootPoint }) => (
                    <ActiveShootBar
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      payload={props.payload}
                      isDark={isDark}
                    />
                  )}
                />
              </ComposedChart>
            </ResponsiveContainer>}
          </div>
        </Panel>
      </div>
      <CreativePartnerExtraAnalytics isDark={isDark} selectedDate={selectedDate} />
    </section>
  );
}
