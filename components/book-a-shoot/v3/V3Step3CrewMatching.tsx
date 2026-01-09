"use client";

import React from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import Image from "next/image";
import { Check, Dot, Info, Sparkles } from "lucide-react";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const V3Step3CrewMatching: React.FC<Props> = ({ data, updateData, onNext, onBack }) => {

  const handleSelectOption = (method: 'ai_matchmaker' | 'manual') => {
    updateData({ matchingMethod: method });
    // In current flow design, both options eventually lead to matching or displaying crew
    // For now we just select it
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2">Crew Size & Matching</h2>
        <p className="text-white/60">Let our AI find the perfect crew for your needs.</p>
      </div>

      <div className="pt-8 lg:pt-15 border-t border-white/10">
        <div className="border rounded-[16px] border-white/10">
          {/* Recommended Crew Size Banner */}
          <div className="bg-[#E8D1AB] rounded-t-[16px] p-6 flex items-center gap-6 mb-5">
            <div className="w-15 h-15 rounded-full bg-black flex items-center justify-center shrink-0">
              <Info size={31} />
            </div>
            <div className="text-black">
              <h3 className="font-bold text-lg lg:text-[28px] mb-1">Recommended Crew Size for Your Project</h3>
              {/* <p className="text-sm opacity-80">Based on your shoot type ({data.shootType}) and location.</p> */}
            </div>
          </div>

          {/* Example Recommendation Card (Static for V3 MVP) */}
          <div className="bg-[#171717] rounded-[12px] overflow-hidden border border-white/10 mx-5 mb-5">
            <div className="p-4 flex gap-4 items-center">
              <div className="w-[100px] h-[70px] lg:w-[209px] lg:h-[151px] bg-gradient-to-br from-[#E8D1AB]/20 to-[#E8D1AB]/5 rounded-lg flex items-center justify-center relative">
                <Image
                  src={"/images/projects/interior.png"}
                  alt={"Sample shoot"}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="w-full">
                <div className="flex justify-between mb-5 ">
                  <h4 className="text-white text-lg font-bold">Corporate Event (Video)</h4>
                  <p className="text-[#E8D1AB] font-medium">02-04 People</p>
                </div>
                <hr className="border-white/10 mb-5 lg:mb-9" />
                <div className="flex flex-col gap-3  mt-1">
                  {/* <span>Videographer x1</span>
									<span>•</span>
									<span>$275.00/hr</span> */}
                  <span className="text-xs text-white/60">Typical Output</span>
                  <span className="text-sm text-white font-medium">1 highlight reel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Method Selection */}
      <div className="pt-8 lg:pt-15 border-t border-white/10">
        <h3 className="text-xl font-medium text-white/90 mb-6">How would you like to proceed?</h3>

        <div className="flex flex-col gap-6">
          {/* AI Matchmaker */}
          <div
            onClick={() => handleSelectOption('ai_matchmaker')}
            className={`cursor-pointer rounded-[20px] border transition-all relative overflow-hidden ${data.matchingMethod === 'ai_matchmaker'
              ? "bg-[#101010] border-[#E8D1AB]"
              : "bg-[#171717] border-transparent hover:border-white/20"
              }`}
          >
            <div className=" p-8">
              {/* {data.matchingMethod === 'ai_matchmaker' && (
								<div className="absolute top-4 right-4 w-6 h-6 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black">
									<Check size={14} strokeWidth={3} />
								</div>
							)} */}

              <div className="flex gap-4 items-center mb-6">
                <div className="w-15 h-15 rounded-full bg-gradient-to-br from-[#E8D1AB] to-[#C8B18B] flex items-center justify-center">
                  {/* <span className="text-2xl text-black">✨</span> */}
                  <Sparkles size={31} className="text-black font-light" />
                </div>
                <h4 className="text-[22px] font-bold text-[#E8D1AB] mb-2">AI Matchmaker</h4>
              </div>
              <hr className="border-white/10 mb-5" />
              <p className="text-white text-base lg:text-lg max-w-xl leading-relaxed">
                Our AI analyzes your project requirements and budget to find the perfect creative partners instantly.
              </p>
            </div>

            <div className="flex gap-2 lg:gap-5 bg-[#171717] p-5">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Check size={15} className="text-[#E8D1AB]" />
                <span>Optimal team composition</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Check size={15} className="text-[#E8D1AB]" />
                <span>Matched based on your budget</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Check size={15} className="text-[#E8D1AB]" />
                <span>Industry best practices</span>
              </div>
            </div>
          </div>

          <div
            className={`cursor-pointer rounded-[20px] border transition-all relative overflow-hidden border-transparent border-white/20`}
          >
            <div className="bg-[#171717] p-7">
              <h4 className="text-lg font-medium text-white mb-2">How AI Matching Works</h4>
              <p className="text-white/60 text-sm leading-relaxed">
                Our intelligent matching system considers multiple factors to build your ideal crew:
              </p>
            </div>
            <div className="flex flex-wrap gap-5 p-7">
              <div className="flex items-center gap-1 text-sm text-white/80">
                <Dot size={30} className="text-[#E8D1AB]" />
                <span>Shoot Type & Complexity: Different shoots require different team sizes</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-white/80">
                <Dot size={30} className="text-[#E8D1AB]" />
                <span>Budget Range: We match crews that fit your budget tier</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-white/80">
                <Dot size={30} className="text-[#E8D1AB]" />
                <span>Deliverables: The number and type of edits you need</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-white/80">
                <Dot size={30} className="text-[#E8D1AB]" />
                <span>Industry Standards: Based on thousands of successful projects</span>
              </div>
            </div>
          </div>

          {/* Browse Manually (Disabled or secondary) */}
          {/* <div
						onClick={() => handleSelectOption('manual')}
						className={`cursor-pointer rounded-[20px] p-8 border-2 transition-all relative overflow-hidden opacity-60 ${data.matchingMethod === 'manual'
							? "bg-[#101010] border-[#E8D1AB]"
							: "bg-[#171717] border-transparent hover:border-white/20"
							}`}
					>
						{data.matchingMethod === 'manual' && (
							<div className="absolute top-4 right-4 w-6 h-6 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black">
								<Check size={14} strokeWidth={3} />
							</div>
						)}

						<div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
							<span className="text-2xl">🔍</span>
						</div>
						<h4 className="text-xl font-bold text-white mb-2">Browse Manually</h4>
						<p className="text-white/60 text-sm leading-relaxed">
							Search through our catalog of creative professionals and hand-pick your team.
						</p>
					</div> */}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex  gap-3 lg:gap-6 items-center pt-8 lg:pt-15 border-t border-white/10">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="h-14 lg:h-[72px] bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium  text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px]"
        >
          Continue
        </Button>
      </div>

    </div>
  );
};
