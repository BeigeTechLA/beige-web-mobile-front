"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AgreementEditModalProps = {
  isOpen: boolean;
  creativePartnerName: string;
  onClose: () => void;
  onCreateNewVersion: () => void;
};

export default function AgreementEditModal({
  isOpen,
  creativePartnerName,
  onClose,
  onCreateNewVersion,
}: AgreementEditModalProps) {
  const { isDark } = useResolvedTheme();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }}
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black/[0.82]
        p-4
        backdrop-blur-md
      "
    >
      <div
        ref={modalRef}
        className={`w-full max-w-[700px] overflow-hidden rounded-[16px] border transition-colors ${
          isDark
            ? "border-white/30 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.72)]"
            : "border-[#D7D7D7] bg-white text-[#171717] shadow-2xl"
        }`}
      >
        <div
          className={`flex items-start justify-between gap-6 border-b px-7 py-6 lg:px-8 ${
            isDark ? "border-white/25" : "border-[#E5E5E5]"
          }`}
        >
          <h2
            className={`max-w-[520px] text-[26px] font-semibold leading-tight lg:text-[30px] ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            This agreement has already
            <br />
            been accepted.
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
              isDark
                ? "bg-[#2C2828] text-white hover:bg-[#3A3434]"
                : "bg-[#F2F2F2] text-black/65 hover:bg-[#E7E7E7] hover:text-black"
            }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-7 pb-7 pt-6 lg:px-8 lg:pb-8">
          <div
            className={`rounded-xl px-5 py-4 text-sm leading-6 ${
              isDark
                ? "bg-[#17140F] text-[#E8D1AB]"
                : "bg-[#FFF7E8] text-[#7D6235]"
            }`}
          >
            Changes will create a new version and require{" "}
            {creativePartnerName || "the Creative Partner"} to accept again. The
            assignment will return to Awaiting CP Confirmation status until the
            new version is accepted.
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${
                isDark
                  ? "border-white/35 bg-transparent text-white hover:bg-white/5 hover:text-white"
                  : "border-[#D7D7D7] bg-white text-[#171717] hover:bg-[#F4F5F7]"
              }`}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={onCreateNewVersion}
              className="
                h-12
                rounded-lg
                bg-[#E8D1AB]
                text-sm
                font-semibold
                text-black
                transition-colors
                hover:bg-[#D4BE9A]
              "
            >
              Create New Version
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
