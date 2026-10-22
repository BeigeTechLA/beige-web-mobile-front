"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface SelectNoOfCPsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: (selectedCPs: {
    photographer: number;
    videographer: number;
    hybridShooter: number;
  }) => void;
}

const CP_OPTIONS = [
  { key: "photographer", label: "Photographer" },
  { key: "videographer", label: "Videographer" },
  { key: "hybridShooter", label: "Hybrid Shooter (Photo + Video)" },
] as const;

type CPKey = (typeof CP_OPTIONS)[number]["key"];

export default function SelectNoOfCPsModal({
  isOpen,
  onClose,
  onBack,
  onContinue,
}: SelectNoOfCPsModalProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [selected, setSelected] = useState<Record<CPKey, boolean>>({
    photographer: false,
    videographer: false,
    hybridShooter: false,
  });
  const [counts, setCounts] = useState<Record<CPKey, number>>({
    photographer: 0,
    videographer: 0,
    hybridShooter: 0,
  });

  if (!isOpen) return null;

  const toggleOption = (key: CPKey) => {
    setSelected((previous) => {
      const nextSelected = !previous[key];
      if (!nextSelected) {
        setCounts((current) => ({ ...current, [key]: 0 }));
      }
      return { ...previous, [key]: nextSelected };
    });
  };

  const updateCount = (key: CPKey, change: number) => {
    const nextCount = Math.max(0, counts[key] + change);
    setCounts((previous) => ({ ...previous, [key]: nextCount }));
    if (nextCount > 0) setSelected((previous) => ({ ...previous, [key]: true }));
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-cps-title"
        className={`w-full max-w-[640px] overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-300 ${
          isDark
            ? "border-white/10 bg-[#010101] text-white"
            : "border-[#D8D8D8] bg-white text-black"
        }`}
      >
        <div className={`flex min-h-[92px] items-center justify-between border-b px-6 py-5 sm:px-[30px] ${
          isDark ? "border-white/10 bg-[#151515]" : "border-[#E9E9E9] bg-[#FAFAFA]"
        }`}>
          <h2 id="select-cps-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
            Select No of CPs
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              isDark
                ? "text-white/50 hover:bg-white/5 hover:text-white"
                : "text-black/40 hover:bg-black/5 hover:text-black"
            }`}
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-6 sm:px-[30px]">
          {CP_OPTIONS.map((option) => {
            const isSelected = selected[option.key];
            const count = counts[option.key];

            return (
              <div key={option.key} className="flex min-h-[43px] items-center justify-between gap-3">
                <label htmlFor={`select-cp-${option.key}`} className="flex min-w-0 cursor-pointer items-center gap-3">
                  <Checkbox
                    id={`select-cp-${option.key}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleOption(option.key)}
                    className={`h-[21px] w-[21px] shrink-0 rounded-[4px] border focus-visible:ring-[#E8D1AB] focus-visible:ring-offset-0 data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black ${
                      isDark ? "border-white/40 bg-black" : "border-[#CFCFCF] bg-white"
                    }`}
                  />
                  <span className={`text-sm leading-6 sm:text-base ${isDark ? "text-white/85" : "text-black/80"}`}>
                    {option.label}
                  </span>
                </label>

                <div className="flex h-10 w-[110px] shrink-0 items-center justify-between rounded-full bg-[#E8D1AB] px-3 text-black">
                  <button
                    type="button"
                    aria-label={`Decrease ${option.label}`}
                    disabled={count === 0}
                    onClick={() => updateCount(option.key, -1)}
                    className="flex h-7 w-6 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={17} strokeWidth={2} />
                  </button>
                  <span className="min-w-[20px] text-center text-base font-semibold tabular-nums">
                    {count}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${option.label}`}
                    onClick={() => updateCount(option.key, 1)}
                    className="flex h-7 w-6 items-center justify-center"
                  >
                    <Plus size={17} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-5">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className={`h-11 flex-1 ${
                isDark
                  ? "border-white/10 bg-[#151515] text-white hover:bg-[#1D1D1D]"
                  : "border-[#E9E9E9] bg-[#FAFAFA] text-black hover:bg-[#F3F3F3]"
              }`}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => onContinue(counts)}
              variant="beige"
              className="h-11 flex-1 font-semibold"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
