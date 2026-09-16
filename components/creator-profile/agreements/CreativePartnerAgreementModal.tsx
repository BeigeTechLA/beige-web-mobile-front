"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface GeneralAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void> | void;
  onViewAgreement?: () => void;
  agreementTitle?: string;
  description?: string;
  checkboxLabel?: string;
  acceptButtonText?: string;
}

export default function GeneralAgreementModal({
  open,
  onOpenChange,
  onAccept,
  onViewAgreement,
  agreementTitle = "General Agreement",
  description = "Please review and accept Beige's Creative Partner Agreement to start receiving and working on assignments.",
  checkboxLabel = "I have read and agree to the terms and conditions",
  acceptButtonText = "Accept & Continue",
}: GeneralAgreementModalProps) {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsChecked(false);
      setIsAccepting(false);
    }
  }, [open]);

  const handleAccept = async () => {
    if (!isChecked) return;

    setIsAccepting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Error accepting agreement:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleViewAgreement = () => {
    if (onViewAgreement) {
      onViewAgreement();
    } else {
      onOpenChange(false);
      router.push("/creator/dashboard/profile/agreement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* COMPACT WIDTH: max-w-[400px] */}
      <DialogContent
        className="w-[calc(100vw-32px)] max-w-[400px] overflow-hidden rounded-[10px] border border-white/10 bg-[#050505] p-0 shadow-[0_25px_80px_rgba(0,0,0,0.6)] text-white [&>button]:hidden"
      >
        <DialogTitle className="sr-only">
          {agreementTitle}
        </DialogTitle>

        {/* Header - Tighter Padding */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-[22px] font-bold tracking-tight text-white">
            {agreementTitle}
          </h2>

          <DialogClose asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-400 transition-colors hover:bg-[#252525] hover:text-white"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </DialogClose>
        </div>

        {/* Content Area - Tighter Padding */}
        <div className="px-5 pb-5">
          {/* Inner Card Container */}
          <div className="rounded-[10px] bg-[#1F1F1F] border border-white/5 px-5 py-5">
            
            {/* Section Title - Smaller */}
            <h3 className="text-[18px] font-semibold leading-tight text-white">
              Before you get started
            </h3>

            {/* Description - Smaller Text */}
            <p className="pt-0.5 text-[13px] leading-[1.5] text-zinc-400">
              {description}
            </p>

            {/* View Agreement Button - Compact Pill */}
            <button
              onClick={handleViewAgreement}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#141414] py-2.5 text-[13px] font-medium text-[#E8D1AB] transition-all hover:bg-[#2a2a2a] hover:text-[#F5EBD8]"
            >
              View Agreement
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Checkbox Area - Tighter Gap */}
            <div className="mt-4 flex items-start gap-2.5">
              <Checkbox
                id="agreement-checkbox"
                checked={isChecked}
                onCheckedChange={(checked) =>
                  setIsChecked(checked as boolean)
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-[#333] bg-transparent data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:text-black"
              />
              <label
                htmlFor="agreement-checkbox"
                className="cursor-pointer select-none text-[12px] leading-[1.4] text-zinc-300"
              >
                {checkboxLabel}
              </label>
            </div>
          </div>

          {/* Main Accept Button - Shorter Height */}
          <Button
            onClick={handleAccept}
            disabled={!isChecked || isAccepting}
            className={`mt-4 h-11 w-full rounded-[5px] text-[14px] font-semibold transition-all duration-200 ${
              isChecked
                ? "bg-[#A89F91] text-black hover:bg-[#BDB5A8] active:scale-[0.98]"
                : "bg-[#2a2a2a] text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isAccepting ? "Processing..." : acceptButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
