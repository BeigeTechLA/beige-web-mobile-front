"use client";

import React from "react";
import { TextField } from "@mui/material";
import {
  DateTimePicker as MuiDateTimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export const DateTimePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDateTimePicker
        label={label}
        value={value}
        onChange={onChange}
        slotProps={{
          textField: {
            fullWidth: true,
            InputLabelProps: {
              shrink: true,
            },
            sx: {
              // Remove the BLUE OUTLINE completely
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#FAFAFA",
                height: {
                  xs: "56px",   // mobile
                  md: "82px",   // desktop
                },
                paddingLeft: "12px",
                fontSize: {
                  xs: "14px",
                  md: "16px",
                },
                color: "#1A1A1A",

                // Remove focus outline (browser default)
                "&:focus-within": {
                  outline: "none",
                  boxShadow: "none",
                },

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E5E5E5",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1A1A1A",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1A1A1A !important",
                  outline: "none !important",
                  boxShadow: "none !important",
                },
              },

              // Remove focus ring ON INPUT ELEMENT (the culprit)
              "& input": {
                outline: "none !important",
                boxShadow: "none !important",
              },
              "& input:focus": {
                outline: "none !important",
                boxShadow: "none !important",
              },

              // ---- Label ----
              "& .MuiInputLabel-root": {
                color: "#00000099 !important",
                fontSize: {
                  xs: "14px",
                  md: "18px",
                },
                backgroundColor: "#FAFAFA",
                padding: "0px 6px",
                marginLeft: "2px",
                transform: "translate(14px, -12px) scale(0.85)",
              },

              "& .MuiInputLabel-root.Mui-focused": {
                color: "#00000099 !important",
              },

              "& .MuiInputBase-input": {
                paddingTop: "20px",
                fontSize: "16px",
              },

              "& .MuiSvgIcon-root": {
                color: "#1A1A1A",
              },
            },
          },

          popper: {
            sx: {
              "& .MuiPaper-root": {
                borderRadius: "12px",
                padding: "12px",
                backgroundColor: "#FFFFFF",

                "& .MuiPickersDay-root.Mui-selected": {
                  backgroundColor: "#E8D1AB !important",
                  color: "#000 !important",
                },
                "& .MuiPickersDay-today": {
                  borderColor: "#E8D1AB !important",
                },
                "& .MuiClockPointer-root": {
                  backgroundColor: "#E8D1AB !important",
                },
                "& .MuiClockPointer-thumb": {
                  backgroundColor: "#E8D1AB !important",
                  borderColor: "#E8D1AB !important",
                },
                "& .MuiClockNumber-root": {
                  color: "#000 !important",
                },
                "& .MuiPickersLayout-actionBar .MuiButton-root": {
                  color: "#000 !important",
                },

                "& .Mui-selected": {
                  backgroundColor: "#000 !important",
                  color: "#fff !important",
                },

              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};
