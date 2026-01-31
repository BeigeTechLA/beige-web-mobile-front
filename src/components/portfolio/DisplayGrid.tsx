"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import {
  BTS_IMAGES,
  PRIVATE_IMAGES,
  CORPORATE_IMAGES,
  WEDDING_IMAGES,
  FOOD_IMAGES,
  BRAND_IMAGES,
  PEOPLE_IMAGES,
  SOCIAL_IMAGES
} from "@/app/data/useCaseData"; // Adjust path as necessary

interface PortfolioHeroProps {
  category: string;
}

const CATEGORY_MAP: Record<string, { name: string, src: string }[]> = {
  "behind-the-scenes": BTS_IMAGES,
  "private-events": PRIVATE_IMAGES,
  "corporate": CORPORATE_IMAGES,
  "weddings": WEDDING_IMAGES,
  "food": FOOD_IMAGES,
  "products": BRAND_IMAGES,
  "people-teams": PEOPLE_IMAGES,
  "social-content": SOCIAL_IMAGES,
};

export const DisplayGrid = ({ category }: PortfolioHeroProps) => {
  const activeCategoryKey = category.toLowerCase();

  // Use the mapped array, or fallback to BTS_IMAGES if category doesn't match
  const imagesToDisplay = CATEGORY_MAP[activeCategoryKey] || BTS_IMAGES;

  return (
    <section className="p-10 lg:pt-30 lg:px-35">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-[58px] leading-tight font-medium text-gradient-white mb-2 lg:mb-5 capitalize"
      >
        {decodeURIComponent(category).split("-").join(" ")}
      </motion.h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
        {imagesToDisplay.map((img, index) => (
          <div
            key={`${activeCategoryKey}-${index}`}
            className="relative aspect-retro h-[150px] lg:h-[500px] 2xl:h-[600px] w-full rounded-xl overflow-hidden group cursor-pointer"
          >
            {/* The Image */}
            <Image
              src={img.src}
              alt={`${activeCategoryKey}-${index}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />

            <p className="absolute left-6 bottom-6 uppercase text-xs lg:text-base font-semibold text-white translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300 tracking-wider">
              {img.name}
            </p>
          </div>
        ))}
      </div>

      {/* Empty State fallback */}
      {imagesToDisplay.length === 0 && (
        <div className="py-20 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
          <p className="text-xl">No images found for this category.</p>
        </div>
      )}
    </section>
  );
};
