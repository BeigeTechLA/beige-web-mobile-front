// components/admin/studios/OverviewModel.tsx
// Static UI

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, DollarSign, CalendarDays, TrendingUp, Clock } from 'lucide-react';
import { useState } from 'react';

const chartData = [
    { month: 'Jan', value: 35 },
    { month: 'Feb', value: 22 },
    { month: 'Mar', value: 28 },
    { month: 'Apr', value: 65 },
    { month: 'May', value: 45 },
    { month: 'Jun', value: 55 },
    { month: 'Jul', value: 48 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111111] border border-white/10 rounded-lg px-4 py-2 shadow-xl">
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-[#E5D0A6] font-bold">{payload[0].value}</p>
            </div>
        );
    }
    return null;
};

export default function OverviewModel() {
    const [selectedPeriod, setSelectedPeriod] = useState('Month');

    return (
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
                    <h2 className="text-lg font-semibold text-white">Overview</h2>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-lg text-[#8A8A8A] hover:text-white transition-colors text-sm">
                    {selectedPeriod}
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {/* Total Revenue - Highlighted */}
                <div className="bg-[#E5D0A6]/10 border border-[#E5D0A6]/20 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-white/70 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-white">$1,325.00</p>
                        </div>
                        <div className="p-2 bg-[#E5D0A6] rounded-full">
                            <DollarSign className="w-4 h-4 text-[#111111]" />
                        </div>
                    </div>
                    <p className="text-xs text-[#00D084]">+3% from last month</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-[#0B0B0B] border border-white/8 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-white/70 mb-1">Total Bookings</p>
                            <p className="text-2xl font-bold text-white">02</p>
                        </div>
                        <div className="p-2 bg-[#E5D0A6]/20 rounded-full">
                            <CalendarDays className="w-4 h-4 text-[#E5D0A6]" />
                        </div>
                    </div>
                    <p className="text-xs text-[#00D084]">+3% from last month</p>
                </div>

                {/* Avg Booking Value */}
                <div className="bg-[#0B0B0B] border border-white/8 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-white/70 mb-1">Avg Booking Value</p>
                            <p className="text-2xl font-bold text-white">$662.50</p>
                        </div>
                        <div className="p-2 bg-[#E5D0A6]/20 rounded-full">
                            <TrendingUp className="w-4 h-4 text-[#E5D0A6]" />
                        </div>
                    </div>
                    <p className="text-xs text-[#00D084]">+3% from last month</p>
                </div>

                {/* Overtime Revenue */}
                <div className="bg-[#0B0B0B] border border-white/8 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-white/70 mb-1">Overtime Revenue</p>
                            <p className="text-2xl font-bold text-white">663</p>
                        </div>
                        <div className="p-2 bg-[#E5D0A6]/20 rounded-full">
                            <Clock className="w-4 h-4 text-[#E5D0A6]" />
                        </div>
                    </div>
                    <p className="text-xs text-[#00D084]">+3% from last month</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-100 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E5D0A6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#E5D0A6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6A6A6A', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6A6A6A', fontSize: 12 }}
                            domain={[0, 80]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5D0A6', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#E5D0A6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            activeDot={{ r: 6, fill: '#E5D0A6', stroke: '#111111', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}