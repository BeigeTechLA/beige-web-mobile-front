"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface StudioCategoryOption {
  key: string;
  title: string;
  description: string;
  image: string;
}

export interface BrowseStudioTypesProps {
  onContinue: (selectedCategoryKey: string) => void;
  onBack?: () => void;
  occasionTitle?: string;
  initialSelectedKey?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  showCrewInput?: boolean;
}

const DEFAULT_STUDIO_CATEGORIES: StudioCategoryOption[] = [
  {
    key: "production",
    title: "Production",
    description: "For shoots, campaigns, interviews, and content creation",
    image:
      "/images/misc/BookingFlow/Production.png",
  },
  {
    key: "audio_recording",
    title: "Audio & Recording",
    description: "For podcasts, music, voiceovers, and other audio projects.",
    image:
      "/images/misc/BookingFlow/AudioRec.png",
  },
  {
    key: "events",
    title: "Events",
    description: "For workshops, launches, meetings, and private events",
    image:
      "/images/misc/BookingFlow/Events.png",
  },
];

export const BrowseStudioTypes: React.FC<BrowseStudioTypesProps> = ({
  onContinue,
  onBack,
  occasionTitle = "Corporate Shoots",
  initialSelectedKey = "production",
  title = "",
  subtitle = "",
  stepNumber = "",
  showCrewInput = false,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(initialSelectedKey);
  const [crewCount, setCrewCount] = useState<string>("");

  const handleContinue = () => {
    onContinue(selectedKey);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between select-none">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP {stepNumber ? stepNumber : "03"}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-3/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            {title ? title : `Browse Studios for your ${occasionTitle}`}
          </h1>
          <p className="text-white/30 text-base lg:text-xl">
            {subtitle ? subtitle : "Explore studios that match your selected shoot type."}
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {DEFAULT_STUDIO_CATEGORIES.map((category) => {
            const isSelected = selectedKey === category.key;

            return (
              <div
                key={category.key}
                onClick={() => setSelectedKey(category.key)}
                className={`group relative rounded-2xl p-4 lg:p-7 bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[190px] ${isSelected
                  ? "border-white/30"
                  : "border-white/20 hover:border-white/30"
                  }`}
              >
                {/* 3D Decorative Asset Graphic */}
                <div className="absolute right-0 bottom-10 w-28 md:w-32 lg:w-36 h-28 md:h-32 lg:h-36 pointer-events-none opacity-90 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-contain object-right-bottom"
                  />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-[70%] space-y-2">
                  <h3 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-[#E8D1AB]">
                    {category.title}
                  </h3>
                  <p className="text-sm lg:text-base text-white/70 font-light leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Selection Checkbox indicator */}
                <div className="relative z-10 mt-6">
                  <div
                    className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center ${isSelected
                      ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                      : "border-white/30 bg-[#101010] group-hover:border-white/60"
                      }`}
                  >
                    {isSelected && <Check className="w-4.5 h-4.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Information Banner */}
        <div className="flex gap-2 w-full rounded-2xl bg-[#211F1C] p-4 lg:px-6 items-center">
          <Info className="w-5 h-5 text-[#E8D1AB] shrink-0" />
          <p className="text-sm lg:text-base text-[#E8D1AB]">
            Note: Studios are shown based on your selected category. Pricing, availability, and rules may vary.
          </p>
        </div>

        {
          showCrewInput &&
          <>
            <hr className="border-t border-white/20 my-5 lg:my-10" />

            {/* Crew Size Input Section */}
            <div className="space-y-4 lg:space-y-8">
              <h2 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
                How big will your crew be?
              </h2>

              {/* Styled Floating-label Input */}
              <div className="relative space-y-2">
                <Label
                  htmlFor="crewSize"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Enter no Cast & Crew for your studio
                </Label>
                <div className="relative">
                  <Input
                    id="crewSize"
                    type={"text"}
                    value={crewCount}
                    onChange={(e) => setCrewCount(e.target.value)}
                    className="h-14 lg:h-[82px] w-full rounded-xl border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
            </div>
          </>
        }
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BrowseStudioTypes;