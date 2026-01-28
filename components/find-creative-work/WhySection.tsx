"use client";

import React from "react";
import Image from "next/image";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { BadgeCheck } from "lucide-react";

const REASONS = [
  { text: "Earn commissions effortlessly" },
  { text: "No extra sales work—we handle everything" },
  { text: "Unlock priority bookings & premium gigs" },
];

export const WhySection = () => {
  return (
    <section className="py-10 md:py-32 bg-[#010101] relative overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row justify-between mb-7 md:mb-10 gap-2.5 lg:gap-10">
          <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white tracking-tight">
            Earn More! Book More!<br />
            Grow More!
          </h2>

          <p className="text-xs lg:text-base lg:leading-[28px] text-white/50 font-light max-w-2xl">
            Join the Beige Video Creative Partner Referral Program and turn your connections into cash! As a trusted CP, you can earn up to $250 per referral by introducing new clients while you’re on set. Our three-tiered bonus system rewards you for every successful booking—no extra work required!
          </p>
        </div>

        <div className="mb-5 lg:mb-12 relative w-full aspect-[16/7] overflow-hidden rounded-[10px] lg:rounded-[20px]">
          <Image 
            src="/images/categories/behind_scenes.jpg" //Temp image
            alt="Beige Creative Partners"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-7 lg:p-15 bg-gradient-to-b from-[#E5CFA0] to-[#C9A668] rounded-[10px] lg:rounded-[20px] flex flex-col lg:flex-row gap-10 xl:gap-25 items-center">
          <p className="text-lg lg:text-[56px] leading-[1.1] font-medium text-black tracking-tight shrink-0">
            Why Join<br /> Beige?
          </p>
          
          <div className="flex flex-1 w-full justify-between items-center">
            {REASONS.map((reason, i) => (
              <React.Fragment key={i}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="flex-1 flex flex-col gap-4 lg:gap-7 items-start"
              >
                  <div className="text-black">
                  <BadgeCheck size={54} strokeWidth={1} />
                    <p className="text-xs lg:text-[23px] font-medium leading-snug mt-4 lg:mt-7">
                    {reason.text}
                  </p>
                </div>
              </motion.div>

                {/* Separator only between items */}
                {i !== REASONS.length - 1 && (
                  <VerticalSeparatorDesktop className="hidden lg:block mx-4 xl:mx-10 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};


const VerticalSeparatorDesktop = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1" height="127" viewBox="0 0 1 127" fill="none" className={`w-[2px] h-[120px] ${className}`}>
    <path d="M0.25 0L0.250006 126.085" stroke="url(#paint0_linear_2659_2968)" strokeWidth="0.5" />
    <defs>
      <linearGradient id="paint0_linear_2659_2968" x1="0.75" y1="-2.18557e-08" x2="0.750006" y2="126.085" gradientUnits="userSpaceOnUse">
        <stop stopOpacity="0" />
        <stop offset="0.5" stopColor="black" />
        <stop offset="1" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);
