"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
    { month: "Jan", initiated: 18, preproduction: 17, postproduction: 18, revision: 19, completed: 18 },
    { month: "Feb", initiated: 5, preproduction: 6, postproduction: 11, revision: 6, completed: 4 },
    { month: "Mar", initiated: 13, preproduction: 14, postproduction: 13, revision: 12, completed: 18 },
    { month: "Apr", initiated: 11, preproduction: 11, postproduction: 13, revision: 12, completed: 13 },
    { month: "May", initiated: 20, preproduction: 18, postproduction: 20, revision: 22, completed: 20 },
    { month: "Jun", initiated: 8, preproduction: 8, postproduction: 9, revision: 10, completed: 10 },
    { month: "Jul", initiated: 14, preproduction: 14, postproduction: 13, revision: 17, completed: 14 },
    { month: "Aug", initiated: 9, preproduction: 8, postproduction: 10, revision: 11, completed: 10 },
    { month: "Sep", initiated: 17, preproduction: 16, postproduction: 17, revision: 18, completed: 20 },
];

const Legend = () => {
    const items = [
        { label: "Initiated", color: "#FF9800" },
        { label: "Preproduction", color: "#A855F7" },
        { label: "Postproduction", color: "#06B6D4" },
        { label: "Revision", color: "#3B82F6" },
        { label: "Completed", color: "#22C55E" },
    ];

    return (
        <div className="flex items-center gap-6 flex-wrap">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[#888888] text-sm">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default function AffiliateMeetingOverviewChart() {
    return (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-[#E5D5B8] rounded-full" />
                    <h3 className="text-white text-lg font-semibold">Meeting Overview</h3>
                </div>
                <button className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222222] px-4 py-2 rounded-lg text-sm text-[#E0E0E0] hover:bg-[#222222] transition-colors">
                    Sort by <ChevronDown size={14} />
                </button>
            </div>

            {/* Legend */}
            <div className="mb-6">
                <Legend />
            </div>

            {/* Chart */}
            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barSize={45}
                        barGap={8}
                        margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="0"
                            stroke="#222222"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#666666", fontSize: 13 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#666666", fontSize: 13 }}
                            dx={-10}
                            ticks={[0, 20, 40, 60, 80, 100]}
                        />
                        <Bar dataKey="initiated" stackId="a" fill="#FF9800" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="preproduction" stackId="a" fill="#A855F7" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="postproduction" stackId="a" fill="#06B6D4" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="revision" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="completed" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
