"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  id: string;
  label?: string;
  value: string[];
  options: Option[];
  onChange: (value: string[]) => void;
}

export const MultiSelectDropdown = ({
  id,
  label = "Select",
  value = [],
  options,
  onChange,
}: MultiSelectProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close when click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (optValue: string) => {
    const newValue = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };

  const removeOption = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation(); // Prevent dropdown from toggling
    onChange(value.filter((v) => v !== optValue));
  };

  // Helper to find the label for a stored value
  const getLabelFromValue = (val: string) => {
    return options.find((opt) => opt.value === val)?.label || val;
  };

  return (
    <div className="relative w-full" ref={ref}>
      {/* Floating Label */}
      <label className="absolute -top-2 lg:-top-3 left-4 bg-[#171717] px-2 text-sm lg:text-base text-white/60 z-10 pointer-events-none">
        {label}
      </label>

      {/* Trigger / Input Field */}
      <div
        className={`min-h-14 lg:min-h-[82px] w-full rounded-[12px] px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-200 bg-[#171717] 
          ${open
            ? "border border-[#E8D1AB]"
            : "border-[0.5px] border-white/30 hover:border-white/50"
          }
        `}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap gap-2 pr-4">
          {value.length > 0 ? (
            value.map((val) => (
              <span
                key={val} // Unique string key
                className="flex items-center gap-1 bg-[#262626] text-white text-sm lg:text-base py-1.5 px-3 rounded-lg border border-white/10 capitalize"
              >
                {getLabelFromValue(val)}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, val)}
                  className="hover:text-[#E8D1AB] transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-white/40 text-base">Select {label}</span>
          )}
        </div>

        <ChevronDown
          className={`text-white/60 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#E8D1AB]" : ""
          }`}
          size={20}
        />
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#171717] border-[0.5px] border-white/30 rounded-[12px] shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);

              return (
                <div
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors
                    ${isSelected ? "bg-[#FFF8E6] rounded-xl" : "hover:bg-white/5"}
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#E8D1AB] border-[#E8D1AB]"
                        : "border-white/30 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-black font-bold" />}
                  </div>

                  <span
                    className={`text-sm lg:text-base capitalize transition-colors ${
                      isSelected ? "text-black font-medium" : "text-white"
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};