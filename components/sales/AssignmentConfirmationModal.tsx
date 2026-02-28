import React from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CountProps {
  selected: number;
  required: number;
}

interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  videographerCount: CountProps;
  photographerCount: CountProps;
}

export const AssignmentConfirmationModal: React.FC<AssignmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  videographerCount,
  photographerCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#101010] border border-white/10 rounded-2xl p-6 shadow-xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-[#E8D1AB]" size={24} />
          <h2 className="text-lg font-semibold text-white">Confirm Assignment</h2>
        </div>

        {/* Body */}
        <p className="text-sm text-white/70 mb-6">
          You have selected more creative partners than requested for this lead.
        </p>

        {/* Counts Box */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 space-y-4 mb-6">
          
          {/* Videographers Row */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/70">Videographers:</span>
            <span
              className={`font-medium ${
                videographerCount.selected > videographerCount.required
                  ? "text-[#E8D1AB]" // Highlight in gold if over limit
                  : "text-white"
              }`}
            >
              {videographerCount.selected} selected (Required: {videographerCount.required})
            </span>
          </div>

          {/* Photographers Row */}
          <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5">
            <span className="text-white/70">Photographers:</span>
            <span
              className={`font-medium ${
                photographerCount.selected > photographerCount.required
                  ? "text-[#E8D1AB]" // Highlight in gold if over limit
                  : "text-white"
              }`}
            >
              {photographerCount.selected} selected (Required: {photographerCount.required})
            </span>
          </div>

        </div>

        <p className="text-xs text-white/40 italic mb-6">
          CPs who accept the request first will be assigned to the shoot.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
          >
            Confirm & Assign
          </Button>
        </div>
      </div>
    </div>
  );
};