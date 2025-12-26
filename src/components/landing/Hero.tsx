"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/landing/ui/button";

export const Hero = () => {
  const heroRef = useRef<HTMLElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const router = useRouter();
  const videoFileName = "Hero video.mp4";

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const res = await fetch(`/api/video/${videoFileName}`);
        if (!res.ok) throw new Error("Failed to fetch video");
        const data = await res.json();
        setVideoUrl(data.url);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSignedUrl();
  }, [videoFileName]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <>
      {/*  HERO  */}
      <section
        ref={heroRef}
        className="relative h-[85vh] xl:h-screen 2xl:h-[85vh] 2xl:max-h-[900px] overflow-hidden flex flex-col items-center"
      >
        {/*  BACKGROUND VIDEO  */}
        {videoUrl && (
          <motion.video
            style={{ y, opacity }}
            className="absolute inset-0 w-full h-full object-cover z-0"
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        )}

        {/*  CONTENT  */}
        <div className="relative z-[3] w-full pt-28 lg:pt-36 lg:pb-44">
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 lg:mb-12"
            >
              <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-1.5 text-xs lg:text-sm text-white/70">
                ✦ Beige Launches in Miami Art Basil 2025 →
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-lg sm:text-4xl md:text-6xl lg:text-[64px] leading-tight font-bold text-gradient-white mb-4 lg:mb-7"
            >
              The Ultimate Platform for Livestreaming, Photography & Videography
            </motion.h1>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex gap-6"
            >
              <Button
                onClick={() => router.push('/book-a-shoot')}
                className="h-7 lg:h-12 px-5 lg:px-8 rounded-full bg-[#1A1A1A] text-white border border-white/10 hover:bg-[#2A2A2A] text-xs lg:text-lg"
              >
                Book a Shoot
              </Button>

              <Button
                className="h-7 lg:h-12 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-xs lg:text-lg"
              >
                Find a Creative Work
              </Button>
            </motion.div>
          </div>
        </div>

        {/*  BOTTOM FADE  */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full
            h-[80px] lg:h-[120px] z-[4] bg-gradient-to-t from-[#010101] via-[#010101]/85 to-transparent
          "
        />

        {/*  SVG OVERLAY  */}
        <img
          src="/svg/HeroBanner.svg"
          alt="Decorative Overlay"
          className="absolute inset-0 w-full h-full object-cover z-[2] pointer-events-none"
        />
      </section>

      {/*  SUBHEADLINE  */}
      <section className="relative z-[5] bg-[#010101] pb-14 lg:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-[600px] mx-auto text-center text-xs sm:text-sm md:text-base text-[#999999] px-4"
        >
          From cultural moments to world-class productions, book the perfect
          creator for live streaming, videography, and photography in minutes
          with our AI-powered platform.
        </motion.p>
      </section>
    </>
  );
};
