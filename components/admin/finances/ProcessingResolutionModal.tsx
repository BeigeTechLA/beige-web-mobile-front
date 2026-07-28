"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ProcessingResolutionModalProps = {
  open: boolean;
  isDark?: boolean;
  title?: string;
  description?: string;
};

export default function ProcessingResolutionModal({
  open,
  isDark = true,
  title = "Processing Resolution",
  description = "Please wait while we process the payment...",
}: ProcessingResolutionModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => { /* Prevent closing by clicking outside */ }}>
      <DialogContent
        className={`w-[calc(100vw-32px)] max-w-md overflow-hidden !rounded-2xl border p-8 shadow-[0_24px_70px_rgba(0,0,0,0.7)] [&>button]:hidden flex flex-col items-center justify-center text-center transition-colors duration-200 gap-5 ${isDark ? "bg-black border-white/40 text-white" : "bg-white border-black/10 text-black"}`}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Circular Spinner Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center my-2">
          <div className={`absolute inset-0 rounded-full border-4 ${isDark ? "border-white/[0.06]" : "border-black/[0.04]"}`}/>
          <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin rounded-t-full rounded-r-full ${isDark ? "border-t-[#E8D1AB]/60 border-r-[#E8D1AB]/30" : "border-t-[#C4A474] border-r-[#C4A474]/40"}`}/>
        </div>

        {/* Informational Header Context */}
        <div className="space-y-2.5">
          <h2 className={`text-lg lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h2>
          <p className={`text-sm lg:text-base  ${isDark ? "text-[#A0A0A0]" : "text-[#666666]"}`}>
            {description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}