"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const V3LoadingFindingCreative = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 25); // 2.5 seconds total

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative w-32 h-32 mb-8">
        {/* Animated Logo Ring */}
         <svg className="w-full h-full" viewBox="0 0 100 100">
             <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="#333" 
                strokeWidth="2"
             />
             <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="#E8D1AB" 
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.1 }}
                style={{ rotate: -90, transformOrigin: "center" }}
             />
         </svg>
         
         {/* Center Logo Icon */}
         <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-[#E8D1AB] rounded-full flex items-center justify-center text-black font-bold text-xl">
                 B
             </div>
         </div>
      </div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl lg:text-3xl font-bold text-white mb-2"
      >
        Matching You With The Best Creative Partner
      </motion.h2>
      
      <p className="text-white/60">Analyzing your project requirements...</p>
      
      {/* Percentage (Optional) */}
      <div className="mt-4 text-[#E8D1AB] font-mono">
          {progress}%
      </div>
    </div>
  );
};
