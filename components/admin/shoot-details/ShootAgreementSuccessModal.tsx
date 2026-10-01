"use client";

import React, { useRef, useEffect } from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export type SuccessProps = {
  isOpen: boolean;
  onClose: () => void;
  onBackToShoots?: () => void;
  onViewAgreement?: () => void;
  count?: number;
  mode?: "individual" | "common";
};

export default function ShootAgreementSuccessModal({
  isOpen,
  onClose,
  onBackToShoots,
  onViewAgreement,
  count = 2,
  mode = "individual",
}: SuccessProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommon = mode === "common";

  useEffect(() => {
    if (!isOpen) return;

    // Auto-close safety timer
    const timer = setTimeout(() => {
      onClose();
    }, 100000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  // Handle click outside of the modal container
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const isIndividual = mode === "individual";

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div
        ref={containerRef}
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
          <h2 className="text-xl lg:text-2xl font-medium">
            Shoot Agreement Sent Successfully
          </h2>
          <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-[#A0A0A0]" : "text-gray-600"}`}>
            {isIndividual
              ? `Individual shoot agreements have been sent to ${count} creative partners. Each CP must accept their agreement before their assignment is confirmed.`
              : `The common shoot agreement has been sent to all selected CPs. Each CP must accept the agreement individually before their assignment is confirmed.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBackToShoots || onClose}
            className="h-12 rounded-lg bg-transparent border-[#2A2A2A] text-white hover:bg-white/5 hover:text-white font-medium text-sm transition-colors"
          >
            Back to Shoots
          </Button>

          <Button
            type="button"
            onClick={onViewAgreement || onClose}
            className="h-12 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] font-medium text-sm transition-colors"
          >
            View Agreement
          </Button>
        </div>
      </div>
    </div>
  );
}