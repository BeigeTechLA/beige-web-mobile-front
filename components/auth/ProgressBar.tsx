"use client";

import React from "react";

interface ProgressBarProps {
  currentStep: number| undefined;
  totalSteps: number| undefined;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep = 0,
  totalSteps = 1,
}) => {
  const progress = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div className="w-full space-y-4">
      <div className="relative h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full bg-[#E8D1AB] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};