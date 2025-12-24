"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep: number;
}

export const StepProgressTracker = ({ steps, currentStep }: ProgressTrackerProps) => {
  return (
    <div className="w-full py-8 px-4">
      <div className="flex items-start justify-center max-w-5xl mx-auto lg:w-[532px]">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Step Circle & Label Container */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 shrink-0 ${
                    isCompleted
                      ? "bg-[#4CAF50] border-[#4CAF50]"
                      : isActive
                      ? "bg-[#E8D1AB] border-[#E8D1AB]"
                      : "bg-white border-[#A1AEBE]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="text-white font-medium" size={18} />
                  ) : (
                    <span
                      className={`text-xs lg:text-sm font-medium ${
                        isActive ? "text-black" : "text-[#A1AEBE]"
                      }`}
                    >
                      {stepNumber.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div className="h-0 flex justify-center">
                   <span
                    className={`mt-2 text-[10px] lg:text-sm font-medium transition-colors duration-300 text-center lg:whitespace-nowrap ${
                      isCompleted
                        ? "text-[#4CAF50]"
                        : isActive
                        ? "text-[#E8D1AB]"
                        : "text-[#A1AEBE]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex items-center h-8 md:h-9 px-1">
                  <svg
                    width="60"
                    height="2"
                    viewBox="0 0 90 2"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-[30px] lg:w-[90px]"
                  >
                    <rect width="90" height="2" fill="#A1AEBE" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};