"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/src/components/landing/ui/container";
import { CalendarCheck, Earth, Layers, HandCoins, Shapes } from "lucide-react";

const STEPS = [
  {
    icon: CalendarCheck,
    title: "Instant Shoot Booking",
    description: "Fill up your calendar with shoots based on the flexibility of your schedule.",
  },
  {
    icon: Earth,
    title: "Global Community",
    description: "Gain access to our Beige global community of Creative Partners and exchange ideas, knowledge, and experiences.",
  },
  {
    icon: Layers,
    title: "Seamless Platform",
    description: "Beige enables you to book videography and photography services anywhere at any time at your fingertips.",
  },
  {
    icon: HandCoins,
    title: "Bonus Opportunities",
    description: "Increase earnings with bonuses for referrals to the Beige community.",
  },
  {
    icon: Shapes,
    title: "Diverse Projects",
    description:"Shoot a diverse array of projects such as commercials, music videos, weddings, corporate events, private events, and anything in between.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="howItWorks" className="py-10 lg:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row justify-center mb-8 md:mb-18">
          <h2 className="text-lg md:text-[56px] font-medium text-gradient-white tracking-tight text-center lg:text-left">
            How It Works
          </h2>
        </div>
        <Steps steps={STEPS} />
      </Container>
    </section>
  );
};

const Steps = ({ steps }: { steps: typeof STEPS }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
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

            <div className="relative z-10 flex flex-col lg:flex-row gap-5 md:gap-6 items-start">
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
