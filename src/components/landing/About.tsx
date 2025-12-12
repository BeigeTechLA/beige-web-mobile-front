"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { Stats } from "./Stats";

export const About = () => {
  const handleViewMore = () => {
    console.log('About: View More clicked');
  };

  return (
    <section id="about" className="py-20 md:py-32 relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start mb-32">
          {/* Left: Image/Video Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[600px] relative shrink-0"
          >
            <div className="relative aspect-square rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5">
              {/* Main Video/Image */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              >
                <source src="/videosnap.mp4" type="video/mp4" />
              </video>

              {/* Title Overlay in Image */}
              <div className="absolute top-10 left-10 right-10">
                <h3 className="text-4xl font-bold text-[#e8d1ab] mb-2 uppercase">LUCYPALOOZA</h3>
                <p className="text-sm text-[#e8d1ab]/70 uppercase tracking-widest">PRESENTED BY PASSES</p>
              </div>

              {/* Overlay Badge */}
              <div className="absolute bottom-10 left-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[12px] px-4 py-3 flex flex-col items-start min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-white text-xs font-medium tracking-wide">BETA LIVE NOW</span>
                  </div>
                  <p className="text-white/60 text-xs">Beige is the Future of Content</p>
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
            className="flex flex-col justify-center flex-grow pt-8"
          >
            {/* Label */}
            <div className="mx-auto lg:mx-0 inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
              <p className="text-base text-white">About Beige</p>
            </div>

            {/* Heading */}
            <h2 className="mx-auto lg:mx-0 text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-8 tracking-tight">
              Where Culture Gets Captured. <br />
              Instantly.
            </h2>

            {/* Description */}
            <p className="mx-auto lg:mx-0 text-white/60 text-sm lg:text-base leading-relaxed max-w-[600px] mb-12 font-light">
              From cultural moments and IRL streams to music videos, corporate events, weddings, and films—book the perfect photographer, videographer, or livestream creator in minutes through our AI-powered content marketplace.
            </p>

            {/* View More Button */}
            <div className="flex justify-start">
              <Button
                onClick={handleViewMore}
                className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-[56px] pl-4 pr-2 rounded-[10px] text-xl font-medium flex items-center justify-between gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all min-w-[240px]"
              >
                <span className="pr-4">View More</span>

                {/* Right Dark Icon Box */}
                <div className="bg-[#1A1A1A] w-[48px] h-[48px] rounded-[10px] flex items-center justify-center">
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
