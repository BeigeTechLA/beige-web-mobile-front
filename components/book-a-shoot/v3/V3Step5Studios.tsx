"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/src/components/landing/ui/button";
import { BookingDataV3 } from "./types";
import { Camera, MapPin, MoveUpRight, Search, ChevronDown, ChevronUp, X, Star, Calendar, Check } from "lucide-react";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { format, isToday, addHours, eachDayOfInterval, endOfMonth, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { StudioDetailsDrawer } from "./StudioDetailsDrawer";
import {
  StudioCatalogItem,
  SelectedStudio,
  HOURLY_STUDIO_LIST,
  buildHourlyStudioSelection,
  normalizeSelectedStudios,
  removeSelectedStudio,
  upsertSelectedStudio,
} from "./studioData";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  onBrowseCreators?: () => void;
  onReviewBooking?: () => void;
}

const DEFAULT_DISPLAY_ADDRESS = "Los Angeles, California, USA";
const STUDIO_BOOKING_FOR_OPTIONS = [
  { key: "production", value: "Production" },
  { key: "audio", value: "Audio" },
  { key: "events", value: "Events" },
];

const parseValidDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value?: string) => {
  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "d MMMM, yyyy") : "";
};

const formatDisplayTime = (value?: string) => {
  if (!value) return "";
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const parsed = new Date();
      parsed.setHours(hours, minutes, 0, 0);
      return format(parsed, "h:mm a").toUpperCase();
    }
  }

  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "h:mm a").toUpperCase() : value;
};

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const getCoords = async (address: string) => {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`);
    const json = await res.json();
    if (json.features?.[0]) {
      const [lng, lat] = json.features[0].center;
      return { lat, lng };
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
};

const HourlyStudioCard = ({
  studio,
  isSelected,
  onToggle,
  onShowDetails,
  currentSelection,
  draftSelection,
  onConfirmHourlyDetails,
}: {
  studio: StudioCatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  onShowDetails: () => void;
  currentSelection?: SelectedStudio;
  draftSelection?: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string };
  onConfirmHourlyDetails: (details: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string }) => void;
}) => {
  const defaultPricingKey = currentSelection?.pricingCategory || draftSelection?.pricingKey || studio.pricingOptions?.[0]?.key || "";
  const [showPickers, setShowPickers] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    currentSelection?.selectedDate
      ? new Date(currentSelection.selectedDate)
      : draftSelection?.selectedDate
        ? new Date(draftSelection.selectedDate)
        : null,
  );
  const [startTime, setStartTime] = useState(currentSelection?.startTime || draftSelection?.startTime || "");
  const [endTime, setEndTime] = useState(currentSelection?.endTime || draftSelection?.endTime || "");
  const [pricingKey, setPricingKey] = useState(defaultPricingKey);
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const selectedPricingOption =
    studio.pricingOptions?.find((option) => option.key === pricingKey) ||
    studio.pricingOptions?.[0];

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

  const filteredStartTimeOptions = useMemo(() => {
    if (!selectedDate) return timeOptions;

    if (isToday(selectedDate)) {
      const cutoffTime = addHours(new Date(), 2);
      const cutoffMinutes = cutoffTime.getHours() * 60 + cutoffTime.getMinutes();

      return timeOptions.filter((opt) => timeToMinutes(opt.key) >= cutoffMinutes);
    }

    return timeOptions;
  }, [selectedDate, timeOptions]);

  useEffect(() => {
    if (startTime && selectedDate && isToday(selectedDate)) {
      const cutoffTime = addHours(new Date(), 2);
      const cutoffMinutes = cutoffTime.getHours() * 60 + cutoffTime.getMinutes();

      if (timeToMinutes(startTime) < cutoffMinutes) {
        setStartTime("");
      }
    }
  }, [selectedDate, startTime]);

  const endTimeOptions = useMemo(() => {
    return timeOptions.filter((opt) => {
      if (!startTime) return true;
      return timeToMinutes(opt.key) >= timeToMinutes(startTime) + 120;
    });
  }, [timeOptions, startTime]);

  useEffect(() => {
    if (startTime && endTime) {
      if (timeToMinutes(endTime) < timeToMinutes(startTime) + 120) {
        const targetMinutes = timeToMinutes(startTime) + 120;
        const newEndTimeOpt = timeOptions.find((o) => timeToMinutes(o.key) >= targetMinutes);
        if (newEndTimeOpt) setEndTime(newEndTimeOpt.key);
      }
    }
  }, [startTime, endTime, timeOptions]);

  const selectedDurationHours = startTime && endTime
    ? Math.max(0, Math.ceil((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60))
    : 0;
  const billableHours = selectedPricingOption
    ? Math.max(selectedDurationHours, selectedPricingOption.minimumHours)
    : selectedDurationHours;
  const cleaningFee = selectedPricingOption?.cleaningFee || 0;
  const estimateTotal = selectedPricingOption
    ? selectedPricingOption.hourlyRate * billableHours + cleaningFee
    : 0;
  const metaLabel = [studio.beds ? `${studio.beds} Bed` : null, studio.baths ? `${studio.baths} Bath` : null, studio.poolType].filter(Boolean).join(" / ");

  const handleConfirmSelection = () => {
    if (!selectedDate || !startTime || !endTime || !pricingKey) {
      toast.error("Please select package, date, start time and end time.");
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    if (selectedPricingOption && timeToMinutes(endTime) - timeToMinutes(startTime) < selectedPricingOption.minimumHours * 60) {
      toast.error(`Minimum ${selectedPricingOption.label} booking is ${selectedPricingOption.minimumHours} hours.`);
      return;
    }

    onConfirmHourlyDetails({
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
      pricingKey,
    });
    setShowPickers(false);
    toast.success("Studio time selected. You can now add this studio.");
  };

  const handleAddClick = () => {
    onToggle();
  };

  return (
    <>
      <div className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-[#111111] transition-all duration-300 ${isSelected ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]" : "border-white/10 hover:border-white/20"}`}>
        <button type="button" className="relative h-[230px] w-full overflow-hidden" onClick={onShowDetails}>
          <Image
            src={studio.image}
            alt={studio.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {studio.priceLabel}
          </div>
          {studio.rating && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Star size={12} className="fill-[#E8D1AB] text-[#E8D1AB]" />
              {studio.rating}{studio.reviews ? ` (${studio.reviews})` : ""}
            </div>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="min-h-[112px]">
            <h3 className="text-[17px] font-bold leading-snug text-white">{studio.name}</h3>
            {metaLabel && <p className="mt-1 text-xs text-white/45">{metaLabel}</p>}
            <div className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-white/45">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{DEFAULT_DISPLAY_ADDRESS}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(studio.bestFor || []).slice(0, 3).map((item) => (
              <span key={item} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60">{item}</span>
            ))}
          </div>

          {(currentSelection?.selectedDate && currentSelection?.startTime && currentSelection?.endTime) && (
            <div className="rounded-xl border border-[#E8D1AB33] bg-[#E8D1AB14] px-3 py-3 text-xs text-[#E8D1AB]">
              <div className="font-semibold">{currentSelection.pricingLabel || "Studio booking"}</div>
              <div>{formatDisplayDate(currentSelection.selectedDate)} | {formatDisplayTime(currentSelection.startTime)} - {formatDisplayTime(currentSelection.endTime)}</div>
              <div className="mt-1 text-white/70">${(currentSelection.totalPrice || 0).toLocaleString()} total</div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-[1fr_48px] gap-2 border-t border-white/5 pt-4">
            <Button
              onClick={handleAddClick}
              className={`h-11 rounded-xl text-sm font-bold ${
                isSelected
                  ? "bg-[#FFB6BD] text-[#D7192D] hover:bg-[#ffa6af]"
                  : "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
              }`}
            >
              {isSelected ? "× Remove" : "Add this Studio"}
            </Button>
            <Button
              variant="outline"
              onClick={onShowDetails}
              className="h-11 w-12 rounded-xl border-white/10 bg-white/5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <MoveUpRight size={18} />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowPickers(true)}
            className="text-left text-xs font-medium text-white/45 underline underline-offset-4 hover:text-[#E8D1AB]"
          >
            Choose date & time
          </button>
        </div>
      </div>

      {showPickers && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/80 backdrop-blur-sm px-4 pt-28 pb-10 overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 rounded-[32px] p-6 lg:p-8 max-w-4xl w-full relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl my-auto">
            <button
              onClick={() => setShowPickers(false)}
              className="absolute top-5 right-5 lg:top-7 lg:right-7 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8 tracking-tight">Select Date & Time</h3>

            {studio.pricingOptions && studio.pricingOptions.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                {studio.pricingOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPricingKey(option.key)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${pricingKey === option.key
                      ? "border-[#E8D1AB] bg-[#E8D1AB14]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                  >
                    <div className="text-sm font-bold text-white">{option.label}</div>
                    <div className="mt-1 text-lg font-bold text-[#E8D1AB]">${option.hourlyRate.toLocaleString()}/hr</div>
                    <div className="mt-1 text-xs text-white/50">
                      {option.minimumHours} hour minimum{option.cleaningFee ? ` + $${option.cleaningFee.toLocaleString()} cleaning` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="w-full flex flex-col md:flex-row gap-6 lg:gap-8">
              <div className="flex-1 w-full bg-[#1A1A1A] rounded-[24px] p-5 border border-white/10 shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <DatePicker
                    label="EVENT DATE"
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    shouldHighlightCurrentDay={true}
                    sx={{ height: { xs: "56px", lg: "82px" }, borderRadius: "16px" }}
                    colours={{
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
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col gap-5 justify-center">
                <DropdownSelect
                  title="Start Time"
                  options={filteredStartTimeOptions}
                  value={startTime}
                  onChange={setStartTime}
                  bgColour="bg-[#1A1A1A]"
                />
                <DropdownSelect
                  title="End Time"
                  options={endTimeOptions}
                  value={endTime}
                  onChange={setEndTime}
                  bgColour="bg-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              {selectedPricingOption && (
                <div className="mr-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <span className="text-white">Estimated total:</span>{" "}
                  <span className="font-bold text-[#E8D1AB]">${estimateTotal.toLocaleString()}</span>
                  <span className="ml-2 text-white/40">({billableHours || selectedPricingOption.minimumHours} billable hrs)</span>
                </div>
              )}
              <Button
                onClick={handleConfirmSelection}
                className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black px-10 h-12 rounded-xl font-bold text-[15px]"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const V3Step5Studios: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  onBrowseCreators,
  onReviewBooking,
}) => {
  const selectedStudios = useMemo(
    () => normalizeSelectedStudios({
      selectedStudios: data.selectedStudios,
      selectedStudioIds: data.selectedStudioIds,
    }),
    [data.selectedStudios, data.selectedStudioIds],
  );

  const selectedStudioIds = useMemo(() => selectedStudios.map((studio) => studio.studioId), [selectedStudios]);
  const selectedStudioSet = useMemo(() => new Set(selectedStudioIds), [selectedStudioIds]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"Price (Low to High)" | "Price (High to Low)" | "Name">("Name");
  const [selectedDetailsStudio, setSelectedDetailsStudio] = useState<StudioCatalogItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [updateBookingTime, setUpdateBookingTime] = useState(true);
  const [showSingleDay, setShowSingleDay] = useState(true);
  const [showMultipleDays, setShowMultipleDays] = useState(false);
  const [showStudioAddedModal, setShowStudioAddedModal] = useState(false);
  const [studioBookingFor, setStudioBookingFor] = useState("production");
  const [studioCalendarMonth, setStudioCalendarMonth] = useState(new Date());
  const [sameStudioTimings, setSameStudioTimings] = useState(true);
  const [expandedStudioDate, setExpandedStudioDate] = useState<string | null>(null);

  const selectedStudioDates = useMemo(
    () =>
      (data.bookingDays || [])
        .map((day) => parseValidDate(day.date))
        .filter((date): date is Date => Boolean(date)),
    [data.bookingDays],
  );
  const studioDateReel = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(studioCalendarMonth);
    const start = isToday(monthStart) || today > monthStart ? today : monthStart;
    return eachDayOfInterval({ start, end: endOfMonth(studioCalendarMonth) });
  }, [studioCalendarMonth]);

  const toggleStudioBookingDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const existingDays = data.bookingDays || [];
    const exists = existingDays.some((day) => day.date === dateKey);
    const nextDays = exists
      ? existingDays.filter((day) => day.date !== dateKey)
      : [
          ...existingDays,
          { date: dateKey, startTime: "10:00", endTime: "18:00", durationHours: 8 },
        ].sort((a, b) => a.date.localeCompare(b.date));

    updateData({ bookingType: "multi_day", bookingDays: nextDays });
  };

  const studioTimeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
    const hour = Math.floor(index / 4);
    const minute = (index % 4) * 15;
    return {
      key: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      value: format(new Date(2026, 0, 1, hour, minute), "h:mm aa"),
    };
  });
  const studioStartTime = data.bookingDays?.[0]?.startTime || "10:00";
  const studioEndTime = data.bookingDays?.[0]?.endTime || "18:00";
  const isVideographyBrowseStudioFlow =
    data.browseStudios === true &&
    data.shootType !== "studio" &&
    (data.contentType.includes("videographer") || data.contentType.includes("cinematographer"));
  const selectedStudioScheduleStart = selectedStudios[0]?.selectedDate && selectedStudios[0]?.startTime
    ? parseValidDate(`${selectedStudios[0].selectedDate}T${selectedStudios[0].startTime}:00`)
    : null;
  const selectedStudioScheduleEnd = selectedStudios[0]?.selectedDate && selectedStudios[0]?.endTime
    ? parseValidDate(`${selectedStudios[0].selectedDate}T${selectedStudios[0].endTime}:00`)
    : null;
  const studioSingleDayStart = isVideographyBrowseStudioFlow
    ? selectedStudioScheduleStart || parseValidDate(data.startDate)
    : parseValidDate(data.startDate);
  const studioSingleDayEnd = isVideographyBrowseStudioFlow
    ? selectedStudioScheduleEnd || parseValidDate(data.endDate)
    : parseValidDate(data.endDate);
  const studioSingleDayStartKey = studioSingleDayStart ? format(studioSingleDayStart, "HH:mm") : "";
  const studioSingleDayEndKey = studioSingleDayEnd ? format(studioSingleDayEnd, "HH:mm") : "";
  const filteredStudioStartTimeOptions = useMemo(() => {
    if (!studioSingleDayStart) return studioTimeOptions;

    const now = new Date();
    const selectedIsToday =
      studioSingleDayStart.getDate() === now.getDate() &&
      studioSingleDayStart.getMonth() === now.getMonth() &&
      studioSingleDayStart.getFullYear() === now.getFullYear();

    if (!selectedIsToday) return studioTimeOptions;

    const minKey = format(new Date(now.getTime() + 4 * 60 * 60 * 1000), "HH:mm");
    return studioTimeOptions.filter((option) => option.key >= minKey);
  }, [studioSingleDayStart, studioTimeOptions]);
  const filteredStudioEndTimeOptions = useMemo(() => {
    if (!studioSingleDayStartKey) return studioTimeOptions;
    return studioTimeOptions.filter((option) => option.key > studioSingleDayStartKey);
  }, [studioSingleDayStartKey, studioTimeOptions]);
  const studioDurationHours = (() => {
    const [startHour, startMinute] = studioStartTime.split(":").map(Number);
    const [endHour, endMinute] = studioEndTime.split(":").map(Number);
    return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
  })();

  const updateAllStudioDayTimes = (
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const nextDays = (data.bookingDays || []).map((day) => ({
      ...day,
      [field]: value,
    }));
    updateData({ bookingType: "multi_day", bookingDays: nextDays });
  };

  const syncSelectedStudiosSingleDaySchedule = (start: Date, end: Date) => {
    if (!isVideographyBrowseStudioFlow || !selectedStudios.length) return {};

    const selectedDate = format(start, "yyyy-MM-dd");
    const startTime = format(start, "HH:mm");
    const endTime = format(end, "HH:mm");

    const nextStudios = selectedStudios.map((studio) => {
      if (studio.pricingMode !== "hourly") {
        return {
          ...studio,
          selectedDate,
          startTime,
          endTime,
        };
      }

      const durationHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      const billableHours = Math.max(Math.ceil(durationHours), studio.minimumHours || 1);

      return {
        ...studio,
        selectedDate,
        startTime,
        endTime,
        quantity: billableHours,
        totalPrice: (studio.unitPrice || 0) * billableHours + (studio.cleaningFee || 0),
      };
    });

    return {
      selectedStudios: nextStudios,
      selectedStudioIds: nextStudios.map((studio) => studio.studioId),
      bookingDays: nextStudios.map((studio) => ({
        date: studio.selectedDate,
        startTime: studio.startTime,
        endTime: studio.endTime,
        durationHours: studio.quantity || 0,
      })),
    };
  };

  const hourlyDraftSelectionsRef = useRef<Record<string, { selectedDate: string; startTime: string; endTime: string; pricingKey?: string }>>({});
  const [hourlyDraftSelections, setHourlyDraftSelections] = useState<Record<string, { selectedDate: string; startTime: string; endTime: string; pricingKey?: string }>>({});

  const filteredHourlyStudios = useMemo(() => {
    const sourceOrderMap = new Map(HOURLY_STUDIO_LIST.map((studio, index) => [studio.id, index]));
    return HOURLY_STUDIO_LIST
      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (sourceOrderMap.get(a.id) ?? 0) - (sourceOrderMap.get(b.id) ?? 0));
  }, [searchQuery]);

  const confirmHourlyDetails = async (
    studio: StudioCatalogItem,
    details: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string },
  ) => {
    const newDrafts = { ...hourlyDraftSelectionsRef.current, [studio.id]: details };
    hourlyDraftSelectionsRef.current = newDrafts;
    setHourlyDraftSelections(newDrafts);

    if (selectedStudioSet.has(studio.id)) {
      const updatedSelection = buildHourlyStudioSelection(studio, details);
      if (!updatedSelection) {
        toast.error("Failed to update studio selection");
        return;
      }
      const nextStudios = upsertSelectedStudio(selectedStudios, updatedSelection);
      await syncStudios(nextStudios);
    }
  };

  const toggleHourlyStudio = async (studio: StudioCatalogItem, showSuccessPopup = false) => {
    const existing = selectedStudios.find((item) => item.studioId === studio.id);

    if (existing) {
      const nextStudios = removeSelectedStudio(selectedStudios, studio.id);
      await syncStudios(nextStudios);
      return;
    }

    const fallbackStart = parseValidDate(data.startDate);
    const fallbackEnd = parseValidDate(data.endDate);
    const draft = hourlyDraftSelectionsRef.current[studio.id] || {
      selectedDate: format(fallbackStart || new Date(), "yyyy-MM-dd"),
      startTime: fallbackStart ? format(fallbackStart, "HH:mm") : "10:00",
      endTime: fallbackEnd ? format(fallbackEnd, "HH:mm") : "18:00",
      pricingKey: studio.pricingOptions?.[0]?.key,
    };

    const selection = buildHourlyStudioSelection(studio, draft);

    if (!selection) {
      toast.error("Failed to build studio selection. Check console.");
      return;
    }

    if (!selection.selectedDate || !selection.startTime || !selection.endTime) {
      toast.error("Selection is missing date/time. Check console.");
      return;
    }

    const nextStudios = upsertSelectedStudio(selectedStudios, selection);

    if (nextStudios.length === 0) {
      toast.error("Failed to add studio. Check console.");
      return;
    }

    await syncStudios(nextStudios);
    if (showSuccessPopup) {
      setSelectedDetailsStudio(null);
      setShowStudioAddedModal(true);
    }
  };

  const syncStudios = async (next: SelectedStudio[]) => {
    const shouldUseStudioAsShootLocation = data.shootType === "studio";

    if (!next || next.length === 0) {
      updateData({
        selectedStudios: [],
        selectedStudioIds: [],
        bookingDays: [],
        ...(shouldUseStudioAsShootLocation
          ? {
              startDate: "",
              endDate: "",
              location: "",
              locationDetails: null,
            }
          : {}),
      });
      return;
    }

    const primaryStudio = next[0];

    if (!primaryStudio.selectedDate || !primaryStudio.startTime || !primaryStudio.endTime) {
      console.error("❌ Missing required fields in primaryStudio!");
      toast.error("Studio selection incomplete. Check console.");
      return;
    }

    const coords = shouldUseStudioAsShootLocation && primaryStudio.location
      ? await getCoords(primaryStudio.location)
      : null;

    const studioStartDateTime = `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`;
    const studioEndDateTime = `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`;

    const localPayload = {
      selectedStudios: next,
      selectedStudioIds: next.map((studio) => studio.studioId),
      selectedStudioImage: primaryStudio.image || "",
      selectedStudioName: primaryStudio.name || "",
      startDate: studioStartDateTime,
      endDate: studioEndDateTime,
      ...(shouldUseStudioAsShootLocation
        ? {
            location: primaryStudio.location || "",
            locationDetails: coords ? {
              address: primaryStudio.location,
              lat: coords.lat,
              lng: coords.lng
            } : null,
          }
        : {}),
      bookingDays: next.map(studio => ({
        date: studio.selectedDate,
        startTime: studio.startTime,
        endTime: studio.endTime,
        durationHours: studio.quantity || 0,
      })),
    };

    updateData(localPayload);
  };

  const handleContinue = () => {
    if (selectedStudios.length === 0) {
      toast.error("Please select a studio and date/time to continue.");
      return;
    }

    onNext();
  };

  /*
    try {
      const primaryStudio = selectedStudios[0];
      const studioStartDateTime = `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`;
      const studioEndDateTime = `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`;

      const apiPayload = {
        booking_id: data.bookingId || null,
        guest_email: data.email || user?.email || "",
        user_id: user?.id,
        content_type: data.contentType.join(","),
        shoot_type: data.shootType,
        client_name: user?.name || data.clientName || "",
        start_date: primaryStudio.selectedDate,
        start_time: primaryStudio.startTime,
        end_time: primaryStudio.endTime,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        startDate: studioStartDateTime,
        endDate: studioEndDateTime,
        booking_type: "single_day",
        booking_days: selectedStudios.map(studio => ({
          date: studio.selectedDate,
          startTime: studio.startTime,
          endTime: studio.endTime,
          durationHours: studio.quantity || 0,
          studio_id: studio.studioId,
          studio_name: studio.name,
          pricing_key: studio.pricingCategory || studio.pricingKey,
          total_price: studio.totalPrice || 0,
        })),
        edits_needed: data.editsNeeded || false,
        video_edit_types: data.videoEditTypes || [],
        photo_edit_types: data.photoEditTypes || [],
        estimated_delivery_date: data.expectedDeliveryDate || null,
      };

      const response = await trackEarlyInterest(apiPayload).unwrap();

      if (response.data?.booking_id && !data.bookingId) {
        updateData({ bookingId: response.data.booking_id });
      }

      toast.success("Studio booking saved successfully!");
      onNext();

    } catch (error) {
      console.error("❌ Failed to save studio booking:", error);
      toast.error("Failed to save studio booking. Please try again.");
    }
  */

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
          Beige Content House
        </h2>
        <p className="text-white/60 mb-8 max-w-2xl mx-auto text-sm lg:text-lg">
          Discover studios that match your needs with complete details and availability.
        </p>
      </div>

      {data.browseStudios && (
        <div className="mb-12 border-y border-white/10 py-8">
          <h3 className="mb-5 text-base font-medium text-white lg:text-xl">
            What type of studio do you need?
          </h3>
          <DropdownSelect
            title="Booking For"
            options={STUDIO_BOOKING_FOR_OPTIONS}
            value={studioBookingFor}
            onChange={setStudioBookingFor}
            bgColour="bg-[#101010]"
          />
          <p className="mt-3 inline-flex rounded-[6px] bg-[#211F1C] px-3 py-2 text-[11px] text-[#E8D1AB]">
            Note : Studios are shown based on your selected category. Pricing,
            availability, and rules may vary.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 w-full mb-12">
        <div className="flex-1 flex items-center bg-[#151515] border border-white/5 rounded-xl px-5 py-3.5 focus-within:border-white/20 transition-all">
          <Search size={18} className="text-white/40 mr-3" />
          <input
            type="text"
            placeholder="Search Studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/40 text-[15px]"
          />
        </div>
        <div className="relative">
          <Button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="bg-[#151515] hover:bg-[#1f1f1f] border border-white/5 text-white/70 px-6 py-3.5 h-full rounded-xl flex items-center justify-center gap-2"
          >
            <span className="text-[14px]">Sort By: {sortBy}</span> <ChevronDown size={16} />
          </Button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#151515] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
              {(["Name", "Price (Low to High)", "Price (High to Low)"] as const).map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white text-sm transition-colors"
                  onClick={() => {
                    setSortBy(opt);
                    setIsSortOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 pl-1">
        <h3 className="text-white text-[15px] font-bold tracking-wide">
          {filteredHourlyStudios.length} Studios Available Based on Categories
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-14">
        {filteredHourlyStudios.length === 0 ? (
          <div className="col-span-full text-white/50 text-sm py-4 pl-1">No studios match your search.</div>
        ) : (
          filteredHourlyStudios.slice(0, visibleCount).map((studio) => (
            <HourlyStudioCard
              key={studio.id}
              studio={studio}
              isSelected={selectedStudioSet.has(studio.id)}
              currentSelection={selectedStudios.find((item) => item.studioId === studio.id)}
              draftSelection={hourlyDraftSelections[studio.id]}
              onToggle={() => toggleHourlyStudio(studio, false)}
              onConfirmHourlyDetails={(details) => confirmHourlyDetails(studio, details)}
              onShowDetails={() => setSelectedDetailsStudio(studio)}
            />
          ))
        )}
      </div>

      {filteredHourlyStudios.length > 0 && (
        <div className="flex justify-start border-b border-white/10 pb-10">
          <Button
            onClick={() => setVisibleCount((count) => count > 3 ? 3 : filteredHourlyStudios.length)}
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4 pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
          >
            <span className="lg:pr-4">{visibleCount > 3 ? "View Less" : "View More"}</span>
            <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 33 26" fill="none">
                <path d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z" fill="#E8D1AB" />
              </svg>
            </div>
          </Button>
        </div>
      )}

      <div className="space-y-8 pt-10">
        <div className="relative">
          <label className="absolute -top-2 left-4 z-10 bg-[#101010] px-2 text-xs text-white/45">
            No of Cast & Crew
          </label>
          <input
            value={data.castAndCrew || ""}
            onChange={(event) => updateData({ castAndCrew: event.target.value })}
            className="h-16 w-full rounded-[8px] border border-white/10 bg-[#101010] px-4 text-white outline-none focus:border-[#E8D1AB]"
          />
        </div>

        <div className="border-t border-white/10 pt-8">
          <h3 className="mb-5 text-sm font-medium text-white">
            Do you want to update your studio booking day and time?
          </h3>
          <div className="mb-5 flex gap-3">
            {[
              { label: "Yes", value: true },
              { label: "Keep it same", value: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setUpdateBookingTime(option.value)}
                className={`flex h-12 items-center gap-6 rounded-[8px] border px-5 text-xs ${
                  updateBookingTime === option.value
                    ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                    : "border-white/10 bg-[#101010] text-white/60"
                }`}
              >
                {option.label}
                <span className={`grid h-5 w-5 place-items-center rounded-full ${
                  updateBookingTime === option.value ? "bg-black" : "border border-white/30"
                }`}>
                  {updateBookingTime === option.value && <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />}
                </span>
              </button>
            ))}
          </div>

          {updateBookingTime && (
            <div className="overflow-visible rounded-[8px] bg-[#151515]">
              <button
                type="button"
                onClick={() => setShowSingleDay((open) => !open)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm text-white"
              >
                Single Day
                {showSingleDay ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSingleDay && (
                <div className="border-t border-white/5 bg-[#101010] p-5">
                  <p className="mb-4 text-xs text-white/50">Edit Date and Time</p>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                    <DatePicker
                      label="Select Date"
                      selectedDate={studioSingleDayStart}
                      onChange={(date) => {
                        if (!date) return;
                        const currentStart = studioSingleDayStart || parseValidDate(data.startDate) || new Date();
                        const currentEnd = studioSingleDayEnd || parseValidDate(data.endDate) || new Date();
                        const start = new Date(date);
                        start.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
                        const end = new Date(date);
                        end.setHours(currentEnd.getHours(), currentEnd.getMinutes(), 0, 0);
                        updateData({
                          ...(isVideographyBrowseStudioFlow
                            ? {}
                            : {
                                startDate: start.toISOString(),
                                endDate: end.toISOString(),
                              }),
                          ...syncSelectedStudiosSingleDaySchedule(start, end),
                        });
                      }}
                      minDate={new Date()}
                      sx={{ height: { xs: "56px", lg: "82px" }, borderRadius: "16px" }}
                    />
                    </div>
                    <div className="flex-1">
                    <DropdownSelect
                      title="Start Time"
                      options={filteredStudioStartTimeOptions}
                      value={studioSingleDayStartKey}
                      onChange={(value) => {
                        const date = studioSingleDayStart || parseValidDate(data.startDate) || new Date();
                        const [hours, minutes] = value.split(":").map(Number);
                        date.setHours(hours, minutes, 0, 0);
                        const end = studioSingleDayEnd || parseValidDate(data.endDate) || new Date(date);
                        updateData({
                          ...(isVideographyBrowseStudioFlow ? {} : { startDate: date.toISOString() }),
                          ...syncSelectedStudiosSingleDaySchedule(date, end),
                        });
                      }}
                      bgColour="bg-[#101010]"
                    />
                    </div>
                    <div className="flex-1">
                    <DropdownSelect
                      title="End Time"
                      options={filteredStudioEndTimeOptions}
                      value={studioSingleDayEndKey}
                      onChange={(value) => {
                        const date = studioSingleDayEnd || parseValidDate(data.endDate) || new Date();
                        const [hours, minutes] = value.split(":").map(Number);
                        date.setHours(hours, minutes, 0, 0);
                        const start = studioSingleDayStart || parseValidDate(data.startDate) || new Date(date);
                        updateData({
                          ...(isVideographyBrowseStudioFlow ? {} : { endDate: date.toISOString() }),
                          ...syncSelectedStudiosSingleDaySchedule(start, date),
                        });
                      }}
                      bgColour="bg-[#101010]"
                    />
                    </div>
                  </div>
                  {studioSingleDayStartKey && studioSingleDayEndKey && (
                    <div className="mt-4 inline-flex rounded-lg bg-[#211F1C] px-4 py-2">
                      <p className="text-[#E8D1AB] text-sm font-medium">
                        Duration : {Math.max(0, (timeToMinutes(studioSingleDayEndKey) - timeToMinutes(studioSingleDayStartKey)) / 60)} Hours
                      </p>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowMultipleDays((open) => !open)}
                className="flex w-full items-center justify-between border-t border-white/5 px-5 py-4 text-left text-sm text-white/70"
              >
                Multiple Days
                {showMultipleDays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showMultipleDays && (
                <div className="border-t border-white/5 bg-[#101010] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs text-white/50">Select Date</p>
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      {format(studioCalendarMonth, "MMMM yyyy")}
                      <Calendar size={17} />
                      <input
                        type="month"
                        value={format(studioCalendarMonth, "yyyy-MM")}
                        min={format(new Date(), "yyyy-MM")}
                        onChange={(event) => {
                          const [year, month] = event.target.value.split("-").map(Number);
                          if (year && month) setStudioCalendarMonth(new Date(year, month - 1, 1));
                        }}
                        className="absolute h-px w-px opacity-0"
                      />
                    </label>
                  </div>

                  <div className="flex cursor-grab gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {studioDateReel.map((date) => {
                      const selected = selectedStudioDates.some((item) => isSameDay(item, date));
                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => toggleStudioBookingDate(date)}
                          className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full border transition lg:h-[100px] lg:w-[100px] ${
                            selected
                              ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                              : "border-white/10 text-white/45 hover:border-white/30"
                          }`}
                        >
                          <span className="text-xl font-bold lg:text-2xl">{format(date, "d")}</span>
                          <span className="text-[10px] font-semibold uppercase lg:text-xs">{format(date, "EEE")}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-4 flex flex-wrap gap-3">
                    <span className="rounded-[8px] bg-[#211F1C] px-4 py-2 text-xs font-medium text-[#E8D1AB]">
                      Total Days: {selectedStudioDates.length}
                    </span>
                    <span className="rounded-[8px] bg-[#211F1C] px-4 py-2 text-xs font-medium text-[#E8D1AB]">
                      Selected Days: {selectedStudioDates.length
                        ? selectedStudioDates.map((date) => format(date, "dd MMM")).join(", ") +
                          `, ${format(selectedStudioDates[0], "yyyy")}`
                        : "None"}
                    </span>
                  </div>

                  {selectedStudioDates.length > 0 && (
                    <div className="mt-6 border-t border-white/10 pt-6">
                      <h4 className="mb-4 text-sm font-medium text-white">
                        Are timings same for all selected dates?
                      </h4>
                      <div className="mb-5 flex gap-3">
                        {[
                          { label: "Yes", value: true },
                          { label: "No", value: false },
                        ].map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setSameStudioTimings(option.value)}
                            className={`flex h-12 items-center gap-6 rounded-[12px] border px-5 text-sm ${
                              sameStudioTimings === option.value
                                ? "border-[#E8D1AB] bg-[#E8D1AB] text-black"
                                : "border-white/10 bg-[#101010] text-white/60"
                            }`}
                          >
                            {option.label}
                            <span className={`grid h-5 w-5 place-items-center rounded-full ${
                              sameStudioTimings === option.value
                                ? "bg-black"
                                : "border border-white/30"
                            }`}>
                              {sameStudioTimings === option.value && (
                                <span className="h-2 w-2 rounded-full bg-[#E8D1AB]" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>

                      {sameStudioTimings && (
                        <div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <DropdownSelect
                              title="Start Time"
                              options={studioTimeOptions}
                              value={studioStartTime}
                              onChange={(value) => updateAllStudioDayTimes("startTime", value)}
                              bgColour="bg-[#101010]"
                              selectedDisplay="plain"
                            />
                            <DropdownSelect
                              title="End Time"
                              options={studioTimeOptions}
                              value={studioEndTime}
                              onChange={(value) => updateAllStudioDayTimes("endTime", value)}
                              bgColour="bg-[#101010]"
                              selectedDisplay="plain"
                            />
                          </div>
                          <p className="mt-3 flex items-center gap-2 text-sm text-white/60">
                            <Check size={18} className="text-white" />
                            Applied to {selectedStudioDates.length} selected dates
                          </p>
                          <div className="mt-3 flex flex-col gap-2 rounded-[12px] border border-white/20 bg-[#171717] p-4 text-sm md:flex-row md:items-center md:justify-between">
                            <span className="font-medium text-white">
                              {selectedStudioDates.map((date) => format(date, "dd MMM")).join(" & ")}, {format(selectedStudioDates[0], "yyyy")}
                            </span>
                            <span className="text-white/60">
                              {format(new Date(2026, 0, 1, ...studioStartTime.split(":").map(Number) as [number, number]), "h:mm a")} - {format(new Date(2026, 0, 1, ...studioEndTime.split(":").map(Number) as [number, number]), "h:mm a")}
                            </span>
                            <span className="font-medium text-[#E8D1AB]">
                              {studioDurationHours} Hour / Day
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!sameStudioTimings && (
                  <div className="space-y-4">
                    {(data.bookingDays || []).map((day, index) => (
                      <div key={`${day.date}-${index}`} className="overflow-visible rounded-[12px] border border-white/10 bg-[#151515]">
                        <button
                          type="button"
                          onClick={() => setExpandedStudioDate(expandedStudioDate === day.date ? null : day.date)}
                          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-white"
                        >
                          {formatDisplayDate(day.date)}
                          <ChevronDown size={16} className={`transition-transform ${expandedStudioDate === day.date ? "rotate-180" : ""}`} />
                        </button>
                        {expandedStudioDate === day.date && (
                        <div className="border-t border-white/10 bg-[#101010] p-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DropdownSelect
                          title="Start Time"
                          options={studioTimeOptions}
                          value={day.startTime || "10:00"}
                          onChange={(value) => {
                            const days = [...(data.bookingDays || [])];
                            days[index] = { ...days[index], startTime: value };
                            updateData({ bookingType: "multi_day", bookingDays: days });
                          }}
                          bgColour="bg-[#101010]"
                          selectedDisplay="plain"
                        />
                        <DropdownSelect
                          title="End Time"
                          options={studioTimeOptions}
                          value={day.endTime || "18:00"}
                          onChange={(value) => {
                            const days = [...(data.bookingDays || [])];
                            days[index] = { ...days[index], endTime: value };
                            updateData({ bookingType: "multi_day", bookingDays: days });
                          }}
                          bgColour="bg-[#101010]"
                          selectedDisplay="plain"
                        />
                        </div>
                        <div className="mt-3 inline-flex rounded-[8px] bg-[#211F1C] px-4 py-2 text-xs font-medium text-[#E8D1AB]">
                          Duration: {(() => {
                            const [startHour, startMinute] = (day.startTime || "10:00").split(":").map(Number);
                            const [endHour, endMinute] = (day.endTime || "18:00").split(":").map(Number);
                            return Math.max(
                              0,
                              (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60,
                            );
                          })()} hours
                        </div>
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!data.browseStudios && (
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col gap-5 rounded-[8px] border border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#151515] text-[#E8D1AB]">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Need a Photographer or Videographer for your Studio?</h3>
                <p className="mt-1 text-xs text-white/45">Bring your shoot to life with top photographers/videographers at your studio.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                updateData({ addTeamMembers: true });
                onBrowseCreators?.();
              }}
              className={`h-12 rounded-[8px] px-8 text-sm font-medium ${
                data.addTeamMembers
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]"
              }`}
            >
              {data.addTeamMembers ? "Creators Selected" : "Browse Creators"}
            </Button>
          </div>
        </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
        <div className="flex gap-4">
          <Button onClick={onBack} className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]">
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
          > 
            Continue
          </Button>
        </div>
      </div>

      <StudioDetailsDrawer
        isOpen={!!selectedDetailsStudio}
        onClose={() => setSelectedDetailsStudio(null)}
        studio={
          selectedDetailsStudio
            ? { ...selectedDetailsStudio, location: DEFAULT_DISPLAY_ADDRESS }
            : null
        }
        onAddStudio={(studio) => {
          void toggleHourlyStudio(studio, true);
        }}
        isStudioAdded={
          selectedDetailsStudio
            ? selectedStudioSet.has(selectedDetailsStudio.id)
            : false
        }
      />

      {showStudioAddedModal && (
        <div className="fixed inset-0 z-[99999999] grid place-items-center bg-[#101010] px-4">
          <div className="flex min-h-[430px] w-full max-w-[720px] flex-col items-center justify-center text-center">
            <div className="relative mb-10">
              {[
                "-left-8 top-1 bg-[#CE5A4A]",
                "-left-10 top-8 bg-[#3B6CB7]",
                "-left-5 -top-3 bg-[#4A997D]",
                "left-5 -top-6 bg-[#325EA8]",
                "right-8 -top-2 bg-[#B68A2D]",
                "-right-7 top-5 bg-[#A93D38]",
                "right-2 -bottom-5 bg-[#267358]",
                "left-0 -bottom-6 bg-[#375DA6]",
              ].map((classes) => (
                <span key={classes} className={`absolute h-2 w-1 rotate-12 rounded-sm ${classes}`} />
              ))}
              <div className="grid h-28 w-28 place-items-center rounded-full bg-[#E8D1AB] text-black shadow-[0_0_0_8px_rgba(232,209,171,0.04)]">
              <svg width="62" height="62" viewBox="0 0 62 62" fill="none">
                <path d="M17 31.5L26.5 41L46 21.5" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-white lg:text-[28px]">
              Studio Added Successfully
            </h3>
            <Button
              onClick={() => {
                setShowStudioAddedModal(false);
                updateData({ addTeamMembers: false });
                if (data.browseStudios) {
                  onNext();
                  return;
                }
                onReviewBooking?.();
              }}
              className="mt-7 h-12 min-w-[250px] rounded-[8px] bg-[#E8D1AB] px-8 text-sm font-medium text-black hover:bg-[#dcb98a]"
            >
              {data.browseStudios
                ? "Continue to book your shoot"
                : "Review Booking Summary"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
