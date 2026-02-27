"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Brain, Clapperboard, Video, Film } from "lucide-react";

const STEPS = [
  {
    icon: Brain,
    title: "AI Matchmaking",
    subtext: "The right creative. Every time.",
    description:
      "Our proprietary matching engine pairs you with the best-fit videographer or photographer based on shoot type, style, location, and performance data from thousands of real productions.",
  },
  {
    icon: Clapperboard,
    title: "Pre-Production",
    subtext: "Zero back-and-forth. Full clarity.",
    description:
      "Scopes, timelines, logistics, and expectations are locked in upfront so everyone shows up aligned and ready to execute.",
  },
  {
    icon: Video,
    title: "Production",
    subtext: "Show up. Shoot. Done.",
    description: "Your creative partner captures exactly what was planned—on time, on brand, and without surprises.",
  },
  {
    icon: Film,
    title: "AI-Powered Post-Production",
    subtext: "Edited, optimized, and ready to ship.",
    description: "We turn raw footage into polished, platform-ready assets using a blend of expert editors and AI-assisted workflows—built for social, fast enough for culture.",
  },
];

export const Process = () => {
  const videoUrl = "https://d2jhn32fsulyac.cloudfront.net/assets/videos/Camera_Operator_Filmmaker.mp4";

  return (
    <section className="py-10 md:py-20 lg:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-24">
          {/* Left */}
          <div className="w-full lg:w-1/2 flex flex-col gap-10 md:gap-12">
            <div>
              <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 lg:mb-8 tracking-tight">
                Built by creatives. <br />Powered for scale.
              </h2>
              <p className="text-white/50 text-xs md:text-base lg:leading-[28px] font-light max-w-[500px]">
                Beige is the modern operating system for content production—connecting brands with elite creators, streamlined workflows, and predictable outcomes in minutes, not weeks.
              </p>
            </div>

            {/* Video */}
            <div className="relative w-full h-[200px] lg:h-[400px] rounded-[24px] overflow-hidden border border-white/10">
              {
                videoUrl &&
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              }

              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-white/80 text-sm">
                  Behind the Scenes
                </span>
              </div>
            </div>

            {/* Body */}
            <p className="my-2 lg:mt-4 text-[#E8D1AB] text-sm lg:text-lg lg:leading-[28px] font-light">
              From one-off shoots to always-on content, Beige replaces the chaos of traditional production with a fast, transparent, AI-powered marketplace. Tell us what you need. We handle the rest—from matching to delivery.
            </p>
          </div>

          {/* Right Side: Steps List */}
          <ProcessSteps steps={STEPS} />
        </div>
      </Container>
    </section>
  );
};

const ProcessSteps = ({ steps }: { steps: typeof STEPS }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className="w-full lg:w-1/3 flex flex-col gap-4">
      {steps.map((step, i) => {
        const isActive = activeIndex === i;

        return (
          <motion.div
            key={i}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => setActiveIndex(i)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-4 lg:p-8 rounded-[24px] overflow-hidden bg-[#0A0A0A] transition-colors duration-300 border
              ${isActive ? "border-[#e8d1ab]/60" : "border-transparent"}`}
          >
            {/* Constant Glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-bl from-[#e8d1ab]/20 via-[#e8d1ab]/5 to-transparent opacity-100"
            />

            <div className="relative z-10 flex flex-col gap-5 md:gap-6 items-start">
              {/* Icon */}
              <div
                className={`w-[48px] h-[48px] rounded-[12px] flex items-center justify-center shrink-0 border transition-colors duration-300
                  ${isActive ? "bg-[#ECE1CE] border-[#e8d1ab] text-black" : "bg-black border-white/10 text-[#e8d1ab]"}
                `}
              >
                <step.icon size={24} />
              </div>

              {/* Content */}
              <div>
                <h3
                  className={`text-base md:text-xl font-medium mb-2 transition-colors duration-300 ${isActive ? "text-[#E8D1AB]" : "text-white"}`}
                >
                  {step.title}
                </h3>
                <p className={`text-sm md:text-base leading-[24px] ${isActive ? "text-[#E8D1AB]/80" : "text-white/70"} font-medium`}>
                  {step.subtext}
                </p>

                <p className="text-xs md:text-[15px] leading-[24px] text-white/60 font-light">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
