"use client";

import React from "react";
import { AffiliateShootsTable } from "./AffiliateShootsTable";
import { SlidersHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateShootsProps {
  onShootClick: (shootId: string) => void;
}

export const AffiliateShoots: React.FC<AffiliateShootsProps> = ({
  onShootClick,
}) => {
  return (
    <div
      className="space-y-8"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[32px] font-semibold text-white mb-2 leading-none">
            Shoots Management
          </h1>
          <p className="text-[#888888] text-sm lg:text-base leading-none">
            Track and manage your photography and videography project
          </p>
        </div>
        <button className="flex items-center gap-3 bg-transparent border border-[#333333] text-[#E0E0E0] px-6 py-3 rounded-full hover:bg-[#222222] transition-colors group">
          <span className="text-base font-medium leading-none">
            Sort by Date
          </span>
          <Calendar
            size={18}
            className="text-[#888888] group-hover:text-white transition-colors"
          />
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-dashed border-t border-dashed border-[#333333] opacity-50" />

      {/* Google Forms CTA Banner */}
      <div className="bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border border-[#E8D1AB]/20 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Complete Your Shoot Details
            </h3>
            <p className="text-white/60 text-sm">
              Help us prepare better by filling out detailed information about
              your upcoming shoot
            </p>
          </div>
          <Button
            onClick={() => {
              const formUrl =
                "https://docs.google.com/forms/d/e/1FAIpQLSeYWPQXfFBqzt4FHVy6ccrS4WVbjFLHJQeIu56rj_zEinGGfQ/viewform";
              window.open(formUrl, "_blank");
            }}
            className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium px-6 py-3 h-auto whitespace-nowrap"
          >
            Fill Out Shoot Details
          </Button>
        </div>
      </div>

      <AffiliateShootsTable onShootClick={onShootClick} />
    </div>
  );
};
