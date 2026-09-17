"use client";

import React, { useState } from "react";
import { Info, DollarSign, Clock, BadgeCheck, CircleDollarSign, Clock4 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type MetricKey = "quoteValue" | "quotesSent" | "dealsWon" | "wonRevenue";

interface MetricCardData {
  key: MetricKey;
  label: string;
  value: string;
  growth: string;
  icon: React.ReactNode;
  data: { month: string; value: number }[];
  formattedTooltip: string;
}

const metricsData: Record<MetricKey, MetricCardData> = {
  quoteValue: {
    key: "quoteValue",
    label: "Quote Value",
    value: "$24.5M",
    growth: "+3%",
    icon: <CircleDollarSign size={14} />,
    formattedTooltip: "$24.5M",
    data: [
      { month: "Jan", value: 30 },
      { month: "Feb", value: 20 },
      { month: "Mar", value: 35 },
      { month: "Apr", value: 65 },
      { month: "May", value: 60 },
      { month: "Jun", value: 45 },
      { month: "Jul", value: 50 },
    ],
  },
  quotesSent: {
    key: "quotesSent",
    label: "Quotes Sent",
    value: "128",
    growth: "+3%",
    icon: <Clock4 size={14} />,
    formattedTooltip: "128 Quotes",
    data: [
      { month: "Jan", value: 40 },
      { month: "Feb", value: 45 },
      { month: "Mar", value: 52 },
      { month: "Apr", value: 70 },
      { month: "May", value: 68 },
      { month: "Jun", value: 75 },
      { month: "Jul", value: 80 },
    ],
  },
  dealsWon: {
    key: "dealsWon",
    label: "Deals Won",
    value: "32",
    growth: "+3%",
    icon: <BadgeCheck size={14} />,
    formattedTooltip: "32 Deals",
    data: [
      { month: "Jan", value: 15 },
      { month: "Feb", value: 18 },
      { month: "Mar", value: 24 },
      { month: "Apr", value: 40 },
      { month: "May", value: 38 },
      { month: "Jun", value: 42 },
      { month: "Jul", value: 55 },
    ],
  },
  wonRevenue: {
    key: "wonRevenue",
    label: "Won Revenue",
    value: "$8.7M",
    growth: "+3%",
    icon: <CircleDollarSign size={14} />,
    formattedTooltip: "$8.7M",
    data: [
      { month: "Jan", value: 25 },
      { month: "Feb", value: 22 },
      { month: "Mar", value: 30 },
      { month: "Apr", value: 58 },
      { month: "May", value: 52 },
      { month: "Jun", value: 48 },
      { month: "Jul", value: 62 },
    ],
  },
};

// Custom Active Tooltip Pill hovering over the Apr peak
const CustomTooltip = ({ active, payload, activeMetric }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-xl border border-white/20">
        {activeMetric.formattedTooltip}
      </div>
    );
  }
  return null;
};

export default function QuotePerformanceWidget() {
  const { isDark } = useResolvedTheme();
  const [activeMetricKey, setActiveMetricKey] =
    useState<MetricKey>("quoteValue");

  const currentMetric = metricsData[activeMetricKey];

  return (
    <div className="w-full rounded-lg lg:rounded-2xl border border-white/10 bg-[#171717] p-3 lg:p-5 text-white transition-all duration-300">
      {/* Header Title */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
        <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
          Quote Performance
        </span>
      </div>

      {/* Top 2x2 Metric Cards Grid Area */}
      <div className="grid grid-cols-2 gap-2 p-3 lg:p-5 rounded-lg lg:rounded-2xl bg-[#101010] mb-4">
        {(Object.keys(metricsData) as MetricKey[]).map((key) => {
          const item = metricsData[key];
          const isActive = activeMetricKey === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMetricKey(key)}
              className={`relative p-4 rounded-lg text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${isActive
                ? "bg-[#ECD7B4] text-black"
                : "bg-transparent text-white hover:bg-white/5"
                }`}
            >
              {/* Card Header Row */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-xs lg:text-sm font-medium">
                  <span
                    className={isActive ? "text-black" : "text-white"}
                  >
                    {item.label}
                  </span>
                  <Info
                    size={13}
                    className={`text-[#ECD7B4] ${isActive ? "fill-black " : "fill-white/40"}`}
                  />
                </div>
                <div className={`w-8 h-8 p-2 rounded-full flex items-center justify-center ${isActive ? "bg-black" : "bg-[#2C2C2C]"}`}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: "fill-[#ECD7B4] w-5 h-5 text-black",
                  })}
                </div>
              </div>

              {/* Metric Value & Growth Rate */}
              <div className="mt-2.5">
                <div className="text-lg lg:text-2xl font-semibold">
                  {item.value}
                </div>
                <div
                  className={`text-xs mt-2 text-[##101010]/70`}
                >
                  <span className="text-sm font-medium text-[#0DAE3D]">{item.growth}</span> from last month
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recharts Curved Trend Area Chart */}
      <div className="relative w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentMetric.data}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8D1AB" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#E8D1AB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <YAxis
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666666", fontSize: 12 }}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 12 }}
              dy={10}
            />

            <Tooltip
              content={<CustomTooltip activeMetric={currentMetric} />}
              cursor={false}
              defaultIndex={3} // Focuses April by default
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#E8D1AB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#chartGradient)"
              activeDot={{
                r: 6,
                fill: "#141415",
                stroke: "#E8D1AB",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}