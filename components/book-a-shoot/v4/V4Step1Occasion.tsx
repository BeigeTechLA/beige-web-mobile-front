"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, LayoutGrid, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookingDataV4 } from "./types";

interface Props {
  data: BookingDataV4;
  updateData: (data: Partial<BookingDataV4>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface OccasionItem {
  key: string;
  title: string;
  details: string;
  image: string;
  gallery?: string[];
  stats?: { label: string; value: string }[];
}

export const OCCASIONS: OccasionItem[] = [
  {
    key: "corporate",
    title: "Corporate Event",
    details: "Conferences, summits, company offsites",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/corporate.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/corporate.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/commercial.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/people_teams.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/behind_scenes.jpg",
    ],
    stats: [
      { label: "People", value: "50-2K" },
      { label: "Duration", value: "3-8 hrs" },
    ],
  },
  {
    key: "wedding",
    title: "Weddings",
    details: "Ceremony and Reception",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/wedding.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/wedding.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/behind_scenes.jpg",
    ],
    stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" },
    ],
  },
  {
    key: "private",
    title: "Private Events",
    details: "Parties and Celebrations",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/private.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/wedding.jpg",
    ],
    stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" },
    ],
  },
  {
    key: "brand_product",
    title: "Brand & Products",
    details: "Product Photography, Campaigns",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/Brands&Products.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/Brands&Products.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/commercial.jpg",
    ],
    stats: [
      { label: "People", value: "N/A" },
      { label: "Duration", value: "3-8 hrs" },
    ],
  },
  {
    key: "social_content",
    title: "Social Content",
    details: "Instagram, LinkedIn, etc",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/social_content.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/social_content.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/behind_scenes.jpg",
    ],
    stats: [
      { label: "People", value: "50-300" },
      { label: "Duration", value: "6-10 hrs" },
    ],
  },
  {
    key: "people_teams",
    title: "People & Teams",
    details: "Headshots, Team Photos",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/people_teams.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/people_teams.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/corporate.jpg",
    ],
    stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" },
    ],
  },
  {
    key: "behind_scenes",
    title: "Behind-the-Scenes",
    details: "Candid Shots, Process",
    image: "https://d2jhn32fsulyac.cloudfront.net/assets/categories/behind_scenes.jpg",
    gallery: [
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/behind_scenes.jpg",
      "https://d2jhn32fsulyac.cloudfront.net/assets/categories/corporate.jpg",
    ],
    stats: [
      { label: "People", value: "10-100" },
      { label: "Duration", value: "2-5 hrs" },
    ],
  },
];

export const V4Step1Occasion: React.FC<Props> = ({
  data,
  updateData,
  onNext,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
  const selectedKey = data.shootType || "corporate";
  const selectedIndex = OCCASIONS.findIndex((o) => o.key === selectedKey);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  const handleSelectOccasion = (key: string) => {
    updateData({ shootType: key });
    setSelectedGalleryIdx(0);
  };

  const handleNextCarousel = () => {
    const nextIdx = (activeIndex + 1) % OCCASIONS.length;
    handleSelectOccasion(OCCASIONS[nextIdx].key);
  };

  const handlePrevCarousel = () => {
    const prevIdx = (activeIndex - 1 + OCCASIONS.length) % OCCASIONS.length;
    handleSelectOccasion(OCCASIONS[prevIdx].key);
  };

  const activeOccasion = OCCASIONS[activeIndex] || OCCASIONS[0];

  return (
    <div className="w-full flex flex-col items-center py-2 md:py-6 max-w-6xl mx-auto px-4">
      {/* Top Bar: Back Button, Step Indicator & Progress */}
      <div className="w-full flex flex-col space-y-4 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#A0A0A0] uppercase">
            STEP 02
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E5D5B8] w-[35%] rounded-full transition-all duration-300" />
        </div>
      </div>

      {/* Header Titles + View Toggle Button */}
      <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white tracking-tight leading-tight">
            What&apos;s the occasion?
          </h1>
          <p className="text-sm sm:text-base text-[#9E9E9E] font-normal leading-relaxed">
            This helps us frame the right approach for your shoot.
          </p>
        </div>

        {/* View Toggle (Carousel / 3D vs Grid) */}
        <div className="flex items-center self-start sm:self-auto bg-[#181818] border border-white/10 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("carousel")}
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "carousel"
              ? "bg-[#E5D5B8] text-[#121212] shadow-sm"
              : "text-white/50 hover:text-white"
              }`}

          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === "grid"
              ? "bg-[#E5D5B8] text-[#121212] shadow-sm"
              : "text-white/50 hover:text-white"
              }`}

          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: GRID VIEW (Image 2) */}
      {viewMode === "grid" && (
        <motion.div
          key="grid"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10"
        >
          {OCCASIONS.map((item) => {
            const isSelected = item.key === selectedKey;

            return (
              <div
                key={item.key}
                onClick={() => handleSelectOccasion(item.key)}
                style={{
                  background: "linear-gradient(180deg, #161616 0%, rgba(16, 16, 16, 0.5) 100%)",
                  backdropFilter: "blur(20px)",
                }}
                className={`group relative cursor-pointer rounded-[24px] overflow-hidden transition-all duration-300 border flex flex-col ${isSelected
                  ? "border-[#E5D5B8] shadow-lg shadow-[#E5D5B8]/10 ring-1 ring-[#E5D5B8]/50"
                  : "border-white/10 hover:border-white/20"
                  }`}
              >
                {/* Image Box */}
                <div className="relative w-full h-[180px] overflow-hidden bg-[#1c1c1c]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60" />

                  {/* Selected checkmark badge in top-right */}
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#E5D5B8] flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-[#121212] stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h3
                      className={`text-lg sm:text-xl font-serif font-medium tracking-tight mb-1 transition-colors ${isSelected ? "text-[#E5D5B8]" : "text-white"
                        }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8E8E8E] leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* VIEW MODE 2: 3D COVERFLOW CAROUSEL (Image 3) */}
      {viewMode === "carousel" && (
        <motion.div
          key="carousel"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="w-full flex flex-col items-center mb-10 overflow-hidden"
        >
          {/* 3D Angled Cards Carousel Stage */}
          <div className="relative w-full h-[320px] sm:h-[400px] flex items-center justify-center perspective-[1000px] select-none my-4">
            {OCCASIONS.map((item, idx) => {
              const diff = idx - activeIndex;
              const isCenter = diff === 0;
              const isLeft = diff === -1 || (activeIndex === 0 && idx === OCCASIONS.length - 1);
              const isRight = diff === 1 || (activeIndex === OCCASIONS.length - 1 && idx === 0);

              if (Math.abs(diff) > 2 && !isLeft && !isRight) return null;

              let transformStyle = "";
              let zIndex = 10;
              let opacity = 0.4;

              if (isCenter) {
                transformStyle = "translateX(0px) scale(1.05) rotateY(0deg)";
                zIndex = 30;
                opacity = 1;
              } else if (diff === -1 || (activeIndex === 0 && idx === OCCASIONS.length - 1)) {
                transformStyle = "translateX(-240px) scale(0.85) rotateY(25deg)";
                zIndex = 20;
                opacity = 0.5;
              } else if (diff === 1 || (activeIndex === OCCASIONS.length - 1 && idx === 0)) {
                transformStyle = "translateX(240px) scale(0.85) rotateY(-25deg)";
                zIndex = 20;
                opacity = 0.5;
              } else if (diff < -1) {
                transformStyle = "translateX(-420px) scale(0.7) rotateY(35deg)";
                zIndex = 10;
                opacity = 0.2;
              } else if (diff > 1) {
                transformStyle = "translateX(420px) scale(0.7) rotateY(-35deg)";
                zIndex = 10;
                opacity = 0.2;
              }

              return (
                <div
                  key={item.key}
                  onClick={() => handleSelectOccasion(item.key)}
                  style={{
                    transform: transformStyle,
                    zIndex,
                    opacity,
                    transition: "all 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                  className={`absolute w-[280px] sm:w-[360px] md:w-[420px] h-[220px] sm:h-[280px] rounded-3xl overflow-hidden cursor-pointer shadow-2xl border ${isCenter
                    ? "border-[#E5D5B8] ring-2 ring-[#E5D5B8]/40"
                    : "border-white/10"
                    }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="420px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {isCenter && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#E5D5B8] flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5 text-black stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrevCarousel}
              className="absolute left-2 sm:left-6 z-40 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNextCarousel}
              className="absolute right-2 sm:right-6 z-40 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Active Card Info Details */}
          <div className="text-center space-y-1.5 mt-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#E5D5B8] font-medium tracking-tight">
              {activeOccasion.title}
            </h2>
            <p className="text-sm text-[#999999]">
              {activeOccasion.details}
            </p>
          </div>

          {/* Gallery Thumbnails Below */}
          {activeOccasion.gallery && activeOccasion.gallery.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto p-2 no-scrollbar">
              {activeOccasion.gallery.map((thumbUrl, tIdx) => (
                <button
                  type="button"
                  key={tIdx}
                  onClick={() => setSelectedGalleryIdx(tIdx)}
                  className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${selectedGalleryIdx === tIdx
                    ? "border-[#E5D5B8] scale-105 ring-1 ring-[#E5D5B8]"
                    : "border-white/20 opacity-60 hover:opacity-90"
                    }`}
                >
                  <Image
                    src={thumbUrl}
                    alt={`Preview ${tIdx}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Bottom Navigation Buttons */}
      <div className="w-full flex justify-between items-center pt-8 border-t border-white/10">
        <button
          onClick={onBack}
          className="py-3.5 px-8 rounded-xl bg-transparent hover:bg-white/5 border border-white/20 text-white/90 hover:text-white font-medium text-base transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="py-4 px-10 rounded-xl bg-[#E5D5B8] hover:bg-[#d9c7a6] active:scale-[0.99] text-[#121212] font-semibold text-base transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
