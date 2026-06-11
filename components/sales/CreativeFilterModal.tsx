"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BasicDropdown } from "../admin/BasicDropdown";

export const CREATIVE_RADIUS_OPTIONS = [10, 50, 100, 150, 200] as const;
export type CreativeRadiusOption = (typeof CREATIVE_RADIUS_OPTIONS)[number];

interface FilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: { radius: number }) => void;
  value?: number;
  isDark?: boolean;
}

const DEFAULT_RADIUS = 50;

export const CreativeFilterModal = ({ isOpen, onClose, onApply, value, isDark = true }: FilterProps) => {
  const [selectedRadius, setSelectedRadius] = useState<number>(value ?? DEFAULT_RADIUS);
  const [speciality, setSpeciality] = useState("");

  const specialityOptions = ["Videography", "Photography", "Drone", "Editing"];

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRadius(value ?? DEFAULT_RADIUS);
    }
  }, [isOpen, value]);

  const selectedRadiusIndex = Math.max(
    0,
    CREATIVE_RADIUS_OPTIONS.findIndex((radius) => radius === selectedRadius)
  );
  const selectedRadiusPct = (selectedRadiusIndex / (CREATIVE_RADIUS_OPTIONS.length - 1)) * 100;

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(event.target.value);
    const nextRadius = CREATIVE_RADIUS_OPTIONS[index] ?? DEFAULT_RADIUS;
    setSelectedRadius(nextRadius);
  };

  const handleApplyClick = () => {
    onApply?.({ radius: selectedRadius });
    onClose();
  };

  const handleReset = () => {
    setSelectedRadius(DEFAULT_RADIUS);
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
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md lg:max-w-xl border-l z-[101] rounded-l-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${
          isDark ? "bg-[#000000] border-white/40 text-white" : "bg-white border-gray-200 text-black"
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? "border-[#CACACA]/20" : "border-gray-100"
        }`}>
          <h2 className="text-2xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className={`p-3 rounded-full transition-colors ${
              isDark ? "bg-[#2B2626] hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-black"
            }`}
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
            <label className={`absolute -top-2.5 left-4 z-10 px-1 text-sm transition-colors ${
              isDark ? "bg-[#000000] text-white/40 group-focus-within:text-[#E8D1AB]" : "bg-white text-black/40 group-focus-within:text-[#E8D1AB]"
            }`}>
              Select Specialities
            </label>
            <BasicDropdown
              label="Select Specialities"
              value={speciality}
              options={specialityOptions}
              onChange={(val) => setSpeciality(val)}
              width="w-full"
              styles={`text-sm h-14 lg:h-[82px] transition-all ${
                isDark 
                  ? "text-white border-white/20 hover:border-white/40" 
                  : "text-black border-gray-200 hover:border-gray-400"
              }`}
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

          {/* Fixed Location Radius Slider */}
          <div className={`relative border rounded-xl p-6 pt-8 transition-colors ${
            isDark ? "border-white/20" : "border-gray-200"
          }`}>
            <label className={`absolute -top-2.5 left-4 px-1 text-sm transition-colors ${
              isDark ? "bg-[#0A0A0A] text-white/40" : "bg-white text-black/40"
            }`}>
              Location Radius
            </label>

            <div className="relative px-1 pt-6">
              <div className={`absolute left-1 right-1 top-10 h-1 rounded-full ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
              <div
                className="absolute left-1 top-10 h-1 rounded-full bg-[#E8D1AB]"
                style={{
                  width: `${selectedRadiusPct}%`,
                }}
              />

              <input
                type="range"
                min={0}
                max={CREATIVE_RADIUS_OPTIONS.length - 1}
                step={1}
                value={selectedRadiusIndex}
                onChange={handleRadiusChange}
                className={`relative z-10 h-10 w-full appearance-none bg-transparent
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E8D1AB] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.2)]
                  [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#E8D1AB]`}
              />

              <div className="relative mt-4 h-5 text-[11px] font-medium sm:text-xs">
                {CREATIVE_RADIUS_OPTIONS.map((radius, index) => {
                  const left = (index / (CREATIVE_RADIUS_OPTIONS.length - 1)) * 100;
                  const isEdge = index === 0 || index === CREATIVE_RADIUS_OPTIONS.length - 1;

                  return (
                    <span
                      key={radius}
                      className={`absolute top-0 transition-colors ${
                        selectedRadius === radius ? "text-[#E8D1AB]" : isDark ? "text-white/40" : "text-black/40"
                      }`}
                      style={{
                        left: `${left}%`,
                        transform: isEdge ? (index === 0 ? "translateX(0%)" : "translateX(-100%)") : "translateX(-50%)",
                      }}
                    >
                      {radius}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              isDark ? "border-white/10 bg-white/5 text-white/70" : "border-gray-200 bg-gray-50 text-black/60"
            }`}>
              Selected radius: <span className="font-semibold text-[#E8D1AB]">{selectedRadius} miles</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 grid grid-cols-2 gap-4 border-t ${
          isDark ? "border-white/10" : "border-gray-100"
        }`}>
          <button 
            onClick={handleReset} 
            className={`h-12 border rounded-lg font-medium transition-colors ${
              isDark 
                ? "border-white/20 text-white hover:bg-white/5" 
                : "border-gray-200 text-black hover:bg-gray-50"
            }`}
          >
            Reset
          </button>
           <button 
            onClick={handleApplyClick} 
            className={`h-12 font-semibold rounded-lg transition-colors ${
              isDark 
                ? "bg-[#E8D1AB] text-black hover:bg-[#dcb98a]" 
                : "bg-[#E8D1AB] text-black hover:bg-[#d9bc90] shadow-sm"
            }`}
      >
        Apply Filters
      </button>
        </div>
      </div>
    </>
  );
};
