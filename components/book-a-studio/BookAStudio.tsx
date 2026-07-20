"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  MapPin,
  MoveUpRight,
  Search,
  Star,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { Navbar } from "@/src/components/landing/Navbar";
import { Footer } from "@/src/components/landing/Footer";
import { Button } from "@/src/components/landing/ui/button";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { StepProgressTracker } from "@/components/book-a-shoot/StepProgressTracker";
import { V3Step3CrewMatching } from "@/components/book-a-shoot/v3/V3Step3CrewMatching";
import { V3LoadingFindingCreative } from "@/components/book-a-shoot/v3/V3LoadingFindingCreative";
import { V3SelectDreamTeam } from "@/components/book-a-shoot/v3/V3SelectDreamTeam";
import { V3Step4BookConfirm } from "@/components/book-a-shoot/v3/V3Step4BookConfirm";
import type { BookingDataV3 } from "@/components/book-a-shoot/v3/types";
import type { LocationDetails } from "@/components/book-a-shoot/v3/types";
import { initialDataV3 } from "@/components/book-a-shoot/v3/types";
import {
  getSelectedStudiosTotal,
  HOURLY_STUDIO_LIST,
  normalizeSelectedStudios,
  serializeStudioMeta,
  type SelectedStudio,
  type StudioCatalogItem,
} from "@/components/book-a-shoot/v3/studioData";
import { buildEditTypeCounts } from "@/components/book-a-shoot/v3/utils";
import { socialContentEditTypes, socialContentPhotoEditTypes } from "@/app/data/shootData";
import { useAuth } from "@/lib/hooks/useAuth";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { useTrackEarlyInterestMutation, useUpdateBookingCrewMutation } from "@/lib/redux/features/sales/salesApi";
import { useSaveQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";
import {
  useCreateGuestBookingMutation,
  useUpdateGuestBookingMutation,
} from "@/lib/redux/features/booking/guestBookingApi";
import type { GuestBookingData } from "@/lib/redux/features/booking/guestBookingApi";
import { pushToDataLayer } from "@/lib/gtm";

const STUDIO_STEPS = [
  { label: "Studio Details" },
  { label: "Creator Matching" },
  { label: "Book & Confirm" },
];

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
}

const toUtcIsoIfValid = (value?: string | null) => {
  if (!value) return value;
  const date = new Date(value);
  return date && !isNaN(date.getTime()) ? date.toISOString() : value;
};

const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";

const datePickerColours = {
  inputBackground: "#101010",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "#ffffff99",
  iconColor: "#FFFFFF",
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#E8D1AB",
  paperBackground: "#101010",
  mobileCalendarBackground: "#101010",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",
  inputDisabled: "#ffffff33",
  mutedText: "#ffffff66",
};

const buildTimeOptions = () => {
  const options: { key: string; value: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      options.push({ key, value: format(date, "h:mm aa") });
    }
  }
  return options;
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const formatLocalDateTime = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");

const buildDateTimeString = (date: Date, timeKey: string) => {
  const [hours, minutes] = timeKey.split(":").map(Number);
  return formatLocalDateTime(set(date, { hours, minutes, seconds: 0, milliseconds: 0 }));
};

const getFormattedDateString = (dates: Date[]) => {
  if (!dates.length) return "No dates selected";
  if (dates.length <= 2) return dates.map((date) => format(date, "MMM d, yyyy")).join(", ");
  return `${format(dates[0], "MMM d, yyyy")} - ${format(dates[dates.length - 1], "MMM d, yyyy")}`;
};

const getDefaultPricingKey = (studio?: StudioCatalogItem | null) => studio?.pricingOptions?.[0]?.key || "";

const getSelectedPricing = (studio?: StudioCatalogItem | null, pricingKey?: string) =>
  studio?.pricingOptions?.find((option) => option.key === pricingKey) || studio?.pricingOptions?.[0];

const STUDIO_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "beige-hollywood-hills-estate": { lat: 34.1086, lng: -118.3639 },
  "beige-west-hollywood-content-studio": { lat: 34.0905, lng: -118.3923 },
  "beige-woodland-hills-villa": { lat: 34.167, lng: -118.6149 },
  "beige-west-hollywood-wellness-gym": { lat: 34.0905, lng: -118.3923 },
  "beige-palm-springs-oasis": { lat: 33.7301, lng: -116.3813 },
};

const buildStudioLocationDetails = (studio: StudioCatalogItem): LocationDetails => {
  const coords = STUDIO_COORDINATES[studio.id] || { lat: 34.0522, lng: -118.2437 };
  return {
    address: studio.location,
    lat: coords.lat,
    lng: coords.lng,
    coordinates: coords,
    center: [coords.lng, coords.lat],
  };
};

const getStudioStartingPriceLabel = (studio: StudioCatalogItem) => {
  const rates = (studio.pricingOptions || [])
    .map((option) => option.hourlyRate)
    .filter((rate) => Number.isFinite(rate));
  const lowestRate = rates.length ? Math.min(...rates) : studio.priceValue;
  return lowestRate ? `From $${lowestRate.toLocaleString()}/Hr` : studio.priceLabel;
};

const buildStudioSelectionFromDays = ({
  studio,
  pricingKey,
  bookingDays,
}: {
  studio: StudioCatalogItem;
  pricingKey: string;
  bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>;
}): SelectedStudio | null => {
  const pricingOption = getSelectedPricing(studio, pricingKey);
  const unitPrice = pricingOption?.hourlyRate || studio.priceValue || 0;
  const minimumHours = pricingOption?.minimumHours || studio.minimumBookingHours || 1;
  const cleaningFee = pricingOption?.cleaningFee || 0;
  const completeDays = bookingDays.filter((day) => day.date && day.startTime && day.endTime);

  if (!completeDays.length) return null;

  const pricedDays = completeDays.map((day) => {
    const durationHours = Math.max(1, Math.ceil((timeToMinutes(day.endTime || "") - timeToMinutes(day.startTime || "")) / 60));
    const billableHours = Math.max(durationHours, minimumHours);
    return {
      ...day,
      durationHours,
      billableHours,
      totalPrice: unitPrice * billableHours + cleaningFee,
    };
  });

  const primaryDay = pricedDays[0];
  const totalBillableHours = pricedDays.reduce((sum, day) => sum + day.billableHours, 0);
  const totalPrice = pricedDays.reduce((sum, day) => sum + day.totalPrice, 0);

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "hourly",
    pricingCategory: pricingOption?.key,
    pricingLabel: pricingOption?.label,
    unitPrice,
    cleaningFee,
    minimumHours,
    quantity: totalBillableHours,
    totalPrice,
    priceLabel: pricingOption
      ? `$${unitPrice.toLocaleString()}/hour${cleaningFee ? ` + $${cleaningFee.toLocaleString()} cleaning` : ""}`
      : studio.priceLabel,
    selectedDate: primaryDay.date,
    startTime: primaryDay.startTime,
    endTime: primaryDay.endTime,
    lat: STUDIO_COORDINATES[studio.id]?.lat,
    lng: STUDIO_COORDINATES[studio.id]?.lng,
  };
};

const buildStudioSelectionFromPricing = ({
  studio,
  pricingKey,
}: {
  studio: StudioCatalogItem;
  pricingKey: string;
}): SelectedStudio => {
  const pricingOption = getSelectedPricing(studio, pricingKey);
  const unitPrice = pricingOption?.hourlyRate || studio.priceValue || 0;
  const minimumHours = pricingOption?.minimumHours || studio.minimumBookingHours || 1;
  const cleaningFee = pricingOption?.cleaningFee || 0;

  return {
    studioId: studio.id,
    name: studio.name,
    location: studio.location,
    image: studio.image,
    pricingMode: "hourly",
    pricingCategory: pricingOption?.key,
    pricingLabel: pricingOption?.label,
    unitPrice,
    cleaningFee,
    minimumHours,
    quantity: 0,
    totalPrice: 0,
    priceLabel: pricingOption
      ? `$${unitPrice.toLocaleString()}/hour${cleaningFee ? ` + $${cleaningFee.toLocaleString()} cleaning` : ""}`
      : studio.priceLabel,
    lat: STUDIO_COORDINATES[studio.id]?.lat,
    lng: STUDIO_COORDINATES[studio.id]?.lng,
  };
};

type StepProps = {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onBack: () => void;
  onSaveAndConfirm: () => Promise<void>;
  onBrowseCreators: () => Promise<void>;
  isSaving: boolean;
  user?: any;
};

const StudioCard = ({
  studio,
  selected,
  onSelect,
}: {
  studio: StudioCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) => {
  const meta = [studio.beds ? `${studio.beds} Bed` : null, studio.baths ? `${studio.baths} Bath` : null, studio.poolType]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="relative w-full group">
      {/* 1. Dotted Outline - Perfectly matches the card radius */}
      <div
        className="absolute inset-0 rounded-[24px] border-2 border-dashed border-[#FFFFFF33] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ pointerEvents: 'none' }}
      />

      {/* 2. CONSTANT SPEED Animated Card Body */}
      {/* <motion.div
        initial={false}
        whileHover={{
          y: -10,
          rotate: 8,
        }}
        transition={{
          type: "tween",
          ease: "linear",
          duration: 0.2,
        }}
        // The style object below is the fix for the "sharp corners" issue
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
        className={`relative flex h-full flex-col overflow-hidden rounded-[24px] border bg-[#111111] transition-colors duration-300 isolate ${
          selected ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]" : "border-white/10"
        }`}
      > */}
      <button type="button" onClick={onSelect} className="relative h-[210px] w-full overflow-hidden rounded-t-[24px]">
        <Image
          src={studio.image}
          alt={studio.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute bottom-0 left-4 rounded-t-xl bg-white px-3 py-1.5 z-10">
          <span className="text-[13px] font-extrabold text-black">
            {getStudioStartingPriceLabel(studio)}
          </span>
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-[#14C573] shadow-[0_0_8px_#14C573]" />
          <span className="text-[10px] font-bold text-white">Available</span>
        </div>

        {studio.rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
            <Star size={13} className="fill-[#E8D1AB] text-[#E8D1AB]" />
            {studio.rating}
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-[17px] font-bold leading-snug text-white group-hover:text-[#E8D1AB] transition-colors">
              {studio.name}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/40">
              <MapPin size={12} />
              <span>Los Angeles, California</span>
            </div>
          </div>
          {selected && (
            <div className="flex items-center gap-1 rounded-full bg-[#F0FFF4] text-[#22C55E] border-[#22C55E]/20 px-2 py-1 text-[10px] font-bold ">
              <Check size={10} strokeWidth={3} /> Added
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 py-3 border-y border-white/5">
          {(studio.bestFor || []).slice(0, 2).map((item) => (
            <span key={item} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/50">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2">
          {selected ? (
            <button
              type="button"
              onClick={onSelect}
              className="flex flex-1 items-center justify-center gap-2 h-11 rounded-xl bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20 text-sm font-bold hover:bg-[#FF4444]/20 transition-colors"
            >
              <X size={16} /> Remove
            </button>
          ) : (
            <Button
              type="button"
              onClick={onSelect}
              className="h-11 flex-1 rounded-xl bg-[#E8D1AB] text-black text-sm font-bold hover:bg-[#dcb98a]"
            >
              Select Studio
            </Button>
          )}

          <Link
            href={`/studios/${studio.id}`}
            target="_blank"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          >
            <MoveUpRight size={18} />
          </Link>
        </div>
      </div>
      {/* </motion.div> */}
    </div>
  );
};
const BookStudioDetailsStep = ({
  data,
  updateData,
  onSaveAndConfirm,
  onBrowseCreators,
  isSaving,
}: StepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.startDate ? new Date(data.startDate) : null);
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    data.bookingDays?.length
      ? data.bookingDays.map((day) => new Date(`${day.date}T00:00:00`))
      : data.startDate
        ? [new Date(data.startDate)]
        : [],
  );
  const [startTime, setStartTime] = useState(data.startDate ? format(new Date(data.startDate), "HH:mm") : "");
  const [endTime, setEndTime] = useState(data.endDate ? format(new Date(data.endDate), "HH:mm") : "");
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const reelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const selectedDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDraggingReel = useRef(false);
  const didDragReel = useRef(false);
  const suppressChipClickUntil = useRef(0);

  const emailRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const bookingTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const selectedStudios = normalizeSelectedStudios(data);
  const selectedStudio = HOURLY_STUDIO_LIST.find((studio) => studio.id === selectedStudios[0]?.studioId) || null;
  const pricingKey = selectedStudios[0]?.pricingCategory || getDefaultPricingKey(selectedStudio);
  const selectedPricing = getSelectedPricing(selectedStudio, pricingKey);
  const selectedStudioTotal = getSelectedStudiosTotal(selectedStudios);

  const filteredStudios = HOURLY_STUDIO_LIST.filter((studio) =>
    studio.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const buildMultiDayTimeMap = useCallback((
    dates: Date[],
    fallback: { startKey?: string; endKey?: string } = {},
    existing: Record<string, { startKey?: string; endKey?: string }> = {},
  ) => {
    return dates.reduce<Record<string, { startKey?: string; endKey?: string }>>((acc, date) => {
      const dateKey = getDateKey(date);
      acc[dateKey] = existing[dateKey] || { ...fallback };
      return acc;
    }, {});
  }, []);

  const calculateDurationHours = (startKey: string, endKey: string) => {
    if (!startKey || !endKey) return null;
    const diff = timeToMinutes(endKey) - timeToMinutes(startKey);
    if (diff <= 0) return null;
    return Math.round((diff / 60) * 100) / 100;
  };

  const getTimeLabel = (key: string) => {
    if (!key) return "";
    return timeOptions.find((option) => option.key === key)?.value || key;
  };

  const applyStudioSelection = useCallback((
    studio: StudioCatalogItem,
    nextPricingKey: string,
    bookingDays: Array<{ date: string; startTime?: string; endTime?: string }>,
  ) => {
    const selection = buildStudioSelectionFromDays({
      studio,
      pricingKey: nextPricingKey,
      bookingDays,
    });

    if (!selection) {
      updateData({
        selectedStudioIds: [studio.id],
        selectedStudioImage: studio.image,
        selectedStudioName: studio.name,
        location: studio.location,
        locationDetails: buildStudioLocationDetails(studio),
      });
      return;
    }

    updateData({
      selectedStudios: [selection],
      selectedStudioIds: [studio.id],
      selectedStudioImage: studio.image,
      selectedStudioName: studio.name,
      location: studio.location,
      locationDetails: buildStudioLocationDetails(studio),
    });
  }, [updateData]);

  const syncStudioSelection = useCallback((
    nextDate: Date | null,
    nextStart: string,
    nextEnd: string,
  ) => {
    if (!selectedStudio || !nextDate || !nextStart || !nextEnd) return;
    applyStudioSelection(selectedStudio, pricingKey, [{
      date: format(nextDate, "yyyy-MM-dd"),
      startTime: nextStart,
      endTime: nextEnd,
    }]);
  }, [applyStudioSelection, pricingKey, selectedStudio]);

  const syncSingleDay = useCallback((nextDate: Date | null, nextStart: string, nextEnd: string) => {
    if (!nextDate || !nextStart || !nextEnd) {
      updateData({ startDate: "", endDate: "", bookingDays: [] });
      return;
    }

    const durationHours = calculateDurationHours(nextStart, nextEnd) || 0;
    updateData({
      startDate: buildDateTimeString(nextDate, nextStart),
      endDate: buildDateTimeString(nextDate, nextEnd),
      bookingDays: [{
        date: format(nextDate, "yyyy-MM-dd"),
        startTime: nextStart,
        endTime: nextEnd,
        durationHours,
      }],
    });
    syncStudioSelection(nextDate, nextStart, nextEnd);
  }, [syncStudioSelection, updateData]);

  const syncMultiDay = useCallback((
    dates: Date[],
    sameTimings: boolean,
    commonStart: string,
    commonEnd: string,
    dateTimes: Record<string, { startKey?: string; endKey?: string }>,
  ) => {
    const sortedDates = dates.slice().sort((a, b) => a.getTime() - b.getTime());
    if (!sortedDates.length) {
      updateData({ startDate: "", endDate: "", bookingDays: [] });
      return;
    }

    const bookingDays = sortedDates.map((date) => {
      const dateKey = getDateKey(date);
      const dayStart = sameTimings ? commonStart : dateTimes[dateKey]?.startKey || "";
      const dayEnd = sameTimings ? commonEnd : dateTimes[dateKey]?.endKey || "";
      return {
        date: dateKey,
        startTime: dayStart,
        endTime: dayEnd,
        durationHours: calculateDurationHours(dayStart, dayEnd) || 0,
      };
    });

    const firstCompleteDay = bookingDays.find((day) => day.startTime && day.endTime);
    updateData({
      startDate: firstCompleteDay ? `${firstCompleteDay.date}T${firstCompleteDay.startTime}:00` : "",
      endDate: firstCompleteDay ? `${firstCompleteDay.date}T${firstCompleteDay.endTime}:00` : "",
      bookingDays,
    });

    if (selectedStudio && firstCompleteDay) {
      applyStudioSelection(selectedStudio, pricingKey, bookingDays);
    }
  }, [applyStudioSelection, pricingKey, selectedStudio, updateData]);

  const filteredStartTimeOptions = useMemo(() => {
    if (!selectedDate || !isToday(selectedDate)) return timeOptions;
    const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
    return timeOptions.filter((option) => timeToMinutes(option.key) >= cutoffMinutes);
  }, [selectedDate, timeOptions]);

  const endTimeOptions = useMemo(() => {
    if (!startTime) return timeOptions;
    return timeOptions.filter((option) => timeToMinutes(option.key) >= timeToMinutes(startTime) + 120);
  }, [startTime, timeOptions]);

  const reelDays = useMemo(() => {
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

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarMonth));
    const end = endOfWeek(endOfMonth(currentCalendarMonth));
    return eachDayOfInterval({ start, end });
  }, [currentCalendarMonth]);

  const handleBookingTypeChange = (bookingType: "single_day" | "multi_day") => {
    if (bookingType === "single_day") {
      const nextDate = selectedDate || selectedDates[0] || null;
      setSelectedDates(nextDate ? [nextDate] : []);
      setSameTimingsMulti(true);
      setMultiDayTimes({});
      setExpandedDateKey(null);
      updateData({ bookingType: "single_day", bookingDays: [] });
      syncSingleDay(nextDate, startTime, endTime);
      scrollToRef(dateTimeRef);
      return;
    }

    const nextDates = selectedDates.length ? selectedDates : selectedDate ? [selectedDate] : [];
    const nextTimes = buildMultiDayTimeMap(nextDates, { startKey: startTime, endKey: endTime }, multiDayTimes);
    setSelectedDates(nextDates);
    setMultiDayTimes(nextTimes);
    updateData({ bookingType: "multi_day" });
    syncMultiDay(nextDates, true, startTime, endTime, nextTimes);
    scrollToRef(dateTimeRef);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedDates(date ? [date] : []);
    syncSingleDay(date, startTime, endTime);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (data.bookingType === "multi_day") {
      syncMultiDay(selectedDates, sameTimingsMulti, value, endTime, multiDayTimes);
      return;
    }
    syncSingleDay(selectedDate, value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    if (data.bookingType === "multi_day") {
      syncMultiDay(selectedDates, sameTimingsMulti, startTime, value, multiDayTimes);
      return;
    }
    syncSingleDay(selectedDate, startTime, value);
    scrollToRef(purposeRef);
  };

  const toggleDateSelection = (date: Date) => {
    const nextDates = (() => {
      const exists = selectedDates.some((selected) => isSameDay(selected, date));
      if (exists) return selectedDates.filter((selected) => !isSameDay(selected, date));
      return [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime());
    })();
    const nextTimes = buildMultiDayTimeMap(nextDates, { startKey: startTime, endKey: endTime }, multiDayTimes);
    setSelectedDates(nextDates);
    setSelectedDate(nextDates[0] || null);
    setMultiDayTimes(nextTimes);
    syncMultiDay(nextDates, sameTimingsMulti, startTime, endTime, nextTimes);
  };

  const handleSameTimingsModeChange = (useSameTimings: boolean) => {
    setSameTimingsMulti(useSameTimings);
    setExpandedDateKey(null);
    const nextTimes = useSameTimings
      ? multiDayTimes
      : buildMultiDayTimeMap(selectedDates, { startKey: startTime, endKey: endTime }, multiDayTimes);
    setMultiDayTimes(nextTimes);
    syncMultiDay(selectedDates, useSameTimings, startTime, endTime, nextTimes);
  };

  const handleMultiDayStartTimeChange = (dateKey: string, value: string) => {
    const nextTimes = {
      ...multiDayTimes,
      [dateKey]: { ...multiDayTimes[dateKey], startKey: value },
    };
    setMultiDayTimes(nextTimes);
    syncMultiDay(selectedDates, false, startTime, endTime, nextTimes);
  };

  const handleMultiDayEndTimeChange = (dateKey: string, value: string) => {
    const nextTimes = {
      ...multiDayTimes,
      [dateKey]: { ...multiDayTimes[dateKey], endKey: value },
    };
    setMultiDayTimes(nextTimes);
    syncMultiDay(selectedDates, false, startTime, endTime, nextTimes);
  };

  const getDateSpecificStartOptions = (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`);
    if (!isToday(date)) return timeOptions;
    const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const cutoffMinutes = cutoff.getHours() * 60 + cutoff.getMinutes();
    return timeOptions.filter((option) => timeToMinutes(option.key) >= cutoffMinutes);
  };

  const getDateSpecificEndOptions = (dateKey: string) => {
    const startKey = multiDayTimes[dateKey]?.startKey || "";
    if (!startKey) return timeOptions;
    return timeOptions.filter((option) => timeToMinutes(option.key) >= timeToMinutes(startKey) + 120);
  };

  const selectStudio = (studio: StudioCatalogItem) => {
    const currentDate = selectedDate || new Date();
    const currentStart = startTime || "09:00";
    const currentEnd = endTime || "17:00";
    const nextPricingKey = getDefaultPricingKey(studio);
    if (selectedStudio?.id === studio.id) {
      updateData({
        selectedStudios: [],
        selectedStudioIds: [],
        selectedStudioName: "",
        selectedStudioImage: "",
        location: "",
        locationDetails: undefined
      });
      return;
    }
    const nextBookingDays = data.bookingType === "multi_day" && selectedDates.length
      ? selectedDates.map((date) => {
        const dateKey = getDateKey(date);
        return {
          date: dateKey,
          startTime: sameTimingsMulti ? currentStart : multiDayTimes[dateKey]?.startKey,
          endTime: sameTimingsMulti ? currentEnd : multiDayTimes[dateKey]?.endKey,
        };
      })
      : [{
        date: format(currentDate, "yyyy-MM-dd"),
        startTime: currentStart,
        endTime: currentEnd,
      }];

    applyStudioSelection(studio, nextPricingKey, nextBookingDays);

    if (studio) {
      scrollToRef(bookingTypeRef);
    }
  };

  const handlePricingOptionChange = (nextPricingKey: string) => {
    if (!selectedStudio) return;
    const schedule = data.bookingType === "multi_day" && selectedDates.length
      ? selectedDates.map((date) => {
        const dateKey = getDateKey(date);
        return {
          date: dateKey,
          startTime: sameTimingsMulti ? startTime : multiDayTimes[dateKey]?.startKey,
          endTime: sameTimingsMulti ? endTime : multiDayTimes[dateKey]?.endKey,
        };
      })
      : selectedDate
        ? [{
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime,
          endTime,
        }]
        : [];

    if (!schedule.length) {
      updateData({
        selectedStudios: [buildStudioSelectionFromPricing({ studio: selectedStudio, pricingKey: nextPricingKey })],
        selectedStudioIds: [selectedStudio.id],
        selectedStudioImage: selectedStudio.image,
        selectedStudioName: selectedStudio.name,
        location: selectedStudio.location,
        locationDetails: buildStudioLocationDetails(selectedStudio),
      });
      return;
    }

    applyStudioSelection(selectedStudio, nextPricingKey, schedule);
    scrollToRef(navigationRef);
  };

  useEffect(() => {
    if (data.bookingType !== "single_day") {
      return;
    }

    if (!selectedStudio || !selectedDate || !startTime || !endTime) return;
    syncStudioSelection(selectedDate, startTime, endTime);
  }, [data.bookingType, selectedDate, startTime, endTime, pricingKey, selectedStudio, syncStudioSelection]);

  const selectedDuration = startTime && endTime ? Math.max(0, Math.ceil((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60)) : 0;
  const billableHours = selectedPricing ? Math.max(selectedDuration, selectedPricing.minimumHours) : selectedDuration;
  const hasSelectedStudioSchedule =
    data.bookingType === "multi_day"
      ? selectedDates.length > 0 &&
      (sameTimingsMulti
        ? Boolean(startTime && endTime)
        : selectedDates.every((date) => {
          const dateKey = getDateKey(date);
          return Boolean(multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey);
        }))
      : Boolean(selectedDate && startTime && endTime);
  const estimateTotal = hasSelectedStudioSchedule
    ? selectedStudioTotal ||
    (selectedPricing ? selectedPricing.hourlyRate * billableHours + (selectedPricing.cleaningFee || 0) : 0)
    : 0;

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref && ref.current) {
        const navOffset = 100;

        const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <div className="flex w-full flex-col gap-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[64px] lg:leading-[1.05]">Book a Studio</h1>
        <p className="mt-3 text-sm text-white/60 lg:text-lg">Choose your studio, date, time, and whether you need creators on set.</p>
      </div>

      <div ref={emailRef} className="border-t border-white/10 pt-6 lg:pt-15">
        <h2 className="mb-3 text-base font-medium text-white/90 lg:mb-6 lg:text-xl">
          Email Address <span className="text-[#E8D1AB]">*</span>
        </h2>
        <input
          type="email"
          value={data.email}
          onChange={(event) => updateData({ email: event.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(data.email)) {
                scrollToRef(studioRef);
                (e.target as HTMLInputElement).blur(); // Remove focus
              }
            }
          }}
          placeholder="your@email.com"
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#101010] px-4 text-white placeholder:text-white/40 transition-colors focus:border-[#E8D1AB] focus:outline-none lg:h-[82px] lg:px-6"
        />
      </div>

      <div ref={studioRef} className="border-t border-white/10 pt-8">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white lg:text-2xl">Select Studio</h2>
            <p className="mt-1 text-sm text-white/50">All Beige studios are available for direct studio bookings.</p>
          </div>
          <div className="flex h-12 min-w-[260px] items-center rounded-xl border border-white/10 bg-[#151515] px-4">
            <Search size={17} className="mr-2 text-white/40" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search studios"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudios.map((studio) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              selected={selectedStudio?.id === studio.id}
              onSelect={() => selectStudio(studio)}
            />
          ))}
        </div>
      </div>

      <div ref={bookingTypeRef} className="border-t border-white/10 pt-8">
        <h2 className="mb-3 text-base font-medium text-white/90 lg:mb-6 lg:text-xl">Select Booking Type</h2>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {[
            { key: "single_day", label: "Single Day" },
            { key: "multi_day", label: "Multiple Days" },
          ].map((option) => {
            const active = data.bookingType === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleBookingTypeChange(option.key as "single_day" | "multi_day")}
                className={`flex h-14 w-fit min-w-[210px] items-center justify-between rounded-2xl border px-4 transition-colors duration-300 ease-in-out lg:h-[82px] lg:w-[300px] lg:px-6 ${active ? "border-transparent bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] text-black" : "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20"
                  }`}
              >
                <span className="pr-2 text-sm font-medium lg:text-lg">{option.label}</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full lg:h-8 lg:w-8 ${active ? "bg-black" : "border border-[#E5E5E5]"}`}>
                  {active && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={dateTimeRef} className="border-t border-white/10 pt-8">
        {data.bookingType === "single_day" ? (
          <>
            <h2 className="mb-6 text-base font-medium text-white/90 lg:text-xl">Shoot Date & Time</h2>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="w-full">
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  colors={datePickerColours}
                  format="MM/dd/yyyy"
                  sx={{ height: { xs: "56px", md: "82px" }, borderRadius: "16px" }}
                />
              </div>
              <DropdownSelect
                title="Start Time"
                options={filteredStartTimeOptions}
                value={startTime}
                onChange={handleStartTimeChange}
                bgColour="bg-[#101010]"
              />
              <DropdownSelect
                title="End Time"
                options={endTimeOptions}
                value={endTime}
                onChange={handleEndTimeChange}
                bgColour="bg-[#101010]"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm font-medium text-[#E8D1AB]">
                Duration: {selectedDuration || 0} Hours
              </span>
              {estimateTotal > 0 ? (
                <span className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm font-medium text-[#E8D1AB]">
                  Studio estimate: ${estimateTotal.toLocaleString()}
                </span>
              ) : (
                <span className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm font-medium text-[#E8D1AB]">
                  Studio estimate: $0
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="relative mb-8 lg:mb-15">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="mb-3 text-base font-medium text-white/90 lg:mb-6 lg:text-xl">Select Date</h2>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
                >
                  <span className="font-medium text-white group-hover:text-[#E8D1AB] lg:text-[20px]">
                    {format(currentCalendarMonth, "MMMM yyyy")}
                  </span>
                  <Calendar size={20} className="text-white group-hover:text-[#E8D1AB]" />
                </button>
              </div>

              <div
                ref={reelRef}
                onWheel={(event) => {
                  if (!reelRef.current) return;
                  event.preventDefault();
                  reelRef.current.scrollLeft += event.deltaY;
                }}
                onPointerDown={(event) => {
                  if (!reelRef.current) return;
                  isDraggingReel.current = true;
                  didDragReel.current = false;
                  dragStartX.current = event.clientX;
                  dragStartY.current = event.clientY;
                  dragStartScrollLeft.current = reelRef.current.scrollLeft;
                }}
                onPointerMove={(event) => {
                  if (!reelRef.current || !isDraggingReel.current) return;
                  const dx = event.clientX - dragStartX.current;
                  const dy = event.clientY - dragStartY.current;
                  if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) didDragReel.current = true;
                  if (didDragReel.current) reelRef.current.scrollLeft = dragStartScrollLeft.current - dx;
                }}
                onPointerUp={() => {
                  isDraggingReel.current = false;
                  if (didDragReel.current) suppressChipClickUntil.current = Date.now() + 150;
                  setTimeout(() => {
                    didDragReel.current = false;
                  }, 0);
                }}
                onPointerLeave={() => {
                  isDraggingReel.current = false;
                }}
                className="no-scrollbar flex cursor-grab select-none gap-3 overflow-x-auto pb-4 active:cursor-grabbing"
              >
                {reelDays.map((date) => {
                  const isSelected = selectedDates.some((selected) => isSameDay(selected, date));
                  return (
                    <button
                      type="button"
                      key={date.toISOString()}
                      onClick={() => {
                        if (Date.now() < suppressChipClickUntil.current) return;
                        toggleDateSelection(date);
                      }}
                      className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full border transition-all lg:h-[100px] lg:w-[100px] ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black" : "border-white/10 bg-transparent text-white/40 hover:border-white/30"
                        }`}
                    >
                      <span className="text-lg font-bold lg:text-3xl">{format(date, "d")}</span>
                      <span className="text-[10px] font-medium uppercase lg:text-xs">{format(date, "EEE")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="mt-4 w-fit rounded-lg bg-[#211F1C] px-4 py-2 lg:mt-8 lg:rounded-xl lg:px-7 lg:py-3">
                  <p className="text-xs font-medium text-[#E8D1AB] lg:text-sm">Total Days: {selectedDates.length}</p>
                </div>
                <div className="mt-4 w-fit rounded-lg bg-[#211F1C] px-4 py-2 lg:mt-8 lg:rounded-xl lg:px-7 lg:py-3">
                  <p className="text-xs font-medium text-[#E8D1AB] lg:text-sm">Selected Days: {getFormattedDateString(selectedDates)}</p>
                </div>
              </div>

              <AnimatePresence>
                {isCalendarOpen && (
                  <motion.div
                    ref={calendarRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-14 z-50 w-[320px] rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <button type="button" onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}>
                        <ChevronLeft size={20} />
                      </button>
                      <span className="font-bold text-white">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}>
                          <ChevronRight size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="rounded-full p-1 transition-colors hover:bg-white/10"
                          aria-label="Close calendar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/40">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date) => {
                        const isSelected = selectedDates.some((selected) => isSameDay(selected, date));
                        return (
                          <button
                            type="button"
                            key={date.toISOString()}
                            onClick={() => toggleDateSelection(date)}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors ${isSelected ? "bg-[#E8D1AB] text-black" : "text-white hover:bg-white/10"
                              } ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}
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
              <div className="space-y-6 border-t border-white/10 pt-6 lg:pt-15">
                <h3 className="mb-3 text-lg font-medium text-white/90 lg:mb-6 lg:text-[28px]">
                  Are timings same for all selected dates?
                </h3>
                <div className="flex gap-4">
                  {[
                    { value: true, label: "Yes" },
                    { value: false, label: "No" },
                  ].map((option) => {
                    const active = sameTimingsMulti === option.value;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSameTimingsModeChange(option.value)}
                        className={`flex h-14 w-[100px] items-center justify-between rounded-2xl border px-2 transition-colors duration-300 ease-in-out lg:h-[82px] lg:w-[140px] lg:px-6 ${active ? "border-transparent bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] text-black" : "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20"
                          }`}
                      >
                        <span className="pr-2 text-sm font-medium lg:text-lg">{option.label}</span>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full lg:h-8 lg:w-8 ${active ? "bg-black" : "border border-[#E5E5E5]"}`}>
                          {active && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {sameTimingsMulti ? (
                  <div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <DropdownSelect
                        title="Start Time"
                        options={filteredStartTimeOptions}
                        value={startTime}
                        onChange={handleStartTimeChange}
                        bgColour="bg-[#101010]"
                      />
                      <DropdownSelect
                        title="End Time"
                        options={endTimeOptions}
                        value={endTime}
                        onChange={handleEndTimeChange}
                        bgColour="bg-[#101010]"
                      />
                    </div>
                    <p className="my-3 flex gap-2 text-[#A9A9A9] lg:mb-8 lg:mt-6">
                      <Check size={24} className="text-white" /> Applied to {selectedDates.length} selected dates
                    </p>
                    <div className="flex flex-col rounded-lg border border-white/30 bg-[#171717] p-4 lg:flex-row lg:items-center lg:justify-between lg:rounded-2xl lg:p-7">
                      <p className="font-medium text-white lg:text-[20px]">{getFormattedDateString(selectedDates)}</p>
                      <p className="font-medium text-white/60 lg:text-[20px]">
                        {startTime && endTime ? `${getTimeLabel(startTime)} - ${getTimeLabel(endTime)}` : "Select time"}
                      </p>
                      <p className="font-medium text-[#E8D1AB] lg:text-[20px]">
                        {startTime && endTime && calculateDurationHours(startTime, endTime) !== null
                          ? `${calculateDurationHours(startTime, endTime)} Hours/Day`
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
                        <div
                          key={date.toISOString()}
                          ref={(element) => {
                            selectedDateCardRefs.current[dateKey] = element;
                          }}
                          className={`rounded-2xl border border-white/10 bg-[#171717] ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}
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
                            className={`flex w-full items-center justify-between px-6 py-5 ${isExpanded ? "rounded-b-2xl border-b border-b-white/10" : ""}`}
                          >
                            <span className="font-medium text-white">{format(date, "MMMM dd, yyyy")}</span>
                            <ChevronDown className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-visible bg-[#101010] p-4 lg:p-7"
                              >
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                  <DropdownSelect
                                    title="Start Time"
                                    options={getDateSpecificStartOptions(dateKey)}
                                    value={multiDayTimes[dateKey]?.startKey || ""}
                                    onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                    bgColour="bg-[#101010]"
                                  />
                                  <DropdownSelect
                                    title="End Time"
                                    options={getDateSpecificEndOptions(dateKey)}
                                    value={multiDayTimes[dateKey]?.endKey || ""}
                                    onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                    bgColour="bg-[#101010]"
                                  />
                                </div>
                                <div className="mt-2 w-fit rounded-lg bg-[#211F1C] px-4 py-2 lg:mt-4 lg:rounded-xl lg:px-7 lg:py-3">
                                  <p className="text-xs font-medium text-[#E8D1AB] lg:text-sm">
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
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedStudio && selectedStudio.pricingOptions && selectedStudio.pricingOptions.length > 0 && (
        <div ref={purposeRef} className="border-t border-white/10 pt-8">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white lg:text-2xl">What are you booking the studio for?</h2>
            <p className="mt-1 text-sm text-white/50">
              Select the purpose so we can calculate the correct studio rate, minimum hours, and cleaning fee.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {selectedStudio.pricingOptions.map((option) => {
              const active = pricingKey === option.key;
              const packageEstimate = hasSelectedStudioSchedule
                ? selectedStudioTotal && active
                  ? selectedStudioTotal
                  : option.hourlyRate * Math.max(selectedDuration || option.minimumHours, option.minimumHours) + (option.cleaningFee || 0)
                : null;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handlePricingOptionChange(option.key)}
                  className={`rounded-2xl border p-5 text-left transition-colors ${active ? "border-[#E8D1AB] bg-[#E8D1AB14]" : "border-white/10 bg-[#151515] hover:border-white/25"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-white">{option.label}</div>
                      <div className="mt-3 text-2xl font-bold text-[#E8D1AB]">
                        ${option.hourlyRate.toLocaleString()}/hour
                      </div>
                    </div>
                    <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#E8D1AB]" : "border border-white/40"}`}>
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-black" />}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-white/55">
                    {option.minimumHours}-hour minimum{option.cleaningFee ? ` • $${option.cleaningFee.toLocaleString()} cleaning fee` : ""}
                  </div>
                  <div className="my-4 border-t border-white/10" />
                  <div className="text-xs font-bold uppercase text-white/40">Ideal for</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.idealFor.slice(0, 6).map((item) => (
                      <span key={item} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60">
                        {item}
                      </span>
                    ))}
                  </div>
                  {packageEstimate !== null && (
                    <div className="mt-5 rounded-xl bg-[#211F1C] px-4 py-3 text-sm font-semibold text-[#E8D1AB]">
                      {`Current estimate: $${packageEstimate.toLocaleString()}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[16px] border border-white/10 bg-[#111111] p-5 lg:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-[#E8D1AB]">
              <Camera size={25} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Need a Photographer or Videographer for your Studio?</h3>
              <p className="mt-1 text-xs text-white/50">Bring your shoot to life with top photographers/videographers at your studio.</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onBrowseCreators}
            disabled={isSaving}
            className="h-14 rounded-lg bg-[#E8D1AB] px-8 text-black hover:bg-[#dcb98a] disabled:opacity-60"
          >
            Browse Creators
          </Button>
        </div>
      </div>

      <div ref={navigationRef} className="flex gap-3 border-t border-white/10 pt-8">
        <Button
          type="button"
          onClick={onSaveAndConfirm}
          disabled={isSaving}
          className="h-12 rounded-lg bg-[#E8D1AB] px-8 text-black hover:bg-[#dcb98a] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};

const CreatorDetailsStep = ({
  data,
  updateData,
  onBack,
  onSaveAndConfirm,
  onBrowseCreators,
  isSaving,
  user
}: StepProps) => {
  const [updateBookingCrew, { isLoading: isUpdatingCrew }] = useUpdateBookingCrewMutation();
  const [videoCount, setVideoCount] = useState(data.roleCounts?.videographer || data.videographyCount || 0);
  const [photoCount, setPhotoCount] = useState(data.roleCounts?.photographer || data.photographyCount || 0);
  const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>(data.editsNeeded ? "video" : null);
  const videoPanelRef = useRef<HTMLDivElement>(null);
  const photoPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openEditPanel) return;
    const activeRef = openEditPanel === "video" ? videoPanelRef : photoPanelRef;
    const handleClickOutside = (event: MouseEvent) => {
      if (activeRef.current && !activeRef.current.contains(event.target as Node)) {
        setOpenEditPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openEditPanel]);


  const updateEditCount = (key: string, delta: number, type: "video" | "photo") => {
    const source = type === "video" ? data.videoEditTypes : data.photoEditTypes;
    const currentCount = source.filter((item) => item === key).length;
    const nextCount = Math.max(0, currentCount + delta);
    const next = source.filter((item) => item !== key);
    for (let index = 0; index < nextCount; index += 1) next.push(key);
    updateData(type === "video" ? { videoEditTypes: next } : { photoEditTypes: next });
  };

  const saveCrewAndContinue = async () => {
    if (videoCount + photoCount === 0) {
      toast.error("Please add at least one videographer or photographer.");
      return;
    }

    if (!data.bookingId) {
      toast.error("Booking reference missing. Please try again.");
      return;
    }

    try {
      const response = await updateBookingCrew({
        booking_id: data.bookingId,
        crew_roles: {
          videographer: videoCount,
          photographer: photoCount,
        },
        location: data.location,
        location_latitude:
          data.locationDetails?.coordinates?.lat ??
          data.locationDetails?.lat ??
          data.locationDetails?.center?.[1] ??
          undefined,
        location_longitude:
          data.locationDetails?.coordinates?.lng ??
          data.locationDetails?.lng ??
          data.locationDetails?.center?.[0] ??
          undefined,
        reference_links: data.referenceLinks,
      }).unwrap();

      const serverCrewRoles = response.data?.crew_roles || {
        videographer: videoCount,
        photographer: photoCount,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("required_videographers", String(serverCrewRoles.videographer || videoCount));
        localStorage.setItem("required_photographers", String(serverCrewRoles.photographer || photoCount));
      }

      updateData({
        contentType: [
          "studio",
          ...(videoCount > 0 ? ["videographer" as const] : []),
          ...(photoCount > 0 ? ["photographer" as const] : []),
        ],
        roleCounts: serverCrewRoles,
        videographyCount: serverCrewRoles.videographer || videoCount,
        photographyCount: serverCrewRoles.photographer || photoCount,
        crewCount: (serverCrewRoles.videographer || videoCount) + (serverCrewRoles.photographer || photoCount),
        editsNeeded: data.videoEditTypes.length > 0 || data.photoEditTypes.length > 0,
      });

      pushToDataLayer("studio_booking_step2_submitted", {
        type: "Action Tracking",
        page_name: "Book-a-studio Page - Choose Creators",
        location_in_website: "book_a_studio_step2_continue_btn",
        duration_on_page: performance.now() / 1000,
        phone: user?.phone_number,
        user_id: user?.id || "Guest",
        user_type: user?.user_type_id !== undefined ? USER_TYPE[user.user_type_id] : "Guest",
        booking_id: data.bookingId,
        email: data.email,

        // Flat fields passed individually for seamless GA4 tracking:
        form_edits_needed: data.editsNeeded ? "true" : "false", // Convert boolean to a clear string
        form_edit_types: [...data.photoEditTypes, ...data.videoEditTypes].join(", "),
        form_additional_creative: (serverCrewRoles.videographer || videoCount) + (serverCrewRoles.photographer || photoCount),
      });

      onBrowseCreators();
    } catch (error) {
      console.error("Failed to save studio creator details:", error);
      toast.error("Failed to save creator details.");
    }
  };

  const editCount = (key: string, type: "video" | "photo") =>
    (type === "video" ? data.videoEditTypes : data.photoEditTypes).filter((item) => item === key).length;

  return (
    <div className="flex w-full flex-col gap-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[56px]">Choose Creators</h1>
        <p className="mt-3 text-sm text-white/60">Let us know if you need a photographer or videographer for your studio.</p>
      </div>

      <div className="border-t border-white/10 pt-8">
        <h2 className="mb-4 text-base font-medium text-white/90 lg:text-xl">Select professionals for your location.</h2>
        <div className="rounded-[20px] border border-white/5 bg-[#171717] p-3 lg:p-6">
          {[
            { key: "videographer", label: "Videographer", price: "$250/hour", icon: Video, count: videoCount, setCount: setVideoCount },
            { key: "photographer", label: "Photographer", price: "$250/hour", icon: Camera, count: photoCount, setCount: setPhotoCount },
          ].map((role) => (
            <div key={role.key} className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#101010] text-[#E8D1AB] lg:h-15 lg:w-15">
                  <role.icon size={28} />
                </div>
                <div>
                  <div className="text-base font-medium text-white lg:text-lg">{role.label}</div>
                  <div className="text-xs text-[#E8D1AB] lg:text-sm">{role.price}</div>
                </div>
              </div>
              <QuantityControl
                value={role.count}
                onIncrease={() => role.setCount(role.count + 1)}
                onDecrease={() => role.setCount(Math.max(0, role.count - 1))}
                className="h-[44px] min-w-[96px] rounded-[14px] px-3 lg:h-[52px] lg:min-w-[110px] lg:px-5"
                buttonClassName="grid h-7 w-7 place-items-center rounded-full transition hover:bg-black/5 lg:h-8 lg:w-8"
                valueClassName="min-w-[26px] text-base font-semibold tabular-nums lg:text-[18px]"
              />
            </div>
          ))}
        </div>
        {(videoCount > 0 || photoCount > 0) && (
          <div className="mt-4 rounded-xl bg-[#211F1C] px-4 py-3 text-sm font-medium text-[#E8D1AB]">
            Estimated creator rate: ${((videoCount + photoCount) * 250).toLocaleString()}/hour
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-white">Edits Needed?</h2>
        <div className="mb-6 flex gap-3">
          {[true, false].map((value) => {
            const active = data.editsNeeded === value;
            return (
              <button
                key={String(value)}
                type="button"
                onClick={() => {
                  if (!value) {
                    setOpenEditPanel(null);
                    updateData({ editsNeeded: false, videoEditTypes: [], photoEditTypes: [] });
                  } else {
                    setOpenEditPanel("video");
                    updateData({ editsNeeded: true });
                  }
                }}
                className={`flex h-14 w-[100px] items-center justify-between rounded-2xl border px-4 text-sm font-medium ${active ? "border-transparent bg-[#E8D1AB] text-black" : "border-white/10 bg-[#101010] text-white/70"
                  }`}
              >
                {value ? "Yes" : "No"}
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? "bg-black" : "border border-white/70"}`}>
                  {active && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                </span>
              </button>
            );
          })}
        </div>

        {data.editsNeeded && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <h4 className="mb-4 flex items-center gap-2 font-medium text-white lg:text-xl">
              <Info size={24} className="text-white" />
              Editing includes
            </h4>
            <p className="mb-8 text-sm text-white/60">
              Professional editing includes color grading, sound mixing, and basic revisions.
            </p>

            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <div ref={videoPanelRef} className="self-start overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  onClick={() => setOpenEditPanel(openEditPanel === "video" ? null : "video")}
                >
                  <div className="min-w-0 flex flex-1 items-center gap-3">
                    <div className="shrink-0 text-base font-medium text-white lg:text-lg">Video Edits</div>
                    {data.videoEditTypes.length > 0 && (
                      <span className="rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs text-white lg:text-sm">
                        {data.videoEditTypes.length} selected
                      </span>
                    )}
                  </div>
                  {openEditPanel === "video" ? <ChevronUp className="shrink-0 text-white" /> : <ChevronDown className="shrink-0 text-white" />}
                </button>
                {openEditPanel === "video" && (
                  <div className="border-t border-white/10 px-5 py-3">
                    {socialContentEditTypes.slice(0, 3).map((option) => {
                      const count = editCount(option.key, "video");
                      return (
                        <div key={option.key} className="flex items-center justify-between gap-4 border-b border-white/10 py-4 last:border-b-0">
                          <span className="text-sm text-white lg:text-base">{option.value}</span>
                          <QuantityControl
                            value={count}
                            onIncrease={() => updateEditCount(option.key, 1, "video")}
                            onDecrease={() => updateEditCount(option.key, -1, "video")}
                            className="h-[44px] min-w-[96px] rounded-[14px] px-3 lg:h-[52px] lg:min-w-[110px] lg:px-5"
                            buttonClassName="grid h-7 w-7 place-items-center rounded-full transition hover:bg-black/5 lg:h-8 lg:w-8"
                            valueClassName="min-w-[26px] text-base font-semibold tabular-nums lg:text-[18px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div ref={photoPanelRef} className="self-start overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  onClick={() => setOpenEditPanel(openEditPanel === "photo" ? null : "photo")}
                >
                  <div className="min-w-0 flex flex-1 items-center gap-3">
                    <div className="shrink-0 text-base font-medium text-white lg:text-lg">Photo Edits</div>
                    {data.photoEditTypes.length > 0 && (
                      <span className="rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs text-white lg:text-sm">
                        {data.photoEditTypes.length} selected
                      </span>
                    )}
                  </div>
                  {openEditPanel === "photo" ? <ChevronUp className="shrink-0 text-white" /> : <ChevronDown className="shrink-0 text-white" />}
                </button>
                {openEditPanel === "photo" && (
                  <div className="border-t border-white/10 px-5 py-3">
                    {socialContentPhotoEditTypes.slice(0, 1).map((option) => {
                      const count = editCount(option.key, "photo");
                      return (
                        <div key={option.key} className="flex items-center justify-between gap-4 border-b border-white/10 py-4 last:border-b-0">
                          <div>
                            <div className="text-sm text-white lg:text-base">{option.value}</div>
                            <div className="mt-1 text-xs text-white/40">+25 Photos Per Set</div>
                          </div>
                          <QuantityControl
                            value={count}
                            onIncrease={() => updateEditCount(option.key, 1, "photo")}
                            onDecrease={() => updateEditCount(option.key, -1, "photo")}
                            className="h-[44px] min-w-[96px] rounded-[14px] px-3 lg:h-[52px] lg:min-w-[110px] lg:px-5"
                            buttonClassName="grid h-7 w-7 place-items-center rounded-full transition hover:bg-black/5 lg:h-8 lg:w-8"
                            valueClassName="min-w-[26px] text-base font-semibold tabular-nums lg:text-[18px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-white/10 pt-8">
        <Button onClick={onBack} className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] ">
          Back
        </Button>
        <Button
          onClick={saveCrewAndContinue}
          disabled={isUpdatingCrew || isSaving}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          {isUpdatingCrew ? "Saving..." : "Continue"}
        </Button>
        <Button onClick={onSaveAndConfirm}
          className="h-14 lg:h-[72px] bg-[#FFFFFF] hover:bg-[#FFFFFF]/80 text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]">
          Skip Creators
        </Button>
      </div>
    </div>
  );
};

export const BookAStudio = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<BookingDataV3>({
    ...initialDataV3,
    contentType: ["studio"],
    shootType: "studio",
    editsNeeded: false,
  });
  const [draftBookingId, setDraftBookingId] = useState<number | null>(null);
  const [trackEarlyInterest, { isLoading: isTracking }] = useTrackEarlyInterestMutation();
  const [saveQuote, { isLoading: isQuoteLoading }] = useSaveQuoteMutation();
  const [createGuestBooking, { isLoading: isCreatingBooking }] = useCreateGuestBookingMutation();
  const [updateGuestBooking, { isLoading: isUpdatingBooking }] = useUpdateGuestBookingMutation();
  const [userTypeName, setUserTypeName] = useState("Guest");

  const isSubmitting = isTracking || isQuoteLoading || isCreatingBooking || isUpdatingBooking;

  if (isAuthenticated && user?.email) {
    setUserTypeName(user?.user_type_id !== undefined ? USER_TYPE[user.user_type_id] : "Guest");
  }

  const updateData = useCallback((next: Partial<BookingDataV3>) => {
    setFormData((current) => ({ ...current, ...next }));
  }, []);

  useEffect(() => {
    const preSelectedId = searchParams.get("studioId");
    const preSelectedPricingKey = searchParams.get("pricingKey") || "";

    if (preSelectedId) {
      const studio = HOURLY_STUDIO_LIST.find((s) => s.id === preSelectedId);
      if (studio) {
        const nextPricingKey = studio.pricingOptions?.some((option) => option.key === preSelectedPricingKey)
          ? preSelectedPricingKey
          : getDefaultPricingKey(studio);

        updateData({
          selectedStudioIds: [studio.id],
          selectedStudioImage: studio.image,
          selectedStudioName: studio.name,
          location: studio.location,
          locationDetails: buildStudioLocationDetails(studio),
          selectedStudios: nextPricingKey
            ? [buildStudioSelectionFromPricing({ studio, pricingKey: nextPricingKey })]
            : [],
        });

        const newPath = window.location.pathname;
        window.history.replaceState(null, '', newPath);
      }
    }
  }, [searchParams, updateData]);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  const validateStudioStep = () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }
    if (!formData.selectedStudios?.length) {
      toast.error("Please select a studio.");
      return false;
    }
    if (formData.bookingType === "multi_day") {
      if (!formData.bookingDays?.length) {
        toast.error("Please select at least one booking date.");
        return false;
      }
      const hasMissingTime = formData.bookingDays.some((day) => !day.startTime || !day.endTime);
      if (hasMissingTime) {
        toast.error("Please select start and end time for every selected date.");
        return false;
      }
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select date, start time and end time.");
      return false;
    }
    return true;
  };

  const saveStudioDraft = async () => {
    if (!validateStudioStep()) return null;

    const selectedStudios = normalizeSelectedStudios(formData);
    const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
    const primaryStudio = selectedStudios[0];
    const browserTimeZone = getBrowserTimeZone();
    const payload = {
      booking_id: draftBookingId,
      guest_email: formData.email,
      user_id: user?.id,
      content_type: formData.contentType.join(","),
      shoot_type: "studio",
      client_name: user?.name || formData.fullName,
      start_date: primaryStudio?.selectedDate || getLocalDatePart(formData.startDate),
      start_time: primaryStudio?.startTime || getLocalTimePart(formData.startDate),
      end_time: primaryStudio?.endTime || getLocalTimePart(formData.endDate),
      time_zone: browserTimeZone,
      startDate: toUtcIsoIfValid(formData.startDate),
      endDate: toUtcIsoIfValid(formData.endDate),
      booking_type: formData.bookingType || "single_day",
      booking_days: (formData.bookingDays || []).map((day) => ({
        ...day,
        time_zone: day.timeZone || browserTimeZone,
      })),
      edits_needed: formData.editsNeeded,
      video_edit_types: formData.videoEditTypes,
      photo_edit_types: formData.photoEditTypes,
      studio_total: selectedStudiosTotal,
      studio_items: selectedStudios.map((studio) => ({
        studio_id: studio.studioId,
        name: studio.name,
        quantity: studio.quantity,
        unit_price: studio.unitPrice,
        total: studio.totalPrice,
        pricing_mode: studio.pricingMode,
      })),
    };

    try {
      const response = await trackEarlyInterest(payload).unwrap();
      const bookingId = response.data?.booking_id || draftBookingId;
      setDraftBookingId(bookingId || null);
      updateData({ bookingId: bookingId || undefined });
      return bookingId || null;
    } catch (error) {
      console.error("Failed to save studio draft:", error);
      toast.error("Failed to save studio booking. Please try again.");
      return null;
    }
  };

  const goToConfirm = async () => {
    const bookingId = await saveStudioDraft();
    if (!bookingId) return;

    if (activeStep === 1) {
      pushToDataLayer("generate_lead", {
        value: formData.selectedStudios?.map((studio) => studio.totalPrice).toString(), // Standard parameters
        currency: "USD",
        page_name: "Book-a-studio Page",  // Custom data schema
        location_in_website: "book_a_studio_step1",
        duration_on_page: performance.now() / 1000,
        user_id: user?.id || "Guest",
        user_type: userTypeName || "Guest",
        booking_id: bookingId,
        email: formData.email,
      });

      pushToDataLayer("studio_booking_submitted_step1", {
        type: "Action Tracking",
        page_name: "Book-a-studio Page",
        location_in_website: "book_a_studio_step1",
        duration_on_page: performance.now() / 1000,
        phone: user?.phone_number,
        user_id: user?.id || "Guest",
        user_type: userTypeName || "Guest",
        booking_id: bookingId,
        email: formData.email,

        // Flat fields passed individually for seamless GA4 tracking:
        form_content_type: formData.contentType.toString(),
        form_shoot_type: formData.shootType,
        form_shoot_date_time: `${formData.startDate} to ${formData.endDate}`,
        form_booking_type: formData.bookingType,
        form_selected_studio: formData.selectedStudioIds?.toString(),
        form_studio_pricing_category: formData.selectedStudios?.map((studio) => studio.pricingCategory).toString(),
        form_shoot_location: formData.location,
      });

      console.log("Generate_lead pushed to DL from Book a studio page");
    } else if (activeStep === 2) {
      pushToDataLayer("studio_booking_step2_skipped_creators", {
        type: "Action Tracking",
        page_name: "Book-a-studio Page",
        location_in_website: "book_a_studio_step1",
        duration_on_page: performance.now() / 1000,
        phone: user?.phone_number,
        user_id: user?.id || "Guest",
        user_type: userTypeName || "Guest",
        booking_id: bookingId,
        email: formData.email,

        // Flat fields passed individually for seamless GA4 tracking:
        form_content_type: formData.contentType.toString(),
        form_shoot_type: formData.shootType,
        form_shoot_date_time: `${formData.startDate} to ${formData.endDate}`,
        form_booking_type: formData.bookingType,
        form_selected_studio: formData.selectedStudioIds?.toString(),
        form_studio_pricing_category: formData.selectedStudios?.map((studio) => studio.pricingCategory).toString(),
        form_shoot_location: formData.location,
      });

      console.log("studio_booking_step2_skipped_creators pushed to DL from Book a studio page");
    }

    setActiveStep(5);
  }

  const goToCreatorDetails = async () => {
    const bookingId = await saveStudioDraft();
    if (!bookingId) return;

    // generate_lead needs to be pushed to the data layer before the studio_booking_browse_creators_clicked event, as per GA4 tracking requirements.
    pushToDataLayer("generate_lead", {
      value: formData.selectedStudios?.map((studio) => studio.totalPrice).toString(), // Standard parameters
      currency: "USD",
      page_name: "Book-a-studio Page",  // Custom data schema
      location_in_website: "book_a_studio_step1",
      duration_on_page: performance.now() / 1000,
      user_id: user?.id || "Guest",
      user_type: userTypeName || "Guest",
      booking_id: bookingId,
      email: formData.email,
    });

    pushToDataLayer("studio_booking_browse_creators_clicked", {
      type: "Action Tracking",
      page_name: "Book-a-studio Page",
      location_in_website: "book_a_studio_browse_creators_btn",
      duration_on_page: performance.now() / 1000,
      phone: user?.phone_number,
      user_id: user?.id || "Guest",
      user_type: userTypeName || "Guest",
      booking_id: bookingId,
      email: formData.email,

      // Flat fields passed individually for seamless GA4 tracking:
      form_content_type: formData.contentType.toString(),
      form_shoot_type: formData.shootType,
      form_shoot_date_time: `${formData.startDate} to ${formData.endDate}`,
      form_booking_type: formData.bookingType,
      form_selected_studio: formData.selectedStudioIds?.toString(),
      form_studio_pricing_category: formData.selectedStudios?.map((studio) => studio.pricingCategory).toString(),
      form_shoot_location: formData.location,
    });

    setActiveStep(2);
  };

  const handleBookingSubmission = async () => {
    try {
      const selectedStudios = normalizeSelectedStudios(formData);
      const selectedStudiosTotal = getSelectedStudiosTotal(selectedStudios);
      const primaryStudio = selectedStudios[0];
      const browserTimeZone = getBrowserTimeZone();
      const studioStartDateTime = primaryStudio?.selectedDate && primaryStudio?.startTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`
        : formData.startDate;
      const studioEndDateTime = primaryStudio?.selectedDate && primaryStudio?.endTime
        ? `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`
        : formData.endDate;
      const studioMeta = serializeStudioMeta(selectedStudios);
      const creatorQuoteItems = [
        Number(formData.roleCounts?.videographer || 0) > 0
          ? { item_id: 11, quantity: Number(formData.roleCounts?.videographer || 0) }
          : null,
        Number(formData.roleCounts?.photographer || 0) > 0
          ? { item_id: 10, quantity: Number(formData.roleCounts?.photographer || 0) }
          : null,
        Number(formData.roleCounts?.cinematographer || 0) > 0
          ? { item_id: 12, quantity: Number(formData.roleCounts?.cinematographer || 0) }
          : null,
      ].filter(Boolean) as Array<{ item_id: number; quantity: number }>;
      const totalShootHours = formData.bookingDays?.length
        ? formData.bookingDays.reduce((sum, day) => sum + Number(day.durationHours || 0), 0)
        : primaryStudio?.quantity || 0;

      let savedQuoteId: number | null = null;
      let savedQuoteTotal: number | null = null;
      try {
        const quotePayload = {
          items: creatorQuoteItems,
          shootHours: creatorQuoteItems.length > 0 ? Math.max(1, totalShootHours) : 0,
          eventType: "studio",
          guestEmail: formData.email,
          video_edit_types: formData.editsNeeded ? buildEditTypeCounts(formData.videoEditTypes) : [],
          photo_edit_types: formData.editsNeeded ? buildEditTypeCounts(formData.photoEditTypes) : [],
          studio_total: selectedStudiosTotal || 0,
          studio_items: selectedStudios.map((studio) => ({
            studio_id: studio.studioId,
            name: studio.name,
            quantity: studio.quantity,
            unit_price: studio.unitPrice,
            total: studio.totalPrice,
            pricing_mode: studio.pricingMode,
          })),
          shoot_start_date: primaryStudio?.selectedDate
            ? `${primaryStudio.selectedDate}T00:00:00.000Z`
            : formData.startDate || undefined,
          notes: formData.specialInstructions || undefined,
        };
        const savedQuote = await saveQuote(quotePayload).unwrap();
        savedQuoteId = savedQuote.quote_id;
        savedQuoteTotal = savedQuote.total;
      } catch (error) {
        console.error("Studio quote save failed:", error);
        toast.error("Error calculating final price, but proceeding with booking...");
      }

      const finalBookingData: GuestBookingData & Record<string, unknown> = {
        order_name: `STUDIO Shoot - ${formData.fullName || formData.email}`,
        guest_email: formData.email,
        content_type: formData.contentType.join(","),
        shoot_type: "studio",
        booking_type: formData.bookingType || "single_day",
        booking_days: (formData.bookingDays || []).map((day) => ({
          date: day.date,
          start_time: day.startTime,
          end_time: day.endTime,
          duration_hours: day.durationHours,
          time_zone: browserTimeZone,
        })),
        start_date: primaryStudio?.selectedDate || getLocalDatePart(formData.startDate),
        start_time: primaryStudio?.startTime || getLocalTimePart(formData.startDate),
        end_time: primaryStudio?.endTime || getLocalTimePart(formData.endDate),
        time_zone: browserTimeZone,
        duration_hours: primaryStudio?.quantity || 1,
        location: primaryStudio?.location || formData.location,
        location_latitude:
          formData.locationDetails?.coordinates?.lat ??
          formData.locationDetails?.lat ??
          formData.locationDetails?.center?.[1] ??
          primaryStudio?.lat,
        location_longitude:
          formData.locationDetails?.coordinates?.lng ??
          formData.locationDetails?.lng ??
          formData.locationDetails?.center?.[0] ??
          primaryStudio?.lng,
        quote_id: savedQuoteId,
        full_name: formData.fullName,
        phone: formData.phone,
        edits_needed: formData.editsNeeded,
        video_edit_types: formData.videoEditTypes,
        photo_edit_types: formData.photoEditTypes,
        crew_size: String(formData.crewCount || 0),
        matching_method: formData.matchingMethod || "ai_matchmaker",
        selected_crew_ids: formData.selectedCrewIds || [],
        special_instructions: [formData.specialInstructions, studioMeta].filter(Boolean).join("\n\n") || undefined,
        reference_links: formData.referenceLinks,
        start_date_time: studioStartDateTime,
        end_date_time: studioEndDateTime,
        is_draft: false,
      };

      const submissionResult = draftBookingId
        ? await updateGuestBooking({ id: draftBookingId, data: finalBookingData }).unwrap()
        : await createGuestBooking(finalBookingData).unwrap();

      // --- NATIVE GA4 BEGIN_CHECKOUT FOR DIRECT BOOKING FLOW ---
      pushToDataLayer("begin_checkout", {
        currency: "USD",
        value: savedQuoteTotal || 0,

        page_name: "Book-a-studio Page",
        location_in_website: "book_a_studio_review_confirm_btn",

        email: isAuthenticated ? user?.email : formData.email,
        user_id: isAuthenticated ? user?.id : "Guest",
        user_type: isAuthenticated && user?.userTypeId ? USER_TYPE[user.userTypeId] : "Guest",
        full_name: formData.fullName,
        phone: formData.phone || "Unknown",

        booking_id: submissionResult?.booking_id || draftBookingId,
        items: [{
          item_name: finalBookingData?.order_name || "Shoot Booking",
          price: savedQuoteTotal || 0,
          quantity: 1
        }]
      });
      // ---------------------------------------------------------

      toast.success("Booking Secured!", {
        description: "Redirecting to secure payment gateway...",
      });

      router.push(`/search-results/payment?shootId=${submissionResult.booking_id}`);
    } catch (error: unknown) {
      console.error("Studio booking submission failed:", error);
      const message =
        typeof error === "object" &&
          error !== null &&
          "data" in error &&
          typeof (error as { data?: { message?: unknown } }).data?.message === "string"
          ? (error as { data: { message: string } }).data.message
          : "Could not complete booking. Please check your connection.";
      toast.error("Submission Failed", {
        description: message,
      });
    }
  };

  const stepProps: StepProps = {
    data: formData,
    updateData,
    onBack: () => setActiveStep((current) => Math.max(1, current - 1)),
    onSaveAndConfirm: goToConfirm,
    onBrowseCreators: goToCreatorDetails,
    isSaving: isSubmitting,
    user: user || null,
  };

  const renderStep = () => {
    if (activeStep === 1) return <BookStudioDetailsStep {...stepProps} />;
    if (activeStep === 2) {
      return (
        <CreatorDetailsStep
          {...stepProps}
          onBrowseCreators={async () => setActiveStep(3)}
        />
      );
    }
    if (activeStep === 3) {
      return (
        <V3Step3CrewMatching
          data={formData}
          updateData={updateData}
          onBack={() => setActiveStep(2)}
          onNext={() => {
            setActiveStep(4);
            setTimeout(() => setActiveStep(5), 2500);
          }}
        />
      );
    }
    if (activeStep === 4) return <V3LoadingFindingCreative />;

    // Step 5: Decision point for "Book & Confirm" stage
    if (activeStep === 5) {
      const hasCreators = (formData.roleCounts?.videographer || 0) + (formData.roleCounts?.photographer || 0) > 0;

      // If they chose creators, show selection list
      if (hasCreators) {
        return (
          <V3SelectDreamTeam
            data={formData}
            updateData={updateData}
            onBack={() => setActiveStep(3)} // Skips loader
            onNext={() => setActiveStep(6)}
            bookingId={draftBookingId || undefined}
          />
        );
      }
      // If no creators (Studio only), show final confirmation
      return (
        <V3Step4BookConfirm
          data={formData}
          updateData={updateData}
          onBack={() => setActiveStep(1)}
          onNext={() => undefined}
          onConfirm={handleBookingSubmission}
          isSubmitting={isSubmitting}
        />
      );
    }

    // Step 6: Final confirmation (only reached after selecting a team)
    if (activeStep === 6) {
      return (
        <V3Step4BookConfirm
          data={formData}
          updateData={updateData}
          onBack={() => {
            setActiveStep(5);
          }}
          onNext={() => undefined}
          onConfirm={handleBookingSubmission}
          isSubmitting={isSubmitting}
        />
      );
    }
    return null;
  };

  const trackerStep = activeStep <= 1 ? 1 : activeStep >= 5 ? 3 : 2;

  return (
    <div className="min-h-screen bg-[#101010] text-white selection:bg-[#ECE1CE] selection:text-black">
      <Navbar />
      <main className="relative flex min-h-screen flex-col items-center pb-8 pt-24 lg:pt-44 lg:pb-16">
        {activeStep > 1 && activeStep !== 4 && (
          <div className="container z-20 w-full px-4 md:px-6">
            <button
              type="button"
              onClick={() => {
                const hasCreators = (formData.roleCounts?.videographer || 0) + (formData.roleCounts?.photographer || 0) > 0;

                if (activeStep === 6) {
                  setActiveStep(5);
                } else if (activeStep === 5) {
                  if (hasCreators) {
                    setActiveStep(3);
                  } else {
                    setActiveStep(1);
                  }
                } else if (activeStep === 4) {
                  setActiveStep(3);
                } else {
                  setActiveStep((current) => Math.max(1, current - 1));
                }
              }}
              className="flex items-center text-sm text-white/70 transition-colors hover:text-white lg:text-lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>
        )}

        <div className="container relative z-10 mx-auto flex flex-col items-center px-4 md:px-6">
          {activeStep !== 4 && <StepProgressTracker steps={STUDIO_STEPS} currentStep={trackerStep} />}
          <div className="mt-5 min-h-[400px] w-full max-w-4xl lg:mt-8 lg:max-w-5xl xl:max-w-7xl">
            {renderStep()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
