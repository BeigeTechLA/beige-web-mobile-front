"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "$10M+", label: "In Shoots Produced By Our Creatives" },
  { value: "5,000+", label: `Beige Creatives In Our Ecosystem` },
  { value: "4,000+", label: "Shoots Booked" },
  { value: ">60", label: "Seconds To Book A Shoot" },
];

export const Stats = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative">

        {/* MOBILE vertical separators (between columns) */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <VerticalSeparatorMobile className="top-[22%]" />
          <VerticalSeparatorMobile className="top-[78%]" />
        </div>

        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="relative flex flex-col items-center justify-center text-center"
          >
            {/* Desktop vertical separators */}
            {i !== STATS.length - 1 && (
              <VerticalSeparatorDesktop
                className="hidden lg:block absolute -right-[28px] top-1/2 -translate-y-1/2 opacity-90"
              />
            )}

            <h3 className="text-lg lg:text-[44px] font-bold text-[#E8D1AB] mb-2 lg:mb-6 whitespace-nowrap">
              {stat.value}
            </h3>

            <p className="text-xs md:text-[22px] text-white/70 font-light leading-snug">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const VerticalSeparatorMobile = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 2 90"
    xmlns="http://www.w3.org/2000/svg"
    className={`
      absolute left-1/2 -translate-x-1/2 -translate-y-1/2
      w-[2px] h-[72px]
      ${className}
    `}
    aria-hidden
  >
    <defs>
      <linearGradient
        id="mobileSeparatorGradient"
        x1="1" y1="0"
        x2="1" y2="90"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="50%" stopColor="white" stopOpacity="0.6" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>

    <line
      x1="1" y1="0"
      x2="1" y2="90"
      stroke="url(#mobileSeparatorGradient)"
      strokeWidth="1"
    />
  </svg>
);

const VerticalSeparatorDesktop = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 2 120"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-[2px] h-[120px] ${className}`}
    aria-hidden
  >
    <defs>
      <linearGradient
        id="desktopSeparatorGradient"
        x1="1" y1="0"
        x2="1" y2="120"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="50%" stopColor="white" stopOpacity="0.7" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>

    <line
      x1="1" y1="0"
      x2="1" y2="120"
      stroke="url(#desktopSeparatorGradient)"
      strokeWidth="1"
    />
  </svg>
);
