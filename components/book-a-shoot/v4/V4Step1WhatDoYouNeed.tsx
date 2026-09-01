"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDataV4, V4ServiceType } from "./types";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ServiceOption {
  id: V4ServiceType;
  title: string;
  subtitle: string;
  imageSrc: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "photography",
    title: "Photography",
    subtitle: "Headshots, events, portraits, products",
    imageSrc: "/images/v4/2c612b1789553882085f7a37de61e9ba94242509.png",
  },
  {
    id: "videography",
    title: "Videography",
    subtitle: "Events, commercials, brand videos",
    imageSrc: "/images/v4/af9ad420cca16f6f1dad054d88b7af07839fad1a.png",
  },
  {
    id: "editing",
    title: "Editing",
    subtitle: "Post-production on footage you already have",
    imageSrc: "/images/v4/101a45ef422295c9b7ca948c793c8ecf1d97a60a.png",
  },
  {
    id: "studio",
    title: "Studios",
    subtitle: "Studios made for photos, videos, & events",
    imageSrc: "/images/v4/be13a0f8a7fb80e20a952664790681a1b25245aa.png",
  },
  {
    id: "livestream",
    title: "Livestream",
    subtitle: "Live broadcasts, webinars, hybrid events",
    imageSrc: "/images/v4/2f6317c343585ac9f26708d7f19a2c34e8106a6c.png",
  },
];

export const V4Step1WhatDoYouNeed: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const selectedServices = data.services || ["photography"];

  const toggleService = (id: V4ServiceType) => {
    let nextServices: V4ServiceType[];
    if (selectedServices.includes(id)) {
      if (selectedServices.length === 1) return;
      nextServices = selectedServices.filter((s) => s !== id);
    } else {
      nextServices = [...selectedServices, id];
    }

    const nextContentType: ("studio" | "videographer" | "photographer" | "cinematographer" | "editing" | "livestream")[] = [];
    if (nextServices.includes("photography")) nextContentType.push("photographer");
    if (nextServices.includes("videography")) nextContentType.push("videographer");
    if (nextServices.includes("editing")) nextContentType.push("editing");
    if (nextServices.includes("studio")) nextContentType.push("studio");
    if (nextServices.includes("livestream")) nextContentType.push("livestream");

    updateData({
      services: nextServices,
      contentType: nextContentType,
    });
  };


  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-6xl mx-auto px-4">
      {/* Top Bar: Back Button, Step Indicator & Progress */}
      <div className="w-full flex flex-col space-y-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A0A0A0] uppercase">
            STEP 01
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[20%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-2 mb-8 md:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
          What do you need?
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          Pick everything that applies — we can combine them into one production.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-10">
        {SERVICE_OPTIONS.map((item) => {
          const isSelected = selectedServices.includes(item.id);

          return (
            <motion.div
              key={item.id}
              onClick={() => toggleService(item.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                background: isSelected
                  ? "#EAD9C0"
                  : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
                backdropFilter: "blur(20px)",
              }}
              className={`group relative cursor-pointer rounded-[24px] p-5 sm:p-7 flex items-center justify-between transition-all duration-300 border min-h-[140px] sm:min-h-[160px] select-none ${isSelected
                ? "border-[#EAD9C0] shadow-xl shadow-black/30 text-[#121212]"
                : "border-white/10 hover:border-white/20 text-white"
                }`}
            >
              {/* Left text & checkbox */}
              <div className="flex flex-col justify-between h-full pr-3 space-y-6">
                <div>
                  <h3
                    className={`text-xl sm:text-2xl font-serif font-bold tracking-tight mb-1.5 transition-colors ${isSelected ? "text-[#121212]" : "text-white"
                      }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed max-w-[220px] sm:max-w-[260px] ${isSelected ? "text-[#383838]" : "text-[#8E8E8E]"
                      }`}
                  >
                    {item.subtitle}
                  </p>
                </div>

                {/* Custom Checkbox */}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected
                    ? "bg-[#121212] border border-black text-[#EAD9C0]"
                    : "border border-white/20 bg-transparent group-hover:border-white/40"
                    }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Right 3D Visual PNG Asset */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center pointer-events-none">
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  fill
                  sizes="160px"
                  className="object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full flex justify-start pt-2">
        <button
          onClick={onNext}
          disabled={selectedServices.length === 0}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
