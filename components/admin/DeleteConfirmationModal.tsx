import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  isDark?: boolean; // Added theme control prop
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  description = "Are you sure you want to delete this record? This action cannot be undone.",
  isLoading = false,
  isDark = true, // Defaulting to your workspace preference
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border ${isDark
            ? "bg-[#111111] border-[#222222]"
            : "bg-white border-[#D7D7D7]"
          }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors p-1 rounded-lg ${isDark
              ? "text-[#888888] hover:text-white hover:bg-[#222222]"
              : "text-[#727272] hover:text-black hover:bg-[#F4F5F7]"
            }`}
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${isDark
              ? "bg-red-500/10 border-red-500/20"
              : "bg-red-50 border-red-200"
            }`}>
            <AlertTriangle size={24} className="text-red-500" />
          </div>

          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>
            {title}
          </h2>

          <p className={`text-sm leading-relaxed mb-8 max-w-[280px] ${isDark ? "text-[#888888]" : "text-[#727272]"
            }`}>
            {description}
          </p>

          {/* Actions */}
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 h-11 rounded-xl transition-colors border ${isDark
                  ? "bg-[#1A1A1A] border-[#222222] text-white hover:bg-[#222222]"
                  : "bg-[#F4F5F7] border-[#D7D7D7] text-black hover:bg-[#E5E7EB]"
                }`}
            >
              Cancel
            </Button>

            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 h-11 rounded-xl font-medium shadow-lg transition-colors ${isDark
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/10 text-white"
                  : "bg-red-200 hover:bg-red-300 shadow-red-500/20 text-red"
                }`}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};