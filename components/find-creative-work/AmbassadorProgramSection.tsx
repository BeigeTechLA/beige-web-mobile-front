"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { CircleDollarSign, Rocket, SquarePen } from "lucide-react";

const CIRCLE_SIZE = 380;
const PYRAMID_VERTICAL_OFFSET = Math.round((Math.sqrt(3) / 2) * CIRCLE_SIZE);
const ARROW_HEIGHT = 388;

const PYRAMID_DATA = [
  {
    id: "01",
    text: "Earn More, Even When You're Not the Creative Partners",
    icon: <CircleDollarSign size={70} strokeWidth={0.5} />,
    hoverText: "Refer clients to Beige and earn referral bonuses, even if you’re not the one completing the shoot. If you’re the Creative Partner on a referred shoot, you earn double the reward!",
  },
  {
    id: "02",
    text: "Access Exclusive Benefits",
    icon: <SquarePen size={70} strokeWidth={0.5} />,
    hoverText: "Let Beige manage the logistics, client communications, insurance, and payments so you can focus on delivering exceptional work and advancing your creative journey.",
  },
  {
    id: "03",
    text: "Focus on Your Craft, We Handle the Rest",
    icon: <Rocket size={70} strokeWidth={0.5} />,
    hoverText: "Progress through our tiered program to unlock higher rates, bonuses, priority bookings, and access to Beige-hosted events. Connect with other top creators in our network and become part of a global creative movement.",
  },
];

export const AmbassadorProgramSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Global click listener to reset on mobile
    const handleGlobalClick = () => {
      if (window.innerWidth < 1024) setHoveredIndex(null);
    };
    document.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end 0.5"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001,
  });

  const startY = 80;
  const endY = ARROW_HEIGHT + CIRCLE_SIZE / 2 + 180;

  const xPath = useTransform(smoothProgress, [0, 0.12, 0.25], ["0px", "280px", "0px"]);
  const yPath = useTransform(smoothProgress, [0, 0.25], [startY, endY]);
  const dotSize = useTransform(smoothProgress, [0, 0.25], [0, CIRCLE_SIZE]);
  const dotBlur = useTransform(smoothProgress, [0, 0.25], ["blur(10px)", "blur(0px)"]);
  const dotOpacity = useTransform(smoothProgress, [0.25, 0.28], [1, 0]);
  const pyramidOpacity = useTransform(smoothProgress, [0.18, 0.24], [0, 1]);
  const bLogoOpacity = useTransform(smoothProgress, [0.15, 0.25], [1, 0]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-[#010101] py-10 lg:py-32 ${isMobile ? "h-auto" : "h-[250vh]"}`}
    >
      <div className={`${isMobile ? "relative" : "sticky top-0 min-h-screen"} flex flex-col items-center justify-start pt-10 w-full`}>

        {/* HEADER */}
        <div className="relative z-20 text-center flex flex-col items-center mb-10 lg:mb-0 w-full">
          <h1 className="max-w-4xl text-2xl lg:text-[52px] leading-tight font-bold text-gradient-white px-6">
            Why Join the Beige Creative Partners Ambassador Program?
          </h1>

          {!isMobile && (
            <svg width="42" height={ARROW_HEIGHT} viewBox="0 0 42 388" fill="none" className="mt-2 pointer-events-none">
              <path d="M41.2627 359.227C41.6808 359.932 41.439 360.873 40.7217 361.299L22.4443 386.337C22.2724 387.03 21.6689 387.5 20.9795 387.5C20.284 387.5 19.6831 387.027 19.5185 386.35L1.19725 361.276C0.777876 361.015 0.510061 360.513 0.499984 359.99L19.4805 375.33V2C19.4805 1.17314 20.1536 0.500003 20.9805 0.499999C21.8073 0.499999 22.4805 1.17314 22.4805 2V375.33L41.2627 359.227Z" fill="url(#arrow_grad)" />
              <defs>
                <linearGradient id="arrow_grad" x1="20.9839" y1="-80" x2="20.9839" y2="388" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="1" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* ARCING DOT (Desktop Only) */}
        {!isMobile && (
          <motion.div
            style={{
              x: xPath,
              y: yPath,
              width: dotSize,
              height: dotSize,
              filter: dotBlur,
              opacity: dotOpacity,
            }}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D1C9B7] flex items-center justify-center z-50 pointer-events-none"
          />
        )}

        {/* CIRCLES CONTAINER */}
        <motion.div
          style={isMobile ? { opacity: 1 } : { opacity: pyramidOpacity, transform: "translateY(80px)" }}
          className={`relative w-full max-w-full lg:max-w-[900px] mx-auto flex flex-col items-center ${isMobile ? "gap-10 mt-6 pb-20" : "h-[800px] -mt-10"
            }`}
        >
          {PYRAMID_DATA.map((item, idx) => {
            const isHovered = hoveredIndex === idx;

            // Clean logic: Mobile gets no transforms/positioning
            const itemStyle = isMobile ? {
              width: "min(350px, 90vw)",
              height: "min(350px, 90vw)",
            } : {
              top: [0, PYRAMID_VERTICAL_OFFSET + 9, PYRAMID_VERTICAL_OFFSET + 9][idx],
              left: ["50%", "7.5%", "92.5%"][idx],
              translateX: ["-50%", "0%", "-100%"][idx],
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              position: 'absolute' as const
            };

            return (
              <motion.div
                key={item.id}
                onClick={(e) => {
                  if (isMobile) {
                    e.stopPropagation();
                    setHoveredIndex(isHovered ? null : idx);
                  }
                }}
                onMouseEnter={() => !isMobile && setHoveredIndex(idx)}
                onMouseLeave={() => !isMobile && setHoveredIndex(null)}
                style={itemStyle}
                className={`rounded-full border border-white/10 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer overflow-hidden relative
                  ${isHovered ? "bg-[#D1C9B7] text-[#010101] border-transparent z-40" : "bg-transparent text-white"}
                `}
              >
                {/* REMOVED pointer-events-none here to allow clicks to register */}
                <div className="flex flex-col items-center relative w-full h-full justify-center px-8 lg:px-10">
                  {/* DEFAULT CONTENT */}
                  <motion.div
                    animate={{ opacity: isHovered ? 0 : 1, y: isHovered ? -15 : 0 }}
                    className="flex flex-col items-center gap-2 lg:gap-8"
                  >
                    <p className="text-lg lg:text-[26px] text-[#E8D1AB]">{item.id}</p>
                    <div className="scale-90 lg:scale-100">{item.icon}</div>
                    <p className="text-sm lg:text-[22px] font-medium leading-tight max-w-[200px] lg:max-w-[280px] text-[#BABABA]">
                      {item.text}
                    </p>
                  </motion.div>

                  {/* HOVER CONTENT */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                    className="absolute inset-0 flex items-center justify-center px-8 lg:px-12"
                  >
                    {isHovered && (
                      <p className="text-sm lg:text-lg font-medium leading-tight text-center">
                        {item.hoverText}
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};