"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

type MetricTab = "winRate" | "avgDealValue" | "quoteToCash";

type HoveredBar = {
  label: string;
  value: string;
} | null;

export default function ConversionPerformanceWidget({
  isDark = true,
}: {
  isDark?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<MetricTab | null>("winRate");
  const [hoveredBar, setHoveredBar] = useState<HoveredBar>(null);

  // 1. General View Concentric Data (Inner to Outer)
  const generalRadialData = [
    {
      name: "Win Rate",
      value: 75,
      fill: "#38BDF8",
      tooltipLabel: "Deal won",
      tooltipValue: "25%",
    },
    {
      name: "Avg Deal Value",
      value: 65,
      fill: "#A78BFA",
      tooltipLabel: "Avg. deal value",
      tooltipValue: "$27,188",
    },
    {
      name: "Quote-to-Cash",
      value: 35.5,
      fill: "#FFF099",
      tooltipLabel: "Quote-to-cash",
      tooltipValue: "35.5%",
    },
  ];

  // 2. Win Rate View Data (Inner to Outer)
  const winRateRadialData = [
    { name: "Inner Cyan Ring", value: 100, fill: "#55D5E3" },
    { name: "Deals Won", value: 65, fill: "#22C55E" },
    { name: "Quotes Sent", value: 75, fill: "#DA8BED" },
  ];

  // 3. Avg Deal Value View (Inner to Outer)
  const avgDealRadialData = [
    { name: "Inner Accent Ring", value: 100, fill: "#55D5E3" },
    { name: "Avg Value", value: 70, fill: "#51DB6B" },
    { name: "Target Threshold", value: 85, fill: "#DA8BED" },
  ];

  // 4. Quote-To-Cash View (Inner to Outer)
  const quoteToCashRadialData = [
    { name: "Base Accent Ring", value: 100, fill: "#55D5E3" },
    { name: "Pending Settlement", value: 55, fill: "#51DB6B" },
    { name: "Conversion Rate", value: 80, fill: "#DA8BED" },
  ];

  return (
    <div
      className={`flex-1 relative overflow-hidden w-full h-full rounded-lg lg:rounded-2xl border p-6 transition-all duration-300 ${isDark ? "border-white/10 bg-[#171717]" : "border-[#E5E5E5] bg-white"
        }`}
    >
      {/* Header Title */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="h-7 w-[3px] bg-[#E8D1AB] rounded-full inline-block" />
          <span className={`text-base ${isDark ? "text-white" : "text-black"}`}>
            Conversion Performance
          </span>
        </div>
      </div>

      {/* Dynamic Sub-legend Bar */}
      <div className="h-6 flex items-center justify-center relative z-10 mb-1">
        {activeTab === "winRate" && (
          <div className="flex items-center gap-5 text-sm lg:text-base tracking-wider uppercase">
            <div className="flex items-center gap-1.5 text-[#229C39]">
              <span className="w-2 h-2 rounded-full bg-[#229C39]" />
              <span>32 DEALS WON</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#DA8BED]">
              <span className="w-2 h-2 rounded-full bg-[#DA8BED]" />
              <span>128 QUOTES SENT</span>
            </div>
          </div>
        )}

        {activeTab === "avgDealValue" && (
          <div className="flex items-center gap-5 text-sm lg:text-base tracking-wider uppercase">
            <div className="flex items-center gap-1.5 text-[#229C39]">
              <span className="w-2 h-2 rounded-full bg-[#229C39]" />
              <span>$27.1K AVG VALUE</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#DA8BED]">
              <span className="w-2 h-2 rounded-full bg-[#DA8BED]" />
              <span>$35K TARGET</span>
            </div>
          </div>
        )}

        {activeTab === "quoteToCash" && (
          <div className="flex items-center gap-5 text-sm lg:text-base tracking-wider uppercase">
            <div className="flex items-center gap-1.5 text-[#229C39]">
              <span className="w-2 h-2 rounded-full bg-[#229C39]" />
              <span>35.5% CASH CONVERTED</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#DA8BED]">
              <span className="w-2 h-2 rounded-full bg-[#DA8BED]" />
              <span>14 DAYS AVG TIME</span>
            </div>
          </div>
        )}
      </div>

      {/* Recharts Circular Radial Chart Area */}
      <div className="relative w-full h-[250px] flex items-center justify-center my-2 z-10 [&_*]:outline-none [&_*]:focus:outline-none">
        {/* Background Vertical Lines Masked to Bottom Half of Chart Area */}
        {/* <div
          className="absolute inset-x-0 bottom-0 h-[140px] pointer-events-none"
          style={{
            borderRadius: "15px",
            opacity: 0.5,
            background:
              "linear-gradient(180deg, rgba(232, 209, 171, 0.71) 0.32%, rgba(232, 209, 171, 0.00) 53.51%)",
            WebkitMaskImage:
              "repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)",
            maskImage:
              "repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 35%)",
            WebkitMaskComposite: "destination-in",
            maskComposite: "intersect",
          }}
        /> */}

        {/* 1. Win Rate Gauge View */}
        {activeTab === "winRate" && (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="95%"
                barSize={16}
                data={winRateRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{
                    fill: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  }}
                  dataKey="value"
                  cornerRadius={12}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span
                className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"
                  }`}
              >
                25%
              </span>
            </div>
          </div>
        )}

        {/* 2. Avg Deal Value Gauge View */}
        {activeTab === "avgDealValue" && (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="95%"
                barSize={16}
                data={avgDealRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{
                    fill: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  }}
                  dataKey="value"
                  cornerRadius={12}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span
                className={`text-2xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"
                  }`}
              >
                $27,188
              </span>
            </div>
          </div>
        )}

        {/* 3. Quote-To-Cash Gauge View */}
        {activeTab === "quoteToCash" && (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="95%"
                barSize={16}
                data={quoteToCashRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{
                    fill: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  }}
                  dataKey="value"
                  cornerRadius={12}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span
                className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-black"
                  }`}
              >
                35.5%
              </span>
            </div>
          </div>
        )}

        {/* 4. Default / General Overview Chart View */}
        {activeTab === null && (
          <div className="relative w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="95%"
                barSize={16}
                data={generalRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{
                    fill: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  }}
                  dataKey="value"
                  cornerRadius={12}
                  onMouseEnter={(entry) => {
                    setHoveredBar({
                      label: entry.tooltipLabel,
                      value: entry.tooltipValue,
                    });
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </RadialBarChart>
            </ResponsiveContainer>

            {/* Recharts Segment Hover Tooltip */}
            {hoveredBar && (
              <div className="absolute top-[28%] right-[15%] bg-white text-black px-3.5 py-1.5 rounded-xl shadow-2xl border border-black/10 flex items-center gap-1.5 text-xs font-semibold z-20 pointer-events-none transition-opacity duration-200">
                <span className="text-sm font-bold">{hoveredBar.value}</span>
                <span className="text-black/60 font-normal">
                  {hoveredBar.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
        {/* Win Rate Button */}
        <button
          type="button"
          onClick={() =>
            setActiveTab(activeTab === "winRate" ? null : "winRate")
          }
          className={`p-4 rounded-lg lg:rounded-2xl border text-left transition-all duration-200 cursor-pointer outline-none focus:outline-none ${activeTab === "winRate"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0%,rgba(232,209,171,0.80)_100%)] text-black border-[#E5D5B8]"
            : isDark
              ? "bg-[linear-gradient(180deg,rgba(11,11,11,0.50)_0%,rgba(0,0,0,0.40)_100%)] border-white/10 text-white hover:bg-white/5"
              : "bg-zinc-50 border-black/5 text-black hover:bg-black/5"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className={`lg:text-2xl font-bold ${activeTab === "winRate" ? "text-black" : "text-[#EDE598]"}`}>
              25%
            </span>
            <Info
              size={24}
              strokeWidth={1.5}
              className={
                activeTab === "winRate"
                  ? "fill-black text-[#E8D1AB]"
                  : "text-black fill-[#E8D1AB]"
              }
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm lg:text-base uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EDE598]" />
            <span
              className={
                activeTab === "winRate"
                  ? "text-black/80"
                  : isDark
                    ? "text-white/70"
                    : "text-black/60"
              }
            >
              WIN RATE
            </span>
          </div>
        </button>

        {/* Avg. Deal Value Button */}
        <button
          type="button"
          onClick={() =>
            setActiveTab(activeTab === "avgDealValue" ? null : "avgDealValue")
          }
          className={`p-4 rounded-lg lg:rounded-2xl border text-left transition-all duration-200 cursor-pointer outline-none focus:outline-none ${activeTab === "avgDealValue"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0%,rgba(232,209,171,0.80)_100%)] text-black border-[#E5D5B8]"
            : isDark
              ? "bg-[linear-gradient(180deg,rgba(11,11,11,0.50)_0%,rgba(0,0,0,0.40)_100%)] border-white/10 text-white hover:bg-white/5"
              : "bg-zinc-50 border-black/5 text-black hover:bg-black/5"
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`lg:text-2xl font-bold ${activeTab === "avgDealValue" ? "text-black" : "text-[#A78BFA]"
                }`}
            >
              $27,188
            </span>
            <Info
              size={24}
              strokeWidth={1.5}
              className={
                activeTab === "avgDealValue"
                  ? "fill-black text-[#E8D1AB]"
                  : "text-black fill-[#E8D1AB]"
              }
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm lg:text-base uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
            <span
              className={
                activeTab === "avgDealValue"
                  ? "text-black/80"
                  : isDark
                    ? "text-white/70"
                    : "text-black/60"
              }
            >
              AVG. DEAL VALUE
            </span>
          </div>
        </button>
      </div>

      {/* Quote-To-Cash Conversion Button */}
      <button
        type="button"
        onClick={() =>
          setActiveTab(activeTab === "quoteToCash" ? null : "quoteToCash")
        }
        className={`w-full mt-3 p-4 rounded-lg lg:rounded-2xl border text-left transition-all duration-200 cursor-pointer outline-none focus:outline-none relative z-10 ${activeTab === "quoteToCash"
          ? "bg-[linear-gradient(180deg,#E8D1AB_0%,rgba(232,209,171,0.80)_100%)] text-black border-[#E5D5B8]"
          : isDark
            ? "bg-[linear-gradient(180deg,rgba(11,11,11,0.50)_0%,rgba(0,0,0,0.40)_100%)] border-white/10 text-white hover:bg-white/5"
            : "bg-zinc-50 border-black/5 text-black hover:bg-black/5"
          }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`lg:text-2xl font-bold ${activeTab === "quoteToCash" ? "text-black" : "text-[#38BDF8]"
              }`}
          >
            35.5%
          </span>
          <Info
            size={24}
            strokeWidth={1.5}
            className={
              activeTab === "quoteToCash"
                ? "fill-black text-[#E8D1AB]"
                : "text-black fill-[#E8D1AB]"
            }
          />
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-sm lg:text-base uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          <span
            className={
              activeTab === "quoteToCash"
                ? "text-black/80"
                : isDark
                  ? "text-white/70"
                  : "text-black/60"
            }
          >
            QUOTE-TO-CASH CONVERSION
          </span>
        </div>
      </button>
    </div>
  );
}