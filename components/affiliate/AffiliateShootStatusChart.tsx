"use client";

import React from "react";
import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import { affiliateApi } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ShootStatusBreakdown {
    label: string;
    count: number;
    color: string;
}

export const AffiliateShootStatusChart = ({ externalSelectedDate }: { externalSelectedDate?: Date | null }) => {
    const [range, setRange] = React.useState<'all' | 'monthly'>('all');
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [totalShoots, setTotalShoots] = React.useState<string>("0");
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const token = Cookies.get("revure_token");
            if (!token) return;

            try {
                const params: any = { range };
                if (externalSelectedDate) {
                    params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
                }

                const response = await affiliateApi.getMyShoots(token, params);
                if (response && !response.error && response.data) {
                    const { stats } = response.data;

                    // Map the stats object to chart data format
                    const mappedData = [
                        { name: "Active", value: stats.total_active || 0, fill: "#3B82F6" },
                        { name: "Completed", value: stats.total_completed || 0, fill: "#22C55E" },
                        { name: "Cancelled", value: stats.total_cancelled || 0, fill: "#EF4444" },
                        { name: "Upcoming", value: stats.total_upcoming || 0, fill: "#8B5CF6" },
                        { name: "Draft", value: stats.total_draft || 0, fill: "#F59E0B" }
                    ];

                    const total = Object.values(stats).reduce((acc: number, val: any) => acc + (val || 0), 0);
                    setTotalShoots(total.toString());
                    setChartData(mappedData.filter(item => item.value > 0));
                }
            } catch (error) {
                console.error("Failed to fetch shoot status:", error);
            }
        };
        fetchData();
    }, [externalSelectedDate, range]);

    // Sync external selected date with range
    React.useEffect(() => {
        if (externalSelectedDate) {
            setRange('monthly'); // Or 'custom' if supported, but here it's all/monthly
        }
    }, [externalSelectedDate]);

    const toggleRange = () => {
        setRange(prev => prev === 'all' ? 'monthly' : 'all');
        setIsOpen(false);
    };

    return (
        <div className="w-full bg-[#171717] rounded-2xl text-white border border-[#3D3D3D] md:h-[392px]">
            {/* Header */}
            <div className="bg-[#101010] rounded-2xl flex justify-between items-center mb-4 border-b border-b-[#3D3D3D] p-5 ">
                <div className="flex items-center gap-2">
                    <div className="w-[3px] h-6 bg-[#E5D5B8]" />
                    <h3 className="">Shoot Status</h3>
                </div>

                <Select value={range} onValueChange={(val: any) => setRange(val)}>
                    <SelectTrigger className="w-[110px] bg-[#1A1A1A] border-white/10 rounded-full h-8 text-[10px] text-white/70 focus:ring-0 px-3 border-none ring-0">
                        <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-white/10">
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="p-10 flex flex-col lg:flex-row items-center justify-between gap-2">
                {/* Radial Chart Container */}
                <div className="relative w-full h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="80%"
                            innerRadius="60%"
                            outerRadius="130%"
                            barSize={40}
                            data={chartData}
                            startAngle={0}
                            endAngle={180}
                        >
                            <RadialBar
                                cornerRadius={0}
                                background={{ fill: "#141414" }}
                                dataKey="value"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[#E8D1AB] text-[26px] font-bold tracking-tight translate-y-[130%]">
                            {totalShoots}
                        </span>
                    </div>
                    <div
                        className="absolute left-1/2 -translate-x-1/2 h-[1px] bg-white/20 flex items-center justify-center pointer-events-none"
                        style={{
                            top: '80%',
                            width: '67%'
                        }}
                    >
                        <div className="w-3 h-3 bg-[#E8D1AB] rounded-full border-2 border-[#101010] shadow-[0_0_8px_rgba(232,209,171,0.6)]" />
                    </div>
                </div>

                {/* Legend Panel */}
                <div className="flex flex-col gap-4 min-w-[240px]">
                    {chartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-start gap-6 group">
                            <div
                                className="w-16 py-1.5 rounded-full border text-white text-xs font-bold text-center transition-all"
                                style={{
                                    borderColor: item.fill,
                                    backgroundColor: 'transparent'
                                }}
                            >
                                {item.value.toLocaleString()}
                            </div>
                            <span className="text-white/40 text-sm font-medium whitespace-nowrap group-hover:text-white/70 transition-colors">
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
