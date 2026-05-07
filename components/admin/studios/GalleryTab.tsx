"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Mousewheel } from "swiper/modules";
import { Check } from "lucide-react";
import DottedDivider from "@/components/admin/DottedDivider";
import { getStudioImages, type StudioRecord } from "./studioDetailUtils";

import "swiper/css";
import "swiper/css/effect-coverflow";

export default function GalleryTab({ isDark, studio }: { isDark: boolean; studio?: StudioRecord | null }) {
    const galleryImages = getStudioImages(studio);
    const initialIndex = Math.floor(galleryImages.length / 2);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [coverIndex, setCoverIndex] = useState(initialIndex);

    return (
        <div className={`rounded-xl p-6 lg:p-8 ${isDark ? "bg-[#141414] border border-white/10" : "bg-white border border-[#E5E5E5]"}`}>

            {/* Title */}
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-[#101010]"}`}>
                Gallery
            </h3>

        
         <DottedDivider />

            {/* Swiper Carousel */}
            <div className="relative py-4">
                <Swiper
                    effect="coverflow"
                    grabCursor
                    centeredSlides
                    slidesPerView={3}
                    initialSlide={initialIndex}
                    loop={galleryImages.length >= 5}
                    mousewheel={{ forceToAxis: true }}
                    coverflowEffect={{
                        rotate: 45,
                        stretch: 0,
                        depth: 120,
                        modifier: 1,
                        slideShadows: false,
                    }}
                    modules={[EffectCoverflow, Mousewheel]}
                    onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                    className="w-full"
                >
                    {galleryImages.map((img, index) => (
                        <SwiperSlide key={img.id} className="flex items-center justify-center">
                            <div className="relative w-[200px] h-[260px] md:w-[280px] md:h-[360px] rounded-[20px] overflow-hidden">
                                <img
                                    src={img.url}
                                    alt={img.label}
                                    className="w-full h-full object-cover"
                                />

                                {/* Cover image badge — only on active/center slide */}
                                {index === activeIndex && (
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
                                        <button
                                            onClick={() => setCoverIndex(index)}
                                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${coverIndex === index
                                                    ? "bg-[#E5D5B8] border-[#E5D5B8]"
                                                    : "border-white/40 bg-transparent"
                                                }`}
                                        >
                                            {coverIndex === index && <Check size={10} className="text-black" />}
                                        </button>
                                        <span className="text-white text-xs font-medium">Set as Cover Image</span>
                                    </div>
                                )}

                                {/* User avatar — only on active slide */}
                                {index === activeIndex && (
                                    <div className="absolute bottom-12 right-3 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold border-2 border-white/20">
                                        D
                                    </div>
                                )}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
