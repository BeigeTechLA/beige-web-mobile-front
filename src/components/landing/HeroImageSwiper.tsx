"use client";

import { motion, useAnimationFrame } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const IMAGES = [
  "/images/landingHero/HeroBannerPhotos1.png",
  "/images/landingHero/HeroBannerPhotos2.png",
  "/images/landingHero/HeroBannerPhotos3.png",
  "/images/landingHero/HeroBannerPhotos4.png",
  "/images/landingHero/HeroBannerPhotos5.png",
  "/images/landingHero/HeroBannerPhotos6.png",
  "/images/landingHero/HeroBannerPhotos7.png",
  "/images/landingHero/HeroBannerPhotos8.png",
  "/images/landingHero/HeroBannerPhotos9.png",
  "/images/landingHero/HeroBannerPhotos10.png",
  "/images/landingHero/HeroBannerPhotos11.png",
  "/images/landingHero/HeroBannerPhotos12.png",
];

export const HeroSwiper = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [loopWidth, setLoopWidth] = useState(0);
  const x = useRef(0);

  const images = [...IMAGES, ...IMAGES];

  useEffect(() => {
    if (!trackRef.current) return;
    setLoopWidth(trackRef.current.scrollWidth / 2);
  }, []);

  useAnimationFrame((_, delta) => {
    if (!trackRef.current || !loopWidth) return;

    const speed = 250;
    x.current -= (speed * delta) / 1000;

    if (Math.abs(x.current) >= loopWidth) {
      x.current = 0;
    }

    // IMPORTANT: translate ONLY
    trackRef.current.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div className="relative w-full mt-12 lg:mt-20 overflow-hidden py-10">
      {/* Perspective */}
      <div style={{ perspective: "1700px" }}>
        {/* Static rotation layer */}
        <div
          style={{
            transform: "rotateY(25deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Moving track */}
        <div
          ref={trackRef}
          className="flex gap-6 lg:gap-10 will-change-transform"
        >
          {images.map((src, index) => (
            <div
              key={index}
                className="relative flex-shrink-0 w-[280px] h-[420px] lg:w-[480px] lg:h-[550px]"
            >
              <img
                src={src}
                alt={`Portfolio ${index}`}
                className="w-full h-full object-cover rounded-[32px] lg:rounded-[48px] shadow-2xl border border-white/5"
              />
              <div className="absolute inset-0 rounded-[32px] lg:rounded-[48px] ring-1 ring-inset ring-white/10 pointer-events-none" />
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};
