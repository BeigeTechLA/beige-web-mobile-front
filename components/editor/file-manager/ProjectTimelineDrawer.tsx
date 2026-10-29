"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ProjectTimeline from "./ProjectTimeline";
import type { EditingStep } from "./types";

/** Right-side drawer wrapping <ProjectTimeline/> ("View Project Timeline"). */
export default function ProjectTimelineDrawer({
  isDark,
  open,
  current,
  onClose,
}: {
  isDark: boolean;
  open: boolean;
  current: EditingStep;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className={`absolute inset-0 backdrop-blur-md ${isDark ? "bg-black/60" : "bg-black/30"}`} onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Project timeline" className="relative h-full w-full max-w-[320px] overflow-y-auto rounded-l-2xl">
        <ProjectTimeline isDark={isDark} current={current} isFullHeight={true} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          autoFocus
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? "bg-[#2B2928] text-white hover:bg-[#363331]" : "bg-[#F0F0F0] text-[#202020] hover:bg-[#E5E5E5]"}`}
        >
          <X size={15} />
        </button>
      </div>
    </div>,
    document.body
  );
}
