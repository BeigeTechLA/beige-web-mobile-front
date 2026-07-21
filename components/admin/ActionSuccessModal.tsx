"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export type ActionSuccessModalProps = {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  title: string;
  subtext: string;
  buttonText: string;
};

export default function ActionSuccessModal({
  isSubmitting = false,
  isOpen,
  onSubmit,
  title,
  subtext,
  buttonText,
}: ActionSuccessModalProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) {
    return null;
  }

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
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5"
    >
      <div
        ref={containerRef}
        className={`relative max-h-[84vh] w-full overflow-y-auto rounded-[16px] border p-5 transition-colors duration-200 flex flex-col items-center gap-3 lg:max-w-lg lg:gap-6 lg:p-8 animate-in fade-in zoom-in duration-200 ${
          isDark
            ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
            : "border-[#E3E3E3] bg-white text-[#101010] shadow-[0_24px_80px_rgba(16,16,16,0.18)]"
        }`}
      >
        <div className="relative h-[220px] w-[360px]">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Payment Done"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center lg:gap-3">
          <h2 className={`pr-4 text-lg font-bold lg:text-3xl ${isDark ? "text-white" : "text-[#101010]"}`}>
            {title}
          </h2>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/80" : "text-[#32323299]"}`}>
            {subtext}
          </p>
        </div>

        {buttonText !== "" && (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className={`h-10 w-full rounded-lg px-5 text-sm font-semibold lg:h-12 lg:text-base ${
              isDark
                ? "bg-[#EED4A7] text-black hover:bg-[#EED4A7]/92"
                : "bg-[#E5D5B8] text-[#101010] hover:bg-[#DCC79F]"
            }`}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
