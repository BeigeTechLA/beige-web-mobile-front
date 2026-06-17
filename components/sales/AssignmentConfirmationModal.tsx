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
  onConfirm?: () => void;
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
  onConfirm,
  missingDetails,
  isDark = true
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4 ${isDark ? "bg-black/70" : "bg-black/50"}`}>
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl transition-colors duration-300 ${
          isDark ? "border-white/10 bg-[#111111] text-white" : "border-[#D8D8D8] bg-white text-black"
        }`}
      >
        <div className={`border-b px-6 py-5 ${isDark ? "border-white/10 bg-[#151515]" : "border-[#E9E9E9] bg-[#FAFAFA]"}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-[#E8D1AB]/15 text-[#E8D1AB]" : "bg-[#EFE1BE] text-[#7A5A00]"}`}>
              <AlertCircle size={20} />
            </div>
            <div className="min-w-0">
              <h2 className={`text-lg font-semibold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                Missing Required Details
              </h2>
              <p className={`mt-1 text-sm transition-colors ${isDark ? "text-white/65" : "text-black/60"}`}>
                The following required information is missing. Are you sure you want to continue?
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-full p-1 transition-colors ${
            isDark ? "text-white/45 hover:bg-white/5 hover:text-white" : "text-black/40 hover:bg-black/5 hover:text-black"
          }`}
        >
          <X size={18} />
        </button>

        <div className="px-6 py-5">
            <div className={`rounded-2xl border p-4 transition-colors ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-[#E9E9E9] bg-[#FAFAFA]"}`}>
              <ul className="space-y-3">
                {missingDetails.map((detail) => (
                  <li
                    key={detail}
                    className={`flex items-start gap-2 text-sm ${isDark ? "text-white/80" : "text-black/70"}`}
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E8D1AB] shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
        </div>

        <div className={`flex justify-end gap-3 border-t px-6 py-4 ${isDark ? "border-white/10" : "border-[#E9E9E9]"}`}>
          <Button
            variant="outline"
            onClick={onClose}
            className={`bg-transparent border transition-all ${
              isDark
                ? "border-white/10 text-white hover:bg-white/5"
                : "border-[#D8D8D8] text-black hover:bg-gray-100"
            }`}
          >
            No
          </Button>
          <Button
            onClick={onConfirm || onClose}
            className="bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
          >
            Yes
          </Button>
        </div>
      </div>
    </div>
  );
};
