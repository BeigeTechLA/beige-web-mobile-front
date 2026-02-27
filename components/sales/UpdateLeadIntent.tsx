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
}: UpdateLeadIntentModalProps) => {
  const [intent, setIntent] = useState(currentIntent);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[560px] bg-[#000000] border border-white/40 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 lg:px-7 lg:py-12 border-b border-[#CACACA]">
          <h2 className="text-lg lg:text-3xl font-semibold text-white">Update Lead Intent</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#2B2626] hover:bg-white/10 text-white/70 transition-colors"
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
            labelBg={"bg-[#000]"}
            required
          />

          {/* Notes Input */}
          <div className="relative group">
            <label className="absolute -top-2.5 left-4 px-1 bg-[#000] text-sm text-white/60 group-focus-within:text-[#E8D1AB] transition-colors">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 bg-transparent border border-white/40 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-[#E8D1AB] transition-all"
              placeholder="Enter any additional notes..."
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onSave(intent, notes)}
            className="bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold h-12 px-8 rounded-lg transition-all"
          >
            Save Lead Intent
          </Button>
        </div>
      </div>
    </div>
  );
};