"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookingDataV3 } from "./types";
import { ContentTypeCheckbox } from "./components/ContentTypeCheckbox";
import { ShootTypeCard } from "./components/ShootTypeCard";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { Video, Camera, Scissors, MonitorPlay, Check, Radio, Info, SquaresUnite, } from "lucide-react";
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
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import MultiSelectDropdown from "@/components/book-a-shoot/MultiSelectDropdown";
import { parseDate } from "@/src/components/landing/lib/utils";
import DatePicker from "@/components/ui/Datepicker";
import { set, format } from "date-fns";
import { useTrackEarlyInterestMutation } from "@/lib/redux/features/sales/salesApi";

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

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;

export const V3Step1ChooseService: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const { user, isAuthenticated } = useAuth();

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

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const isAllVisible = visibleCount >= availableShootTypes.length;

  const [trackEarlyInterest] = useTrackEarlyInterestMutation();

  const emailRef = useRef<HTMLDivElement>(null);
  const contentTypeRef = useRef<HTMLDivElement>(null);
  const shootTypeRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const editsRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user?.email && !data.email) {
      updateData({ email: user.email });
    }
  }, [isAuthenticated, user?.email, data.email, updateData]);

  const handleViewToggle = () => {
    if (visibleCount >= availableShootTypes.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, availableShootTypes.length)
      );
    }
  };

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
        const value = format(date, "h:mm aa");

        options.push({ key, value });
      }
    }
    setTimeOptions(options);
  }, []);

  // --- Move these helpers up here ---
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

  // --- Now the useMemos can safely use them ---
  const filteredStartTimeOptions = React.useMemo(() => {
    if (!data.startDate) return timeOptions;
    
    const selectedDate = parseDate(data.startDate);
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
  }, [data.startDate, timeOptions]);

  const filteredEndTimeOptions = React.useMemo(() => {
    // If no start date/time is selected, show all
    if (!data.startDate) return timeOptions;
    
    const startTimeKey = getStartTimeKey();
    
    // Only show times that are AFTER the selected start time
    return timeOptions.filter((opt) => opt.key > startTimeKey);
  }, [data.startDate, timeOptions]);

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
  const currentDate = data.startDate ? parseDate(data.startDate) : new Date();

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

    let currentDate = data.endDate
      ? parseDate(data.endDate)
      : data.startDate
        ? parseDate(data.startDate)
        : new Date();
    if (!currentDate) return;

    const newEnd = set(currentDate, { hours, minutes });
    updateData({ endDate: newEnd.toISOString() });
    scrollToRef(editsRef);
  };

  // const getStartTimeKey = () => {
  //   if (!data.startDate) return "";
  //   const date = parseDate(data.startDate);
  //   if (!date) return "";
  //   return format(date, "HH:mm");
  // };

  // const getEndTimeKey = () => {
  //   if (!data.endDate) return "";
  //   const date = parseDate(data.endDate);
  //   if (!date) return "";
  //   return format(date, "HH:mm");
  // };

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
    type: "videographer" | "photographer" | "editing"
  ) => {
    const current = [...data.contentType];
    const isCurrentlySelected = current.includes(type);

    // Calculate the new content type array
    const nextContentType = isCurrentlySelected
      ? current.filter((t) => t !== type)
      : [...current, type];

    if (nextContentType.length === 0) {
      // Reset data object to initial state if no content types are selected
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

  const validate = () => {
    if (!data.email) {
      toast.error("Please enter your email address");
      return false;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
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
      const needsVideoEdit = data.contentType.includes("videographer")
      // || data.contentType.includes("cinematographer");  Commented cinematographer as it is not being mentioned anywhere in UI
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

  const handleNext = async () => {
    if (!validate()) return;

    try {
      const res = await trackEarlyInterest({
        guest_email: data.email,
        user_id: user?.id,
        content_type: data.contentType.join(","),
        shoot_type: data.shootType,
        client_name: user?.name,
      }).unwrap();

      updateData({
        bookingId: res.data.booking_id,
      });

      onNext();
    } catch (err) {
      toast.error("Failed to start booking. Please try again.");
    }
  };

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
  return (
    <div className="flex flex-col gap-6 md:gap-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">
          Create Your Project
        </h2>
      </div>

      {/* Email Field */}
      <div ref={emailRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
          Email Address <span className="text-[#E8D1AB]">*</span>
        </h3>
        <input
          type="email"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(data.email)) {
                scrollToRef(contentTypeRef);
                (e.target as HTMLInputElement).blur(); // Remove focus
              }
            }
          }}
          onBlur={() => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(data.email)) scrollToRef(contentTypeRef);
          }}
          placeholder="your@email.com"
          className="w-full h-14 lg:h-[82px] bg-[#101010] border border-white/10 rounded-2xl px-4 lg:px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E8D1AB] transition-colors"
        />
        {isAuthenticated && (
          <p className="mt-2 text-sm text-white/60">
            Your email has been auto-filled. You can change it if needed.
          </p>
        )}
      </div>

      {/* Content Type */}
      <div ref={contentTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
        <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">Content Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentTypeCheckbox
            label="Select All"
            icon={<SquaresUnite size={20} />}
            checked={
              // data.contentType.length === 3 &&
              data.contentType.length === 2 && //As cinematography is not to be included in the length count at present
              !data.contentType.includes("editing")
            }
            onChange={(checked) => {
              if (checked)
                updateData({
                  contentType: [
                    "videographer",
                    "photographer",
                    // "cinematographer", This is not being mentioned in UI. Hence commented out
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

      {data.contentType.length > 0 && (
        <>
          {/* Shoot Type */}
          <div ref={shootTypeRef} className="pt-6 lg:pt-15 border-t border-white/10">
            <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
              {data.contentType.includes("videographer") &&
                //  ||data.contentType.includes("cinematographer")) && : Commented cinematographer as it is not being mentioned anywhere in UI
                data.contentType.includes("photographer")
                ? "Video and Photo Shoot Type"
                : data.contentType.includes("videographer") ||
                  data.contentType.includes("cinematographer")
                  ? "Video Shoot Type"
                  : "Photo Shoot Type"}
            </h3>

            {/* <div className="flex flex-nowrap gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"> */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
              {/* {availableShootTypes.map((type) => ( */}
              {availableShootTypes.slice(0, visibleCount).map((type) => (
                <div
                  key={type.key}
                  className="min-w-[280px] md:min-w-[350px] flex-shrink-0 snap-start"
                >
                  <ShootTypeCard
                    title={type.title} // Assuming your shootTypes array has label
                    details={type.details} // and details
                    image={type.image}
                    // stats={type.stats}
                    selected={data.shootType === type.key}
                    onClick={() => {
                      updateData({ shootType: type.key });
                      scrollToRef(dateTimeRef);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleViewToggle}
                className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 rounded-lg  text-sm md:text-lg font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)]"
              >
                <span className="">{isAllVisible ? "View Less" : "View More"}</span>
              </Button>
            </div>
          </div>

          {/* Date & Time */}
          <div ref={dateTimeRef} className="pt-6 lg:pt-15 border-t border-white/10">
            <h3 className="text-base lg:text-xl font-medium text-white/90 mb-3 lg:mb-6">
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

          {/* Edits Needed */}
          <div ref={editsRef} className="pt-6 lg:pt-15 border-t border-white/10">
            <h3 className="text-lg lg:text-[28px] font-medium text-white/90 mb-3 lg:mb-6">
              Edits Needed?
            </h3>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  updateData({ editsNeeded: true });
                  scrollToRef(navigationRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${data.editsNeeded
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">Yes</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
                    }`}
                >
                  {data.editsNeeded && (
                    <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  updateData({ editsNeeded: false });
                  scrollToRef(navigationRef);
                }}
                disabled={data.shootType === ""}
                className={`h-14 lg:h-[82px] w-[100px] lg:w-[140px] rounded-2xl border px-2 lg:px-6 flex items-center justify-between transition-all ${!data.editsNeeded
                  ? "bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] border-transparent text-black"
                  : "bg-[#101010] border-white/10 hover:border-white/20 text-[#A9A9A9]"
                  }`}
              >
                <span className="font-medium text-sm lg:text-lg pr-2">No</span>
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${!data.editsNeeded ? "bg-black" : "border border-[#E5E5E5]"
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
                  {/* Video Edit Type - Show if videographer or cinematographer selected: Commented cinematographer as it is not being mentioned anywhere in UI */}
                  {data.contentType.includes("videographer") &&
                    //|| data.contentType.includes("cinematographer")) &&
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
      <div ref={navigationRef} className="flex gap-3 lg:gap-6 items-center pt-6 lg:pt-15 border-t border-white/10">
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
