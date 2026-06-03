"use client";

import React from "react";
import { X, CreditCard } from "lucide-react";

interface PaymentMethodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function PaymentMethodSelectionModal({
  isOpen,
  onClose,
  data,
}: PaymentMethodSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-[251] w-full max-w-[700px] bg-black border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
           style={{ fontFamily: "var(--font-instrument-sans)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8">
          <div>
            <h2 className="text-2xl font-semibold text-white leading-tight">Payment Method Selection</h2>
            <p className="text-white/45 text-sm mt-1.5">How would you like to process this payment?</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-10 pb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Stripe Option */}
          <div className="bg-[#111111] border border-white/5 rounded-[24px] p-7 flex flex-col h-full hover:border-white/10 transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Pay via Stripe</h3>
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed mb-10 flex-1">
              Send payment directly through Stripe and automatically track payment status.
            </p>
            <button className="w-full h-12 bg-[#0061FF] text-white text-[13px] font-bold rounded-xl hover:bg-[#0052d9] transition-all shadow-lg shadow-blue-500/10">
              Continue with Stripe
            </button>
          </div>

          {/* External Option */}
          <div className="bg-[#111111] border border-white/5 rounded-[24px] p-7 flex flex-col h-full hover:border-white/10 transition-all cursor-pointer group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#9D4DFF]/10 flex items-center justify-center text-[#9D4DFF]">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight">Mark as Paid Outside Platform</h3>
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed mb-6 flex-1">
              Use this option if payment has already been made outside Beige using bank transfer, Wise, PayPal, cheque, cash, or another external method.
            </p>
            <button className="w-full h-12 bg-[#9D4DFF] text-white text-[13px] font-bold rounded-xl hover:bg-[#8326ff] transition-all shadow-lg shadow-purple-500/10">
              Record External Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
