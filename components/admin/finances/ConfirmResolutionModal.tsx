"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

// Define the clear, typed data structure shape
export type DisputeResolutionData = {
  resolutionType: "auto" | "credits" | "manual";
  disputeId: string;
  recipient: string;
  amount?: string;
  creditAmount?: string;
  paymentMethod?: string;
  transactionId?: string;
};

type ConfirmResolutionModalProps = {
  open: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  isDark?: boolean;
  disputeData: DisputeResolutionData; // Combined single data object
};

export default function ConfirmResolutionModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  isDark = true,
  disputeData,
}: ConfirmResolutionModalProps) {

  const {
    resolutionType,
    disputeId,
    recipient,
    amount = "$5,000",
    creditAmount = "0 credits",
    paymentMethod = "UPI",
    transactionId = "",
  } = disputeData;

  const getResolutionTypeLabel = () => {
    if (resolutionType === "auto") return "Auto Transfer";
    if (resolutionType === "credits") return "Credits";
    return "Manual";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className={`w-[calc(100vw-32px)] max-w-md overflow-hidden rounded-2xl border p-4 lg:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.7)] [&>button]:hidden flex flex-col gap-5 transition-colors duration-200 ${isDark ? "bg-black border-white/40 text-white" : "bg-white border-black/10 text-black"}`}
      >
        <DialogTitle className="sr-only">Confirm Resolution</DialogTitle>

        {/* Warning Icon & Heading */}
        <div className="flex items-start gap-3.5">

          <div className="space-y-1">
            <div className="flex gap-2 ">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <h2 className={`text-lg lg:text-xl ${isDark ? "text-white" : "text-black"}`}>
                Confirm Resolution
              </h2>
            </div>

            <p className={`text-sm lg:text-base ${isDark ? "text-[#A0A0A0]" : "text-[#606060]"}`}>
              Are you sure you want to resolve this dispute and proceed with the selected payment method? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Dynamic Details Box */}
        <div className={`p-4 rounded-lg space-y-3 ${isDark ? "bg-[#1F1F1F]" : "bg-[#F5F5F5]"}`}>
          {/* Dispute ID - Always Shown */}
          <div className="flex justify-between items-center text-sm lg:text-base">
            <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Dispute ID</span>
            <span className={`${isDark ? "text-white" : "text-black"}`}>{disputeId}</span>
          </div>

          {/* Resolution Type - Always Shown */}
          <div className="flex justify-between items-center text-sm lg:text-base">
            <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Resolution Type</span>
            <span className={`${isDark ? "text-white" : "text-black"}`}>{getResolutionTypeLabel()}</span>
          </div>

          {/* Render layout fields conditionally based on resolutionType property */}
          {resolutionType === "auto" && (
            <>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Amount</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{amount}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Recipient</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{recipient}</span>
              </div>
            </>
          )}

          {resolutionType === "credits" && (
            <>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Recipient</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{recipient}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Credit Amount</span>
                <span className="text-[#E8D1AB]">{creditAmount}</span>
              </div>
            </>
          )}

          {resolutionType === "manual" && (
            <>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Payment Method</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Transaction ID</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{transactionId}</span>
              </div>
              <div className="flex justify-between items-center text-sm lg:text-base">
                <span className={isDark ? "text-[#A0A0A0]" : "text-[#A0A0A0]"}>Recipient</span>
                <span className={`${isDark ? "text-white" : "text-black"}`}>{recipient}</span>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1.5 w-full">
          <DialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              className={`h-12 rounded-lg text-sm font-semibold transition-colors ${isDark
                  ? "bg-[#1A1A1A] text-white hover:bg-[#262626]"
                  : "bg-[#F0F0F0] text-black hover:bg-[#E5E5E5]"
                }`}
            >
              No, Cancel
            </button>
          </DialogClose>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="h-12 rounded-lg text-sm font-semibold text-black bg-[#E8D1AB] hover:bg-[#dfc498] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Yes, Proceed"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
