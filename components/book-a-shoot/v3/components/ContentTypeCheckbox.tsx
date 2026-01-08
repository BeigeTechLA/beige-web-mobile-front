"use client";

import React from "react";
import { Check } from "lucide-react";

interface ContentTypeCheckboxProps {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  subLabel?: string;
  disabled?: boolean
}

export const ContentTypeCheckbox: React.FC<ContentTypeCheckboxProps> = ({
  label,
  icon,
  checked,
  onChange,
  subLabel,
  disabled = false
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`${disabled ? "pointer-events-none opacity-40" : ""} relative cursor-pointer group flex items-center justify-between p-4 lg:p-6 rounded-[16px] border transition-all duration-300 ${checked
        ? "text-black"
        : "bg-[#101010] border-white/10 hover:border-white/20 text-white"
        }`}
      style={{
        background: checked
          ? "linear-gradient(90deg, #E8D1AB 0%, #FDEFD9 100%), linear-gradient(134deg, #E8D1AB 17.17%, #E6AA46 76.39%)"
          : ""
      }}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`w-10 h-10 lg:w-15 lg:h-15 rounded-[12px] flex items-center justify-center bg-[#171717] ${checked ? "text-white" : ""}`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <span className={`text-base lg:text-lg font-medium ${checked ? "text-black" : "text-white"}`}>
            {label}
          </span>
          {subLabel && (
            <span className={`text-sm ${checked ? "text-black/60" : "text-white/40"}`}>
              {subLabel}
            </span>
          )}
        </div>
      </div>

      {
        !disabled &&
        <div
          className={`w-6 h-6 rounded border border-[#DDD] flex items-center justify-center transition-all ${checked
            ? "bg-black border-black text-[#E8D1AB]"
            : "bg-transparent border-white/20"
            }`}
        >
          {checked && <Check size={14} strokeWidth={3} />}
        </div>
      }

    </div>
  );
};
