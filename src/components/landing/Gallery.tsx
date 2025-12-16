"use client";

import React, { useEffect, useState } from "react";

export const Gallery = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoFileName = "Gallery Video.mp4";

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
    <section className="bg-[#010101] py-10 lg:py-32 relative overflow-hidden">
      {/* Header */}
      <div className="text-center mb-5 lg:mb-16 relative z-10">
        <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
          <p className="text-xs md:text-base text-white">Gallery</p>
        </div>

        <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-8 tracking-tight">
          Chosen by leading professionals to showcase <br />
          their talent and portfolio.
        </h2>

        <p className="text-white/50 text-xs lg:text-base max-w-[600px] mx-auto px-8 md:px-0">
          The Beige portfolio provides clients with essential details for smarter hiring and offers creatives a world-class stage to display their best work.
        </p>
      </div>

      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[700px] overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-transparent via-[#010101]/80 to-[#010101]" />
        {videoUrl && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />
      </div>
    </section>
  );
};
