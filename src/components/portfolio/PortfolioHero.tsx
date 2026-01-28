"use client";
import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"

import { Button } from "../landing/ui/button";

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

const PROJECT_IMAGES = [
  "/images/influencer/CaseyVeggies.png",
  "/images/influencer/chiefKeef.png",
  "/images/influencer/cedrictheentertainer.png",
  "/images/influencer/seanKelly.png",
  "/images/influencer/kingkarlx@2x.png",
  "/images/influencer/natashaGraziano.png",
  "/images/AuthImage.png",
  "/images/influencer/pressaarmani.png",
  "/images/influencer/Sharukh.png",
  "/images/creator.jpg"
];

export const PortfolioHero = ({ type, category }: PortfolioHeroProps) => {
  const router = useRouter();

  const [trail, setTrail] = useState<TrailImage[]>([]);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageCounter = useRef(0);

  const label = decodeURIComponent(category).split("-").join(" ");

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;

    // Get bounds to ensure (x, y) are relative to the SECTION, not the screen
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distance = Math.hypot(x - lastMousePos.current.x, y - lastMousePos.current.y);

    // 1. DISTANCE: Increased to 150px to prevent edges from overlapping
    if (distance > 250) {
      const newImage: TrailImage = {
        id: Date.now() + imageCounter.current++,
        x,
        y,
        index: imageCounter.current % PROJECT_IMAGES.length,
      };

      setTrail((prev) => [...prev, newImage]);
      lastMousePos.current = { x, y };

      // 2. LIFESPAN: Disappears strictly after 0.6s
      setTimeout(() => {
        setTrail((prev) => prev.filter((img) => img.id !== newImage.id));
      }, 600);
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full flex flex-col items-center justify-center overflow-hidden px-10 mx-auto pt-30 pb-20 xl:pb-[220px] xl:pt-[260px]"
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <AnimatePresence>
          {trail.map((img) => (
            <motion.div
              key={img.id}
              className="absolute w-56 h-72 overflow-hidden rounded-md shadow-2xl"
              style={{
                left: img.x,
                top: img.y,
                x: "-50%", // Perfectly center image on cursor path
                y: "-50%",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <img
                src={PROJECT_IMAGES[img.index]}
                alt="trail"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className=" max-w-3xl relative z-10 flex flex-col items-center pointer-events-auto justify-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-[64px] leading-tight font-bold text-gradient-white mb-2 lg:mb-5 capitalize text-center"
        >
          {label} {type == "photo" ? "Photography" : "Videography"} Portfolio
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base leading-tight text-white/70 mb-4 lg:mb-10"
        >
          Beige photography brings your vision to life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl" onClick={() => router.push('/book-a-shoot')}>
            Start Your Shoot
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
