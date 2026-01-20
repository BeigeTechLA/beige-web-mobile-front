'use client'; // Ensures that this component is only rendered on the client-side

import * as React from "react";
import { cn } from "../../lib/utils"; // Assuming `cn` is your utility for combining class names

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
        "flex w-full min-h-[120px] rounded-md px-3 py-2 text-base md:text-sm transition-all duration-200", // Base styling

        // -------- NORMAL STATE --------
        "border-[1.5px] border-input bg-background text-foreground placeholder:text-muted-foreground",

        // LIGHT MODE COLORS
        "border-[#D8C29A] bg-white text-black placeholder:text-[#B7AA93]",

        // DARK MODE COLORS
        "dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-white/20",

        // -------- HOVER --------
        "hover:border-[#C9A86A] hover:shadow-[0_0_0_4px_rgba(232,216,184,0.35)]",
        "dark:hover:border-[#d4b375] dark:hover:shadow-[0_0_0_4px_rgba(232,216,184,0.15)]",

        // -------- FOCUS --------
"focus:border-[#E8D1AB] focus:outline-none focus:ring-0",
        "dark:focus:border-[#d4b375] dark:focus:bg-[#262421] dark:focus:shadow-[0_0_0_6px_rgba(232,216,184,0.4)]",

        // -------- DISABLED --------
        "disabled:bg-[#F7F1E6] disabled:cursor-not-allowed disabled:opacity-60",
        "dark:disabled:bg-[#2a2925]",

        // -------- FILE INPUT --------
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",

        // -------- ERROR MODE --------
        error && [
          "border-red-500 text-red-600 placeholder:text-red-500",
          "hover:border-red-500 focus:border-red-500",
          "focus:shadow-[0_0_0_6px_rgba(255,0,0,0.35)]", // Error state shadow

          // DARK MODE ERROR
          "dark:border-red-400 dark:text-red-300 dark:placeholder:text-red-300",
          "dark:hover:border-red-400 dark:focus:border-red-400",
          "dark:focus:shadow-[0_0_0_6px_rgba(255,0,0,0.25)]",
        ],

        className
      )}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
