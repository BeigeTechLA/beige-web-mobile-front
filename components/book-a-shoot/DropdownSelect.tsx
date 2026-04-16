"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type Option = {
  key: string;
  value: string;
};

type DropdownSelectProps = {
  title: string;
  options: Option[];
  value: string | null;
  bgColour: string;
  onChange: (key: string) => void;
  icon?: React.ReactNode;
  isDark?: boolean; // Added isDark prop
};

export default function DropdownSelect({
  title,
  options,
  value,
  bgColour,
  onChange,
  icon,
  isDark = true, // Defaulting to true
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.key === value);

  const filteredOptions = options.filter((option) =>
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Attach listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Label (External) */}
      <div className={`text-sm font-medium font-bold capitalize tracking-wider absolute -top-3 left-4 z-20 px-2 ${
        isDark ? `${bgColour} text-white/60` : "text-black/40"
      }`}>
        {title}
      </div>

      <div
        className={`h-14 lg:h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border transition-colors ${
          isDark ? "border-white/40" : "border-[#0000004D]"
        }`}
        onClick={() => {
          if (!open) {
            setOpen(true);
            setSearchTerm("");
          }
        }}
      >
        {/* Input or Selected value pill */}
        {open ? (
          <input
            autoFocus
            type="text"
            className={`bg-transparent border-none outline-none w-full text-sm lg:text-base mr-2 ${
              isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"
            }`}
            placeholder={`Search ${title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        ) : selectedOption ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm lg:text-base ${
            isDark ? "bg-[#2A2A2A] text-white" : "bg-black/5 text-black"
          }`}>
            {selectedOption.value}
            <X
              size={18}
              className="cursor-pointer opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          </div>
        ) : (
          <span className={` text-sm lg:text-base ${isDark ? "text-white/40" : "text-black/40"}`}>Select {title}</span>
        )}

        {icon ? (
          <div className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`}>{icon}</div>
        ) : open ? (
          <ChevronUp className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
        ) : (
          <ChevronDown className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`} />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-[calc(100%+8px)] left-0 w-full z-30 rounded-lg border max-h-[300px] overflow-y-auto no-scrollbar ${
          isDark ? `${bgColour} border-white/10` : "bg-white border-gray-200"
        }`}>
          {filteredOptions.length === 0 ? (
            <div className={`px-6 py-4 text-sm text-center ${isDark ? "text-white/50" : "text-black/40"}`}>
              No options found.
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.key === value;

              return (
                <div
                  key={option.key}
                  onClick={() => {
                    onChange(option.key);
                    setOpen(false);
                    setSearchTerm("");
                  }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition
                  ${isSelected
                      ? "bg-[#FFFCE8] text-black"
                      : isDark ? "text-white/50 hover:bg-white/5" : "text-black/60 hover:bg-black/5"
                    }`}
                >
                  {/* Radio */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                    ${isSelected
                        ? "border-[#E8D1AB] bg-[#E8D1AB]"
                        : isDark ? "border-white/50" : "border-black/20"
                      }`}
                  >
                    {isSelected && (
                      <div className="w-1 h-1 rounded-full bg-black" />
                    )}
                  </div>

                  <span className="text-sm lg:text-base">{option.value}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}