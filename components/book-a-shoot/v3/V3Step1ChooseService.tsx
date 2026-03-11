"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookingDataV3 } from "./types";
import { ContentTypeCheckbox } from "./components/ContentTypeCheckbox";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { Video, Camera, Scissors, MonitorPlay, Check, Radio, Info, SquaresUnite, Calendar, ChevronDown, ChevronLeft, ChevronRight, X, ChevronUp } from "lucide-react";
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
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";
import { pushToDataLayer } from "@/lib/gtm";
import {getFormattedDateString} from "@/lib/utils";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

const USER_TYPE: Record<number, string> = {
  1: "Admin",
  2: "Creator",
  3: "Client",
  4: "Creative",
  5: "Sales Representative",
  6: "Production Manager"
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

export const V3Step1ChooseService: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [errors, setErrors] = useState<string[]>([])

  const [editTypeOptions, setEditTypeOptions] = useState<
    { key: string; value: string }[]
  >([]);

  const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<
    { key: string; value: string; note?: string }[]
  >([]);

  const [photoEditNote, setPhotoEditNote] = useState<string>("");

  const [availableShootTypes, setAvailableShootTypes] = useState(newshootTypes);

  const [timeOptions, setTimeOptions] = useState<
    { key: string; value: string }[]
  >([]);

  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(data.bookingType || "single_day");

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const isDraggingReel = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const isAllVisible = visibleCount >= availableShootTypes.length;

  const [trackEarlyInterest] = useTrackEarlyInterestMutation();

  const emailRef = useRef<HTMLDivElement>(null);
  const contentTypeRef = useRef<HTMLDivElement>(null);
  const shootTypeRef = useRef<HTMLDivElement>(null);
  const bookingTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [isVideoEditOpen, setIsVideoEditOpen] = useState(false);
  const [isPhotoEditOpen, setIsPhotoEditOpen] = useState(false);

  const buildEditCounts = (keys: string[]) =>
    keys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const videoEditCounts = React.useMemo(
    () => buildEditCounts(data.videoEditTypes),
    [data.videoEditTypes]
  );

  const photoEditCounts = React.useMemo(
    () => buildEditCounts(data.photoEditTypes),
    [data.photoEditTypes]
  );

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

  const getEditDisplayLabel = (
    key: string,
    options: { key: string; value: string }[]
  ) => {
    const match = options.find((o) => o.key === key);
    return match ? match.value : key;
  };

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user?.email && !data.email) {
      updateData({ email: user.email });
    }
  }, [isAuthenticated, user?.email, data.email, updateData]);

  useEffect(() => {
    const start = data.startDate ? parseDate(data.startDate) : null;
    const end = !start && data.endDate ? parseDate(data.endDate) : null;
    const next = start || end;
    setSelectedShootDate(next);
  }, [data.startDate, data.endDate]);

  const handleViewToggle = () => {
    if (visibleCount >= availableShootTypes.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, availableShootTypes.length)
      );
    }
  };

  // Determine available shoot types based on content type selection
  useEffect(() => {
    const isVideo = data.contentType.includes("videographer");
    const isPhoto = data.contentType.includes("photographer");

    if (isVideo && isPhoto) {
      setAvailableShootTypes(hybridShootTypes);
    } else if (isPhoto) {
      setAvailableShootTypes(photoShootTypes);
    } else if (isVideo) {
      setAvailableShootTypes(videoShootTypes);
    } else {
      setAvailableShootTypes([]);
    }
  }, [data.contentType]);

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
      user_id: isAuthenticated ? user?.id : "Unknown",
      user_type: isAuthenticated ? USER_TYPE[user?.user_type_id] : "Unknown",
      email: isAuthenticated ? user?.email : "Unknown",
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
    scrollToRef(editsRef);
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
    if (reelRef.current) {
      reelRef.current.scrollLeft = 0;
    }
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
    updateData({ bookingType });
  }, [bookingType, updateData]);

  useEffect(() => {
    if (bookingType !== "multi_day") {
      updateData({ bookingDays: [] });
      return;
    }

    if (!selectedDates.length) {
      updateData({ bookingDays: [] });
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

    updateData({ bookingDays: days });
  }, [
    bookingType,
    selectedDates,
    data.startDate,
    data.endDate,
    sameTimingsMulti,
    multiDayTimes,
    updateData
  ]);

  // const getStartTimeKey = () => {
  //   if (!data.startDate) return "";
  //   const date = parseDate(data.startDate);
  //   if (!date) return "";
  //   return format(date, "HH:mm");
  // };

  // const getEndTimeKey = () => {
  //   if (!data.endDate) return "";
  //   const date = parseDate(data.endDate);
  //   if (!date) return "";
  //   return format(date, "HH:mm");
  // };

  // Update edit type options based on shoot type
  useEffect(() => {
    // Reset options
    setEditTypeOptions([]);
    setPhotoEditTypeOptions([]);
    setPhotoEditNote("");

    // Common Video Options mapping
    switch (data.shootType) {
      case "wedding":
        setEditTypeOptions(weddingEditTypes);
        setPhotoEditTypeOptions(weddingPhotoEditTypes);
        setPhotoEditNote("50 edited photos per hour for weddings");
        break;
      case "music":
        setEditTypeOptions(musicEditTypes);
        setPhotoEditTypeOptions(musicPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "commercial":
        setEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(commercialPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "tv":
        setEditTypeOptions(tvSeriesEditTypes);
        break;
      case "podcast":
        setEditTypeOptions(podcastEditTypes);
        break;
      case "short_film":
        setEditTypeOptions(shortFilmEditTypes);
        break;
      case "movie":
        setEditTypeOptions(movieEditTypes);
        break;
      case "corporate":
        setEditTypeOptions(corporateEventEditTypes);
        setPhotoEditTypeOptions(corporateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "private":
        setEditTypeOptions(privateEventEditTypes);
        setPhotoEditTypeOptions(privateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "social_content":
        setEditTypeOptions(socialContentEditTypes);
        setPhotoEditTypeOptions(socialContentPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "brand_product":
        setPhotoEditTypeOptions(brandProductPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "people_teams":
        setPhotoEditTypeOptions(peopleTeamsPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "behind_scenes":
        setPhotoEditTypeOptions(behindScenesPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      default:
        setEditTypeOptions([]);
        setPhotoEditTypeOptions([]);
        setPhotoEditNote("");
    }
  }, [data.shootType]);

  // Clear errors when data changes
  useEffect(() => {
    setErrors((prev) => {
      const newErrors = [...prev];
      if (data.email && newErrors.includes("emailError")) return newErrors.filter(e => e !== "emailError");
      if (data.contentType.length > 0 && newErrors.includes("contentError")) return newErrors.filter(e => e !== "contentError");
      if (data.shootType && newErrors.includes("shootTypeError")) return newErrors.filter(e => e !== "shootTypeError");
      const hasMultiDayTimes = Array.isArray(data.bookingDays) && data.bookingDays.length > 0 && data.bookingDays.every(d => d.startTime && d.endTime);
      if (
        ((data.bookingType !== "multi_day" && data.startDate && data.endDate) ||
          (data.bookingType === "multi_day" && hasMultiDayTimes)) &&
        newErrors.includes("timeError")
      ) {
        return newErrors.filter(e => e !== "timeError");
      }
      if (data.videoEditTypes.length > 0 && newErrors.includes("videoEditError")) return newErrors.filter(e => e !== "videoEditError");
      if (data.photoEditTypes.length > 0 && newErrors.includes("photoEditError")) return newErrors.filter(e => e !== "photoEditError");
      return prev;
    });
  }, [data]);

  const toggleContentType = (
    type: "videographer" | "photographer" | "editing"
  ) => {
    const current = [...data.contentType];
    const isCurrentlySelected = current.includes(type);

    // Calculate the new content type array
    const nextContentType = isCurrentlySelected
      ? current.filter((t) => t !== type)
      : [...current, type];

    if (nextContentType.length === 0) {
      // Reset data object to initial state if no content types are selected
      updateData({
        contentType: [],
        shootType: "",
        startDate: "",
        endDate: "",
        editsNeeded: true,
        videoEditTypes: [],
        photoEditTypes: [],
      });
    } else {
      if (!nextContentType.includes("videographer")) {
        updateData({
          contentType: nextContentType,
          videoEditTypes: [],
        });
      } else if (!nextContentType.includes("photographer")) {
        updateData({
          contentType: nextContentType,
          photoEditTypes: [],
        });
      } else {
        updateData({ contentType: nextContentType });
      }
    }

    // Reset the view more toggle
    setVisibleCount(INITIAL_COUNT);

    if (nextContentType.length > 0) {
      scrollToRef(shootTypeRef);
    }
  };

  const validate = () => {
    if (!data.email) {
      toast.error("Please enter your email address");
      setErrors((prev) => [...prev, "emailError"]);

      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      setErrors((prev) => [...prev, "emailError"]);
      return false;
    }
    if (data.contentType.length === 0) {
      toast.error("Please select at least one content type");
      setErrors((prev) => [...prev, "contentError"]);
      return false;
    }
    if (!data.shootType) {
      toast.error("Please select a video/photo shoot type");
      setErrors((prev) => [...prev, "shootTypeError"]);

      return false;
    }
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
    } else {
      if (!data.bookingDays || data.bookingDays.length === 0) {
        toast.error("Please select at least one booking day");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
      const hasMissingTimes = data.bookingDays.some((d) => !d.startTime || !d.endTime);
      if (hasMissingTimes) {
        toast.error("Please select start and end time for all selected days");
        setErrors((prev) => [...prev, "timeError"]);
        return false;
      }
    }
    if (data.editsNeeded) {
      const needsVideoEdit = data.contentType.includes("videographer")
      // || data.contentType.includes("cinematographer");  Commented cinematographer as it is not being mentioned anywhere in UI
      const needsPhotoEdit = data.contentType.includes("photographer");

      if (needsVideoEdit && data.videoEditTypes.length === 0) {
        setErrors((prev) => [...prev, "videoEditError"]);
        toast.error("Please select at least one video edit type");
        return false;
      }

      if (needsPhotoEdit && data.photoEditTypes.length === 0) {
        setErrors((prev) => [...prev, "photoEditError"]);
        toast.error("Please select at least one photo edit type");
        return false;
      }

      if (
        !needsVideoEdit &&
        !needsPhotoEdit &&
        data.videoEditTypes.length === 0 &&
        data.photoEditTypes.length === 0
      ) {
        setErrors((prev) => [...prev, "editError"]);
        toast.error("Please select an edit type since you requested editing");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validate()) return;
    // try {
    //   const res = await trackEarlyInterest({
    //     guest_email: data.email,
    //     user_id: user?.id,
    //     content_type: data.contentType.join(","),
    //     shoot_type: data.shootType,
    //     client_name: user?.name,
    //   }).unwrap();

    //   updateData({
    //     bookingId: res.data.booking_id,
    //   });

    onNext();
    // } catch (err) {
    //   toast.error("Failed to start booking. Please try again.");
    // }
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

  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
          Create Your Project
        </h2>
      </div>

      {/* Email Field */}
      <div ref={emailRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${errors.includes("emailError") ? "text-red-400" : "text-white/90"}`}>
          Email Address <span className={`${errors.includes("emailError") ? "text-red-400" : "[#E8D1AB]"}`}>*</span>
        </h3>
        <input
          type="email"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(data.email)) {
                scrollToRef(contentTypeRef);
                (e.target as HTMLInputElement).blur(); // Remove focus
              }
            }
          }}
          onBlur={() => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(data.email)) scrollToRef(contentTypeRef);
          }}
          placeholder="your@email.com"
          className="w-full h-14 lg:h-[82px] bg-[#101010] border border-white/10 rounded-2xl px-4 lg:px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E8D1AB] transition-colors"
        />
        {isAuthenticated && (
          <p className="mt-2 text-sm text-white/60">
            Your email has been auto-filled. You can change it if needed.
          </p>
        )}
      </div>

      {/* Content Type */}
      <div ref={contentTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
        {/* <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3> */}
        <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("contentError") ? "text-red-400" : "text-white/90"
          }`}>
          Content Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentTypeCheckbox
            label="Select All"
            icon={<SquaresUnite size={20} />}
            checked={
              // data.contentType.length === 3 &&
              data.contentType.length === 2 && //As cinematography is not to be included in the length count at present
              !data.contentType.includes("editing")
            }
            onChange={(checked) => {
              if (checked)
                updateData({
                  contentType: [
                    "videographer",
                    "photographer",
                    // "cinematographer", This is not being mentioned in UI. Hence commented out
                  ],
                });
              else updateData({ contentType: [] });
            }}
          />
          <ContentTypeCheckbox
            label="Videography"
            icon={<Video size={20} />}
            checked={data.contentType.includes("videographer")}
            onChange={() => toggleContentType("videographer")}
          />
          <ContentTypeCheckbox
            label="Photography"
            icon={<Camera size={20} />}
            checked={data.contentType.includes("photographer")}
            onChange={() => toggleContentType("photographer")}
          />
          <ContentTypeCheckbox
            label="AI Editing"
            subLabel="Coming Soon"
            icon={<Scissors size={20} />}
            checked={false}
            onChange={() => { }}
            disabled={true}
          />
          <ContentTypeCheckbox
            label="Livestream"
            subLabel="Coming Soon"
            icon={<Radio size={20} />}
            checked={false}
            onChange={() => { }}
            disabled={true}
          />
        </div>
      </div>

      {data.contentType.length > 0 && (
        <>
          {/* Shoot Type */}
          <div ref={shootTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
            <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("shootTypeError") ? "text-red-400" : "text-white/90"
              }`}>
              {data.contentType.includes("videographer") &&
                //  ||data.contentType.includes("cinematographer")) && : Commented cinematographer as it is not being mentioned anywhere in UI
                data.contentType.includes("photographer")
                ? "Video and Photo Shoot Type"
                : data.contentType.includes("videographer") ||
                  data.contentType.includes("cinematographer")
                  ? "Video Shoot Type"
                  : "Photo Shoot Type"}
            </h3>

            {/* <div className="flex flex-nowrap gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"> */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
              {/* {availableShootTypes.map((type) => ( */}
              {availableShootTypes.slice(0, visibleCount).map((type) => (
                <div
                  key={type.key}
                  className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-start"
                >
                  <ShootTypeCard
                    title={type.title} // Assuming your shootTypes array has label
                    details={type.details} // and details
                    image={type.image}
                    // stats={type.stats}
                    selected={data.shootType === type.key}
                    onClick={() => {
                      updateData({ shootType: type.key });
                      scrollToRef(bookingTypeRef);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleViewToggle}
                className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 rounded-lg  text-sm md:text-lg font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)]"
              >
                <span className="">{isAllVisible ? "View Less" : "View More"}</span>
              </Button>
            </div>
          </div>

          {/* Booking Type */}
          <div ref={bookingTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
            <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"
              }`}>
              Select Booking Type
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setBookingType("single_day");
                  setSelectedDates([]);
                  setSameTimingsMulti(true);
                  setMultiDayTimes({});
                  updateData({ bookingType: "single_day", bookingDays: [] });
                  scrollToRef(dateTimeRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-fit lg:w-[300px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${bookingType === "single_day" ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">Single Day</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${bookingType === "single_day" ? "bg-black" : "border border-[#E5E5E5]"
                    }`}
                >
                  {bookingType === "single_day" && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setBookingType("multi_day");
                  updateData({ bookingType: "multi_day" });
                  scrollToRef(dateTimeRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-fit lg:w-[300px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${bookingType === "multi_day" ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">Multiple Days</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${bookingType === "multi_day" ? "bg-black" : "border border-[#E5E5E5]"
                    }`}
                >
                  {bookingType === "multi_day" && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div ref={dateTimeRef} className="pt-6 lg:pt-15 border-t border-white/10">
            {bookingType === "single_day" ? (
              <>
                <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"
                  }`}>
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
                    />
                  </div>
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
              </>
            ) : (
              <>
                <div className="relative mb-8 lg:mb-15">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${errors.includes("timeError") ? "text-red-400" : "text-white/90"
                      }`}>
                      Select Date
                    </h3>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group">
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
                          key={date.toISOString()}
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
                          <button onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}>
                            <ChevronLeft size={20} />
                          </button>
                          <span className="text-white font-bold">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}>
                              <ChevronRight size={20} />
                            </button>
                            <button
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
                  <div className="pt-6 lg:pt-15 border-t border-white/10 space-y-6">
                    <h3 className={`text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 transition-colors`}>Are timings same for all selected dates?</h3>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setSameTimingsMulti(true);
                          setMultiDayTimes({});
                          // scrollToRef(navigationRef); //update with correct ref
                        }}
                        disabled={data.shootType === ""}
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
                        onClick={() => {
                          setSameTimingsMulti(false);
                          const startKey = getStartTimeKey();
                          const endKey = getEndTimeKey();
                          const nextTimes: Record<string, { startKey?: string; endKey?: string }> = {};
                          selectedDates.forEach((d) => {
                            const key = getDateKey(d);
                            nextTimes[key] = { startKey, endKey };
                          });
                          setMultiDayTimes(nextTimes);
                          // scrollToRef(navigationRef);  //update with correct ref
                        }}
                        disabled={data.shootType === ""}
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
                                <button onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)} className={`w-full px-6 py-5 flex justify-between items-center ${isExpanded ? "border-b rounded-b-2xl border-b-white/10 " : ""}`}>
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
            )}
          </div>

          {/* Edits Needed */}
          <div ref={editsRef} className="pt-6 lg:pt-15 border-t border-white/10">
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
                  updateData({ editsNeeded: false });
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

            {data.editsNeeded && (
              <div className="animate-in slide-in-from-top-4 duration-300 mt-4 lg:mt-8">
                <h4 className={` ${errors.includes("videoEditError") || errors.includes("photoEditError") ? "text-red-400" : "text-white"} font-medium mb-4 flex items-center gap-2 lg:text-xl`}>
                  <Info size={24} className={`${errors.includes("videoEditError") || errors.includes("photoEditError") ? "text-red-400" : "text-white"}`} />
                  Editing includes
                </h4>
                <p className="text-white/60 text-sm mb-11">
                  Professional editing includes color grading, sound mixing, and
                  basic revisions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Video Edit Type - Show if videographer or cinematographer selected: Commented cinematographer as it is not being mentioned anywhere in UI */}
                  {data.contentType.includes("videographer") &&
                    //|| data.contentType.includes("cinematographer")) &&
                    editTypeOptions.length > 0 && (
                      <div>
                        <div className="relative w-full max-w-md">
                          <div
                            className="min-h-14 lg:min-h-[82px] relative bg-[#101010] rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40"
                            onClick={() => setIsVideoEditOpen((p) => !p)}
                          >
                            <span className="absolute -top-3 left-4 bg-[#101010] px-3 text-sm lg:text-base text-white/60 rounded">
                              Video Edit Type
                            </span>
                            <div className="flex-1 flex flex-wrap items-center gap-2">
                              {Object.keys(videoEditCounts).length > 0 ? (
                                Object.entries(videoEditCounts).map(([key, count]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-md text-white text-xs lg:text-sm"
                                  >
                                    <span className="truncate max-w-[140px]">
                                      {getEditDisplayLabel(key, editTypeOptions)}
                                    </span>
                                    <span className="text-white/60">x{count}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-white/40 text-sm lg:text-base">Select Video Edit Type</span>
                              )}
                            </div>
                            {isVideoEditOpen ? (
                              <ChevronUp className="text-white flex-shrink-0" />
                            ) : (
                              <ChevronDown className="text-white flex-shrink-0" />
                            )}
                          </div>

                          {isVideoEditOpen && (
                            <div className="absolute top-16 lg:top-[90px] left-0 w-full mt-3 z-30 bg-[#101010] rounded-lg border border-white/10 max-h-[300px] overflow-y-auto">
                              {editTypeOptions.map((option) => {
                                const count = videoEditCounts[option.key] || 0;
                                return (
                                  <div
                                    key={option.key}
                                    className="flex items-center justify-between gap-3 px-4 py-3 text-white/80 hover:bg-white/5"
                                  >
                                    <span className="text-sm lg:text-base">{option.value}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateEditQuantity("video", option.key, Math.max(0, count - 1))}
                                        className="h-7 w-7 rounded-full border border-white/20 text-white/80 hover:border-white/40"
                                      >
                                        -
                                      </button>
                                      <span className="min-w-[28px] text-center text-white">{count}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateEditQuantity("video", option.key, count + 1)}
                                        className="h-7 w-7 rounded-full border border-white/20 text-white/80 hover:border-white/40"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {data.videoEditTypes.length > 0 && (
                                <div className="px-4 py-3 border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => updateData({ videoEditTypes: [] })}
                                    className="text-xs text-white/50 hover:text-white/80 underline"
                                  >
                                    Clear all
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Photo Edit Type - Show if photographer selected */}
                  {data.contentType.includes("photographer") &&
                    photoEditTypeOptions.length > 0 && (
                      <div>
                        <div className="relative w-full max-w-md">
                          <div
                            className="min-h-14 lg:min-h-[82px] relative bg-[#101010] rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40"
                            onClick={() => setIsPhotoEditOpen((p) => !p)}
                          >
                            <span className="absolute -top-3 left-4 bg-[#101010] px-3 text-sm lg:text-base text-white/60 rounded">
                              Photo Edit Type
                            </span>
                            <div className="flex-1 flex flex-wrap items-center gap-2">
                              {Object.keys(photoEditCounts).length > 0 ? (
                                Object.entries(photoEditCounts).map(([key, count]) => (
                                  <div
                                    key={key}
                                    className="flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-md text-white text-xs lg:text-sm"
                                  >
                                    <span className="truncate max-w-[140px]">
                                      {getEditDisplayLabel(key, photoEditTypeOptions)}
                                    </span>
                                    <span className="text-white/60">x{count}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-white/40 text-sm lg:text-base">Select Photo Edit Type</span>
                              )}
                            </div>
                            {isPhotoEditOpen ? (
                              <ChevronUp className="text-white flex-shrink-0" />
                            ) : (
                              <ChevronDown className="text-white flex-shrink-0" />
                            )}
                          </div>

                          {isPhotoEditOpen && (
                            <div className="absolute top-16 lg:top-[90px] left-0 w-full mt-3 z-30 bg-[#101010] rounded-lg border border-white/10 max-h-[300px] overflow-y-auto">
                              {photoEditTypeOptions.map((option) => {
                                const count = photoEditCounts[option.key] || 0;
                                return (
                                  <div
                                    key={option.key}
                                    className="flex items-center justify-between gap-3 px-4 py-3 text-white/80 hover:bg-white/5"
                                  >
                                    <span className="text-sm lg:text-base">{option.value}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateEditQuantity("photo", option.key, Math.max(0, count - 1))}
                                        className="h-7 w-7 rounded-full border border-white/20 text-white/80 hover:border-white/40"
                                      >
                                        -
                                      </button>
                                      <span className="min-w-[28px] text-center text-white">{count}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateEditQuantity("photo", option.key, count + 1)}
                                        className="h-7 w-7 rounded-full border border-white/20 text-white/80 hover:border-white/40"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {data.photoEditTypes.length > 0 && (
                                <div className="px-4 py-3 border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => updateData({ photoEditTypes: [] })}
                                    className="text-xs text-white/50 hover:text-white/80 underline"
                                  >
                                    Clear all
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {photoEditNote && (
                          <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]">
                            <Info size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{photoEditNote}</span>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Navigation */}
      <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
        {/* <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button> */}
        <Button
          onClick={handleNext}
          // disabled={!data.shootType || !data.editType}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
