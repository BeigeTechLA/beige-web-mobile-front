/* eslint-disable */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {motion, useMotionValue, useTransform, useSpring, AnimatePresence} from "framer-motion";
import type { MotionValue } from "framer-motion";
import { Loader2, X } from "lucide-react";

const S3_PREFIX = String(process.env.NEXT_PUBLIC_S3_PREFIX || "").replace(/\/+$/, "");

const resolveStudioMediaUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  if (!S3_PREFIX) return value;
  return `${S3_PREFIX}/${value.replace(/^\/+/, "")}`;
};

export interface StudioGalleryMediaItem {
  studio_media_id: string | number;
  url: string;
  sort_order: number;
  is_cover: boolean;
  media_type?: string;
}

interface StudioGalleryProps {
  items: StudioGalleryMediaItem[];
  autoplay?: boolean;
  isDark?: boolean;
  isUpdatingCover?: boolean;
  onSetCover: (mediaId: string | number) => Promise<void> | void;
}

type ResolvedGalleryItem = StudioGalleryMediaItem & {
  resolvedUrl: string;
};

export const StudioGallery = ({
  items = [],
  autoplay = false,
  isDark = false,
  isUpdatingCover = false,
  onSetCover,
}: StudioGalleryProps) => {
  void autoplay;

  const validItems = items
    .map((item) => ({ ...item, resolvedUrl: resolveStudioMediaUrl(item.url) }))
    .filter((item): item is ResolvedGalleryItem => {
      try {
        const parsed = new URL(item.resolvedUrl);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { damping: 30, stiffness: 200 });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  const itemOrderKey = validItems
    .map((item) => String(item.studio_media_id))
    .join("|");

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => {window.removeEventListener("resize", handleResize);};
  }, []);

  useEffect(() => {
    // Whenever the cover/order changes, index 0 is the active cover,
    // so return the carousel to the first card.
    progress.set(0);
  }, [itemOrderKey, progress]);

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

  if (validItems.length === 0) {
    return (
      <div
        className={`flex min-h-[300px] items-center justify-center rounded-2xl border ${
          isDark
            ? "border-[#333] text-white/50"
            : "border-[#E3E3E3] text-black/50"
        }`}
      >
        No gallery images available.
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden select-none flex flex-col items-center justify-center lg:min-h-[850px] pb-10">
      <div
        ref={viewportRef}
        className="relative w-full h-[400px] md:h-[600px] lg:h-[800px] flex items-center justify-center [perspective:2000px] cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
          {validItems.map((item, i) => (
            <Card
              key={i}
              item={item}
              index={i}
              total={validItems.length}
              progress={smoothProgress}
              onSelect={() => setSelectedImage(item.resolvedUrl)}
              onSetCover={onSetCover}
              isCover={item.is_cover}
              isUpdatingCover={isUpdatingCover}
              windowWidth={windowWidth}
              isDark={isDark}
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
              type="button"
              className="absolute top-8 right-8 text-white/70 hover:text-white z-[110]"
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-6xl h-[85vh] rounded-[20px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Preview" className="h-full w-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

interface CardProps {
  item: ResolvedGalleryItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onSelect: () => void;
  onSetCover: (mediaId: string | number) => Promise<void> | void;
  isCover: boolean;
  isUpdatingCover: boolean;
  windowWidth: number;
  isDark: boolean;
}

const Card = ({
  item,
  index,
  total,
  progress,
  onSelect,
  onSetCover,
  isCover,
  isUpdatingCover,
  windowWidth,
  isDark,
}: CardProps) => {
  const [isCentered, setIsCentered] = useState(false);

  useEffect(() => {
    const updateCenteredState = (v: number) => {
      let currentIndex = -Math.round(v) % total;
      if (currentIndex < 0) currentIndex += total;

      setIsCentered(currentIndex === index);
    };

    updateCenteredState(progress.get());

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
        <img
          src={item.resolvedUrl}
          alt=""
          className="h-full w-full object-cover"
        />
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

      {isCentered && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30"
          onClick={(event) => event.stopPropagation()}
        >
          <label
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs md:text-sm whitespace-nowrap transition-opacity ${
              isCover
                ? "cursor-default text-[#E8D1AB]"
                : "cursor-pointer text-[#E8D1AB] hover:opacity-80"
            } ${isDark ? "bg-black/50" : "bg-black/60"}`}
          >
            {isUpdatingCover && !isCover ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <input
                type="checkbox"
                checked={isCover}
                disabled={isCover || isUpdatingCover}
                onChange={(event) => {
                  if (!event.target.checked) return;

                  void onSetCover(item.studio_media_id);
                }}
                className="h-4 w-4 cursor-pointer bg-transparent accent-[#E8D1AB] disabled:cursor-default text-transparent"
              />
            )}

            <span>{isCover ? "Cover Image" : "Set as Cover Image"}</span>
          </label>
        </div>
      )}
    </motion.div>
  );
};
