"use client";

import { motion } from "framer-motion";

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
  //Double the array to create a seamless loop
  const duplicatedImages = [...IMAGES, ...IMAGES];

  return (
    <div className="relative w-full mt-12 lg:mt-20 overflow-visible py-10">
      {/* 3D Perspective Container */}
      <div
        className="w-full"
        style={{ perspective: "1700px" }} // Higher value = flatter, lower = more intense depth
      >
        <motion.div
          className="flex gap-6 lg:gap-10"
          style={{
            transformStyle: "preserve-3d",
            rotateY: "25deg", // This creates the "Right Side Depth" effect
          }}
          animate={{
            x: ["0%", "-33.33%"], // Move across one set of the triple images
          }}
          transition={{
            ease: "linear",
            duration: 10, // Speed of the loop
            repeat: Infinity,
          }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-[280px] h-[420px] lg:w-[480px] lg:h-[550px]"
            >
              <img
                src={src}
                alt={`Portfolio ${index}`}
                className="w-full h-full object-cover rounded-[32px] lg:rounded-[48px] shadow-2xl border border-white/5"
              />
              {/* Subtle overlay to enhance the "card" look */}
              <div className="absolute inset-0 rounded-[32px] lg:rounded-[48px] ring-1 ring-inset ring-white/10 pointer-events-none" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};