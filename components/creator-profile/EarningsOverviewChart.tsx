"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomClockIcon = ({ size = 16 }) => (
  <img src="/images/misc/overviewicons/Clock.svg" width={size} height={size} alt="clock" />
);
const CustomDollarIcon = ({ size = 16 }) => (
  <img src="/images/misc/overviewicons/DollarMinimalistic.svg" width={size} height={size} alt="dollar" />
);
const CustomGraphIcon = ({ size = 16 }) => (
  <img src="/images/misc/overviewicons/GraphUp.svg" width={size} height={size} alt="graph" />
);
const CustomWalletIcon = ({ size = 16 }) => (
  <img src="/images/misc/overviewicons/WalletMoney.svg" width={size} height={size} alt="wallet" />
);

const initialMetrics = [
  { id: 'upcoming', label: 'Upcoming Earnings', value: 0, subtext: "Future expected payouts", icon: CustomDollarIcon },
  { id: 'pending', label: 'Pending Payments', value: 0, subtext: "Awaiting finance", icon: CustomClockIcon },
  { id: 'paid', label: 'Paid Earnings', value: 0, subtext: "Total paid earnings", icon: CustomWalletIcon },
  { id: 'total', label: 'Total Lifetime Earnings', value: 0, subtext: "Total received", icon: CustomGraphIcon },
];

interface EarningsOverviewChartProps {
  overviewData?: {
    upcoming_earnings: number;
    pending_payments: number;
    paid_earnings: number;
    total_lifetime_earnings: number;
    total_received: number;
  };
  chartData?: Array<{
    month: string;
    month_number: number;
    upcoming: number;
    pending: number;
    paid: number;
    total: number;
  }>;
  selectedDate?: Date | null;
}

export default function EarningsOverviewChart({ overviewData, chartData }: EarningsOverviewChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState('upcoming');
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [range, setRange] = useState('all');

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    if (overviewData) {
      setMetrics([
        { id: 'upcoming', label: 'Upcoming Earnings', value: overviewData.upcoming_earnings, subtext: "Future expected payouts", icon: CustomDollarIcon },
        { id: 'pending', label: 'Pending Payments', value: overviewData.pending_payments, subtext: "Awaiting finance", icon: CustomClockIcon },
        { id: 'paid', label: 'Paid Earnings', value: overviewData.paid_earnings, subtext: "Total paid earnings", icon: CustomWalletIcon },
        { id: 'total', label: 'Total Lifetime Earnings', value: overviewData.total_lifetime_earnings, subtext: `Total received: $${overviewData.total_received}`, icon: CustomGraphIcon },
      ]);
      setIsLoading(false);
    }
  }, [overviewData]);

  const fixedLastSixMonthsChartData = useMemo(() => {
    const sourceData = chartData ?? [];
    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthNumber = date.getMonth() + 1;
      const existingMonth = sourceData.find(item => item.month_number === monthNumber);

      return existingMonth ?? {
        month: monthFormatter.format(date),
        month_number: monthNumber,
        upcoming: 0,
        pending: 0,
        paid: 0,
        total: 0,
      };
    });
  }, [chartData]);

  useEffect(() => {
    if (fixedLastSixMonthsChartData.length > 0) {
      setIsChartLoading(false);
    }
  }, [fixedLastSixMonthsChartData]);

  const stopColor = isDark ? "#E5D5B8" : "#000000";
  const stopOpacityStart = isDark ? 0.3 : 0.4;

  return (
    <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 lg:mb-8">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8] rounded-full" />
          <p className="font-medium text-sm lg:text-base">Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(val) => setRange(val)}>
            <SelectTrigger className={`w-[130px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
              }`}>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              {overviewData && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
        }`}>
        {metrics.map((m) => {
          const isActive = activeMetric === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`relative group cursor-pointer rounded-lg p-4 border transition-all duration-200 ${isActive
                ? 'bg-[#ECD7B4] text-[#171717] border-transparent'
                : (isDark ? 'bg-[#101010] text-white border-transparent hover:border-white/30' : 'bg-[#F4F5F7] text-[#323232] border-transparent hover:border-[#ECD7B4]')
                }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`text-sm font-medium ${isActive ? 'text-black/70' : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>
                  {m.label}
                </span>
                <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : (isDark ? 'bg-[#2C2C2C] text-white/60' : 'bg-[#fff] text-[#E8D1AB]')}`}>
                  <m.icon size={20} />
                </div>
              </div>

              <div className="text-[26px] font-bold mb-2">
                {isLoading ? <div className={`h-8 w-12 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} /> : "$" + m.value}
              </div>

              <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#171717]' : (isDark ? 'text-white/70' : 'text-zinc-500')}`}>
                {m.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="h-[310px] lg:h-[350px] w-full relative">
        {isChartLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
            <div className="h-8 w-8 border-2 border-[#E5D5B8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fixedLastSixMonthsChartData}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stopColor} stopOpacity={stopOpacityStart} />
                <stop offset="95%" stopColor={stopColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={isDark ? "#27272a" : "#E3E3E3"} strokeDasharray="3 3" />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#ffffff66' : '#32323266', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1A1A1A' : '#E5D5B8',
                borderRadius: '8px',
                border: isDark ? '1px solid #3D3D3D' : '1px solid #E3E3E3',
                color: isDark ? '#fff' : '#323232'
              }}
              itemStyle={{ color: '#BFA780' }}
              cursor={{ stroke: '#E5D5B8', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={isDark ? '#E5D5B8' : '#00000066'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#chartGradient)"
              activeDot={{ r: 6, fill: isDark ? '#121212' : '#FFFFFF', stroke: '#E5D5B8', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
