"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { BookingDataV3 } from "./types";
import { Info, ChevronDown, Calendar, Check, ChevronRight, ChevronLeft, X, ChevronUp, Video, Camera, Scissors } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { parseDate } from "@/src/components/landing/lib/utils";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, set, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { getFormattedDateString } from "@/lib/utils";
import { getPhotoEditSummary, getTotalDurationHours, PHOTO_EDIT_ADDON_SET_SIZE } from "./utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudioCard from "./components/StudioCard";
import DatePicker from "@/components/ui/Datepicker";
import { Button } from "@/src/components/landing/ui/button";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { QuantityControl } from "../QuantityControl";

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
  onNext: () => void;
  onBack: () => void;
}

const TEAM_ROLES = [
  { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> }, // Changed from 275 to 250
  { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> }, // Changed from 275 to 250
];


// dummy data until integration
const VIDEO_EDIT = [
  {
    "key": "social_reel_15_30",
    "value": "Social Media Reel (15 sec-30 sec)"
  },
  {
    "key": "social_reel_30_90",
    "value": "Social Media Reel (30 sec-90 sec)"
  },
  {
    "key": "music_video_2_3",
    "value": "Edited Music Video (2-3 min)"
  },
  {
    "key": "music_video_vfx_2_3",
    "value": "Edited Music Video with VFX (2-3 min)"
  }
]

const PHOTO_EDIT = [
  {
    "key": "edited_photos",
    "value": "Edited Photos",
    "note": "25 edited photos per hour"
  }
]

export const V3StudioChooseCreators: React.FC<Props> = ({
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
  const [extraTeam, setExtraTeam] = useState<Record<string, number>>(data.extraRoleSelections || {});

  const [photoEditNote, setPhotoEditNote] = useState<string>('25 edited photos per hour'); // Update later
  const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>(VIDEO_EDIT); // Update later
  const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>(PHOTO_EDIT); // Update later
  const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>(null);

  // Ref Varibales
  const studiosRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const crewCountRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const videoEditDropdownRef = useRef<HTMLDivElement>(null);
  const photoEditDropdownRef = useRef<HTMLDivElement>(null);

  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const isDraggingReel = useRef(false);

  const handleNext = async () => {
    // if (!validate()) return;
    onNext();
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref && ref.current) {
        const navOffset = 100;

        // Calculate absolute position relative to the entire document
        const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const availableRolesToAdd = TEAM_ROLES.filter(role => {
    // if (data.contentType.includes(role?.id)) return true;
    if (["videographer", "photographer"].includes(role?.id)) return true;

    return false;
  });

  const includedRoles = data.contentType.map((type) => {
    if (type === "editing") {
      return {
        id: "editing",
        label: "Editing",
        icon: <Scissors size={28} />,
        count: 1,
      };
    }

    const role = TEAM_ROLES.find((r) => r.id === type);
    return role ? { ...role, count: 1 } : null;
  }).filter(Boolean);

  const handleExtraTeamChange = (id: string, delta: number) => {
    const nextExtra = { ...extraTeam };
    const current = nextExtra[id] || 0;
    const next = Math.max(0, current + delta);
    nextExtra[id] = next;
    setExtraTeam(nextExtra);

    // Also save this as string description to data so it's not lost
    // Ideally we should use a proper structure, but string array is what we have in types for now
    const summary = Object.entries(nextExtra)
      .filter(([_, count]) => count > 0)
      .map(([roleId, count]) => `${TEAM_ROLES.find(r => r.id === roleId)?.label || roleId} x${count}`);

    // Calculate total crew count (base + extra)
    const baseCount = includedRoles.length;
    const extraCount = Object.values(nextExtra).reduce((a, b) => a + b, 0);

    updateData({
      extraRoleSelections: nextExtra,
      teamIncluded: summary,
      crewCount: baseCount + extraCount
    });
  };


  const handleVideoEditToggle = () => {
    setOpenEditPanel((prev) => (prev === "video" ? null : "video"));
  };

  const handlePhotoEditToggle = () => {
    setOpenEditPanel((prev) => (prev === "photo" ? null : "photo"));
  };

  const buildEditCounts = (keys: string[]) =>
    keys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const getEditSummaryItems = (
    counts: Record<string, number>,
    options: { key: string; value: string }[]
  ) =>
    Object.entries(counts).map(([key, count]) => ({
      key,
      count,
      label: options.find((option) => option.key === key)?.value || key,
    }));
  const videoEditCounts = useMemo(
    () => buildEditCounts(data.videoEditTypes),
    [data.videoEditTypes]
  );

  const photoEditCounts = useMemo(
    () => buildEditCounts(data.photoEditTypes),
    [data.photoEditTypes]
  );

  const durationHours = React.useMemo(
    () => getTotalDurationHours(data.bookingType, data.startDate, data.endDate, data.bookingDays),
    [data.bookingType, data.startDate, data.endDate, data.bookingDays]
  );

  const photoEditSetCount = photoEditCounts.edited_photos || 0;
  const photoEditSummary = useMemo(
    () =>
      getPhotoEditSummary({
        shootType: data.shootType,
        durationHours,
        selectedAddOnSets: photoEditSetCount,
      }),
    [data.shootType, durationHours, photoEditSetCount]
  );

  const totalVideoEditsSelected = data.videoEditTypes.length;
  const totalPhotoEditsSelected = data.photoEditTypes.length;
  const videoEditSummaryItems = useMemo(
    () => getEditSummaryItems(videoEditCounts, editTypeOptions),
    [videoEditCounts, editTypeOptions]
  );
  const photoEditSummaryItems = useMemo(
    () => getEditSummaryItems(photoEditCounts, photoEditTypeOptions),
    [photoEditCounts, photoEditTypeOptions]
  );
  const isEditingOnly = data.contentType.length === 1 && data.contentType.includes("editing");
  const expectedDeliveryDate = useMemo(
    () => (data.expectedDeliveryDate ? parseDate(data.expectedDeliveryDate) : null),
    [data.expectedDeliveryDate]
  );
  const receiveSummaryText = [
    (data.contentType.includes("photographer") || isEditingOnly)
      ? `${photoEditSummary.totalCount} Photos`
      : null,
    totalVideoEditsSelected > 0 ? `${totalVideoEditsSelected} Videos` : null,
  ].filter(Boolean).join(" + ");

  const isVideoEditOpen = openEditPanel === "video";
  const isPhotoEditOpen = openEditPanel === "photo";


  const updateEditQuantity = (type: "video" | "photo", key: string, nextQty: number) => {
    const base = type === "video" ? data.videoEditTypes : data.photoEditTypes;
    const cleaned = base.filter((k) => k !== key);
    const next = nextQty > 0 ? [...cleaned, ...Array.from({ length: nextQty }, () => key)] : cleaned;
    if (type === "video") {
      updateData({ videoEditTypes: next });
    } else {
      updateData({ photoEditTypes: next });
    }
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
  const filteredStartTimeOptions = useMemo(() => {
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

  const filteredEndTimeOptions = useMemo(() => {
    // If no start date/time is selected, show all
    if (!data.startDate) return timeOptions;

    const startTimeKey = getStartTimeKey();

    // Only show times that are AFTER the selected start time
    return timeOptions.filter((opt) => opt.key > startTimeKey);
  }, [data.startDate, timeOptions]);

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

  // 1. Function to toggle the role via the checkbox
  const toggleRole = (roleId: string) => {
    const isCurrentlySelected = (extraTeam[roleId] || 0) > 0;

    if (isCurrentlySelected) {
      // If already selected, remove it (set to 0)
      handleExtraTeamChange(roleId, -(extraTeam[roleId] || 0));
    } else {
      // If not selected, add 1
      handleExtraTeamChange(roleId, 1);
    }
  };

  // 2. Helper to check if a role is active
  const isRoleSelected = (roleId: string) => (extraTeam[roleId] || 0) > 0;

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
          Choose Creators
        </h2>
        <p className="text-white/60">Let us know if you need a photographer or videographer for your studio.</p>
      </div>

      {/* Select professionals */}
      <div ref={bookingRef} className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
        <h3 className={`text-lg lg:text-xl font-medium mb-3 lg:mb-6 transition-colors`}>Select professionals for your location.</h3>

        <div className="bg-[#171717] rounded-[20px] p-3 lg:p-6 border border-white/5 animate-in slide-in-from-top-4 mt-4 md:mt-6">
          <div className="flex flex-col gap-4">
            {availableRolesToAdd.length > 0 ? (
              availableRolesToAdd.map((role) => {
                const selected = isRoleSelected(role.id);
                return (
                <div key={role.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    {/* Custom Checkbox */}
                    <button
                      onClick={() => toggleRole(role.id)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-200 ${selected
                          ? "bg-[#E8D1AB] border-[#E8D1AB]"
                          : "bg-transparent border-white/20 hover:border-white/40"
                        }`}
                    >
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <div className="lg:text-lg font-light text-white">{role.label}</div>
                      <div className="text-lg lg:text-xl text-[#E8D1AB] font-medium">${role.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <QuantityControl
                    value={extraTeam[role.id] || 0}
                    onIncrease={() => handleExtraTeamChange(role.id, 1)}
                    onDecrease={() => handleExtraTeamChange(role.id, -1)}
                  />
                </div>
              )})
            ) : (
              <p className="text-white/40 italic">No eligible roles to add based on your selection.</p>
            )}
          </div>
        </div>
      </div>

      {/* Update Booking DateTime */}
      <div ref={bookingRef} className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
        <h3 className={`text-lg lg:text-xl font-medium mb-3 lg:mb-6 transition-colors`}>Do you want to update your booking day and time?</h3>

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

      {/* Edits Needed */}
      <div ref={editsRef} className="pt-6 lg:pt-15 border-t border-white/10">
        {!data.contentType.includes("editing") && (
          <>
            <h3 className={`text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("editError") ? "text-red-400" : "text-white/90"
              }`}>
              Edits Needed?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  updateData({ editsNeeded: true });
                  scrollToRef(navigationRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${data.editsNeeded ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                    }`}
                >
                  {data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setOpenEditPanel(null);
                  updateData({
                    editsNeeded: false,
                    videoEditTypes: [],
                    photoEditTypes: [],
                  });
                  scrollToRef(navigationRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!data.editsNeeded ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                    }`}
                >
                  {!data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
            </div>
          </>
        )}

        {/* Edit Dropdowns — show when editsNeeded OR editing only */}
        {/* {(data.editsNeeded || isEditingOnly) && ( */}
        <div className={`animate-in slide-in-from-top-4 duration-300 ${!isEditingOnly ? "mt-4 lg:mt-8" : ""}`}>
          <h4 className={` ${errors.includes("videoEditError") || errors.includes("photoEditError") ? "text-red-400" : "text-white"} font-medium mb-4 flex items-center gap-2 lg:text-xl`}>
            <Info size={24} className={`${errors.includes("videoEditError") || errors.includes("photoEditError") ? "text-red-400" : "text-white"}`} />
            Editing includes
          </h4>
          <p className="text-white/60 text-sm mb-11">
            Professional editing includes color grading, sound mixing, and
            basic revisions.
          </p>

          <div className="grid grid-cols-1 items-start md:grid-cols-2 md:items-start gap-6">
            {/* {(data.contentType.includes("videographer") || isEditingOnly) && editTypeOptions.length > 0 && ( */}
            <div ref={videoEditDropdownRef} className="self-start rounded-[24px] border border-white/10 bg-[#171717] overflow-hidden">
              <button
                type="button"
                className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                onClick={handleVideoEditToggle}
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  <div className="shrink-0 text-base lg:text-lg font-medium text-white">Video Edits</div>
                  {videoEditSummaryItems.length > 0 && (
                    <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                      {videoEditSummaryItems.map((item) => (
                        <span
                          key={item.key}
                          className="inline-flex max-w-full items-center gap-1 rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs lg:text-sm text-white"
                        >
                          <span className="truncate max-w-[180px]">{item.label}</span>
                          <span className="shrink-0 text-white/50">x{item.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isVideoEditOpen ? (
                  <ChevronUp className="text-white flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-white flex-shrink-0" />
                )}
              </button>

              {isVideoEditOpen && (
                <div className="border-t border-white/10 px-5 py-3">
                  {editTypeOptions.map((option) => {
                    const count = videoEditCounts[option.key] || 0;
                    return (
                      <div
                        key={option.key}
                        className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0"
                      >
                        <span className="text-sm lg:text-base text-white">{option.value}</span>
                        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                          <QuantityControl
                            value={count}
                            onDecrease={() => updateEditQuantity("video", option.key, Math.max(0, count - 1))}
                            onIncrease={() => updateEditQuantity("video", option.key, count + 1)}
                            className="h-[52px] min-w-[110px] rounded-[16px] px-5"
                            buttonClassName="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5"
                            valueClassName="min-w-[30px] text-[18px] font-semibold tabular-nums tracking-[0.12em]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* )} */}

            {/* {(data.contentType.includes("photographer") || isEditingOnly) && photoEditTypeOptions.length > 0 && ( */}
            <div ref={photoEditDropdownRef} className="self-start rounded-[24px] border border-white/10 bg-[#171717] overflow-hidden">
              <button
                type="button"
                className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                onClick={handlePhotoEditToggle}
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  <div className="shrink-0 text-base lg:text-lg font-medium text-white">Photo Edits</div>
                  {photoEditSummaryItems.length > 0 && (
                    <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                      {photoEditSummaryItems.map((item) => (
                        <span
                          key={item.key}
                          className="inline-flex max-w-full items-center gap-1 rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs lg:text-sm text-white"
                        >
                          <span className="truncate max-w-[180px]">{item.label}</span>
                          <span className="shrink-0 text-white/50">x{item.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isPhotoEditOpen ? (
                  <ChevronUp className="text-white flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-white flex-shrink-0" />
                )}
              </button>

              {isPhotoEditOpen && (
                <div className="border-t border-white/10 px-5 py-3">
                  {photoEditTypeOptions.map((option) => {
                    const count = photoEditCounts[option.key] || 0;
                    return (
                      <div
                        key={option.key}
                        className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0"
                      >
                        <div>
                          <div className="text-sm lg:text-base text-white">{option.value}</div>
                          <div className="text-xs text-white/40 mt-1">
                            +{PHOTO_EDIT_ADDON_SET_SIZE} Photos Per Set
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                          <QuantityControl
                            value={count}
                            onDecrease={() => updateEditQuantity("photo", option.key, Math.max(0, count - 1))}
                            onIncrease={() => updateEditQuantity("photo", option.key, count + 1)}
                            className="h-[52px] min-w-[110px] rounded-[16px] px-5"
                            buttonClassName="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5"
                            valueClassName="min-w-[30px] text-[18px] font-semibold tabular-nums tracking-[0.12em]"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap gap-3 pt-4">
                    {!isEditingOnly && (
                      <div className="rounded-xl bg-[#211F1C] px-4 py-3 text-sm text-[#E8D1AB]">
                        Includes {photoEditSummary.includedCount} free photo edits
                      </div>
                    )}
                    {!isEditingOnly && (
                      <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#171717]">
                        {durationHours} Hour Duration
                      </div>
                    )}
                    <div className="rounded-xl bg-[#211F1C] px-4 py-3 text-sm text-[#E8D1AB]">
                      + {photoEditSummary.extraCount} Added Extra
                    </div>
                  </div>

                  {!isEditingOnly && photoEditNote && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]">
                      <Info size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{photoEditNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* )} */}
          </div>

          {receiveSummaryText && (
            <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-[#E8D1AB]">
                <Image
                  src="/images/misc/booking-sparkle.png"
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
              </div>
              <p className="text-sm lg:text-base font-semibold">
                You&apos;ll Receive {receiveSummaryText}
              </p>
            </div>
          )}
        </div>
        {/* )} */}
      </div>

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