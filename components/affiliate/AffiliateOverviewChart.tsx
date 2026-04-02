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
import { format } from "date-fns";

// --- Dummy Data ---
const data = [
  { name: 'Jan', total: 38, active: 30, completed: 8, clients: 15, cps: 20 },
  { name: 'Feb', total: 25, active: 20, completed: 5, clients: 10, cps: 15 },
  { name: 'Mar', total: 42, active: 35, completed: 7, clients: 20, cps: 25 },
  { name: 'Apr', total: 65, active: 55, completed: 10, clients: 30, cps: 40 },
  { name: 'May', total: 45, active: 30, completed: 15, clients: 45, cps: 50 },
  { name: 'Jun', total: 50, active: 40, completed: 10, clients: 25, cps: 35 },
  { name: 'Jul', total: 35, active: 20, completed: 15, clients: 35, cps: 45 },
];

const CustomVideoIcon = ({ size = 16 }) => (
  <img
    src="/images/socmed/videocamera-record.svg"
    width={size}
    height={size}
    alt="video"
  />
);
const CustomCameraIcon = ({ size = 16 }) => (
  <img
    src="/images/socmed/camera-icon.svg"
    width={size}
    height={size}
    alt="camera"
  />
);
const CustomFilmReelIcon = ({ size = 16 }) => (
  <img
    src="/images/socmed/filmreel-icon.svg"
    width={size}
    height={size}
    alt="film reel"
  />
);

const initialMetrics = [
  { id: 'total', label: 'Total Shoots', value: '0', growth: 0, icon: Video, color: 'bg-[#E5D5B8]' },
  { id: 'active', label: 'Active Shoots', value: '0', growth: 0, icon: Camera, color: 'bg-zinc-800' },
  { id: 'completed', label: 'Completed Shoots', value: '0', growth: 0, icon: Film, color: 'bg-zinc-800' },
];

import { affiliateApi } from '@/lib/api';
import Cookies from 'js-cookie';

export default function AffiliateOverviewChart({ externalSelectedDate }: { externalSelectedDate?: Date | null }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState('total');
  const [metrics, setMetrics] = useState<any[]>(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<string>('all');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        setIsLoading(true);
        const params: any = { range };
        if (externalSelectedDate) {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }
        const response = await affiliateApi.getDashboardSummary(token, params);
        if (response && response.data) {
          const data = response.data;
          setMetrics([
            {
              id: 'total',
              label: 'Total Shoots',
              value: data.total_shoots?.count?.toString() || '0',
              growth: data.total_shoots?.growth || 0,
              icon: CustomVideoIcon,
            },
            {
              id: 'active',
              label: 'Active Shoots',
              value: data.active_shoots?.count?.toString() || '0',
              growth: data.active_shoots?.growth || 0,
              icon: CustomCameraIcon,
            },
            {
              id: 'completed',
              label: 'Completed Shoots',
              value: data.completed_shoots?.count?.toString() || '0',
              growth: data.completed_shoots?.growth || 0,
              icon: CustomFilmReelIcon,
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [externalSelectedDate, range]);

  // Sync external selected date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange('month'); // Or 'custom' if supported
    }
  }, [externalSelectedDate]);

  const isDark = !mounted || theme === "dark";
  const stopColor = isDark ? "#E5D5B8" : "#000000";
  const stopOpacityStart = isDark ? 0.3 : 0.4;

  return (
    <div className={`transition-colors duration-300 border rounded-2xl p-5 w-full mt-5 lg:mt-9 ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-[#FFFFFF] border-[#E5E5E5] text-[#202020]"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 lg:mb-8">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p className="font-medium text-sm lg:text-base">Overview</p>
        </div>

        <Select value={range} onValueChange={(val: any) => setRange(val)}>
          <SelectTrigger className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${isDark ? "bg-zinc-900 border-[#3D3D3D] text-zinc-400" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232]"
            }`}>
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className={`${isDark ? "bg-[#111111] border-[#3D3D3D] text-white" : "bg-white border-[#E3E3E3] text-[#323232]"}`}>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
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
              <div className="flex justify-between items-start mb-3 lg:mb-6">
                <span className={`text-sm font-medium ${isActive ? 'text-black/70' : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`}>
                  {m.label}
                </span>
                <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : (isDark ? 'bg-[#2C2C2C] text-white/60' : 'bg-[#fff] text-[#E8D1AB]')}`}>
                  <m.icon size={20} />
                </div>
              </div>

              <div className="text-[26px] font-bold mb-2">
                {isLoading ? <div className={`h-8 w-12 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} /> : m.value}
              </div>

              <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#171717]' : (isDark ? 'text-white/70' : 'text-zinc-500')}`}>
                <span className={`font-bold ${m.growth >= 0 ? (isActive ? 'text-[#047726]' : 'text-[#0DAE3D]') : 'text-red-500'}`}>
                  {m.growth > 0 ? `+${m.growth}%` : `${m.growth}%`}
                </span> from last month
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="h-[310px] lg:h-[350px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
