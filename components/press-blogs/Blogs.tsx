"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProjectSwitcher } from "@/app/creatives/components/ProjectSwitcher";
import { Loader, Minus, Plus, Rss } from "lucide-react";

const DUMMY_CATS = ["Trends & Inspo", "Tips & Tutorial", "Industry Insights", "Beige Updates"];

interface BlogItem {
  id: number;
  title: string;
  category: string;
  desc: string;
  imgSrc: string;
  date: string;
  icon: string;
}

const MOCK_BLOGS: BlogItem[] = [
  {
    id: 1,
    title: "Why Your Restaurant Video Ads Not Working?",
    category: "Tips & Tutorial",
    desc: `"Raising funds can be one of the most overwhelming parts of building a startup — but this firm made it collaborative, transparent, and even inspiring. Their due diligence was tough but fair, and they helped us refine both our business model and pitch. It's rare to find investors who truly care about founder success. We found that here."`,
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/kawser-new.png", // Replace with actual image path
    date: "09 / 2022",
    icon: "✨",
  },
  {
    id: 2,
    title: "7 Restaurant Video Advertising Ideas That Will Drive Customers",
    category: "Tips & Tutorial",
    desc: `"Raising funds can be one of the most overwhelming parts of building a startup — but this firm made it collaborative, transparent, and even inspiring. Their due diligence was tough but fair, and they helped us refine both our business model and pitch."`,
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/kawser-new.png",
    date: "10 / 2022",
    icon: "📷",
  },
  {
    id: 3,
    title: "7 Restaurant Video Advertising Ideas That Will Drive Customers",
    category: "Tips & Tutorial",
    desc: `"Raising funds can be one of the most overwhelming parts of building a startup — but this firm made it collaborative, transparent, and even inspiring. Their due diligence was tough but fair, and they helped us refine both our business model and pitch."`,
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/kawser-new.png",
    date: "11 / 2022",
    icon: "🎬",
  },
  {
    id: 4,
    title: "7 Restaurant Video Advertising Ideas That Will Drive Customers",
    category: "Tips & Tutorial",
    desc: `"Raising funds can be one of the most overwhelming parts of building a startup — but this firm made it collaborative, transparent, and even inspiring. Their due diligence was tough but fair, and they helped us refine both our business model and pitch."`,
    imgSrc: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/kawser-new.png",
    date: "12 / 2022",
    icon: "⚙️",
  },
];

export const Blogs = () => {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState<string>("Tips & Tutorial");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const tabCategories = DUMMY_CATS
  // Filter blogs based on active category switcher
  const filteredBlogs = MOCK_BLOGS.filter((blog) => blog.category === activeProject);

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
          projects={tabCategories}
          active={activeProject}
          onChange={(tab) => {
            setActiveProject(tab);
            setExpandedIndex(0); // Reset or auto-open first item of new tab
          }}
          className="mx-auto mb-10"
        />

        {/* Accordion Blog List */}
        <div className="w-full max-w-6xl mx-auto flex flex-col">
          {filteredBlogs.map((blog, index) => {
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={blog.id}
                className="w-full transition-colors duration-300"
              >
                {/* Header Row (Visible when closed) */}
                {!isExpanded && (
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-8 text-left group hover:text-[#E8D1AB] transition-colors border-b border-[#111111]/40 "
                  >
                    <div className="flex items-center gap-4 md:gap-6 flex-1 pr-4">
                      <span className="bg-white text-[#111111]/40 w-8 h-8 rounded-sm flex items-center justify-center border border-black/10 shrink-0">
                       <Loader />
                      </span>
                      <h3 className="text-sm lg:text-2xl font-medium line-clamp-1 max-w-xl">
                        {blog.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between w-1/3 md:w-1/4 lg:w-1/5">
                      <span className="text-2xl text-white hidden lg:block">
                        {blog.category}
                      </span>
                      <span className="text-white group-hover:text-[#E8D1AB]">
                        <Plus size={16} />
                      </span>
                    </div>
                  </button>
                )}

                {/* Expanded Card Layout */}
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
                                <Rss size={18} />
                              </span>
                              <h3 className="text-sm md:text-2xl font-medium capitalize">
                                {blog.title}
                              </h3>
                            </div>
                            <button
                              onClick={() => toggleAccordion(index)}
                              className="lg:hidden text-xl font-light text-[#111111] hover:text-black z-20"
                            >
                              <Minus />
                            </button>
                          </div>
                          <p className="text-xs md:text-lg text-[#111111] ">
                            {blog.desc}
                          </p>
                        </div>

                        {/* Right Column: Asset Preview */}
                        <div className="flex flex-col lg:w-3/5 shrink-0 gap-7">
                          <div className="hidden lg:flex justify-between w-full">
                            <span className="text-2xl text-[#111111]">
                              {blog.category}
                            </span>
                            <button
                              onClick={() => toggleAccordion(index)}
                              className="text-[#111111] hover:text-black z-20"
                            >
                              <Minus size={16} />
                            </button>
                          </div>

                          <div className="flex-1 flex gap-2 ">
                            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden">
                              <Image
                                src={blog.imgSrc}
                                alt={blog.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex items-end justify-between w-full">
                              <span className="text-xs lg:text-sm text-[#111111]">
                                {blog.date}
                              </span>

                              {/* Giant stylized static quotes matching layout preview */}
                              <Image
                                src={"/images/misc/blackQuotes.svg"}
                                alt={"Black Quotes"}
                                width={80}
                                height={64}
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
          })}
        </div>
      </Container>
    </section>
  );
};