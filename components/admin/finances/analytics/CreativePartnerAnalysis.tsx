"use client";

import React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";

type CreativePartnerAnalysisProps = {
  isDark: boolean;
  selectedDate?: Date | null;
};

type ShootPoint = {
  name: string;
  value: number;
  hoverValue?: number;
};

const payoutRows = [
  {
    rank: "01",
    name: "Marcus Reid",
    amount: "$143M",
    stat: "34.2% mg",
    value: 100,
  },
  {
    rank: "02",
    name: "Priya Nair",
    amount: "$128M",
    stat: "31.8% mg",
    value: 81,
  },
  { rank: "03", name: "Leon Vo", amount: "$114M", stat: "29.4% mg", value: 72 },
  {
    rank: "04",
    name: "Cleo Dasha",
    amount: "$99M",
    stat: "32.1% mg",
    value: 62,
  },
  {
    rank: "05",
    name: "Amara Sow",
    amount: "$87M",
    stat: "28.9% mg",
    value: 55,
  },
];

const shoots: ShootPoint[] = [
  { name: "Priya Nair", value: 82 },
  { name: "Marcus Reid", value: 35 },
  { name: "Leon Vo", value: 58 },
  { name: "Cleo Dasha", value: 94, hoverValue: 110 },
  { name: "Amara Sow", value: 18 },
  { name: "Raj Verma", value: 47 },
  { name: "John Doe", value: 27 },
  { name: "Ethan Cater", value: 66 },
  { name: "Sakuna Patel", value: 40 },
  { name: "Amy Jason", value: 75 },
];

function Panel({
  title,
  isDark,
  children,
  className = "",
  showInfo = true,
}: {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  className?: string;
  showInfo?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${
        isDark ? "bg-[#101010]" : "border border-[#EEEEEE] bg-white"
      } ${className}`}
    >
      <div
        className={`flex items-center border-b px-5 py-4 ${
          isDark
            ? "border-[#222222] bg-[#0A0A0A]"
            : "border-[#EEEEEE] bg-[#FFFCF6]"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium lg:text-base">{title}</span>
          {showInfo ? <Info size={11} className="text-[#E8D1AB]" /> : null}
        </div>
      </div>

      {children}
    </div>
  );
}

function BubbleTooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`group absolute ${className}`}>
      <button type="button" className="block rounded-full focus:outline-none">
        {children}
      </button>

      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-[10px] font-semibold text-[#171717] opacity-0 shadow-xl transition-all duration-150 group-hover:-translate-y-[calc(100%+12px)] group-hover:opacity-100 group-focus-within:-translate-y-[calc(100%+12px)] group-focus-within:opacity-100">
        {label}
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
      </div>
    </div>
  );
}

function ActiveShootBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
  isDark,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ShootPoint;
  isDark: boolean;
}) {
  const centerX = x + width / 2;
  const safeBottom = y + Math.max(height - 10, 10);
  const label = payload?.hoverValue ?? payload?.value ?? 0;
  const tooltipWidth = 78;
  const tooltipHeight = 24;
  const tooltipX = centerX - tooltipWidth / 2;
  const tooltipY = y - 48;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill="url(#finance-shoot-bar-gradient)"
      />

      <line
        x1={centerX}
        x2={centerX}
        y1={tooltipY + tooltipHeight}
        y2={y - 12}
        stroke="#E8D1AB"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <rect
        x={tooltipX}
        y={tooltipY}
        width={tooltipWidth}
        height={tooltipHeight}
        rx={5}
        fill="#FFFFFF"
      />

      <text
        x={centerX}
        y={tooltipY + 16}
        textAnchor="middle"
        fill="#171717"
        fontSize="10"
        fontWeight="700"
      >
        {label} Shoots
      </text>

      <line
        x1={centerX}
        x2={centerX}
        y1={y + 6}
        y2={safeBottom}
        stroke="#A6D4FF"
        strokeOpacity="0.6"
        strokeWidth="1"
        strokeDasharray="5 6"
      />

      <circle
        cx={centerX}
        cy={y - 7}
        r={5}
        fill={isDark ? "#101010" : "#FFFFFF"}
        stroke="#E8D1AB"
        strokeWidth={2}
      />
    </g>
  );
}

export default function CreativePartnerAnalysis({
  isDark,
}: CreativePartnerAnalysisProps) {
  return (
    <section
      className={`w-full rounded-2xl border p-5 transition-colors duration-300 lg:p-6 ${
        isDark
          ? "border-[#3D3D3D] bg-[#171717] text-white"
          : "border-[#E5E5E5] bg-white text-[#202020]"
      }`}
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="h-6 w-[3px] rounded-full bg-[#E8D1AB]" />
        <h2 className="text-sm font-medium lg:text-base">
          Creative Partner Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Top CPs By Payout" isDark={isDark}>
          <div className="space-y-3 px-5 py-5">
            {payoutRows.map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[24px_minmax(0,1fr)_64px] items-center gap-3"
              >
                <span
                  className={`text-[10px] ${
                    isDark ? "text-white/35" : "text-black/40"
                  }`}
                >
                  {row.rank}
                </span>

                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium lg:text-sm">
                      {row.name}
                    </span>
                    <span className="text-xs font-medium text-[#55C786] lg:text-sm">
                      {row.amount}
                    </span>
                  </div>

                  <div
                    className={`h-[2px] overflow-hidden rounded-full ${
                      isDark ? "bg-white/15" : "bg-black/10"
                    }`}
                  >
                    <div
                      className="h-full bg-[#5AC98A]"
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                </div>

                <span
                  className={`text-right text-[9px] lg:text-[10px] ${
                    isDark ? "text-white/35" : "text-black/40"
                  }`}
                >
                  {row.stat}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Avg - Payout/Margin/Count"
          isDark={isDark}
          showInfo={false}
        >
          <div className="grid min-h-[220px] grid-cols-[170px_minmax(0,1fr)] items-center gap-3 px-4 py-5">
            <div className="relative mx-auto h-[165px] w-[165px]">
              <BubbleTooltip
                label="Per Shoot Payout"
                className="left-[40px] top-[10px]"
              >
                <div className="flex h-[105px] w-[105px] items-center justify-center rounded-full bg-[#6399E8] text-base font-semibold text-white">
                  $3,039
                </div>
              </BubbleTooltip>

              <BubbleTooltip
                label="Average CP Margin"
                className="bottom-[10px] left-[0px]"
              >
                <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-[#62C89A] text-sm font-semibold text-white">
                  31.3%
                </div>
              </BubbleTooltip>

              <BubbleTooltip
                label="Average CPs per Shoot"
                className="bottom-[2px] right-[2px]"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D953B4] text-sm font-semibold text-white">
                  1.8
                </div>
              </BubbleTooltip>
            </div>

            <div className="space-y-5">
              {[
                ["Average CP Payout", "#5B94E8", "82%"],
                ["Average CP Margin", "#58C996", "62%"],
                ["Average CPs per Shoot", "#D952B4", "23%"],
              ].map(([label, color, width]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] lg:text-xs">
                    <span>{label}</span>
                    <Info size={9} className="text-[#E8D1AB]" />
                  </div>

                  <div
                    className={`h-px ${isDark ? "bg-white/25" : "bg-black/15"}`}
                  >
                    <div
                      className="h-px"
                      style={{ width, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Top CPs By Shoots"
          isDark={isDark}
          className="xl:col-span-2"
        >
          <div className="h-[330px] px-2 pb-2 pt-4 lg:h-[370px] lg:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shoots}
                margin={{ top: 30, right: 8, left: -10, bottom: 8 }}
                barCategoryGap="34%"
              >
                <defs>
                  <linearGradient
                    id="finance-shoot-bar-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2F91F6" />
                    <stop offset="38%" stopColor="#4389D7" />
                    <stop offset="78%" stopColor="#45596E" stopOpacity="0.78" />
                    <stop
                      offset="100%"
                      stopColor="#101214"
                      stopOpacity="0.25"
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={42}
                  dy={10}
                  tick={{
                    fill: isDark ? "#FFFFFF99" : "#17171799",
                    fontSize: 9,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tick={{
                    fill: isDark ? "#FFFFFF55" : "#17171755",
                    fontSize: 9,
                  }}
                />

                {/* Invisible tooltip activates activeBar on hover. */}
                <Tooltip content={() => null} cursor={false} />

                <Bar
                  dataKey="value"
                  fill="url(#finance-shoot-bar-gradient)"
                  radius={[5, 5, 0, 0]}
                  barSize={32}
                  activeBar={(props: any) => (
                    <ActiveShootBar
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      payload={props.payload}
                      isDark={isDark}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </section>
  );
}
