"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Pencil,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import AdvancePaymentModal from "@/components/admin/finances/AdvancePaymentModal";
import EditorAvatar from "./EditorAvatar";
import {
  type CompensationMethod,
  type DemoEditor,
  type EditorCompensation,
  type RateMethod,
  formatUSD,
  getCompensationTotal,
} from "./postProductionDemoStore";

interface EditorCompensationPanelProps {
  editor: DemoEditor;
  value: EditorCompensation;
  onChange: (next: EditorCompensation) => void;
  onBack: () => void;
  onClose: () => void;
  onFinance: () => void;
  onAgreement: () => void;
  isDark: boolean;
}

type MoneyFieldKey =
  | "base"
  | "hourlyRate"
  | "hours"
  | "editing"
  | "travel"
  | "bonus";
type MoneyDrafts = Record<MoneyFieldKey, string>;

const roundMoney = (amount: number) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;
const parseMoney = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};
const normalizeMoneyInput = (value: string) => {
  const clean = value.replace(/[^\d.]/g, "");
  const [whole, ...parts] = clean.split(".");
  if (!parts.length) return whole;
  return `${whole || "0"}.${parts.join("").slice(0, 2)}`;
};
const moneyDrafts = (value: EditorCompensation): MoneyDrafts => ({
  base: String(value.base),
  hourlyRate: String(value.hourlyRate),
  hours: String(value.hours),
  editing: String(value.editing),
  travel: String(value.travel),
  bonus: String(value.bonus),
});
const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const formatAdvanceDate = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

export default function EditorCompensationPanel({
  editor,
  value,
  onChange,
  onBack,
  onClose,
  onFinance,
  onAgreement,
  isDark,
}: EditorCompensationPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [drafts, setDrafts] = useState<MoneyDrafts>(() => moneyDrafts(value));
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const initialTarget = useRef(roundMoney(getCompensationTotal(value)));
  const equalTarget = useRef(initialTarget.current);

  onCloseRef.current = onClose;
  const totalCompensation = roundMoney(getCompensationTotal(value));
  const budget = Math.max(0, value.totalShootBudget);
  const percentage = budget > 0 ? (totalCompensation / budget) * 100 : 0;
  const margin = roundMoney(budget - totalCompensation);
  const marginPercentage = budget > 0 ? (margin / budget) * 100 : 0;
  const profitability =
    percentage <= 25
      ? { label: "Healthy", color: "#10B981" }
      : percentage <= 50
        ? { label: "Review margin", color: "#F59E0B" }
        : { label: "High payout risk", color: "#EF4444" };
  const invalidAdvance = Boolean(
    value.advance &&
    (value.advance.amount > totalCompensation || value.advance.amount <= 0),
  );
  const canProceed = totalCompensation > 0 && !invalidAdvance;
  const remainingAdvance = Math.max(
    0,
    totalCompensation - (value.advance?.amount || 0),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (advanceOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mounted, advanceOpen]);

  const update = (patch: Partial<EditorCompensation>) =>
    onChange({ ...value, ...patch });
  const updateDrafts = (changes: Partial<MoneyDrafts>) =>
    setDrafts((previous) => ({ ...previous, ...changes }));

  const applyAutoSplit = (
    changed: Partial<
      Pick<EditorCompensation, "editing" | "travel" | "bonus" | "hours">
    >,
    nextMethod: CompensationMethod = value.method,
    preserveDraft?: MoneyFieldKey,
  ) => {
    const target = equalTarget.current;
    let remaining = target;
    const editing = roundMoney(
      Math.min(remaining, changed.editing ?? value.editing),
    );
    remaining = roundMoney(Math.max(0, remaining - editing));
    const travel = roundMoney(
      Math.min(remaining, changed.travel ?? value.travel),
    );
    remaining = roundMoney(Math.max(0, remaining - travel));
    const bonus = roundMoney(Math.min(remaining, changed.bonus ?? value.bonus));
    remaining = roundMoney(Math.max(0, remaining - bonus));
    const base = remaining;
    const hours = Math.max(1, changed.hours ?? value.hours);
    const hourlyRate = roundMoney(base / hours);
    update({
      method: nextMethod,
      editing,
      travel,
      bonus,
      base,
      hours,
      hourlyRate,
    });
    const nextDrafts: Partial<MoneyDrafts> = {
      editing: String(editing),
      travel: String(travel),
      bonus: String(bonus),
      base: String(base),
      hours: String(hours),
      hourlyRate: String(hourlyRate),
    };
    if (
      preserveDraft &&
      (preserveDraft === "editing" ||
        preserveDraft === "travel" ||
        preserveDraft === "bonus")
    ) {
      const applied = { editing, travel, bonus }[preserveDraft];
      if (applied === changed[preserveDraft]) delete nextDrafts[preserveDraft];
    }
    updateDrafts(nextDrafts);
  };

  const selectMethod = (method: CompensationMethod) => {
    if (method === value.method) return;
    if (method === "manual") {
      update({ method });
      return;
    }
    if (method === "equal") equalTarget.current = initialTarget.current;
    else
      equalTarget.current = roundMoney(
        4500 + value.editing + value.travel + value.bonus,
      );
    applyAutoSplit({}, method);
  };

  const changeNumber = (key: MoneyFieldKey, raw: string) => {
    const nextDraft = normalizeMoneyInput(raw);
    updateDrafts({ [key]: nextDraft });
    const parsed = parseMoney(nextDraft);
    if (key === "hours") {
      const hours = Math.max(1, Math.min(parsed, 1000));
      if (value.method === "manual") update({ hours });
      else applyAutoSplit({ hours });
      return;
    }
    if (
      value.method !== "manual" &&
      (key === "editing" || key === "travel" || key === "bonus")
    ) {
      applyAutoSplit({ [key]: parsed }, value.method, key);
      return;
    }
    if (
      key === "base" ||
      key === "hourlyRate" ||
      key === "editing" ||
      key === "travel" ||
      key === "bonus"
    ) {
      update({ [key]: parsed });
    }
  };

  const stepHours = (direction: -1 | 1) => {
    const hours = Math.max(1, Math.min(1000, value.hours + direction));
    updateDrafts({ hours: String(hours) });
    if (value.method === "manual") update({ hours });
    else applyAutoSplit({ hours });
  };

  const setRateMethod = (rateMethod: RateMethod) => {
    if (rateMethod === value.rateMethod) return;
    if (value.method === "manual") {
      if (rateMethod === "flat") {
        const nextBase = roundMoney(value.hourlyRate * value.hours);
        update({ rateMethod, base: nextBase });
        updateDrafts({ base: String(nextBase) });
      } else {
        const hourlyRate = roundMoney(value.base / Math.max(1, value.hours));
        update({ rateMethod, hourlyRate });
        updateDrafts({ hourlyRate: String(hourlyRate) });
      }
    } else {
      const hourlyRate = roundMoney(value.base / Math.max(1, value.hours));
      update({ rateMethod, hourlyRate });
      updateDrafts({ hourlyRate: String(hourlyRate) });
    }
  };

  const handleSaveAdvance = ({
    reason,
    advanceAmount,
    paymentDate,
  }: {
    reason: string;
    advanceAmount: string;
    paymentDate: Date | null;
    proofFile?: File | null;
  }) => {
    const amount = roundMoney(
      Number(String(advanceAmount).replace(/[$,]/g, "")),
    );
    if (!Number.isFinite(amount) || amount <= 0 || amount > totalCompensation) {
      toast.error(
        "Enter an advance greater than $0 and no more than the total compensation.",
      );
      return;
    }
    if (!paymentDate || Number.isNaN(paymentDate.getTime())) {
      toast.error("Select a payment date before saving the advance.");
      return;
    }
    update({
      advance: {
        amount,
        paymentDate: localDateString(paymentDate),
        notes: reason,
      },
    });
    setAdvanceOpen(false);
  };

  const panelBackground = isDark
    ? "bg-black text-white border-white/40"
    : "bg-white text-black border-[#D7D7D7]";
  const smallText = isDark ? "text-white/60" : "text-black/60";
  const floatingField = isDark
    ? "border-[#5A5A5F] bg-[#0C0C0C]/40"
    : "border-[#E5E5E5] bg-[#D7D7D7]/40";
  const tabBackground = isDark
    ? "border-[#3D3D3D] bg-[#171717]"
    : "border-[#D7D7D7] bg-[#F4F5F7]";
  const inactiveTab = isDark
    ? "text-white/60 hover:text-white"
    : "text-black/70 hover:text-black";

  const moneyField = (label: string, key: MoneyFieldKey, readonly = false) => (
    <label
      className={`relative mt-2 block min-w-0 rounded-xl border px-4 py-2 ${floatingField}`}
    >
      <span
        className={`absolute -top-2.5 left-3 z-10 px-2 text-sm lg:text-base ${isDark ? "bg-[#121212] text-white/60" : "bg-[#EBEBEB] text-black/60"}`}
      >
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={drafts[key]}
        readOnly={readonly}
        aria-readonly={readonly}
        onChange={(event) => changeNumber(key, event.target.value)}
        onBlur={() => {
          updateDrafts({ [key]: String(roundMoney(value[key])) });
        }}
        className={`h-11 w-full min-w-0 border-0 bg-transparent px-0 pt-1 text-sm outline-none lg:h-16 lg:text-base ${readonly ? "cursor-default opacity-75" : ""} ${isDark ? "text-white" : "text-black"}`}
      />
    </label>
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[130] flex items-center justify-end p-3 font-sans backdrop-blur-sm animate-in fade-in duration-200 lg:p-0 ${isDark ? "bg-[#101010CC]" : "bg-black/40"}`}
    >
      <section
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-compensation-title"
        className={`relative flex h-full max-h-[calc(100dvh_-_24px)] w-full flex-col overflow-hidden rounded-lg border shadow-2xl animate-in slide-in-from-right duration-200 lg:max-h-[100dvh] lg:max-w-3xl lg:rounded-r-none lg:rounded-l-2xl ${panelBackground}`}
      >
        <header
          className={`z-20 flex shrink-0 items-center justify-between border-b p-5 lg:px-9 lg:py-8 ${isDark ? "border-[#CACACA] bg-black" : "border-[#E3E3E3] bg-white"}`}
        >
          <div className="min-w-0 pr-4">
            <h2
              id="editor-compensation-title"
              className="text-lg font-bold tracking-tight lg:text-3xl"
            >
              Add Compensation
            </h2>
            <p className={`mt-1 text-xs lg:text-sm ${smallText}`}>
              Configure compensation for selected Editor
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close compensation drawer"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${isDark ? "bg-[#2B2626] text-white hover:bg-[#383131]" : "bg-[#F1F1F1] text-black hover:bg-[#E7E7E7]"}`}
          >
            <X size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:space-y-6 lg:p-9">
          <div className="flex flex-col gap-3 lg:gap-5">
            <label className="text-sm font-medium lg:text-base">
              Select Compensation Method
            </label>
            <div
              className={`grid h-14 grid-cols-3 rounded-lg border p-1.5 ${tabBackground}`}
            >
              {(["equal", "role", "manual"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => selectMethod(method)}
                  aria-pressed={value.method === method}
                  className={`min-w-0 rounded-sm px-1 text-xs transition-all lg:text-base ${value.method === method ? "bg-[#E8D1AB] font-semibold text-black shadow-md" : inactiveTab}`}
                >
                  {method === "equal"
                    ? "Equal Split"
                    : method === "role"
                      ? "Role Based"
                      : "Manual"}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-3 rounded-lg border border-[#E8D1AB33] p-4 sm:grid-cols-2 xl:grid-cols-4 ${isDark ? "bg-[#3D3D3D]" : "bg-[#F4F5F7]"}`}
          >
            <div className="min-w-0">
              <p className="text-xs lg:text-[13px]">Total Shoot Amount</p>
              <p className="truncate text-lg font-bold lg:text-xl">
                {formatUSD(budget)}
              </p>
              <p className={`text-xs ${smallText}`}>Overall Budget</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-[13px]">Total Compensation</p>
              <p
                className="truncate text-lg font-bold lg:text-xl"
                style={{ color: profitability.color }}
              >
                {formatUSD(totalCompensation)}
              </p>
              <p className={`text-xs ${smallText}`}>
                {percentage.toFixed(1)}% of budget
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-[13px]">Estimated Margin</p>
              <p
                className="truncate text-lg font-bold lg:text-xl"
                style={{ color: margin >= 0 ? "#10B981" : "#EF4444" }}
              >
                {formatUSD(margin)}
              </p>
              <p className={`text-xs ${smallText}`}>
                {marginPercentage.toFixed(1)}% margin
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs lg:text-[13px]">Profitability Estimation</p>
              <div className="mt-2 flex items-center gap-1">
                <div
                  className={`h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-black/40" : "bg-[#3D3D3D]/20"}`}
                >
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, percentage))}%`,
                      backgroundColor: profitability.color,
                    }}
                  />
                </div>
                <TrendingUp size={19} style={{ color: profitability.color }} />
              </div>
              <p className={`mt-1.5 text-xs ${smallText}`}>
                {profitability.label}
              </p>
            </div>
          </div>

          <section
            className={`overflow-hidden rounded-xl border ${isDark ? "border-[#3D3D3D] bg-[#1F1F1F]" : "border-[#D7D7D7] bg-[#F4F5F7]"}`}
          >
            <button
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((open) => !open)}
              className={`flex w-full flex-wrap items-center gap-3 p-3 text-left lg:gap-5 lg:p-6 ${detailsOpen ? "border-b border-[#E8D1AB]/40" : ""}`}
            >
              <EditorAvatar
                name={editor.name}
                avatarUrl={editor.avatarUrl}
                className="h-12 w-12 lg:h-15 lg:w-15"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold lg:text-lg">
                  {editor.name}
                </h3>
                <p className={`text-xs lg:text-sm ${smallText}`}>
                  External Editor
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8D1AB] px-3 py-2 text-xs font-semibold text-[#171717] lg:text-sm">
                  {formatUSD(totalCompensation)}
                  <span className="hidden font-normal text-black/60 sm:inline">
                    Total Compensation
                  </span>
                </span>
                {detailsOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </div>
            </button>

            {detailsOpen && (
              <div
                className={`space-y-4 p-3 lg:space-y-6 lg:p-5 ${isDark ? "bg-[#0C0C0C]/40" : "bg-[#D7D7D7]/40"}`}
              >
                <div
                  className={`grid h-14 grid-cols-2 rounded-lg border p-1.5 ${tabBackground}`}
                >
                  {(["flat", "hourly"] as const).map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setRateMethod(rate)}
                      aria-pressed={value.rateMethod === rate}
                      className={`rounded-sm text-sm transition-all lg:text-base ${value.rateMethod === rate ? "border border-[#E8D1AB] bg-[#E8D1AB33] font-semibold text-[#E8D1AB]" : inactiveTab}`}
                    >
                      {rate === "flat" ? "Flat Rates" : "Hourly Rates"}
                    </button>
                  ))}
                </div>

                {value.rateMethod === "flat" ? (
                  moneyField("Base Payout*", "base", value.method !== "manual")
                ) : (
                  <div
                    className={`grid grid-cols-1 gap-4 rounded-xl border p-3 lg:grid-cols-2 ${isDark ? "border-[#5A5A5F] bg-[#0C0C0C]/40" : "border-[#D7D7D7] bg-[#F4F5F7]"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm lg:text-lg">Per Hour Rate</p>
                      <p className="mt-1 text-lg font-semibold text-[#E8D1AB]">
                        {formatUSD(value.hourlyRate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => stepHours(-1)}
                        disabled={value.hours <= 1}
                        aria-label="Decrease hours"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-30 ${tabBackground}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span
                        className={`min-w-[86px] rounded-lg border px-3 py-2 text-center text-sm ${tabBackground}`}
                      >
                        {value.hours} Hours
                      </span>
                      <button
                        type="button"
                        onClick={() => stepHours(1)}
                        disabled={value.hours >= 1000}
                        aria-label="Increase hours"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-30 ${tabBackground}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="lg:col-span-2">
                      {moneyField(
                        "Hourly Rate*",
                        "hourlyRate",
                        value.method !== "manual",
                      )}
                    </div>
                    <div
                      className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm lg:col-span-2 ${isDark ? "bg-[#1B1B1B]" : "bg-[#3B3B3B] text-white"}`}
                    >
                      <span>Total Hours ({value.hours})</span>
                      <span className="font-semibold text-[#E8D1AB]">
                        {formatUSD(value.hourlyRate * value.hours)}
                      </span>
                    </div>
                    {value.method === "manual" && (
                      <p className={`text-xs lg:col-span-2 ${smallText}`}>
                        Hourly base is set manually. Editing, travel, and bonus
                        are added separately.
                      </p>
                    )}
                  </div>
                )}

                <h4 className="text-sm font-semibold uppercase tracking-wider lg:text-base">
                  Other Payouts
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {moneyField("Editing Payout", "editing")}
                  {moneyField("Travel Adjustment", "travel")}
                </div>
                {moneyField("Bonus/other Adjustment", "bonus")}
                <label
                  className={`relative mt-2 block rounded-xl border px-4 py-2 ${floatingField}`}
                >
                  <span
                    className={`absolute -top-2.5 left-3 px-2 text-sm lg:text-base ${isDark ? "bg-[#121212] text-white/60" : "bg-[#EBEBEB] text-black/60"}`}
                  >
                    Notes
                  </span>
                  <textarea
                    value={value.notes}
                    onChange={(event) => update({ notes: event.target.value })}
                    placeholder="Add specific details or audit descriptions..."
                    className={`min-h-[80px] w-full resize-y border-0 bg-transparent pt-3 text-sm outline-none lg:min-h-[100px] lg:text-base ${isDark ? "text-white" : "text-black"}`}
                  />
                </label>

                <div className="space-y-2">
                  {value.advance ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAdvanceOpen(true)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#E8D1AB] underline underline-offset-4 lg:text-sm"
                      >
                        <Pencil size={16} /> Edit Advance Payment
                      </button>
                      <div
                        className={`flex flex-col gap-2 rounded-lg px-3 py-2 text-xs lg:flex-row lg:items-center lg:justify-between ${isDark ? "bg-[#2B2B2B] text-white/70" : "bg-white text-black/70"}`}
                      >
                        <span>
                          Advance: {formatUSD(value.advance.amount)} on{" "}
                          {formatAdvanceDate(value.advance.paymentDate)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>Remaining: {formatUSD(remainingAdvance)}</span>
                          <button
                            type="button"
                            onClick={() => update({ advance: null })}
                            className="font-semibold text-[#EF4444]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdvanceOpen(true)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#E8D1AB] underline underline-offset-4 lg:text-sm"
                    >
                      <Plus size={16} /> Add Advance Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer
          className={`z-20 shrink-0 border-t p-4 lg:p-6 ${isDark ? "border-[#262626] bg-black" : "border-[#E3E3E3] bg-white"}`}
        >
          {invalidAdvance && (
            <p role="alert" className="mb-3 text-xs text-red-400">
              The advance exceeds the current compensation. Edit or remove it
              before continuing.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <button
              type="button"
              onClick={onBack}
              className={`h-12 rounded-lg border text-sm font-semibold transition-colors ${isDark ? "border-[#262626] bg-[#1F1F1F] text-white hover:bg-[#3D3D3D]" : "border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E3E3E3]"}`}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canProceed}
              onClick={onFinance}
              className="h-12 rounded-lg bg-[#10B981] text-sm font-semibold text-black transition-colors hover:bg-[#10B981]/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Submit To Finance
            </button>
            <button
              type="button"
              disabled={!canProceed}
              onClick={onAgreement}
              className="h-12 rounded-lg bg-[#E8D1AB] text-sm font-semibold text-black transition-colors hover:bg-[#E8D1AB]/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Add Shoot Agreement
            </button>
          </div>
        </footer>
      </section>

      <AdvancePaymentModal
        isOpen={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        creatorName={editor.name}
        totalCompensation={totalCompensation}
        maxAmount={totalCompensation}
        initialAdvanceAmount={value.advance?.amount ?? null}
        initialPaymentDate={value.advance?.paymentDate || null}
        initialNotes={value.advance?.notes || null}
        showProofUpload={false}
        requireProofUpload={false}
        onSubmit={handleSaveAdvance}
      />
    </div>,
    document.body,
  );
}
