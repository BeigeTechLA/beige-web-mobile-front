"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface PressArticle {
  id: number;
  link: string;
  badge: string;
  title: string;
  author: string;
  authorAvatar: string;
  readTime: string;
  date: string;
  image: string;
}

const PRESS_ARTICLES: PressArticle[] = [
  {
    id: 1,
    link: "https://usawire.com/beige-ai-launches-national-expansion-and-introduces-beige-os-to-power-the-next-era-of-production/",
    badge: "USA WIRE",
    title: "Beige AI Launches National Expansion and Introduces Beige OS to Power the Next Era of Production",
    author: " Hassan javed",
    authorAvatar: "https://usawire.com/wp-content/uploads/avatars/298/1725269157-bpfull.jpg",
    readTime: "5 mins read",
    date: "Jan 16, 2026",
    image: "https://usawire.com/wp-content/uploads/2026/01/picture6-6969f18a4d1a4-1140x570.webp", // Replace with your image paths
  },
  {
    id: 2,
    link: "https://finance.yahoo.com/news/beige-platform-bringing-ai-powered-212500132.html",
    badge: "Yahoo Finance",
    title: "Beige: The Platform Bringing AI-Powered Matchmaking to Photography and Videography",
    author: "",
    authorAvatar: "",
    readTime: "4 min read",
    date: "June 12, 2025",
    image: "https://s.yimg.com/lo/mysterio/api/EA4AC901E49615B449487449293E3B0FD1AE10B0805733CE4C583D0F1F08C9B7/subgraphmysterio/resizefit_w960;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Faccesswire.ca%2F8531e89ef8a64c99fde96e03e9d11de9",
  },
  {
    id: 3,
    link: "https://apnews.com/press-release/ein-presswire-newsmatics/uber-for-content-platform-beige-ai-proves-real-time-marketplace-at-ces-2026-c41cc6f121517876db2e795daa2f3f47",
    badge: "AP News",
    title: "Uber-for-Content Platform Beige AI Proves Real-Time Marketplace at CES 2026",
    author: "",
    authorAvatar: "",
    readTime: "",
    date: "Jan 13, 2026",
    image: "https://dims.apnews.com/dims4/default/c3aad04/2147483647/strip/true/crop/1200x683+0+0/resize/2400x1366!/format/webp/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F2f%2Fcdafee31cde8b6ea8a83e5e34b02%2F2003dab3755c44858014cc77f8956e0f",
  },
];

export const PressCoverage = () => {
  const router = useRouter();
  // Default hovered card index (defaults to index 1 / middle card)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(1);

  return (
    <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <Container>
        {/* Text PressCoverage Content */}
        <div className="flex flex-col items-center justify-center text-center gap-3 lg:gap-6 relative z-10 mb-12 md:mb-20">
          <h2 className="text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block">
            Press Coverage
          </h2>
        </div>

        {/* Dynamic Expanding Card Grid */}
        <div className="flex flex-col md:flex-row gap-4 lg:gap-8 h-auto lg:h-[720px] w-full mx-auto items-stretch">
          {PRESS_ARTICLES.map((article, index) => {
            const isHovered = (hoveredIndex === null && index === 1) || hoveredIndex === index;

            return (
              <motion.div
                key={article.id}
                layout
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => router.push(`${article.link}`)}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-[50px] overflow-hidden cursor-pointer transition-all duration-300 ${isHovered ? "flex-[2.2] md:flex-[2.5]" : "flex-1"
                  }`}
              >
                {/* Background Image */}
                <img
                  src={article.image}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover rounded-[50px]"
                />

                {/* Optional dark overlay when not active */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? "bg-black/20" : "bg-black/40"}`} />

                {/* Sliding Overlay Card Info */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 80, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute bottom-0 left-0 right-0 bg-[#242323] backdrop-blur-md text-white rounded-[50px] p-5 lg:p-11 flex flex-col gap-10 lg:gap-14 justify-between min-h-[220px]"
                    >
                      {/* Badge Tag */}
                      <div>
                        <span className="inline-block bg-[#1E1E1E] border border-[#2B2B2B] text-[#E8D1AB] text-[8px] md:text-lg uppercase font-medium p-3 lg:px-6 lg:py-4 rounded-full mb-3 lg:mb-6 lg:min-w-[150px] text-center">
                          {article.badge}
                        </span>

                        {/* Article Title */}
                        <h3 className="text-sm lg:text-[32px] font-medium line-clamp-3 text-white">
                          {article.title}
                        </h3>
                      </div>

                      {/* Author & Read Time Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {article?.authorAvatar ? (
                            <img
                              src={article.authorAvatar}
                              alt={article.author || "Author"}
                              className="w-8 h-8 lg:h-16 lg:w-16 rounded-lg object-cover"
                            />
                          ) : article?.author ? (
                            <div className="w-8 h-8 lg:h-16 lg:w-16 rounded-lg bg-[#282626] text-white flex items-center justify-center text-xs font-medium border border-white/10">
                              {getInitials(article.author)}
                            </div>
                          ) : null}

                          <div className="flex flex-col text-[10px] lg:text-[22px]">
                            {
                              article?.author &&
                              <span className="font-medium text-white">
                                {article.author}
                              </span>
                            }
                            <span className="text-[#939393]">
                              {article.date}
                            </span>
                          </div>
                        </div>

                        {
                          article?.readTime &&
                          <div className="flex items-center gap-1.5 text-[10px] lg:text-[22px] text-[#818181]">
                            <Clock className="w-4 h-4 lg:w-8 lg:h-8" />
                            <span>{article.readTime}</span>
                          </div>
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};