"use client";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Check,
  Loader2,
} from "lucide-react";
import { LocationPicker, darkThemeColors as mapColors } from "@/src/components/booking/v2/component/LocationPicker";
import DatePicker from "@/components/ui/Datepicker";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addDays, 
  set,
  startOfDay,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  fields: string[];
  shootId?: string;
  initialShootData?: ExistingShootDetails | null;
  onSaved?: (updated: {
    shootId: string;
    location?: string;
    bookingType: "single_day" | "multi_day";
    dateLabel?: string;
    rawDate?: number;
    startTime?: string;
    endTime?: string;
    bookingDays?: Array<{
      date: string;
      start_time: string;
      end_time: string;
    }>;
    remainingMissingFields: string[];
  }) => void;
}

type Option = {
  key: string;
  value: string;
};

type LocationDetails = {
  lat?: number;
  lng?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  center?: [number, number];
  [key: string]: unknown;
};

type ExistingBookingDay = {
  date: string;
  start_time: string;
  end_time: string;
};

type ExistingShootDetails = {
  event_location?: string | { address?: string } | null;
  location?: string | { address?: string } | null;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  booking_type?: "single_day" | "multi_day" | string | null;
  time_zone?: string | null;
  booking_days?: Array<{
    date?: string | null;
    event_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  }> | null;
  [key: string]: unknown;
};

type BookingDefaults = {
  location: string;
  locationDetails: LocationDetails | null;
  bookingType: "single_day" | "multi_day";
  selectedShootDate: Date | null;
  startDateTime: string;
  endDateTime: string;
  selectedDates: Date[];
  sameTimingsMulti: boolean;
  sharedMultiStartTime: string;
  sharedMultiEndTime: string;
  multiDayTimes: Record<string, { startKey: string; endKey: string }>;
  timeZone: string;
};

const EMPTY_BOOKING_DEFAULTS: BookingDefaults = {
  location: "",
  locationDetails: null,
  bookingType: "single_day",
  selectedShootDate: null,
  startDateTime: "",
  endDateTime: "",
  selectedDates: [],
  sameTimingsMulti: true,
  sharedMultiStartTime: "09:00",
  sharedMultiEndTime: "17:00",
  multiDayTimes: {},
  timeZone: "",
};

const getTimeKey = (value?: string | null) => String(value || "").slice(0, 5);

const updateDateTime = (baseDate: Date | null, timeKey: string) => {
  if (!baseDate) return "";
  const [hours, minutes] = timeKey.split(":").map(Number);
  return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString();
};

const normalizeLocationValue = (value: ExistingShootDetails["location"]) => {
  if (typeof value === "string") return value.trim();
  return value?.address?.trim?.() || "";
};

const normalizeBookingDays = (value: ExistingShootDetails["booking_days"]) : ExistingBookingDay[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((day) => ({
      date: String(day?.date || day?.event_date || "").trim(),
      start_time: getTimeKey(day?.start_time),
      end_time: getTimeKey(day?.end_time),
    }))
    .filter((day) => Boolean(day.date));
};

const buildDefaultsFromShoot = (
  shoot: ExistingShootDetails | null,
  fallbackTimeZone: string
): BookingDefaults => {
  if (!shoot) return EMPTY_BOOKING_DEFAULTS;

  const shootLocation = normalizeLocationValue(shoot.event_location) || normalizeLocationValue(shoot.location);
  const bookingDays = normalizeBookingDays(shoot.booking_days);
  const derivedBookingType =
    String(shoot.booking_type || "").toLowerCase() === "multi_day" || bookingDays.length > 1
      ? "multi_day"
      : "single_day";
  const timeZone = String(shoot.time_zone || "").trim() || fallbackTimeZone;

  if (derivedBookingType === "multi_day" && bookingDays.length > 0) {
    const dates = bookingDays.map((day) => new Date(`${day.date}T00:00:00`)).filter((date) => !isNaN(date.getTime()));
    const times: Record<string, { startKey: string; endKey: string }> = {};
    let allSame = true;
    const firstStart = bookingDays[0]?.start_time || "09:00";
    const firstEnd = bookingDays[0]?.end_time || "17:00";

    bookingDays.forEach((day) => {
      times[day.date] = {
        startKey: day.start_time || "09:00",
        endKey: day.end_time || "17:00",
      };
      if ((day.start_time || "09:00") !== firstStart || (day.end_time || "17:00") !== firstEnd) {
        allSame = false;
      }
    });

    return {
      location: shootLocation,
      locationDetails: null,
      bookingType: "multi_day",
      selectedShootDate: dates[0] || null,
      startDateTime: "",
      endDateTime: "",
      selectedDates: dates,
      sameTimingsMulti: allSame,
      sharedMultiStartTime: firstStart,
      sharedMultiEndTime: firstEnd,
      multiDayTimes: times,
      timeZone,
    };
  }

  const eventDateStr = String(shoot.event_date || "").trim();
  const startTime = getTimeKey(shoot.start_time || shoot.event_start_time || "09:00:00");
  const endTime = getTimeKey(shoot.end_time || shoot.event_end_time || "17:00:00");
  const baseDate = eventDateStr ? new Date(`${eventDateStr}T00:00:00`) : null;

  return {
    location: shootLocation,
    locationDetails: null,
    bookingType: "single_day",
    selectedShootDate: baseDate && !isNaN(baseDate.getTime()) ? baseDate : null,
    startDateTime: baseDate ? updateDateTime(baseDate, startTime) : "",
    endDateTime: baseDate ? updateDateTime(baseDate, endTime) : "",
    selectedDates: baseDate && !isNaN(baseDate.getTime()) ? [baseDate] : [],
    sameTimingsMulti: true,
    sharedMultiStartTime: startTime || "09:00",
    sharedMultiEndTime: endTime || "17:00",
    multiDayTimes: {},
    timeZone,
  };
};

const ModalDropdownSelect = ({
  title,
  options,
  value,
  bgColour,
  onChange,
  isDark = true,
}: {
  title: string;
  options: Option[];
  value: string | null;
  bgColour: string;
  onChange: (key: string) => void;
  isDark?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);

  const selectedOption = options.find((option) => option.key === value);
  const filteredOptions = options.filter((option) =>
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPortalStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setPortalStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 1700,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <div
        className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
          isDark ? "text-white/40" : "text-black/40"
        }`}
      >
        {title}
      </div>

      <div
        className={`h-14 lg:h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border transition-colors ${
          isDark ? "border-white/40" : "border-[#0000004D]"
        }`}
        onClick={() => {
          if (!open) {
            setOpen(true);
            setSearchTerm("");
          }
        }}
      >
        {open ? (
          <input
            autoFocus
            type="text"
            className={`bg-transparent border-none outline-none w-full text-sm lg:text-base mr-2 ${
              isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"
            }`}
            placeholder={`Search ${title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        ) : selectedOption ? (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm lg:text-base ${
              isDark ? "bg-[#2A2A2A] text-white" : "bg-black/5 text-black"
            }`}
          >
            {selectedOption.value}
            <X
              size={18}
              className="cursor-pointer opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          </div>
        ) : (
          <span className={` text-sm lg:text-base ${isDark ? "text-white/40" : "text-black/40"}`}>
            Select {title}
          </span>
        )}

        {open ? (
          <ChevronUp
            className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
        )}
      </div>

      {open && portalStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className={`rounded-lg border max-h-[300px] overflow-y-auto no-scrollbar shadow-2xl ${
                isDark ? `${bgColour} border-white/10` : "bg-white border-gray-200"
              }`}
              style={portalStyle}
            >
              {filteredOptions.length === 0 ? (
                <div className={`px-6 py-4 text-sm text-center ${isDark ? "text-white/50" : "text-black/40"}`}>
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.key === value;
                  return (
                    <div
                      key={option.key}
                      onClick={() => {
                        onChange(option.key);
                        setOpen(false);
                        setSearchTerm("");
                      }}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? "bg-[#FFFCE8] text-black"
                          : isDark
                            ? "text-white/50 hover:bg-white/5"
                            : "text-black/60 hover:bg-black/5"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[#E8D1AB] bg-[#E8D1AB]"
                            : isDark
                              ? "border-white/50"
                              : "border-black/20"
                        }`}
                      >
                        {isSelected && <div className="w-1 h-1 rounded-full bg-black" />}
                      </div>
                      <span className="text-sm lg:text-base">{option.value}</span>
                    </div>
                  );
                })
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export const MissingFieldsModal = ({ 
  isOpen, 
  onClose, 
  isDark, 
  fields,
  shootId,
  onSaved,
  initialShootData
}: MissingFieldsModalProps) => {
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">("single_day");
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [sharedMultiStartTime, setSharedMultiStartTime] = useState("09:00");
  const [sharedMultiEndTime, setSharedMultiEndTime] = useState("17:00");
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey: string; endKey: string }>>({});

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const reelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const isDraggingReel = useRef(false);
  const didDragReel = useRef(false);
  const suppressChipClickUntil = useRef(0);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hh = hour.toString().padStart(2, "0");
        const mm = min.toString().padStart(2, "0");
        const label = `${hour % 12 || 12}:${mm} ${hour >= 12 ? "PM" : "AM"}`;
        options.push({ key: `${hh}:${mm}`, value: label });
      }
    }
    return options;
  }, []);

  const getStartTimeKey = () => (startDateTime ? format(new Date(startDateTime), "HH:mm") : "");
  const getEndTimeKey = () => (endDateTime ? format(new Date(endDateTime), "HH:mm") : "");
  const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Calcutta";

  const updateDateTime = (baseDate: Date | null, timeKey: string) => {
    if (!baseDate) return "";
    const [hours, minutes] = timeKey.split(":").map(Number);
    return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString();
  };

  const getCoordinates = () => ({
    latitude:
      locationDetails?.coordinates?.lat ??
      locationDetails?.lat ??
      locationDetails?.center?.[1] ??
      null,
    longitude:
      locationDetails?.coordinates?.lng ??
      locationDetails?.lng ??
      locationDetails?.center?.[0] ??
      null,
  });

  const handleStartTimeChange = (val: string) => {
    if (selectedShootDate) setStartDateTime(updateDateTime(selectedShootDate, val));
  };

  const handleEndTimeChange = (val: string) => {
    if (selectedShootDate) setEndDateTime(updateDateTime(selectedShootDate, val));
  };

  const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

  const updateMultiDayTime = (date: Date, field: "startKey" | "endKey", value: string) => {
    const key = getDateKey(date);
    setMultiDayTimes((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { startKey: "09:00", endKey: "17:00" }),
        [field]: value,
      },
    }));
  };

  const toggleDateSelection = (date: Date) => {
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    if (isSelected) {
      setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
    } else {
      setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const handleReelWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!reelRef.current) return;
    event.preventDefault();
    reelRef.current.scrollLeft += event.deltaY;
  };

  const handleReelPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!reelRef.current) return;
    isDraggingReel.current = true;
    didDragReel.current = false;
    dragStartX.current = event.clientX;
    dragStartY.current = event.clientY;
    dragStartScrollLeft.current = reelRef.current.scrollLeft;
  };

  const handleReelPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!reelRef.current || !isDraggingReel.current) return;
    const dx = event.clientX - dragStartX.current;
    const dy = event.clientY - dragStartY.current;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      didDragReel.current = true;
    }
    if (didDragReel.current) {
      reelRef.current.scrollLeft = dragStartScrollLeft.current - dx;
    }
  };

  const handleReelPointerUp = () => {
    isDraggingReel.current = false;
    if (didDragReel.current) {
      suppressChipClickUntil.current = Date.now() + 150;
    }
    setTimeout(() => {
      didDragReel.current = false;
    }, 0);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedShootDate(date);
    if (!date) {
      setStartDateTime("");
      setEndDateTime("");
      return;
    }
    const currentStart = getStartTimeKey();
    const currentEnd = getEndTimeKey();
    if (currentStart) setStartDateTime(updateDateTime(date, currentStart));
    if (currentEnd) setEndDateTime(updateDateTime(date, currentEnd));
  };

  const missingFieldLabels = useMemo(() => {
    const labels = fields
      .map((field) => {
        const normalized = field.toLowerCase();
        if (normalized === "location" || normalized === "event_location") return "Location";
        if (normalized === "date" || normalized === "event_date") return "Date";
        return field
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      })
      .filter(Boolean);

    return Array.from(new Set(labels));
  }, [fields]);

  useEffect(() => {
    setLocation("");
    setLocationDetails(null);
    setBookingType("single_day");
    setSelectedShootDate(null);
    setStartDateTime("");
    setEndDateTime("");
    setSelectedDates([]);
    setSameTimingsMulti(true);
    setSharedMultiStartTime("09:00");
    setSharedMultiEndTime("17:00");
    setMultiDayTimes({});
    setSaveError("");
    setIsSaving(false);
    setCurrentCalendarMonth(new Date());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const defaults = buildDefaultsFromShoot(initialShootData ?? null, getBrowserTimeZone());
    setLocation(defaults.location);
    setLocationDetails(defaults.locationDetails);
    setBookingType(defaults.bookingType);
    setSelectedShootDate(defaults.selectedShootDate);
    setStartDateTime(defaults.startDateTime);
    setEndDateTime(defaults.endDateTime);
    setSelectedDates(defaults.selectedDates);
    setSameTimingsMulti(defaults.sameTimingsMulti);
    setSharedMultiStartTime(defaults.sharedMultiStartTime);
    setSharedMultiEndTime(defaults.sharedMultiEndTime);
    setMultiDayTimes(defaults.multiDayTimes);
  }, [isOpen, initialShootData]);

  const validateBeforeSave = () => {
    const normalizedShootId = String(shootId || "").replace(/^#/, "").trim();
    const hasLocationValue = Boolean(location.trim());
    const hasSingleDayDateValue =
      Boolean(selectedShootDate) && Boolean(getStartTimeKey()) && Boolean(getEndTimeKey());
    const hasMultiDayDateValue =
      selectedDates.length > 0 &&
      (
        sameTimingsMulti
          ? Boolean(sharedMultiStartTime && sharedMultiEndTime)
          : selectedDates.every((date) => {
              const key = getDateKey(date);
              const timePair = multiDayTimes[key];
              return Boolean(timePair?.startKey && timePair?.endKey);
            })
      );
    const hasDateValue = bookingType === "single_day" ? hasSingleDayDateValue : hasMultiDayDateValue;

    if (!normalizedShootId) {
      setSaveError("Missing shoot id. Please reopen the modal from a valid shoot.");
      return false;
    }

    if (!hasLocationValue && !hasDateValue) {
      setSaveError("Please complete at least one missing field before saving.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setSaveError("");

    if (!validateBeforeSave()) {
      return;
    }

    const { latitude, longitude } = getCoordinates();
    const timeZone = getBrowserTimeZone();
    const shootLocation = location.trim();
    const normalizedShootId = String(shootId || "").replace(/^#/, "").trim();
    const hasLocationValue = Boolean(shootLocation);
    const hasSingleDayDateValue =
      Boolean(selectedShootDate) && Boolean(getStartTimeKey()) && Boolean(getEndTimeKey());
    const hasMultiDayDateValue =
      selectedDates.length > 0 &&
      (
        sameTimingsMulti
          ? Boolean(sharedMultiStartTime && sharedMultiEndTime)
          : selectedDates.every((date) => {
              const key = getDateKey(date);
              const timePair = multiDayTimes[key];
              return Boolean(timePair?.startKey && timePair?.endKey);
            })
      );
    const hasDateValue = bookingType === "single_day" ? hasSingleDayDateValue : hasMultiDayDateValue;
    const resolvedDate =
      bookingType === "single_day" && hasSingleDayDateValue
        ? selectedShootDate
        : selectedDates.slice().sort((a, b) => a.getTime() - b.getTime())[0] || null;

    const payload: Record<string, unknown> = {
      booking_type: bookingType,
      time_zone: timeZone,
    };

    if (hasLocationValue) {
      payload.location = shootLocation;
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    if (hasDateValue) {
      if (bookingType === "single_day" && selectedShootDate) {
        payload.start_date = format(selectedShootDate, "yyyy-MM-dd");
        payload.start_time = `${getStartTimeKey()}:00`;
        payload.end_time = `${getEndTimeKey()}:00`;
      }

      if (bookingType === "multi_day") {
        payload.booking_days = selectedDates
          .slice()
          .sort((a, b) => a.getTime() - b.getTime())
          .map((date) => {
            const key = getDateKey(date);
            const startKey = sameTimingsMulti
              ? sharedMultiStartTime
              : (multiDayTimes[key]?.startKey || "09:00");
            const endKey = sameTimingsMulti
              ? sharedMultiEndTime
              : (multiDayTimes[key]?.endKey || "17:00");

            return {
              date: format(date, "yyyy-MM-dd"),
              start_time: `${startKey}:00`,
              end_time: `${endKey}:00`,
            };
          });
      }
    }

    setIsSaving(true);
    try {
      const response = await adminApi.updateShootDateLocation(normalizedShootId, payload);

      if (response?.success === false || response?.error) {
        throw new Error(response?.error || response?.message || "Failed to save shoot details");
      }

      onSaved?.({
        shootId: normalizedShootId,
        ...(hasLocationValue ? { location: shootLocation } : {}),
        bookingType,
        ...(hasDateValue && resolvedDate
          ? {
              dateLabel: format(resolvedDate, "MMM dd, yyyy"),
            rawDate: resolvedDate.getTime(),
          }
          : {}),
        ...(bookingType === "single_day" && hasDateValue
          ? {
              startTime: getStartTimeKey(),
              endTime: getEndTimeKey(),
            }
          : {}),
        ...(bookingType === "multi_day" && hasDateValue
          ? {
              bookingDays: selectedDates
                .slice()
                .sort((a, b) => a.getTime() - b.getTime())
                .map((date) => {
                  const key = getDateKey(date);
                  const startKey = sameTimingsMulti
                    ? sharedMultiStartTime
                    : (multiDayTimes[key]?.startKey || "09:00");
                  const endKey = sameTimingsMulti
                    ? sharedMultiEndTime
                    : (multiDayTimes[key]?.endKey || "17:00");

                  return {
                    date: format(date, "yyyy-MM-dd"),
                    start_time: `${startKey}:00`,
                    end_time: `${endKey}:00`,
                  };
                }),
            }
          : {}),
        remainingMissingFields: normalizedFields.filter((field) => {
          if (field === "location") return !hasLocationValue;
          if (field === "date") return !hasDateValue;
          return true;
        }),
      });
      toast.success("Shoot details saved successfully");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save shoot details";
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const reelDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 21 }, (_, index) => addDays(today, index));
  }, []);

  const calendarDays = useMemo(() => {
    const today = startOfDay(new Date());
    const start = startOfWeek(startOfMonth(currentCalendarMonth));
    const end = endOfWeek(endOfMonth(currentCalendarMonth));
    return eachDayOfInterval({ start, end }).filter((date) => date >= today);
  }, [currentCalendarMonth]);

  const handlePrevMonth = () => {
    setCurrentCalendarMonth((current) => {
      const previousMonth = addDays(startOfMonth(current), -1);
      const todayMonthStart = startOfMonth(new Date());
      return startOfMonth(previousMonth).getTime() < todayMonthStart.getTime()
        ? todayMonthStart
        : previousMonth;
    });
  };

  const normalizedFields = useMemo(
    () =>
      Array.from(
        new Set(
          fields
            .map((field) => String(field || "").toLowerCase())
            .map((field) => {
              if (field === "event_location") return "location";
              if (field === "event_date") return "date";
              return field;
            })
        )
      ),
    [fields]
  );
  const needsLocation = normalizedFields.includes("location");
  const needsDate = normalizedFields.includes("date");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;
  const hasMissingFields = fields.length > 0;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`relative w-full max-w-4xl max-h-[94vh] min-h-0 flex flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border shadow-2xl ${isDark ? "bg-[#171717] border-white/10 text-white" : "bg-white border-[#E5E7EB] text-black"}`}>
        {isSaving ? (
          <div className={`absolute inset-0 z-20 flex items-center justify-center rounded-[28px] ${isDark ? "bg-black/40" : "bg-white/60"}`}>
            <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl ${isDark ? "border-white/10 bg-[#111111]" : "border-black/10 bg-white"}`}>
              <Loader2 size={18} className="animate-spin text-[#E8D1AB]" />
              <span className="text-sm font-semibold">Saving changes...</span>
            </div>
          </div>
        ) : null}
        <button 
          onClick={onClose}
          className={`absolute right-4 top-4 p-2 rounded-full transition-all z-10 ${isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"} ${isSaving ? "pointer-events-none opacity-40" : ""}`}
        >
          <X size={20} />
        </button>

        <div className="shrink-0 px-5 pt-5 pb-0 lg:px-6 lg:pt-6">
          <div className="pr-8 lg:pr-10">
            <h2 className={`text-xl lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              Complete Shoot Details
            </h2>
            <p className={`mt-2 text-sm lg:text-base ${isDark ? "text-white/55" : "text-black/55"}`}>
              Provide the following missing information to continue.
            </p>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 lg:p-5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-black/5 bg-[#F9FAFB]"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Missing Fields
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingFieldLabels.length > 0 ? (
                    missingFieldLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 rounded-full bg-[#E8D1AB] px-3 py-1 text-xs font-bold text-black"
                      >
                        <AlertCircle size={12} />
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                      <CheckCircle2 size={12} />
                      No fields missing
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 lg:px-6 lg:pb-6 overflow-visible">
          <div className="space-y-8 pb-6">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 size={64} className="text-green-500 mb-4 opacity-80" />
                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                  No Details Missing
                </h3>
                <p className={`mt-2 ${isDark ? "text-white/55" : "text-black/55"}`}>
                  All required information for this shoot is already available.
                </p>
              </div>
            ) : (
              fields.map((field, i) => {
                if (field.toLowerCase() === 'location' && needsLocation) {
                  return (
                    <div key={i} className={`border-t pt-6 ${isDark ? "border-white/10" : "border-black/5"}`}>
                      <h3 className={`mb-4 text-lg lg:text-xl font-bold ${isDark ? "text-white/90" : "text-black/80"}`}>
                        Shoot Location
                      </h3>
                      <LocationPicker
                        value={location}
                        onChange={(addr, details) => {
                          setLocation(addr);
                          setLocationDetails(details || null);
                        }}
                        placeholder="Search for a location using Mapbox..."
                        colors={isDark ? mapColors : undefined}
                      />
                    </div>
                  );
                }
                
                if (field.toLowerCase() === 'date' && needsDate) {
                  return (
                    <div key={i} className={`border-t pt-6 ${isDark ? "border-white/10" : "border-black/5"}`}>
                      {/* Booking Type Selection */}
                      <div className="mb-8">
                        <h3 className={`mb-4 text-lg lg:text-xl font-bold ${isDark ? "text-white/90" : "text-black/80"}`}>
                          Select Booking Type
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setBookingType("single_day")}
                            className={`flex h-[72px] min-w-[180px] lg:w-[250px] items-center justify-between rounded-2xl border px-5 transition-all ${bookingType === "single_day" ? "border-transparent bg-[#E8D1AB] text-black shadow-lg" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
                          >
                            <span className="text-base lg:text-lg font-bold">Single Day</span>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${bookingType === "single_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
                              {bookingType === "single_day" && <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingType("multi_day")}
                            className={`flex h-[72px] min-w-[180px] lg:w-[250px] items-center justify-between rounded-2xl border px-5 transition-all ${bookingType === "multi_day" ? "border-transparent bg-[#E8D1AB] text-black shadow-lg" : isDark ? "border-white/10 bg-[#101010] text-[#A9A9A9] hover:border-white/20" : "border-[#0000004D] bg-transparent text-[#2C2C2C] hover:border-[#000000]/50"}`}
                          >
                            <span className="text-base lg:text-lg font-bold">Multiple Days</span>
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${bookingType === "multi_day" ? "border-transparent bg-black" : isDark ? "border-white/20" : "border-[#0000004D]"}`}>
                              {bookingType === "multi_day" && <div className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Date & Time Section */}
                      <div className="mb-8">
                        {bookingType === "single_day" ? (
                          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className={`mb-4 text-lg lg:text-xl font-bold ${isDark ? "text-white/90" : "text-black/80"}`}>
                              Shoot Date & Time
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <DatePicker
                                label="Select Date"
                                value={selectedShootDate}
                                onChange={handleDateChange}
                                minDate={new Date()}
                                sx={{ height: "72px", borderRadius: "16px" }}
                                isDark={isDark}
                                disablePortal={false}
                              />
                              <ModalDropdownSelect
                                title="Start Time"
                                options={timeOptions}
                                value={getStartTimeKey()}
                                onChange={handleStartTimeChange}
                                bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                isDark={isDark}
                              />
                              <ModalDropdownSelect
                                title="End Time"
                                options={timeOptions.filter((opt) => opt.key > getStartTimeKey())}
                                value={getEndTimeKey()}
                                onChange={handleEndTimeChange}
                                bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                isDark={isDark}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-7 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="relative">
                              <div className="flex items-center justify-between mb-5">
                                <h3 className={`text-lg lg:text-xl font-bold ${isDark ? "text-white/90" : "text-black/80"}`}>
                                  Select Dates
                                </h3>
                              <button
                                  type="button"
                                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="group flex items-center gap-2 transition-all p-2 pr-3 rounded-xl hover:bg-white/5"
                                >
                                  <span className={`font-bold text-base lg:text-lg ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"}`}>
                                    {format(currentCalendarMonth, "MMMM yyyy")}
                                  </span>
                                  <Calendar size={20} className={isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"} />
                                </button>
                              </div>

                              <div
                                ref={reelRef}
                                onWheel={handleReelWheel}
                                onPointerDown={handleReelPointerDown}
                                onPointerMove={handleReelPointerMove}
                                onPointerUp={handleReelPointerUp}
                                onPointerLeave={() => {
                                  isDraggingReel.current = false;
                                }}
                                className="flex gap-3 overflow-x-auto pb-4 no-scrollbar select-none cursor-grab active:cursor-grabbing"
                              >
                                {reelDays.map((date) => {
                                  const isSelected = selectedDates.some((d) => isSameDay(d, date));
                                  return (
                                      <button
                                      key={date.toISOString()}
                                      type="button"
                                      onClick={() => toggleDateSelection(date)}
                                      className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full border transition-all lg:h-[100px] lg:w-[100px] ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB] text-black shadow-[0_0_20px_rgba(232,209,171,0.3)]" : isDark ? "border-white/10 bg-transparent text-white/40 hover:border-white/30" : "border-[#0000004D] bg-white text-[#2C2C2C] hover:border-black/50 shadow-sm"}`}
                                    >
                                      <span className="text-lg font-black lg:text-3xl">{format(date, "d")}</span>
                                      <span className="text-[10px] font-bold uppercase lg:text-xs opacity-60">{format(date, "EEE")}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <AnimatePresence>
                                {isCalendarOpen && (
                                  <motion.div 
                                    ref={calendarRef}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute right-0 top-14 z-50 w-[320px] rounded-[24px] border p-5 shadow-2xl ${isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}
                                  >
                                    <div className="flex justify-between items-center mb-4">
                                      <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                        <ChevronLeft size={20} />
                                      </button>
                                      <span className="font-bold text-base">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                                      <button onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                        <ChevronRight size={20} />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase opacity-40 mb-3">
                                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                      {calendarDays.map((date) => {
                                        const isSelected = selectedDates.some(d => isSameDay(d, date));
                                        return (
                                          <button
                                            key={date.toISOString()}
                                            onClick={() => toggleDateSelection(date)}
                                            className={`h-9 w-9 flex items-center justify-center rounded-xl text-sm transition-all ${isSelected ? "bg-[#E8D1AB] text-black font-black" : isDark ? "hover:bg-white/5 text-white/80" : "hover:bg-black/5 text-black/80"} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-10" : ""}`}
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

                            <div className="space-y-5 pt-2">
                              <div className="flex items-center gap-3">
                                <button 
                                  type="button"
                                  onClick={() => setSameTimingsMulti(!sameTimingsMulti)}
                                  className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${sameTimingsMulti ? "bg-[#E8D1AB] border-[#E8D1AB]" : "border-white/20"}`}
                                >
                                  {sameTimingsMulti && <Check size={16} className="text-black" />}
                                </button>
                                <span className={`text-base lg:text-lg font-bold ${isDark ? "text-white/80" : "text-black/80"}`}>Same timing for all days</span>
                              </div>

                              {sameTimingsMulti ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                                  <ModalDropdownSelect
                                    title="Start Time"
                                    options={timeOptions}
                                    value={sharedMultiStartTime}
                                    onChange={setSharedMultiStartTime}
                                    bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                    isDark={isDark}
                                  />
                                  <ModalDropdownSelect
                                    title="End Time"
                                    options={timeOptions.filter(opt => opt.key > sharedMultiStartTime)}
                                    value={sharedMultiEndTime}
                                    onChange={setSharedMultiEndTime}
                                    bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                    isDark={isDark}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-3 no-scrollbar">
                                  {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date) => {
                                    const key = getDateKey(date);
                                    return (
                                      <div key={key} className={`flex items-center justify-between gap-4 p-3 rounded-2xl border ${isDark ? "bg-white/5 border-white/10" : "bg-[#F4F5F7] border-black/5"}`}>
                                        <div className="shrink-0 min-w-[120px]">
                                          <p className="font-bold">{format(date, "MMM dd")}</p>
                                          <p className="text-xs opacity-50 font-medium">{format(date, "EEEE")}</p>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                          <ModalDropdownSelect
                                            options={timeOptions}
                                            value={multiDayTimes[key]?.startKey || ""}
                                            onChange={(v) => updateMultiDayTime(date, "startKey", v)}
                                            bgColour={isDark ? "bg-[#101010]" : "bg-white"}
                                            isDark={isDark}
                                          />
                                          <ModalDropdownSelect
                                            options={timeOptions.filter(opt => opt.key > (multiDayTimes[key]?.startKey || ""))}
                                            value={multiDayTimes[key]?.endKey || ""}
                                            onChange={(v) => updateMultiDayTime(date, "endKey", v)}
                                            bgColour={isDark ? "bg-[#101010]" : "bg-white"}
                                            isDark={isDark}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        </div>

        <div className={`shrink-0 border-t px-5 py-4 lg:px-6 lg:py-4 ${isDark ? "border-white/10" : "border-black/5"}`}>
          {saveError ? (
            <div className={`mb-3 rounded-2xl border px-4 py-3 text-sm font-medium ${isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
              {saveError}
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`px-6 py-3.5 rounded-2xl font-bold transition-all ${isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5"} ${isSaving ? "cursor-not-allowed opacity-50" : ""}`}
            >
              Cancel
            </button>
            <button
              onClick={hasMissingFields ? handleSave : onClose}
              disabled={isSaving}
              className={`px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all min-w-[180px] ${
                isDark
                  ? "bg-white text-black hover:bg-white/90 shadow-[0_8px_30px_rgb(255,255,255,0.2)]"
                  : "bg-black text-white hover:bg-black/90 shadow-xl"
              } ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {hasMissingFields
                ? isSaving
                  ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </span>
                  )
                  : "Save Changes"
                : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
