"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/src/components/landing/ui/button";
import { BookingData } from "@/app/book-a-shoot/page";
import { toast } from "sonner";
import { CustomSlider, DateTimePicker } from "@/src/components/booking/v2";
import DropdownSelect from "./DropdownSelect";
import { LocationPicker } from "@/src/components/booking/v2/component/LocationPicker";
import { parseDate } from "@/src/components/landing/lib/utils";
import { studio } from "@/app/data/shootData";

interface Props {
  data: BookingData;
  updateData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const validateFutureDateTime = (date: Date | null) => {
  if (!date) return "Date & time is required";
  const now = new Date();

  if (date < now) {
    return "Selected date & time must be in the future";
  }

  return null;
};

const validateEndDateTime = (date: Date | null, startDateISO: string): string | null => {
  if (!date) return "End date & time is required";
  const startDate = parseDate(startDateISO);

  if (!startDate || isNaN(startDate.getTime())) {
    return null;
  }

  if (date < startDate) {
    return "End date & time cannot be earlier than start date & time";
  }

  return null;
};

const datePickerColours = {
  // Input Field & Labels
  inputBackground: "#101010",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff4d",
  inputBorderHover: "#E8D1AB",
  inputBorderFocus: "#E8D1AB",
  labelText: "#ffffff99",
  iconColor: "#E8D1AB",

  // Brand Accents
  accent: "#E8D1AB",
  accentText: "#101010",
  hoverAccent: "#E8D1AB",

  // Backgrounds
  paperBackground: "#101010",
  mobileCalendarBackground: "#101010",

  // General Calendar/Time Text
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E8D1AB",

  // Time Component Specifics ---
  desktopTimeAccent: "#E8D1AB",  // Clock hand/pin on desktop
  mobileSelectedText: "#101010", // Text color when sitting on accent background
  toolbarText: "#FFFFFF",        // "Select Date & Time" title text

  // Custom keys for the requested fixes:
  selectedHeaderDateTime: "#E8D1AB", // The big Date/Time text in Mobile Header
  clockNumberColor: "#FFFFFF",       // Numbers (1-12) inside the clock face
  tabIconColor: "#ffffff99",         // Inactive icons (Calendar/Clock tabs)
  tabIconSelected: "#E8D1AB",
}

export const Step3DateTime = ({ data, updateData, onNext }: Props) => {
  const handleNext = () => {
    // Validate Step 4 fields
    if (!data.startDate || data.startDate.trim() === "") {
      toast.error("Required Field", {
        description: "Please select a start date for your shoot",
      });
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Invalid Date", {
        description: "Start date cannot be in the past",
      });
      return;
    }

    if (!data.location || data.location.trim() === "") {
      toast.error("Required Field", {
        description: "Please enter a location for your shoot",
      });
      return;
    }

    if (data.location.trim().length < 3) {
      toast.error("Invalid Input", {
        description: "Location must be at least 3 characters long",
      });
      return;
    }

    // Validation passed, proceed to next step
    onNext();
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-12 mx-0 w-full py-6 md:py-12 px-6 lg:px-0">
      <div className="flex flex-col gap-8 justify-center">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg lg:text-[28px] font-bold text-white">Tell Us When & Where to Shoot</h2>
          <p className="text-xs lg:text-sm text-[#939393]">Let us know your preferred schedule and location.</p>
        </div>

        <div className="flex flex-col gap-9 p-8 md:p-[50px]">

          <div className="flex flex-col lg:flex-row gap-6 w-full">
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

          {/* LOCATION */}
          <LocationPicker
            value={data.location}
            onChange={(address) => updateData({ location: address })}
            placeholder="Click to select location on map"
          />

          {/* STUDIO TOGGLE */}
          <div className="flex items-center gap-4 p-4 rounded-[12px]">
            <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M14.1668 1.88867H16.0557C17.8365 1.88867 18.727 1.88867 19.2802 2.44191C19.8334 2.99516 19.8334 3.88559 19.8334 5.66645V20.0692H20.7779C21.1691 20.0692 21.4862 20.3864 21.4862 20.7776C21.4862 21.1688 21.1691 21.4859 20.7779 21.4859H1.889C1.4978 21.4859 1.18066 21.1688 1.18066 20.7776C1.18066 20.3864 1.4978 20.0692 1.889 20.0692H2.83344V8.49978C2.83344 6.71892 2.83344 5.82849 3.38668 5.27525C3.93993 4.72201 4.83036 4.72201 6.61122 4.72201H10.389C12.1699 4.72201 13.0603 4.72201 13.6135 5.27525C14.1668 5.82849 14.1668 6.71892 14.1668 8.49978V20.0692H15.5834V8.49978L15.5834 8.41527C15.5835 7.59772 15.5836 6.84815 15.5017 6.23839C15.4114 5.56693 15.199 4.85722 14.6153 4.27351C14.0316 3.6898 13.3219 3.4774 12.6504 3.38713C12.0492 3.3063 11.3121 3.30525 10.508 3.30533C10.5876 2.9396 10.7205 2.66367 10.9422 2.44191C11.4955 1.88867 12.3859 1.88867 14.1668 1.88867ZM4.95844 7.55534C4.95844 7.16414 5.27557 6.84701 5.66678 6.84701H11.3334C11.7246 6.84701 12.0418 7.16414 12.0418 7.55534C12.0418 7.94654 11.7246 8.26367 11.3334 8.26367H5.66678C5.27557 8.26367 4.95844 7.94654 4.95844 7.55534ZM4.95844 10.3887C4.95844 9.99747 5.27557 9.68034 5.66678 9.68034H11.3334C11.7246 9.68034 12.0418 9.99747 12.0418 10.3887C12.0418 10.7799 11.7246 11.097 11.3334 11.097H5.66678C5.27557 11.097 4.95844 10.7799 4.95844 10.3887ZM4.95844 13.222C4.95844 12.8308 5.27557 12.5137 5.66678 12.5137H11.3334C11.7246 12.5137 12.0418 12.8308 12.0418 13.222C12.0418 13.6132 11.7246 13.9303 11.3334 13.9303H5.66678C5.27557 13.9303 4.95844 13.6132 4.95844 13.222ZM8.50011 17.2359C8.89131 17.2359 9.20844 17.553 9.20844 17.9442V20.0692H7.79177V17.9442C7.79177 17.553 8.10891 17.2359 8.50011 17.2359Z" fill="black" />
              </svg>
            </div>

            <div className="flex-1">
              <h4 className="text-white font-medium text-base lg:text-xl">I need a Beige Studio</h4>
              <p className="text-xs lg:text-base text-white/60">Professional studio with lighting & equipment</p>
            </div>

            <div className="relative w-6 h-6">
              <input
                id="need-studio"
                type="checkbox"
                checked={data.needStudio}
                onChange={(e) => updateData({ needStudio: e.target.checked })}
                className="absolute w-full h-full opacity-0 z-10 cursor-pointer"
              />

              <div
                className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center ${data.needStudio ? "bg-[#ECE1CE] border-[#ECE1CE]" : "border-[#D9D9D9]"}`}
              >
                {data.needStudio && (
                  <svg
                    className="w-4 h-4 text-[#030303]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {
            data.needStudio &&
            <>
              {/* Studio: Options mentioned as placeholders. Concrete data required */}
              <DropdownSelect
                title="Select Studio"
                onChange={(v) => updateData({ studio: v })}
                bgColour={"bg-[#101010]"}
                options={studio}
                value={data.studio}
              />
              <div>
                <CustomSlider
                  value={data.studioTimeDuration}
                  onChange={(v) => updateData({ studioTimeDuration: v })}
                  bgColour="[#171717]"
                  titleTextColour={"white"}
                  labelTextColour={"white/80"}
                  labelSize={"text-base lg:text-xl"}
                  trackColor="#4D4D4D"
                />
              </div>
            </>
          }
        </div>


      </div>

      <div className="pt-8">
        <Button
          onClick={handleNext}
          className="h-12 lg:h-[72px] w-full md:w-[185px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold text-base lg:text-xl rounded-[12px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};