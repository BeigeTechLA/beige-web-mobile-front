"use client";

import React from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export type SuccessProps = {
  onBackToShoots: () => void;
  count?: number;
  mode?: "individual" | "common";
};

export default function ShootAgreementSuccessModal({
  onBackToShoots,
  count = 2,
  mode = "individual",
}: SuccessProps) {
  const { isDark } = useResolvedTheme();

  const isIndividual = mode === "individual";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="shoot-agreement-success-title" className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div
        className={`relative w-full max-w-[500px] overflow-hidden rounded-2xl border transition-colors duration-200 p-6 lg:p-8 flex flex-col items-center text-center gap-6 ${isDark
          ? "border-[#1F1F1F] bg-[#0A0A0A] text-white shadow-2xl"
          : "border-[#E5E7EB] bg-white text-black shadow-2xl"
          }`}
      >
        {/* Animated Check / Success Icon */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Shoot Agreement Sent Successfully"
            width={144}
            height={144}
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        {/* Text Content */}
        <div className="flex flex-col items-center text-center gap-3 max-w-[420px]">
          <h2 id="shoot-agreement-success-title" className="text-xl lg:text-2xl font-medium">
            Shoot Agreement Sent Successfully
          </h2>
          <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
            {isIndividual
              ? `Individual shoot agreements have been sent to ${count} creative partners. Each CP must accept their agreement before their assignment is confirmed.`
              : `The common shoot agreement has been sent to all selected CPs. Each CP must accept the agreement individually before their assignment is confirmed.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full pt-2">
          <Button
            type="button"
            onClick={onBackToShoots}
            className="h-12 w-full rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] font-medium text-sm transition-colors"
          >
            Back to Shoots
          </Button>
        </div>
      </div>
    </div>
  );
}
