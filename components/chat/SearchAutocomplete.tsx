"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchAutocompleteOption {
  id: string;
  label: string;
  description?: string | null;
  disabled?: boolean;
  disabledLabel?: string | null;
}

interface SearchAutocompleteProps {
  label?: string;
  placeholder?: string;
  options: SearchAutocompleteOption[];
  value?: string;
  onChange: (value: string) => void;
  emptyMessage?: string;
  isDark?: boolean;
}

export default function SearchAutocomplete({
  label,
  placeholder = "Search...",
  options,
  value = "",
  onChange,
  emptyMessage = "No results found",
  isDark = true,
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.id === value) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      [option.label, option.description].filter(Boolean).some((part) => String(part).toLowerCase().includes(normalizedQuery))
    );
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (<label className={`mb-2 block text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>{label}</label>) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between rounded-lg lg:rounded-2xl border px-4 text-left text-sm outline-none transition duration-200 ${
          isDark ? "border-white/10 bg-[#101010] text-white" : "border-gray-200 bg-white text-black shadow-sm hover:bg-gray-50"
        }`}
      >
        <span className={selected ? (isDark ? "text-white" : "text-black") : (isDark ? "text-white/35" : "text-gray-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition duration-200 ${isDark ? "text-white/45" : "text-gray-400"} ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className={`absolute z-50 mt-2 w-full rounded-2xl border p-3 ${
          isDark ? "border-white/10 bg-[#0d0d0d] shadow-2xl" : "border-gray-200 bg-white shadow-xl"
        }`}>
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-white/35" : "text-gray-400"}`} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none transition ${
                isDark ? "border-white/10 bg-[#141414] text-white placeholder:text-white/30" : "border-gray-200 bg-gray-50 text-black placeholder:text-gray-400"
              }`}
            />
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition duration-200 ${
                      option.disabled
                        ? (isDark ? "cursor-not-allowed border-white/10 bg-[#101010] opacity-60" : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60")
                        : isSelected
                          ? (isDark ? "border-[#E5D5B8] bg-[#1A1711]" : "border-[#C5A880] bg-[#FAF6F0]")
                          : (isDark ? "border-white/10 bg-[#121212] hover:bg-[#171717]" : "border-gray-100 bg-white hover:bg-gray-50")
                    }`}
                    disabled={option.disabled}
                  >
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-800"}`}>{option.label}</p>
                      {option.description || option.disabledLabel ? (
                        <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-gray-500"}`}>
                          {option.disabledLabel || option.description}
                        </p>
                      ) : null}
                    </div>
                    {option.disabled ? (
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                        isDark ? "border-white/10 bg-white/5 text-white/55" : "border-gray-200 bg-gray-100 text-gray-600"
                      }`}>
                        Exists
                      </span>
                    ) : isSelected ? (
                      <Check className={`h-4 w-4 ${isDark ? "text-[#E5D5B8]" : "text-[#A38456]"}`} />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className={`rounded-xl border border-dashed px-3 py-6 text-center text-sm ${isDark ? "border-white/10 text-white/40" : "border-gray-200 text-gray-400"}`}>
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}