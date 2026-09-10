"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, PencilLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface StudioRecommendationProps {
  onContinue: (data: { studioType: string; crewCount: string }) => void;
  onChangeStudioType?: () => void;
  onBack?: () => void;
  occasionTitle?: string;
  recommendedStudioType?: string;
  recommendedStudioDescription?: string;
  studioImage?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export const StudioRecommendation: React.FC<StudioRecommendationProps> = ({
  onContinue,
  onChangeStudioType,
  onBack,
  occasionTitle = "Corporate Event",
  recommendedStudioType = "Corporate Event",
  recommendedStudioDescription = "Conferences, summits, company offsites",
  studioImage = "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
  title = "We’ve Picked a Studio Type for Your Shoot",
  subtitle = `Based on your ${occasionTitle}, we found a studio that fits your shoot.`,
  stepNumber = "03",
  completionPercentage = 40,
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
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="mb-5 lg:mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP {stepNumber}
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0)">
            <div className="h-full bg-[#E8D1AB] transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-5 lg:mb-8">
          <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-white/30 text-sm md:text-xl font-light">
            {subtitle}
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="w-full rounded-lg lg:rounded-2xl border border-white/20 bg-[linear-gradient(180deg, #191919 0%, rgba(16, 16, 16, 0.00) 100%)] p-5 mb-10 flex flex-col md:flex-row gap-6 items-center">
          {/* Studio Preview Image */}
          <div className="relative w-full md:w-[320px] lg:w-[380px] h-[230px] lg:h-[300px] rounded-xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src={studioImage}
              alt={recommendedStudioType}
              fill
              className="object-cover"
            />
          </div>

          {/* Details Column */}
          <div className="w-full flex flex-col justify-between self-stretch lg:py-3">
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
              <div className="w-full rounded-md lg:rounded-2xl bg-[#211F1C] p-2.5 lg:px-6">
                <p className="text-[10px] lg:text-sm text-[#E8D1AB] font-medium leading-relaxed">
                  Note : Based on your {occasionTitle}, we recommend an Event Studio. Prefer something else? Choose a different studio type based on your requirements.
                </p>
              </div>
            </div>

            <hr className={`border-t my-5 lg:my-7 border-white/20`} />

            {/* Change Studio Type Action */}
            <div>
              <button
                type="button"
                onClick={onChangeStudioType}
                className="w-full lg:w-fit inline-flex items-center justify-center gap-2 px-5 py-2.5 lg:px-10 lg:py-4 rounded-full bg-[#E8D1AB] text-black text-base lg:text-xl hover:bg-[#dfc498] transition-colors cursor-pointer"
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
          <h2 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-medium lg:font-bold text-white">
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
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 w-full lg:w-auto lg:min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="px-10 py-3.5 w-full lg:w-auto rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StudioRecommendation;