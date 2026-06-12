"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ShootCPRow } from "./CPPayoutTable";
import { formatCurrency } from "@/lib/utils";

export type RejectPayoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rowContext: ShootCPRow | null;
  onSubmit: (payload: { reason: string; payoutAmount: string}) => void;
  isSubmitting?: boolean; 
};

export default function RejectPayoutModal({
  onSubmit,
  isSubmitting = false,
  isOpen,
  onClose,
  rowContext
}: RejectPayoutModalProps) {
  const { isDark } = useResolvedTheme();
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div className={`relative max-h-[84vh] w-full lg:max-w-xl overflow-y-auto rounded-[16px] border transition-colors duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>

        {/* Header Block Panel */}
        <div className={`flex items-center justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/40" : "border-[#D7D7D7]"}`}>
          <h2 className={`pr-4 text-lg lg:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            Reject Payout
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${isDark ? "bg-[#2E2725] text-white hover:bg-[#39312E]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2.1} className="lg:h-7 lg:w-7" />
          </button>
        </div>


        <div className="space-y-2 lg:space-y-4 p-4 lg:p-7">
          <div className={`rounded-xl border px-4 py-3.5 lg:px-5 lg:py-4 border-[#E8D1AB33] bg-[#E8D1AB33]`}>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
              Reject this compensation payout? The shoot will be returned to admin for review. A mandatory reason must be provided.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className={`${isDark ? "text-white" : "text-black"} text-xs lg:text-sm`}>
              Shoot Information
            </p>
            <div className={`text-sm lg:text-base font-medium flex justify-between p-3 lg:p-4 rounded-lg border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F2F3F5] border-[#8E8E8E]"}`}>
              <div className="flex flex-col gap-2 ">
                <p className={isDark ? "text-white" : "text-black"}>
                  {rowContext?.shootName || "Corporate Shoot"}
                </p>
                <p className={`capitalize ${isDark ? "text-white/50" : "text-black/50"}`}>
                  {rowContext?.category || "Videography"}
                </p>
              </div>
              <div className={`flex items-center rounded-full border-[1px] px-3 py-2 lg:px-5 lg:py-3 text-[#E8D1AB] ${isDark ? "bg-black border-white/20" : "bg-white border-black/20"}`}>
                Current Payout: {formatCurrency(rowContext?.cpPayout || 12500)}
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border px-5 pb-4 pt-0 relative mt-6 lg:px-6 lg:pb-4 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
            <div className="absolute -top-3 left-3 px-2 text-sm lg:text-base z-10">
              <span className={`px-2 font-medium ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                Notes
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Mandatory reason for audit compliance..."
              className={`min-h-[90px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm lg:text-base outline-none lg:min-h-[160px] lg:text-base ${isDark ? "text-white placeholder:text-white/50" : "text-black placeholder:text-[#9F9FA9]"}`}
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 lg:flex-row w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`h-10 lg:h-12 rounded-lg border px-5 text-sm font-semibold transition-colors w-full lg:text-base ${isDark
                ? "border-[#4A4A4F] bg-[#141414] text-white hover:bg-[#1A1A1A]"
                : "border-[#D7D7D7] bg-white text-black hover:bg-[#F4F5F7]"
                }`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !notes.trim()}
              onClick={() => {
                console.log("Rejected Submission Fired");
                onSubmit({ reason: notes }); 
                onClose();
              }}
              className="h-10 lg:h-12 w-full rounded-lg bg-[#EED4A7] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7]/92 lg:text-base"
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}