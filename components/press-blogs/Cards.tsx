"use client";

import React from "react";
import { motion } from "framer-motion";

export interface CardItemData {
  title: React.ReactNode;
  description: React.ReactNode;
}

interface CardsProps {
  items: CardItemData[];
}

export const Cards: React.FC<CardsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative p-6 lg:p-8 rounded-[24px] overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-xl transition-colors duration-300"
        >
          {/* Subtle Accent Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-bl from-[#e8d1ab]/10 via-[#e8d1ab]/5 to-transparent opacity-100" />

          <div className="relative z-10 flex flex-col gap-4 items-start w-full">
            <h3 className="text-lg md:text-2xl font-medium transition-colors duration-300 text-white font-['Instrument_Sans']">
              {item.title}
            </h3>

            {item.description && (
              <div className="w-full text-sm md:text-base text-white/70 font-['Yrsa'] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_li]:text-white/80">
                {item.description}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Cards;