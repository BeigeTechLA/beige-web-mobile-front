"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Check,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building2,
  ChevronDown,
  X,
  Camera
} from "lucide-react";
import Image from "next/image";
import {
  format,
  parseISO,
  set,
  isValid,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  startOfDay,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addDays,
} from "date-fns";
import { toast } from "sonner";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import { AnimatePresence, motion } from "framer-motion";
import { getFormattedDateString } from "@/lib/utils";

// Fallback/stub helpers to prevent runtime errors
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : new Date(dateStr);
};

const pushToDataLayer = (...args: any[]) => { };
const scrollToRef = (ref: any) => { };
const areBookingDaysEqual = (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b);
const USER_TYPE: Record<number, string> = {};

interface ScheduleShootStepProps {
  onBack?: () => void;
  onContinue?: (data: any) => void;
  onBrowseStudios?: () => void;
  isStudioFlow?: boolean;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
  initialData?: {
    dateOption?: "have-date" | "confirm-later";
    bookingType?: "single_day" | "multi_day" | null;
    startDate?: string | null;
    endDate?: string | null;
    bookingDays?: Array<{
      date: string;
      startTime?: string;
      endTime?: string;
      start_time?: string;
      end_time?: string;
    }>;
    location?: string;
    locationDetails?: unknown;
  } | null;
}

export const ScheduleShoot: React.FC<ScheduleShootStepProps> = ({
  onBack,
  onContinue,
  onBrowseStudios,
  isStudioFlow = false,
  title = " When & Where are you planning to shoot?",
  subtitle = "We can always refine the exact dates together later.",
  stepNumber = "03",
  completionPercentage = 40,
  initialData,
}) => {
  // Don't fabricate a "now" default — an unpicked date/time should stay empty,
  // otherwise validate() will immediately flag the un-chosen default as
  // violating the 4-hour lead time.
  const initialStartDate = initialData?.startDate || "";
  const initialEndDate = initialData?.endDate || "";
  const initialBookingDays = initialData?.bookingDays || [];
  const initialSelectedDates = initialBookingDays
    .map((day) => parseDate(day.date))
    .filter((date): date is Date => Boolean(date));
  const initialMultiDayTimes = initialBookingDays.reduce<
    Record<string, { startKey?: string; endKey?: string }>
  >((acc, day) => {
    acc[day.date] = {
      startKey: day.startTime || day.start_time,
      endKey: day.endTime || day.end_time,
    };
    return acc;
  }, {});

  // Top level mode: "have-date" | "confirm-later"
  const [dateOption, setDateOption] = useState<"have-date" | "confirm-later">(
    initialData?.dateOption || "have-date"
  );

  // Booking type mode: "single_day" | "multi_day"
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(
    initialData?.bookingType || "single_day"
  );

  // Input states
  const [selectedDate, setSelectedDate] = useState("06 Jan, 2026");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("06:00 PM");
  const [location, setLocation] = useState(
    initialData?.location || ""
  );
  const [locationDetails, setLocationDetails] = useState<unknown>(
    initialData?.locationDetails || null
  );

  // Missing State Definitions
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(
    initialStartDate ? parseDate(initialStartDate) : null
  );
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const [data, setData] = useState<any>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    bookingType: initialData?.bookingType || "single_day",
    bookingDays: initialBookingDays,
    email: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>(initialMultiDayTimes);
  const [selectedDates, setSelectedDates] = useState<Date[]>(initialSelectedDates);
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Missing Refs Definitions
  const dateChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const editsRef = useRef<HTMLDivElement | null>(null);

  const reelRef = useRef<HTMLDivElement>(null);
  const selectedDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isDraggingReel = useRef(false);
  const didDragReel = useRef(false);
  const suppressChipClickUntil = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasHydratedMultiDayState = useRef(false);

  const updateData = useCallback((fields: Partial<any>) => {
    setData((prev: any) => ({ ...prev, ...fields }));
  }, []);

  const validate = () => {
    if (dateOption !== "have-date") return true;

    if (!location) {
      toast.error("Please select a location");
      setErrors((prev) => (prev.includes("locationError") ? prev : [...prev, "locationError"]));
      return false;
    }

    const now = new Date();
    const minimumTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    if (bookingType === "single_day") {
      if (!data.startDate) {
        toast.error("Please select a start date and time");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      if (!data.endDate) {
        toast.error("Please select an end date and time");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      if (new Date(data.endDate) <= new Date(data.startDate)) {
        toast.error("End time must be after start time");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const startDateObj = parseDate(data.startDate);
      if (startDateObj && isTodayDate(startDateObj) && startDateObj < minimumTime) {
        toast.error("Start time must be at least 4 hours from now.");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
    } else {
      if (!data.bookingDays || data.bookingDays.length === 0) {
        toast.error("Please select at least one booking day");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const hasPastDate = data.bookingDays.some((d: { date: string }) => {
        const dayDate = getDateFromDateKey(d.date);
        return dayDate && startOfDay(dayDate) < startOfDay(now);
      });
      if (hasPastDate) {
        toast.error("Selected dates cannot be in the past.");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const hasMissingTimes = data.bookingDays.some(
        (d: { startTime?: string; endTime?: string }) => !d.startTime || !d.endTime
      );
      if (hasMissingTimes) {
        toast.error("Please select start and end time for all selected days");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const hasInvalidOrder = data.bookingDays.some(
        (d: { startTime?: string; endTime?: string }) => (d.startTime as string) >= (d.endTime as string)
      );
      if (hasInvalidOrder) {
        toast.error("For each selected day, end time must be after start time.");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const hasInvalidSameDayLeadTime = data.bookingDays.some((d: { date: string; startTime?: string }) => {
        const dayDate = getDateFromDateKey(d.date);
        if (!dayDate || !isTodayDate(dayDate) || !d.startTime) return false;
        const [hours, minutes] = d.startTime.split(":").map(Number);
        if ([hours, minutes].some((n) => Number.isNaN(n))) return false;
        const dayStart = set(dayDate, { hours, minutes, seconds: 0, milliseconds: 0 });
        return dayStart < minimumTime;
      });
      if (hasInvalidSameDayLeadTime) {
        toast.error("Today's selected start time must be at least 4 hours from now.");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const startDateValue = dateOption === "have-date" ? data.startDate || null : null;
    const endDateValue = dateOption === "have-date" ? data.endDate || null : null;

    if (onContinue) {
      onContinue({
        dateOption,
        bookingType: dateOption === "have-date" ? bookingType : null,
        date: startDateValue,
        startDate: startDateValue,
        endDate: endDateValue,
        startTime: dateOption === "have-date" ? getStartTimeKey() : null,
        endTime: dateOption === "have-date" ? getEndTimeKey() : null,
        bookingDays: dateOption === "have-date" ? data.bookingDays || [] : [],
        location,
        locationDetails,
      });
    }
  };

  // Generate time options
  useEffect(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = i.toString().padStart(2, "0");
        const minute = j.toString().padStart(2, "0");
        const key = `${hour}:${minute}`;

        const date = new Date();
        date.setHours(i);
        date.setMinutes(j);
        const value = format(date, "h:mm aa");

        options.push({ key, value });
      }
    }
    setTimeOptions(options);

    // add GA event on initial load
    pushToDataLayer("booking_page_viewed_step1", {
      type: "Action Tracking",
      page_name: "Book-a-shoot Page",
      location_in_website: "book_a_shoot_step1",
      user_id: isAuthenticated ? user?.id : "Guest",
      user_type: isAuthenticated && user?.user_type_id !== undefined
        ? USER_TYPE[user.user_type_id]
        : "Guest",
      email: isAuthenticated ? user?.email : data.email,
      phone: isAuthenticated ? user?.phone_number : "Unknown",
      duration_on_page: performance.now() / 1000,
    });
  }, []);

  const reelDays = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(currentCalendarMonth);
    const monthEnd = endOfMonth(currentCalendarMonth);
    const start =
      isSameMonth(currentCalendarMonth, now) && now > monthStart
        ? startOfDay(now)
        : monthStart;
    if (start > monthEnd) return [];
    return eachDayOfInterval({ start, end: monthEnd });
  }, [currentCalendarMonth]);

  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarMonth));
    const end = endOfWeek(endOfMonth(currentCalendarMonth));
    return eachDayOfInterval({ start, end });
  }, [currentCalendarMonth]);

  const formatLocalDateTime = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  };

  // --- Move these helpers up here ---
  const getStartTimeKey = () => {
    if (!data.startDate) return "";
    const date = parseDate(data.startDate);
    if (!date) return "";
    return format(date, "HH:mm");
  };

  const getEndTimeKey = () => {
    if (!data.endDate) return "";
    const date = parseDate(data.endDate);
    if (!date) return "";
    return format(date, "HH:mm");
  };

  // --- Now the useMemos can safely use them ---
  const filteredStartTimeOptions = React.useMemo(() => {
    const selectedDate = data.startDate
      ? parseDate(data.startDate)
      : selectedShootDate;
    if (!selectedDate) return timeOptions;
    const now = new Date();

    const isToday =
      selectedDate?.getDate() === now.getDate() &&
      selectedDate?.getMonth() === now.getMonth() &&
      selectedDate?.getFullYear() === now.getFullYear();

    if (!isToday) return timeOptions;

    // Calculate minimum key (4 hours from now)
    const minTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const minKey = format(minTime, "HH:mm");

    return timeOptions.filter((opt) => opt.key >= minKey);
  }, [data.startDate, selectedShootDate, timeOptions]);

  const filteredEndTimeOptions = React.useMemo(() => {
    // If no start date/time is selected, show all
    if (!data.startDate) return timeOptions;

    const startTimeKey = getStartTimeKey();

    // Only show times that are AFTER the selected start time
    return timeOptions.filter((opt) => opt.key > startTimeKey);
  }, [data.startDate, timeOptions]);

  const getDateFromDateKey = useCallback((dateKey: string) => {
    const parsed = new Date(`${dateKey}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const isTodayDate = useCallback((date: Date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }, []);

  const getDateSpecificStartOptions = useCallback((dateKey: string) => {
    const date = getDateFromDateKey(dateKey);
    if (!date || !isTodayDate(date)) return timeOptions;
    const minKey = format(new Date(Date.now() + 4 * 60 * 60 * 1000), "HH:mm");
    return timeOptions.filter((opt) => opt.key >= minKey);
  }, [getDateFromDateKey, isTodayDate, timeOptions]);

  const getDateSpecificEndOptions = useCallback((dateKey: string) => {
    const dayStartKey = multiDayTimes[dateKey]?.startKey;
    if (!dayStartKey) return getDateSpecificStartOptions(dateKey);
    return getDateSpecificStartOptions(dateKey).filter((opt) => opt.key > dayStartKey);
  }, [getDateSpecificStartOptions, multiDayTimes]);

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setSelectedShootDate(null);
      updateData({ startDate: "", endDate: "" });
      return;
    }

    setSelectedShootDate(date);

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const existingStart = data.startDate ? parseDate(data.startDate) : null;
    const existingEnd = data.endDate ? parseDate(data.endDate) : null;

    let finalStart: Date;
    let finalEnd: Date;

    if (existingStart && existingEnd) {
      finalStart = set(date, {
        hours: existingStart.getHours(),
        minutes: existingStart.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      finalEnd = set(date, {
        hours: existingEnd.getHours(),
        minutes: existingEnd.getMinutes(),
        seconds: 0,
        milliseconds: 0,
      });

      if (isToday) {
        const minStartTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

        if (finalStart < minStartTime) {
          const roundedStart = new Date(minStartTime);
          const mins = roundedStart.getMinutes();
          if (mins > 0 && mins <= 30) {
            roundedStart.setMinutes(30, 0, 0);
          } else if (mins > 30) {
            roundedStart.setHours(roundedStart.getHours() + 1, 0, 0, 0);
          } else {
            roundedStart.setMinutes(0, 0, 0);
          }

          finalStart = roundedStart;
          const durationMs = existingEnd.getTime() - existingStart.getTime();
          finalEnd = new Date(finalStart.getTime() + (durationMs > 0 ? durationMs : 8 * 60 * 60 * 1000));
        }
      }
    } else {
      if (isToday) {
        const minStart = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        const mins = minStart.getMinutes();
        if (mins > 0 && mins <= 30) {
          minStart.setMinutes(30, 0, 0);
        } else if (mins > 30) {
          minStart.setHours(minStart.getHours() + 1, 0, 0, 0);
        } else {
          minStart.setMinutes(0, 0, 0);
        }
        finalStart = minStart;
        finalEnd = new Date(finalStart.getTime() + 8 * 60 * 60 * 1000);
      } else {
        finalStart = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
        finalEnd = set(date, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
      }
    }

    updateData({
      startDate: formatLocalDateTime(finalStart),
      endDate: formatLocalDateTime(finalEnd),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    if (!timeKey) {
      updateData({ startDate: "" });
      return;
    }

    const [hours, minutes] = timeKey.split(":").map(Number);
    const currentDate = data.startDate
      ? parseDate(data.startDate)
      : selectedShootDate || new Date();
    if (!currentDate) return;

    // Ensure we don't select a time before the current time
    const now = new Date();
    const selectedTime = new Date(currentDate.setHours(hours, minutes));

    if (selectedTime < now) {
      toast.error("Selected time must be later than the current time.");
      setErrors((prev) => [...prev, "timeError"]);
      return;
    }

    // Enforce a 4-hour gap for same-day bookings
    const minimumTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    if (selectedTime < minimumTime) {
      toast.error("You must select a start time at least 4 hours from now.");
      setErrors((prev) => [...prev, "timeError"]);
      return;
    }

    const newStart = set(currentDate, { hours, minutes });
    updateData({ startDate: formatLocalDateTime(newStart) });
  };

  const handleEndTimeChange = (timeKey: string) => {
    if (!timeKey) {
      updateData({ endDate: "" });
      return;
    }

    const [hours, minutes] = timeKey.split(":").map(Number);

    const baseDate = data.startDate
      ? parseDate(data.startDate)
      : selectedShootDate || new Date();
    if (!baseDate) return;

    const newEnd = set(new Date(baseDate), {
      hours,
      minutes,
      seconds: 0,
      milliseconds: 0
    });

    updateData({ endDate: formatLocalDateTime(newEnd) });
    scrollToRef(editsRef);
  };

  const toggleDateSelection = (date: Date) => {
    const clickedDateKey = getDateKey(date);
    setSelectedDates((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      }
      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
    if (bookingType === "multi_day") {
      setSelectedShootDate(date);
    }
    requestAnimationFrame(() => {
      dateChipRefs.current[clickedDateKey]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
  };

  const getTimeLabel = (key: string) => {
    if (!key) return "";
    const match = timeOptions.find((opt) => opt.key === key);
    return match ? match.value : key;
  };

  const calculateDurationHours = (startKey: string, endKey: string) => {
    if (!startKey || !endKey) return null;
    const [sh, sm] = startKey.split(":").map(Number);
    const [eh, em] = endKey.split(":").map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = endMinutes - startMinutes;
    if (diff <= 0) return null;
    return Math.round((diff / 60) * 100) / 100;
  };

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const buildDateTimeString = useCallback((date: Date, timeKey: string) => {
    const [hours, minutes] = timeKey.split(":").map(Number);
    const nextDate = set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
    return formatLocalDateTime(nextDate);
  }, []);

  const buildMultiDayTimeMap = useCallback((
    dates: Date[],
    fallback: { startKey?: string; endKey?: string } = {},
    existing: Record<string, { startKey?: string; endKey?: string }> = {}
  ) => {
    return dates.reduce<Record<string, { startKey?: string; endKey?: string }>>((acc, date) => {
      const dateKey = getDateKey(date);
      acc[dateKey] = existing[dateKey] || { ...fallback };
      return acc;
    }, {});
  }, []);

  const handleSameTimingsModeChange = (useSameTimings: boolean) => {
    setSameTimingsMulti(useSameTimings);
    setExpandedDateKey(null);

    if (useSameTimings) {
      const firstSelectedDate = selectedDates[0];
      const firstSelectedTiming = firstSelectedDate
        ? multiDayTimes[getDateKey(firstSelectedDate)]
        : undefined;

      if (firstSelectedDate && firstSelectedTiming?.startKey && firstSelectedTiming?.endKey) {
        updateData({
          startDate: buildDateTimeString(firstSelectedDate, firstSelectedTiming.startKey),
          endDate: buildDateTimeString(firstSelectedDate, firstSelectedTiming.endKey),
        });
      }

      return;
    }

    const startKey = getStartTimeKey();
    const endKey = getEndTimeKey();
    setMultiDayTimes((prev) => buildMultiDayTimeMap(selectedDates, { startKey, endKey }, prev));
  };

  const handleMultiDayStartTimeChange = (dateKey: string, timeKey: string) => {
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], startKey: timeKey }
    }));
  };

  const handleMultiDayEndTimeChange = (dateKey: string, timeKey: string) => {
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], endKey: timeKey }
    }));
  };

  useEffect(() => {
    if (bookingType !== "multi_day" || sameTimingsMulti) {
      return;
    }

    const startKey = getStartTimeKey();
    const endKey = getEndTimeKey();
    setMultiDayTimes((prev) => buildMultiDayTimeMap(selectedDates, { startKey, endKey }, prev));

    if (expandedDateKey && !selectedDates.some((date) => getDateKey(date) === expandedDateKey)) {
      setExpandedDateKey(null);
    }
  }, [bookingType, sameTimingsMulti, selectedDates, expandedDateKey, data.startDate, data.endDate, buildMultiDayTimeMap]);

  useEffect(() => {
    if ((data.bookingType || "single_day") !== bookingType) {
      updateData({ bookingType });
    }
  }, [bookingType, data.bookingType, updateData]);

  // Clear location error once location is selected
  useEffect(() => {
    if (location && errors.includes("locationError")) {
      setErrors(prev => prev.filter(err => err !== "locationError"));
    }
  }, [location, errors]);

  // Clear timeError once data becomes valid again
  useEffect(() => {
    if (!errors.includes("timeError")) return;

    const hasMultiDayTimes =
      Array.isArray(data.bookingDays) &&
      data.bookingDays.length > 0 &&
      data.bookingDays.every((d: { startTime?: string; endTime?: string }) => d.startTime && d.endTime);

    const isValidNow =
      (bookingType === "single_day" && data.startDate && data.endDate && new Date(data.endDate) > new Date(data.startDate)) ||
      (bookingType === "multi_day" && hasMultiDayTimes);

    if (isValidNow) {
      setErrors((prev) => prev.filter((e) => e !== "timeError"));
    }
  }, [data.startDate, data.endDate, data.bookingDays, bookingType, errors]);

  useEffect(() => {
    if (bookingType !== "multi_day") {
      if ((data.bookingDays?.length || 0) > 0) {
        updateData({ bookingDays: [] });
      }
      return;
    }

    if (!selectedDates.length) {
      if ((data.bookingDays?.length || 0) > 0) {
        updateData({ bookingDays: [] });
      }
      return;
    }

    const startKey = getStartTimeKey();
    const endKey = getEndTimeKey();

    const days = selectedDates.map((date) => {
      const dateKey = getDateKey(date);
      const dayTimes = multiDayTimes[dateKey] || {};
      const finalStart = sameTimingsMulti ? startKey : dayTimes.startKey;
      const finalEnd = sameTimingsMulti ? endKey : dayTimes.endKey;
      return {
        date: dateKey,
        startTime: finalStart,
        endTime: finalEnd
      };
    });

    if (!areBookingDaysEqual(days, data.bookingDays || [])) {
      updateData({ bookingDays: days });
    }
  }, [
    bookingType,
    selectedDates,
    data.startDate,
    data.endDate,
    data.bookingDays,
    sameTimingsMulti,
    multiDayTimes,
    updateData
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 text-white select-none">
      {/* Top Navigation */}
      <div className="lg:mb-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div
            className="h-full w-2/5 bg-[#E8D1AB] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Top Date Selection Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: I have a date */}
        <div
          onClick={() => setDateOption("have-date")}
          className={`relative p-4 lg:p-7 rounded-lg lg:rounded-2xl border transition-all cursor-pointer flex justify-between items-center lg:items-start ${dateOption === "have-date"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border-transparent shadow-lg"
            : "bg-[#121212] border-white/10 text-white hover:border-white/20"
            }`}
        >
          <div>
            <h3 className={`text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold mb-1 ${dateOption === "have-date" ? "text-black" : "text-[#E8D1AB]"}`}>
              I have a date
            </h3>
            <p className={`text-xs lg:text-base font-light ${dateOption === "have-date" ? "text-black/70" : "text-white/40"}`}>
              Specific shoot day and time
            </p>
          </div>
          {dateOption === "have-date" && (
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-black text-white flex items-center justify-center">
              <Check className="w-3 h-3 lg:h-6 lg:w-6 stroke-2" />
            </div>
          )}
        </div>

        {/* Card 2: I'll confirm later */}
        <div
          onClick={() => setDateOption("confirm-later")}
          className={`relative p-4 lg:p-7 rounded-lg lg:rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${dateOption === "confirm-later"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border-transparent shadow-lg"
            : "bg-[#121212] border-white/10 text-white hover:border-white/20"
            }`}
        >
          <div>
            <h3 className={`text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold mb-1 ${dateOption === "confirm-later" ? "text-black" : "text-[#E8D1AB]"}`}>
              I'll confirm later
            </h3>
            <p className={`text-xs lg:text-base font-light ${dateOption === "confirm-later" ? "text-black/70" : "text-white/40"}`}>
              Hold my spot for 30 days
            </p>
          </div>
          {dateOption === "confirm-later" && (
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-black text-white flex items-center justify-center">
              <Check className="w-3 h-3 lg:h-6 lg:w-6 stroke-2" />
            </div>
          )}
        </div>
      </div>

      <hr className={`border-t border-white/20 my-5 lg:my-10`} />

      {/* DYNAMIC SECTION BASED ON DATE OPTION */}
      {dateOption === "have-date" ? (
        /* View 1: Booking For + Inputs */
        <div className="space-y-4 lg:space-y-10 lg:mb-10">
          <div>
            <h2 className="text-base lg:text-[26px] font-medium font-['Roboto_Condensed'] text-white mb-4">
              Booking For
            </h2>

            {/* Segmented Pill Switch */}
            <div className="flex w-fit h-15 lg:h-20 rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 overflow-hidden px-8">
              <button
                type="button"
                onClick={() => setBookingType("single_day")}
                className={`!lg:w-[228px] relative px-8 py-3.5 lg:px-12 lg:py-8 text-sm lg:text-lg font-medium transition-all cursor-pointer flex-1 flex items-center justify-center ${bookingType === "single_day" ? "text-[#E8D1AB]" : "text-white/50 hover:text-white"}`}
              >
                {bookingType === "single_day" && (
                  <>
                    {/* Trapezoid Glow SVG */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                      viewBox="0 0 227 59"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M50 59H187L227 0H0L50 59Z" fill="url(#paint_single)" />
                      <defs>
                        <linearGradient
                          id="paint_single"
                          x1="113.5"
                          y1="2.55597e-06"
                          x2="119.605"
                          y2="456.715"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#E8D1AB" stopOpacity="0" />
                          <stop offset="1" stopColor="#E8D1AB" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Bottom Solid Indicator Bar */}
                    <div
                      className="absolute bottom-0 h-[3px] bg-[#E8D1AB] rounded-t-full left-0 right-0 md:left-[22%] md:right-[17.6%]"
                    />
                  </>
                )}
                <span className="relative z-10">Single Day</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingType("multi_day")}
                className={`!lg:w-[228px] relative px-8 py-3.5 lg:px-12 lg:py-8 text-sm lg:text-lg font-medium transition-all cursor-pointer flex-1 flex items-center justify-center ${bookingType === "multi_day" ? "text-[#E8D1AB]" : "text-white/50 hover:text-white"}`}
              >
                {bookingType === "multi_day" && (
                  <>
                    {/* Trapezoid Glow SVG */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      preserveAspectRatio="none"
                      viewBox="0 0 227 59"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M50 59H187L227 0H0L50 59Z" fill="url(#paint_multiple)" />
                      <defs>
                        <linearGradient
                          id="paint_multiple"
                          x1="113.5"
                          y1="2.55597e-06"
                          x2="119.605"
                          y2="456.715"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#E8D1AB" stopOpacity="0" />
                          <stop offset="1" stopColor="#E8D1AB" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Bottom Solid Indicator Bar */}
                    <div
                      className="absolute bottom-0 h-[3px] bg-[#E8D1AB] rounded-t-full left-0 right-0 md:left-[22%] md:right-[17.6%]"
                    />
                  </>
                )}
                <span className="relative z-10 shrink-0">Multiple Days</span>
              </button>
            </div>
          </div>

          {bookingType === "single_day" ? (
            <div className="space-y-3 lg:space-y-5">
              {/* Date & Time Inputs */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className={`flex-1 mt-2 ${errors.includes("timeError") ? "[&_label]:!text-red-400" : ""}`}>
                  <DatePicker
                    label="Select Date"
                    value={selectedShootDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    colors={datePickerColours}
                    format="MM/dd/yyyy"
                    floating={true}
                    // borderRadius={"20px"}
                    borderRadius={{ xs: "8px", lg: "16px" }}
                    sx={{
                      height: { xs: "56px", md: "82px" },
                    }}
                  />
                </div>
                <div className="flex-1">
                  <DropdownSelect
                    title="Start Time"
                    options={filteredStartTimeOptions}
                    value={getStartTimeKey()}
                    onChange={handleStartTimeChange}
                    bgColour="bg-[#101010]"
                    floatingTitle={true}
                  />
                </div>
                <div className="flex-1">
                  <DropdownSelect
                    title="End Time"
                    options={filteredEndTimeOptions}
                    value={getEndTimeKey()}
                    onChange={handleEndTimeChange}
                    bgColour="bg-[#101010]"
                    floatingTitle={true}
                  />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="pt-1">
                <span className="inline-block px-3 py-1.5 lg:px-6 lg:py-3.5 rounded-full bg-[#211F1C] text-xs lg:text-sm text-[#E8D1AB]">
                  Duration : {calculateDurationHours(getStartTimeKey(), getEndTimeKey()) || 0} Hours
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-8 lg:mb-15">
                <div className="flex justify-between items-center mb-4 lg:mb-6">
                  <h3 className={`text-base lg:text-2xl font-['Roboto_Condensed'] font-medium transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"}`}>
                    Select Date
                  </h3>
                  <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 lg:px-4 lg:py-2 rounded-lg transition-colors group ">
                    <span className="text-white font-medium group-hover:text-[#E8D1AB] text-base lg:text-2xl font-['Roboto_Condensed']">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                    <CalendarIcon size={20} className="text-white group-hover:text-[#E8D1AB] " />
                  </button>
                </div>

                {/* Horizontal Scroll Reel */}
                <div
                  ref={reelRef}
                  onWheel={(e) => {
                    if (!reelRef.current) return;
                    e.preventDefault();
                    reelRef.current.scrollLeft += e.deltaY;
                  }}
                  onPointerDown={(e) => {
                    if (!reelRef.current) return;
                    isDraggingReel.current = true;
                    didDragReel.current = false;
                    dragStartX.current = e.clientX;
                    dragStartY.current = e.clientY;
                    dragStartScrollLeft.current = reelRef.current.scrollLeft;
                  }}
                  onPointerMove={(e) => {
                    if (!reelRef.current || !isDraggingReel.current) return;
                    const dx = e.clientX - dragStartX.current;
                    const dy = e.clientY - dragStartY.current;
                    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
                      didDragReel.current = true;
                    }
                    if (didDragReel.current) {
                      reelRef.current.scrollLeft = dragStartScrollLeft.current - dx;
                    }
                  }}
                  onPointerUp={() => {
                    isDraggingReel.current = false;
                    if (didDragReel.current) {
                      suppressChipClickUntil.current = Date.now() + 150;
                    }
                    setTimeout(() => {
                      didDragReel.current = false;
                    }, 0);
                  }}
                  onPointerLeave={() => {
                    isDraggingReel.current = false;
                  }}
                  className="flex gap-3 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                >
                  {reelDays.map((date) => {
                    const isSelected = selectedDates.some(d => isSameDay(d, date));
                    return (
                      <button
                        type="button"
                        key={date.toISOString()}
                        ref={(el) => {
                          dateChipRefs.current[getDateKey(date)] = el;
                        }}
                        onClick={() => {
                          if (Date.now() < suppressChipClickUntil.current) return;
                          toggleDateSelection(date);
                        }}
                        className={`shrink-0 flex flex-col items-center justify-center w-15 lg:w-[100px] h-15 lg:h-[100px] rounded-full border transition-all ${isSelected ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-transparent border-white/10 text-white/40 hover:border-white/30"}`}
                      >
                        <span className="text-base lg:text-3xl font-bold">{format(date, "d")}</span>
                        <span className="text-[10px] lg:text-xs uppercase font-medium">{format(date, "EEE")}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
                  <div className="lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                    <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Total Days: {selectedDates.length}</p>
                  </div>
                  <div className="lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                    <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Selected Days: {getFormattedDateString(selectedDates)}</p>
                  </div>
                </div>

                {/* Calendar Popover */}
                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-14 z-50 bg-[#111] border border-white/10 p-5 rounded-2xl shadow-2xl w-[320px]">
                      <div className="flex justify-between items-center mb-6">
                        <button type="button" onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}>
                          <ChevronLeft size={20} />
                        </button>
                        <span className="text-white font-bold">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}>
                            <ChevronRight size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className="rounded-full p-1 hover:bg-white/10 transition-colors"
                            aria-label="Close calendar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 mb-2 uppercase font-bold">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                          const isSelected = selectedDates.some(d => isSameDay(d, date));
                          const isPast = startOfDay(date) < startOfDay(new Date());
                          return (
                            <button
                              type="button"
                              key={date.toISOString()}
                              disabled={isPast}
                              onClick={() => {
                                if (isPast) return;
                                toggleDateSelection(date);
                              }}
                              className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-colors ${isSelected ? "bg-[#E8D1AB] text-black" : isPast ? "text-white/20 cursor-not-allowed" : "text-white hover:bg-white/10"} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}
                            >
                              {format(date, "d")}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {selectedDates.length > 0 && (
                <div className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
                  <h3 className={`text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 transition-colors`}>Are timings same for all selected dates?</h3>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleSameTimingsModeChange(true)}
                      disabled={data.shootType === ""}
                      className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-lg lg:rounded-2xl border px-4 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${sameTimingsMulti ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                    >
                      <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                      <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"}`}>
                        {sameTimingsMulti && (
                          <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSameTimingsModeChange(false)}
                      disabled={data.shootType === ""}
                      className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-lg lg:rounded-2xl border px-4 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!sameTimingsMulti ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                    >
                      <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                      <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"}`}>
                        {!sameTimingsMulti && (
                          <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                        )}
                      </div>
                    </button>
                  </div>

                  {
                    sameTimingsMulti ? (
                      <div>
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <DropdownSelect
                              title="Start Time"
                              options={filteredStartTimeOptions}
                              value={getStartTimeKey()}
                              onChange={handleStartTimeChange}
                              bgColour="bg-[#101010]"
                              floatingTitle={true}
                            />
                          </div>
                          <div className="flex-1">
                            <DropdownSelect
                              title="End Time"
                              options={filteredEndTimeOptions}
                              value={getEndTimeKey()}
                              onChange={handleEndTimeChange}
                              bgColour="bg-[#101010]"
                              floatingTitle={true}
                            />
                          </div>
                        </div>
                        <p className="flex items-center gap-2 my-3 lg:mt-6 lg:mb-8 text-[#A9A9A9] text-sm lg:text-base">
                          <Check className="text-white w-4 h-4 lg:w-6 lg:h-6" /> Applied to {selectedDates.length} selected dates
                        </p>
                        <div className="bg-[#171717] rounded-lg lg:rounded-2xl border border-white/30 p-4 lg:p-7 flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center">
                          <p className="text-white font-medium text-sm lg:text-[20px]">
                            {getFormattedDateString(selectedDates)}
                          </p>
                          <p className="text-white/60 font-medium text-sm lg:text-[20px]">
                            {getStartTimeKey() && getEndTimeKey()
                              ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}`
                              : "Select time"}
                          </p>
                          <p className="text-[#E8D1AB] font-medium text-sm lg:text-[20px]">
                            {getStartTimeKey() && getEndTimeKey() && calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null
                              ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours/Day`
                              : "Duration Hour/Day"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 lg:space-y-4">
                        {selectedDates.map((date) => {
                          const dateKey = getDateKey(date);
                          const isExpanded = expandedDateKey === dateKey;
                          return (
                            <div
                              key={date.toISOString()}
                              ref={(el) => {
                                selectedDateCardRefs.current[dateKey] = el;
                              }}
                              className={`border border-white/10 rounded-lg lg:rounded-2xl bg-[#171717] ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const nextExpanded = isExpanded ? null : dateKey;
                                  setExpandedDateKey(nextExpanded);
                                  if (nextExpanded) {
                                    requestAnimationFrame(() => {
                                      selectedDateCardRefs.current[nextExpanded]?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "nearest",
                                        inline: "nearest",
                                      });
                                    });
                                  }
                                }}
                                className={`w-full py-3 px-6 lg:py-5 flex justify-between items-center ${isExpanded ? "border-b rounded-b-lg lg:rounded-b-2xl border-b-white/10 " : ""}`}
                              >
                                <span className="text-white text-sm lg:text-base font-medium">{format(date, "MMMM dd, yyyy")}</span>
                                <ChevronDown className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-[#101010] p-4 lg:p-7 overflow-visible rounded-2xl">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div className="flex-1">
                                        <DropdownSelect
                                          title="Start Time"
                                          options={getDateSpecificStartOptions(dateKey)}
                                          value={multiDayTimes[dateKey]?.startKey || ""}
                                          onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                          bgColour="bg-[#101010]"
                                          floatingTitle={true}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <DropdownSelect
                                          title="End Time"
                                          options={getDateSpecificEndOptions(dateKey)}
                                          value={multiDayTimes[dateKey]?.endKey || ""}
                                          onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                          bgColour="bg-[#101010]"
                                          floatingTitle={true}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-2 lg:mt-4 rounded-lg lg:rounded-full bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                                      <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">
                                        Duration: {multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey && calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "") !== null
                                          ? `${calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "")} hours`
                                          : "Select time"}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* View 2: Not Ready to Schedule Banner */
        <div className="p-4 lg:p-8 rounded-lg lg:rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 flex items-center gap-4">
          <div className="flex items-center justify-center flex-shrink-0">
            <Image
              src={"/images/misc/BookingFlow/CalendarBlock.png"}
              alt={"Calendar image"}
              height={74}
              width={114}
            />
          </div>
          <div>
            <h3 className="text-sm lg:text-lg font-medium text-[#E8D1AB] mb-1">
              Not Ready to Schedule?
            </h3>
            <p className="text-xs lg:text-sm text-[#A9A9A9]">
              "Secure your production now and finalize the date and time later with help from the Beige team."
            </p>
          </div>
        </div>
      )}

      <hr className={`border-t border-white/20 my-5 lg:my-10`} />

      {/* Location / Venue Section */}
      <div className="mb-5 lg:mb-8">
        <h2 className="text-base lg:text-[26px] font-medium font-['Roboto_Condensed'] text-white mb-4 lg:mb-8">
          Location / Venue
        </h2>
        {/* Location Input */}
        <LocationPicker
          value={location}
          onChange={(address, details) => {
            setLocation(address);
            setLocationDetails(details || null);
          }}
          placeholder="Search for a location"
          colors={darkThemeColors}
          hasError={errors.includes("locationError")}
          disabled={false}
        />
        {
          isStudioFlow &&
          <div className="pt-5">
            <span className="inline-block px-3 py-1.5 lg:px-6 lg:py-3.5 rounded-xl bg-[#211F1C] text-xs lg:text-sm text-[#E8D1AB]">
              Note : Studios are available for LA only
            </span>
          </div>
        }
      </div>

      {
        !isStudioFlow ? <>
          <hr className={`border-t border-white/20 my-5 lg:my-10`} />

          {/* Need a Studio Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 lg:w-19 h-12 lg:h-19 lg:rounded-xl lg:bg-[#E8D1AB] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 lg:w-11 h-8 lg:h-11 text-[#E8D1AB] lg:text-[#101010]" strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-sm lg:text-xl font-medium text-white">Need a Studio?</h3>
                <p className="text-xs lg:text-sm text-[#A9A9A9]">
                  Add a professional studio to your booking and get 15% off
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBrowseStudios}
              className="w-full lg:w-fit px-10 py-4 lg:py-6 rounded-md lg:rounded-lg bg-[#E8D1AB] text-[#101010] font-bold lg:font-medium text-sm lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
            >
              Browse Studios
            </button>
          </div>
        </> : <>
          <hr className={`border-t border-white/20 my-5 lg:my-10`} />

          {/* Need a Creator Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 lg:w-19 h-12 lg:h-19 lg:rounded-xl lg:bg-[#E8D1AB] flex items-center justify-center flex-shrink-0">
                <Camera className="w-8 lg:w-11 h-8 lg:h-11 text-[#E8D1AB] lg:text-[#101010]" strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-sm lg:text-xl font-medium text-white">Need a Photographer or Videographer for your Studio?</h3>
                <p className="text-xs lg:text-sm text-[#A9A9A9]">
                  Bring your shoot to life with top photographers/videographers at your studio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onBrowseStudios}
              className="w-full lg:w-fit px-10 py-4 lg:py-6 rounded-md lg:rounded-lg bg-[#E8D1AB] text-[#101010] font-bold lg:font-medium text-sm lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
            >
              Browse Creators
            </button>
          </div>
        </>
      }

      {/* Bottom Action Footer Bar */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 w-full lg:w-auto min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="px-10 py-3.5 w-full lg:w-auto rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ScheduleShoot;
