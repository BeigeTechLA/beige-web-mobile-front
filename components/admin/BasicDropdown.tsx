"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTheme } from "next-themes";

export type DropdownOption = {
  label: string;
  value: string;
  subLabel?: string;
};

type OptionType = string | DropdownOption;

interface StatusDropdownProps {
  label: string;
  value: string;
  options: OptionType[];
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search...",
  roundedFull = false,
  styles,
  onChange,
  width,
  openAlign = "left"
}: StatusDropdownProps) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close when click outside
  useEffect(() => {
    setMounted(true);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchQuery("");
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
  const filteredOptions = normalizedOptions.filter((opt) =>
    `${opt.label} ${opt.subLabel || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const triggerLabel = selectedOption?.label || value || label || "Status";

  useEffect(() => {
    if (open && searchable) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [open, searchable]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearchQuery("");
  };

  if (!mounted) return null;

  return (
    <div className={`relative ${width ? width : "w-fit"}`} ref={ref}>
      {/* Trigger: Compact & Rounded */}
      <button
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!next) setSearchQuery("");
            return next;
          });
        }}
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
          {searchable && (
            <div className={`px-3 pb-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
              <div className={`relative border rounded-lg ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/[0.03]"}`}>
                <Search
                  size={14}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/40" : "text-black/40"}`}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className={`w-full bg-transparent py-2 pl-9 pr-3 text-sm outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"}`}
                />
              </div>
            </div>
          )}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {(searchable ? filteredOptions : normalizedOptions).map((normalized) => {
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
                  <div className="flex flex-col leading-tight">
                    <span>{normalized.label}</span>
                    {normalized.subLabel ? (
                      <span className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                        {normalized.subLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {searchable && filteredOptions.length === 0 && (
              <div className={`px-4 py-3 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                No results found.
              </div>
            )}
            {!searchable && normalizedOptions.length === 0 && (
              <div className={`px-4 py-3 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                No options available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
