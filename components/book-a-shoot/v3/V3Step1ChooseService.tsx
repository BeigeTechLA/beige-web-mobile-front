"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { ContentTypeCheckbox } from "./components/ContentTypeCheckbox";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import {
  Video,
  Camera,
  Scissors,
  MonitorPlay,
  Check,
  Radio,
  Info,
  Clock,
} from "lucide-react";
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
import { DateTimePicker } from "@/src/components/booking/v2/component/DateTimePicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import MultiSelectDropdown from "@/components/book-a-shoot/MultiSelectDropdown";
import { parseDate } from "@/src/components/landing/lib/utils";
import DatePicker from "@/components/ui/Datepicker";
import { set, format } from "date-fns";

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

export const V3Step1ChooseService: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
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
      for (let j = 0; j < 60; j += 30) {
        const hour = i.toString().padStart(2, "0");
        const minute = j.toString().padStart(2, "0");
        const key = `${hour}:${minute}`;

        const date = new Date();
        date.setHours(i);
        date.setMinutes(j);
        const value = format(date, "H:mm");

        options.push({ key, value });
      }
    }
    setTimeOptions(options);
  }, []);

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      updateData({ startDate: "", endDate: "" });
      return;
    }

    // Preserve times if they exist, otherwise default start to 9am, end to 5pm?
    // Or just set date part.

    let newStart = data.startDate
      ? parseDate(data.startDate)
      : set(date, { hours: 9, minutes: 0 });
    let newEnd = data.endDate
      ? parseDate(data.endDate)
      : set(date, { hours: 17, minutes: 0 });

    if (!newStart) newStart = set(date, { hours: 9, minutes: 0 });
    if (!newEnd) newEnd = set(date, { hours: 17, minutes: 0 });

    // Update the date part of both
    newStart = set(newStart, {
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate(),
    });
    newEnd = set(newEnd, {
      year: date.getFullYear(),
      month: date.getMonth(),
      date: date.getDate(),
    });

    updateData({
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
    });
  };

  const handleStartTimeChange = (timeKey: string) => {
    if (!timeKey) return;
    const [hours, minutes] = timeKey.split(":").map(Number);

    const currentDate = data.startDate ? parseDate(data.startDate) : new Date();
    // If no date selected yet, maybe warn? or just use today?
    // Assuming date is selected first or we default to today/tomorrow.

    if (!currentDate) return;

    const newStart = set(currentDate, { hours, minutes });
    updateData({ startDate: newStart.toISOString() });
  };

  const handleEndTimeChange = (timeKey: string) => {
    if (!timeKey) return;
    const [hours, minutes] = timeKey.split(":").map(Number);

    let currentDate = data.endDate
      ? parseDate(data.endDate)
      : data.startDate
      ? parseDate(data.startDate)
      : new Date();
    if (!currentDate) return;

    const newEnd = set(currentDate, { hours, minutes });
    updateData({ endDate: newEnd.toISOString() });
  };

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

  const toggleContentType = (
    type: "videographer" | "photographer" | "cinematographer" | "editing"
  ) => {
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
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      toast.error("End time must be after start time");
      return false;
    }
    if (data.editsNeeded) {
      const needsVideoEdit =
        data.contentType.includes("videographer") ||
        data.contentType.includes("cinematographer");
      const needsPhotoEdit = data.contentType.includes("photographer");

      if (needsVideoEdit && data.videoEditTypes.length === 0) {
        toast.error("Please select at least one video edit type");
        return false;
      }

      if (needsPhotoEdit && data.photoEditTypes.length === 0) {
        toast.error("Please select at least one photo edit type");
        return false;
      }

      if (
        !needsVideoEdit &&
        !needsPhotoEdit &&
        data.videoEditTypes.length === 0 &&
        data.photoEditTypes.length === 0
      ) {
        toast.error("Please select an edit type since you requested editing");
        return false;
      }
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
    if (startDate && date < startDate)
      return "End date cannot be earlier than start date";
    return null;
  };

  return (
    <div className="flex flex-col gap-15 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
          Create Your Project
        </h2>
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
            checked={
              data.contentType.length === 3 &&
              !data.contentType.includes("editing")
            }
            onChange={(checked) => {
              if (checked)
                updateData({
                  contentType: [
                    "videographer",
                    "photographer",
                    "cinematographer",
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
            label="Editing (COMING SOON)"
            subLabel=""
            icon={<Scissors size={20} />}
            checked={false}
            onChange={() => {}}
            disabled={true}
          />
          <ContentTypeCheckbox
            label="Livestream (COMING SOON)"
            subLabel=""
            icon={<Radio size={20} />}
            checked={false}
            onChange={() => {}}
            disabled={true}
          />
        </div>
      </div>

      {data.contentType.length > 0 && (
        <>
          {/* Shoot Type */}
          <div className="pt-8 lg:pt-15 border-t border-white/10">
            <h3 className="text-xl font-medium text-white/90 mb-6">
              {(data.contentType.includes("videographer") ||
                data.contentType.includes("cinematographer")) &&
              data.contentType.includes("photographer")
                ? "Video and Photo Shoot Type"
                : data.contentType.includes("videographer") ||
                  data.contentType.includes("cinematographer")
                ? "Video Shoot Type"
                : "Photo Shoot Type"}
            </h3>

            <div className="flex flex-nowrap gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
              {availableShootTypes.map((type) => (
                <div
                  key={type.key}
                  className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-start"
                >
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
            <h3 className="text-xl font-medium text-white/90 mb-6">
              Shoot Date & Time
            </h3>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <DatePicker
                  label="Select Date"
                  value={data.startDate ? parseDate(data.startDate) : null}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  colors={datePickerColours}
                  format="MM/dd/yyyy"
                  sx={{
                    height: { xs: "56px", lg: "82px" },
                    borderRadius: "16px",
                  }}
                />
              </div>
              <div className="flex-1">
                <DropdownSelect
                  title="Start Time"
                  options={timeOptions}
                  value={getStartTimeKey()}
                  onChange={handleStartTimeChange}
                  bgColour="bg-[#101010]"
                />
              </div>
              <div className="flex-1">
                <DropdownSelect
                  title="End Time"
                  options={timeOptions}
                  value={getEndTimeKey()}
                  onChange={handleEndTimeChange}
                  bgColour="bg-[#101010]"
                />
              </div>
            </div>
          </div>

          {/* Edits Needed */}
          <div className="pt-8 lg:pt-15 border-t border-white/10">
            <h3 className="text-lg lg:text-[28px] font-medium text-white/90 mb-6">
              Edits Needed?
            </h3>

            <div className="flex gap-4">
              <button
                onClick={() => updateData({ editsNeeded: true })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${
                  data.editsNeeded
                    ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                    : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                    data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                  }`}
                >
                  {data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => updateData({ editsNeeded: false })}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${
                  !data.editsNeeded
                    ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                    : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                    !data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
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
                <h4 className="text-white font-medium mb-4 flex items-center gap-2 lg:text-xl">
                  <Info size={24} className="text-white" />
                  Editing includes
                </h4>
                <p className="text-white/60 text-sm mb-11">
                  Professional editing includes color grading, sound mixing, and
                  basic revisions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Video Edit Type - Show if videographer or cinematographer selected */}
                  {(data.contentType.includes("videographer") ||
                    data.contentType.includes("cinematographer")) &&
                    editTypeOptions.length > 0 && (
                      <div>
                        <MultiSelectDropdown
                          title="Video Edit Type"
                          options={editTypeOptions}
                          value={data.videoEditTypes}
                          onChange={(values) =>
                            updateData({ videoEditTypes: values })
                          }
                          bgColour={"bg-[#101010]"}
                        />
                      </div>
                    )}

                  {/* Photo Edit Type - Show if photographer selected */}
                  {data.contentType.includes("photographer") &&
                    photoEditTypeOptions.length > 0 && (
                      <div>
                        <MultiSelectDropdown
                          title="Photo Edit Type"
                          options={photoEditTypeOptions}
                          value={data.photoEditTypes}
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
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 lg:gap-6 items-center pt-8 lg:pt-15 border-t border-white/10">
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
