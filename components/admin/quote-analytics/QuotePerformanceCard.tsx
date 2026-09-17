"use client";

import { CircleDollarSign, Clock3, Medal } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "Jan", value: 34 }, { month: "Feb", value: 38 },
  { month: "Mar", value: 40 }, { month: "Apr", value: 57 },
  { month: "May", value: 66 }, { month: "Jun", value: 49 },
  { month: "Jul", value: 56 },
];

const metrics = [
  { key: "value", label: "Quote Value", value: "$24.5M", icon: CircleDollarSign },
  { key: "sent", label: "Quotes Sent", value: "128", icon: Clock3 },
  { key: "won", label: "Deals Won", value: "32", icon: Medal },
  { key: "revenue", label: "Won Revenue", value: "$8.7M", icon: CircleDollarSign },
];

type QuotePerformanceCardProps = {
  selectedMetric?: string;
  onMetricClick?: (metric: string) => void;
};

export function QuotePerformanceCard({ selectedMetric, onMetricClick }: QuotePerformanceCardProps) {
  return (
    <section className="rounded-xl border border-[#2c2c2c] bg-[#171717] p-4 xl:h-[520px]">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-white/80">
      <span className="h-4 w-px bg-[#ead7b0]" />
      Quote Performance
      </div>
      <div className="min-h-[220px] rounded-xl bg-[#101010] p-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map(({ key, label, value, icon: Icon }) => (
            <button key={key} onClick={() => onMetricClick?.(key)} className={`rounded-md p-3 text-left ${selectedMetric === key ? "bg-[#ead7b0] text-black" : "hover:bg-white/5"}`}>
              <div className="flex justify-between text-[13px] font-medium opacity-80">
                {label}<span className="grid h-5 w-5 place-items-center rounded-full bg-[#2e2d2b] text-[#e8d1ab]"><Icon size={12} /></span>
              </div>
              <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
              <p className="mt-1 text-[12px] font-medium">
              <span className="text-green-500">+3%</span>{" "}
              <span className={selectedMetric === key ? "text-black" : "text-white/60"}>
                from last month
              </span>
              </p>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 12, bottom: 4 }}>
            <defs><linearGradient id="quoteAnalyticsGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E8D1AB" stopOpacity={0.2} /><stop offset="1" stopColor="#E8D1AB" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#999", fontSize: 11 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#999", fontSize: 11 }}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
              width={36}
            />
            <Tooltip contentStyle={{ background: "#151515", border: "1px solid #3d3d3d", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#E8D1AB" strokeWidth={1.2} fill="url(#quoteAnalyticsGradient)" activeDot={{ r: 4, fill: "#151515", stroke: "#E8D1AB" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
