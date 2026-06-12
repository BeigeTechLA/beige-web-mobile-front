"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { SquareCheck, X } from "lucide-react";

interface StudioGalleryProps {
  items: string[];
  autoplay?: boolean;
  isDark?: boolean;
  coverImage?: string | null;
  onCoverSelect?: (image: string) => void;
}

const getValidImages = (items: string[]) => items.filter((item) => typeof item === "string" && item.trim());
const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(url.split("?")[0] || "");

export const StudioGallery = ({ items = [], coverImage = null, onCoverSelect }: StudioGalleryProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { damping: 30, stiffness: 200 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDragging = useRef(false);
  const pointerStartX = useRef(0);
  const progressAtStart = useRef(0);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    isDragging.current = true;
    pointerStartX.current = e.clientX;
    progressAtStart.current = progress.get();
  }, [progress]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - pointerStartX.current;
    const sensitivity = windowWidth < 768 ? 200 : 500; // Increased sensitivity for larger desktop cards
    progress.set(progressAtStart.current + deltaX / sensitivity);
  }, [progress, windowWidth]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    progress.set(Math.round(progress.get()));
  }, [progress]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("pointerdown", handlePointerDown as any);
    window.addEventListener("pointermove", handlePointerMove as any);
    window.addEventListener("pointerup", handlePointerUp as any);
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown as any);
      window.removeEventListener("pointermove", handlePointerMove as any);
      window.removeEventListener("pointerup", handlePointerUp as any);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  const galleryItems = getValidImages(items);
  const imageItems = galleryItems.filter(isImageUrl);
  const resolvedCover = coverImage && galleryItems.includes(coverImage) ? coverImage : imageItems[0] || galleryItems[0] || null;

  return (
    <section className="relative overflow-hidden select-none flex flex-col items-center justify-center lg:min-h-[850px] pb-10">
      <div
        ref={viewportRef}
        className="relative w-full h-[400px] md:h-[600px] lg:h-[800px] flex items-center justify-center [perspective:2000px] cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
          {galleryItems.map((item, i) => (
            <Card
              key={i}
              item={item}
              index={i}
              total={galleryItems.length}
              progress={smoothProgress}
              onSelect={() => setSelectedImage(item)}
              windowWidth={windowWidth}
              isCover={item === resolvedCover}
              canSetCover={isImageUrl(item)}
              onCoverSelect={onCoverSelect}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              className="absolute top-8 right-8 text-white/70 hover:text-white z-[110]"
              whileHover={{ scale: 1.1 }}
            >
              <X size={32} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-6xl h-[85vh] rounded-[20px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Preview" className="absolute inset-0 h-full w-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Card = ({ item, index, total, progress, onSelect, windowWidth, isCover, canSetCover, onCoverSelect }: any) => {
  const [isCentered, setIsCentered] = useState(false);

  useEffect(() => {
    // Helper function to update state based on current progress
    const updateCenteredState = (v: number) => {
      // Calculate current index with wrapping support
      let currentIndex = -Math.round(v) % total;
      // Handle negative modulo result
      if (currentIndex < 0) currentIndex += total;

      setIsCentered(currentIndex === index);
    };

    // Set initial state
    updateCenteredState(progress.get());

    // Subscribe to changes
    const unsubscribe = progress.on("change", updateCenteredState);
    return () => unsubscribe();
  }, [progress, index, total]);

  const offset = useTransform(progress, (p) => {
    let relOffset = (index + p) % total;
    if (relOffset > total / 2) relOffset -= total;
    if (relOffset < -total / 2) relOffset += total;
    return relOffset;
  });

  const getSpacing = () => {
    if (windowWidth >= 1024) return 540;
    if (windowWidth >= 768) return 350;
    return 270;
  };
  const spacing = getSpacing();
  const x = useTransform(offset, (o) => o * spacing);
  const z = useTransform(offset, (o) => Math.abs(o) * -300);
  const rotateY = useTransform(offset, (o) => o * 12);
  const opacity = useTransform(offset, [-3.5, -2.5, 0, 2.5, 3.5], [0, 1, 1, 1, 0]);
  const scale = useTransform(offset, (o) => 1 - Math.abs(o) * 0.05);

  return (
    <motion.div
      style={{
        x,
        z,
        rotateY,
        opacity,
        scale,
        transformOrigin: "center center",
        backfaceVisibility: "hidden",
      }}
      onClick={onSelect}
      className="absolute rounded-[20px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] cursor-pointer group w-[250px] h-[300px] md:w-[320px] md:h-[450px] xl:w-[500px] lg:h-[650px]"
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
        <img src={item} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      {/* <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-black/30" /> */}
      <motion.div 
        initial={false}
        animate={{ opacity: isCentered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{ 
          background: "linear-gradient(180deg, rgba(0,0,0,0) 65%, #000 100%)"
        }}
      />
      <div className="absolute inset-0 z-10 border-[1.5px] border-white/5 rounded-[20px]" />

      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 transition-opacity ${
          isCentered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isCover ? (
          <div className="flex gap-1.5 items-center rounded-full bg-black/45 px-3 py-1.5 text-[#E8D1AB] text-xs md:text-sm backdrop-blur-sm">
            <SquareCheck />
            Cover Image
          </div>
        ) : canSetCover && onCoverSelect ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCoverSelect(item);
            }}
            className="flex gap-1.5 items-center rounded-full bg-black/45 px-3 py-1.5 text-[#E8D1AB] text-xs md:text-sm backdrop-blur-sm whitespace-nowrap active:scale-95"
          >
            <SquareCheck />
            Set as Cover Image
          </button>
        ) : null}
      </div>
    </motion.div>
  );
};
