"use client";

import React from "react";
import Image from "next/image";
import { Info } from "lucide-react";

interface DeleteAccountCancelledModalProps {
  open: boolean;
  isDark?: boolean;
  brandName?: string;
  requestId?: string;
  onGoToAccount: () => void;
}

export const DeleteAccountCancelledModal = ({
  open,
  isDark = true,
  brandName = "Beige",
  requestId,
  onGoToAccount,
}: DeleteAccountCancelledModalProps) => {
  if (!open) return null;

  const titleCls = isDark ? "text-white" : "text-[#171717]";
  const bodyCls = isDark ? "text-white/60" : "text-zinc-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-[460px] rounded-2xl border p-6 shadow-2xl text-center transition-colors ${
          isDark ? "bg-black border-white/10" : "bg-white border-zinc-200"
        }`}
      >
        <div className="relative mx-auto mb-2 h-[150px] w-[150px]">
          <Image
            src="/images/misc/PaymentSuccess.gif"
            alt="Success animation"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <h3 className={`text-lg font-medium tracking-tight mb-2 ${titleCls}`}>
          Account Deletion Cancelled
        </h3>

        <div className={`space-y-1.5 text-xs leading-relaxed ${bodyCls}`}>
          <p>Your account deletion request has been cancelled successfully.</p>
          <p>
            Your {brandName} account is now active, or will be restored once the reactivation
            process is complete. Some data that was already deleted may not be recoverable.
          </p>
        </div>

        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
            isDark ? "bg-[#2a261e] border-white/20" : "bg-[#E8D1AB]/20 border-[#E8D1AB]"
          }`}
        >
          <span className={`text-xs md:text-sm ${isDark ? "text-white/80" : "text-zinc-600"}`}>
            Request ID
          </span>
          <span className={`text-sm md:text-base font-medium ${titleCls}`}>
            {requestId || "—"}
          </span>
        </div>

        <div
          className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left ${
            isDark ? "bg-[#05080f] border-white/10" : "bg-blue-50 border-blue-100"
          }`}
        >
          <Info size={18} className="shrink-0 mt-0.5 text-blue-500" />
          <p className={`text-xs md:text-sm ${isDark ? "text-white/90" : "text-zinc-700"}`}>
            A confirmation email has been sent to your registered email address.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToAccount}
          className="mt-2 w-full h-9 rounded-lg text-xs font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90"
        >
          Go to Account
        </button>
      </div>
    </div>
  );
};