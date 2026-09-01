"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, Info } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDataV4 } from "./types";
import { OCCASIONS } from "./V4Step1Occasion";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface StudioCategoryOption {
  id: string;
  title: string;
  subtitle: string;
  renderVisual: (selected: boolean) => React.ReactNode;
}

export const STUDIO_CATEGORY_OPTIONS: StudioCategoryOption[] = [
  {
    id: "production",
    title: "Production",
    subtitle: "For shoots, campaigns, interviews, and content creation",
    renderVisual: (selected: boolean) => (
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
        {/* 3D Production Studio Asset (Director Chair & Clapperboard) */}
        <svg
          viewBox="0 0 140 140"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="prodGold" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF2DE" />
              <stop offset="60%" stopColor="#E2CDAC" />
              <stop offset="100%" stopColor="#BF9E70" />
            </radialGradient>
          </defs>
          {/* Clapperboard */}
          <rect x="25" y="30" width="70" height="48" rx="8" fill="url(#prodGold)" />
          <path d="M25 30 L95 30 L95 44 L25 44 Z" fill="#241E17" />
          <line x1="38" y1="30" x2="48" y2="44" stroke="#FFF2DE" strokeWidth="3" />
          <line x1="58" y1="30" x2="68" y2="44" stroke="#FFF2DE" strokeWidth="3" />
          <line x1="78" y1="30" x2="88" y2="44" stroke="#FFF2DE" strokeWidth="3" />
          {/* Director Chair Canvas */}
          <path d="M45 74 L90 74 L84 100 L39 100 Z" fill="url(#prodGold)" />
          {/* Chair Legs */}
          <line x1="42" y1="74" x2="88" y2="126" stroke="#D4BA90" strokeWidth="4" strokeLinecap="round" />
          <line x1="88" y1="74" x2="42" y2="126" stroke="#D4BA90" strokeWidth="4" strokeLinecap="round" />
          {/* Cinema Camera Icon overlay */}
          <rect x="75" y="65" width="40" height="30" rx="6" fill="url(#prodGold)" />
          <polygon points="115,72 130,64 130,86 115,78" fill="#D4BA90" />
        </svg>
      </div>
    ),
  },
  {
    id: "audio_recording",
    title: "Audio & Recording",
    subtitle: "For podcasts, music, voiceovers, and other audio projects.",
    renderVisual: (selected: boolean) => (
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
        {/* 3D Microphone & Sound Wave Asset */}
        <svg
          viewBox="0 0 140 140"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="micGold" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF2DE" />
              <stop offset="60%" stopColor="#E2CDAC" />
              <stop offset="100%" stopColor="#BF9E70" />
            </radialGradient>
          </defs>
          {/* Background Media Card */}
          <rect x="20" y="45" width="65" height="52" rx="12" fill="url(#micGold)" />
          <polygon points="45,60 62,71 45,82" fill="#241E17" />
          {/* Sound Waves */}
          <path d="M35 34 C44 26 58 26 67 34" stroke="url(#micGold)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M28 26 C42 14 68 14 82 26" stroke="url(#micGold)" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Studio Condenser Mic on Right */}
          <rect x="74" y="38" width="28" height="46" rx="14" fill="url(#micGold)" stroke="#FFF2DE" strokeWidth="1.5" />
          {/* Mic Stand */}
          <path d="M68 64 C68 84 108 84 108 64" stroke="#D4BA90" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="88" y1="84" x2="88" y2="114" stroke="#D4BA90" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="88" cy="116" rx="20" ry="6" fill="url(#micGold)" />
        </svg>
      </div>
    ),
  },
  {
    id: "events",
    title: "Events",
    subtitle: "For workshops, launches, meetings, and private events",
    renderVisual: (selected: boolean) => (
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
        {/* 3D Party Horn / Megaphone with Confetti */}
        <svg
          viewBox="0 0 140 140"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="eventGold" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF2DE" />
              <stop offset="60%" stopColor="#E2CDAC" />
              <stop offset="100%" stopColor="#BF9E70" />
            </radialGradient>
          </defs>
          {/* Party Horn / Megaphone Cone */}
          <polygon points="35,70 110,32 110,108" fill="url(#eventGold)" stroke="#FFF4E0" strokeWidth="1" />
          <ellipse cx="110" cy="70" rx="12" ry="38" fill="#E2CDAC" stroke="#FFF4E0" strokeWidth="1.5" />
          <circle cx="35" cy="70" r="7" fill="#241E17" />
          {/* Floating Confetti Ribbons */}
          <path d="M118 42 Q130 35, 126 50 T135 62" stroke="url(#eventGold)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M120 78 Q134 85, 124 95 T132 108" stroke="url(#eventGold)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
  },
];

export const V4Step4BrowseStudioTypes: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const selectedOccasion =
    OCCASIONS.find((o) => o.key === data.shootType) || OCCASIONS[0];

  const [selectedStudioCat, setSelectedStudioCat] = useState<string>("events");

  const handleSelect = (id: string) => {
    setSelectedStudioCat(id);
    updateData({ shootType: "studio" });
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
            STEP 03
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[60%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-2 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
          Browse Studios for your {selectedOccasion.title} Shoots
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          Explore studios that match your selected shoot type.
        </p>
      </div>

      {/* 3 Studio Type Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {STUDIO_CATEGORY_OPTIONS.map((item) => {
          const isSelected = selectedStudioCat === item.id;

          return (
            <motion.div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                background: isSelected
                  ? "#181818"
                  : "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
                backdropFilter: "blur(20px)",
              }}
              className={`group relative cursor-pointer rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 border min-h-[220px] select-none ${
                isSelected
                  ? "border-[#E5D5B8] shadow-lg shadow-[#E5D5B8]/10 ring-1 ring-[#E5D5B8]/40"
                  : "border-white/10 hover:border-white/20 text-white"
              }`}
            >
              {/* Top info and visual */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 pr-2">
                  <h3
                    className={`text-xl font-serif font-medium tracking-tight ${
                      isSelected ? "text-[#E5D5B8]" : "text-white"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                {/* 3D Visual */}
                <div className="shrink-0">
                  {item.renderVisual(isSelected)}
                </div>
              </div>

              {/* Checkbox Bottom Left */}
              <div className="pt-4">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#E5D5B8] text-black"
                      : "border border-white/30 bg-transparent group-hover:border-white/50"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Note Bar */}
      <div className="w-full bg-[#181818]/60 border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-3 text-xs sm:text-sm text-[#A0A0A0] mb-10">
        <Info className="w-5 h-5 text-white/60 shrink-0" />
        <span>
          Note : Studios are shown based on your selected category. Pricing, availability, and rules may vary.
        </span>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="w-full flex justify-between items-center pt-8 border-t border-white/10">
        <button
          onClick={onBack}
          className="py-3.5 px-8 rounded-xl bg-transparent hover:bg-white/5 border border-white/20 text-white/90 hover:text-white font-medium text-base transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
