"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- Types & Dummy Data ---
type CategoryData = {
  name: string;
  value: number;
  color: string;
};

const DATA_SET: Record<string, CategoryData[]> = {
  All: [
    { name: 'Corporate Events', value: 32, color: '#3B82F6' },
    { name: 'Wedding', value: 8, color: '#22C55E' },
    { name: 'Private Events', value: 9, color: '#8B5CF6' },
    { name: 'Commercial & Advertising', value: 12, color: '#F59E0B' },
    { name: 'Social Content', value: 12, color: '#06B6D4' },
    { name: 'Podcasts & Shows', value: 25, color: '#EC4899' },
    { name: 'Music Videos', value: 17, color: '#EF4444' },
    { name: 'Short Films & Narrative', value: 12, color: '#6366F1' },
  ],
  Videography: [
    { name: 'Music Videos', value: 45, color: '#EF4444' },
    { name: 'Short Films', value: 30, color: '#6366F1' },
    { name: 'Social Content', value: 25, color: '#06B6D4' },
  ],
  Photography: [
    { name: 'Wedding', value: 60, color: '#22C55E' },
    { name: 'Corporate', value: 40, color: '#3B82F6' },
    { name: 'Commercial & Advertising', value: 12, color: '#F59E0B' },
    { name: 'Social Content', value: 12, color: '#06B6D4' },

  ],
};

const TABS = ['All', 'Videography', 'Photography'];

export default function ShootByCategory() {
  const [activeTab, setActiveTab] = useState('All');
  const currentData = DATA_SET[activeTab];

  return (
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl w-full max-w-md text-white">
      <div className="bg-[#101010] rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 p-5 border-b border-b-[#3D3D3D]">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Shoot By Category</h2>
        </div>

        {/* Tabs */}
        <div className="flex px-2 border-b border-b-[#3D3D3D] rounded-b-xl">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pt-5 pb-3.5 px-4 text-sm font-medium transition-all  border-b-[3px] ${activeTab === tab
                ? 'text-[#E8D1AB] border-b-[#E8D1AB]'
                : 'text-white/30 hover:text-white/60 border-b-transparent'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 pt-[30px]">
        {/* Donut Chart */}
        <div className="relative h-64 w-full mb-10 ">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] px-4 py-2 rounded-lg border border-white/20 shadow-xl ring-1 ring-black/5">
                        <p className="text-[#101010] font-semibold">
                          {payload[0].value}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold">{currentData.length.toString().padStart(2, '0')}</span>
            <span className="text-white/80 text-lg capitalize tracking-wider">Shoot Types</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
          {currentData.map((item, index) => (
            <div key={index} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-white transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="text-lg font-semibold text-white/70">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}