"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RejectDisputeFormData = {
  reason: string;
  notes: string;
};

type RejectDisputeModalProps = {
  open: boolean;
  isDark?: boolean;
  isSubmitting?: boolean;
  disputeLabel?: string;
  onClose: () => void;
  onSubmit: (data: RejectDisputeFormData) => void;
};

const rejectReasons = [
  { value: "invalid_claim", label: "Invalid claim" },
  { value: "insufficient_evidence", label: "Insufficient evidence" },
  { value: "outside_policy", label: "Outside dispute policy" },
  { value: "payment_verified", label: "Payment already verified" },
  { value: "duplicate_dispute", label: "Duplicate dispute" },
  { value: "other", label: "Other" },
];

export default function RejectDisputeModal({
  open,
  isDark = true,
  isSubmitting = false,
  disputeLabel,
  onClose,
  onSubmit,
}: RejectDisputeModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) return;
    onSubmit({ reason, notes });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={`w-[calc(100vw-32px)] max-w-xl overflow-hidden rounded-2xl border p-0 shadow-[0_24px_70px_rgba(0,0,0,0.7)] [&>button]:hidden ${
          isDark ? "border-white/30 bg-black text-white" : "border-black/10 bg-white text-black"
        }`}
      >
        <DialogTitle className="sr-only">Reject Dispute</DialogTitle>

        <div className={`flex items-center justify-between border-b p-6 ${isDark ? "border-white/20" : "border-black/10"}`}>
          <div>
            <h2 className="text-2xl font-bold">Reject Dispute</h2>
            {disputeLabel ? <p className="mt-1 text-sm text-[#E8D1AB]">{disputeLabel}</p> : null}
          </div>
          <DialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2B2525] text-white transition hover:bg-[#3A3333]"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </DialogClose>
        </div>

        <form className="space-y-6 p-6" onSubmit={handleSubmit}>
          <div className="relative">
            <label className={`absolute -top-3 left-4 z-10 px-2 text-sm ${isDark ? "bg-black text-white/50" : "bg-white text-black/60"}`}>
              Enter Reject Reason*
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className={`h-16 rounded-xl text-left ${isDark ? "border-white/30 bg-black text-white" : "border-black/20 bg-white text-black"}`}>
                <SelectValue placeholder="Select reject reason" />
              </SelectTrigger>
              <SelectContent className={`${isDark ? "border-white/10 bg-[#111111] text-white" : "border-black/20 bg-white text-black"}`}>
                {rejectReasons.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className={`rounded-xl border px-4 pb-4 pt-2 ${isDark ? "border-white/30" : "border-black/20"}`}>
            <legend className={`px-2 text-sm ${isDark ? "text-white/50" : "text-black/60"}`}>Add Notes (Optional)</legend>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Add notes for this rejection..."
              className={`min-h-[150px] w-full resize-none border-0 bg-transparent px-0 py-2 text-sm outline-none ${
                isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/30"
              }`}
            />
          </fieldset>

          <button
            type="submit"
            disabled={!reason || isSubmitting}
            className="h-12 rounded-lg bg-[#E8D1AB] px-9 text-sm font-semibold text-black transition hover:bg-[#dfc498] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
