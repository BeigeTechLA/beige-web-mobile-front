"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

export type SuccessProps = {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
  title: string;
  subtext: string;
  buttonText?: string;
};

export default function SuccessModal({
  isSubmitting = false,
  isOpen,
  onSubmit,
  title,
  subtext,
  buttonText = "",
}: SuccessProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onSubmit]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (buttonText.trim() !== "") return;

    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      onSubmit();
    }
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/[0.82] p-3 backdrop-blur-md lg:p-5"
    >
      <div
        ref={containerRef}
        onClick={(event) => event.stopPropagation()}
        className={`relative flex max-h-[84vh] w-full flex-col items-center gap-3 overflow-y-auto rounded-[16px] border p-5 transition-colors duration-200 lg:max-w-lg lg:gap-6 lg:p-8 ${
          isDark
            ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
            : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}
      >
        <div className="relative h-[170px] w-[280px] sm:h-[190px] sm:w-[320px] lg:h-[220px] lg:w-[360px]">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Agreement sent successfully"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center lg:gap-3">
          <h2
            className={`text-lg font-bold leading-tight lg:text-3xl ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            {title}
          </h2>

          <p
            className={`max-w-md text-xs leading-5 lg:text-sm lg:leading-6 ${
              isDark ? "text-white/60" : "text-black/60"
            }`}
          >
            {subtext}
          </p>
        </div>

        {buttonText.trim() !== "" && (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="h-10 w-full rounded-lg bg-[#EED4A7] px-5 text-sm font-semibold text-black transition-colors hover:bg-[#DCC395] disabled:cursor-not-allowed disabled:opacity-50 lg:h-12 lg:text-base"
          >
            {isSubmitting ? "Please wait..." : buttonText}
          </Button>
        )}
      </div>
    </div>,
    document.body,
  );
}
