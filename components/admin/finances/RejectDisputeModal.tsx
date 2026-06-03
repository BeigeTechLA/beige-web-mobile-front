"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface RejectDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string;
}

export default function RejectDisputeModal({
  isOpen,
  onClose,
  disputeId,
}: RejectDisputeModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Handle submission logic here
    console.log("Rejecting dispute:", disputeId, { rejectReason, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-[131] w-full max-w-[500px] rounded-[24px] border border-white/10 bg-black p-0 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6">
          <h2 className="text-2xl font-semibold text-white">Reject Dispute</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>

        <div className="h-px w-full bg-white/10" />

        <div className="px-7 py-8 space-y-6">
          {/* Reject Reason Select */}
          <div className="relative">
            <span className="absolute -top-2.5 left-4 bg-black px-2 text-[12px] font-medium text-white/40 z-10">
              Enter Reject Reason*
            </span>
            <div className="relative">
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-16 bg-transparent border border-white/20 rounded-xl px-4 text-[14px] text-white/90 outline-none appearance-none cursor-pointer hover:border-white/30 transition-colors"
                required
              >
                <option value="" disabled className="bg-black text-white/30">Select a reason...</option>
                <option value="invalid_evidence" className="bg-black text-white">Invalid Evidence</option>
                <option value="policy_violation" className="bg-black text-white">Policy Violation</option>
                <option value="resolved_internally" className="bg-black text-white">Resolved Internally</option>
                <option value="other" className="bg-black text-white">Other</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="relative">
            <span className="absolute -top-2.5 left-4 bg-black px-2 text-[12px] font-medium text-white/40 z-10">
              Add Notes (Optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional details..."
              className="w-full min-h-[160px] bg-transparent border border-white/20 rounded-xl p-4 text-[14px] text-white/90 outline-none resize-none hover:border-white/30 transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="flex h-12 w-32 items-center justify-center rounded-xl bg-[#E8D1AB] text-[14px] font-semibold text-black transition-all hover:bg-[#d9c19a] active:scale-95"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
