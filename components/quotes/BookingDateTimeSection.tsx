"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
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
import { getBrowserTimeZone } from "@/lib/timezone";

type BookingType = "single_day" | "multi_day" | "tbd";

type TimeOption = {
  key: string;
  value: string;
};

export type BookingScheduleData =
  | {
      booking_type: "single_day";
      time_zone: string;
      start_date: string;
      start_time: string;
      end_time: string;
    }
  | {
      booking_type: "multi_day";
      time_zone: string;
      booking_days: Array<{
        date: string;
        start_time: string;
        end_time: string;
      }>;
    }
  | {
      booking_type: "tbd";
      time_zone: string;
    };

type Props = {
  isDark: boolean;
  className?: string;
  initialData?: BookingScheduleData | null;
  onChange?: (value: BookingScheduleData | null) => void;
};

const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export default function BookingDateTimeSection({
  isDark,
  className = "",
  initialData = null,
  onChange,
}: Props) {
  const [bookingType, setBookingType] = useState<BookingType>(
    initialData?.booking_type ?? "single_day",
  );
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
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
  const isSyncingFromPropsRef = useRef(false);
  const isSwitchingBookingTypeRef = useRef(false);
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);

  const resetScheduleState = useCallback(() => {
    setSelectedShootDate(null);
    setStartDateTime("");
    setEndDateTime("");
    setSelectedDates([]);
    setSameTimingsMulti(true);
    setSharedMultiStartTime("");
    setSharedMultiEndTime("");
    setExpandedDateKey(null);
    setCurrentCalendarMonth(new Date());
    setMultiDayTimes({});
  }, []);

  const handleBookingTypeChange = useCallback((nextType: BookingType) => {
    if (bookingType !== nextType) {
      isSwitchingBookingTypeRef.current = true;
      resetScheduleState();
    }
    setBookingType(nextType);
  }, [bookingType, resetScheduleState]);

  const timeOptions = useMemo<TimeOption[]>(() => {
    const options: TimeOption[] = [];

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

  const getStartTimeKey = useCallback(() => {
    if (!startDateTime) return "";
    const date = new Date(startDateTime);
    return Number.isNaN(date.getTime()) ? "" : format(date, "HH:mm");
  }, [startDateTime]);

  const getEndTimeKey = useCallback(() => {
    if (!endDateTime) return "";
    const date = new Date(endDateTime);
    return Number.isNaN(date.getTime()) ? "" : format(date, "HH:mm");
  }, [endDateTime]);

  const updateDateTime = (date: Date | null, timeKey: string) => {
    if (!date || !timeKey) return "";

    const [hours, minutes] = timeKey.split(":").map(Number);
    const nextDate = new Date(date);
    nextDate.setHours(hours, minutes, 0, 0);
    return format(
      nextDate,
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

  const isTimeRangeValid = (startKey: string, endKey: string) => {
    return calculateDurationHours(startKey, endKey) !== null;
  };

  const isTimeInPast = (timeKey: string, date: Date | null) => {
    if (!date || !isSameDay(date, new Date())) return false;

    const now = new Date();
    const bufferMinutes = 4 * 60;
    const currentTotalMinutesWithBuffer =
      now.getHours() * 60 + now.getMinutes() + bufferMinutes;

    const [hour, minute] = timeKey.split(":").map(Number);
    const selectedTotalMinutes = hour * 60 + minute;

    return selectedTotalMinutes < currentTotalMinutesWithBuffer;
  };

  const filteredStartTimeOptions = useMemo(() => {
    return timeOptions.filter((option) => !isTimeInPast(option.key, selectedShootDate));
  }, [selectedShootDate, timeOptions]);

  const startKey = getStartTimeKey();
  const filteredEndTimeOptions = timeOptions.filter((option) => {
    const isFuture = !isTimeInPast(option.key, selectedShootDate);
    const isAfterStart = startKey ? option.key > startKey : true;
    return isFuture && isAfterStart;
  });

  const filteredSharedMultiStartTimeOptions = useMemo(() => {
    const hasToday = selectedDates.some((d) => isSameDay(d, new Date()));
    return timeOptions.filter((option) => !isTimeInPast(option.key, hasToday ? new Date() : null));
  }, [selectedDates, timeOptions]);

  const filteredSharedMultiEndTimeOptions = timeOptions.filter((option) => {
    const hasToday = selectedDates.some((d) => isSameDay(d, new Date()));
    const isFuture = !isTimeInPast(option.key, hasToday ? new Date() : null);
    const isAfterStart = sharedMultiStartTime ? option.key > sharedMultiStartTime : true;
    return isFuture && isAfterStart;
  });

  const getTimeLabel = (key: string) =>
    timeOptions.find((option) => option.key === key)?.value || key;

  const getFormattedDateString = (dates: Date[]) =>
    dates
      .slice()
      .sort((a, b) => a.getTime() - b.getTime())
      .map((date) => format(date, "MMM dd"))
      .join(", ");

  const toggleDateSelection = (date: Date) => {
    const dateKey = getDateKey(date);

    setSelectedDates((prev) => {
      const exists = prev.some((selectedDate) => isSameDay(selectedDate, date));
      if (exists) {
        setMultiDayTimes((currentTimes) => {
          if (!currentTimes[dateKey]) {
            return currentTimes;
          }

          const nextTimes = { ...currentTimes };
          delete nextTimes[dateKey];
          return nextTimes;
        });
        setExpandedDateKey((currentKey) => (currentKey === dateKey ? null : currentKey));
        return prev.filter((selectedDate) => !isSameDay(selectedDate, date));
      }

      if (!sameTimingsMulti) {
        setMultiDayTimes((currentTimes) => ({
          ...currentTimes,
          [dateKey]: currentTimes[dateKey] ?? {
            startKey: sharedMultiStartTime,
            endKey: sharedMultiEndTime,
          },
        }));
        setExpandedDateKey((currentKey) => currentKey ?? dateKey);
      }

      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    const currentEndKey = getEndTimeKey();
    if (currentEndKey && !isTimeRangeValid(timeKey, currentEndKey)) {
      setEndDateTime("");
    }
    setStartDateTime(updateDateTime(selectedShootDate, timeKey));
  };

  const handleEndTimeChange = (timeKey: string) => {
    setEndDateTime(updateDateTime(selectedShootDate, timeKey));
  };

  const handleMultiDayStartTimeChange = (dateKey: string, timeKey: string) => {
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        startKey: timeKey,
        endKey:
          prev[dateKey]?.endKey &&
          !isTimeRangeValid(timeKey, prev[dateKey]?.endKey || "")
            ? undefined
            : prev[dateKey]?.endKey,
      },
    }));
  };

  const handleMultiDayEndTimeChange = (dateKey: string, timeKey: string) => {
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        endKey: timeKey,
      },
    }));
  };

  React.useEffect(() => {
    isSyncingFromPropsRef.current = true;

    if (!initialData) {
      setBookingType("single_day");
      resetScheduleState();
      return;
    }

    setBookingType(initialData.booking_type);

    if (initialData.booking_type === "tbd") {
      resetScheduleState();
      return;
    }

    if (initialData.booking_type === "single_day") {
      const selectedDate = new Date(`${initialData.start_date}T00:00:00`);
      const startDateTime = new Date(`${initialData.start_date}T${initialData.start_time}`);
      const endDateTime = new Date(`${initialData.start_date}T${initialData.end_time}`);

      setSelectedShootDate(Number.isNaN(selectedDate.getTime()) ? null : selectedDate);
      setCurrentCalendarMonth(Number.isNaN(selectedDate.getTime()) ? new Date() : selectedDate);
      setStartDateTime(
        Number.isNaN(startDateTime.getTime())
          ? ""
          : format(startDateTime, "yyyy-MM-dd HH:mm:ss"),
      );
      setEndDateTime(
        Number.isNaN(endDateTime.getTime())
          ? ""
          : format(endDateTime, "yyyy-MM-dd HH:mm:ss"),
      );
      setSelectedDates([]);
      setSameTimingsMulti(true);
      setSharedMultiStartTime("");
      setSharedMultiEndTime("");
      setExpandedDateKey(null);
      setMultiDayTimes({});
      return;
    }

    const bookingDays = initialData.booking_days
      .filter((day) => Boolean(day?.date))
      .map((day) => {
        const date = new Date(`${day.date}T00:00:00`);
        const dateKey = format(date, "yyyy-MM-dd");
        return {
          date,
          dateKey,
          startKey: day.start_time?.slice(0, 5) || "",
          endKey: day.end_time?.slice(0, 5) || "",
        };
      })
      .filter((day) => day.dateKey && day.startKey && day.endKey);

    const firstBookingDay = bookingDays[0];
    const selectedDays = bookingDays.map((day) => day.date);
    const hasSharedTimings =
      Boolean(firstBookingDay) &&
      bookingDays.every(
        (day) =>
          day.startKey === firstBookingDay?.startKey &&
          day.endKey === firstBookingDay?.endKey,
      );

    setSelectedShootDate(null);
    setStartDateTime("");
    setEndDateTime("");
    setSelectedDates(selectedDays);
    setSameTimingsMulti(hasSharedTimings);
    setSharedMultiStartTime(hasSharedTimings ? firstBookingDay?.startKey || "" : "");
    setSharedMultiEndTime(hasSharedTimings ? firstBookingDay?.endKey || "" : "");
    setExpandedDateKey(firstBookingDay?.dateKey || null);
    setCurrentCalendarMonth(firstBookingDay?.date || new Date());
    setMultiDayTimes(
      bookingDays.reduce<Record<string, { startKey?: string; endKey?: string }>>(
        (acc, day) => {
          if (hasSharedTimings) {
            return acc;
          }

          acc[day.dateKey] = {
            startKey: day.startKey,
            endKey: day.endKey,
          };
          return acc;
        },
        {},
      ),
    );
  }, [initialData, resetScheduleState]);

  React.useEffect(() => {
    if (isSyncingFromPropsRef.current) {
      isSyncingFromPropsRef.current = false;
      return;
    }

    if (!onChange) {
      return;
    }

    if (bookingType === "tbd") {
      isSwitchingBookingTypeRef.current = false;
      onChange({
        booking_type: "tbd",
        time_zone: browserTimeZone,
      });
      return;
    }

    if (bookingType === "single_day") {
      const shootDate = selectedShootDate;
      const startTime = getStartTimeKey();
      const endTime = getEndTimeKey();
      if (!shootDate || !startTime || !endTime) {
        if (isSwitchingBookingTypeRef.current) {
          return;
        }
        onChange(null);
        return;
      }

      onChange({
        booking_type: "single_day",
        time_zone: browserTimeZone,
        start_date: format(shootDate, "yyyy-MM-dd"),
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      isSwitchingBookingTypeRef.current = false;
      return;
    }

    if (selectedDates.length === 0) {
      if (isSwitchingBookingTypeRef.current) {
        return;
      }
      onChange(null);
      return;
    }

    if (sameTimingsMulti) {
      if (!sharedMultiStartTime || !sharedMultiEndTime) {
        if (isSwitchingBookingTypeRef.current) {
          return;
        }
        onChange(null);
        return;
      }

      onChange({
        booking_type: "multi_day",
        time_zone: browserTimeZone,
        booking_days: selectedDates.map((date) => ({
          date: format(date, "yyyy-MM-dd"),
          start_time: `${sharedMultiStartTime}:00`,
          end_time: `${sharedMultiEndTime}:00`,
        })),
      });
      isSwitchingBookingTypeRef.current = false;
      return;
    }

    const allDaysReady = selectedDates.every((date) => {
      const dateKey = getDateKey(date);
      return multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey;
    });

    if (!allDaysReady) {
      if (isSwitchingBookingTypeRef.current) {
        return;
      }
      onChange(null);
      return;
    }

    onChange({
      booking_type: "multi_day",
      time_zone: browserTimeZone,
      booking_days: selectedDates.map((date) => {
        const dateKey = getDateKey(date);
        const day = multiDayTimes[dateKey];
        return {
          date: format(date, "yyyy-MM-dd"),
          start_time: `${day?.startKey}:00`,
          end_time: `${day?.endKey}:00`,
        };
      }),
    });
    isSwitchingBookingTypeRef.current = false;
  }, [
    bookingType,
    browserTimeZone,
    getEndTimeKey,
    getStartTimeKey,
    multiDayTimes,
    onChange,
    sameTimingsMulti,
    selectedDates,
    selectedShootDate,
    sharedMultiEndTime,
    sharedMultiStartTime,
  ]);

  return (
    <div className={className}>
      <div className={`border-t pt-6 ${isDark ? "border-white/10" : "border-black/5"}`}>
        <h3 className={`mb-3 text-base font-medium lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
          Select Booking Type
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => {
              handleBookingTypeChange("single_day");
            }}
            className={`flex h-14 w-fit min-w-[100px] items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[300px] lg:px-6 ${bookingType === "single_day" ? "border-transparent bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
          >
            <span className="pr-2 text-sm font-medium lg:text-lg">Single Day</span>
            <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border lg:h-8 lg:w-8 ${bookingType === "single_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
              {bookingType === "single_day" ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              handleBookingTypeChange("multi_day");
            }}
            className={`flex h-14 w-fit min-w-[100px] items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[300px] lg:px-6 ${bookingType === "multi_day" ? "border-transparent bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
          >
            <span className="pr-2 text-sm font-medium lg:text-lg">Multiple Days</span>
            <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border lg:h-8 lg:w-8 ${bookingType === "multi_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
              {bookingType === "multi_day" ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              handleBookingTypeChange("tbd");
            }}
            className={`flex h-14 w-fit min-w-[100px] items-center justify-between rounded-2xl border px-2 lg:h-[82px] lg:w-[220px] lg:px-6 ${bookingType === "tbd" ? "border-transparent bg-[#E8D1AB] text-black" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
          >
            <span className="pr-2 text-sm font-medium lg:text-lg">TBD</span>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full border lg:h-8 lg:w-8 ${bookingType === "tbd" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
              {bookingType === "tbd" ? <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" /> : null}
            </div>
          </button>
        </div>
      </div>

      <div className="my-4 lg:my-9">
        {bookingType === "tbd" ? (
          <div className={`rounded-2xl border px-4 py-5 lg:px-6 lg:py-7 ${isDark ? "border-white/10 bg-[#111]" : "border-black/5 bg-white shadow-sm"}`}>
            <h3 className={`mb-2 text-base font-medium lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
              Date & time TBD
            </h3>
            <p className={isDark ? "text-sm text-white/50" : "text-sm text-black/50"}>
              The booking date and time can be added later.
            </p>
          </div>
        ) : bookingType === "single_day" ? (
          <>
            <h3 className={`mb-3 text-base font-medium lg:mb-6 lg:text-xl ${isDark ? "text-white/90" : "text-black/80"}`}>
              Shoot Date & Time
            </h3>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              <DatePicker
                label="Select Date"
                value={selectedShootDate}
                onChange={setSelectedShootDate}
                format="MM/dd/yyyy"
                sx={{ height: { xs: "56px", md: "82px" }, borderRadius: "16px" }}
                isDark={isDark}
              />
              <DropdownSelect
                title="Start Time"
                options={filteredStartTimeOptions}
                value={getStartTimeKey()}
                onChange={handleStartTimeChange}
                bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                isDark={isDark}
              />
              <DropdownSelect
                title="End Time"
                options={filteredEndTimeOptions}
                value={getEndTimeKey()}
                onChange={handleEndTimeChange}
                bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                isDark={isDark}
              />
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
                className="flex cursor-grab select-none gap-3 overflow-x-auto pb-4 no-scrollbar active:cursor-grabbing"
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

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => toggleDateSelection(date)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors ${isSelected ? "bg-[#E8D1AB] text-black" : isDark ? "text-white hover:bg-white/10" : "text-[#323232] hover:bg-black/10"} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}
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
                      const firstCompleteDay = selectedDates
                        .map((date) => multiDayTimes[getDateKey(date)])
                        .find(
                          (
                            timePair,
                          ): timePair is { startKey: string; endKey: string } =>
                            Boolean(
                              timePair?.startKey &&
                              timePair?.endKey &&
                              isTimeRangeValid(timePair.startKey, timePair.endKey),
                            ),
                        );
                      const nextStartTime =
                        sharedMultiStartTime || firstCompleteDay?.startKey || "";
                      const nextEndTime =
                        sharedMultiEndTime &&
                          (!nextStartTime || isTimeRangeValid(nextStartTime, sharedMultiEndTime))
                          ? sharedMultiEndTime
                          : firstCompleteDay?.endKey || "";
                      setSameTimingsMulti(true);
                      setMultiDayTimes({});
                      setSharedMultiStartTime(nextStartTime);
                      setSharedMultiEndTime(
                        nextStartTime && nextEndTime && !isTimeRangeValid(nextStartTime, nextEndTime)
                          ? ""
                          : nextEndTime,
                      );
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
                      setExpandedDateKey((currentKey) => {
                        if (currentKey && selectedDates.some((date) => getDateKey(date) === currentKey)) {
                          return currentKey;
                        }

                        return selectedDates[0] ? getDateKey(selectedDates[0]) : null;
                      });
                      setMultiDayTimes((currentTimes) => {
                        const nextTimes: Record<string, { startKey?: string; endKey?: string }> = {};
                        selectedDates.forEach((date) => {
                          const key = getDateKey(date);
                          const existingTime = currentTimes[key];
                          const startKey = existingTime?.startKey || sharedMultiStartTime;
                          const existingEndKey =
                            existingTime?.endKey &&
                              (!startKey || isTimeRangeValid(startKey, existingTime.endKey))
                              ? existingTime.endKey
                              : "";
                          const sharedEndKey =
                            sharedMultiEndTime &&
                              (!startKey || isTimeRangeValid(startKey, sharedMultiEndTime))
                              ? sharedMultiEndTime
                              : "";

                          nextTimes[key] = {
                            startKey,
                            endKey: existingEndKey || sharedEndKey,
                          };
                        });
                        return nextTimes;
                      });
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
                      <DropdownSelect
                        title="Start Time"
                        options={filteredSharedMultiStartTimeOptions}
                        value={sharedMultiStartTime}
                        onChange={(value) => {
                          setSharedMultiStartTime(value);
                          if (sharedMultiEndTime && !isTimeRangeValid(value, sharedMultiEndTime)) {
                            setSharedMultiEndTime("");
                          }
                        }}
                        bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                        isDark={isDark}
                      />
                      <DropdownSelect
                        title="End Time"
                        options={filteredSharedMultiEndTimeOptions}
                        value={sharedMultiEndTime}
                        onChange={setSharedMultiEndTime}
                        bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                        isDark={isDark}
                      />
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
                      const individualDayStartOptions = timeOptions.filter((opt) => !isTimeInPast(opt.key, date));
                      const individualDayEndOptions = timeOptions.filter((opt) => {
                        const isFuture = !isTimeInPast(opt.key, date);
                        const isAfterStart = selectedStartKey ? opt.key > selectedStartKey : true;
                        return isFuture && isAfterStart;
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
                                <DropdownSelect
                                  title="Start Time"
                                  options={individualDayStartOptions}
                                  value={multiDayTimes[dateKey]?.startKey || ""}
                                  onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                  bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                  isDark={isDark}
                                />
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
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
