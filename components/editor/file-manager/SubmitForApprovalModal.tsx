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
    <ModalShell open={open} onClose={onClose} isDark={isDark} labelledBy={titleId} dismissible={!submitting} maxWidth="max-w-[816px]">
      <form onSubmit={submit}>
        <div className={`flex items-center justify-between gap-3 border-b p-4 lg:p-7 ${t.divider}`}>
          <h2 id={titleId} className="text-lg lg:text-3xl font-semibold">Submit for Approval</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className={`flex h-10 w-10 lg:h-15 lg:w-15 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${isDark ? "bg-[#2B2626] hover:bg-[#363331]" : "bg-[#F0F0F0] hover:bg-[#E5E5E5]"}`}
          >
            <X className="w-5 h-5 lg:h-7 lg:w-7" />
          </button>
        </div>

        <div className="space-y-4 p-4 lg:p-7 lg:pt-9">
          {/* Project */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 lg:h-21 lg:w-21 shrink-0 items-center justify-center rounded-2xl bg-[#C8E1FF] text-lg lg:text-3xl font-semibold text-black">
              {shoot.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg lg:text-2xl font-semibold">{shoot.title}</p>
              <p className={`text-sm lg:text-base font-semibold uppercase ${t.gold}`}>{shoot.shootCode} · {shoot.service}</p>
            </div>
          </div>

          {/* Stats */}
          <dl className={`grid grid-cols-3 overflow-hidden rounded-xl border ${isDark ? "border-white/50" : "border-[#EEEEEE]"}`}>
            {stats.map((s, i) => (
              <div key={s.label} className={`px-3 py-2.5 lg:px-4 ${i > 0 ? `border-l ${isDark ? "border-white/50" : "border-[#EEEEEE]"}` : ""}`}>
                <dt className={`text-xs lg:text-sm uppercase tracking-wider ${t.faint}`}>{s.label}</dt>
                <dd className={`mt-0.5 text-sm lg:text-base ${s.highlight ? t.gold : ""}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Notes (label sits on the border) */}
          <div className="relative pt-3">
            <label htmlFor={notesId} className={`absolute left-3 top-0 px-2 text-sm lg:text-base ${isDark ? "bg-black text-white/70" : "bg-white text-black/60"}`}>
              Submission Notes <span className={t.gold}>(Optional)</span>
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full retouching pass complete and ready for the internal review"
              rows={4}
              maxLength={1000}
              className={`w-full resize-none rounded-xl border bg-transparent px-4 pb-3 pt-4 text-sm focus:outline-none transition-colors lg:h-[158px] ${isDark
                ? "border-white/50 text-white placeholder:text-white/35"
                : "border-[#DADADA] text-[#202020] placeholder:text-black/35"}`}
            />
          </div>

          {/* Notification note */}
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isDark ? "bg-[#E8D1AB]/10" : "bg-[#FFF8EC]"}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-white text-[#9C7B45]"}`}>
              <Bell size={20} />
            </span>
            <p className={`text-[10px] lg:text-xs font-semibold uppercase tracking-wide ${t.gold}`}>
              {shoot.reviewerName} and the post production team will be notified. Your editor status will update automatically
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`h-12 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${t.ghostBtn} border ${isDark ? "border-[#262626]" : "border-[#EEEEEE]"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploaded === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#E8D1AB] text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC] disabled:cursor-not-allowed disabled:opacity-50"
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
