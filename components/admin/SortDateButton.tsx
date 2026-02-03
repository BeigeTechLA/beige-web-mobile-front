"use client";

import React, { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { Calendar } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ position: "relative" }}>
        {/* Styled Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`shrink-0 flex items-center justify-between gap-1 lg:gap-3 px-3 py-1.5 lg:px-6 lg:py-3.5 bg-[#1A1A1A] border border-white/10 rounded-full text-[#C4C4C4] hover:text-white hover:border-white/30 transition-all text-xs lg:text-base lg:font-medium shadow-sm whitespace-nowrap ${width ? width : "w-fit"}`}
        >
          <span className="whitespace-nowrap">
            {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Sort by Date"}
          </span>
          <Calendar className="w-4 h-4 lg:w-6 lg:h-6 text-[#C4C4C4] shrink-0" />
        </button>

        {/* Hidden MUI DatePicker */}
        <div className="invisible absolute top-0 left-0 h-0 w-0">
          <DesktopDatePicker
            open={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            value={selectedDate}
            onChange={(newValue) => {
                onDateChange(newValue);
                setIsOpen(false); // Close after selection
            }}
            slotProps={{
              desktopPaper: {
                sx: {
                  backgroundColor: "#171717",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  color: "#fff",
                  "& .MuiPickersDay-root": {
                    color: "#fff",
                    "&.Mui-selected": {
                      backgroundColor: "#E8D1AB",
                      color: "#000",
                      "&:hover": { backgroundColor: "#D4C3A3" },
                    },
                  },
                  "& .MuiTypography-root": { color: "rgba(255,255,255,0.6)" },
                  "& .MuiSvgIcon-root": { color: "#E8D1AB" },
                },
              },
            }}
          />
        </div>
      </Box>
    </LocalizationProvider>
  );
};