"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { ContentTypeCheckbox } from "./components/ContentTypeCheckbox";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { Video, Camera, Scissors, MonitorPlay, Check, Radio, Info } from "lucide-react";
import { newshootTypes, weddingEditTypes, musicEditTypes, commercialEditTypes, tvSeriesEditTypes, podcastEditTypes, shortFilmEditTypes, movieEditTypes, corporateEventEditTypes, privateEventEditTypes } from "@/app/data/shootData";
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
    <div className="flex flex-col gap-15 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">Create Your Project</h2>
        {/* <div className="flex justify-center gap-2 mb-8"> */}
        {/* Simple dot indicators handled by parent usually, but preserving layout */}
        {/* </div> */}
      </div>

      {/* Content Type */}
      <div className="pt-8 lg:pt-15 border-t border-white/10">
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
            label="Editing only"
            subLabel="Coming Soon"
            icon={<Scissors size={20} />}
            checked={data.contentType.includes("editing")}
            onChange={() => toggleContentType("editing")}
            disabled={true}
          />
          <ContentTypeCheckbox
            label="Livestreaming"
            subLabel="Coming Soon"
            icon={<Radio size={20} />}
            checked={data.contentType.includes("editing")}
            onChange={() => toggleContentType("editing")}
            disabled={true}
          />
        </div>
      </div>

      {
        data.contentType.length > 0 &&
        <>
          {/* Shoot Type */}
          <div className="pt-8 lg:pt-15 border-t border-white/10">
            <h3 className="text-xl font-medium text-white/90 mb-6">Video and Photo Shoot Type</h3>

            <div className="flex flex-nowrap gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
              {newshootTypes.map((type) => (
                <div key={type.key} className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-start">
                  <ShootTypeCard
                    title={type.title} // Assuming your shootTypes array has label
                    details={type.details} // and details
                    image={type.image}
                    stats={type.stats}
                    selected={data.shootType === type.key}
                    onClick={() => updateData({ shootType: type.key })}
                  />
                </div>
              ))}
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ShootTypeCard
                title="Corporate Event"
                details="Conferences, summits, company offsites"
                image="/images/projects/interior.png"
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
                image="/images/projects/smiles.png"
                stats={[
                  { label: "People", value: "10-100" },
                  { label: "Duration", value: "2-5 hrs" }
                ]}
                selected={data.shootType === "private"}
                onClick={() => updateData({ shootType: "private" })}
              />
            </div> */}

            {/* Dropdown for other types if needed, or expand cards */}
            {/* <div className="mt-4">
              <DropdownSelect
                title="Other Shoot Types"
                options={shootTypes.filter(t => !['corporate', 'wedding', 'private'].includes(t.key))}
                value={['corporate', 'wedding', 'private'].includes(data.shootType) ? "" : data.shootType}
                onChange={(value) => updateData({ shootType: value })}
                bgColour={"bg-[#101010]"}
              />
            </div> */}
          </div>

          {/* Date & Time */}
          <div className="pt-8 lg:pt-15 border-t border-white/10">
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
          <div className="pt-8 lg:pt-15 border-t border-white/10">
            <h3 className="text-lg lg:text-[28px] font-medium text-white/90 mb-6">Edits Needed?</h3>

            <div className="flex gap-4">
              <button
                onClick={() => updateData({ editsNeeded: true })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${data.editsNeeded
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  Yes
                </span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"}`}
                >
                  {data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => updateData({ editsNeeded: false })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!data.editsNeeded
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-transparent border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">
                  No
                </span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"}`}
                >
                  {!data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
            </div>

            {data.editsNeeded && (
              <div className="animate-in slide-in-from-top-4 duration-300 mt-4 lg:mt-8">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2 lg:text-xl">
                  <Info size={24} className="text-white" />
                  Editing includes
                </h4>
                {/* This text should be dependant on shoot type seelected */}
                <p className="text-white/60 text-sm mb-11">
                  Professional editing includes color grading, sound mixing, and basic revisions. 
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {/* <label className="text-sm text-white/80 mb-2 block">Video Edit Type</label> */}
                    <MultiSelectDropdown
                      title="Video Edit Type"
                      options={editTypeOptions}
                      value={data.videoEditTypes}
                      onChange={(values) => updateData({ videoEditTypes: values })}
                      bgColour={"bg-[#101010]"}
                    />
                  </div>
                  <div>
                    {/* <label className="text-sm text-white/80 mb-2 block">Photo Edit Type</label> */}
                    <MultiSelectDropdown
                      title="Photo Edit Type"
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
        </>
      }

      {/* Navigation */}
      <div className="flex gap-3 lg:gap-6 items-center pt-8 pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
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
