"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqList = items;

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-10 relative overflow-hidden">

      {/* Left Content */}
      <div className="w-full shrink-0">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:mb-16"
        >
          <h2 className="text-3xl md:text-[56px] font-medium text-white">
            Frequently Asked Questions (FAQ)
          </h2>
        </motion.div>
      </div>

      {/* Right Grid */}
      <div className="w-full">
        {/* FAQ Items */}
        {faqList.map((item, index) => {
          const isOpen = openIndex === index;
          const isLast = index === faqList.length - 1;
          const isFirst = index === 0;

          // console.log(item.question);


          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className={`
                      ${!isLast ? "border-b border-white/10" : ""}
                      ${isFirst ? "pt-0" : "pt-5 lg:pt-6"}
                      ${isLast ? "pb-0" : "pb-5 lg:pb-6"}
                    `}
            >
              <button
                onClick={() => toggleItem(index)}
                className="flex justify-between items-center w-full text-left group"
              >
                <span className="text-sm md:text-lg lg:text-[28px] text-white transition-colors pr-8">
                  {item.question}
                </span>

                {/* Toggle Icon */}
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  {isOpen ? (
                    <Minus className="w-5 h-5 text-white/60 transition-colors" />
                  ) : (
                    <Plus className="w-5 h-5 text-white/60 transition-colors" />
                  )}
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="text-white/60 text-xs md:text-base lg:text-xl leading-relaxed mt-2 lg:mt-4 pr-12">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};