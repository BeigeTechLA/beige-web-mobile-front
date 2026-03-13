"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/landing/ui/button";
import RotatingInput from "./RotatingInput";
import { HeroSwiper } from "./HeroImageSwiper";
import { useAuth } from "@/lib/hooks/useAuth";
import { pushToDataLayer } from "@/lib/gtm";

export const Hero = () => {
  const heroRef = useRef<HTMLElement | null>(null);

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/*  HERO  */}
      <section
        ref={heroRef}
        className="relative h-[900px] lg:h-[1320px] overflow-hidden flex flex-col items-center"
      >
        {/*  CONTENT  */}
        <div className="relative z-[3] w-full pt-28 md:pt-40 md:pb-44">
          <div className=" px-4 flex flex-col items-center text-center">
            {/* Headline */}
            <motion.h1
              // initial={{
              //   opacity: 0,
              //   y: 20,
              //   clipPath: "inset(0 100% 0 0)"
              // }}
              // animate={{
              //   opacity: 1,
              //   y: 0,
              //   clipPath: "inset(0 0% 0 0)"
              // }}
              // transition={{
              //   duration: 5,
              //   delay: 0.8,
              //   ease: [0.33, 1, 0.68, 1],

              //   opacity: {
              //     duration: 1.2,
              //     delay: 0.8
              //   },
              //   y: {
              //     duration: 1.2,
              //     delay: 0.8
              //   },
              // }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-[64px] leading-tight font-bold mb-4 bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #E8D1AB 0%, #C8A97E 100%)",
                WebkitBackgroundClip: "text",
                paddingBottom: "4px"
              }}
            >
              Create Content Instantly.
            </motion.h1>


            {/* Sub-headline */}
            <motion.h4
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-base md:text-[32px] leading-tight text-white/70 mb-4 lg:mb-8"
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
                onClick={() => {
                  pushToDataLayer("book_shoot_started", {
                    type: "Action Tracking",
                    page_name: "Landing Page",
                    location_in_website: "hero_landing_page",
                    duration_on_page: performance.now() / 1000,
                  });
                  router.push('/book-a-shoot')
                }}
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
          </div>
        </div>
      </section>
    </>
  );
};
