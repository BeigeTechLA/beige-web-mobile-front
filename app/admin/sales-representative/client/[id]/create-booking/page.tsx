"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Radio, SquaresUnite, Video, Camera, Scissors, Info } from "lucide-react";
import { toast } from "sonner";
import { set, format } from "date-fns";

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

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;

const editTypeOptions = newshootTypes.map((shoot) => ({
  key: shoot.key,    // used for logic/selection
  value: shoot.title // used for display in pills and list
}));

const TEAM_ROLES = [
  { id: "videographer", label: "Videographer", price: 250, icon: <Video size={28} /> },
  { id: "photographer", label: "Photographer", price: 250, icon: <Camera size={28} /> },
];

export default function ClientDetailPage() {
  const router = useRouter();
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

  const includedRoles = formData.contentType.filter(t => t !== 'editing').map(t => {
    const role = TEAM_ROLES.find(r => r.id === t);
    return role ? { ...role, count: 1 } : null;
  }).filter(Boolean);


  const updateData = useCallback((newData: Partial<BookingDataV3>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const toggleContentType = (
    type: "videographer" | "photographer" | "editing"
  ) => {
    const current = [...formData.contentType];
    const isCurrentlySelected = current.includes(type);

    // Calculate the new content type array
    const nextContentType = isCurrentlySelected
      ? current.filter((t) => t !== type)
      : [...current, type];

    if (nextContentType.length === 0) {
      // Reset formData object to initial state if no content types are selected
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

  const availableRolesToAdd = TEAM_ROLES.filter(role => {
    if (formData.contentType.includes(role.id)) return true;
    return false;
  });

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

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      updateData({ startDate: "", endDate: "" });
      return;
    }

    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    let newStart: Date;
    let newEnd: Date;

    if (isToday) {
      newStart = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const mins = newStart.getMinutes();
      if (mins > 0 && mins <= 30) {
        newStart.setMinutes(30, 0, 0);
      } else if (mins > 30) {
        newStart.setHours(newStart.getHours() + 1, 0, 0, 0);
      } else {
        newStart.setMinutes(0, 0, 0);
      }

      // 3. End time = Start time + 8 hours
      newEnd = new Date(newStart.getTime() + 8 * 60 * 60 * 1000);
    } else {
      // Default for future dates: 9 AM to 5 PM
      newStart = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
      newEnd = set(date, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
    }

    // Ensure the date part is strictly what was selected in the picker
    const finalStart = set(newStart, {
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate(),
    });

    const finalEnd = set(newEnd, {
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate(),
    });

    updateData({
      startDate: finalStart.toISOString(),
      endDate: finalEnd.toISOString(),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    if (!timeKey) {
      updateData({ startDate: "" });
      return;
    }

    const [hours, minutes] = timeKey.split(":").map(Number);
    const currentDate = formData.startDate ? parseDate(formData.startDate) : new Date();
    if (!currentDate) {
      // Handle the error state or fallback
      return;
    }

    // Ensure we don't select a time before the current time
    const now = new Date();
    const selectedTime = new Date(currentDate.setHours(hours, minutes));

    if (selectedTime < now) {
      toast.error("Selected time must be later than the current time.");
      return; // Don't update the time if it's invalid
    }

    // Enforce a 4-hour gap for same-day bookings
    const minimumTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Add 4 hours to current time

    if (selectedTime < minimumTime) {
      toast.error("You must select a start time at least 4 hours from now.");
      return; // Don't update the time if it's invalid
    }

    const newStart = set(currentDate, { hours, minutes });
    updateData({ startDate: newStart.toISOString() });
  };

  const handleEndTimeChange = (timeKey: string) => {
    if (!timeKey) {
      updateData({ endDate: "" });
      return;
    }
    // if (!timeKey) return;
    const [hours, minutes] = timeKey.split(":").map(Number);

    let currentDate = formData.endDate
      ? parseDate(formData.endDate)
      : formData.startDate
        ? parseDate(formData.startDate)
        : new Date();
    if (!currentDate) return;

    const newEnd = set(currentDate, { hours, minutes });
    updateData({ endDate: newEnd.toISOString() });
    scrollToRef(editsRef);
  };

  const filteredEndTimeOptions = React.useMemo(() => {
    // If no start date/time is selected, show all
    if (!formData.startDate) return timeOptions;

    const startTimeKey = getStartTimeKey();

    // Only show times that are AFTER the selected start time
    return timeOptions.filter((opt) => opt.key > startTimeKey);
  }, [formData.startDate, timeOptions]);

  // --- Now the useMemos can safely use them ---
  const filteredStartTimeOptions = React.useMemo(() => {
    if (!formData.startDate) return timeOptions;

    const selectedDate = parseDate(formData.startDate);
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
  }, [formData.startDate, timeOptions]);

  const getStartTimeKey = () => {
    if (!formData.startDate) return "";
    const date = parseDate(formData.startDate);
    if (!date) return "";
    return format(date, "HH:mm");
  };

  const getEndTimeKey = () => {
    if (!formData.endDate) return "";
    const date = parseDate(formData.endDate);
    if (!date) return "";
    return format(date, "HH:mm");
  };

  const handleExtraTeamChange = (id: string, delta: number) => {
    const nextExtra = { ...extraTeam };
    const current = nextExtra[id] || 0;
    const next = Math.max(0, current + delta);
    nextExtra[id] = next;
    setExtraTeam(nextExtra);

    // Also save this as string description to formData so it's not lost
    const summary = Object.entries(nextExtra)
      .filter(([_, count]) => count > 0)
      .map(([roleId, count]) => `${TEAM_ROLES.find(r => r.id === roleId)?.label || roleId} x${count}`);

    // Calculate total crew count (base + extra)
    const baseCount = includedRoles.length;
    const extraCount = Object.values(nextExtra).reduce((a, b) => a + b, 0);

    updateData({
      teamIncluded: summary,
      crewCount: baseCount + extraCount
    });
  };

  return (
    <div className="text-white font-sans mb-20">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
      >
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="flex items-center gap-5">
        <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
          {/* {initials} */}
          IN
        </div>
        <div className="flex gap-2 items-center">
          <h1 className="lg:text-[22px] font-semibold">
            {/* {clientName} */}
            Client Name
          </h1>
          <IntentBadge intent={"Hot"} />
        </div>
      </div>
      <DottedDivider />

      {/* Content Type */}
      <div ref={contentTypeRef} className="">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentTypeCheckbox
            label="Select All"
            icon={<SquaresUnite size={20} />}
            checked={
              formData.contentType.length === 2 && //As cinematography is not to be included in the length count at present
              !formData.contentType.includes("editing")
            }
            onChange={(checked) => {
              if (checked)
                updateData({
                  contentType: [
                    "videographer",
                    "photographer",
                  ],
                });
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
      <DottedDivider />

      <div ref={shootTypeRef} className="">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
          {!formData.contentType || formData.contentType.length === 0
            ? "Shoot Type"
            : formData.contentType.includes("videographer") &&
              formData.contentType.includes("photographer")
              ? "Video and Photo Shoot Type"
              : formData.contentType.includes("videographer") ||
                formData.contentType.includes("cinematographer")
                ? "Video Shoot Type"
                : "Photo Shoot Type"}
        </h3>
        <MultiSelectDropdown
          title="Shoot Type"
          options={editTypeOptions}
          value={formData.shootType} //This might need to change if the element needs to accept multiselect
          onChange={(values) =>
            updateData({ shootType: values })
          }
          bgColour="bg-[#101010]"
          maxDisplay={5}
          fullWidth={true}
        />
      </div>
      <DottedDivider />

      {/* Date & Time */}
      <div ref={dateTimeRef} className="">
        <h3 className={`text-base lg:text-xl font-medium mb-3 lg:mb-6 transition-colors text-white/90`}>
          Shoot Date & Time
        </h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <DatePicker
              label="Select Date"
              value={formData.startDate ? parseDate(formData.startDate) : null}
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
      </div>
      <DottedDivider />

      {/* Edits Needed */}
      <div ref={editsRef} className="">
        <h3 className={`text-lg lg:text-[28px] font-medium mb-3 lg:mb-6 transition-colors text-white/90`}>
          Edits Needed?
        </h3>

        <div className="flex gap-4">
          <button
            onClick={() => {
              updateData({ editsNeeded: true });
              scrollToRef(navigationRef);
            }}
            disabled={formData.shootType === ""}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${formData.editsNeeded ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
          >
            <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${formData.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                }`}
            >
              {formData.editsNeeded && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>
          <button
            onClick={() => {
              updateData({ editsNeeded: false });
              scrollToRef(navigationRef);
            }}
            disabled={formData.shootType === ""}
            className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!formData.editsNeeded ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
          >
            <span className="font-medium text-sm lg:text-lg pr-2">No</span>
            <div
              className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!formData.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                }`}
            >
              {!formData.editsNeeded && (
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              )}
            </div>
          </button>
        </div>

        {formData.editsNeeded && (
          <div className="animate-in slide-in-from-top-4 duration-300 mt-4 lg:mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.contentType.includes("videographer") &&
                editTypeOptions.length > 0 && (
                  <div>
                    <MultiSelectDropdown
                      title="Video Edit Type"
                      options={editTypeOptions}
                      value={formData.videoEditTypes}
                      onChange={(values) =>
                        updateData({ videoEditTypes: values })
                      }
                      bgColour={"bg-[#101010]"}
                    />
                  </div>
                )}

              {/* Photo Edit Type - Show if photographer selected */}
              {formData.contentType.includes("photographer") &&
                photoEditTypeOptions.length > 0 && (
                  <div>
                    <MultiSelectDropdown
                      title="Photo Edit Type"
                      options={photoEditTypeOptions}
                      value={formData.photoEditTypes}
                      onChange={(values) =>
                        updateData({ photoEditTypes: values })
                      }
                      bgColour={"bg-[#101010]"}
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
          </div>
        )}
      </div>
      <DottedDivider />

      {/* Additional Creatives */}
      <div ref={extraTeamRef}>
        <div className="flex flex-col gap-3 lg:gap-6">
          <h3 className="text-base lg:text-xl font-medium text-white">Would you like to add additional creatives?</h3>
          <div className="flex gap-2 lg:gap-6">
            <button
              onClick={() => updateData({ addTeamMembers: true })}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${formData.addTeamMembers ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
            >
              <span className="font-medium text-sm lg:text-lg pr-2">
                Yes
              </span>
              <div
                className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${formData.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}
              >
                {formData.addTeamMembers && (
                  <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                )}
              </div>
            </button>
            <button
              onClick={() => {
                updateData({ addTeamMembers: false });
                setExtraTeam({});
                updateData({ teamIncluded: [] });
                scrollToRef(locationRef);
              }}
              className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-colors duration-300 ease-in-out ${!formData.addTeamMembers ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black" : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"}`}
            >
              <span className="font-medium text-sm lg:text-lg pr-2">
                No
              </span>
              <div
                className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${!formData.addTeamMembers ? "bg-black" : "border border-[#E5E5E5]"}`}
              >
                {!formData.addTeamMembers && (
                  <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                )}
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
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                        {role.icon}
                      </div>
                      <div>
                        <div className="text-lg font-medium text-white">{role.label}</div>
                      </div>
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

      {/* Location */}
      <div ref={locationRef} className="">
        <h3 className="text-xl font-medium text-white/90 mb-6">Select Location</h3>
        <LocationPicker
          value={formData.location}
          onChange={(address: string, details?: any) => {
            updateData({ location: address, locationDetails: details });
          }}
          placeholder="Search for a location"
          colors={darkThemeColors}
        />
      </div>
      <DottedDivider />

      <CreativeProfileSelector />

      <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-4 lg:pt-9">
        <Button
          // onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          // onClick={handleNext}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
