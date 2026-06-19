"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Camera, Film, Users, UsersRound, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { adminApi } from '@/lib/api';

const DUMMY_CHART_DATA = [
  {
    "name": "Jan",
    "total": 50,
    "upcoming": 4,
    "paid": 46,
    "pending": 6,
  },
  {
    "name": "Feb",
    "total": 128,
    "upcoming": 81,
    "paid": 44,
    "pending": 26,
  },
  {
    "name": "Mar",
    "total": 87,
    "upcoming": 1,
    "paid": 86,
    "pending": 26,
  },
  {
    "name": "Apr",
    "total": 126,
    "upcoming": 11,
    "paid": 115,
    "pending": 48,
  },
  {
    "name": "May",
    "total": 190,
    "upcoming": 159,
    "paid": 27,
    "pending": 19,
  },
  {
    "name": "Jun",
    "total": 69,
    "upcoming": 69,
    "paid": 0,
    "pending": 10,
  }
]

const CustomClockIcon = ({ size = 16 }) => (
  <img
    src="/images/misc/overviewicons/Clock.svg"
    width={size}
    height={size}
    alt="video"
  />
);
const CustomDollarIcon = ({ size = 16 }) => (
  <img
    src="/images/misc/overviewicons/DollarMinimalistic.svg"
    width={size}
    height={size}
    alt="camera"
  />
);
const CustomGraphIcon = ({ size = 16 }) => (
  <img
    src="/images/misc/overviewicons/GraphUp.svg"
    width={size}
    height={size}
    alt="film reel"
  />
);
const CustomWalletIcon = ({ size = 16 }) => (
  <img
    src="/images/misc/overviewicons/WalletMoney.svg"
    width={size}
    height={size}
    alt="user"
  />
);

const initialMetrics = [
  { id: 'upcoming', label: 'Upcoming Earnings', value: '0', subtext: "Future expected payouts", icon: CustomDollarIcon },
  { id: 'pending', label: 'Pending Payments', value: '0', subtext: "Awaiting finance", icon: CustomClockIcon },
  { id: 'paid', label: 'Paid Earnings', value: '0', subtext: "This Month June 2026", icon: CustomWalletIcon },
  { id: 'total', label: 'Total Lifetime Earnings', value: '0', subtext: "Total received", icon: CustomGraphIcon },
];

interface EarningsOverviewChartProps {
  externalSelectedDate?: Date | null;
}

export default function EarningsOverviewChart({ externalSelectedDate }: EarningsOverviewChartProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState('upcoming');
  const [metrics, setMetrics] = useState<any[]>(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  // 1. Sync the Select UI when the external date changes
  useEffect(() => {
    if (externalSelectedDate) {
      setRange('custom');
    } else if (range === 'custom') {
      setRange('all');
    }
  }, [externalSelectedDate]);

  // Temp code
  useEffect(() => { 
    setIsLoading(false)
    setIsChartLoading(false)
    setChartData(DUMMY_CHART_DATA) 
  }, [DUMMY_CHART_DATA])

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
              {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
        }`}>
        {metrics.map((m: any) => {
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
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={stopColor} stopOpacity={stopOpacityStart} />
                <stop offset="95%" stopColor={stopColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={isDark ? "#27272a" : "#E3E3E3"} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
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
