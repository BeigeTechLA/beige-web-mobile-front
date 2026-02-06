import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  hoverBorder: string;
  valueColor?: string; // Optional with default
  subtext?: string;    // Optional
}

export const StatCard = ({
  label,
  value,
  icon: Icon,
  iconColor,
  hoverBorder,
  valueColor = "text-white",
  subtext = "",
}: StatCardProps) => {
  return (
    <div className={`bg-[#111] rounded-lg lg:rounded-xl p-4 lg:p-6 border border-white/5 relative overflow-hidden group ${hoverBorder} transition-all duration-300`}>
      <div className="absolute top-2 right-2 lg:top-0 lg:right-0 p-3 lg:p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-300">
        <Icon
          size={40}
          className={`${iconColor} w-7 h-7 lg:w-10 lg:h-10`}
        />
      </div>
      <div className="relative z-10">
        <p className="text-white/40 text-sm font-medium mb-1">{label}</p>
        <p className={`text-xl lg:text-2xl font-bold ${valueColor}`}>{value}</p>
        {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}