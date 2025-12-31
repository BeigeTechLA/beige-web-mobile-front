"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const options = [
  "a cool AI Editing for my clothing brand.",
  "corporate event photos.",
  "to book a music video shoot.",
  "to book a family photo shoot.",
  "a wedding videographer.",
  "a photographer for my birthday party.",
];

export default function RotatingInput() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % options.length);
    }, 3000); // Switches every 3 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center mb-4 lg:mb-10">
      <div className="flex items-center space-x-2 text-base lg:text-lg text-white/70">
        <span className="shrink-0">I want</span>

        {/* Outer Container mimicking the screenshot border: min-w-[300px] md:min-w-[450px] */}
        <div className="relative flex items-center p-3 lg:p-4 border border-[#706E73] rounded-[10px] bg-[#171717] overflow-hidden shadow-[0_8px_40px_0_rgba(255,255,255,0.05),_19px_10px_18.9px_0_rgba(255,255,255,0.07)]">
          {/* Vertical Cursor Pipe */}
          {/* <span className="mr-1 text-[#E8D1AB]">|</span> */}

          <div className="relative flex-grow">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="block text-[#E8D1AB] whitespace-nowrap"
              >
                {options[index]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Right Arrow Icon */}
          <motion.span
            className="ml-1 text-gray-400 cursor-pointer hover:text-white transition-colors"
            whileHover={{ x: 3 }}
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </motion.span>
        </div>
      </div>
    </div>
  );
}