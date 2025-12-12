"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { shootOrderData } from "@/src/redux/slices/order/orderSlice";
import HorizontalCalendarTimePicker from "@/src/components/horizontalCalendarTimePicker/HorizontalCalendarTimePicker";
import dayjs from "dayjs";
import { CircleX, X, Check } from "lucide-react";
import { toast } from "sonner";

// Define the props for HorizontalCalendarTimePicker to fix TypeScript errors
type CalendarTimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  showTime?: boolean;
  wheelProps?: object;
  theme?: string;
  className?: string;
  style?: object;
  use24Hour?: boolean;
  disablePast?: boolean;
  timeFormat?: string;
};

// Cast the imported component to accept our props type
const TypedCalendarTimePicker =
  HorizontalCalendarTimePicker as React.ComponentType<CalendarTimePickerProps>;

interface FormData {
  start_date_time: string;
  end_date_time: string;
  duration: number;
  date_status: string;
}

interface ShootTimePickerProps {
  setDateTimes: (dateTimes: FormData[]) => void;
  dateTimes: FormData[];
  title?: boolean;
}

const ShootTimePicker = ({
  setDateTimes,
  dateTimes,
  title = false,
}: ShootTimePickerProps) => {
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [tempStartDateTime, setTempStartDateTime] = useState<Date | null>(null);
  const [tempEndDateTime, setTempEndDateTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { shoot_datetimes } = useAppSelector((state) => state.orderStore);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const minDateTime = new Date();

  useEffect(() => {
    if (shoot_datetimes.length > 0) {
      setDateTimes(shoot_datetimes);
    }
  }, [shoot_datetimes, setDateTimes]);

  const convertToEnglishDateFormat = (isoDate: string) => {
    return dayjs(isoDate).format("MMM DD, YYYY, hh:mm A");
  };

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return Math.ceil(durationHours);
  };

  const logTotalDuration = (dateTimesArray: FormData[]) => {
    const totalDuration = dateTimesArray.reduce((acc, dateTime) => {
      return (
        acc +
        calculateDuration(dateTime.start_date_time, dateTime.end_date_time)
      );
    }, 0);
    dispatch(
      shootOrderData({
        dateTimes: dateTimesArray,
        shoot_duration: totalDuration,
      })
    );
  };

  const addDateTime = (startDateTime: string, endDateTime: string) => {
    if (!startDateTime || !endDateTime) {
      setErrors({
        start_date_time: !startDateTime ? "Start time is required" : "",
        end_date_time: !endDateTime ? "End time is required" : "",
      });
      return;
    }

    // Convert ISO strings to Date objects for validation
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    const duration = calculateDuration(startDateTime, endDateTime);
    if (duration <= 0) {
      toast.error("End time must be greater than start time!");
      return;
    }
    if (duration < 1) {
      toast.error("Booking duration must be at least 1 hour");
      return;
    }

    const newDateTime: FormData = {
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      duration,
      date_status: "confirmed",
    };

    const newDateTimes = [...dateTimes, newDateTime];
    setDateTimes(newDateTimes);
    logTotalDuration(newDateTimes);
    setErrors({});
    setStartDateTime(null);
    setEndDateTime(null);
  };

  const handleTimeRemove = (startDateTime: string) => {
    const updatedDateTimes = dateTimes.filter(
      (dateTime) => dateTime.start_date_time !== startDateTime
    );
    setDateTimes(updatedDateTimes);
    logTotalDuration(updatedDateTimes);
  };

  const handleTempStartDateChange = (date: Date) => {
    // Only update the temporary state, don't close the picker
    // Create a new Date object to avoid reference issues
    const newDate = new Date(date);

    // Set the temporary start date time with the exact time selected
    setTempStartDateTime(newDate);

    // Set the temporary start date time with the exact time selected
    setTempStartDateTime(newDate);

    // Clear any previous start date error
    if (errors.start_date_time) {
      setErrors((prev) => ({ ...prev, start_date_time: "" }));
    }
  };

  const confirmStartDateTime = () => {
    if (tempStartDateTime) {
      // Create a new Date object to avoid reference issues
      const confirmedDate = new Date(tempStartDateTime);

      // Set the start date time with the exact time selected
      setStartDateTime(confirmedDate);
      setShowStartPicker(false);
    }
  };

  const handleTempEndDateChange = (date: Date) => {
    // Only update the temporary state, don't close the picker
    // Create a new Date object to avoid reference issues
    const newDate = new Date(date);

    // Set the temporary end date time with the exact time selected
    setTempEndDateTime(newDate);

    // Clear any previous end date error
    if (errors.end_date_time) {
      setErrors((prev) => ({ ...prev, end_date_time: "" }));
    }
  };

  const confirmEndDateTime = () => {
    // Validate that start date is selected first
    if (!startDateTime) {
      toast.error("Please select start date/time first");
      setShowEndPicker(false);
      setErrors((prev) => ({
        ...prev,
        start_date_time: "Start date & time is required",
      }));
      return;
    }

    if (tempEndDateTime) {
      // Create a new Date object to avoid reference issues
      const confirmedDate = new Date(tempEndDateTime);

      // Get the start date
      const startDate = new Date(startDateTime);

      // Validate that end date is after start date
      if (confirmedDate < startDate) {
        toast.error("End date & time must be after start date & time");
        return;
      }
      // Set the end date time with the exact time selected
      setEndDateTime(confirmedDate);
      setShowEndPicker(false);

      // Clear any previous end date error
      if (errors.end_date_time) {
        setErrors((prev) => ({ ...prev, end_date_time: "" }));
      }

      // Add the date time when end date is confirmed
      const startDateIso = startDate.toISOString();
      const endDateIso = confirmedDate.toISOString();
      addDateTime(startDateIso, endDateIso);
    }
  };

  return (
    <div className="mt-5 mb-5">
      {/* <label
        className={`block text-[16px] leading-[18px] font-medium font-inter mb-3 ${
          title ? "text-white" : "text-[#1F2937]"
        }`}
      >
        Date and Time
      </label> */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* Start Date & Time Input */}
          <div className="flex-1 rounded-[5px] w-full sm:w-2/4">
            <div className="">
              <label
                className={`block text-[16px] leading-[18px] font-medium font-inter mb-3 ${
                  title ? "text-white" : "text-[#1F2937]"
                }`}
              >
                Start Date & Time
              </label>
              <div
                className="border rounded-md p-2 cursor-pointer h-[40px] bg-white"
                onClick={() => {
                  // Always show the date picker when clicked, regardless of whether startDateTime exists
                  if (startDateTime) {
                    // Convert string to Date object if it's a string
                    const dateObj =
                      typeof startDateTime === "string"
                        ? new Date(startDateTime)
                        : startDateTime;
                    setTempStartDateTime(dateObj);
                  } else {
                    // If no date is selected yet, initialize with null to allow the picker to handle default selection
                    setTempStartDateTime(null);
                  }
                  // Always show the picker
                  setShowStartPicker(true);
                  // Clear any previous error
                  if (errors.start_date_time) {
                    setErrors((prev) => ({ ...prev, start_date_time: "" }));
                  }
                }}
              >
                {startDateTime ? (
                  <span className="text-gray-800">
                    {dayjs(startDateTime).format("MMM DD, YYYY, hh:mm A")}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[16px]">
                    Select start date & time
                  </span>
                )}
              </div>
              {errors.start_date_time && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.start_date_time}
                </p>
              )}
            </div>
          </div>

          {/* End Date & Time Input */}
          <div className="flex-1 rounded-[5px] w-full sm:w-2/4">
            <div className="">
              <label
                className={`block text-[16px] leading-[18px] font-medium font-inter mb-3 ${
                  title ? "text-white" : "text-[#1F2937]"
                }`}
              >
                End Date & Time
              </label>
              <div
                className="border rounded-md p-2 cursor-pointer h-[40px] bg-white"
                onClick={() => {
                  if (!startDateTime) {
                    toast.error("Please select start date/time first");
                    setErrors((prev) => ({
                      ...prev,
                      start_date_time: "Start date & time is required",
                    }));
                  } else {
                    // Convert string to Date object if it's a string
                    if (endDateTime) {
                      const dateObj =
                        typeof endDateTime === "string"
                          ? new Date(endDateTime)
                          : endDateTime;
                      setTempEndDateTime(dateObj);
                    } else {
                      // Initialize with null to allow the picker to handle default selection
                      setTempEndDateTime(null);
                    }
                    setShowEndPicker(true);

                    // Clear any previous error
                    if (errors.end_date_time) {
                      setErrors((prev) => ({ ...prev, end_date_time: "" }));
                    }
                  }
                }}
              >
                {endDateTime ? (
                  <span className="text-gray-800">
                    {dayjs(endDateTime).format("MMM DD, YYYY, hh:mm A")}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[16px]">
                    Select end date & time
                  </span>
                )}
              </div>
              {errors.end_date_time && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.end_date_time}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Popup for Start Date Time Picker */}
      {showStartPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md relative">
            <TypedCalendarTimePicker
              value={tempStartDateTime || new Date()}
              onChange={handleTempStartDateChange}
              theme="light"
              showTime={true}
              use24Hour={false}
              disablePast={true}
              timeFormat="hh:mm a"
              wheelProps={{ delayOnChange: false }}
            />
            <div className="flex justify-end p-3 border-t">
              <button
                onClick={() => setShowStartPicker(false)}
                className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartDateTime}
                className="px-4 py-1 text-sm font-medium bg-[#F6E3BA] rounded-md hover:bg-[#F6E3BA] flex items-center"
                disabled={!tempStartDateTime}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup for End Date Time Picker */}
      {showEndPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md relative">
            <TypedCalendarTimePicker
              value={tempEndDateTime || new Date()}
              onChange={handleTempEndDateChange}
              theme="light"
              showTime={true}
              use24Hour={false}
              disablePast={true}
              timeFormat="hh:mm a"
              wheelProps={{ delayOnChange: false }}
            />
            <div className="flex justify-end p-3 border-t">
              <button
                onClick={() => setShowEndPicker(false)}
                className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndDateTime}
                className="px-4 py-2 text-sm font-medium  bg-[#F6E3BA] rounded-md hover:bg-[#F6E3BA] flex items-center"
                disabled={!tempEndDateTime}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {dateTimes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 w-full">
          {dateTimes.map((dateTime, index) => (
            <div
              key={index}
              className={`flex text-[16px] leading-[18px] font-medium font-inter mb-3 w-full items-center ${
                title ? "text-white" : "text-[#1F2937]"
              }`}
            >
              <span className="text-[14px] leading-[18px] p-0 m-0 font-medium font-inter">
                {convertToEnglishDateFormat(dateTime.start_date_time)} to{" "}
                {convertToEnglishDateFormat(dateTime.end_date_time)} (
                {dateTime.duration} Hour{dateTime.duration > 1 ? "s" : ""})
              </span>
              <div
                onClick={() => handleTimeRemove(dateTime.start_date_time)}
                className="pl-2 cursor-pointer"
              >
                <CircleX color="#ff3838" size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShootTimePicker;
