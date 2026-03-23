"use client";

import React from "react";

export const Gallery = () => {
  return (
    <section className="bg-[#010101] py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <div className="text-center mb-5 lg:mb-16 relative z-10">
        <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
          #ShotOnBeige
        </h2>

        <p className="text-white/50 text-xs md:text-base max-w-[600px] mx-auto px-8 md:px-0">
          Photo content captured on Beige.
        </p>
      </div>

      <div className="relative w-full h-[700px] overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-transparent via-[#010101]/80 to-[#010101]" />
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d2jhn32fsulyac.cloudfront.net/assets/videos/BeigeScroller.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />
      </div>
    </section>
  );
};
