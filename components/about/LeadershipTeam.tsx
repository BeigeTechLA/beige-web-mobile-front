"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  MotionValue,
  useScroll,
  useTransform,
} from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import Image from "next/image";

const TEAM_SET = [
  {
    id: 1,
    name: "Kawser Khan",
    role: "CEO & Founder",
    img: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/kawser-new.png",
  },
  {
    id: 2,
    name: "Nafisa Ahmed",
    role: "COO",
    img: "https://d2jhn32fsulyac.cloudfront.net/assets/Team/nafisa.jpeg",
  },
  {
    id: 3,
    name: "Cedric The Entertainer",
    role: "Advisor",
    img: "https://drive.google.com/uc?id=16U8QBMMWyFiPQ3PEy6xj5RpeNerd3GRL",
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
      <Image
        src={member.img}
        alt={member.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover object-top"
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
  isDesktop: boolean;
}

const SideColumn = ({
  cards,
  progress,
  isDesktop,
}: SideColumnProps) => {
  const animatedY = useTransform(
    progress,
    [0, 1],
    ["80%", "-47%"]
  );

  // If not desktop layout, turn off translation completely
  const translateY = isDesktop ? animatedY : "0%";

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
  const [isDesktop, setIsDesktop] = useState(false);

  // Listen for desktop layout size adjustments safely on mount
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // Matching Tailwind's 'lg' breakpoint
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const { scrollYProgress } = useScroll({
    target: isDesktop ? containerRef : undefined,
    offset: ["start start", "end end"],
  });

  const ceoCard = TEAM_SET[0];

  const leftCards = [
    TEAM_SET[1],
    // TEAM_SET[3], 
  ];

  const rightCards = [
    TEAM_SET[2],
    // TEAM_SET[4],
  ];

  return (
    <section className="relative w-full py-12 lg:py-24 text-white">
      <Container>
        <div
          ref={containerRef}
          className="relative mx-auto max-w-[1700px] rounded-3xl bg-[#171717] overflow-hidden lg:overflow-visible p-6 lg:p-0"
        >
          {/* Sticky viewport structure on desktop layouts */}
          <div className="rounded-3xl">
            <div className="mx-auto flex h-full max-w-[1500px] flex-col justify-between px-0 lg:px-8 py-4 lg:py-20 gap-10">

              {/* Heading */}
              <h2 className="text-center text-3xl md:text-5xl lg:text-[56px] font-medium leading-tight bg-gradient-to-r from-white to-white/20 bg-clip-text text-transparent">
                Our Leadership Team
              </h2>

              {/* Grid Layout - Handled responsively */}
              <div className="hidden lg:flex items-center w-full max-w-[1180px] mx-auto relative">
                <div className="grid grid-cols-3 w-full justify-items-center items-start gap-6 lg:gap-8 xl:gap-10 overflow-hidden">
                  {/* {
                    TEAM_SET.map((member) => (
                      <TeamCard
                        key={member.id}
                        member={member}
                      />
                    ))
                  } */}
                  {/* LEFT COLUMN */}
                  {/* <SideColumn
                    cards={leftCards}
                    progress={scrollYProgress}
                    isDesktop={isDesktop}
                  /> */}
                  <TeamCard
                    member={TEAM_SET[1]}
                  />

                  {/* CENTER COLUMN (CEO) */}
                  {/* <div className="relative z-20 w-full mt-10"> */}
                    <TeamCard
                      member={ceoCard}
                    />
                  {/* </div> */}

                  {/* RIGHT COLUMN */}
                  {/* <SideColumn
                    cards={rightCards}
                    progress={scrollYProgress}
                    isDesktop={isDesktop}
                  /> */}
                  <TeamCard
                    member={TEAM_SET[2]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fallback layout for mobile devices */}
          <div className="flex flex-col gap-6 mt-8 lg:hidden">
            {TEAM_SET.map((member, index) => (
              <div key={`teammember_${index}`}>
                <TeamCard member={member} />
              </div>
            ))}
          </div>

        </div>
      </Container>
    </section>
  );
}