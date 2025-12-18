import React from "react";
import { motion } from "framer-motion";

export const Step6Loading = () => {
  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center min-h-[500px] relative overflow-hidden bg-[#0A0A0A]">

      {/* Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Sparkle Glow */}
      <div className="absolute top-15 left-0">
        <motion.div
          initial={{ opacity: 0.8, scale: 0.75 }}
          animate={{
            opacity: [0.8, 0.95, 0.8],
            scale: [0.75, 0.95, 0.75]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="470" height="438" viewBox="0 0 470 438" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.6">
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M228.533 218.779C228.533 339.607 227.806 437.557 226.909 437.557C226.012 437.557 225.285 339.607 225.285 218.779C225.285 97.9507 226.012 0.000183137 226.909 0.000183176C227.806 0.000183216 228.533 97.9507 228.533 218.779Z" fill="url(#paint0_radial_137_3193)" />
              </g>
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M226.907 217.091C361.06 217.091 469.813 217.847 469.813 218.78C469.813 219.712 361.06 220.468 226.907 220.468C92.7537 220.468 -15.999 219.712 -15.999 218.78C-15.999 217.847 92.7537 217.091 226.907 217.091Z" fill="url(#paint1_radial_137_3193)" />
              </g>
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M226.908 208.888C233.955 208.888 239.668 213.316 239.668 218.778C239.668 224.239 233.955 228.667 226.908 228.667C219.86 228.667 214.147 224.239 214.147 218.778C214.147 213.316 219.86 208.888 226.908 208.888Z" fill="url(#paint2_radial_137_3193)" />
              </g>
            </g>
            <defs>
              <radialGradient id="paint0_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.909 218.779) scale(1.62403 163.377)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="paint1_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.907 218.78) rotate(-90) scale(1.6885 181.393)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="paint2_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.908 218.778) rotate(-90) scale(9.88966 9.52882)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Sparkle Glow */}
      <div className="absolute bottom-10 right-0">
        <motion.div
          initial={{ opacity: 0.8, scale: 0.75 }}
          animate={{
            opacity: [0.8, 0.95, 0.8],
            scale: [0.75, 0.95, 0.75]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="470" height="438" viewBox="0 0 470 438" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.6">
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M228.533 218.779C228.533 339.607 227.806 437.557 226.909 437.557C226.012 437.557 225.285 339.607 225.285 218.779C225.285 97.9507 226.012 0.000183137 226.909 0.000183176C227.806 0.000183216 228.533 97.9507 228.533 218.779Z" fill="url(#paint0_radial_137_3193)" />
              </g>
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M226.907 217.091C361.06 217.091 469.813 217.847 469.813 218.78C469.813 219.712 361.06 220.468 226.907 220.468C92.7537 220.468 -15.999 219.712 -15.999 218.78C-15.999 217.847 92.7537 217.091 226.907 217.091Z" fill="url(#paint1_radial_137_3193)" />
              </g>
              <g style={{ mixBlendMode: 'color-dodge' }}>
                <path d="M226.908 208.888C233.955 208.888 239.668 213.316 239.668 218.778C239.668 224.239 233.955 228.667 226.908 228.667C219.86 228.667 214.147 224.239 214.147 218.778C214.147 213.316 219.86 208.888 226.908 208.888Z" fill="url(#paint2_radial_137_3193)" />
              </g>
            </g>
            <defs>
              <radialGradient id="paint0_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.909 218.779) scale(1.62403 163.377)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="paint1_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.907 218.78) rotate(-90) scale(1.6885 181.393)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="paint2_radial_137_3193" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(226.908 218.778) rotate(-90) scale(9.88966 9.52882)">
                <stop offset="0.421947" stopColor="#FFFFF7" />
                <stop offset="1" stopColor="#E8D1AB" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Star/Sparkle Animation */}
      <div className="relative z-10 mb-12">
        <motion.div
          initial={{ scale: 0.2, opacity: 0.2 }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
          className="relative"
        >
          {/* Main Star */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#E8D1AB" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>

        {/* Secondary Stars (No changes needed here) */}
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
        <h3 className="text-base lg:text-[33px] font-light text-white tracking-wide mb-2">
          Finding the Perfect Creator for You...
        </h3>
      </motion.div>
    </div>
  );
};
