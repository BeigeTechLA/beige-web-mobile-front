import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
  isDark?: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "User Deleted Successfully",
  description = "The user was deleted successfully and is now available in Archive History for reference.",
  buttonText = "View Archive History",
  isDark = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-2xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 border ${
          isDark
            ? "bg-[#0A0A0A] border-[#222222]"
            : "bg-white border-[#D7D7D7]"
        }`}
      >
        {/* Success Icon with Confetti */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Confetti decorations */}
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-[#FF6B6B] rounded-full animate-ping" />
            <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-[#4ECDC4] rounded-full animate-ping delay-100" />
            <div className="absolute -bottom-2 -left-3 w-1.5 h-1.5 bg-[#FFE66D] rounded-full animate-ping delay-200" />
            <div className="absolute -bottom-1 -right-2 w-2 h-2 bg-[#95E1D3] rounded-full animate-ping delay-300" />
            <div className="absolute top-0 -left-3 w-1 h-1 bg-[#F38181] rounded-full animate-ping delay-150" />
            <div className="absolute top-1 -right-2 w-1.5 h-1.5 bg-[#AA96DA] rounded-full animate-ping delay-250" />
            
            {/* Main checkmark circle */}
            <div className="w-16 h-16 rounded-full bg-[#E5D5B8] flex items-center justify-center">
              <Check size={32} className="text-black" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <h2 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h2>

          <p className={`text-sm leading-relaxed mb-8 max-w-[320px] ${
            isDark ? "text-[#888888]" : "text-[#727272]"
          }`}>
            {description}
          </p>

          {/* Action Button */}
          <Button
            onClick={onConfirm}
            className="w-full h-11 rounded-xl font-medium bg-[#E5D5B8] hover:bg-[#D4C4A8] text-black shadow-lg transition-colors"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};