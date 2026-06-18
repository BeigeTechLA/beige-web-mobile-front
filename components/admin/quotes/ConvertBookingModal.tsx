"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  set,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { Button } from "@/components/ui/button";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";

export type ConvertBookingModalSubmitData = {
  bookingType: "single_day" | "multi_day";
  location?: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  singleDay?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  multiDay?: {
    sameTimings: boolean;
    sharedStartTime?: string;
    sharedEndTime?: string;
    days: Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>;
  };
};

export type ConvertBookingModalInitialData = ConvertBookingModalSubmitData;

type ConvertBookingModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ConvertBookingModalSubmitData) => void;
  isSubmitting: boolean;
  isDark: boolean;
  initialData?: ConvertBookingModalInitialData | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  showLocationField?: boolean;
  maxDurationHours?: number | null;
};

export default function ConvertBookingModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  isDark,
  initialData,
  title = "Convert to Booking",
  description = "Select booking type, shoot date and time before continuing.",
  submitLabel = "Convert to Booking",
  showLocationField = true,
  maxDurationHours = null,
}: ConvertBookingModalProps) {
  const [validationErrors, setValidationErrors] = useState({
    location: false,
    singleDate: false,
    singleStart: false,
    singleEnd: false,
    multiDates: false,
    multiTimes: false,
  });
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">("single_day");
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [sharedMultiStartTime, setSharedMultiStartTime] = useState("");
  const [sharedMultiEndTime, setSharedMultiEndTime] = useState("");
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const reelRef = useRef<HTMLDivElement>(null);
  const isDraggingReel = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const toDate = (value?: string) => {
      if (!value) return null;
      const parsedDate = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    };

    const toDateTimeValue = (date?: string, time?: string) => {
      if (!date || !time) return "";
      return `${date} ${time}:00`;
    };

    const normalizedInitialData = initialData ?? null;
    const initialBookingType = normalizedInitialData?.bookingType ?? "single_day";
    const initialMultiDays = normalizedInitialData?.multiDay?.days ?? [];
    const sameTimingsInitial =
      normalizedInitialData?.bookingType === "multi_day"
        ? normalizedInitialData.multiDay?.sameTimings ?? false
        : true;
    const firstMultiDate = initialMultiDays[0]?.date;

    setBookingType(initialBookingType);
    setSelectedShootDate(
      initialBookingType === "single_day"
        ? toDate(normalizedInitialData?.singleDay?.date)
        : null
    );
    setStartDateTime(
      initialBookingType === "single_day"
        ? toDateTimeValue(
            normalizedInitialData?.singleDay?.date,
            normalizedInitialData?.singleDay?.startTime
          )
        : ""
    );
    setEndDateTime(
      initialBookingType === "single_day"
        ? toDateTimeValue(
            normalizedInitialData?.singleDay?.date,
            normalizedInitialData?.singleDay?.endTime
          )
        : ""
    );
    setLocation(normalizedInitialData?.location ?? "");
    setLocationDetails(null);
    setSelectedDates(
      initialBookingType === "multi_day"
        ? initialMultiDays
            .map((day) => toDate(day.date))
            .filter((date): date is Date => Boolean(date))
        : []
    );
    setIsCalendarOpen(false);
    setCurrentCalendarMonth(
      initialBookingType === "multi_day" && firstMultiDate
        ? toDate(firstMultiDate) || new Date()
        : initialBookingType === "single_day" && normalizedInitialData?.singleDay?.date
          ? toDate(normalizedInitialData.singleDay.date) || new Date()
          : new Date()
    );
    setSameTimingsMulti(sameTimingsInitial);
    setSharedMultiStartTime(
      initialBookingType === "multi_day" && sameTimingsInitial
        ? normalizedInitialData?.multiDay?.sharedStartTime ?? initialMultiDays[0]?.startTime ?? ""
        : ""
    );
    setSharedMultiEndTime(
      initialBookingType === "multi_day" && sameTimingsInitial
        ? normalizedInitialData?.multiDay?.sharedEndTime ?? initialMultiDays[0]?.endTime ?? ""
        : ""
    );
    setExpandedDateKey(firstMultiDate ?? null);
    setMultiDayTimes(
      initialBookingType === "multi_day" && !sameTimingsInitial
        ? initialMultiDays.reduce<Record<string, { startKey?: string; endKey?: string }>>(
            (accumulator, day) => {
              accumulator[day.date] = {
                startKey: day.startTime,
                endKey: day.endTime,
              };
              return accumulator;
            },
            {}
          )
        : {}
    );
    setValidationErrors({
      location: false,
      singleDate: false,
      singleStart: false,
      singleEnd: false,
      multiDates: false,
      multiTimes: false,
    });
  }, [initialData, open]);

  const timeOptions = useMemo(() => {
    const options: Array<{ key: string; value: string }> = [];

    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        options.push({ key, value: format(date, "h:mm aa") });
      }
    }

    return options;
  }, []);

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const reelDays = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 21 }, (_, index) => addDays(now, index));
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarMonth));
    const end = endOfWeek(endOfMonth(currentCalendarMonth));
    const days: Date[] = [];
    let cursor = start;

    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    return days;
  }, [currentCalendarMonth]);

  const getStartTimeKey = () => {
    if (!startDateTime) return "";
    const date = new Date(startDateTime);
    if (Number.isNaN(date.getTime())) return "";
    return format(date, "HH:mm");
  };

  const getEndTimeKey = () => {
    if (!endDateTime) return "";
    const date = new Date(endDateTime);
    if (Number.isNaN(date.getTime())) return "";
    return format(date, "HH:mm");
  };

  const updateDateTime = (date: Date | null, timeKey: string) => {
    if (!date || !timeKey) {
      return "";
    }

    const [hours, minutes] = timeKey.split(":").map(Number);
    return format(
      set(new Date(date), {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0,
      }),
      "yyyy-MM-dd HH:mm:ss"
    );
  };

  const calculateDurationHours = (startKey: string, endKey: string) => {
    if (!startKey || !endKey) return null;

    const [startHour, startMinute] = startKey.split(":").map(Number);
    const [endHour, endMinute] = endKey.split(":").map(Number);
    const diffInMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

    return diffInMinutes > 0 ? Math.round((diffInMinutes / 60) * 100) / 100 : null;
  };

  const hasDurationLimit =
    typeof maxDurationHours === "number" &&
    Number.isFinite(maxDurationHours) &&
    maxDurationHours > 0;

  const isTimeRangeWithinDurationLimit = (startKey: string, endKey: string) => {
    const duration = calculateDurationHours(startKey, endKey);
    if (duration === null) {
      return false;
    }

    if (!hasDurationLimit) {
      return true;
    }

    return duration <= maxDurationHours;
  };

    const isTimeInPast = (timeKey: string, date: Date | null) => {
    if (!date || !isSameDay(date, new Date())) return false;
    
    const now = new Date();
    const bufferMinutes = 4 * 60; 
    const currentTotalMinutesWithBuffer = (now.getHours() * 60) + now.getMinutes() + bufferMinutes;
    
    const [hour, minute] = timeKey.split(":").map(Number);
    const selectedTotalMinutes = (hour * 60) + minute;

    return selectedTotalMinutes < currentTotalMinutesWithBuffer;
  };

  const filteredStartTimeOptions = useMemo(() => {
    return timeOptions.filter((option) => !isTimeInPast(option.key, selectedShootDate));
  }, [selectedShootDate, timeOptions]);

  const filteredEndTimeOptions = useMemo(() => {
    const startKey = getStartTimeKey();
    return timeOptions.filter((option) => {
      const isFuture = !isTimeInPast(option.key, selectedShootDate);
      const isAfterStart = startKey ? option.key > startKey : true;
      const withinLimit = startKey ? isTimeRangeWithinDurationLimit(startKey, option.key) : true;
      return isFuture && isAfterStart && withinLimit;
    });
  }, [timeOptions, startDateTime, selectedShootDate, maxDurationHours]);

  const handleDateChange = (date: Date | null) => {
    setSelectedShootDate(date);
    setValidationErrors((prev) => ({ ...prev, singleDate: false }));
    if (!date) {
      setStartDateTime("");
      setEndDateTime("");
      return;
    }

    const currentStart = getStartTimeKey();
    const currentEnd = getEndTimeKey();

    if (currentStart) {
      setStartDateTime(updateDateTime(date, currentStart));
    }

    if (currentEnd) {
      setEndDateTime(updateDateTime(date, currentEnd));
    }
  };

  const handleStartTimeChange = (timeKey: string) => {
    setValidationErrors((prev) => ({ ...prev, singleStart: false, multiTimes: false }));
    const currentEndKey = getEndTimeKey();
    if (
      currentEndKey &&
      !isTimeRangeWithinDurationLimit(timeKey, currentEndKey)
    ) {
      setEndDateTime("");
    }
    setStartDateTime(updateDateTime(selectedShootDate, timeKey));
  };

  const handleEndTimeChange = (timeKey: string) => {
    setValidationErrors((prev) => ({ ...prev, singleEnd: false, multiTimes: false }));
    setEndDateTime(updateDateTime(selectedShootDate, timeKey));
  };


  const filteredSharedMultiStartTimeOptions = useMemo(() => {
    const hasToday = selectedDates.some(d => isSameDay(d, new Date()));
    return timeOptions.filter((option) => !isTimeInPast(option.key, hasToday ? new Date() : null));
  }, [selectedDates, timeOptions]);

  const filteredSharedMultiEndTimeOptions = useMemo(() => {
    const hasToday = selectedDates.some(d => isSameDay(d, new Date()));
    return timeOptions.filter((option) => {
      const isFuture = !isTimeInPast(option.key, hasToday ? new Date() : null);
      const isAfterStart = sharedMultiStartTime ? option.key > sharedMultiStartTime : true;
      const withinLimit = sharedMultiStartTime ? isTimeRangeWithinDurationLimit(sharedMultiStartTime, option.key) : true;
      return isFuture && isAfterStart && withinLimit;
    });
  }, [timeOptions, sharedMultiStartTime, selectedDates, maxDurationHours]);

  const getTimeLabel = (key: string) =>
    timeOptions.find((option) => option.key === key)?.value || key;

  const getFormattedDateString = (dates: Date[]) =>
    dates
      .slice()
      .sort((a, b) => a.getTime() - b.getTime())
      .map((date) => format(date, "MMM dd"))
      .join(", ");

  const toggleDateSelection = (date: Date) => {
    setValidationErrors((prev) => ({ ...prev, multiDates: false }));
    setSelectedDates((prev) => {
      const exists = prev.some((selectedDate) => isSameDay(selectedDate, date));
      if (exists) {
        return prev.filter((selectedDate) => !isSameDay(selectedDate, date));
      }

      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  };

  const handleMultiDayStartTimeChange = (dateKey: string, timeKey: string) => {
    setValidationErrors((prev) => ({ ...prev, multiTimes: false }));
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        startKey: timeKey,
        endKey:
          prev[dateKey]?.endKey &&
          !isTimeRangeWithinDurationLimit(timeKey, prev[dateKey]?.endKey || "")
            ? undefined
            : prev[dateKey]?.endKey,
      },
    }));
  };

  const handleMultiDayEndTimeChange = (dateKey: string, timeKey: string) => {
    setValidationErrors((prev) => ({ ...prev, multiTimes: false }));
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        endKey: timeKey,
      },
    }));
  };

  const validateBeforeSubmit = () => {
    const trimmedLocation = location.trim();
    const nextErrors = {
      location: false,
      singleDate: false,
      singleStart: false,
      singleEnd: false,
      multiDates: false,
      multiTimes: false,
    };

    if (showLocationField && !trimmedLocation) {
      nextErrors.location = true;
      setValidationErrors(nextErrors);
      toast.error("Required Field", {
        description: "Please enter a location",
      });
      return false;
    }

    if (showLocationField && trimmedLocation.length < 3) {
      nextErrors.location = true;
      setValidationErrors(nextErrors);
      toast.error("Invalid Input", {
        description: "Location must be at least 3 characters",
      });
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingType === "single_day") {
      if (!selectedShootDate || !startDateTime || !endDateTime) {
        nextErrors.singleDate = !selectedShootDate;
        nextErrors.singleStart = !startDateTime;
        nextErrors.singleEnd = !endDateTime;
        setValidationErrors(nextErrors);
        toast.error("Required Field", {
          description: "Please fill in all required fields",
        });
        return false;
      }

      const selectedDate = new Date(selectedShootDate);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        nextErrors.singleDate = true;
        setValidationErrors(nextErrors);
        toast.error("Invalid Date", {
          description: "Start date cannot be in the past",
        });
        return false;
      }

      if (!getStartTimeKey() || !getEndTimeKey()) {
        nextErrors.singleStart = !getStartTimeKey();
        nextErrors.singleEnd = !getEndTimeKey();
        setValidationErrors(nextErrors);
        toast.error("Required Field", {
          description: "Please fill in all required fields",
        });
        return false;
      }

      if (!isTimeRangeWithinDurationLimit(getStartTimeKey(), getEndTimeKey())) {
        nextErrors.singleEnd = true;
        setValidationErrors(nextErrors);
        toast.error("Invalid Duration", {
          description: hasDurationLimit
            ? `Booking duration cannot exceed ${maxDurationHours} hours.`
            : "End time must be after start time.",
        });
        return false;
      }
    }

    if (bookingType === "multi_day") {
      if (selectedDates.length === 0) {
        nextErrors.multiDates = true;
        setValidationErrors(nextErrors);
        toast.error("Required Field", {
          description: "Please fill in all required fields",
        });
        return false;
      }

      const hasPastDate = selectedDates.some((date) => {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate < today;
      });

      if (hasPastDate) {
        nextErrors.multiDates = true;
        setValidationErrors(nextErrors);
        toast.error("Invalid Date", {
          description: "Start date cannot be in the past",
        });
        return false;
      }

      if (sameTimingsMulti) {
        if (!sharedMultiStartTime || !sharedMultiEndTime) {
          nextErrors.multiTimes = true;
          setValidationErrors(nextErrors);
          toast.error("Required Field", {
            description: "Please fill in all required fields",
          });
          return false;
        }

        if (!isTimeRangeWithinDurationLimit(sharedMultiStartTime, sharedMultiEndTime)) {
          nextErrors.multiTimes = true;
          setValidationErrors(nextErrors);
          toast.error("Invalid Duration", {
            description: hasDurationLimit
              ? `Booking duration cannot exceed ${maxDurationHours} hours per day.`
              : "End time must be after start time.",
          });
          return false;
        }
      } else {
        const hasMissingTimes = selectedDates.some((date) => {
          const dateKey = getDateKey(date);
          return !multiDayTimes[dateKey]?.startKey || !multiDayTimes[dateKey]?.endKey;
        });

        if (hasMissingTimes) {
          nextErrors.multiTimes = true;
          setValidationErrors(nextErrors);
          toast.error("Required Field", {
            description: "Please fill in all required fields",
          });
          return false;
        }

        const hasDurationOverflow = selectedDates.some((date) => {
          const dateKey = getDateKey(date);
          return !isTimeRangeWithinDurationLimit(
            multiDayTimes[dateKey]?.startKey || "",
            multiDayTimes[dateKey]?.endKey || ""
          );
        });

        if (hasDurationOverflow) {
          nextErrors.multiTimes = true;
          setValidationErrors(nextErrors);
          toast.error("Invalid Duration", {
            description: hasDurationLimit
              ? `Each selected day must be ${maxDurationHours} hours or less.`
              : "End time must be after start time.",
          });
          return false;
        }
      }
    }

    setValidationErrors(nextErrors);
    return true;
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border p-5 lg:p-8 ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E5E7EB] bg-white text-black"}`}>
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-5 top-5 rounded-full p-2 transition-colors ${isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-black/60 hover:bg-black/5 hover:text-black"}`}
        >
          <X size={18} />
        </button>

        <div className="mb-8 pr-10">
          <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
            {description}
          </p>
        </div>

        <div className={`pt-2 ${isDark ? "text-white" : "text-black"}`}>
          <div className={`border-t pt-6 ${isDark ? "border-white/10" : "border-black/5"}`}>
            <h3 className={`mb-3 text-base font-medium lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
              Select Booking Type
            </h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setBookingType("single_day");
                  setSelectedDates([]);
                  setSameTimingsMulti(true);
                  setMultiDayTimes({});
                  setValidationErrors((prev) => ({
                    ...prev,
                    multiDates: false,
                    multiTimes: false,
                  }));
                }}
                className={`flex h-14 w-fit items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[300px] lg:px-6 ${bookingType === "single_day" ? "border-transparent bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
              >
                <span className="pr-2 text-sm font-medium lg:text-lg">Single Day</span>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border lg:h-8 lg:w-8 ${bookingType === "single_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
                  {bookingType === "single_day" ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBookingType("multi_day")}
                className={`flex h-14 w-fit items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[300px] lg:px-6 ${bookingType === "multi_day" ? "border-transparent bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
              >
                <span className="pr-2 text-sm font-medium lg:text-lg">Multiple Days</span>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border lg:h-8 lg:w-8 ${bookingType === "multi_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
                  {bookingType === "multi_day" ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
                </div>
              </button>
            </div>
          </div>

          <div className="my-4 lg:my-9">
            {hasDurationLimit ? (
              <p className={`mb-4 text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#6B5A3A]"}`}>
                Maximum booking duration: {maxDurationHours} hours per day.
              </p>
            ) : null}
            {bookingType === "single_day" ? (
              <>
                <h3 className={`mb-3 text-base font-medium lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
                  Shoot Date & Time
                </h3>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <DatePicker
                    label="Select Date"
                    value={selectedShootDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    format="MM/dd/yyyy"
                    sx={{ height: { xs: "56px", md: "82px" }, borderRadius: "16px" }}
                    colors={validationErrors.singleDate ? {
                      inputBorder: "#ef4444",
                      inputBorderHover: "#ef4444",
                      inputBorderFocus: "#ef4444",
                      labelText: "#ef4444",
                    } : undefined}
                    isDark={isDark}
                  />
                  <div className={validationErrors.singleStart ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                    <DropdownSelect
                      title="Start Time"
                      options={filteredStartTimeOptions}
                      value={getStartTimeKey()}
                      onChange={handleStartTimeChange}
                      bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                      isDark={isDark}
                    />
                  </div>
                  <div className={validationErrors.singleEnd ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                    <DropdownSelect
                      title="End Time"
                      options={filteredEndTimeOptions}
                      value={getEndTimeKey()}
                      onChange={handleEndTimeChange}
                      bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                      isDark={isDark}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative mb-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className={`mb-3 text-base font-medium lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
                      Select Date
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen((prev) => !prev)}
                      className="group flex items-center gap-2 transition-colors"
                    >
                      <span className={`font-medium lg:text-[20px] ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"}`}>
                        {format(currentCalendarMonth, "MMMM yyyy")}
                      </span>
                      <Calendar size={20} className={isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"} />
                    </button>
                  </div>

                  <div
                    ref={reelRef}
                    onPointerDown={(event) => {
                      if (!reelRef.current) return;
                      if ((event.target as HTMLElement).closest("button")) return;
                      isDraggingReel.current = true;
                      dragStartX.current = event.clientX;
                      dragStartScrollLeft.current = reelRef.current.scrollLeft;
                      reelRef.current.setPointerCapture?.(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                      if (!reelRef.current || !isDraggingReel.current) return;
                      const deltaX = event.clientX - dragStartX.current;
                      reelRef.current.scrollLeft = dragStartScrollLeft.current - deltaX;
                    }}
                    onPointerUp={(event) => {
                      isDraggingReel.current = false;
                      reelRef.current?.releasePointerCapture?.(event.pointerId);
                    }}
                    onPointerCancel={(event) => {
                      isDraggingReel.current = false;
                      reelRef.current?.releasePointerCapture?.(event.pointerId);
                    }}
                    className="flex gap-3 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                  >
                    {reelDays.map((date) => {
                      const isSelected = selectedDates.some((selectedDate) => isSameDay(selectedDate, date));
                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => toggleDateSelection(date)}
                          className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full border transition-all lg:h-[100px] lg:w-[100px] ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-transparent text-white/40 hover:border-white/30" : "border-[#0000004D] bg-white text-[#2C2C2C] hover:border-black/50 shadow-sm"}`}
                        >
                          <span className="text-lg font-bold lg:text-3xl">{format(date, "d")}</span>
                          <span className="text-[10px] font-medium uppercase lg:text-xs">{format(date, "EEE")}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <div className={`mt-4 w-fit rounded-lg px-4 py-2 lg:mt-8 lg:rounded-xl lg:px-7 lg:py-3 ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"}`}>
                      <p className={`text-xs font-medium lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>
                        Total Days: {selectedDates.length}
                      </p>
                    </div>
                    <div className={`mt-4 w-fit rounded-lg px-4 py-2 lg:mt-8 lg:rounded-xl lg:px-7 lg:py-3 ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"}`}>
                      <p className={`text-xs font-medium lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>
                        Selected Days: {getFormattedDateString(selectedDates)}
                      </p>
                    </div>
                  </div>

                  {isCalendarOpen ? (
                    <div className={`absolute right-0 top-14 z-50 w-[320px] rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/10 bg-[#111]" : "border-gray-200 bg-white"}`}>
                      <div className="mb-6 flex items-center justify-between">
                        <button
                          type="button"
                          className={isDark ? "font-bold text-white" : "font-bold text-black"}
                          onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className={isDark ? "font-bold text-white" : "font-bold text-black"}>
                          {format(currentCalendarMonth, "MMMM yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={isDark ? "font-bold text-white" : "font-bold text-black"}
                            onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}
                          >
                            <ChevronRight size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className={`rounded-full p-1 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/40">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                          const isSelected = selectedDates.some((selectedDate) => isSameDay(selectedDate, date));
                          const isPast = date < new Date() && !isSameDay(date, new Date()); 

                          return (
                            <button
                              key={date.toISOString()}
                              type="button"
                              disabled={isPast}
                              onClick={() => toggleDateSelection(date)}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors 
                                      ${isSelected ? "bg-[#E8D1AB] text-black" : isDark ? "text-white hover:bg-white/10" : "text-[#323232] hover:bg-black/10"} 
                                      ${!isSameMonth(date, currentCalendarMonth) || isPast ? "opacity-20 cursor-not-allowed" : ""}`} 
                              >
                              {format(date, "d")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                {selectedDates.length > 0 ? (
                  <div className={`space-y-6 border-t pt-6 lg:pt-15 ${isDark ? "border-white/10" : "border-black/5"}`}>
                    <h3 className={`mb-3 text-base font-medium transition-colors lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
                      Are timings same for all selected dates?
                    </h3>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSameTimingsMulti(true);
                          setMultiDayTimes({});
                          setSharedMultiStartTime("");
                          setSharedMultiEndTime("");
                          setValidationErrors((prev) => ({ ...prev, multiTimes: false }));
                        }}
                        className={`flex h-14 w-[100px] items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[140px] lg:px-6 ${sameTimingsMulti ? "border-transparent bg-[#E8D1AB] text-black [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)]" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9]" : "border-[#0000004D] bg-transparent text-[#2C2C2C]"}`}
                      >
                        <span className="pr-2 text-sm font-medium lg:text-lg">Yes</span>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full lg:h-8 lg:w-8 ${sameTimingsMulti ? "bg-black" : isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]"}`}>
                          {sameTimingsMulti ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSameTimingsMulti(false);
                          const nextTimes: Record<string, { startKey?: string; endKey?: string }> = {};
                          selectedDates.forEach((date) => {
                            nextTimes[getDateKey(date)] = {
                              startKey: sharedMultiStartTime,
                              endKey: sharedMultiEndTime,
                            };
                          });
                          setMultiDayTimes(nextTimes);
                        }}
                        className={`flex h-14 w-[100px] items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[140px] lg:px-6 ${!sameTimingsMulti ? "border-transparent bg-[#E8D1AB] text-black [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)]" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9]" : "border-[#0000004D] bg-transparent text-[#2C2C2C]"}`}
                      >
                        <span className="pr-2 text-sm font-medium lg:text-lg">No</span>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full lg:h-8 lg:w-8 ${!sameTimingsMulti ? "bg-black" : isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]"}`}>
                          {!sameTimingsMulti ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
                        </div>
                      </button>
                    </div>

                    {sameTimingsMulti ? (
                      <div className="animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className={validationErrors.multiTimes ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                            <DropdownSelect
                              title="Start Time"
                              options={filteredSharedMultiStartTimeOptions}
                              value={sharedMultiStartTime}
                              onChange={(value) => {
                                setValidationErrors((prev) => ({ ...prev, multiTimes: false }));
                                setSharedMultiStartTime(value);
                                if (
                                  sharedMultiEndTime &&
                                  !isTimeRangeWithinDurationLimit(value, sharedMultiEndTime)
                                ) {
                                  setSharedMultiEndTime("");
                                }
                              }}
                              bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                              isDark={isDark}
                            />
                          </div>
                          <div className={validationErrors.multiTimes ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                            <DropdownSelect
                              title="End Time"
                              options={filteredSharedMultiEndTimeOptions}
                              value={sharedMultiEndTime}
                              onChange={(value) => {
                                setValidationErrors((prev) => ({ ...prev, multiTimes: false }));
                                setSharedMultiEndTime(value);
                              }}
                              bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                              isDark={isDark}
                            />
                          </div>
                        </div>
                        <p className={`my-3 flex items-center gap-2 lg:mb-8 lg:mt-6 ${isDark ? "text-[#A9A9A9]" : "text-[#747171]"}`}>
                          <Check size={20} className={isDark ? "text-white" : "text-[#747171]"} />
                          Applied to {selectedDates.length} selected dates
                        </p>
                        <div className={`flex flex-col rounded-lg border p-4 transition-all lg:flex-row lg:items-center lg:justify-between lg:rounded-2xl lg:p-7 ${isDark ? "border-white/30 bg-[#171717]" : "border-[#E5E5E5]/40 bg-white shadow-sm"}`}>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-white" : "text-black"}`}>
                            {getFormattedDateString(selectedDates)}
                          </p>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-white/60" : "text-black"}`}>
                            {sharedMultiStartTime && sharedMultiEndTime ? `${getTimeLabel(sharedMultiStartTime)} - ${getTimeLabel(sharedMultiEndTime)}` : "Select time"}
                          </p>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-[#E8D1AB]" : "text-[#595959]"}`}>
                            {sharedMultiStartTime && sharedMultiEndTime && calculateDurationHours(sharedMultiStartTime, sharedMultiEndTime) !== null
                              ? `${calculateDurationHours(sharedMultiStartTime, sharedMultiEndTime)} Hours/Day`
                              : "Duration Hour/Day"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        {selectedDates.map((date) => {
                          const dateKey = getDateKey(date);
                          const isExpanded = expandedDateKey === dateKey;
                          const selectedStartKey = multiDayTimes[dateKey]?.startKey || "";
                          const individualDayStartOptions = timeOptions.filter(opt => !isTimeInPast(opt.key, date));
                          const individualDayEndOptions = timeOptions.filter(opt => {
                            const isFuture = !isTimeInPast(opt.key, date);
                            const isAfterStart = selectedStartKey ? opt.key > selectedStartKey : true;
                            const withinLimit = selectedStartKey ? isTimeRangeWithinDurationLimit(selectedStartKey, opt.key) : true;
                            return isFuture && isAfterStart && withinLimit;
                          });

                          return (
                            <div
                              key={date.toISOString()}
                              className={`rounded-2xl border ${isExpanded ? "overflow-visible" : "overflow-hidden"} ${isDark ? "border-white/10 bg-[#171717]" : "border-black/10 bg-white shadow-sm"}`}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)}
                                className={`flex w-full items-center justify-between px-6 py-5 ${isExpanded ? isDark ? "rounded-b-2xl border-b border-b-white/10" : "rounded-b-2xl border-b border-b-black/5" : ""}`}
                              >
                                <span className={isDark ? "font-medium text-white" : "font-medium text-black"}>
                                  {format(date, "MMMM dd, yyyy")}
                                </span>
                                <ChevronDown className={`${isDark ? "text-white/40" : "text-black/50"} transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>

                              {isExpanded ? (
                                <div className={`rounded-b-2xl p-4 transition-colors lg:p-7 ${isDark ? "bg-[#101010]" : "bg-black/5"}`}>
                                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className={validationErrors.multiTimes ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                                      <DropdownSelect
                                        title="Start Time"
                                        options={individualDayStartOptions}
                                        value={multiDayTimes[dateKey]?.startKey || ""}
                                        onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                        bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                        isDark={isDark}
                                      />
                                    </div>
                                    <div className={validationErrors.multiTimes ? "[&>div>div:first-child]:!text-[#ef4444] [&>div>div:nth-child(2)]:!border-[#ef4444]" : ""}>
                                      <DropdownSelect
                                        title="End Time"
                                        options={individualDayEndOptions}
                                        value={multiDayTimes[dateKey]?.endKey || ""}
                                        onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                        bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                        isDark={isDark}
                                      />
                                    </div>
                                  </div>
                                  <div className={`mt-2 w-fit rounded-lg px-4 py-2 lg:mt-4 lg:rounded-xl lg:px-7 lg:py-3 ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"}`}>
                                    <p className={`text-xs font-medium lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>
                                      Duration: {multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey && calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "") !== null
                                        ? `${calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "")} hours`
                                        : "Select time"}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}

                        <div className={`rounded-lg border p-4 transition-all lg:rounded-2xl lg:p-7 ${isDark ? "border-white/30 bg-[#171717]" : "border-[#E5E5E5]/40 bg-white shadow-sm"}`}>
                          <div className="space-y-4">
                            {selectedDates.map((date) => {
                              const dateKey = getDateKey(date);
                              const startKey = multiDayTimes[dateKey]?.startKey || "";
                              const endKey = multiDayTimes[dateKey]?.endKey || "";
                              const duration = startKey && endKey ? calculateDurationHours(startKey, endKey) : null;

                              return (
                                <div
                                  key={`summary-${dateKey}`}
                                  className={`flex flex-col gap-2 rounded-xl px-4 py-3 lg:flex-row lg:items-center lg:justify-between ${isDark ? "bg-[#101010]" : "bg-[#F8F8F8]"}`}
                                >
                                  <p className={`font-medium lg:text-[18px] ${isDark ? "text-white" : "text-black"}`}>
                                    {format(date, "MMMM dd, yyyy")}
                                  </p>
                                  <p className={`font-medium lg:text-[18px] ${isDark ? "text-white/60" : "text-black"}`}>
                                    {startKey && endKey ? `${getTimeLabel(startKey)} - ${getTimeLabel(endKey)}` : "Select time"}
                                  </p>
                                  <p className={`font-medium lg:text-[18px] ${isDark ? "text-[#E8D1AB]" : "text-[#595959]"}`}>
                                    {duration !== null ? `${duration} Hours` : "Duration"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {showLocationField ? (
            <div className="my-4 lg:my-9">
              <h3 className={`mb-6 text-base font-medium lg:text-xl ${isDark ? "text-white" : "text-black/90"}`}>
                Location
              </h3>
              <LocationPicker
                value={location}
                onChange={(address, details) => {
                  setLocation(address);
                  setLocationDetails(details || null);
                  setValidationErrors((prev) => ({ ...prev, location: false }));
                }}
                placeholder="Search for a location"
                colors={validationErrors.location ? {
                  ...(isDark ? darkThemeColors : {}),
                  inputBorder: "#ef4444",
                  inputBorderHover: "#ef4444",
                  inputBorderFocus: "#ef4444",
                  labelText: "#ef4444",
                  errorText: "#ef4444",
                } : isDark ? darkThemeColors : undefined}
                hasError={validationErrors.location}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`h-12 rounded-xl px-6 ${isDark ? "border-white/20 bg-transparent text-white hover:bg-white/5" : "border-[#E3E3E3] bg-white text-black hover:bg-black/5"}`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!validateBeforeSubmit()) {
                return;
              }

              if (bookingType === "single_day") {
                onSubmit({
                  bookingType,
                  ...(showLocationField
                    ? {
                        location: location.trim(),
                        location_latitude:
                          locationDetails?.coordinates?.lat ??
                          locationDetails?.lat ??
                          locationDetails?.center?.[1] ??
                          undefined,
                        location_longitude:
                          locationDetails?.coordinates?.lng ??
                          locationDetails?.lng ??
                          locationDetails?.center?.[0] ??
                          undefined,
                      }
                    : {}),
                  singleDay: {
                    date: selectedShootDate ? getDateKey(selectedShootDate) : "",
                    startTime: getStartTimeKey(),
                    endTime: getEndTimeKey(),
                  },
                });
                return;
              }

              onSubmit({
                bookingType,
                ...(showLocationField
                  ? {
                      location: location.trim(),
                      location_latitude:
                        locationDetails?.coordinates?.lat ??
                        locationDetails?.lat ??
                        locationDetails?.center?.[1] ??
                        undefined,
                      location_longitude:
                        locationDetails?.coordinates?.lng ??
                        locationDetails?.lng ??
                        locationDetails?.center?.[0] ??
                        undefined,
                    }
                  : {}),
                multiDay: {
                  sameTimings: sameTimingsMulti,
                  sharedStartTime: sameTimingsMulti ? sharedMultiStartTime : undefined,
                  sharedEndTime: sameTimingsMulti ? sharedMultiEndTime : undefined,
                  days: selectedDates.map((date) => {
                    const dateKey = getDateKey(date);
                    return {
                      date: dateKey,
                      startTime: sameTimingsMulti
                        ? sharedMultiStartTime
                        : multiDayTimes[dateKey]?.startKey || "",
                      endTime: sameTimingsMulti
                        ? sharedMultiEndTime
                        : multiDayTimes[dateKey]?.endKey || "",
                    };
                  }),
                },
              });
            }}
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-[#E8D1AB] px-6 font-semibold text-black hover:bg-[#d8c39a]"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
