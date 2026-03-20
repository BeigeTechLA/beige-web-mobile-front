"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { set, format, differenceInHours, addDays, eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isSameMonth, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors, Info, Check, ChevronDown, ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentTypeCheckbox } from "@/components/book-a-shoot/v3/components/ContentTypeCheckbox";
import { MultiSelectDropdown } from "@/components/book-a-shoot";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";

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
import { parseDate } from "@/src/components/landing/lib/utils";
import { getBrowserTimeZone, getLocalDatePart, getLocalTimePart } from "@/lib/timezone";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { FloatingLabelDropdown } from "@/components/generic/FloatingLabelDropdown";
import { useUpdateLeadBookingMutation, useUpdateClientLeadBookingMutation } from "@/lib/redux/features/sales/salesApi";
import { IntentBadge } from "@/components/sales/IntentBadge";
import { getFormattedDateString } from "@/lib/utils";

const TEAM_ROLES = [
    { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> },
    { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> },
];

interface EditSalesBookingDetailsFormProps {
    leadId?: string | number;
    initialBookingData: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    isModal?: boolean;
    hideCreativeSelector?: boolean; // Set to true to hide crew selector (e.g. on shoot edit page)
    projectId?: string | number;
}

export default function EditSalesBookingDetailsForm({ leadId, initialBookingData, onSuccess, onCancel, isModal, hideCreativeSelector, projectId }: EditSalesBookingDetailsFormProps) {
    const router = useRouter();
    const contentTypeRef = useRef<HTMLDivElement>(null);
    const shootTypeRef = useRef<HTMLDivElement>(null);
    const dateTimeRef = useRef<HTMLDivElement>(null);
    const editsRef = useRef<HTMLDivElement>(null);
    const extraTeamRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);
    const bookingTypeRef = useRef<HTMLDivElement>(null);
    const reelRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
    const [availableShootTypes, setAvailableShootTypes] = useState(newshootTypes);
    const [videoEditTypeOptions, setVideoEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
    const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
    const [photoEditNote, setPhotoEditNote] = useState<string>("");
    const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
    const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
    const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});

    // Multi-day states
    const [bookingType, setBookingType] = useState<"single_day" | "multi_day">("single_day");
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
    const [sameTimingsMulti, setSameTimingsMulti] = useState(true);
    const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
    const [multiDayTimes, setMultiDayTimes] = useState<Record<string, { startKey?: string; endKey?: string }>>({});
    const isDraggingReel = useRef(false);
    const dragStartX = useRef(0);
    const dragStartScrollLeft = useRef(0);

    const [updateLeadBooking, { isLoading: isUpdatingInitial }] = useUpdateLeadBookingMutation();
    const [updateClientLeadBooking, { isLoading: isUpdatingClient }] = useUpdateClientLeadBookingMutation();
    const isUpdating = isUpdatingInitial || isUpdatingClient;

    const updateData = useCallback((newData: Partial<BookingDataV3>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    }, []);

    // Generate time options
    useEffect(() => {
        const options = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const h = i.toString().padStart(2, '0');
                const m = j.toString().padStart(2, '0');
                const date = new Date();
                date.setHours(i);
                date.setMinutes(j);
                options.push({ key: `${h}:${m}`, value: format(date, "h:mm aa") });
            }
        }
        setTimeOptions(options);
    }, []);

    // Sync formData with selectedShootDate
    useEffect(() => {
        const primaryDate = formData.startDate || formData.endDate;
        if (!primaryDate) {
            setSelectedShootDate(null);
            return;
        }
        const parsed = parseDate(primaryDate);
        if (!parsed) return;
        setSelectedShootDate(set(new Date(parsed), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }));
    }, [formData.startDate, formData.endDate]);

    // Update bookingType in formData
    useEffect(() => {
        updateData({ bookingType });
    }, [bookingType, updateData]);

    // Sync bookingDays in formData
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
                start_time: finalStart ? `${finalStart}:00` : "09:00:00",
                end_time: finalEnd ? `${finalEnd}:00` : "17:00:00"
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

    // Pre-populate form data
    useEffect(() => {
        if (initialBookingData) {
            const b = initialBookingData.booking || initialBookingData.project || initialBookingData;
            const eventDateStr = b.event_date || "";
            const startTimeStr = b.start_time || b.event_start_time || "09:00:00";
            const endTimeStr = b.end_time || b.event_end_time || "17:00:00";

            let start: Date | null = null;
            let end: Date | null = null;

            if (eventDateStr) {
                // Handling formats like "09:00:00" vs Date strings
                const cleanStartTime = startTimeStr.includes('T') ? startTimeStr.split('T')[1].split('.')[0] : startTimeStr;
                const cleanEndTime = endTimeStr.includes('T') ? endTimeStr.split('T')[1].split('.')[0] : endTimeStr;

                start = new Date(`${eventDateStr}T${cleanStartTime}`);
                end = new Date(`${eventDateStr}T${cleanEndTime}`);
            }

            setFormData((prev) => {
                const contentTypeRaw = b.content_type || b.event_type || b.skills_needed || "";

                return {
                    ...prev,
                    bookingId: b.stream_project_booking_id || b.id,
                    contentType: (typeof contentTypeRaw === 'string' ? contentTypeRaw.split(",") : Array.isArray(contentTypeRaw) ? contentTypeRaw : []).map((t: string) => t.trim()) as any || [],
                    shootType: b.shoot_type || b.project_type || "",
                    startDate: (start && !isNaN(start.getTime())) ? format(start, "yyyy-MM-dd HH:mm:ss") : "",
                    endDate: (end && !isNaN(end.getTime())) ? format(end, "yyyy-MM-dd HH:mm:ss") : "",
                    editsNeeded: b.edits_needed ?? true,
                    videoEditTypes: b.video_edit_types || [],
                    photoEditTypes: b.photo_edit_types || [],
                    location: b.event_location || b.location || "",
                    crewCount: b.crew_size_needed || b.crew_size || 0,
                    selectedCrewIds: b.selected_crew_ids ||
                        initialBookingData.selected_crew_ids ||
                        initialBookingData.assignedCrew?.map((c: any) => c.crew_member_id || c.id) ||
                        [],
                    fullName: initialBookingData.client_name || initialBookingData.user?.name || b.project_name || "",
                    email: initialBookingData.guest_email || initialBookingData.user?.email || b.guest_email || "",
                    phone: initialBookingData.user?.phone_number || "",
                    bookingType: b.booking_type || "single_day",
                    bookingDays: b.booking_days || []
                }
            });

            if (b.booking_type === "multi_day" && b.booking_days) {
                setBookingType("multi_day");
                const dates = b.booking_days.map((d: any) => new Date(d.date + "T00:00:00"));
                setSelectedDates(dates);
                
                const times: Record<string, { startKey?: string; endKey?: string }> = {};
                let allSame = true;
                let firstStart = b.booking_days[0]?.start_time?.slice(0, 5);
                let firstEnd = b.booking_days[0]?.end_time?.slice(0, 5);

                b.booking_days.forEach((d: any) => {
                    const s = d.start_time?.slice(0, 5);
                    const e = d.end_time?.slice(0, 5);
                    times[d.date] = { startKey: s, endKey: e };
                    if (s !== firstStart || e !== firstEnd) allSame = false;
                });

                setMultiDayTimes(times);
                setSameTimingsMulti(allSame);
                if (dates.length > 0) setSelectedShootDate(dates[0]);
            }

            if (b.crew_roles) {
                let crewRoles: Record<string, number> = {};
                if (typeof b.crew_roles === 'string' && b.crew_roles !== "[]") {
                    try {
                        crewRoles = JSON.parse(b.crew_roles);
                    } catch (e) {
                        console.error("Error parsing crew_roles", e);
                    }
                } else if (typeof b.crew_roles === 'object' && !Array.isArray(b.crew_roles)) {
                    crewRoles = b.crew_roles;
                }

                const extra: Record<string, number> = {};
                Object.entries(crewRoles).forEach(([role, count]) => {
                    if (count > 1) {
                        extra[role] = count - 1;
                    }
                });
                setExtraTeam(extra);
            }
        }
    }, [initialBookingData]);

    // Handle content type dependencies
    useEffect(() => {
        const isVideo = formData.contentType.includes("videographer");
        const isPhoto = formData.contentType.includes("photographer");

        if (isVideo && isPhoto) setAvailableShootTypes(hybridShootTypes);
        else if (isPhoto) setAvailableShootTypes(photoShootTypes);
        else if (isVideo) setAvailableShootTypes(videoShootTypes);
        else setAvailableShootTypes(newshootTypes);
    }, [formData.contentType]);

    // Update edit options based on shoot type
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
            case "tv": setVideoEditTypeOptions(tvSeriesEditTypes); break;
            case "podcast": setVideoEditTypeOptions(podcastEditTypes); break;
            case "short_film": setVideoEditTypeOptions(shortFilmEditTypes); break;
            case "movie": setVideoEditTypeOptions(movieEditTypes); break;
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
            default:
                setVideoEditTypeOptions([]);
                setPhotoEditTypeOptions([]);
        }
    }, [formData.shootType]);

    const toggleContentType = (type: "videographer" | "photographer" | "editing") => {
        const current = [...formData.contentType];
        const isCurrentlySelected = current.includes(type);
        const nextContentType = isCurrentlySelected ? current.filter((t) => t !== type) : [...current, type];

        if (nextContentType.length === 0) {
            updateData({ contentType: [], shootType: "", startDate: "", endDate: "", editsNeeded: true, videoEditTypes: [], photoEditTypes: [] });
        } else {
            let update: Partial<BookingDataV3> = { contentType: nextContentType };
            if (!nextContentType.includes("videographer")) update.videoEditTypes = [];
            if (!nextContentType.includes("photographer")) update.photoEditTypes = [];
            updateData(update);
        }
        if (nextContentType.length > 0) scrollToRef(shootTypeRef);
    };

    const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (isModal) return; // Don't scroll in modal
        setTimeout(() => {
            if (ref && ref.current) {
                const offsetPosition = ref.current.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        }, 100);
    };

    const handleDateChange = (date: Date | null) => {
        if (!date) {
            setSelectedShootDate(null);
            updateData({ startDate: "", endDate: "" });
            return;
        }
        setSelectedShootDate(set(new Date(date), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }));
        const finalStart = set(new Date(date), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
        const finalEnd = set(new Date(date), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
        updateData({ startDate: format(finalStart, "yyyy-MM-dd HH:mm:ss"), endDate: format(finalEnd, "yyyy-MM-dd HH:mm:ss") });
    };

    const handleStartTimeChange = (timeKey: string) => {
        if (!timeKey) return updateData({ startDate: "" });
        const [hours, minutes] = timeKey.split(":").map(Number);
        const currentBase = (formData.startDate ? parseDate(formData.startDate) : null) || selectedShootDate || new Date();
        const newStart = set(new Date(currentBase), { hours, minutes, seconds: 0, milliseconds: 0 });
        updateData({ startDate: format(newStart, "yyyy-MM-dd HH:mm:ss") });
    };

    const handleEndTimeChange = (timeKey: string) => {
        if (!timeKey) return updateData({ endDate: "" });
        const [hours, minutes] = timeKey.split(":").map(Number);
        const baseDate = (formData.startDate ? parseDate(formData.startDate) : null) || selectedShootDate || new Date();
        const newEnd = set(new Date(baseDate), { hours, minutes, seconds: 0, milliseconds: 0 });
        updateData({ endDate: format(newEnd, "yyyy-MM-dd HH:mm:ss") });
    };

    const getStartTimeKey = () => formData.startDate ? format(parseDate(formData.startDate)!, "HH:mm") : "";
    const getEndTimeKey = () => formData.endDate ? format(parseDate(formData.endDate)!, "HH:mm") : "";

    const filteredEndTimeOptions = useMemo(() => {
        if (!formData.startDate) return timeOptions;
        const startTimeKey = getStartTimeKey();
        return timeOptions.filter((opt) => opt.key > startTimeKey);
    }, [formData.startDate, timeOptions]);

    const getDateKey = (date: Date) => format(date, "yyyy-MM-dd");

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

    const reelDays = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(currentCalendarMonth);
        const monthEnd = endOfMonth(currentCalendarMonth);
        const start = isSameMonth(currentCalendarMonth, now) && now > monthStart ? startOfDay(now) : monthStart;
        if (start > monthEnd) return [];
        return eachDayOfInterval({ start, end: monthEnd });
    }, [currentCalendarMonth]);

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentCalendarMonth));
        const end = endOfWeek(endOfMonth(currentCalendarMonth));
        return eachDayOfInterval({ start, end });
    }, [currentCalendarMonth]);

    const getTimeLabel = (key: string) => {
        if (!key) return "";
        const match = timeOptions.find((opt) => opt.key === key);
        return match ? match.value : key;
    };

    const calculateDurationHours = (startKey: string, endKey: string) => {
        if (!startKey || !endKey) return null;
        const [sh, sm] = startKey.split(":").map(Number);
        const [eh, em] = endKey.split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
    };

    const handleExtraTeamChange = (id: string, delta: number) => {
        setExtraTeam((prev) => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [id]: next };
        });
    };

    const handleUpdate = async () => {
        if (!formData.shootType || (bookingType === "single_day" && (!formData.startDate || !formData.endDate)) || (bookingType === "multi_day" && selectedDates.length === 0) || !formData.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        const crew_roles: Record<string, number> = {};
        formData.contentType.forEach((role) => {
            if (role !== "editing") {
                crew_roles[role] = (extraTeam[role] || 0) + 1;
            }
        });

        const browserTimeZone = getBrowserTimeZone();
        let payload: any = {
            booking_type: bookingType,
            content_type: formData.contentType.filter(t => t !== "editing").join(","),
            shoot_type: formData.shootType,
            edits_needed: formData.editsNeeded,
            video_edit_types: formData.videoEditTypes,
            photo_edit_types: formData.photoEditTypes,
            crew_roles: crew_roles,
            crew_size: Object.values(crew_roles).reduce((a, b) => a + b, 0),
            location: formData.location,
            selected_crew_ids: formData.selectedCrewIds || [],
            is_draft: false,
            skip_discount: true,
            skip_margin: true,
            time_zone: browserTimeZone
        };

        if (bookingType === "single_day") {
            const startDate = getLocalDatePart(formData.startDate);
            const startTime = getLocalTimePart(formData.startDate);
            const endTime = getLocalTimePart(formData.endDate);
            const duration = differenceInHours(parseDate(formData.endDate)!, parseDate(formData.startDate)!);
            payload.start_date = startDate;
            payload.start_time = startTime;
            payload.end_time = endTime;
            payload.start_date_time = formData.startDate;
            payload.duration_hours = duration;
        } else {
            payload.booking_days = (formData.bookingDays || []).map((d: any) => ({
                ...d,
                time_zone: d.time_zone || d.timeZone || browserTimeZone
            }));
        }

        try {
            if (leadId) {
                await updateClientLeadBooking({
                    lead_id: typeof leadId === 'string' ? parseInt(leadId) : leadId,
                    payload
                }).unwrap();
            } else if (formData.bookingId) {
                await updateLeadBooking({
                    booking_id: formData.bookingId as number,
                    payload,
                    lead_id: undefined
                }).unwrap();
            }
            toast.success("Booking updated successfully");

            if (onSuccess) onSuccess();
            else router.back();
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update booking");
        }
    };

    const availableRolesToAdd = TEAM_ROLES.filter(role => formData.contentType.includes(role.id as any));
    const shootTypeOptions = useMemo(() => availableShootTypes.map((shoot) => ({ value: shoot.key, label: shoot.title })), [availableShootTypes]);

    const videographerTarget = useMemo(() => formData.contentType.includes("videographer") ? (extraTeam["videographer"] || 0) + 1 : 0, [formData.contentType, extraTeam]);
    const photographerTarget = useMemo(() => formData.contentType.includes("photographer") ? (extraTeam["photographer"] || 0) + 1 : 0, [formData.contentType, extraTeam]);

    return (
        <div className={`text-white font-sans ${isModal ? "" : "bg-[#101010] min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 mb-20"}`}>
            {!isModal && (
                <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
                    <ArrowLeft size={24} />
                    <span className="text-sm font-medium">Back</span>
                </Button>
            )}

            <div className="flex items-center gap-5 my-4 lg:my-9">
                <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                    {formData.fullName ? formData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "IN"}
                </div>
                <div className="flex gap-2 items-center">
                    <h1 className="lg:text-[22px] font-semibold">{formData.fullName || "Client Name"}</h1>
                    <IntentBadge intent={(initialBookingData?.intent || "Hot") as any} />
                </div>
            </div>

            <div ref={contentTypeRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ContentTypeCheckbox
                        label="Select All" icon={<SquaresUnite size={20} />}
                        checked={formData.contentType.includes("videographer") && formData.contentType.includes("photographer")}
                        onChange={(checked) => updateData({ contentType: checked ? ["videographer", "photographer"] : [] })}
                    />
                    <ContentTypeCheckbox
                        label="Videography" icon={<Video size={20} />}
                        checked={formData.contentType.includes("videographer")}
                        onChange={() => toggleContentType("videographer")}
                    />
                    <ContentTypeCheckbox
                        label="Photography" icon={<Camera size={20} />}
                        checked={formData.contentType.includes("photographer")}
                        onChange={() => toggleContentType("photographer")}
                    />
                </div>
            </div>

            <div ref={shootTypeRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Shoot Type</h3>
                <FloatingLabelDropdown
                    label="Shoot Type" value={formData.shootType} options={shootTypeOptions}
                    onChange={(val) => { updateData({ shootType: val }); scrollToRef(dateTimeRef); }}
                    placeholder="Select the type of shoot" labelBg="bg-[#101010]" required
                />
            </div>

            <div ref={bookingTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
                <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Select Booking Type</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            setBookingType("single_day");
                            setSelectedDates([]);
                            setSameTimingsMulti(true);
                            setMultiDayTimes({});
                            updateData({ bookingType: "single_day", bookingDays: [] });
                        }}
                        className={`h-14 lg:h-[82px] w-fit lg:w-[300px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${bookingType === "single_day" ? "bg-[#E8D1AB] text-black border-transparent" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                    >
                        <span className="font-medium text-sm lg:text-lg pr-2">Single Day</span>
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border ${bookingType === "single_day" ? "bg-black border-transparent" : "border-[#E5E5E5]"}`}>{bookingType === "single_day" && <div className="w-2 h-2 rounded-full bg-[#E8D1AB] m-auto mt-1.5" />}</div>
                    </button>
                    <button
                        onClick={() => {
                            setBookingType("multi_day");
                            updateData({ bookingType: "multi_day" });
                        }}
                        className={`h-14 lg:h-[82px] w-fit lg:w-[300px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${bookingType === "multi_day" ? "bg-[#E8D1AB] text-black border-transparent" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                    >
                        <span className="font-medium text-sm lg:text-lg pr-2">Multiple Days</span>
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border ${bookingType === "multi_day" ? "bg-black border-transparent" : "border-[#E5E5E5]"}`}>{bookingType === "multi_day" && <div className="w-2 h-2 rounded-full bg-[#E8D1AB] m-auto mt-1.5" />}</div>
                    </button>
                </div>
            </div>

            <div ref={dateTimeRef} className="my-4 lg:my-9">
                {bookingType === "single_day" ? (
                    <>
                        <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Shoot Date & Time</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DatePicker
                                label="Select Date" value={selectedShootDate} onChange={handleDateChange}
                                minDate={new Date()} colors={datePickerColours} format="MM/dd/yyyy"
                                sx={{ height: '56px', borderRadius: '16px' }}
                            />
                            <DropdownSelect title="Start Time" options={timeOptions} value={getStartTimeKey()} onChange={handleStartTimeChange} bgColour="bg-[#101010]" />
                            <DropdownSelect title="End Time" options={filteredEndTimeOptions} value={getEndTimeKey()} onChange={handleEndTimeChange} bgColour="bg-[#101010]" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="relative mb-8 lg:mb-15">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Select Date</h3>
                                <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="flex items-center gap-2 group transition-colors">
                                    <span className="text-white font-medium group-hover:text-[#E8D1AB] lg:text-[20px]">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                                    <Calendar size={20} className="text-white group-hover:text-[#E8D1AB]" />
                                </button>
                            </div>

                            <div
                                ref={reelRef}
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
                                className="flex gap-3 overflow-x-auto pb-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                            >
                                {reelDays.map((date) => {
                                    const isSelected = selectedDates.some(d => isSameDay(d, date));
                                    return (
                                        <button
                                            key={date.toISOString()} onClick={() => toggleDateSelection(date)}
                                            className={`shrink-0 flex flex-col items-center justify-center w-[60px] lg:w-[100px] h-[60px] lg:h-[100px] rounded-full border transition-all ${isSelected ? "bg-[#E8D1AB] border-[#E8D1AB] text-black" : "bg-transparent border-white/10 text-white/40 hover:border-white/30"}`}
                                        >
                                            <span className="text-lg lg:text-3xl font-bold">{format(date, "d")}</span>
                                            <span className="text-[10px] lg:text-xs uppercase font-medium">{format(date, "EEE")}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-4 lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3 border border-white/5">
                                    <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Total Days: {selectedDates.length}</p>
                                </div>
                                <div className="mt-4 lg:mt-8 rounded-lg lg:rounded-xl bg-[#211F1C] w-fit px-4 py-2 lg:px-7 lg:py-3 border border-white/5">
                                    <p className="font-medium text-[#E8D1AB] text-xs lg:text-sm">Selected Days: {getFormattedDateString(selectedDates)}</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isCalendarOpen && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-14 z-50 bg-[#111] border border-white/10 p-5 rounded-2xl shadow-2xl w-[320px]">
                                        <div className="flex justify-between items-center mb-6">
                                            <button onClick={() => setCurrentCalendarMonth(addDays(startOfMonth(currentCalendarMonth), -1))}><ChevronLeft size={20} /></button>
                                            <span className="text-white font-bold">{format(currentCalendarMonth, "MMMM yyyy")}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setCurrentCalendarMonth(addDays(endOfMonth(currentCalendarMonth), 1))}><ChevronRight size={20} /></button>
                                                <button onClick={() => setIsCalendarOpen(false)} className="rounded-full p-1 hover:bg-white/10 transition-colors"><X size={18} /></button>
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
                                                        key={date.toISOString()} onClick={() => toggleDateSelection(date)}
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

                        {selectedDates.length > 0 && (
                            <div className="pt-6 lg:pt-15 border-t border-white/10 space-y-6 animate-in fade-in duration-500">
                                <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Are timings same for all selected dates?</h3>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setSameTimingsMulti(true); setMultiDayTimes({}); }}
                                        className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${sameTimingsMulti ? "bg-[#E8D1AB] text-black border-transparent" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border ${sameTimingsMulti ? "bg-black border-transparent" : "border-[#E5E5E5]"}`}>{sameTimingsMulti && <div className="w-2 h-2 rounded-full bg-[#E8D1AB] m-auto mt-1.5" />}</div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSameTimingsMulti(false);
                                            const startKey = getStartTimeKey();
                                            const endKey = getEndTimeKey();
                                            const nextTimes: Record<string, { startKey?: string; endKey?: string }> = {};
                                            selectedDates.forEach(d => { const key = getDateKey(d); nextTimes[key] = { startKey, endKey }; });
                                            setMultiDayTimes(nextTimes);
                                        }}
                                        className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!sameTimingsMulti ? "bg-[#E8D1AB] text-black border-transparent" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                                    >
                                        <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border ${!sameTimingsMulti ? "bg-black border-transparent" : "border-[#E5E5E5]"}`}>{!sameTimingsMulti && <div className="w-2 h-2 rounded-full bg-[#E8D1AB] m-auto mt-1.5" />}</div>
                                    </button>
                                </div>

                                {sameTimingsMulti ? (
                                    <div className="animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <DropdownSelect title="Start Time" options={timeOptions} value={getStartTimeKey()} onChange={handleStartTimeChange} bgColour="bg-[#101010]" />
                                            <DropdownSelect title="End Time" options={filteredEndTimeOptions} value={getEndTimeKey()} onChange={handleEndTimeChange} bgColour="bg-[#101010]" />
                                        </div>
                                        <p className="flex items-center gap-2 my-3 lg:mt-6 text-[#A9A9A9]">
                                            <Check size={20} className="text-[#E8D1AB]" /> Applied to {selectedDates.length} selected dates
                                        </p>
                                        <div className="bg-[#171717] rounded-2xl border border-white/10 p-4 lg:p-7 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                            <p className="text-white font-medium lg:text-xl">{getFormattedDateString(selectedDates)}</p>
                                            <p className="text-white/60 font-medium lg:text-lg">{getStartTimeKey() && getEndTimeKey() ? `${getTimeLabel(getStartTimeKey())} - ${getTimeLabel(getEndTimeKey())}` : "Select time"}</p>
                                            <p className="text-[#E8D1AB] font-medium lg:text-lg">{getStartTimeKey() && getEndTimeKey() && calculateDurationHours(getStartTimeKey(), getEndTimeKey()) !== null ? `${calculateDurationHours(getStartTimeKey(), getEndTimeKey())} Hours/Day` : "Duration Hour/Day"}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                        {selectedDates.map((date) => {
                                            const dateKey = getDateKey(date);
                                            const isExpanded = expandedDateKey === dateKey;
                                            return (
                                                <div key={date.toISOString()} className="border border-white/10 rounded-2xl bg-[#171717] overflow-hidden">
                                                    <button onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)} className={`w-full px-6 py-5 flex justify-between items-center transition-colors hover:bg-white/5 ${isExpanded ? "border-b border-b-white/10" : ""}`}>
                                                        <span className="text-white font-medium">{format(date, "MMMM dd, yyyy")}</span>
                                                        <ChevronDown className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#101010] p-4 lg:p-7">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <DropdownSelect title="Start Time" options={timeOptions} value={multiDayTimes[dateKey]?.startKey || ""} onChange={(v) => handleMultiDayStartTimeChange(dateKey, v)} bgColour="bg-[#101010]" />
                                                                    <DropdownSelect title="End Time" options={filteredEndTimeOptions} value={multiDayTimes[dateKey]?.endKey || ""} onChange={(v) => handleMultiDayEndTimeChange(dateKey, v)} bgColour="bg-[#101010]" />
                                                                </div>
                                                                <div className="mt-4 rounded-xl bg-[#211F1C] w-fit px-5 py-2 border border-white/5">
                                                                    <p className="font-medium text-[#E8D1AB] text-sm">Duration: {multiDayTimes[dateKey]?.startKey && multiDayTimes[dateKey]?.endKey && calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "") !== null ? `${calculateDurationHours(multiDayTimes[dateKey]?.startKey || "", multiDayTimes[dateKey]?.endKey || "")} hours` : "Select time"}</p>
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

            <div ref={editsRef} className="my-4 lg:my-9">
                <h3 className="text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 text-white/90">Edits Needed?</h3>
                <div className="flex gap-4">
                    {["Yes", "No"].map((choice) => {
                        const val = choice === "Yes";
                        const active = formData.editsNeeded === val;
                        return (
                            <button key={choice} onClick={() => updateData({ editsNeeded: val })}
                                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${active ? "bg-[#E8D1AB] text-black border-transparent" : "bg-[#101010] border-white/10 text-[#A9A9A9]"}`}
                            >
                                <span className="font-medium text-sm lg:text-lg">{choice}</span>
                                <div className={`w-6 h-6 rounded-full border ${active ? "bg-black" : "border-[#E5E5E5]"}`}>{active && <div className="w-2 h-2 rounded-full bg-[#E8D1AB] m-auto mt-1.5" />}</div>
                            </button>
                        );
                    })}
                </div>
                {formData.editsNeeded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-in slide-in-from-top-4 duration-300">
                        {formData.contentType.includes("videographer") && videoEditTypeOptions.length > 0 && (
                            <MultiSelectDropdown title="Video Edit Type" options={videoEditTypeOptions} value={formData.videoEditTypes} onChange={(v) => updateData({ videoEditTypes: v })} bgColour="bg-[#101010]" />
                        )}
                        {formData.contentType.includes("photographer") && photoEditTypeOptions.length > 0 && (
                            <div>
                                <MultiSelectDropdown title="Photo Edit Type" options={photoEditTypeOptions} value={formData.photoEditTypes} onChange={(v) => updateData({ photoEditTypes: v })} bgColour="bg-[#101010]" />
                                {photoEditNote && <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]"><Info size={16} className="mt-0.5 flex-shrink-0" /><span>{photoEditNote}</span></div>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div ref={extraTeamRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium text-white mb-6">Additional Creatives</h3>
                <div className="space-y-4">
                    {availableRolesToAdd.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">{role.icon}<span className="text-lg font-medium">{role.label}</span></div>
                            <QuantityControl value={extraTeam[role.id] || 0} onIncrease={() => handleExtraTeamChange(role.id, 1)} onDecrease={() => handleExtraTeamChange(role.id, -1)} />
                        </div>
                    ))}
                </div>
            </div>

            <div ref={locationRef} className="my-4 lg:my-9">
                <h3 className="text-xl font-medium text-white/90 mb-6">Location</h3>
                <LocationPicker value={formData.location} onChange={(address) => updateData({ location: address })} placeholder="Search for a location" colors={darkThemeColors} />
            </div>

            {!hideCreativeSelector && (
                <CreativeProfileSelectorAdd
                    leadId={leadId?.toString()} projectId={projectId?.toString()} selectedIds={formData.selectedCrewIds} onChange={(ids) => updateData({ selectedCrewIds: ids })} currentLocation={formData.location}
                    targets={{ videographer: videographerTarget, photographer: photographerTarget }}
                />
            )}

            <div className={`flex gap-6 items-center pt-10 ${isModal ? "" : "max-w-md"}`}>
                <Button onClick={() => onCancel ? onCancel() : router.back()} className="h-14 lg:h-[72px] border border-[#8E8E8E] text-white font-medium text-lg rounded-xl flex-1">
                    Back
                </Button>
                <Button onClick={handleUpdate} isLoading={isUpdating} className="h-14 lg:h-[72px] bg-[#E8D1AB] text-black font-medium text-lg rounded-xl flex-1">
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
