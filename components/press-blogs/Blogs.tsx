"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import { ProjectSwitcher } from "@/app/creatives/components/ProjectSwitcher";
import { Loader, Minus, Plus, Rss } from "lucide-react";
import { getAllPosts, parseWordPressContent } from "@/app/press-blogs/lib/posts";
import { BlogPost } from "@/app/press-blogs/lib/types";
import { extractPlainText, extractFirstImage } from "@/lib/utils/blogUtils";

const BLOG_CATEGORIES = [
  "Trends and Inspos",
  "Tips and Tutorials",
  "Industry Insights",
  "Beige Updates",
];

export const Blogs = () => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("Trends and Inspos");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Fetch all post data
  const posts: BlogPost[] = getAllPosts();
  console.log(posts);

  // Filter posts based on active category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const categoryName = post.category?.title || post.category;
      return categoryName === activeCategory;
    });
  }, [posts, activeCategory]);

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="py-10 md:py-16 lg:py-24 relative overflow-hidden">
      <Container>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-16"
        >
          <div className="inline-flex items-center border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-5 md:mb-6">
            <p className="text-xs md:text-base text-white">Blogs & Articles</p>
          </div>

          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
            Explore our more blogs
          </h2>
        </motion.div>

        {/* Category Switcher */}
        <ProjectSwitcher
          projects={BLOG_CATEGORIES}
          active={activeCategory}
          onChange={(tab) => {
            setActiveCategory(tab);
            setExpandedIndex(0); // Auto-open first item of newly selected tab
          }}
          className="mx-auto mb-10"
        />

        {/* Accordion Blog List */}
        <div className="w-full mx-auto flex flex-col">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              No articles found for "{activeCategory}".
            </div>
          ) : (
            filteredPosts.map((post, index) => {
              const isExpanded = expandedIndex === index;
              const postCategory = post.category?.title || activeCategory;
              const postSlug = String(post["post_name"]);
              const postDescription = extractPlainText(post["content:encoded"]);
              const postImage = (extractFirstImage(post["content:encoded"]) === "/images/misc/placeholder.png" ? "/images/misc/BlackLogoPlaceholder.png" : extractFirstImage(post["content:encoded"]));
              const dateString = post.pubDate || post.post_date || "";
              const postDate = dateString
                ? new Date(dateString).toLocaleDateString("en-US", {
                  month: "2-digit",
                  year: "numeric",
                })
                : "N/A";

              return (
                <div
                  key={String(post["post_id"] || index)}
                  className="w-full transition-colors duration-300"
                >
                  {/* Collapsed View: Title and Category Visible */}
                  {!isExpanded && (
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-center justify-between p-8 text-left group hover:text-[#E8D1AB] transition-colors border-b border-[#111111]/40"
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 pr-4">
                        <span className="bg-white text-[#111111] w-8 h-8 rounded-sm flex items-center justify-center border border-black/10 shrink-0">
                          <Rss className="w-5 h-5" />
                        </span>
                        <h3 className="text-sm lg:text-2xl font-medium line-clamp-1 max-w-xl">
                          {post.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between w-1/3 md:w-1/4 lg:w-1/5">
                        <span className="text-2xl text-white hidden lg:block">
                          {postCategory}
                        </span>
                        <span className="text-white group-hover:text-[#E8D1AB]">
                          <Plus size={16} />
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Expanded View: Full Post Content & Interactive Navigation */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#E8D1AB] text-black rounded-2xl p-3 md:p-7 relative flex flex-col md:flex-row justify-between gap-4 lg:gap-8 items-stretch">
                          {/* Left Column: Details */}
                          <div className="flex-1 flex flex-col justify-between max-w-xl lg:w-2/5 relative">
                            <div className="w-full flex justify-between items-start">
                              <div className="flex items-start gap-4 mb-6">
                                <span className="bg-black text-white w-8 h-8 rounded-sm flex items-center justify-center border border-black/10 shrink-0">
                                  <Rss size={20} />
                                </span>
                                <h3
                                  onClick={() => router.push(`/press-blogs/${postSlug}`)}
                                  className="text-sm md:text-2xl font-medium capitalize cursor-pointer hover:underline"
                                >
                                  {post.title}
                                </h3>
                              </div>
                              <button
                                onClick={() => toggleAccordion(index)}
                                className="lg:hidden text-xl font-light text-[#111111] hover:text-black z-20"
                              >
                                <Minus />
                              </button>
                            </div>
                            <p className="text-xs md:text-lg text-[#111111] line-clamp-4">
                              "{postDescription}"
                            </p>

                            <button
                              onClick={() => router.push(`/press-blogs/${postSlug}`)}
                              className="mt-4 text-xs md:text-sm font-semibold text-black underline tracking-wide w-fit hover:opacity-80 transition-opacity"
                            >
                              Read Full Post &rarr;
                            </button>
                          </div>

                          {/* Right Column: Asset Preview */}
                          <div className="flex flex-col lg:w-3/5 shrink-0 gap-7">
                            <div className="hidden lg:flex justify-between w-full">
                              <span className="text-2xl text-[#111111]">
                                {postCategory}
                              </span>
                              <button
                                onClick={() => toggleAccordion(index)}
                                className="text-[#111111] hover:text-black z-20"
                              >
                                <Minus size={16} />
                              </button>
                            </div>

                            <div className="flex-1 flex gap-2">
                              <div
                                className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer"
                                onClick={() => router.push(`/press-blogs/${postSlug}`)}
                              >
                                {/* Changed from <Image> to <img> */}
                                <img
                                  src={postImage}
                                  alt={post.title || "Blog cover image"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex items-end justify-between w-full">
                                <span className="text-xs lg:text-sm text-[#111111]">
                                  {postDate}
                                </span>

                                {/* Changed from <Image> to <img> */}
                                <img
                                  src="/images/misc/blackQuotes.svg"
                                  alt="Black Quotes"
                                  width="80"
                                  height="64"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </Container>
    </section>
  );
};