"use client";

import React, { useId } from "react";
import { Check } from "lucide-react";
import ModalShell from "@/components/admin/shoot-details/ModalShell"; // adjust path

// Confetti around the check (angle in degrees, distance in px from the circle centre)
const CONFETTI: { angle: number; dist: number; color: string; w: number; h: number; rot: number; round?: boolean }[] = [
  { angle: -98, dist: 50, color: "#C97B4A", w: 4, h: 6, rot: 20 },
  { angle: -62, dist: 48, color: "#4F7DD9", w: 3, h: 7, rot: -35, round: true },
  { angle: -22, dist: 46, color: "#E3B04B", w: 6, h: 6, rot: 15 },
  { angle: 18, dist: 48, color: "#D85A5A", w: 3, h: 6, rot: 40, round: true },
  { angle: 48, dist: 50, color: "#4F7DD9", w: 3, h: 7, rot: -20 },
  { angle: 96, dist: 48, color: "#5BA77C", w: 6, h: 4, rot: 30, round: true },
  { angle: 138, dist: 48, color: "#4F7DD9", w: 6, h: 5, rot: 10 },
  { angle: 162, dist: 44, color: "#E3B04B", w: 5, h: 5, rot: 0, round: true },
  { angle: 192, dist: 48, color: "#4F7DD9", w: 6, h: 3, rot: -10 },
  { angle: 214, dist: 50, color: "#5BA77C", w: 6, h: 6, rot: 25 },
];

/** Gold check with a confetti burst. */
export function SuccessBurst() {
  return (
    <div className="relative mx-auto h-[110px] w-[130px]" aria-hidden="true">
      <style>{`
        @keyframes fm-pop { 0% { transform: scale(.4); opacity: 0 } 60% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1) } }
        @keyframes fm-burst { 0% { transform: translate(-50%,-50%) rotate(var(--r)); opacity: 0 }
                              100% { transform: translate(-50%,-50%) translate(var(--x), var(--y)) rotate(var(--r)); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .fm-anim { animation: none !important; opacity: 1 !important } }
      `}</style>
      {CONFETTI.map((c, i) => {
        const rad = (c.angle * Math.PI) / 180;
        const x = Math.cos(rad) * c.dist;
        const y = Math.sin(rad) * c.dist;
        return (
          <span
            key={i}
            className={`fm-anim absolute left-1/2 top-1/2 ${c.round ? "rounded-full" : "rounded-[1px]"}`}
            style={{
              width: c.w, height: c.h, backgroundColor: c.color,
              ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px`, ["--r" as string]: `${c.rot}deg`,
              transform: `translate(-50%,-50%) translate(${x}px, ${y}px) rotate(${c.rot}deg)`,
              animation: `fm-burst 600ms cubic-bezier(.2,.8,.3,1) ${120 + i * 15}ms both`,
            } as React.CSSProperties}
          />
        );
      })}
      <span
        className="fm-anim absolute left-1/2 top-1/2 -ml-8 -mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8D3AE] text-[#171717]"
        style={{ animation: "fm-pop 450ms cubic-bezier(.2,.8,.3,1.2) both" }}
      >
        <Check size={30} strokeWidth={2.5} />
      </span>
    </div>
  );
}

/** Success / result modal: burst, title, message and an optional action. */
export default function SuccessModal({
  open,
  isDark,
  title,
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  open: boolean;
  isDark: boolean;
  title: string;
  message: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descId = useId();
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      isDark={isDark}
      labelledBy={titleId}
      describedBy={descId}
      maxWidth="max-w-[440px]"
      className="px-5 pb-6 pt-7 text-center sm:px-7"
    >
      <SuccessBurst />
      <h2 id={titleId} className="mt-2 text-lg sm:text-xl font-medium">{title}</h2>
      <p id={descId} className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? "text-[#A3A3A3]" : "text-zinc-500"}`}>{message}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          autoFocus
          className="mt-5 h-11 w-full rounded-lg bg-[#E8D3AE] text-sm font-semibold text-[#171717] transition-colors hover:bg-[#EEDCBC]"
        >
          {actionLabel}
        </button>
      )}
    </ModalShell>
  );
}
