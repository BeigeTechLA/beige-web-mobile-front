"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"
import { Button } from "../landing/ui/button";

import {
  BTS_IMAGES,
  PRIVATE_IMAGES,
  CORPORATE_IMAGES,
  WEDDING_IMAGES,
  FOOD_IMAGES,
  BRAND_IMAGES,
  PEOPLE_IMAGES,
  SOCIAL_IMAGES
} from "@/app/data/useCaseData";

interface PortfolioHeroProps {
  type: string;
  category: string;
}
interface TrailImage {
  id: number;
  x: number;
  y: number;
  index: number;
}

const CATEGORY_MAP: Record<string, { name: string, src: string }[]> = {
  "behind-the-scenes": BTS_IMAGES,
  "private-events": PRIVATE_IMAGES,
  "corporate": CORPORATE_IMAGES,
  "weddings": WEDDING_IMAGES,
  "food": FOOD_IMAGES,
  "products": BRAND_IMAGES,
  "people-teams": PEOPLE_IMAGES,
  "social-content": SOCIAL_IMAGES,
};

export const PortfolioHero = ({ type, category }: PortfolioHeroProps) => {
  const router = useRouter();
  const [trail, setTrail] = useState<TrailImage[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageCounter = useRef(0);

  const label = decodeURIComponent(category).split("-").join(" ");
  const activeCategoryKey = category.toLowerCase();

  // 1. Memoize images to display to prevent recalculation
  const imagesToDisplay = useMemo(() => {
    return CATEGORY_MAP[activeCategoryKey] || BTS_IMAGES;
  }, [activeCategoryKey]);

  // 2. Pre-cache Images: Create Image objects in memory when category changes
  useEffect(() => {
    imagesToDisplay.forEach((imgObj) => {
      const img = new Image();
      img.src = imgObj.src;
    });
  }, [imagesToDisplay]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;

    // Get bounds to ensure (x, y) are relative to the SECTION, not the screen
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distance = Math.hypot(x - lastMousePos.current.x, y - lastMousePos.current.y);

    // DISTANCE: Threshold to drop a new image
    if (distance > 250) {
      const newImage: TrailImage = {
        id: Date.now() + imageCounter.current++,
        x,
        y,
        index: imageCounter.current % imagesToDisplay.length,
      };

      setTrail((prev) => [...prev, newImage]);
      lastMousePos.current = { x, y };

      // LIFESPAN: Disappears after 0.6s
      setTimeout(() => {
        setTrail((prev) => prev.filter((img) => img.id !== newImage.id));
      }, 600);
    }
  }, [imagesToDisplay.length]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full flex flex-col items-center justify-center overflow-hidden px-10 mx-auto pt-30 md:pt-40 pb-20 xl:pb-[220px] xl:pt-[260px]"
    >
      {/* 3. Pre-render Hidden Images: Forces browser to keep them in GPU memory */}
      <div className="hidden" aria-hidden="true">
        {imagesToDisplay.map((img, i) => (
          <img key={i} src={img.src} alt="preload" />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <AnimatePresence>
          {trail.map((img) => {
            const imageData = imagesToDisplay[img.index];
            if (!imageData) return null;

            return (
              <motion.div
                key={img.id}
                className="absolute w-48 h-60 lg:w-56 lg:h-72 overflow-hidden rounded-md shadow-2xl bg-white/5"
                style={{
                  left: img.x,
                  top: img.y,
                  x: "-50%",
                  y: "-50%",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <img
                  src={imageData.src}
                  alt={imageData.name || "trail"}
                  className="w-full h-full object-cover"
                  loading="eager" // Important: tells browser to prioritize these
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="max-w-3xl relative z-10 flex flex-col items-center pointer-events-auto justify-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl lg:text-[64px] leading-tight font-bold text-gradient-white mb-2 lg:mb-5 capitalize text-center"
        >
          {label} {type === "photo" ? "Photography" : "Videography"} Portfolio
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base leading-tight text-white/70 mb-4 lg:mb-10"
        >
          Beige {type === "photo" ? "photography" : "videography"} brings your vision to life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl"
            onClick={() => router.push('/book-a-shoot')}
          >
            Start Your Shoot
          </Button>
        </motion.div>
      </div>
    </section>
  );
};