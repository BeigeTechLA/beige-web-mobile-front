"use client";

import React, { useState } from "react";
import { X, CreditCard } from "lucide-react";
import AddReceiptModal from "./AddReceiptModal";

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
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState("Bank Transfer");

  if (!isOpen) return null;

  const openReceiptModal = (flow: "stripe" | "external") => {
    setDefaultMethod(flow === "stripe" ? "Stripe" : "Bank Transfer");
    setIsReceiptOpen(true);
  };

  return (
    <>
      {!isReceiptOpen ? (
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
              <button
                type="button"
                onClick={() => openReceiptModal("stripe")}
                className="bg-[#111111] border border-white/5 rounded-[24px] p-7 flex flex-col min-h-[272px] hover:border-white/10 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center p-2">
                    <img
                      src="/images/stripe-logo.png"
                      alt="Stripe"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight">
                    Pay via Stripe
                  </h3>
                </div>
                <p className="text-white/40 text-[13px] leading-relaxed mb-10 flex-1">
                  Send payment directly through Stripe and automatically track payment status.
                </p>
                <div className="w-full h-12 bg-[#0061FF] text-white text-[13px] font-bold rounded-xl hover:bg-[#0052d9] transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center">
                  Continue with Stripe
                </div>
              </button>

              {/* External Option */}
              <button
                type="button"
                onClick={() => openReceiptModal("external")}
                className="bg-[#111111] border border-white/5 rounded-[24px] p-7 flex flex-col min-h-[272px] hover:border-white/10 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#9D4DFF]/10 flex items-center justify-center text-[#9D4DFF]">
                    <CreditCard size={24} />
                  </div>
                  <h3 className="text-[17px] font-bold text-white tracking-tight leading-tight max-w-[220px]">
                    Mark as Paid Outside Platform
                  </h3>
                </div>
                <p className="text-white/40 text-[13px] leading-relaxed mb-6 flex-1">
                  Use this option if payment has already been made outside Beige using bank transfer, Wise, PayPal, cheque, cash, or another external method.
                </p>
                <div className="w-full h-12 bg-[#9D4DFF] text-white text-[13px] font-bold rounded-xl hover:bg-[#8326ff] transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center">
                  Record External Payment
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        defaultPaymentMethod={defaultMethod}
      />
    </>
  );
}
