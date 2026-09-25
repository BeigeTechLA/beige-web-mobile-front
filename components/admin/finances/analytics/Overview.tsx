"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CircleDollarSign, Info, LockKeyhole, Minus } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OverviewProps = {
  isDark: boolean;
  selectedDate?: Date | null;
};

type MetricKey = "gross" | "pending" | "payout";

type Metric = {
  key: MetricKey;
  label: string;
  value: string;
  growth: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type ChartPoint = {
  x: number;
  gross: number;
  pending: number;
  payout: number;
  hoverLabel?: number;
};

const chartData: ChartPoint[] = [
  { x: 0, gross: 35, pending: 30, payout: 32 },
  { x: 1, gross: 41, pending: 34, payout: 36 },
  { x: 2, gross: 20, pending: 28, payout: 27 },
  { x: 3, gross: 25, pending: 31, payout: 30 },
  { x: 4, gross: 28, pending: 35, payout: 34 },
  { x: 5, gross: 41, pending: 40, payout: 41 },
  { x: 6, gross: 39, pending: 39, payout: 40 },
  { x: 7, gross: 65, pending: 51, payout: 57, hoverLabel: 24 },
  { x: 8, gross: 63, pending: 54, payout: 58 },
  { x: 9, gross: 77, pending: 61, payout: 68 },
  { x: 10, gross: 56, pending: 49, payout: 54 },
  { x: 11, gross: 62, pending: 53, payout: 59 },
  { x: 12, gross: 48, pending: 45, payout: 50 },
  { x: 13, gross: 61, pending: 55, payout: 60 },
  { x: 14, gross: 63, pending: 57, payout: 62 },
];

const monthTicks: Record<number, string> = {
  1: "Jan",
  3: "Feb",
  5: "Mar",
  7: "Apr",
  9: "May",
  11: "Jun",
  13: "Jul",
};

const metrics: Metric[] = [
  {
    key: "gross",
    label: "Gross Revenue",
    value: "$1.9M",
    growth: "+3%",
    icon: LockKeyhole,
  },
  {
    key: "pending",
    label: "Pending Revenue",
    value: "$237M",
    growth: "+3%",
    icon: Minus,
  },
  {
    key: "payout",
    label: "CP Payout",
    value: "$571M",
    growth: "+3%",
    icon: CircleDollarSign,
  },
];

type OverviewActiveDotProps = {
  cx?: number;
  cy?: number;
  value?: number;
  payload?: ChartPoint;
  isDark: boolean;
};

function OverviewActiveDot({
  cx,
  cy,
  value,
  payload,
  isDark,
}: OverviewActiveDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  const label = payload?.hoverLabel ?? Number(value || 0);
  const boxWidth = 60;
  const boxHeight = 30;
  const boxX = cx - boxWidth / 2;
  const boxY = cy - 52;

  return (
    <g pointerEvents="none">
      <line
        x1={cx}
        x2={cx}
        y1={boxY + boxHeight}
        y2={cy - 9}
        stroke="#E8D1AB"
        strokeWidth={2}
        strokeLinecap="round"
      />

      <rect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        rx={6}
        fill="#FFFFFF"
      />

      <text
        x={cx}
        y={boxY + 20}
        textAnchor="middle"
        fill="#202020"
        fontSize="14"
        fontWeight="700"
      >
        {label}
      </text>

      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={isDark ? "#171717" : "#FFFFFF"}
        stroke="#E8D1AB"
        strokeWidth={3}
      />
    </g>
  );
}

export default function Overview({ isDark }: OverviewProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("gross");
  const [range, setRange] = useState("month");

  const active = useMemo(
    () => metrics.find((metric) => metric.key === activeMetric) || metrics[0],
    [activeMetric],
  );

  return (
    <section
      className={`w-full rounded-2xl border p-5 transition-colors duration-300 lg:p-6 ${
        isDark
          ? "border-[#3D3D3D] bg-[#171717] text-white"
          : "border-[#E5E5E5] bg-white text-[#202020]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-[3px] rounded-full bg-[#E8D1AB]" />
          <h2 className="text-sm font-medium lg:text-base">Overview</h2>
        </div>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger
            className={`h-9 w-[110px] rounded-full text-[10px] shadow-none focus:ring-0 lg:text-xs ${
              isDark
                ? "border-[#3D3D3D] bg-zinc-900 text-white/70"
                : "border-[#E3E3E3] bg-white text-[#323232]"
            }`}
          >
            <SelectValue placeholder="Month" />
          </SelectTrigger>

          <SelectContent
            className={
              isDark
                ? "border-[#3D3D3D] bg-[#111111] text-white"
                : "border-[#E3E3E3] bg-white text-black"
            }
          >
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-3 ${
          isDark ? "bg-[#101010]" : "border border-[#F0F0F0] bg-white"
        }`}
      >
        {metrics.map((metric) => {
          const selected = metric.key === activeMetric;
          const Icon = metric.icon;

          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => setActiveMetric(metric.key)}
              className={`relative rounded-lg border p-4 text-left transition-all duration-200 ${
                selected
                  ? "border-transparent bg-[#ECD7B4] text-[#171717]"
                  : isDark
                    ? "border-transparent bg-[#101010] text-white hover:border-white/20"
                    : "border-[#F0F0F0] bg-white text-[#171717] hover:border-[#E5D5B8]"
              }`}
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span>{metric.label}</span>
                  <Info size={12} className="opacity-80" />
                </div>

                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    selected
                      ? "bg-[#171717] text-[#E8D1AB]"
                      : isDark
                        ? "bg-[#2C2C2C] text-[#E8D1AB]"
                        : "bg-[#F2F2F2] text-[#171717]/60"
                  }`}
                >
                  <Icon size={18} />
                </span>
              </div>

              <div className="mb-2 text-xl font-semibold leading-normal lg:text-[26px]">
                {metric.value}
              </div>

              <div
                className={`text-xs ${
                  selected
                    ? "text-[#101010]/70"
                    : isDark
                      ? "text-white/70"
                      : "text-[#676767]"
                }`}
              >
                <span className="font-semibold text-[#0DAE3D]">
                  {metric.growth}
                </span>{" "}
                from last month
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 h-[260px] w-full lg:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 24, right: 8, left: -8, bottom: 4 }}
          >
            <defs>
              <linearGradient
                id="financeOverviewArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#E8D1AB" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#E8D1AB" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 14]}
              ticks={[1, 3, 5, 7, 9, 11, 13]}
              tickFormatter={(value) => monthTicks[value] || ""}
              axisLine={false}
              tickLine={false}
              dy={10}
              tick={{
                fill: isDark ? "#FFFFFF66" : "#17171766",
                fontSize: 11,
              }}
            />

            <YAxis
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{
                fill: isDark ? "#FFFFFF55" : "#17171755",
                fontSize: 10,
              }}
            />

            {/* Tooltip is invisible; it only activates the custom hover marker. */}
            <Tooltip content={() => null} cursor={false} />

            <Area
              type="monotone"
              dataKey={active.key}
              stroke="#E8D1AB"
              strokeWidth={1.5}
              fill="url(#financeOverviewArea)"
              dot={false}
              activeDot={(props: any) => (
                <OverviewActiveDot
                  cx={props.cx}
                  cy={props.cy}
                  value={props.value}
                  payload={props.payload}
                  isDark={isDark}
                />
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
