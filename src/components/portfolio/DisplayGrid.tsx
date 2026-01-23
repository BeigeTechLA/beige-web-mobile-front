"use client";
import React from "react";
import { motion } from "framer-motion";

import Image from "next/image";

interface PortfolioHeroProps {
  category: string;
}

const PROJECT_IMAGES = [
  {
    name: "Music",
    src: "/images/categories/music.jpg"
  },
  {
    name: "Behind Scenes",
    src: "/images/categories/behind_scenes.jpg"
  },
  {
    name: "Brands & Products",
    src: "/images/categories/Brands&Products.jpg"
  },
  {
    name: "Commercial",
    src: "/images/categories/commercial.jpg"
  },
  {
    name: "People & Teams",
    src: "/images/categories/people_teams.jpg"
  },
  {
    name: "Podcast",
    src: "/images/categories/podcast.jpg"
  },
  {
    name: "Private",
    src: "/images/categories/private.jpg"
  },
  {
    name: "Short Film",
    src: "/images/categories/short_film.jpg"
  },
  {
    name: "Social Content",
    src: "/images/categories/social_content.jpg"
  },
  {
    name: "Wedding",
    src: "/images/categories/wedding.jpg"
  },
  {
    name: "Creator",
    src: "/images/creator.jpg"
  }
];

export const DisplayGrid = ({ category }: PortfolioHeroProps) => {

  return (
    <section
      className="p-10 lg:pt-30 lg:px-35"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-[58px] leading-tight font-medium text-gradient-white mb-2 lg:mb-5 capitalize"
      >
        {decodeURIComponent(category).split("-").join(" ")}
      </motion.h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
        {PROJECT_IMAGES.map((img) => (
          <div 
            key={img.name.toLowerCase().split(" ").join("_")}
            className="relative aspect-retro h-[150px] lg:h-[500px] 2xl:h-[600px] w-full rounded-xl overflow-hidden group cursor-pointer"
          >
            {/* The Image */}
            <Image
              src={img.src}
              alt={img.name}
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

    </section>
  );
};
