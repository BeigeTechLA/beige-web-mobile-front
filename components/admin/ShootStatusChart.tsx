"use client";

import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { adminApi } from "@/lib/api";

interface ShootStatusBreakdown {
  label: string;
  count: number;
  color: string;
}

export const ShootStatusChart = () => {
  const [range, setRange] = React.useState<'all' | 'monthly'>('all');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [totalShoots, setTotalShoots] = React.useState<string>("0");
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminApi.getShootStatus(range);
        if (response && response.data) {
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
  }, [range]);

  const toggleRange = () => {
    setRange(prev => prev === 'all' ? 'monthly' : 'all');
    setIsOpen(false);
  };

  return (
    // md:h-[392px] maintained, added min-h for mobile visibility
    <div className="w-full bg-[#171717] rounded-2xl text-white border border-[#3D3D3D] lg:h-[392px] flex flex-col">
      {/* Header */}
      <div className="bg-[#101010] rounded-2xl flex justify-between items-center lg:mb-4 border-b border-b-[#3D3D3D] p-5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className="text-sm lg:text-base">Shoot Status</h3>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-3 py-1.5 rounded-full text-[10px] lg:text-xs text-white/70 hover:bg-white/5 transition-colors capitalize"
          >
            {range === 'monthly' ? 'Month' : 'All Time'} <ChevronDown size={14} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-32 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
              <button
                onClick={() => toggleRange()}
                className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
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
              // Slightly higher center on mobile to keep the gauge within frame
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
            <span className="text-[#E8D1AB] lg:text-[26px] font-bold tracking-tight translate-y-[130%]">
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
        <div className="flex flex-col gap-4 w-full lg:w-auto min-w-[240px]">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between lg:justify-start gap-6 group">
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

export default ShootStatusChart;