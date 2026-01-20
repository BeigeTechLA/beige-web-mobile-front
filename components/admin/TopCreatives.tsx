"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

const PARTNERS_DATA = [
  {
    id: 1,
    name: "Lana Guzman",
    email: "lana.guzman@emailhub.com",
    earnings: "$14,400",
    image: "/images/crew/CREW(2).png",
    bgColor: "bg-blue-200",
  },
  {
    id: 2,
    name: "Ryan Smith",
    email: "ryan.smith@emailhub.com",
    earnings: "$12,000",
    image: "/images/crew/CREW(3).png",
    bgColor: "bg-green-200",
  },
  {
    id: 3,
    name: "Marcus Wright",
    email: "marcus.w@emailhub.com",
    earnings: "$10,500",
    image: "/images/crew/CREW(4).png",
    bgColor: "bg-orange-100",
  },
  {
    id: 4,
    name: "John Wright",
    email: "john.w@emailhub.com",
    earnings: "$10,100",
    image: "/images/crew/CREW(1).png",
    bgColor: "bg-orange-100",
  },
  {
    id: 5,
    name: "Myra Guzman",
    email: "myra.g@emailhub.com",
    earnings: "$9800",
    image: "/images/crew/CREW(6).png",
    bgColor: "bg-orange-100",
  },
];

export const TopCreatives = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to center
  const activePartner = PARTNERS_DATA[activeIndex];

  return (
    <div className="w-full bg-[#171717] rounded-2xl overflow-hidden text-white border border-[#3D3D3D]">
      {/* Header section */}
     <div className="bg-[#101010] rounded-2xl flex justify-between items-center mb-4 border-b border-b-[#3D3D3D] p-5 ">
       <div className="flex items-center gap-2">
          <div className="w-[3px] h-6 bg-[#E5D5B8]" />
          <h2 className="">Top Creative Partners</h2>
        </div>
        <button className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 hover:bg-white/5 transition-colors">
          Month <ChevronDown size={14} />
        </button>
      </div>

      {/* Slider Section */}
      <div className="relative">
        <Swiper
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={3}
          initialSlide={1}
          loop={true}
          spaceBetween={10}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false,
          }}
          modules={[EffectCoverflow]}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="w-full"
        >
          {PARTNERS_DATA.map((partner, index) => (
            <SwiperSlide key={partner.id} className="flex items-center justify-center">
              <div
                className={`relative w-full h-full md:!w-[280px] md:!h-[212px] rounded-[20px] overflow-hidden transition-all duration-500 ${partner.bgColor}`}
              >
                <Image
                  src={partner.image}
                  alt={partner.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Dynamic Data Display (Center Only) */}
      <div className="w-full flex justify-center gap-8 mt-3 pb-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium leading-tight">
            {activePartner.name}
          </h3>
          <p className="text-white/40 text-xs leading-tight">
            {activePartner.email}
          </p>
        </div>

        <div className="bg-[#E8D1AB] text-black px-8 py-2 rounded-full">
          <span className=" font-semibold leading-tight">{activePartner.earnings}</span>
        </div>
      </div>
    </div>
  );
};