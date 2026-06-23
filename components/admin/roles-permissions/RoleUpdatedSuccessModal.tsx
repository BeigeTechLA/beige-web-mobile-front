"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] border-white/10 bg-[#0A0A0A] p-10 text-white text-center rounded-[32px] [&>button]:hidden focus:outline-none">
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
             <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E5D5B8] text-black">
              <Check size={48} strokeWidth={3} />
            </div>
            {/* Simple decorative confetti-like elements could be added here if needed, 
                but keeping it clean as per the basic success modal in Figma */}
          </div>
          
          <DialogTitle className="mb-4 text-[28px] font-bold text-white leading-tight">
            {title}
          </DialogTitle>
          
          <p className="mb-10 text-[16px] leading-relaxed text-white/60">
            {description}
          </p>

          <button
            onClick={onClose}
            className="h-[64px] w-full rounded-[20px] bg-[#E5D5B8] text-[18px] font-bold text-black transition-all hover:bg-[#d6c29b] active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
