"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

interface WelcomeSectionProps {
  videoId?: string;
  platform?: "vimeo" | "youtube";
}

export const WelcomeSection = ({
  videoId = "hp_teagAx6k", // Defaults to YouTube ID
  platform = "youtube",
}: WelcomeSectionProps) => {
  const sectionRef = useRef(null);

  // amount: 0.5 triggers play/pause state when 50% visible
  const isInView = useInView(sectionRef, { amount: 0.5 });

  const getVideoSrc = (
    id: string,
    type: "vimeo" | "youtube",
    shouldPlay: boolean
  ) => {
    if (type === "youtube") {
      // Extract video ID if full YouTube URL was passed
      const cleanId = id.includes("v=") ? id.split("v=")[1].split("&")[0] : id;
      return `https://www.youtube.com/embed/${cleanId}?autoplay=${
        shouldPlay ? 1 : 0
      }&mute=0&controls=1&loop=1&playlist=${cleanId}&enablejsapi=1&playsinline=1`;
    }

    return `https://player.vimeo.com/video/${id}?autoplay=${
      shouldPlay ? 1 : 0
    }&muted=0&loop=1&controls=1&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`;
  };

  return (
    <section id="welcome" className="py-10 md:py-20 lg:py-32 relative overflow-hidden" ref={sectionRef}>
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-10 justify-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-2/5 flex flex-col max-w-4xl text-center justify-center items-center flex-grow lg:pt-8"
          >
            {/* Heading */}
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block tracking-tight text-center lg:text-left">
              Welcome to Beige AI
            </h2>

            <p className="mx-auto lg:mx-0 text-white/60 text-xs md:text-base leading-relaxed max-w-[600px] mb-5 lg:mb-12 font-light text-center lg:text-left">
              with Cedric the Entertainer & CEO Kawser
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-3/5 relative shrink-0"
          >
            <div className="relative aspect-video rounded-[10px] lg:rounded-[20px] overflow-hidden bg-black border border-white/20 shadow-2xl">
              <iframe
                src={getVideoSrc(videoId, platform, isInView)}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                title={`${platform === "youtube" ? "YouTube" : "Vimeo"} Video`}
                style={{
                  border: "none",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};