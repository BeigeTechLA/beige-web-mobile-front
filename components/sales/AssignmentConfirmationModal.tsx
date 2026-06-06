"use client";

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
  isDark?: boolean;
}

interface AssignmentMissingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingDetails: string[];
  isDark?: boolean;
}

export const AssignmentConfirmationModal: React.FC<AssignmentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  videographerCount,
  photographerCount,
  isDark = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md border rounded-xl p-6 shadow-2xl relative transition-colors duration-300 ${isDark ? "bg-[#101010] border-white/10" : "bg-white border-[#D8D8D8]"
          }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${isDark ? "text-white/50 hover:text-white" : "text-black/40 hover:text-black"
            }`}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-[#E8D1AB]" size={24} />
          <h2 className={`text-lg font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
            Confirm Assignment
          </h2>
        </div>

        {/* Body */}
        <p className={`text-sm mb-6 transition-colors ${isDark ? "text-white/70" : "text-black/70"
          }`}>
          You have selected more creative partners than requested for this lead.
        </p>

        {/* Counts Box */}
        <div className={`border rounded-xl p-4 space-y-4 mb-6 transition-colors ${isDark ? "bg-[#1A1A1A] border-white/5" : "bg-gray-50 border-[#E5E5E5]"
          }`}>

          {/* Videographers Row */}
          <div className="flex justify-between items-center text-sm">
            <span className={isDark ? "text-white/70" : "text-black/60"}>Videographers:</span>
            <span
              className={`font-medium ${videographerCount.selected > videographerCount.required
                ? "text-[#E8D1AB]"
                : (isDark ? "text-white" : "text-black")
                }`}
            >
              {videographerCount.selected} selected (Required: {videographerCount.required})
            </span>
          </div>

          {/* Photographers Row */}
          <div className={`flex justify-between items-center text-sm pt-4 border-t transition-colors ${isDark ? "border-white/5" : "border-[#E5E5E5]"}`}>
            <span className={isDark ? "text-white/70" : "text-black/60"}>Photographers:</span>
            <span
              className={`font-medium ${photographerCount.selected > photographerCount.required
                ? "text-[#E8D1AB]" // Highlight in gold if over limit
                : (isDark ? "text-white" : "text-black")
                }`}
            >
              {photographerCount.selected} selected (Required: {photographerCount.required})
            </span>
          </div>

        </div>

        <p className={`text-xs italic mb-6 transition-colors ${
          isDark ? "text-white/40" : "text-black/40"
        }`}>
          CPs who accept the request first will be assigned to the shoot.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className={`bg-transparent border transition-all ${
              isDark 
                ? "border-white/10 text-white hover:bg-white/5" 
                : "border-[#D8D8D8] text-black hover:bg-gray-100"
            }`}
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

export const AssignmentMissingDetailsModal: React.FC<AssignmentMissingDetailsModalProps> = ({
  isOpen,
  onClose,
  missingDetails,
  isDark = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className={`w-full max-w-md border rounded-xl p-6 shadow-2xl relative transition-colors duration-300 ${
          isDark ? "bg-[#101010] border-white/10" : "bg-white border-[#D8D8D8]"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${
            isDark ? "text-white/50 hover:text-white" : "text-black/40 hover:text-black"
          }`}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-[#E8D1AB]" size={24} />
          <h2 className={`text-lg font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
            Missing Required Details
          </h2>
        </div>

        <p className={`text-sm mb-5 transition-colors ${isDark ? "text-white/70" : "text-black/70"}`}>
          Complete these details before assigning CPs.
        </p>

        <div className={`border rounded-xl p-4 mb-6 transition-colors ${
          isDark ? "bg-[#1A1A1A] border-white/5" : "bg-gray-50 border-[#E5E5E5]"
        }`}>
          <ul className="space-y-3">
            {missingDetails.map((detail) => (
              <li key={detail} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E8D1AB] shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};
