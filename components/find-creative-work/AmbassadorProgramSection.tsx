"use client";

import React, { useRef, useState } from "react";
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

  const xPath = useTransform(smoothProgress, [0, 0.12, 0.25], ["0px", "120px", "0px"]);
  const yPath = useTransform(smoothProgress, [0, 0.25], [startY, endY]);
  const dotSize = useTransform(smoothProgress, [0, 0.25], [0, CIRCLE_SIZE]);
  const dotBlur = useTransform(smoothProgress, [0, 0.25], ["blur(20px)", "blur(0px)"]);

  const dotOpacity = useTransform(smoothProgress, [0.25, 0.28], [1, 0]);
  const pyramidOpacity = useTransform(smoothProgress, [0.22, 0.26], [0, 1]);
  const bLogoOpacity = useTransform(smoothProgress, [0.15, 0.25], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative bg-[#010101] py-10 lg:py-32 h-[250vh]"
    >
      <div className="sticky top-0 min-h-screen flex flex-col items-center justify-start pt-10 overflow-visible">

        {/* HEADER & ARROW */}
        <div className="relative z-20 text-center flex flex-col items-center pointer-events-none">
          <h1 className="max-w-4xl text-2xl lg:text-[52px] leading-tight font-bold text-gradient-white px-4">
            Why Join the Beige Creative Partners Ambassador Program?
          </h1>

          <svg width="42" height={ARROW_HEIGHT} viewBox="0 0 42 388" fill="none" className="mt-2">
            <path d="M41.2627 359.227C41.6808 359.932 41.439 360.873 40.7217 361.299L22.4443 386.337C22.2724 387.03 21.6689 387.5 20.9795 387.5C20.284 387.5 19.6831 387.027 19.5185 386.35L1.19725 361.276C0.777876 361.015 0.510061 360.513 0.499984 359.99L19.4805 375.33V2C19.4805 1.17314 20.1536 0.500003 20.9805 0.499999C21.8073 0.499999 22.4805 1.17314 22.4805 2V375.33L41.2627 359.227Z" fill="url(#arrow_grad)" />
            <defs>
              <linearGradient id="arrow_grad" x1="20.9839" y1="-80" x2="20.9839" y2="388" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ARCING DOT */}
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
        >
          <motion.span
            style={{ opacity: bLogoOpacity }}
            className="text-[#010101] font-serif text-4xl lg:text-8xl"
          />
        </motion.div>

        {/* PYRAMID */}
        <motion.div
          style={{
            opacity: pyramidOpacity,
            transform: "translateY(80px)"
          }}
          className="relative -mt-10 w-full max-w-[900px] h-[800px] mx-auto"
        >
          {PYRAMID_DATA.map((item, idx) => {
            const isHovered = hoveredIndex === idx;

            const coords = [
              { top: 0, left: "50%", x: "-50%" },
              { top: PYRAMID_VERTICAL_OFFSET + 9, left: "7.5%", x: "0%" },
              { top: PYRAMID_VERTICAL_OFFSET + 9, left: "92%", x: "-100%" },
            ];

            return (
              <motion.div
                key={item.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  top: coords[idx].top,
                  left: coords[idx].left,
                  translateX: coords[idx].x,
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                }}
                className={`absolute rounded-full border border-white/10 flex flex-col items-center justify-center text-center transition-colors duration-300 cursor-pointer
                  ${isHovered ? "bg-[#D1C9B7] text-[#010101] border-transparent z-40" : "bg-transparent text-white"}
                `}
              >
                <div className="flex flex-col items-center relative w-full h-full justify-center pointer-events-none">

                  {/* DEFAULT CONTENT */}
                  <motion.div
                    animate={{
                      opacity: isHovered ? 0 : 1,
                      y: isHovered ? -15 : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4 lg:gap-10 px-8"
                  >
                    <p className="text-xl lg:text-[26px] text-[#E8D1AB]">
                      {item.id}
                    </p>
                    {item.icon}
                    <p className="text-lg lg:text-[22px] font-medium leading-tight max-w-[280px] text-[#BABABA]">
                      {item.text}
                    </p>
                  </motion.div>

                  <motion.div
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      y: isHovered ? 0 : 15
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center px-12"
                  >
                    {isHovered && (
                      <p className="text-base lg:text-lg font-medium leading-tight">
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