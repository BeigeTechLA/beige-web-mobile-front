"use client";

import React, { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DeleteAccountConfirmModalProps {
  open: boolean;
  isDark?: boolean;
  onCancel: () => void;
  onProceed: () => void;
  isLoading?: boolean;
}

export const DeleteAccountConfirmModal = ({
  open,
  isDark = true,
  onCancel,
  onProceed,
  isLoading = false,
}: DeleteAccountConfirmModalProps) => {
  const [checked, setChecked] = useState(false);

  // reset checkbox whenever the modal closes
  useEffect(() => {
    if (!open) setChecked(false);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[520px] rounded-2xl border p-4 md:p-5 shadow-2xl transition-colors ${
          isDark ? "bg-black border-white/10" : "bg-white border-zinc-200"
        }`}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B6B]/15">
            <TriangleAlert size={16} className="text-[#FF6B6B]" />
          </div>
          <h3
            className={`text-base md:text-lg font-medium tracking-tight ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            Are You Sure You Want to Delete Your Account?
          </h3>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <p className={`text-xs md:text-sm leading-relaxed ${isDark ? "text-white/60" : "text-zinc-500"}`}>
            Your account will be deactivated immediately after confirmation. Your eligible data will
            be scheduled for deletion after{" "}
            <span className="font-bold text-[#E8D1AB]">60 days.</span>
          </p>
          <p className={`text-xs md:text-sm leading-relaxed ${isDark ? "text-white/60" : "text-zinc-500"}`}>
            You can cancel this request during the grace period. Once deletion is completed, your
            data may not be recoverable.
          </p>
        </div>

        {/* Checkbox */}
        <div
          onClick={() => setChecked((value) => !value)}
          className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer select-none ${
            isDark ? "bg-[#161616] border-white/5" : "bg-zinc-50 border-zinc-200"
          }`}
        >
          <Checkbox
            id="delete-account-confirm"
            aria-label="Confirm account deletion warning"
            onClick={(event) => event.stopPropagation()}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 bg-transparent data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
          />
          <span className={`text-xs ${isDark ? "text-white/80" : "text-zinc-700"}`}>
            I understand the consequences of deleting my account and want to proceed.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`h-10 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-[#171717]"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!checked || isLoading}
            className="h-10 rounded-lg text-sm font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E8D1AB]"
          >
            {isLoading ? "Please wait..." : "Proceed to Verification"}
          </button>
        </div>
      </div>
    </div>
  );
};
