"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface BlogPost {
  "wp:post_id"?: string | number;
  "wp:post_name"?: string;
  title: string;
  pubDate: string;
  category?: { "#text": string } | string;
  "content:encoded"?: string;
  author?: string;
  featuredImage?: string;
}

interface RecommendedBlogsProps {
  moreContent: BlogPost[];
}

// Helper: Extract first image from HTML content with placeholder fallback
function extractFirstImage(htmlContent?: string): string {
  if (!htmlContent) return "/images/misc/BlackLogoPlaceholder.png";
  const match = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  const foundSrc = match ? match[1] : "/images/misc/placeholder.png";

  return foundSrc === "/images/misc/placeholder.png"
    ? "/images/misc/BlackLogoPlaceholder.png"
    : foundSrc;
}

export const RecommendedBlogs: React.FC<RecommendedBlogsProps> = ({ moreContent }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(1);

  if (!moreContent || moreContent.length === 0) return null;

  return (
    <section className="py-10 lg:py-16 lg:py-24 relative overflow-hidden">
      <div className="mx-auto space-y-12">
        {/* Section Title */}
        <h2 className="text-3xl lg:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block text-center">
          Recommended <span className="text-white/40">Blogs</span>
        </h2>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {moreContent.slice(0, 3).map((post, idx) => {
            // Field extractions matching your data structure
            const postCategory =
              (typeof post.category === "object" ? post.category?.["#text"] : post.category) ||
              "GENERAL";
            const postSlug = String(post["wp:post_name"] || "");
            const postImage =
              post.featuredImage || extractFirstImage(post["content:encoded"]);
            const postDate = post.pubDate
              ? new Date(post.pubDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).replace(/\//g, "-")
              : "";

            return (
              <div
                key={String(post["wp:post_id"] || idx)}
                onClick={() => postSlug && router.push(`/press-blogs/${postSlug}`)}
                className="group flex flex-col space-y-4 lg:space-y-10 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900 border border-white/5">
                  <img
                    src={postImage}
                    alt={post.title || "Blog cover image"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Details */}
                <div className="flex flex-col flex-1 justify-between space-y-3 lg:space-y-10 text-white ">
                  <div className="space-y-2 lg:space-y-5">
                    {/* Category */}
                    <p className="text-[10px] lg:text-base uppercase tracking-wider">
                      {postCategory}
                    </p>

                    {/* Title */}
                    <h3 className="text-sm lg:text-[28px] font-medium line-clamp-3 leading-snug group-hover:text-white/80 transition-colors">
                      {post.title}
                    </h3>
                  </div>

                  {/* Author & Date Footer */}
                  <p className="text-xs lg:text-base">
                    By {post.author || "Beige Media"}{postDate ? `, ${postDate}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel / Pagination Indicator */}
        <div className="flex justify-center items-center gap-2 pt-6">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-[2px] rounded-full transition-all duration-300 ${activeIndex === index
                  ? "w-12 bg-[#E8D1AB]"
                  : "w-8 bg-zinc-800 hover:bg-zinc-700"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};