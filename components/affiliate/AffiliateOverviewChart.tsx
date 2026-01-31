"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Video, Camera, Film, ChevronDown } from 'lucide-react';
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

const initialMetrics = [
    { id: 'total', label: 'Total Shoot', value: '0', growth: 0, icon: Video, color: 'bg-[#E5D5B8]' },
    { id: 'active', label: 'Active Shoot', value: '0', growth: 0, icon: Camera, color: 'bg-zinc-800' },
    { id: 'completed', label: 'Completed Shoot', value: '0', growth: 0, icon: Film, color: 'bg-zinc-800' },
];

import { affiliateApi } from '@/lib/api';
import Cookies from 'js-cookie';

export default function AffiliateOverviewChart({ externalSelectedDate }: { externalSelectedDate?: Date | null }) {
    const [activeMetric, setActiveMetric] = useState('total');
    const [metrics, setMetrics] = useState<any[]>(initialMetrics);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState<string>('month');

    React.useEffect(() => {
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
                            label: 'Total Shoot',
                            value: data.total_shoots?.count?.toString() || '0',
                            growth: data.total_shoots?.growth || 0,
                            icon: Video,
                            color: 'bg-[#E5D5B8]'
                        },
                        {
                            id: 'active',
                            label: 'Active Shoot',
                            value: data.active_shoots?.count?.toString() || '0',
                            growth: data.active_shoots?.growth || 0,
                            icon: Camera,
                            color: 'bg-zinc-800'
                        },
                        {
                            id: 'completed',
                            label: 'Completed Shoot',
                            value: data.completed_shoots?.count?.toString() || '0',
                            growth: data.completed_shoots?.growth || 0,
                            icon: Film,
                            color: 'bg-zinc-800'
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
    React.useEffect(() => {
        if (externalSelectedDate) {
            setRange('month'); // Or 'custom' if supported
        }
    }, [externalSelectedDate]);

    return (
        <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-5 w-full text-white mt-9">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <p className="">Overview</p>
                </div>

                <Select value={range} onValueChange={(val: any) => setRange(val)}>
                    <SelectTrigger className="w-[110px] bg-[#1A1A1A] border-white/10 rounded-full h-8 text-[10px] text-white/70 focus:ring-0 px-3 border-none ring-0">
                        <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-[#101010] rounded-2xl p-4">
                {metrics.map((m: any) => {
                    const isActive = activeMetric === m.id;
                    return (
                        <div
                            key={m.id}
                            onClick={() => setActiveMetric(m.id)}
                            className={`cursor-pointer rounded-lg p-4 border border-transparent ${isActive ? 'bg-[#ECD7B4] text-[#171717]' : 'bg-[#101010] text-white hover:border-white/30'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-sm font-medium ${isActive ? 'text-black/70' : 'text-zinc-400'}`}>
                                    {m.label}
                                </span>
                                <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : 'bg-[#2C2C2C] text-white/60'}`}>
                                    <m.icon size={20} />
                                </div>
                            </div>
                            <div className="text-[26px] font-bold mb-3">
                                {isLoading ? (
                                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
                                ) : (
                                    m.value
                                )}
                            </div>
                            <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#171717]' : 'text-white/70'}`}>
                                <span className={`font-bold text-sm ${isActive ? 'text-[#047726]' : 'text-[#0DAE3D]'}`}>
                                    {m.growth > 0 ? `+${m.growth}%` : `${m.growth}%`}
                                </span> from last month
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Section */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E5D5B8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#E5D5B8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#ffffff66', fontSize: 14 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#ffffff66', fontSize: 14 }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000' }}
                            labelStyle={{ color: '#666', marginBottom: '4px' }}
                            cursor={{ stroke: '#E5D5B8', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey={activeMetric}
                            stroke="#E5D5B8"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                            activeDot={{ r: 6, fill: '#121212', stroke: '#E5D5B8', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
