"use client";

import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

const data = [
  {
    name: "Successful Shoots",
    value: 987,
    fill: "#A78BFA",
  },
  {
    name: "Pending Shoots",
    value: 1674,
    fill: "#60A5FA",
  },
  {
    name: "Rejected Shoots",
    value: 1073,
    fill: "#FBBF24",
  },
  {
    name: "In-Progress Shoots", // Second rejected/completed entry from your UI
    value: 921,
    fill: "#34D399",
  },
];

const TOTAL_SHOOTS = "4,289";

export const ShootStatusChart = () => {
  return (
    <div className="w-full bg-[#171717] rounded-2xl text-white border border-[#3D3D3D] md:h-[392px]">
      {/* Header */}
      <div className="bg-[#101010] rounded-2xl flex justify-between items-center mb-4 border-b border-b-[#3D3D3D] p-5 ">
       <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h3 className="">Shoot Status</h3>
        </div>
        <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-3 py-1.5 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
          Month <ChevronDown size={14} />
        </button>
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
              data={data}
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
              {TOTAL_SHOOTS}
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
          {data.map((item, index) => (
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

export default ShootStatusChart;