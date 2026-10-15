"use client";

import React, { useState, useEffect, useId } from "react";
import { Bell } from "lucide-react";
import { useTheme } from "next-themes";
import ModalShell from "./ModalShell";
import type { Editor } from "./AssignEditorModal";
import { DUMMY_EDITOR_SHOOT, joinNames, type EditorShootSummary } from "./EditorAssignmentConfirmationModal";
import Image from "next/image";

export interface EditorAssignmentSuccessModalProps {
  open: boolean;
  editors: Editor[];
  shoot?: EditorShootSummary;
  onClose: () => void;
  onViewShoot?: () => void;
  nextEditor?: Editor | null;
  onContinue?: () => void;
}

export default function EditorAssignmentSuccessModal({
  open,
  editors,
  shoot = DUMMY_EDITOR_SHOOT,
  onClose,
  onViewShoot,
  nextEditor = null,
  onContinue,
}: EditorAssignmentSuccessModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  if (!editors.length) return null;

  const plural = editors.length > 1;
  const types = new Set(editors.map((e) => e.type));
  // "Internal Editor Assigned" / "External Editors Assigned" / "Editors Assigned" (mixed)
  const typeLabel = types.size === 1 ? (types.has("internal") ? "Internal " : "External ") : "";
  const title = `${typeLabel}Editor${plural ? "s" : ""} Assigned`;
  const names = joinNames(editors.map((e) => e.name));
  const muted = isDark ? "text-[#A3A3A3]" : "text-zinc-500";

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
        <h2 id={titleId} className="text-lg lg:text-2xl font-medium">{title}</h2>
        <p id={descId} className={`mt-3 text-base leading-relaxed ${muted}`}>
          {nextEditor ? (
            <>
              {names} {plural ? "have" : "has"} been assigned as {typeLabel ? `the ${typeLabel}` : "the "}Editor{plural ? "s" : ""}.
              {" "}The next Editor, {nextEditor.name}, is ready for compensation and agreement setup.
            </>
          ) : (
            <>
              {names} {plural ? "are" : "is"} now assigned and can access the Editor workspace. The shoot is now
              available in their Editor dashboard.
            </>
          )}
        </p>
      </div>

      {/* Email notification card */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 text-left ${isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB]/10' : 'bg-[#FFF8EC] border-[#F0E3CB]'}`}>
        <span className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center ${isDark ? 'bg-[#E8D1AB]/10 text-[#E8D1AB]' : 'bg-white text-[#9C7B45]'}`}>
          <Bell size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]'}`}>
            Email notification{plural ? "s" : ""} sent
          </p>
          <p className="mt-1 text-sm font-semibold">You’ve been assigned as Editor</p>
          <p className={`mt-1 text-xs whitespace-wrap ${isDark ? "text-[#737370]" : "text-zinc-500"}`}>
            {shoot.clientName} ({shoot.serviceType}) · {shoot.code}
          </p>
        </div>
      </div>

      {nextEditor ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`h-11 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
          >
            Done
          </button>
          <button
            type="button"
            onClick={onContinue}
            autoFocus
            className="h-11 rounded-lg bg-[#E8D3AE] hover:bg-[#EEDCBC] text-[#171717] text-sm font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleView}
          autoFocus
          className="w-full h-12 rounded-lg bg-[#E8D1AB] hover:bg-[#EEDCBC] text-[#171717] text-sm font-semibold transition-colors"
        >
          View Shoot
        </button>
      )}
    </ModalShell>
  );
}
