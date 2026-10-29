"use client";

import React, { useState, useEffect, useId } from "react";
import { CircleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import ModalShell from "./ModalShell";
import type { Editor } from "./AssignEditorModal";

export interface EditorRemovalConfirmationModalProps {
  open: boolean;
  editor: Pick<Editor, "id" | "name"> | null;
  /** Cancel / Esc / backdrop */
  onClose: () => void;
  /**
   * "Remove" – do the API call here. If it throws, the error is shown in the modal and it
   * stays open; when it resolves the parent removes the editor and closes the modal.
   */
  onConfirm: (editor: Pick<Editor, "id" | "name">) => void | Promise<void>;
  /** Override the explanation paragraph */
  notice?: string;
}

export default function EditorRemovalConfirmationModal({
  open,
  editor,
  onClose,
  onConfirm,
  notice = "The shoot will be removed from their assigned list but remain available under All Shoots. No assignment notification will be sent.",
}: EditorRemovalConfirmationModalProps) {
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
  if (!editor) return null;

  const handleConfirm = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(editor);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const muted = isDark ? "text-[#A0A0A0]" : "text-zinc-500";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      maxWidth="max-w-[432px]"
      dismissible={!submitting}
      className="p-5 lg:p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-[#281918] text-[#F58083]" : "bg-[#FDECEA] text-[#C8392B]"}`}>
          <CircleAlert size={20} strokeWidth={1.75} />
        </span>
        <h2 id={titleId} className="text-lg lg:text-xl font-medium">Remove Editor?</h2>
      </div>

      {/* Copy */}
      <div id={descId}>
        <p className={`mt-4 text-sm lg:text-base ${muted}`}>
          Remove <span className={`font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]"}`}>{editor.name}</span> as Editor from this shoot?
        </p>
        <p className={`mt-2 text-sm lg:text-base ${muted}`}>{notice}</p>
      </div>

      {error && (
        <p role="alert" className={`mt-4 text-xs lg:text-sm ${isDark ? "text-[#F07B6E]" : "text-[#C8392B]"}`}>{error}</p>
      )}

      {/* Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          autoFocus
          className={`h-12 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? "bg-[#1F1F1F] hover:bg-[#262626] border border-[#262626] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-[#171717] text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-wait"
        >
          {submitting ? "Removing…" : "Remove"}
        </button>
      </div>
    </ModalShell>
  );
}
