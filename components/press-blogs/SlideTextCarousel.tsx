"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, EffectFade } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/effect-fade";

export interface CarouselSlideItem {
  id: string;
  bgImage: string;
  thumbnailImage: string;
  title: string;
  description: React.ReactNode;
  actionUrl?: string;
  actionText?: string;
}

interface SlideTextCarouselProps {
  slides: CarouselSlideItem[];
}

export const SlideTextCarousel: React.FC<SlideTextCarouselProps> = ({ slides }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);

  if (!slides || slides.length === 0) return null;

  console.log(slides);
  

  return (
    <div className="w-full my-12 space-y-4 select-none">
      {/* Main Swiper Slider */}
      <div className="relative w-full h-[450px] md:h-[550px] lg:h-[620px] rounded-2xl overflow-hidden group shadow-2xl">
        <Swiper
          modules={[Navigation, Thumbs, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={600}
          navigation={{
            nextEl: ".custom-swiper-next",
            prevEl: ".custom-swiper-prev",
          }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          className="w-full h-full"
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={slide.id || `main-slide-${idx}`} className="relative w-full h-full">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                {slide.bgImage ? (
                  <Image
                    src={slide.bgImage}
                    alt={slide.title || "Carousel slide"}
                    fill
                    priority={idx === 0}
                    className="object-cover object-center"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                  />
                ) : null}
                {/* Dark Gradient Overlay for High Contrast Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
              </div>

              {/* Text Content Overlay */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8 md:px-20 lg:px-32 max-w-5xl mx-auto space-y-4">
                {slide.title && (
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-wide text-white drop-shadow-md">
                    {slide.title}
                  </h3>
                )}

                {slide.description && (
                  <div className="text-sm md:text-base lg:text-lg text-white/90 font-medium max-w-3xl leading-relaxed drop-shadow">
                    {slide.description}
                  </div>
                )}

                {slide.actionUrl && (
                  <a
                    href={slide.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-7 rounded-lg font-semibold bg-[#E8D1AB] px-5 text-sm text-black hover:bg-[#dcb98a] lg:h-15 lg:px-8 lg:text-xl transition-colors my-4 font-['Instrument_Sans']"
                  >
                    {slide.actionText || "Learn More"}
                  </a>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button
          aria-label="Previous Slide"
          className="custom-swiper-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <button
          aria-label="Next Slide"
          className="custom-swiper-next absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer opacity-80 hover:opacity-100"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      {/* Thumbnail Navigation Row */}
      <div className="flex justify-center max-w-2xl mx-auto">
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={12}
          slidesPerView="auto"
          watchSlidesProgress
          className="thumbs-swiper flex justify-center py-2"
        >
          {slides.map((slide, idx) => (
            <SwiperSlide
              key={`thumb-${slide.id || idx}`}
              className="!w-20 !h-14 sm:!w-24 sm:!h-16 rounded-lg overflow-hidden cursor-pointer border border-transparent opacity-50 transition-all duration-200 [.swiper-slide-thumb-active&]:border-[#E8D1AB] [.swiper-slide-thumb-active&]:opacity-100 [.swiper-slide-thumb-active&]:scale-105"
            >
              {/* Thumbnail Image */}
              <div className="relative w-full h-full bg-neutral-800">
                {(slide.thumbnailImage || slide.bgImage) ? (
                  <Image
                    src={slide.thumbnailImage || slide.bgImage}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default SlideTextCarousel;