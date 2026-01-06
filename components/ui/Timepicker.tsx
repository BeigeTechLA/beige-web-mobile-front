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
}

const defaultColors: TimePickerColors = {
  inputBackground: "#000000", // Changed from #1A1A1A to match Select
  inputText: "#FFFFFF",
  inputBorder: "rgba(255, 255, 255, 0.1)",
  inputBorderHover: "rgba(255, 255, 255, 0.2)",
  inputBorderFocus: "#E8D1AB",
  labelText: "rgba(255, 255, 255, 0.4)", // Updated to match dashboard style
  iconColor: "#FFFFFF",
  inputDisabled: "rgba(255, 255, 255, 0.3)",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#F2E2C6",
  paperBackground: "#1A1A1A",
  clockNumberColor: "#FFFFFF",
  mutedText: "rgba(255, 255, 255, 0.4)",
};

interface Props {
  label: string;
  value: Date | null;
  onChange: (time: Date | null) => void;
  minTime?: Date;
  colors?: Partial<TimePickerColors>;
  disabled?: boolean;
}

export const TimePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minTime,
  colors: customColors,
  disabled = false,
}) => {
  const colors = { ...defaultColors, ...customColors };
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: "100%" }}>
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

        <MuiTimePicker
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
              onClick: () => setOpen(true),
              sx: {
                "& .MuiOutlinedInput-root": {
                  height: "48px",
                  backgroundColor: colors.inputBackground,
                  borderRadius: "8px",
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
                },
                "& .MuiInputBase-input": {
                  color: colors.inputText,
                  fontSize: "14px",
                  padding: "0 14px",
                  height: "100%",
                  "&::placeholder": {
                    color: "rgba(255, 255, 255, 0.3)",
                    opacity: 1,
                  },
                },
                "& .MuiSvgIcon-root": {
                  color: colors.iconColor,
                  fontSize: "20px",
                },
              },
            },
            popper: {
              sx: {
                "& .MuiPaper-root": {
                  backgroundColor: colors.paperBackground,
                  backgroundImage: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#FFFFFF",
                  marginTop: "8px",
                  ...interiorStyles,
                },
                // THE SPECIFIC FIX: Targeting the list sections to hide scrollbars
                "& .MuiMultiSectionDigitalClockSection-root": {
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none",  // IE
                    "&::-webkit-scrollbar": {
                        display: "none", // Chrome/Safari
                    }
                }
              },
            },
            actionBar: {
              sx: {
                backgroundColor: colors.paperBackground,
                "& .MuiButton-root": {
                  color: colors.accent,
                  fontWeight: "bold",
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