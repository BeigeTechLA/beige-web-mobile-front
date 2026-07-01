"use client";

import { Button } from "@/components/ui/button";

type ClientActionSuccessModalProps = {
  open: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
};

export default function ClientActionSuccessModal({
  open,
  title,
  description,
  buttonLabel = "Done",
  onClose,
}: ClientActionSuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] px-6 pb-8 pt-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="pointer-events-none absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-[#E8D1AB]/10 blur-[50px] motion-safe:animate-pulse" />

        <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center motion-safe:animate-[pulse_2.2s_ease-in-out_infinite]">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible drop-shadow-[0_0_24px_rgba(232,209,171,0.22)]"
          >
            <path d="M 45 35 L 48 40 L 45 45 L 42 40 Z" fill="#E8D1AB" />
            <path d="M 98 32 L 101 37 L 98 42 L 95 37 Z" fill="#A78BFA" />
            <path d="M 28 55 L 30 58 L 33 55 L 30 52 Z" fill="#60A5FA" />
            <path d="M 112 55 L 114 58 L 117 55 L 114 52 Z" fill="#34D399" />
            <circle cx="30" cy="85" r="3.5" fill="#F472B6" />
            <circle cx="110" cy="85" r="4.5" fill="#FB923C" />
            <circle cx="70" cy="22" r="3.5" fill="#38BDF8" />
            <path
              d="M 35 40 Q 32 30 40 25"
              stroke="#FBBF24"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 105 40 Q 108 30 100 25"
              stroke="#34D399"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="70" cy="70" r="36" fill="#E8D1AB" />
            <path
              d="M 57 70 L 66 79 L 83 60"
              stroke="#000000"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <h3 className="relative text-xl font-semibold text-white">{title}</h3>

        <p className="relative mt-2 text-sm text-white/60">{description}</p>

        <Button
          className="relative mt-6 w-full rounded-xl bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90"
          onClick={onClose}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
