"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export interface CarouselCardItem {
  title: React.ReactNode;
  description: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  linkHref?: string;
}

interface CardCarouselProps {
  items: CarouselCardItem[];
}

export const CardCarousel: React.FC<CardCarouselProps> = ({ items }) => {
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full my-12 px-8 lg:px-12">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={24}
        slidesPerView={1}
        loop={true}
        autoHeight={false}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        pagination={{
          el: paginationEl,
          clickable: true,
          bulletActiveClass: "!bg-white !opacity-100 !w-2.5 !h-2.5",
          bulletClass:
            "swiper-pagination-bullet !bg-white/30 !w-2 !h-2 transition-all duration-300 inline-block rounded-full cursor-pointer mx-1",
        }}
        navigation={{
          prevEl,
          nextEl,
        }}
        breakpoints={{
          640: { slidesPerView: 1.5 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: items.length >= 3 ? 3 : items.length },
        }}
        className="w-full !pb-14 !pt-2 [&_.swiper-wrapper]:items-stretch"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index} className="!h-auto flex">
            <div className="w-full h-full flex flex-col items-center text-center p-6 rounded-2xl bg-[#242323] border border-white/5 transition-all duration-300 overflow-hidden">
              {/* Conditional Image or Icon rendering */}
              {item.imageSrc && (
                <div className="relative w-full h-70 mb-5 rounded-xl overflow-hidden bg-transparent shrink-0">
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt || "Carousel image"}
                    fill
                    className="object-contain transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3 font-['Instrument_Sans'] [&_a]:text-white [&_a]:no-underline hover:[&_a]:underline">
                {item.title}
              </h3>

              {/* Description */}
              <div className="text-sm md:text-base text-white/80 font-medium leading-relaxed font-['Yrsa']">
                {item.description}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <button
        ref={(node) => setPrevEl(node)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#242323] border border-white/10 text-white/80 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 disabled:opacity-30 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        ref={(node) => setNextEl(node)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#242323] border border-white/10 text-white/80 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 disabled:opacity-30 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Container */}
      <div
        ref={(node) => setPaginationEl(node)}
        className="absolute bottom-2 left-0 right-0 flex items-center justify-center z-20 min-h-[12px]"
      />
    </div>
  );
};

export default CardCarousel;