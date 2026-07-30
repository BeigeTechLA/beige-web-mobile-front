"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

const IMAGES_SET = [
  { id: 1, name: "DHL", logo: "/images/crew/CREW(9).png" },
  { id: 2, name: "RollsRoyce", logo: "/images/crew/CREW(5).png" },
  { id: 3, name: "OrangeTheory", logo: "/images/crew/CREW(6).png" },
  { id: 4, name: "Amazon", logo: "/images/crew/CREW(7).png" },
  { id: 5, name: "Chase", logo: "/images/crew/CREW(8).png" },
  { id: 6, name: "YoungLA", logo: "/images/crew/CREW(3).png" },
  { id: 7, name: "Toyota", logo: "/images/crew/CREW(4).png" },
  { id: 8, name: "DHL", logo: "/images/crew/CREW(2).png" },
  { id: 9, name: "Karat", logo: "/images/crew/CREW(1).png" },
];

const ImageCard = ({ name, logo, isAlternated }: { name: string; logo: string; isAlternated: boolean }) => (
  <div
    className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-transform duration-300
      ${isAlternated 
        ? "w-[240px] h-[250px] sm:w-[280px] sm:h-[290px] lg:w-[317.815px] lg:h-[332.949px]" 
        : "w-[240px] h-[180px] sm:w-[280px] sm:h-[210px] lg:w-[333.264px] lg:h-[246.468px]"
      }
    `}
  >
    <img
      src={logo}
      alt={name}
      className="h-full w-full object-cover transition-opacity duration-300"
    />
  </div>
);

const ScrollingRow = ({
  items,
  speed = 25
}: {
  items: typeof IMAGES_SET;
  speed?: number
}) => {
  return (
    <div className="relative w-full h-[260px] sm:h-[310px] lg:h-[360px] overflow-hidden flex items-center">
      <motion.div
        className="flex items-center gap-6 pr-6 w-max"
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
            <ImageCard
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

export default function ContentAndMarquee() {
  return (
    <section className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-6">
          <div className="flex flex-col max-w-5xl mx-auto text-left shrink-0 space-y-3 lg:space-y-5">
            <h2 className="text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
              Create Content That Performs
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="max-w-3xl text-white/70 font-light"
            >
              Beautiful visuals are just the beginning. We produce high-quality photos and videos that showcase your products, services, and events, helping you capture attention, engage your audience, and drive meaningful results.
            </motion.p>
          </div>

          {/* Marquee section */}
          <div className="relative flex w-full items-center justify-center bg-transparent p-4 mx-auto">
            {/* Horizontal mask overlay matches the visual layout flow */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#010101] via-transparent to-[#010101]" />

            <div className="w-full overflow-hidden">
              <ScrollingRow items={IMAGES_SET} speed={30} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}