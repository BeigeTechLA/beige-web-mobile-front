"use client";

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Video, Camera, Film, Users, ChevronDown, UsersRound } from 'lucide-react';

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

const metrics = [
  { id: 'total', label: 'Total Shoot', value: '691', icon: Video, color: 'bg-[#E5D5B8]' },
  { id: 'active', label: 'Active Shoot', value: '663', icon: Camera, color: 'bg-zinc-800' },
  { id: 'completed', label: 'Completed Shoot', value: '16', icon: Film, color: 'bg-zinc-800' },
  { id: 'clients', label: 'Total Client', value: '181', icon: UsersRound, color: 'bg-zinc-800' },
  { id: 'cps', label: 'Total CPs', value: '228', icon: Users, color: 'bg-zinc-800' },
];

export default function OverviewChart() {
  const [activeMetric, setActiveMetric] = useState('total');

  return (
    <div className="bg-[#171717] border border-zinc-800 rounded-2xl p-5 w-full text-white mt-9">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p className="">Overview</p>
        </div>
        {/* Placeholder as of now */}
        <button className="flex items-center gap-2 p-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">
          Month <ChevronDown size={14} />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10 bg-[#101010] rounded-2xl p-4">
        {metrics.map((m) => {
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
              <div className="text-[26px] font-bold mb-3">{m.value}</div>
              <div className={`text-xs flex gap-1 items-center ${isActive ? 'text-[#171717]' : 'text-white/70'}`}>
                <span className={`font-bold text-sm ${isActive ? 'text-[#047726]' : 'text-[#0DAE3D]'}`}>+3%</span> from last month
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
              activeDot={{ r: 6, fill: '#121212', stroke:'#E5D5B8' , strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}