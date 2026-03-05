"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Calendar, X } from "lucide-react";
import DatePicker, { datePickerColours } from "@/components/ui/Datepicker";
import { BasicDropdown } from "../admin/BasicDropdown";

interface FilterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreativeFilterModal = ({ isOpen, onClose }: FilterProps) => {
  // --- Local Filter State ---
  const [minRadius, setMinRadius] = useState(10);
  const [maxRadius, setMaxRadius] = useState(200);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shootType, setShootType] = useState("");
  const [speciality, setSpeciality] = useState("");

  const MIN_LIMIT = 0;
  const MAX_LIMIT = 200;
  const STEP = 5;

  // --- Placeholder Data ---
  const shootTypeOptions = ["Wedding", "Commercial", "Portrait", "Event", "Product"];
  const specialityOptions = ["Videography", "Photography", "Drone", "Editing"];

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleReset = () => {
    setMinRadius(10);
    setMaxRadius(200);
    setSelectedDate(null);
    setShootType("");
    setSpeciality("");
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md lg:max-w-xl bg-[#000000] border-l border-white/40 z-[101] rounded-l-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col text-white`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#CACACA] flex items-center justify-between">
          <h2 className="text-2xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-[#2B2626] hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-10 space-y-10">

          {/* Shoot Types Dropdown */}
          {/* <div className="relative group">
            <label className="absolute -top-2.5 left-4 bg-[#0A0A0A] z-10 px-1 text-sm text-white/40 group-focus-within:text-[#E8D1AB] transition-colors">
              Shoot Types
            </label>
            <BasicDropdown
              label="Shoot Types"
              value={shootType}
              options={shootTypeOptions}
              onChange={(val) => setShootType(val)}
              width="w-full"
              styles="text-white text-sm bg-transparent h-14 lg:h-[82px] border-white/20 hover:border-white/40"
            />
          </div> */}

          {/* Specialities Dropdown */}
          <div className="relative group">
            <label className="absolute -top-2.5 left-4 bg-[#0A0A0A] z-10 px-1 text-sm text-white/40 group-focus-within:text-[#E8D1AB] transition-colors">
              Select Specialities
            </label>
            <BasicDropdown
              label="Select Specialities"
              value={speciality}
              options={specialityOptions}
              onChange={(val) => setSpeciality(val)}
              width="w-full"
              styles="text-white text-sm bg-transparent h-14 lg:h-[82px] border-white/20 hover:border-white/40"
            />
          </div>

          {/* Availability DatePicker */}
          {/* <div className="relative group">
            <DatePicker
              label="Select Availability"
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              colors={{
                ...datePickerColours,
                inputBackground: "#000000",
                // paperBackground: "#000000"
              }}
              format="MM/dd/yyyy"
              sx={{
                height: { xs: "56px", md: "64px" },
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
              floating
            />
          </div> */}

          {/* DUAL Location Radius Slider */}
          <div className="relative border border-white/20 rounded-xl p-6 pt-8">
            <label className="absolute -top-2.5 left-4 bg-[#0A0A0A] px-1 text-sm text-white/40">
              Location Radius
            </label>

            <div className="relative w-full h-10 flex items-center">
              {/* The Visual Track */}
              <div className="absolute w-full h-1 bg-white/10 rounded-lg" />

              {/* The Active Range Highlight */}
              <div
                className="absolute h-1 bg-[#E8D1AB] rounded-lg"
                style={{
                  left: `${(minRadius / MAX_LIMIT) * 100}%`,
                  right: `${100 - (maxRadius / MAX_LIMIT) * 100}%`
                }}
              />

              {/* Min Range Input */}
              <input
                type="range"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                step={STEP}
                value={minRadius}
                onChange={(e) => setMinRadius(Math.min(Number(e.target.value), maxRadius - STEP))}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#0A0A0A] cursor-pointer"
              />

              {/* Max Range Input */}
              <input
                type="range"
                min={MIN_LIMIT}
                max={MAX_LIMIT}
                step={STEP}
                value={maxRadius}
                onChange={(e) => setMaxRadius(Math.max(Number(e.target.value), minRadius + STEP))}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#0A0A0A] cursor-pointer"
              />
            </div>

            <div className="flex justify-between mt-2 text-xs font-medium">
              <div className="text-left">
                <span className="text-white/40 block mb-1">Minimum</span>
                <span className="text-white font-semibold">{minRadius} Miles</span>
              </div>
              <div className="text-right">
                <span className="text-white/40 block mb-1">Maximum</span>
                <span className="text-white font-semibold">{maxRadius} Miles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <button onClick={handleReset} className="h-12 border border-white/20 text-white hover:bg-white/5 rounded-lg font-medium transition-colors">
            Reset
          </button>
          <button onClick={onClose} className="h-12 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-semibold rounded-lg transition-colors">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};