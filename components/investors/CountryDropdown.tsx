"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import countries from "i18n-iso-countries";

// Register English locale
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export const DynamicCountrySelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch country names dynamically
  const countryOptions = useMemo(() => {
    const obj = countries.getNames("en", { select: "official" });
    return Object.entries(obj).map(([code, name]) => ({
      code,
      name,
    }));
  }, []);

  // Find the label for the current selected code
  const selectedLabel = useMemo(() => {
    return countryOptions.find((c) => c.code === value)?.name || "Country";
  }, [value, countryOptions]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full group" ref={containerRef}>
      {/* Floating Label */}
      <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60 font-medium z-10">
        Country *
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 lg:h-[82px] w-full flex items-center justify-between bg-transparent border rounded-xl p-4 transition-all duration-200 
          ${isOpen ? "border-[#E8D1AB]" : "border-white/30 focus:border-[#1A1A1A]"}
        `}
      >
        <span className={`text-sm lg:text-lg ${value ? "text-white" : "text-white/50"}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={20}
          className={`text-white/40 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#E8D1AB]" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[88px] left-0 w-full max-h-[300px] bg-[#18181b] border border-[#3D3D3D] rounded-xl shadow-2xl z-50 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {countryOptions.map(({ code, name }) => {
            const isSelected = code === value;
            return (
              <div
                key={code}
                onClick={() => handleSelect(name)}
                className={`px-4 py-3 text-sm lg:text-lg cursor-pointer transition-colors
                  ${isSelected ? "bg-white/5 text-[#E8D1AB]" : "text-white/70 hover:bg-white/10 hover:text-white"}
                `}
              >
                {name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};