"use client";

import React, { useEffect, useState } from "react";
import { Container } from "@/src/components/landing/ui/container";

export const Brands = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoFileName = "Brands Video.mp4";

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(`/api/video/${videoFileName}`);

        if (!response.ok) {
          throw new Error("Failed to fetch signed URL.");
        }

        const data = await response.json();
        setVideoUrl(data.url);
      } catch (error) {
        console.error("Error fetching video URL:", error);
      }
    };

    fetchSignedUrl();
  }, [videoFileName]);

  return (
    <section className="py-10 md:py-32 relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-7 lg:gap-24 items-center">

          {/* Left Content */}
          <div className="w-full lg:w-[720px] shrink-0">
            <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
              <p className="text-xs md:text-base text-white">Our Clients</p>
            </div>

            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-8 tracking-tight">
              Trusted by the World&apos;s Most Influential Brands
            </h2>

            <p className="text-white/70 text-xs lg:text-base lg:leading-[28px] font-light">
              Beige Media makes it easy for brands to create any video they need with a single, trusted partner. Our fast, simple, and transparent process takes the stress out of video production, making it smooth and hassle-free.
            </p>
          </div>

          {/* Right Grid */}
          <div className="w-full">
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
              <div className="pointer-events-none absolute -top-2 left-0 w-full h-10 lg:h-[80px] z-[2] bg-gradient-to-t from-transparent via-[#010101]/80 to-[#010101]" />
              {
                videoUrl &&
                <video
                className="absolute inset-0 w-full h-full object-cover"
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
              />}
              <div className="pointer-events-none absolute -bottom-2 left-0 w-full h-10 lg:h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
