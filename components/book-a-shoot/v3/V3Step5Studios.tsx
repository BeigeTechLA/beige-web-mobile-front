"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/src/components/landing/ui/button";
import { BookingDataV3 } from "./types";
import { MapPin, Calendar, MoveUpRight, Star, Search, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { format } from "date-fns";
import { toast } from "sonner";
import { StudioDetailsDrawer } from "./StudioDetailsDrawer";
import {
  StudioCatalogItem,
  SelectedStudio,
  WEEKEND_STUDIO_LIST,
  HOURLY_STUDIO_LIST,
  buildHourlyStudioSelection,
  buildWeekendStudioSelection,
  normalizeSelectedStudios,
  removeSelectedStudio,
  upsertSelectedStudio,
} from "./studioData";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ImageCarouselModal = ({
  isOpen,
  onClose,
  images,
}: {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setLoadedSet(new Set());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen || !images.length || !mounted) return null;

  const handleImageLoaded = (index: number) => {
    setLoadedSet((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/95 backdrop-blur-md" onClick={onClose}>
      {/* Close button - always on top */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-4 right-4 md:top-6 md:right-6 z-[99999999] flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-full text-white transition-all border border-white/20 backdrop-blur-md"
      >
        <X size={20} />
        <span className="text-sm font-medium hidden sm:inline">Close</span>
      </button>

      <div className="relative w-full max-w-5xl h-[70vh] md:h-[85vh] flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 z-50 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-black/20">
          {/* Loading spinner – shown while current image is loading */}
          {!loadedSet.has(currentIndex) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-white/20 border-t-[#E8D1AB] rounded-full animate-spin" />
            </div>
          )}

          {/* Render ALL images as native <img> for direct CDN loading (no Next.js proxy) */}
          {images.map((imgSrc, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-300 ${
                i === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={`Slide ${i + 1}`}
                loading="eager"
                decoding="async"
                onLoad={() => handleImageLoaded(i)}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 z-50 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all shadow-lg"
          >
            <ChevronRight size={32} />
          </button>
        )}
        
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === currentIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const StudioCard = ({
  studio,
  isSelected,
  onToggle,
  onShowDetails,
}: {
  studio: StudioCatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  onShowDetails: () => void;
}) => {
  return (
    <div className={`group relative rounded-[32px] border transition-all duration-300 overflow-hidden bg-[#111111] ${isSelected ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]" : "border-white/10"}`}>
      <div className="relative h-[240px] w-full p-2">
        <div className="relative h-full w-full overflow-hidden rounded-[24px] cursor-pointer" onClick={onShowDetails}>
          <Image
            src={studio.image}
            alt={studio.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span className="text-[11px] font-medium text-white">Available</span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white">
            <Star size={12} className="fill-[#E8D1AB] text-[#E8D1AB]" />
            <span className="text-[11px] font-bold">{studio.rating} ({studio.reviews || 0})</span>
          </div> */}

          <div className="absolute bottom-3 left-3 bg-white px-4 py-1.5 rounded-full shadow-lg">
            <span className="text-black font-bold text-[13px] tracking-tight">{studio.priceLabel}</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-4 flex flex-col gap-4">
        <div>
          <h3 className="text-white font-bold text-[15px] leading-tight">
            {studio.name} <span className="text-white/50 font-normal">({studio.beds} Bed / {studio.baths} Bath - {studio.poolType})</span>
          </h3>
          <div className="flex items-center gap-1.5 mt-2 text-white/40 text-[13px]">
            <MapPin size={14} />
            <span>{studio.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-white/40" />
            <span className="text-white/70 text-[13px] font-medium">{studio.dates}</span>
          </div>
          <div className="bg-[#2A2A2A] px-3 py-1.5 rounded-full text-[11px] text-white/50 font-medium tracking-wide">
            {studio.nights} Nights
          </div>
        </div>

        <div className="flex gap-2">
          <div className="px-4 py-2 border border-white/10 rounded-xl text-white/60 text-xs">Natural light</div>
          <div className="px-4 py-2 border border-white/10 rounded-xl text-white/60 text-xs">Product-friendly</div>
        </div>

        <div className="flex gap-2 mt-1">
          <Button
            onClick={onToggle}
            className={`flex-1 h-12 rounded-2xl font-bold transition-all ${
              isSelected
                ? "bg-[#FFD6D6] hover:bg-[#ffc2c2] text-[#FF4545]"
                : "bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
            }`}
          >
            {isSelected ? "Remove" : "Add this Studio"}
          </Button>
          <Button
            variant="outline"
            onClick={onShowDetails}
            className="w-12 h-12 p-0 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/70 flex items-center justify-center transition-colors hover:text-white"
          >
            <MoveUpRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const HourlyStudioCard = ({
  studio,
  isSelected,
  onToggle,
  onShowDetails,
  currentSelection,
  draftSelection,
  onConfirmHourlyDetails,
}: {
  studio: StudioCatalogItem;
  isSelected: boolean;
  onToggle: () => void;
  onShowDetails: () => void;
  currentSelection?: SelectedStudio;
  draftSelection?: { selectedDate: string; startTime: string; endTime: string };
  onConfirmHourlyDetails: (details: { selectedDate: string; startTime: string; endTime: string }) => void;
}) => {
  const [showPickers, setShowPickers] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    currentSelection?.selectedDate
      ? new Date(currentSelection.selectedDate)
      : draftSelection?.selectedDate
        ? new Date(draftSelection.selectedDate)
        : null,
  );
  const [startTime, setStartTime] = useState(currentSelection?.startTime || draftSelection?.startTime || "");
  const [endTime, setEndTime] = useState(currentSelection?.endTime || draftSelection?.endTime || "");
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
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

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const endTimeOptions = useMemo(() => {
    return timeOptions.filter((opt) => {
      if (!startTime) return true;
      return timeToMinutes(opt.key) >= timeToMinutes(startTime) + 60;
    });
  }, [timeOptions, startTime]);

  useEffect(() => {
    if (startTime && endTime) {
      if (timeToMinutes(endTime) < timeToMinutes(startTime) + 60) {
        const targetMinutes = timeToMinutes(startTime) + 60;
        const newEndTimeOpt = timeOptions.find((o) => timeToMinutes(o.key) >= targetMinutes);
        if (newEndTimeOpt) setEndTime(newEndTimeOpt.key);
      }
    }
  }, [startTime, endTime, timeOptions]);

  const hasCompleteTimeSelection = !!selectedDate && !!startTime && !!endTime;

  const handleConfirmSelection = () => {
    if (!selectedDate || !startTime || !endTime) {
      toast.error("Please select date, start time and end time.");
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    if (timeToMinutes(endTime) - timeToMinutes(startTime) < 60) {
      toast.error("Minimum hourly studio booking is 1 hour.");
      return;
    }

    onConfirmHourlyDetails({
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
    });
    setShowPickers(false);
    toast.success("Studio time selected. You can now add this studio.");
  };

  const handleAddClick = () => {
    if (!isSelected && !hasCompleteTimeSelection) {
      toast.error("Please select date and time first for hourly content house.");
      return;
    }
    onToggle();
  };

  return (
    <>
      <div className={`group relative flex flex-col p-2 rounded-[32px] border transition-all duration-300 bg-[#111111] ${isSelected ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]" : "border-white/10"}`}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative h-[240px] md:h-auto md:w-[45%] lg:w-[45%] flex-shrink-0">
            <div className="relative h-full w-full overflow-hidden rounded-[24px] cursor-pointer" onClick={onShowDetails}>
              <Image
                src={studio.image}
                alt={studio.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex flex-col flex-grow py-4 pr-6">
            <div className="flex justify-between items-start mb-6">
              {/* <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
                <span className="text-[13px] font-medium text-[#34C759]">Available</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-white">
                <Star size={12} className="fill-[#E8D1AB] text-[#E8D1AB]" />
                <span className="text-[13px] font-bold text-white/90">{studio.rating}</span>
              </div> */}
            </div>

            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="text-white font-bold text-lg leading-tight">
                {studio.name} <span className="text-white/50 font-normal">({studio.beds} Bed / {studio.baths} Bath - {studio.poolType})</span>
              </h3>
              <span className="text-[#E8D1AB] font-bold text-sm whitespace-nowrap">{studio.priceLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 mb-8 text-white/40 text-[13px]">
              <MapPin size={14} />
              <span>{studio.location}</span>
            </div>

            {(currentSelection?.selectedDate && currentSelection?.startTime && currentSelection?.endTime) && (
              <div className="mb-6 rounded-xl border border-[#E8D1AB33] bg-[#E8D1AB14] px-4 py-3 text-sm text-[#E8D1AB]">
                {format(new Date(currentSelection.selectedDate), "EEE, dd MMM yyyy")} | {currentSelection.startTime} - {currentSelection.endTime}
              </div>
            )}

            <div className="flex gap-2 mb-8">
              <div className="px-4 py-2 border border-white/10 rounded-xl text-white/60 text-xs">Natural light</div>
              <div className="px-4 py-2 border border-white/10 rounded-xl text-white/60 text-xs">Product-friendly</div>
            </div>

            <div className="mt-auto border-t border-white/5 pt-6 flex gap-3 w-full">
              <Button
                onClick={() => setShowPickers(true)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl h-12 font-medium border-none"
              >
                Pick Date & Time
              </Button>
              <Button
                onClick={handleAddClick}
                className={`flex-1 h-12 rounded-xl font-bold transition-all ${
                  isSelected
                    ? "bg-[#FFD6D6] hover:bg-[#ffc2c2] text-[#FF4545]"
                    : "bg-[#E8D1AB] hover:bg-[#dcb98a] text-black"
                }`}
              >
                {isSelected ? "Remove" : hasCompleteTimeSelection ? "Add this Studio" : "Select Time First"}
              </Button>
              <Button
                variant="outline"
                onClick={onShowDetails}
                className="w-12 h-12 p-0 shrink-0 rounded-xl border-none bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <MoveUpRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showPickers && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/80 backdrop-blur-sm px-4 pt-28 pb-10 overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 rounded-[32px] p-6 lg:p-8 max-w-4xl w-full relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl my-auto">
            <button
              onClick={() => setShowPickers(false)}
              className="absolute top-5 right-5 lg:top-7 lg:right-7 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8 tracking-tight">Select Date & Time</h3>

            <div className="w-full flex flex-col md:flex-row gap-6 lg:gap-8">
              <div className="flex-1 w-full bg-[#1A1A1A] rounded-[24px] p-5 border border-white/10 shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <DatePicker
                    label="EVENT DATE"
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date("2026-04-17T00:00:00")}
                    maxDate={new Date("2026-04-20T23:59:59")}
                    shouldHighlightCurrentDay={true}
                    colours={{
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
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col gap-5 justify-center">
                <DropdownSelect
                  title="Start Time"
                  options={timeOptions}
                  value={startTime}
                  onChange={setStartTime}
                  bgColour="bg-[#1A1A1A]"
                />
                <DropdownSelect
                  title="End Time"
                  options={endTimeOptions}
                  value={endTime}
                  onChange={setEndTime}
                  bgColour="bg-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleConfirmSelection}
                className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black px-10 h-12 rounded-xl font-bold text-[15px]"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const V3Step5Studios: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const selectedStudios = useMemo(
    () => normalizeSelectedStudios(data),
    [data.selectedStudios, data.selectedStudioIds],
  );
  const selectedStudioIds = useMemo(() => selectedStudios.map((studio) => studio.studioId), [selectedStudios]);
  const selectedStudioSet = useMemo(() => new Set(selectedStudioIds), [selectedStudioIds]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"Price (Low to High)" | "Price (High to Low)" | "Name">("Name");
  const [selectedDetailsStudio, setSelectedDetailsStudio] = useState<StudioCatalogItem | null>(null);
  const [hourlyDraftSelections, setHourlyDraftSelections] = useState<Record<string, { selectedDate: string; startTime: string; endTime: string }>>({});

  const syncStudios = (next: SelectedStudio[]) => {
    updateData({
      selectedStudios: next,
      selectedStudioIds: next.map((studio) => studio.studioId),
    });
  };

  const filteredWeekendStudios = useMemo(() => {
    return WEEKEND_STUDIO_LIST.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "Name") return a.name.localeCompare(b.name);
        if (sortBy === "Price (Low to High)") return (a.priceValue || 0) - (b.priceValue || 0);
        if (sortBy === "Price (High to Low)") return (b.priceValue || 0) - (a.priceValue || 0);
        return 0;
      });
  }, [searchQuery, sortBy]);

  const filteredHourlyStudios = useMemo(() => {
    return HOURLY_STUDIO_LIST.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const toggleWeekendStudio = (studio: StudioCatalogItem) => {
    if (selectedStudioSet.has(studio.id)) {
      syncStudios(removeSelectedStudio(selectedStudios, studio.id));
      return;
    }
    syncStudios(upsertSelectedStudio(selectedStudios, buildWeekendStudioSelection(studio)));
  };

  const confirmHourlyDetails = (
    studio: StudioCatalogItem,
    details: { selectedDate: string; startTime: string; endTime: string },
  ) => {
    setHourlyDraftSelections((prev) => ({ ...prev, [studio.id]: details }));

    if (selectedStudioSet.has(studio.id)) {
      const updatedSelection = buildHourlyStudioSelection(studio, details);
      const nextStudios = upsertSelectedStudio(selectedStudios, updatedSelection);
      syncStudios(nextStudios);
    }
  };

  const toggleHourlyStudio = (studio: StudioCatalogItem) => {
    const existing = selectedStudios.find((item) => item.studioId === studio.id);

    if (existing) {
      syncStudios(removeSelectedStudio(selectedStudios, studio.id));
      return;
    }

    const draft = hourlyDraftSelections[studio.id];
    if (draft) {
      syncStudios(upsertSelectedStudio(selectedStudios, buildHourlyStudioSelection(studio, draft)));
      return;
    }

    toast.error("Please pick date and time first for hourly content house.");
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
          BEIGE Content House
        </h2>
        <p className="text-white/60 mb-8 max-w-2xl mx-auto text-sm lg:text-lg">
          Discover available content houses with complete details and availability.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full mb-12">
        <div className="flex-1 flex items-center bg-[#151515] border border-white/5 rounded-xl px-5 py-3.5 focus-within:border-white/20 transition-all">
          <Search size={18} className="text-white/40 mr-3" />
          <input
            type="text"
            placeholder="Search Studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/40 text-[15px]"
          />
        </div>
        <div className="relative">
          <Button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="bg-[#151515] hover:bg-[#1f1f1f] border border-white/5 text-white/70 px-6 py-3.5 h-full rounded-xl flex items-center justify-center gap-2"
          >
            <span className="text-[14px]">Sort By: {sortBy}</span> <ChevronDown size={16} />
          </Button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#151515] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
              {(["Name", "Price (Low to High)", "Price (High to Low)"] as const).map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white text-sm transition-colors"
                  onClick={() => {
                    setSortBy(opt);
                    setIsSortOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 pl-1">
        <h3 className="text-white text-[15px] font-bold tracking-wide">
          Hourly Content House Packages <span className="text-[#E8D1AB] font-normal">({filteredHourlyStudios.length < 10 ? `0${filteredHourlyStudios.length}` : filteredHourlyStudios.length})</span>
        </h3>
      </div>

      <div className="flex flex-col gap-6 mb-14">
        {filteredHourlyStudios.length === 0 ? (
          <div className="text-white/50 text-sm py-4 pl-1">No hourly content houses match your search.</div>
        ) : (
          filteredHourlyStudios.map((studio) => (
            <HourlyStudioCard
              key={studio.id}
              studio={studio}
              isSelected={selectedStudioSet.has(studio.id)}
              currentSelection={selectedStudios.find((item) => item.studioId === studio.id)}
              draftSelection={hourlyDraftSelections[studio.id]}
              onToggle={() => toggleHourlyStudio(studio)}
              onConfirmHourlyDetails={(details) => confirmHourlyDetails(studio, details)}
              onShowDetails={() => setSelectedDetailsStudio(studio)}
            />
          ))
        )}
      </div>

      <div className="mb-6 pl-1">
        <h3 className="text-white text-[15px] font-bold tracking-wide">
          Weekend-Only Content Houses <span className="text-[#E8D1AB] font-normal">({filteredWeekendStudios.length < 10 ? `0${filteredWeekendStudios.length}` : filteredWeekendStudios.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWeekendStudios.length === 0 ? (
          <div className="col-span-full text-white/50 text-sm py-4 pl-1">No weekend content houses match your search.</div>
        ) : (
          filteredWeekendStudios.map((studio) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              isSelected={selectedStudioSet.has(studio.id)}
              onToggle={() => toggleWeekendStudio(studio)}
              onShowDetails={() => setSelectedDetailsStudio(studio)}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
        <div className="flex gap-4">
          <Button onClick={onBack} className="h-12 px-8 bg-[#151515] hover:bg-[#1A1A1A] border border-white/10 text-white rounded-xl font-medium">
            Back
          </Button>
          <Button onClick={onNext} className="h-12 px-8 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black rounded-xl font-medium">
            Continue
          </Button>
        </div>
        <Button onClick={onNext} className="h-12 px-8 bg-white hover:bg-white/90 text-black rounded-xl font-medium">
          Skip
        </Button>
      </div>

      <ImageCarouselModal
        isOpen={!!selectedDetailsStudio}
        onClose={() => setSelectedDetailsStudio(null)}
        images={selectedDetailsStudio?.images && selectedDetailsStudio.images.length > 0 ? selectedDetailsStudio.images : (selectedDetailsStudio?.image ? [selectedDetailsStudio.image] : [])}
      />
      {/* <StudioDetailsDrawer
        isOpen={!!selectedDetailsStudio}
        onClose={() => setSelectedDetailsStudio(null)}
        studio={selectedDetailsStudio}
      /> */}
    </div>
  );
};
