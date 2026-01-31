"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Container } from "../../../components/ui/container";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// Use CP_DATA from your data file
import { CP_DATA } from "@/app/data/topCPData";

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
            {/* Swapping CREW_MEMBERS for CP_DATA */}
            {CP_DATA.map((member, index) => (
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
                        {/* {member.profilePicture ? ( */}
                          <Image
                            src={member.profilePicture || "/images/avater.png"}
                            alt={member.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 20vw"
                            className="object-cover object-top"
                            // Adding unoptimized because these are likely external Drive/S3 links
                            unoptimized
                          />
                        {/* ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            No Image
                          </div>
                        )} */}
                      </div>

                      {/* Info */}
                      <div className="mt-5 flex justify-between items-center px-6">
                        <div className="max-w-[80%]">
                          <h3 className="text-lg lg:text-2xl 2xl:text-3xl text-white tracking-tight truncate">
                            {member.name}
                          </h3>
                          <p className="text-sm lg:text-xl text-white tracking-tight">
                            {member.city}
                          </p>
                        </div>

                        {/* <Link href={`/creatives/${member.id}`}>
                          <ArrowUpRight size={24} />
                        </Link> */}
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