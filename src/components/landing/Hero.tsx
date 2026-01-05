"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/landing/ui/button";
import RotatingInput from "./RotatingInput";

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
        className="relative h-[85vh] xl:h-screen 2xl:h-[90vh] 2xl:max-h-[950px] overflow-hidden flex flex-col items-center"
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
        <div className="relative z-[3] w-full pt-28 lg:pt-40 lg:pb-44">
          <div className="container mx-auto px-4 flex flex-col items-center text-center">
            {/* Badge */}
            {/* <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 lg:mb-12"
            >
              <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-1.5 text-xs lg:text-sm text-white/70">
                ✦ Beige Launches in Miami Art Basil 2025 →
              </div>
            </motion.div> */}

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-2xl lg:text-[58px] leading-tight font-bold text-gradient-white mb-2"
            >
              Create Content Instantly.
            </motion.h1>

            {/* Sub-headline */}
            <motion.h4
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-base lg:text-[32px] leading-tight text-white/70 mb-4 lg:mb-8"
            >
              Video, Photo, & Editing All in One Platform
            </motion.h4>

            {/* New section */}
            <RotatingInput />

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex gap-6"
            >
              <Button
                className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl"
                 onClick={() => router.push('/book-a-shoot')}
              >
                Start Your Shoot
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
    </>
  );
};
