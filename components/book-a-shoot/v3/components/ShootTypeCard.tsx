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
      className={`relative cursor-pointer group flex overflow-hidden rounded-2xl p-3 lg:p-5 gap-3 lg:gap-5 border transition-all duration-300 h-[160px] lg:h-[260px] ${selected
        ? "border-[#E8D1AB] text-black"
        : "bg-[#101010] border-white/10 hover:border-white/20 text-white"
        }`}
      style={{
        background: selected
          ? "linear-gradient(90deg, #E8D1AB 0%, #FDEFD9 100%), linear-gradient(134deg, #E8D1AB 17.17%, #E6AA46 76.39%)"
          : ""
      }}
    >
      <div className="relative overflow-hidden w-[80px] lg:w-[162px] h-full lg:h-[220px] rounded-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3 lg:gap-6 justify-between z-10 relative py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-lg font-bold mb-2 ${selected ? "text-[#101010]" : "text-[#A9A9A9]"}`}>
              {title}
            </h3>
            <p className={`text-sm ${selected ? "text-[#101010]" : "text-white/60"}`}>
              {details}
            </p>
          </div>
          <>
            {selected ? (
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center bg-black shrink-0">
                <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />
              </div>
            ) : (
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full border border-white/50 shrink-0"/>
            )}
          </>
        </div>

        {/* Optional Stats */}
        {stats && (
          <div className="flex gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col gap-[11px]">
                <div className={`text-xs tracking-wider ${selected ? "text-black/50" : "text-white/40"}`}>
                  {stat.label}
                </div>
                <div className={`text-sm font-semibold ${selected ? "text-black" : "text-white"}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Side */}
      {/* <div className="w-[140px] h-full relative">
        <div className={`absolute inset-0 z-10 bg-gradient-to-r ${
            selected ? "from-[#E8D1AB]" : "from-[#101010]"
        } to-transparent`} />
        <Image 
            src={image} 
            alt={title} 
            fill 
            className="object-cover"
        />

        Selection Indicator
        <div className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all ${selected ? "bg-black text-[#E8D1AB]" : "bg-black/50 border border-white/20 text-transparent"
          }`}>
          <Check size={14} strokeWidth={3} />
        </div>
      </div> */}
    </div>
  );
};
