"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/src/components/landing/ui/button";

export const Hero = () => {
  const heroRef = useRef<HTMLElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const videoFileName = "Hero video.mp4";

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

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleBookShoot = () => {
    console.log('Hero: Book a Shoot clicked');
    // Mock booking modal open
    setIsBookingOpen(true);
  };

  const handleFindWork = () => {
    console.log('Hero: Find a Creative Work clicked');
  };

  return (
    <>
      <section
        ref={heroRef}
        className="pt-30 lg:pt-36 pb-20 overflow-hidden min-h-screen flex flex-col items-center"
      >
        {/* Video Container */}
        <div className="relative w-full">
          {/* Background Video */}
          {
            videoUrl &&
            <video
              className="absolute inset-0 w-full h-full object-cover z-0"
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
            />
          }

          {/* Bottom fade overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-18 xl:h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />

          {/* Content */}
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
              {/* Launch Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <div className="w-auto px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center gap-2">
                  <span className="text-[#ECE1CE]">✦</span>
                  <span className="text-white/70 text-sm font-medium">
                    Beige Launches in Miami Art Basil 2025 →
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-center max-w-[1237px] mb-16"
              >
                <h1 className="text-xl md:text-6xl lg:text-[64px] leading-[1.1] font-bold tracking-tight text-gradient-white">
                  The Ultimate Platform for Livestreaming,
                  <br />
                  Photography & Videography
                </h1>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 items-center justify-center mb-32 xl:mb-[541px]"
              >
                <Button
                  onClick={handleBookShoot}
                  className="w-[180px] h-[56px] rounded-full text-base font-medium bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] border border-white/10"
                >
                  Book a Shoot
                </Button>
                <Button
                  onClick={handleFindWork}
                  className="w-[200px] h-[56px] rounded-full text-base font-medium bg-[#ECE1CE] text-[#030303] hover:bg-[#dcb98a]"
                >
                  Find a Creative Work
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Subheadline section under video */}
        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center max-w-[300px] lg:max-w-[600px] mb-12 mx-auto"
          >
            <p className="text-sm md:text-base text-[#999999] leading-relaxed">
              From cultural moments to world-class productions, book the
              perfect creator for live streaming, videography, and
              photography in minutes with our AI-powered platform.
            </p>
          </motion.div>
        </div>

        {/* Updated SVG overlay replacing all previous overlays */}
        <img
          src="/svg/Herobannerbackground1.svg"
          alt="Decorative Overlay"
          className="absolute inset-0 w-full h-full object-cover z-[1] pointer-events-none"
        />
      </section>

      {/* Mock Booking Modal Notification */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg max-w-md">
            <h3 className="text-black text-xl font-bold mb-4">Booking Modal</h3>
            <p className="text-black mb-4">This would open the booking modal in the real implementation.</p>
            <Button onClick={() => setIsBookingOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  );
};
