"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus, Minus } from "lucide-react";

export interface AddOnItem {
  id: string;
  title: string;
  description: string;
  price: number;
}

const ADD_ONS_DATA: AddOnItem[] = [
  {
    id: "additional_camera",
    title: "Additional Camera",
    description: "A second angle for coverage.",
    price: 350,
  },
  {
    id: "teleprompter",
    title: "Teleprompter",
    description: "On-camera script delivery.",
    price: 250,
  },
  {
    id: "drone",
    title: "Drone",
    description: "Licensed aerial cinematography.",
    price: 500,
  },
  {
    id: "lavalier_mics",
    title: "Additional Lavalier Microphones",
    description: "Capture every voice clearly with additional professional lavalier microphones.",
    price: 250,
  },
  {
    id: "green_screen",
    title: "Green Screen",
    description: "Chroma set for compositing.",
    price: 500,
  },
  {
    id: "backdrop",
    title: "Backdrop",
    description: "Set the scene with a professionally styled backdrop for your shoot.",
    price: 500,
  },
  {
    id: "additional_lights",
    title: "Additional Lights",
    description: "Expanded lighting package.",
    price: 350,
  },
  {
    id: "next_day_editing",
    title: "Next-Day Editing (Per Video)",
    description: "First cut within 24 hours.",
    price: 750,
  },
  {
    id: "expedited_editing",
    title: "Expedited Editing (1 Week)",
    description: "Prioritized 72-hour turnaround.",
    price: 500,
  },
];

interface AddOnsStepProps {
  onBack?: () => void;
  onContinue?: (selectedAddOns: Record<string, number>, subtotal: number) => void;
  initialAddOns?: Record<string, number>;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

export default function AddOnsStep({
  onBack,
  onContinue,
  initialAddOns = { additional_camera: 1 },
  title = "Want to add anything extra?",
  subtitle = "These are some of our most popular add-ons. Add anything that could make your production even better or Skip it.",
  stepNumber = "08",
  completionPercentage = 88,
}: AddOnsStepProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(initialAddOns);

  const handleIncrement = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDecrement = (id: string) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: current - 1,
      };
    });
  };

  const calculateSubtotal = () => {
    return ADD_ONS_DATA.reduce((total, item) => {
      const qty = quantities[item.id] || 0;
      return total + item.price * qty;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const handleContinueClick = () => {
    if (onContinue) {
      onContinue(quantities, subtotal);
    }
  };

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

      {/* Progress Step Header */}
      <div className="mb-5 lg:mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div className="h-full bg-[#E8D1AB] transition-all duration-300"
            style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-sm md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Section Subhead */}
      <h2 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-medium text-white mb-4">
        Optional Add-on
      </h2>

      {/* Add-ons List */}
      <div className="flex flex-col gap-3 mb-6">
        {ADD_ONS_DATA.map((item) => {
          const count = quantities[item.id] || 0;
          const isSelected = count > 0;

          return (
            <div
              key={item.id}
              className={`w-full rounded-lg lg:rounded-2xl border bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) p-4 lg:p-7 flex flex-col gap-7 transition-all duration-200 hover:border-white/20 ${isSelected ? "border-[#E8D1AB]" : "border-white/20"}`}
            >
              <div className="flex items-center justify-between ">
                {/* Info Column */}
                <div className="flex flex-col gap-1 pr-4 max-w-[65%]">
                  <h3 className="text-base lg:text-[26px] font-['Roboto_Condensed'] font-semibold lg:font-bold text-[#E8D1AB]">
                    {item.title}
                  </h3>
                  <p className="text-xs lg:text-base text-white/70 font-light leading-snug">
                    {item.description}
                  </p>
                </div>

                {/* Pricing & Control Column */}
                <div className="flex items-center gap-4 md:gap-6 shrink-0">
                  <span className="hidden lg:block text-[26px] font-medium text-white">
                    ${item.price}
                  </span>

                  {isSelected ? (
                    <div className="flex items-center bg-[#E8D1AB] text-black px-2 py-1 lg:py-2.5 lg:px-4 rounded-full gap-1.5 lg:gap-3 font-medium text-sm lg:text-xl ">
                      <button
                        type="button"
                        onClick={() => handleDecrement(item.id)}
                        className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                      >
                        <Minus className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
                      </button>
                      <span className="w-5 text-center">
                        {String(count).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrement(item.id)}
                        className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
                      >
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.id)}
                      className="px-6 py-1.5 lg:py-2.5 lg:px-9 rounded-full border border-[#E8D1AB]/50 text-white hover:bg-white/10 text-sm lg:text-xl font-medium transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
              <span className="text-lg lg:hidden font-medium text-white">
                ${item.price}
              </span>
            </div>
          );
        })}
      </div>

      {/* Subtotal Footer Card */}
      <div className="w-full rounded-lg lg:rounded-2xl bg-[#211F1C] p-4 lg:p-5 flex items-center justify-between lg:mb-12">
        <span className="text-base lg:text-2xl font-['Roboto_Condensed'] text-white">
          Add-ons subtotal
        </span>
        <span className="text-xl lg:text-3xl font-medium text-[#E8D1AB]">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      {/* Bottom Action Footer Bar */}
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
          onClick={handleContinueClick}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};