"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BookingDataV4 } from "./types";
import { ShootTypeCard } from "../v3/components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { ArrowLeft, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, ChevronUp, MapPinHouse, Check } from "lucide-react";
import {
  newshootTypes,
  videoShootTypes,
  photoShootTypes,
  hybridShootTypes,
  weddingEditTypes,
  musicEditTypes,
  commercialEditTypes,
  tvSeriesEditTypes,
  podcastEditTypes,
  shortFilmEditTypes,
  movieEditTypes,
  corporateEventEditTypes,
  privateEventEditTypes,
  socialContentEditTypes,
  weddingPhotoEditTypes,
  corporateEventPhotoEditTypes,
  privateEventPhotoEditTypes,
  musicPhotoEditTypes,
  commercialPhotoEditTypes,
  socialContentPhotoEditTypes,
  brandProductPhotoEditTypes,
  peopleTeamsPhotoEditTypes,
  behindScenesPhotoEditTypes,
} from "@/app/data/shootData";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { parseDate } from "@/src/components/landing/lib/utils";
import DatePicker from "@/components/ui/Datepicker";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, set, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { getPhotoEditSummary, getTotalDurationHours } from "../v3/utils";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
}

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

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;
const STUDIO_SHOOT_TYPE_KEY = "studio";
const STUDIO_MESSAGE = "Studio bookings collect date, time, and studio location on the next studio selection page.";

type ShootTypeOption = (typeof newshootTypes)[number];

export const V4Step2CustomizedDetails: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(data.bookingType || "single_day");
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>(null);

  const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
  const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
  const [photoEditNote, setPhotoEditNote] = useState<string>("");

  const reelRef = useRef<HTMLDivElement>(null);
  const selectedDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dateChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isDraggingReel = useRef(false);
  const didDragReel = useRef(false);
  const suppressChipClickUntil = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const shootTypeRef = useRef<HTMLDivElement>(null);
  const bookingTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const deliveryDateRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);

  const isEditingOnly = data.services?.length === 1 && data.services.includes("editing");
  const isStudioSelected = data.shootType === STUDIO_SHOOT_TYPE_KEY || (data.services?.includes("studio") && data.services.length === 1);
  const shouldBypassDateTime = !isEditingOnly && isStudioSelected;

  // Determine shoot types list
  const availableShootTypes = React.useMemo(() => {
    const hasPhoto = data.services?.includes("photography");
    const hasVideo = data.services?.includes("videography");
    if (hasPhoto && hasVideo) return hybridShootTypes;
    if (hasVideo) return videoShootTypes;
    if (hasPhoto) return photoShootTypes;
    return newshootTypes;
  }, [data.services]);

  const isAllVisible = visibleCount >= availableShootTypes.length;

  useEffect(() => {
    const start = data.startDate ? parseDate(data.startDate) : null;
    const end = !start && data.endDate ? parseDate(data.endDate) : null;
    setSelectedShootDate(start || end);
  }, [data.startDate, data.endDate]);

  // Sync edit options based on shootType
  useEffect(() => {
    switch (data.shootType) {
      case "commercial":
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(commercialPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for commercial shoot");
        break;
      case "wedding":
        setEditTypeOptions(weddingEditTypes);
        setPhotoEditTypeOptions(weddingPhotoEditTypes);
        setPhotoEditNote("50 edited photos included for wedding shoot");
        break;
      case "music_video":
        setEditTypeOptions(musicEditTypes);
        setPhotoEditTypeOptions(musicPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for music video shoot");
        break;
      case "podcast":
        setEditTypeOptions(podcastEditTypes);
        setPhotoEditTypeOptions(brandProductPhotoEditTypes);
        setPhotoEditNote("10 edited photos included for podcast shoot");
        break;
      case "corporate_events":
        setEditTypeOptions(corporateEventEditTypes);
        setPhotoEditTypeOptions(corporateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos included for corporate shoot");
        break;
      case "private_events":
        setEditTypeOptions(privateEventEditTypes);
        setPhotoEditTypeOptions(privateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos included for private event");
        break;
      case "social_content":
        setEditTypeOptions(socialContentEditTypes);
        setPhotoEditTypeOptions(socialContentPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for social shoot");
        break;
      case "brand_product":
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(brandProductPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for brand product shoot");
        break;
      case "people_teams":
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(peopleTeamsPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for portraits shoot");
        break;
      case "behind_the_scenes":
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(behindScenesPhotoEditTypes);
        setPhotoEditNote("15 edited photos included for BTS shoot");
        break;
      default:
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(commercialPhotoEditTypes);
        setPhotoEditNote("15 edited photos included");
        break;
    }
  }, [data.shootType]);

  // Generate 15-minute time intervals
  const timeOptions = React.useMemo(() => {
    const times: { key: string; value: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h24 = String(hour).padStart(2, "0");
        const m = String(min).padStart(2, "0");
        const period = hour >= 12 ? "PM" : "AM";
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        times.push({
          key: `${h24}:${m}`,
          value: `${String(h12).padStart(2, "0")}:${m} ${period}`,
        });
      }
    }
    return times;
  }, []);

  const getStartTimeKey = () => {
    if (!data.startDate) return "09:00";
    const d = parseDate(data.startDate);
    if (!d) return "09:00";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getEndTimeKey = () => {
    if (!data.endDate) return "12:00";
    const d = parseDate(data.endDate);
    if (!d) return "12:00";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedShootDate(date);
    if (!date) {
      updateData({ startDate: "", endDate: "" });
      return;
    }
    const currentStartKey = getStartTimeKey();
    const currentEndKey = getEndTimeKey();
    const [sh, sm] = currentStartKey.split(":").map(Number);
    const [eh, em] = currentEndKey.split(":").map(Number);

    const newStart = set(date, { hours: sh, minutes: sm, seconds: 0 });
    const newEnd = set(date, { hours: eh, minutes: em, seconds: 0 });

    updateData({
      startDate: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    const baseDate = selectedShootDate || new Date();
    const [sh, sm] = timeKey.split(":").map(Number);
    const newStart = set(baseDate, { hours: sh, minutes: sm, seconds: 0 });

    const currentEndKey = getEndTimeKey();
    const [eh, em] = currentEndKey.split(":").map(Number);
    let newEnd = set(baseDate, { hours: eh, minutes: em, seconds: 0 });
    if (newEnd <= newStart) {
      newEnd = set(baseDate, { hours: Math.min(23, sh + 2), minutes: sm, seconds: 0 });
    }

    updateData({
      startDate: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  };

  const handleEndTimeChange = (timeKey: string) => {
    const baseDate = selectedShootDate || new Date();
    const [eh, em] = timeKey.split(":").map(Number);
    const newEnd = set(baseDate, { hours: eh, minutes: em, seconds: 0 });

    const currentStartKey = getStartTimeKey();
    const [sh, sm] = currentStartKey.split(":").map(Number);
    const newStart = set(baseDate, { hours: sh, minutes: sm, seconds: 0 });

    updateData({
      startDate: format(newStart, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  };

  const handleViewToggle = () => {
    if (visibleCount >= availableShootTypes.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, availableShootTypes.length));
    }
  };

  const validateAndProceed = () => {
    const newErrors: string[] = [];
    if (!data.shootType) {
      newErrors.push("shootTypeError");
    }
    if (!isEditingOnly && !shouldBypassDateTime) {
      if (bookingType === "single_day" && (!data.startDate || !data.endDate)) {
        newErrors.push("timeError");
      }
    }
    if (isEditingOnly && !data.expectedDeliveryDate) {
      newErrors.push("deliveryDateError");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onNext();
  };

  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-6xl mx-auto px-4">
      {/* Top Bar: Back Button, Step Indicator & Progress */}
      <div className="w-full flex flex-col space-y-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A0A0A0] uppercase">
            STEP 02
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[45%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-2 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
          Customize your project
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          Select the shoot style, timing, and editing requirements for your production.
        </p>
      </div>

      <div className="w-full space-y-10">
        {/* Shoot Types */}
        <div ref={shootTypeRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg sm:text-xl font-medium ${errors.includes("shootTypeError") ? "text-red-400" : "text-white"}`}>
              Select Shoot Type
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableShootTypes.slice(0, visibleCount).map((type) => {
              const isSelected = data.shootType === type.key;
              return (
                <ShootTypeCard
                  key={type.key}
                  title={type.title}
                  details={type.details}
                  image={type.image}
                  stats={type.stats}
                  selected={isSelected}
                  onClick={() => {
                    updateData({ shootType: type.key });
                    if (errors.includes("shootTypeError")) {
                      setErrors(errors.filter((e) => e !== "shootTypeError"));
                    }
                  }}
                />
              );
            })}
          </div>

          {availableShootTypes.length > INITIAL_COUNT && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleViewToggle}
                className="bg-[#E5D5B8] text-black hover:bg-[#d9c7a6] h-9 rounded-lg text-sm font-medium px-5 cursor-pointer"
              >
                {isAllVisible ? "View Less" : "View More"}
              </Button>
            </div>
          )}
        </div>

        {/* Booking Type & Date / Time */}
        {!isEditingOnly && !shouldBypassDateTime && (
          <div ref={dateTimeRef} className="pt-8 border-t border-white/10 space-y-6">
            <div className="space-y-3">
              <h3 className={`text-lg sm:text-xl font-medium ${errors.includes("timeError") ? "text-red-400" : "text-white"}`}>
                Shoot Date & Time
              </h3>
              <p className="text-xs sm:text-sm text-white/50">
                Choose a single production day or multi-day shoot schedule.
              </p>
            </div>

            {/* Single Day vs Multi Day Selector */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setBookingType("single_day");
                  updateData({ bookingType: "single_day", bookingDays: [] });
                }}
                className={`py-3.5 px-6 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                  bookingType === "single_day"
                    ? "bg-[#E5D5B8] border-[#E5D5B8] text-black font-semibold"
                    : "bg-[#141414] border-white/10 hover:border-white/20 text-white/70"
                }`}
              >
                <span>Single Day</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    bookingType === "single_day" ? "bg-black text-[#E5D5B8]" : "border border-white/30"
                  }`}
                >
                  {bookingType === "single_day" && <div className="w-2 h-2 rounded-full bg-[#E5D5B8]" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingType("multi_day");
                  updateData({ bookingType: "multi_day" });
                }}
                className={`py-3.5 px-6 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                  bookingType === "multi_day"
                    ? "bg-[#E5D5B8] border-[#E5D5B8] text-black font-semibold"
                    : "bg-[#141414] border-white/10 hover:border-white/20 text-white/70"
                }`}
              >
                <span>Multiple Days</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    bookingType === "multi_day" ? "bg-black text-[#E5D5B8]" : "border border-white/30"
                  }`}
                >
                  {bookingType === "multi_day" && <div className="w-2 h-2 rounded-full bg-[#E5D5B8]" />}
                </div>
              </button>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="w-full">
                <DatePicker
                  label="Select Date"
                  value={selectedShootDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  colors={datePickerColours}
                  format="MM/dd/yyyy"
                  sx={{
                    height: { xs: "56px", md: "72px" },
                    borderRadius: "16px",
                  }}
                />
              </div>
              <div className="w-full">
                <DropdownSelect
                  title="Start Time"
                  options={timeOptions}
                  value={getStartTimeKey()}
                  onChange={handleStartTimeChange}
                  bgColour="bg-[#101010]"
                />
              </div>
              <div className="w-full">
                <DropdownSelect
                  title="End Time"
                  options={timeOptions}
                  value={getEndTimeKey()}
                  onChange={handleEndTimeChange}
                  bgColour="bg-[#101010]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Editing Turnaround / Delivery Date if Editing Only */}
        {isEditingOnly && (
          <div ref={deliveryDateRef} className="pt-8 border-t border-white/10 space-y-4">
            <h3 className={`text-lg sm:text-xl font-medium ${errors.includes("deliveryDateError") ? "text-red-400" : "text-white"}`}>
              Expected Delivery Date
            </h3>
            <div className="max-w-md">
              <DatePicker
                label="Select Date"
                value={data.expectedDeliveryDate ? parseDate(data.expectedDeliveryDate) : null}
                onChange={(date) => {
                  updateData({
                    expectedDeliveryDate: date ? format(date, "yyyy-MM-dd") : "",
                  });
                }}
                minDate={addDays(new Date(), 1)}
                colors={datePickerColours}
                format="MM/dd/yyyy"
                sx={{
                  height: { xs: "56px", md: "72px" },
                  borderRadius: "16px",
                }}
              />
            </div>
            <p className="text-xs text-[#E5D5B8] bg-[#211F1C] px-4 py-2.5 rounded-lg inline-block">
              Note: Minimum 24 Hours Required for Standard Editing Delivery
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full flex justify-between items-center pt-10 mt-6 border-t border-white/10">
        <button
          onClick={onBack}
          className="py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium text-sm transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={validateAndProceed}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
