"use client";

import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check } from 'lucide-react';
import { useTheme } from "next-themes";

export type ProducerAvailability = 'available' | 'available_today' | 'limited';

export interface Producer {
  id: string;
  name: string;
  role: string;              // e.g. "Producer"
  activeShoots: number;
  availability: ProducerAvailability;
  avatarUrl?: string;        // optional – falls back to initials on avatarBg
  avatarBg?: string;         // pastel tile behind the photo / initials
}

export const DUMMY_PRODUCERS: Producer[] = [
  { id: 'p_1', name: 'Nafisa Khan', role: 'Producer', activeShoots: 4, availability: 'available', avatarBg: '#EAFCDB' },
  { id: 'p_2', name: 'Sam Rivera', role: 'Producer', activeShoots: 2, availability: 'available_today', avatarBg: '#D9CCFF' },
  { id: 'p_3', name: 'Alif Rahman', role: 'Producer', activeShoots: 6, availability: 'limited', avatarBg: '#F6EEDD' },
  { id: 'p_4', name: 'Priya Desai', role: 'Producer', activeShoots: 3, availability: 'available', avatarBg: '#D6E4FF' },
  { id: 'p_5', name: 'Marcus Lee', role: 'Producer', activeShoots: 5, availability: 'limited', avatarBg: '#F6CFEA' },
];

export const AVAILABILITY: Record<ProducerAvailability, { label: string; dot: string }> = {
  available: { label: 'Available', dot: '#5EE9B5' },
  available_today: { label: 'Available today', dot: '#5EE9B5' },
  limited: { label: 'Limited capacity', dot: '#C9A96E' },
};

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

/* Component */

export interface ProducerSelectionModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called with the chosen producer when "Continue" is clicked.
   * This is the hand-off point to the NEXT modal (to be built): the parent closes this one
   * and opens the next step with the producer. Can be async – the button shows a busy state.
   */
  onContinue: (producer: Producer) => void | Promise<void>;
  /** Pass real data later; falls back to dummy data */
  producers?: Producer[];
  /** Pre-select a producer (e.g. the current one when using "Change Producer") */
  initialSelectedId?: string | null;
  /** Show skeleton rows while the producer list is fetched */
  isLoading?: boolean;
  title?: string;
  continueLabel?: string;
  footnote?: string;
}

export default function ProducerSelectionModal({
  open,
  onClose,
  onContinue,
  producers,
  initialSelectedId = null,
  isLoading: isLoadingProp,
  title = 'Assign Producer',
  continueLabel = 'Continue',
  footnote = 'CPs, sales-only users, inactive users, and clients are automatically excluded.',
}: ProducerSelectionModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [simLoading, setSimLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Reset every time the modal opens
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedId(initialSelectedId);
    setSubmitting(false);
    // Simulated fetch (dummy data only) so the loading state matches the other components
    setSimLoading(true);
    const t = setTimeout(() => setSimLoading(false), 400);
    return () => clearTimeout(t);
  }, [open, initialSelectedId]);

  // Esc to close + lock page scroll + focus search
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const f = setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(f);
    };
  }, [open, onClose]);

  const isDark = !mounted || theme === "dark";
  const list = producers ?? DUMMY_PRODUCERS;
  const isLoading = isLoadingProp ?? (producers ? false : simLoading);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list;
  }, [list, query]);

  const selected = list.find((p) => p.id === selectedId) ?? null;

  const handleContinue = async () => {
    if (!selected || submitting) return;
    try {
      setSubmitting(true);
      await onContinue(selected);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  // Colours
  const panel = isDark ? 'bg-black border-white/40 text-white' : 'bg-white border-[#E5E5E5] text-[#202020]';
  const divider = isDark ? 'border-[#CACACA]' : 'border-[#E5E5E5]';
  const muted = isDark ? 'text-[#969695]' : 'text-zinc-500';
  const gold = isDark ? 'text-[#E8D1AB]' : 'text-[#9C7B45]';
  const skeleton = isDark ? 'bg-white/10' : 'bg-zinc-200';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-md ${isDark ? 'bg-black/60' : 'bg-black/30'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-[780px] max-h-[75vh] flex flex-col rounded-2xl border shadow-2xl ${panel}`}
      >
        {/* Header */}
        <div className={`shrink-0 flex items-center justify-between gap-4 p-4 lg:p-8 border-b ${divider}`}>
          <h2 id={titleId} className="text-xl lg:text-3xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-11 h-11 lg:w-14 lg:h-14 shrink-0 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-[#2B2626] hover:bg-[#363333] text-white' : 'bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]'}`}
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 lg:gap-6 p-4 lg:p-8 lg:pt-9">
          {/* Search */}
          <label className={`shrink-0 flex items-center gap-2.5 h-12 rounded-lg lg:rounded-xl border px-3 ${isDark ? 'bg-[#202020] border-white/20' : 'bg-[#F7F7F8] border-[#E3E3E3]'}`}>
            <Search size={24} className={isDark ? 'text-[#727272]' : 'text-zinc-400'} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search Producer Name..."
              className={`w-full bg-transparent outline-none text-sm lg:text-base ${isDark ? 'text-white placeholder:text-[#727272]' : 'text-[#202020] placeholder:text-zinc-400'}`}
            />
          </label>

          {/* List */}
          <div role="radiogroup" aria-label="Producers" className="flex-1 min-h-0 overflow-y-auto space-y-2.5 -mx-1 px-1 py-1 no-scrollbar">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-4 rounded-xl border px-4 py-4 ${isDark ? 'bg-[#121212] border-[#1F1F1F]' : 'bg-[#F7F7F8] border-[#EDEDED]'}`}>
                  <div className={`w-14 h-14 rounded-full animate-pulse ${skeleton}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-32 rounded animate-pulse ${skeleton}`} />
                    <div className={`h-3 w-44 rounded animate-pulse ${skeleton}`} />
                  </div>
                  <div className={`h-6 w-6 rounded-full animate-pulse ${skeleton}`} />
                </div>
              ))
              : filtered.map((p) => {
                const isSelected = p.id === selectedId;
                const av = AVAILABILITY[p.availability];
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedId(isSelected ? null : p.id)}
                    className={`w-full text-left flex items-center gap-3 lg:gap-4 rounded-2xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D1AB]/60 ${isSelected
                      ? (isDark ? 'bg-[#E8D1AB]/10 border-[#E8D1AB]' : 'bg-[#FFF8EC] border-[#CFAF78]')
                      : (isDark ? 'bg-[#0E0E0D] border-[#252523] hover:border-[#3A3A3A]' : 'bg-[#F7F7F8] border-[#EDEDED] hover:border-[#D8D8D8]')}`}
                  >
                    {/* Avatar */}
                    <span
                      className="w-12 h-12 lg:w-15 lg:h-15 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[#171717] text-base font-medium"
                      style={{ backgroundColor: p.avatarBg ?? '#F6EEDD' }}
                    >
                      {p.avatarUrl
                        ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : initials(p.name)}
                    </span>

                    {/* Name + meta */}
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base lg:text-lg font-semibold truncate">{p.name}</span>
                        {isSelected && (
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-[#08943C]/10 border-[#08943C] text-[#1DB455]' : 'bg-[#E8F8EE] border-[#9AD9B1] text-[#167A3E]'}`}>
                            Selected
                          </span>
                        )}
                      </span>
                      <span className="block text-sm lg:text-base mt-1 truncate">
                        <span className={muted}>{p.role} · </span>
                        <span className={gold}>{p.activeShoots} active shoot{p.activeShoots === 1 ? '' : 's'}</span>
                      </span>
                      {/* Availability under the name on small phones */}
                      <span className={`lg:hidden mt-1 flex items-center gap-1.5 text-xs ${isDark ? 'text-[#A8A8A6]' : 'text-zinc-600'}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: av.dot }} />
                        {av.label}
                      </span>
                    </span>

                    {/* Availability */}
                    <span className={`hidden lg:flex shrink-0 items-center gap-2 text-base ${isDark ? 'text-[#BDBDBD]' : 'text-zinc-600'}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: av.dot }} />
                      {av.label}
                    </span>

                    {/* Radio */}
                    <span
                      className={`ml-1 lg:ml-3 w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-[#E8D1AB] text-[#171717]'
                        : (isDark ? 'border-[1.5px] border-[#5A5A5A]' : 'border-[1.5px] border-[#BDBDBD]')}`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}

            {!isLoading && filtered.length === 0 && (
              <p className={`text-sm text-center py-10 ${muted}`}>No producers match “{query}”.</p>
            )}
          </div>

          {/* Footnote */}
          <p className={`shrink-0 text-sm lg:text-base ${isDark ? 'text-[#595956]' : 'text-zinc-400'}`}>{footnote}</p>

          {/* Actions */}
          <div className="shrink-0 grid grid-cols-2 gap-3 lg:gap-5">
            <button
              type="button"
              onClick={onClose}
              className={`h-12 rounded-md text-sm font-semibold transition-colors ${isDark ? 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white' : 'bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#202020]'}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || submitting}
              className={`h-12 rounded-lg text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed ${selected
                ? 'bg-[#E8D1AB] hover:bg-[#EEDCBC]'
                : (isDark ? 'bg-[#6B6252]' : 'bg-[#E8D1AB]/50')}`}
            >
              {submitting ? 'Please wait…' : continueLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
