"use client";

import React, { useMemo, useState } from "react";
import {
  TimePicker as MuiTimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, Typography } from "@mui/material";

export interface TimePickerColors {
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
  clockNumberColor: string;
  mutedText: string;
  placeholderColor: string;
  popperBorder: string;
  menuItemHover: string;
}

const themeColors: { dark: TimePickerColors; light: TimePickerColors } = {
  dark: {
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
    clockNumberColor: "#FFFFFF",
    mutedText: "rgba(255, 255, 255, 0.4)",
    placeholderColor: "rgba(255, 255, 255, 0.3)",
    popperBorder: "rgba(255, 255, 255, 0.1)",
    menuItemHover: "rgba(255, 255, 255, 0.08)",
  },
  light: {
    inputBackground: "#FFFFFF",
    inputText: "#101010",
    inputBorder: "rgba(0, 0, 0, 0.15)",
    inputBorderHover: "rgba(0, 0, 0, 0.3)",
    inputBorderFocus: "#00000073",
    labelText: "rgba(0, 0, 0, 0.6)",
    iconColor: "#101010",
    inputDisabled: "rgba(0, 0, 0, 0.25)",
    accent: "#E8D1AB",
    accentText: "#000000",
    hoverAccent: "#E8D1AB",
    paperBackground: "#FFFFFF",
    clockNumberColor: "#101010",
    mutedText: "rgba(0, 0, 0, 0.5)",
    placeholderColor: "rgba(0, 0, 0, 0.35)",
    popperBorder: "rgba(0, 0, 0, 0.1)",
    menuItemHover: "rgba(0, 0, 0, 0.04)",
  },
};

interface Props {
  label: string;
  value: Date | null;
  onChange: (time: Date | null) => void;
  minTime?: Date;
  colors?: Partial<TimePickerColors>;
  disabled?: boolean;
  isDark?: boolean;
  floating?: boolean;
}

export const TimePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minTime,
  colors: customColors,
  disabled = false,
  isDark = true,
  floating = false,
}) => {
  const baseColors = isDark ? themeColors.dark : themeColors.light;
  const colors = { ...baseColors, ...customColors };
  const [open, setOpen] = useState(false);

  const interiorStyles = {
    // Hide Scrollbars for Mobile/Clock view
    "&::-webkit-scrollbar": { display: "none" },
    "&": { scrollbarWidth: "none", msOverflowStyle: "none" },

    "& .MuiClock-pin": { backgroundColor: colors.accent },
    "& .MuiClockPointer-root": { backgroundColor: colors.accent },
    "& .MuiClockPointer-thumb": {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    "& .MuiClockNumber-root": { color: colors.clockNumberColor },
    "& .MuiClockNumber-root.Mui-selected": { color: colors.accentText },

    "& .MuiMenuItem-root.Mui-selected": {
      backgroundColor: `${colors.accent} !important`,
      color: `${colors.accentText} !important`,
    },
    "& .MuiMenuItem-root:hover": {
      backgroundColor: colors.menuItemHover,
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
        {!floating && (
          <Typography
            variant="body2"
            sx={{
              color: colors.labelText,
              fontWeight: "bold",
              mb: 1,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </Typography>
        )}

        <MuiTimePicker
          label={floating ? label : undefined}
          value={value}
          onChange={onChange}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={disabled}
          minTime={minTime}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: "HH:MM am/pm",
              onClick: () => !disabled && setOpen(true),
              sx: {
                "& .MuiInputLabel-root": {
                  color: colors.labelText,
                  fontSize: "14px",
                  ...(floating
                    ? {
                      transform: "translate(14px, 21px) scale(1)",
                      lineHeight: "20px",
                    }
                    : {}),
                  "&.Mui-focused": { color: colors.accent },
                  "&.MuiInputLabel-shrink": {
                    transform: "translate(14px, -8px) scale(1)",
                    fontSize: "14px !important",
                    color: `${colors.labelText} !important`,
                    backgroundColor: colors.inputBackground,
                    padding: "0 8px",
                    zIndex: 1,
                  },
                },
                "& .MuiOutlinedInput-root": {
                  height: floating ? "82px" : "48px",
                  backgroundColor: colors.inputBackground,
                  borderRadius: floating ? "10px" : "8px",
                  display: "flex",
                  alignItems: "center",
                  paddingRight: "12px",
                  "& fieldset": {
                    borderColor: colors.inputBorder,
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor: colors.inputBorderHover,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.inputBorderFocus,
                    borderWidth: "1.5px",
                  },
                  "&.Mui-disabled fieldset": {
                    borderColor: colors.inputDisabled,
                    opacity: 0.6,
                  },
                },
                "& .MuiInputBase-input": {
                  color: colors.inputText,
                  fontSize: "14px",
                  padding: "0 14px",
                  height: "100%",
                  "&::placeholder": {
                    color: colors.placeholderColor,
                    opacity: 1,
                  },
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
              sx: {
                "& .MuiPaper-root": {
                  backgroundColor: colors.paperBackground,
                  backgroundImage: "none",
                  border: `1px solid ${colors.popperBorder}`,
                  color: colors.inputText,
                  marginTop: "8px",
                  ...interiorStyles,
                },
                // THE SPECIFIC FIX: Targeting the list sections to hide scrollbars
                "& .MuiMultiSectionDigitalClockSection-root": {
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE
                  "&::-webkit-scrollbar": {
                    display: "none", // Chrome/Safari
                  },
                },
              },
            },
            actionBar: {
              sx: {
                backgroundColor: colors.paperBackground,
                "& .MuiButton-root": {
                  color: colors.accent,
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: colors.menuItemHover,
                  },
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TimePicker;
