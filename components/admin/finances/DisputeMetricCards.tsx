"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DisputeMetricCard = {
  id: string;
  label: string;
  value: React.ReactNode;
  helperText: string;
  icon: React.ElementType;
};

interface DisputeMetricCardsProps {
  metrics: DisputeMetricCard[];
  activeId?: string;
  onSelect?: (id: string) => void;
  rangeValue?: string;
  rangeOptions?: string[];
  onRangeChange?: (value: string) => void;
}

export default function DisputeMetricCards({
  metrics,
  activeId,
  onSelect,
  rangeValue = "Month",
  rangeOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"],
  onRangeChange,
}: DisputeMetricCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`rounded-2xl border p-5 w-full transition-all duration-300 ${
        isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F9F9F9] border-[#E8E8E8]"
      }`}
    >
      <div className="flex justify-between items-center mb-5 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p className={`font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
            Overview
          </p>
        </div>

        {onRangeChange && (
          <Select value={rangeValue} onValueChange={onRangeChange}>
            <SelectTrigger
              className={`w-[110px] rounded-full h-9 text-[10px] lg:text-xs focus:ring-0 ${
                isDark
                  ? "bg-zinc-900 border-[#3D3D3D] text-white/70"
                  : "bg-[#FFFFFF] border-[#E3E3E3] text-[#323232]"
              }`}
            >
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent
              className={
                isDark
                  ? "bg-[#111111] border-[#3D3D3D]"
                  : "text-black bg-white border-[#E3E3E3]"
              }
            >
              {rangeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-4 gap-4 rounded-2xl p-4 transition-colors duration-300 ${
          isDark ? "bg-[#101010]" : "bg-white border border-[#F0F0F0]"
        }`}
      >
        {metrics.map((metric) => {
          const isActive = activeId === metric.id;
          const Icon = metric.icon;

          return (
            <article
              key={metric.id}
              onClick={() => onSelect?.(metric.id)}
              className={`relative rounded-lg p-4 border transition-all duration-200 ${
                isActive
                  ? "bg-[#ECD7B4] border-transparent text-[#171717] cursor-pointer"
                  : isDark
                  ? "bg-[#101010] border-transparent text-white hover:border-white/20 cursor-pointer"
                  : "bg-white border-[#F0F0F0] text-[#171717] hover:border-[#E5D5B8] cursor-pointer"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-black/80"
                      : isDark
                      ? "text-white"
                      : "text-[#171717]"
                  }`}
                >
                  {metric.label}
                </span>
                <div
                  className={`p-2 rounded-full ${
                    isActive
                      ? "bg-[#171717] text-[#E8D1AB]"
                      : isDark
                      ? "bg-[#2C2C2C] text-[#E8D1AB]"
                      : "bg-[#F2F2F2] text-[#171717]/60"
                  }`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div className="text-[26px] lg:text-[28px] leading-normal font-bold mb-2">
                {metric.value}
              </div>
              <div
                className={`text-sm ${
                  isActive
                    ? "text-[#171717]/70"
                    : isDark
                    ? "text-white/60"
                    : "text-[#676767]"
                }`}
              >
                {metric.helperText}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
