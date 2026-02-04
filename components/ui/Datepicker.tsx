"use client";

import React, { useState } from "react";
import {
  DatePicker as MuiDatePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, Typography } from "@mui/material";

export interface DatePickerColors {
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  inputDisabled: string;
  labelText: string;
  iconColor: string;
  accent: string;
  accentText: string;
  hoverAccent: string;
  paperBackground: string;
  calendarHeaderText: string;
  weekdayLabelText: string;
  dayNumberText: string;
  navigationIconColor: string;
  mutedText: string;
}

const defaultColors: DatePickerColors = {
  inputBackground: "#000000",
  inputText: "#FFFFFF",
  inputBorder: "rgba(255, 255, 255, 0.1)",
  inputBorderHover: "rgba(255, 255, 255, 0.2)",
  inputBorderFocus: "#E8D1AB",
  labelText: "rgba(255, 255, 255, 0.4)",
  iconColor: "#FFFFFF",
  inputDisabled: "rgba(255, 255, 255, 0.3)",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#F2E2C6",
  paperBackground: "#1A1A1A",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "rgba(255, 255, 255, 0.6)",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#FFFFFF",
  mutedText: "rgba(255, 255, 255, 0.4)",
};

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  colors?: Partial<DatePickerColors>;
  disabled?: boolean;
  format?: string;
  sx?: any;
}

export const DatePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minDate,
  colors: customColors,
  disabled = false,
  format = "MM/dd/yyyy",
  sx,
}) => {
  const colors = { ...defaultColors, ...customColors };
  const [open, setOpen] = useState(false);

  const interiorStyles = {
    // Hide scrollbar in the Year selection dropdown
    "& .MuiYearCalendar-root": {
      scrollbarWidth: "none", // Firefox
      "&::-webkit-scrollbar": { display: "none" }, // Chrome/Safari
    },

    // --- NEW: Fix Mobile Toolbar Selected Date Text Color ---
    "& .MuiDatePickerToolbar-title": {
      color: "#FFFFFF !important", // Main Date Text
    },
    "& .MuiDatePickerToolbar-typography": {
      color: "#FFFFFF !important", // "SELECT DATE" label
    },

    // Month/Year Header Text and Arrow
    "& .MuiPickersCalendarHeader-label": { color: colors.calendarHeaderText },
    "& .MuiPickersCalendarHeader-switchViewIcon": { color: `${colors.navigationIconColor} !important` },
    "& .MuiPickersArrowSwitcher-button": { color: `${colors.navigationIconColor} !important` },

    // Year selection list text colors
    "& .MuiPickersYear-yearButton": {
      color: "#FFFFFF !important", // Makes year text white
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`, // Replaces blue bubble with Gold
        color: `${colors.accentText} !important`,
      },
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1) !important",
      }
    },

    // Calendar Days
    "& .MuiDayCalendar-weekDayLabel": { color: colors.weekdayLabelText },
    "& .MuiPickersDay-root": {
      color: colors.dayNumberText,
      "&:hover": { backgroundColor: `${colors.accent}22` },
      "&.Mui-selected": {
        backgroundColor: colors.accent,
        color: colors.accentText,
        "&:hover": { backgroundColor: colors.hoverAccent },
      },
      "&.MuiPickersDay-today": { borderColor: colors.accent },
      // Style for disabled days (past dates)
      "&.Mui-disabled": {
        color: "rgba(255, 255, 255, 0.2) !important",
        textDecoration: "line-through",
        opacity: 0.4,
      },
    },

    // Mobile Action Buttons (OK/Cancel)
    "& .MuiDialogActions-root button": {
      color: colors.accent,
      fontWeight: "bold",
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
        {label && (
          <Typography
            variant="body2"
            sx={{
              color: colors.labelText,
              fontWeight: "bold",
              mb: 1,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            {label}
          </Typography>
        )}

        <MuiDatePicker
          value={value}
          onChange={onChange}
          format={format}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={disabled}
          minDate={minDate}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: format.toUpperCase(),
              onClick: () => setOpen(true),
              sx: {
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  ...sx,
                  backgroundColor: colors.inputBackground,
                  borderRadius: "8px",
                  "& fieldset": { borderColor: colors.inputBorder, borderWidth: "1px" },
                  "&:hover fieldset": { borderColor: colors.inputBorderHover },
                  "&.Mui-focused fieldset": { borderColor: colors.inputBorderFocus, borderWidth: "1.5px" },
                },
                "& .MuiInputBase-input": {
                  color: colors.inputText,
                  fontSize: "14px",
                  padding: "16px 14px",
                  height: "100%",
                },
                "& .MuiSvgIcon-root": { color: colors.iconColor, fontSize: "20px" },
              },
            },
            popper: {
              sx: {
                "& .MuiPaper-root": {
                  backgroundColor: colors.paperBackground,
                  border: "1px solid rgba(255,255,255,0.1)",
                  marginTop: "8px",
                  ...interiorStyles,
                },
              },
            },
            toolbar: {
              sx: {
                // Targets the "SELECT DATE" text label
                "& .MuiTypography-overline": {
                  color: "rgba(255, 255, 255, 0.5) !important",
                  fontSize: "10px !important",
                  fontWeight: 600,
                  textTransform: "uppercase",
                },
                // Fallback: some versions use this specific class instead
                "& .MuiDatePickerToolbar-typography": {
                  color: "rgba(255, 255, 255, 0.5) !important",
                },
                // Targets the actual selected date (e.g., "Tue, Feb 24")
                "& .MuiDatePickerToolbar-title": {
                  color: "#FFFFFF !important",
                },
              },
            },
            // Style for Mobile dialog
            mobilePaper: {
              sx: {
                backgroundColor: colors.paperBackground,
                backgroundImage: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                ...interiorStyles,
              }
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DatePicker;