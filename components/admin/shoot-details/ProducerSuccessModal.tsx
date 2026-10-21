"use client";

import React, { useState, useEffect, useId } from 'react';
import { Check, Bell } from 'lucide-react';
import { useTheme } from "next-themes";
import ModalShell from "./ModalShell";
import type { Producer } from './ProducerSelectionModal';
import { DUMMY_SHOOT, firstName, type ShootSummary } from './ProducerAssignmentConfirmationModal';
import Image from "next/image";

/* Component */

export interface ProducerSuccessModalProps {
  open: boolean;
  producer: Producer | null;
  shoot?: ShootSummary;
  /** "View Shoot", Esc and backdrop all close the modal */
  onClose: () => void;
  /** Optional extra action on "View Shoot" (e.g. scroll to / route to the shoot) – runs before close */
  onViewShoot?: () => void;
  /** Override the email preview line */
  emailSubject?: string;
}

export default function ProducerSuccessModal({
  open,
  producer,
  shoot = DUMMY_SHOOT,
  onClose,
  onViewShoot,
  emailSubject = 'You’ve been assigned as Producer',
}: ProducerSuccessModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  if (!producer) return null;

  const first = firstName(producer.name);
  const muted = isDark ? 'text-[#A3A3A3]' : 'text-zinc-500';

  const handleView = () => {
    onViewShoot?.();
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      maxWidth="max-w-[452px]"
      className="px-5 lg:px-7 pt-9 pb-6 lg:pb-7 text-center space-y-4 lg:space-y-6"
    >
      {/* Confetti gif */}
      <div className="relative w-[360px] h-[190px] mx-auto">
        <Image
          src="/images/misc/PaymentSuccess.gif"
          alt="Payment Done"
          fill
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      <div>
        <h2 id={titleId} className="text-lg lg:text-2xl font-medium">Producer Assigned Successfully</h2>
        <p id={descId} className={`mt-3 text-base leading-relaxed ${muted}`}>
          {producer.name} is now assigned as Producer for this shoot. {first} has been notified and the shoot is
          now available in their Producer dashboard.
        </p>
      </div>

      {/* Email notification card */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 text-left ${isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB]/10' : 'bg-[#FFF8EC] border-[#F0E3CB]'}`}>
        <span className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center ${isDark ? 'bg-[#E8D1AB]/10 text-[#E8D1AB]' : 'bg-white text-[#9C7B45]'}`}>
          <Bell size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]'}`}>
            Email notification sent
          </p>
          <p className="mt-1 text-sm font-semibold">{emailSubject}</p>
          <p className={`mt-1 text-xs whitespace-wrap ${isDark ? 'text-[#737370]' : 'text-zinc-500'}`}>
            {shoot.clientName} ({shoot.serviceType}) · {shoot.code}
          </p>
        </div>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={handleView}
        autoFocus
        className="w-full h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-[#171717] text-sm font-semibold transition-colors"
      >
        View Shoot
      </button>
    </ModalShell>
  );
}
