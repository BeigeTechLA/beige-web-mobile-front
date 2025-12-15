"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { Brain, Clapperboard, Video, Film } from "lucide-react";
import Image from "next/image";

const STEPS = [
  {
    icon: Brain,
    title: "AI Matchmaking",
    description:
      "Our proprietary AI Matchmaking Algorithm connects you with the perfect videographer or photographer — customized to your shoot type using insights from over 4,000+ Beige productions.",
  },
  {
    icon: Clapperboard,
    title: "Pre Production",
    description:
      "Once you've approved your Beige Creative Partner, we move into pre-production. Our team handles all the planning to ensure your shoot is smooth, efficient, and tailored to your goals.",
  },
  {
    icon: Video,
    title: "Production",
    description:
      "Lights, camera, action! Your assigned Beige Creative captures your content based on the strategy and materials defined during pre-production.",
  },
  {
    icon: Film,
    title: "AI Powered-Post Production",
    description:
      "Our team edits your content into polished, on-brand assets across your desired formats — ready for immediate distribution across platforms.",
  },
];

export const Process = () => {
  return (
    <section className="py-20 md:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="border-b border-t border-b-white/60 border-t-white/60 w-fit px-10 py-2 text-center mb-6">
          <p className="text-base text-white">Our Process</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Left */}
          <div className="w-full lg:w-1/2 flex flex-col gap-12">
            <div>
              <h2 className="text-2xl md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-8 tracking-tight">
                Beige is built by creators, <br />
                for creators.
              </h2>

              <p className="text-white/50 text-sm lg:text-base leading-[28px] font-light mb-12 max-w-[500px]">
                Beige Media makes it easy for brands to create any video they
                need with a single, trusted partner. Our fast, simple, and
                transparent process takes the stress out of video production.
              </p>
            </div>

            {/* Image */}
            <div className="relative w-full h-[200px] lg:h-[400px] rounded-[24px] overflow-hidden border border-white/10">
               <video
                className="absolute inset-0 w-full h-full object-cover"
                src={"/videos/Camera_Operator_Filmmaker.mp4"} //this will be replaced with DO video fetched via api
                autoPlay
                loop
                muted
                playsInline
              />

              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-white/80 text-sm">
                  Behind the Scenes
                </span>
              </div>
            </div>
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
            className={`
              relative p-4 lg:p-8 rounded-[24px] overflow-hidden
              bg-[#0A0A0A]
              transition-colors duration-300
              border
              ${isActive
                ? "border-[#e8d1ab]/60"
                : "border-transparent"}
            `}
          >
            {/* Constant Glow */}
            <div
              className="
                pointer-events-none absolute inset-0 rounded-[24px]
                bg-gradient-to-bl from-[#e8d1ab]/20 via-[#e8d1ab]/5 to-transparent
                opacity-100
              "
            />

            <div className="relative z-10 flex flex-col gap-6 items-start">
              {/* Icon */}
              <div
                className={`
                  w-[48px] h-[48px] rounded-[12px] flex items-center justify-center shrink-0
                  border transition-colors duration-300
                  ${isActive
                    ? "bg-[#ECE1CE] border-[#e8d1ab] text-black"
                    : "bg-black border-white/10 text-[#e8d1ab]"
                  }
                `}
              >
                <step.icon size={24} />
              </div>

              {/* Content */}
              <div>
                <h3
                  className={`text-xl font-medium mb-2 transition-colors duration-300 ${isActive ? "text-[#E8D1AB]" : "text-white"
                    }`}
                >
                  {step.title}
                </h3>

                <p className="text-[15px] leading-[24px] text-white/60 font-light">
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
