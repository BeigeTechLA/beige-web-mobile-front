"use client";

import React, { useEffect, useMemo } from "react";
import { ShieldCheck, CircleAlert } from "lucide-react";

interface DeleteAccountCancelModalProps {
  open: boolean;
  isDark?: boolean;
  scheduledDate?: string;
  email?: string;
  onKeep: () => void;
  onCancelRequest: () => void;
  isLoading?: boolean;
}

const maskEmail = (email?: string) => {
  if (!email || !email.includes("@")) return "your registered email";
  const [local, domain] = email.split("@");
  const visible = Math.min(5, Math.max(1, Math.floor(local.length / 2)));
  return `${local.slice(0, visible)}****@${domain}`;
};

export const DeleteAccountCancelModal = ({
  open,
  isDark = true,
  scheduledDate,
  email,
  onKeep,
  onCancelRequest,
  isLoading = false,
}: DeleteAccountCancelModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onKeep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onKeep, isLoading]);

  const masked = useMemo(() => maskEmail(email), [email]);

  if (!open) return null;

  const titleCls = isDark ? "text-white" : "text-[#171717]";
  const bodyCls = isDark ? "text-white/60" : "text-zinc-500";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={() => !isLoading && onKeep()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[520px] rounded-2xl border p-4 md:p-5 shadow-2xl transition-colors ${
          isDark ? "bg-black border-white/10" : "bg-white border-zinc-200"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15">
            <CircleAlert size={16} className="text-amber-500" />
          </div>
          <h3 className={`text-base md:text-lg font-medium tracking-tight ${titleCls}`}>
            Cancel Account Deletion?
          </h3>
        </div>

        <p className={`text-xs md:text-sm leading-relaxed ${bodyCls}`}>
          Your account is currently scheduled for deletion on{" "}
          <span className="font-bold text-[#E8D1AB]">{scheduledDate || "—"}.</span> If you cancel
          this request, your account may be reactivated after your identity is verified. Data
          already deleted or no longer available may not be recoverable.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-4">
          <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
          <span className="text-xs md:text-sm text-emerald-400 break-all">
            Identity Verified for an {masked}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onKeep}
            disabled={isLoading}
            className={`h-10 rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-[#171717]"
            }`}
          >
            Keep Deletion Request Active
          </button>
          <button
            type="button"
            onClick={onCancelRequest}
            disabled={isLoading}
            className="h-10 rounded-lg text-xs md:text-sm font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90 disabled:opacity-50"
          >
            {isLoading ? "Cancelling..." : "Cancel Deletion Request"}
          </button>
        </div>
      </div>
    </div>
  );
};