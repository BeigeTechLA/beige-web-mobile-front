"use client";

import React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";

export type PaymentMethodSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStripeClick?: () => void;
  onExternalClick?: () => void;
};

export default function PaymentMethodSelectionModal({
  isOpen,
  onClose,
  onStripeClick,
  onExternalClick,
}: PaymentMethodSelectionModalProps) {
  const { isDark } = useResolvedTheme();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[140] flex items-center justify-center p-3 backdrop-blur-md lg:p-5 ${isDark ? "bg-black/82":"bg-white/75"}`}>
      <div className={`relative max-h-[84vh] w-full lg:max-w-2xl overflow-y-auto rounded-[16px] border transition-colors duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>

        {/* Header Block Panel */}
        <div className={`flex items-center justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/40" : "border-[#D7D7D7]"}`}>
          <div className="flex flex-col gap-2 lg:gap-3">
            <h2 className={`pr-4 text-lg lg:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
              Payment Method Selection
            </h2>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
              How would you like to process this payment?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${isDark ? "bg-[#2E2725] text-white hover:bg-[#39312E]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2.1} className="lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 p-4 lg:p-7">
          <div className={`flex flex-col justify-between rounded-lg p-3 lg:-4 border ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "text-black border-[#D7D7D7] bg-[#F4F5F7]"}`}>
            <div>
              <div className="flex gap-2 items-center">
                <div className={`flex items-center justify-center bg-[#DBEAFE] rounded-lg h-10 w-10 lg:h-12 lg:w-12`}>
                  <Image
                    src="/images/misc/Stripe.svg"
                    alt="Stripe icon"
                    width={30}
                    height={30}
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <p className={`text-sm lg:text-base font-semibold`}>
                  Pay via Stripe
                </p>
              </div>
              <p className={`mt-3 lg:mt-4 text-xs lg:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                Send payment directly through Stripe
                and automatically track payment
                status.
              </p>
            </div>

            <Button
              onClick={onStripeClick}
              className="mt-5 lg:mt-9 h-10 lg:h-12 w-full bg-[#155DFC] text-white"
            >
              Continue with Stripe
            </Button>
          </div>

          <div className={`flex flex-col justify-between rounded-lg p-3 lg:-4 border ${isDark ? "bg-[#171717] border-[#3D3D3D] text-white" : "text-black border-[#D7D7D7] bg-[#F4F5F7]"}`}>
            <div>
              <div className="flex gap-2 items-center">
                <div className={`flex items-center justify-center bg-[#F3E8FF] rounded-lg h-10 w-10 lg:h-12 lg:w-12`}>
                  <Image
                    src="/images/misc/PaymentCard.svg"
                    alt="Payment Card icon"
                    width={30}
                    height={30}
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <p className={`text-sm lg:text-base font-semibold`}>
                  Mark as Paid Outside Platform
                </p>
              </div>
              <p className={`mt-3 lg:mt-4 text-xs lg:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                Use this option if payment has already been made outside Beige using bank transfer, Wise, PayPal, cheque, cash, or another external method.
              </p>
            </div>
            <Button
              onClick={onExternalClick}
              className="mt-5 lg:mt-9 h-10 lg:h-12 w-full bg-[#9810FA] text-white"
            >
              Record External Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
