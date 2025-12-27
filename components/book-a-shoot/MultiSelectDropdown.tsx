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
};

export default function MultiSelectDropdown({
  title,
  options,
  value,
  bgColour,
  onChange,
  maxDisplay = 2,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
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
  const remainingCount = selectedOptions.length - maxDisplay;

  const handleToggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const handleRemove = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((k) => k !== key));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div
        className={`min-h-14 lg:min-h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40`}
        onClick={() => setOpen((p) => !p)}
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
              {remainingCount > 0 && (
                <span className="text-[#E8D1AB] text-xs lg:text-sm">
                  +{remainingCount} more
                </span>
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

        {open ? (
          <ChevronUp className="text-white flex-shrink-0" />
        ) : (
          <ChevronDown className="text-white flex-shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
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
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all
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

