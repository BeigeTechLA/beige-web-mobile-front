"use client";

import React from "react";
import { Check, CheckCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

export type ResolutionSuccessData = {
  paymentType: "auto" | "credits" | "manual";
  disputeId: string;
  status: string;         // e.g., "Resolved - Paid"
  amount: string;         // Used for Auto & Manual variants (e.g., "$5,000")
  creditAmount?: string;  // Used specifically for Credits variant (e.g., "500 Points")
};

type ResolutionSuccessfulModalProps = {
  open: boolean;
  onClose?: () => void;
  isDark?: boolean;
  disputeData: ResolutionSuccessData;
};

export default function ResolutionSuccessfulModal({
  open,
  onClose,
  isDark = true,
  disputeData,
}: ResolutionSuccessfulModalProps) {

  const {
    paymentType,
    disputeId,
    status,
    amount,
    creditAmount = "500 Points",
  } = disputeData;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className={`w-[calc(100vw-32px)] max-w-md  overflow-hidden rounded-2xl border p-6 shadow-[0_24px_70px_rgba(0,0,0,0.7)] [&>button]:hidden flex flex-col items-center gap-6 text-center transition-colors duration-200 ${isDark ? "bg-black border-white/40 text-white" : "bg-white border-black/10 text-black"}`}
      >
        <DialogTitle className="sr-only">Resolution Successful</DialogTitle>

        {/* Success Animated Check Badge */}
        <div className="w-15 h-15 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
          <CheckCircle className="w-8 h-8 stroke-[2]" />
        </div>

        {/* Messaging Headings */}
        <div className="space-y-2">
          <h2 className={`text-lg lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>
            Resolution Successful
          </h2>
          <p className={`text-sm lg:text-base max-w-[320px] mx-auto ${isDark ? "text-[#A0A0A0]" : "text-[#606060]"}`}>
            The dispute has been resolved and payment has been processed successfully.
          </p>
        </div>

        {/* Core Metadata Grid Container */}
        <div className={`p-4 rounded-xl space-y-3 text-left w-full ${isDark ? "bg-[#1F1F1F]" : "bg-[#F5F5F5]"}`}>
          {/* Dispute ID Row */}
          <div className="flex justify-between items-center text-xs lg: text-sm">
            <span className="text-[#A0A0A0]">Dispute ID</span>
            <span className={`text-sm lg:text-base ${isDark ? "text-white" : "text-black"}`}>{disputeId}</span>
          </div>

          {/* Status Badge Row */}
          <div className="flex justify-between items-center text-xs lg: text-sm">
            <span className="text-[#A0A0A0]">Status</span>
            <span className="px-2.5 py-0.5 border rounded-full text-xs bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20">
              {status}
            </span>
          </div>

          {/* Value Display Row Adjusted Dynamically via paymentType */}
          {paymentType === "credits" ? (
            <div className="flex justify-between items-center text-xs lg: text-sm">
              <span className="text-[#A0A0A0]">Credit Amount</span>
              <span className="text-sm lg:text-base text-[#10B981]">{creditAmount}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs lg: text-sm">
              <span className="text-[#A0A0A0]">Amount</span>
              <span className="text-sm lg:text-base text-[#10B981]">{amount}</span>
            </div>
          )}
        </div>

        {/* Notification Status Banner Alert Box */}
        <div className={`flex gap-3 p-4 rounded-xl border text-left w-full items-start ${isDark
            ? "bg-[#3B82F6]/5 border-[#3B82F6]/20 text-[#3B82F6]"
            : "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
          }`}>
          <Info className="w-5 h-5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
              Notifications Sent
            </h4>
            <p className={`text-xs leading-normal ${isDark ? "text-[#A0A0A0]" : "text-[#606060]"}`}>
              Both parties have been notified with resolution summary and payment details.
            </p>
          </div>
        </div>

        {/* Action Call Controls Button Footer */}
        <DialogClose asChild>
          <button
            type="button"
            className="h-12 w-full rounded-lg text-sm font-semibold text-black bg-[#E8D1AB] hover:bg-[#dfc498] transition-colors"
          >
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}