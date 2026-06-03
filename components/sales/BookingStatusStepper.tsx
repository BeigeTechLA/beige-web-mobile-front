"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

const steps: Step[] = [
  { id: 1, label: "In Progress" },
  { id: 2, label: "Payment Link Sent" },
  { id: 3, label: "Discount Applied" },
  { id: 4, label: "Paid" },
];

interface Props {
  currentStep: number;
  isDark?: boolean; // Added theme prop
}

export default function BookingStatusStepper({ currentStep, isDark = true }: Props) {
  return (
    <div className="w-full pb-12 lg:pb-9 transition-colors duration-300">
      <h3 className={cn(
        "lg:text-xl font-medium mb-3 lg:mb-6 transition-colors duration-300",
        isDark ? "text-white/50" : "text-black"
      )}>
        Booking Status
      </h3>

      <div className="relative flex justify-between items-center w-full px-4">
        {/* Background Connector Line */}
        <div className={cn(
          "absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2 z-0 transition-colors duration-300",
          isDark ? "bg-[#27272A]" : "bg-[#E5E7EB]"
        )} />

        {/* Status Steps */}
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Circle Indicator */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive
                    ? "bg-[#E5D5B8] border-[#E5D5B8] text-black shadow-[0_0_15px_rgba(229,213,184,0.3)]"
                    : isDark
                      ? "bg-[#1A1A1A] border-[#27272A] text-[#52525B]"
                      : "bg-white border-[#D8D8D8] text-[#9CA3AF]"
                )}
              >
                <span className="text-sm font-semibold">{step.id}</span>
              </div>

              {/* Label */}
              <div className="absolute top-12 px-1 lg:whitespace-nowrap">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors duration-300 text-center",
                    isActive
                      ? (isDark ? "text-[#E5D5B8]" : "text-[#B18A00]")
                      : (isDark ? "text-[#71717A]" : "text-[#6B7280]")
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}