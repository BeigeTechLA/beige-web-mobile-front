"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { addHours, format, isToday } from "date-fns";
import { ArrowLeft, Check, Clock, MapPin } from "lucide-react";

import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import {
  buildHourlyStudioSelection,
  HOURLY_STUDIO_LIST,
  SelectedStudio,
} from "../../v3/studioData";

interface StudioSelectionProps {
  onBack?: () => void;
  onContinue: (studios: SelectedStudio[]) => void;
  initialSelectedStudios?: SelectedStudio[];
}

const buildTimeOptions = () => {
  const options: { key: string; value: string }[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      options.push({ key, value: format(date, "h:mm aa") });
    }
  }

  return options;
};

const getDefaultStartTime = () => {
  const next = addHours(new Date(), 4);
  next.setMinutes(next.getMinutes() > 30 ? 0 : 30, 0, 0);
  if (next.getMinutes() === 0 && new Date().getMinutes() > 30) {
    next.setHours(next.getHours() + 1);
  }
  return format(next, "HH:mm");
};

export default function StudioSelection({
  onBack,
  onContinue,
  initialSelectedStudios = [],
}: StudioSelectionProps) {
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const firstStudio = HOURLY_STUDIO_LIST[0];
  const firstSelection = initialSelectedStudios[0];

  const [selectedStudioId, setSelectedStudioId] = useState(
    firstSelection?.studioId || firstStudio?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    firstSelection?.selectedDate ? new Date(`${firstSelection.selectedDate}T00:00:00`) : new Date()
  );
  const [startTime, setStartTime] = useState(firstSelection?.startTime || getDefaultStartTime());
  const [endTime, setEndTime] = useState(
    firstSelection?.endTime ||
      format(addHours(new Date(`2026-01-01T${getDefaultStartTime()}:00`), 2), "HH:mm")
  );
  const [pricingKey, setPricingKey] = useState(firstSelection?.pricingCategory || "");

  const selectedStudio = HOURLY_STUDIO_LIST.find((studio) => studio.id === selectedStudioId) || firstStudio;
  const pricingOptions =
    selectedStudio?.pricingOptions?.map((option) => ({
      key: option.key,
      value: `${option.label} - $${option.hourlyRate.toLocaleString()}/hr`,
    })) || [];

  const filteredStartOptions = useMemo(() => {
    if (!selectedDate || !isToday(selectedDate)) return timeOptions;
    const minKey = getDefaultStartTime();
    return timeOptions.filter((option) => option.key >= minKey);
  }, [selectedDate, timeOptions]);

  const filteredEndOptions = useMemo(
    () => timeOptions.filter((option) => option.key > startTime),
    [startTime, timeOptions]
  );

  const selectedStudioPayload = useMemo(() => {
    if (!selectedStudio || !selectedDate || !startTime || !endTime) return null;

    return buildHourlyStudioSelection(selectedStudio, {
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
      pricingKey: pricingKey || selectedStudio.pricingOptions?.[0]?.key,
    });
  }, [endTime, pricingKey, selectedDate, selectedStudio, startTime]);

  const handleContinue = () => {
    if (!selectedStudioPayload) return;
    onContinue([selectedStudioPayload]);
  };

  if (!selectedStudio) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 text-white">
        No studios are available right now.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP 03
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-2/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Cormorant_Garamond'] text-white mb-3 tracking-tight">
            Choose your studio.
          </h1>
          <p className="text-white/30 text-base md:text-xl font-light">
            Pick a studio, package, date, and time for your production.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOURLY_STUDIO_LIST.map((studio) => {
              const isSelected = studio.id === selectedStudioId;

              return (
                <button
                  key={studio.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudioId(studio.id);
                    setPricingKey(studio.pricingOptions?.[0]?.key || "");
                  }}
                  className={`relative text-left rounded-2xl border overflow-hidden bg-[#141414] transition-all cursor-pointer ${
                    isSelected ? "border-[#E8D1AB]" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="relative h-48">
                    <Image
                      src={studio.image}
                      alt={studio.name}
                      fill
                      className="object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-xl lg:text-[26px] font-['Cormorant_Garamond'] font-bold text-[#E8D1AB]">
                      {studio.name}
                    </h3>
                    <p className="flex items-start gap-2 text-sm text-white/60">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      {studio.location}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-4 h-4 shrink-0" />
                      {studio.priceLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5 h-fit space-y-5">
            <h2 className="text-2xl font-['Cormorant_Garamond'] text-white">
              Studio Details
            </h2>

            {pricingOptions.length > 0 && (
              <DropdownSelect
                title="Package"
                options={pricingOptions}
                value={pricingKey || pricingOptions[0]?.key || ""}
                onChange={setPricingKey}
                bgColour="bg-[#101010]"
                floatingTitle
              />
            )}

            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              colors={datePickerColours}
              format="MM/dd/yyyy"
              floating
              borderRadius="20px"
              sx={{ height: { xs: "56px", md: "82px" } }}
            />

            <DropdownSelect
              title="Start Time"
              options={filteredStartOptions}
              value={startTime}
              onChange={setStartTime}
              bgColour="bg-[#101010]"
              floatingTitle
            />

            <DropdownSelect
              title="End Time"
              options={filteredEndOptions}
              value={endTime}
              onChange={setEndTime}
              bgColour="bg-[#101010]"
              floatingTitle
            />

            {selectedStudioPayload && (
              <div className="rounded-xl bg-[#211F1C] p-4 space-y-2">
                <p className="text-white font-medium">{selectedStudioPayload.pricingLabel}</p>
                <p className="text-white/60 text-sm">
                  {selectedStudioPayload.quantity} billable hour
                  {selectedStudioPayload.quantity === 1 ? "" : "s"}
                </p>
                <p className="text-[#E8D1AB] text-2xl font-medium">
                  ${selectedStudioPayload.totalPrice.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedStudioPayload}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
