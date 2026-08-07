"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Button } from "@/src/components/landing/ui/button";
import { Play, Video, X } from "lucide-react";

import { TESTIMONIALS } from "./data/testimonials";
import Image from "next/image";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  videoUrl?: string;
}

interface TextCardProps {
  testimonial: Testimonial;
  rating?: number;
}

const TextCard = ({ testimonial, rating = 5 }: TextCardProps) => {
  const { quote, author, role } = testimonial;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < count ? "text-white" : "text-gray-600"}>
        ★
      </span>
    ));
  };

  return (
    <div className="bg-[#171717] text-white p-4 lg:p-7 rounded-2xl h-full max-w-2xl max-h-115 font-sans flex flex-col justify-between">
      <div className=" flex flex-col gap-4 lg:gap-10">
        {/* 5-Star Rating */}
        <div className="flex gap-1 text-xl lg:text-2xl">
          {renderStars(rating)}
        </div>

        {/* Quote Section */}
        <div>
          {/* Large stylized open quote mark */}
          <Image
            src={"/images/misc/MessageQuotes.svg"}
            width={34}
            height={18}
            alt="Quotes"
            className="inline w-6 lg:w-8 h-auto"
          />

          {/* Testimonial text, rendered as a single italicized block */}
          <p className="text-sm lg:text-xl text-white italic font-medium leading-relaxed inline ml-1">
            {quote}
            {/* Closing quote mark */}
            <Image
              src={"/images/misc/MessageQuotes.svg"}
              width={34}
              height={18}
              alt="Quotes"
              className="pl-2 inline w-6 lg:w-8 h-auto"
            />
          </p>
        </div>
      </div>

      <div className="mt-4">
        {/* Divider */}
        <svg xmlns="http://www.w3.org/2000/svg" width="176" height="1" viewBox="0 0 176 1" fill="none">
          <path d="M0.25 0.25H175.25" stroke="url(#paint0_linear_7436_22302)" strokeWidth="0.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="paint0_linear_7436_22302" x1="0.25" y1="0.75" x2="175.25" y2="0.75" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Footer: User Details & Initials Avatar */}
        <div className="flex items-center justify-between">
          <div>
            {/* Author Name with specific gold color */}
            <h4 className="text-lg lg:text-2xl font-medium text-[#E8D1AB] mb-2">
              {author}
            </h4>
            {role && (
              <p className="text-sm lg:text-base text-white/70 font-light">
                {role}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#E0DDF8] text-black font-bold lg:text-2xl shadow-inner border-2 border-white/10 shrink-0">
            {getInitials(author)}
          </div>
        </div>
      </div>
    </div>
  );
};

interface VideoCardProps {
  testimonial: Testimonial;
  onPlayClick: (vimeoId: string) => void;
}

const VideoCard = ({ testimonial, onPlayClick }: VideoCardProps) => {
  const { quote, author, role, videoUrl } = testimonial;

  const getVimeoId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:video\/|vimeo\.com\/)(\d+)/);
    return match ? match[1] : null;
  };

  const vimeoId = getVimeoId(videoUrl?.trim());

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[16/8.5] rounded-2xl overflow-hidden bg-[#171717] text-white group max-h-115">

      {/* Background Paused Vimeo Preview Frame */}
      {vimeoId && (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autoplay=0&muted=1&loop=0&controls=0&background=1&playsinline=1`}
          className="absolute inset-0 w-full h-full border-0 z-0 bg-black pointer-events-none"
          title={`${author}'s background frame`}
        />
      )}

      {/* Dark overlay gradients for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10 pointer-events-none" />

      {/* Content Layout Overlay */}
      <div className="relative inset-0 p-4 lg:p-7 flex flex-col justify-between h-full z-20 select-none pointer-events-none">

        {/* Top Header: Video Tag */}
        <div className="flex items-center gap-2 self-start bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-base font-medium">
          <Video className="w-3 h-3 lg:w-4 lg:h-4 fill-current" />
          <span>Video Story</span>
        </div>

        {/* Center Play Overlay Triggering Popup */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={() => vimeoId && onPlayClick(vimeoId)}
            className="flex items-center justify-center w-10 h-10 lg:w-16 lg:h-16 rounded-full bg-white text-black hover:scale-110 active:scale-95 transition-all shadow-2xl cursor-pointer"
            aria-label="Play video testimonial in popup"
          >
            <Play className="w-4 h-4 lg:w-5 lg:h-5 translate-x-0.5" />
          </button>
        </div>

        {/* Bottom Content: Quote Block */}
        <div className="max-w-xl pointer-events-auto mt-auto">
          {/* Double Quote Symbols */}
          <Image
            src={"/images/misc/MessageQuotes.svg"}
            width={34}
            height={18}
            alt="Quotes"
            className="inline w-5 lg:w-[34px] h-auto"
          />

          {/* Quote Block */}
          <p className="text-xs sm:text-sm lg:text-xl font-medium text-slate-100 leading-snug italic mb-3 md:mb-6 inline ml-1">
            {quote.split('.')[0]}
            <Image
              src={"/images/misc/MessageQuotes.svg"}
              width={34}
              height={18}
              alt="Quotes"
              className="pl-2 inline w-5 lg:w-[34px] h-auto shrink-0"
            />
          </p>

          {/* Responsive Divider */}
          <svg xmlns="http://www.w3.org/2000/svg" className="my-2 w-full max-w-[176px]" height="1" viewBox="0 0 176 1" fill="none">
            <path d="M0.25 0.25H175.25" stroke="url(#paint0_linear_7436_22302)" strokeWidth="0.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="paint0_linear_7436_22302" x1="0.25" y1="0.75" x2="175.25" y2="0.75" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Bio info */}
          <div>
            <h4 className="text-sm lg:text-2xl font-medium text-[#E8D1AB] mb-1 lg:mb-2">
              {author}
            </h4>
            {role && (
              <p className="text-xs lg:text-base text-white/70 font-light">
                {role}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 3;

export const Testimonials = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);

  const handleViewToggle = () => {
    if (visibleCount >= TESTIMONIALS.length) {
      setVisibleCount(INITIAL_COUNT);
    } else {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, TESTIMONIALS.length)
      );
    }
  };

  const isAllVisible = visibleCount >= TESTIMONIALS.length;

  return (
    <section className="pb-10 md:pb-20 lg:pb-25 relative overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-24"
        >
          <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
            <p className="text-xs md:text-base text-white">Testimonial</p>
          </div>

          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
            What our Clients Say about Beige.
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="max-w-3xl text-white/70 font-light text-sm md:text-base mx-auto"
          >
            See how Beige has helped clients book top creators with confidence, providing reliable talent, transparent
            details, and seamless communication for projects of every size and style.
          </motion.p>
        </motion.div>

        {/* Masonry Layout */}
        <div className="flex flex-wrap gap-6 mb-8 lg:mb-16">
          {TESTIMONIALS.slice(0, visibleCount).map((testimonial, i) => {
            const hasVideo = testimonial.videoUrl && testimonial.videoUrl.trim() !== "";

            let widthClass = "w-full";
            if (!hasVideo) {
              widthClass = "w-full lg:w-[calc(33.333%-16px)] md:w-[calc(50%-12px)]";
            } else {
              if (i === 0 || i === 4) {
                widthClass = "w-full lg:w-[calc(66.666%-8px)] md:w-[calc(50%-12px)]";
              } else {
                widthClass = "w-full md:w-[calc(50%-12px)]";
              }
            }

            return (
              <div key={i} className={`${widthClass} flex shrink-0 grow-0`}>
                {hasVideo ? (
                  <VideoCard
                    testimonial={testimonial}
                    onPlayClick={(id) => setActivePopupId(id)}
                  />
                ) : (
                  <TextCard testimonial={testimonial} />
                )}
              </div>
            );
          })}
        </div>

        {INITIAL_COUNT !== TESTIMONIALS.length && (
          <div className="flex justify-center">
            <Button
              onClick={handleViewToggle}
              className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-9 md:h-[56px] pl-4 pr-1 lg:pr-2 rounded-[5px] lg:rounded-[10px] text-sm md:text-xl font-medium flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all md:min-w-[240px]"
            >
              <span className="lg:pr-4">{isAllVisible ? "View Less" : "View More"}</span>

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
        )}
      </Container>

      {/* AnimatePresence Framer Motion Popup Portal */}
      <AnimatePresence>
        {activePopupId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop Blur Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePopupId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Iframe Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-5xl aspect-[16/9] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-10"
            >
              {/* Close Button UI */}
              <button
                onClick={() => setActivePopupId(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                aria-label="Close popup player"
              >
                <X className="w-5 h-5" />
              </button>

              {/* High Quality Modal Embed (Autoplay Active) */}
              <iframe
                src={`https://player.vimeo.com/video/${activePopupId}?badge=0&autoplay=1&muted=0&loop=0&controls=1&playsinline=1`}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                title="Active popup video testimonial story"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};