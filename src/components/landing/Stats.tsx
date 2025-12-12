"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "$10M+", label: "In Shoots Produced By Our Creatives" },
  { value: "5,000+", label: "Beige Creatives In Our Ecosystem" },
  { value: "4,000+", label: "Shoots Booked" },
  { value: ">60", label: "Seconds To Book A Shoot" },
];

export const Stats = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="relative flex flex-col items-center justify-center text-center"
          >
            {/* Separator - vertical */}
            {i !== STATS.length - 1 && (
              <img
                src="/svg/Separator.svg"
                alt=""
                className="
                  hidden lg:block
                  absolute -right-[28px] top-1/2 -translate-y-1/2
                  h-full opacity-80
                "
              />
            )}

            {/* Separator - mobile (2-column layout) */}
            {i % 2 === 0 && i !== STATS.length - 1 && (
              <img
                src="/svg/Separator.svg"
                alt=""
                className="
                  lg:hidden
                  absolute -right-[16px] top-1/2 -translate-y-1/2
                  h-[50px] w-auto opacity-40
                "
              />
            )}

            <h3 className="text-3xl md:text-[44px] font-bold text-[#E8D1AB] mb-6 whitespace-nowrap">
              {stat.value}
            </h3>

            <p className="text-sm md:text-xl text-white/70 font-light leading-snug">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
