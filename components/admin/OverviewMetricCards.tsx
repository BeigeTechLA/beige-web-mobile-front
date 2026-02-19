import React from "react";
import { BasicDropdown } from "./BasicDropdown";

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
  return (
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-5 w-full text-white mt-5 lg:mt-9">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <p>Overview</p>
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

      <div className="flex flex-col lg:flex-row gap-4 bg-[#101010] rounded-2xl p-4">
        {metrics.map((m) => {
          const isActive = activeId === m.id;

          return (
            <div
              key={m.id}
              onClick={() => onSelect?.(m.id)}
              className={`flex-1 relative group cursor-pointer rounded-lg p-4 border border-transparent transition-all duration-200 ${isActive
                ? "bg-[#ECD7B4] text-[#171717]"
                : "bg-[#101010] text-white hover:border-white/30"
                }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${isActive ? "text-black/70" : "text-zinc-400"
                      }`}
                  >
                    {m.label}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-full ${isActive
                    ? "bg-[#171717] text-[#E8D1AB]"
                    : "bg-[#2C2C2C] text-white/60"
                    }`}
                >
                  <m.icon size={20} />
                </div>
              </div>

              <div className="text-[26px] leading-normal font-bold mb-3">
                {isLoading ? (
                  <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
                ) : (
                  m.value
                )}
              </div>

              <div
                className={`text-xs flex gap-1 items-center ${isActive ? "text-[#171717]" : "text-white/70"
                  }`}
              >
                <span
                  className={`font-bold text-sm ${isActive ? "text-[#047726]" : "text-[#0DAE3D]"
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
