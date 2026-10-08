"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Loader2, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProducerStatus = "available" | "available_today" | "limited";

export interface Producer {
  id: number;
  name: string;
  avatarUrl?: string;
  activeShoots: number;
  status: ProducerStatus;
}

interface AssignProducerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  producers?: Producer[];
  loading?: boolean;
  shootLabel?: string; 
  shootCode?: string; 
  onAssign?: (producer: Producer) => void | Promise<void>;
}

const STATUS_META: Record<ProducerStatus, { label: string; dot: string }> = {
  available: { label: "Available", dot: "bg-[#4ADE9A]" },
  available_today: { label: "Available today", dot: "bg-[#4ADE9A]" },
  limited: { label: "Limited capacity", dot: "bg-[#D9A864]" },
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function AssignProducerModal({
  isOpen,
  onClose,
  isDark = true,
  producers = [],
  loading = false,
  shootLabel = "this shoot",
  shootCode = "",
  onAssign,
}: AssignProducerModalProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"select" | "confirm">("select");

  // Reset when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedId(null);
      setSubmitting(false);
      setStep("select");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, submitting]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return producers;
    return producers.filter((producer) => producer.name.toLowerCase().includes(term));
  }, [producers, query]);

  const selected = producers.find((producer) => producer.id === selectedId) ?? null;

  const handleAssign = async () => {
    if (!selected || !onAssign) return;
    try {
      setSubmitting(true);
      await onAssign(selected);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Step 2: confirm screen
  if (step === "confirm" && selected) {
    const firstName = selected.name.split(" ")[0];
    const accent = isDark ? "text-[#E8D1AB]" : "text-[#9a7b3f]";

    return (
      <div
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-colors",
          isDark ? "bg-black/70" : "bg-zinc-900/30"
        )}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submitting) setStep("select");
        }}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-producer-confirm-title"
          className={cn(
            "w-full max-w-[448px] rounded-[20px] border p-6 shadow-2xl",
            isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                isDark ? "border-[#2a2a2a] bg-[#1a1916]" : "border-zinc-200 bg-zinc-50"
              )}
            >
              <Users size={18} className={accent} />
            </span>
            <h2
              id="assign-producer-confirm-title"
              className={cn("text-xl font-medium", isDark ? "text-white" : "text-[#171717]")}
            >
              Assign Producer?
            </h2>
          </div>

          {/* Message */}
          <p className={cn("mt-5 text-base leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>
            You&apos;re assigning <span className={cn("font-medium", accent)}>{selected.name}</span> as the Producer
            for{" "}
            <span className={cn("font-medium", isDark ? "text-white" : "text-[#171717]")}>
              {shootLabel} {shootCode && `· ${shootCode}`}
            </span>
            .
          </p>

          {/* Info box */}
          <div
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl px-4 py-4",
              isDark ? "bg-[#1a1a1a]" : "bg-zinc-100"
            )}
          >
            <Bell size={18} className={cn("mt-0.5 shrink-0", accent)} />
            <p className={cn("text-sm leading-snug", isDark ? "text-zinc-400" : "text-zinc-500")}>
              {firstName} will be notified and this shoot will appear in their Producer dashboard. Assignment is
              immediate—no acceptance required.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStep("select")}
              disabled={submitting}
              className={cn(
                "h-12 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50",
                isDark
                  ? "bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]"
                  : "bg-zinc-100 text-[#171717] hover:bg-zinc-200"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={submitting}
              className="h-12 rounded-lg bg-[#E8D1AB] text-sm font-semibold text-black transition-colors hover:bg-[#d9c29c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Assigning...
                </span>
              ) : (
                "Assign Producer"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-colors",
        isDark ? "bg-black/70" : "bg-zinc-900/30"
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-producer-title"
        className={cn(
          "relative w-full max-w-[620px] overflow-hidden rounded-[24px] border shadow-2xl",
          isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between border-b px-6 py-5",
            isDark ? "border-zinc-800" : "border-zinc-200"
          )}
        >
          <h2
            id="assign-producer-title"
            className={cn("text-2xl font-bold leading-none", isDark ? "text-white" : "text-[#171717]")}
          >
            Assign Producer
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              isDark
                ? "bg-[#2a2625] text-white hover:bg-[#3a3533]"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black"
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-6">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className={cn(
                "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2",
                isDark ? "text-zinc-500" : "text-zinc-400"
              )}
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Producer Name..."
              aria-label="Search producers"
              className={cn(
                "h-11 w-full rounded-xl border pl-11 pr-4 text-sm outline-none transition-colors",
                isDark
                  ? "border-[#2a2a2a] bg-[#1c1c1c] text-white placeholder:text-zinc-500 focus:border-[#E8D1AB]/60"
                  : "border-zinc-200 bg-zinc-50 text-[#171717] placeholder:text-zinc-400 focus:border-[#E8D1AB]"
              )}
            />
          </div>

          {/* Producer list */}
          <div role="radiogroup" aria-label="Producers" className="mt-4 max-h-[300px] space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
                <Loader2 className="animate-spin" size={18} />
                <span>Loading producers...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                {query ? `No producers match "${query}".` : "No producers are available to assign."}
              </div>
            ) : (
              filtered.map((producer) => {
                const isSelected = producer.id === selectedId;
                const status = STATUS_META[producer.status];

                return (
                  <button
                    key={producer.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedId(producer.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      isDark
                        ? "bg-[#0e0e0d] hover:bg-[#151514]"
                        : "bg-white hover:bg-zinc-50",
                      isSelected
                        ? "border-[#E8D1AB]"
                        : isDark
                          ? "border-[#1f1f1f]"
                          : "border-zinc-200"
                    )}
                  >
                    {/* Avatar */}
                    {producer.avatarUrl ? (
                      <img
                        src={producer.avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          isDark ? "bg-[#2a2625] text-[#E8D1AB]" : "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {initialsOf(producer.name)}
                      </span>
                    )}

                    {/* Name + meta */}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[13px] font-semibold",
                          isDark ? "text-white" : "text-[#171717]"
                        )}
                      >
                        {producer.name}
                      </span>
                      <span className={cn("block truncate text-[13px]", isDark ? "text-zinc-400" : "text-zinc-500")}>
                        Producer ·{" "}
                        <span className={isDark ? "text-[#E8D1AB]" : "text-[#9a7b3f]"}>
                          {producer.activeShoots} active {producer.activeShoots === 1 ? "shoot" : "shoots"}
                        </span>
                      </span>
                    </span>

                    {/* Status */}
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                      <span className={cn("text-[13px]", isDark ? "text-zinc-300" : "text-zinc-600")}>
                        {status.label}
                      </span>
                    </span>

                    {/* Radio */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-[#E8D1AB]"
                          : isDark
                            ? "border-zinc-600"
                            : "border-zinc-300"
                      )}
                    >
                      {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#E8D1AB]" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Helper text */}
          <p className={cn("mt-4 text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
            CPs, sales-only users, inactive users, and clients are automatically excluded.
          </p>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50",
                isDark
                  ? "bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]"
                  : "bg-zinc-100 text-[#171717] hover:bg-zinc-200"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              disabled={!selected}
              className={cn(
                "h-11 rounded-lg text-sm font-semibold text-black transition-colors",
                "bg-[#E8D1AB] hover:bg-[#d9c29c]",
                "disabled:cursor-not-allowed disabled:bg-[#736754] disabled:hover:bg-[#736754]"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Continuing...
                </span>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}