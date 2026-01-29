"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import CreatorCard from "./CreatorCard";
import { useGetRandomCreatorsQuery } from "@/lib/redux/features/creators/creatorsApi";
import type { Creator as BackendCreator } from "@/lib/types";

interface Creator {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  image: string;
  hourlyRate?: number;
  isTopMatch?: boolean;
}

interface RandomPartnersSectionProps {
  shootId?: string;
}

// Transform backend creator to frontend structure
const transformCreator = (c: BackendCreator): Creator => ({
  id: String(c.crew_member_id),
  name: c.name,
  role: c.role_name || "Creative Professional",
  rating: c.rating || 0,
  reviews: c.total_reviews || 0,
  image: c.profile_image || '/images/influencer/default.png',
  hourlyRate: c.hourly_rate || 0,
  isTopMatch: false,
});

const RandomPartnersSection = ({ shootId }: RandomPartnersSectionProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const { data: randomCreators, isLoading, error } = useGetRandomCreatorsQuery({ limit: 10 });

  // Don't render if loading, error, or no data
  if (isLoading || error || !randomCreators || randomCreators.length === 0) {
    return null;
  }

  const creators = randomCreators.map(transformCreator);

  return (
    <section className="mt-14 lg:mt-30 overflow-hidden">
      <div className="container mx-auto relative overflow-hidden px-5 lg:px-0">
        {/* Header */}
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-xs md:text-base text-white">Available Partners</p>
        </div>

        <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4">
          <div>
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
              Discover Other Available Partners
            </h2>
            <p className="text-white/60 text-sm md:text-base mt-2">
              Explore creative partners from different locations
            </p>
          </div>

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
          className="!overflow-visible h-[424px] lg:h-[590px] !p-[2px]"
        >
          {creators.map((creator) => (
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

export default RandomPartnersSection;
