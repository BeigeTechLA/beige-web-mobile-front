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

interface QuotePerformanceData {
  date: string;
  quote_value: number;
  quotes_sent: number;
  deals_won: number;
  won_revenue: number;
}

interface QuotePerformanceOverview {
  quote_value: number;
  quotes_sent: number;
  deals_won: number;
  won_revenue: number;
}

interface MetricCardData {
  key: MetricKey;
  label: string;
  value: string;
  growth: string;
  icon: React.ComponentType<{ className?: string }>;
  data: { month: string; value: number }[];
  formattedTooltip: string;
  infoTooltip: string;
}

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

interface QuotePerformanceWidgetProps {
  data?: QuotePerformanceData[];
  overview?: QuotePerformanceOverview;
}

export default function QuotePerformanceWidget({
  data = [],
  overview,
}: QuotePerformanceWidgetProps) {
  const { isDark } = useResolvedTheme();
  const [activeMetricKey, setActiveMetricKey] =
    useState<MetricKey>("quoteValue");
  const chartTotals = {
    quote_value: data.reduce((sum, item) => sum + item.quote_value, 0),
    quotes_sent: data.reduce((sum, item) => sum + item.quotes_sent, 0),
    deals_won: data.reduce((sum, item) => sum + item.deals_won, 0),
    won_revenue: data.reduce((sum, item) => sum + item.won_revenue, 0),
  };
  const totals = overview ?? chartTotals;
  const monthLabel = (date: string) => new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(`${date}T00:00:00`));

  const metricsData: Record<MetricKey, MetricCardData> = {
  quoteValue: {
    key: "quoteValue",
    label: "Quote Value",
    value: `$${(totals.quote_value / 1000000).toFixed(1)}M`,
    growth: "0%",
    icon: CircleDollarSign,
    formattedTooltip: `$${totals.quote_value.toLocaleString()}`,
    infoTooltip: "Total value of proposals sent during the selected period ",
    data: data.map((item) => ({
      month: monthLabel(item.date),
      value: item.quote_value,
    })),
  },

  quotesSent: {
    key: "quotesSent",
    label: "Quotes Sent",
    value: String(totals.quotes_sent),
    growth: "0%",
    icon: Clock4,
    formattedTooltip: `${totals.quotes_sent} Quotes`,
    infoTooltip: "Number of proposals sent during the selected period",
    data: data.map((item) => ({
      month: monthLabel(item.date),
      value: item.quotes_sent,
    })),
  },

  dealsWon: {
    key: "dealsWon",
    label: "Deals Won",
    value: String(totals.deals_won),
    growth: "0%",
    icon: BadgeCheck,
    formattedTooltip: `${totals.deals_won} Deals`,
    infoTooltip: "Number of proposals that converted into paid bookings",
    data: data.map((item) => ({
      month: monthLabel(item.date),
      value: item.deals_won,
    })),
  },

  wonRevenue: {
    key: "wonRevenue",
    label: "Won Revenue",
    value: `$${(totals.won_revenue / 1000000).toFixed(1)}M`,
    growth: "0%",
    icon: CircleDollarSign,
    formattedTooltip: `$${totals.won_revenue.toLocaleString()}`,
    infoTooltip: "Total revenue from proposals that converted into paid bookings",
    data: data.map((item) => ({
      month: monthLabel(item.date),
      value: item.won_revenue,
    })),
  },
};

const currentMetric = metricsData[activeMetricKey];

  return (
    <div className={`w-full rounded-2xl border p-5 transition-all duration-300 ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-black/10 bg-white text-black"}`}>
      {/* Header Title */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
        <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
          Quote Performance
        </span>
      </div>

      {/* Top 2x2 Metric Cards Grid Area */}
      <div className={`grid lg:grid-cols-2 gap-2 p-3 lg:p-5 rounded-lg lg:rounded-2xl mb-4 ${isDark ? "bg-[#101010]" : "bg-zinc-100"}`}>
        {(Object.keys(metricsData) as MetricKey[]).map((key) => {
          const item = metricsData[key];
          const isActive = activeMetricKey === key;
          const IconComponent = item.icon;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveMetricKey(key)}
              className={`relative p-4 rounded-lg text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${isActive
                ? "bg-[#ECD7B4] text-black"
                : isDark
                  ? "bg-transparent text-white hover:bg-white/5"
                  : "bg-transparent text-black hover:bg-black/5"
                }`}
            >
              {/* Card Header Row */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className={isActive ? "text-black" : isDark ? "text-white" : "text-black"}>
                    {item.label}
                  </span>

                  {/* Info Icon with Hover Tooltip */}
                  <div
                    className="relative flex items-center group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info
                      size={13}
                      className={`cursor-pointer transition-colors ${isActive
                          ? "text-[#ECD7B4] fill-black"
                          : isDark
                            ? "text-black fill-[#ECD7B4]"
                            : "text-[#ECD7B4] fill-black/40"
                        }`}
                    />

                    {/* Hover Tooltip Card */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-48">
                      <div
                        className={`px-3 py-2 text-xs rounded-lg shadow-xl border text-center transition-all ${isDark
                            ? "bg-[#252525] text-white border-white/10"
                            : "bg-white text-black border-black/10"
                          }`}
                      >
                        {item.infoTooltip}
                      </div>
                      {/* Caret Arrow */}
                      <div
                        className={`w-2 h-2 -mt-1 rotate-45 border-r border-b ${isDark
                            ? "bg-[#252525] border-white/10"
                            : "bg-white border-black/10"
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Fixed Icon Container */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-black"
                      : isDark
                        ? "bg-[#2C2C2C]"
                        : "bg-zinc-200"
                    }`}
                >
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    {/* Layer 1: Background fill shape */}
                    <IconComponent className="w-5 h-5 absolute inset-0 fill-[#E8D1AB] text-[#E8D1AB]" />
                    {/* Layer 2: Black stroke outline & detail overlay */}
                    <IconComponent className="w-5 h-5 absolute inset-0 fill-none text-black stroke-[1.75]" />
                  </div>
                </div>
              </div>

              {/* Metric Value & Growth Rate */}
              <div className="mt-2.5">
                <div className="text-2xl font-semibold">
                  {item.value}
                </div>
                <div
                  className={`text-xs mt-2 ${isActive
                      ? "text-black/70"
                      : isDark
                        ? "text-white/70"
                        : "text-black/60"
                    }`}
                >
                  <span className="text-sm font-medium text-[#0DAE3D]">
                    {item.growth}
                  </span>{" "}
                  from last month
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
              tickLine={false}
              tick={{ fill: isDark ? "#666666" : "#888888", fontSize: 12 }}
              axisLine={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? "#888888" : "#666666", fontSize: 12 }}
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
                fill: isDark ? "#141415" : "#FFFFFF",
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
