"use client";

import React from "react";
import { motion } from "framer-motion";

const BRANDS_SET = [
  { id: 1, name: "DHL", logo: "/logos/DHLLogo.svg" },
  { id: 2, name: "RollsRoyce", logo: "/logos/Rollsroyce.svg" },
  { id: 3, name: "OrangeTheory", logo: "/logos/orangeTheory.svg" },
];

const BRANDS_SET2 = [
  { id: 1, name: "Amazon", logo: "/logos/Amazon_logo.svg" },
  { id: 2, name: "Chase", logo: "/logos/Chase_logo.svg" },
  { id: 3, name: "YoungLA", logo: "/logos/youngla.png" },
];

const BRANDS_SET3 = [
  { id: 1, name: "Toyota", logo: "/logos/Toyota_Logo.svg" },
  { id: 2, name: "DHL", logo: "/logos/DHLLogo.svg" },  
  { id: 3, name: "Karat", logo: "/logos/Karat.svg" },
];

const BrandCard = ({ name, logo }: { name: string; logo: string }) => (
  <div className="flex h-16 lg:h-40 w-full items-center justify-center rounded-2xl bg-[#171717] border border-white/5 p-2 lg:p-8">
    <img
      src={logo}
      alt={name}
      className="max-h-full max-w-full object-contain "
    />
  </div>
);

const ScrollingColumn = ({
  items,
  direction = "up",
  speed = 20
}: {
  items: typeof BRANDS_SET;
  direction?: "up" | "down";
  speed?: number
}) => {
  const isUp = direction === "up";

  return (
    <div className="relative h-[200px] lg:h-[600px] overflow-hidden">
      <motion.div
        className="flex flex-col gap-2 lg:gap-4 py-4"
        animate={{
          y: isUp ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {[...items, ...items].map((brand, idx) => (
          <BrandCard key={`${brand.id}-${idx}`} name={brand.name} logo={brand.logo} />
        ))}
      </motion.div>
    </div>
  );
};

export default function BrandMarquee() {
  return (
    <div className="relative flex w-full max-w-5xl items-center justify-center bg-transparent p-4 lg:p-10">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#010101] via-transparent to-[#010101]" />

      <div className="grid grid-cols-3 gap-2 lg:gap-4 w-full">
        {/* Column 1: Scrolls Up */}
        <ScrollingColumn items={BRANDS_SET} direction="up" speed={25} />

        {/* Column 2: Scrolls Down */}
        <ScrollingColumn items={BRANDS_SET2} direction="down" speed={30} />

        {/* Column 3: Scrolls Up */}
        <ScrollingColumn items={BRANDS_SET3} direction="up" speed={25} />
      </div>
    </div>
  );
}