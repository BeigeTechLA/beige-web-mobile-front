"use client";

import React, { useState } from "react";
import {
  DatePicker as MuiDatePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

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

// Standard light theme tokens
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

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  colors?: Partial<DatePickerColors>;
  disabled?: boolean;
  format?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
  floating?: boolean;
  labelSx?: SxProps<Theme>;
  isDark?: boolean;
  disablePortal?: boolean;
  shouldDisableDate?: (date: Date) => boolean;
  borderRadius?: string;
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
  placeholder,
  sx,
  labelSx,
  floating = false,
  isDark = true,
  disablePortal = false,
  shouldDisableDate,
  borderRadius,
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
    "& .MuiDatePickerToolbar-title": { color: `${colors.calendarHeaderText} !important` },
    "& .MuiDatePickerToolbar-typography": { color: `${colors.calendarHeaderText} !important` },
    "& .MuiPickersCalendarHeader-label": { color: colors.calendarHeaderText },
    "& .MuiPickersCalendarHeader-switchViewIcon": { color: `${colors.navigationIconColor} !important` },
    "& .MuiPickersArrowSwitcher-button": { color: `${colors.navigationIconColor} !important` },

    // Year selection list text colors
    "& .MuiPickersYear-yearButton": {
      color: `${colors.dayNumberText} !important`,
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },
      "&:hover": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.1) !important" : "rgba(0, 0, 0, 0.10) !important"
      }
    },

    // Calendar Days
    "& .MuiDayCalendar-weekDayLabel": { color: colors.weekdayLabelText },
    "& .MuiPickersDay-root": {
      color: colors.dayNumberText,
      "&:hover": { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1) !important" : "rgba(0, 0, 0, 0.10) !important" },
      "&.Mui-selected": {
        backgroundColor: colors.accent,
        color: colors.accentText,
        "&:hover": { backgroundColor: colors.hoverAccent },
      },
      "&.MuiPickersDay-today": { borderColor: colors.accent },
      // Dynamic style for disabled days
      "&.Mui-disabled": {
        color: isDark ? "rgba(255, 255, 255, 0.2) !important" : "rgba(0, 0, 0, 0.50) !important",
        textDecoration: "line-through",
        opacity: 0.4,
      },
    },
    "& .MuiDialogActions-root button": { color: colors.accent, fontWeight: "bold" }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%", position: "relative" }}>
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
          label={floating ? label : undefined}
          value={value}
          onChange={onChange}
          format={format}
          open={open}
          onOpen={() => !disabled && setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          shouldDisableDate={shouldDisableDate}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: floating ? format.toUpperCase() : placeholder ?? format.toUpperCase(),
              onClick: () => !disabled && setOpen(true),
              InputLabelProps: {
                // shrink: floating ? (open || !!value) : undefined,
                shrink: floating ? true : (open || !!value),
                sx: {
                  color: colors.labelText,
                  fontSize: "16px",
                  "&.Mui-focused": { color: colors.accent },
                  "&.MuiInputLabel-shrink": {
                    transform: "translate(16px, -10px) scale(1)",
                    fontSize: "14px !important",
                    color: `${colors.labelText} !important`,
                    backgroundColor: colors.inputBackground,
                    padding: "0 8px",
                    zIndex: 1,
                  }
                }
              },
              sx: {
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  ...sx,
                  backgroundColor: colors.inputBackground,
                  borderRadius: borderRadius ?? "12px",
                  "& fieldset": { borderColor: colors.inputBorder, borderWidth: "1px" },
                  "&:hover fieldset": { borderColor: colors.inputBorder },
                  "&.Mui-focused fieldset": { borderColor: colors.inputBorderFocus, borderWidth: "1.5px" },
                  // Ensure the placeholder is visible even when not focused
                  "& input::placeholder": {
                    color: colors.mutedText,
                    opacity: 1,
                  },
                  "&.Mui-disabled fieldset": { borderColor: colors.inputDisabled },
                },
                "& .MuiInputBase-input": {
                  color: colors.inputText,
                  fontSize: "14px",
                  padding: floating ? "16.5px 14px" : "16px 14px",
                  height: "100%",
                  "&.Mui-disabled": {
                    WebkitTextFillColor: colors.inputText,
                    opacity: 0.5,
                  },
                },
                "& .MuiSvgIcon-root": {
                  color: colors.iconColor,
                  fontSize: "20px",
                  opacity: disabled ? 0.5 : 1,
                },
              },
            },
            popper: {
              disablePortal,
              sx: {
                zIndex: 1700,
                "& .MuiPaper-root": {
                  backgroundColor: colors.paperBackground,
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                  marginTop: "8px",
                  ...interiorStyles,
                },
              },
            },
            toolbar: {
              sx: {
                // Targets the "SELECT DATE" text label
                "& .MuiTypography-overline": {
                  color: isDark ? "rgba(255, 255, 255, 0.5) !important" : "rgba(0, 0, 0, 0.5) !important",
                  fontSize: "10px !important",
                  fontWeight: 600,
                  textTransform: "uppercase",
                },
                // Fallback: some versions use this specific class instead
                "& .MuiDatePickerToolbar-typography": {
                  color: isDark ? "rgba(255, 255, 255, 0.5) !important" : "rgba(0, 0, 0, 0.5) !important",
                },
                // Targets the actual selected date (e.g., "Tue, Feb 24")
                "& .MuiDatePickerToolbar-title": {
                  color: `${colors.calendarHeaderText} !important`,
                },
              },
            },
            // Style for Mobile dialog
            mobilePaper: {
              sx: {
                backgroundColor: colors.paperBackground,
                backgroundImage: "none",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
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
