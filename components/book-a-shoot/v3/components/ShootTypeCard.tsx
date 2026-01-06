"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

interface ShootTypeCardProps {
  title: string;
  details: string; // e.g. "Conferences, summits, company offsites"
  image: string;
  stats?: { label: string; value: string }[];
  selected: boolean;
  onClick: () => void;
}

export const ShootTypeCard: React.FC<ShootTypeCardProps> = ({
  title,
  details,
  image,
  stats,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer group flex overflow-hidden rounded-[20px] border transition-all duration-300 h-[160px] ${
        selected
          ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
          : "bg-[#101010] border-white/10 hover:border-white/20 text-white"
      }`}
    >
      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between z-10 relative">
        <div>
          <h3 className={`text-lg font-bold mb-1 ${selected ? "text-black" : "text-white"}`}>
            {title}
          </h3>
          <p className={`text-xs ${selected ? "text-black/70" : "text-white/60"}`}>
            {details}
          </p>
        </div>

        {/* Optional Stats */}
        {stats && (
            <div className="flex gap-4 mt-4">
                {stats.map((stat, idx) => (
                    <div key={idx}>
                        <div className={`text-[10px] uppercase tracking-wider ${selected ? "text-black/50" : "text-white/40"}`}>
                            {stat.label}
                        </div>
                        <div className={`text-sm font-semibold ${selected ? "text-black" : "text-white"}`}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        <div className={`mt-auto text-xs font-medium underline underline-offset-2 ${selected ? "text-black" : "text-white/60 group-hover:text-white"}`}>
            View All Details
        </div>
      </div>

      {/* Image Side */}
      <div className="w-[140px] h-full relative">
        <div className={`absolute inset-0 z-10 bg-gradient-to-r ${
            selected ? "from-[#E8D1AB]" : "from-[#101010]"
        } to-transparent`} />
        <Image 
            src={image} 
            alt={title} 
            fill 
            className="object-cover"
        />
        
        {/* Selection Indicator */}
        <div className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            selected ? "bg-black text-[#E8D1AB]" : "bg-black/50 border border-white/20 text-transparent"
        }`}>
            <Check size={14} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};
