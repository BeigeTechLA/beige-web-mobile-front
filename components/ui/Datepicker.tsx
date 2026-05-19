"use client";

import React, { useState } from "react";
import {
  DatePicker as MuiDatePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export const datePickerColours = {
  inputBackground: "#101010",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "#ffffff99",
  iconColor: "#FFFFFF",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#E8D1AB",
  paperBackground: "#101010",
  mobileCalendarBackground: "#101010",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",
  desktopTimeAccent: "#E8D1AB",
  mobileSelectedText: "#101010",
  toolbarText: "#FFFFFF",
  selectedHeaderDateTime: "#E8D1AB",
  clockNumberColor: "#FFFFFF",
  tabIconColor: "#ffffff99",
  tabIconSelected: "#E8D1AB",
  inputDisabled: "#ffffff33",
  mutedText: "#ffffff66",
  desktopCalendarText: "#FFFFFF",
};
// Standard dark theme tokens
const darkTheme: DatePickerColors = {
  inputBackground: "#101010",
  inputText: "#FFFFFF",
  inputBorder: "rgba(255, 255, 255, 0.3)",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  inputDisabled: "rgba(255, 255, 255, 0.1)",
  labelText: "rgba(255, 255, 255, 0.6)",
  iconColor: "#FFFFFF",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#F2E2C6",
  paperBackground: "#101010",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "rgba(255, 255, 255, 0.6)",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",
  mutedText: "rgba(255, 255, 255, 0.4)",
};

// Standard light theme tokens based on your instructions
const lightTheme: DatePickerColors = {
  inputBackground: "#FFFFFF",
  inputText: "#2C2C2C",
  inputBorder: "#0000004D",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  inputDisabled: "rgba(0, 0, 0, 0.1)",
  labelText: "rgba(0, 0, 0, 0.6)",
  iconColor: "#2C2C2C",
  accent: "#E8D1AB",
  accentText: "#FFFFFF",
  hoverAccent: "#F2E2C6",
  paperBackground: "#FFFFFF",
  calendarHeaderText: "#2C2C2C",
  weekdayLabelText: "rgba(0, 0, 0, 0.6)",
  dayNumberText: "#2C2C2C",
  navigationIconColor: "#E8D1AB",
  mutedText: "rgba(0, 0, 0, 0.4)",
};

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

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  colors?: Partial<DatePickerColors>;
  disabled?: boolean;
  format?: string;
  sx?: SxProps<Theme>;
  floating?: boolean;
  labelSx?: SxProps<Theme>;
  isDark?: boolean;
  disablePortal?: boolean;
}

export const DatePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  colors: customColors,
  disabled = false,
  format = "MM/dd/yyyy",
  sx,
  labelSx,
  floating = false, // Default to your original top-label style
  isDark = true,
  disablePortal = false,
}) => {
  const activeTheme = isDark ? darkTheme : lightTheme;
  const colors = { ...activeTheme, ...customColors };
  const [open, setOpen] = useState(false);

  const interiorStyles = {
    // Hide scrollbar in the Year selection dropdown
    "& .MuiYearCalendar-root": {
      scrollbarWidth: "none", // Firefox
      "&::-webkit-scrollbar": { display: "none" }, // Chrome/Safari
    },
    "& .MuiDatePickerToolbar-title": { color: "#FFFFFF !important" },
    "& .MuiDatePickerToolbar-typography": { color: "#FFFFFF !important" },
    "& .MuiPickersCalendarHeader-label": { color: colors.calendarHeaderText },
    "& .MuiPickersCalendarHeader-switchViewIcon": { color: `${colors.navigationIconColor} !important` },
    "& .MuiPickersArrowSwitcher-button": { color: `${colors.navigationIconColor} !important` },

    // Year selection list text colors
    "& .MuiPickersYear-yearButton": {
      color: "#FFFFFF !important", // Makes year text white
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1) !important" }
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
    "& .MuiDialogActions-root button": { color: colors.accent, fontWeight: "bold" }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%", position: "relative" }}>
        {/* Render traditional top label only if NOT floating */}
        {label && !floating && (
          <Typography
            variant="body2"
            sx={{
              color: colors.labelText,
              fontWeight: "bold",
              mb: 1,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              ...labelSx,
            }}
          >
            {label}
          </Typography>
        )}

        <MuiDatePicker
          label={floating ? label : undefined} // Pass label to MUI if floating
          value={value}
          onChange={onChange}
          format={format}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: floating ? "" : format.toUpperCase(),
              onClick: () => setOpen(true),
              // Force label to stay floating even without value if desired, 
              // or let it animate naturally.
              InputLabelProps: {
                shrink: floating ? (open || !!value) : undefined,
                sx: {
                  color: colors.labelText,
                  fontSize: "14px",
                  "&.Mui-focused": { color: colors.accent },
                  // Adjusting position for the notched look
                  "&.MuiInputLabel-shrink": {
                    transform: "translate(14px, -10px) scale(1)",
                    fontSize: "14px !important",
                    color: "#FFFFFF66 !important", // Force white color
                    backgroundColor: colors.inputBackground,
                    padding: "0 8px", // Slightly more padding for the 14px text notch
                    zIndex: 1,
                  }
                }
              },
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
                  padding: floating ? "16.5px 14px" : "16px 14px", // Tiny tweak for alignment
                  height: "100%",
                },
                "& .MuiSvgIcon-root": { color: colors.iconColor, fontSize: "20px" },
              },
            },
            popper: {
              disablePortal,
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
