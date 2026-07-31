"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";

const SECTOR_CARDS = [
  {
    id: 1,
    title: "Built for Every Brand",
    desc: "Whether you're a business, brand, creator, or agency, Beige makes professional content production simple and accessible. No matter the industry or project size, we help you create content that delivers results",
    imgSrc: "/images/misc/UsersGlow.svg",
  },
  {
    id: 2,
    title: "Wherever You Need Us",
    desc: "With a trusted network of creative professionals, Beige delivers high-quality production wherever your shoot takes place—from offices and studios to retail stores, events, and outdoor locations.",
    imgSrc: "/images/misc/MapPinGlow.svg",
  },
  {
    id: 3,
    title: "Ready When You Are",
    desc: "Plan ahead or book on demand. From scheduled campaigns to last-minute shoots, Beige helps you produce exceptional content quickly, reliably, and at scale.",
    imgSrc: "/images/misc/ClockGlow.svg",
  },
];

export default function SectorShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /**
   * ------------------------
   * Vertical stack animation
   * ------------------------
   */

  const card1Y = useSpring(
    useTransform(scrollYProgress, [0.08, 0.24], ["700px", "0px"]),
    { stiffness: 120, damping: 24 }
  );

  const card2Y = useSpring(
    useTransform(scrollYProgress, [0.22, 0.38], ["700px", "0px"]),
    { stiffness: 120, damping: 24 }
  );

  const card3Y = useSpring(
    useTransform(scrollYProgress, [0.36, 0.52], ["700px", "0px"]),
    { stiffness: 120, damping: 24 }
  );

  /**
   * ------------------------
   * Horizontal fan animation
   * Begins ONLY after all cards
   * are stacked.
   * ------------------------
   */

  const leftX = useSpring(
    useTransform(scrollYProgress, [0.60, 0.82], [0, -364]),
    { stiffness: 120, damping: 22 }
  );

  const rightX = useSpring(
    useTransform(scrollYProgress, [0.60, 0.82], [0, 364]),
    { stiffness: 120, damping: 22 }
  );

  return (
    <section className="relative w-full overflow-visible">
      <div
        ref={containerRef}
        className="relative h-[250vh] lg:h-[300vh] 2xl:h-[250vh]"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* <div className="sticky top-0 h-screen w-full overflow-hidden px-6 lg:px-16 pt-16 md:pt-24 flex flex-col items-center"> */}

            {/* Heading */}
            <div className="mx-auto max-w-5xl pt-20 lg:pt-24">
              <h2 className="text-center text-3xl md:text-[56px] leading-[1.05] font-medium bg-gradient-to-r from-white to-white/20 bg-clip-text text-transparent">
                Professional Content Production, Made Simple
              </h2>
            </div>

            {/* Cards */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[260px] md:top-[300px] lg:top-[330px] xl:top-[350px] w-full max-w-6xl h-[470px] px-6 pb-25">
              <div className="relative h-full flex justify-center items-end">
                {/* LEFT CARD */}

                <motion.div
                  style={{ y: card1Y, x: leftX }}
                  className="absolute bottom-0 w-[340px] z-10"
                >
                  <Card card={SECTOR_CARDS[0]} />
                </motion.div>

                {/* CENTER CARD */}

                <motion.div
                  style={{ y: card2Y }}
                  className="absolute bottom-0 w-[340px] z-20"
                >
                  <Card card={SECTOR_CARDS[1]} />
                </motion.div>

                {/* RIGHT CARD */}

                <motion.div
                  style={{ y: card3Y, x: rightX }}
                  className="absolute bottom-0 w-[340px] z-30"
                >
                  <Card card={SECTOR_CARDS[2]} />
                </motion.div>

              </div>
            </div>

          </div>
        </div>
    </section>
  );
}

function Card({
  card,
}: {
  card: {
    title: string;
    desc: string;
    imgSrc: string;
  };
}) {
  return (
    <div className="bg-[#171717] rounded-2xl p-8 h-[460px] flex flex-col justify-between shadow-2xl">
      <div className="w-[72px] h-[72px] flex items-center justify-center mb-8">
        <Image
          src={card.imgSrc}
          alt={card.title}
          width={75}
          height={75}
        />
      </div>

      <div>
        <h3 className="text-[#E8D1AB] text-2xl font-medium mb-2">
          {card.title}
        </h3>

        <p className="text-white/70">
          {card.desc}
        </p>
      </div>
    </div>
  );
}