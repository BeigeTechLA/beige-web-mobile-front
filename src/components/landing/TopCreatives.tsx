"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

import { Container } from "../../../components/ui/container";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const CREW_MEMBERS = [
  {
    name: "Alex Vance",
    id: "alex-vance",
    image: "/images/crew/CREW(1).png",
    city: "Los Angeles"
  },
  {
    name: "Isabella Chen",
    id: "isabella-chen",
    image: "/images/crew/CREW(2).png",
    city: "Pasadena"
  },
  {
    name: "Marcus Holloway",
    id: "marcus-holloway",
    image: "/images/crew/CREW(3).png",
    city: "Los Angeles"
  },
  {
    name: "Sophia Rossi",
    id: "sophia-rossi",
    image: "/images/crew/CREW(4).png",
    city: "New York City"
  },
  {
    name: "Julian Kade",
    id: "julian-kade",
    image: "/images/crew/CREW(5).png",
    city: "Fresno"
  },
  {
    name: "Elena Moretti",
    id: "elena-moretti",
    image: "/images/crew/CREW(7).png",
    city: "San Jose"
  },
  {
    name: "Xavier Knight",
    id: "xavier-knight",
    image: "/images/crew/CREW(8).png",
    city: "Los Angeles"
  },
  {
    name: "Amara Okafor",
    id: "amara-okafor",
    image: "/images/crew/CREW(9).png",
    city: "Oakland"
  },
  {
    name: "Liam Sterling",
    id: "liam-sterling",
    image: "/images/crew/CREW(10).png",
    city: "Bakersfield"
  },
  {
    name: "Chloe Naka",
    id: "chloe-naka",
    image: "/images/crew/CREW70.png",
    city: "San Jose"
  },
  {
    name: "Nat Drake",
    id: "nat-drake",
    image: "/images/crew/CREW71.png",
    city: "San Francisco"
  },
  {
    name: "Maya Sullivan",
    id: "maya-sullivan",
    image: "/images/crew/CREW72.png",
    city: "San Francisco"
  },
  {
    name: "Roman Volkov",
    id: "roman-volkov",
    image: "/images/crew/CREW74.png",
    city: "Oakland"
  },
  {
    name: "Sienna Brooks",
    id: "sienna-brooks",
    image: "/images/crew/CREW(6).png",
    city: "Pasadena"
  }
];

export const TopCreatives = ({ title, subtext = "" }: { title?: string, subtext?: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-10 lg:py-32 bg-[#010101] overflow-hidden select-none">
      <Container>
        {/* HEADER */}
        <div className="text-center mb-12 lg:mb-20">
          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-4 tracking-tight">
            {title || "Top Creative Partners"}
          </h2>

          {
            subtext && (
              <p className="text-white/50 text-xs lg:text-base max-w-[600px] mx-auto px-8 md:px-0">
                {subtext}
              </p>
            )
          }
        </div>

        {/* Swiper Container */}
        <div className="relative w-full">
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1.2}
            centeredSlides
            centeredSlidesBounds
            loop
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            navigation={{
              nextEl: ".next-btn",
              prevEl: ".prev-btn",
            }}
            breakpoints={{
              640: {
                slidesPerView: 3,
                centeredSlides: true,
                centeredSlidesBounds: true,
              },
              1200: {
                slidesPerView: 5,
                centeredSlides: true,
                centeredSlidesBounds: true,
              }
            }}
            className="!overflow-visible"
          >

            {CREW_MEMBERS.map((member, index) => (
              <SwiperSlide key={index} className="pb-8 flex justify-center"
                style={{ width: "372px" }}>
                {({ isActive }) => {
                  const diff = Math.abs(index - activeIndex);

                  const yOffset =
                    diff === 0 ? 0 :
                      diff === 1 ? 28 :
                        diff === 2 ? 56 :
                          72;

                  const scale =
                    diff === 0 ? 1.05 :
                      diff === 1 ? 0.98 :
                        diff === 2 ? 0.94 :
                          0.9;

                  return (
                    <div
                      className="transition-all duration-500 ease-out"
                      style={{
                        transform: `translateY(${yOffset}px) scale(${scale})`,
                        zIndex: 10 - diff,

                      }}
                    >

                      {/* Card */}
                      <div className="relative aspect-[380/475] overflow-hidden rounded-xl lg:rounded-[20px] w-full h-full">
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 20vw"
                          className="object-cover object-top"
                        />

                        {/* <div className="absolute top-0 right-5 bg-black lg:w-[53px] lg:h-[90px] w-12 h-20 flex items-center justify-center">
                          <Image
                            src="/images/logos/BeigeB.svg"
                            alt="Beige Logo"
                            fill
                          />
                        </div> */}
                      </div>

                      {/* Info */}
                      <div className="mt-5 flex justify-between items-center px-6">
                        <div>
                          <h3 className="text-lg lg:text-2xl 2xl:text-3xl text-white tracking-tight">
                            {member.name}
                          </h3>
                          <p className="text-sm lg:text-xl text-white tracking-tight">
                            {member.city}
                          </p>
                        </div>

                        <ArrowUpRight size={24} />
                      </div>
                    </div>
                  );
                }}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Controls */}
          <div className="flex justify-center items-center gap-6 mt-4">
            <button className="next-btn w-11 h-11 lg:w-22 lg:h-22 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all ">
              <ArrowDownLeft className="w-6 h-6 lg:w-[34px] lg:h-[34px]" />
            </button>
            <button className="prev-btn w-11 h-11 lg:w-22 lg:h-22 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all ">
              <ArrowUpRight className="w-6 h-6 lg:w-[34px] lg:h-[34px]" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
};