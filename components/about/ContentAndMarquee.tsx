"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

const IMAGES_SET = [
  { id: 1, alt: "Concert", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/64a75d8b7818bf0dd9070e45_COVER.jpg" },
  { id: 2, alt: "Thrive Causemetics", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/64ae949c75e1882ff9a483dc_COVER.jpg" },
  { id: 3, alt: "OrangeTheory Event", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/67c75fd9b0ec05e3f0998092_IMG_5103-p-800.jpg" },
  { id: 4, alt: "Event image", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/669dcd9990a20e181981b877_DSC08499-p-800.jpg" },
  { id: 5, alt: "Start Up", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/Copy+of+VID03599_editedv1.jpg" },
  { id: 6, alt: "Elevate Event", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/8.jpg" },
  { id: 7, alt: "Pet NGO", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/64aebf7f0720254a756fd796_COVER-p-3200.png" },
  { id: 8, alt: "Event image", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/REF08693.jpg" },
  { id: 9, alt: "Event image", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/REF07790.jpg" },
  { id: 10, alt: "Corporate Event image", src: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/ContentMarquee/Photo 069.jpg" },
];

const ImageCard = ({ alt, src, isAlternated }: { alt: string; src: string; isAlternated: boolean }) => (
  <div
    className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-transform duration-300
      ${isAlternated 
        ? "w-[240px] h-[250px] sm:w-[280px] sm:h-[290px] lg:w-[317.815px] lg:h-[332.949px]" 
        : "w-[240px] h-[180px] sm:w-[280px] sm:h-[210px] lg:w-[333.264px] lg:h-[246.468px]"
      }
    `}
  >
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-opacity duration-300"
    />
  </div>
);

export const ScrollingRow = ({
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
              alt={brand.alt}
              src={brand.src}
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