"use client";

import React from "react";
import { Container } from "@/src/components/landing/ui/container";

export const Gallery = () => {
  // Mock video URL - replace with actual video path
  const videoUrl = "/videos/Gallery Video.mp4";

  return (
    <section className="bg-[#010101] py-32 relative overflow-hidden">
      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-base text-white">Gallery</p>
        </div>

        <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-6 tracking-tight">
          Chosen by leading professionals to showcase <br />
          their talent and portfolio.
        </h2>

        <p className="text-white/50 text-sm lg:text-base max-w-[600px] mx-auto mb-12">
          The Beige portfolio provides clients with essential details for smarter hiring and offers creatives a world-class stage to display their best work.
        </p>
      </div>

      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[700px] overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-transparent via-[#010101]/80 to-[#010101]" />
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
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
