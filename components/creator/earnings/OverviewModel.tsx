// 'use client';

// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { ChevronDown, DollarSign, Clock, Wallet, TrendingUp } from 'lucide-react';
// import { useTheme } from 'next-themes';
// import { useEffect, useState } from 'react';
// import { isAction } from '@reduxjs/toolkit';

// const statsData = [
//     {
//         title: 'Upcoming Earnings',
//         amount: '$8,700.00',
//         subtitle: 'Future expected payouts',
//         icon: DollarSign,
//         highlighted: true,
//     },
//     {
//         title: 'Pending Payments',
//         amount: '$2,500.00',
//         subtitle: 'Awaiting finance',
//         icon: Clock,
//         highlighted: false,
//     },
//     {
//         title: 'Paid Earnings',
//         amount: '$3,150.00',
//         subtitle: 'This Month June 2026',
//         icon: Wallet,
//         highlighted: false,
//     },
//     {
//         title: 'Total Lifetime Earnings',
//         amount: '$5,350.00',
//         subtitle: 'Total received',
//         icon: TrendingUp,
//         highlighted: false,
//     },
// ];

// const chartData = [
//     { month: 'Jan', value: 35 },
//     { month: 'Feb', value: 22 },
//     { month: 'Mar', value: 28 },
//     { month: 'Apr', value: 42 },
//     { month: 'May', value: 39 },
//     { month: 'Jun', value: 65 },
//     { month: 'Jul', value: 78 },
//     { month: 'Aug', value: 55 },
//     { month: 'Sep', value: 62 },
//     { month: 'Oct', value: 48 },
//     { month: 'Nov', value: 60 },
//     { month: 'Dec', value: 64 },
// ];

// const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//         return (
//             <div className="bg-[#111111] border border-white/10 rounded-lg px-4 py-2 shadow-xl">
//                 <p className="text-white font-semibold text-sm">{label}</p>
//                 <p className="text-[#E5D0A6] font-bold">{payload[0].value}</p>
//             </div>
//         );
//     }
//     return null;
// };

// export default function OverviewModel() {
//     const { theme } = useTheme();
//     const [mounted, setMounted] = useState(false);

//     useEffect(() => {
//         setMounted(true);
//     }, []);

//     const isDark = !mounted || theme === "dark";


//     return (
//         <div className="bg-[#111111] border border-white/8 rounded-2xl p-6">

//             <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-3">
//                     <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
//                     <h2 className="text-lg font-semibold text-white">Overview</h2>
//                 </div>
//                 <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-lg text-[#8A8A8A] hover:text-white transition-colors text-sm">
//                     Month
//                     <ChevronDown size={14} />
//                 </button>
//             </div>


//             <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#101010]" : "bg-[#0B0B0B]"}>`}>
//                 {statsData.map((stat, index) => {
//                     const Icon = stat.icon;
//                     return (
//                         <div
//                             key={index}
//                             onClick={() => setIsActive(index)}
//                             className={`rounded-lg p-5 flex flex-col justify-between h-32 transition-all ${isActive
//                                 ? 'bg-[#E5D0A6] text-[#0B0B0B]'
//                                 :( isDark ? 'bg-[#0B0B0B] border border-white/8 text-white' : 'bg-[#F4F5F7] border border-white/8 text-black' )
//                                 }`}
//                         >
//                             <div className="flex justify-between items-start mb-6">
//                                 <span className={`text-sm font-medium ${isActive === index ? 'text-[#0B0B0B]/70' :(isDark ? 'text-[#8A8A8A]' : 'text-[#6A6A6A]')}`}>
//                                     {stat.title}
//                                 </span>
//                                 <div
//                                     className={`p-2 rounded-full ${isActive ? 'bg-[#0B0B0B]/10 text-[#0B0B0B]' :(isDark ? 'bg-white/5 text-white' : 'bg-[#F4F5F7]/5 text-black')}`}
//                                 >
//                                     <Icon size={16} />
//                                 </div>
//                             </div>
//                             <div>
//                                 <p className={`text-2xl font-bold tracking-tight ${stat.highlighted ? 'text-[#0B0B0B]' : 'text-white'}`}>
//                                     {stat.amount}
//                                 </p>
//                                 <p className={`text-xs mt-1 ${stat.highlighted ? 'text-[#0B0B0B]/60' : 'text-[#6A6A6A]'}`}>
//                                     {stat.subtitle}
//                                 </p>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>


//             <div className="h-100 w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
//                         <defs>
//                             <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
//                                 <stop offset="5%" stopColor="#E5D0A6" stopOpacity={0.15} />
//                                 <stop offset="95%" stopColor="#E5D0A6" stopOpacity={0} />
//                             </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
//                         <XAxis
//                             dataKey="month"
//                             axisLine={false}
//                             tickLine={false}
//                             tick={{ fill: '#6A6A6A', fontSize: 12 }}
//                             dy={10}
//                         />
//                         <YAxis
//                             axisLine={false}
//                             tickLine={false}
//                             tick={{ fill: '#6A6A6A', fontSize: 12 }}
//                             domain={[0, 80]}
//                         />
//                         <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5D0A6', strokeWidth: 1 }} />
//                         <Area
//                             type="monotone"
//                             dataKey="value"
//                             stroke="#E5D0A6"
//                             strokeWidth={2}
//                             fillOpacity={1}
//                             fill="url(#colorValue)"
//                             activeDot={{ r: 6, fill: '#E5D0A6', stroke: '#111111', strokeWidth: 2 }}
//                         />
//                     </AreaChart>
//                 </ResponsiveContainer>
//             </div>
//         </div>
//     );
// }

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, DollarSign, Clock, Wallet, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

const statsData = [
    {
        title: 'Upcoming Earnings',
        amount: '$8,700.00',
        subtitle: 'Future expected payouts',
        icon: DollarSign,
        highlighted: true,
    },
    {
        title: 'Pending Payments',
        amount: '$2,500.00',
        subtitle: 'Awaiting finance',
        icon: Clock,
        highlighted: false,
    },
    {
        title: 'Paid Earnings',
        amount: '$3,150.00',
        subtitle: 'This Month June 2026',
        icon: Wallet,
        highlighted: false,
    },
    {
        title: 'Total Lifetime Earnings',
        amount: '$5,350.00',
        subtitle: 'Total received',
        icon: TrendingUp,
        highlighted: false,
    },
];

const chartData = [
    { month: 'Jan', value: 35 },
    { month: 'Feb', value: 22 },
    { month: 'Mar', value: 28 },
    { month: 'Apr', value: 42 },
    { month: 'May', value: 39 },
    { month: 'Jun', value: 65 },
    { month: 'Jul', value: 78 },
    { month: 'Aug', value: 55 },
    { month: 'Sep', value: 62 },
    { month: 'Oct', value: 48 },
    { month: 'Nov', value: 60 },
    { month: 'Dec', value: 64 },
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
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isActive, setIsActive] = useState<number | null>(0);
    const [selectedPeriod, setSelectedPeriod] = useState<'Week' | 'Month' | 'Year'>('Month');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isDark = !mounted || theme === "dark";

    const getFilteredData = () => {
        if (selectedPeriod === 'Week') return chartData.slice(-4); // Last 4 weeks
        if (selectedPeriod === 'Month') return chartData; // All 12 months
        if (selectedPeriod === 'Year') return [
            { month: '2025', value: chartData.reduce((sum, d) => sum + d.value, 0) }
        ];
        return chartData;
    };

    return (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#E5D0A6] rounded-full" />
                    <h2 className="text-lg font-semibold text-white">Overview</h2>
                </div>

                {/* ✅ Period Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0B0B] border border-white/10 rounded-lg text-[#8A8A8A] hover:text-white transition-colors text-sm"
                    >
                        {selectedPeriod}
                        <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-[#0B0B0B] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
                            {(['Week', 'Month', 'Year'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => {
                                        setSelectedPeriod(period);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedPeriod === period
                                        ? 'bg-[#E5D0A6]/10 text-[#E5D0A6] font-medium'
                                        : 'text-[#8A8A8A] hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 rounded-2xl p-4 ${isDark ? "bg-[#0B0B0B]" : "bg-[#F4F5F7]"}`}>
                {statsData.map((stat, index) => {
                    const Icon = stat.icon;
                    const active = isActive === index;

                    return (
                        <div
                            key={index}
                            onClick={() => setIsActive(index)}
                            className={`rounded-lg p-5 flex flex-col justify-between h-32 transition-all cursor-pointer ${active
                                ? 'bg-[#E5D0A6] text-[#0B0B0B]'
                                : isDark
                                    ? 'text-white hover:border border-white/20'
                                    : 'text-black hover:border border-[#B8B8B8]'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-medium ${active ? 'text-[#0B0B0B]/70' : isDark ? 'text-[#8A8A8A]' : 'text-[#6A6A6A]'}`}>
                                    {stat.title}
                                </span>
                                <div className={`p-2 rounded-full ${active ? 'bg-[#0B0B0B] text-[#E5D0A6]' : isDark ? 'bg-[#E5D0A6] text-[#0B0B0B]' : ' text-black'}`}>
                                    <Icon size={16} />
                                </div>
                            </div>
                            <div>
                                {/* <p className={`text-2xl font-bold tracking-tight ${active ? 'text-[#0B0B0B]' : 'text-white'}`}>
                                    
                                </p> */}
                                <div className="text-[26px] font-bold mb-2">
                                    {stat.amount}
                                </div>
                                <p className={`text-xs mt-1 ${active ? 'text-[#0B0B0B]/60' : 'text-[#6A6A6A]'}`}>
                                    {stat.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Section - Fixed height */}
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
                            tick={{ fill: isDark ? '#6A6A6A' : '#999999', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#6A6A6A' : '#999999', fontSize: 12 }}
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