"use client";

import React, { useRef, useEffect, useState, Dispatch, SetStateAction } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/landing/ui/button";
import RotatingInput from "./RotatingInput";
import { HeroSwiper } from "./HeroImageSwiper";
import { useAuth } from "@/lib/hooks/useAuth";

export const Hero = () => {
  const heroRef = useRef<HTMLElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mobileVideoUrl, setMobileVideoUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const videoFileName = "Beige - Slow Version.webm";
  const mobileVideoFileName = "Beige Mobile - Slower Version.webm";

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const activeVideoUrl = isMobile ? mobileVideoUrl : videoUrl;

  useEffect(() => {
    const fetchSignedUrl = async (fileName: string, setUrl: Dispatch<SetStateAction<string | null>>) => {
      try {
        const response = await fetch(`/api/video/${fileName}`);

        if (!response.ok) {
          throw new Error("Failed to fetch signed URL.");
        }

        const data = await response.json();
        setUrl(data.url);
      } catch (error) {
        console.error("Error fetching video URL:", error);
      }
    };

    fetchSignedUrl(videoFileName, setVideoUrl);
    fetchSignedUrl(mobileVideoFileName, setMobileVideoUrl);
  }, [videoFileName, mobileVideoFileName]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  return (
    <>
      {/*  HERO  */}
      <section
        ref={heroRef}
        className="relative h-[900px] lg:h-[1320px] overflow-hidden flex flex-col items-center"
      >

        {/*  CONTENT  */}
        <div className="relative z-[3] w-full pt-28 lg:pt-40 lg:pb-44">
          <div className=" px-4 flex flex-col items-center text-center">
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
              {!isAuthenticated && (
                <Button
                  className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl"
                  onClick={() => router.push('/login')}
                >
                  Sign Up
                </Button>
              )}
            </motion.div>

            {/* THE SWIPER COMPONENT */}
            <div className="relative w-full h-[600px] lg:h-[800px] overflow-hidden">
              <HeroSwiper />

              {/* Top and Bottom fade */}
              <div className="pointer-events-none absolute top-0 left-0 w-full h-[150px] z-[20] bg-gradient-to-b from-[#010101] via-[#010101]/60 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[150px] z-[20] bg-gradient-to-t from-[#010101] via-[#010101]/60 to-transparent" />

              {/* 4. Side Fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-15 z-[20] bg-gradient-to-r from-[#010101] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-15 z-[20] bg-gradient-to-l from-[#010101] to-transparent" />
            </div>

            {/* New Hero Video */}
            {/* <div className="relative w-full h-[600px] lg:h-[800px] overflow-hidden">
              <div className="pointer-events-none absolute top-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-transparent via-[#010101]/80 to-[#010101]" />
              {activeVideoUrl && (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={activeVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
              <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[80px] z-[2] bg-gradient-to-t from-[#010101] via-[#010101]/80 to-transparent" />
            </div> */}
          </div>
        </div>
      </section>
    </>
  );
};
