"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { ContentTypeCheckbox } from "./components/ContentTypeCheckbox";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { Video, Camera, Scissors, MonitorPlay, Check } from "lucide-react";
import { shootTypes, weddingEditTypes, musicEditTypes, commercialEditTypes, tvSeriesEditTypes, podcastEditTypes, shortFilmEditTypes, movieEditTypes, corporateEventEditTypes, privateEventEditTypes } from "@/app/data/shootData";
import { DateTimePicker } from "@/src/components/booking/v2/component/DateTimePicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import MultiSelectDropdown from "@/components/book-a-shoot/MultiSelectDropdown";
import { parseDate } from "@/src/components/landing/lib/utils";

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
    iconColor: "#E8D1AB",
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

export const V3Step1ChooseService: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {
  const [editTypeOptions, setEditTypeOptions] = useState<{ key: string; value: string }[]>([]);

  // Update edit type options based on shoot type
  useEffect(() => {
    switch (data.shootType) {
      case "wedding": setEditTypeOptions(weddingEditTypes); break;
      case "music": setEditTypeOptions(musicEditTypes); break;
      case "commercial": setEditTypeOptions(commercialEditTypes); break;
      case "tv": setEditTypeOptions(tvSeriesEditTypes); break;
      case "podcast": setEditTypeOptions(podcastEditTypes); break;
      case "short_film": setEditTypeOptions(shortFilmEditTypes); break;
      case "movie": setEditTypeOptions(movieEditTypes); break;
      case "corporate": setEditTypeOptions(corporateEventEditTypes); break;
      case "private": setEditTypeOptions(privateEventEditTypes); break;
      default: setEditTypeOptions([]);
    }
  }, [data.shootType]);

  const toggleContentType = (type: "videographer" | "photographer" | "cinematographer" | "editing") => {
    const current = [...data.contentType];
    if (current.includes(type)) {
      updateData({ contentType: current.filter((t) => t !== type) });
    } else {
      updateData({ contentType: [...current, type] });
    }
  };

  const validate = () => {
    if (data.contentType.length === 0) {
      toast.error("Please select at least one content type");
      return false;
    }
    if (!data.shootType) {
      toast.error("Please select a video/photo shoot type");
      return false;
    }
    if (!data.startDate) {
      toast.error("Please select a start date and time");
      return false;
    }
    if (!data.endDate) {
      toast.error("Please select an end date and time");
      return false;
    }
    if (data.editsNeeded && (data.videoEditTypes.length === 0 && data.photoEditTypes.length === 0)) {
        // If edits are needed, at least one edit type should be selected (simplified check)
        // Actually, let's just warn if they selected edits needed but no edit type
         toast.error("Please select an edit type since you requested editing");
         return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const validateFutureDateTime = (date: Date | null) => {
    if (!date) return "Date & time is required";
    if (date < new Date()) return "Must be in the future";
    return null;
  };

  const validateEndDateTime = (date: Date | null, startDateISO: string) => {
    if (!date) return "End date & time is required";
    const startDate = parseDate(startDateISO);
    if (startDate && date < startDate) return "End date cannot be earlier than start date";
    return null;
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Create Your Project</h2>
        <div className="flex justify-center gap-2 mb-8">
            {/* Simple dot indicators handled by parent usually, but preserving layout */}
        </div>
      </div>

      {/* Content Type */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ContentTypeCheckbox
                label="Select All"
                icon={<Check size={20} />}
                checked={data.contentType.length === 3 && !data.contentType.includes('editing')}
                onChange={(checked) => {
                    if (checked) updateData({ contentType: ["videographer", "photographer", "cinematographer"] });
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
                label="Editing"
                subLabel="Coming Soon"
                icon={<Scissors size={20} />}
                checked={data.contentType.includes("editing")}
                onChange={() => toggleContentType("editing")}
            />
        </div>
      </div>

      {/* Shoot Type */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">Video and Photo Shoot Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ShootTypeCard
                title="Corporate Event"
                details="Conferences, summits, company offsites"
                image="/images/projects/Corporate.png"
                stats={[
                    { label: "People", value: "50-2K" },
                    { label: "Duration", value: "3-8 hrs" }
                ]}
                selected={data.shootType === "corporate"}
                onClick={() => updateData({ shootType: "corporate" })}
            />
             <ShootTypeCard
                title="Wedding"
                details="Ceremony, reception, highlight films"
                image="/images/projects/Wedding.png"
                 stats={[
                    { label: "People", value: "50-300" },
                    { label: "Duration", value: "6-10 hrs" }
                ]}
                selected={data.shootType === "wedding"}
                onClick={() => updateData({ shootType: "wedding" })}
            />
            <ShootTypeCard
                title="Private"
                details="Parties, birthdays, family events"
                image="/images/projects/Private.png"
                 stats={[
                    { label: "People", value: "10-100" },
                    { label: "Duration", value: "2-5 hrs" }
                ]}
                selected={data.shootType === "private"}
                onClick={() => updateData({ shootType: "private" })}
            />
        </div>
        
        {/* Dropdown for other types if needed, or expand cards */}
        <div className="mt-4">
             <DropdownSelect
              title="Other Shoot Types"
              options={shootTypes.filter(t => !['corporate', 'wedding', 'private'].includes(t.key))}
              value={['corporate', 'wedding', 'private'].includes(data.shootType) ? "" : data.shootType}
              onChange={(value) => updateData({ shootType: value })}
              bgColour={"bg-[#101010]"}
            />
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">Shoot Date & Time</h3>
        <div className="flex flex-col lg:flex-row gap-6">
             <DateTimePicker
              label="Start Date & Time"
              value={parseDate(data.startDate)}
              onChange={(date) => {
                if (!date || isNaN(date.getTime())) {
                  updateData({ startDate: "" });
                  return;
                }
                updateData({ startDate: date.toISOString() });
              }}
              validate={validateFutureDateTime}
              colors={datePickerColours}
            />
            <DateTimePicker
              label="End Date & Time"
              disabled={data.startDate === ""}
              value={parseDate(data.endDate)}
              onChange={(date) => {
                if (!date || isNaN(date.getTime())) {
                  updateData({ endDate: "" });
                  return;
                }
                updateData({ endDate: date.toISOString() });
              }}
              minDateTime={new Date(data.startDate)}
              validate={(date) => validateEndDateTime(date, data.startDate)}
              colors={datePickerColours}
            />
        </div>
      </div>

      {/* Edits Needed */}
      <div>
        <h3 className="text-xl font-medium text-white/90 mb-6">Edits Needed?</h3>
        
        <div className="flex gap-4 mb-6">
            <button
                onClick={() => updateData({ editsNeeded: true })}
                className={`px-6 py-3 rounded-xl border flex items-center gap-2 transition-all ${
                    data.editsNeeded 
                    ? "bg-[#E8D1AB] border-[#E8D1AB] text-black font-medium" 
                    : "bg-[#101010] border-white/20 text-white"
                }`}
            >
                Yes
                {data.editsNeeded && <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center"><Check size={10} className="text-[#E8D1AB]" /></div>}
            </button>
             <button
                onClick={() => updateData({ editsNeeded: false })}
                className={`px-6 py-3 rounded-xl border flex items-center gap-2 transition-all ${
                    !data.editsNeeded 
                    ? "bg-[#E8D1AB] border-[#E8D1AB] text-black font-medium" 
                    : "bg-[#101010] border-white/20 text-white"
                }`}
            >
                No
                {!data.editsNeeded && <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center"><Check size={10} className="text-[#E8D1AB]" /></div>}
            </button>
        </div>

        {data.editsNeeded && (
            <div className="bg-[#171717] p-6 rounded-[20px] animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Check size={16} className="text-[#E8D1AB]" />
                    Editing includes
                </h4>
                <p className="text-white/60 text-sm mb-6">
                    Professional editing includes color grading, sound mixing, and basic revisions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <label className="text-sm text-white/80 mb-2 block">Video Edit Type</label>
                         <MultiSelectDropdown
                            title="Select Video Edits"
                            options={editTypeOptions}
                            value={data.videoEditTypes}
                            onChange={(values) => updateData({ videoEditTypes: values })}
                            bgColour={"bg-[#101010]"}
                         />
                    </div>
                     <div>
                         <label className="text-sm text-white/80 mb-2 block">Photo Edit Type</label>
                         <MultiSelectDropdown
                            title="Select Photo Edits"
                            options={[
                                { key: "basic_retouch", value: "Basic Retouching" },
                                { key: "high_end_retouch", value: "High-End Retouching" },
                                { key: "color_correction", value: "Color Correction Only" }
                            ]}
                            value={data.photoEditTypes}
                            onChange={(values) => updateData({ photoEditTypes: values })}
                            bgColour={"bg-[#101010]"}
                         />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-white/10">
        <Button
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
        >
            Back
        </Button>
        <Button
            onClick={handleNext}
            className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] min-w-[140px] h-12 text-lg rounded-xl"
        >
            Continue
        </Button>
      </div>

    </div>
  );
};
