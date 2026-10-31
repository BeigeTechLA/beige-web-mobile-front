"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

interface DeleteAccountVerifyModalProps {
  open: boolean;
  isDark?: boolean;
  onClose: () => void;
  onVerify: (code: string) => void | Promise<unknown>;
  onResend: () => void;
  isLoading?: boolean;
}

const OTP_LENGTH = 6;

export const DeleteAccountVerifyModal = ({
  open,
  isDark = true,
  onClose,
  onVerify,
  onResend,
  isLoading = false,
}: DeleteAccountVerifyModalProps) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // reset + focus first box on open
  useEffect(() => {
    if (open) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
    if (e.key === "Enter" && isComplete && !isLoading) onVerify(code);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
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
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15">
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <h3
            className={`text-base md:text-lg font-medium tracking-tight ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            Verify Your Identity
          </h3>
        </div>

        {/* Body */}
        <p className={`text-xs md:text-sm leading-relaxed ${isDark ? "text-white/60" : "text-zinc-500"}`}>
          For your security, please verify your identity before submitting your account deletion
          request. We&apos;ve sent a verification code to your registered{" "}
          <span className="font-bold text-[#E8D1AB]">email address.</span>
        </p>

        {/* OTP */}
        <p className={`mt-4 mb-2 text-sm font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
          Enter Six Digit Verification Code
        </p>
        <div className="grid grid-cols-6 gap-2 md:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              placeholder="-"
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={`h-12 md:h-14 w-full rounded-xl border text-center text-lg font-medium outline-none transition-colors ${
                isDark
                  ? "bg-[#161616] border-white/5 text-white placeholder:text-white/60 focus:border-[#E8D1AB]/60"
                  : "bg-zinc-50 border-zinc-200 text-[#171717] placeholder:text-zinc-400 focus:border-[#E8D1AB]"
              }`}
            />
          ))}
        </div>
        <p className={`mt-2 text-xs ${isDark ? "text-white/50" : "text-zinc-500"}`}>
          The code will expire in 10 minutes.
        </p>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => onVerify(code)}
            disabled={!isComplete || isLoading}
            className="w-full h-10 rounded-lg text-sm font-medium bg-[#E8D1AB] text-black transition-opacity hover:bg-[#E8D1AB]/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E8D1AB]"
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className={`w-full h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
                : "bg-zinc-100 hover:bg-zinc-200 text-[#171717]"
            }`}
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};