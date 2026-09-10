"use client";

import React, { useState } from "react";
import { ArrowLeft, Info, Minus, Plus } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  price: number;
}

interface CreativeTeamProps {
  onBack: () => void;
  onContinue: (team: { [key: string]: number }) => void;
  initialCounts?: { [key: string]: number };
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

const DEFAULT_ROLES: TeamMember[] = [
  { id: "photographer", name: "Photographer", price: 250.00 },
  { id: "videographer", name: "Videographer", price: 250.00 },
];

export default function CreativeTeam({
  onBack,
  onContinue,
  initialCounts = { photographer: 0 },
  title = "Your Creative Team",
  subtitle = "We recommend 1–2 Creative Partners based on your project. You can add more if needed.",
  stepNumber = "06",
  completionPercentage = 30
}: CreativeTeamProps) {
  const [counts, setCounts] = useState<{ [key: string]: number }>(initialCounts);

  const handleIncrement = (id: string) => {
    setCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDecrement = (id: string) => {
    setCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  };

  const handleToggleCheckbox = (id: string, checked: boolean) => {
    setCounts((prev) => ({
      ...prev,
      [id]: checked ? Math.max(1, prev[id] || 1) : 0,
    }));
  };

  const totalSelected = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Navigation */}
      <div>
        <button
          onClick={onBack}
          className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-4 lg:mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          Step {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div
            className="h-full w-4/6 bg-[#E8D1AB] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Heading */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Roles List */}
      <div className="space-y-4 mb-6 p-3.5 lg:px-5 lg:py-7 rounded-lg lg:rounded-2xl border transition-all bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) border-white/20">
        {DEFAULT_ROLES.map((role) => {
          const count = counts[role.id] || 0;
          const isSelected = count > 0;

          return (
            <div
              key={role.id}
              className="flex items-center justify-between "
            >
              <div className="flex items-start gap-3">
                {/* Checkbox implementation */}
                <input
                  type="checkbox"
                  id={`checkbox-${role.id}`}
                  checked={isSelected}
                  onChange={(e) => handleToggleCheckbox(role.id, e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border border-white/30 bg-transparent accent-[#E8D1AB] cursor-pointer focus:ring-0 focus:outline-none"
                />
                <label htmlFor={`checkbox-${role.id}`} className="cursor-pointer select-none">
                  <div className="text-sm lg:text-lg font-light text-white">
                    {role.name}
                  </div>
                  <div className="text-xs lg:text-xl font-medium text-[#E8D1AB]">
                    ${role.price.toFixed(2)}
                  </div>
                </label>
              </div>

              {/* Counter Control */}
              <div className="flex items-center gap-1.5 lg:gap-3 bg-[#E8D1AB] text-black px-3.5 py-2  lg:px-4 lg:py-2.5 rounded-full font-medium text-sm">
                <button
                  type="button"
                  onClick={() => handleDecrement(role.id)}
                  className="hover:opacity-70 transition"
                >
                  <Minus className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
                </button>
                <span className="lg:w-5 text-center font-medium text-base lg:text-xl">
                  {String(count).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => handleIncrement(role.id)}
                  className="hover:opacity-70 transition"
                >
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation / Info Box */}
      <div className="inline-flex lg:items-center gap-2.5 lg:gap-3 p-4 lg:p-6 rounded-lg lg:rounded-2xl bg-[#211F1C] text-sm lg:text-base text-[#E8D1AB]">
        <Info className="w-6 h-6 shrink-0" strokeWidth={1.5} />
        <span>
          {totalSelected > 0
            ? `You're all set! ${totalSelected} Creative Partner${totalSelected > 1 ? "s are" : " is a"} great fit for covering your event.`
            : "Select at least one Creative Partner to proceed with covering your event."}
        </span>
      </div>

      <hr className={`border-t border-white/20 my-4 lg:my-10`} />

      <div className="text-base lg:text-[26px] font-medium font-['Roboto_Condensed'] text-white">
        Need to change this later? You can always add or remove partners after booking.
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onContinue(counts)}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
