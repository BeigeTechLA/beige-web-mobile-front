"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
} from "lucide-react";
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
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import { AnimatePresence, motion } from "framer-motion";
import { getFormattedDateString } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const PLACEHOLDER_STUDIO = {
  id: "studio-1",
  name: "Beige Media",
  subtitle: "(Modern Resort Villa with Jacuzzi)",
  location: "Woodland Hills, Los Angeles,",
  rating: 4.5,
  reviewCount: 120,
  tags: ["Natural light", "Product-friendly"],
  pricePerHour: 150,
  availability: "Available Jun 24",
  image:
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
  link: "/studios/new-1787571533413",
  isAdded: true
}

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : new Date(dateStr);
};

const areBookingDaysEqual = (a: any[], b: any[]) =>
  JSON.stringify(a) === JSON.stringify(b);

export interface StudioScheduleSyncProps {
  onContinue: (data: {
    useSameSchedule: boolean;
    bookingType: "single_day" | "multi_day";
    startDate: string | null;
    endDate: string | null;
    bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
    duration: string;
  }) => void;
  onBack?: () => void;
  initialUseSameSchedule?: boolean;
  initialBookingType?: "single_day" | "multi_day";
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export const StudioScheduleSync: React.FC<StudioScheduleSyncProps> = ({
  onContinue,
  onBack,
  initialUseSameSchedule = true,
  initialBookingType = "multi_day",
  title = "Should the studio use the same schedule?",
  subtitle = "You can use your shoot schedule or set a separate date and time for the studio.",
  stepNumber = "03",
  completionPercentage = 60,
}) => {
  const [useSameSchedule, setUseSameSchedule] = useState<boolean>(initialUseSameSchedule);
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(initialBookingType);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);

  // Update parameter during integration
  const [isStudioJourney3, setIsStudioJourney3] = useState(true);
  const [selectedStudio, setSelectedStudio] = useState(PLACEHOLDER_STUDIO);

  // Single Day & Time States
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(new Date());
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const [data, setData] = useState<{
    startDate: string;
    endDate: string;
    bookingType: "single_day" | "multi_day";
    bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
  }>({
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    endDate: format(new Date(Date.now() + 8 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
    bookingType: initialBookingType,
    bookingDays: [],
  });

  // Multi Day States
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Refs
  const reelRef = useRef<HTMLDivElement>(null);
  const dateChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isDraggingReel = useRef(false);
  const didDragReel = useRef(false);
  const suppressChipClickUntil = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const updateData = useCallback((fields: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...fields }));
  }, []);

  // Generate 15-minute time options
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

    const minTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const minKey = format(minTime, "HH:mm");

    return timeOptions.filter((opt) => opt.key >= minKey);
  }, [data.startDate, selectedShootDate, timeOptions]);

  const filteredEndTimeOptions = React.useMemo(() => {
    if (!data.startDate) return timeOptions;
    const startTimeKey = getStartTimeKey();
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
      milliseconds: 0,
    });

    updateData({ endDate: formatLocalDateTime(newEnd) });
  };

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

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
      [dateKey]: { ...prev[dateKey], startKey: timeKey },
    }));
  };

  const handleMultiDayEndTimeChange = (dateKey: string, timeKey: string) => {
    setMultiDayTimes((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], endKey: timeKey },
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
    if (data.bookingType !== bookingType) {
      updateData({ bookingType });
    }
  }, [bookingType, data.bookingType, updateData]);

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
        endTime: finalEnd,
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
    updateData,
  ]);

  const handleContinue = () => {
    onContinue({
      useSameSchedule,
      bookingType,
      startDate: useSameSchedule ? null : data.startDate,
      endDate: useSameSchedule ? null : data.endDate,
      bookingDays: useSameSchedule ? [] : data.bookingDays,
      duration: "8 Hours",
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between select-none">
      <div>
        {/* Top Header Row */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="mb-5 lg:mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP {stepNumber}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-5 lg:mb-8">
          <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-white/30 text-base lg:text-xl">
            {subtitle}
          </p>
        </div>

        {/* Radio Options Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 mb-5 lg:mb-8">
          {/* Option 1: Yes, same schedule */}
          <div
            onClick={() => setUseSameSchedule(true)}
            className={`h-14 lg:h-[82px] rounded-lg lg:rounded-2xl border px-2 lg:px-6 flex items-center justify-between gap-2.5 transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${useSameSchedule
              ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] border-transparent text-black"
              : "bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20 hover:border-white/20 text-[#A9A9A9]"
              }`}
          >
            <span className="font-semibold text-sm md:text-lg">
              Yes, same schedule
            </span>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${useSameSchedule
                ? "border-black bg-black"
                : "border-white/40 bg-transparent"
                }`}
            >
              {useSameSchedule && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </div>

          {/* Option 2: No, different schedule */}
          <div
            onClick={() => setUseSameSchedule(false)}
            className={`h-14 lg:h-[82px] rounded-lg lg:rounded-2xl border px-2 lg:px-6 flex items-center justify-between gap-2.5 transition-colors duration-300 ease-in-out text-sm lg:text-lg font-medium cursor-pointer ${!useSameSchedule
              ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] border-transparent text-black"
              : "bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20 hover:border-white/20 text-[#A9A9A9]"
              }`}
          >
            <span className="font-semibold text-sm md:text-lg">
              No, different schedule
            </span>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${!useSameSchedule
                ? "border-black bg-black"
                : "border-white/40 bg-transparent"
                }`}
            >
              {!useSameSchedule && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </div>
        </div>

        {/* Accordion Schedule Edit Card when "No, different schedule" is active */}
        {useSameSchedule ? (
          <div className="w-full rounded-lg lg:rounded-2xl border border-white/20 bg-[#101010] overflow-hidden transition-all duration-300">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="w-full p-4 lg:px-5 lg:py-7 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <h3 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-medium text-[#E8D1AB]">
                {bookingType === "single_day" ? "Single Day" : "Multiple Days"}
              </h3>
              {isAccordionOpen ? (
                <ChevronUp className="w-5 h-5 text-white/70" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/70" />
              )}
            </button>

            {/* Accordion Body */}
            {
              isAccordionOpen && (
                <div className="px-5 md:px-6 pb-5 lg:pb-6 pt-2 border-t border-white/5 space-y-6">
                  {bookingType === "single_day" ? (
                    <div className="space-y-3 lg:space-y-5 pt-4">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 mt-2">
                          <DatePicker
                            label="Select Date"
                            value={selectedShootDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            colors={datePickerColours}
                            format="MM/dd/yyyy"
                            floating={true}
                            borderRadius={{ xs: "8px", lg: "16px" }}
                            sx={{
                              height: { xs: "56px", md: "82px" },
                            }}
                            disabled={true}
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
                            isDisabled={true}
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
                            isDisabled={true}
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="inline-block px-3 py-1.5 lg:px-6 lg:py-3.5 rounded-full bg-[#211F1C] text-xs lg:text-sm text-[#E8D1AB]">
                          Duration : 8 Hours
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* MULTI DAY VIEW */
                    <div className="space-y-3 lg:space-y-6">
                      {/* Timings Selector with Fallback Dummy Dates */}
                      {(() => {
                        const datesToRender =
                          selectedDates.length > 0
                            ? selectedDates
                            : [new Date("2026-10-24"), new Date("2026-10-25")];

                        return (
                          <div className="pt-2 lg:pt-4 space-y-3 lg:space-y-5">
                            {sameTimingsMulti ? (
                              <div>
                                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                                  <div className="flex-1">
                                    <DropdownSelect
                                      title="Start Time"
                                      options={filteredStartTimeOptions}
                                      value={getStartTimeKey() || "09:00"}
                                      onChange={handleStartTimeChange}
                                      bgColour="bg-[#101010]"
                                      floatingTitle={true}
                                      isDisabled={true}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <DropdownSelect
                                      title="End Time"
                                      options={filteredEndTimeOptions}
                                      value={getEndTimeKey() || "17:00"}
                                      onChange={handleEndTimeChange}
                                      bgColour="bg-[#101010]"
                                      floatingTitle={true}
                                      isDisabled={true}
                                    />
                                  </div>
                                </div>
                                <p className="flex items-center gap-2 my-3 lg:mt-6 lg:mb-8 text-[#A9A9A9] text-sm lg:text-base">
                                  <Check className="w-4 h-4 lg:w-6 lg:h-6 text-white" /> Applied to {datesToRender.length} selected dates
                                </p>
                                <div className="bg-[#171717] rounded-lg lg:rounded-lg lg:rounded-2xl border border-white/30 p-4 lg:p-7 flex flex-col lg:flex-row lg:justify-between lg:items-center">
                                  <p className="text-white font-medium text-sm lg:text-xl">
                                    {selectedDates.length > 0
                                      ? getFormattedDateString(selectedDates)
                                      : "Oct 24, 2026, Oct 25, 2026"}
                                  </p>
                                  <p className="text-white/60 font-medium text-sm lg:text-xl">
                                    {getStartTimeKey() && getEndTimeKey()
                                      ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}`
                                      : "09:00 AM - 05:00 PM"}
                                  </p>
                                  <p className="text-[#E8D1AB] font-medium text-sm lg:text-xl">
                                    {getStartTimeKey() &&
                                      getEndTimeKey() &&
                                      calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null
                                      ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours/Day`
                                      : "8 Hours/Day"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {datesToRender.map((dateItem) => {
                                  const dateKey = getDateKey(dateItem);
                                  // const isExpanded = expandedDateKey === dateKey;
                                  return (
                                    <div
                                      key={dateItem.toISOString()}
                                      ref={(el) => {
                                        selectedDateCardRefs.current[dateKey] = el;
                                      }}
                                      // className={`border border-white/10 rounded-lg lg:rounded-2xl bg-[#171717] ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}
                                      className={`border border-white/10 rounded-lg lg:rounded-2xl bg-[#171717] overflow-visible`}

                                    >
                                      {/* <button
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
                                        className={`w-full px-6 py-5 flex justify-between items-center ${isExpanded ? "border-b rounded-b-2xl border-b-white/10" : ""}`}
                                      >
                                        <span className="text-white font-medium">{format(dateItem, "MMMM dd, yyyy")}</span>
                                        <ChevronDown
                                          className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button> */}
                                      <div className="w-full px-6 py-5 flex justify-between items-center border-b rounded-b-2xl border-b-white/10">
                                        <span className="text-white font-medium">{format(dateItem, "MMMM dd, yyyy")}</span>
                                      </div>
                                      <AnimatePresence>
                                        {/* {isExpanded && ( */}
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: "auto" }}
                                          exit={{ height: 0 }}
                                          className="bg-[#101010] p-4 lg:p-7 overflow-visible rounded-lg lg:rounded-2xl"
                                        >
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="flex-1">
                                              <DropdownSelect
                                                title="Start Time"
                                                options={getDateSpecificStartOptions(dateKey)}
                                                value={multiDayTimes[dateKey]?.startKey || "09:00"}
                                                onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                                bgColour="bg-[#101010]"
                                                floatingTitle={true}
                                                isDisabled={true}
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <DropdownSelect
                                                title="End Time"
                                                options={getDateSpecificEndOptions(dateKey)}
                                                value={multiDayTimes[dateKey]?.endKey || "17:00"}
                                                onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                                bgColour="bg-[#101010]"
                                                floatingTitle={true}
                                                isDisabled={true}
                                              />
                                            </div>
                                          </div>

                                          <div className="mt-2 lg:mt-4 rounded-lg lg:rounded-full bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                                            <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">
                                              Duration:{" "}
                                              {multiDayTimes[dateKey]?.startKey &&
                                                multiDayTimes[dateKey]?.endKey &&
                                                calculateDurationHours(
                                                  multiDayTimes[dateKey]?.startKey || "",
                                                  multiDayTimes[dateKey]?.endKey || ""
                                                ) !== null
                                                ? `${calculateDurationHours(
                                                  multiDayTimes[dateKey]?.startKey || "",
                                                  multiDayTimes[dateKey]?.endKey || ""
                                                )} hours`
                                                : "8 hours"}
                                            </p>
                                          </div>
                                        </motion.div>
                                        {/* )} */}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )
            }
          </div>
        ) :
          <>
            <div className=" pb-6 pt-2 space-y-6">
              {/* Segmented Pill Switch */}
              <div className="flex w-fit lg:h-20 rounded-lg lg:rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20 overflow-hidden px-8 my-4">
                <button
                  type="button"
                  onClick={() => setBookingType("single_day")}
                  className={`!lg:w-[228px] relative px-8 py-3.5 lg:px-12 lg:py-8 text-sm lg:text-lg font-medium transition-all cursor-pointer flex-1 flex items-center justify-center ${bookingType === "single_day"
                    ? "text-[#E8D1AB]"
                    : "text-white/50 hover:text-white"
                    }`}
                >
                  {bookingType === "single_day" && (
                    <>
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        preserveAspectRatio="none"
                        viewBox="0 0 227 59"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M50 59H187L227 0H0L50 59Z" fill="url(#paint_single_studio)" />
                        <defs>
                          <linearGradient
                            id="paint_single_studio"
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
                      <div
                        className="absolute bottom-0 h-[3px] bg-[#E8D1AB] rounded-t-full"
                        style={{ left: "22%", right: "17.6%" }}
                      />
                    </>
                  )}
                  <span className="relative z-10">Single Day</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType("multi_day")}
                  className={`!lg:w-[228px] relative px-8 py-3.5 lg:px-12 lg:py-8 text-sm lg:text-lg font-medium transition-all cursor-pointer flex-1 flex items-center justify-center ${bookingType === "multi_day"
                    ? "text-[#E8D1AB]"
                    : "text-white/50 hover:text-white"
                    }`}
                >
                  {bookingType === "multi_day" && (
                    <>
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        preserveAspectRatio="none"
                        viewBox="0 0 227 59"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M50 59H187L227 0H0L50 59Z" fill="url(#paint_multiple_studio)" />
                        <defs>
                          <linearGradient
                            id="paint_multiple_studio"
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
                      <div
                        className="absolute bottom-0 h-[3px] bg-[#E8D1AB] rounded-t-full"
                        style={{ left: "22%", right: "17.6%" }}
                      />
                    </>
                  )}
                  <span className="relative z-10 shrink-0">Multiple Days</span>
                </button>
              </div>

              {/* SINGLE DAY VIEW */}
              {bookingType === "single_day" ? (
                <div className="space-y-3 lg:space-y-5">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 mt-2">
                      <DatePicker
                        label="Select Date"
                        value={selectedShootDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        colors={datePickerColours}
                        format="MM/dd/yyyy"
                        floating={true}
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

                  <div className="pt-1">
                    <span className="inline-block px-3 py-1.5 lg:px-6 lg:py-3.5 rounded-full bg-[#211F1C] text-xs lg:text-sm text-[#E8D1AB]">
                      Duration : 8 Hours
                    </span>
                  </div>
                </div>
              ) : (
                /* MULTI DAY VIEW */
                <div className="space-y-6">
                  <div className="relative lg:mb-15">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base lg:text-2xl font-['Roboto_Condensed'] font-medium text-white/90">
                        Select Date
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group"
                      >
                        <span className="text-white font-medium group-hover:text-[#E8D1AB] text-base lg:text-xl">
                          {format(currentCalendarMonth, "MMMM yyyy")}
                        </span>
                        <CalendarIcon size={20} className="text-white group-hover:text-[#E8D1AB]" />
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
                      {reelDays.map((dateItem) => {
                        const isSelected = selectedDates.some((d) => isSameDay(d, dateItem));
                        return (
                          <button
                            type="button"
                            key={dateItem.toISOString()}
                            ref={(el) => {
                              dateChipRefs.current[getDateKey(dateItem)] = el;
                            }}
                            onClick={() => {
                              if (Date.now() < suppressChipClickUntil.current) return;
                              toggleDateSelection(dateItem);
                            }}
                            className={`shrink-0 flex flex-col items-center justify-center w-15 lg:w-[100px] h-15 lg:h-[100px] rounded-full border transition-all ${isSelected ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-transparent border-white/10 text-white/40 hover:border-white/30"}`}
                          >
                            <span className="text-base lg:text-3xl font-bold">{format(dateItem, "d")}</span>
                            <span className="text-[10px] lg:text-xs uppercase font-medium">{format(dateItem, "EEE")}</span>
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
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-14 z-50 bg-[#111] border border-white/10 p-5 rounded-lg lg:rounded-2xl shadow-2xl w-[320px]"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <button
                              type="button"
                              onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <span className="text-white font-bold">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}
                              >
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
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                              <div key={d}>{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((dateItem) => {
                              const isSelected = selectedDates.some((d) => isSameDay(d, dateItem));
                              return (
                                <button
                                  type="button"
                                  key={dateItem.toISOString()}
                                  onClick={() => toggleDateSelection(dateItem)}
                                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-colors ${isSelected
                                    ? "bg-[#E8D1AB] text-black"
                                    : "text-white hover:bg-white/10"
                                    } ${!isSameMonth(dateItem, currentCalendarMonth) ? "opacity-20" : ""}`}
                                >
                                  {format(dateItem, "d")}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Timings Selector */}
                  {selectedDates.length > 0 && (
                    <div className="pt-6 lg:pt-10 border-t border-white/10 space-y-6">
                      <h3 className="text-base lg:text-[28px] font-medium mb-3 lg:mb-6">
                        Are timings same for all selected dates?
                      </h3>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleSameTimingsModeChange(true)}
                          className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-lg lg:rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${sameTimingsMulti
                            ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                            : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                            }`}
                        >
                          <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                          <div
                            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"
                              }`}
                          >
                            {sameTimingsMulti && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSameTimingsModeChange(false)}
                          className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-lg lg:rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!sameTimingsMulti
                            ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                            : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                            }`}
                        >
                          <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                          <div
                            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"}`}
                          >
                            {!sameTimingsMulti && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                          </div>
                        </button>
                      </div>

                      {sameTimingsMulti ? (
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
                            <Check className="w-4 h-4 lg:w-6 lg:h-6 text-white" /> Applied to {selectedDates.length} selected dates
                          </p>
                          <div className="bg-[#171717] rounded-lg lg:rounded-lg lg:rounded-2xl border border-white/30 p-4 lg:p-7 flex flex-col lg:flex-row lg:justify-between lg:items-center">
                            <p className="text-white font-medium text-sm lg:text-xl">
                              {getFormattedDateString(selectedDates)}
                            </p>
                            <p className="text-white/60 font-medium text-sm lg:text-xl">
                              {getStartTimeKey() && getEndTimeKey()
                                ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}`
                                : "Select time"}
                            </p>
                            <p className="text-[#E8D1AB] font-medium text-sm lg:text-xl">
                              {getStartTimeKey() &&
                                getEndTimeKey() &&
                                calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null
                                ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours/Day`
                                : "Duration Hour/Day"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedDates.map((dateItem) => {
                            const dateKey = getDateKey(dateItem);
                            const isExpanded = expandedDateKey === dateKey;
                            return (
                              <div
                                key={dateItem.toISOString()}
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
                                  className={`w-full p-4 lg:px-6 lg:py-5 flex justify-between items-center ${isExpanded ? "border-b rounded-b-lg lg:rounded-b-2xl border-b-white/10" : ""}`}
                                >
                                  <span className="text-white text-sm lg:text-base font-medium">{format(dateItem, "MMMM dd, yyyy")}</span>
                                  <ChevronDown
                                    className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  />
                                </button>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: "auto" }}
                                      exit={{ height: 0 }}
                                      className="bg-[#101010] p-4 lg:p-7 overflow-visible rounded-lg lg:rounded-2xl"
                                    >
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
                                          Duration:{" "}
                                          {multiDayTimes[dateKey]?.startKey &&
                                            multiDayTimes[dateKey]?.endKey &&
                                            calculateDurationHours(
                                              multiDayTimes[dateKey]?.startKey || "",
                                              multiDayTimes[dateKey]?.endKey || ""
                                            ) !== null
                                            ? `${calculateDurationHours(
                                              multiDayTimes[dateKey]?.startKey || "",
                                              multiDayTimes[dateKey]?.endKey || ""
                                            )} hours`
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
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>}

        {isStudioJourney3 &&
          <>
            <hr className="border-t border-white/20 my-5 lg:my-10" />
            <div>
              <h3 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-medium text-white mb-4 lg:mb-8">
                Studio Selected based on your location
              </h3>
              <div className="border border-white/20 bg-[#101010] rounded-lg lg:rounded-2xl">
                <div className="w-full h-full flex flex-col md:flex-row items-stretch">
                  {/* Studio Image + Rating Badge */}
                  <div className="relative w-full md:w-[42%] h-[180px] lg:h-full rounded-t-lg md:rounded-tr-none md:rounded-l-xl overflow-hidden shrink-0">
                    <Image
                      src={selectedStudio.image}
                      alt={selectedStudio.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/20 lg:backdrop-blur-md text-white px-2 lg:px-3 py-1 rounded-full text-[10px] lg:text-lg font-medium flex items-center gap-1.5 border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-5 lg:h-5" viewBox="0 0 20 20" fill="none">
                        <path d="M19.4965 7.2823C19.4339 7.08334 19.3158 6.90771 19.1569 6.7772C18.9981 6.6467 18.8055 6.56707 18.603 6.5482L12.9602 6.02112L10.7301 0.649329C10.5655 0.254664 10.1909 0 9.77386 0C9.35686 0 8.98209 0.254664 8.81849 0.649329L6.58842 6.02112L0.944711 6.5482C0.530959 6.58748 0.180623 6.87581 0.0511939 7.2823C-0.0118736 7.48143 -0.0167794 7.69522 0.0370842 7.89719C0.0909477 8.09916 0.201214 8.28044 0.354225 8.41857L4.61976 12.2668L3.36209 17.9661C3.27008 18.3851 3.42814 18.8185 3.76611 19.0698C3.94312 19.2023 4.15643 19.2736 4.37534 19.2734C4.56298 19.2734 4.7471 19.221 4.90806 19.1218L9.77386 16.1284L14.6388 19.1218C14.8133 19.2292 15.0146 19.2816 15.2178 19.2723C15.421 19.2631 15.617 19.1927 15.7816 19.0698C16.1196 18.8185 16.2777 18.3851 16.1857 17.9661L14.9279 12.2668L19.1935 8.41861C19.3465 8.28049 19.4568 8.09921 19.5107 7.89724C19.5645 7.69526 19.5596 7.48147 19.4965 7.28234V7.2823Z" fill="#FDE955" />
                      </svg>
                      <span>
                        {selectedStudio.rating} ({selectedStudio.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Studio Content & Details */}
                  <div className="flex-1 flex flex-col justify-between rounded-r-lg lg:rounded-r-xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-5">
                    <div>
                      {/* Title & Status Badge */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="text-xs lg:text-xl font-bold text-white">
                            {selectedStudio.name}
                            <br />{selectedStudio.subtitle}
                          </h3>
                        </div>

                        {selectedStudio.isAdded && (
                          <span className="flex items-center gap-1 bg-[#4CAF50] text-white border border-[#4CAF50] p-1.5 pr-2 lg:px-3 lg:py-2 rounded-full text-[10px] lg:text-base shrink-0">
                            <Check className="w-3 h-3 lg:w-4 lg:h-4" /> Added
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 text-[10px] lg:text-lg text-white/70">
                        <MapPin className="w-4 h-4 lg:w-6 lg:h-6" strokeWidth={1} />
                        <span>{selectedStudio.location}</span>
                      </div>

                      <hr className="border-t my-3 lg:my-7 border-white/20" />

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedStudio.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 lg:px-5 lg:py-1.5 rounded-md border border-white/20 bg-[#171716] text-xs lg:text-lg text-white/70 font-light"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <hr className="border-t my-3 lg:my-7 border-white/20" />

                    {/* Action & Price Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedStudio.isAdded ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // toggleSelectStudio(studio.id);
                            }}
                            className="px-4 py-2 lg:px-11 lg:py-3.5 rounded-full bg-[#FFC9C9] text-[#C31717] text-xs lg:text-xl font-medium hover:bg-[#FFC9C9]/80 transition-colors flex items-center gap-1.5 cursor-pointer z-20"
                          >
                            <X className="w-4 h-4 lg:w-5 lg:h-5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // toggleSelectStudio(studio.id);
                            }}
                            className="px-4 py-2 lg:px-11 lg:py-3.5 rounded-full bg-white text-black text-xs lg:text-xl font-medium hover:bg-white/90 transition-colors cursor-pointer z-20"
                          >
                            Add this Studio
                          </button>
                        )}

                        {/* Add studio detail page link */}
                        <Link
                          href={selectedStudio.link}
                          target="_blank"
                          className="w-7 h-7 lg:h-13 lg:w-13 rounded-full border-[0.874px] border-white/40 bg-white/20 text-white flex items-center justify-center hover:text-white transition-colors cursor-pointer z-20"
                        >
                          {/* <ArrowUpRight className="w-4 h-4 lg:w-6 lg:h-6" /> */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-8 lg:h-8" viewBox="0 0 34 34" fill="none">
                            <path d="M23.3643 12.1704L10.22 21.4163" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                            <path d="M21.9857 20.091C20.3042 17.7006 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                            <path d="M15.444 10.7913C17.1255 13.1817 20.8201 13.9603 23.3647 12.1703" stroke="white" strokeWidth="1.74897" strokeLinecap="square" />
                          </svg>
                        </Link>
                      </div>

                      <div className="text-right">
                        <span className="text-xs lg:text-base text-[#1DAA23] block">
                          {selectedStudio.availability}
                        </span>
                        <div className="text-[#E8D1AB] text-2xl lg:text-4xl font-['Roboto_Condensed'] font-bold">
                          ${selectedStudio.pricePerHour}{" "}
                          <span className="text-sm md:text-xl text-white">
                            / hour
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 w-full lg:w-auto lg:min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="px-10 py-3.5 w-full lg:w-auto rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer lg:ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StudioScheduleSync;