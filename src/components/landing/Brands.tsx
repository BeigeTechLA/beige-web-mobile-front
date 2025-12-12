"use client";

import React from "react";
import { Container } from "@/src/components/landing/ui/container";

export const Brands = () => {
  // Mock video URL - replace with actual video path
  const videoUrl = "/videos/Brands Video.mp4";

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">

          {/* Left Content */}
          <div className="w-full lg:w-[720px] shrink-0">
            <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
              <p className="text-base text-white">Our Clients</p>
            </div>

            <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-8 tracking-tight">
              Trusted by Top Brands and Creators Worldwide
            </h2>

            <p className="text-white/70 text-sm lg:text-base leading-[28px] font-light">
              Beige Media makes it easy for brands to create any video they need with a single, trusted partner. Our fast, simple, and transparent process takes the stress out of video production, making it smooth and hassle-free.
            </p>
          </div>

          {/* Right Grid */}
          <div className="w-full">
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="pointer-events-none absolute -bottom-2 left-0 w-full h-10 lg:h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
