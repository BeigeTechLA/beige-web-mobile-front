"use client";

import React, { useState } from "react";
import { X, ArrowRight, Check } from "lucide-react";

interface GeneralAgreementModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onViewAgreement?: () => void;
  onAccept?: () => void;
  isDark?: boolean;
}

export function GeneralAgreementModal({
  isOpen = true,
  onClose,
  onViewAgreement,
  onAccept,
  isDark = true,
}: GeneralAgreementModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
      <div
        className={`w-full max-w-lg rounded-t-3xl md:rounded-2xl border-t md:border transition-all duration-300 animate-in slide-in-from-bottom md:animate-none ${
          isDark
            ? "border-white/40 bg-[#000000] text-white"
            : "border-gray-200 bg-white text-black"
          }`}
      >
        {/* Mobile Handle Bar */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className={`h-1.5 w-12 rounded-full ${isDark ? "bg-[#333333]" : "bg-gray-300"}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center justify-between border-b p-5 md:p-6 ${isDark ? "border-[#CACACA]" : "border-gray-100"}`}>
          <h2 className="text-xl lg:text-2xl font-bold">General Agreement</h2>
          <button
            onClick={onClose}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isDark
                ? "bg-[#2B2626] text-white hover:bg-[#2C2C2C] hover:text-[#A0A0A0]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black"
              }`}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Container */}
        <div className="px-4 py-8 md:p-6 space-y-6">
          {/* Inner Card */}
          <div className={`rounded-lg p-3.5 space-y-2 ${isDark ? "bg-[#1F1F1F]" : "bg-gray-50"}`}>
            <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Before you get started
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? "text-[#a0a0a0]" : "text-gray-600"}`}>
             Please review and accept Beige's Creative Partner Agreement to start receiving and working on assignments.
            </p>

            {/* View Agreement Button */}
            <button
              onClick={onViewAgreement}
              className={`flex w-full items-center justify-center gap-1 rounded-lg py-3 text-sm font-semibold underline underline-offset-2 transition-colors ${isDark
                  ? "bg-[#171717] text-[#E8D1AB] hover:bg-[#171717]/80"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
            >
              <span>View Agreement</span>
              <ArrowRight size={16} />
            </button>

            {/* Checkbox */}
            <label className="flex items-center gap-3 pt-1 cursor-pointer group select-none">
              <div
                onClick={() => setIsChecked(!isChecked)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${isChecked
                    ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                    : isDark
                      ? "border-white bg-transparent group-hover:border-[#555555]"
                      : "border-gray-300 bg-white group-hover:border-gray-400"
                  }`}
              >
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>
              <span className={`text-xs ${isDark ? "text-white" : "text-gray-700"}`}>
                I have read and agree to the terms and conditions
              </span>
            </label>
          </div>

          {/* Action Button */}
          <button
            onClick={onAccept}
            disabled={!isChecked}
            className={`w-full rounded-lg py-3.5 text-sm font-semibold transition-all text-black mb-5 lg:mb-0 ${isChecked
                ? "bg-[#E8D1AB] hover:bg-[#E8D1AB]/70"
                : "bg-[#E8D1AB]/50 cursor-not-allowed"
              }`}
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}