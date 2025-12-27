"use client";

import { useRef, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import CreatorCard from "./CreatorCard";

interface Creator {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
}

interface SimilarCreatorsSectionProps {
  additionalCreators: Creator[];
  shootId?: string;
  contentTypes?: string; // comma-separated content types from URL params
}

// Helper to format content types for display
const formatContentTypesHeading = (contentTypes?: string): string => {
  if (!contentTypes) return "";
  
  const types = contentTypes.split(",").map(t => t.trim()).filter(Boolean);
  if (types.length === 0) return "";
  
  // Map content type keys to display names and pluralize
  const typeLabels: Record<string, string> = {
    videographer: "Videographers",
    photographer: "Photographers",
    cinematographer: "Cinematographers",
    all: "Creatives",
  };
  
  const displayTypes = types
    .filter(t => t !== "all") // Filter out "all" if other types are present
    .map(t => typeLabels[t.toLowerCase()] || `${t.charAt(0).toUpperCase()}${t.slice(1)}s`);
  
  // If only "all" was selected or no specific types
  if (displayTypes.length === 0) {
    return types.includes("all") ? "Creatives" : "";
  }
  
  // Join with "&" for 2 items, or ", " and "&" for 3+ items
  if (displayTypes.length === 1) {
    return displayTypes[0];
  } else if (displayTypes.length === 2) {
    return `${displayTypes[0]} & ${displayTypes[1]}`;
  } else {
    const last = displayTypes.pop();
    return `${displayTypes.join(", ")} & ${last}`;
  }
};

const SimilarCreatorsSection = ({
  additionalCreators,
  shootId,
  contentTypes,
}: SimilarCreatorsSectionProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  
  // Generate dynamic heading based on content types
  const headingText = useMemo(() => {
    const typeText = formatContentTypesHeading(contentTypes);
    return typeText ? `We Think You'll Love These ${typeText}` : "We Think You'll Love These";
  }, [contentTypes]);

  return (
    <section className="mt-14 lg:mt-30 overflow-hidden">
      <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
        {/* Header */}
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-xs md:text-base text-white">Similar Creators</p>
        </div>

        <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4">
          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
            {headingText}
          </h2>

          {/* NAV ARROWS (Desktop only) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="w-10 h-10 lg:w-22 lg:h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
            >
              <ArrowDownLeft className="w-4 lg:w-8 h-4 lg:h-8" />
            </button>

            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="w-10 h-10 lg:w-22 lg:h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
            >
              <ArrowUpRight className="w-4 lg:w-8 h-4 lg:h-8" />
            </button>
          </div>
        </div>

        {/* CAROUSEL */}
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          spaceBetween={24}
          slidesPerView={1.1}
          preventClicks={false}
          preventClicksPropagation={false}
          breakpoints={{
            768: { slidesPerView: 2 },
            1280: { slidesPerView: 3 },
          }}
          className="!overflow-visible lg:h-[584px]"
        >
          {additionalCreators.map((creator) => (
            <SwiperSlide key={creator.id}>
              {({ isActive }) => (
                <CreatorCard
                  {...creator}
                  shootId={shootId}
                  creatorId={creator.id}
                  isActive={isActive}
                />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default SimilarCreatorsSection;