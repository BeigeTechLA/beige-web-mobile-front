"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DeleteAccountFinalModalProps {
  open: boolean;
  isDark?: boolean;
  brandName?: string;
  graceDays?: number;
  onGoBack: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export const DeleteAccountFinalModal = ({
  open,
  isDark = true,
  brandName = "Beige",
  graceDays = 60,
  onGoBack,
  onDelete,
  isLoading = false,
}: DeleteAccountFinalModalProps) => {
  const [checked, setChecked] = useState(false);

  // reset checkbox whenever the modal closes
  useEffect(() => {
    if (!open) setChecked(false);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onGoBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onGoBack, isLoading]);

  const scheduledDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + graceDays);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, graceDays]);

  if (!open) return null;

  const labelCls = isDark ? "text-white/50" : "text-zinc-500";
  const valueCls = isDark ? "text-white" : "text-[#171717]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={() => !isLoading && onGoBack()}
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
            <Trash2 size={16} className="text-[#FF6B6B]" />
          </div>
          <h3
            className={`text-base md:text-lg font-medium tracking-tight ${valueCls}`}
          >
            Confirm Account Deletion
          </h3>
        </div>

        <p className={`text-xs md:text-sm ${isDark ? "text-white/60" : "text-zinc-500"}`}>
          You&apos;re about to submit a request to delete your {brandName} account.
        </p>

        {/* Summary */}
        <div
          className={`mt-4 rounded-xl px-4 py-3 space-y-2.5 ${
            isDark ? "bg-[#1f1f1f]" : "bg-zinc-100"
          }`}
        >
          <div className="flex items-center justify-between gap-4 text-xs md:text-sm">
            <span className={labelCls}>Account access</span>
            <span className={`text-right ${valueCls}`}>Deactivated after confirmation</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs md:text-sm">
            <span className={labelCls}>Scheduled deletion</span>
            <span className={`text-right ${valueCls}`}>{scheduledDate}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs md:text-sm">
            <span className={labelCls}>Grace period</span>
            <span className="text-right text-[#E8D1AB]">
              {graceDays} days · cancellation available
            </span>
          </div>
        </div>

        {/* Checkbox */}
        <div
          onClick={() => setChecked((value) => !value)}
          className="mt-4 flex items-start gap-3 cursor-pointer select-none"
        >
          <Checkbox
            id="delete-account-final-confirm"
            aria-label="Confirm account deletion"
            onClick={(event) => event.stopPropagation()}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/30 bg-transparent data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
          />
          <span className={`text-xs ${isDark ? "text-white/80" : "text-zinc-700"}`}>
            I confirm that I want to delete my {brandName} account.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onGoBack}
            disabled={isLoading}
            className={`h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-[#171717]"
            }`}
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!checked || isLoading}
            className="h-10 rounded-lg text-sm font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E8D1AB]"
          >
            {isLoading ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
};
