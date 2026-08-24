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

// Swiper JS Imports (Used for Grid view inner slides)
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { newshootTypes } from "@/app/data/shootData";

export interface ShootStat {
  label: string;
  value: string;
}

export type ShootTypeOption = (typeof newshootTypes)[number];

export interface ProcessedShootType extends ShootTypeOption {
  images: string[];
}

interface AskingOccasionProps {
  onContinue: (selectedOccasionId: string) => void;
  onBack?: () => void;
  initialSelected?: string;
}

const STUDIO_SHOOT_TYPE_KEY = "studio";
const STUDIO_SHOOT_TYPE_OPTION: ShootTypeOption = {
  key: STUDIO_SHOOT_TYPE_KEY,
  title: "Studio",
  details: "Book a Beige studio by date and time",
  image:
    "https://d2jhn32fsulyac.cloudfront.net/assets/studio/hollywood-hills/living-room-2.png",
  stats: [],
};

const withStudioOption = (types: ShootTypeOption[]): ShootTypeOption[] => {
  const nonStudioTypes = types.filter(
    (type) => type.key !== STUDIO_SHOOT_TYPE_KEY && type.key !== "coachella"
  );
  return [STUDIO_SHOOT_TYPE_OPTION, ...nonStudioTypes];
};

export const AskingOccasion: React.FC<AskingOccasionProps> = ({
  onContinue,
  onBack,
  initialSelected = "corporate",
}) => {
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");

  // Derive initial shoot types list directly from withStudioOption
  const [availableShootTypes] = useState<ShootTypeOption[]>(() =>
    withStudioOption(newshootTypes)
  );

  // Transform options so every item has an `images` array with 4 duplicate copies of `image`
  const occasions: ProcessedShootType[] = availableShootTypes.map((type) => ({
    ...type,
    images: Array(4).fill(type.image),
  }));

  const initialIdx = Math.max(
    0,
    occasions.findIndex((item) => item.key === initialSelected)
  );

  const [selectedId, setSelectedId] = useState<string>(initialSelected);
  const [activeCarouselIndex, setActiveCarouselIndex] =
    useState<number>(initialIdx);
  const [sampleImageIndex, setSampleImageIndex] = useState<number>(0);

  // Mouse Drag / Swipe gesture handler
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
      // Swiped Left -> Move to Next Slide
      if (activeCarouselIndex < occasions.length - 1) {
        const nextIdx = activeCarouselIndex + 1;
        setActiveCarouselIndex(nextIdx);
        setSelectedId(occasions[nextIdx].key);
        setSampleImageIndex(0);
      }
    } else if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      // Swiped Right -> Move to Previous Slide
      if (activeCarouselIndex > 0) {
        const prevIdx = activeCarouselIndex - 1;
        setActiveCarouselIndex(prevIdx);
        setSelectedId(occasions[prevIdx].key);
        setSampleImageIndex(0);
      }
    }
  };

  // Sub-component for individual card swiper in Grid View
  const GridCard = ({ occasion }: { occasion: ProcessedShootType }) => {
    const isSelected = selectedId === occasion.key;

    return (
      <div
        onClick={() => setSelectedId(occasion.key)}
        className={`group relative rounded-2xl p-4 bg-[#101010] border transition-all duration-300 cursor-pointer flex flex-col justify-between ${isSelected
            ? "border-[#E8D1AB]"
            : "border-white/20 hover:border-white/50"
          }`}
      >
        <div className="space-y-4">
          {/* Swipable Image Container */}
          <div className="relative w-full h-30 lg:h-[152px] rounded-lg overflow-hidden bg-black/40 select-none">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation={{
                nextEl: `.grid-next-${occasion.key}`,
                prevEl: `.grid-prev-${occasion.key}`,
              }}
              pagination={{ clickable: true, dynamicBullets: true }}
              loop
              className="w-full h-full [&_.swiper-pagination-bullet]:bg-white/60 [&_.swiper-pagination-bullet-active]:bg-white"
            >
              {occasion.images.map((img, idx) => (
                <SwiperSlide key={idx} className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={occasion.title}
                    fill
                    className="object-cover transition-all duration-300"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Selection Badge */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center z-20">
                <Check className="w-4 h-4 stroke-2" />
              </div>
            )}

            {/* Navigation Overlay Arrows */}
            <button
              type="button"
              className={`grid-prev-${occasion.key} absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`grid-next-${occasion.key} absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card Details */}
          <div className="text-center select-none">
            <h3 className="text-lg lg:text-[26px] font-['Roboto_Condensed'] font-medium text-white mb-4">
              {occasion.title}
            </h3>
            <p className="text-sm lg:text-base text-white/70 font-light truncate">
              {occasion.details}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const activeOccasion = occasions[activeCarouselIndex] || occasions[0];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between select-none">
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
            STEP 02
          </span>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
            <div className="h-full w-2/5 bg-[#E8D1AB] transition-all duration-300" />
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div>
            {/* Section Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
              What's the occasion?
            </h1>
            <p className="text-white/30 text-base md:text-xl font-light mb-8">
              This helps us frame the right approach for your shoot.
            </p>
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center bg-transparent border border-white/20 rounded-2xl p-2.5 gap-1">
            <button
              type="button"
              onClick={() => setViewMode("carousel")}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "carousel"
                  ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border border-[#E8D1AB]"
                  : "text-white hover:text-white/80"
                }`}
              title="Arc Carousel View"
            >
              <PictureInPicture2 className="w-6 h-6" strokeWidth={1} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
                  ? "bg-[linear-gradient(180deg,#E8D1AB_0.1%,#FFF_168.26%)] text-black border border-[#E8D1AB]"
                  : "text-white hover:text-white/80"
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-6 h-6" strokeWidth={1} />
            </button>
          </div>
        </div>

        {/* CONDITIONAL VIEW RENDER */}
        <AnimatePresence mode="wait">
          {viewMode === "carousel" ? (
            <motion.div
              key="carousel-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center my-6 w-full overflow-visible"
            >
              {/* Draggable Semi-Circle Arc Container */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="relative w-full h-[220px] md:h-[300px] lg:h-[360px] flex justify-center items-center overflow-visible my-4 cursor-grab active:cursor-grabbing touch-none"
              >
                {occasions.map((item, index) => {
                  const offset = index - activeCarouselIndex;
                  const absOffset = Math.abs(offset);

                  // 1. Center-to-center offset incorporating card width (394px) + explicit gap space (~40px)
                  // Adjust 440 to 480 or higher if you want an even wider gap
                  const baseSpacing = 440;
                  const xOffset = offset * baseSpacing;

                  // Semi-circle math parameters
                  const isCenter = offset === 0;

                  // Spacing Calibration: 360px base step guarantees non-overlapping spacing (gap-10 feel)
                  // 2. Tighter curve and scaling to prevent wide cards from touching
                  const yOffset = Math.pow(absOffset, 1.8) * 35; // Slight downward dip
                  const rotate = offset * 6; // Subtler card angle
                  const scale = Math.max(0.70, 1 - absOffset * 0.15); // Scale down side cards slightly more
                  const opacity = Math.max(0, 1 - absOffset * 0.35);

                  // Render immediate adjacent cards
                  if (absOffset > 3) return null;

                  return (
                    <motion.div
                      key={item.key}
                      onClick={() => {
                        setActiveCarouselIndex(index);
                        setSelectedId(item.key);
                        setSampleImageIndex(0);
                      }}
                      initial={false}
                      animate={{
                        x: xOffset,
                        y: yOffset,
                        rotate: rotate,
                        scale: scale,
                        opacity: opacity,
                        zIndex: 50 - absOffset,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                      }}
                      className="absolute w-[240px] md:w-[320px] lg:w-[394px] h-[160px] md:h-[210px] lg:h-[280px] cursor-pointer select-none origin-center"
                    >
                      <div
                        className={`relative w-full h-full rounded-xl lg:rounded-2xl border transition-all duration-300 ${isCenter
                            ? "border-[#E8D1AB]"
                            : "border-white/10 hover:border-white/30"
                          }`}
                      >
                        <Image
                          src={
                            isCenter
                              ? item.images[sampleImageIndex] || item.images[0]
                              : item.image
                          }
                          alt={item.title}
                          fill
                          draggable={false}
                          className="object-cover select-none rounded-xl lg:rounded-2xl pointer-events-none"
                        />

                        {isCenter && selectedId === item.key && (
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-7 h-7 lg:h-11 lg:w-11 rounded-full bg-[#E8D1AB] text-black flex items-center justify-center z-20">
                            <Check className="w-4 h-4 lg:w-5 lg:h-5 stroke-2" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Active Info */}
              <div className="text-center mt-2 mb-5 lg:mb-10 select-none">
                <h3 className="text-xl lg:text-4xl font-bold font-['Roboto_Condensed'] text-[#E8D1AB] mb-2 lg:mb-6">
                  {activeOccasion.title}
                </h3>
                <p className="text-base md:text-2xl text-white/70 font-light">
                  {activeOccasion.details}
                </p>
              </div>

              {/* Sample Thumbnails */}
              <div className="flex items-center gap-3">
                {activeOccasion.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSampleImageIndex(idx)}
                    className={`relative w-16 h-12 md:w-20 lg:w-34 md:h-14 lg:h-18 rounded-xl overflow-hidden border transition-all cursor-pointer ${sampleImageIndex === idx
                        ? "border-white opacity-100"
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
              {occasions.map((item) => (
                <GridCard key={item.key} occasion={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => onContinue(selectedId)}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AskingOccasion;