"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors, Info, ChevronDown, ChevronUp, Check, Calendar, ChevronLeft, ChevronRight, X, MapPinHouse, Plus } from "lucide-react";
import { toast } from "sonner";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, set, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";

import { API_BASE_URL } from "@/lib/apiConfig";
import { salesApi } from "@/lib/api";
import DottedDivider from "@/components/admin/DottedDivider";
import { ContentTypeCheckbox } from "@/components/book-a-shoot/v3/components/ContentTypeCheckbox";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { useTheme } from "next-themes";

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

import { BookingDataV3, initialDataV3 } from "@/components/book-a-shoot/v3";
import { getPhotoEditSummary, getTotalDurationHours } from "@/components/book-a-shoot/v3/utils";
import { parseDate } from "@/src/components/landing/lib/utils";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import { FloatingLabelDropdown } from "@/components/generic/FloatingLabelDropdown";
import Topbar from "@/components/admin/Topbar";
import { getFormattedDateString } from "@/lib/utils";

const INITIAL_COUNT = 6;

const TEAM_ROLES = [
  { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> },
  { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> },
];

const intentOptions = [
  { value: "Hot", label: "Hot" },
  { value: "Warm", label: "Warm" },
  { value: "Cold", label: "Cold" },
];

type ClientDropdownItem = {
  client_id?: string | number | null;
  id?: string | number | null;
  name?: string | number | null;
  client_name?: string | number | null;
  full_name?: string | number | null;
  email?: string | number | null;
  client_email?: string | number | null;
  guest_email?: string | number | null;
  phone?: string | number | null;
  mobile?: string | number | null;
  mobile_number?: string | number | null;
  phone_number?: string | number | null;
  client_phone?: string | number | null;
};

const pickFirstClientValue = (
  ...values: Array<string | number | null | undefined>
) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getClientDisplayName = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.name, client?.client_name, client?.full_name);

const getClientEmail = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.email, client?.client_email, client?.guest_email);

const getClientPhone = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.phone,
    client?.mobile,
    client?.mobile_number,
    client?.phone_number,
    client?.client_phone,
  );

const getClientIdentifier = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.client_id, client?.id, getClientDisplayName(client));

export default function ClientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { theme } = useTheme();

  // Refs for scrolling logic
  const contentTypeRef = useRef<HTMLDivElement>(null);
  const shootTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const extraTeamRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const crewRef = useRef<HTMLDivElement>(null);
  const bookingTypeRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const clientSuggestionRef = useRef<HTMLDivElement>(null);

  // MultiSelect references
  const isDraggingReel = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  // --- STATE ---
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<BookingDataV3 & { selectedCrewIds: number[] }>({
    ...initialDataV3,
    selectedCrewIds: []
  });

  const [availableShootTypes, setAvailableShootTypes] = useState(newshootTypes);
  const [videoEditTypeOptions, setVideoEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
  const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
  const [photoEditNote, setPhotoEditNote] = useState<string>("");
  const [thumbtack, setThumbtack] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});
  const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(formData.bookingType || "multi_day");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>(null);

  // Client Info State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState<ClientDropdownItem[]>([]);
  const [selectedClientSuggestion, setSelectedClientSuggestion] = useState<ClientDropdownItem | null>(null);
  const [isClientSuggestionOpen, setIsClientSuggestionOpen] = useState(false);
  const [isLoadingClientSuggestions, setIsLoadingClientSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New API State for Crew List
  const [crewList, setCrewList] = useState<any[]>([]);
  const [isLoadingCrew, setIsLoadingCrew] = useState(false);
  const [isUserTypeSeven, setIsUserTypeSeven] = useState(false);
  const [salesRepId, setSalesRepId] = useState<string>("");
  const [salesRepOptions, setSalesRepOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingSalesReps, setIsLoadingSalesReps] = useState(false);

  const getAuthToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return Cookies.get("revure_token") || localStorage.getItem("revure_token") || "";
  }, []);


  const updateData = useCallback((newData: Partial<BookingDataV3 & { selectedCrewIds: number[] }>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const getCityName = useCallback(() => {
    // 1️⃣ If Mapbox details exist (from context array)
    if (formData.locationDetails?.context) {
      const placeComponent = formData.locationDetails.context.find(
        (component: any) => component.id && component.id.startsWith("place.")
      );

      if (placeComponent) {
        return placeComponent.text;
      }
    }

    // 2️⃣ Fallback: Extract from formatted string safely
    if (formData.location) {
      const parts = formData.location.split(",");
      if (parts.length >= 2) {
        return parts[parts.length - 3]?.trim() || parts[1].trim();
      }
    }

    return "";
  }, [formData.location, formData.locationDetails]);

  // --- API LOGIC FOR CREW ---
  const fetchAvailableCrew = useCallback(async () => {
    if (!formData.startDate || formData.contentType.length === 0 || !formData.location) {
      return;
    }

    setIsLoadingCrew(true);
    try {
      const dateObj = parseDate(formData.startDate);
      const dateStr = dateObj ? format(dateObj, "yyyy-MM-dd") : "";
      const roles = formData.contentType.filter(t => t !== 'editing').join(',');

      const citySearch = getCityName();

      if (!citySearch) {
        setCrewList([]);
        setIsLoadingCrew(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/get-crew-for-lead/?date=${dateStr}&role_type=${roles}&search_query=${encodeURIComponent(citySearch)}`
      );
      const result = await response.json();

      if (result.success) {
        setCrewList(result.data);
      } else {
        setCrewList([]);
      }
    } catch (error) {
      console.error("Error fetching crew:", error);
    } finally {
      setIsLoadingCrew(false);
    }
  }, [formData.startDate, formData.contentType, formData.location, getCityName]);

  // Trigger fetch when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailableCrew();
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.startDate, formData.contentType, formData.location, fetchAvailableCrew]);

  useEffect(() => {
    const trimmedQuery = clientName.trim();

    if (!isClientSuggestionOpen || trimmedQuery.length === 0) {
      setClientSuggestions([]);
      setIsLoadingClientSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingClientSuggestions(true);
      try {
        const result = await salesApi.getClientDropdown(trimmedQuery);
        if (!result.error && Array.isArray(result.data)) {
          setClientSuggestions(result.data as ClientDropdownItem[]);
        } else {
          setClientSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching client suggestions:", error);
        setClientSuggestions([]);
      } finally {
        setIsLoadingClientSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [clientName, isClientSuggestionOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientSuggestionRef.current &&
        !clientSuggestionRef.current.contains(event.target as Node)
      ) {
        setIsClientSuggestionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // 1. Generate Time Options on Mount
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
        options.push({ key, value: format(date, "h:mm aa") });
      }
    }
    setTimeOptions(options);
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userTypeId = parsedUser?.user_type_id ?? parsedUser?.userTypeId;
      setIsUserTypeSeven(userTypeId === 7);
    } catch (error) {
      console.error("Failed to read logged in user from localStorage:", error);
      setIsUserTypeSeven(false);
    }
  }, []);

  const fetchSalesReps = useCallback(async () => {
    if (!isUserTypeSeven) {
      setSalesRepOptions([]);
      return;
    }

    setIsLoadingSalesReps(true);
    try {
      const result = await salesApi.getSalesReps();
      if (result.success && Array.isArray(result.data)) {
        setSalesRepOptions(
          result.data.map((rep: any) => ({
            value: String(rep.id),
            label: `${rep.name}`,
          }))
        );
      } else {
        setSalesRepOptions([]);
      }
    } catch (error) {
      console.error("Error fetching sales reps:", error);
      setSalesRepOptions([]);
    } finally {
      setIsLoadingSalesReps(false);
    }
  }, [isUserTypeSeven]);

  useEffect(() => {
    fetchSalesReps();
  }, [fetchSalesReps]);

  useEffect(() => {
    const primaryDate = formData.startDate || formData.endDate;
    if (!primaryDate) {
      setSelectedShootDate(null);
      return;
    }

    const parsed = parseDate(primaryDate);
    if (!parsed) return;

    setSelectedShootDate(
      set(new Date(parsed), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
    );
  }, [formData.startDate, formData.endDate]);

  // 2. Filter Shoot Types based on Content Type
  useEffect(() => {
    const isVideo = formData.contentType.includes("videographer");
    const isPhoto = formData.contentType.includes("photographer");

    if (isVideo && isPhoto) {
      setAvailableShootTypes(hybridShootTypes);
    } else if (isPhoto) {
      setAvailableShootTypes(photoShootTypes);
    } else if (isVideo) {
      setAvailableShootTypes(videoShootTypes);
    } else {
      setAvailableShootTypes(newshootTypes);
    }
  }, [formData.contentType]);

  // 3. Filter Edit Types based on Shoot Type Selection
  useEffect(() => {
    setVideoEditTypeOptions([]);
    setPhotoEditTypeOptions([]);
    setPhotoEditNote("");

    switch (formData.shootType) {
      case "wedding":
        setVideoEditTypeOptions(weddingEditTypes);
        setPhotoEditTypeOptions(weddingPhotoEditTypes);
        setPhotoEditNote("50 edited photos per hour for weddings");
        break;
      case "music":
        setVideoEditTypeOptions(musicEditTypes);
        setPhotoEditTypeOptions(musicPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "commercial":
        setVideoEditTypeOptions(commercialEditTypes);
        setPhotoEditTypeOptions(commercialPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "tv":
        setVideoEditTypeOptions(tvSeriesEditTypes);
        break;
      case "podcast":
        setVideoEditTypeOptions(podcastEditTypes);
        break;
      case "short_film":
        setVideoEditTypeOptions(shortFilmEditTypes);
        break;
      case "movie":
        setVideoEditTypeOptions(movieEditTypes);
        break;
      case "corporate":
        setVideoEditTypeOptions(corporateEventEditTypes);
        setPhotoEditTypeOptions(corporateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "private":
        setVideoEditTypeOptions(privateEventEditTypes);
        setPhotoEditTypeOptions(privateEventPhotoEditTypes);
        setPhotoEditNote("25 edited photos per hour");
        break;
      case "social_content":
        setVideoEditTypeOptions(socialContentEditTypes);
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
    }
  }, [formData.shootType]);

  // Booking Type related chnanges:

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
    formData.startDate,
    formData.endDate,
    sameTimingsMulti,
    multiDayTimes,
    updateData
  ]);

  // --- HANDLERS (Timezone Fix Applied) ---
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setSelectedShootDate(null);
      updateData({ startDate: "", endDate: "" });
      return;
    }
    setSelectedShootDate(
      set(new Date(date), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
    );
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();

    let finalStart: Date;
    let finalEnd: Date;

    if (isToday) {
      finalStart = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const mins = finalStart.getMinutes();
      if (mins > 0 && mins <= 30) finalStart.setMinutes(30, 0, 0);
      else if (mins > 30) finalStart.setHours(finalStart.getHours() + 1, 0, 0, 0);
      else finalStart.setMinutes(0, 0, 0);
      finalEnd = new Date(finalStart.getTime() + 8 * 60 * 60 * 1000);
    } else {
      finalStart = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
      finalEnd = set(date, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
    }

    // Use format to keep Local Time instead of UTC ISO String
    updateData({
      startDate: format(finalStart, "yyyy-MM-dd HH:mm:ss"),
      endDate: format(finalEnd, "yyyy-MM-dd HH:mm:ss"),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    if (!timeKey) return updateData({ startDate: "" });
    const [hours, minutes] = timeKey.split(":").map(Number);
    const currentDate =
      parseDate(formData.startDate) ||
      parseDate(formData.endDate) ||
      selectedShootDate ||
      new Date();

    const selectedTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    const now = new Date();

    if (selectedTime < now) {
      toast.error("Selected time must be later than the current time.");
      return;
    }
    const minimumTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (selectedTime < minimumTime) {
      toast.error("You must select a start time at least 4 hours from now.");
      return;
    }
    // Fixed to send local string
    updateData({ startDate: format(selectedTime, "yyyy-MM-dd HH:mm:ss") });
  };

  const handleEndTimeChange = (timeKey: string) => {
    if (!timeKey) return updateData({ endDate: "" });
    const [hours, minutes] = timeKey.split(":").map(Number);
    const baseDate =
      parseDate(formData.startDate) ||
      parseDate(formData.endDate) ||
      selectedShootDate ||
      new Date();

    const newEnd = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // Fixed to send local string
    updateData({ endDate: format(newEnd, "yyyy-MM-dd HH:mm:ss") });
    scrollToRef(editsRef);
  };

  const getStartTimeKey = () => {
    if (!formData.startDate) return "";
    const date = parseDate(formData.startDate);
    return date ? format(date, "HH:mm") : "";
  };

  const getEndTimeKey = () => {
    if (!formData.endDate) return "";
    const date = parseDate(formData.endDate);
    return date ? format(date, "HH:mm") : "";
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

  const filteredStartTimeOptions = useMemo(() => {
    if (!selectedShootDate) return timeOptions;
    const selectedDate = selectedShootDate;
    const now = new Date();
    const isToday = selectedDate?.toDateString() === now.toDateString();
    if (!isToday) return timeOptions;
    const minKey = format(new Date(now.getTime() + 4 * 60 * 60 * 1000), "HH:mm");
    return timeOptions.filter((opt) => opt.key >= minKey);
  }, [selectedShootDate, timeOptions]);

  const filteredEndTimeOptions = useMemo(() => {
    if (!formData.startDate) return timeOptions;
    const startKey = getStartTimeKey();
    return timeOptions.filter((opt) => opt.key > startKey);
  }, [formData.startDate, timeOptions]);

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
    () => buildEditCounts(formData.videoEditTypes),
    [formData.videoEditTypes]
  );

  const photoEditCounts = useMemo(
    () => buildEditCounts(formData.photoEditTypes),
    [formData.photoEditTypes]
  );

  const videoEditSummaryItems = useMemo(
    () => getEditSummaryItems(videoEditCounts, videoEditTypeOptions),
    [videoEditCounts, videoEditTypeOptions]
  );

  const photoEditSummaryItems = useMemo(
    () => getEditSummaryItems(photoEditCounts, photoEditTypeOptions),
    [photoEditCounts, photoEditTypeOptions]
  );

  const totalDurationHours = useMemo(
    () =>
      getTotalDurationHours(
        formData.bookingType,
        formData.startDate,
        formData.endDate,
        formData.bookingDays
      ),
    [formData.bookingType, formData.startDate, formData.endDate, formData.bookingDays]
  );

  const selectedPhotoEditSets = useMemo(
    () => Object.values(photoEditCounts).reduce((sum, count) => sum + count, 0),
    [photoEditCounts]
  );

  const photoEditSummary = useMemo(
    () =>
      getPhotoEditSummary({
        shootType: formData.shootType,
        durationHours: totalDurationHours,
        selectedAddOnSets: selectedPhotoEditSets,
      }),
    [formData.shootType, totalDurationHours, selectedPhotoEditSets]
  );

  const updateEditQuantity = (type: "video" | "photo", key: string, nextQty: number) => {
    const base = type === "video" ? formData.videoEditTypes : formData.photoEditTypes;
    const cleaned = base.filter((value) => value !== key);
    const next =
      nextQty > 0 ? [...cleaned, ...Array.from({ length: nextQty }, () => key)] : cleaned;

    if (type === "video") {
      updateData({ videoEditTypes: next });
    } else {
      updateData({ photoEditTypes: next });
    }
  };

  const isVideoEditOpen = openEditPanel === "video";
  const isPhotoEditOpen = openEditPanel === "photo";

  const handleVideoEditToggle = () => {
    setOpenEditPanel((prev) => (prev === "video" ? null : "video"));
  };

  const handlePhotoEditToggle = () => {
    setOpenEditPanel((prev) => (prev === "photo" ? null : "photo"));
  };

  const toggleContentType = (type: "videographer" | "photographer" | "editing") => {
    const current = [...formData.contentType];
    const isCurrentlySelected = current.includes(type);
    const nextContentType = isCurrentlySelected ? current.filter((t) => t !== type) : [...current, type];

    if (nextContentType.length === 0) {
      updateData({ contentType: [], shootType: "", startDate: "", endDate: "", editsNeeded: true, videoEditTypes: [], photoEditTypes: [] });
    } else {
      updateData({
        contentType: nextContentType,
        videoEditTypes: nextContentType.includes("videographer") ? formData.videoEditTypes : [],
        photoEditTypes: nextContentType.includes("photographer") ? formData.photoEditTypes : []
      });
    }

    if (nextContentType.length > 0) scrollToRef(shootTypeRef);
  };

  const handleExtraTeamChange = (id: string, delta: number) => {
    const nextExtra = { ...extraTeam };
    nextExtra[id] = Math.max(0, (nextExtra[id] || 0) + delta);
    setExtraTeam(nextExtra);

    const summary = Object.entries(nextExtra)
      .filter(([_, count]) => count > 0)
      .map(([roleId, count]) => `${TEAM_ROLES.find(r => r.id === roleId)?.label || roleId} x${count}`);

    updateData({
      teamIncluded: summary,
      crewCount: formData.contentType.length + Object.values(nextExtra).reduce((a, b) => a + b, 0)
    });
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref?.current) {
        const offset = ref.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
    }, 100);
  };

  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const reqCounts = useMemo(() => {
    return {
      videographer: formData.contentType.includes("videographer") ? 1 + (extraTeam["videographer"] || 0) : 0,
      photographer: formData.contentType.includes("photographer") ? 1 + (extraTeam["photographer"] || 0) : 0
    };
  }, [formData.contentType, extraTeam]);

  const handleContinueClick = async () => {
    if (!clientName || !clientEmail || !clientPhone || !thumbtack || !intent || (isUserTypeSeven && !salesRepId) || !formData.location || formData.contentType.length === 0 || !formData.shootType || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all Booking information fields");
      return;
    }

    // Check if over-selecting
    const isOverVideographers = selectionCounts.videographer > reqCounts.videographer;
    const isOverPhotographers = selectionCounts.photographer > reqCounts.photographer;

    if (isOverVideographers || isOverPhotographers) {
      setIsConfirmModalOpen(true);
      return;
    }

    executeFinalizeDeal();
  };

  const executeFinalizeDeal = async () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    try {
      // Parse correctly from local time strings
      const token = getAuthToken();
      const startDate = parseDate(formData.startDate);
      const endDate = parseDate(formData.endDate);

      const durationHours = startDate && endDate
        ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)))
        : 0;

      const crewRoles: Record<string, number> = {};
      if (formData.contentType.includes("videographer")) {
        crewRoles["videographer"] = 1 + (extraTeam["videographer"] || 0);
      }
      if (formData.contentType.includes("photographer")) {
        crewRoles["photographer"] = 1 + (extraTeam["photographer"] || 0);
      }

      const crewSize = Object.values(crewRoles).reduce((a, b) => a + b, 0);

      const browserTimeZone = getBrowserTimeZone();
      const startDatePart = getLocalDatePart(formData.startDate);
      const startTimePart = getLocalTimePart(formData.startDate);
      const endTimePart = getLocalTimePart(formData.endDate);

      const payload = {
        client_name: clientName,
        guest_email: clientEmail,
        phone: clientPhone,
        intent: intent,
        sales_rep_id: isUserTypeSeven && salesRepId ? Number(salesRepId) : undefined,
        lead_source: thumbtack,
        content_type: formData.contentType.filter(t => t !== 'editing').join(','),
        shoot_type: formData.shootType,
        start_date: startDatePart,
        start_time: startTimePart,
        end_time: endTimePart,
        time_zone: browserTimeZone,
        start_date_time: formData.startDate,
        duration_hours: durationHours,
        location: formData.location,
        crew_roles: crewRoles,
        crew_size: crewSize,
        selected_crew_ids: formData.selectedCrewIds || [],
        edits_needed: formData.editsNeeded,
        video_edit_types: formData.videoEditTypes || [],
        photo_edit_types: formData.photoEditTypes || [],
        is_draft: false,
        skip_discount: true,
        skip_margin: true,
        booking_type: formData.bookingType,
        booking_days: (formData.bookingDays || []).map((d: any) => ({
          ...d,
          time_zone: d.time_zone || d.timeZone || browserTimeZone
        }))
      };

      const response = await fetch(`${API_BASE_URL}/sales/deals/finalize`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Deal created successfully!");
        router.push("/sales/dashboard");
      } else {
        toast.error(result.message || "Failed to create deal");
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRolesToAdd = TEAM_ROLES.filter(role => formData.contentType.includes(role.id as any));

  const handleClientSuggestionSelect = (client: ClientDropdownItem) => {
    setSelectedClientSuggestion(client);
    setClientName(getClientDisplayName(client));
    setClientEmail(getClientEmail(client));
    setClientPhone(getClientPhone(client));
    setClientSuggestions([]);
    setIsClientSuggestionOpen(false);
  };

  const handleCreateNewClient = () => {
    setSelectedClientSuggestion(null);
    setClientEmail("");
    setClientPhone("");
    setClientSuggestions([]);
    setIsClientSuggestionOpen(false);
  };

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname} />

      <AssignmentConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeFinalizeDeal}
        videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
        photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
        isDark={isDark}
      />
      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans mb-20 transition-colors ${isDark ? "text-white" : "text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="space-y-6 my-4 lg:my-9">
          <h3 className={`text-base lg:text-xl font-medium ${isDark ? "text-white/90" : "text-black/80"}`}>Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <div ref={clientSuggestionRef} className="relative space-y-2">
              <Label htmlFor="name" className={`absolute -top-2 lg:-top-3 left-4 px-2 text-sm lg:text-base ${isDark ? "bg-[#101010] text-white/60" : "bg-[#F4F5F7] text-black/60 "} `}>Client Name</Label>
              <Input
                id="name"
                type="text"
                value={clientName}
                onFocus={() => {
                  if (clientName.trim()) {
                    setIsClientSuggestionOpen(true);
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setClientName(value);
                  setSelectedClientSuggestion(null);
                  setIsClientSuggestionOpen(Boolean(value.trim()));
                }}
                className={`h-14 lg:h-[82px] w-full rounded-[12px] border p-4 text-white outline-none resize-none text-sm lg:text-base ${isDark ? "border-white/30 bg-[#101010] focus:border-[#1A1A1A] " : "bg-transparent border-[#0000004D] text-[#2C2C2C] focus:border-[#000000]/20"}`}
              />
              {isClientSuggestionOpen && (
                <div className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[12px] border shadow-lg ${isDark ? "border-white/10 bg-[#171717]" : "border-black/10 bg-white"}`}>
                  <div className="max-h-72 overflow-y-auto py-2">
                    {isLoadingClientSuggestions ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                        Searching clients...
                      </div>
                    ) : clientSuggestions.length > 0 ? (
                      clientSuggestions.map((client) => {
                        const clientId = getClientIdentifier(client);
                        const displayName = getClientDisplayName(client) || "Unnamed client";
                        const email = getClientEmail(client);
                        const phone = getClientPhone(client);
                        const isSelected = getClientIdentifier(selectedClientSuggestion) === clientId;

                        return (
                          <button
                            key={clientId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleClientSuggestionSelect(client)}
                            className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${isSelected
                              ? isDark ? "bg-[#E8D1AB] text-black" : "bg-[#F5E7CC] text-black"
                              : isDark ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"
                              }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{displayName}</p>
                              {(email || phone) && (
                                <p className={`mt-1 truncate text-xs ${isSelected ? "text-black/70" : isDark ? "text-white/50" : "text-black/50"}`}>
                                  {[email, phone].filter(Boolean).join(" • ")}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className={`px-4 py-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                        No matching clients found.
                      </div>
                    )}

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCreateNewClient}
                      className={`mt-2 flex w-full items-center gap-3 border-t px-4 py-4 text-left transition-colors ${
                        isDark
                          ? "border-white/10 text-[#E8D1AB] hover:bg-[#E8D1AB]/5"
                          : "border-black/10 text-black hover:bg-black/5"
                      }`}
                    >
                      <div className={`flex h-6 w-6 items-center justify-center rounded border ${
                        isDark
                          ? "border-[#E8D1AB]/40 bg-[#E8D1AB] text-black"
                          : "border-black/20 bg-black text-white"
                      }`}>
                        <Plus size={14} />
                      </div>
                      <span className="text-sm font-semibold">Create New Client</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative space-y-2">
              <Label htmlFor="email" className={`absolute -top-2 lg:-top-3 left-4 px-2 text-sm lg:text-base ${isDark ? "bg-[#101010] text-white/60" : "bg-[#F4F5F7] text-black/60 "} `}>Email</Label>
              <Input
                id="email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={`h-14 lg:h-[82px] w-full rounded-[12px] border p-4 text-white outline-none resize-none text-sm lg:text-base ${isDark ? "border-white/30 bg-[#101010] focus:border-[#1A1A1A] " : "bg-transparent border-[#0000004D] text-[#2C2C2C] focus:border-[#000000]/20"}`}
              />
            </div>

            <div className="relative space-y-2">
              <Label htmlFor="phone" className={`absolute -top-2 lg:-top-3 left-4 px-2 text-sm lg:text-base ${isDark ? "bg-[#101010] text-white/60" : "bg-[#F4F5F7] text-black/60 "} `}>Phone Number</Label>
              <Input
                id="phone"
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className={`h-14 lg:h-[82px] w-full rounded-[12px] border p-4 text-white outline-none resize-none text-sm lg:text-base ${isDark ? "border-white/30 bg-[#101010] focus:border-[#1A1A1A] " : "bg-transparent border-[#0000004D] text-[#2C2C2C] focus:border-[#000000]/20"}`}
              />
            </div>

            <FloatingLabelDropdown
              label="Select Source"
              value={thumbtack}
              options={[
                { value: "thumbtack", label: "Thumbtack" },
                { value: "referral", label: "Referral" },
                { value: "instagram", label: "Instagram" },
                { value: "facebook", label: "Facebook" },
                { value: "event", label: "Event" },
                { value: "government_contract", label: "Government Contract" },
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" }
              ]}
              onChange={(val) => setThumbtack(val)}
              placeholder=""
              labelBg={isDark ? "bg-[#000]" : "bg-[#F4F5F7]"}
              required
              isDark={isDark}
            />

            <FloatingLabelDropdown
              label="Intent Type"
              value={intent}
              options={intentOptions}
              onChange={(val) => setIntent(val)}
              placeholder="Choose an intent..."
              labelBg={isDark ? "bg-[#000]" : "bg-[#F4F5F7]"}
              required
              isDark={isDark}
            />
            {isUserTypeSeven && (
              <FloatingLabelDropdown
                label="Assign Sales Person"
                value={salesRepId}
                options={salesRepOptions}
                onChange={(val) => setSalesRepId(val)}
                placeholder={isLoadingSalesReps ? "Loading representatives..." : "Choose a representative..."}
                labelBg={isDark ? "bg-[#000]" : "bg-[#F4F5F7]"}
                required
                isDark={isDark}
              />
            )}
          </div>
        </div>
        {/* <DottedDivider /> */}

        <div ref={contentTypeRef} className="my-4 lg:my-9">
          <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${isDark ? "text-white/90" : "text-black/80"}`}>Content Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ContentTypeCheckbox
              label="Select All"
              icon={<SquaresUnite size={20} />}
              checked={formData.contentType.includes("videographer") && formData.contentType.includes("photographer")}
              onChange={(checked) => {
                if (checked) updateData({ contentType: ["videographer", "photographer"] });
                else updateData({ contentType: [] });
              }}
              isDark={isDark}
            />
            <ContentTypeCheckbox
              label="Videography"
              icon={<Video size={20} />}
              checked={formData.contentType.includes("videographer")}
              onChange={() => toggleContentType("videographer")}
              isDark={isDark}
            />
            <ContentTypeCheckbox
              label="Photography"
              icon={<Camera size={20} />}
              checked={formData.contentType.includes("photographer")}
              onChange={() => toggleContentType("photographer")}
              isDark={isDark}
            />
            <ContentTypeCheckbox label="AI Editing" subLabel="Coming Soon" icon={<Scissors size={20} />} checked={false} onChange={() => { }} disabled={true} isDark={isDark} />
            <ContentTypeCheckbox label="Locations" subLabel="Coming Soon" icon={<MapPinHouse size={20} />} checked={false} onChange={() => { }} disabled={true} isDark={isDark} />
            <ContentTypeCheckbox label="Livestream" subLabel="Coming Soon" icon={<Radio size={20} />} checked={false} onChange={() => { }} disabled={true} isDark={isDark} />
          </div>
        </div>
        {/* <DottedDivider /> */}

        <div ref={shootTypeRef} className="my-4 lg:my-9">
          <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${isDark ? "text-white/90" : "text-black/80"}`}>
            {formData.contentType.length > 1 ? "Video and Photo Shoot Type" : "Shoot Type"}
          </h3>
          <FloatingLabelDropdown
            label="Shoot Type"
            value={formData.shootType}
            options={availableShootTypes.map(s => ({ value: s.key, label: s.title }))}
            onChange={(val) => {
              updateData({ shootType: val });
              scrollToRef(bookingTypeRef);
            }}
            placeholder="Select the type of shoot"
            labelBg={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
            required
            isDark={isDark}
          />
        </div>
        {/* <DottedDivider /> */}

        {/* Booking Type */}
        <div ref={bookingTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
          <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${isDark ? "text-white/90" : "text-black/80"}`}>
            Select Booking Type
          </h3>
          <div className="flex gap-4">
            {[
              { id: "single_day", label: "Single Day" },
              { id: "multi_day", label: "Multiple Days" }
            ].map((type) => {
              const isSelected = bookingType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setBookingType(type.id as "single_day" | "multi_day");
                    updateData({
                      bookingType: type.id as "single_day" | "multi_day",
                      bookingDays: []
                    });
                    if (type.id === "single_day") {
                      setSelectedDates([]);
                      setSameTimingsMulti(true);
                      setMultiDayTimes({});
                    }
                    scrollToRef(dateTimeRef);
                  }}
                  className={`h-14 lg:h-[82px] w-fit lg:w-[300px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all duration-300 ${isSelected
                    ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                    : isDark
                      ? "bg-[#101010] border-white/10 text-[#A9A9A9] hover:border-white/20"
                      : "bg-transparent border-[#0000004D] text-[#2C2C2C] hover:border-[#000000]/50"
                    }`}
                >
                  <span className="font-medium text-sm lg:text-lg pr-2">{type.label}</span>
                  <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-black" : isDark ? "border border-white/20" : "border border-[#0000004D]"
                    }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div ref={dateTimeRef} className="my-4 lg:my-9">
          {bookingType === "single_day" ? (
            <>
              <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${isDark ? "text-white/90" : "text-black/80"}`}>Shoot Date & Time</h3>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <DatePicker
                    label="Select Date"
                    value={selectedShootDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    // colors={datePickerColours}
                    format="MM/dd/yyyy"
                    sx={{ height: { xs: "56px", md: "82px" }, borderRadius: "16px" }}
                    isDark={isDark}
                  />
                </div>
                <div className="flex-1">
                  <DropdownSelect
                    title="Start Time"
                    options={filteredStartTimeOptions}
                    value={getStartTimeKey()}
                    onChange={handleStartTimeChange}
                    bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                    isDark={isDark}
                  />
                </div>
                <div className="flex-1">
                  <DropdownSelect
                    title="End Time"
                    options={filteredEndTimeOptions}
                    value={getEndTimeKey()}
                    onChange={handleEndTimeChange}
                    bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                    isDark={isDark}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative mb-8 lg:mb-15">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${isDark ? "text-white/90" : "text-black/80"}`}>
                    Select Date
                  </h3>
                  <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors group">
                    <span className={`font-medium lg:text-[20px] ${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"}`}>{format(currentCalendarMonth, "MMMM yyyy")}</span>
                    <Calendar size={20} className={`${isDark ? "text-white group-hover:text-[#E8D1AB]" : "text-black group-hover:text-black/80"} `} />
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
                        className={`shrink-0 flex flex-col items-center justify-center w-[60px] lg:w-[100px] h-[60px] lg:h-[100px] rounded-full border transition-all ${isSelected
                          ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                          : isDark
                            ? "bg-transparent border-white/10 text-white/40 hover:border-white/30"
                            : "bg-white border-[#0000004D] text-[#2C2C2C] hover:border-black/50 shadow-sm"
                          }`}
                      >
                        <span className="text-lg lg:text-3xl font-bold">{format(date, "d")}</span>
                        <span className="text-[10px] lg:text-xs uppercase font-medium">{format(date, "EEE")}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <div className={`mt-4 lg:mt-8 rounded-lg lg:rounded-xl w-fit px-4 py-2 lg:px-7 lg:py-3 ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"}`}>
                    <p className={`font-medium text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>Total Days: {selectedDates.length}</p>
                  </div>
                  <div className={`mt-4 lg:mt-8 rounded-lg lg:rounded-xl w-fit px-4 py-2 lg:px-7 lg:py-3 ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"}`}>
                    <p className={`font-medium text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>Selected Days: {getFormattedDateString(selectedDates)}</p>
                  </div>
                </div>

                {/* Calendar Popover */}
                <AnimatePresence>
                  {isCalendarOpen && (
                    <motion.div ref={calendarRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute right-0 top-14 z-50 border p-5 rounded-2xl shadow-2xl w-[320px] ${isDark ? "bg-[#111] border-white/10" : "bg-white border-gray-200"
                      }`}>
                      <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}>
                          <ChevronLeft size={20} />
                        </button>
                        <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{format(currentCalendarMonth, "MMMM yyyy")}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}>
                            <ChevronRight size={20} />
                          </button>
                          <button
                            onClick={() => setIsCalendarOpen(false)}
                            className={`rounded-full p-1 transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
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
                              className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm transition-colors ${isSelected ? "bg-[#E8D1AB] text-black" : (isDark ? "text-white hover:bg-white/10" : "text-[#323232] hover:bg-black/10")} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}
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
                <div className={`pt-6 lg:pt-15 border-t space-y-6 ${isDark ? "border-white/10" : "border-black/5"}`}>
                  <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors ${isDark ? "text-white/90" : "text-black/80"}`}>Are timings same for all selected dates?</h3>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setSameTimingsMulti(true);
                        setMultiDayTimes({});
                        // scrollToRef(navigationRef); //update with correct ref
                      }}
                      disabled={formData.shootType === ""}
                      className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${sameTimingsMulti
                        ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                        : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"
                        }`}
                    >
                      <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                      <div
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${sameTimingsMulti ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")}`}
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
                      disabled={formData.shootType === ""}
                      className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!sameTimingsMulti
                        ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                        : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"}`}
                    >
                      <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                      <div
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!sameTimingsMulti ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")
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
                              bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                              isDark={isDark}
                            />
                          </div>
                          <div className="flex-1">
                            <DropdownSelect
                              title="End Time"
                              options={filteredEndTimeOptions}
                              value={getEndTimeKey()}
                              onChange={handleEndTimeChange}
                              bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                              isDark={isDark}
                            />
                          </div>
                        </div>
                        <p className={`flex gap-2 my-3 lg:mt-6 lg:mb-8 ${isDark ? "text-[#A9A9A9]" : "text-[#747171]"}`}>
                          <Check size={24} className={`${isDark ? "text-white" : "text-[#747171]"}`} /> Applied to {selectedDates.length} selected dates
                        </p>
                        <div className={`rounded-lg lg:rounded-2xl border p-4 lg:p-7 flex flex-col lg:flex-row lg:justify-between lg:items-center transition-all ${isDark
                          ? "bg-[#171717] border-white/30"
                          : "bg-white border-[#E5E5E5]/40 shadow-sm"
                          }`}>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-white" : "text-black"}`}>
                            {getFormattedDateString(selectedDates)}
                          </p>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-white/60" : "text-black"}`}>
                            {getStartTimeKey() && getEndTimeKey()
                              ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}`
                              : "Select time"}
                          </p>
                          <p className={`font-medium lg:text-[20px] ${isDark ? "text-[#E8D1AB]" : "text-[#595959]"}`}>
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
                            <div key={date.toISOString()} className={`border border-white/10 rounded-2xl ${isDark ? "border-white/10 bg-[#171717]" : "border-black/10 bg-white shadow-sm"} ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}>
                              <button onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)} className={`w-full px-6 py-5 flex justify-between items-center ${isExpanded ? isDark ? "border-b rounded-b-2xl border-b-white/10" : "border-b rounded-b-2xl border-b-black/5" : ""}`}>
                                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{format(date, "MMMM dd, yyyy")}</span>
                                <ChevronDown className={`${isDark ? "text-white/40" : "text-black/50"} transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    className={`p-4 lg:p-7 overflow-visible transition-colors rounded-b-2xl ${isDark ? "bg-[#101010]" : "bg-black/5"
                                      }`}
                                  >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div className="flex-1">
                                        <DropdownSelect
                                          title="Start Time"
                                          options={filteredStartTimeOptions}
                                          value={multiDayTimes[dateKey]?.startKey || ""}
                                          onChange={(value) => handleMultiDayStartTimeChange(dateKey, value)}
                                          bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                          isDark={isDark}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <DropdownSelect
                                          title="End Time"
                                          options={filteredEndTimeOptions}
                                          value={multiDayTimes[dateKey]?.endKey || ""}
                                          onChange={(value) => handleMultiDayEndTimeChange(dateKey, value)}
                                          bgColour={isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}
                                          isDark={isDark}
                                        />
                                      </div>
                                    </div>

                                    <div className={`mt-2 lg:mt-4 rounded-lg lg:rounded-xl ${isDark ? "bg-[#211F1C]" : "bg-[#FFF]"} w-fit px-4 py-2 lg:px-7 lg:py-3`}>
                                      <p className={`font-medium text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#323232]"}`}>
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
        {/* <DottedDivider /> */}

        {/* Edits Needed */}
        <div ref={editsRef} className="my-4 lg:my-9">
          <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 ${isDark ? "text-white/90" : "text-black/80"}`}>Edits Needed?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => {
                updateData({ editsNeeded: true });
                if (!openEditPanel) {
                  if (formData.contentType.includes("videographer")) setOpenEditPanel("video");
                  else if (formData.contentType.includes("photographer")) setOpenEditPanel("photo");
                }
              }}
              disabled={formData.shootType === ""}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${formData.editsNeeded
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"}`}
            >
              <span className="font-medium text-sm lg:text-lg">Yes</span>
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${formData.editsNeeded ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")}`}>
                {formData.editsNeeded && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
              </div>
            </button>
            <button
              onClick={() => {
                setOpenEditPanel(null);
                updateData({ editsNeeded: false, videoEditTypes: [], photoEditTypes: [] });
              }}
              disabled={formData.shootType === ""}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!formData.editsNeeded
                ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"}`}
            >
              <span className="font-medium text-sm lg:text-lg">No</span>
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!formData.editsNeeded ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")}`}>
                {!formData.editsNeeded && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
              </div>
            </button>
          </div>

          {formData.editsNeeded && (
            <div className="animate-in slide-in-from-top-4 duration-300 mt-4 lg:mt-8">
              <div className="grid grid-cols-1 items-start md:grid-cols-2 md:items-start gap-6">
                {formData.contentType.includes("videographer") && videoEditTypeOptions.length > 0 && (
                  <div className={`self-start rounded-[24px] border overflow-hidden ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-black/10 shadow-sm"}`}>
                    <button
                      type="button"
                      className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                      onClick={handleVideoEditToggle}
                    >
                      <div className="min-w-0 flex flex-1 items-center gap-3">
                        <p className={`shrink-0 text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Video Edit Type</p>
                        {videoEditSummaryItems.length > 0 && (
                          <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                            {videoEditSummaryItems.map((item) => (
                              <span
                                key={item.key}
                                className={`inline-flex max-w-full items-center gap-1 rounded-[10px] px-3 py-1.5 text-xs lg:text-sm ${isDark ? "bg-[#2A2A2A] text-white" : "bg-[#F4F5F7] text-black"}`}
                              >
                                <span className="truncate max-w-[160px]">{item.label}</span>
                                <span className={`${isDark ? "text-white/60" : "text-black/60"}`}>x{item.count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isVideoEditOpen ? (
                        <ChevronUp className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
                      ) : (
                        <ChevronDown className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
                      )}
                    </button>
                    {isVideoEditOpen && (
                      <div className={`px-4 py-2 border-t ${isDark ? "border-white/10" : "border-black/10"}`}>
                        {videoEditTypeOptions.map((option) => {
                          const count = videoEditCounts[option.key] || 0;
                          return (
                            <div
                              key={option.key}
                              className={`flex items-center justify-between gap-4 py-3 border-b last:border-0 ${isDark ? "border-white/10" : "border-black/10"}`}
                            >
                              <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>{option.value}</span>
                              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <QuantityControl
                                  value={count}
                                  onDecrease={() => updateEditQuantity("video", option.key, Math.max(0, count - 1))}
                                  onIncrease={() => updateEditQuantity("video", option.key, count + 1)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {formData.contentType.includes("photographer") && photoEditTypeOptions.length > 0 && (
                  <div className={`self-start rounded-[24px] border overflow-hidden ${isDark ? "bg-[#171717] border-white/10" : "bg-white border-black/10 shadow-sm"}`}>
                    <button
                      type="button"
                      className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                      onClick={handlePhotoEditToggle}
                    >
                      <div className="min-w-0 flex flex-1 items-center gap-3">
                        <p className={`shrink-0 text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Photo Edit Type</p>
                        {photoEditSummaryItems.length > 0 && (
                          <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                            {photoEditSummaryItems.map((item) => (
                              <span
                                key={item.key}
                                className={`inline-flex max-w-full items-center gap-1 rounded-[10px] px-3 py-1.5 text-xs lg:text-sm ${isDark ? "bg-[#2A2A2A] text-white" : "bg-[#F4F5F7] text-black"}`}
                              >
                                <span className="truncate max-w-[160px]">{item.label}</span>
                                <span className={`${isDark ? "text-white/60" : "text-black/60"}`}>x{item.count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isPhotoEditOpen ? (
                        <ChevronUp className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
                      ) : (
                        <ChevronDown className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
                      )}
                    </button>
                    {isPhotoEditOpen && (
                      <div className={`px-4 py-2 border-t ${isDark ? "border-white/10" : "border-black/10"}`}>
                        {photoEditTypeOptions.map((option) => {
                          const count = photoEditCounts[option.key] || 0;
                          return (
                            <div
                              key={option.key}
                              className={`flex items-center justify-between gap-4 py-3 border-b last:border-0 ${isDark ? "border-white/10" : "border-black/10"}`}
                            >
                              <div>
                                <div className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>{option.value}</div>
                                <div className={`${isDark ? "text-white/40" : "text-black/40"} text-xs mt-1`}>+25 Photos Per Set</div>
                              </div>
                              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                <QuantityControl
                                  value={count}
                                  onDecrease={() => updateEditQuantity("photo", option.key, Math.max(0, count - 1))}
                                  onIncrease={() => updateEditQuantity("photo", option.key, count + 1)}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {photoEditNote && (
                          <div className={`pt-3 pb-2 flex items-start gap-2 text-sm ${isDark ? "text-[#E8D1AB]" : "text-[#919191]"}`}>
                            <Info size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{photoEditNote}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3 pt-2 pb-3">
                          <div className={`rounded-xl px-4 py-3 text-sm ${isDark ? "bg-[#211F1C] text-[#E8D1AB]" : "bg-[#F4F5F7] text-black/80"}`}>
                            Includes {photoEditSummary.includedCount} free photo edits
                          </div>
                          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${isDark ? "bg-white text-[#171717]" : "bg-black text-white"}`}>
                            {totalDurationHours} Hour Duration
                          </div>
                          <div className={`rounded-xl px-4 py-3 text-sm ${isDark ? "bg-[#211F1C] text-[#E8D1AB]" : "bg-[#F4F5F7] text-black/80"}`}>
                            + {photoEditSummary.extraCount} Added Extra
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* <DottedDivider /> */}

        <div ref={extraTeamRef} className="my-4 lg:my-9">
          <div className="flex flex-col gap-3 lg:gap-6">
            <h3 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black/90"} `}>Would you like to add additional creatives?</h3>
            <div className="flex gap-2 lg:gap-6">
              <button
                onClick={() => updateData({ addTeamMembers: true })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${formData.addTeamMembers
                  ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                  : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"}`}
              >
                <span className="font-medium text-sm lg:text-lg">Yes</span>
                <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${formData.addTeamMembers ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")}`}>
                  {formData.addTeamMembers && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                </div>
              </button>
              <button
                onClick={() => { updateData({ addTeamMembers: false }); setExtraTeam({}); updateData({ teamIncluded: [] }); }}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!formData.addTeamMembers
                  ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                  : isDark ? "bg-[#101010] border-white/10 text-[#A9A9A9]" : "bg-transparent border-[#0000004D] text-[#2C2C2C]"}`}
              >
                <span className="font-medium text-sm lg:text-lg">No</span>
                <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!formData.addTeamMembers ? "bg-black" : (isDark ? "border border-[#E5E5E5]" : "border border-[#0000004D]")}`}>
                  {!formData.addTeamMembers && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                </div>
              </button>
            </div>
          </div>

          {formData.addTeamMembers && (
            <div className={`${isDark ? "bg-[#171717] border-white/5" : "bg-white border-black/10 shadow-sm"} rounded-[20px] p-3 lg:p-6 border border-white/5 animate-in slide-in-from-top-4 mt-4 md:mt-6`}>
              <div className="flex flex-col gap-4">
                {availableRolesToAdd.length > 0 ? (
                  availableRolesToAdd.map((role) => (
                    <div key={role.id} className={`flex items-center justify-between py-4 border-b last:border-0 ${isDark ? "border-white/5" : "border-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-white/5 text-white/60" : "bg-black/5 text-black/60"}`}>
                          {role.icon}
                        </div>
                        <div className={`text-lg font-medium ${isDark ? "text-white" : "text-[#2C2C2C]"}`}>{role.label}</div>
                      </div>
                      <QuantityControl
                        value={extraTeam[role.id] || 0}
                        onIncrease={() => handleExtraTeamChange(role.id, 1)}
                        onDecrease={() => handleExtraTeamChange(role.id, -1)}
                      />
                    </div>
                  ))
                ) : (
                  <p className={`${isDark ? "text-white/40" : "text-[#2C2C2C]"} italic`}>No eligible roles to add based on your selection.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* <DottedDivider /> */}

        <div ref={locationRef} className="my-4 lg:my-9">
          <h3 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black/90"} mb-6`}>Select Location</h3>
          <LocationPicker
            value={formData.location}
            onChange={(address, details) => {
              updateData({
                location: address,
                locationDetails: details
              });
            }}
            placeholder="Search for a location"
            colors={isDark ? darkThemeColors : undefined}
          />
        </div>
        {/* <DottedDivider /> */}

        <div ref={crewRef} className="my-4 lg:my-9 space-y-6">
          {!formData.startDate || !formData.location ? (
            <div className={`p-10 border border-dashed rounded-2xl text-center ${isDark ? "border-white/20 text-white/40" : "border-black/20 text-black/60"}`}>
              Please select a shoot date and location to view available creatives.
            </div>
          ) : (
            <CreativeProfileSelector
              selectedIds={formData.selectedCrewIds || []}
              onChange={(ids) => updateData({ selectedCrewIds: ids })}
              onSelectionUpdate={setSelectionCounts}
              creatives={crewList.map(cp => ({
                id: cp.crew_member_id,
                first_name: cp.first_name,
                last_name: cp.last_name,
                role: cp.role,
                location: cp.location,
                rating: cp.rating,
                hourly_rate: cp.hourly_rate,
                is_beige_member: cp.is_beige_member,
                assigned_shoots: cp.assigned_shoots,
                status: cp.status,
                profile_photo: cp.profile_photo,
              }))}
              isLoading={isLoadingCrew}
              emptyMessage="No matching professionals found for this date/location."
              videographerCount={reqCounts.videographer}
              photographerCount={reqCounts.photographer}
            />
          )}
        </div>
        {/* <DottedDivider /> */}

        <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-4 lg:pt-9">
          <Button
            onClick={() => router.back()}
            className={`h-14 lg:h-[72px] border  font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] ${isDark ? "border-[#8E8E8E] hover:bg-[#1A1A1A] text-white" : "bg-[#FFF] border-[#E3E3E3] text-[#323232] hover:bg-[#1A1A1A]/10"}`}
          >
            Back
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleContinueClick}
            className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Continue"}
          </Button>
        </div>
      </div>
    </>
  );
}
