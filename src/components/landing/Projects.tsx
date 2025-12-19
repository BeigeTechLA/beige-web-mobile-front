"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

const PROJECTS = [
  {
    title: "Smiles Forever",
    description:
      "We collaborated with Smiles Forever Dental Clinic to produce heartfelt testimonials showcasing their patient-first mentality and professionalism that keeps every smile glowing.",
    image: "/images/projects/smiles.png",
  },
  {
    title: "Bear Robotics",
    description:
      "We showcased Bear Robotics cutting-edge foodservice robots through stunning visuals that captured their innovation, precision, and the real-world impact they're making in the industry.",
    image: "/images/projects/robots.png",
  },
  {
    title: "Rolls-Royce",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/rollsroyce.png",
  },
  {
    title: "Creator",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/creator.png",
  },
  {
    title: "Real-Estate",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/interior.png",
  },
];

export const Projects = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section id="find-work" className="py-10 lg:py-32 border-t border-white/5 relative overflow-hidden">
      <Container className="overflow-hidden">

        {/* Header */}
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-xs md:text-base text-white">Our Projects</p>
        </div>

        {/* Title + Nav */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-5 md:mb-16 gap-8">
          <div>
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-4 tracking-tight">
              #Shot On Beige
            </h2>
            <p className="text-white/50 text-xs lg:text-base font-light max-w-2xl">
              Highlighting standout work crafted by our top creators across
              diverse industries and styles.
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
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-white/20 transition-all duration-500 h-[300px] lg:h-[676px]">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-[#010101]/40 to-transparent opacity-90" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-base lg:text-3xl font-bold text-white mb-1.5 md:mb-3">
                      {project.title}
                    </h3>
                    <p className="text-white/60 text-xs lg:text-base leading-relaxed line-clamp-4 group-hover:text-white/80 transition-colors duration-300">
                      {project.description}
                    </p>
                  </div>
                </div>
              </motion.div>
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