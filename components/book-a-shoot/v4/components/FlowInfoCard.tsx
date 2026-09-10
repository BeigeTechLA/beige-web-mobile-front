"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Sparkles } from "lucide-react";

interface FlowInfoCardProps {
  onContinue: () => void;
  onBack: () => void;
  service: string;
  imageSrc?: string;
}

export const FlowInfoCard: React.FC<FlowInfoCardProps> = ({
  onContinue,
  onBack,
  imageSrc = "/images/misc/BookingFlow/FlowInfoImg.png",
  service = "Photography"
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Outer Dark Container Card */}
      <div
        className="relative w-full rounded-[50px] p-8 md:p-14 lg:p-20 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-[0.414px] border-white/20 bg-gradient-to-b from-[#161616] to-[#101010]/50"
      >
        {/* Left Column: Form Content */}
        <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-4">
          {/* Top Tagline */}
          <span className="text-xs lg:text-sm tracking-[0.2em] text-[#E8D1AB] uppercase mb-4">
            Studio first, {service} next.
          </span>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white leading-[1.08] mb-6 capitalize">
            {service} <br />
            & Studio selected
          </h2>

          {/* Subtext */}
          <p className="text-base md:text-xl text-white/40 font-normal leading-relaxed mb-10 max-w-md">
            We’ll help you choose your studio now. You can set up your videography service in the next step.
          </p>

          {/* Interactive Form */}

          <div>
            {/* Submit Button */}
            <button
              type="button"
              onClick={onContinue}
              className="w-full py-4 rounded-lg bg-[#E8D1AB] text-[#0A0908] text-sm lg:text-base font-medium hover:bg-[#dfc498] transition-all duration-200 cursor-pointer mb-6"
            >
              Continue with Studio
            </button>
            {/* Submit Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-4 rounded-lg bg-[#101010] text-white border border-[#8E8E8E] text-sm lg:text-base font-medium hover:bg-white/5 transition-all duration-200 cursor-pointer mb-6"
            >
              Back
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#8A857C]">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#8A857C] shrink-0 stroke-[1.5]" />
            <span>You can always add or remove services later in the flow.</span>
          </div>
        </div>

        {/* Right Column: Studio Production Image */}
        <div className="relative lg:col-span-5 h-[360px] md:h-[480px] lg:h-[560px] relative rounded-3xl overflow-hidden border border-white/10 shadow-inner">
          <Image
            src={imageSrc}
            alt="Studio Production Crew"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute bottom-5 left-5 right-5 bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex gap-2 items-center text-white mb-5">
              <Sparkles size={20} strokeWidth={1} />
              <span className="text-xs lg:text-sm font-medium">
                What’s next?
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="334" height="1" viewBox="0 0 334 1" fill="none">
              <path d="M0.25 0.25L333.25 0.250029" stroke="url(#paint0_linear_8708_5500)" strokeWidth="0.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="paint0_linear_8708_5500" x1="0.25" y1="0.75" x2="333.25" y2="0.750029" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-white mt-5 space-y-2">
              <p className="text-xs lg:text-sm">
                {service} Service in the next step
              </p>
              <p className="text-[10px] lg:text-xs font-light">
                After selecting your studio, you’ll be able to add {service} and customize your shoot.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default FlowInfoCard;