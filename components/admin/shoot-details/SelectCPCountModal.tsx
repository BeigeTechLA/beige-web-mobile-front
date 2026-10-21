"use client";

import React, { useEffect, useId, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import ModalShell from "./ModalShell";

/* ------------------------------------------------------------------ */
/* Types + defaults                                                    */
/* ------------------------------------------------------------------ */

export type CPRoleId = "photographer" | "videographer" | "hybrid";

export interface CPRoleOption {
  id: CPRoleId;
  label: string;
  /** Greys out the row (e.g. role not offered for this shoot) */
  disabled?: boolean;
}

/** role id -> number of CPs */
export type CPCounts = Record<CPRoleId, number>;

export const DEFAULT_CP_ROLES: CPRoleOption[] = [
  { id: "photographer", label: "Photographer" },
  { id: "videographer", label: "Videographer" },
  { id: "hybrid", label: "Hybrid Shooter (Photo + Video)" },
];

const EMPTY_COUNTS: CPCounts = { photographer: 0, videographer: 0, hybrid: 0 };

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface SelectCPCountModalProps {
  open: boolean;
  isDark: boolean;
  onClose: () => void;
  /** "Back" button – defaults to onClose */
  onBack?: () => void;
  /** "Continue" – receives only the roles with a count > 0 */
  onContinue: (counts: Partial<CPCounts>) => void;
  roles?: CPRoleOption[];
  /** Counts to start from each time the modal opens */
  initialCounts?: Partial<CPCounts>;
  /** Upper limit per role */
  maxPerRole?: number;
}

export default function SelectCPCountModal({
  open,
  isDark,
  onClose,
  onBack,
  onContinue,
  roles = DEFAULT_CP_ROLES,
  initialCounts,
  maxPerRole = 10,
}: SelectCPCountModalProps) {
  const titleId = useId();
  const [counts, setCounts] = useState<CPCounts>(EMPTY_COUNTS);

  // Fresh selection every time the modal opens
  useEffect(() => {
    if (open) setCounts({ ...EMPTY_COUNTS, ...initialCounts });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setCount = (id: CPRoleId, value: number) =>
    setCounts((prev) => ({ ...prev, [id]: Math.max(0, Math.min(maxPerRole, value)) }));

  // Ticking a role starts it at 1; unticking clears it
  const toggleRole = (id: CPRoleId) => setCount(id, counts[id] > 0 ? 0 : 1);

  const total = roles.reduce((sum, r) => sum + (r.disabled ? 0 : counts[r.id]), 0);

  const handleContinue = () => {
    if (!total) return;
    const selected = roles.reduce<Partial<CPCounts>>((acc, r) => {
      if (!r.disabled && counts[r.id] > 0) acc[r.id] = counts[r.id];
      return acc;
    }, {});
    onContinue(selected);
  };

  /* ---------- styles ---------- */
  const divider = isDark ? "border-[#CACACA]" : "border-[#E5E5E5]";
  const labelText = isDark ? "text-white" : "text-[#202020]";
  const checkboxIdle = isDark ? "border-white/70 bg-transparent" : "border-[#A3A3A3] bg-white";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      maxWidth="max-w-[621px]"
      className="!rounded-2xl"
    >
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 p-5 lg:p-7 border-b ${divider}`}>
        <h2 id={titleId} className="text-xl lg:text-3xl font-bold leading-tight">
          Select No of CPs
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`shrink-0 w-11 h-11 lg:w-15 lg:h-15 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#2B2928] hover:bg-[#363331] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
        >
          <X className="w-5 h-5 lg:w-7 lg:h-7" strokeWidth={2} />
        </button>
      </div>

      {/* Roles */}
      <div className="p-5 lg:p-7">
        <ul className="space-y-3 lg:space-y-5">
          {roles.map((role) => {
            const value = counts[role.id];
            const checked = value > 0;
            const disabled = !!role.disabled;
            const checkboxId = `${titleId}-${role.id}`;
            return (
              <li key={role.id} className={`flex items-center justify-between gap-3 ${disabled ? "opacity-60" : ""}`}>
                {/* Checkbox + label */}
                <label htmlFor={checkboxId} className={`flex items-center gap-3 min-w-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span
                    aria-hidden="true"
                    className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#E8D1AB] ${checked ? "bg-[#E8D1AB] border-[#E8D1AB]" : checkboxIdle}`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black" strokeWidth={3} />}
                  </span>
                  <span className={`text-base lg:text-lg leading-snug ${labelText}`}>{role.label}</span>
                </label>

                {/* Stepper */}
                <div
                  className="shrink-0 flex items-center gap-3.5 h-10 py-2.5 px-4 rounded-full bg-[#E8D1AB] text-black"
                  role="group"
                  aria-label={`${role.label} count`}
                >
                  <button
                    type="button"
                    onClick={() => setCount(role.id, value - 1)}
                    disabled={disabled || value <= 0}
                    aria-label={`Fewer ${role.label}s`}
                    className="p-1 rounded-full transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2} />
                  </button>
                  <span className="text-base lg:text-xl font-medium" aria-live="polite">{value}</span>
                  <button
                    type="button"
                    onClick={() => setCount(role.id, value + 1)}
                    disabled={disabled || value >= maxPerRole}
                    aria-label={`More ${role.label}s`}
                    className="p-1 rounded-full transition-opacity disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className="mt-7 grid grid-cols-2 gap-3 lg:gap-4">
          <button
            type="button"
            onClick={onBack ?? onClose}
            className={`h-12 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#262626]" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!total}
            title={!total ? "Select at least one CP" : undefined}
            className="h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
