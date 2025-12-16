"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import CreatorCard from "./CreatorCard";

interface Creator {
  id: string;
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
}

interface SimilarCreatorsSectionProps {
  additionalCreators: Creator[];
  shootId?: string;
}

const SimilarCreatorsSection = ({
  additionalCreators,
  shootId,
}: SimilarCreatorsSectionProps) => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="mt-30 overflow-hidden">
      <div className="container mx-auto relative overflow-hidden">
        {/* Header */}
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-base text-white">Similar Creators</p>
        </div>

        <div className="flex items-center justify-between mb-8 pb-4">
          <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
            We Think You'll Love These
          </h2>

          {/* NAV ARROWS (Desktop only) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="w-22 h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
            >
              <ArrowDownLeft size={32} />
            </button>

            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="w-22 h-22 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
            >
              <ArrowUpRight size={32} />
            </button>
          </div>
        </div>

        {/* CAROUSEL */}
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          spaceBetween={24}
          slidesPerView={1.1}
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