"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { CircleCheck, CircleDollarSign, UserRound, Video } from "lucide-react";

const GRAPH_DATA = [
  {
    id: "01",
    text: "Entry Level Milestone​",
    icon: <UserRound className="size-6 lg:size-10" strokeWidth={1} />,
    hoverText: "Let Beige manage the logistics, client communications, insurance, and payments so you can focus on delivering exceptional work and advancing your creative journey.",
  },
  {
    id: "02",
    text: "Fully Onboarded Milestone",
    icon: <Video className="size-6 lg:size-10" strokeWidth={1} />,
    hoverText: "Complete your first project and unlock new training materials and support channels.",
  },
  {
    id: "03",
    text: "Gold Standard Milestone",
    icon: <CircleCheck className="size-6 lg:size-10" strokeWidth={1} />,
    hoverText: "Demonstrate consistent quality and get priority access to premium projects.",
  },
  {
    id: "04",
    text: "Platinum Standard Milestone",
    icon: <CircleDollarSign className="size-6 lg:size-10" strokeWidth={1} />,
    hoverText: "Become a top partner, enjoy the best rates, and help mentor new creators.",
  },
];

export const GrowthJourneySection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [contentHeights, setContentHeights] = useState<number[]>(new Array(GRAPH_DATA.length).fill(0));
  const [isMobile, setIsMobile] = useState(false);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check for mobile to disable/enable animations
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Give the DOM a moment to paint so scrollHeight is accurate
    const timer = setTimeout(() => {
    const heights = textRefs.current.map((ref) => (ref ? ref.scrollHeight : 0));
    setContentHeights(heights);
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="py-10 md:py-32 bg-[#010101] relative overflow-hidden text-white">
      <Container>
        <div className="flex flex-col lg:flex-row justify-center mb-8 md:mb-18">
          <h2 className="text-lg md:text-[56px] font-medium text-gradient-white tracking-tight text-center lg:text-left">
            Our Journey of Growth
          </h2>
        </div>

        <div className="relative">
          {/* Arrow Connector */}
          <div className="hidden lg:block absolute -top-[78px] left-0 w-full h-[90px] pointer-events-none z-0">
            <div className="relative w-full h-full">
              {/* Horizontal top line */}
              <div className="absolute top-[22px] left-[18%] right-[14%] h-px bg-white/80" />
              {/* Drop to Card 1 (LEFT CURVE) */}
              <div className="absolute left-[14%] top-[22px]">
                <svg width="59" height="50" viewBox="0 0 59 50" fill="none">
                  <path
                    d="M3.91939 50L7.66217 43.4571L0 43.557L3.91939 50ZM4.50326 44.1796C4.98894 28.874 11.1595 18.1916 20.8789 11.3145C30.6268 4.4173 44.0159 1.29873 59 1.2987V0C43.8546 2.07792e-05 30.1551 3.1484 20.1011 10.2622C10.0186 17.3961 3.67392 28.4687 3.17665 44.1394L4.50326 44.1796Z"
                    fill="white"
                  />
                </svg>
              </div>
              {/* Drop to Card 2 */}
              <div className="absolute left-[38%] top-[22px]">
                <svg width="59" height="49" viewBox="0 0 59 49" fill="none">
                  <path
                    d="M55.0806 49L51.3378 42.588L59 42.6859L55.0806 49ZM54.4968 43.296C54.011 28.2965 47.8405 17.8277 38.1211 11.0883C28.3732 4.32895 14.9841 1.27275 0 1.27273V0C15.1455 2.03636e-05 28.8449 3.08543 38.8989 10.0569C48.9814 17.0482 55.326 27.8993 55.8234 43.2566L54.4968 43.296Z"
                    fill="white"
                  />
                </svg>
              </div>

              {/* Drop to Card 3 */}
              <div className="absolute left-[62%] top-[22px]">
                <svg width="59" height="49" viewBox="0 0 59 49" fill="none">
                  <path
                    d="M55.0806 49L51.3378 42.588L59 42.6859L55.0806 49ZM54.4968 43.296C54.011 28.2965 47.8405 17.8277 38.1211 11.0883C28.3732 4.32895 14.9841 1.27275 0 1.27273V0C15.1455 2.03636e-05 28.8449 3.08543 38.8989 10.0569C48.9814 17.0482 55.326 27.8993 55.8234 43.2566L54.4968 43.296Z"
                    fill="white"
                  />
                </svg>
              </div>

              {/* Drop to Card 4 */}
              <div className="absolute left-[86%] top-[22px]">
                <svg width="59" height="49" viewBox="0 0 59 49" fill="none">
                  <path
                    d="M55.0806 49L51.3378 42.588L59 42.6859L55.0806 49ZM54.4968 43.296C54.011 28.2965 47.8405 17.8277 38.1211 11.0883C28.3732 4.32895 14.9841 1.27275 0 1.27273V0C15.1455 2.03636e-05 28.8449 3.08543 38.8989 10.0569C48.9814 17.0482 55.326 27.8993 55.8234 43.2566L54.4968 43.296Z"
                    fill="white"
                  />
                </svg>
              </div>

            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch relative z-10">
            {GRAPH_DATA.map((data, i) => {
              const isHovered = hoveredIndex === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="bg-[#171717] flex-1 flex flex-col p-6 lg:px-[30px] lg:py-10 rounded-[10px] lg:rounded-[20px] border border-white/20 h-auto lg:h-[450px] lg:overflow-hidden justify-between cursor-default"
                >
                  <div className="flex justify-between items-center w-full shrink-0 mb-4 lg:mb-0">
                    <div className="bg-[#E8D1AB] text-black rounded-full p-3 lg:p-5">
                      {data.icon}
                    </div>
                    <span className="text-base lg:text-2xl">{data.id}</span>
                  </div>

                  <div className="relative w-full">
                    <motion.div
                      animate={!isMobile ? {
                        y: isHovered ? -contentHeights[i] - 16 : 0
                      } : {}}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      className="relative flex flex-col"
                    >
                      <p className="text-base lg:text-2xl font-medium leading-snug mb-1 lg:mb-0">
                        {data.text}
                      </p>

                      <div
                        ref={(el) => { textRefs.current[i] = el; }}
                        className={`relative lg:absolute top-auto lg:top-full left-0 lg:pt-5 w-full transition-opacity duration-300 ${
                          (isHovered || isMobile) ? "opacity-100 visible" : "lg:opacity-0 lg:invisible"
                          }`}
                      >
                        <p className="text-sm lg:text-base leading-relaxed text-[#BABABA]">
                          {data.hoverText}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};