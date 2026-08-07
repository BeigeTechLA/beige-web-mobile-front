"use client";

import React from "react";
import { motion } from "framer-motion";

const BRANDS_SET = [
  { id: 1, name: "DHL", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/DHLLogo.svg" },
  { id: 2, name: "RollsRoyce", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/Rollsroyce.svg" },
  { id: 3, name: "OrangeTheory", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/orangeTheory.svg" },
  { id: 4, name: "Amazon", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/Amazon_logo.svg" },
  { id: 5, name: "Chase", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/Chase_logo.svg" },
  { id: 6, name: "YoungLA", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/youngla.png" },
  { id: 7, name: "Toyota", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/Toyota_Logo.svg" },
  { id: 8, name: "DHL", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/DHLLogo.svg" },  
  { id: 9, name: "Karat", logo: "https://d2jhn32fsulyac.cloudfront.net/assets/logos/Karat.svg" },
];

const BrandCard = ({ name, logo, isAlternated }: { name: string; logo: string; isAlternated: boolean }) => (
  // Explicit flex-shrink-0 ensures cards keep their layout context during loop iterations
  <div 
    className={`flex h-24 w-24 lg:h-47 lg:w-47 flex-shrink-0 items-center justify-center rounded-2xl bg-[#171717] p-4 lg:p-8 transition-transform duration-300
      ${isAlternated ? "translate-y-4 lg:translate-y-8" : "-translate-y-4 lg:-translate-y-8"}
    `}
  >
    <img
      src={logo}
      alt={name}
      className="max-h-full max-w-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
    />
  </div>
);

const ScrollingRow = ({
  items,
  speed = 25
}: {
  items: typeof BRANDS_SET;
  speed?: number
}) => {
  return (
    // Height accommodates both standard height plus structural offsets
    <div className="relative w-full h-40 sm:h-56 lg:h-64 overflow-hidden flex items-center">
      <motion.div
        className="flex gap-4 lg:gap-6 pr-4 lg:pr-6 w-max"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* Duplicate list to enable smooth horizontal marquee loops */}
        {[...items, ...items].map((brand, idx) => {
          // Stagger placement based on overall array offset sequence
          const isAlternated = idx % 2 === 1;
          return (
            <BrandCard 
              key={`${brand.id}-${idx}`} 
              name={brand.name} 
              logo={brand.logo} 
              isAlternated={isAlternated}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export default function BrandMarquee() {
  return (
    <div className="relative flex w-full max-w-7xl items-center justify-center bg-transparent p-4 py-12 lg:p-10 lg:py-20 mx-auto">
      {/* Horizontal mask overlay matches the visual layout flow */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#010101] via-transparent to-[#010101]" />

      <div className="w-full overflow-hidden">
        <ScrollingRow items={BRANDS_SET} speed={30} />
      </div>
    </div>
  );
}