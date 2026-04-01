"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

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
  openAlign?: string;
}

export const BasicDropdown = ({
  label,
  value,
  options,
  roundedFull = false,
  styles,
  onChange,
  width,
  openAlign = "left"
}: StatusDropdownProps) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close when click outside
  useEffect(() => {
    setMounted(true);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const normalizeOption = (opt: OptionType): DropdownOption => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  };

  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const triggerLabel = selectedOption?.label || value || label || "Status";

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className={`relative ${width ? width : "w-fit"}`} ref={ref}>
      {/* Trigger: Compact & Rounded */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={` ${width ? width : "w-fit"} h-8 lg:h-10 px-3 lg:px-6 flex items-center gap-2 lg:gap-3 transition-all duration-200 border ${roundedFull ? "rounded-full" : "rounded-lg"
          } ${isDark
            ? `bg-[#18181b] ${open ? "border-[#E8D1AB]" : "border-white/10 hover:border-white/20"} ${styles ? styles : "text-white text-xs lg:text-sm"}`
            : `bg-white ${open ? "border-[#E8D1AB]" : "border-black/10 hover:border-black/20"} ${styles ? styles : "text-black text-xs lg:text-sm"}`
          }`}
      >
        <span className="">
          {triggerLabel}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${isDark ? "text-white/60" : "text-black/40"
            } ${open ? "rotate-180 text-[#E8D1AB]" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className={`absolute top-11 lg:top-14 ${openAlign === "left" ? "left-0" : "right-0"} min-w-[180px] border rounded-[14px] shadow-2xl z-50 py-1.5 overflow-hidden transition-all duration-300 ${isDark
            ? "bg-[#18181b] border-white/10"
            : "bg-white border-black/10"
          }`}>
          {normalizedOptions.map((normalized) => {
            const isSelected = normalized.value === value;
            return (
              <div
                key={normalized.value}
                onClick={() => handleSelect(normalized.value)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${isSelected
                    ? (isDark ? "bg-white/5 text-[#E8D1AB]" : "bg-black/5 text-[#000] font-medium")
                    : (isDark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-black/70 hover:bg-black/5 hover:text-black")
                  }`}
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
