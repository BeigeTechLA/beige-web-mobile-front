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
}

export const AffiliateShoots: React.FC<AffiliateShootsProps> = ({
  onShootClick,
  onFillDetailsClick,
  pendingCount = 0,
  selectedDate
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
              <p className="text-[#E8D1AB] text-xs lg:text-sm mt-2 font-medium">
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
              className="bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium px-6 py-3 h-auto whitespace-nowrap"
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
