"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { ProjectsData as PROJECTS } from "@/app/data/projectsData";
import ProjectCard from "./ProjectCard";

export const Projects = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section id="find-work" className="py-10 lg:py-32 border-t border-white/5 relative overflow-hidden">
      <Container className="overflow-hidden">

        {/* Header */}
        {/* <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-xs md:text-base text-white">Our Projects</p>
        </div> */}

        {/* Title + Nav */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-5 md:mb-16 gap-8">
          <div>
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-4 tracking-tight">
              #ShotOnBeige
            </h2>
            <p className="text-white/50 text-xs lg:text-base font-light max-w-2xl">
              Video content captured on Beige.
            </p>
          </div>

          {/* Desktop Nav arrows */}
          <div className="hidden md:flex">
            <NavArrows swiperRef={swiperRef} />
          </div>
        </div>

        {/* Swiper Carousel */}
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          loop
          spaceBetween={20}
          slidesPerView={1.1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1280: { slidesPerView: 2.5 },
          }}
          className="!overflow-visible"
        >
          {PROJECTS.map((project, i) => (
            <SwiperSlide key={i}>
              <ProjectCard key={i} project={project} i={i} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Mobile nav arrows */}
        <div className="flex md:hidden justify-start mt-6">
          <NavArrows swiperRef={swiperRef} />
        </div>
      </Container>
    </section>
  );
};

const NavArrows = ({ swiperRef }: { swiperRef: any }) => (
  <div className="flex gap-4">
    <button
      onClick={() => swiperRef.current?.slidePrev()}
      className="w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
    >
      <ArrowDownLeft className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
    </button>

    <button
      onClick={() => swiperRef.current?.slideNext()}
      className="w-9 h-9 lg:w-18 lg:h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
    >
      <ArrowUpRight className="text-white/60 w-4 h-4 lg:w-7 lg:h-7" />
    </button>
  </div>
);