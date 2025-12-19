"use client";

import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";

import MatchedCreatorCard from "./MatchedCreatorCard";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  role: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  isTopMatch?: boolean;
  matchScore?: number; // New: skill match score
  matchingSkills?: string[]; // New: which skills matched
}

interface HeroSectionProps {
  matchedCreators: Creator[];
  shootId?: string;
}

const HeroSection = ({ matchedCreators, shootId }: HeroSectionProps) => {
  /** Ensure Top Match starts in center */
  const creators = [...matchedCreators];

  const topMatchIndex = creators.findIndex((c) => c.isTopMatch);
  let initialSlide = 0;

  if (topMatchIndex > -1) {
    const [topMatch] = creators.splice(topMatchIndex, 1);
    initialSlide = Math.floor(creators.length / 2);
    creators.splice(initialSlide, 0, topMatch);
  }

  return (
    <section className="mb-14 lg:mb-30 overflow-hidden relative isolate">
      {/* Heading */}
      <div className="relative text-center py-8 lg:py-18 px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg lg:text-[64px] lg:leading-[76px] font-bold text-gradient-white mb-5">
            Here is Your Top Matched <br /> Creative Producer
          </h2>
          <p className="text-xs lg:text-base text-white/70 mx-auto">
            Here are the matches based on your preferences. Select the best fit for your project.
          </p>
        </motion.div>
      </div>

      {/* Swiper Wrapper */}
      <div className="relative max-w-[1500px] mx-auto z-10">
        {/* LEFT NAV */}
        <button className="creator-next absolute left-5 lg:left-[100px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowDownLeft className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
        </button>

        {/* RIGHT NAV */}
        <button className="creator-prev absolute right-5 lg:right-[100px] top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowUpRight className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
        </button>

        {/* Coverflow Carousel */}
        <Swiper
          modules={[EffectCoverflow, Navigation]}
          effect="coverflow"
          centeredSlides
          grabCursor
          initialSlide={initialSlide}
          loop={creators.length > 5}
          slidesPerView={3}
          spaceBetween={30}
          allowTouchMove={true}
          allowSlideNext={true}
          allowSlidePrev={true}
          preventClicks={false}
          preventClicksPropagation={false}
          slideToClickedSlide={true}
          coverflowEffect={{
            rotate: 15,
            stretch: 0,
            depth: 220,
            modifier: 1.6,
            slideShadows: false,
          }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 45,
            },
          }}
          navigation={{
            prevEl: ".creator-prev",
            nextEl: ".creator-next",
          }}
          className="w-full"
        >
          {creators.map((creator) => (
            <SwiperSlide
              key={creator.id}
              className="!flex justify-center"
            >
              <div className="w-[280px] lg:w-[320px] xl:w-[360px]">
                <MatchedCreatorCard
                  {...creator}
                  shootId={shootId}
                  creatorId={creator.id}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/*  SVG OVERLAY  */}
      <img
        src="/svg/HeroBanner.svg"
        alt="Decorative Overlay"
        className="absolute inset-0 w-full h-full object-cover z-[2] pointer-events-none"
      />
    </section>
  );
};

export default HeroSection;