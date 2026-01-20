"use client";

import React from "react";

import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

export const WelcomeSection = () => {
  const vimeoSrc = `https://player.vimeo.com/video/1156378139?autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=1&vimeo_logo=0`;

  return (
    <section id="welcome" className="py-10 md:py-32 relative overflow-hidden">
      <Container>
        <div className="flex items-center gap-10 justify-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-2/5 flex flex-col max-w-4xl text-center justify-center items-center flex-grow lg:pt-8"
          >
            {/* Heading */}
            <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight text-center lg:text-left">
              Welcome to Beige
              {/* What is Beige? */}
            </h2>

            <p className="mx-auto lg:mx-0 text-white/60 text-xs lg:text-base leading-relaxed max-w-[600px] font-medium text-center lg:text-left">
            with Cedric the Entertainer & CEO Kawser
              {/* From Cedric the Entertainer and CEO Kawser */}
             {/* Cedric the Entertainer & CEO Kawser introduce the future of creative production */}
             </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-3/5 relative shrink-0"
          >
            <div className="relative aspect-video rounded-[10px] lg:rounded-[20px] overflow-hidden bg-black border border-white/20 shadow-2xl">
              <iframe
                src={vimeoSrc}
                className="absolute inset-0 w-full h-full pointer-events-none"
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
