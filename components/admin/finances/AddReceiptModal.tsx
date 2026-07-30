"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { ShootCPRow } from "./CPPayoutTable";

export type ReceiptPayload = {
  paymentMethod: string;
  otherPaymentMethod?: string;
  amount: number;
  transactionId: string;
  proofFile: File | null;
  notes: string;
};

export type AddReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rowContext: ShootCPRow | null;
  payableAmount?: number;
  onSubmit: (payload: ReceiptPayload) => void;
  isSubmitting?: boolean;
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "wire", label: "Wire" },
  { value: "ach", label: "ACH" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "cashapp", label: "CashApp" },
  { value: "applepay", label: "ApplePay" },
  { value: "net30", label: "Net 30" },
  { value: "other", label: "Other" },
];

const formatMoneyValue = (value?: number | null) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric.toFixed(2) : "";
};

export default function AddReceiptModal({
  onSubmit,
  isSubmitting = false,
  isOpen,
  onClose,
  rowContext,
  payableAmount
}: AddReceiptModalProps) {
  const { isDark } = useResolvedTheme();

  // Component State Elements
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [otherPaymentMethod, setOtherPaymentMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>(formatMoneyValue(payableAmount || rowContext?.cpPayout));
  const [transactionId, setTransactionId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(formatMoneyValue(payableAmount || rowContext?.cpPayout));
      setPaymentMethod("");
      setOtherPaymentMethod("");
      setTransactionId("");
      setNotes("");
      setProofFile(null);
      setIsDropdownOpen(false);
      setIsDraggingFile(false);
    }
  }, [isOpen, payableAmount, rowContext?.cpPayout]);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      setProofFile(droppedFile);
    }
  };

  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const numericValue = Number(String(rawValue || "0").replace(/[$,]/g, ""));
    const maxAmount = Number(payableAmount || rowContext?.cpPayout || 0);

    if (!Number.isFinite(numericValue)) {
      setAmount("");
      return;
    }

    if (maxAmount > 0 && numericValue > maxAmount) {
      setAmount(String(maxAmount));
      return;
    }

    setAmount(rawValue);
  };

  const handleSave = () => {
    onSubmit({
      paymentMethod,
      otherPaymentMethod: paymentMethod === "other" ? otherPaymentMethod.trim() : undefined,
      amount: Number(String(amount || "0").replace(/[$,]/g, "")) || 0,
      transactionId,
      proofFile,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5">
      <div className={`relative max-h-[90vh] w-full lg:max-w-6xl overflow-y-auto no-scrollbar rounded-[16px] border transition-colors duration-200 ${isDark
        ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
        : "border-[#D7D7D7] bg-white text-black shadow-2xl"
        }`}>

        {/* Header Block Panel */}
        <div className={`flex items-center justify-between border-b p-4 lg:p-7 ${isDark ? "border-white/40" : "border-[#D7D7D7]"}`}>
          <h2 className={`pr-4 text-lg lg:text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            Add Receipt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${isDark ? "bg-[#2E2725] text-white hover:bg-[#39312E]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2.1} className="lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="space-y-4 lg:space-y-5 p-4 lg:p-7">
          {/* Form Fields Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Select Payment Method (Custom Float Dropdown Wrapper) */}
            <div className={`relative rounded-xl border px-4 py-2 mt-2 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
              <div className="absolute -top-3 left-3 px-1 text-sm z-10">
                <span className={`px-1 text-sm lg:text-base ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                  Select Payment Method*
                </span>
              </div>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-11 lg:h-14 w-full items-center justify-between cursor-pointer text-sm lg:text-base"
              >
                <span className={paymentMethod ? (isDark ? "text-white" : "text-black") : (isDark ? "text-white/40" : "text-[#9F9FA9]")}>
                  {PAYMENT_METHODS.find((method) => method.value === paymentMethod)?.label || "Select payment mode"}
                </span>
                <ChevronDown size={18} className={isDark ? "text-white/60" : "text-black/60"} />
              </div>

              {isDropdownOpen && (
                <div className={`absolute left-0 right-0 top-[105%] z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto no-scrollbar ${isDark ? "bg-[#141414] border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"}`}>
                  {PAYMENT_METHODS.map((method) => (
                    <div
                      key={method.value}
                      onClick={() => {
                        setPaymentMethod(method.value);
                        if (method.value !== "other") {
                          setOtherPaymentMethod("");
                        }
                        setIsDropdownOpen(false);
                      }}
                      className={`px-4 py-3 text-sm cursor-pointer transition-colors ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
                    >
                      {method.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {paymentMethod === "other" && (
              <div className={`relative rounded-xl border px-4 py-2 mt-2 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
                <div className="absolute -top-3 left-3 px-1 text-sm z-10">
                  <span className={`px-1 text-sm lg:text-base ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                    Other Payment Mode*
                  </span>
                </div>
                <input
                  type="text"
                  value={otherPaymentMethod}
                  onChange={(event) => setOtherPaymentMethod(event.target.value)}
                  placeholder="Enter payment mode..."
                  className={`h-11 lg:h-14 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-[#9F9FA9]"}`}
                />
              </div>
            )}

            <div className={`relative rounded-xl border px-4 py-2 mt-2 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
              <div className="absolute -top-3 left-3 px-1 text-sm z-10">
                <span className={`px-1 text-sm lg:text-base ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                  Amount*
                </span>
              </div>
              <input
                type="number"
                min="0"
                max={Number(payableAmount || rowContext?.cpPayout || 0) || undefined}
                step="0.01"
                value={amount}
                onChange={handleAmountChange}
                placeholder="$0.00"
                className={`h-11 lg:h-14 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-[#9F9FA9]"}`}
              />
            </div>

            {/* 2. Transaction ID Input Field */}
            <div className={`relative rounded-xl border px-4 py-2 mt-2 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
              <div className="absolute -top-3 left-3 px-1 text-sm z-10">
                <span className={`px-1 text-sm lg:text-base ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                  Transaction ID*
                </span>
              </div>
              <input
                type="text"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Enter transaction unique ID..."
                className={`h-11 lg:h-14 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-[#9F9FA9]"}`}
              />
            </div>
          </div>

          {/* 3. Proof Upload Box Wrapper */}
          <div className="space-y-2 lg:space-y-3">
            <label className={`text-sm lg:text-base  ${isDark ? "text-white/60" : "text-black/60"}`}>
              Proof Upload <span className="text-[#E8D1AB]">(Required)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
              className={`mt-3 border border-dashed rounded-xl p-6 lg:p-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isDraggingFile
                ? "border-[#E8D1AB] bg-[#E8D1AB]/10"
                : isDark
                ? "border-[#5A5A5F] bg-black hover:bg-zinc-900/40"
                : "border-[#D7D7D7] bg-[#FAFAFA] hover:bg-zinc-100/70"
                }`}
            >
              <p className="text-sm font-medium">
                {proofFile ? (
                  <span className="text-[#EED4A7] font-semibold">{proofFile.name}</span>
                ) : (
                  <>Drag & Drop Your File Here Or <span className="text-[#EED4A7] underline hover:text-[#EED4A7]/80">Upload</span></>
                )}
              </p>
            </div>
          </div>

          {/* 4. Notes Text Area Container */}
          <div className={`rounded-2xl border px-5 pb-4 pt-0 relative mt-6 lg:px-6 lg:pb-4 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`}>
            <div className="absolute -top-3 left-3 px-2 text-sm lg:text-base z-10">
              <span className={`px-2 font-medium ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`}>
                Add Notes
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Provide extra details for audit validation logs..."
              className={`min-h-[90px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm lg:text-base outline-none lg:min-h-[81px] lg:text-base ${isDark ? "text-white placeholder:text-white/50" : "text-black placeholder:text-[#9F9FA9]"}`}
            />
          </div>

          {/* Save Action Execution Drawer */}

          <Button
            type="button"
            disabled={isSubmitting || !paymentMethod || (paymentMethod === "other" && !otherPaymentMethod.trim()) || !(Number(amount) > 0) || !transactionId || !proofFile}
            onClick={handleSave}
            className="h-10 lg:h-12 w-full lg:w-fit rounded-lg bg-[#EED4A7] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7]/92 lg:text-base disabled:opacity-40"
          >
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>

        </div>
      </div>
    </div>
  );
}
