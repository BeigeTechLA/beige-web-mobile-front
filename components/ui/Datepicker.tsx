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
  accentText: "#2C2C2C",
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
  borderRadius?: string | number | object | (string | number)[];
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
  borderRadius,
}) => {
  const activeTheme = isDark ? darkTheme : lightTheme;
  const colors = {
    ...activeTheme,
    ...customColors,
  };

  const [open, setOpen] = useState(false);

  const interiorStyles = {
    "& .MuiYearCalendar-root": {
      scrollbarWidth: "none",

      "&::-webkit-scrollbar": {
        display: "none",
      },
    },

    "& .MuiDatePickerToolbar-title": {
      color: `${colors.calendarHeaderText} !important`,
    },

    "& .MuiDatePickerToolbar-typography": {
      color: `${colors.calendarHeaderText} !important`,
    },

    "& .MuiPickersCalendarHeader-label": {
      color: colors.calendarHeaderText,
    },

    "& .MuiPickersCalendarHeader-switchViewIcon": {
      color: `${colors.navigationIconColor} !important`,
    },

    "& .MuiPickersArrowSwitcher-button": {
      color: `${colors.navigationIconColor} !important`,
    },

    "& .MuiPickersYear-yearButton": {
      color: `${colors.dayNumberText} !important`,

      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },

      "&:hover": {
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.1) !important"
          : "rgba(0, 0, 0, 0.10) !important",
      },
    },

    "& .MuiDayCalendar-weekDayLabel": {
      color: colors.weekdayLabelText,
    },

    "& .MuiPickersDay-root": {
      color: colors.dayNumberText,

      "&:hover": {
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.1) !important"
          : "rgba(0, 0, 0, 0.10) !important",
      },

      "&.Mui-selected": {
        backgroundColor: colors.accent,
        color: colors.accentText,

        "&:hover": {
          backgroundColor: colors.hoverAccent,
        },
      },

      "&.MuiPickersDay-today": {
        borderColor: colors.accent,
      },

      "&.Mui-disabled": {
        color: isDark
          ? "rgba(255, 255, 255, 0.2) !important"
          : "rgba(0, 0, 0, 0.50) !important",
        textDecoration: "line-through",
        opacity: 0.4,
      },
    },

    "& .MuiDialogActions-root button": {
      color: colors.accent,
      fontWeight: "bold",
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          width: "100%",
          position: "relative",
          overflow: "visible",
        }}
      >
        {!floating && label && (
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

        <Box
          sx={{
            width: "100%",
            position: "relative",
          }}
        >
          {floating && label && (
            <Typography
              component="span"
              sx={{
                position: "absolute",
                top: 0,
                left: "16px",
                transform: "translateY(-50%)",
                zIndex: 3,

                display: "inline-flex",
                alignItems: "center",

                px: "6px",

                backgroundColor: colors.inputBackground,
                color: colors.labelText,

                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "18px",

                pointerEvents: "none",

                ...labelSx,
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
            onOpen={() => {
              if (!disabled) {
                setOpen(true);
              }
            }}
            onClose={() => {
              setOpen(false);
            }}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
            slotProps={{
              textField: {
                fullWidth: true,

                placeholder: placeholder ?? format.toUpperCase(),

                onClick: () => {
                  if (!disabled) {
                    setOpen(true);
                  }
                },

                sx: {
                  width: "100%",

                  "& .MuiOutlinedInput-root": {
                    height: "100%",
                    minHeight: "54px",

                    ...sx,

                    backgroundColor: colors.inputBackground,

                    borderRadius: borderRadius
                      ? borderRadius
                      : "12px",

                    "& fieldset": {
                      borderColor: colors.inputBorder,
                      borderWidth: "1px",

                      // Important:
                      // keep a normal complete border.
                      // We are not using MUI's label notch.
                      top: 0,
                    },

                    "& legend": {
                      display: "none",
                    },

                    "&:hover fieldset": {
                      borderColor: colors.inputBorderHover,
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: colors.inputBorderFocus,
                      borderWidth: "1.5px",
                    },

                    "&.Mui-disabled": {
                      backgroundColor: colors.inputDisabled,
                    },

                    "&.Mui-disabled fieldset": {
                      borderColor: colors.inputDisabled,
                    },
                  },

                  "& .MuiInputBase-input": {
                    color: colors.inputText,
                    fontSize: "14px",
                    padding: "16.5px 14px",
                    height: "100%",
                    boxSizing: "border-box",

                    "&::placeholder": {
                      color: colors.mutedText,
                      opacity: 1,
                    },

                    "&.Mui-disabled": {
                      WebkitTextFillColor: colors.inputText,
                      opacity: 0.5,
                    },
                  },

                  "& .MuiInputAdornment-root": {
                    marginLeft: "4px",
                  },

                  "& .MuiIconButton-root": {
                    color: colors.iconColor,
                    padding: "8px",

                    "&:hover": {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.05)",
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
                    backgroundImage: "none",

                    border: isDark
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(0,0,0,0.1)",

                    marginTop: "8px",

                    ...interiorStyles,
                  },
                },
              },

              toolbar: {
                sx: {
                  "& .MuiTypography-overline": {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.5) !important"
                      : "rgba(0, 0, 0, 0.5) !important",

                    fontSize: "10px !important",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  },

                  "& .MuiDatePickerToolbar-typography": {
                    color: isDark
                      ? "rgba(255, 255, 255, 0.5) !important"
                      : "rgba(0, 0, 0, 0.5) !important",
                  },

                  "& .MuiDatePickerToolbar-title": {
                    color: `${colors.calendarHeaderText} !important`,
                  },
                },
              },

              mobilePaper: {
                sx: {
                  backgroundColor: colors.paperBackground,
                  backgroundImage: "none",

                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(0,0,0,0.1)",

                  ...interiorStyles,
                },
              },
            }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DatePicker;