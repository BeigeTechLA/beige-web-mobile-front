"use client";

import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check } from "lucide-react";
import { useTheme } from "next-themes";

/* Types + dummy data */

export type EditorType = "internal" | "external";
export type EditorAvailability = "available" | "available_today" | "limited";

export interface Editor {
  id: number;
  name: string;
  type: EditorType;
  specialty: string;
  activeShoots: number;
  availability: EditorAvailability;
  avatarUrl?: string;
  avatarBg?: string;
}

export const DUMMY_EDITORS: Editor[] = [
  { id: 101, name: "Priya Shah", type: "internal", specialty: "Video Editing", activeShoots: 4, availability: "available", avatarBg: "#EAFCDB" },
  { id: 102, name: "Liam Torres", type: "internal", specialty: "Color + Finishing", activeShoots: 2, availability: "available", avatarBg: "#F6EEDD" },
  { id: 103, name: "Zara Khan", type: "external", specialty: "Video + Motion Graphics", activeShoots: 6, availability: "available", avatarBg: "#E3E7EA" },
  { id: 104, name: "Omar Ali", type: "external", specialty: "Photography Retouching", activeShoots: 3, availability: "available", avatarBg: "#DCD3FF" },
  { id: 105, name: "Mia Chen", type: "internal", specialty: "Sound Design", activeShoots: 5, availability: "limited", avatarBg: "#FCE7F3" },
];

export const EDITOR_AVAILABILITY: Record<EditorAvailability, { label: string; dot: string }> = {
  available: { label: "Available", dot: "#5EE9B5" },
  available_today: { label: "Available today", dot: "#5EE9B5" },
  limited: { label: "Limited capacity", dot: "#C9A96E" },
};

export const editorInitials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/** "Internal" / "External" pill (also used by the confirmation modal + team card) */
export function EditorTypeBadge({
  type,
  isDark,
  long = false,
  className = "",
}: {
  type: EditorType;
  isDark: boolean;
  long?: boolean; // "Internal Editor" instead of "Internal"
  className?: string;
}) {
  const label = `${type === "internal" ? "Internal" : "External"}${long ? " Editor" : ""}`;
  const cls = type === "internal"
    ? (isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB]/25 text-[#E8D1AB]" : "bg-[#FFF8EC] border-[#EADBC0] text-[#8C6A00]")
    : (isDark ? "bg-[#B4ABE8]/10 border-[#B4ABE8]/25 text-[#C3B9FD]" : "bg-[#F1EEFF] border-[#D9D2FF] text-[#5B4BC4]");
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${cls} ${className}`}>
      {label}
    </span>
  );
}

export function EditorAvatar({ editor, size = "w-14 h-14", text = "text-base" }: { editor: Pick<Editor, "name" | "avatarUrl" | "avatarBg">; size?: string; text?: string }) {
  return (
    <span
      className={`${size} ${text} rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[#171717] font-medium`}
      style={{ backgroundColor: editor.avatarBg ?? "#F6EEDD" }}
    >
      {editor.avatarUrl
        ? <img src={editor.avatarUrl} alt="" className="w-full h-full object-cover" />
        : editorInitials(editor.name)}
    </span>
  );
}

/* Component */
type TabValue = "all" | EditorType;
const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "internal", label: "Internal Editors" },
  { value: "external", label: "External Editors" },
];

export interface AssignEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** Hand-off to the confirmation modal with the chosen editor(s) */
  onContinue: (editors: Editor[]) => void | Promise<void>;
  /** Pass real data later; falls back to dummy data */
  editors?: Editor[];
  /** Editors already on the shoot – shown as "Assigned" and not selectable */
  assignedIds?: number[];
  /** Pre-ticked editors (e.g. when coming back from the confirmation step) */
  initialSelectedIds?: number[];
  /** "multiple" for Add, "single" for Change */
  selectionMode?: "single" | "multiple";
  isLoading?: boolean;
  title?: string;
}

export default function AssignEditorModal({
  open,
  onClose,
  onContinue,
  editors,
  assignedIds = [],
  initialSelectedIds = [],
  selectionMode = "multiple",
  isLoading: isLoadingProp,
  title = "Assign Editor",
}: AssignEditorModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabValue>("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);
  const [simLoading, setSimLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Reset whenever the modal opens
  const initialKey = initialSelectedIds.join(",");
  useEffect(() => {
    if (!open) return;
    setTab("all");
    setQuery("");
    setSelectedIds(initialKey ? initialKey.split(",").map(Number) : []);
    setSubmitting(false);
    setSimLoading(true);
    const t = setTimeout(() => setSimLoading(false), 400);
    return () => clearTimeout(t);
  }, [open, initialKey]);

  // Esc to close + scroll lock + focus search
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const f = setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(f);
    };
  }, [open, onClose]);

  const isDark = !mounted || theme === "dark";
  const list = editors ?? DUMMY_EDITORS;
  const isLoading = isLoadingProp ?? (editors ? false : simLoading);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((e) => tab === "all" || e.type === tab)
      .filter((e) => !q || e.name.toLowerCase().includes(q));
  }, [list, tab, query]);

  const selected = list.filter((e) => selectedIds.includes(e.id));

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return selectionMode === "single" ? [id] : [...prev, id];
    });
  };

  const handleContinue = async () => {
    if (!selected.length || submitting) return;
    try {
      setSubmitting(true);
      await onContinue(selected);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const panel = isDark ? "bg-black border-white/40 text-white" : "bg-white border-[#E5E5E5] text-[#202020]";
  const divider = isDark ? "border-[#CACACA]" : "border-[#E5E5E5]";
  const muted = isDark ? "text-[#969695]" : "text-zinc-500";
  const gold = isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]";
  const skeleton = isDark ? "bg-white/10" : "bg-zinc-200";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className={`absolute inset-0 backdrop-blur-md ${isDark ? "bg-black/60" : "bg-black/30"}`} onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-[826px] max-h-[80vh] flex flex-col rounded-2xl border ${panel}`}
      >
        {/* Header */}
        <div className={`shrink-0 flex items-center justify-between gap-4 p-5 lg:p-8 border-b ${divider}`}>
          <h2 id={titleId} className="text-xl lg:text-3xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-11 h-11 lg:w-15 lg:h-15 shrink-0 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#2B2626] hover:bg-[#363333] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-5 p-5 lg:p-8 lg:pt-11">
          {/* Tabs */}
          <div role="tablist" aria-label="Editor type" className={`shrink-0 grid grid-cols-3 gap-1.5 rounded-xl border p-1 ${isDark ? "bg-[#0B0B0A] border-[#292927]" : "bg-[#F7F7F8] border-[#E3E3E3]"}`}>
            {TABS.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.value)}
                  className={`h-9 lg:h-10 rounded-lg text-sm lg:text-base font-semibold whitespace-nowrap transition-colors ${active
                    ? "bg-[#E8D1AB] text-black"
                    : (isDark ? "text-[#949494] hover:text-white" : "text-zinc-500 hover:text-[#202020]")}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <label className={`shrink-0 flex items-center gap-2.5 h-12 rounded-xl border px-3.5 ${isDark ? "bg-[#202020] border-white/20" : "bg-[#F7F7F8] border-[#E3E3E3]"}`}>
            <Search size={16} className={isDark ? "text-white/50" : "text-zinc-400"} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search Editor Name..."
              className={`w-full bg-transparent outline-none text-sm ${isDark ? "text-white placeholder:text-white/40" : "text-[#202020] placeholder:text-zinc-400"}`}
            />
          </label>

          {/* List */}
          <div role="group" aria-label="Editors" className="flex-1 min-h-0 overflow-y-auto space-y-2.5 -mx-1 px-1 py-1 no-scrollbar">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-4 ${isDark ? "bg-[#121212] border-[#1F1F1F]" : "bg-[#F7F7F8] border-[#EDEDED]"}`}>
                  <div className={`w-14 h-14 rounded-full animate-pulse ${skeleton}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-32 rounded animate-pulse ${skeleton}`} />
                    <div className={`h-3 w-44 rounded animate-pulse ${skeleton}`} />
                  </div>
                  <div className={`h-6 w-6 rounded-md animate-pulse ${skeleton}`} />
                </div>
              ))
              : filtered.map((e) => {
                const isAssigned = assignedIds.includes(e.id);
                const isSelected = selectedIds.includes(e.id);
                const av = EDITOR_AVAILABILITY[e.availability];
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    disabled={isAssigned}
                    onClick={() => toggle(e.id)}
                    className={`w-full text-left flex items-center gap-3 lg:gap-4 rounded-xl border px-3 lg:px-4 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D1AB]/60 disabled:cursor-not-allowed disabled:opacity-50 ${isSelected
                      ? (e.type === "external"
                        ? (isDark ? "bg-[#B4ABE8]/10 border-[#B4ABE8]" : "bg-[#F4F2FF] border-[#B9AEF5]")
                        : (isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB]" : "bg-[#FFF8EC] border-[#CFAF78]"))
                      : (isDark ? "bg-[#0E0E0D] border-[#252523] hover:border-[#3A3A3A]" : "bg-[#F7F7F8] border-[#EDEDED] hover:border-[#D8D8D8]")}`}
                  >
                    <EditorAvatar editor={e} size="w-12 h-12 lg:w-15 lg:h-15" />

                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                        <span className="text-base lg:text-lg font-semibold truncate">{e.name}</span>
                        <EditorTypeBadge type={e.type} isDark={isDark} />
                        {isSelected && (
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${isDark ? "bg-[#08943C]/10 border-[#08943C] text-[#1DB455]" : "bg-[#E8F8EE] border-[#9AD9B1] text-[#167A3E]"}`}>
                            Selected
                          </span>
                        )}
                        {isAssigned && (
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${isDark ? "border-white/15 text-white/60" : "border-black/15 text-black/50"}`}>
                            Assigned
                          </span>
                        )}
                      </span>
                      <span className="block text-sm lg:text-base mt-1 truncate">
                        <span className={muted}>{e.specialty} · </span>
                        <span className={gold}>{e.activeShoots} active shoot{e.activeShoots === 1 ? "" : "s"}</span>
                      </span>
                      <span className={`lg:hidden mt-1 flex items-center gap-1.5 text-xs ${isDark ? "text-[#BDBDBD]" : "text-zinc-600"}`}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: av.dot }} />
                        {av.label}
                      </span>
                    </span>

                    <span className={`hidden lg:flex shrink-0 items-center gap-2 text-sm lg:text-base ${isDark ? "text-[#A8A8A6]" : "text-zinc-600"}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: av.dot }} />
                      {av.label}
                    </span>

                    {/* Checkbox (square, like the design) */}
                    <span
                      aria-hidden="true"
                      className={`w-6 h-6 shrink-0 rounded-[5px] flex items-center justify-center transition-colors ${isSelected
                        ? "bg-[#E8D1AB] text-[#171717]"
                        : (isDark ? "border-[1.5px] border-[#5A5A5A]" : "border-[1.5px] border-[#BDBDBD]")}`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}

            {!isLoading && filtered.length === 0 && (
              <p className={`text-sm text-center py-10 ${muted}`}>No editors match your search.</p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 mt-2 grid grid-cols-2 gap-3 lg:gap-5">
            <button
              type="button"
              onClick={onClose}
              className={`h-12 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#262626] text-white" : "bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]"}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected.length || submitting}
              className={`h-12 rounded-lg text-sm font-semibold text-[#171717] transition-colors disabled:cursor-not-allowed ${selected.length
                ? "bg-[#E8D1AB] hover:bg-[#EEDCBC]"
                : (isDark ? "bg-[#6B6252]" : "bg-[#E8D1AB]/50")}`}
            >
              {submitting ? "Please wait…" : selected.length > 1 ? `Continue (${selected.length})` : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
