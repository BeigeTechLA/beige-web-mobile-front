"use client";

import React, { useEffect, useId, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import ModalShell from "@/components/admin/shoot-details/ModalShell"; // adjust path
import { fmTheme } from "./theme";
import type { ShootFolderSummary } from "./types";

/** Submit edited files for approval, with optional notes. */
export default function SubmitForApprovalModal({
  open,
  isDark,
  shoot,
  required,
  uploaded,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isDark: boolean;
  shoot: ShootFolderSummary;
  required: number;
  uploaded: number;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<unknown>;
}) {
  const t = fmTheme(isDark);
  const titleId = useId();
  const notesId = useId();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes("");
      setSubmitting(false);
    }
  }, [open]);

  const stats = [
    { label: "Required", value: required },
    { label: "Uploaded Files", value: uploaded },
    { label: "Remaining Files", value: Math.max(0, required - uploaded), highlight: true },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(notes.trim());
    } catch {
      toast.error("Couldn't submit for approval. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} isDark={isDark} labelledBy={titleId} dismissible={!submitting} maxWidth="max-w-[560px]">
      <form onSubmit={submit}>
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 sm:py-5 ${t.divider}`}>
          <h2 id={titleId} className="text-lg sm:text-2xl font-semibold">Submit for Approval</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${isDark ? "bg-[#2B2928] hover:bg-[#363331]" : "bg-[#F0F0F0] hover:bg-[#E5E5E5]"}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {/* Project */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-[#CFE3FF] text-base sm:text-lg font-semibold text-[#111]">
              {shoot.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base sm:text-lg font-medium">{shoot.title}</p>
              <p className={`text-[11px] sm:text-xs font-semibold uppercase ${t.gold}`}>{shoot.shootCode} · {shoot.service}</p>
            </div>
          </div>

          {/* Stats */}
          <dl className={`grid grid-cols-3 overflow-hidden rounded-xl border ${t.divider}`}>
            {stats.map((s, i) => (
              <div key={s.label} className={`px-3 py-2.5 sm:px-4 ${i > 0 ? `border-l ${t.divider}` : ""}`}>
                <dt className={`text-[9px] sm:text-[10px] uppercase tracking-wider ${t.faint}`}>{s.label}</dt>
                <dd className={`mt-0.5 text-sm ${s.highlight ? t.gold : ""}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Notes (label sits on the border) */}
          <div className="relative pt-2">
            <label htmlFor={notesId} className={`absolute left-3 top-0 px-1 text-xs ${isDark ? "bg-black text-white/70" : "bg-white text-black/60"}`}>
              Submission Notes <span className={t.gold}>(Optional)</span>
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full retouching pass complete and ready for the internal review"
              rows={4}
              maxLength={1000}
              className={`w-full resize-none rounded-xl border bg-transparent px-4 pb-3 pt-4 text-sm focus:outline-none transition-colors ${isDark
                ? "border-[#3A3A3A] text-white placeholder:text-white/35 focus:border-[#E8D1AB]"
                : "border-[#DADADA] text-[#202020] placeholder:text-black/35 focus:border-[#C9A66B]"}`}
            />
          </div>

          {/* Notification note */}
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isDark ? "bg-[#1C1A16]" : "bg-[#FFF8EC]"}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-[#2A2620] text-[#E8D1AB]" : "bg-white text-[#9C7B45]"}`}>
              <Bell size={13} />
            </span>
            <p className={`text-[10px] sm:text-[11px] uppercase leading-4 tracking-wide ${t.gold}`}>
              {shoot.reviewerName} and the post production team will be notified. Your editor status will update automatically
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`h-11 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${t.ghostBtn}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploaded === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E8D3AE] text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
