"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

export const WelcomeSection = () => {
  const sectionRef = useRef(null);

  // amount: 0.5 triggers play/pause when 50% visible
  const isInView = useInView(sectionRef, { amount: 0.5 });
  const videoId = "1156378139";

  const vimeoSrc = (id: string, play: boolean) =>
    `https://player.vimeo.com/video/${id}?autoplay=${play ? 1 : 0}&muted=0&loop=1&controls=1&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`;

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
                src={vimeoSrc(videoId, isInView)}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Vimeo Video"
                style={{
                  border: 'none',
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
