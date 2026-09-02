"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";

export interface ServiceOption {
  id: string;
  title: string;
  description: string;
  iconSrc?: string;
  disabled?: boolean;
}

const SERVICES: ServiceOption[] = [
  {
    id: "photography",
    title: "Photography",
    description: "Headshots, events, portraits, products",
    iconSrc: "/images/misc/BookingFlow/Camera.png",
  },
  {
    id: "videography",
    title: "Videography",
    description: "Events, commercials, brand videos",
    iconSrc: "/images/misc/BookingFlow/VideoRecorder.png",
  },
  {
    id: "editing",
    title: "Editing",
    description: "Post-production on footage you already have",
    iconSrc: "/images/misc/BookingFlow/Edit.png",
  },
  {
    id: "studios",
    title: "Studios",
    description: "Studios made for photos, videos, & events",
    iconSrc: "/images/misc/BookingFlow/Studio.png",
  },
  {
    id: "livestream",
    title: "Livestream",
    description: "Live broadcasts, webinars, hybrid events",
    iconSrc: "/images/misc/BookingFlow/LiveStream.png",
    disabled: true,
  },
];

interface AskingServicesProps {
  onContinue: (selectedServiceIds: string[]) => void;
  onBack?: () => void;
  initialSelected?: string[];
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export const AskingServices: React.FC<AskingServicesProps> = ({
  onContinue,
  onBack,
  initialSelected = ["photography"],
  title = "What do you need?",
  subtitle = "Pick everything that applies — we can combine them into one production.",
  stepNumber = "01",
  completionPercentage = 20,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedIds.length > 0) {
      onContinue(selectedIds);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Step Indicator Bar */}
        <div className="mb-5 lg:mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP {stepNumber}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Header Titles */}
        <div className="mb-5 lg:mb-8">
          <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-white/30 text-sm md:text-xl font-light">
            {subtitle}
          </p>
        </div>

        {/* Grid of Service Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {SERVICES.map((service) => {
            const isSelected = selectedIds.includes(service.id);

            return (
              <div
                key={service.id}
                onClick={() => !service.disabled && toggleService(service.id)}
                className={`relative rounded-xl lg:rounded-2xl p-4 lg:p-7 transition-all duration-300 flex justify-between items-center border overflow-hidden min-h-[140px]
                  ${service.disabled
                    ? "bg-[#141414]/60 text-white/5 border-white/50 cursor-not-allowed opacity-50"
                    : `cursor-pointer ${isSelected
                      ? "bg-[linear-gradient(180deg,#E8D1AB_0.13%,#FFF_240.2%)] text-[#121212] border-[#E8D1AB] shadow-lg scale-[1.01]"
                      : "bg-[#141414] text-white border-white/10 hover:border-white/20 hover:bg-[#1a1a1a]"
                    }`
                  }`}
              >
                {/* Left Card Details */}
                <div className="flex flex-col justify-between h-full z-10 max-w-[65%]">
                  <div>
                    <h3 className={`text-base lg:text-[26px] font-bold mb-2 lg:mb-4 font-['Roboto_Condensed'] leading-none ${isSelected ? "text-black" : "text-[#E8D1AB]"}`}>
                      {service.title}
                    </h3>
                    <p className={`text-xs lg:text-base font-light leading-none ${isSelected ? "text-black/70" : "text-white/70"}`}>
                      {service.description}
                    </p>
                  </div>

                  {/* Checkbox Indicator */}
                  <div className="mt-7 lg:mt-9">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected
                        ? "bg-black text-white"
                        : "border border-white/30 bg-transparent"
                        }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Right 3D Visual Asset Container */}
                {service.iconSrc && (
                  <div className="absolute right-0 w-28 h-28 md:w-32 md:h-32 shrink-0 pointer-events-none -mr-2">
                    <Image
                      src={service.iconSrc}
                      alt={service.title}
                      fill
                      className="object-contain object-right-center"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer - Matches Exact Outer Bounds */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center lg:justify-between">
        <div />

        <button
          onClick={handleNext}
          disabled={selectedIds.length === 0}
          className="w-full lg:w-auto px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AskingServices;