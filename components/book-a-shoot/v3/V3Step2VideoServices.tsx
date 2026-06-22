"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Check, Info, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    videoShootTypes,
    socialContentEditTypes,
    corporateEventPhotoEditTypes,
    weddingEditTypes,
    weddingPhotoEditTypes,
    musicEditTypes,
    musicPhotoEditTypes,
    commercialEditTypes,
    commercialPhotoEditTypes,
    corporateEventEditTypes,
    privateEventEditTypes,
    privateEventPhotoEditTypes,
    socialContentPhotoEditTypes,
    podcastEditTypes,
    shortFilmEditTypes,
    movieEditTypes,
    tvSeriesEditTypes,
} from "@/app/data/shootData";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import DatePicker from "@/components/ui/Datepicker";
import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    set,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { parseDate } from "@/src/components/landing/lib/utils";
import { getFormattedDateString } from "@/lib/utils";
import { getPhotoEditSummary, getTotalDurationHours, PHOTO_EDIT_ADDON_SET_SIZE } from "./utils";
import { useUpdateBookingCrewMutation } from "@/lib/redux/features/sales/salesApi";
import { getSelectedStudiosTotal, normalizeSelectedStudios } from "./studioData";
import { toast } from "sonner";


const buildStudioDetails = (data: BookingDataV3) => {
    const selectedStudios = normalizeSelectedStudios(data);
    const primaryStudio = selectedStudios[0];
    if (!primaryStudio) return null;
    return {
        studio_id: primaryStudio.studioId,
        studio_name: primaryStudio.name,
        studio_location: primaryStudio.location,
        package: primaryStudio.pricingLabel || primaryStudio.priceLabel || "Studio Rental",
        slot: primaryStudio.startTime && primaryStudio.endTime ? `${primaryStudio.startTime} - ${primaryStudio.endTime}` : undefined,
        duration: primaryStudio.quantity || 0,
        price: primaryStudio.totalPrice || getSelectedStudiosTotal(selectedStudios),
        selected_studios: selectedStudios,
    };
};

const buildVideographyDetails = (data: BookingDataV3) => ({
    package: data.studioShootType || data.shootType || "Basic Videography",
    duration: 8,
    eventType: data.studioShootType || data.shootType || "Video Production",
    price: 0,
    addons: data.videoEditTypes || [],
});
interface Props {
    data: BookingDataV3;
    updateData: (data: Partial<BookingDataV3>) => void;
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

export const V3Step2VideoServices: React.FC<Props> = ({
    data,
    updateData,
    onNext,
    onBack,
}) => {
    const [updateBookingCrew] = useUpdateBookingCrewMutation();
    // â”€â”€â”€ Shoot Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const shootTypes = videoShootTypes;

    // â”€â”€â”€ Same day videography â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [sameDay, setSameDay] = useState<boolean>(
        data.startDate ? true : false
    );
    const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(
        data.bookingType || "single_day"
    );
    const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(
        data.startDate ? parseDate(data.startDate) : null
    );
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
    const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
    const [multiDayTimes, setMultiDayTimes] = useState<
        Record<string, { startKey?: string; endKey?: string }>
    >({});
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(
        new Date()
    );
    const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);

    // â”€â”€â”€ Edits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [openEditPanel, setOpenEditPanel] = useState<"video" | "photo" | null>(null);
    const videoEditDropdownRef = useRef<HTMLDivElement>(null);
    const photoEditDropdownRef = useRef<HTMLDivElement>(null);

    const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
    const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
    const [photoEditNote, setPhotoEditNote] = useState("");

    const [errors, setErrors] = useState<string[]>([]);
    const shootTypeRef = useRef<HTMLDivElement>(null);
    const dateTimeRef = useRef<HTMLDivElement>(null);
    const editsRef = useRef<HTMLDivElement>(null);
    const selectedVideoShootType = data.studioShootType || "";

    // â”€â”€â”€ Reel drag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const reelRef = useRef<HTMLDivElement>(null);
    const isDraggingReel = useRef(false);
    const didDragReel = useRef(false);
    const suppressChipClickUntil = useRef(0);
    const dragStartX = useRef(0);
    const dragStartScrollLeft = useRef(0);
    const dateChipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const selectedDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const calendarRef = useRef<HTMLDivElement>(null);

    // â”€â”€â”€ Build time options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const opts: { key: string; value: string }[] = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const h = i.toString().padStart(2, "0");
                const m = j.toString().padStart(2, "0");
                const key = `${h}:${m}`;
                const date = new Date();
                date.setHours(i, j);
                opts.push({ key, value: format(date, "h:mm aa") });
            }
        }
        setTimeOptions(opts);
    }, []);

    // â”€â”€â”€ Edit options from shoot type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const st = selectedVideoShootType;
        let vo: { key: string; value: string }[] = [];
        let po: { key: string; value: string }[] = [];
        let pn = "25 edited photos per hour";

        switch (st) {
            case "wedding": vo = weddingEditTypes; po = weddingPhotoEditTypes; pn = "50 edited photos per hour for weddings"; break;
            case "music": vo = musicEditTypes; po = musicPhotoEditTypes; break;
            case "commercial": vo = commercialEditTypes; po = commercialPhotoEditTypes; break;
            case "tv": vo = tvSeriesEditTypes; break;
            case "podcast": vo = podcastEditTypes; break;
            case "short_film": vo = shortFilmEditTypes; break;
            case "movie": vo = movieEditTypes; break;
            case "corporate": vo = corporateEventEditTypes; po = corporateEventPhotoEditTypes; break;
            case "private": vo = privateEventEditTypes; po = privateEventPhotoEditTypes; break;
            case "social_content": vo = socialContentEditTypes; po = socialContentPhotoEditTypes; break;
            default: vo = socialContentEditTypes; po = corporateEventPhotoEditTypes; break;
        }

        const hasPhoto = data.contentType.includes("photographer");
        if (vo.length === 0) vo = socialContentEditTypes;

        setEditTypeOptions(vo);
        setPhotoEditTypeOptions(po);
        setPhotoEditNote(pn);
    }, [selectedVideoShootType, data.contentType]);

    // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

    const formatLocalDateTime = (date: Date) =>
        format(date, "yyyy-MM-dd'T'HH:mm:ss");

    const getStartTimeKey = () => {
        if (!data.startDate) return "";
        const d = parseDate(data.startDate);
        return d ? format(d, "HH:mm") : "";
    };

    const getEndTimeKey = () => {
        if (!data.endDate) return "";
        const d = parseDate(data.endDate);
        return d ? format(d, "HH:mm") : "";
    };

    const getTimeLabel = (key: string) =>
        timeOptions.find((o) => o.key === key)?.value || key;

    const calculateDurationHours = (startKey: string, endKey: string) => {
        if (!startKey || !endKey) return null;
        const [sh, sm] = startKey.split(":").map(Number);
        const [eh, em] = endKey.split(":").map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff <= 0) return null;
        return Math.round((diff / 60) * 100) / 100;
    };

    const filteredStartTimeOptions = React.useMemo(() => {
        const selDate = data.startDate ? parseDate(data.startDate) : selectedShootDate;
        if (!selDate) return timeOptions;
        const now = new Date();
        const isToday =
            selDate.getDate() === now.getDate() &&
            selDate.getMonth() === now.getMonth() &&
            selDate.getFullYear() === now.getFullYear();
        if (!isToday) return timeOptions;
        const minKey = format(new Date(now.getTime() + 4 * 60 * 60 * 1000), "HH:mm");
        return timeOptions.filter((o) => o.key >= minKey);
    }, [data.startDate, selectedShootDate, timeOptions]);

    const filteredEndTimeOptions = React.useMemo(() => {
        if (!data.startDate) return timeOptions;
        return timeOptions.filter((o) => o.key > getStartTimeKey());
    }, [data.startDate, timeOptions]);

    const isTodayDate = useCallback((date: Date) => {
        const now = new Date();
        return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }, []);

    const getDateFromDateKey = useCallback((dateKey: string) => {
        const parsed = new Date(`${dateKey}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, []);

    const getDateSpecificStartOptions = useCallback((dateKey: string) => {
        const date = getDateFromDateKey(dateKey);
        if (!date || !isTodayDate(date)) return timeOptions;
        const minKey = format(new Date(Date.now() + 4 * 60 * 60 * 1000), "HH:mm");
        return timeOptions.filter((o) => o.key >= minKey);
    }, [getDateFromDateKey, isTodayDate, timeOptions]);

    const getDateSpecificEndOptions = useCallback((dateKey: string) => {
        const dayStartKey = multiDayTimes[dateKey]?.startKey;
        if (!dayStartKey) return getDateSpecificStartOptions(dateKey);
        return getDateSpecificStartOptions(dateKey).filter((o) => o.key > dayStartKey);
    }, [getDateSpecificStartOptions, multiDayTimes]);

    const buildDateTimeString = useCallback((date: Date, timeKey: string) => {
        const [hours, minutes] = timeKey.split(":").map(Number);
        return formatLocalDateTime(set(date, { hours, minutes, seconds: 0, milliseconds: 0 }));
    }, []);

    const reelDays = React.useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(currentCalendarMonth);
        const monthEnd = endOfMonth(currentCalendarMonth);
        const start = isSameMonth(currentCalendarMonth, now) && now > monthStart ? startOfDay(now) : monthStart;
        if (start > monthEnd) return [];
        return eachDayOfInterval({ start, end: monthEnd });
    }, [currentCalendarMonth]);

    const calendarDays = React.useMemo(() => {
        const start = startOfWeek(startOfMonth(currentCalendarMonth));
        const end = endOfWeek(endOfMonth(currentCalendarMonth));
        return eachDayOfInterval({ start, end });
    }, [currentCalendarMonth]);

    // â”€â”€â”€ Date change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleDateChange = (date: Date | null) => {
        if (!date) { setSelectedShootDate(null); updateData({ startDate: "", endDate: "" }); return; }
        setSelectedShootDate(date);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        let finalStart: Date;
        let finalEnd: Date;
        if (isToday) {
            const minStart = new Date(now.getTime() + 4 * 60 * 60 * 1000);
            const mins = minStart.getMinutes();
            if (mins > 0 && mins <= 30) minStart.setMinutes(30, 0, 0);
            else if (mins > 30) minStart.setHours(minStart.getHours() + 1, 0, 0, 0);
            else minStart.setMinutes(0, 0, 0);
            finalStart = minStart;
            finalEnd = new Date(finalStart.getTime() + 8 * 60 * 60 * 1000);
        } else {
            finalStart = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
            finalEnd = set(date, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
        }
        updateData({ startDate: formatLocalDateTime(finalStart), endDate: formatLocalDateTime(finalEnd) });
    };

    const handleStartTimeChange = (timeKey: string) => {
        if (!timeKey) { updateData({ startDate: "" }); return; }
        const [hours, minutes] = timeKey.split(":").map(Number);
        const currentDate = data.startDate ? parseDate(data.startDate) : selectedShootDate || new Date();
        if (!currentDate) return;
        updateData({ startDate: formatLocalDateTime(set(currentDate, { hours, minutes })) });
    };

    const handleEndTimeChange = (timeKey: string) => {
        if (!timeKey) { updateData({ endDate: "" }); return; }
        const [hours, minutes] = timeKey.split(":").map(Number);
        const baseDate = data.startDate ? parseDate(data.startDate) : selectedShootDate || new Date();
        if (!baseDate) return;
        updateData({ endDate: formatLocalDateTime(set(new Date(baseDate), { hours, minutes, seconds: 0, milliseconds: 0 })) });
    };

    const toggleDateSelection = (date: Date) => {
        const clickedDateKey = getDateKey(date);
        setSelectedDates((prev) => {
            const exists = prev.some((d) => isSameDay(d, date));
            return exists ? prev.filter((d) => !isSameDay(d, date)) : [...prev, date].sort((a, b) => a.getTime() - b.getTime());
        });
        setSelectedShootDate(date);
        requestAnimationFrame(() => {
            dateChipRefs.current[clickedDateKey]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
    };

    const handleSameTimingsModeChange = (useSameTimings: boolean) => {
        setSameTimingsMulti(useSameTimings);
        setExpandedDateKey(null);
        if (useSameTimings) {
            const firstDate = selectedDates[0];
            const firstTiming = firstDate ? multiDayTimes[getDateKey(firstDate)] : undefined;
            if (firstDate && firstTiming?.startKey && firstTiming?.endKey) {
                updateData({
                    startDate: buildDateTimeString(firstDate, firstTiming.startKey),
                    endDate: buildDateTimeString(firstDate, firstTiming.endKey),
                });
            }
        } else {
            const startKey = getStartTimeKey();
            const endKey = getEndTimeKey();
            setMultiDayTimes(selectedDates.reduce<Record<string, { startKey?: string; endKey?: string }>>((acc, d) => {
                const dk = getDateKey(d);
                acc[dk] = multiDayTimes[dk] || { startKey, endKey };
                return acc;
            }, {}));
        }
    };

    // â”€â”€â”€ Sync bookingDays â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (bookingType !== "multi_day" || !selectedDates.length) return;
        const startKey = getStartTimeKey();
        const endKey = getEndTimeKey();
        const days = selectedDates.map((date) => {
            const dk = getDateKey(date);
            const dayTimes = multiDayTimes[dk] || {};
            return {
                date: dk,
                startTime: sameTimingsMulti ? startKey : dayTimes.startKey,
                endTime: sameTimingsMulti ? endKey : dayTimes.endKey,
            };
        });
        updateData({ bookingDays: days });
    }, [bookingType, selectedDates, data.startDate, data.endDate, sameTimingsMulti, multiDayTimes]);

    // â”€â”€â”€ Edit quantity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const buildEditCounts = (keys: string[]) =>
        keys.reduce<Record<string, number>>((acc, key) => { acc[key] = (acc[key] || 0) + 1; return acc; }, {});

    const videoEditCounts = React.useMemo(() => buildEditCounts(data.videoEditTypes), [data.videoEditTypes]);
    const photoEditCounts = React.useMemo(() => buildEditCounts(data.photoEditTypes), [data.photoEditTypes]);

    const durationHours = React.useMemo(
        () => getTotalDurationHours(data.bookingType, data.startDate, data.endDate, data.bookingDays),
        [data.bookingType, data.startDate, data.endDate, data.bookingDays]
    );

    const photoEditSetCount = photoEditCounts.edited_photos || 0;
    const photoEditSummary = React.useMemo(
        () => getPhotoEditSummary({ shootType: selectedVideoShootType, durationHours, selectedAddOnSets: photoEditSetCount }),
        [selectedVideoShootType, durationHours, photoEditSetCount]
    );

    const getEditSummaryItems = (counts: Record<string, number>, options: { key: string; value: string }[]) =>
        Object.entries(counts).map(([key, count]) => ({
            key, count, label: options.find((o) => o.key === key)?.value || key,
        }));

    const videoEditSummaryItems = React.useMemo(() => getEditSummaryItems(videoEditCounts, editTypeOptions), [videoEditCounts, editTypeOptions]);
    const photoEditSummaryItems = React.useMemo(() => getEditSummaryItems(photoEditCounts, photoEditTypeOptions), [photoEditCounts, photoEditTypeOptions]);

    const updateEditQuantity = (type: "video" | "photo", key: string, nextQty: number) => {
        const base = type === "video" ? data.videoEditTypes : data.photoEditTypes;
        const cleaned = base.filter((k) => k !== key);
        const next = nextQty > 0 ? [...cleaned, ...Array.from({ length: nextQty }, () => key)] : cleaned;
        updateData(type === "video" ? { videoEditTypes: next } : { photoEditTypes: next });
    };

    const receiveSummaryText = [
        data.contentType.includes("photographer") ? `${photoEditSummary.totalCount} Photos` : null,
        data.videoEditTypes.length > 0 ? `${data.videoEditTypes.length} Videos` : null,
    ].filter(Boolean).join(" + ");

    // â”€â”€â”€ Outside click close edit panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const handlePointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (openEditPanel === "video" && videoEditDropdownRef.current && !videoEditDropdownRef.current.contains(target)) setOpenEditPanel(null);
            if (openEditPanel === "photo" && photoEditDropdownRef.current && !photoEditDropdownRef.current.contains(target)) setOpenEditPanel(null);
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [openEditPanel]);

    // â”€â”€â”€ Validate & next â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const validate = () => {
        if (!selectedVideoShootType) {
            setErrors(["shootTypeError"]);
            shootTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
        if (sameDay) {
            if (bookingType === "single_day") {
                if (!data.startDate || !data.endDate) {
                    setErrors(["timeError"]);
                    dateTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return false;
                }
                if (new Date(data.endDate) <= new Date(data.startDate)) {
                    setErrors(["timeError"]);
                    dateTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return false;
                }
            } else {
                if (!data.bookingDays || data.bookingDays.length === 0 || data.bookingDays.some((d) => !d.startTime || !d.endTime)) {
                    setErrors(["timeError"]);
                    dateTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return false;
                }
            }
        }
        if (data.editsNeeded && data.videoEditTypes.length === 0 && editTypeOptions.length > 0) {
            setErrors(["videoEditError"]);
            editsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
        return true;
    };

    const handleNext = async () => {
        if (!validate()) return;
        const videographyCount = data.contentType.includes("videographer") ? 1 : 0;
        const photographyCount = data.contentType.includes("photographer") ? 1 : 0;
        const studioDetails = buildStudioDetails(data);
        const videographyDetails = buildVideographyDetails(data);
        const studioCount = Math.max(1, data.selectedStudios?.length || data.selectedStudioIds?.length || 1);

        if (data.bookingId) {
            try {
                await updateBookingCrew({
                    booking_id: data.bookingId,
                    serviceType: "videography_studios",
                    crew_roles: {
                        videographer: Math.max(1, videographyCount || 1),
                        studio: studioCount,
                    },
                    location: studioDetails?.studio_location || data.location,
                    description: data.specialInstructions,
                    reference_links: data.referenceLinks,
                    studio_details: studioDetails,
                    videography_details: videographyDetails,
                    pricing: studioDetails ? {
                        studioPrice: studioDetails.price,
                        videographyPrice: Number(videographyDetails.price || 0),
                        total: Number(studioDetails.price || 0) + Number(videographyDetails.price || 0),
                    } : undefined,
                }).unwrap();
            } catch (error) {
                console.error("Failed to save video studio crew details:", error);
                toast.error("Failed to save project details");
                return;
            }
        }

        updateData({
            roleCounts: {
                videographer: Math.max(1, videographyCount || 1),
                photographer: photographyCount,
                studio: studioCount,
            },
            videographyCount: Math.max(1, videographyCount || 1),
            photographyCount,
            crewCount: Math.max(1, videographyCount || 1) + photographyCount + studioCount,
        });
        onNext();
    };

    return (
        <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center">
                <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
                    Videography Services
                </h2>
                <p className="text-white/60">Choose your shoot type, timing, and editing preference for your project.</p>
            </div>

            {/* â”€â”€ Video Shoot Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div ref={shootTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
                <h3 className={`text-base lg:text-xl font-medium mb-4 ${errors.includes("shootTypeError") ? "text-red-400" : "text-white/90"}`}>
                    Video Shoot Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                    {shootTypes.map((type) => {
                        const selected = selectedVideoShootType === type.key;
                        return (
                            <div
                                key={type.key}
                                className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-start"
                            >
                                <ShootTypeCard
                                    title={type.title}
                                    details={type.details || "Video production"}
                                    image={type.image || "/images/projects/interior.png"}
                                    selected={selected}
                                    onClick={() => {
                                        updateData({ studioShootType: type.key });
                                        setErrors((prev) => prev.filter((e) => e !== "shootTypeError"));
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* â”€â”€ Same day videography â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div ref={dateTimeRef} className="pt-6 lg:pt-15 border-t border-white/10">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-4">
                    Do you want your videography service booking day and time?
                </h3>
                <div className="flex gap-4 mb-6">
                    {[{ label: "Yes", value: true }, { label: "It same", value: false }].map((opt) => (
                        <button
                            key={opt.label}
                            type="button"
                            onClick={() => setSameDay(opt.value)}
                            className={`h-14 lg:h-[60px] px-6 rounded-2xl border flex items-center justify-between gap-3 transition-all ${sameDay === opt.value
                                    ? "bg-[#E8D1AB] border-transparent text-black"
                                    : "bg-[#101010] border-white/10 text-[#A9A9A9]"
                                }`}
                        >
                            <span className="font-medium text-sm">{opt.label}</span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${sameDay === opt.value ? "bg-black" : "border border-white/30"}`}>
                                {sameDay === opt.value && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                            </div>
                        </button>
                    ))}
                </div>

                {sameDay && (
                    <div className="flex flex-col gap-3">
                        {/* Single Day accordion */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => { setBookingType("single_day"); updateData({ bookingType: "single_day", bookingDays: [] }); }}
                                className="w-full flex items-center justify-between px-5 py-4 bg-[#101010]"
                            >
                                <span className="text-white font-medium text-sm">Single Day</span>
                                {bookingType === "single_day" ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                            </button>
                            <AnimatePresence>
                                {bookingType === "single_day" && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="p-5 bg-[#0D0D0D] border-t border-white/10">
                                            <p className="text-white/50 text-xs mb-4">Edit Date and Time</p>
                                            <div className="flex flex-col lg:flex-row gap-4 items-end">
                                                <div className="flex-1">
                                                    <DatePicker
                                                        label="Select Date"
                                                        value={selectedShootDate}
                                                        onChange={handleDateChange}
                                                        minDate={new Date()}
                                                        colors={datePickerColours}
                                                        format="MM/dd/yyyy"
                                                        sx={{ height: { xs: "56px", lg: "82px" }, borderRadius: "16px" }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <DropdownSelect title="Start Time" options={filteredStartTimeOptions} value={getStartTimeKey()} onChange={handleStartTimeChange} bgColour="bg-[#101010]" selectedDisplay="plain" />
                                                </div>
                                                <div className="flex-1">
                                                    <DropdownSelect title="End Time" options={filteredEndTimeOptions} value={getEndTimeKey()} onChange={handleEndTimeChange} bgColour="bg-[#101010]" selectedDisplay="plain" />
                                                </div>
                                            </div>
                                            {getStartTimeKey() && getEndTimeKey() && (
                                                <div className="mt-3 inline-flex rounded-lg bg-[#211F1C] px-4 py-2">
                                                    <p className="text-[#E8D1AB] text-sm font-medium">
                                                        Duration : {calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Multiple Days accordion */}
                        <div className="border border-white/10 rounded-2xl overflow-visible">
                            <button
                                type="button"
                                onClick={() => { setBookingType("multi_day"); updateData({ bookingType: "multi_day" }); }}
                                className="w-full flex items-center justify-between px-5 py-4 bg-[#101010] rounded-2xl"
                            >
                                <span className="text-white font-medium text-sm">Multiple Days</span>
                                {bookingType === "multi_day" ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                            </button>
                            <AnimatePresence>
                                {bookingType === "multi_day" && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-visible">
                                        <div className="p-5 bg-[#0D0D0D] border-t border-white/10">
                                            {/* Month header */}
                                            <div className="flex justify-between items-center mb-4 relative">
                                                <p className="text-white/50 text-xs">Select Date</p>
                                                <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 text-white font-medium text-sm hover:text-[#E8D1AB] transition-colors">
                                                    {format(currentCalendarMonth, "MMMM yyyy")}
                                                    <Calendar size={16} />
                                                </button>
                                                {/* Calendar popover */}
                                                <AnimatePresence>
                                                    {isCalendarOpen && (
                                                        <motion.div ref={calendarRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                            className="absolute right-0 top-8 z-50 bg-[#111] border border-white/10 p-4 rounded-2xl shadow-2xl w-[300px]">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <button type="button" onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}>
                                                                    <ChevronLeft size={18} className="text-white" />
                                                                </button>
                                                                <span className="text-white font-bold text-sm">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <button type="button" onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}>
                                                                        <ChevronRight size={18} className="text-white" />
                                                                    </button>
                                                                    <button type="button" onClick={() => setIsCalendarOpen(false)} className="p-1 rounded-full hover:bg-white/10">
                                                                        <X size={16} className="text-white" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40 mb-2 uppercase font-bold">
                                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d}>{d}</div>)}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1">
                                                                {calendarDays.map((date) => {
                                                                    const isSel = selectedDates.some((d) => isSameDay(d, date));
                                                                    return (
                                                                        <button key={date.toISOString()} type="button"
                                                                            onClick={() => toggleDateSelection(date)}
                                                                            className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-colors ${isSel ? "bg-[#E8D1AB] text-black" : "text-white hover:bg-white/10"} ${!isSameMonth(date, currentCalendarMonth) ? "opacity-20" : ""}`}>
                                                                            {format(date, "d")}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Date reel */}
                                            <div
                                                ref={reelRef}
                                                onWheel={(e) => { if (!reelRef.current) return; e.preventDefault(); reelRef.current.scrollLeft += e.deltaY; }}
                                                onPointerDown={(e) => { isDraggingReel.current = true; didDragReel.current = false; dragStartX.current = e.clientX; if (reelRef.current) dragStartScrollLeft.current = reelRef.current.scrollLeft; }}
                                                onPointerMove={(e) => { if (!reelRef.current || !isDraggingReel.current) return; const dx = e.clientX - dragStartX.current; if (Math.abs(dx) > 8) { didDragReel.current = true; reelRef.current.scrollLeft = dragStartScrollLeft.current - dx; } }}
                                                onPointerUp={() => { isDraggingReel.current = false; if (didDragReel.current) suppressChipClickUntil.current = Date.now() + 150; setTimeout(() => { didDragReel.current = false; }, 0); }}
                                                onPointerLeave={() => { isDraggingReel.current = false; }}
                                                className="flex gap-2 overflow-x-auto pb-3 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                                            >
                                                {reelDays.map((date) => {
                                                    const isSelected = selectedDates.some((d) => isSameDay(d, date));
                                                    return (
                                                        <button type="button" key={date.toISOString()}
                                                            ref={(el) => { dateChipRefs.current[getDateKey(date)] = el; }}
                                                            onClick={() => { if (Date.now() < suppressChipClickUntil.current) return; toggleDateSelection(date); }}
                                                            className={`shrink-0 flex flex-col items-center justify-center w-[60px] lg:w-[100px] h-[60px] lg:h-[100px] rounded-full border transition-all ${isSelected ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-transparent border-white/10 text-white/40 hover:border-white/30"}`}>
                                                            <span className="text-base lg:text-2xl font-bold">{format(date, "d")}</span>
                                                            <span className="text-[9px] lg:text-xs uppercase font-medium">{format(date, "EEE")}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex gap-3 mt-3">
                                                <div className="rounded-lg bg-[#211F1C] px-4 py-2">
                                                    <p className="text-[#E8D1AB] text-xs font-medium">Total Days: {selectedDates.length}</p>
                                                </div>
                                                <div className="rounded-lg bg-[#211F1C] px-4 py-2">
                                                    <p className="text-[#E8D1AB] text-xs font-medium">Selected Days: {getFormattedDateString(selectedDates)}</p>
                                                </div>
                                            </div>

                                            {selectedDates.length > 0 && (
                                                <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                                                    <h4 className="text-white font-medium text-sm">Are timings same for all selected dates?</h4>
                                                    <div className="flex gap-3">
                                                        {[{ label: "Yes", val: true }, { label: "No", val: false }].map((opt) => (
                                                            <button key={opt.label} type="button" onClick={() => handleSameTimingsModeChange(opt.val)}
                                                                className={`h-12 px-6 rounded-2xl border flex items-center justify-between gap-3 transition-all ${sameTimingsMulti === opt.val ? "bg-[#E8D1AB] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}>
                                                                <span className="font-medium text-sm">{opt.label}</span>
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${sameTimingsMulti === opt.val ? "bg-black" : "border border-white/30"}`}>
                                                                    {sameTimingsMulti === opt.val && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {sameTimingsMulti ? (
                                                        <div>
                                                            <div className="flex flex-col lg:flex-row gap-4">
                                                                <div className="flex-1">
                                                                    <DropdownSelect title="Start Time" options={filteredStartTimeOptions} value={getStartTimeKey()} onChange={handleStartTimeChange} bgColour="bg-[#101010]" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <DropdownSelect title="End Time" options={filteredEndTimeOptions} value={getEndTimeKey()} onChange={handleEndTimeChange} bgColour="bg-[#101010]" />
                                                                </div>
                                                            </div>
                                                            <p className="flex gap-2 mt-3 text-[#A9A9A9] text-sm">
                                                                <Check size={18} className="text-white shrink-0" /> Applied to {selectedDates.length} selected dates
                                                            </p>
                                                            <div className="mt-3 bg-[#171717] rounded-xl border border-white/20 p-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                                                                <p className="text-white font-medium text-sm">{getFormattedDateString(selectedDates)}</p>
                                                                <p className="text-white/60 text-sm">{getStartTimeKey() && getEndTimeKey() ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}` : "Select time"}</p>
                                                                <p className="text-[#E8D1AB] text-sm font-medium">
                                                                    {getStartTimeKey() && getEndTimeKey() && calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null
                                                                        ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hour / Day`
                                                                        : "Duration Hour/Day"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {selectedDates.map((date) => {
                                                                const dateKey = getDateKey(date);
                                                                const isExpanded = expandedDateKey === dateKey;
                                                                return (
                                                                    <div key={date.toISOString()} ref={(el) => { selectedDateCardRefs.current[dateKey] = el; }}
                                                                        className={`border border-white/10 rounded-2xl bg-[#171717] ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}>
                                                                        <button type="button" onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)}
                                                                            className={`w-full px-5 py-4 flex justify-between items-center ${isExpanded ? "border-b border-white/10" : ""}`}>
                                                                            <span className="text-white font-medium text-sm">{format(date, "MMMM dd, yyyy")}</span>
                                                                            <ChevronDown className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} size={16} />
                                                                        </button>
                                                                        <AnimatePresence>
                                                                            {isExpanded && (
                                                                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-[#101010] p-4 overflow-visible">
                                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                                        <DropdownSelect title="Start Time" options={getDateSpecificStartOptions(dateKey)} value={multiDayTimes[dateKey]?.startKey || ""} onChange={(v) => setMultiDayTimes((prev) => ({ ...prev, [dateKey]: { ...prev[dateKey], startKey: v } }))} bgColour="bg-[#101010]" />
                                                                                        <DropdownSelect title="End Time" options={getDateSpecificEndOptions(dateKey)} value={multiDayTimes[dateKey]?.endKey || ""} onChange={(v) => setMultiDayTimes((prev) => ({ ...prev, [dateKey]: { ...prev[dateKey], endKey: v } }))} bgColour="bg-[#101010]" />
                                                                                    </div>
                                                                                    <div className="mt-2 inline-flex rounded-lg bg-[#211F1C] px-4 py-2">
                                                                                        <p className="text-[#E8D1AB] text-xs font-medium">
                                                                                            Duration: {multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey
                                                                                                ? `${calculateDurationHours(multiDayTimes[dateKey].startKey!, multiDayTimes[dateKey].endKey!)} hours`
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* â”€â”€ Edits Needed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div ref={editsRef} className="pt-6 lg:pt-15 border-t border-white/10">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-4">Edits Needed?</h3>
                <div className="flex gap-4 mb-6">
                    {[{ label: "Yes", val: true }, { label: "No", val: false }].map((opt) => (
                        <button key={opt.label} type="button"
                            onClick={() => {
                                if (!opt.val) { setOpenEditPanel(null); updateData({ editsNeeded: false, videoEditTypes: [], photoEditTypes: [] }); }
                                else updateData({ editsNeeded: true });
                            }}
                            className={`h-14 lg:h-[60px] px-6 rounded-2xl border flex items-center justify-between gap-3 transition-all ${data.editsNeeded === opt.val ? "bg-[#E8D1AB] border-transparent text-black" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}>
                            <span className="font-medium text-sm">{opt.label}</span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${data.editsNeeded === opt.val ? "bg-black" : "border border-white/30"}`}>
                                {data.editsNeeded === opt.val && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                            </div>
                        </button>
                    ))}
                </div>

                {data.editsNeeded && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={18} className="text-white" />
                            <span className={`font-medium text-base ${errors.includes("videoEditError") || errors.includes("photoEditError") ? "text-red-400" : "text-white"}`}>
                                Editing includes
                            </span>
                        </div>
                        <p className="text-white/50 text-sm mb-6">Professional editing includes color grading, sound mixing, and basic revisions.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Video Edits */}
                            {editTypeOptions.length > 0 && (
                                <div ref={videoEditDropdownRef} className="self-start rounded-[24px] border border-white/10 bg-[#171717] overflow-hidden">
                                    <button type="button" className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                                        onClick={() => setOpenEditPanel((prev) => prev === "video" ? null : "video")}>
                                        <div className="min-w-0 flex flex-1 items-center gap-3">
                                            <span className="shrink-0 font-medium text-white text-base">Video Edits</span>
                                            {videoEditSummaryItems.length > 0 && (
                                                <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                                                    {videoEditSummaryItems.map((item) => (
                                                        <span key={item.key} className="inline-flex items-center gap-1 rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs text-white">
                                                            <span className="truncate max-w-[120px]">{item.label}</span>
                                                            <span className="text-white/50">x{item.count}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {openEditPanel === "video" ? <ChevronUp className="text-white shrink-0" size={18} /> : <ChevronDown className="text-white shrink-0" size={18} />}
                                    </button>
                                    {openEditPanel === "video" && (
                                        <div className="border-t border-white/10 px-5 py-3">
                                            {editTypeOptions.map((option) => {
                                                const count = videoEditCounts[option.key] || 0;
                                                return (
                                                    <div key={option.key} className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
                                                        <span className="text-sm text-white">{option.value}</span>
                                                        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                            <QuantityControl
                                                                value={count}
                                                                onDecrease={() => updateEditQuantity("video", option.key, Math.max(0, count - 1))}
                                                                onIncrease={() => updateEditQuantity("video", option.key, count + 1)}
                                                                className="h-[48px] min-w-[100px] rounded-[16px] px-4"
                                                                buttonClassName="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5"
                                                                valueClassName="min-w-[28px] text-[16px] font-semibold tabular-nums"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Photo Edits */}
                            {photoEditTypeOptions.length > 0 && (
                                <div ref={photoEditDropdownRef} className="self-start rounded-[24px] border border-white/10 bg-[#171717] overflow-hidden">
                                    <button type="button" className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left"
                                        onClick={() => setOpenEditPanel((prev) => prev === "photo" ? null : "photo")}>
                                        <div className="min-w-0 flex flex-1 items-center gap-3">
                                            <span className="shrink-0 font-medium text-white text-base">Photo Edits</span>
                                            {photoEditSummaryItems.length > 0 && (
                                                <div className="min-w-0 flex flex-nowrap gap-2 overflow-hidden">
                                                    {photoEditSummaryItems.map((item) => (
                                                        <span key={item.key} className="inline-flex items-center gap-1 rounded-[10px] bg-[#2A2A2A] px-3 py-1.5 text-xs text-white">
                                                            <span className="truncate max-w-[120px]">{item.label}</span>
                                                            <span className="text-white/50">x{item.count}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {openEditPanel === "photo" ? <ChevronUp className="text-white shrink-0" size={18} /> : <ChevronDown className="text-white shrink-0" size={18} />}
                                    </button>
                                    {openEditPanel === "photo" && (
                                        <div className="border-t border-white/10 px-5 py-3">
                                            {photoEditTypeOptions.map((option) => {
                                                const count = photoEditCounts[option.key] || 0;
                                                return (
                                                    <div key={option.key} className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
                                                        <div>
                                                            <div className="text-sm text-white">{option.value}</div>
                                                            <div className="text-xs text-white/40 mt-0.5">+{PHOTO_EDIT_ADDON_SET_SIZE} Photos Per Set</div>
                                                        </div>
                                                        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                            <QuantityControl
                                                                value={count}
                                                                onDecrease={() => updateEditQuantity("photo", option.key, Math.max(0, count - 1))}
                                                                onIncrease={() => updateEditQuantity("photo", option.key, count + 1)}
                                                                className="h-[48px] min-w-[100px] rounded-[16px] px-4"
                                                                buttonClassName="grid h-8 w-8 place-items-center rounded-full transition hover:bg-black/5"
                                                                valueClassName="min-w-[28px] text-[16px] font-semibold tabular-nums"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex flex-wrap gap-3 pt-4">
                                                {photoEditSummary.includedCount > 0 && (
                                                    <div className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm text-[#E8D1AB]">
                                                        Includes {photoEditSummary.includedCount} free photo edits
                                                    </div>
                                                )}
                                                <div className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#171717]">
                                                    {durationHours} Hour Duration
                                                </div>
                                                <div className="rounded-xl bg-[#211F1C] px-4 py-2 text-sm text-[#E8D1AB]">
                                                    + {photoEditSummary.extraCount} Added Extra
                                                </div>
                                            </div>
                                            {photoEditNote && (
                                                <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]">
                                                    <Info size={14} className="mt-0.5 shrink-0" />
                                                    <span>{photoEditNote}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* You'll receive banner */}
                        {receiveSummaryText && (
                            <div className="mt-6 inline-flex max-w-full items-center gap-3 rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black">
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-[#E8D1AB] shrink-0">
                                    <Image src="/images/misc/booking-sparkle.png" alt="" width={16} height={16} className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-semibold">You&apos;ll Receive {receiveSummaryText}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
                <Button
                    onClick={onBack}
                    className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
                >
                    Back
                </Button>
                <Button
                    onClick={handleNext}
                    className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};


