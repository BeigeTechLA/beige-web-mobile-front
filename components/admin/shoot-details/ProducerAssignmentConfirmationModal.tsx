"use client";

import React, { useState, useEffect, useId } from 'react';
import { UsersRound, Bell } from 'lucide-react';
import { useTheme } from "next-themes";
import ModalShell from "./ModalShell";
import type { Producer } from './ProducerSelectionModal';

export interface ShootSummary {
  id: string;
  clientName: string;   // "Lana Guzman"
  serviceType: string;  // "Videography"
  code: string;         // "#SHOOT-2026-087"
}

export const DUMMY_SHOOT: ShootSummary = {
  id: 'shoot_087',
  clientName: 'Lana Guzman',
  serviceType: 'Videography',
  code: '#SHOOT-2026-087',
};

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/* Component */

export interface ProducerAssignmentConfirmationModalProps {
  open: boolean;
  producer: Producer | null;
  shoot?: ShootSummary;
  /** Cancel / Esc / backdrop */
  onClose: () => void;
  /**
   * "Assign Producer" – do the API call here. If it throws, the error is shown in the
   * modal and it stays open; when it resolves the parent moves on to the success modal.
   */
  onConfirm: (producer: Producer, shoot: ShootSummary) => void | Promise<void>;
  /** Override the note in the grey box */
  notice?: string;
}

export default function ProducerAssignmentConfirmationModal({
  open,
  producer,
  shoot = DUMMY_SHOOT,
  onClose,
  onConfirm,
  notice,
}: ProducerAssignmentConfirmationModalProps) {
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
  if (!producer) return null;

  const first = firstName(producer.name);
  const noticeText = notice
    ?? `${first} will be notified and this shoot will appear in their Producer dashboard. Assignment is immediate—no acceptance required.`;

  const handleConfirm = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(producer, shoot);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const muted = isDark ? 'text-[#A9A9A9]' : 'text-zinc-500';
  const strong = isDark ? 'text-white' : 'text-[#202020]';
  const gold = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';

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
        <h2 id={titleId} className="text-base lg:text-xl font-medium">Assign Producer?</h2>
      </div>

      {/* Sentence */}
      <p id={descId} className={`mt-3.5 text-sm lg:text-base ${muted}`}>
        You’re assigning <span className={`${gold} font-medium`}>{producer.name}</span> as the Producer for{' '}
        <span className={`${strong} font-medium`}>{shoot.clientName} ({shoot.serviceType}) · {shoot.code}</span>.
      </p>

      {/* Notice */}
      <div className={`mt-4 lg:mt-6 flex gap-3 rounded-xl p-3.5 ${isDark ? 'bg-[#1D1D1D] border border-[#252523]' : 'bg-[#F4F5F7]'}`}>
        <Bell size={20} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]'}`} />
        <p className={`text-sm leading-relaxed ${muted}`}>{noticeText}</p>
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
          {submitting ? 'Assigning…' : 'Assign Producer'}
        </button>
      </div>
    </ModalShell>
  );
}
