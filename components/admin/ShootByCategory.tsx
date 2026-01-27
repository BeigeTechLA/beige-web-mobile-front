"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { adminApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

// --- Types ---
type CategoryData = {
  name: string;
  value: number;
  color: string;
  percentage?: number;
};

const COLORS = ['#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#EF4444', '#6366F1'];
const TABS = ['All', 'Videography', 'Photography'];

export default function ShootByCategory() {
  const [activeTab, setActiveTab] = useState('All');
  const [currentData, setCurrentData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tabParam = activeTab === 'All' ? undefined : activeTab.toLowerCase();
        const response = await adminApi.getShootCategoryCount(tabParam);

        if (!response.error && response.data) {
          const rawCategories = response.data.categories || (Array.isArray(response.data) ? response.data : (response.data.items || []));

          const mappedData = rawCategories.map((item: any, index: number) => ({
            name: item.label || item.category_name || item.name,
            value: item.count || item.value || 0,
            percentage: item.percentage !== undefined ? item.percentage : 0,
            color: item.color || COLORS[index % COLORS.length]
          }));
          setCurrentData(mappedData);
        }
      } catch (error) {
        console.error("Failed to fetch shoot category count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  return (
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl w-full max-w-md text-white h-full flex flex-col">
      <div className="bg-[#101010] rounded-t-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 p-5 border-b border-b-[#3D3D3D]">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Shoot By Category</h2>
        </div>

        {/* Tabs */}
        <div className="flex px-2 border-b border-b-[#3D3D3D]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pt-5 pb-3.5 px-4 text-sm font-medium transition-all border-b-[3px] ${activeTab === tab
                ? 'text-[#E8D1AB] border-b-[#E8D1AB]'
                : 'text-white/30 hover:text-white/60 border-b-transparent'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 pt-[30px] flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#E5D5B8]" size={32} />
          </div>
        ) : currentData.length > 0 ? (
          <>
            {/* Donut Chart */}
            <div className="relative h-64 w-full mb-10 shrink-0">
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
                        const data = payload[0].payload as CategoryData;
                        return (
                          <div className="bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] px-4 py-2 rounded-lg border border-white/20 shadow-xl ring-1 ring-black/5">
                            <p className="text-[#101010] font-semibold">
                              {data.percentage}%
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
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-white/40">
            No categories found
          </div>
        )}
      </div>
    </div>
  );
}
