"use client";

import React, { useRef, useEffect } from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";

export type SuccessProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SuccessModal({
  isOpen,
  onClose,
}: SuccessProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Auto-close after 10 seconds
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

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div
        ref={containerRef}
        className={`relative max-h-[84vh] w-full lg:max-w-xl overflow-y-auto rounded-2xl border transition-colors duration-200 p-5 lg:p-8 flex flex-col items-center gap-3 lg:gap-6 ${isDark
          ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
          : "border-[#D7D7D7] bg-white text-black shadow-2xl"
          }`}>
        <div className="relative w-[360px] h-[240px]">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Payment Done"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="flex flex-col items-center text-center gap-2 lg:gap-3">
          <h2 className={`pr-4 text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>
            General Agreement Sent Successfully
          </h2>
          <p className={`text-sm lg:text-base ${isDark ? "text-[#A0A0A0]" : "text-black"}`}>
            The general agreement has been sent to the CP for review and acceptance.
          </p>
        </div>
      </div>
    </div>
  );
}