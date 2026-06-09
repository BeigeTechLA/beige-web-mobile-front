"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { X, Grid2X2 } from 'lucide-react';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import "swiper/css";
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface ImageGalleryProps {
  images: string[];
}

const StudioImages: React.FC<ImageGalleryProps> = ({ images }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for Portal
  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const openCarousel = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  if (!mounted) return null;

  const ModalContent = (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-300">
      <style jsx global>{`
        .swiper-button-next, .swiper-button-prev { color: white !important; }
        .swiper-pagination-fraction { color: white !important; }
        /* Forces the slide track to center horizontally */
        .main-gallery-swiper .swiper-wrapper {
          display: flex !important;
          align-items: center !important;
        }
      `}</style>

      <div className='max-w-7xl mx-auto pt-5'>
        {/* Header */}
        <div className="flex justify-between items-center p-6 text-white z-10">
          <span className="text-sm font-medium">
            {activeIndex + 1} / {images.length}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={32} />
          </button>
        </div>

        {/* Main Carousel Area */}
        <div className="flex-1 w-full flex flex-col justify-center items-center overflow-hidden">
          <Swiper
            modules={[Navigation, Pagination, Thumbs]}
            navigation
            pagination={{ clickable: true, type: 'fraction' }}
            // 2. Critical Centering Props
            centeredSlides={true}
            slidesPerView={1}
            initialSlide={activeIndex}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="w-full h-[75vh]"
          >
            {images.map((img, idx) => (
              <SwiperSlide key={idx} className="flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={img}
                    alt={`Slide ${idx}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Thumbs Gallery */}
          <div className="w-full max-w-2xl mx-auto px-4 mt-12 mb-8">
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={6}
              centeredSlides={true}
              slideToClickedSlide={true}
              watchSlidesProgress={true}
              modules={[Thumbs]}
              className="h-20"
            >
              {images.map((img, idx) => (
                <SwiperSlide
                  key={idx}
                  className="cursor-pointer opacity-30 transition-all duration-300 [&.swiper-slide-thumb-active]:opacity-100 [&.swiper-slide-thumb-active]:scale-110"
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover rounded-md border border-white/10" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="w-full mx-auto my-9">
      {/* --- Image Grid Layout (Keep your existing grid here) --- */}
      {/* --- Image Grid Layout --- */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[500px] rounded-[20px] overflow-hidden group">
        {/* Main Large Image (Left) */}
        <div
          className="md:col-span-2 relative cursor-pointer overflow-hidden rounded-[20px]"
          onClick={() => openCarousel(0)}
        >
          <img
            src={images[0]}
            alt="Main studio"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Right Side Grid */}
        <div className="hidden md:grid md:col-span-2 grid-cols-2 grid-rows-2 gap-2">
          {images.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="relative cursor-pointer overflow-hidden rounded-[20px]"
              onClick={() => openCarousel(idx + 1)}
            >
              <img
                src={img}
                alt={`Studio detail ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />

              {/* "Show All" Button Overlay on the last visible image */}
              {idx === 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCarousel(0);
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 border border-black bg-white  text-black px-4 py-2 rounded-lg font-medium text-sm shadow-xl hover:bg-gray-100 transition-colors z-10"
                >
                  <Grid2X2 size={16} />
                  Show all photos
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- Use Portal to render the modal at the root of the body --- */}
      {isOpen && createPortal(ModalContent, document.body)}
    </div>
  );
};

export default StudioImages;