"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { Stats } from "./Stats";
import { pushToDataLayer } from "@/lib/gtm";

export const About = () => {
  const router = useRouter();

  return (
    <section id="about" className="py-10 md:py-20 lg:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-24 items-start mb-8 lg:mb-32">
          {/* Left: Image/Video Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[600px] relative shrink-0"
          >
            <div className="relative aspect-square rounded-[10px] lg:rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5">
              {/* Main Video/Image */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                src="https://d2jhn32fsulyac.cloudfront.net/assets/videos/videosnap.mp4"
              />

              <div className="flex flex-col justify-end h-full p-5 lg:px-12 lg:py-6">
                {/* Overlay Badge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[12px] px-4 py-3 flex flex-col items-start w-full  text-xs lg:text-base">
                  <div className="flex items-center gap-2 mb-2 lg:mb-3">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-white font-medium tracking-wide">BETA LIVE NOW</span>
                  </div>
                  <p className="text-white/60">Beige is the Future of Content</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center flex-grow lg:pt-8"
          >
            {/* Label */}
            <div className="mx-auto lg:mx-0 inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
              <p className="text-xs md:text-base text-white">About Beige</p>
            </div>

            {/* Heading */}
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-8 tracking-tight text-center lg:text-left">
              Beige is the modern way to book a shoot.
            </h2>

            {/* Description */}
            <p className="mx-auto lg:mx-0 text-white/60 text-xs md:text-base leading-relaxed max-w-[600px] mb-5 lg:mb-12 font-light text-center lg:text-left">
              Choose your content type. Get matched with a creative team instantly. Book everything in one place
            </p>

            {/* View More Button */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={() => {
                  pushToDataLayer("book_shoot_started", {
                    type: "Action Tracking",
                    page_name: "Landing Page",
                    location_in_website: "about_landing_page",
                    duration_on_page: performance.now() / 1000,
                  });
                  router.push('/book-a-shoot')
                }}
                className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4  pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
              >
                <span className="lg:pr-4">Book a shoot</span>

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

        {/* Stats Section Integrated at Bottom */}
        <Stats />
      </Container>
    </section>
  );
};
