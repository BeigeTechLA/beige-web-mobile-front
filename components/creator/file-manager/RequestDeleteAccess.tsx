"use client";

import React, { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const REASON_OPTIONS = [
  "Duplicate folder",
  "Created by mistake",
  "Project cancelled",
  "No longer needed",
  "Other",
];

interface DeleteAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  itemName?: string;
  itemType?: string;
  isSubmitting?: boolean;
  isDark?: boolean;
}

export default function DeleteAccessRequestModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  isDark = true,
}: DeleteAccessRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason);
  };

  const handleClose = () => {
    setSelectedReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={`max-w-[616px] w-[92vw] lg:w-full p-0 overflow-hidden [&>button]:hidden transition-colors duration-200 border gap-0 ${isDark
          ? "border-white/40 bg-[#000000] text-white"
          : "border-[#D7D7D7] bg-white text-black"
          }`}
      >
        {/* Header Section */}
        <DialogHeader className={`border-b p-4 lg:p-7 text-left transition-colors duration-200 ${isDark ? "border-b-[#CACACA]" : "border-b-[#D7D7D7]"}`}>
          <div className="flex items-start justify-between gap-3 lg:gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className={`text-base lg:text-3xl font-bold transition-colors truncate ${isDark ? "text-white" : "text-black"}`}>
                Request Deletion Access
              </DialogTitle>
              <DialogDescription className={`mt-1 lg:mt-3.5 text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-[#727272]"}`}>
                You need admin approval to delete files from this folder. If approved, deletion access will be available for 3 days.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={`rounded-full p-1.5 lg:p-2 transition-colors shrink-0 ${isDark ? "bg-[#2B2626] text-white/60 hover:text-white" : "bg-black/5 text-black/60 hover:text-black"}`}
            >
              <X size={28} />
            </button>
          </div>
        </DialogHeader>

        {/* Content Body - Target Info Display */}
        <div className="p-4 lg:p-7 flex flex-col gap-3 lg:gap-5">
          <div className={`rounded-lg border p-3 lg:p-5 transition-colors duration-200 flex gap-2 lg:gap-4 ${isDark
            ? "border-[#E8D1AB] bg-[#E8D1AB]/10"
            : "border-[#D7D7D7] bg-[#FAFAFA]"
            }`}>
            <Info className={`w-6 h-6 lg:w-9 lg:h-9 text-[#E8D1AB]`} strokeWidth={1} />
            <div>
              <p className={`text-sm lg:text-base font-medium transition-colors ${isDark ? "text-white" : "text-[#727272]"}`}>
                You will get folder access in this request
              </p>
              <p className={`break-words text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black"}`}>
                Files will remain in the folder until your request is approved.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="flex flex-col gap-3 lg:gap-4">
            <h3 className={`text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Reason for deletion
            </h3>
            <div className="flex flex-col gap-2">
              {REASON_OPTIONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <label
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isDark
                      ? isSelected
                        ? "border-[#E8D1AB] bg-[#0A0A0A] text-[#E8D1AB]"
                        : "border-[#E8D1AB]/10 bg-[#0A0A0A] text-white/40 hover:border-white/20 hover:text-white/80"
                      : isSelected
                        ? "border-black bg-gray-50 text-black"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                        ? "border-[#E8D1AB] bg-[#E8D1AB]"
                        : "border-[#E8D1AB]/30 bg-transparent"
                        }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{reason}</span>
                  </label>
                );
              })}
            </div>
            {
              selectedReason === "Other" && (
                <Textarea
                  placeholder="Tel us more (optional)..."
                  className="rounded-xl border border-[#E8D1AB]/10 placeholder:text-white/50 bg-[#0A0A0A] lg:min-h-[140px]"

                />
              )
            }
          </div>
        </div>

        {/* Footer Actions Panel */}
        <DialogFooter className={`px-4 pb-4 lg:px-7 lg:pb-5 flex gap-3 transition-colors duration-200`}>
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`w-full rounded-lg transition-colors text-sm text-semibold ${isDark
              ? "bg-[#101010] text-white hover:bg-[#101010]/90"
              : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
              }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedReason}
            className={`w-full rounded-lg transition-all text-sm text-semibold ${selectedReason
                ? "bg-[#E8D1AB] text-black hover:bg-[#ebcd9d]"
                : "bg-[#E8D1AB]/20 text-white/30 cursor-not-allowed"
              }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}