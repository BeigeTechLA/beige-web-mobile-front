"use client";

import React, { useRef } from "react";
import {
  motion,
  MotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";

const TEAM_SET = [
  {
    id: 1,
    name: "Kawser Khan",
    role: "CEO & Founder",
    img: "/images/crew/CREW(1).png",
  },
  {
    id: 2,
    name: "Nafisa Ahmen",
    role: "COO",
    img: "/images/crew/CREW(2).png",
  },
  {
    id: 3,
    name: "Kimberly Neer",
    role: "Head of Partnerships",
    img: "/images/crew/CREW(3).png",
  },
  {
    id: 4,
    name: "Maggie Perochena",
    role: "Head of Post-Production",
    img: "/images/crew/CREW(4).png",
  },
  {
    id: 5,
    name: "Sharat Hossain",
    role: "Human Resources Manager",
    img: "/images/crew/CREW(5).png",
  },
];

interface TeamCardProps {
  member: (typeof TEAM_SET)[number];
  className?: string;
}

function TeamCard({
  member,
  className = "",
}: TeamCardProps) {
  return (
    <div
      className={` relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#1f1f1f] border border-white/5 shadow-xl ${className} `}
    >
      <img
        src={member.img}
        alt={member.name}
        className="w-full h-full object-cover object-top"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-6 pt-20">
        <h3 className="text-xl font-semibold tracking-tight text-white">
          {member.name}
        </h3>
        <p className="mt-1 text-sm text-white/60">
          {member.role}
        </p>
      </div>
    </div>
  );
}

interface SideColumnProps {
  cards: (typeof TEAM_SET);
  progress: MotionValue<number>;
}

const SideColumn = ({
  cards,
  progress,
}: SideColumnProps) => {
  const translateY = useTransform(
    progress,
    [0, 1],
    ["80%", "-47%"]
  );

  return (
    <div className="w-full">
      <motion.div
        style={{ y: translateY }}
        className="flex flex-col gap-6 lg:gap-8 xl:gap-10 w-full will-change-transform"
      >
        {cards.map((member) => (
          <TeamCard
            key={member.id}
            member={member}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default function LeadershipTeam() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const ceoCard = TEAM_SET[0];

  const leftCards = [
    TEAM_SET[1],
    TEAM_SET[3],
  ];

  const rightCards = [
    TEAM_SET[2],
    TEAM_SET[4],
  ];

  return (
    <section className="relative w-full py-12 lg:py-24 text-white">
      <Container>
        <div
          ref={containerRef}
          className="relative mx-auto h-[300vh] max-w-[1700px] rounded-3xl bg-[#171717]"
        >
          {/* Sticky viewport handles masking correctly at the container border radius */}
          <div className="sticky top-0 h-screen overflow-hidden rounded-3xl">
            <div className="mx-auto flex h-full max-w-[1500px] flex-col justify-between px-8 pt-12 lg:pt-20 gap-10">

              {/* Heading */}
              <h2 className="text-center text-3xl md:text-5xl lg:text-[56px] font-medium leading-tight bg-gradient-to-r from-white to-white/20 bg-clip-text text-transparent">
                Our Leadership Team
              </h2>

              {/* Grid Layout - No inner overflow hidden to stop top cutting */}
              <div className="flex-1 flex items-center w-full max-w-[1180px] mx-auto relative">
                <div className="grid grid-cols-3 w-full justify-items-center items-start gap-6 lg:gap-8 xl:gap-10 overflow-hidden">
                  {/* LEFT COLUMN */}
                  <SideColumn
                    cards={leftCards}
                    progress={scrollYProgress}
                  />

                  {/* CENTER COLUMN (CEO) */}
                  <div className="relative z-20 w-full mt-10">
                    <TeamCard
                      member={ceoCard}
                      className="scale-105"
                    />
                  </div>

                  {/* RIGHT COLUMN */}
                  <SideColumn
                    cards={rightCards}
                    progress={scrollYProgress}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}