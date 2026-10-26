"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Grid3X3, LayoutGrid, Link, List, MoreVertical, Search } from "lucide-react";
import { fmTheme } from "./theme";
import type { Person, ViewMode } from "./types";

/* Small building blocks shared by every editor file-manager screen. */

/* ---------- Search ---------- */
export function SearchInput({
  isDark,
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: {
  isDark: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const t = fmTheme(isDark);
  return (
    <div className={`relative w-full ${className}`}>
      <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.faint}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`h-10 w-full rounded-lg border pl-9 pr-3 text-xs lg:text-sm focus:outline-none focus:border-[#E8D1AB] transition-colors ${t.control}`}
      />
    </div>
  );
}

/* ---------- Grid / List / Compact toggle ---------- */
const VIEW_BUTTONS: [ViewMode, typeof Grid3X3, string][] = [
  ["grid", Grid3X3, "Card view"],
  ["list", List, "List view"],
  ["compact", LayoutGrid, "Compact view"],
];

export function ViewToggle({ isDark, value, onChange }: { isDark: boolean; value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className={`flex shrink-0 items-center overflow-hidden rounded-lg border ${isDark ? "bg-[#202020] border-white/20" : "bg-white border-[#E5E5E5]"}`}>
      {VIEW_BUTTONS.map(([mode, Icon, label]) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={label}
          title={label}
          aria-pressed={value === mode}
          className={`p-2.5 lg:px-5 rounded-lg transition-colors ${value === mode
            ? "bg-[#E8D1AB] text-black"
            : isDark ? "text-white hover:text-white/80" : "text-[#666] hover:text-black"}`}
        >
          <Icon size={20} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/* ---------- Segmented tabs ---------- */
export function SegmentedTabs<T extends string>({
  isDark,
  value,
  onChange,
  items,
}: {
  isDark: boolean;
  value: T;
  onChange: (v: T) => void;
  items: { key: T; label: string }[];
}) {
  return (
    <div role="tablist" className={`inline-flex max-w-full overflow-x-auto no-scrollbar rounded-xl border p-1.5 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F4F5F7] border-[#E5E5E5]"}`}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`h-9 lg:h-10 shrink-0 whitespace-nowrap rounded-lg px-4 lg:px-5 text-sm lg:text-base transition-colors ${active ? "bg-[#E8D1AB] text-black" : isDark ? "text-[#C4C4C4] hover:text-white" : "text-black/60 hover:text-black"}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Pills / badges ---------- */
export function LinkedPill({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[#D4FFE4] text-[#16A34A] font-medium ${small ? "px-3.5 py-2.5 text-xs" : "px-4 py-2.5 text-sm"}`}>
      <Link size={small ? 16 : 18} /> Linked
    </span>
  );
}

export function TagPill({ isDark, label }: { isDark: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3.5 py-2.5 text-xs font-medium ${isDark ? "bg-[#171717] text-white" : "bg-white border border-[#E5E5E5] text-[#222]"}`}>{label}</span>
  );
}

/** Green-outline "Latest" / "V1 Latest" badge */
export function LatestBadge({ version }: { version?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#1F7A43] bg-[#0F2A1A] px-1.5 py-0.5 text-[10px] text-[#3DD27A]">
      {version && <span className="text-white/80">{version}</span>}
      Latest
    </span>
  );
}

/** Small purple/pink status pill ("File Selected For Edits", "Ready for Approval") */
export function StatusTag({ label, tone = "purple" }: { label: string; tone?: "purple" | "pink" | "blue" }) {
  const cls = {
    purple: "border-[#5B3A8C] bg-[#24183A] text-[#C9A2FF]",
    pink: "border-[#8C3A7A] bg-[#3A1833] text-[#F29BDD]",
    blue: "border-[#3A4F8C] bg-[#18213A] text-[#9FB6FF]",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${cls}`}>{label}</span>;
}

/** Orange call-out with a small pointer ("Edits Needed") */
export function Callout({ label }: { label: string }) {
  return (
    <span className="relative ml-1 inline-flex items-center rounded-[4px] bg-[#9A4A1B] px-2 py-0.5 text-[10px] font-medium text-[#FFE2CC] before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2 before:border-y-4 before:border-r-4 before:border-y-transparent before:border-r-[#9A4A1B] before:content-['']">
      {label}
    </span>
  );
}

export function InitialsAvatar({ person, size = "md" }: { person: Person; size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#C8E1FF] font-medium text-black ${size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-base"}`}
      title={person.name}
    >
      {person.initials}
    </span>
  );
}

/* ---------- Checkbox (button-based, so focusing it never scrolls the page) ---------- */
export function Checkbox({
  isDark,
  checked,
  onChange,
  label,
  className = "",
}: {
  isDark: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
  /** Accessible name */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D1AB] ${checked
        ? "border-[#E8D1AB] bg-[#E8D1AB]"
        : isDark ? "border-white/50 bg-transparent" : "border-[#A3A3A3] bg-white"} ${className}`}
    >
      {checked && <Check size={11} strokeWidth={3} className="text-black" />}
    </button>
  );
}

/* ---------- ⋮ menu ---------- */
export interface MenuAction {
  label: string;
  icon?: React.ElementType;
  onSelect: () => void;
  danger?: boolean;
}

export function KebabMenu({ isDark, actions, label = "Actions" }: { isDark: boolean; actions: MenuAction[]; label?: string }) {
  const t = fmTheme(isDark);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          // open upwards when close to the bottom of the viewport
          setUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 180);
          setOpen((v) => !v);
        }}
        className={`-mr-1 rounded-md p-1 transition-colors ${isDark ? "text-white hover:bg-white/10" : "text-black/60 hover:bg-black/5 hover:text-black"}`}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 z-30 min-w-[160px] rounded-xl border p-1 shadow-xl ${up ? "bottom-8" : "top-8"} ${t.menu}`}>
          {actions.map((a) => (
            <button
              key={a.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                a.onSelect();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${t.menuItem} ${a.danger ? "text-red-400" : ""}`}
            >
              {a.icon && <a.icon size={15} />}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
