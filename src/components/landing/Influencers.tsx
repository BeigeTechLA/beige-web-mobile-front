"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimationFrame, AnimatePresence, useSpring } from "framer-motion";
import Image from "next/image";
import { Container } from "../../../components/ui/container";

import { Instagram, Youtube, Music2 } from "lucide-react";
import { INFLUENCERS } from "@/app/data/influencerData";
import { SlidingHeading } from "./SlidingHeading";

export const Influencers = ({ autoplay = false }) => {
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { damping: 25, stiffness: 120 });
  const [activeIdx, setActiveIdx] = useState(0);

  const isDragging = useRef(false);

  // 1. DIRECTIONAL CURSOR LOGIC
  const handlePointerDown = () => { isDragging.current = true; };
  const handlePointerUp = () => { isDragging.current = false; };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;

    // Sensitivity factor: lower is slower/more controlled
    // movementX > 0 means cursor moved RIGHT, so we add to progress
    const sensitivity = 0.005;
    progress.set(progress.get() + e.movementX * sensitivity);
  }, [progress]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Arrow keys still work for accessibility
    if (e.key === "ArrowRight") progress.set(progress.get() + 0.5);
    if (e.key === "ArrowLeft") progress.set(progress.get() - 0.5);
  }, [progress]);

  useEffect(() => {
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePointerMove, handleKeyDown]);

  useAnimationFrame((time, delta) => {
    // Only autoplay if the user isn't currently interacting
    if (autoplay && !isDragging.current) {
      progress.set(progress.get() + delta * 0.0001);
    }

    const total = INFLUENCERS.length;
    // Normalized modulo logic for seamless center tracking
    const current = Math.round(-progress.get()) % total;
    const normalized = current < 0 ? current + total : current;
    if (normalized !== activeIdx) setActiveIdx(normalized);
  });

  const activeItem = INFLUENCERS[activeIdx];

  return (
    <section className="py-10 lg:py-32 bg-[#010101] overflow-hidden select-none flex flex-col items-center justify-center cursor-grab active:cursor-grabbing">
      {/* <div className="w-full max-w-[1400px] mx-auto px-4"> */}
      <Container>
        {/* HEADER */}
        <div className="text-center mb-6 lg:mb-20">
          {/* <div className="inline-flex items-center border-b border-t border-white/60 w-fit px-10 py-2 mb-5 md:mb-6">
            <p className="text-xs md:text-base text-white">Top Creators</p>
          </div> */}
          <SlidingHeading />
          <p className="text-xs lg:text-base text-white/50 max-w-[640px] mx-auto">
            Beige is trusted by the world&apos;s top influencers.
          </p>
        </div>

        {/* 3D Viewport */}
        <div className="relative h-[450px] w-full flex items-center justify-center [perspective:2000px]">
          <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
            {INFLUENCERS.map((item, i) => (
              <Card
                key={i}
                item={item}
                index={i}
                total={INFLUENCERS.length}
                progress={smoothProgress}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Info Panel */}
        <div className="mt-4 lg:mt-12 max-w-2xl mx-auto lg:min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h3 className="text-white text-2xl lg:text-5xl leading-[1.1] font-medium  mb-2 lg:mb-4">
                {activeItem?.name}
              </h3>

              <div className="flex flex-wrap justify-center items-center gap-6 mb-3">
                {
                  activeItem?.instagramFollowers &&
                  <SocialMetric icon={<Instagram size={20} />} label="IG" value={activeItem?.instagramFollowers} href={activeItem?.instagram} />
                }
                {
                  activeItem?.youtubeSubscribers &&
                  <SocialMetric icon={<Youtube size={20} />} label="YT" value={activeItem?.youtubeSubscribers} href={activeItem?.youtube} />
                }
                {
                  activeItem?.tiktokFollowers &&
                  <SocialMetric icon={<Music2 size={20} />} label="TK" value={activeItem?.tiktokFollowers} href={activeItem?.tiktok} />
                }
              </div>

              <p className="text-white/60 text-sm leading-relaxed max-w-lg mx-auto font-medium">
                {activeItem?.bio}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
      {/* </div> */}
    </section>
  );
};

const SocialMetric = ({ icon, label, value, href }: any) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group cursor-pointer">
    <span className="text-[#E8D1AB] group-hover:scale-120 transition-transform">{icon}</span>
    <span className="text-white/40 text-[10px] tracking-widest uppercase font-bold">{label}</span>
    <span className="text-white/80 text-sm lg:text-lg font-semibold">{value}</span>
  </a>
);

const Card = ({ item, index, total, progress }: any) => {
  const offset = useTransform(progress, (p) => {
    let relOffset = (index + p) % total;
    if (relOffset > total / 2) relOffset -= total;
    if (relOffset < -total / 2) relOffset += total;
    return relOffset;
  });

  const x = useTransform(offset, (o) => o * 240);
  const z = useTransform(offset, (o) => Math.abs(o) * -150);
  const rotateY = useTransform(offset, (o) => o * -18);
  const scale = useTransform(offset, (o) => 1.1 - Math.abs(o) * 0.1);
  const opacity = useTransform(offset, [-4, -3, 0, 3, 4], [0, 1, 1, 1, 0]);

  return (
    <motion.div
      style={{ x, z, rotateY, scale, opacity, transformOrigin: "center center", backfaceVisibility: "hidden" }}
      className="absolute w-[200px] h-[320px] lg:w-[240px] lg:h-[360px] rounded-[24px] overflow-hidden border border-white/10 shadow-2xl"
    >
      <div className="absolute inset-0">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
    </motion.div>
  );
};