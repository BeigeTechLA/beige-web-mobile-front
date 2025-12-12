import React from "react";
import { motion } from "framer-motion";

export const Step6Loading = () => {
  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center min-h-[500px] relative overflow-hidden bg-[#0A0A0A]">

      {/* Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Star/Sparkle Animation */}
      <div className="relative z-10 mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          {/* Main Star */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#E8D1AB" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>

        {/* Secondary Stars */}
        <motion.div
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute -top-8 -right-12"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#E8D1AB" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
          className="absolute -bottom-6 -left-10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8D1AB" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center z-10 mt-24"
      >
        <h3 className="text-xl md:text-[33px] font-light text-white tracking-wide mb-2">
          Finding the Perfect Creator for You...
        </h3>
      </motion.div>
    </div>
  );
};
