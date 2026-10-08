"use client";

import React from "react";
import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type RestoreConfirmationModalProps = {
  isOpen: boolean;
  shootName?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  isDark?: boolean;
};

export default function RestoreConfirmationModal({
  isOpen,
  shootName,
  onClose,
  onConfirm,
  isLoading = false,
  isDark = true,
}: RestoreConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? "border-[#222222] bg-[#111111]" : "border-[#D7D7D7] bg-white"}`}>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={`absolute right-4 top-4 rounded-lg p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "text-[#888888] hover:bg-[#222222] hover:text-white" : "text-[#727272] hover:bg-[#F4F5F7] hover:text-black"}`}
          aria-label="Close restore confirmation"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full border ${isDark ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
            <RotateCcw size={24} className="text-emerald-500" />
          </div>

          <h2 className={`mb-2 text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>Restore Shoot</h2>
          <p className={`mb-8 max-w-[300px] text-sm leading-relaxed ${isDark ? "text-[#888888]" : "text-[#727272]"}`}>
            Are you sure you want to restore {shootName || "this shoot"}?
          </p>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className={`h-11 flex-1 rounded-xl border transition-colors ${isDark ? "border-[#222222] bg-[#1A1A1A] text-white hover:bg-[#222222]" : "border-[#D7D7D7] bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="h-11 flex-1 rounded-xl bg-emerald-600 font-medium text-white shadow-lg shadow-emerald-600/10 transition-colors hover:bg-emerald-700"
            >
              {isLoading ? "Restoring..." : "Restore"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
