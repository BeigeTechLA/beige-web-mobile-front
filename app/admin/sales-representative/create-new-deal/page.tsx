"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors, Info } from "lucide-react";
import { toast } from "sonner";
import { set, format } from "date-fns";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";

import { API_BASE_URL } from "@/lib/apiConfig";
import DottedDivider from "@/components/admin/DottedDivider";
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
import { LocationPicker, darkThemeColors } from "@/src/components/booking/v2/component/LocationPicker";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import { FloatingLabelDropdown } from "@/components/generic/FloatingLabelDropdown";
import Topbar from "@/components/admin/Topbar";

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

export default function ClientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // Refs for scrolling logic
  const contentTypeRef = useRef<HTMLDivElement>(null);
  const shootTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const extraTeamRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const crewRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [formData, setFormData] = useState<BookingDataV3 & { selectedCrewIds: number[] }>({
    ...initialDataV3,
    selectedCrewIds: []
  });
  const [availableShootTypes, setAvailableShootTypes] = useState(newshootTypes);
  const [videoEditTypeOptions, setVideoEditTypeOptions] = useState<{ key: string; value: string }[]>([]);
  const [photoEditTypeOptions, setPhotoEditTypeOptions] = useState<{ key: string; value: string; note?: string }[]>([]);
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const [photoEditNote, setPhotoEditNote] = useState<string>("");
  const [thumbtack, setThumbtack] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [extraTeam, setExtraTeam] = useState<Record<string, number>>({});

  // Client Info State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New API State for Crew List
  const [crewList, setCrewList] = useState<any[]>([]);
  const [isLoadingCrew, setIsLoadingCrew] = useState(false);

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


  // 1. Generate Time Options on Mount
  useEffect(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
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
  }, []);

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

  // --- HANDLERS (Timezone Fix Applied) ---
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      updateData({ startDate: "", endDate: "" });
      return;
    }
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
      startDate: format(finalStart, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(finalEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    if (!timeKey) return updateData({ startDate: "" });
    const [hours, minutes] = timeKey.split(":").map(Number);
    const currentDate = parseDate(formData.startDate) || new Date();

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
    updateData({ startDate: format(selectedTime, "yyyy-MM-dd'T'HH:mm:ss") });
  };

  const handleEndTimeChange = (timeKey: string) => {
    if (!timeKey) return updateData({ endDate: "" });
    const [hours, minutes] = timeKey.split(":").map(Number);
    const baseDate = parseDate(formData.startDate) || new Date();

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
    updateData({ endDate: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss") });
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

  const filteredStartTimeOptions = useMemo(() => {
    if (!formData.startDate) return timeOptions;
    const selectedDate = parseDate(formData.startDate);
    const now = new Date();
    const isToday = selectedDate?.toDateString() === now.toDateString();
    if (!isToday) return timeOptions;
    const minKey = format(new Date(now.getTime() + 4 * 60 * 60 * 1000), "HH:mm");
    return timeOptions.filter((opt) => opt.key >= minKey);
  }, [formData.startDate, timeOptions]);

  const filteredEndTimeOptions = useMemo(() => {
    if (!formData.startDate) return timeOptions;
    const startKey = getStartTimeKey();
    return timeOptions.filter((opt) => opt.key > startKey);
  }, [formData.startDate, timeOptions]);

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

  const [selectionCounts, setSelectionCounts] = useState({
    videographer: 0,
    photographer: 0,
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const reqCounts = useMemo(() => {
    return {
      videographer: formData.contentType.includes("videographer") ? 1 + (extraTeam["videographer"] || 0) : 0,
      photographer: formData.contentType.includes("photographer") ? 1 + (extraTeam["photographer"] || 0) : 0
    };
  }, [formData.contentType, extraTeam]);

  const handleContinueClick = async () => {
    if (!clientName || !clientEmail || !clientPhone || !thumbtack || !intent || !formData.location || formData.contentType.length === 0 || !formData.shootType || !formData.startDate || !formData.endDate) {
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

      const payload = {
        client_name: clientName,
        guest_email: clientEmail,
        phone: clientPhone,
        intent: intent,
        lead_source: thumbtack,
        content_type: formData.contentType.filter(t => t !== 'editing').join(','),
        shoot_type: formData.shootType,
        start_date_time: formData.startDate,
        end_time: formData.endDate,
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
        skip_margin: true
      };

      const response = await fetch(`${API_BASE_URL}/sales/deals/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Deal created successfully!");
        router.push("/admin/sales-representative");
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

  return (
    <>
      <Topbar pathname={pathname} />

      <AssignmentConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeFinalizeDeal}
        videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
        photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
      />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans mb-20">
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="space-y-6">
          <h3 className="text-base lg:text-xl font-medium text-white/90">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <div className="relative space-y-2">
              <Label htmlFor="name" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Client Name</Label>
              <Input
                id="name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
              />
            </div>

            <div className="relative space-y-2">
              <Label htmlFor="email" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Email Id</Label>
              <Input
                id="email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
              />
            </div>

            <div className="relative space-y-2">
              <Label htmlFor="phone" className="absolute -top-2 lg:-top-3 left-4 px-2 bg-[#101010] text-sm lg:text-base text-white/60">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 p-4 text-white outline-none focus:border-[#1A1A1A] resize-none bg-[#101010] text-sm lg:text-base"
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
              labelBg={"bg-[#000]"}
              required
            />

            <FloatingLabelDropdown
              label="Intent Type"
              value={intent}
              options={intentOptions}
              onChange={(val) => setIntent(val)}
              placeholder="Choose an intent..."
              labelBg={"bg-[#000]"}
              required
            />
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
              onChange={(checked) => {
                if (checked) updateData({ contentType: ["videographer", "photographer"] });
                else updateData({ contentType: [] });
              }}
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
            <ContentTypeCheckbox label="AI Editing" subLabel="Coming Soon" icon={<Scissors size={20} />} checked={false} onChange={() => { }} disabled={true} />
            <ContentTypeCheckbox label="Livestream" subLabel="Coming Soon" icon={<Radio size={20} />} checked={false} onChange={() => { }} disabled={true} />
          </div>
        </div>
        <DottedDivider />

        <div ref={shootTypeRef}>
          <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
            {formData.contentType.length > 1 ? "Video and Photo Shoot Type" : "Shoot Type"}
          </h3>
          <FloatingLabelDropdown
            label="Shoot Type"
            value={formData.shootType}
            options={availableShootTypes.map(s => ({ value: s.key, label: s.title }))}
            onChange={(val) => {
              updateData({ shootType: val });
              scrollToRef(dateTimeRef);
            }}
            placeholder="Select the type of shoot"
            labelBg="bg-[#101010]"
            required
          />
        </div>
        <DottedDivider />

        <div ref={dateTimeRef}>
          <h3 className="text-base lg:text-xl font-medium mb-3 lg:mb-6 text-white/90">Shoot Date & Time</h3>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <DatePicker
                label="Select Date"
                value={formData.startDate ? parseDate(formData.startDate) : null}
                onChange={handleDateChange}
                minDate={new Date()}
                colors={datePickerColours}
                format="MM/dd/yyyy"
                sx={{ height: { xs: "56px", md: "82px" }, borderRadius: "16px" }}
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
        </div>
        <DottedDivider />

        <div ref={editsRef}>
          <h3 className="text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 text-white/90">Edits Needed?</h3>
          <div className="flex gap-4">
            <button
              onClick={() => { updateData({ editsNeeded: true }); }}
              disabled={formData.shootType === ""}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors ${formData.editsNeeded ? "bg-[#E8D1AB] text-black" : "bg-[#101010] text-[#A9A9A9]"}`}
            >
              <span className="font-medium text-sm lg:text-lg">Yes</span>
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${formData.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"}`}>
                {formData.editsNeeded && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
              </div>
            </button>
            <button
              onClick={() => { updateData({ editsNeeded: false }); }}
              disabled={formData.shootType === ""}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors ${!formData.editsNeeded ? "bg-[#E8D1AB] text-black" : "bg-[#101010] text-[#A9A9A9]"}`}
            >
              <span className="font-medium text-sm lg:text-lg">No</span>
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!formData.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"}`}>
                {!formData.editsNeeded && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
              </div>
            </button>
          </div>

          {formData.editsNeeded && (
            <div className="animate-in slide-in-from-top-4 duration-300 mt-4 lg:mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.contentType.includes("videographer") && videoEditTypeOptions.length > 0 && (
                  <MultiSelectDropdown
                    title="Video Edit Type"
                    options={videoEditTypeOptions}
                    value={formData.videoEditTypes}
                    onChange={(values) => updateData({ videoEditTypes: values })}
                    bgColour={"bg-[#101010]"}
                  />
                )}
                {formData.contentType.includes("photographer") && photoEditTypeOptions.length > 0 && (
                  <div>
                    <MultiSelectDropdown
                      title="Photo Edit Type"
                      options={photoEditTypeOptions}
                      value={formData.photoEditTypes}
                      onChange={(values) => updateData({ photoEditTypes: values })}
                      bgColour={"bg-[#101010]"}
                    />
                    {photoEditNote && (
                      <div className="mt-3 flex items-start gap-2 text-sm text-[#E8D1AB]">
                        <Info size={16} className="mt-0.5" />
                        <span>{photoEditNote}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DottedDivider />

        <div ref={extraTeamRef}>
          <div className="flex flex-col gap-3 lg:gap-6">
            <h3 className="text-base lg:text-xl font-medium text-white">Would you like to add additional creatives?</h3>
            <div className="flex gap-2 lg:gap-6">
              <button
                onClick={() => updateData({ addTeamMembers: true })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors ${formData.addTeamMembers ? "bg-[#E8D1AB] text-black" : "bg-[#101010] text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg">Yes</span>
                <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${formData.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}>
                  {formData.addTeamMembers && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                </div>
              </button>
              <button
                onClick={() => { updateData({ addTeamMembers: false }); setExtraTeam({}); updateData({ teamIncluded: [] }); }}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors ${!formData.addTeamMembers ? "bg-[#E8D1AB] text-black" : "bg-[#101010] text-[#A9A9A9]"}`}
              >
                <span className="font-medium text-sm lg:text-lg">No</span>
                <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${!formData.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}>
                  {!formData.addTeamMembers && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                </div>
              </button>
            </div>
          </div>

          {formData.addTeamMembers && (
            <div className="bg-[#171717] rounded-[20px] p-3 lg:p-6 border border-white/5 animate-in slide-in-from-top-4 mt-4 md:mt-6">
              <div className="flex flex-col gap-4">
                {availableRolesToAdd.length > 0 ? (
                  availableRolesToAdd.map((role) => (
                    <div key={role.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">{role.icon}</div>
                        <div className="text-lg font-medium text-white">{role.label}</div>
                      </div>
                      <QuantityControl
                        value={extraTeam[role.id] || 0}
                        onIncrease={() => handleExtraTeamChange(role.id, 1)}
                        onDecrease={() => handleExtraTeamChange(role.id, -1)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 italic">No eligible roles to add based on your selection.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DottedDivider />

        <div ref={locationRef}>
          <h3 className="text-xl font-medium text-white/90 mb-6">Select Location</h3>
          <LocationPicker
            value={formData.location}
            onChange={(address, details) => {
              updateData({
                location: address,
                locationDetails: details
              });
            }}
            placeholder="Search for a location"
            colors={darkThemeColors}
          />
        </div>
        <DottedDivider />

        <div ref={crewRef} className="space-y-6">
          {!formData.startDate || !formData.location ? (
            <div className="p-10 border border-dashed border-white/20 rounded-2xl text-center text-white/40">
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
              videographerCount={
                formData.contentType.includes("videographer")
                  ? 1 + (extraTeam["videographer"] as number || 0)
                  : 0
              }
              photographerCount={
                formData.contentType.includes("photographer")
                  ? 1 + (extraTeam["photographer"] as number || 0)
                  : 0
              }
            />
          )}
        </div>

        <DottedDivider />

        <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-4 lg:pt-9">
          <Button
            onClick={() => router.back()}
            className="h-14 lg:h-[72px] border border-[#8E8E8E] bg-transparent hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
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