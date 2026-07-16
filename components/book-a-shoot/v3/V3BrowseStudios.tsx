"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BookingDataV3 } from "./types";
import { Search, ChevronDown, Calendar, Check, ChevronRight, ChevronLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { parseDate } from "@/src/components/landing/lib/utils";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, set, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { getFormattedDateString } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudioCard from "./components/StudioCard";
import { studioCatalogApi, type StudioCatalogListItem } from "@/lib/api";
import DatePicker from "@/components/ui/Datepicker";
import { Button } from "@/src/components/landing/ui/button";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { Input } from "@/components/ui/input";
import {
  buildHourlyStudioSelection,
  normalizeSelectedStudios,
  removeSelectedStudio,
  upsertSelectedStudio,
} from "./studioData";

const PUBLIC_STUDIO_LOCATION = "Los Angeles, California, USA";

const STUDIO_BOOKING_TYPES = [
  { key: "production", value: "Production" },
  { key: "audio", value: "Audio" },
  { key: "event", value: "Event" }
];

const datePickerColours = {
  inputBackground: "#171717",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "#FFFFFF99",
  iconColor: "#FFFFFF",
  accent: "#E8D1AB",
  accentText: "#171717",
  hoverAccent: "#E8D1AB",
  paperBackground: "#171717",
  mobileCalendarBackground: "#171717",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",
  desktopTimeAccent: "#E8D1AB",
  mobileSelectedText: "#101010",
  toolbarText: "#FFFFFF",
  selectedHeaderDateTime: "#E8D1AB",
  clockNumberColor: "#FFFFFF",
  tabIconColor: "#ffffff99",
  tabIconSelected: "#E8D1AB",
  inputDisabled: "#ffffff33",
  mutedText: "#ffffff66",
  desktopCalendarText: "#FFFFFF",
};

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: (forceBrowseCreators?: boolean) => void;
  onBack: () => void;
}

const mapCatalogStudio = (studio: StudioCatalogListItem) => ({
  slug: studio.slug || studio.id,
  image: studio.image || "",
  name: studio.name,
  description: studio.propertyType ? `(${studio.propertyType})` : "",
  location: studio.location || PUBLIC_STUDIO_LOCATION,
  price: studio.priceValue || 0,
  rating: Number(studio.rating || 5),
  reviews: studio.reviews || 0,
  tags: studio.tags?.length ? studio.tags : [],
});

export const V3BrowseStudios: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [updateBookingDateTime, setUpdateBookingDateTime] = useState<boolean>(true);
  const [isExpanded, setSetIsExpanded] = useState<boolean>(false);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(parseDate(data.startDate) || null);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(data.bookingType || "single_day");
  const [visibleCount, setVisibleCount] = useState(6);
  const [bookingFor, setBookingFor] = useState<"production" | "audio" | "event" | string>(data.bookingFor || "");
  const [studioData, setStudioData] = useState<ReturnType<typeof mapCatalogStudio>[]>([]);
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioError, setStudioError] = useState("");
  const [hasMoreStudios, setHasMoreStudios] = useState(false);

  // Ref Varibales
  const studioTypeRef = useRef<HTMLDivElement>(null);
  const studiosRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const crewCountRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const isDraggingReel = useRef(false);

  const handleNext = async () => {
    // if (!validate()) return;
    updateData({ isBrowsingCreators: false });
    onNext(false);
  };

  const handleBrowseCreators = async () => {
    // Update state so it's saved for back-navigation later
    updateData({ isBrowsingCreators: true });

    // Pass true directly to ensure the parent acts on it immediately
    onNext(true);
  };

  // Please move the repetitive and commion date functions to a utils file for easier reuse
  const formatLocalDateTime = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  };
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
      return; // Don't update the time if it's invalid
    }

    // Enforce a 4-hour gap for same-day bookings
    const minimumTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Add 4 hours to current time

    if (selectedTime < minimumTime) {
      toast.error("You must select a start time at least 4 hours from now.");
      setErrors((prev) => [...prev, "timeError"]);
      return; // Don't update the time if it's invalid
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
    // scrollToRef(editsRef);
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

  const toggleDateSelection = (date: Date) => {
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
  };

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

  const buildDateTimeString = useCallback((date: Date, timeKey: string) => {
    const [hours, minutes] = timeKey.split(":").map(Number);
    const nextDate = set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
    return formatLocalDateTime(nextDate);
  }, []);

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

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

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

  const getTimeLabel = (key: string) => {
    if (!key) return "";
    const match = timeOptions.find((opt) => opt.key === key);
    return match ? match.value : key;
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

  const selectedStudios = React.useMemo(
    () =>
      normalizeSelectedStudios({
        selectedStudios: data.selectedStudios,
        selectedStudioIds: data.selectedStudioIds,
      }),
    [data.selectedStudios, data.selectedStudioIds],
  );
  const selectedStudioIds = React.useMemo(
    () => selectedStudios.map((studio) => studio.studioId),
    [selectedStudios],
  );

  useEffect(() => {
    let isActive = true;

    const loadStudios = async () => {
      setStudioLoading(true);
      setStudioError("");

      try {
        const bookingForParam =
          bookingFor === "production"
            ? "productions"
            : bookingFor === "audio"
              ? "audio"
              : bookingFor === "event"
                ? "event"
                : undefined;

        const response = await studioCatalogApi.list({
          page: 1,
          limit: visibleCount,
          search: searchQuery.trim() || undefined,
          booking_for: bookingForParam,
        });

        if (!isActive) return;
        setStudioData((response.data || []).map(mapCatalogStudio));
        setHasMoreStudios(Boolean(response.pagination?.hasMore));
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load studio catalog:", error);
        setStudioError("Unable to load studios right now.");
        setStudioData([]);
        setHasMoreStudios(false);
      } finally {
        if (isActive) setStudioLoading(false);
      }
    };

    loadStudios();

    return () => {
      isActive = false;
    };
  }, [bookingFor, searchQuery, visibleCount]);

  console.log(data);


  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
          Beige Content House
        </h2>
        <p className="text-white/60">Discover studios that match your needs with complete details and availability.</p>
      </div>

      {!data.contentType.includes("studio") && (
        <div ref={studioTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
          <p className="text-lg lg:text-xl font-medium mb-3 lg:mb-5">What type of studio do you need?</p>
          <div className="flex-1">
            <DropdownSelect
              title="Booking For"
              options={STUDIO_BOOKING_TYPES}
              value={bookingFor}
              onChange={setBookingFor}
              bgColour="bg-[#101010]"
            />
          </div>

          <div className={`px-7 py-3.5 rounded-xl bg-[#211F1C] text-[#E8D1AB] font-medium text-xs lg:text-sm mt-4 w-fit`}>
            Note : Studios are shown based on your selected category. Pricing, availability, and rules may vary.
          </div>
        </div>
      )}

      {/* Studio Listings */}
      <div ref={studiosRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <p className="text-lg lg:text-xl font-medium mb-3 lg:mb-5">
          {studioLoading ? "Loading studios..." : `${studioData.length} Studio Available Based on Categories`}
        </p>
        <div className="flex gap-2 lg:gap-4 mb-5 lg:mb-10">
          {/* Search field */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-[#BEBEBE]`} size={24} />
            <input
              type="text"
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border py-2.5 rounded-lg focus:outline-none pl-10 pr-4 transition-colors bg-[#202020] border-[#FFFFFF33] text-[#BEBEBE]}`} />
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v)}>
            <SelectTrigger className={`w-[130px] rounded-lg h-12 text-sm focus:ring-0 capitalize bg-[#202020] border-[#FFFFFF33] text-white`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={`bg-[#202020] border-[#FFFFFF33]`}>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="audios">Audios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 mb-5 lg:mb-10">
          {studioError ? (
            <div className="col-span-full text-white/50 text-sm py-4">{studioError}</div>
          ) : studioData.length === 0 ? (
            <div className="col-span-full text-white/50 text-sm py-4">No studios match your search.</div>
          ) : (
            studioData.map((studio) => (
              <StudioCard
                key={studio.slug}
                {...studio}
                isSelected={selectedStudioIds.includes(studio.slug)}
                onToggle={() => {
                  const existing = selectedStudios.find((item) => item.studioId === studio.slug);
                  if (existing) {
                    updateData({
                      selectedStudios: removeSelectedStudio(selectedStudios, studio.slug),
                      selectedStudioIds: selectedStudioIds.filter((id) => id !== studio.slug),
                    });
                    toast.success("Studio removed.");
                    return;
                  }

                  const fallbackDate = data.startDate ? format(parseDate(data.startDate) || new Date(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
                  const selection = buildHourlyStudioSelection(
                    {
                      id: studio.slug,
                      name: studio.name,
                      location: studio.location,
                      image: studio.image,
                      pricingMode: "hourly",
                      priceValue: studio.price,
                      priceLabel: `$${studio.price}/Hr`,
                      pricingOptions: [],
                      beds: 0,
                      baths: 0,
                      poolType: "",
                    },
                    {
                      selectedDate: fallbackDate,
                      startTime: data.startDate ? format(parseDate(data.startDate) || new Date(), "HH:mm") : "10:30",
                      endTime: data.endDate ? format(parseDate(data.endDate) || new Date(), "HH:mm") : "14:30",
                      pricingKey: "",
                    },
                  );

                  updateData({
                    selectedStudios: upsertSelectedStudio(selectedStudios, selection),
                    selectedStudioIds: [...selectedStudioIds, studio.slug],
                    selectedStudioImage: studio.image,
                    selectedStudioName: studio.name,
                    isBrowsingStudios: false,
                  });
                  toast.success("Studio added.");
                }}
              />
            ))
          )}
        </div>
        <button
          onClick={() => setVisibleCount((prev) => prev + 6)}
          disabled={studioLoading || !hasMoreStudios}
          className="bg-[#171717] flex gap-8 h-14 lg:h-18 p-1 items-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg lg:text-xl pl-7">
            {studioLoading ? "Loading..." : hasMoreStudios ? "View More" : "No More Studios"}
          </span>
          <div className="bg-[#E8D1AB] h-16 w-16 p-4 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="32"
              viewBox="0 0 32 26"
              fill="none"
            >
              <path
                d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z"
                fill="#1D1D1B"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Crew Count */}
      <div ref={crewCountRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <div className="relative">
          <div className={`absolute -top-3 left-4 z-20 px-2 bg-[#101010]`}>
            <span className={`text-sm font-medium `}>No of Cast & Crew</span>
          </div>
          <Input
            value={data.crewCount}
            onChange={(e) => updateData({ crewCount: parseInt(e.target.value) })}
            className={`w-full h-14 lg:h-[82px] bg-transparent border border-[#FFFFFF4D] rounded-xl px-6 text-sm lg:text-base  focus:outline-none focus:border-[#E8D1AB]/50 transition-all`}
          />
        </div>
      </div>

      {/* Update Booking DateTime */}
      <div ref={bookingRef} className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
        <h3 className={`text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 transition-colors`}>Are timings same for all selected dates?</h3>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setUpdateBookingDateTime(true)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-fit rounded-2xl border px-2 lg:px-6 flex items-center gap-4 lg:gap-7 transition-colors duration-300 ease-in-out ${updateBookingDateTime ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
          >
            <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${updateBookingDateTime ? "bg-black" : "border border-[#E5E5E5]"
                }`}
            >
              {updateBookingDateTime && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUpdateBookingDateTime(false)}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-fit rounded-2xl border px-2 lg:px-6 flex items-center gap-4 lg:gap-7 transition-colors duration-300 ease-in-out ${!updateBookingDateTime ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
          >
            <span className="font-medium text-sm lg:text-lg pr-2">Keep it same</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!updateBookingDateTime ? "bg-black" : "border border-[#E5E5E5]"
                }`}
            >
              {!updateBookingDateTime && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>
        </div>

        {/* Replace the current updateBookingDateTime block with this logic */}
        {updateBookingDateTime && (
          <div className="space-y-4">
            {/* Show Single Day Accordion only if bookingType is single_day */}
            {data.bookingType === "single_day" && (
              <div className="rounded-xl bg-[#171717] overflow-hidden">
                <button
                  onClick={() => setSetIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between px-3 py-5 lg:px-5 lg:py-7 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-lg lg:text-xl font-medium text-[#E8D1AB]">Single Day</span>
                  <ChevronDown
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="p-5 pt-7 border-t border-t-[#FFFFFF33]"
                    >
                      <>
                        <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"}`}>
                          Shoot Date & Time
                        </h3>
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <DatePicker
                              label="Select Date"
                              value={selectedShootDate}
                              onChange={handleDateChange}
                              minDate={new Date()}
                              colors={datePickerColours}
                              format="MM/dd/yyyy"
                              sx={{
                                height: { xs: "56px", md: "82px" },
                                borderRadius: "16px",
                              }}
                              floating={true}
                            />
                          </div>
                          <div className="flex-1">
                            <DropdownSelect
                              title="Start Time"
                              options={filteredStartTimeOptions}
                              value={getStartTimeKey()}
                              onChange={handleStartTimeChange}
                              bgColour="bg-[#171717]"
                            />
                          </div>
                          <div className="flex-1">
                            <DropdownSelect
                              title="End Time"
                              options={filteredEndTimeOptions}
                              value={getEndTimeKey()}
                              onChange={handleEndTimeChange}
                              bgColour="bg-[#171717]"
                            />
                          </div>
                        </div>
                        <div className="mt-2 lg:mt-4 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                          <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">
                            Duration: {calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours
                          </p>
                        </div>
                      </>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Show Multiple Days Accordion only if bookingType is multi_day */}
            {data.bookingType === "multi_day" && (
              <div className="rounded-xl bg-[#171717] overflow-hidden">
                <button
                  onClick={() => setSetIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between p-6 lg:p-8 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-lg lg:text-xl font-medium text-[#E8D1AB]">Multiple Days</span>
                  <ChevronDown
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-6 lg:p-8 pt-0 border-t border-white/5"
                    >
                      <>
                        <div className="relative mb-4 lg:mb-7">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"}`}>
                              Select Date
                            </h3>
                            <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group">
                              <span className="text-white font-medium group-hover:text-[#E8D1AB] lg:text-[20px]">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                              <Calendar size={20} className="text-white group-hover:text-[#E8D1AB] " />
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
                              if ((e.target as HTMLElement).closest("button")) return;
                              isDraggingReel.current = true;
                              dragStartX.current = e.clientX;
                              dragStartScrollLeft.current = reelRef.current.scrollLeft;
                              reelRef.current.setPointerCapture?.(e.pointerId);
                            }}
                            onPointerMove={(e) => {
                              if (!reelRef.current || !isDraggingReel.current) return;
                              const dx = e.clientX - dragStartX.current;
                              reelRef.current.scrollLeft = dragStartScrollLeft.current - dx;
                            }}
                            onPointerUp={(e) => {
                              isDraggingReel.current = false;
                              reelRef.current?.releasePointerCapture?.(e.pointerId);
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
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => toggleDateSelection(date)}
                                  className={`shrink-0 flex flex-col items-center justify-center w-[60px] lg:w-[100px] h-[60px] lg:h-[100px] rounded-full border transition-all ${isSelected ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-transparent border-white/10 text-white/40 hover:border-white/30"}`}
                                >
                                  <span className="text-lg lg:text-3xl font-bold">{format(date, "d")}</span>
                                  <span className="text-[10px] lg:text-xs uppercase font-medium">{format(date, "EEE")}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex gap-4">
                            <div className="mt-4 lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                              <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Total Days: {selectedDates.length}</p>
                            </div>
                            <div className="mt-4 lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
                              <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Selected Days: {getFormattedDateString(selectedDates)}</p>
                            </div>
                          </div>

                          {/* Calendar Popover */}
                          <AnimatePresence>
                            {isCalendarOpen && (
                              <motion.div ref={calendarRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-14 z-50 bg-[#111] border border-white/10 p-5 rounded-2xl shadow-2xl w-[320px]">
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
                                    return (
                                      <button
                                        type="button"
                                        key={date.toISOString()}
                                        onClick={() => {
                                          toggleDateSelection(date);
                                        }}
                                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-colors ${isSelected ? "bg-[#E8D1AB] text-black" : "text-white hover:bg-white/10"} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}
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
                        {/* timings selector will go here */}

                        {selectedDates.length > 0 && (
                          <div className="pt-4 lg:pt-7 border-t border-white/10 space-y-6">
                            <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"}`}>Are timings same for all selected dates?</h3>

                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => handleSameTimingsModeChange(true)}
                                disabled={(data.contentType.includes("photographer") || data.contentType.includes("videographer")) && data.shootType === ""}
                                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${sameTimingsMulti ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                              >
                                <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                                <div
                                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"
                                    }`}
                                >
                                  {sameTimingsMulti && (
                                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                                  )}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSameTimingsModeChange(false)}
                                disabled={(data.contentType.includes("photographer") || data.contentType.includes("videographer")) && data.shootType === ""}
                                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!sameTimingsMulti ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
                              >
                                <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                                <div
                                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!sameTimingsMulti ? "bg-black" : "border border-[#E5E5E5]"
                                    }`}
                                >
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
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <DropdownSelect
                                        title="End Time"
                                        options={filteredEndTimeOptions}
                                        value={getEndTimeKey()}
                                        onChange={handleEndTimeChange}
                                        bgColour="bg-[#101010]"
                                      />
                                    </div>
                                  </div>
                                  <p className="flex gap-2 my-3 lg:mt-6 lg:mb-8 text-[#A9A9A9]">
                                    <Check size={24} className="text-white" /> Applied to {selectedDates.length} selected dates
                                  </p>
                                  <div className="bg-[#171717] rounded-lg lg:rounded-2xl border border-white/30 p-4 lg:p-7 flex flex-col lg:flex-row lg:justify-between lg:items-center">
                                    <p className="text-white font-medium lg:text-[20px]">
                                      {getFormattedDateString(selectedDates)}
                                    </p>
                                    <p className="text-white/60  font-medium lg:text-[20px]">
                                      {getStartTimeKey() && getEndTimeKey()
                                        ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}`
                                        : "Select time"}
                                    </p>
                                    <p className="text-[#E8D1AB]  font-medium lg:text-[20px]">
                                      {getStartTimeKey() && getEndTimeKey() && calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null
                                        ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours/Day`
                                        : "Duration Hour/Day"}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {selectedDates.map((date) => {
                                    const dateKey = getDateKey(date);
                                    const isExpanded = expandedDateKey === dateKey;
                                    return (
                                      <div key={date.toISOString()} className={`border border-white/10 rounded-2xl bg-[#171717] ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}>
                                        <button type="button" onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)} className={`w-full px-6 py-5 flex justify-between items-center ${isExpanded ? "border-b rounded-b-2xl border-b-white/10 " : ""}`}>
                                          <span className="text-white font-medium">{format(date, "MMMM dd, yyyy")}</span>
                                          <ChevronDown className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </button>
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-[#101010] p-4 lg:p-7 overflow-visible">
                                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="flex-1">
                                                  <DropdownSelect
                                                    title="Start Time"
                                                    options={filteredStartTimeOptions}
                                                    value={multiDayTimes[dateKey]?.startKey || ""}
                                                    onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                                    bgColour="bg-[#101010]"
                                                  />
                                                </div>
                                                <div className="flex-1">
                                                  <DropdownSelect
                                                    title="End Time"
                                                    options={filteredEndTimeOptions}
                                                    value={multiDayTimes[dateKey]?.endKey || ""}
                                                    onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                                    bgColour="bg-[#101010]"
                                                  />
                                                </div>
                                              </div>

                                              <div className="mt-2 lg:mt-4 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browser Creators */}
      {
        (data.contentType.length == 1 && data.contentType.includes("studio")) &&
        <div className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
          <div className="bg-[#101010] border border-[#FFFFFF4D] rounded-xl p-3 lg:p-5 flex justify-between items-center">
            <div className="flex gap-4 items-center ">
              <div className="bg-[#171717] rounded-xl p-4.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none">
                  <circle cx="21" cy="22.75" r="5.25" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.4999 34.9998H24.4999C29.4155 34.9998 31.8734 34.9998 33.6389 33.8201C34.4033 33.3094 35.0595 32.6531 35.5702 31.8888C36.7499 30.1232 36.7499 27.6654 36.7499 22.7498C36.7499 17.8342 36.7497 15.3768 35.57 13.6112C35.0592 12.8469 34.403 12.1906 33.6387 11.6799C31.8731 10.5002 29.4153 10.5002 24.4997 10.5002H17.4997C12.5841 10.5002 10.1262 10.5002 8.36068 11.6799C7.59635 12.1906 6.94009 12.8469 6.42938 13.6112C5.24993 15.3764 5.24993 17.8331 5.24993 22.7466L5.24993 22.7498C5.24993 27.6654 5.24993 30.1232 6.42964 31.8888C6.94035 32.6531 7.59661 33.3094 8.36094 33.8201C10.1265 34.9998 12.5843 34.9998 17.4999 34.9998Z" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M31.5 17.5H30.625" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M26.25 5.25H15.75" stroke="#E8D1AB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-lg lg:text-xl text-white font-medium">
                  Need a Photographer or Videographer for your Studio?
                </p>
                <p className="text-[#A9A9A9] text-xs lg:text-sm">
                  Bring your shoot to life with top photographers/videographers at your studio.
                </p>
              </div>
            </div>
            <Button
              onClick={handleBrowseCreators}
              className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] flex items-center justify-center text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
            >
              Browse Creators
            </Button>
          </div>
        </div>
      }

      {/* Navigation */}
      <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>
    </div>
  )
};
