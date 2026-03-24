"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, X, Check } from "lucide-react";

type Option = {
  key: string;
  value: string;
};

type MultiSelectDropdownProps = {
  title: string;
  options: Option[];
  value: string[]; // Array of selected keys
  bgColour: string;
  onChange: (keys: string[]) => void;
  maxDisplay?: number; // Max number of pills to display before showing "+N more"
  isDisabled?: boolean;
  fullWidth?: boolean;
  isDark?: boolean; // Added isDark prop
};

export default function MultiSelectDropdown({
  title,
  options,
  value,
  bgColour,
  onChange,
  maxDisplay = 2,
  isDisabled = false,
  fullWidth = false,
  isDark = true, // Defaulting to true
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredPill, setHoveredPill] = useState<string | null>(null); // Track which pill is hovered
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = options.filter((o) => value.includes(o.key));
  const displayOptions = selectedOptions.slice(0, maxDisplay);
  const remainingOptions = selectedOptions.slice(maxDisplay);
  const remainingCount = remainingOptions.length;

  const handleToggle = (key: string) => {
    if (isDisabled) return; // Guard clause
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const handleRemove = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return; // Guard clause
    onChange(value.filter((k) => k !== key));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return; // Guard clause
    onChange([]);
  };

  return (
    <div className={`relative w-full ${fullWidth ? "" : "max-w-md"} ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`} ref={dropdownRef}>
      <div
        className={`min-h-14 lg:min-h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border transition-colors ${isDark ? "border-white/40" : "border-[#0000004D]"
          }`}
        onClick={() => !isDisabled && setOpen((p) => !p)}
      >
        <span className={`absolute -top-3 left-4 px-3 text-sm lg:text-base rounded ${bgColour} ${isDark ? `text-white/60` : "text-[#919191]"}`}>
          {title}
        </span>

        {/* Selected values as pills */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {selectedOptions.length > 0 ? (
            <>
              {displayOptions.map((option) => (
                <div
                  key={option.key}
                  className={`relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs lg:text-sm transition-colors ${isDark ? "bg-[#2A2A2A] text-white" : "bg-black/5 text-black"
                    }`}
                  onMouseEnter={() => setHoveredPill(option.key)}
                  onMouseLeave={() => setHoveredPill(null)}
                >
                  <span className="truncate max-w-[120px]">{option.value}</span>
                  <X
                    size={14}
                    className="cursor-pointer opacity-70 hover:opacity-100 flex-shrink-0"
                    onClick={(e) => handleRemove(option.key, e)}
                  />

                  {/* Individual Pill Hover Popup */}
                  {hoveredPill === option.key && (
                    <div className={`absolute bottom-full mb-2 left-0 z-50 border p-2 px-3 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-gray-200 text-black"
                      }`}>
                      <span className="text-xs whitespace-nowrap">{option.value}</span>
                      <div className={`absolute top-full left-4 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${isDark ? "border-t-[#1A1A1A]" : "border-t-white"
                        }`}></div>
                    </div>
                  )}
                </div>
              ))}

              {/* Remaining Selections Popup Logic */}
              {remainingCount > 0 && (
                <div
                  className="relative group"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <span className={`${isDark ? "text-[#E8D1AB]":"text-[#919191]"} text-xs lg:text-sm cursor-pointer`}>
                    +{remainingCount} more
                  </span>

                  {/* Hover Popup */}
                  {showTooltip && (
                    <div className={`absolute bottom-full mb-2 left-0 z-50 border p-3 rounded-lg shadow-2xl min-w-[150px] animate-in fade-in zoom-in duration-200 ${isDark ? "bg-[#1A1A1A] border-white/10 text-white" : "bg-white border-gray-200 text-black"
                      }`}>
                      <div className="flex flex-col gap-2">
                        {remainingOptions.map((option) => (
                          <div key={option.key} className="flex items-center justify-between gap-3 pb-1 last:pb-0">
                            <span className="text-white text-xs whitespace-nowrap">{option.value}</span>
                          </div>
                        ))}
                      </div>
                      {/* Triangle Arrow */}
                      <div className={`absolute top-full left-4 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${isDark ? "border-t-[#1A1A1A]" : "border-t-white"}`}></div>
                    </div>
                  )}
                </div>
              )}

              {selectedOptions.length > 1 && (
                <button
                  onClick={handleClearAll}
                  className={`text-xs underline ml-1 transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"
                    }`}
                >
                  Clear
                </button>
              )}
            </>
          ) : (
            <span className={`${isDark ? "text-white/40" : "text-black/40"} text-sm lg:text-base`}>Select {title}</span>
          )}
        </div>

        <div className={`${isDark ? "text-white" : "text-black"} flex-shrink-0`}>
          {open && !isDisabled ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {open && !isDisabled && (
        <div className={`absolute top-16 lg:top-[90px] left-0 w-full mt-3 z-30 ${bgColour} rounded-lg border ${isDark ? `${bgColour} border-white/10` : "bg-white border-gray-200"}  max-h-[300px] overflow-y-auto no-scrollbar`}>
          {options.map((option) => {
            const isSelected = value.includes(option.key);
            return (
              <div
                key={option.key}
                onClick={() => handleToggle(option.key)}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition
                  ${isSelected 
                    ? isDark ? "bg-[#E8D1AB]/10 text-white" : "bg-[#FDEFD9] text-black" 
                    : isDark ? "text-white/50 hover:bg-white/5" : "text-black/60 hover:bg-black/5"
                  }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all
                    ${isSelected ? "border-[#E8D1AB] bg-[#E8D1AB]" : isDark ? "border-white/30" : "border-black/20"}`}>
                  {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                </div>
                <span className="text-sm lg:text-base">{option.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}