"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ArrowLeft,
  LayoutGrid,
  Check,
  ChevronLeft,
  ChevronRight,
  PictureInPicture2,
} from "lucide-react";

export interface OccasionItem {
  id: string;
  title: string;
  description: string;
  images: string[];
}

const OCCASIONS: OccasionItem[] = [
  {
    id: "corporate",
    title: "Corporate Event",
    description: "Conferences, summits, company offsites",
    images: [
      "/images/occasions/corporate-1.jpg",
      "/images/occasions/corporate-2.jpg",
      "/images/occasions/corporate-3.jpg",
      "/images/occasions/corporate-4.jpg",
    ],
  },
  {
    id: "weddings",
    title: "Weddings",
    description: "Ceremony and Reception",
    images: [
      "/images/occasions/wedding-1.jpg",
      "/images/occasions/wedding-2.jpg",
      "/images/occasions/wedding-3.jpg",
      "/images/occasions/wedding-4.jpg",
    ],
  },
  {
    id: "private",
    title: "Private Events",
    description: "Parties and Celebrations",
    images: [
      "/images/occasions/private-1.jpg",
      "/images/occasions/private-2.jpg",
      "/images/occasions/private-3.jpg",
      "/images/occasions/private-4.jpg",
    ],
  },
  {
    id: "brand",
    title: "Brand & Products",
    description: "Product Photography, Campaigns",
    images: [
      "/images/occasions/brand-1.jpg",
      "/images/occasions/brand-2.jpg",
      "/images/occasions/brand-3.jpg",
      "/images/occasions/brand-4.jpg",
    ],
  },
  {
    id: "social",
    title: "Social Content",
    description: "Instagram, LinkedIn, etc",
    images: [
      "/images/occasions/social-1.jpg",
      "/images/occasions/social-2.jpg",
      "/images/occasions/social-3.jpg",
      "/images/occasions/social-4.jpg",
    ],
  },
  {
    id: "people",
    title: "People & Teams",
    description: "Headshots, Team Photos",
    images: [
      "/images/occasions/people-1.jpg",
      "/images/occasions/people-2.jpg",
      "/images/occasions/people-3.jpg",
      "/images/occasions/people-4.jpg",
    ],
  },
  {
    id: "bts",
    title: "Behind-the-Scenes",
    description: "Candid Shots, Process",
    images: [
      "/images/occasions/bts-1.jpg",
      "/images/occasions/bts-2.jpg",
      "/images/occasions/bts-3.jpg",
      "/images/occasions/bts-4.jpg",
    ],
  },
];

interface AskingOccasionProps {
  onContinue: (selectedOccasionId: string) => void;
  onBack?: () => void;
  initialSelected?: string;
}

export const AskingOccasion: React.FC<AskingOccasionProps> = ({
  onContinue,
  onBack,
  initialSelected = "corporate",
}) => {
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [selectedId, setSelectedId] = useState<string>(initialSelected);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const [sampleImageIndex, setSampleImageIndex] = useState<number>(0);

  // Handle Drag End to switch active index based on drag swipe distance & velocity
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 50;
    const velocityThreshold = 200;

    if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swiped Left -> Move Next
      if (activeCarouselIndex < OCCASIONS.length - 1) {
        const nextIdx = activeCarouselIndex + 1;
        setActiveCarouselIndex(nextIdx);
        setSelectedId(OCCASIONS[nextIdx].id);
        setSampleImageIndex(0);
      }
    } else if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      // Swiped Right -> Move Prev
      if (activeCarouselIndex > 0) {
        const prevIdx = activeCarouselIndex - 1;
        setActiveCarouselIndex(prevIdx);
        setSelectedId(OCCASIONS[prevIdx].id);
        setSampleImageIndex(0);
      }
    }
  };

  // Sub-component for individual card swiper in Grid View
  const GridCard = ({ occasion }: { occasion: OccasionItem }) => {
    const [imgIdx, setImgIdx] = useState(0);
    const isSelected = selectedId === occasion.id;

    const nextImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setImgIdx((prev) => (prev + 1) % occasion.images.length);
    };

    const prevImg = (e: React.MouseEvent) => {
      e.stopPropagation();
      setImgIdx(
        (prev) => (prev - 1 + occasion.images.length) % occasion.images.length
      );
    };

    return (
      <div
        onClick={() => setSelectedId(occasion.id)}
        className={`group relative rounded-2xl p-3 bg-[#141414] border transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? "border-[#E8D1AB] shadow-[0_0_20px_rgba(232,209,171,0.15)] ring-1 ring-[#E8D1AB]"
            : "border-white/10 hover:border-white/25"
        }`}
      >
        {/* Swipable Image Container */}
        <div className="relative w-full h-40 md:h-44 rounded-xl overflow-hidden mb-3 bg-black/40 select-none">
          <Image
            src={occasion.images[imgIdx]}
            alt={occasion.title}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-105"
          />

          {/* Selection Badge */}
          {isSelected && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center shadow-md z-10">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}

          {/* Left/Right Arrow Overlays on Hover */}
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={prevImg}
              className="w-7 h-7 rounded-full bg-black/60 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImg}
              className="w-7 h-7 rounded-full bg-black/60 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Carousel Indicators Dots */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {occasion.images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === imgIdx ? "bg-white w-3" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Details */}
        <div className="text-center pb-2 select-none">
          <h3 className="text-base font-['Cormorant_Garamond'] font-medium text-white mb-0.5">
            {occasion.title}
          </h3>
          <p className="text-xs text-white/50 font-light truncate">
            {occasion.description}
          </p>
        </div>
      </div>
    );
  };

  const activeOccasion = OCCASIONS[activeCarouselIndex];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-6">
          {onBack ? (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center bg-[#181818] border border-white/10 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setViewMode("carousel")}
              className={`flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer ${
                viewMode === "carousel"
                  ? "bg-[#252525] text-white border border-white/10"
                  : "text-white/40 hover:text-white/80"
              }`}
              title="Arc Carousel View"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#252525] text-white border border-white/10"
                  : "text-white/40 hover:text-white/80"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-widest text-white/60 uppercase block mb-2 font-['Instrument_Sans']">
            STEP 02
          </span>
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        {/* Section Heading */}
        <h1 className="text-4xl md:text-5xl font-['Cormorant_Garamond'] text-white mb-2 tracking-tight">
          What's the occasion?
        </h1>
        <p className="text-white/60 text-sm md:text-base font-light mb-10">
          This helps us frame the right approach for your shoot.
        </p>

        {/* CONDITIONAL VIEW RENDER */}
        <AnimatePresence mode="wait">
          {viewMode === "carousel" ? (
            <motion.div
              key="carousel-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center my-6"
            >
              {/* Draggable Arc / Curved Carousel Container */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="relative w-full h-[280px] md:h-[340px] flex items-center justify-center overflow-hidden perspective-1000 cursor-grab active:cursor-grabbing touch-pan-y select-none"
              >
                {OCCASIONS.map((item, index) => {
                  const offset = index - activeCarouselIndex;
                  const absOffset = Math.abs(offset);
                  const isCenter = offset === 0;

                  // Rotation and Positioning curves
                  const rotateZ = offset * 8;
                  const translateY = absOffset * 18;
                  const translateX = offset * 220;
                  const scale = isCenter
                    ? 1
                    : Math.max(0.7, 1 - absOffset * 0.15);
                  const opacity = Math.max(0.2, 1 - absOffset * 0.35);

                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => {
                        setActiveCarouselIndex(index);
                        setSelectedId(item.id);
                        setSampleImageIndex(0);
                      }}
                      animate={{
                        x: translateX,
                        y: translateY,
                        rotateZ: rotateZ,
                        scale: scale,
                        opacity: opacity,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                      }}
                      className={`absolute w-[240px] md:w-[320px] h-[160px] md:h-[210px] rounded-2xl overflow-hidden cursor-pointer border shadow-2xl transition-colors duration-300 pointer-events-auto ${
                        isCenter
                          ? "border-[#E8D1AB] ring-2 ring-[#E8D1AB]/30 z-30"
                          : "border-white/10 z-10 hover:border-white/30"
                      }`}
                    >
                      <Image
                        src={item.images[sampleImageIndex] || item.images[0]}
                        alt={item.title}
                        fill
                        draggable={false}
                        className="object-cover select-none pointer-events-none"
                      />

                      {/* Selected Check Indicator */}
                      {isCenter && selectedId === item.id && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Active Occasion Info Label */}
              <div className="text-center mt-2 mb-6 select-none">
                <h3 className="text-2xl font-['Cormorant_Garamond'] text-[#E8D1AB] mb-1">
                  {activeOccasion.title}
                </h3>
                <p className="text-xs md:text-sm text-white/50 font-light">
                  {activeOccasion.description}
                </p>
              </div>

              {/* 4 Sample Thumbnail Preview Strip */}
              <div className="flex items-center gap-3">
                {activeOccasion.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSampleImageIndex(idx)}
                    className={`relative w-16 h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                      sampleImageIndex === idx
                        ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB] scale-105"
                        : "border-white/10 opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt="Sample"
                      fill
                      className="object-cover select-none"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {OCCASIONS.map((item) => (
                <GridCard key={item.id} occasion={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-8 py-3.5 rounded-xl border border-white/20 bg-transparent text-white font-medium text-sm md:text-base hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={() => onContinue(selectedId)}
          className="px-10 py-3.5 rounded-xl bg-[#E8D1AB] text-[#121212] font-semibold text-sm md:text-base hover:bg-[#dfc498] active:scale-[0.98] transition-all duration-200 shadow-md cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AskingOccasion;