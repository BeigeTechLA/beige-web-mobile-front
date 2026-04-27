"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, SquaresUnite, Video, Camera, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { set, format, differenceInHours } from "date-fns";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { ContentTypeCheckbox } from "@/components/book-a-shoot/v3/components/ContentTypeCheckbox";
import { MultiSelectDropdown } from "@/components/book-a-shoot";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";

// Import all specific shoot and edit types
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
import { useUpdateLeadBookingMutation } from "@/lib/redux/features/sales/salesApi";
import { affiliateApi } from "@/lib/api";

const TEAM_ROLES = [
    { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> },
    { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> },
];

export default function AffiliateEditBookingPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params.id as string;

    const contentTypeRef = useRef<HTMLDivElement>(null);
    const shootTypeRef = useRef<HTMLDivElement>(null);
    const dateTimeRef = useRef<HTMLDivElement>(null);
    const editsRef = useRef<HTMLDivElement>(null);
    const extraTeamRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Options State
    const [availableShootTypes, setAvailableShootTypes] = useState(newshootTypes);
    const [videoEditTypeOptions, setVideoEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
    const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
    const [photoEditNote, setPhotoEditNote] = useState<string>("");

    const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
    const [selectedShootDate, setSelectedShootDate] = useState<Date | null>(null);
    const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});

    const [updateLeadBooking, { isLoading: isUpdating }] = useUpdateLeadBookingMutation();

    // 1. Generate time options
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

    // 2. Determine available shoot types based on content type selection
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
            setAvailableShootTypes(newshootTypes); // Fallback
        }
    }, [formData.contentType]);

    // 3. Update edit type options based on shoot type
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
            default:
                setVideoEditTypeOptions([]);
                setPhotoEditTypeOptions([]);
        }
    }, [formData.shootType]);

    // Fetch project data and pre-populate
    useEffect(() => {
        const fetchProject = async () => {
            const token = Cookies.get("revure_token");
            if (!token || !bookingId) return;

            try {
                setIsLoading(true);
                const response = await affiliateApi.getProjectDetails(token, bookingId);
                const b = response?.data?.project || response?.data || response;

                if (b) {
                    const eventDateStr = b.event_date || ""; // "YYYY-MM-DD"
                    const startTimeStr = b.start_time || "09:00:00"; // "HH:mm:ss"
                    const endTimeStr = b.end_time || "17:00:00"; // "HH:mm:ss"

                    let start: Date | null = null;
                    let end: Date | null = null;

                    if (eventDateStr) {
                        start = new Date(`${eventDateStr}T${startTimeStr}`);
                        end = new Date(`${eventDateStr}T${endTimeStr}`);
                    }

                    setFormData((prev) => ({
                        ...prev,
                        bookingId: b.stream_project_booking_id,
                        contentType: (b.content_type?.split(",") as any) || [],
                        shootType: b.shoot_type || "",
                        startDate: (start && !isNaN(start.getTime())) ? format(start, "yyyy-MM-dd HH:mm:ss") : "",
                        endDate: (end && !isNaN(end.getTime())) ? format(end, "yyyy-MM-dd HH:mm:ss") : "",
                        editsNeeded: b.edits_needed ?? true,
                        videoEditTypes: b.video_edit_types || [],
                        photoEditTypes: b.photo_edit_types || [],
                        location: b.event_location || "",
                        crewCount: b.crew_size_needed || 0,
                        selectedCrewIds: b.selected_crew_ids || [],
                        fullName: b.project_name || "",
                        email: "",
                        phone: "",
                    }));

                    if (b.crew_roles) {
                        let crewRoles: Record<string, number> = {};
                        if (typeof b.crew_roles === 'string') {
                            try {
                                crewRoles = JSON.parse(b.crew_roles);
                            } catch (e) {
                                console.error("Error parsing crew_roles", e);
                            }
                        } else {
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
            } catch (error) {
                console.error("Failed to fetch project:", error);
                toast.error("Failed to load project details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [bookingId]);

    const updateData = useCallback((newData: Partial<BookingDataV3>) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    }, []);

    const toggleContentType = (type: "videographer" | "photographer" | "editing") => {
        const current = [...formData.contentType];
        const isCurrentlySelected = current.includes(type);

        const nextContentType = isCurrentlySelected
            ? current.filter((t) => t !== type)
            : [...current, type];

        if (nextContentType.length === 0) {
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
            let update: Partial<BookingDataV3> = { contentType: nextContentType };
            if (!nextContentType.includes("videographer")) update.videoEditTypes = [];
            if (!nextContentType.includes("photographer")) update.photoEditTypes = [];
            updateData(update);
        }

        if (nextContentType.length > 0) {
            scrollToRef(shootTypeRef);
        }
    };

    const availableRolesToAdd = TEAM_ROLES.filter(role =>
        formData.contentType.includes(role.id as any)
    );

    const shootTypeOptions = useMemo(() => {
        return availableShootTypes.map((shoot) => ({
            value: shoot.key,
            label: shoot.title
        }));
    }, [availableShootTypes]);

    const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
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
        setSelectedShootDate(
            set(new Date(date), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        );
        const finalStart = set(new Date(date), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
        const finalEnd = set(new Date(date), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });

        updateData({
            startDate: format(finalStart, "yyyy-MM-dd'T'HH:mm:ss.SSS"),
            endDate: format(finalEnd, "yyyy-MM-dd'T'HH:mm:ss.SSS"),
        });
    };

    const videographerTarget = useMemo(() => {
        return formData.contentType.includes("videographer") ? (extraTeam["videographer"] || 0) + 1 : 0;
    }, [formData.contentType, extraTeam]);

    const photographerTarget = useMemo(() => {
        return formData.contentType.includes("photographer") ? (extraTeam["photographer"] || 0) + 1 : 0;
    }, [formData.contentType, extraTeam]);

    const handleStartTimeChange = (timeKey: string) => {
        if (!timeKey) return updateData({ startDate: "" });
        const [hours, minutes] = timeKey.split(":").map(Number);

        const currentBase =
            (formData.startDate ? parseDate(formData.startDate) : null) ||
            (formData.endDate ? parseDate(formData.endDate) : null) ||
            selectedShootDate ||
            new Date();
        if (!currentBase) return;

        const newStart = set(new Date(currentBase), {
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0
        });

        updateData({ startDate: format(newStart, "yyyy-MM-dd'T'HH:mm:ss.SSS") });
    };

    const handleEndTimeChange = (timeKey: string) => {
        if (!timeKey) return updateData({ endDate: "" });
        const [hours, minutes] = timeKey.split(":").map(Number);

        let baseDate =
            (formData.startDate ? parseDate(formData.startDate) : null) ||
            (formData.endDate ? parseDate(formData.endDate) : null) ||
            selectedShootDate ||
            new Date();
        if (!baseDate) return;

        const newEnd = set(new Date(baseDate), {
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0
        });

        updateData({ endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss.SSS") });
    };

    const getStartTimeKey = () => formData.startDate ? format(parseDate(formData.startDate)!, "HH:mm") : "";
    const getEndTimeKey = () => formData.endDate ? format(parseDate(formData.endDate)!, "HH:mm") : "";

    const filteredEndTimeOptions = React.useMemo(() => {
        if (!formData.startDate) return timeOptions;
        const startTimeKey = getStartTimeKey();
        return timeOptions.filter((opt) => opt.key > startTimeKey);
    }, [formData.startDate, timeOptions]);

    const handleExtraTeamChange = (id: string, delta: number) => {
        setExtraTeam((prev) => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [id]: next };
        });
    };

    const handleUpdate = async () => {
        if (!formData.shootType || !formData.startDate || !formData.endDate || !formData.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        const duration = differenceInHours(parseDate(formData.endDate)!, parseDate(formData.startDate)!);

        const crew_roles: Record<string, number> = {};
        formData.contentType.forEach((role) => {
            if (role !== "editing") {
                crew_roles[role] = (extraTeam[role] || 0) + 1;
            }
        });

        const browserTimeZone = getBrowserTimeZone();
        const payload = {
            content_type: formData.contentType.filter(t => t !== "editing").join(","),
            shoot_type: formData.shootType,
            start_date: getLocalDatePart(formData.startDate),
            start_time: getLocalTimePart(formData.startDate),
            end_time: getLocalTimePart(formData.endDate),
            time_zone: browserTimeZone,
            start_date_time: formData.startDate,
            duration_hours: duration,
            edits_needed: formData.editsNeeded,
            video_edit_types: formData.videoEditTypes,
            photo_edit_types: formData.photoEditTypes,
            crew_roles: crew_roles,
            crew_size: Object.values(crew_roles).reduce((a, b) => a + b, 0),
            location: formData.location,
            location_latitude:
                formData.locationDetails?.coordinates?.lat ??
                formData.locationDetails?.lat ??
                formData.locationDetails?.center?.[1] ??
                undefined,
            location_longitude:
                formData.locationDetails?.coordinates?.lng ??
                formData.locationDetails?.lng ??
                formData.locationDetails?.center?.[0] ??
                undefined,
            selected_crew_ids: formData.selectedCrewIds || [],
            is_draft: false,
            skip_discount: true,
            skip_margin: true
        };

        try {
            await updateLeadBooking({
                booking_id: Number(formData.bookingId),
                payload
            }).unwrap();
            toast.success("Booking updated successfully");
            router.back();
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update booking");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101010] text-white">
                <Loader2 className="animate-spin text-white/50" size={40} />
            </div>
        );
    }

    return (
        <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans mb-20 bg-[#101010] min-h-screen">
            <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent shadow-none hover:bg-transparent">
                <ArrowLeft size={24} />
                <span className="text-sm font-medium">Back</span>
            </Button>

            <div className="flex items-center gap-5 my-4 lg:my-9">
                <div className="w-12 h-12 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                    {formData.fullName ? formData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "BK"}
                </div>
                <div>
                    <h1 className="lg:text-[22px] font-semibold">{formData.fullName || "Booking Details"}</h1>
                    <p className="text-sm text-white/50">Edit current shoot requirements</p>
                </div>
            </div>

            <div ref={contentTypeRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ContentTypeCheckbox
                        label="Select All"
                        icon={<SquaresUnite size={20} />}
                        checked={formData.contentType.includes("videographer") && formData.contentType.includes("photographer")}
                        onChange={(checked) => updateData({ contentType: checked ? ["videographer", "photographer"] : [] })}
                    />
                    <ContentTypeCheckbox
                        label="Videography"
                        icon={<Video size={20} />}
                        checked={formData.contentType.includes("videographer")}
                        onChange={() => toggleContentType("videographer")}
                    />
                    <ContentTypeCheckbox
                        label="Photography"
                        icon={<Camera size={20} />}
                        checked={formData.contentType.includes("photographer")}
                        onChange={() => toggleContentType("photographer")}
                    />
                </div>
            </div>

            <div ref={shootTypeRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Shoot Type</h3>
                <FloatingLabelDropdown
                    label="Shoot Type"
                    value={formData.shootType}
                    options={shootTypeOptions}
                    onChange={(val) => {
                        updateData({ shootType: val });
                        scrollToRef(dateTimeRef);
                    }}
                    placeholder="Select the type of shoot"
                    labelBg="bg-[#101010]"
                    required
                />
            </div>

            <div ref={dateTimeRef} className="my-4 lg:my-9">
                <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Shoot Date & Time</h3>
                <div className="flex flex-col lg:flex-row gap-6">
                    <DatePicker
                        label="Select Date"
                        value={selectedShootDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        colors={datePickerColours}
                        format="MM/dd/yyyy"
                        sx={{ height: { xs: '56px', lg: '82px' }, borderRadius: '16px' }}
                    />
                    <DropdownSelect
                        title="Start Time"
                        options={timeOptions}
                        value={getStartTimeKey()}
                        onChange={handleStartTimeChange}
                        bgColour="bg-[#101010]"
                    />
                    <DropdownSelect
                        title="End Time"
                        options={filteredEndTimeOptions}
                        value={getEndTimeKey()}
                        onChange={handleEndTimeChange}
                        bgColour="bg-[#101010]"
                    />
                </div>
            </div>

            <div ref={editsRef} className="my-4 lg:my-9">
                <h3 className="text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 text-white/90">Edits Needed?</h3>
                <div className="flex gap-4">
                    {["Yes", "No"].map((choice) => {
                        const val = choice === "Yes";
                        const active = formData.editsNeeded === val;
                        return (
                            <button
                                key={choice}
                                onClick={() => updateData({ editsNeeded: val })}
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
                            <MultiSelectDropdown
                                title="Video Edit Type"
                                options={videoEditTypeOptions}
                                value={formData.videoEditTypes}
                                onChange={(v) => updateData({ videoEditTypes: v })}
                                bgColour="bg-[#101010]"
                            />
                        )}
                        {formData.contentType.includes("photographer") && photoEditTypeOptions.length > 0 && (
                            <div>
                                <MultiSelectDropdown
                                    title="Photo Edit Type"
                                    options={photoEditTypeOptions}
                                    value={formData.photoEditTypes}
                                    onChange={(v) => updateData({ photoEditTypes: v })}
                                    bgColour="bg-[#101010]"
                                />
                                {photoEditNote && (
                                    <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]">
                                        <Info size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{photoEditNote}</span>
                                    </div>
                                )}
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
                            <div className="flex items-center gap-3">
                                {role.icon}
                                <span className="text-lg font-medium">{role.label}</span>
                            </div>
                            <QuantityControl
                                value={extraTeam[role.id] || 0}
                                onIncrease={() => handleExtraTeamChange(role.id, 1)}
                                onDecrease={() => handleExtraTeamChange(role.id, -1)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div ref={locationRef} className="my-4 lg:my-9">
                <h3 className="text-xl font-medium text-white/90 mb-6">Location</h3>
                <LocationPicker
                    value={formData.location}
                    onChange={(address, details) =>
                        updateData({ location: address, locationDetails: details || null })
                    }
                    placeholder="Search for a location"
                    colors={darkThemeColors}
                />
            </div>

            <CreativeProfileSelectorAdd
                leadId={""}
                selectedIds={formData.selectedCrewIds}
                onChange={(ids) => updateData({ selectedCrewIds: ids })}
                currentLocation={formData.location}
                targets={{
                    videographer: videographerTarget,
                    photographer: photographerTarget
                }}
            />

            <div className="flex gap-6 items-center pt-10 max-w-md">
                <Button onClick={() => router.back()} className="h-14 lg:h-[72px] border border-[#8E8E8E] bg-transparent text-white font-medium text-lg rounded-xl flex-1 hover:bg-white/5 disabled:opacity-50">
                    Back
                </Button>
                <Button onClick={handleUpdate} isLoading={isUpdating} className="h-14 lg:h-[72px] bg-[#E8D1AB] text-black font-medium text-lg rounded-xl flex-1 hover:bg-[#dcb98a]">
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
