"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import Image from "next/image";

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
      <DialogContent className={`w-[calc(100vw-28px)] max-w-md rounded-2xl p-5 lg:p-7 text-center focus:outline-none [&>button]:hidden ${isDark
        ? "border-white/10 bg-[#0A0A0A] text-white"
        : "border-[#E3E3E3] bg-white text-[#101010]"
        }`}>
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="relative h-[120px] w-[200px] lg:h-[200px] lg:w-[322px]">
              <Image
                src="/images/misc/PaymentSuccess.gif"
                alt="Success Animation"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          <DialogTitle className={`lg:mb-2.5 text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>
            {title}
          </DialogTitle>

          <p className={`mb-5 lg:mb-7 text-sm lg:text-base ${isDark ? "text-[#A0A0A0]" : "text-[#32323299]"}`}>
            {description}
          </p>

          <button
            onClick={onClose}
            className={`h-12 w-full rounded-lg text-sm font-semibold transition-all ${isDark
              ? "bg-[#E8D1AB] text-black hover:bg-[#d6c29b]"
              : "bg-[#E8D1AB] text-[#101010] hover:bg-[#d6c29b]"
              }`}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
