"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";
import { Info, X } from "lucide-react";

export type SuccessProps = {
  isOpen: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export default function DeletionRequestSubmittedModal({
  isSubmitting = false,
  isOpen,
  onSubmit,
}: SuccessProps) {
  const { isDark } = useResolvedTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) {
    return null;
  }

  // Handle backdrop clicks only when no action button is provided
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      onSubmit();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div
        ref={containerRef}
        className={`relative max-h-[84vh] lg:max-h-[426px] w-full max-w-lg overflow-y-auto rounded-2xl border transition-colors duration-200 p-4 lg:p-7 flex flex-col items-center ${isDark
          ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
          : "border-[#D7D7D7] bg-white text-black shadow-2xl"
          }`}>

        <button
          type="button"
          onClick={onSubmit}
          className={`absolute right-7 top-7 rounded-full p-1.5 lg:p-3 transition-colors shrink-0 ${isDark ? "bg-[#2B2626] text-white hover:text-white/70" : "bg-black/5 text-black/60 hover:text-black"}`}
        >
          <X size={22} />
        </button>
        <div className="relative w-[280px] h-[200px]">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Payment Done"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="flex flex-col items-center text-center gap-2 lg:gap-3 mb-3 lg:mb-5">
          <h2 className={`text-lg lg:text-3xl font-semibold ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
            Deletion Request Submitted
          </h2>
          <p className={`text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
            Your request has been sent to the admin for approval.You’ll be notified once it’s reviewed.
          </p>
        </div>
        <div className={`w-full flex items-center gap-2 lg:gap-3 bg-[#E8D1AB]/10 text-[#E8D1AB] px-3.5 py-3 rounded-xl text-xs mb-3 lg:mb-5`}>
          <Info size={24} />
          <p>Files will remain in the folder until your request is approved.</p>
        </div>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            console.log("Submitted")
            onSubmit()
          }}
          className="h-10 lg:h-12 w-full rounded-lg bg-[#E8D1AB] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7] ltext-base"
        >
          Done
        </Button>
      </div>
    </div >
  );
}