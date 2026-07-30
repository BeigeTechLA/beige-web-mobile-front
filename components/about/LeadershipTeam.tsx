"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TEAM_SET = [
  { id: 1, name: "Kawser Khan", role: "CEO & Founder", img: "/images/crew/CREW(1).png" },
  { id: 2, name: "Nafisa Ahmen", role: "COO", img: "/images/crew/CREW(2).png" },
  { id: 3, name: "Kimberly Neer", role: "Head of Partnerships", img: "/images/crew/CREW(3).png" },
  { id: 4, name: "Maggie Perochena", role: "Head of Post-Production", img: "/images/crew/CREW(4).png" },
  { id: 5, name: "Sharat Hossain", role: "Human Resources Manager", img: "/images/crew/CREW(5).png" },
];

interface SideColumnProps {
  cards: typeof TEAM_SET;
  progress: any;
}

const SideColumn = ({ cards, progress }: SideColumnProps) => {
  // Pushes the taller moving columns down until the center card is settled (0.5 progress)
  // Then smoothly slides up to an exact 0px matching baseline alignment
  const y = useTransform(progress, [0, 0.5, 0.95, 1], ["1000px", "1000px", "0px", "0px"]);

  return (
    <motion.div
      style={{ y }}
      className="flex flex-col gap-6 lg:gap-8 items-center w-full"
    >
      {cards.map((member) => (
        <div
          key={`member_${member.id}`}
          className="flex flex-col relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#1f1f1f] opacity-80 shadow-lg border border-white/5"
        >
          <div className="w-full h-full relative overflow-hidden group">
            <img
              src={member.img}
              alt={member.name}
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
              <h3 className="text-xl font-semibold text-white tracking-tight">{member.name}</h3>
              <p className="text-sm text-white/60 mt-1">{member.role}</p>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default function LeadershipTeam() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const leftColumnCards = [TEAM_SET[1], TEAM_SET[3]];
  const rightColumnCards = [TEAM_SET[2], TEAM_SET[4]];
  const ceoCard = TEAM_SET[0];

  return (
    <section className="relative overflow-visible w-full">
      <div
        ref={containerRef}
        className="relative w-full max-w-7xl mx-auto bg-[#171717] h-[250vh] rounded-2xl overflow-visible"
      >
        {/* Sticky wrapper container context */}
        <div className="sticky top-0 h-screen w-full pt-16 md:pt-24 px-4 lg:px-24 overflow-hidden">
          
          {/* Isolated center-axis container block */}
          <div className="relative max-w-md mx-auto flex flex-col items-center overflow-visible">
            
            {/* Title */}
            <h2 className="text-center text-3xl md:text-[56px] font-medium bg-gradient-to-r from-[#FFF] from-[2.09%] to-[rgba(255,255,255,0.20)] to-[98.96%] bg-clip-text text-transparent select-text block m-0 p-0 text-center whitespace-nowrap">
              Our Leadership Team
            </h2>

            {/* Center CEO Card - Hard-anchored at precisely 60px down from the title */}
            <div className="mt-[60px] w-full max-w-[340px] relative z-20">
              <div className="flex flex-col relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#1f1f1f] scale-105">
                <div className="w-full h-full relative overflow-hidden">
                  <img
                    src={ceoCard.img}
                    alt={ceoCard.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
                    <h3 className="text-xl font-semibold text-white tracking-tight">{ceoCard.name}</h3>
                    <p className="text-sm text-white/60 mt-1">{ceoCard.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 
              Side columns are absolutely positioned relative to the center component anchor. 
              This leaves the CEO card's structural top margin entirely untouched.
            */}
            <div className="absolute right-[calc(100%+24px)] bottom-0 w-[340px] pointer-events-auto">
              <SideColumn cards={leftColumnCards} progress={scrollYProgress} />
            </div>

            <div className="absolute left-[calc(100%+24px)] bottom-0 w-[340px] pointer-events-auto">
              <SideColumn cards={rightColumnCards} progress={scrollYProgress} />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}