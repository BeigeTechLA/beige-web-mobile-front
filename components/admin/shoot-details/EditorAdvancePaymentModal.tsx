"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { set } from "date-fns";

import { Button } from "@/components/ui/button";
import { DatePickerFloating } from "../DatePickerFloating"; // same import as AdvancePaymentModal – adjust if the file lives elsewhere
import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

/* =====================================================================
   Advance Payment – Editor version of AdvancePaymentModal
   Differences from the CP modal (per the editor designs):
   • "Enter Advance Amount" field, remaining balance shown under it until an amount is typed
   • Once an amount is entered, a summary box shows Advance Payment + Remaining Balance
   • Proof upload is off by default (can be enabled with showProofUpload)
   ===================================================================== */

export type EditorAdvancePaymentPayload = {
  reason: string;
  advanceAmount: string;
  paymentDate: Date | null;
  proofFile?: File | null;
};

export type EditorAdvancePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editorName?: string | null;
  totalCompensation: number;
  /** Max advance (defaults to the total compensation) */
  maxAmount?: number;
  initialAdvanceAmount?: number | string | null;
  initialPaymentDate?: Date | string | null;
  initialNotes?: string | null;
  onSubmit: (payload: EditorAdvancePaymentPayload) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showProofUpload?: boolean;
  requireProofUpload?: boolean;
};

const parseDateAsLocalDay = (value: Date | string | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function EditorAdvancePaymentModal({
  isOpen,
  onClose,
  editorName,
  totalCompensation,
  maxAmount,
  initialAdvanceAmount,
  initialPaymentDate,
  initialNotes,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Advance",
  showProofUpload = false,
  requireProofUpload = false,
}: EditorAdvancePaymentModalProps) {
  const { isDark } = useResolvedTheme();
  const [notes, setNotes] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const compensation = Number(totalCompensation || 0);
  const availableAmount = Number(maxAmount || compensation || 0);
  const parsedAdvanceAmount = useMemo(() => {
    const numeric = Number(String(advanceAmount || "0").replace(/[$,]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [advanceAmount]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const remaining = Math.max(compensation - parsedAdvanceAmount, 0);
  const exceedsMax = availableAmount > 0 && parsedAdvanceAmount > availableAmount;
  const isInvalidAmount = parsedAdvanceAmount <= 0 || exceedsMax;
  const isMissingRequiredProof = showProofUpload && requireProofUpload && !proofFile;

  useEffect(() => {
    if (!isOpen) return;
    setAdvanceAmount(initialAdvanceAmount ? String(initialAdvanceAmount) : "");
    setNotes(initialNotes || "");
    setProofFile(null);
    setPaymentDate(initialPaymentDate ? parseDateAsLocalDay(initialPaymentDate) : null);
  }, [initialAdvanceAmount, initialNotes, initialPaymentDate, isOpen]);

  if (!isOpen) return null;

  const handleDateChange = (date: Date | null) => {
    setPaymentDate(date ? set(new Date(date), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) : null);
  };

  const fieldBox = `rounded-xl border px-5 pb-3 pt-0 relative mt-6 lg:px-6 transition-colors ${isDark ? "border-[#5A5A5F] bg-black" : "border-[#D7D7D7] bg-white"}`;
  const fieldLabel = `px-2 font-medium ${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"}`;

  return (
    <div className={`fixed inset-0 z-[140] flex items-center justify-center p-3 backdrop-blur-md lg:p-5 ${isDark ? "bg-black/82" : "bg-white/82"}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Advance Payment"
        className={`relative max-h-[90vh] w-full lg:max-w-xl overflow-y-auto no-scrollbar rounded-2xl border transition-colors duration-200 ${isDark
          ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
          : "border-[#D7D7D7] bg-white text-black shadow-2xl"
          }`}
      >
        {/* Header */}
        <div className={`sticky top-0 inset-x-0 flex items-center z-20 justify-between border-b p-4 lg:p-7 ${isDark ? "bg-black border-white/40" : "bg-white border-[#D7D7D7]"}`}>
          <h2 className="pr-4 text-lg lg:text-3xl font-bold">Advance Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className={`flex h-11 w-11 lg:w-15 lg:h-15 shrink-0 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${isDark ? "bg-[#2B2626] text-white hover:bg-[#39312E]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"}`}
            aria-label="Close modal"
          >
            <X size={28} strokeWidth={2.1} className="lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="space-y-4 lg:space-y-6 p-4 lg:p-7">
          {/* Total compensation */}
          <div className={`rounded-xl px-4 py-3.5 lg:px-5 lg:py-4 ${isDark ? "bg-[#E8D1AB]/20" : "bg-[#FFF8EC]"}`}>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white" : "text-black"}`}>
              Total Compensation{editorName ? ` for ${editorName}` : ""}
            </p>
            <p className={`mt-1 text-lg lg:text-2xl font-bold ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
              {formatCurrency(compensation)}
            </p>
          </div>

          {/* Advance amount */}
          <div>
            <div className={fieldBox}>
              <div className="absolute -top-3 left-3 px-2 text-sm lg:text-base z-10">
                <span className={fieldLabel}>Enter Advance Amount</span>
              </div>
              <input
                type="number"
                min="0"
                max={availableAmount || undefined}
                step="0.01"
                inputMode="decimal"
                value={advanceAmount}
                onChange={(event) => setAdvanceAmount(event.target.value)}
                placeholder="$0"
                className={`h-12 lg:h-14 w-full border-0 bg-transparent px-0 pt-3 text-sm lg:text-base outline-none ${isDark ? "text-white placeholder:text-white/50" : "text-black placeholder:text-[#9F9FA9]"}`}
              />
            </div>
            {/* Inline remaining balance until an amount is entered (design 1) */}
            {parsedAdvanceAmount <= 0 && (
              <p className={`mt-2 ml-1 text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                Remaining Balance : <span className="text-[#10B981] font-semibold">{formatCurrency(remaining)}</span>
              </p>
            )}
            {exceedsMax && (
              <p className="mt-2 ml-1 text-xs lg:text-sm font-medium text-[#EF4444]">
                Advance can’t be more than {formatCurrency(availableAmount)}
              </p>
            )}
          </div>

          {/* Payment date */}
          <DatePickerFloating
            selectedDate={paymentDate}
            onDateChange={handleDateChange}
            minDate={today}
            width="w-full"
            classnames={`!rounded-xl h-14 lg:h-16 w-full px-0 pt-4 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`}
            labelClasses={`${isDark ? "bg-black text-white/60" : "bg-white text-[#727272]"} text-sm lg:text-base z-10 px-1`}
          />

          {/* Optional proof upload (off by default for editors) */}
          {showProofUpload && (
            <div className="space-y-2">
              <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white/80" : "text-black/70"}`}>
                Upload Proof{requireProofUpload ? "*" : " "}
                {!requireProofUpload && <span className="text-[#E8D1AB]">(Optional)</span>}
              </p>
              <input
                ref={proofInputRef}
                type="file"
                accept="image/png,image/jpeg,application/pdf"
                className="hidden"
                onChange={(event) => setProofFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => proofInputRef.current?.click()}
                className={`flex min-h-[86px] w-full items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors ${isDark ? "border-white/30 bg-black hover:border-[#E8D1AB]/70" : "border-black/20 bg-white hover:border-[#E8D1AB]"}`}
              >
                {proofFile ? (
                  <span className="flex min-w-0 items-center gap-2 text-sm text-[#E8D1AB]">
                    <FileText size={17} className="shrink-0" />
                    <span className="truncate">{proofFile.name}</span>
                  </span>
                ) : (
                  <span className={`flex items-center gap-2 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                    <Upload size={17} className="text-[#E8D1AB]" />
                    Drag & Drop Your File Here Or <span className="font-semibold text-[#E8D1AB]">Upload</span>
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Notes */}
          <div className={fieldBox}>
            <div className="absolute -top-3 left-3 px-2 text-sm lg:text-base z-10">
              <span className={fieldLabel}>Notes</span>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add notes about this advance payment..."
              className={`min-h-[90px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm lg:text-base outline-none lg:min-h-[110px] ${isDark ? "text-white placeholder:text-white/50" : "text-black placeholder:text-[#9F9FA9]"}`}
            />
          </div>

          {/* Summary once an amount is entered (design 2) */}
          {parsedAdvanceAmount > 0 && (
            <div className={`rounded-xl p-4 ${isDark ? "bg-[#2B2B2B]" : "bg-[#F4F5F7]"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Advance Payment</span>
                <span className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {formatCurrency(parsedAdvanceAmount)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Remaining Balance</span>
                <span className="text-sm lg:text-base font-semibold text-[#10B981]">{formatCurrency(remaining)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 inset-x-0 p-4 lg:p-6 grid grid-cols-2 gap-4 z-40 ${isDark ? "bg-black" : "bg-white"}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`h-10 lg:h-12 rounded-lg border px-5 text-sm font-semibold w-full ${isDark
              ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#1A1A1A]"
              : "border-[#D7D7D7] bg-white text-black hover:bg-[#F4F5F7]"
              }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || isInvalidAmount || isMissingRequiredProof}
            onClick={() => onSubmit({ reason: notes, advanceAmount, paymentDate, proofFile: showProofUpload ? proofFile : null })}
            className="h-10 lg:h-12 w-full rounded-lg bg-[#EED4A7] px-5 text-sm font-semibold text-black hover:bg-[#EED4A7]/92 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
