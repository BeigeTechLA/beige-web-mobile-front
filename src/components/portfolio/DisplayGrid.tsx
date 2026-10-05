"use client";

import React, { useState } from "react";
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
  // KEYNOTE_VIDEOS,
  REAL_ESTATE_VIDEOS,
  REAL_ESTATE_IMAGES,
} from "@/app/data/useCaseData";

interface PortfolioHeroProps {
  type: string;
  category: string;
}

interface VideoItem {
  title?: string;
  video: string;
}

interface PhotoItem {
  name: string;
  src: string;
}

// Map for Photography
const PHOTO_MAP: Record<string, PhotoItem[]> = {
  "behind-the-scenes": BTS_IMAGES,
  "private-events": PRIVATE_IMAGES,
  "corporate": CORPORATE_IMAGES,
  "weddings": WEDDING_IMAGES,
  "food": FOOD_IMAGES,
  "products": BRAND_IMAGES,
  "people-teams": PEOPLE_IMAGES,
  "social-content": SOCIAL_IMAGES,
  "real-estate": REAL_ESTATE_IMAGES,
};

// Map for Videography
const VIDEO_MAP: Record<string, VideoItem[]> = {
  corporate: CORPORATE_VIDEOS,
  "private-events": PRIVATE_VIDEOS,
  "music-videos": MUSIC_VIDEOS,
  "social-content": SOCIAL_CONTENT_VIDEOS,
  "podcast": PODCAST_VIDEOS,
  "short-films-narratives": SHORT_FILMS_VIDEO,
  "commercial-advertising": COMMERCIAL_VIDEOS,
  "weddings": WEDDING_VIDEOS,
  // "keynote": KEYNOTE_VIDEOS,
  "real-estate": REAL_ESTATE_VIDEOS,
};

// Helper function to handle Vimeo and YouTube embed formats (including Shorts)
const getVideoEmbedUrl = (videoSource: string): string => {
  if (!videoSource) return "";

  const str = String(videoSource).trim();

  // 1. YouTube Regex Match (supports watch, embed, v, shorts, youtu.be, and query parameters)
  const ytMatch = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/
  );

  const youtubeId = ytMatch ? ytMatch[1] : /^[a-zA-Z0-9_-]{11}$/.test(str) ? str : null;

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1&loop=1&playsinline=1&rel=0`;
  }

  // 2. Fallback / Default: Vimeo
  const vimeoIdMatch = str.match(/vimeo\.com\/(\d+)/);
  const vimeoId = vimeoIdMatch ? vimeoIdMatch[1] : str;

  return `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&muted=0&loop=1&controls=1&title=1&byline=0&portrait=0&playsinline=1&transparent=0&vimeo_logo=0`;
};

export const VideoCard = ({
  item,
  activeCategoryKey,
  index,
}: {
  item: VideoItem;
  activeCategoryKey: string;
  index: number;
}) => {
  const [hasError, setHasError] = useState(false);
  const embedUrl = getVideoEmbedUrl(item.video);

  return (
    <div className="relative rounded-xl overflow-hidden group bg-white/5 h-[300px] aspect-video lg:h-[350px] border border-white/10 w-full">
      {!hasError ? (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title={item.title || `${activeCategoryKey}-video-${index}`}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm">
          <p className="text-white/80 font-medium mb-3">
            {item.title || "Playback restricted on external site"}
          </p>
          <a
            href={item.video}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Watch on YouTube
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      )}

      {/* Persistent hover action link */}
      <a
        href={item.video}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1.5"
      >
        <span>Watch on YouTube</span>
        <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none">
          <path
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
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
        {itemsToDisplay.map((item, index) => {
          if (isVideo) {
            return (
              <VideoCard
            key={`${activeCategoryKey}-${index}`}
            item={item as VideoItem}
                activeCategoryKey={activeCategoryKey}
                index={index}
              />
            );
          }

          const photoItem = item as PhotoItem;
          return (
            <div
              key={`${activeCategoryKey}-${index}`}
              className="relative rounded-xl overflow-hidden group bg-white/5 h-[300px] aspect-retro lg:h-[500px] 2xl:h-[600px] w-full"
            >
                <Image
                src={photoItem.src}
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
                {photoItem.name}
                </p>
          </div>
          );
        })}
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