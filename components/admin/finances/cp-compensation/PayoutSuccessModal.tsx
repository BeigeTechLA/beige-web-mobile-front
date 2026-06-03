"use client";

import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import PaymentMethodSelectionModal from "./PaymentMethodSelectionModal";

interface PayoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType?: "modify" | "approve" | "reject";
  data?: any;
}

export default function PayoutSuccessModal({
  isOpen,
  onClose,
  actionType = "modify",
  data,
}: PayoutSuccessModalProps) {
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);

  useEffect(() => {
    if (isOpen && actionType !== "approve") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, actionType]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (actionType) {
      case "modify": return "Payout Modified Successfully";
      case "approve": return "Payout Approved Successfully";
      case "reject": return "Payout Reject Successfully";
    }
  };

  const getSubtext = () => {
    switch (actionType) {
      case "modify": return "The compensation payout has been successfully updated in our records.";
      case "approve": return "The payout has been approved and is now ready for payment processing.";
      case "reject": return "The payout has been Rejected";
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
           style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <div className="w-full max-w-[420px] bg-black border border-white/10 rounded-[32px] p-10 flex flex-col items-center shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#E8D1AB]/5 blur-[60px] pointer-events-none" />

          {/* Confetti Animation Container */}
          <div className="relative mb-8">
            <div className="h-24 w-24 rounded-full bg-[#E5D5B8] flex items-center justify-center shadow-[0_0_50px_rgba(229,213,184,0.15)] outline outline-1 outline-white/10">
              <Check size={48} className="text-black stroke-[3]" />
            </div>
            
            {/* Static Confetti Dots */}
            <div className="absolute -top-3 -left-3 w-2.5 h-2.5 bg-[#FF4D4F] rounded-sm rotate-12" />
            <div className="absolute top-8 -left-10 w-2 h-4 bg-[#0061FF] rounded-full -rotate-45" />
            <div className="absolute -bottom-3 -left-6 w-2.5 h-2.5 bg-[#17D8A2] rounded-full" />
            
            <div className="absolute -top-6 -right-2 w-4 h-1.5 bg-[#E8D1AB] rounded-full rotate-45" />
            <div className="absolute top-10 -right-12 w-2.5 h-2.5 bg-[#E0AC21] rounded-sm -rotate-12" />
            <div className="absolute -bottom-4 -right-4 w-1.5 h-3 bg-[#FF4D4F] rounded-full rotate-12" />
          </div>

          <h2 className="text-2xl font-semibold text-white text-center leading-tight">{getTitle()}</h2>
          <p className="mt-3 text-white/50 text-sm text-center max-w-[260px] leading-relaxed">
            {getSubtext()}
          </p>

          {actionType === "approve" ? (
            <button
              onClick={() => setIsPaymentMethodOpen(true)}
              className="mt-8 w-full h-12 flex items-center justify-center bg-[#E5D5B8] text-black text-sm font-bold rounded-xl hover:bg-[#dec191] transition-all"
            >
              Proceed with Payment
            </button>
          ) : (
            <div className="mt-8 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#E5D5B8] animate-progress-shrink" />
            </div>
          )}
        </div>
      </div>

      <PaymentMethodSelectionModal 
        isOpen={isPaymentMethodOpen}
        onClose={() => {
          setIsPaymentMethodOpen(false);
          onClose();
        }}
        data={data}
      />
    </>
  );
}

