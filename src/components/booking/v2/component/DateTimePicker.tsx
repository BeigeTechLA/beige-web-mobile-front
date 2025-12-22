"use client";

import React, { useMemo, useState } from "react";
import {
  DateTimePicker as MuiDateTimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDateTime?: Date;
  validate?: (date: Date | null) => string | null;
}

export const DateTimePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  minDateTime,
  validate,
}) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  const effectiveMinDateTime = minDateTime ?? now;

  const handleChange = (date: Date | null) => {
    if (validate) {
      const validationError = validate(date);
      setError(validationError);
    } else {
      setError(null);
    }

    onChange(date);
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
          const isToday =
            selectedDate.toDateString() === now.toDateString();

          if (!isToday) return false;

          const time = Number(timeValue);
          if (clockType === "hours") {
            return time < now.getHours();
          }

          if (clockType === "minutes") {
            return (
              selectedDate.getHours() === now.getHours() &&
              time < now.getMinutes()
            );
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
                backgroundColor: "#FAFAFA",
                height: {
                  xs: "56px",
                  md: "82px",
                },
                paddingLeft: "12px",
                fontSize: {
                  xs: "14px",
                  md: "16px",
                },
                color: "#1A1A1A",
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
              "& input": {
                cursor: "pointer",
                outline: "none !important",
                boxShadow: "none !important",
              },
              "& input:focus": {
                outline: "none !important",
                boxShadow: "none !important",
              },
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

          mobilePaper: {
            sx: {
              "& .MuiPaper-root": {
                borderRadius: "16px",
              },
              // Header text (Selected Date/Time) to Black
              "& .MuiDateTimePickerToolbar-root": {
                padding: "20px",
                "& .MuiTypography-overline": {
                  textTransform: "none !important",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#1A1A1A99 !important"
                }
              },
              "& .MuiDateTimePickerToolbar-root *": {
                color: "#1A1A1A !important",
              },

              // 2. Alignment and Font Size Fix for Selected Values
              "& .MuiPickersToolbar-content": {
                display: "flex !important",
                flexDirection: "row !important",
                alignItems: "baseline !important",
                gap: "4px",

                "& .MuiDateTimePickerToolbar-dateContainer": {
                  display: "flex !important",
                  flexDirection: "row !important",
                  alignItems: "baseline !important",
                  gap: "6px",
                  "& span, & h4": {
                    fontSize: "20px !important",
                    fontWeight: "700 !important",
                    lineHeight: "1 !important",
                  },
                  "& .MuiPickersToolbarText-root:first-of-type": {
                    fontSize: "20px !important",
                  }
                },

                // Target the date/time container specifically
                "& .MuiDateTimePickerToolbar-dateContainer, & .MuiDateTimePickerToolbar-timeContainer": {
                  display: "flex",
                  alignItems: "baseline",
                  "& h4, & span": {
                    fontSize: "20px !important",
                    fontWeight: "700 !important",
                    lineHeight: "1 !important",
                  }
                },

                // Fix the colon separator position
                "& .MuiDateTimePickerToolbar-separator": {
                  fontSize: "22px !important",
                  fontWeight: "700 !important",
                  margin: "0 2px",
                  display: "inline-flex",
                  alignSelf: "center",
                },

                // 3. AM/PM ALIGNMENT & HIGHLIGHTING
                "& .MuiDateTimePickerToolbar-ampmSelection": {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  marginLeft: "8px",
                  gap: "6px",
                  "& .MuiButtonBase-root": {
                    padding: "2px 4px",
                    minWidth: "auto",
                    borderRadius: "4px",
                    transition: "all 0.2s ease",

                    // Default (Unselected) State
                    "& .MuiTypography-root": {
                      fontSize: "12px !important",
                      fontWeight: "500",
                      lineHeight: "1.2",
                      color: "#1A1A1A !important",
                    },

                    // Selected State Highlight
                    "&.Mui-selected": {
                      backgroundColor: "transparent",
                      "& .MuiTypography-root": {
                        color: "#1A1A1A !important",
                      },
                    },

                    // Hover state for better feedback
                    "&:hover": {
                      backgroundColor: "#E8D1AB !important",
                    }
                  }
                }
              },

              // Tab Icons and Underline
              "& .MuiTabs-indicator": {
                backgroundColor: "#E8D1AB !important",
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#E8D1AB !important",
              },
              // Date Selection
              "& .MuiPickersDay-root.Mui-selected": {
                backgroundColor: "#E8D1AB !important",
                color: "#1A1A1A !important",
              },
              // Clock Selection (Pin, Pointer, Thumb)
              "& .MuiClock-pin": {
                backgroundColor: "#E8D1AB !important",
              },
              "& .MuiClockPointer-root": {
                backgroundColor: "#E8D1AB !important",
              },
              "& .MuiClockPointer-thumb": {
                backgroundColor: "#E8D1AB !important",
                borderColor: "#E8D1AB !important",
              },
              "& .MuiClockNumber-root.Mui-selected": {
                color: "#1A1A1A !important",
              },
            }
          },

          actionBar: {
            sx: {
              "& .MuiButton-root": {
                color: "#1A1A1A !important",
                fontWeight: "bold",
              }
            }
          },

          popper: {
            sx: {
              "& .MuiPaper-root": {
                borderRadius: "12px",
                padding: "12px",
                backgroundColor: "#FFFFFF",

                // Header styles for Desktop
                "& .MuiDateTimePickerToolbar-root": {
                  "& .MuiTypography-overline": {
                    textTransform: "none !important",
                  }
                },
                "& .MuiDateTimePickerToolbar-root *": {
                  color: "#1A1A1A !important",
                },

                // Tabs and Icons for Desktop
                "& .MuiTabs-indicator": {
                  backgroundColor: "#E8D1AB !important",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "#E8D1AB !important",
                },

                // Selected Date/Time items on Desktop
                "& .MuiPickersDay-root.Mui-selected": {
                  backgroundColor: "#E8D1AB !important",
                  color: "#1A1A1A !important",
                },
                "& .MuiPickersDay-today": {
                  borderColor: "#E8D1AB !important",
                },

                // Clock elements on Desktop
                "& .MuiClock-pin": {
                  backgroundColor: "#E8D1AB !important",
                },
                "& .MuiClockPointer-root": {
                  backgroundColor: "#E8D1AB !important",
                },
                "& .MuiClockPointer-thumb": {
                  backgroundColor: "#E8D1AB !important",
                  borderColor: "#E8D1AB !important",
                },
                "& .MuiClockNumber-root.Mui-selected": {
                  color: "#1A1A1A !important",
                },

                // General selection override to prevent blue
                "& .Mui-selected": {
                  backgroundColor: "#E8D1AB !important",
                  color: "#1A1A1A !important",
                },

                "& .MuiPickersLayout-actionBar .MuiButton-root": {
                  color: "#1A1A1A !important",
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};