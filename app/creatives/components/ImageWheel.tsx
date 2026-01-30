"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

interface ImageWheelProps {
  images: string[];
}

export default function ImageWheel({ images }: ImageWheelProps) {
  const total = images.length;
  // This defines the constant spread between each page
  const angleStep = 360 / total;

  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, {
    stiffness: 80,
    damping: 20,
  });

  const startX = useRef<number | null>(null);
  const lastRotation = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    lastRotation.current = rotation.get();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    rotation.set(lastRotation.current + delta * 0.5);
  };

  const handlePointerUp = () => {
    startX.current = null;
    const current = rotation.get();
    const snapped = Math.round(current / angleStep) * angleStep;
    rotation.set(snapped);
  };

  return (
    <div
      className="relative w-full h-[400px] lg:h-[600px] flex items-center justify-center touch-none select-none overflow-visible"
      style={{ perspective: "2000px" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-y-1/2 w-[180px] h-[320px] lg:w-[550px] lg:h-[420px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {images.map((src, i) => {
          // This ensures that on load, the array is fanned out in a "V" centered around the spine.
          const baseAngle = (i - (total - 1) / 2) * angleStep;

          return (
            <motion.div
              key={i}
              className="absolute inset-0"
              style={{
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                rotateY: useTransform(smoothRotation, (v) => v + baseAngle),
                backfaceVisibility: "visible",
                zIndex: useTransform(smoothRotation, (v) =>
                  Math.round(100 - Math.abs(((v + baseAngle + 180) % 360) - 180))
                ),
              }}
            >
              <div className="relative w-full h-full shadow-2xl rounded-2xl overflow-hidden border-l border-white/20">
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}