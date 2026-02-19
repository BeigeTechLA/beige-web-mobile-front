"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface DropdownOption {
  value: string | number;
  label: string;
}

interface FloatingLabelDropdownProps {
  label: string;
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  labelBg?: string;
}

export const FloatingLabelDropdown = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  required = false,
  className = "",
  labelBg = "bg-[#171717]"
}: FloatingLabelDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string | number) => {
    onChange(val.toString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the dropdown from opening
    onChange("");
  };

  return (
    <div className={`relative w-full group ${className}`} ref={containerRef}>
      {/* Floating Label */}
      <label className={`absolute -top-2.5 left-4 ${labelBg} px-2 text-xs lg:text-sm text-white/60 font-medium z-10 group-focus-within:text-[#E8D1AB] transition-colors`}>
        {label} {required && "*"}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 lg:h-[82px] w-full flex items-center justify-between bg-transparent border rounded-xl px-5 transition-all duration-200 
          ${isOpen ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]/20" : "border-white/20 hover:border-white/40"}
        `}
      >
        <div className="flex flex-wrap gap-2 items-center overflow-hidden">
          {selectedOption ? (
            /* Selected Option Pill Style from Screenshot */
            <div className="flex items-center gap-3 bg-[#333333] hover:bg-[#444444] text-white px-3 py-1.5 lg:py-2 rounded-lg transition-colors group/pill">
              <span className="text-sm lg:text-base font-medium whitespace-nowrap">
                {selectedOption.label}
              </span>
              <X
                size={16}
                className="text-white/80 hover:text-white cursor-pointer transition-colors"
                onClick={handleClear}
              />
            </div>
          ) : (
            <span className="text-sm lg:text-base text-white/40">
              {placeholder}
        </span>
          )}
        </div>

        <ChevronDown
          size={20}
          className={`text-white/40 shrink-0 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#E8D1AB]" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[280px] bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-[100] py-2 overflow-y-auto custom-scrollbar">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-5 py-3 text-sm lg:text-base cursor-pointer transition-all
                  ${value === option.value
                    ? "bg-[#E8D1AB]/10 text-[#E8D1AB] font-medium"
                    : "text-white/70 hover:bg-white/5 hover:text-white"}
                `}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-5 py-3 text-sm text-white/40 italic">No options available</div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};