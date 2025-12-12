
"use client";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "sonner";
import { FaPlus } from "react-icons/fa6";
import { padding } from "@mui/system";


interface OrderTimePickerProps {
  onAdd: (startDateTime: string, endDateTime: string) => void;
  errors: { [key: string]: string };
}

function OrderTimePicker({ onAdd, errors }: OrderTimePickerProps) {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const handleStartDateChange = (newValue: any) => {
    if (newValue) {
      const isoDate = newValue.toISOString();
      setStartTime(isoDate);
    }
  };

  const handleEndDateChange = (newValue: any) => {
    if (newValue) {
      const isoDate = newValue.toISOString();
      setEndTime(isoDate);
    }
  };

  const handleAdd = () => {
    if (startTime && endTime) {
      onAdd(startTime, endTime);
      setStartTime("");
      setEndTime("");
    }
  };

  return (
    <div className="mt-1">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DemoContainer components={["DateTimePicker", "DateTimePicker"]}>
          <div className="flex items-center space-x-1 w-full">
            <DateTimePicker className="w-full"
              sx={timePickerCss}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
              disablePast
              onChange={handleStartDateChange}
              value={startTime ? dayjs(startTime) : null}
              slotProps={{
                textField: {
                  placeholder: "Start of shoot",
                  InputLabelProps: { shrink: false },
                  error: !!errors.start_date_time,
                  helperText: errors.start_date_time,
                },
              }}
            />
            {/* {startTime && ( */}
            <span className="text-sm text-gray-coolGray500 font-semibold">To</span>
            {/* )} */}
            {/* {startTime && ( */}
            <DateTimePicker className="w-full"
              sx={timePickerCss}
              viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
              }}
              disablePast
              onChange={handleEndDateChange}
              value={endTime ? dayjs(endTime) : null}
              slotProps={{
                textField: {
                  placeholder: "End of shoot",
                  InputLabelProps: { shrink: false },
                  error: !!errors.end_date_time,
                  helperText: errors.end_date_time,
                },
              }}
            />
            {/* )} */}
            <button
              onClick={handleAdd}
              disabled={!startTime || !endTime}
              className={` flex items-center justify-center rounded-full text-gray-800 font-extrabold border transition p-[10px] ${!startTime || !endTime
                ? "bg-beige cursor-not-allowed"
                : "bg-beige-deepBeige text-white"
                }`}
            >
              <FaPlus size={11} />
            </button>
          </div>
        </DemoContainer>
      </LocalizationProvider>
    </div>
  );
}

export default OrderTimePicker;

// const timePickerCss = {
//   "& .MuiOutlinedInput-notchedOutline": {
//     borderWidth: "1px",
//     borderColor: "#E5E7EB",
//     borderRadius: "8px",
//   },
//   "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//     borderWidth: "2px",
//     borderColor: "#9CA3AF",
//   },
//   "&:hover .MuiOutlinedInput-notchedOutline": {
//     borderWidth: "1px",
//     borderColor: "#E5E7EB",
//   },
//   "& .css-1dune0f-MuiInputBase-input-MuiOutlinedInput-input": {
//     padding: "12px",
//   },
//   "& .MuiInputBase-input::placeholder": {
//     color: "#6B7280",
//     opacity: 1,
//   },
//   "& .MuiInputBase-input": {
//     color: "#6B7280",
//   },
//   fontSize: "14px",
// };

const timePickerCss = {
  "& .MuiOutlinedInput-root": {
    height: "40px", // smaller height
    borderRadius: "8px",
    backgroundColor: "#fff",
    "& fieldset": {
      borderColor: "#D1D5DB", // grey.300
      borderWidth: "2px",
    },
    "&:hover fieldset": {
      borderColor: "#D1D5DB",
      borderWidth: "1px",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D1D5DB",
      borderWidth: "1px",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "8px",
  },
  "& .MuiInputBase-input": {
    padding: "8px 10px",
    fontSize: "14px",
    color: "#6B7280",
    boxSizing: "border-box",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#6B7280",
    opacity: 1,
    padding: "8px 10px",
  },
  fontSize: "14px",
};