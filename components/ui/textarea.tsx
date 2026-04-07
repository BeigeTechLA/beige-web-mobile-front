'use client';

import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        {...props}
        className={cn(
          // 1. BASE LAYOUT & TRANSITIONS
          "flex w-full min-h-[120px] rounded-md px-3 py-2 text-base md:text-sm transition-all duration-200",
          "border-[1.5px] border-input focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",

          // 2. DEFAULT BRAND COLORS (LIGHT MODE)
          "bg-white border-[#D8C29A] text-black placeholder:text-[#B7AA93]",
          "hover:border-[#C9A86A] hover:shadow-[0_0_0_4px_rgba(232,216,184,0.35)]",
          "focus:border-[#E8D1AB]",
          "disabled:bg-[#F7F1E6]",

          // 3. DEFAULT BRAND COLORS (DARK MODE)
          "dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/20",
          "dark:hover:border-[#d4b375] dark:hover:shadow-[0_0_0_4px_rgba(232,216,184,0.15)]",
          "dark:focus:border-[#d4b375] dark:focus:bg-[#262421] dark:focus:shadow-[0_0_0_6px_rgba(232,216,184,0.4)]",
          "dark:disabled:bg-[#2a2925]",

          // 4. ERROR STATE (Overrides Defaults)
          error && [
            "border-red-500 text-red-600 placeholder:text-red-500",
            "hover:border-red-500 focus:border-red-500",
            "focus:shadow-[0_0_0_6px_rgba(255,0,0,0.35)]",
            "dark:border-red-400 dark:text-red-300 dark:placeholder:text-red-300",
            "dark:hover:border-red-400 dark:focus:border-red-400",
            "dark:focus:shadow-[0_0_0_6px_rgba(255,0,0,0.25)]",
          ],
          className
        )}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };