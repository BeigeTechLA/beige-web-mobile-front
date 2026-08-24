"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, PencilLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface StudioRecommendationProps {
  onContinue: (data: { studioType: string; crewCount: string }) => void;
  onChangeStudioType?: () => void;
  onBack?: () => void;
  occasionTitle?: string;
  recommendedStudioType?: string;
  recommendedStudioDescription?: string;
  studioImage?: string;
}

export const StudioRecommendation: React.FC<StudioRecommendationProps> = ({
  onContinue,
  onChangeStudioType,
  onBack,
  occasionTitle = "Corporate Event",
  recommendedStudioType = "Corporate Event",
  recommendedStudioDescription = "Conferences, summits, company offsites",
  studioImage = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
}) => {
  const [crewCount, setCrewCount] = useState<string>("");

  const handleContinue = () => {
    onContinue({
      studioType: recommendedStudioType,
      crewCount,
    });
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
            STEP 03
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0)">
            <div className="h-full w-2/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            We’ve Picked a Studio Type for Your Shoot
          </h1>
          <p className="text-white/30 text-base lg:text-xl">
            Based on your {occasionTitle}, we found a studio that fits your shoot.
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="w-full rounded-2xl border border-white/20 bg-[linear-gradient(180deg, #191919 0%, rgba(16, 16, 16, 0.00) 100%)] p-3 lg:p-5 mb-10 flex flex-col md:flex-row gap-6 items-center">
          {/* Studio Preview Image */}
          <div className="relative w-full md:w-[320px] lg:w-[380px] h-[260px] lg:h-[300px] rounded-xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src={studioImage}
              alt={recommendedStudioType}
              fill
              className="object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="w-full flex flex-col justify-between self-stretch py-3">
            <div>
              {/* Studio Title */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-bold text-white">
                  {recommendedStudioType}
                </h3>
                <CheckCircle2 className="shrink-0 w-7 h-7 text-[#E8D1AB] fill-[#E8D1AB] stroke-black" />
              </div>

              {/* Subtitle / Description */}
              <p className="text-white/70 text-sm lg:text-base font-light mb-4">
                {recommendedStudioDescription}
              </p>

              {/* Recommendation Note Box */}
              <div className="w-full rounded-2xl bg-[#211F1C] p-4 lg:px-6">
                <p className="text-xs lg:text-sm text-[#E8D1AB] font-medium leading-relaxed">
                  Note : Based on your {occasionTitle}, we recommend an Event Studio. Prefer something else? Choose a different studio type based on your requirements.
                </p>
              </div>
            </div>

            <hr className={`border-t my-4 lg:my-7 border-white/20`} />

            {/* Change Studio Type Action */}
            <div>
              <button
                type="button"
                onClick={onChangeStudioType}
                className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-10 lg:py-4 rounded-full bg-[#E8D1AB] text-black text-base lg:text-xl hover:bg-[#dfc498] transition-colors cursor-pointer"
              >
                <span>Change Studio Type</span>
                <PencilLine className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        <hr className={`border-t my-4 lg:my-10 border-white/20`} />

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

export default StudioRecommendation;