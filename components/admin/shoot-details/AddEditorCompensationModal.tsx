"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Minus, Pencil, Plus, TrendingUp, X } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import EditorAdvancePaymentModal, { type EditorAdvancePaymentPayload } from "./EditorAdvancePaymentModal";

/* =====================================================================
   Add Compensation – Editor version of AddCompensationModal
   • One editor (passed in) – no shoot dropdown, no CP checkboxes
   • Equal Split / Role Based / Manual + Flat / Hourly, same maths as the CP modal
   • Collapsible editor card, Add / Edit Advance Payment (EditorAdvancePaymentModal)
   • Footer: Back · Submit To Finance · Add Shoot Agreement
   ===================================================================== */

/* ---------------- Types ---------------- */

export interface CompensationEditor {
  id: number;
  name: string;
  role: string;            // "External Editor"
  avatarUrl?: string;
  avatarBg?: string;
  /** Used by "Role Based" (falls back to the equal-split amount) */
  roleRate?: number;
}

export interface CompensationShoot {
  bookingId: number;
  name?: string;
  /** Overall shoot budget */
  shootAmount: number;
  /** Compensation already committed to other team members on this shoot */
  existingCompensation?: number;
  /** How many people share the 25% equal-split pool (incl. this editor) */
  splitCount?: number;
}

export interface EditorCompensationPayload {
  booking_id: number;
  editor_id: number;
  compensation_method: "equal_split" | "role_based" | "manual";
  rate_type: "flat" | "hourly";
  hours?: number;
  hourly_rate?: number;
  items: { label: string; amount: number }[];
  total: number;
  notes: string | null;
  advance?: {
    amount: number;
    payment_date?: string;
    notes?: string;
    proof_file?: File | null;
  };
}

interface AddEditorCompensationModalProps {
  isOpen: boolean;
  /** X button / backdrop */
  onClose: () => void;
  /** "Back" button (defaults to onClose) */
  onBack?: () => void;
  editor: CompensationEditor | null;
  shoot: CompensationShoot;
  isSubmitting?: boolean;
  /** "Submit To Finance" */
  onSubmit: (payload: EditorCompensationPayload) => Promise<void> | void;
  /** "Add Shoot Agreement" – enabled only once `isSubmitted` is true */
  onAddShootAgreement?: (payload: EditorCompensationPayload) => void;
  /** Compensation has been submitted to Finance: locks "Submit To Finance", enables "Add Shoot Agreement" */
  isSubmitted?: boolean;
  enableAdvanceProofUpload?: boolean;
}

type Method = "equal" | "role" | "manual";

type FormState = {
  target: string;      // equal / role: amount the payouts are carved out of
  base: string;        // manual flat: base typed in
  rateType: "flat" | "hourly";
  hourlyRate: string;  // manual hourly: typed in
  hours: string;
  editing: string;
  travel: string;
  bonus: string;
  notes: string;
  advanceAmount: string;
  advancePaymentDate: string; // yyyy-mm-dd
  advanceNotes: string;
  advanceProofFile: File | null;
};

/* ---------------- Helpers (same rules as the CP modal) ---------------- */

const parseAmount = (value: string) => Number(String(value || "0").replace(/[$,]/g, "")) || 0;
const round = (value: number) => Number(value.toFixed(2));
const sanitize = (value: string) => {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  return rest.length ? `${whole || "0"}.${rest.join("").slice(0, 2)}` : whole;
};
const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const toUsDate = (value: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return m ? `${m[2]}/${m[3]}/${m[1]}` : value;
};
const methodToApi = (m: Method): EditorCompensationPayload["compensation_method"] =>
  m === "role" ? "role_based" : m === "manual" ? "manual" : "equal_split";

const getPercentMeta = (percentage: number) => {
  const p = Number(percentage.toFixed(1));
  if (p <= 25) return { color: "#10B981", label: "Healthy" };
  if (p <= 50) return { color: "#F59E0B", label: "Review margin" };
  return { color: "#EF4444", label: "High payout risk" };
};

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/** Breakdown of one editor's compensation */
const getBreakdown = (form: FormState, method: Method) => {
  const hours = Math.max(parseAmount(form.hours || "1"), 1);
  const editingRaw = Math.max(parseAmount(form.editing), 0);
  const travelRaw = Math.max(parseAmount(form.travel), 0);
  const bonusRaw = Math.max(parseAmount(form.bonus), 0);

  if (method === "manual") {
    // Base stays separate; other payouts are added on top
    const base = form.rateType === "hourly"
      ? round(Math.max(parseAmount(form.hourlyRate), 0) * hours)
      : round(Math.max(parseAmount(form.base), 0));
    const total = round(base + editingRaw + travelRaw + bonusRaw);
    return { base, editing: round(editingRaw), travel: round(travelRaw), bonus: round(bonusRaw), total, hourlyRate: form.rateType === "hourly" ? parseAmount(form.hourlyRate) : base / hours, hours };
  }

  // Equal split / role based: payouts are carved out of the target, base gets what's left
  let remaining = round(Math.max(parseAmount(form.target), 0));
  const editing = round(Math.min(editingRaw, remaining)); remaining = round(remaining - editing);
  const travel = round(Math.min(travelRaw, remaining)); remaining = round(remaining - travel);
  const bonus = round(Math.min(bonusRaw, remaining)); remaining = round(remaining - bonus);
  const base = remaining;
  return { base, editing, travel, bonus, total: round(base + editing + travel + bonus), hourlyRate: round(base / hours), hours };
};

const defaultForm = (target: number): FormState => ({
  target: String(target),
  base: String(target),
  rateType: "flat",
  hourlyRate: "",
  hours: "1",
  editing: "0",
  travel: "0",
  bonus: "0",
  notes: "",
  advanceAmount: "",
  advancePaymentDate: "",
  advanceNotes: "",
  advanceProofFile: null,
});

/* ---------------- Component ---------------- */

export default function AddEditorCompensationModal({
  isOpen,
  onClose,
  onBack,
  editor,
  shoot,
  isSubmitting = false,
  onSubmit,
  onAddShootAgreement,
  isSubmitted = false,
  enableAdvanceProofUpload = false,
}: AddEditorCompensationModalProps) {
  const { isDark } = useResolvedTheme();
  const [method, setMethod] = useState<Method>("equal");
  const [expanded, setExpanded] = useState(true);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  const shootAmount = Number(shoot.shootAmount || 0);
  const splitCount = Math.max(shoot.splitCount ?? 1, 1);
  const equalTarget = round((shootAmount * 0.25) / splitCount);
  const methodTarget = method === "role" ? (editor?.roleRate ?? equalTarget) : equalTarget;

  const [form, setForm] = useState<FormState>(() => defaultForm(equalTarget));

  // Reset when opened / editor changes
  useEffect(() => {
    if (!isOpen) return;
    setMethod("equal");
    setExpanded(true);
    setIsAdvanceOpen(false);
    setForm(defaultForm(equalTarget));
  }, [isOpen, editor?.id]);

  // Method change -> new target (equal / role); manual keeps what was typed
  useEffect(() => {
    if (method === "manual") return;
    setForm((prev) => ({ ...prev, target: String(methodTarget) }));
  }, [method, methodTarget]);

  const breakdown = useMemo(() => getBreakdown(form, method), [form, method]);

  const totalCompensation = round((shoot.existingCompensation || 0) + breakdown.total);
  const compensationPct = shootAmount > 0 ? (totalCompensation / shootAmount) * 100 : 0;
  const marginAmount = shootAmount - totalCompensation;
  const marginPct = shootAmount > 0 ? (marginAmount / shootAmount) * 100 : 0;
  const percentMeta = getPercentMeta(compensationPct);

  const advanceAmount = parseAmount(form.advanceAmount);
  const hasAdvance = advanceAmount > 0;

  if (!isOpen || !editor) return null;

  const update = (field: keyof FormState, value: string) => {
    const money = ["base", "hourlyRate", "editing", "travel", "bonus"].includes(field);
    setForm((prev) => ({ ...prev, [field]: money ? sanitize(value) : value }));
  };

  const setHours = (next: number) => update("hours", String(Math.min(Math.max(next, 1), 24)));

  const buildPayload = (): EditorCompensationPayload => ({
    booking_id: shoot.bookingId,
    editor_id: editor.id,
    compensation_method: methodToApi(method),
    rate_type: form.rateType,
    ...(form.rateType === "hourly" ? { hours: breakdown.hours, hourly_rate: round(breakdown.hourlyRate) } : {}),
    items: [
      { label: "Base Payout", amount: breakdown.base },
      { label: "Editing Payout", amount: breakdown.editing },
      { label: "Travel Adjustment", amount: breakdown.travel },
      { label: "Bonus/Other Adjustment", amount: breakdown.bonus },
    ],
    total: breakdown.total,
    notes: form.notes || null,
    ...(hasAdvance
      ? {
          advance: {
            amount: advanceAmount,
            payment_date: form.advancePaymentDate || undefined,
            notes: form.advanceNotes || undefined,
            proof_file: enableAdvanceProofUpload ? form.advanceProofFile : undefined,
          },
        }
      : {}),
  });

  const handleAdvanceSubmit = (payload: EditorAdvancePaymentPayload) => {
    setForm((prev) => ({
      ...prev,
      advanceAmount: sanitize(payload.advanceAmount),
      advancePaymentDate: payload.paymentDate ? toApiDate(payload.paymentDate) : "",
      advanceNotes: payload.reason,
      advanceProofFile: enableAdvanceProofUpload ? payload.proofFile || null : null,
    }));
    setIsAdvanceOpen(false);
  };

  const removeAdvance = () =>
    setForm((prev) => ({ ...prev, advanceAmount: "", advancePaymentDate: "", advanceNotes: "", advanceProofFile: null }));

  const canSubmit = !isSubmitting && !isSubmitted && breakdown.total > 0;

  /* ---------- styles ---------- */
  const fieldBox = `relative rounded-xl border px-4 lg:px-6 pt-1 pb-1 ${isDark ? "border-[#5A5A5F] bg-[#1F1F1F]" : "border-[#D7D7D7] bg-white"}`;
  const fieldLabel = `absolute -top-3 left-4 px-2 text-sm z-10 ${isDark ? "bg-[#1F1F1F] text-white/60" : "bg-white text-black/60"}`;
  const fieldInput = `h-12 lg:h-14 w-full border-0 bg-transparent px-0 text-sm lg:text-base outline-none ${isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"}`;
  const tabWrap = `grid p-1.5 border rounded-lg ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#D7D7D7]"}`;
  const isReadOnlyBase = method !== "manual";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-end backdrop-blur-sm animate-in fade-in duration-200 p-4 lg:p-0 ${isDark ? "bg-[#101010CC]" : "bg-black/40"}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Compensation"
        className={`relative h-full w-full lg:max-w-3xl flex flex-col border rounded-lg lg:rounded-r-none lg:rounded-l-2xl overflow-y-auto animate-in slide-in-from-right duration-200 ${isDark
          ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
          : "border-[#D7D7D7] bg-white text-black shadow-2xl"
          }`}
      >
        {/* Header */}
        <div className={`sticky top-0 inset-x-0 flex items-center z-20 justify-between border-b p-6 lg:p-9 ${isDark ? "bg-black border-[#CACACA]" : "bg-white border-[#E3E3E3]"}`}>
          <div>
            <h2 className="text-lg lg:text-3xl font-bold tracking-tight">Add Compensation</h2>
            <p className={`mt-1 text-xs lg:text-base ${isDark ? "text-white/60" : "text-black/50"}`}>Configure compensation for selected Editor</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-3 lg:p-4 rounded-full transition-colors ${isDark ? "bg-[#2B2626] text-white hover:bg-[#383131]" : "bg-[#F1F1F1] text-[#252525] hover:bg-[#E7E7E7]"}`}
            aria-label="Close compensation drawer"
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="flex-1 space-y-5 lg:space-y-6 p-6 lg:p-9">
          {/* Method */}
          <div className="flex flex-col gap-3">
            <p className="text-sm lg:text-base font-medium">Select Compensation Method</p>
            <div className={`${tabWrap} grid-cols-3`}>
              {([["equal", "Equal Split"], ["role", "Role Based"], ["manual", "Manual"]] as [Method, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`h-10 text-sm lg:text-base rounded-md transition-all ${method === key
                    ? "bg-[#E8D1AB] text-black font-medium shadow-md"
                    : (isDark ? "text-[#C4C4C4] hover:text-white" : "text-black/70 hover:text-black")}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className={`grid grid-cols-2 xl:grid-cols-4 gap-4 border border-[#3D3D3D] rounded-lg p-4 lg:p-5 ${isDark ? "bg-[#E8D1AB]/20" : "bg-[#F7F1E6]"}`}>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-medium">Total Shoot Amount</p>
              <p className="text-lg lg:text-2xl font-bold truncate">{formatCurrency(shootAmount)}</p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>Overall Budget</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-medium">Total Compensation</p>
              <p className={`text-lg lg:text-2xl font-bold truncate ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>{formatCurrency(totalCompensation)}</p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>{compensationPct.toFixed(1)}% of budget</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-medium">Estimated Margin</p>
              <p className="text-lg lg:text-2xl font-bold truncate" style={{ color: marginAmount >= 0 ? "#10B981" : "#EF4444" }}>
                {formatCurrency(marginAmount)}
              </p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>{marginPct.toFixed(1)}% margin</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-sm font-medium">Profitability Estimation</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-black/40" : "bg-black/10"}`}>
                  <div className="h-full transition-all duration-200" style={{ width: `${Math.min(100, Math.max(0, 100 - compensationPct))}%`, backgroundColor: percentMeta.color }} />
                </div>
                <TrendingUp size={18} style={{ color: percentMeta.color }} />
              </div>
              <p className={`text-xs lg:text-sm mt-1.5 ${isDark ? "text-white/70" : "text-black/60"}`}>{percentMeta.label}</p>
            </div>
          </div>

          {/* Editor card */}
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1F1F1F]" : "border bg-[#F4F5F7] border-[#E3E3E3]"}`}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={`w-full flex items-center gap-3 lg:gap-4 p-4 lg:p-6 text-left ${expanded ? (isDark ? "border-b border-[#CACACA]" : "border-b border-[#E3E3E3]") : ""}`}
            >
              <span
                className="h-11 w-11 lg:h-15 lg:w-15 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-black font-semibold"
                style={{ backgroundColor: editor.avatarBg ?? "#E8D1AB" }}
              >
                {editor.avatarUrl ? <img src={editor.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials(editor.name)}
              </span>
              <span className="min-w-0">
                <span className="block lg:text-lg font-semibold truncate">{editor.name}</span>
                <span className={`block text-xs lg:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>{editor.role}</span>
              </span>
              <span className="hidden sm:inline-flex ml-1 shrink-0 items-center gap-2 whitespace-nowrap bg-[#E8D1AB] text-[#171717] font-semibold text-sm lg:text-base px-4 py-1.5 lg:py-2 rounded-full">
                {formatCurrency(breakdown.total)} <span className="text-[#171717]/60 font-normal text-xs lg:text-sm">Total Compensation</span>
              </span>
              <ChevronDown className={`ml-auto shrink-0 transition-transform ${expanded ? "rotate-180" : ""} ${isDark ? "text-white/70" : "text-black/60"}`} size={20} />
            </button>

            {/* Mobile total pill */}
            <div className="sm:hidden px-4 pb-3 -mt-1">
              <span className="flex justify-center gap-1.5 bg-[#E8D1AB] text-[#171717] font-semibold text-sm px-3 py-2 rounded-full">
                {formatCurrency(breakdown.total)} <span className="text-[#171717]/60 font-normal">Total Compensation</span>
              </span>
            </div>

            {expanded && (
              <div className={`p-4 lg:p-6 space-y-5 lg:space-y-6 ${isDark ? "bg-[#1F1F1F]" : "bg-white"}`}>
                {/* Flat / Hourly */}
                <div className={`${tabWrap} grid-cols-2`}>
                  {(["flat", "hourly"] as const).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => update("rateType", rt)}
                      className={`h-10 lg:h-11 text-sm lg:text-base font-medium rounded-md transition-all ${form.rateType === rt
                        ? "bg-[#E8D1AB33] text-[#E8D1AB] border border-[#E8D1AB]/70"
                        : (isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black")}`}
                    >
                      {rt === "flat" ? "Flat Rates" : "Hourly Rates"}
                    </button>
                  ))}
                </div>

                {/* Base */}
                {form.rateType === "flat" ? (
                  <div className={fieldBox}>
                    <span className={fieldLabel}>Base Payout*</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={isReadOnlyBase ? `$${breakdown.base}` : form.base ? `$${form.base}` : ""}
                      onChange={(e) => !isReadOnlyBase && update("base", e.target.value)}
                      readOnly={isReadOnlyBase}
                      placeholder="$0"
                      className={`${fieldInput} ${isReadOnlyBase ? "cursor-not-allowed" : ""}`}
                    />
                  </div>
                ) : (
                  <div className={`rounded-xl border p-3 lg:p-4 space-y-3 ${isDark ? "border-[#5A5A5F] bg-[#1F1F1F]" : "border-[#D7D7D7] bg-white"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm lg:text-base">Per Hour Rate</p>
                        <p className={`text-lg font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
                          {breakdown.hourlyRate ? formatCurrency(breakdown.hourlyRate) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setHours(parseAmount(form.hours) - 1)} aria-label="Decrease hours"
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border ${isDark ? "border-[#3D3D3D] bg-[#171717] hover:bg-white/5" : "border-[#D7D7D7] bg-[#F4F5F7] hover:bg-white"}`}>
                          <Minus size={14} />
                        </button>
                        <span className={`min-w-[96px] rounded-lg border px-3 py-2 text-center text-sm ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#D7D7D7] bg-[#F4F5F7]"}`}>
                          {parseAmount(form.hours)} Hours
                        </span>
                        <button type="button" onClick={() => setHours(parseAmount(form.hours) + 1)} disabled={parseAmount(form.hours) >= 24} aria-label="Increase hours"
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border disabled:opacity-30 ${isDark ? "border-[#3D3D3D] bg-[#171717] hover:bg-white/5" : "border-[#D7D7D7] bg-[#F4F5F7] hover:bg-white"}`}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    {method === "manual" && (
                      <div className={fieldBox}>
                        <span className={fieldLabel}>Hourly Rate*</span>
                        <input type="text" inputMode="decimal" value={form.hourlyRate ? `$${form.hourlyRate}` : ""} placeholder="$0"
                          onChange={(e) => update("hourlyRate", e.target.value)} className={fieldInput} />
                      </div>
                    )}
                    <div className={`flex items-center justify-between rounded-md px-4 py-3 ${isDark ? "bg-[#171717]" : "bg-[#F4F5F7]"}`}>
                      <span className="text-sm">Total Hours ({parseAmount(form.hours)})</span>
                      <span className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>{formatCurrency(breakdown.base)}</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>
                      {method === "manual"
                        ? "Hourly base stays separate. Editing, travel, and bonus are added on top."
                        : "Other payouts reduce the remaining base, and the hourly rate updates from that remaining amount."}
                    </p>
                  </div>
                )}

                {/* Other payouts */}
                <p className="text-sm lg:text-base font-medium">Other Payouts</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-3">
                  <div className={fieldBox}>
                    <span className={fieldLabel}>Editing Payout</span>
                    <input type="text" inputMode="decimal" value={`$${form.editing}`} onChange={(e) => update("editing", e.target.value)} className={fieldInput} />
                  </div>
                  <div className={fieldBox}>
                    <span className={fieldLabel}>Travel Adjustment</span>
                    <input type="text" inputMode="decimal" value={`$${form.travel}`} onChange={(e) => update("travel", e.target.value)} className={fieldInput} />
                  </div>
                </div>
                <div className={fieldBox}>
                  <span className={fieldLabel}>Bonus/other Adjustment</span>
                  <input type="text" inputMode="decimal" value={form.bonus && form.bonus !== "0" ? `$${form.bonus}` : ""} placeholder="$0"
                    onChange={(e) => update("bonus", e.target.value)} className={fieldInput} />
                </div>
                {method !== "manual" && (parseAmount(form.editing) + parseAmount(form.travel) + parseAmount(form.bonus)) > parseAmount(form.target) && (
                  <p className="-mt-2 text-xs text-[#F59E0B]">Other payouts are capped at the {method === "role" ? "role" : "equal-split"} amount of {formatCurrency(parseAmount(form.target))}.</p>
                )}

                <div className={fieldBox}>
                  <span className={fieldLabel}>Notes</span>
                  <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
                    className={`min-h-[56px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm lg:text-base outline-none ${isDark ? "text-white" : "text-black"}`} />
                </div>

                {/* Advance */}
                {hasAdvance ? (
                  <div className="space-y-3">
                    <button type="button" onClick={() => setIsAdvanceOpen(true)}
                      className={`inline-flex items-center gap-2 text-sm lg:text-base font-medium underline underline-offset-4 ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
                      <Pencil size={15} /> Edit Advance Payment
                    </button>
                    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-xs lg:text-sm ${isDark ? "bg-[#2B2B2B] text-white/80" : "bg-[#F4F5F7] text-black/70"}`}>
                      <span>
                        Advance: {formatCurrency(advanceAmount)}
                        {form.advancePaymentDate ? ` on ${toUsDate(form.advancePaymentDate)}` : ""}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}>
                          Remaining: {formatCurrency(Math.max(breakdown.total - advanceAmount, 0))}
                        </span>
                        <button type="button" onClick={removeAdvance} className="font-medium text-[#EF4444]/90 hover:text-[#EF4444]">Remove</button>
                      </span>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsAdvanceOpen(true)} disabled={breakdown.total <= 0}
                    className={`inline-flex items-center gap-2 text-sm lg:text-base font-medium underline underline-offset-4 disabled:opacity-40 ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>
                    <Plus size={16} /> Add Advance Payment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 inset-x-0 p-4 lg:p-6 z-40 mt-auto grid grid-cols-3 gap-3 lg:gap-4 ${isDark ? "bg-black" : "bg-white"}`}>
          <button
            type="button"
            onClick={onBack ?? onClose}
            className={`h-12 rounded-lg border font-semibold text-sm transition-colors ${isDark ? "bg-[#1F1F1F] border-[#262626] hover:bg-[#2A2A2A] text-white" : "bg-[#F0F0F0] border-[#E3E3E3] hover:bg-[#E3E3E3] text-black"}`}
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void onSubmit(buildPayload())}
            className="h-12 rounded-lg bg-[#52B788] hover:bg-[#5FC394] text-black font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit To Finance"}
          </button>
          <button
            type="button"
            disabled={!onAddShootAgreement || !isSubmitted}
            onClick={() => onAddShootAgreement?.(buildPayload())}
            className="h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-black font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add Shoot Agreement
          </button>
        </div>
      </div>

      <EditorAdvancePaymentModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        editorName={editor.name}
        totalCompensation={breakdown.total}
        initialAdvanceAmount={form.advanceAmount || null}
        initialPaymentDate={form.advancePaymentDate || null}
        initialNotes={form.advanceNotes || null}
        showProofUpload={enableAdvanceProofUpload}
        requireProofUpload={enableAdvanceProofUpload}
        onSubmit={handleAdvanceSubmit}
      />
    </div>
  );
}
