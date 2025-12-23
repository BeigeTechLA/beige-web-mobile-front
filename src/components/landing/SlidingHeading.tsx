"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SlidingHeading = () => {
  const words = ["Influencers", "Streamers", "Actors", "Models", "Personalities"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <h2 className="text-lg md:text-[56px] leading-[1.1] font-medium text-gradient-white mb-2.5 md:mb-6 text-center">
      <span>Partnered with the World&apos;s Top</span>{" "}
      <span className="relative block lg:inline-block h-[1.1em] overflow-hidden min-w-[4ch] md:min-w-[7ch] lg:min-w-[340px] mx-auto align-bottom">
        <AnimatePresence mode="wait">
          <motion.span
            key={words[index]}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 whitespace-nowrap text-gradient-grey lg:text-left"
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </h2>
  );
};