"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const PROJECTS = [
  {
    title: "Smiles Forever",
    description:
      "We collaborated with Smiles Forever Dental Clinic to produce heartfelt testimonials showcasing their patient-first mentality and professionalism that keeps every smile glowing.",
    image: "/images/projects/smiles.png",
  },
  {
    title: "Bear Robotics",
    description:
      "We showcased Bear Robotics cutting-edge foodservice robots through stunning visuals that captured their innovation, precision, and the real-world impact they're making in the industry.",
    image: "/images/projects/robots.png",
  },
  {
    title: "Rolls-Royce",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/rollsroyce.png",
  },
  {
    title: "Creator",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/creator.png",
  },
  {
    title: "Real-Estate",
    description:
      "Our exclusive behind-the-scenes video took a closer look at the craftsmanship, engineering, and advanced technology that powers Rolls-Royce's legendary vehicles.",
    image: "/images/projects/interior.png",
  },
];

const CARD_WIDTH_VW = 32;
const GAP_PX = 20;
const CLONES = 2;

/* Create looping buffer */
const extendedProjects = [
  ...PROJECTS.slice(-CLONES),
  ...PROJECTS,
  ...PROJECTS.slice(0, CLONES),
];

export const Projects = () => {
  const [index, setIndex] = useState(CLONES);

  const next = () => {
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    setIndex((prev) => prev - 1);
  };

  /* Seamless index reset */
  useEffect(() => {
    if (index >= PROJECTS.length + CLONES) {
      setTimeout(() => setIndex(CLONES), 350);
    }
    if (index < CLONES) {
      setTimeout(() => setIndex(PROJECTS.length + CLONES - 1), 350);
    }
  }, [index]);

  return (
    <section className="py-20 md:py-32 border-t border-white/5 relative overflow-hidden">
      <Container>

        {/* Header */}
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-base text-white">Our Projects</p>
        </div>

        {/* Title + Nav */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
          <div>
            <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-4 tracking-tight">
              Beige Featured Projects.
            </h2>
            <p className="text-white/50 text-sm lg:text-base font-light max-w-2xl">
              Highlighting standout work crafted by our top creators across
              diverse industries and styles.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={prev}
              className="w-18 h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowDownLeft className="text-white/60" size={28} />
            </button>

            <button
              onClick={next}
              className="w-18 h-18 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowUpRight className="text-white/60" size={28} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex"
            style={{ gap: `${GAP_PX}px` }}
            animate={{
              x: `calc(-${index * (CARD_WIDTH_VW + 2)}vw)`
            }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 22,
            }}
          >
            {extendedProjects.map((project, i) => (
              <div
                key={i}
                style={{
                  minWidth: `${CARD_WIDTH_VW}vw`,
                  maxWidth: `${CARD_WIDTH_VW}vw`,
                }}
                className="shrink-0"
              >
                <div className="group cursor-pointer">
                  <div
                    className="relative rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-white/20 transition-all duration-500"
                    style={{ height: "676px" }}
                  >
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-[#010101]/40 to-transparent opacity-90" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {project.title}
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed line-clamp-4 group-hover:text-white/80 transition-colors duration-300">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

      </Container>
    </section>
  );
};
