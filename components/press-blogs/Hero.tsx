"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { Button } from "@/src/components/landing/ui/button";

interface Post {
  id: number;
  date: string;
  source: string;
  title: string;
  imgSrc: string;
  link: string;
}

const POSTS: Post[] = [
  {
    id: 1,
    date: "June 12, 2025",
    source: "YAHOO FINANCE",
    title: "Beige: The Platform Bringing AI-Powered Matchmaking to Photography and Videography",
    imgSrc: "https://s.yimg.com/lo/mysterio/api/95A4423FE2E7FFE4528FA3BE492EEE3BA523D55910366EEEF366978384A7E968/subgraphmysterio/resizefit_w960;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Faccesswire.ca%2F33ae557c093b10aba20b17748f87b072",
    link: "https://finance.yahoo.com/news/beige-platform-bringing-ai-powered-212500132.html",
  },
  {
    id: 2,
    date: "15 FEB 2026",
    source: "TECHCRUNCH",
    title: "Meet Kawser Khan | Founder & CEO of Beige Video",
    imgSrc: "https://shoutoutla.s3.us-west-1.amazonaws.com/wp-content/uploads/2025/05/c-1745524565850-personal_1745524564597_1745524564597_kawser_khan_screenshot_2025-04-24_at_25120_pm.png",
    link: "https://shoutoutla.com/meet-kawser-khan-founder-ceo-of-beige-video",
  },
  {
    id: 3,
    date: "10 JUL 2025",
    source: "Beige Blog",
    title: "10 Content Ideas You Can Shoot in 1 Hour at Beige Studio",
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/blogImages/Picture4-1.webp",
    link: "/press-blogs/10-content-ideas-you-can-shoot-in-1-hour-at-beige-studio",
  },
  // {
  //   id: 4,
  //   date: "10 APR 2026",
  //   source: "BLOOMBERG",
  //   title: "Streamlining Global Shoot Logistics Through Tech Automation",
  //   imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/aboutUs/Theo+King+78.jpg",
  //   link: "https://bloomberg.com",
  // },
  {
    id: 4,
    date: "13 JUN 2024",
    source: "Beige Blog",
    title: "BW Weddings Celebrates Top Ranking in Los Angeles by Pandia",
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/blogImages/666b30bd36074fc16a5c7c15_anderson-1.webp",
    link: "/press-blogs/bw-weddings-celebrates-top-ranking-in-los-angeles-by-pandia",
  },
];

export const Hero = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const handleReadMore = (link: string) => {
    if (link.startsWith("http")) {
      window.open(link, "_blank");
    } else {
      router.push(link);
    }
  };

  return (
    <section className="py-10 lg:py-20 lg:py-30 relative overflow-hidden text-white">
      <Container>
        {/* Text Hero Content */}
        <div className="flex flex-col items-center justify-center text-center gap-3 lg:gap-6 relative z-10 mb-12 lg:mb-20">
          <h2 className="text-3xl lg:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            Beige Press & Blogs
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-white/70 font-light text-sm lg:text-base"
          >
            In-depth insights, updates, and expert perspectives on media technology, video, photography, and the evolving creative industry.
          </motion.p>

        </div>

        {/* Featured Auto-Swipe Card Wrapper */}
        <div className="mx-auto bg-[#171717] rounded-2xl p-4 lg:p-8 border border-white/20 relative overflow-hidden">
          <Swiper
            modules={[Autoplay, Pagination]}
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            autoplay={{
              delay: 8500,
              disableOnInteraction: false,
            }}
            loop={true}
            className="w-full hero-swiper"
          >
            {POSTS.map((post) => (
              <SwiperSlide key={post.id}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-9 items-center">
                  {/* Left Image Section */}
                  <div className="relative w-full rounded-lg overflow-hidden bg-[#1f1f1f]">
                    <img
                      src={post.imgSrc}
                      alt={post.title}
                      className="object-cover aspect-[4/3] "
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  {/* Right Text & CTA Section */}
                  <div className="flex flex-col justify-between h-full py-2">
                    <div className="flex flex-col justify-between items-start h-full">
                      <div className="flex flex-col gap-4 lg:gap-8">
                        {/* Date & Source Tag */}
                        <div className="flex items-center gap-2 text-sm lg:text-base tracking-wider text-white/65">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span className="uppercase text-[#E8D1AB]">{post.source}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl lg:text-4xl font-light leading-snug text-white line-clamp-3">
                          {post.title}
                        </h3>
                      </div>

                      {/* Read More Button */}
                      <Button
                        onClick={() => handleReadMore(post.link)}
                        className="bg-[#E8D1AB] text-black hover:bg-[#dcb98a] h-12 lg:h-[72px] pl-4 pr-1 rounded-lg lg:rounded-[10px] text-sm lg:text-xl flex items-center justify-between lg:gap-6 shadow-[0_0_20px_-5px_rgba(232,209,171,0.3)] transition-all lg:max-w-50"
                      >
                        <span>Read More</span>

                        {/* Right Dark Icon Box */}
                        <div className="bg-[#1A1A1A] w-8 h-8 lg:w-12 lg:h-12 rounded-md flex items-center justify-center">
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

                      {/* Progress Tracker Pill Bars */}
                      <div className="flex items-center gap-2 pt-2">
                        {POSTS.map((_, idx) => (
                          <button
                            key={`tracker_pill_${idx}`}
                            onClick={() => swiperInstance?.slideToLoop(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === idx
                              ? "w-12 bg-[#E5D2B3]"
                              : "w-12 bg-white/20 hover:bg-white/40"
                              }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                    </div>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>

        </div>
      </Container>
    </section>
  );
};