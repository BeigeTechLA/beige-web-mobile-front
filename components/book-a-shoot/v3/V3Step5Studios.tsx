"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/src/components/landing/ui/button";
import { BookingDataV3 } from "./types";
import { MapPin, MoveUpRight, Search, ChevronDown, X, Star } from "lucide-react";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import { format } from "date-fns";
import { toast } from "sonner";
import { StudioDetailsDrawer } from "./StudioDetailsDrawer";
import {
  StudioCatalogItem,
  SelectedStudio,
  HOURLY_STUDIO_LIST,
  buildHourlyStudioSelection,
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

const parseValidDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value?: string) => {
  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "d MMMM, yyyy") : "";
};

const formatDisplayTime = (value?: string) => {
  if (!value) return "";
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const parsed = new Date();
      parsed.setHours(hours, minutes, 0, 0);
      return format(parsed, "h:mm a").toUpperCase();
    }
  }

  const parsed = parseValidDate(value);
  return parsed ? format(parsed, "h:mm a").toUpperCase() : value;
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
  draftSelection?: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string };
  onConfirmHourlyDetails: (details: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string }) => void;
}) => {
  const defaultPricingKey = currentSelection?.pricingCategory || draftSelection?.pricingKey || studio.pricingOptions?.[0]?.key || "";
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
  const [pricingKey, setPricingKey] = useState(defaultPricingKey);
  const [timeOptions, setTimeOptions] = useState<{ key: string; value: string }[]>([]);
  const selectedPricingOption =
    studio.pricingOptions?.find((option) => option.key === pricingKey) ||
    studio.pricingOptions?.[0];

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

  const hasCompleteTimeSelection = !!selectedDate && !!startTime && !!endTime && !!pricingKey;
  const selectedDurationHours = startTime && endTime
    ? Math.max(0, Math.ceil((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60))
    : 0;
  const billableHours = selectedPricingOption
    ? Math.max(selectedDurationHours, selectedPricingOption.minimumHours)
    : selectedDurationHours;
  const cleaningFee = selectedPricingOption?.cleaningFee || 0;
  const estimateTotal = selectedPricingOption
    ? selectedPricingOption.hourlyRate * billableHours + cleaningFee
    : 0;
  const metaLabel = [studio.beds ? `${studio.beds} Bed` : null, studio.baths ? `${studio.baths} Bath` : null, studio.poolType].filter(Boolean).join(" / ");

  const handleConfirmSelection = () => {
    if (!selectedDate || !startTime || !endTime || !pricingKey) {
      toast.error("Please select package, date, start time and end time.");
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    if (selectedPricingOption && timeToMinutes(endTime) - timeToMinutes(startTime) < selectedPricingOption.minimumHours * 60) {
      toast.error(`Minimum ${selectedPricingOption.label} booking is ${selectedPricingOption.minimumHours} hours.`);
      return;
    }

    onConfirmHourlyDetails({
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
      pricingKey,
    });
    setShowPickers(false);
    toast.success("Studio time selected. You can now add this studio.");
  };

  const handleAddClick = () => {
    if (!isSelected && !hasCompleteTimeSelection) {
      toast.error("Please select date and time first for this studio.");
      return;
    }
    onToggle();
  };

  return (
    <>
      <div className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-[#111111] transition-all duration-300 ${isSelected ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]" : "border-white/10 hover:border-white/20"}`}>
        <button type="button" className="relative h-[230px] w-full overflow-hidden" onClick={onShowDetails}>
          <Image
            src={studio.image}
            alt={studio.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {studio.priceLabel}
          </div>
          {studio.rating && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Star size={12} className="fill-[#E8D1AB] text-[#E8D1AB]" />
              {studio.rating}{studio.reviews ? ` (${studio.reviews})` : ""}
            </div>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="min-h-[112px]">
            <h3 className="text-[17px] font-bold leading-snug text-white">{studio.name}</h3>
            {metaLabel && <p className="mt-1 text-xs text-white/45">{metaLabel}</p>}
            <div className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-white/45">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{studio.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(studio.bestFor || []).slice(0, 3).map((item) => (
              <span key={item} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/60">{item}</span>
            ))}
          </div>

          {(currentSelection?.selectedDate && currentSelection?.startTime && currentSelection?.endTime) && (
            <div className="rounded-xl border border-[#E8D1AB33] bg-[#E8D1AB14] px-3 py-3 text-xs text-[#E8D1AB]">
              <div className="font-semibold">{currentSelection.pricingLabel || "Studio booking"}</div>
              <div>{formatDisplayDate(currentSelection.selectedDate)} | {formatDisplayTime(currentSelection.startTime)} - {formatDisplayTime(currentSelection.endTime)}</div>
              <div className="mt-1 text-white/70">${(currentSelection.totalPrice || 0).toLocaleString()} total</div>
            </div>
          )}

          <div className="mt-auto grid grid-cols-[1fr_48px] gap-2 border-t border-white/5 pt-4">
            <Button
              onClick={() => setShowPickers(true)}
              className="h-11 rounded-xl bg-[#E8D1AB] text-sm font-bold text-black hover:bg-[#dcb98a]"
            >
              {isSelected ? "Edit Time" : "Pick Date & Time"}
            </Button>
            <Button
              variant="outline"
              onClick={onShowDetails}
              className="h-11 w-12 rounded-xl border-white/10 bg-white/5 p-0 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <MoveUpRight size={18} />
            </Button>
          </div>

          {isSelected ? (
            <Button
              onClick={handleAddClick}
              className="h-11 rounded-xl bg-[#FFD6D6] text-sm font-bold text-[#FF4545] hover:bg-[#ffc2c2]"
            >
              Remove Studio
            </Button>
          ) : hasCompleteTimeSelection ? (
              <Button
                onClick={handleAddClick}
                className="h-11 rounded-xl bg-white text-sm font-bold text-black hover:bg-white/90"
              >
                Add this Studio
              </Button>
          ) : null}
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

            {studio.pricingOptions && studio.pricingOptions.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                {studio.pricingOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setPricingKey(option.key)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      pricingKey === option.key
                        ? "border-[#E8D1AB] bg-[#E8D1AB14]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{option.label}</div>
                    <div className="mt-1 text-lg font-bold text-[#E8D1AB]">${option.hourlyRate.toLocaleString()}/hr</div>
                    <div className="mt-1 text-xs text-white/50">
                      {option.minimumHours} hour minimum{option.cleaningFee ? ` + $${option.cleaningFee.toLocaleString()} cleaning` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="w-full flex flex-col md:flex-row gap-6 lg:gap-8">
              <div className="flex-1 w-full bg-[#1A1A1A] rounded-[24px] p-5 border border-white/10 shadow-lg">
                <div className="w-full h-full flex items-center justify-center">
                  <DatePicker
                    label="EVENT DATE"
                    selectedDate={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
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
              {selectedPricingOption && (
                <div className="mr-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  <span className="text-white">Estimated total:</span>{" "}
                  <span className="font-bold text-[#E8D1AB]">${estimateTotal.toLocaleString()}</span>
                  <span className="ml-2 text-white/40">({billableHours || selectedPricingOption.minimumHours} billable hrs)</span>
                </div>
              )}
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
    () => normalizeSelectedStudios({
      selectedStudios: data.selectedStudios,
      selectedStudioIds: data.selectedStudioIds,
    }),
    [data.selectedStudios, data.selectedStudioIds],
  );
  const selectedStudioIds = useMemo(() => selectedStudios.map((studio) => studio.studioId), [selectedStudios]);
  const selectedStudioSet = useMemo(() => new Set(selectedStudioIds), [selectedStudioIds]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"Price (Low to High)" | "Price (High to Low)" | "Name">("Name");
  const [selectedDetailsStudio, setSelectedDetailsStudio] = useState<StudioCatalogItem | null>(null);
  const [hourlyDraftSelections, setHourlyDraftSelections] = useState<Record<string, { selectedDate: string; startTime: string; endTime: string; pricingKey?: string }>>({});

  const syncStudios = (next: SelectedStudio[]) => {
    const primaryStudio = next[0];
    const studioStartDateTime = primaryStudio?.selectedDate && primaryStudio?.startTime
      ? `${primaryStudio.selectedDate}T${primaryStudio.startTime}:00`
      : "";
    const studioEndDateTime = primaryStudio?.selectedDate && primaryStudio?.endTime
      ? `${primaryStudio.selectedDate}T${primaryStudio.endTime}:00`
      : "";

    updateData({
      selectedStudios: next,
      selectedStudioIds: next.map((studio) => studio.studioId),
      startDate: studioStartDateTime,
      endDate: studioEndDateTime,
      location: primaryStudio?.location || "",
      locationDetails: null,
      bookingDays: primaryStudio
        ? [{
            date: primaryStudio.selectedDate || "",
            startTime: primaryStudio.startTime,
            endTime: primaryStudio.endTime,
            durationHours: primaryStudio.quantity,
          }]
        : [],
    });
  };

  const filteredHourlyStudios = useMemo(() => {
    return HOURLY_STUDIO_LIST.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "Name") return a.name.localeCompare(b.name);
        if (sortBy === "Price (Low to High)") return (a.priceValue || 0) - (b.priceValue || 0);
        if (sortBy === "Price (High to Low)") return (b.priceValue || 0) - (a.priceValue || 0);
        return 0;
      });
  }, [searchQuery, sortBy]);

  const confirmHourlyDetails = (
    studio: StudioCatalogItem,
    details: { selectedDate: string; startTime: string; endTime: string; pricingKey?: string },
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

    toast.error("Please pick date and time first for this studio.");
  };

  const handleContinue = () => {
    if (selectedStudios.length === 0) {
      toast.error("Please select a studio and date/time to continue.");
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">
          BEIGE Studios
        </h2>
        <p className="text-white/60 mb-8 max-w-2xl mx-auto text-sm lg:text-lg">
          Select a studio, then choose the date and time for that studio booking.
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
          Studio Packages <span className="text-[#E8D1AB] font-normal">({filteredHourlyStudios.length < 10 ? `0${filteredHourlyStudios.length}` : filteredHourlyStudios.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-14">
        {filteredHourlyStudios.length === 0 ? (
          <div className="col-span-full text-white/50 text-sm py-4 pl-1">No studios match your search.</div>
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

      <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
        <div className="flex gap-4">
          <Button onClick={onBack} className="h-12 px-8 bg-[#151515] hover:bg-[#1A1A1A] border border-white/10 text-white rounded-xl font-medium">
            Back
          </Button>
          <Button onClick={handleContinue} className="h-12 px-8 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black rounded-xl font-medium">
            Continue
          </Button>
        </div>
      </div>

      <StudioDetailsDrawer
        isOpen={!!selectedDetailsStudio}
        onClose={() => setSelectedDetailsStudio(null)}
        studio={selectedDetailsStudio}
      />
    </div>
  );
};
