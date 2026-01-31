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
  SOCIAL_IMAGES,
  SOCIAL_CONTENT_VIDEOS,
  WEDDING_VIDEOS,
  PODCAST_VIDEOS,
  MUSIC_VIDEOS,
  CORPORATE_VIDEOS,
  COMMERCIAL_VIDEOS,
  PRIVATE_VIDEOS,
  SHORT_FILMS_VIDEO,
} from "@/app/data/useCaseData";

interface PortfolioHeroProps {
  type: string;
  category: string;
}

// Map for Photography
const PHOTO_MAP: Record<string, { name: string; src: string }[]> = {
  "behind-the-scenes": BTS_IMAGES,
  "private-events": PRIVATE_IMAGES,
  "corporate": CORPORATE_IMAGES,
  "weddings": WEDDING_IMAGES,
  "food": FOOD_IMAGES,
  "products": BRAND_IMAGES,
  "people-teams": PEOPLE_IMAGES,
  "social-content": SOCIAL_IMAGES,
};

// Map for Videography
const VIDEO_MAP: Record<string, { title: string; video: string }[]> = {
  "corporate": CORPORATE_VIDEOS,
  "private-events": PRIVATE_VIDEOS,
  "music-videos": MUSIC_VIDEOS,
  "social-content": SOCIAL_CONTENT_VIDEOS,
  "podcast": PODCAST_VIDEOS, // Note: your config uses 'podcast' (singular)
  "short-films-narratives": SHORT_FILMS_VIDEO,
  "commercial-advertising": COMMERCIAL_VIDEOS,
  "weddings": WEDDING_VIDEOS,
};

export const DisplayGrid = ({ type, category }: PortfolioHeroProps) => {
  const activeCategoryKey = category.toLowerCase();
  const isVideo = type === "video";

  // Select the correct data source based on type
  const itemsToDisplay = isVideo
    ? (VIDEO_MAP[activeCategoryKey] || [])
    : (PHOTO_MAP[activeCategoryKey] || []);

  const label = decodeURIComponent(category).split("-").join(" ");

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
        {itemsToDisplay.map((item, index) => (
          <div
            key={`${activeCategoryKey}-${index}`}
            className={`relative rounded-xl overflow-hidden group bg-white/5  h-[300px] ${isVideo ? "aspect-video lg:h-[350px] border border-white/10" : "aspect-retro lg:h-[500px] 2xl:h-[600px]"  } w-full`}
          >
            {isVideo ? (
              /* --- VIDEO RENDERER --- */
              <iframe
                src={`https://player.vimeo.com/video/${(item as any).video}?badge=0&autopause=0&muted=0&loop=1&controls=1&title=1&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                title={(item as any).title}
              />
            ) : (
              /* --- PHOTO RENDERER --- */
              <>
                <Image
                  src={(item as any).src}
                  alt={`${activeCategoryKey}-${index}`}
                  fill
                  quality={95}
                  // unoptimized={true}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 6}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute left-6 bottom-6 uppercase text-xs lg:text-base font-semibold text-white translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300 tracking-wider">
                  {(item as any).name}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Empty State fallback */}
      {itemsToDisplay.length === 0 && (
        <div className="py-20 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
          <p className="text-xl">No {type} content found for this category.</p>
        </div>
      )}
    </section>
  );
};