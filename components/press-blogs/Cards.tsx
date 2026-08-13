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
    <div className="my-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className={`relative p-4 lg:p-8 rounded-[24px] overflow-hidden bg-[#0A0A0A] transition-colors duration-300`}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-bl from-[#e8d1ab]/10 via-[#e8d1ab]/5 to-transparent opacity-100"
          />
          <div className="relative z-10 flex flex-col gap-5 md:gap-6 items-start">
            <h3 className={`text-base md:text-2xl font-medium mb-2 transition-colors duration-300 text-white`}>
              {item.title}
            </h3>
            {item.description && (
              <div className={`text-sm md:text-lg text-white/70 font-medium font-['Yrsa']`}>
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