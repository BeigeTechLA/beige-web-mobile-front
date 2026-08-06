"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

// Import central type definition
import { BlogPost } from "@/app/press-blogs/lib/types";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

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
const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || ""

export const RecommendedBlogs: React.FC<RecommendedBlogsProps> = ({ moreContent }) => {
  const router = useRouter();

  if (!moreContent || moreContent.length === 0) return null;

  return (
    <section className="py-10 lg:py-16 lg:py-24 relative overflow-hidden">
      <div className="mx-auto space-y-12">
        {/* Section Title */}
        <h2 className="text-3xl lg:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block text-center">
          Recommended <span className="text-white/40">Blogs</span>
        </h2>

        {/* Swiper Carousel */}
        <div className="w-full">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 32,
              },
            }}
            pagination={{
              clickable: true,
              el: ".custom-swiper-pagination",
              bulletClass: "custom-swiper-bullet",
              bulletActiveClass: "custom-swiper-bullet-active",
            }}
            autoplay={{
              delay: 9000,
              disableOnInteraction: true,
            }}
            className="w-full !pb-12"
          >
            {moreContent.map((post, idx) => {
              const postCategory =
                typeof post.category === "object"
                  ? post.category?.title
                  : post.category || "GENERAL";
              const postSlug = String(post["post_name"] || "");

              const rawImage = extractFirstImage(post["content:encoded"]);

              // Check if rawImage is a local placeholder or missing
              const postImage = rawImage.startsWith("/images/misc/")
                ? "/images/misc/BeigeLogoPlaceholder.png"
                : `${S3_PREFIX}${rawImage}`;

              console.log(postImage, postSlug)

              const dateString = post.pubDate || post.post_date;
              const postDate = dateString
                ? new Date(dateString)
                  .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, "-")
                : "";

              return (
                <SwiperSlide key={String(post["post_id"] || idx)}>
                  <div
                    onClick={() => postSlug && router.push(`/press-blogs/${postSlug}`)}
                    className="group flex flex-col space-y-4 lg:space-y-10 cursor-pointer transition-transform duration-200 hover:-translate-y-1 h-full"
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
                    <div className="flex flex-col flex-1 justify-between space-y-3 lg:space-y-10 text-white">
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
                        By {post.creator || "Beige Media"}{postDate ? `, ${postDate}` : ""}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Pagination Container */}
          <div className="custom-swiper-pagination flex justify-center items-center gap-2 pt-6" />
        </div>
      </div>

      {/* Global CSS overrides for the custom pagination indicators */}
      <style jsx global>{`
        .custom-swiper-bullet {
          width: 32px;
          height: 2px;
          background-color: #27272a; /* bg-zinc-800 */
          border-radius: 9999px;
          display: inline-block;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-swiper-bullet-active {
          width: 48px;
          background-color: #e8d1ab;
        }
      `}</style>
    </section>
  );
};