"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Button } from "@/src/components/landing/ui/button";
import { Container } from "@/components/ui/container";

export const WelcomeSection = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if video is in focus
  const isInView = useInView(containerRef, { amount: 0.6 });

  // Handle Vimeo Play/Pause via the postMessage API
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const message = JSON.stringify({
      method: isInView ? "play" : "pause",
    });

    iframe.contentWindow.postMessage(message, "*");
  }, [isInView]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Transform logic: Starts tilted (20deg), scales up (0.8 -> 1), and straightens to (0deg)
  const rotateX = useTransform(smoothProgress, [0, 0.4], [20, 0]);
  const scale = useTransform(smoothProgress, [0, 0.4], [0.8, 1]);
  const translateZ = useTransform(smoothProgress, [0, 0.4], [-100, 0]);

  const vimeoUrl = `https://player.vimeo.com/video/1060256619?api=1&autoplay=1&muted=1&loop=1&controls=1&title=0&byline=0&portrait=0&badge=0&autopause=0&playsinline=1&transparent=0&vimeo_logo=0`;

  return (
    <section className="py-10 lg:pt-50 lg:pb-32 bg-[#010101] overflow-hidden select-none">
      <Container>
        <div className="text-center mb-12 lg:mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl lg:text-[58px] leading-tight font-bold text-gradient-white mb-2"
          >
            Welcome to the Beige<br />Creative Partners Ambassador Program
          </motion.h1>

          <motion.h4
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-base lg:text-[32px] leading-tight text-white/70 mb-4 lg:mb-8"
          >
            Join a global movement of creators shaping the future of video.
          </motion.h4>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex gap-6 mx-auto items-center justify-center"
          >
            <Button className="h-7 lg:h-15 px-5 lg:px-8 rounded-full bg-[#ECE1CE] text-black hover:bg-[#dcb98a] text-sm lg:text-xl">
              Join Us
            </Button>
            <Button className="bg-transparent border border-white/20 hover:bg-white/5 text-white h-7 lg:h-15 px-5 lg:px-9 text-sm lg:text-xl rounded-full flex items-center gap-3 w-fit transition-all group">
              How It Works
            </Button>
          </motion.div>
        </div>

        {/* Animation Perspective Wrapper */}
        <div
          ref={containerRef}
          className="w-full relative"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            style={{
              rotateX,
              scale,
              z: translateZ,
              transformStyle: "preserve-3d",
            }}
            className="w-full h-[320px] lg:h-[700px] overflow-hidden relative rounded-[10px] lg:rounded-[24px] border border-white/20 bg-black shadow-2xl"
          >
            {/* Screen Reflective Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />

            {/* Vimeo Iframe Implementation */}
            <iframe
              ref={iframeRef}
              src={vimeoUrl}
              className="absolute inset-0 w-full h-full z-10"
              allow="autoplay; fullscreen"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
};