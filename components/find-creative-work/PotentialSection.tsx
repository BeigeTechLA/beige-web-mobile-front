"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { motion } from "framer-motion";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";

export const Potential = () => {
  const router = useRouter();

  const cards = [
    { id: 1, title: "People", image: "/images/categories/people_teams.jpg" },
    { id: 2, title: "Short Film", image: "/images/categories/short_film.jpg" },
    { id: 3, title: "Social Content", image: "/images/categories/social_content.jpg" },
  ];

  return (
    <section id="Potential" className="py-10 md:py-20 lg:py-32 relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-24 items-center lg:items-start">
          {/* Left: Swiper Cards Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/3 relative shrink-0"
          >
            <div className="w-full max-w-[475px] aspect-[3/4] lg:h-[600px] lg:w-auto">
              <Swiper
                effect={"cards"}
                grabCursor={true}
                modules={[EffectCards, Autoplay]}
                className="w-full h-full"
              >
                {cards.map((card) => (
                  <SwiperSlide
                    key={card.id}
                    className="rounded-[10px] lg:rounded-[20px] overflow-hidden bg-zinc-900 border border-white/10 shadow-xl"
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        priority
                        className="object-cover opacity-80"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />

                      {/*Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>

          {/* Right: Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-2/3 flex flex-col justify-center flex-grow lg:pt-8"
          >

            {/* Heading */}
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight text-center lg:text-left">
              Unlock Your Potential
            </h2>

            {/* Description */}
            <p className="mx-auto lg:mx-0 text-white/60 text-xs md:text-base leading-relaxed mb-5 lg:mb-12 font-light text-center lg:text-left">
              This initiative is designed to empower videographers and photographers worldwide to elevate their careers, represent
              Beige at shoots, and drive more business while enjoying exclusive benefits. Whether you&apos;re just starting out or you&apos;re
              a seasoned professional, there&apos;s a place for you in our global community of creatives. Together, we&apos;re shaping a
              dynamic network that celebrates innovation, creativity, and collaboration. Let&apos;s build something amazing and
              make an impact on the world of visual storytelling!
            </p>

            {/* View More Button */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={() => router.push('/book-a-shoot')}
                className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4  pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
              >
                <span className="lg:pr-4 capitalize">How it Works</span>

                {/* Right Dark Icon Box */}
                <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-[5px] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="32"
                    viewBox="0 0 33 26"
                    fill="none"
                  >
                    <path
                      d="M0.801232 1.6025L2.40373 0L31.2487 12.82L2.40373 25.64L0.801231 24.0375L5.60873 12.82L0.801232 1.6025Z"
                      fill="#E8D1AB"
                    />
                  </svg>
                </div>
              </Button>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};