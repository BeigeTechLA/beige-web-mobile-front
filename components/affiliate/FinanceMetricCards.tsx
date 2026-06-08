"use client";

import React from "react";
import { useTheme } from "next-themes";
import { BasicDropdown } from "@/components/admin/BasicDropdown";

type FinanceMetric = {
  id: string;
  label: string;
  value: React.ReactNode;
  helperText: string;
  icon: React.ElementType;
};

interface FinanceMetricCards {
  metrics: FinanceMetric[];
  activeId?: string;
  title?: string;
  onSelect?: (id: string) => void;
  dropdownLabel?: string;
  dropdownValue?: string;
  dropdownOptions?: string[];
  onDropdownChange?: (value: string) => void;
}

export default function FinanceMetricCards({
  metrics,
  activeId,
  title = "Overview",
  onSelect,
  dropdownLabel,
  dropdownValue,
  dropdownOptions,
  onDropdownChange,
}: FinanceMetricCards) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <section
      className={`rounded-[24px] border p-5 lg:p-6 transition-colors ${
        isDark
          ? "border-[#2D2D2D] bg-[#171717]"
          : "border-[#E5E5E5] bg-[#FCFBF7]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2
            className={`text-lg font-medium ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            {title}
          </h2>
        </div>

        {dropdownLabel &&
          dropdownValue &&
          dropdownOptions &&
          onDropdownChange && (
            <BasicDropdown
              label={dropdownLabel}
              value={dropdownValue}
              options={dropdownOptions}
              onChange={onDropdownChange}
              roundedFull
              width="w-fit"
            />
          )}
      </div>

      <div
        className={`grid grid-cols-1 gap-4 rounded-[22px] p-4 lg:grid-cols-3 ${
          isDark ? "bg-[#101010]" : "border border-[#EFE7DB] bg-white"
        }`}
      >
        {metrics.map((metric) => {
          const isActive = metric.id === activeId;
          const Icon = metric.icon;

          return (
            <article
              key={metric.id}
              onClick={() => onSelect?.(metric.id)}
              className={`rounded-[18px] border p-4 lg:p-5 transition-colors ${
                isActive
                  ? "cursor-pointer border-[#E7D0A9] bg-[#E9D2A9] text-[#171717]"
                  : isDark
                  ? "cursor-pointer border-transparent bg-[#101010] text-white hover:border-white/20"
                  : "cursor-pointer border-[#F1E8DB] bg-[#FFFCF7] text-[#171717] hover:border-[#E5D5B8]"
              }`}
            >
              <div className="mb-8 flex items-start justify-between gap-3">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-[#171717]"
                      : isDark
                      ? "text-white"
                      : "text-[#171717]"
                  }`}
                >
                  {metric.label}
                </p>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-[#171717] text-[#E5D5B8]"
                      : isDark
                      ? "bg-[#2A2A2A] text-[#E5D5B8]"
                      : "bg-[#F4EBDC] text-[#171717]"
                  }`}
                >
                  <Icon size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[34px] font-semibold leading-none tracking-[-0.03em]">
                  {metric.value}
                </div>
                <p
                  className={`text-sm ${
                    isActive
                      ? "text-[#171717]/75"
                      : isDark
                      ? "text-[#9F9F9F]"
                      : "text-[#6F6F6F]"
                  }`}
                >
                  {metric.helperText}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
