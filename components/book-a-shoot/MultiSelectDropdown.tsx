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
  isDisabled?: boolean; // Added prop
};

export default function MultiSelectDropdown({
  title,
  options,
  value,
  bgColour,
  onChange,
  maxDisplay = 2,
  isDisabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false); // State for hover popup
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
  // const remainingCount = selectedOptions.length - maxDisplay;
  const remainingOptions = selectedOptions.slice(maxDisplay); // Get the rest
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
    <div className={`relative w-full max-w-md ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`} ref={dropdownRef}>
      <div
        className={`min-h-14 lg:min-h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40`}
        onClick={() => !isDisabled && setOpen((p) => !p)} // Check isDisabled here
      >
        <span className={`absolute -top-3 left-4 ${bgColour} px-3 text-sm lg:text-base text-white/60 rounded`}>
          {title}
        </span>

        {/* Selected values as pills */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {selectedOptions.length > 0 ? (
            <>
              {displayOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center gap-1.5 bg-[#2A2A2A] px-2 py-1 rounded-md text-white text-xs lg:text-sm"
                >
                  <span className="truncate max-w-[120px]">{option.value}</span>
                  <X
                    size={14}
                    className="cursor-pointer opacity-70 hover:opacity-100 flex-shrink-0"
                    onClick={(e) => handleRemove(option.key, e)}
                  />
                </div>
              ))}

              {/* Remaining Selections Popup Logic */}
              {remainingCount > 0 && (
                <div
                  className="relative group"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <span className="text-[#E8D1AB] text-xs lg:text-sm cursor-pointer">
                    +{remainingCount} more
                  </span>

                  {/* Hover Popup */}
                  {showTooltip && (
                    <div className="absolute bottom-full mb-2 left-0 z-50 bg-[#1A1A1A] border border-white/10 p-3 rounded-lg shadow-2xl min-w-[150px] animate-in fade-in zoom-in duration-200">
                      <div className="flex flex-col gap-2">
                        {remainingOptions.map((option) => (
                          <div key={option.key} className="flex items-center justify-between gap-3  pb-1 last:pb-0">
                            <span className="text-white text-xs whitespace-nowrap">{option.value}</span>
                          </div>
                        ))}
                      </div>
                      {/* Triangle Arrow */}
                      <div className="absolute top-full left-4 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#1A1A1A]"></div>
                    </div>
                  )}
                </div>
              )}

              {selectedOptions.length > 1 && (
                <button
                  onClick={handleClearAll}
                  className="text-white/40 hover:text-white/70 text-xs underline ml-1"
                >
                  Clear
                </button>
              )}
            </>
          ) : (
            <span className="text-white/40 text-sm lg:text-base">Select {title}</span>
          )}
        </div>

        {open && !isDisabled ? (
          <ChevronUp className="text-white flex-shrink-0" />
        ) : (
          <ChevronDown className="text-white flex-shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && !isDisabled && ( // Added extra safety check here
        <div
          className={`absolute top-16 lg:top-[90px] left-0 w-full mt-3 z-30 ${bgColour} rounded-lg border border-white/10 max-h-[300px] overflow-y-auto`}
        >
          {options.map((option) => {
            const isSelected = value.includes(option.key);

            return (
              <div
                key={option.key}
                onClick={() => handleToggle(option.key)}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition
                  ${isSelected
                    ? "bg-[#E8D1AB]/10 text-white"
                    : "text-white/50 hover:bg-white/5"
                  }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all
                    ${isSelected
                      ? "border-[#E8D1AB] bg-[#E8D1AB]"
                      : "border-white/30"
                    }`}
                >
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