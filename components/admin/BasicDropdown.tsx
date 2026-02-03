"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface StatusDropdownProps {
  label: string;
  value: string;
  options: string[];
  roundedFull?: boolean;
  styles?: string;
  onChange: (value: string) => void;
}

export const BasicDropdown = ({
  label,
  value,
  options,
  roundedFull = false,
  styles,
  onChange,
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

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative w-fit" ref={ref}>
      {/* Trigger: Compact & Rounded */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`h-8 lg:h-10 px-3 lg:px-6 flex items-center gap-2 lg:gap-3 ${roundedFull ? "rounded-full" : "rounded-lg"} bg-[#18181b] border transition-all duration-200 ${styles ? styles : "text-white text-xs lg:text-sm"} ${open ? "border-[#E8D1AB]" : "border-white/10 hover:border-white/20"}`}
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
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                  ${isSelected ? "bg-white/5 text-[#E8D1AB]" : "text-white/70 hover:bg-white/10 hover:text-white"}
                `}
              >
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};