"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Info } from "lucide-react";

interface DeleteAccountSuccessModalProps {
  open: boolean;
  isDark?: boolean;
  brandName?: string;
  graceDays?: number;
  scheduledDate?: string; // optional: exact date from backend
  requestId?: string;
  onContactSupport: () => void;
  onPreviewLogin: () => void;
}

export const DeleteAccountSuccessModal = ({
  open,
  isDark = true,
  brandName = "Beige",
  graceDays = 60,
  scheduledDate,
  requestId,
  onContactSupport,
  onPreviewLogin,
}: DeleteAccountSuccessModalProps) => {
  const dateText = useMemo(() => {
    if (scheduledDate) return scheduledDate;
    const d = new Date();
    d.setDate(d.getDate() + graceDays);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, graceDays, scheduledDate]);

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
        {/* Success tick animation */}
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
          Account Deletion Requested
        </h3>

        <div className={`space-y-1.5 text-xs leading-relaxed ${bodyCls}`}>
          <p>Your account deletion request has been submitted successfully.</p>
          <p>
            Your {brandName} account has been deactivated, and your eligible data is scheduled for
            deletion on <span className="font-bold text-[#E8D1AB]">{dateText}.</span>
          </p>
        </div>

        {/* Request ID */}
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

        {/* Info box */}
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

        {/* Actions */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onContactSupport}
            disabled
            className={`h-9 rounded-lg text-xs font-medium opacity-40 cursor-not-allowed ${
              isDark ? "bg-[#1f1f1f] text-white" : "bg-zinc-100 text-[#171717]"
            }`}
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={onPreviewLogin}
            className="h-9 rounded-lg text-xs font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90"
          >
            Preview Deactivate Login
          </button>
        </div>

        <p className={`mt-3 text-[10px] leading-relaxed ${bodyCls}`}>
          You can cancel your request during the{" "}
          <span className={`font-bold ${titleCls}`}>{graceDays}-day grace</span> period by
          contacting {brandName} Support and completing identity verification.
        </p>
      </div>
    </div>
  );
};
