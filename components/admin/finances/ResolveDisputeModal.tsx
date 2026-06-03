"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Coins,
  Wallet,
  X,
  Info,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface ResolveDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string;
  shootId: string;
  amount: string;
}

type ResolutionType = "stripe" | "credits" | "manual";
type PaymentAmountType = "full" | "partial";

export default function ResolveDisputeModal({
  isOpen,
  onClose,
  disputeId,
  shootId,
  amount,
}: ResolveDisputeModalProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType>("stripe");
  const [amountType, setAmountType] = useState<PaymentAmountType>("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [recipient, setRecipient] = useState("Client");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBack = () => {
    setIsConfirming(false);
  };

  const handleResolveClick = () => {
    setIsConfirming(true);
  };

  const handleProceedClick = () => {
    setIsProcessing(true);
    // Simulate process
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleClose = () => {
    setIsConfirming(false);
    setIsProcessing(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className={`relative z-[131] w-full ${(!isConfirming && !isProcessing && !isSuccess) ? 'max-w-[540px]' : 'max-w-[420px]'} rounded-[24px] border border-white/10 bg-black p-0 shadow-2xl overflow-hidden`}>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center px-8 py-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#102A24] text-[#17D8A2]">
              <CheckCircle2 size={28} className="stroke-[2.5]" />
            </div>

            <h2 className="text-xl font-semibold text-white">Resolution Successful</h2>
            <p className="mt-2.5 text-center text-sm leading-relaxed text-white/45">
              The dispute has been resolved and payment has been processed successfully.
            </p>

            <div className="mt-8 w-full rounded-2xl bg-[#141414] border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35">Dispute ID</span>
                <span className="text-[13px] font-medium text-white">{disputeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35">Status</span>
                <span className="rounded-full bg-[#102A24] px-3 py-1 text-[11px] font-medium text-[#17D8A2]">
                  Resolved - Paid
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35">
                  {resolutionType === "credits" ? "Credit Amount" : "Amount"}
                </span>
                <span className="text-[14px] font-bold text-[#17D8A2]">
                  {resolutionType === "credits" 
                    ? `${partialAmount || "0"} Points` 
                    : (amountType === "full" ? amount : `$${partialAmount || "0"}`)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex w-full gap-3 rounded-2xl border border-[#11356A]/30 bg-[#060B15] px-4 py-3.5">
              <Info size={16} className="mt-0.5 shrink-0 text-[#3B82F6]" />
              <div>
                <p className="text-[13px] font-medium text-white">Notifications Sent</p>
                <p className="mt-1 text-[11px] leading-[1.4] text-white/45">
                  Both parties have been notified with resolution summary and payment details.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-8 w-full flex h-12 items-center justify-center rounded-xl bg-[#E8D1AB] text-sm font-semibold text-black transition-colors hover:bg-[#d9c19a]"
            >
              Close
            </button>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center px-10 py-16">
            <div className="relative mb-6">
              <div className="h-14 w-14 rounded-full border-4 border-white/5 border-t-[#E8D1AB] animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-white">Processing Resolution</h2>
            <p className="mt-2 text-center text-sm text-white/35">
              Please wait while we process the payment...
            </p>
          </div>
        ) : !isConfirming ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-7 py-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Resolve Dispute</h2>
                <p className="mt-1 text-sm font-medium text-[#E8D1AB]">
                  {disputeId} • {shootId} • {amount}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 max-h-[65vh] custom-scrollbar">
              {/* Resolution Type Selection */}
              <div className="mb-6">
                <p className="text-[13px] font-medium text-white">Select Resolution Type</p>
                <p className="mb-4 text-[12px] text-white/45">Choose how you want to process the payment</p>

                <div className="flex w-full gap-1 rounded-xl border border-white/10 bg-[#141414] p-1">
                  <button
                    onClick={() => setResolutionType("stripe")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${resolutionType === "stripe"
                        ? "bg-[#E8D1AB] text-black"
                        : "text-white/60 hover:bg-white/5"
                      }`}
                  >
                    <CreditCard size={14} className={resolutionType === "stripe" ? "text-black" : "text-white/40"} />
                    Auto Transfer (Stripe)
                  </button>
                  <button
                    onClick={() => setResolutionType("credits")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${resolutionType === "credits"
                        ? "bg-[#E8D1AB] text-black"
                        : "text-white/60 hover:bg-white/5"
                      }`}
                  >
                    <Coins size={14} className={resolutionType === "credits" ? "text-black" : "text-white/40"} />
                    Beige Credits
                  </button>
                  <button
                    onClick={() => setResolutionType("manual")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${resolutionType === "manual"
                        ? "bg-[#E8D1AB] text-black"
                        : "text-white/60 hover:bg-white/5"
                      }`}
                  >
                    <Wallet size={14} className={resolutionType === "manual" ? "text-black" : "text-white/40"} />
                    Manual Payment
                  </button>
                </div>
              </div>

              {/* Configuration Card */}
              <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8D1AB] text-black">
                    {resolutionType === "credits" ? <Coins size={20} /> : <Wallet size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {resolutionType === "stripe" ? "Auto Transfer" : resolutionType === "credits" ? "Beige Credits" : "Manual"} Configuration
                    </h3>
                    <p className="text-[12px] text-white/45">
                      {resolutionType === "credits" ? "Add credits to user wallet" : `Configure ${resolutionType === "stripe" ? "automated Stripe transfer" : "manual payment details"}`}
                    </p>
                  </div>
                </div>

                {resolutionType === "manual" ? (
                  <div className="space-y-5">
                    {/* Select Payment Method */}
                    <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                      <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">Select Payment Method*</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-transparent text-[13px] text-white/90 outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-black text-white/35">Select Payment Method...</option>
                        <option value="UPI" className="bg-black text-white">UPI</option>
                        <option value="Cash" className="bg-black text-white">Cash</option>
                        <option value="Bank Transfer" className="bg-black text-white">Bank Transfer</option>
                        <option value="Credit Card" className="bg-black text-white">Credit Card</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 text-white/40" />
                    </div>

                    {/* Select Recipient */}
                    <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                      <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">Select Recipient</span>
                      <select
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full bg-transparent text-[13px] text-white/90 outline-none appearance-none cursor-pointer"
                      >
                        <option value="Client" className="bg-black text-white">Client</option>
                        <option value="Creative Partner" className="bg-black text-white">Creative Partner</option>
                        <option value="Admin" className="bg-black text-white">Admin</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 text-white/40" />
                    </div>

                    {/* Transaction ID */}
                    <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                      <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">Transaction ID*</span>
                      <input
                        type="text"
                        placeholder="Enter Transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/20"
                      />
                    </div>

                    {/* Upload Proof */}
                    <div className="space-y-2">
                      <p className="text-[12px] text-white/45">Upload Proof <span className="text-white/35">(Required)</span></p>
                      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/[0.02] py-8 transition-colors hover:bg-white/[0.04] cursor-pointer">
                        <p className="text-[13px] text-white/45">
                          Drag & Drop Your File Here Or <span className="text-[#E8D1AB] font-medium">Upload</span>
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="relative rounded-xl border border-white/20 px-4 py-3">
                      <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">Notes (Optional)</span>
                      <textarea
                        placeholder="Add any additional notes..."
                        className="min-h-[80px] w-full resize-none bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/20"
                      />
                    </div>
                  </div>
                ) : resolutionType !== "credits" ? (
                  <>
                    {/* Payment Amount Types */}
                    <div className="mb-5 grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-white/10">
                      <button
                        onClick={() => setAmountType("full")}
                        className={`flex flex-col items-center justify-center py-4 transition-all ${amountType === "full" ? "bg-[#25211B] border-r border-white/10" : "bg-transparent border-r border-white/10"
                          }`}
                      >
                        <span className={`text-[12px] ${amountType === "full" ? "text-[#E8D1AB]" : "text-white/45"}`}>Full Payment</span>
                        <span className={`mt-0.5 text-sm font-semibold ${amountType === "full" ? "text-white" : "text-white/60"}`}>{amount}</span>
                      </button>
                      <button
                        onClick={() => setAmountType("partial")}
                        className={`flex flex-col items-center justify-center py-4 transition-all ${amountType === "partial" ? "bg-[#25211B]" : "bg-transparent"
                          }`}
                      >
                        <span className={`text-[12px] ${amountType === "partial" ? "text-[#E8D1AB]" : "text-white/45"}`}>Partial Payment</span>
                        <span className={`mt-0.5 text-sm font-semibold ${amountType === "partial" ? "text-white" : "text-white/60"}`}>Custom</span>
                      </button>
                    </div>

                    {/* Payment Amount Type - Partial Input */}
                    {amountType === "partial" && (
                      <div className="mb-5">
                        <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                          <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">
                            Enter Amount
                          </span>
                          <input
                            type="text"
                            value={partialAmount}
                            onChange={(e) => setPartialAmount(e.target.value)}
                            placeholder={`Maximum: ${amount}`}
                            className="w-full bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/20"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-5">
                    <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                      <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">
                        Enter Credit Amount
                      </span>
                      <div className="flex items-center gap-2">
                        <Coins size={14} className="text-white/35" />
                        <input
                          type="text"
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          placeholder="500 Credits Points"
                          className="w-full bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/20"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-white/35">Equivalent value: ${partialAmount || "0"} USD</p>
                  </div>
                )}

                {resolutionType !== "manual" && (
                  <>
                    {/* Recipient Dropdown */}
                    <div className="mb-5 mt-5">
                      <div className="relative flex h-11 items-center rounded-xl border border-white/20 px-4">
                        <span className="absolute -top-2 left-3 bg-[#141414] px-1 text-[10px] tracking-wider text-white/40">Select Recipient</span>
                        <select
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          className="w-full bg-transparent text-[13px] text-white/90 outline-none appearance-none cursor-pointer"
                        >
                          <option value="Client" className="bg-black text-white">Client</option>
                          <option value="Creative Partner" className="bg-black text-white">Creative Partner</option>
                          <option value="Admin" className="bg-black text-white">Admin</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-4 text-white/40" />
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-start gap-3">
                        <Info size={16} className="mt-0.5 text-white/35" />
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-white">{resolutionType === "credits" ? 'Credit Information' : 'Payment Method'}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                            {resolutionType === "credits"
                              ? "Amount will be added to user wallet as Beige Credits. Credits can be used for future bookings and services."
                              : resolutionType === "stripe"
                                ? "Processed via Stripe payment gateway. Stripe - Card ending in ****4242"
                                : "Manual payment will be processed outside the system."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-2 grid grid-cols-2 gap-3 px-7 pb-7">
              <button
                onClick={handleClose}
                className="flex h-12 items-center justify-center rounded-xl bg-[#1F1F1F] text-sm font-medium text-white transition-colors hover:bg-[#2A2A2A]"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveClick}
                className="flex h-12 items-center justify-center rounded-xl bg-[#E8D1AB] text-sm font-medium text-black transition-colors hover:bg-[#d9c19a]"
              >
                Resolve & Process Payment
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col py-8">
            <div className="flex-1 overflow-y-auto px-8 max-h-[60vh] custom-scrollbar text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0AC21]/10 text-[#E0AC21]">
                <Info size={28} />
              </div>

              <h2 className="text-xl font-semibold text-white">Confirm Resolution</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                Are you sure you want to resolve this dispute and proceed with the selected payment method? This action cannot be undone.
              </p>

              <div className="mt-8 w-full rounded-2xl bg-[#141414] border border-white/5 p-5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/35">Dispute ID</span>
                  <span className="text-[13px] font-medium text-white">{disputeId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white/35">Resolution Type</span>
                  <span className="text-[13px] font-medium text-white">
                    {resolutionType === "stripe" ? "Auto Transfer" : resolutionType === "credits" ? "Credits" : "Manual"}
                  </span>
                </div>

                {resolutionType === "stripe" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Amount</span>
                      <span className="text-[13px] font-medium text-white">
                        {amountType === "full" ? amount : `$${partialAmount || "0"}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Recipient</span>
                      <span className="text-[13px] font-medium text-white">{recipient}</span>
                    </div>
                  </>
                )}

                {resolutionType === "credits" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Recipient</span>
                      <span className="text-[13px] font-medium text-white">{recipient}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Credit Amount</span>
                      <span className="text-[13px] font-medium text-[#E8D1AB]">
                        {partialAmount || "0"} credits
                      </span>
                    </div>
                  </>
                )}

                {resolutionType === "manual" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Payment Method</span>
                      <span className="text-[13px] font-medium text-white">{paymentMethod || "UPI"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Transaction ID</span>
                      <span className="text-[13px] font-medium text-white">{transactionId || "TXN-2026-458921"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/35">Recipient</span>
                      <span className="text-[13px] font-medium text-white">{recipient}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-10 grid w-full grid-cols-2 gap-3 px-8">
              <button
                onClick={handleBack}
                className="flex h-12 items-center justify-center rounded-xl bg-[#1F1F1F] text-sm font-medium text-white hover:bg-[#2A2A2A]"
              >
                No, Cancel
              </button>
              <button
                onClick={handleProceedClick}
                className="flex h-12 items-center justify-center rounded-xl bg-[#E8D1AB] text-sm font-medium text-black hover:bg-[#d9c19a]"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
