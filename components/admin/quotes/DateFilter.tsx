"use client";

import React, { useEffect, useState } from "react";
import {
  format,
  subDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
} from "date-fns";
import { Box } from "@mui/material";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/Datepicker";

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "yearToDate"
  | "custom";

export interface DateFilterRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateFilterProps {
  isDark?: boolean;
  value?: DatePreset;
  selectedDate?: Date | null;
  selectedRange?: DateFilterRange;
  onChange?: (
    preset: DatePreset,
    dateRange: DateFilterRange,
    customDate: Date | null
  ) => void;
}

export default function DateFilter({
  isDark = true,
  value,
  selectedRange,
  onChange,
}: DateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>(value || "all");

  const [customRangeStartDate, setCustomRangeStartDate] =
    useState<Date | null>(selectedRange?.startDate || null);

  const [customRangeEndDate, setCustomRangeEndDate] =
    useState<Date | null>(selectedRange?.endDate || null);

  const [draftCustomRangeStartDate, setDraftCustomRangeStartDate] =
    useState<Date | null>(selectedRange?.startDate || null);

  const [draftCustomRangeEndDate, setDraftCustomRangeEndDate] =
    useState<Date | null>(selectedRange?.endDate || null);

  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);

  const today = startOfDay(new Date());

  useEffect(() => {
    if (value) {
      setPreset(value);
    }
  }, [value]);

  useEffect(() => {
    if (selectedRange) {
      setCustomRangeStartDate(selectedRange.startDate);
      setCustomRangeEndDate(selectedRange.endDate);

      setDraftCustomRangeStartDate(selectedRange.startDate);
      setDraftCustomRangeEndDate(selectedRange.endDate);
    }
  }, [selectedRange]);

  const getDateRangeForPreset = (
    selectedPreset: DatePreset
  ): DateFilterRange => {
    const currentDate = startOfDay(new Date());

    switch (selectedPreset) {
      case "today":
        return {
          startDate: currentDate,
          endDate: currentDate,
        };

      case "yesterday": {
        const yesterday = subDays(currentDate, 1);

        return {
          startDate: yesterday,
          endDate: yesterday,
        };
      }

      case "last7Days":
        return {
          startDate: subDays(currentDate, 7),
          endDate: currentDate,
        };

      case "last30Days":
        return {
          startDate: subDays(currentDate, 30),
          endDate: currentDate,
        };

      case "thisMonth":
        return {
          startDate: startOfMonth(currentDate),
          endDate: currentDate,
        };

      case "lastMonth": {
        const previousMonth = subMonths(currentDate, 1);

        return {
          startDate: startOfMonth(previousMonth),
          endDate: endOfMonth(previousMonth),
        };
      }

      case "thisQuarter":
        return {
          startDate: startOfQuarter(currentDate),
          endDate: currentDate,
        };

      case "lastQuarter": {
        const previousQuarter = subQuarters(currentDate, 1);

        return {
          startDate: startOfQuarter(previousQuarter),
          endDate: endOfQuarter(previousQuarter),
        };
      }

      case "yearToDate":
        return {
          startDate: startOfYear(currentDate),
          endDate: currentDate,
        };

      case "custom":
        return {
          startDate: customRangeStartDate,
          endDate: customRangeEndDate,
        };

      case "all":
      default:
        return {
          startDate: null,
          endDate: null,
        };
    }
  };

  const openCustomRange = () => {
    setDraftCustomRangeStartDate(customRangeStartDate);
    setDraftCustomRangeEndDate(customRangeEndDate);
    setIsCustomRangeOpen(true);
  };

  const handlePresetChange = (newValue: string) => {
    const newPreset = newValue as DatePreset;

    if (newPreset === "custom") {
      openCustomRange();
      return;
    }

    setPreset(newPreset);

    const range = getDateRangeForPreset(newPreset);

    onChange?.(newPreset, range, null);
  };

  const handleCustomRangeCancel = () => {
    setDraftCustomRangeStartDate(customRangeStartDate);
    setDraftCustomRangeEndDate(customRangeEndDate);

    setIsCustomRangeOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (!draftCustomRangeStartDate || !draftCustomRangeEndDate) {
      return;
    }

    const startDate = startOfDay(draftCustomRangeStartDate);
    const endDate = startOfDay(draftCustomRangeEndDate);

    if (startDate > today || endDate > today) {
      return;
    }

    setCustomRangeStartDate(startDate);
    setCustomRangeEndDate(endDate);

    setDraftCustomRangeStartDate(startDate);
    setDraftCustomRangeEndDate(endDate);

    setPreset("custom");

    setIsCustomRangeOpen(false);

    onChange?.(
      "custom",
      {
        startDate,
        endDate,
      },
      startDate
    );
  };

  const clearCustomRange = () => {
    setDraftCustomRangeStartDate(null);
    setDraftCustomRangeEndDate(null);

    setCustomRangeStartDate(null);
    setCustomRangeEndDate(null);

    setPreset("all");

    setIsCustomRangeOpen(false);

    onChange?.(
      "all",
      {
        startDate: null,
        endDate: null,
      },
      null
    );
  };

  const renderTriggerLabel = () => {
    if (
      preset === "custom" &&
      customRangeStartDate &&
      customRangeEndDate
    ) {
      return `${format(
        customRangeStartDate,
        "MMM dd, yyyy"
      )} - ${format(customRangeEndDate, "MMM dd, yyyy")}`;
    }

    const labels: Record<DatePreset, string> = {
      all: "Date Filter",
      today: "Today",
      yesterday: "Yesterday",
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisQuarter: "This Quarter",
      lastQuarter: "Last Quarter",
      yearToDate: "Year to Date",
      custom: "Custom Range",
    };

    return labels[preset] || "Date Filter";
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
        }}
        className="inline-flex items-center gap-2 lg:min-w-30"
      >
        <Select
          value={preset === "custom" ? "" : preset}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger
            className={`h-12 rounded-lg p-2.5 text-xs medium lg:rounded-xl lg:p-4 lg:text-sm focus:ring-[#E5D5B8]/40 ${
              isDark
                ? "border-white/20 bg-[#202020] text-white"
                : "border-[#E3E3E3] bg-[#E8E8E8] text-[#323232] hover:opacity-80"
            }`}
          >
            <span className="truncate text-sm medium">
              {renderTriggerLabel()}
            </span>
          </SelectTrigger>

          <SelectContent
            className={
              isDark
                ? "border-white/20 bg-[#161616] text-white text-sm medium"
                : "border-[#E3E3E3] bg-white text-black text-sm medium"
            }
          >
            <SelectItem value="all">
              All Time
            </SelectItem>

            <SelectItem value="today">
              Today
            </SelectItem>

            <SelectItem value="yesterday">
              Yesterday
            </SelectItem>

            <SelectItem value="last7Days">
              Last 7 Days
            </SelectItem>

            <SelectItem value="last30Days">
              Last 30 Days
            </SelectItem>

            <SelectItem value="thisMonth">
              This Month
            </SelectItem>

            <SelectItem value="lastMonth">
              Last Month
            </SelectItem>

            <SelectItem value="thisQuarter">
              This Quarter
            </SelectItem>

            <SelectItem value="lastQuarter">
              Last Quarter
            </SelectItem>

            <SelectItem value="yearToDate">
              Year to Date
            </SelectItem>

            <SelectItem value="custom">
              Custom Range...
            </SelectItem>
          </SelectContent>
        </Select>
      </Box>

      {isCustomRangeOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={handleCustomRangeCancel}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl ${
              isDark
                ? "border-[#3A3A3A] bg-[#171717] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold">
                Custom Range
              </h3>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-white/60"
                    : "text-black/55"
                }`}
              >
                Choose a start and end date.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DatePicker
                label="Start Date"
                floating
                value={draftCustomRangeStartDate}
                onChange={(date) => {
                  const nextStartDate = date
                    ? startOfDay(date)
                    : null;

                  setDraftCustomRangeStartDate(
                    nextStartDate
                  );

                  if (
                    nextStartDate &&
                    draftCustomRangeEndDate &&
                    nextStartDate >
                      startOfDay(
                        draftCustomRangeEndDate
                      )
                  ) {
                    setDraftCustomRangeEndDate(
                      nextStartDate
                    );
                  }
                }}
                maxDate={
                  draftCustomRangeEndDate
                    ? draftCustomRangeEndDate < today
                      ? draftCustomRangeEndDate
                      : today
                    : today
                }
                isDark={isDark}
                disablePortal
                format="MM/dd/yyyy"
              />

              <DatePicker
                label="End Date"
                floating
                value={draftCustomRangeEndDate}
                onChange={(date) => {
                  const nextEndDate = date
                    ? startOfDay(date)
                    : null;

                  setDraftCustomRangeEndDate(
                    nextEndDate
                  );

                  if (
                    nextEndDate &&
                    draftCustomRangeStartDate &&
                    nextEndDate <
                      startOfDay(
                        draftCustomRangeStartDate
                      )
                  ) {
                    setDraftCustomRangeStartDate(
                      nextEndDate
                    );
                  }
                }}
                minDate={
                  draftCustomRangeStartDate ||
                  undefined
                }
                maxDate={today}
                isDark={isDark}
                disablePortal
                format="MM/dd/yyyy"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={clearCustomRange}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "border-[#3D3D3D] bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
                    : "border-[#E3E3E3] bg-white text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                Clear Range
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleCustomRangeCancel}
                  className={
                    isDark
                      ? "border border-[#3D3D3D] bg-transparent text-white hover:bg-white/5"
                      : "border border-[#E3E3E3] bg-white text-black hover:bg-black/5"
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleCustomRangeApply}
                  disabled={
                    !draftCustomRangeStartDate ||
                    !draftCustomRangeEndDate
                  }
                  className="bg-[#E8D1AB] text-black hover:bg-[#d4c3a3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}