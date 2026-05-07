"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, DollarSign, ReceiptText } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OperationsDateFilter } from "./StudioOperationsDashboard";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNumber = (value: unknown) => {
  const numericValue = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getValue = (data: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return 0;
};

const getGrowth = (data: JsonRecord, keys: string[]) => {
  const value = toNumber(getValue(data, keys));
  if (!value) return "0%";
  return `${value > 0 ? "+" : ""}${value}%`;
};

const getChartData = (data: JsonRecord) => {
  const rawChart = data.chart || data.revenue_chart || data.monthly_revenue || data.series || [];
  if (!Array.isArray(rawChart) || rawChart.length === 0) {
    return [{ month: "No data", revenue: 0 }];
  }

  return rawChart.filter(isRecord).map((item, index) => ({
    month: String(item.month || item.label || item.date || item.period || `${index + 1}`),
    revenue: toNumber(item.revenue ?? item.total_revenue ?? item.net_earnings ?? item.amount ?? item.value),
  }));
};

const buildMetrics = (data: JsonRecord) => [
  {
    id: "total-revenue",
    label: "Total Revenue",
    value: moneyFormatter.format(toNumber(getValue(data, ["total_revenue", "revenue", "gross_revenue"]))),
    growth: getGrowth(data, ["revenue_growth", "total_revenue_growth"]),
    helper: "from last month",
    icon: DollarSign,
  },
  {
    id: "total-bookings",
    label: "Total Bookings",
    value: numberFormatter.format(toNumber(getValue(data, ["total_bookings", "bookings_count", "bookings"]))),
    growth: getGrowth(data, ["bookings_growth", "total_bookings_growth"]),
    helper: "from last month",
    icon: CalendarDays,
  },
  {
    id: "avg-booking-value",
    label: "Avg Booking Value",
    value: moneyFormatter.format(toNumber(getValue(data, ["avg_booking_value", "average_booking_value", "average_revenue"]))),
    growth: getGrowth(data, ["avg_booking_growth", "average_booking_growth"]),
    helper: "from last month",
    icon: ReceiptText,
  },
  {
    id: "overtime-revenue",
    label: "Overtime Revenue",
    value: moneyFormatter.format(toNumber(getValue(data, ["overtime_revenue", "overtime_amount", "total_overtime"]))),
    growth: getGrowth(data, ["overtime_growth", "overtime_revenue_growth"]),
    helper: "from last month",
    icon: Clock3,
  },
];

export default function StudioOperationsOverview({
  data,
  loading = false,
  dateFilter,
  onDateFilterChange,
}: {
  data?: unknown;
  loading?: boolean;
  dateFilter: OperationsDateFilter;
  onDateFilterChange: (value: OperationsDateFilter) => void;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState("total-revenue");

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const overviewData = isRecord(data) ? data : {};
  const metrics = buildMetrics(overviewData);
  const chartData = getChartData(overviewData);

  const handleMetricClick = (metricId: string) => {
    setActiveMetric(metricId);
  };

  return (
    <section className={`rounded-xl border p-4 lg:p-5 ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-[#101010]"}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2 className="text-sm font-medium lg:text-base">Overview</h2>
        </div>
        <Select value={dateFilter} onValueChange={(value) => onDateFilterChange(value as OperationsDateFilter)}>
          <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"}`}>
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={`mb-8 grid gap-3 rounded-xl p-3 sm:grid-cols-2 xl:grid-cols-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isActive = activeMetric === metric.id;
          return (
            <button
              key={metric.label}
              type="button"
              onClick={() => handleMetricClick(metric.id)}
              aria-label={`View ${metric.label}`}
              className={`min-h-[116px] cursor-pointer rounded-lg border p-4 text-left transition focus:outline-none focus:ring-1 focus:ring-[#E5D5B8] ${isActive
                ? "border-transparent bg-[#E5D5B8] text-[#171717]"
                : isDark
                  ? "border-transparent bg-[#101010] text-white hover:border-white/20 hover:bg-[#151515]"
                  : "border-transparent bg-[#F4F5F7] text-[#101010] hover:border-[#E5D5B8] hover:bg-white"
                }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className={`text-xs font-medium ${isActive ? "text-black/70" : isDark ? "text-white/55" : "text-black/55"}`}>
                  {metric.label}
                </span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isActive ? "bg-[#171717] text-[#E5D5B8]" : isDark ? "bg-[#2B2B2B] text-[#E5D5B8]" : "bg-white text-[#BFA780]"}`}>
                  <Icon size={15} />
                </span>
              </div>
              <p className="mb-2 text-2xl font-semibold tracking-normal">{metric.value}</p>
              <p className={`text-[11px] ${isActive ? "text-black/70" : isDark ? "text-white/50" : "text-black/50"}`}>
                <span className="font-semibold text-[#0DAE3D]">{metric.growth}</span> {metric.helper}
              </p>
            </button>
          );
        })}
      </div>

      <div className="h-[260px] w-full lg:h-[330px]">
        {loading ? (
          <div className={`flex h-full items-center justify-center rounded-lg text-sm ${isDark ? "bg-[#101010] text-white/40" : "bg-[#F4F5F7] text-black/40"}`}>
            Loading overview...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="studioOperationsRevenue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#E5D5B8" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#E5D5B8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={isDark ? "#27272a" : "#E8E8E8"} strokeDasharray="3 3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#ffffff55" : "#00000055", fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? "#ffffff55" : "#00000055", fontSize: 11 }} width={38} />
            <Tooltip
              cursor={{ stroke: "#E5D5B8", strokeWidth: 1 }}
              contentStyle={{
                background: isDark ? "#111111" : "#FFFFFF",
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E5E5E5",
                borderRadius: 8,
                color: isDark ? "#FFFFFF" : "#101010",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#BDA77F"
              strokeWidth={2}
              fill="url(#studioOperationsRevenue)"
              activeDot={{ r: 6, fill: isDark ? "#171717" : "#FFFFFF", stroke: "#E5D5B8", strokeWidth: 3 }}
            />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
