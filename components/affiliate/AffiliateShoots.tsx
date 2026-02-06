"use client";

import React, { useState } from "react";
import { AffiliateShootsTable } from "./AffiliateShootsTable";
import { SlidersHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortDateButton } from "@/components/admin/SortDateButton";

interface AffiliateShootsProps {
  onShootClick: (shootId: string) => void;
}

export const AffiliateShoots: React.FC<AffiliateShootsProps> = ({
  onShootClick,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  return (
    <div
      className="space-y-4 lg:space-y-8"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start lg:items-end">
        <div>
          <h1 className="text-lg lg:text-[32px] font-semibold text-white mb-2 leading-none">
            Shoots Management
          </h1>
          <p className="text-[#888888] text-sm lg:text-base leading-none">
            Track and manage your photography and videography project
          </p>
        </div>
        <SortDateButton
          selectedDate={selectedDate}
          onDateChange={handleDateSort}
        />
      </div>

      {/* Divider */}
      <div
        className="h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px',
          backgroundRepeat: 'repeat-x'
        }}
      />

      {/* Google Forms CTA Banner */}
      <div className="bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border border-[#E8D1AB]/20 rounded-lg lg:rounded-xl p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold lg:text-lg mb-1">
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

      <AffiliateShootsTable onShootClick={onShootClick} externalSelectedDate={selectedDate} />
    </div>
  );
};
