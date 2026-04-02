"use client";

import React, { useEffect, useState } from "react";
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
import { useTheme } from "next-themes";

interface ShootStatusBreakdown {
  label: string;
  count: number;
  color: string;
}

export const AffiliateShootStatusChart = ({ externalSelectedDate }: { externalSelectedDate?: Date | null }) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = React.useState<'all' | 'monthly'>('all');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [totalShoots, setTotalShoots] = React.useState<string>("0");
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("revure_token");
      if (!token) return;

      try {
        const params: any = { range };
        if (externalSelectedDate) {
          params.date_on = format(externalSelectedDate, 'yyyy-MM-dd');
        }

        const response = await affiliateApi.getShootStatus(token, params);
        if (response && !response.error && response.data) {
          const data = response.data;
          setTotalShoots(data.total?.toLocaleString() || "0");

          if (Array.isArray(data.breakdown)) {
            const mappedData = data.breakdown
              .filter((item: ShootStatusBreakdown) => item.count > 0)
              .map((item: ShootStatusBreakdown) => ({
                name: item.label,
                value: item.count,
                fill: item.color
              }));

            setChartData(mappedData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch shoot status:", error);
      }
    };
    fetchData();
  }, [externalSelectedDate, range]);

  // Sync external selected date with range
  useEffect(() => {
    if (externalSelectedDate) {
      setRange('monthly'); // Or 'custom' if supported, but here it's all/monthly
    }
  }, [externalSelectedDate]);

  const toggleRange = () => {
    setRange(prev => prev === 'all' ? 'monthly' : 'all');
    setIsOpen(false);
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <div className={`w-full rounded-2xl border lg:h-[392px] flex flex-col transition-all duration-300 ${
      isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "bg-white border-[#E5E5E5] text-black"
    }`}>
      {/* Header */}
      <div className={`rounded-2xl flex justify-between items-center border-b p-5 shrink-0 transition-colors duration-300 ${
        isDark ? "bg-[#101010] border-b-[#3D3D3D]" : "bg-[#FFFCF6] border-b-[#E5E5E5]"
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className={`text-sm lg:text-base ${isDark ? "text-white" : "text-[#000000]"}`}>Shoot Status</h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] lg:text-xs transition-colors border capitalize ${
              isDark 
                ? "bg-[#1A1A1A] border-white/10 text-white/70 hover:bg-white/5" 
                : "bg-white border-[#E5E5E5] text-[#333] hover:bg-zinc-100"
            }`}
          >
            {range === 'monthly' ? 'Month' : 'All Time'} <ChevronDown size={14} />
          </button>

          {isOpen && (
            <div className={`absolute right-0 top-full mt-2 w-32 border rounded-xl overflow-hidden z-20 shadow-xl ${
              isDark ? "bg-[#1A1A1A] border-white/10" : "bg-white border-[#E5E5E5]"
            }`}>
              <button
                onClick={() => toggleRange()}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  isDark ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-[#333] hover:bg-zinc-100"
                }`}
              >
                {range === 'all' ? 'Month' : 'All Time'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-2 flex-1">
        {/* Radial Chart Container */}
        <div className="relative w-full h-[200px] lg:h-[250px] flex items-center justify-center">
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
                background={{ fill: isDark ? "#141414" : "#F5F5F5" }}
                dataKey="value"
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`lg:text-[26px] font-bold tracking-tight translate-y-[130%] ${
              isDark ? "text-[#E8D1AB]" : "text-[#000]"
            }`}>
              {totalShoots}
            </span>
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 h-[1px] flex items-center justify-center pointer-events-none ${
              isDark ? "bg-white/20" : "bg-black/10"
            }`}
            style={{
              top: '80%',
              width: '67%'
            }}
          >
            <div className={`w-3 h-3 rounded-full border-2 shadow-[0_0_8px_rgba(232,209,171,0.6)] ${
              isDark ? "bg-[#E8D1AB] border-[#101010]" : "bg-[#000] border-white"
            }`} />
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex flex-col gap-4 w-full lg:w-auto min-w-[240px]">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between lg:justify-start gap-6 group">
              <div
                className={`w-16 py-1.5 rounded-full border text-xs font-bold text-center transition-all ${
                  isDark ? "text-white" : "text-[#333]"
                }`}
                style={{
                  borderColor: item.fill,
                  backgroundColor: 'transparent'
                }}
              >
                {item.value.toLocaleString()}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                isDark ? "text-white/40 group-hover:text-white/70" : "text-[#666] group-hover:text-black"
              }`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
