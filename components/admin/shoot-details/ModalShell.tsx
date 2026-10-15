"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared shell for the producer-flow modals (confirmation + success):
 * portal to <body>, blurred backdrop, Esc / backdrop to close, page scroll lock.
 */
interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  labelledBy: string;
  describedBy?: string;
  /** Tailwind max-width class for the panel */
  maxWidth?: string;
  /** Block Esc / backdrop closing (e.g. while a request is running) */
  dismissible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function ModalShell({
  open,
  onClose,
  isDark,
  labelledBy,
  describedBy,
  maxWidth = 'max-w-[400px]',
  dismissible = true,
  className = '',
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, dismissible]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-md ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
        onClick={() => dismissible && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.55)] ${isDark ? 'bg-black border-[#2E2E2E] text-white' : 'bg-white border-[#E5E5E5] text-[#202020]'} ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
