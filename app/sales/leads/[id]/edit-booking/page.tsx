"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors, Info } from "lucide-react";
import { toast } from "sonner";
import { set, format, differenceInHours } from "date-fns";

import { Button } from "@/components/ui/button";
import DottedDivider from "@/components/admin/DottedDivider";
import { IntentBadge } from "@/components/sales/IntentBadge";
import { ContentTypeCheckbox } from "@/components/book-a-shoot/v3/components/ContentTypeCheckbox";
import { MultiSelectDropdown } from "@/components/book-a-shoot";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { QuantityControl } from "@/components/book-a-shoot/QuantityControl";

import { newshootTypes } from "@/app/data/shootData";
import { BookingDataV3, initialDataV3 } from "@/components/book-a-shoot/v3";
import { parseDate } from "@/src/components/landing/lib/utils";
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import { FloatingLabelDropdown } from "@/components/generic/FloatingLabelDropdown";
import { useGetLeadByIdQuery, useUpdateLeadBookingMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";

const INITIAL_COUNT = 6;

const shootTypeOptions = newshootTypes.map((shoot) => ({
    value: shoot.key,
    label: shoot.title
}));

const editTypeOptions = newshootTypes.map((shoot) => ({
    key: shoot.key,
    value: shoot.title
}));

const TEAM_ROLES = [
    { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> },
    { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> },
];

export default function EditBookingPage() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const leadId = params.id as string;

    const contentTypeRef = useRef<HTMLDivElement>(null);
    const shootTypeRef = useRef<HTMLDivElement>(null);
    const dateTimeRef = useRef<HTMLDivElement>(null);
    const editsRef = useRef<HTMLDivElement>(null);
    const navigationRef = useRef<HTMLDivElement>(null);
    const extraTeamRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<BookingDataV3>(initialDataV3);
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
    const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
    const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
    const [photoEditNote, setPhotoEditNote] = useState<string>("");
    const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});

    // Fetch lead data for pre-population
    const { data: leadData, isLoading: isLeadLoading } = useGetLeadByIdQuery(parseInt(leadId), {
        skip: !leadId,
    });

    const [updateLeadBooking, { isLoading: isUpdating }] = useUpdateLeadBookingMutation();

    useEffect(() => {
        // Generate time options
        const options = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                const h = i.toString().padStart(2, '0');
                const m = j.toString().padStart(2, '0');
                options.push({ key: `${h}:${m}`, value: `${i % 12 || 12}:${m} ${i >= 12 ? 'PM' : 'AM'}` });
            }
        }
        setTimeOptions(options);
    }, []);

    // Pre-populate form data when lead data is available
    useEffect(() => {
        if (leadData && leadData.booking) {
            const b = leadData.booking as any;

            const start = b.start_time ? new Date(b.start_time) : null;
            const endStr = (start && !isNaN(start.getTime()) && b.end_time)
                ? `${start.toDateString()} ${b.end_time}`
                : null;
            const end = endStr ? new Date(endStr) : null;

            setFormData((prev) => ({
                ...prev,
                bookingId: b.stream_project_booking_id,
                contentType: (b.content_type?.split(",") as any) || [],
                shootType: b.shoot_type || "",
                startDate: (start && !isNaN(start.getTime())) ? start.toISOString() : "",
                endDate: (end && !isNaN(end.getTime())) ? end.toISOString() : "",
                editsNeeded: b.edits_needed ?? true,
                videoEditTypes: b.video_edit_types || [],
                photoEditTypes: b.photo_edit_types || [],
                location: b.event_location || "",
                crewCount: b.crew_size_needed || 0,
                selectedCrewIds: leadData.selected_crew_ids || [],
                fullName: leadData.client_name || leadData.guest_email || "",
                email: leadData.guest_email || "",
                phone: leadData.user?.phone_number || "",
            }));

            // Pre-populate extra team if available
            if (b.crew_roles && typeof b.crew_roles === 'object') {
                const crewRoles: Record<string, number> = b.crew_roles as any;
                const extra: Record<string, number> = {};

                Object.entries(crewRoles).forEach(([role, count]) => {
                    if (count > 1) {
                        extra[role] = count - 1;
                    }
                });
                setExtraTeam(extra);
            }
        }
    }, [leadData]);

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
            updateData({ contentType: nextContentType });
        }

        if (nextContentType.length > 0) {
            scrollToRef(shootTypeRef);
        }
    };

    const availableRolesToAdd = TEAM_ROLES.filter(role =>
        formData.contentType.includes(role.id as any)
    );

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
            updateData({ startDate: "", endDate: "" });
            return;
        }
        const finalStart = set(new Date(), {
            year: date.getFullYear(),
            month: date.getMonth(),
            date: date.getDate(),
            hours: 9, minutes: 0, seconds: 0, milliseconds: 0
        });
        const finalEnd = set(new Date(), {
            year: date.getFullYear(),
            month: date.getMonth(),
            date: date.getDate(),
            hours: 17, minutes: 0, seconds: 0, milliseconds: 0
        });

        updateData({
            startDate: finalStart.toISOString(),
            endDate: finalEnd.toISOString(),
        });
    };

    const handleStartTimeChange = (timeKey: string) => {
        if (!timeKey) return;
        const [hours, minutes] = timeKey.split(":").map(Number);
        const currentDate = formData.startDate ? parseDate(formData.startDate) : new Date();
        if (!currentDate) return;
        const newStart = set(currentDate, { hours, minutes });
        updateData({ startDate: newStart.toISOString() });
    };

    const handleEndTimeChange = (timeKey: string) => {
        if (!timeKey) return;
        const [hours, minutes] = timeKey.split(":").map(Number);
        let currentDate = formData.endDate ? parseDate(formData.endDate) : (formData.startDate ? parseDate(formData.startDate) : new Date());
        if (!currentDate) return;
        const newEnd = set(currentDate, { hours, minutes });
        updateData({ endDate: newEnd.toISOString() });
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

        // Construct crew_roles
        const crew_roles: Record<string, number> = {};
        formData.contentType.forEach((role) => {
            if (role !== "editing") {
                crew_roles[role] = (extraTeam[role] || 0) + 1;
            }
        });

        const payload = {
            content_type: formData.contentType.filter(t => t !== "editing").join(","),
            shoot_type: formData.shootType,
            start_date_time: formData.startDate,
            end_time: format(parseDate(formData.endDate)!, "HH:mm:ss"),
            duration_hours: duration,
            edits_needed: formData.editsNeeded,
            video_edit_types: formData.videoEditTypes,
            photo_edit_types: formData.photoEditTypes,
            crew_roles: crew_roles,
            crew_size: Object.values(crew_roles).reduce((a, b) => a + b, 0),
            location: formData.location,
            selected_crew_ids: formData.selectedCrewIds || [],
            is_draft: false,
            skip_discount: true,
            skip_margin: true
        };

        try {
            await updateLeadBooking({ lead_id: parseInt(leadId), payload }).unwrap();
            toast.success("Booking updated successfully");
            router.back();
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update booking");
        }
    };

    if (isLeadLoading) {
        return <div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
    }

    return (
        <>
            <Topbar pathname={pathname} />
            <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans mb-20 bg-[#101010] min-h-screen">
                <Button onClick={() => router.back()} className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0">
                    <ArrowLeft size={24} />
                    <span className="text-sm font-medium">Back</span>
                </Button>

                <div className="flex items-center gap-5">
                    <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                        {formData.fullName ? formData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "IN"}
                    </div>
                    <div className="flex gap-2 items-center">
                        <h1 className="lg:text-[22px] font-semibold">{formData.fullName || "Client Name"}</h1>
                        <IntentBadge intent={(leadData?.intent || "Hot") as any} />
                    </div>
                </div>
                <DottedDivider />

                <div ref={contentTypeRef}>
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
                <DottedDivider />

                <div ref={shootTypeRef}>
                    <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Shoot Type</h3>
                    <FloatingLabelDropdown
                        label="Shoot Type"
                        value={formData.shootType}
                        options={shootTypeOptions}
                        onChange={(val) => updateData({ shootType: val })}
                        placeholder="Select the type of shoot"
                        labelBg="bg-[#101010]"
                        required
                    />
                </div>
                <DottedDivider />

                <div ref={dateTimeRef}>
                    <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Shoot Date & Time</h3>
                    <div className="flex flex-col lg:flex-row gap-6">
                        <DatePicker
                            label="Select Date"
                            value={formData.startDate ? parseDate(formData.startDate) : null}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            colors={datePickerColours}
                            format="MM/dd/yyyy"
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
                <DottedDivider />

                <div ref={editsRef}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {formData.contentType.includes("videographer") && (
                                <MultiSelectDropdown title="Video Edit Type" options={editTypeOptions} value={formData.videoEditTypes} onChange={(v) => updateData({ videoEditTypes: v })} bgColour="bg-[#101010]" />
                            )}
                            {formData.contentType.includes("photographer") && (
                                <MultiSelectDropdown title="Photo Edit Type" options={editTypeOptions} value={formData.photoEditTypes} onChange={(v) => updateData({ photoEditTypes: v })} bgColour="bg-[#101010]" />
                            )}
                        </div>
                    )}
                </div>
                <DottedDivider />

                <div ref={extraTeamRef}>
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
                <DottedDivider />

                <div ref={locationRef}>
                    <h3 className="text-xl font-medium text-white/90 mb-6">Location</h3>
                    <LocationPicker
                        value={formData.location}
                        onChange={(address) => updateData({ location: address })}
                        placeholder="Search for a location"
                        colors={darkThemeColors}
                    />
                </div>
                <DottedDivider />

                <CreativeProfileSelector
                    selectedIds={formData.selectedCrewIds}
                    onChange={(ids) => updateData({ selectedCrewIds: ids })}
                />

                <div className="flex gap-6 items-center pt-10">
                    <Button onClick={() => router.back()} className="h-14 lg:h-[72px] border border-[#8E8E8E] text-white font-medium text-lg rounded-xl flex-1">
                        Back
                    </Button>
                    <Button onClick={handleUpdate} isLoading={isUpdating} className="h-14 lg:h-[72px] bg-[#E8D1AB] text-black font-medium text-lg rounded-xl flex-1">
                        Save Changes
                    </Button>
                </div>
            </div>
        </>
    );
}
