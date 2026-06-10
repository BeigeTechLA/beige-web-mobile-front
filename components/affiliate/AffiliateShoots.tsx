"use client";

import React, { useState } from "react";
import { AffiliateShootsTable } from "./AffiliateShootsTable";
import { SlidersHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import DottedDivider from "../admin/DottedDivider";

interface AffiliateShootsProps {
  onShootClick: (shootId: string) => void;
  onFillDetailsClick?: () => void;
  pendingCount?: number;
  selectedDate?: Date | null;
  isDark?: boolean;
}

export const AffiliateShoots: React.FC<AffiliateShootsProps> = ({
  onShootClick,
  onFillDetailsClick,
  pendingCount = 0,
  selectedDate,
  isDark = true
}) => {
  return (
    <div
      className="space-y-4 lg:space-y-8"
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      {/* Divider */}
      {/* <DottedDivider /> */}

      {/* Google Forms CTA Banner */}
      {pendingCount > 0 && (
        <div className={`border rounded-lg lg:rounded-xl p-4 lg:p-6 transition-all duration-300 bg-gradient-to-r from-[#E8D1AB]/10 to-[#E8D1AB]/5 border-[#E8D1AB]/20`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base lg:text-lg mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
                Complete Your Shoot Details
              </h3>
              <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/60" : "text-zinc-600"}`}>
                Help us prepare better by filling out detailed information about your upcoming shoot
              </p>
              <p className={`text-xs lg:text-sm mt-2 font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#A86500]"}`}>
                Pending projects: {pendingCount}
              </p>
            </div>

            <Button
              onClick={() => {
                if (onFillDetailsClick) {
                  onFillDetailsClick();
                } else {
                  const formUrl =
                    "https://docs.google.com/forms/d/e/1FAIpQLSeYWPQXfFBqzt4FHVy6ccrS4WVbjFLHJQeIu56rj_zEinGGfQ/viewform";
                  window.open(formUrl, "_blank");
                }
              }}
              className={`w-full lg:w-auto h-10 lg:h-auto rounded-md lg:rounded-lg font-medium text-sm lg:text-base px-6 whitespace-nowrap shrink-0 transition-all bg-[#E8D1AB] text-black hover:bg-[#dcb98a]`}
            >
              Fill Out Shoot Details
            </Button>
          </div>
        </div>
      )}

      <AffiliateShootsTable
        onShootClick={onShootClick}
        externalSelectedDate={selectedDate}
      />
    </div>
  );
};
