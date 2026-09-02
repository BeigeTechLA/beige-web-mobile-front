"use client";

import React, { useState } from "react";
import { ArrowLeft, Sparkles, Users, Info, Check } from "lucide-react";
import Image from "next/image";

export interface TeamSelectionData {
  teamOption: "best-match" | "choose-own";
}

interface TeamSelectionStepProps {
  onContinue: (data: TeamSelectionData) => void;
  onBack?: () => void;
  initialOption?: "best-match" | "choose-own";
  packageTitle?: string;
  title?: string;
  subtitle?: string;
  step?: string;
  completionPercentage?: number;
}

const PLACEHOLDER_INCLUSIONS = [
  "Photographer x1",
  "All Raw Images, Lighting & Insurance Provided",
  "Up to 45 Minutes Setup Time",
  "Digital Delivery",
];

export const MatchMakerStep: React.FC<TeamSelectionStepProps> = ({
  onContinue,
  onBack,
  initialOption = "best-match",
  packageTitle = "Corporate - Photography",
  title = "Who shoots your event?",
  subtitle = "Let Beige find the right creative team for you, or choose your own.",
  step = "05",
  completionPercentage = 45,
}) => {
  const [teamOption, setTeamOption] = useState<"best-match" | "choose-own">(
    initialOption
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {step}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div className="h-full bg-[#E8D1AB] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* Header */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Team Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Option 1: Best match for you */}
        <div
          onClick={() => setTeamOption("best-match")}
          className={`relative p-4 lg:p-7 rounded-lg lg:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${teamOption === "best-match"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border-transparent shadow-lg"
            : "bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20 hover:border-white/30 text-white"
            }`}
        >
          <div>
            <div className={`w-8 h-8 lg:w-13 lg:h-13 rounded-full flex items-center justify-center mb-1.5 lg:mb-4 ${teamOption === "best-match" ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#2A2A2A] text-white"}`}>
              <Sparkles className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <h3 className={`text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold mb-1 ${teamOption === "best-match" ? "text-black" : "text-[#E8D1AB]"}`}>
              Best match for you
            </h3>
            <p className={`text-sm lg:text-base font-light ${teamOption === "best-match" ? "text-black/70" : "text-white/40"}`}>
              Our team selects the ideal creative partner based on your event
              type, style, and location.
            </p>
          </div>
        </div>

        {/* Option 2: I'll choose my team */}
        <div
          onClick={() => setTeamOption("choose-own")}
          className={`relative p-4 lg:p-7 rounded-lg lg:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${teamOption === "choose-own"
            ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border-transparent shadow-lg"
            : "bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20 hover:border-white/30 text-white"
            }`}
        >
          <div>
            <div className={`w-8 h-8 lg:w-13 lg:h-13 rounded-full flex items-center justify-center mb-1.5 lg:mb-4 ${teamOption === "choose-own" ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#2A2A2A] text-white"}`}>
              <Users className="w-4 h-4 lg:w-6 lg:h-6" />
            </div>
            <h3 className={`text-base lg:text-[26px] font-['Roboto_Condensed'] font-bold mb-1 ${teamOption === "choose-own" ? "text-black" : "text-[#E8D1AB]"}`} >
              I'll choose my team
            </h3>
            <p className={`text-sm lg:text-base font-light ${teamOption === "choose-own" ? "text-black/70" : "text-white/40"}`}>
              Browse AI-recommended creators and choose the one that's right for
              your project.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Info Callout Box */}
      <div className="p-4 lg:p-6 rounded-lg lg:rounded-2xl bg-[#211F1C] flex lg:items-center gap-3 text-sm md:text-base text-[#E8D1AB]">
        <Info className="w-6 h-6 flex-shrink-0" />
        {teamOption === "best-match" ? (
          <span>
            We'll find the right Creative Partner for your event and make sure
            everything works for you before confirming.
          </span>
        ) : (
          <span>
            Discover our Creative Partners, explore their profiles, and select the
            team.
          </span>
        )}
      </div>

      <hr className={`border-t border-white/20 my-4 lg:my-10`} />

      {/* Dynamic Section: AI Matchmaker Info (Visible only when 'I'll choose my team' is selected) */}
      {teamOption === "choose-own" && (
        <>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 lg:w-15 lg:h-15 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center">
                <Sparkles className="w-5 h-5 lg:w-8 lg:h-8" strokeWidth={1} />
              </div>
              <h3 className="text-base lg:text-[22px] font-bold text-white">
                About <span className="text-[#E8D1AB]">AI Matchmaker</span>
              </h3>
            </div>
            <p className="text-sm lg:text-xl text-white mb-4">
              Our AI will analyse your project and match you with the perfect crew
              size and specialists
            </p>
            <div className="flex flex-wrap gap-4 lg:gap-6 text-sm lg:text-lg text-[#A9A9A9]">
              <div className="flex items-center gap-2">
                <Image
                  src={"/images/misc/BookingFlow/Tick.svg"}
                  alt="Check mark icon"
                  width={18}
                  height={18}
                />
                <span>Optimal team composition</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src={"/images/misc/BookingFlow/Tick.svg"}
                  alt="Check mark icon"
                  width={18}
                  height={18}
                />
                <span>Matched based on your budget</span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src={"/images/misc/BookingFlow/Tick.svg"}
                  alt="Check mark icon"
                  width={18}
                  height={18}
                />
                <span>Industry best practices</span>
              </div>
            </div>
          </div>
          <hr className={`border-t border-white/20 my-4 lg:my-10`} />
        </>
      )}

      {/* Included with Package Section */}
      <div>
        <h2 className="text-lg lg:text-[26px] font-medium font-['Roboto_Condensed'] text-white mb-4">
          Included with Package
        </h2>

        <div className="p-4 lg:p-8 rounded-lg lg:rounded-2xl bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border border-white/20">
          <div className="flex items-center justify-between mb-5 border-b border-[#ECE5D8]/10 pb-5">
            <h3 className="text-sm lg:text-[26px] font-bold font-['Roboto_Condensed'] text-[#E8D1AB]">
              {packageTitle}
            </h3>
            <span className="px-3 py-1 rounded-full border border-[#E8D1AB] text-[10px] lg:text-xs text-[#E8D1AB] font-mono tracking-widest uppercase">
              INCLUDED · FREE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm md:text-base font-light text-white/70">
            {PLACEHOLDER_INCLUSIONS.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full border border-[#E8D1AB]/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#E8D1AB]" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Info Callout Box: studio journey 2 */}
        <div className="p-4 lg:p-6 rounded-lg lg:rounded-2xl bg-[#211F1C] flex lg:items-center gap-3 text-sm md:text-base text-[#E8D1AB] mt-4">
          <Info className="w-6 h-6 flex-shrink-0" />
          <span>
            Your studio booking stays the same. Photography is an optional add-on and can be added to your package.
          </span>
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-8 lg:pt-10 mt-8 lg:mt-12 border-t border-white/10 flex items-center justify-between">
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
          onClick={() => onContinue({ teamOption })}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MatchMakerStep;