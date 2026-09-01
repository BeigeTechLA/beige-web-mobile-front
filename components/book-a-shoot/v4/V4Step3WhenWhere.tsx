"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Calendar, Clock, MapPin, Building2, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDataV4 } from "./types";
import { parseDate } from "@/src/components/landing/lib/utils";
import { format, addDays, set } from "date-fns";
import DatePicker from "@/components/ui/Datepicker";
import DropdownSelect from "@/components/book-a-shoot/DropdownSelect";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
  onBrowseStudios?: () => void;
}

const datePickerColours = {
  inputBackground: "#121212",
  inputText: "#FFFFFF",
  inputBorder: "#ffffff26",
  inputBorderHover: "#E5D5B8",
  inputBorderFocus: "#E5D5B8",
  labelText: "#ffffff99",
  iconColor: "#E5D5B8",
  accent: "#E5D5B8",
  accentText: "#101010",
  hoverAccent: "#E5D5B8",
  paperBackground: "#141414",
  mobileCalendarBackground: "#141414",
  calendarHeaderText: "#FFFFFF",
  weekdayLabelText: "#ffffff99",
  dayNumberText: "#FFFFFF",
  navigationIconColor: "#E5D5B8",
  desktopTimeAccent: "#E5D5B8",
  mobileSelectedText: "#101010",
  toolbarText: "#FFFFFF",
  selectedHeaderDateTime: "#E5D5B8",
  clockNumberColor: "#FFFFFF",
  tabIconColor: "#ffffff99",
  tabIconSelected: "#E5D5B8",
  inputDisabled: "#ffffff33",
  mutedText: "#ffffff66",
  desktopCalendarText: "#FFFFFF",
};

export const V4Step3WhenWhere: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  onBrowseStudios,
}) => {
  const [dateIntention, setDateIntention] = useState<"have_date" | "confirm_later">("have_date");
  const [bookingType, setBookingType] = useState<"single_day" | "multi_day">(data.bookingType || "single_day");
  const [locationText, setLocationText] = useState(data.location || "Woodland Hills, Woodland Hills, CA");

  // Date and Time options
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    data.startDate ? parseDate(data.startDate) : new Date(Date.now() + 86400000 * 2)
  );

  const timeOptions = React.useMemo(() => {
    const times: { key: string; value: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const h24 = String(hour).padStart(2, "0");
        const m = String(min).padStart(2, "0");
        const period = hour >= 12 ? "PM" : "AM";
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        times.push({
          key: `${h24}:${m}`,
          value: `${String(h12).padStart(2, "0")}:${m} ${period}`,
        });
      }
    }
    return times;
  }, []);

  const [startTimeKey, setStartTimeKey] = useState("10:00");
  const [endTimeKey, setEndTimeKey] = useState("18:00");

  const calculateHours = () => {
    const [sh, sm] = startTimeKey.split(":").map(Number);
    const [eh, em] = endTimeKey.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const diff = endMin - startMin;
    return diff > 0 ? Math.round(diff / 60) : 8;
  };

  const durationHours = calculateHours();

  useEffect(() => {
    if (selectedDate && dateIntention === "have_date") {
      const [sh, sm] = startTimeKey.split(":").map(Number);
      const [eh, em] = endTimeKey.split(":").map(Number);
      const s = set(selectedDate, { hours: sh, minutes: sm, seconds: 0 });
      const e = set(selectedDate, { hours: eh, minutes: em, seconds: 0 });
      updateData({
        startDate: format(s, "yyyy-MM-dd'T'HH:mm:ss"),
        endDate: format(e, "yyyy-MM-dd'T'HH:mm:ss"),
        location: locationText,
      });
    } else if (dateIntention === "confirm_later") {
      updateData({
        location: locationText,
      });
    }
  }, [selectedDate, startTimeKey, endTimeKey, locationText, dateIntention, updateData]);

  const handleContinue = () => {
    updateData({
      location: locationText,
      bookingType,
    });
    onNext();
  };

  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-5xl mx-auto px-4">
      {/* Top Bar: Back Button, Step Indicator & Progress */}
      <div className="w-full flex flex-col space-y-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A0A0A0] uppercase">
            STEP 03
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[50%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-2 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
          When & Where are you planning to shoot?
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          We can always refine the exact dates together later.
        </p>
      </div>

      <div className="w-full space-y-8 mb-10">
        {/* Top Date Intention Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setDateIntention("have_date")}
            style={{
              background: dateIntention === "have_date"
                ? "#E5D5B8"
                : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
              backdropFilter: "blur(20px)",
            }}
            className={`cursor-pointer rounded-2xl p-5 sm:p-6 flex items-center justify-between transition-all duration-200 border ${dateIntention === "have_date"
                ? "border-[#E5D5B8] text-[#121212] shadow-md"
                : "border-white/10 hover:border-white/20 text-white"
              }`}
          >
            <div>
              <h3 className="font-serif font-medium text-base sm:text-lg">
                I have a date
              </h3>
              <p
                className={`text-xs sm:text-sm ${dateIntention === "have_date" ? "text-black/70" : "text-white/60"
                  }`}
              >
                Specific shoot day and time
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${dateIntention === "have_date" ? "bg-black text-[#E5D5B8]" : "border border-white/30"
                }`}
            >
              {dateIntention === "have_date" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          <div
            onClick={() => setDateIntention("confirm_later")}
            style={{
              background: dateIntention === "confirm_later"
                ? "#E5D5B8"
                : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
              backdropFilter: "blur(20px)",
            }}
            className={`cursor-pointer rounded-2xl p-5 sm:p-6 flex items-center justify-between transition-all duration-200 border ${dateIntention === "confirm_later"
                ? "border-[#E5D5B8] text-[#121212] shadow-md"
                : "border-white/10 hover:border-white/20 text-white"
              }`}
          >
            <div>
              <h3 className="font-serif font-medium text-base sm:text-lg">
                I&apos;ll confirm later
              </h3>
              <p
                className={`text-xs sm:text-sm ${dateIntention === "confirm_later" ? "text-black/70" : "text-white/60"
                  }`}
              >
                Hold my spot for 30 days
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${dateIntention === "confirm_later" ? "bg-black text-[#E5D5B8]" : "border border-white/30"
                }`}
            >
              {dateIntention === "confirm_later" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* IF CONFIRM LATER SELECTED (Image 1): Show Not Ready to Schedule Card */}
        {dateIntention === "confirm_later" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
              backdropFilter: "blur(20px)",
            }}
            className="w-full border border-white/10 rounded-2xl p-6 flex items-center gap-5 shadow-inner"
          >
            {/* 3D Calendar Clock Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#2a241c] to-[#141414] border border-[#E5D5B8]/20 flex items-center justify-center shrink-0">
              <CalendarClock className="w-8 h-8 text-[#E5D5B8]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-semibold text-white">
                Not Ready to Schedule?
              </h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xl">
                &ldquo;Secure your production now and finalize the date and time later with help from the Beige team.&rdquo;
              </p>
            </div>
          </motion.div>
        )}

        {/* IF HAVE A DATE SELECTED: Show Booking For Section */}
        {dateIntention === "have_date" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 pt-2"
          >
            <h3 className="text-lg sm:text-xl font-serif text-white font-medium">
              Booking For
            </h3>

            {/* Pill Tab Selector */}
            <div className="inline-flex bg-[#141414] border border-white/10 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setBookingType("single_day");
                  updateData({ bookingType: "single_day" });
                }}
                className={`py-2.5 px-6 rounded-xl font-medium text-sm transition-all cursor-pointer ${bookingType === "single_day"
                    ? "bg-[#252320] text-white shadow-inner border border-white/10"
                    : "text-white/60 hover:text-white"
                  }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingType("multi_day");
                  updateData({ bookingType: "multi_day" });
                }}
                className={`py-2.5 px-6 rounded-xl font-medium text-sm transition-all cursor-pointer ${bookingType === "multi_day"
                    ? "bg-[#252320] text-white shadow-inner border border-white/10"
                    : "text-white/60 hover:text-white"
                  }`}
              >
                Multiple Days
              </button>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Select Date */}
              <div>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  minDate={new Date()}
                  colors={datePickerColours}
                  format="dd MMM, yyyy"
                  sx={{
                    height: { xs: "56px", md: "64px" },
                    borderRadius: "16px",
                  }}
                />
              </div>

              {/* Start Time */}
              <div>
                <DropdownSelect
                  title="Start Time"
                  options={timeOptions}
                  value={startTimeKey}
                  onChange={(val) => setStartTimeKey(val)}
                  bgColour="bg-[#121212]"
                />
              </div>

              {/* End Time */}
              <div>
                <DropdownSelect
                  title="End Time"
                  options={timeOptions}
                  value={endTimeKey}
                  onChange={(val) => setEndTimeKey(val)}
                  bgColour="bg-[#121212]"
                />
              </div>
            </div>

            {/* Duration Tag */}
            <div className="pt-1">
              <span className="inline-block bg-[#1a1a1a] border border-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-xl">
                Duration : {durationHours} Hours
              </span>
            </div>
          </motion.div>
        )}

        {/* Location / Venue Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg sm:text-xl font-serif text-white font-medium">
            Location / Venue
          </h3>

          {/* Location Input */}
          <div className="relative w-full bg-[#121212] border border-white/15 focus-within:border-[#E5D5B8] rounded-2xl px-5 py-3 transition-colors">
            <span className="block text-[10px] sm:text-xs font-semibold tracking-wider text-white/50 uppercase mb-1">
              Choose Location
            </span>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Enter city, address or landmark"
                className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder-white/20"
              />
              <MapPin className="w-5 h-5 text-white/60 shrink-0 ml-2" />
            </div>
          </div>

          {/* Dark Radar Map View */}
          <div className="relative w-full h-[220px] sm:h-[260px] rounded-2xl overflow-hidden bg-[#101010] border border-white/10 shadow-inner flex items-center justify-center">
            {/* Vector Dark Map Grid Pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
              <path
                d="M -10 180 Q 200 120, 450 200 T 900 150"
                fill="none"
                stroke="#1f1f1f"
                strokeWidth="24"
              />
              <path
                d="M 120 -10 Q 240 180, 500 120 T 1100 280"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="32"
              />
            </svg>

            {/* Central Glowing Radar Marker */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full bg-[#E5D5B8]/10 animate-ping opacity-30" />
              <div className="absolute w-28 h-28 rounded-full bg-[#E5D5B8]/15 border border-[#E5D5B8]/30" />
              <div className="absolute w-16 h-16 rounded-full bg-[#E5D5B8]/25 border border-[#E5D5B8]/50" />
              <div className="w-8 h-8 rounded-full bg-[#E5D5B8] flex items-center justify-center shadow-lg shadow-[#E5D5B8]/40 z-10">
                <MapPin className="w-4 h-4 text-black" />
              </div>
            </div>

            {/* Address Overlay Badge */}
            <div className="absolute bottom-3 left-4 bg-black/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl text-xs text-white/80">
              📍 {locationText}
            </div>
          </div>
        </div>

        {/* Need a Studio? Banner */}
        <div className="w-full bg-[#141414] border border-white/10 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E5D5B8] flex items-center justify-center text-black shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-white">
                Need a Studio?
              </h4>
              <p className="text-xs sm:text-sm text-white/60">
                Add a professional studio to your booking and get 15% off
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBrowseStudios || onNext}
            className="py-3 px-6 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] text-black font-semibold text-sm transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Browse Studios
          </button>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="w-full flex justify-between items-center pt-8 border-t border-white/10">
        <button
          onClick={onBack}
          className="py-3.5 px-8 rounded-xl bg-transparent hover:bg-white/5 border border-white/20 text-white/90 hover:text-white font-medium text-base transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
