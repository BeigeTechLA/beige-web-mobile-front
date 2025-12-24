"use client";

import React, { useMemo, useState } from "react";
import {
  DateTimePicker as MuiDateTimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export interface DateTimePickerColors {
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  labelText: string;
  iconColor: string;
  accent: string;
  accentText: string;
  hoverAccent: string;
  paperBackground: string;
  toolbarText: string;
  mutedText: string;
  calendarHeaderText: string;
  weekdayLabelText: string;
  dayNumberText: string;
  navigationIconColor: string;
  clockNumberColor: string;
  desktopTimeAccent: string;
  mobileSelectedText: string;
  selectedHeaderDateTime: string;
  tabIconColor: string;
  tabIconSelected: string;
  mobileCalendarBackground: string;
  desktopCalendarText: string;
}

const defaultColors: DateTimePickerColors = {
  inputBackground: "#101010",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "#ffffff99",
  iconColor: "#E8D1AB",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#E8D1AB",
  paperBackground: "#101010",
  toolbarText: "#FFFFFF",
  mutedText: "#ffffff99",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",
  clockNumberColor: "#FFFFFF",
  desktopTimeAccent: "#E8D1AB",
  mobileSelectedText: "#101010",
  selectedHeaderDateTime: "#E8D1AB",
  tabIconColor: "#ffffff99",
  tabIconSelected: "#E8D1AB",
  mobileCalendarBackground: "#101010",
  desktopCalendarText: "#FFFFFF",
};

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDateTime?: Date;
  validate?: (date: Date | null) => string | null;
  colors?: Partial<DateTimePickerColors>;
}

export const DateTimePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minDateTime,
  validate,
  colors: customColors,
}) => {
  const colors = { ...defaultColors, ...customColors };
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const effectiveMinDateTime = minDateTime ?? now;

  const handleChange = (date: Date | null) => {
    if (validate) setError(validate(date));
    else setError(null);
    onChange(date);
  };

  const interiorStyles = {
    "& .MuiPickersCalendarHeader-label": { color: `${colors.calendarHeaderText} !important` },
    "& .MuiPickersArrowSwitcher-button": { color: `${colors.navigationIconColor} !important` },
    "& .MuiDayCalendar-weekDayLabel": { color: `${colors.weekdayLabelText} !important` },

    // Day Selection
    "& .MuiPickersDay-root": {
      color: `${colors.dayNumberText} !important`,
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },
      "&.MuiPickersDay-today": {
        borderColor: `${colors.accent} !important`,
      }
    },

    // Year Selector
    "& .MuiYearCalendar-root .MuiPickersYear-yearButton": {
      color: `${colors.dayNumberText} !important`,
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },
    },

    // Time Section items
    "& .MuiMultiSectionDigitalClockSection-item": {
      color: `${colors.dayNumberText} !important`,
      "&.Mui-selected": {
        backgroundColor: `${colors.accent} !important`,
        color: `${colors.accentText} !important`,
      },
    },

    // Clock Pointer/Pin
    "& .MuiClock-pin": { backgroundColor: `${colors.accent} !important` },
    "& .MuiClockPointer-root": { backgroundColor: `${colors.accent} !important` },
    "& .MuiClockPointer-thumb": {
      backgroundColor: `${colors.accent} !important`,
      borderColor: `${colors.accent} !important`
    },
    "& .MuiClockNumber-root": { color: `${colors.clockNumberColor} !important` },
    "& .MuiClockNumber-root.Mui-selected": { color: `${colors.mobileSelectedText} !important` },
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      localeText={{ dateTimePickerToolbarTitle: "Select Date & Time" }}
    >
      <MuiDateTimePicker
        label={label}
        value={value}
        onChange={handleChange}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        minDateTime={effectiveMinDateTime}
        shouldDisableTime={(timeValue, clockType) => {
          if (!value) return false;
          const now = new Date();
          const selectedDate = value as Date;
          const isToday = selectedDate.toDateString() === now.toDateString();
          if (!isToday) return false;
          const time = Number(timeValue);
          if (clockType === "hours") return time < now.getHours();
          if (clockType === "minutes") {
            return selectedDate.getHours() === now.getHours() && time < now.getMinutes();
          }
          return false;
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            error: Boolean(error),
            helperText: error,
            onClick: () => setOpen(true),
            InputLabelProps: { shrink: true },
            sx: {
              cursor: "pointer",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: colors.inputBackground,
                height: { xs: "56px", md: "82px" },
                paddingLeft: "12px",
                fontSize: { xs: "14px", md: "16px" },
                color: colors.inputText,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.inputBorder },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.inputBorderHover },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${colors.inputBorderFocus} !important`,
                },
              },
              "& .MuiInputLabel-root": {
                color: `${colors.labelText} !important`,
                backgroundColor: colors.inputBackground,
                fontSize: { xs: "14px", md: "18px" },
                padding: "0px 6px",
                marginLeft: "2px",
                transform: "translate(14px, -12px) scale(0.85)",
              },
              "& .MuiInputBase-input": { paddingTop: "20px", fontSize: "16px" },
              "& .MuiSvgIcon-root": { color: colors.iconColor },
            },
          },
          mobilePaper: {
            sx: {
              "& .MuiPaper-root": { borderRadius: "16px" },
              backgroundColor: colors.mobileCalendarBackground,
              backgroundImage: "none",
              ...interiorStyles,
              "& .MuiDateTimePickerToolbar-root": {
                padding: "20px",
                backgroundColor: colors.mobileCalendarBackground,
                "& .MuiTypography-overline": {
                  textTransform: "none !important",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: `${colors.mutedText} !important`
                }
              },
              "& .MuiDateTimePickerToolbar-root *": { color: `${colors.selectedHeaderDateTime} !important` },

              "& .MuiPickersToolbar-content": {
                display: "flex !important",
                flexDirection: "row !important",
                alignItems: "baseline !important",
                gap: "4px",
                "& .MuiDateTimePickerToolbar-dateContainer, & .MuiDateTimePickerToolbar-timeContainer": {
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  "& span, & h4": {
                    fontSize: "20px !important",
                    fontWeight: "700 !important",
                    lineHeight: "1 !important",
                  }
                },
                "& .MuiDateTimePickerToolbar-separator": {
                  fontSize: "22px !important",
                  fontWeight: "700 !important",
                  margin: "0 2px",
                  display: "inline-flex",
                  alignSelf: "center",
                },
                "& .MuiDateTimePickerToolbar-ampmSelection": {
                  display: "flex",
                  flexDirection: "row",
                  marginLeft: "8px",
                  gap: "6px",
                  "& .MuiButtonBase-root": {
                    padding: "2px 4px",
                    minWidth: "auto",
                    borderRadius: "4px",
                    "& .MuiTypography-root": { fontSize: "12px !important", fontWeight: "500" },
                    "&.Mui-selected": { backgroundColor: "transparent" },
                    "&:hover": { backgroundColor: `${colors.accent} !important` }
                  }
                }
              },
              "& .MuiTabs-indicator": { backgroundColor: `${colors.tabIconSelected} !important` },
              "& .MuiTab-root": { color: colors.tabIconColor },
              "& .MuiTab-root.Mui-selected": { color: `${colors.tabIconSelected} !important` },
            },
          },
          popper: {
            sx: {
              "& .MuiPaper-root": {
                borderRadius: "12px",
                padding: "12px",
                backgroundColor: colors.paperBackground,
                backgroundImage: "none",
                ...interiorStyles,
                "& .MuiTabs-indicator": { backgroundColor: colors.tabIconSelected },
                "& .MuiTab-root.Mui-selected": { color: `${colors.tabIconSelected} !important` },
              },
            },
          },
          actionBar: {
            sx: {
              backgroundColor: colors.paperBackground,
              "& .MuiButton-root": {
                color: `${colors.accent} !important`,
                fontWeight: "bold"
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};