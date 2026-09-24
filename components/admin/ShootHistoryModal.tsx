"use client";

import React, { useEffect, useState } from "react";
import { History, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";

type ShootHistoryEntry = {
  history_id: number;
  action: string;
  performed_by_name?: string | null;
  created_at: string;
};

type ShootHistoryModalProps = {
  isOpen: boolean;
  shootId: string | null;
  shootName?: string;
  onClose: () => void;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function ShootHistoryModal({ isOpen, shootId, shootName, onClose }: ShootHistoryModalProps) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [entries, setEntries] = useState<ShootHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !shootId) return;
    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError("");
      setEntries([]);
      const response = await adminApi.getProjectHistory(shootId);
      if (cancelled) return;

      if (response?.success) {
        setEntries(Array.isArray(response?.data?.history) ? response.data.history : []);
      } else {
        setError(response?.error || response?.message || "Failed to load shoot history");
      }
      setLoading(false);
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isOpen, shootId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-[#333] bg-[#151515] text-white" : "border-[#E5E5E5] bg-white text-black"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-[#333]" : "border-[#E5E5E5]"}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <History size={19} className="text-[#C9A96E]" />
              <h2 className="text-lg font-semibold">Shoot History</h2>
            </div>
            <p className={`mt-1 truncate text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
              {shootName || `Shoot #${shootId}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-lg p-2 ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`} aria-label="Close history">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {loading ? (
            <div className={`flex items-center justify-center gap-2 py-16 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
              <Loader2 size={20} className="animate-spin" /> Loading history...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">{error}</div>
          ) : entries.length === 0 ? (
            <div className={`py-16 text-center ${isDark ? "text-white/45" : "text-black/45"}`}>
              <History size={30} className="mx-auto mb-3 text-[#C9A96E]" />
              <p className="text-sm">No activity has been recorded for this shoot yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const isRestore = entry.action === "restored";
                const isDelete = entry.action === "deleted";
                return (
                  <div key={entry.history_id} className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#ECE7DE] bg-[#FFFCF6]"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-2 ${isRestore ? "bg-emerald-500/15 text-emerald-500" : isDelete ? "bg-red-500/15 text-red-500" : "bg-[#C9A96E]/15 text-[#C9A96E]"}`}>
                        {isRestore ? <RotateCcw size={17} /> : isDelete ? <Trash2 size={17} /> : <History size={17} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium capitalize">Shoot {entry.action}</p>
                          <p className={`text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>{formatDate(entry.created_at)}</p>
                        </div>
                        <p className={`mt-1 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>
                          By {entry.performed_by_name || "System"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
