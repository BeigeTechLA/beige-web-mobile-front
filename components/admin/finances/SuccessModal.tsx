"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";

export type SuccessProps = {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  title: string;
  subtext: string;
  buttonText: string;
};

export default function SuccessModal({
  isSubmitting = false,
  isOpen,
  onSubmit,
  title,
  subtext,
  buttonText
}: SuccessProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) {
    return null;
  }

  // Handle backdrop clicks only when no action button is provided
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonText || buttonText.trim() === "") {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onSubmit();
      }
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div
        ref={containerRef}
        className={`relative max-h-[84vh] w-full lg:max-w-lg overflow-y-auto rounded-[16px] border transition-colors duration-200 p-5 lg:p-8 flex flex-col items-center gap-3 lg:gap-6 ${isDark
          ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
          : "border-[#D7D7D7] bg-white text-black shadow-2xl"
          }`}>
        <div className="relative w-[360px] h-[220px]">
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
          <h2 className={`pr-4 text-lg lg:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
            {subtext}
          </p>
        </div>

        {
          buttonText !== "" && (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                console.log("Submitted")
                onSubmit()
              }}
              className="h-10 lg:h-12 w-full rounded-lg bg-[#EED4A7] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7]/92 lg:text-base"
            >
              {buttonText}
            </Button>
          )
        }
      </div>
    </div >
  );
}