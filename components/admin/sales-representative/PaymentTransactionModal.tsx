"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { Button } from "@/components/ui/button";
import { salesApi } from "@/lib/api";

type PaymentTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  isClientLead?: boolean;
  isDark?: boolean;
  onSaved?: () => void;
};
type ManualPaymentHistoryEntry = {
  payment_method?: string;
  payment_type?: "full" | "partial" | string;
  amount?: number | string | null;
  payment_mode?: string | null;
  proof_url?: string | null;
  created_at?: string;
};

const PAYMENT_TYPE_OPTIONS = [
  { label: "Full Payment", value: "full" },
  { label: "Partial Payment", value: "partial" },
];

const PAYMENT_MODE_OPTIONS = [
  { label: "Cash", value: "cash" },
  { label: "Wire", value: "wire" },
  { label: "ACH", value: "ach" },
  { label: "Zelle", value: "zelle" },
  { label: "Venmo", value: "venmo" },
  { label: "CashApp", value: "cashapp" },
  { label: "ApplePay", value: "applepay" },
  { label: "Stripe", value: "stripe" },
  { label: "Other", value: "other" },
];

export default function PaymentTransactionModal({
  isOpen,
  onClose,
  leadId,
  isClientLead = false,
  isDark = true,
  onSaved,
}: PaymentTransactionModalProps) {
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "stripe" | "other">("cash");
  const [otherPaymentMode, setOtherPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadTotalAmount, setLeadTotalAmount] = useState<number | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [isLockedPaid, setIsLockedPaid] = useState(false);
  const [manualHistory, setManualHistory] = useState<ManualPaymentHistoryEntry[]>([]);
  const [isLoadingLeadMeta, setIsLoadingLeadMeta] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeadMeta = async () => {
      setIsLoadingLeadMeta(true);
      try {
        const response = await salesApi.getLeadPaymentMeta(leadId, isClientLead);
        if (!response?.success || !response?.data) return;

        const lead = response.data;
        const pricing = lead?.pricing_breakdown || {};
        const quoteTotal = Number(lead?.booking?.primary_quote?.total ?? 0);
        const resolvedTotal =
          Number(pricing?.total_after_credit ?? pricing?.total ?? pricing?.total_before_credit ?? 0) || quoteTotal || 0;

        setLeadTotalAmount(resolvedTotal > 0 ? resolvedTotal : null);

        const activities = Array.isArray(lead?.activities) ? lead.activities : [];
        const parsedHistory = activities.map((activity: { activity_data?: unknown; created_at?: string }) => {
          const payload = typeof activity?.activity_data === "string"
            ? (() => {
                try {
                  return JSON.parse(activity.activity_data);
                } catch {
                  return null;
                }
              })()
            : activity?.activity_data;

          if (!payload || payload.payment_method !== "manual") return null;
          return {
            ...payload,
            created_at: activity?.created_at,
          } as ManualPaymentHistoryEntry;
        }).filter(Boolean) as ManualPaymentHistoryEntry[];

        setManualHistory(parsedHistory);
        const hasFull = parsedHistory.some((entry) => entry.payment_type === "full");
        const partialTotal = parsedHistory.reduce((sum, entry) => {
          if (entry.payment_type !== "partial") return sum;
          const value = Number(entry.amount || 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);
        const finalPaid = hasFull ? (resolvedTotal > 0 ? resolvedTotal : partialTotal) : partialTotal;
        const finalPending = Math.max((resolvedTotal > 0 ? resolvedTotal : 0) - finalPaid, 0);
        setPaidAmount(finalPaid);
        setPendingAmount(finalPending);
        setIsLockedPaid(hasFull || (resolvedTotal > 0 && finalPending <= 0));
      } catch (error) {
        console.error("Failed to load lead payment meta:", error);
      } finally {
        setIsLoadingLeadMeta(false);
      }
    };

    void fetchLeadMeta();
  }, [isClientLead, isOpen, leadId]);

  const canSubmit = useMemo(() => {
    if (!proofUrl) return false;
    if (paymentType === "partial" && (!amount || Number(amount) <= 0)) return false;
    if (
      paymentType === "partial" &&
      pendingAmount > 0 &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > pendingAmount
    ) return false;
    if (paymentMode === "other" && !otherPaymentMode.trim()) return false;
    if (isLockedPaid) return false;
    return true;
  }, [amount, isLockedPaid, otherPaymentMode, paymentMode, paymentType, pendingAmount, proofUrl]);

  const resetAndClose = () => {
    setPaymentType("full");
    setAmount("");
    setPaymentMode("cash");
    setOtherPaymentMode("");
    setNotes("");
    setProofFileName("");
    setProofUrl("");
    onClose();
  };

  const handleProofUpload = async (file: File | null) => {
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const response = await salesApi.uploadManualPaymentProof(file);
      if (!response?.success || !response?.data?.proof_url) {
        toast.error(response?.error || response?.message || "Failed to upload proof");
        return;
      }
      setProofUrl(response.data.proof_url);
      setProofFileName(file.name);
      toast.success("Proof file uploaded");
    } catch (error) {
      console.error("Proof upload failed:", error);
      toast.error("Failed to upload proof file");
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error("Please complete required fields");
      return;
    }

    if (
      paymentType === "partial" &&
      pendingAmount > 0 &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > pendingAmount
    ) {
      toast.error(`Amount cannot exceed remaining amount ($${pendingAmount.toLocaleString()})`);
      return;
    }

    const payload = {
      payment_type: paymentType,
      amount: paymentType === "partial" ? Number(amount) : undefined,
      payment_mode: paymentMode,
      other_payment_mode: paymentMode === "other" ? otherPaymentMode.trim() : undefined,
      proof_url: proofUrl,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const response = isClientLead
        ? await salesApi.recordClientLeadManualPayment(leadId, payload)
        : await salesApi.recordLeadManualPayment(leadId, payload);

      if (!response?.success) {
        toast.error(response?.error || response?.message || "Failed to save payment transaction");
        return;
      }

      toast.success("Payment transaction saved");
      onSaved?.();
      resetAndClose();
    } catch (error) {
      console.error("Save payment transaction failed:", error);
      toast.error("Failed to save payment transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/55" onClick={resetAndClose} />
      <div className={`fixed left-1/2 top-1/2 z-[80] w-[95vw] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border shadow-2xl ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#D8D8D8] bg-white text-black"}`}>
        <div className={`border-b px-5 py-4 lg:px-6 ${isDark ? "border-white/10 bg-gradient-to-r from-[#201a13] to-[#171717]" : "border-[#EAEAEA] bg-gradient-to-r from-[#FFF3DF] to-white"}`}>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Payment Transaction</h3>
            <button onClick={resetAndClose} className={`rounded-md p-1 ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <X size={18} />
            </button>
          </div>
          <p className={`text-xs ${isDark ? "text-white/60" : "text-black/55"}`}>
            Record offline payment with proof verification.
          </p>
        </div>

        <div className="p-5 lg:p-6">
          <div className={`mb-4 rounded-xl border px-4 py-3 ${isDark ? "border-[#E8D1AB]/30 bg-[#E8D1AB]/10" : "border-[#E8D1AB] bg-[#FFF9EE]"}`}>
            <p className={`text-xs uppercase tracking-[0.12em] ${isDark ? "text-[#E8D1AB]" : "text-[#8A5B00]"}`}>Original Amount</p>
            <div className="mt-1 flex items-center gap-2">
              {isLoadingLeadMeta ? <Loader2 size={14} className="animate-spin" /> : null}
              <p className="text-lg font-semibold">
                {leadTotalAmount ? `$${leadTotalAmount.toLocaleString()}` : "Not available"}
              </p>
            </div>
            {leadTotalAmount ? (
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className={`${isDark ? "text-white/60" : "text-black/55"}`}>Paid</p>
                  <p className="font-semibold text-emerald-500">${paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className={`${isDark ? "text-white/60" : "text-black/55"}`}>Pending</p>
                  <p className="font-semibold text-amber-500">${pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            ) : null}
          </div>
          {isLockedPaid && (
            <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              Payment already completed. Transaction is locked.
            </div>
          )}

          <div className={`space-y-4 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#EEEEEE] bg-[#FCFCFC]"}`}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">Payment Type</p>
                <BasicDropdown
                  label="Payment Type"
                  value={paymentType}
                  onChange={(value) => setPaymentType(value as "full" | "partial")}
                  options={PAYMENT_TYPE_OPTIONS}
                  width="w-full"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">Payment Mode</p>
                <BasicDropdown
                  label="Payment Mode"
                  value={paymentMode}
                  onChange={(value) => setPaymentMode(value as "cash" | "wire" | "ach" | "zelle" | "venmo" | "cashapp" | "applepay" | "stripe" | "other")}
                  options={PAYMENT_MODE_OPTIONS}
                  width="w-full"
                />
              </div>
            </div>

            {paymentType === "partial" && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">
                  Partial Amount
                </p>
                <input
                  type="number"
                  min="0"
                  max={pendingAmount || undefined}
                  step="0.01"
                  value={amount}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (!nextValue) {
                      setAmount("");
                      return;
                    }
                    const nextNumber = Number(nextValue);
                    if (!Number.isFinite(nextNumber) || nextNumber < 0) return;
                    if (pendingAmount > 0 && nextNumber > pendingAmount) {
                      setAmount(String(pendingAmount));
                      toast.error(`Amount cannot exceed remaining amount ($${pendingAmount.toLocaleString()})`);
                      return;
                    }
                    setAmount(nextValue);
                  }}
                  placeholder={pendingAmount ? `Max $${pendingAmount.toLocaleString()}` : "Enter partial amount"}
                  className={`h-11 w-full rounded-lg border px-3 text-sm bg-transparent outline-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
                />
                {pendingAmount ? (
                  <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                    Maximum allowed: ${pendingAmount.toLocaleString()}
                  </p>
                ) : null}
              </div>
            )}

            {paymentMode === "other" && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">Other Payment Mode</p>
                <input
                  type="text"
                  value={otherPaymentMode}
                  onChange={(event) => setOtherPaymentMode(event.target.value)}
                  placeholder="Enter payment mode"
                  className={`h-11 w-full rounded-lg border px-3 text-sm bg-transparent outline-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
                />
              </div>
            )}

            <div className={`rounded-lg border p-3 ${isDark ? "border-white/20" : "border-[#D8D8D8]"}`}>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">
                Proof Upload (Required)
              </label>
              <div className="flex items-center gap-2">
                <label className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${isDark ? "border-white/20 hover:bg-white/5" : "border-[#D8D8D8] hover:bg-black/[0.03]"}`}>
                  <Upload size={14} />
                  {isUploadingProof ? "Uploading..." : "Choose File"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      void handleProofUpload(file);
                    }}
                    disabled={isUploadingProof || isLockedPaid}
                  />
                </label>
                {isUploadingProof && <Loader2 size={16} className="animate-spin" />}
                {proofFileName && <span className="truncate text-xs text-[#71717B]">{proofFileName}</span>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">Notes (Optional)</p>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes (optional)"
                className={`w-full rounded-lg border p-3 text-sm bg-transparent outline-none resize-none ${isDark ? "border-white/20 text-white placeholder:text-white/35" : "border-[#D8D8D8] text-black placeholder:text-black/35"}`}
              />
            </div>
            {manualHistory.length > 0 && (
              <div className={`rounded-lg border p-3 ${isDark ? "border-white/15 bg-white/[0.02]" : "border-[#E4E4E7] bg-white"}`}>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#71717B]">Payment History</p>
                <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                  {manualHistory.map((entry, idx) => (
                    <div key={`${entry.created_at || idx}-${idx}`} className={`rounded-md border px-2 py-2 text-xs ${isDark ? "border-white/10" : "border-[#ECECEC]"}`}>
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-semibold">{entry.payment_type} · {String(entry.payment_mode || "").replace("_", " ")}</span>
                        <span>{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}</span>
                      </div>
                      <p className={`mt-1 ${entry.payment_type === "partial" ? "text-amber-500" : "text-emerald-500"}`}>
                        {entry.payment_type === "partial" ? `Paid $${Number(entry.amount || 0).toLocaleString()}` : "Marked fully paid"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndClose} className="h-10 px-4">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!canSubmit || isSubmitting || isUploadingProof}
              className={`h-10 px-5 ${isDark ? "bg-[#E8D1AB] text-[#101010] hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"}`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
