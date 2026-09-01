"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Edit2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDataV4 } from "./types";
import { OCCASIONS } from "./V4Step1Occasion";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
  onChangeStudioType: () => void;
}

export const V4Step4StudioRecommendation: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
  onChangeStudioType,
}) => {
  const selectedOccasion =
    OCCASIONS.find((o) => o.key === data.shootType) || OCCASIONS[0];
  
  const [crewSizeText, setCrewSizeText] = useState(
    data.crewCount ? String(data.crewCount) : ""
  );

  const handleContinue = () => {
    const parsedCrew = parseInt(crewSizeText, 10);
    if (!isNaN(parsedCrew)) {
      updateData({ crewCount: parsedCrew });
    }
    onNext();
  };

  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-5xl mx-auto px-4">
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
          We&apos;ve Picked a Studio Type for Your Shoot
        </h1>
        <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
          Based on your {selectedOccasion.title}, we found a studio that fits your shoot.
        </p>
      </div>

      {/* Main Highlighted Recommended Studio Card */}
      <div
        style={{
          background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
          backdropFilter: "blur(20px)",
        }}
        className="w-full border border-white/10 rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row gap-6 md:gap-8 items-center mb-8 shadow-xl"
      >
        {/* Left Occasion / Studio Photo */}
        <div className="relative w-full md:w-[320px] h-[220px] sm:h-[260px] rounded-2xl overflow-hidden shrink-0 bg-[#1c1c1c]">
          <Image
            src={selectedOccasion.image}
            alt={selectedOccasion.title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Info Section */}
        <div className="flex-1 flex flex-col justify-between space-y-5 w-full">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight">
                {selectedOccasion.title}
              </h3>
              <div className="w-6 h-6 rounded-full bg-[#E5D5B8] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
              </div>
            </div>
            <p className="text-sm text-[#8E8E8E]">
              {selectedOccasion.details}
            </p>
          </div>

          {/* Note Box */}
          <div className="bg-[#1c1c1c] border border-white/5 p-4 rounded-xl">
            <p className="text-xs sm:text-sm text-[#B0B0B0] leading-relaxed">
              <span className="font-semibold text-white">Note :</span> Based on your {selectedOccasion.title}, we recommend an Event Studio. Prefer something else? Choose a different studio type based on your requirements.
            </p>
          </div>

          {/* Change Studio Type Button */}
          <div>
            <button
              type="button"
              onClick={onChangeStudioType}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-black font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              <span>Change Studio Type</span>
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* How big will your crew be? Section */}
      <div className="w-full space-y-3 mb-10">
        <h3 className="text-lg sm:text-xl font-serif text-white font-medium">
          How big will your crew be?
        </h3>
        <div
          style={{
            background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
            backdropFilter: "blur(20px)",
          }}
          className="relative w-full border border-white/15 focus-within:border-[#E5D5B8] rounded-2xl px-5 py-4 transition-colors"
        >
          <input
            type="text"
            value={crewSizeText}
            onChange={(e) => setCrewSizeText(e.target.value)}
            placeholder="Enter no Cast & Crew for your studio"
            className="w-full bg-transparent text-white text-sm sm:text-base outline-none placeholder-white/30"
          />
        </div>
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
          onClick={handleContinue}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
