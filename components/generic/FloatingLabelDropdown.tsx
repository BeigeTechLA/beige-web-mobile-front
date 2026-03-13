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
  isDark?: boolean; // Added theme prop
}

export const FloatingLabelDropdown = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  required = false,
  className = "",
  labelBg, // Made optional to handle dynamically
  isDark = true,
}: FloatingLabelDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine label background if not explicitly provided
  const activeLabelBg = labelBg || (isDark ? "bg-[#171717]" : "bg-white");

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
      <label
        className={`absolute -top-2.5 left-4 ${activeLabelBg} px-2 text-xs lg:text-sm font-medium z-10 transition-colors duration-300 ${isDark
            ? `text-white/60 group-focus-within:text-[#E8D1AB]`
            : `text-black/60 group-focus-within:text-black/80`
          }`}
      >
        {label} {required && "*"}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 lg:h-[82px] w-full flex items-center justify-between bg-transparent border rounded-xl px-5 transition-all duration-300 
          ${isOpen
            ? (isDark ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]/20" : "border-[#000000]/80 ring-1 ring-[#E8D1AB]/20")
            : (isDark ? "border-white/20 hover:border-white/40" : "border-[#0000004D] hover:border-[#000000]/40")
          }
        `}
      >
        <div className="flex flex-wrap gap-2 items-center overflow-hidden">
          {selectedOption ? (
            <div className={`flex items-center gap-3 px-3 py-1.5 lg:py-2 rounded-lg transition-colors group/pill ${isDark
                ? "bg-[#333333] hover:bg-[#444444] text-white"
                : "bg-[#F3F4F6] hover:bg-[#E5E7EB] text-black"
              }`}>
              <span className="text-sm lg:text-base font-medium whitespace-nowrap">
                {selectedOption.label}
              </span>
              <X
                size={16}
                className={`cursor-pointer transition-colors ${isDark ? "text-white/80 hover:text-white" : "text-black/60 hover:text-black"}`}
                onClick={handleClear}
              />
            </div>
          ) : (
            <span className={`text-sm lg:text-base ${isDark ? "text-white/40" : "text-black/40"}`}>
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={20}
          className={`shrink-0 ml-2 transition-transform duration-300 ${isOpen
              ? (isDark ? "rotate-180 text-[#E8D1AB]" : "rotate-180 text-[#B18A00]")
              : (isDark ? "text-white/40" : "text-black/40")
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] left-0 w-full max-h-[280px] border rounded-xl shadow-2xl z-[100] py-2 overflow-y-auto custom-scrollbar transition-colors duration-300 ${isDark
            ? "bg-[#121212] border-white/10 shadow-black"
            : "bg-white border-[#D8D8D8] shadow-gray-200"
          }`}>
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-5 py-3 text-sm lg:text-base cursor-pointer transition-all ${value === option.value
                    ? (isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB] font-medium" : "bg-[#B18A00]/10 text-[#B18A00] font-medium")
                    : (isDark ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-black/70 hover:bg-gray-50 hover:text-black")
                  }`}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className={`px-5 py-3 text-sm italic ${isDark ? "text-white/40" : "text-black/40"}`}>
              No options available
            </div>
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
          background: ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};