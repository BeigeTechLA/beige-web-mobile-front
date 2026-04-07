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
const CustomUserIcon = ({ size = 16 }) => (
  <img
    src="/images/socmed/user-icon.svg"
    width={size}
    height={size}
    alt="user"
  />
);

const initialMetrics = [
  { id: 'total', label: 'Total Shoots', value: '0', growth: 0, icon: Video },
  { id: 'active', label: 'Active Shoots', value: '0', growth: 0, icon: Camera },
  { id: 'completed', label: 'Completed Shoots', value: '0', growth: 0, icon: Film },
  { id: 'clients', label: 'Total Users', value: '0', growth: 0, icon: UsersRound },
  { id: 'cps', label: 'Total Creative Partners', value: '0', growth: 0, icon: Users },
];

interface OverviewChartProps {
  externalSelectedDate?: Date | null;
}

export default function OverviewChart({ externalSelectedDate }: OverviewChartProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState('total');
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

  // 2. Optimized Fetch Logic
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsChartLoading(true);
      try {
        const effectiveRange = externalSelectedDate ? 'custom' : range;
        const params: any = { range: effectiveRange };
        if (effectiveRange === 'custom' && externalSelectedDate) {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }
        const response = await adminApi.getDashboardChartData(params);
        if (response && !response.error && response.summary && response.charts) {
          const { summary, charts } = response;
          const labels = charts.total_shoots?.map((item: any) => item.label) || [];
          const consolidatedChartData = labels.map((label: string, index: number) => ({
            name: label,
            total: charts.total_shoots?.[index]?.value || 0,
            active: charts.active_shoots?.[index]?.value || 0,
            completed: charts.completed_shoots?.[index]?.value || 0,
            clients: charts.total_clients?.[index]?.value || 0,
            cps: charts.total_CPs?.[index]?.value || 0,
          }));

          setChartData(consolidatedChartData);

          // Update Metrics
          setMetrics([
            {
              id: 'total',
              label: 'Total Shoots',
              value: summary.total_shoots?.count?.toString() || '0',
              growth: summary.total_shoots?.growth || 0,
              icon: CustomVideoIcon,
            },
            {
              id: 'active',
              label: 'Active Shoots',
              value: summary.active_shoots?.count?.toString() || '0',
              growth: summary.active_shoots?.growth || 0,
              icon: CustomCameraIcon,
            },
            {
              id: 'completed',
              label: 'Completed Shoots',
              value: summary.completed_shoots?.count?.toString() || '0',
              growth: summary.completed_shoots?.growth || 0,
              icon: CustomFilmReelIcon,
            },
            {
              id: 'clients',
              label: 'Total Users',
              value: summary.total_clients?.count?.toString() || '0',
              growth: summary.total_clients?.growth || 0,
              icon: CustomUserIcon,
            },
            {
              id: 'cps',
              label: 'Total Creative Partners',
              value: summary.approved_CPs?.count?.toString() || '0',
              growth: summary.approved_CPs?.growth || 0,
              icon: CustomUserIcon,
              details: {
                approved: summary.approved_CPs?.count || 0,
                pending: summary.pending_CPs?.count || 0,
                rejected: summary.rejected_CPs?.count || 0,
                total: summary.total_CPs?.count || 0,
              }
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
        setIsChartLoading(false);
      }
    };
    fetchData();
  }, [range, externalSelectedDate]);

  const getGrowthLabel = () => {
    const activeRange = externalSelectedDate ? 'custom' : range;
    switch (activeRange) {
      case 'week': return 'from last week';
      case 'month': return 'from last month';
      case 'all': return 'all time';
      case 'custom': return 'on selected date';
      default: return 'from last month';
    }
  };

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
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
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
              {/* Tooltip for CPs */}
              {m.id === 'cps' && m.details && (
                <div className={`absolute -top-36 left-1/2 -translate-x-1/2 w-40 border rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none mb-2 ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D]" : "bg-white border-[#E3E3E3]"
                  }`}>
                  <div className="space-y-2">
                    <p className={`text-[10px] uppercase tracking-wider font-bold border-b pb-1 ${isDark ? "text-zinc-500 border-[#3D3D3D]" : "text-zinc-400 border-[#E3E3E3]"}`}>CP Breakdown</p>
                    <div className="flex justify-between items-center"><span className="text-xs text-[#0DAE3D]">Approved</span><span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{m.details.approved}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-orange-400">Pending</span><span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{m.details.pending}</span></div>
                    <div className="flex justify-between items-center"><span className="text-xs text-red-400">Rejected</span><span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{m.details.rejected}</span></div>
                    <div className={`pt-1 border-t flex justify-between items-center ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}><span className="text-xs text-zinc-400">Total</span><span className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{m.details.total}</span></div>
                  </div>
                  <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-r border-b rotate-45 ${isDark ? "bg-[#1A1A1A] border-[#3D3D3D]" : "bg-white border-[#E3E3E3]"}`} />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
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
                </span>
                {getGrowthLabel()}
              </div>

              {m.id === 'cps' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin/users/creative-partners');
                  }}
                  className={`absolute bottom-3 right-3 p-1 rounded-full transition-colors ${isActive ? 'text-black/70 hover:bg-black/10' : (isDark ? 'text-zinc-400 hover:bg-white/10' : 'text-zinc-400 hover:bg-zinc-100')}`}
                >
                  <ArrowUpRight size={14} />
                </button>
              )}
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
