"use client";

import React, { useState, useEffect, useId } from "react";
import { UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import ModalShell from "./ModalShell";
import { EditorAvatar, EditorTypeBadge, type Editor } from "./AssignEditorModal";

/* Shoot summary (shared with the success modal) */

export interface EditorShootSummary {
  id: string;
  clientName: string;  // "Lana Guzman"
  serviceType: string; // "Videography"
  code: string;        // "#SHOOT-2026-087"
}

export const DUMMY_EDITOR_SHOOT: EditorShootSummary = {
  id: "shoot_087",
  clientName: "Lana Guzman",
  serviceType: "Videography",
  code: "#SHOOT-2026-087",
};

/** "Priya Shah" / "Priya Shah and Liam Torres" / "Priya Shah, Liam Torres and Zara Khan" */
export const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/* Component */

export interface EditorAssignmentConfirmationModalProps {
  open: boolean;
  editors: Editor[];
  shoot?: EditorShootSummary;
  /** Cancel / Esc / backdrop */
  onClose: () => void;
  /** "Assign Editor" – do the API call here; throw to show an error and keep the modal open */
  onConfirm: (editors: Editor[], shoot: EditorShootSummary) => void | Promise<void>;
  /** Button label, e.g. "Assign & Continue" (more editors queued) or "Add Compensation" (external) */
  confirmLabel?: string;
}

export default function EditorAssignmentConfirmationModal({
  open,
  editors,
  shoot = DUMMY_EDITOR_SHOOT,
  onClose,
  onConfirm,
  confirmLabel,
}: EditorAssignmentConfirmationModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) { setSubmitting(false); setError(null); }
  }, [open]);

  const isDark = !mounted || theme === "dark";
  if (!editors.length) return null;

  const plural = editors.length > 1;

  const handleConfirm = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(editors, shoot);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const muted = isDark ? 'text-[#A9A9A9]' : 'text-zinc-500';
  const strong = isDark ? "text-white" : "text-[#202020]";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      maxWidth="max-w-[450px]"
      dismissible={!submitting}
      className="p-4 lg:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center ${isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB]/20 text-[#E8D1AB]' : 'bg-[#FFF8EC] border-[#EADBC0] text-[#9C7B45]'}`}>
          <UsersRound size={18} strokeWidth={1.75} />
        </span>
        <h2 id={titleId} className="text-base lg:text-xl font-medium">Assign Editor{plural ? "s" : ""}?</h2>
      </div>

      {/* Sentence */}
      <p id={descId} className={`mt-3.5 text-sm lg:text-base ${muted}`}>
        You’re assigning {joinNames(editors.map((e) => e.name))} as Editor{plural ? "s" : ""} for{" "}
        <span className={`${strong} font-medium`}>{shoot.clientName} ({shoot.serviceType}) · {shoot.code}</span>.
      </p>

      {/* Selected editor(s) */}
      <div className={`mt-4 lg:mt-6 rounded-xl border divide-y max-h-[240px] overflow-y-auto ${isDark ? "bg-[#0B0B0A] border-[#292927] divide-[#292927]" : "bg-[#F7F7F8] border-[#EDEDED] divide-[#EDEDED]"}`}>
        {editors.map((e) => (
          <div key={e.id} className="flex items-center gap-3 p-3">
            <EditorAvatar editor={e} size="w-9 h-9" text="text-xs" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? "text-[#E8E8E7]" : "text-zinc-900"}`}>{e.name}</p>
              <p className={`text-xs truncate ${isDark ? "text-[#777772]" : "text-zinc-500"}`}>{e.specialty}</p>
            </div>
            <EditorTypeBadge type={e.type} isDark={isDark} long className="py-1" />
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className={`mt-4 text-sm ${isDark ? 'text-[#F07B6E]' : 'text-[#C8392B]'}`}>{error}</p>
      )}

      {/* Actions */}
      <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className={`h-12 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? 'bg-[#1F1F1F] hover:bg-[#262626] border border-[#262626] text-white' : 'bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]'}`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-[#0A0A0A] text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {submitting ? "Assigning…" : (confirmLabel ?? `Assign Editor${plural ? "s" : ""}`)}
        </button>
      </div>
    </ModalShell>
  );
}
