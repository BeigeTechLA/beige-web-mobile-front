"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FinanceHoverMarkerProps = {
  cx: number;
  cy: number;
  label: string;
  isDark: boolean;
  radius?: number;
  fontSize?: string;
};

type TooltipPosition = {
  left: number;
  top: number;
  below: boolean;
};

export default function FinanceHoverMarker({
  cx,
  cy,
  label,
  isDark,
  radius = 6,
  fontSize = "12px",
}: FinanceHoverMarkerProps) {
  const markerRef = useRef<SVGCircleElement | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useLayoutEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const updatePosition = () => {
      const bounds = marker.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const estimatedWidth = Math.max(80, label.length * 8 + 28);
      const left = Math.max(
        estimatedWidth / 2 + 10,
        Math.min(window.innerWidth - estimatedWidth / 2 - 10, centerX),
      );
      const below = centerY < 65;

      setPosition({
        left,
        top: below ? centerY + radius + 18 : centerY - radius - 18,
        below,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [cx, cy, label, radius]);

  return (
    <>
      <circle
        ref={markerRef}
        cx={cx}
        cy={cy}
        r={radius}
        fill={isDark ? "#101010" : "#FFFFFF"}
        stroke="#E8D1AB"
        strokeWidth={3}
        pointerEvents="none"
      />
      {position && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed whitespace-nowrap rounded-md bg-white px-3 py-2 font-bold text-[#171717] shadow-xl"
              style={{
                left: position.left,
                top: position.top,
                zIndex: 2147483647,
                fontSize,
                transform: position.below
                  ? "translate(-50%, 0)"
                  : "translate(-50%, -100%)",
              }}
              role="status"
            >
              {label}
              <span
                className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent ${
                  position.below
                    ? "bottom-full border-b-[7px] border-b-white"
                    : "top-full border-t-[7px] border-t-white"
                }`}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
