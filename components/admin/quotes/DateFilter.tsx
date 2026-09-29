"use client";

import React, { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear } from "date-fns";
import { ChevronDown, X } from "lucide-react";
import { Box } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DesktopDatePicker } from "@mui/x-date-pickers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onChange?: (
    preset: DatePreset,
    dateRange: DateFilterRange,
    customDate: Date | null
  ) => void;
}

export default function DateFilter({
  isDark = true,
  value,
  selectedDate: externalSelectedDate,
  onChange,
}: DateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>(value || "all");
  const [customDate, setCustomDate] = useState<Date | null>(
    externalSelectedDate || null
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper function to resolve date ranges based on preset selected
  const getDateRangeForPreset = (
    selectedPreset: DatePreset,
    custom: Date | null
  ): DateFilterRange => {
    const today = new Date();

    switch (selectedPreset) {
      case "today":
        return { startDate: today, endDate: today };
      case "yesterday": {
        const yest = subDays(today, 1);
        return { startDate: yest, endDate: yest };
      }
      case "last7Days":
        return { startDate: subDays(today, 7), endDate: today };
      case "last30Days":
        return { startDate: subDays(today, 30), endDate: today };
      case "thisMonth":
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case "lastMonth": {
        const prevMonth = subMonths(today, 1);
        return {
          startDate: startOfMonth(prevMonth),
          endDate: endOfMonth(prevMonth),
        };
      }
      case "thisQuarter":
        return { startDate: startOfQuarter(today), endDate: endOfQuarter(today) };
      case "lastQuarter": {
        const prevQuarter = subQuarters(today, 1);
        return {
          startDate: startOfQuarter(prevQuarter),
          endDate: endOfQuarter(prevQuarter),
        };
      }
      case "yearToDate":
        return { startDate: startOfYear(today), endDate: today };
      case "custom":
        return { startDate: custom, endDate: custom };
      case "all":
      default:
        return { startDate: null, endDate: null };
    }
  };

  const handlePresetChange = (val: string) => {
    const newPreset = val as DatePreset;
    setPreset(newPreset);

    if (newPreset === "custom") {
      setIsCalendarOpen(true);
    } else {
      setCustomDate(null);
      const range = getDateRangeForPreset(newPreset, null);
      onChange?.(newPreset, range, null);
    }
  };

  const handleCustomDateChange = (newDate: Date | null) => {
    setCustomDate(newDate);
    setIsCalendarOpen(false);
    if (newDate) {
      const range = getDateRangeForPreset("custom", newDate);
      onChange?.("custom", range, newDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreset("all");
    setCustomDate(null);
    setIsCalendarOpen(false);
    onChange?.("all", { startDate: null, endDate: null }, null);
  };

  // Label displayed inside Select trigger
  const renderTriggerLabel = () => {
    if (preset === "custom" && customDate) {
      return format(customDate, "MMM dd, yyyy");
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
      custom: customDate ? format(customDate, "MMM dd, yyyy") : "Custom Date",
    };

    return labels[preset] || "Date Filter";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ position: "relative" }} className="inline-flex items-center gap-2 lg:min-w-30">
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger
            className={`h-12 p-2.5 lg:p-4 rounded-lg lg:rounded-xl text-xs lg:text-sm medium focus:ring-[#E5D5B8]/40 ${
              isDark
                ? "border-white/20 bg-[#202020] text-white"
                : "border-[#E3E3E3] bg-[#E8E8E8] text-[#323232] hover:opacity-80"
            }`}
          >
            <SelectValue placeholder="Date Filter" className="text-sm medium">
              {renderTriggerLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            className={
              isDark
                ? "border-white/20 bg-[#161616] text-white text-sm medium"
                : "border-[#E3E3E3] bg-white text-black text-sm medium"
            }
          >
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last7Days">Last 7 Days</SelectItem>
            <SelectItem value="last30Days">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="thisQuarter">This Quarter</SelectItem>
            <SelectItem value="lastQuarter">Last Quarter</SelectItem>
            <SelectItem value="yearToDate">Year to Date</SelectItem>
            <SelectItem value="custom">Custom Date...</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Button (Shown when filter is active) */}
        {/* {preset !== "all" && (
          <button
            type="button"
            onClick={handleClear}
            className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full border transition-all flex items-center justify-center shrink-0 ${
              isDark
                ? "border-white/10 bg-[#1A1A1A] text-[#C4C4C4] hover:text-white hover:border-white/30"
                : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
            }`}
            aria-label="Clear date filter"
          >
            <X className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        )} */}

        {/* Hidden MUI DatePicker (Triggered when Custom preset is selected) */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            open={isCalendarOpen}
            onOpen={() => setIsCalendarOpen(true)}
            onClose={() => setIsCalendarOpen(false)}
            value={customDate}
            onChange={handleCustomDateChange}
            slotProps={{
              desktopPaper: {
                sx: {
                  backgroundColor: isDark ? "#171717" : "#FFFFFF",
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid #E3E3E3",
                  borderRadius: "16px",
                  color: isDark ? "#fff" : "#323232",
                  "& .MuiPickersDay-root": {
                    color: isDark ? "#fff" : "#323232",
                    "&.Mui-selected": {
                      backgroundColor: "#E8D1AB",
                      color: "#000",
                      "&:hover": { backgroundColor: "#D4C3A3" },
                    },
                  },
                  "& .MuiTypography-root": {
                    color: isDark ? "rgba(255,255,255,0.6)" : "#323232CC",
                  },
                  "& .MuiSvgIcon-root": {
                    color: isDark ? "#E8D1AB" : "#323232CC",
                  },
                },
              },
            }}
          />
        </div>
      </Box>
    </LocalizationProvider>
  );
}