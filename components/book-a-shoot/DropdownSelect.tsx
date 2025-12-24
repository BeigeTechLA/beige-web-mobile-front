"use client";

import { useState } from "react";
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
};

export default function DropdownSelect({
  title,
  options,
  value,
  bgColour,
  onChange,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.key === value);

  return (
    <div className="relative w-full max-w-md">
      <div
        className={`h-14 lg:h-[82px] relative ${bgColour} rounded-2xl px-4 py-4 flex items-center justify-between cursor-pointer border border-white/40`}
        onClick={() => setOpen((p) => !p)}
      >
        <span className={`absolute -top-3 left-4 ${bgColour} px-3 text-sm lg:text-base text-white/60 rounded`}>
          {title}
        </span>

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

        {open ? (
          <ChevronUp className="text-white" />
        ) : (
          <ChevronDown className="text-white" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className={`absolute top-16 lg:top-[90px] left-0  w-full mt-3 z-30 ${bgColour} rounded-lg border border-white/10`}>
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
