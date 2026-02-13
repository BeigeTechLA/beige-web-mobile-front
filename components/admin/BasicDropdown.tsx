"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";


export type DropdownOption = {
  label: string;
  value: string;
};

type OptionType = string | DropdownOption;

interface StatusDropdownProps {
  label: string;
  value: string;
  options: OptionType[];
  roundedFull?: boolean;
  styles?: string;
  onChange: (value: string) => void;
  width?: string;
}

export const BasicDropdown = ({
  label,
  value,
  options,
  roundedFull = false,
  styles,
  onChange,
  width
}: StatusDropdownProps) => {
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

  const normalizeOption = (opt: OptionType): DropdownOption => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className={`relative ${width ? width : "w-fit"}`} ref={ref}>
      {/* Trigger: Compact & Rounded */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={` ${width ? width : "w-fit"} h-8 lg:h-10 px-3 lg:px-6 flex items-center gap-2 lg:gap-3 ${roundedFull ? "rounded-full" : "rounded-lg"} bg-[#18181b] border transition-all duration-200 ${styles ? styles : "text-white text-xs lg:text-sm"} ${open ? "border-[#E8D1AB]" : "border-white/10 hover:border-white/20"}`}
      >
        <span className="">
          {value || "Status"}
        </span>
        <ChevronDown
          size={18}
          className={`text-white/60 transition-transform duration-200 ${open ? "rotate-180 text-[#E8D1AB]" : ""
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-14 left-0 min-w-[160px] bg-[#18181b] border border-white/10 rounded-[14px] shadow-2xl z-50 py-1.5 overflow-hidden">
          {options.map((opt) => {
            const normalized = normalizeOption(opt);
            const isSelected = normalized.value === value;
            return (
              <div
                key={normalized.value}
                onClick={() => handleSelect(normalized.value)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                  ${isSelected ? "bg-white/5 text-[#E8D1AB]" : "text-white/70 hover:bg-white/10 hover:text-white"}
                `}
              >
                {normalized.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};