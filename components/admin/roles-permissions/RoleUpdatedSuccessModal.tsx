"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface RoleUpdatedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function RoleUpdatedSuccessModal({
  isOpen,
  onClose,
  title = "Role Updated Successfully",
  description = "The user role and permissions have been updated successfully. Changes will reflect immediately across the platform.",
}: RoleUpdatedSuccessModalProps) {
  const { isDark } = useResolvedTheme();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-[440px] rounded-[32px] p-10 text-center focus:outline-none [&>button]:hidden ${
        isDark
          ? "border-white/10 bg-[#0A0A0A] text-white"
          : "border-[#E3E3E3] bg-white text-[#101010]"
      }`}>
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
             <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#E5D5B8] text-[#101010]"}`}>
              <Check size={48} strokeWidth={3} />
            </div>
            {/* Simple decorative confetti-like elements could be added here if needed, 
                but keeping it clean as per the basic success modal in Figma */}
          </div>
          
          <DialogTitle className={`mb-4 text-[28px] font-bold leading-tight ${isDark ? "text-white" : "text-[#101010]"}`}>
            {title}
          </DialogTitle>
          
          <p className={`mb-10 text-[16px] leading-relaxed ${isDark ? "text-white/60" : "text-[#32323299]"}`}>
            {description}
          </p>

          <button
            onClick={onClose}
            className={`h-[64px] w-full rounded-[20px] text-[18px] font-bold transition-all active:scale-[0.98] ${
              isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#d6c29b]"
                : "bg-[#E5D5B8] text-[#101010] hover:bg-[#d6c29b]"
            }`}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
