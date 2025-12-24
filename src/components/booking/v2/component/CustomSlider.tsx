"use client";

import React from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;

  label?: string;
  min?: number;
  max?: number;
  step?: number;

  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  bgColour?: string;
  titleTextColour?: string;
  labelTextColour?: string;
  labelSize?: string;

  labels?: string[];
  showLabels?: boolean;
}

export const CustomSlider = ({
  label = "Adjust total studio time required",
  value,
  onChange,

  min = 2,
  max = 24,
  step = 1,

  trackColor = "#1A1A1A",
  fillColor = "#E1CAA1",
  thumbColor = "#E1CAA1",
  bgColour = "white",
  titleTextColour = "[#1A1A1A]",
  labelTextColour = "[#4A4A4A]",
  labelSize = "text-sm",

  labels = ["02h", "04h", "08h", "12h", "16h", "20h", "24h"],
  showLabels = true,
}: SliderProps) => {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full p-4 rounded-[12px] bg-${bgColour}`}>
      {/* Label */}
      {label && (
        <p className={`text-${titleTextColour} font-medium mb-4`}>{label}</p>
      )}

      {/* Slider Container */}
      <div className="relative w-full h-6">

        {/* Full Track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full h-[6px] rounded-full"
          style={{ backgroundColor: trackColor }}
        />

        {/* Filled Track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[6px] rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: fillColor,
          }}
        />

        {/* Input Range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 w-full h-6 appearance-none bg-transparent cursor-pointer z-10"
          style={{
            WebkitAppearance: "none",
          }}
        />

        {/* Thumb Styling */}
        <style>
          {`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 22px;
              width: 22px;
              border-radius: 6px;
              background: ${thumbColor};
              cursor: pointer;
            }

            input[type="range"]::-moz-range-thumb {
              height: 22px;
              width: 22px;
              border-radius: 6px;
              background: ${thumbColor};
              cursor: pointer;
            }
          `}
        </style>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={`mt-4 flex justify-between text-${labelTextColour} ${labelSize}`}>
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};
