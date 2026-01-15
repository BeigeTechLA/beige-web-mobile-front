"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Dot, X } from "lucide-react";

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
};

export default function DropdownSelect({
  title,
  options,
  value,
  bgColour,
  onChange,
  icon,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.key === value);

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
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
        {title}
      </div>

      <div
        className={`h-14 lg:h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40`}
        onClick={() => setOpen((p) => !p)}
      >
        {/* Selected value pill */}
        {selectedOption ? (
          <div className="flex items-center gap-2 bg-[#2A2A2A] px-3 py-1.5 rounded-md text-white text-sm lg:text-base">
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
          <span className="text-white/40 text-sm lg:text-base">Select {title}</span>
        )}

        {icon ? (
          <div className="text-white">{icon}</div>
        ) : open ? (
          <ChevronUp className="text-white" />
        ) : (
          <ChevronDown className="text-white" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-[calc(100%+8px)] left-0 w-full z-30 ${bgColour} rounded-lg border border-white/10 max-h-[300px] overflow-y-auto`}>
          {options.map((option) => {
            const isSelected = option.key === value;

            return (
              <div
                key={option.key}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition
                  ${isSelected
                    ? "bg-[#FFFCE8] text-black"
                    : "text-white/50 hover:bg-white/5"
                  }`}
              >
                {/* Radio */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${isSelected
                      ? "border-[#E8D1AB] bg-[#E8D1AB]"
                      : "border-white/50"
                    }`}
                >
                  {isSelected && (
                    <div className="w-1 h-1 rounded-full bg-black" />
                  )}
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
