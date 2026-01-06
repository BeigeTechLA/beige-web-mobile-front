"use client";

import React from "react";
import { Check } from "lucide-react";

interface ContentTypeCheckboxProps {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  subLabel?: string;
}

export const ContentTypeCheckbox: React.FC<ContentTypeCheckboxProps> = ({
  label,
  icon,
  checked,
  onChange,
  subLabel,
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`relative cursor-pointer group flex items-center justify-between p-4 lg:p-6 rounded-[16px] border transition-all duration-300 ${
        checked
          ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
          : "bg-[#101010] border-white/10 hover:border-white/20 text-white"
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            checked ? "bg-black/10" : "bg-white/5"
          }`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col">
            <span className={`text-base lg:text-lg font-medium ${checked ? "text-black" : "text-white"}`}>
                {label}
            </span>
            {subLabel && (
                <span className={`text-xs ${checked ? "text-black/60" : "text-white/40"}`}>
                    {subLabel}
                </span>
            )}
        </div>
      </div>

      <div
        className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
          checked
            ? "bg-black border-black text-[#E8D1AB]"
            : "bg-transparent border-white/20"
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </div>
    </div>
  );
};
