"use client"

import React, { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div
      className="relative flex h-12 w-24 cursor-pointer items-center rounded-full bg-[var(--toggle-bg)] border border-[var(--toggle-border)] p-1  transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      tabIndex={0}
    >
      {/* Sliding Indicator */}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-[var(--indicator-bg)] z-0"
        initial={false}
        animate={{
          x: isDark ? 0 : 48,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {/* Icon Layer */}
      <div className="relative z-10 flex gap-2 w-full h-full items-center">
        <div className="flex-1 p-2.5">
          <Moon
            className={`h-5 w-5 transition-colors text-black`}
            strokeWidth={2}
          />
        </div>
        
        <div className="flex-1 p-2.5">
          <Sun
            className={`h-5 w-5 transition-colors ${
              !isDark ? "text-black" : "text-white"
            }`}
            strokeWidth={2}
          />
        </div>
      </div>
    </div>
  )
}