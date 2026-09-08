"use client";

import React, { useEffect, useState } from "react";
import { BasicDropdown } from "./BasicDropdown";
import { useTheme } from "next-themes";
type MetricItem = {
  id: string;
  label: string;
  value: React.ReactNode;
  growth: number;
  icon: React.ElementType;
};

type DropdownOption = {
  label: string;
  value: string;
};
type OptionType = string | DropdownOption;
type MetricCardsProps = {
  metrics: MetricItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  isLoading?: boolean;
  getGrowthLabel?: (metric: MetricItem) => string;
  renderAction?: (metric: MetricItem) => React.ReactNode;
  dropdownLabel?: string;
  dropdownValue?: string;
  dropdownOptions?: OptionType[];
  onDropdownChange?: (value: string) => void;
};

const OverviewMetricCards = ({
  metrics,
  activeId,
  onSelect,
  isLoading = false,
  getGrowthLabel = () => "",
  renderAction,
  dropdownLabel,
  dropdownValue,
  dropdownOptions,
  onDropdownChange,
}: MetricCardsProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <div
      className={`border rounded-2xl p-5 w-full transition-colors duration-300 mt-5 lg:mt-9 ${
        isDark
          ? "bg-[#171717] border-[#3D3D3D] text-white"
          : "bg-white border-[#E5E5E5] text-[#202020]"
      }`}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p className="font-medium text-sm lg:text-base">Overview</p>
        </div>

        <div className="flex items-center gap-3">
          {dropdownOptions &&
            dropdownValue !== undefined &&
            dropdownLabel !== undefined &&
            onDropdownChange && (
              <BasicDropdown
                label={dropdownLabel}
                value={dropdownValue}
                onChange={onDropdownChange}
                options={dropdownOptions}
              />
            )}
        </div>
      </div>

      <div
        className={`flex flex-col lg:flex-row gap-4 rounded-2xl p-4 transition-colors duration-300 ${
          isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
        }`}
      >
        {metrics.map((m) => {
          const isActive = activeId === m.id;

          return (
            <div
              key={m.id}
              onClick={() => onSelect?.(m.id)}
              className={`flex-1 relative group cursor-pointer rounded-lg p-4 border transition-all duration-200 ${
                isActive
                  ? "bg-[#ECD7B4] border-transparent text-[#171717]"
                  : isDark
                    ? "bg-[#101010] border-transparent text-white hover:border-white/30"
                    : "bg-[#F4F5F7] border-transparent text-[#323232] hover:border-[#ECD7B4]"
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-black/70"
                        : isDark
                          ? "text-zinc-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isActive
                      ? "bg-[#171717] text-[#E8D1AB]"
                      : isDark
                        ? "bg-[#2C2C2C] text-white/60"
                        : "bg-white text-[#E8D1AB]"
                  }`}
                >
                  <m.icon size={20} />
                </div>
              </div>

              <div className="text-[26px] leading-normal font-bold mb-3">
                {isLoading ? (
                  <div
                    className={`h-8 w-16 animate-pulse rounded ${
                      isDark ? "bg-white/10" : "bg-zinc-200"
                    }`}
                  />
                ) : (
                  m.value
                )}
              </div>

              <div
                className={`text-xs flex gap-1 items-center ${
                  isActive
                    ? "text-[#171717]"
                    : isDark
                      ? "text-white/70"
                      : "text-zinc-500"
                }`}
              >
                <span
                  className={`font-bold text-sm ${
                    m.growth > 0
                      ? isActive
                        ? "text-[#047726]"
                        : isDark
                          ? "text-[#0DAE3D]"
                          : "text-[#0A8F30]"
                      : m.growth < 0
                        ? "text-red-500"
                        : isActive
                          ? "text-[#171717]/60"
                          : isDark
                            ? "text-white/50"
                            : "text-[#676767]"
                  }`}
                >
                  {m.growth > 0 ? `+${m.growth}%` : `${m.growth}%`}
                </span>{" "}
                {getGrowthLabel(m)}
              </div>

              {renderAction?.(m)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewMetricCards;
