"use client";

import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { useTheme } from "next-themes";
import { Calendar, X } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Box } from "@mui/material";

interface DateRangeButtonProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
  width?: string;
}

export const DateRangeButton: React.FC<DateRangeButtonProps> = ({
  startDate,
  endDate,
  onRangeChange,
  width,
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"start" | "end" | null>(null);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  const hasRange = !!startDate && !!endDate;
  const label = hasRange
    ? `${format(startDate!, "MMM dd, yyyy")} - ${format(endDate!, "MMM dd, yyyy")}`
    : "Sort by Date";

  const paperSx = {
    backgroundColor: isDark ? "#171717" : "#E8E8E8",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E3E3E3",
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
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ position: "relative" }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("start")}
            className={`shrink-0 flex items-center justify-between gap-1 lg:gap-3 px-3 py-1.5 lg:px-6 lg:py-3.5 transition-all text-xs lg:text-base lg:font-medium shadow-sm whitespace-nowrap rounded-full border ${
              width ? width : "w-fit"
            } ${
              isDark
                ? "bg-[#1A1A1A] border-white/10 text-[#C4C4C4] hover:text-white hover:border-white/30"
                : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
            }`}
          >
            <span className="whitespace-nowrap">{label}</span>
            <Calendar
              className={`w-4 h-4 lg:w-6 lg:h-6 shrink-0 ${
                isDark ? "text-[#C4C4C4]" : "text-[#323232]"
              }`}
            />
          </button>

          {hasRange && (
            <button
              type="button"
              onClick={() => {
                setPendingStart(null);
                setStep(null);
                onRangeChange(null, null);
              }}
              className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full border transition-all flex items-center justify-center ${
                isDark
                  ? "border-white/10 bg-[#1A1A1A] text-[#C4C4C4] hover:text-white hover:border-white/30"
                  : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
              }`}
              aria-label="Clear date filter"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          )}
        </div>

        {/* Step 1: start date */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            label="Start date"
            open={step === "start"}
            onClose={() => setStep((s) => (s === "start" ? null : s))}
            value={startDate}
            onChange={(v) => {
              if (!v) return;
              setPendingStart(startOfDay(v));
              setStep("end"); // go straight to end-date selection
            }}
            slotProps={{ desktopPaper: { sx: paperSx } }}
          />
        </div>

        {/* Step 2: end date (cannot be before start) */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            label="End date"
            open={step === "end"}
            onClose={() => setStep((s) => (s === "end" ? null : s))}
            value={endDate}
            minDate={pendingStart ?? undefined}
            onChange={(v) => {
              if (!v || !pendingStart) return;
              onRangeChange(pendingStart, startOfDay(v));
              setPendingStart(null);
              setStep(null);
            }}
            slotProps={{ desktopPaper: { sx: paperSx } }}
          />
        </div>
      </Box>
    </LocalizationProvider>
  );
};