"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

type AddReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultPaymentMethod?: string;
};

type SavedReceipt = {
  paymentMethod: string;
  transactionId: string;
  notes: string;
  fileName: string;
  createdAt: string;
  downloadUrl: string;
};

const PAYMENT_METHOD_OPTIONS = [
  "UPI",
  "Cash",
  "Bank Transfer",
  "Credit Card",
  "Stripe",
  "Wise",
  "PayPal",
  "Cheque",
  "Other",
];

export default function AddReceiptModal({
  isOpen,
  onClose,
  defaultPaymentMethod = "Bank Transfer",
}: AddReceiptModalProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState("");
  const [savedReceipt, setSavedReceipt] = useState<SavedReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setPaymentMethod(defaultPaymentMethod);
    setTransactionId("");
    setNotes("");
    setProofFile(null);
    setProofFileName("");
    setSavedReceipt(null);
    setErrorMessage("");
  }, [defaultPaymentMethod, isOpen]);

  useEffect(() => {
    return () => {
      if (savedReceipt?.downloadUrl) {
        URL.revokeObjectURL(savedReceipt.downloadUrl);
      }
    };
  }, [savedReceipt]);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setProofFile(file);
    setProofFileName(file.name);
    setErrorMessage("");
  };

  const handleSave = () => {
    if (!paymentMethod.trim() || !transactionId.trim() || !proofFile) {
      setErrorMessage("Please fill payment method, transaction ID, and proof file.");
      return;
    }

    const downloadUrl = URL.createObjectURL(proofFile);
    setSavedReceipt({
      paymentMethod,
      transactionId,
      notes,
      fileName: proofFileName,
      createdAt: new Date().toLocaleString(),
      downloadUrl,
    });
    setErrorMessage("");
  };

  const handleDownloadProof = () => {
    if (!savedReceipt?.downloadUrl) return;

    const link = document.createElement("a");
    link.href = savedReceipt.downloadUrl;
    link.download = savedReceipt.fileName || "proof-file";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fileBadge = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toUpperCase() || "FILE";
    return extension.length > 4 ? extension.slice(0, 4) : extension;
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div className="absolute inset-0" onClick={onClose} />

      <div className={`relative z-[261] w-full max-w-[720px] overflow-hidden rounded-[28px] border shadow-2xl ${isDark ? "border-white/10 bg-black" : "border-[#E5E5E5] bg-white text-black"}`}>
        <div className="flex items-center justify-between px-6 py-5 lg:px-8 lg:py-6">
          <h2 className={`text-[22px] font-semibold leading-none lg:text-[24px] ${isDark ? "text-white" : "text-black"}`}>
            Add Receipt
          </h2>

          <button
            onClick={onClose}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all lg:h-11 lg:w-11 ${isDark ? "bg-[#2A2424] text-white hover:bg-[#3A3333]" : "bg-black/5 text-black hover:bg-black/10"}`}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        <div className={`border-t px-6 py-6 lg:px-8 lg:py-8 ${isDark ? "border-white/20" : "border-black/10"}`}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <div className="relative">
              <label className={`pointer-events-none absolute -top-2.5 left-4 z-10 inline-flex px-2 py-0.5 text-[11px] leading-none lg:-top-3 lg:text-xs ${isDark ? "bg-black text-white/50" : "bg-white text-black/50"}`}>
                Select Payment Method*
              </label>
              <div className={`relative h-[46px] w-full overflow-hidden rounded-2xl border transition-colors lg:h-[54px] ${isDark ? "border-white/10 bg-black hover:border-white/20" : "border-[#E5E5E5] bg-white hover:border-[#D7D7D7]"}`}>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className={`h-full w-full appearance-none bg-transparent px-4 pr-10 text-sm outline-none lg:px-5 lg:text-sm ${isDark ? "text-white" : "text-black"}`}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option} className={isDark ? "bg-[#101010] text-white" : "bg-white text-black"}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/60" : "text-black/40"}`} size={18} />
              </div>
            </div>

            <div className="relative">
              <label className={`pointer-events-none absolute -top-2.5 left-4 z-10 inline-flex px-2 py-0.5 text-[11px] leading-none lg:-top-3 lg:text-xs ${isDark ? "bg-black text-white/50" : "bg-white text-black/50"}`}>
                Transaction ID*
              </label>
              <input
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder=""
                className={`h-[46px] w-full rounded-2xl border px-4 text-sm outline-none transition-colors focus:border-[#E8D1AB] lg:h-[54px] lg:px-5 lg:text-sm ${isDark ? "border-white/10 bg-black text-white placeholder:text-white/40" : "border-[#E5E5E5] bg-white text-black placeholder:text-black/30"}`}
              />
            </div>
          </div>

          <div className="mt-4 lg:mt-5">
            <p className={`mb-2 text-sm lg:mb-3 lg:text-base ${isDark ? "text-white/60" : "text-black/60"}`}>
              Proof Upload <span className="text-[#E8D1AB]">(Required)</span>
            </p>

            <label className={`flex min-h-[90px] cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-transparent px-6 text-center transition-all lg:min-h-[96px] ${isDark ? "border-white/10 hover:border-[#E8D1AB]/40 bg-black" : "border-[#E5E5E5] hover:border-[#E8D1AB] bg-white"}`}>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
              />
              <span className={`text-sm lg:text-[15px] ${isDark ? "text-white/90" : "text-black/80"}`}>
                Drag & Drop Your File Here Or <span className="font-semibold text-[#E8D1AB]">Upload</span>
              </span>
            </label>

            {proofFileName ? (
              <p className={`mt-3 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
                Selected file: {proofFileName}
              </p>
            ) : null}
          </div>

          <div className="mt-4 lg:mt-5">
            <div className="relative">
              <label className={`pointer-events-none absolute -top-2.5 left-4 z-10 inline-flex px-2 py-0.5 text-[11px] leading-none lg:-top-3 lg:text-xs ${isDark ? "bg-black text-white/50" : "bg-white text-black/50"}`}>
                Add Notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className={`w-full rounded-2xl border px-4 pb-2 pt-6 text-sm outline-none transition-colors focus:border-[#E8D1AB] lg:px-5 lg:pb-3 lg:pt-7 lg:text-sm ${isDark ? "border-white/10 bg-black text-white placeholder:text-white/40" : "border-[#E5E5E5] bg-white text-black placeholder:text-black/30"}`}
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-4 text-sm text-[#FF8A8A]">{errorMessage}</p>
          ) : null}

          <Button
            onClick={handleSave}
            variant="beige"
            className="mt-5 h-10 rounded-[14px] px-8 text-sm font-semibold lg:mt-6 lg:h-11 lg:px-9 lg:text-sm"
          >
            Save
          </Button>

          {savedReceipt ? (
            <div className={`mt-6 overflow-hidden rounded-[16px] border ${isDark ? "border-white/12 bg-[#141414]" : "border-black/10 bg-[#F7F7F7]"}`}>
              <div className="flex items-stretch">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] lg:h-14 lg:w-14 ${isDark ? "bg-[#2B2B2B] text-[#E8D1AB]" : "bg-black/5 text-[#8C6B2D]"}`}>
                    <span className="text-xs font-semibold tracking-[0.12em]">{fileBadge(savedReceipt.fileName)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-sm lg:text-[16px] ${isDark ? "text-white" : "text-black"}`}>
                      {savedReceipt.transactionId} via {savedReceipt.paymentMethod}
                    </p>
                    <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>{savedReceipt.createdAt}</p>
                    {savedReceipt.notes ? (
                      <p className={`mt-2 truncate text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>{savedReceipt.notes}</p>
                    ) : null}
                  </div>
                </div>

                <Button
                  onClick={handleDownloadProof}
                  variant="beige"
                  className="flex min-w-[160px] items-center justify-center gap-2 px-4 text-xs lg:min-w-[200px] lg:gap-3 lg:px-5 lg:text-sm"
                >
                  Download Proof
                  <Download size={18} />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
