"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelDropdown } from "../generic/FloatingLabelDropdown";

interface UpdateLeadIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (intent: string, notes: string) => void;
  currentIntent?: string;
  isDark?: boolean;
}

const intentOptions = [
  { value: "Hot", label: "Hot" },
  { value: "Warm", label: "Warm" },
  { value: "Cold", label: "Cold" },
];

export const UpdateLeadIntentModal = ({
  isOpen,
  onClose,
  onSave,
  currentIntent = "",
  isDark = true,
}: UpdateLeadIntentModalProps) => {
  const [intent, setIntent] = useState(currentIntent);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div
        className={`w-full max-w-[560px] border rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 ${isDark ? "bg-[#000000] border-white/40" : "bg-white border-[#D8D8D8]"
          }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 lg:px-7 lg:py-12 border-b transition-colors ${isDark ? "border-[#CACACA]" : "border-[#E5E5E5]"
          }`}>
          <h2 className={`text-lg lg:text-3xl font-semibold transition-colors ${isDark ? "text-white" : "text-black"
            }`}>
            Update Lead Intent
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all ${isDark
                ? "bg-[#2B2626] hover:bg-white/10 text-white/70"
                : "bg-[#F3F4F6] hover:bg-gray-200 text-black/70"
              }`}
          >
            <X size={28} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-5 lg:px-7 lg:py-10 space-y-6">
          {/* Select Intent */}
          <FloatingLabelDropdown
            label="Select Intent"
            value={intent} // state
            options={intentOptions}
            onChange={(val) => setIntent(val)}
            placeholder="Choose an intent..."
            labelBg={isDark ? "bg-[#000]" : "bg-white"}
            isDark={isDark}
            required
          />

          {/* Notes Input */}
          <div className="relative group">
            <label className={`absolute -top-2.5 left-4 px-1 text-sm transition-colors z-10 ${isDark
                ? "bg-[#000] text-white/60 group-focus-within:text-[#E8D1AB]"
                : "bg-white text-black/60 group-focus-within:text-black/80"
              }`}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full h-32 bg-transparent border rounded-xl p-4 resize-none focus:outline-none transition-all ${isDark
                  ? "text-white border-white/40 focus:border-[#E8D1AB] placeholder:text-white/20"
                  : "text-black border-[#D8D8D8] focus:border-[#E8D1AB] placeholder:text-black/30"
                }`}
              placeholder="Enter any additional notes..."
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onSave(intent, notes)}
            className={`w-full lg:w-fit font-semibold h-12 px-8 rounded-lg transition-all ${isDark
                ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]"
                : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"
              }`}
          >
            Save Lead Intent
          </Button>
        </div>
      </div>
    </div>
  );
};