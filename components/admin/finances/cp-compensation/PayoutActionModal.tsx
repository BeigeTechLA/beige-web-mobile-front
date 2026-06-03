"use client";

import React, { useState } from "react";
import { X, Info, Loader2 } from "lucide-react";
import PayoutSuccessModal from "./PayoutSuccessModal";

type PayoutActionType = "modify" | "approve" | "reject";

interface PayoutActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  actionType: PayoutActionType;
}

export default function PayoutActionModal({
  isOpen,
  onClose,
  data,
  actionType,
}: PayoutActionModalProps) {
  const [newAmount, setNewAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccessOpen(true);
    }, 1000);
  };

  const getTitle = () => {
    switch (actionType) {
      case "modify": return "Modify Payout";
      case "approve": return "Approve Payout";
      case "reject": return "Reject Payout";
    }
  };

  const getWarningText = () => {
    switch (actionType) {
      case "modify": return "Modify the compensation amount. A mandatory reason must be provided for audit compliance.";
      case "approve": return "Approve this compensation payout? This action will lock the payout amount and mark it ready for payment processing.";
      case "reject": return "Reject this compensation payout? The shoot will be returned to admin for review. A mandatory reason must be provided.";
    }
  };

  const getButtonText = () => {
    switch (actionType) {
      case "modify": return "Confirm Modify";
      case "approve": return "Confirm Approve";
      case "reject": return "Confirm Reject";
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
        <div className="absolute inset-0" onClick={onClose} />
        
        <div className="relative z-[151] w-full max-w-[500px] bg-black border border-white/10 rounded-[28px] overflow-hidden shadow-2xl"
             style={{ fontFamily: "var(--font-instrument-sans)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-10 pb-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Warning Box */}
            <div className="bg-[#1C1711] border border-[#5A4312]/20 rounded-[18px] p-5 lg:p-6 flex items-start gap-3">
              <p className="text-[13px] leading-relaxed text-[#E8D1AB]/70 font-medium tracking-tight">
                {getWarningText()}
              </p>
            </div>

            {/* Shoot Info */}
            <div className="space-y-3.5">
              <p className="text-[13px] font-semibold text-white/40 ml-1">Shoot Information</p>
              <div className="bg-[#111111] border border-white/5 rounded-[20px] p-6 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-white leading-none">{data.name}</p>
                  <p className="text-[13px] text-white/30 mt-2">{data.type}</p>
                </div>
                <div className="px-4 py-2 bg-black/50 border border-white/10 rounded-full text-xs font-bold text-[#E8D1AB]">
                  Current Payout: {data.payout}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5 pt-1">
              {/* New Payout Amount (Only for modify) */}
              {actionType === "modify" && (
                <div className="relative group">
                  <div className="absolute -top-2.5 left-5 px-2 bg-black z-10">
                    <span className="text-[12px] font-medium text-white/40 tracking-tight">New Payout Amount*</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={newAmount ? `$${newAmount}` : ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setNewAmount(val);
                      }}
                      placeholder="$0"
                      className="w-full h-20 bg-transparent border border-white/20 rounded-[20px] px-6 text-lg font-medium text-white/90 focus:border-[#E8D1AB]/40 transition-all outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="relative group">
                <div className="absolute -top-2.5 left-5 px-2 bg-black z-10">
                  <span className="text-[12px] font-medium text-white/40 tracking-tight">Notes</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === "approve" ? "Optional Notes" : "Mandatory reason for audit compliance..."}
                  className="w-full h-36 bg-transparent border border-white/20 rounded-[20px] p-6 text-[13px] text-white/90 focus:border-[#E8D1AB]/40 transition-all outline-none resize-none placeholder:text-white/20 leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <button
                onClick={onClose}
                className="h-14 flex items-center justify-center rounded-[16px] bg-[#1C1C1C] text-white text-sm font-bold hover:bg-[#252525] transition-all border border-white/5 shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="h-14 flex items-center justify-center rounded-[16px] bg-[#E5D5B8] text-black text-sm font-bold hover:bg-[#dec191] transition-all shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PayoutSuccessModal 
        isOpen={isSuccessOpen} 
        onClose={() => {
          setIsSuccessOpen(false);
          onClose();
        }} 
        actionType={actionType}
        data={data}
      />
    </>
  );
}
