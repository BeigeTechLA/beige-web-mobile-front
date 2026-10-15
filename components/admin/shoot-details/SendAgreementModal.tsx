"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";

interface CPDetail {
  id: string;
  name: string;
  initials: string;
  compensation: string;
}

interface SendAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  cps?: CPDetail[];
  mode?: "individual" | "common";
  isDark?: boolean;
}

const DEFAULT_CPS: CPDetail[] = [
  { id: "1", name: "Ethan Cole", initials: "EC", compensation: "$6,250" },
  { id: "2", name: "Michael Chen", initials: "MC", compensation: "$6,250" },
];

export function SendAgreementModal({
  isOpen,
  onClose,
  onSubmit,
  cps = DEFAULT_CPS,
  mode = "individual",
  isDark = true,
}: SendAgreementModalProps) {
  const isCommon = mode === "common";
  const cpNamesText = cps.map((cp) => cp.name).join(" and ");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`lg:max-w-[813px] w-[92vw] lg:w-full p-0 overflow-hidden [&>button]:hidden transition-colors duration-200 border gap-0 ${isDark
        ? "border-white/40 bg-[#000000] text-white"
        : "border-[#D7D7D7] bg-white text-black"
        }`}>
        {/* Header Section */}
        <DialogHeader className={`border-b px-4 py-4 lg:px-6 lg:py-5 text-left transition-colors duration-200 ${isDark ? "border-b-white/40" : "border-b-[#D7D7D7]"}`}>
          <div className="flex items-center justify-between gap-3 lg:gap-4">
            <DialogTitle className={`text-lg lg:text-3xl font-bold transition-colors text-wrap ${isDark ? "text-white" : "text-black"}`}>
              Send 2 Individual Agreements?
            </DialogTitle>

            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 lg:p-3.5 transition-colors shrink-0 ${isDark ? "bg-[#2B2626] text-white hover:text-white/70" : "bg-black/5 text-black/60 hover:text-black"}`}
            >
              <X size={28} />
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="px-4 py-4 lg:p-7 space-y-5 ">
          {/* Main Description */}
          <p className={`break-words text-sm lg:text-xl transition-colors ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
            {isCommon
              ? `One common agreement will be sent to ${cpNamesText}. Each CP must review and accept the agreement individually.`
              : `Separate agreements will be sent to ${cpNamesText}. Each CP will receive their own agreement and must accept it before their assignment is confirmed.`}
          </p>
          {/* CP List Box */}
          <div className={`border rounded-xl p-3.5 space-y-3 ${isDark ? "bg-[#0E0E0D] border-[#1E1E1C] " : "bg-[#D7D7D7]/80 border-[#D7D7D7]"}`}>
            {
              isCommon &&
              <div className="flex flex-col gap-2.5 text-xs lg:text-sm text-[#525250] pb-2.5 border-b mb-2.5 border-[#1A1A19]">
                <div className="flex justify-between items-center">
                  <p>
                    Agreement Type
                  </p>
                  <p className={`font-medium ${isDark ? "text-[#E8E8E7]" : "text-black/80"}`}>
                    Common
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p>
                    Recipients
                  </p>
                  <p className={`font-medium ${isDark ? "text-[#E8E8E7]" : "text-black/80"}`}>
                    {cpNamesText.length} CPs
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p>
                    Version
                  </p>
                  <p className={`font-medium ${isDark ? "text-[#E8E8E7]" : "text-black/80"}`}>
                    v1.0
                  </p>
                </div>
              </div>
            }
            {cps.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center justify-between text-xs lg:text-sm py-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#242424] text-white/70 font-medium flex items-center justify-center text-[10px] shrink-0">
                    {cp.initials}
                  </div>
                  <span className="text-[#E8E8E7]">{cp.name}</span>
                </div>
                <span className="text-white font-semibold">
                  {cp.compensation}
                </span>
              </div>
            ))}
          </div>

          {/* Warning / Status Callout */}
          <div className="bg-[#FFB900]/5 border border-[#FFB900]/15 rounded-lg p-3 flex items-center gap-2.5 text-xs text-[#E8A838]">
            <Info size={16} className="shrink-0 text-[#FFB900]/80" />
            <span>
              Assignments will remain pending until each CP accepts the agreement
              individually.
            </span>
          </div>
        </div>

        {/* Footer Actions Panel */}
        <DialogFooter className={`px-4 pb-4 lg:px-6 lg:pb-5 flex flex-col-reverse lg:flex-row gap-3 w-full transition-colors duration-200 ${isDark ? "border-t-white/10" : "border-t-[#D7D7D7]"}`}>
          <Button
            type="button"
            onClick={onClose}
            className={`flex-1 w-full h-12 px-5 rounded-lg text-sm font-semibold transition-all ${isDark
              ? "bg-[#101010] border border-white/10 text-white hover:bg-[#303030]"
              : "bg-[#F3F4F6] border border-[#E5E5E5] text-black hover:bg-[#E5E7EB]"
              }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            className="flex-1 w-full h-12 px-5 rounded-lg text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D5C5A8] transition-all"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}