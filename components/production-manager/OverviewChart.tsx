"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Video, Camera, Film, Users, ChevronDown, UsersRound, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/Datepicker";
import { format } from 'date-fns';

const initialMetrics = [
    { id: 'total', label: 'Total Shoots', value: '0', growth: 0, icon: Video, color: 'bg-[#E5D5B8]' },
    { id: 'active', label: 'Active Shoots', value: '0', growth: 0, icon: Camera, color: 'bg-zinc-800' },
    { id: 'completed', label: 'Completed Shoots', value: '0', growth: 0, icon: Film, color: 'bg-zinc-800' },
    { id: 'clients', label: 'Total Users', value: '0', growth: 0, icon: UsersRound, color: 'bg-zinc-800' },
    { id: 'cps', label: 'Total Creative Partners', value: '0', growth: 0, icon: Users, color: 'bg-zinc-800' },
];

import { adminApi } from '@/lib/api';

interface OverviewChartProps {
    externalSelectedDate?: Date | null;
}

export default function OverviewChart({ externalSelectedDate }: OverviewChartProps) {
    const router = useRouter();
    const [activeMetric, setActiveMetric] = useState('total');
    const [metrics, setMetrics] = useState<any[]>(initialMetrics);
    const [isLoading, setIsLoading] = useState(true);
    const [isChartLoading, setIsChartLoading] = useState(true);
    const [range, setRange] = useState('all');
    const [chartData, setChartData] = useState<any[]>([]);

    React.useEffect(() => {
        if (externalSelectedDate) {
            setRange('custom');
        } else if (range === 'custom') {
            // If external date cleared and we were in custom, go back to month
            setRange('all');
        }
    }, [externalSelectedDate]);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setIsChartLoading(true);
            try {
                const params: any = { range };
                if (range === 'custom' && externalSelectedDate) {
                    params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
                }

                const response = await adminApi.getDashboardChartData(params);
                if (response && !response.error && response.summary && response.charts) {
                    const { summary, charts } = response;

                    // Transform Chart Data
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
                            icon: Video,
                            color: 'bg-[#E5D5B8]'
                        },
                        {
                            id: 'active',
                            label: 'Active Shoots',
                            value: summary.active_shoots?.count?.toString() || '0',
                            growth: summary.active_shoots?.growth || 0,
                            icon: Camera,
                            color: 'bg-zinc-800'
                        },
                        {
                            id: 'completed',
                            label: 'Completed Shoots',
                            value: summary.completed_shoots?.count?.toString() || '0',
                            growth: summary.completed_shoots?.growth || 0,
                            icon: Film,
                            color: 'bg-zinc-800'
                        },
                        {
                            id: 'clients',
                            label: 'Total Users',
                            value: summary.total_clients?.count?.toString() || '0',
                            growth: summary.total_clients?.growth || 0,
                            icon: UsersRound,
                            color: 'bg-zinc-800'
                        },
                        {
                            id: 'cps',
                            label: 'Total Creative Partners',
                            value: summary.approved_CPs?.count?.toString() || '0',
                            growth: summary.approved_CPs?.growth || 0,
                            icon: Users,
                            color: 'bg-zinc-800',
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
        switch (range) {
            case 'week': return 'from last week';
            case 'month': return 'from last month';
            case 'all': return 'all time';
            case 'custom': return 'in selected range';
            default: return 'from last month';
        }
    };

    return (
        <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-5 w-full text-white mt-5 lg:mt-9">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 lg:mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <p className="">Overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={range}
                        onValueChange={(val) => {
                            setRange(val);
                            // If user manually switches range, we might want to keep the top-level date
                            // but the API will prioritize the 'range' parameter unless it's 'custom'
                        }}
                    >
                        <SelectTrigger className="w-[110px] bg-zinc-900 border-[#3D3D3D] rounded-full h-9 text-[10px] lg:text-xs text-zinc-400 focus:ring-0">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-[#3D3D3D]">
                            <SelectItem value="all">All time</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            {externalSelectedDate && <SelectItem value="custom">Selected Date</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10 bg-[#101010] rounded-2xl p-4">
                {metrics.map((m: any) => {
                    const isActive = activeMetric === m.id;
                    return (
                        <div
                            key={m.id}
                            onClick={() => setActiveMetric(m.id)}
                            className={`relative group cursor-pointer rounded-lg p-4 border border-transparent transition-all duration-200 ${isActive ? 'bg-[#ECD7B4] text-[#171717]' : 'bg-[#101010] text-white hover:border-white/30'
                                }`}
                        >
                            {/* Tooltip for CPs */}
                            {m.id === 'cps' && m.details && (
                                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-40 bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none mb-2">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                            <span>CP Breakdown</span>
                                        </div>
                                        <div className="h-[1px] bg-[#3D3D3D] w-full" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[#0DAE3D] font-medium">Approved</span>
                                            <span className="text-xs font-bold text-white">{m.details.approved}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-orange-400 font-medium">Pending</span>
                                            <span className="text-xs font-bold text-white">{m.details.pending}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-red-400 font-medium">Rejected</span>
                                            <span className="text-xs font-bold text-white">{m.details.rejected}</span>
                                        </div>
                                        <div className="h-[1px] bg-[#3D3D3D] w-full" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-zinc-400 font-medium">Total</span>
                                            <span className="text-xs font-bold text-white">{m.details.total}</span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1A1A] border-r border-b border-[#3D3D3D] rotate-45" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${isActive ? 'text-black/70' : 'text-zinc-400'}`}>
                                        {m.label}
                                    </span>
                                </div>
                                <div className={`p-2 rounded-full ${isActive ? 'bg-[#171717] text-[#E8D1AB]' : 'bg-[#2C2C2C] text-white/60'}`}>
                                    <m.icon size={20} />
                                </div>
                            </div>
                            <div className="text-[26px] leading-normal font-bold mb-3">
                                {isLoading ? (
                                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
                                ) : (
                                    m.value
                                )}
                            </div>
                            <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#171717]' : 'text-white/70'}`}>
                                <span className={`font-bold text-sm ${isActive ? 'text-[#047726]' : 'text-[#0DAE3D]'}`}>
                                    {m.growth > 0 ? `+${m.growth}%` : `${m.growth}%`}
                                </span> {getGrowthLabel()}
                            </div>

                            {m.id === 'cps' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Update this link if production manager has a users page, 
                                        // for now removing navigation or pointing to same page if applicable.
                                        // Assuming no users management for prod manager for now based on sidebar,
                                        // or maybe it's under 'Users' which is not in the new sidebar.
                                        // If no users page, this button might do nothing or just log.
                                        console.log("Navigate to CPs");
                                    }}
                                    className={`absolute bottom-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors ${isActive ? 'text-black/70' : 'text-zinc-400 hover:bg-white/10'}`}
                                >
                                    <ArrowUpRight size={16} />
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
                            dx={-20}
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
