"use client";

import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useTheme } from "next-themes";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { Box } from "@mui/material";

interface SortDateButtonProps {
  onDateChange: (date: Date | null) => void;
  selectedDate: Date | null;
  width?: string;
}

export const SortDateButton: React.FC<SortDateButtonProps> = ({
  onDateChange,
  selectedDate,
  width
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
          {/* Styled Trigger Button */}
          <button
            onClick={() => setIsOpen(true)}
            className={`shrink-0 flex items-center justify-between gap-1 lg:gap-3 px-3 py-1.5 lg:px-6 lg:py-3.5 transition-all text-xs lg:text-base lg:font-medium shadow-sm whitespace-nowrap rounded-full border ${width ? width : "w-fit"
              } ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-[#C4C4C4] hover:text-white hover:border-white/30"
                : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"
              }`}
          >
            <span className="whitespace-nowrap">
              {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Sort by Date"}
            </span>
            <Calendar className={`w-4 h-4 lg:w-6 lg:h-6 shrink-0 ${isDark ? "text-[#C4C4C4]" : "text-[#323232]"
              }`} />
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={() => {
                onDateChange(null);
                setIsOpen(false);
              }}
              className={`h-8 w-8 lg:h-10 lg:w-10 rounded-full border transition-all flex items-center justify-center ${isDark ? "border-white/10 bg-[#1A1A1A] text-[#C4C4C4] hover:text-white hover:border-white/30" : "bg-[#E8E8E8] border-[#E3E3E3] text-[#323232] hover:opacity-80"}`}
              aria-label="Clear date filter"
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          )}
        </div>

        {/* Hidden MUI DatePicker */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            open={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            value={selectedDate}
            onChange={(newValue) => {
              onDateChange(newValue);
              setIsOpen(false);
            }}
            slotProps={{
              desktopPaper: {
                sx: {
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
