"use client";

import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useTheme } from "next-themes";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { Box } from "@mui/material";

interface DatePickerFloatingProps {
  onDateChange: (date: Date | null) => void;
  selectedDate: Date | null;
  minDate?: Date;
  width?: string;
  classnames?: string;
  labelClasses?: string;
  label?: string;
}

export const DatePickerFloating: React.FC<DatePickerFloatingProps> = ({
  onDateChange,
  selectedDate,
  minDate,
  width,
  classnames,
  labelClasses,
  label = "Payment Date",
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Default to dark mode logic
  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ position: "relative" }}>
        <div className="flex items-center gap-2">
          
          {/* Outlined Floating-Label Field Trigger Component */}
          <div 
            onClick={() => setIsOpen(true)}
            className={`relative rounded-lg border px-4 py-2 transition-colors cursor-pointer flex items-center justify-between group ${
              width ? width : "w-full min-w-[240px]"
            } ${
              isDark 
                ? "border-[#5A5A5F] bg-black text-white" 
                : "border-[#CACACA] bg-white text-black"
            } ${classnames}`}
          >
            {/* Top-Intersecting Floating Label Field Tag */}
            <div className="absolute -top-2.5 left-3 px-1 z-10 bg-inherit">
              <span className={`font-medium ${isDark ? "text-white/60" : "text-black/60"} ${labelClasses}`}>
                {label}
              </span>
            </div>

            {/* Simulated Input Field Readout Text Content */}
            <div className="h-10 flex items-center text-sm outline-none bg-transparent">
              {selectedDate ? (
                format(selectedDate, "MM-dd-yyyy")
              ) : (
                <span className={isDark ? "text-white/30" : "text-black/30"}>MM-DD-YYYY</span>
              )}
            </div>

            {/* Action Icon Controls Module */}
            <div className="flex items-center gap-2">
              {selectedDate ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid firing modal open wrapper trigger context
                    onDateChange(null);
                    setIsOpen(false);
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60"
                  }`}
                  aria-label="Clear date filter"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Calendar 
                  className={`w-5 h-5 shrink-0 transition-opacity group-hover:opacity-100 ${
                    isDark ? "text-white/60" : "text-black/60"
                  }`} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Hidden Underlying Managed MUI DatePicker Engine Portal */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            open={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            value={selectedDate}
            onChange={(newValue) => {
              if (minDate && newValue && newValue < minDate) {
                setIsOpen(false);
                return;
              }
              onDateChange(newValue);
              setIsOpen(false);
            }}
            minDate={minDate}
            slotProps={{
              desktopPaper: {
                sx: {
                  backgroundColor: isDark ? "#171717" : "#E8E8E8",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E3E3E3",
                  borderRadius: "16px",
                  color: isDark ? "#fff" : "#323232",
                  "& .MuiPickersCalendarHeader-label": {
                    color: isDark ? "#fff" : "#323232",
                  },
                  "& .MuiPickersArrowSwitcher-button": {
                    color: "#E8D1AB",
                    "&:hover": {
                      backgroundColor: isDark ? "rgba(232, 209, 171, 0.12)" : "rgba(232, 209, 171, 0.3)",
                    },
                  },
                  "& .MuiPickersDay-root": {
                    color: isDark ? "#fff" : "#323232",
                    "&:hover": {
                      backgroundColor: isDark ? "rgba(232, 209, 171, 0.14)" : "rgba(232, 209, 171, 0.35)",
                    },
                    "&.MuiPickersDay-today": {
                      borderColor: "#E8D1AB",
                    },
                    "&.Mui-selected, &.Mui-selected:focus, &.Mui-selected:hover": {
                      backgroundColor: "#E8D1AB",
                      color: "#000",
                    },
                    "&.Mui-disabled": {
                      color: isDark ? "rgba(255,255,255,0.22)" : "rgba(50,50,50,0.24)",
                      opacity: 0.45,
                      textDecoration: "line-through",
                    },
                    "&.Mui-disabled:hover": {
                      backgroundColor: "transparent",
                    },
                  },
                  "& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected": {
                    backgroundColor: "#E8D1AB",
                    color: "#000",
                    "&:hover, &:focus": {
                      backgroundColor: "#D4C3A3",
                    },
                  },
                  "& .MuiTypography-root": {
                    color: isDark ? "rgba(255,255,255,0.6)" : "#323232CC"
                  },
                  "& .MuiSvgIcon-root": {
                    color: isDark ? "#E8D1AB" : "#323232CC"
                  },
                },
              },
            }}
          />
        </div>
      </Box>
    </LocalizationProvider>
  );
};
