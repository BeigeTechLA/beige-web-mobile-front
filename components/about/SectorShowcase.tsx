"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const SECTOR_CARDS = [
  {
    id: 1,
    title: "Built for Every Brand",
    desc: "Whether you're a business, brand, creator, or agency, Beige makes professional content production simple and accessible. No matter the industry or project size, we help you create content that delivers results",
    imgSrc: "/images/misc/UsersGlow.svg"
  },
  {
    id: 2,
    title: "Wherever You Need Us",
    desc: "With a trusted network of creative professionals, Beige delivers high-quality production wherever your shoot takes place—from offices and studios to retail stores, events, and outdoor locations.",
    imgSrc: "/images/misc/MapPinGlow.svg"
  },
  {
    id: 3,
    title: "Ready When You Are",
    desc: "Plan ahead or book on demand. From scheduled campaigns to last-minute shoots, Beige helps you produce exceptional content quickly, reliably, and at scale.",
    imgSrc: "/images/misc/ClockGlow.svg"
  },
];

export default function SectorShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const leftCard = SECTOR_CARDS[0];
  const centerCard = SECTOR_CARDS[1];
  const rightCard = SECTOR_CARDS[2];

  // --- TIMELINE CONTROLS ---
  // Vertical Entry: Left card rises slightly earlier than the right card to create an overlapping stack look.
  const leftY = useTransform(scrollYProgress, [0, 0.35, 0.45, 1], ["800px", "0px", "0px", "0px"]);
  const rightY = useTransform(scrollYProgress, [0, 0.1, 0.45, 1], ["850px", "0px", "0px", "0px"]);

  // Horizontal Fan Out: Stays stacked in the center axis (0px) until 0.45 scroll progress, then fans outwards.
  const leftX = useTransform(scrollYProgress, [0, 0.45, 0.85, 1], ["0px", "0px", "-364px", "-364px"]); // 340px width + 24px gap
  const rightX = useTransform(scrollYProgress, [0, 0.45, 0.85, 1], ["0px", "0px", "364px", "364px"]);

  return (
    <section className="relative overflow-visible w-full">
      {/* Scroll track duration container */}
      <div
        ref={containerRef}
        className="relative w-full h-[250vh] overflow-visible"
      >
        {/* Sticky frame setup utilizing exactly 100px bottom gap alignment constraints */}
        <div className="sticky top-0 h-screen w-full pt-16 md:pt-24 pb-25 px-6 lg:px-16 overflow-hidden flex flex-col justify-start items-center">

          {/* Header Text Flow Grid */}
          <div className="flex flex-col items-center max-w-5xl mx-auto text-center flex-shrink-0">
            <h2 className="text-center text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
              Professional Content Production, Made Simple
            </h2>
          </div>

          {/* 
            Horizontal 3-Card Block Container. 
          */}
          <div className="mt-0 w-full max-w-6xl relative z-20 flex justify-center items-end flex-grow mt-20 2xl:-mt-20">

            {/* Absolute Left Side Card: Overlaps behind center card, then pushes left */}
            <motion.div
              style={{ y: leftY, x: leftX }}
              className="absolute bottom-0 w-[340px] pointer-events-auto z-10"
            >
              <div className="w-full bg-[#171717] rounded-2xl p-8 flex flex-col justify-between lg:h-115 shadow-xl">
                <div className="w-18 h-18 flex items-center justify-center mb-8 relative">
                  <Image
                    src={leftCard.imgSrc}
                    alt={leftCard.title}
                    width={75}
                    height={75}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg lg:text-2xl text-[#E8D1AB] font-medium mb-2.5">{leftCard.title}</h3>
                  <p className="text-sm lg:text-base text-white/70">{leftCard.desc}</p>
                </div>
              </div>
            </motion.div>

            {/* Stationary Center Card: Stays locked in position as the stacking reference point */}
            <div className="w-full max-w-[340px] bg-[#171717] rounded-2xl p-8 flex flex-col justify-between lg:h-115 shadow-xl relative z-30">
              <div className="w-18 h-18 flex items-center justify-center mb-8 relative">
                <Image
                  src={centerCard.imgSrc}
                  alt={centerCard.title}
                  width={75}
                  height={75}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg lg:text-2xl text-[#E8D1AB] font-medium mb-2.5">{centerCard.title}</h3>
                <p className="text-sm lg:text-base text-white/70">{centerCard.desc}</p>
              </div>
            </div>

            {/* Absolute Right Side Card: Overlaps on top of center card sequence, then pushes right */}
            <motion.div
              style={{ y: rightY, x: rightX }}
              className="absolute bottom-0 w-[340px] pointer-events-auto z-20"
            >
              <div className="w-full bg-[#171717] rounded-2xl p-8 flex flex-col justify-between lg:h-115 shadow-2xl">
                <div className="w-18 h-18 flex items-center justify-center mb-8 relative">
                  <Image
                    src={rightCard.imgSrc}
                    alt={rightCard.title}
                    width={75}
                    height={75}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg lg:text-2xl text-[#E8D1AB] font-medium mb-2.5">{rightCard.title}</h3>
                  <p className="text-sm lg:text-base text-white/70">{rightCard.desc}</p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}