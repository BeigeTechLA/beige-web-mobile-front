"use client";

import React, { useCallback, useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileManagerApi } from "@/lib/fileManagerApi";

type FileManagerSettingsProps = {
  isDark?: boolean;
};

import type { FileManagerSettingsHistoryRow } from "@/lib/fileManagerApi";

const DEFAULT_CP_DELETE_LOCK_DAYS = 7;

const formatHistoryTimestamp = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} - ${timePart}`;
};
export function FileManagerSettings({
  isDark = true,
}: FileManagerSettingsProps) {
  const [cpDeleteLockDays, setCpDeleteLockDays] = useState(
    String(DEFAULT_CP_DELETE_LOCK_DAYS),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<FileManagerSettingsHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showChangeHistory, setShowChangeHistory] = useState(false);


  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await fileManagerApi.getFileManagerSettingsHistory({
        page: 1,
        limit: 20,
      });
      setHistory(data?.rows ?? []);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load file manager settings history",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await fileManagerApi.getFileManagerSettings();

      setCpDeleteLockDays(
        String(
          data?.cpDeleteLockDays ??
            data?.cp_delete_lock_days ??
            DEFAULT_CP_DELETE_LOCK_DAYS,
        ),
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load file manager settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  loadSettings();
}, [loadSettings]);

useEffect(() => {
  if (showChangeHistory) {
    void loadHistory();
  }
}, [loadHistory, showChangeHistory]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const days = Number(cpDeleteLockDays);

    if (
      !Number.isFinite(days) ||
      days < 0 ||
      days > 365
    ) {
      toast.error(
        "Enter a lock window between 0 and 365 days",
      );

      return;
    }

    try {
      setSaving(true);

      const data =
        await fileManagerApi.updateFileManagerSettings({
          cp_delete_lock_days: Math.floor(days),
        });

      setCpDeleteLockDays(
        String(
          data?.cpDeleteLockDays ??
            data?.cp_delete_lock_days ??
            Math.floor(days),
        ),
      );

      toast.success(
        "File manager settings updated",
      );

      loadHistory();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update file manager settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = `
    h-10
    lg:h-14
    lg:text-lg
    rounded-lg
    lg:rounded-xl
    transition-all
    ${
      isDark
        ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/30 focus:border-[#E8D1AB]/50"
        : "bg-[#F9F9F9] border-zinc-200 text-black placeholder:text-zinc-400 focus:border-[#E8D1AB]"
    }
  `;

  const labelClassName = `
    text-sm
    font-medium
    transition-colors
    ${isDark ? "text-white/60" : "text-zinc-500"}
  `;

  return (
    <>
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark
          ? "bg-[#111] border-white/5"
          : "bg-white border-zinc-200"
      }`}
    >
      {/* Card Heading */}
<div className="mb-4 lg:mb-8">
  <div className="flex items-center gap-2">
    <h2
      className={`lg:text-xl font-bold tracking-tight transition-colors ${
        isDark
          ? "text-white"
          : "text-[#171717]"
      }`}
    >
      File Manager Settings
    </h2>

    <button
      type="button"
      onClick={() => setShowChangeHistory(true)}
      title="View change history"
      aria-label="View change history"
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
        isDark
          ? "bg-white/10 text-white/70 hover:bg-white/15 hover:text-[#E8D1AB]"
          : "bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
      }`}
    >
      <History size={14} />
    </button>
  </div>

  <p
    className={`mt-1 text-xs lg:text-sm leading-5 transition-colors ${
      isDark
        ? "text-white/60"
        : "text-zinc-500"
    }`}
  >
    Creative partners can delete uploaded files
    only during this window. After that, admin
    deletion is required.
  </p>
</div>

      <div className="space-y-6 max-w-2xl">
        {/* Lock Days */}
        <div className="space-y-3">
          <Label
            htmlFor="cp-delete-lock-days"
            className={labelClassName}
          >
            Days after upload
          </Label>

          <Input
            id="cp-delete-lock-days"
            type="number"
            inputMode="numeric"
            min={0}
            max={365}
            step={1}
            value={cpDeleteLockDays}
            onChange={(event) =>
              setCpDeleteLockDays(
                event.target.value,
              )
            }
            disabled={loading || saving}
            placeholder={
              loading
                ? "Loading..."
                : "Enter number of days"
            }
            className={inputClassName}
          />

          <p
            className={`text-xs leading-5 ${
              isDark
                ? "text-white/50"
                : "text-zinc-500"
            }`}
          >
            Set to 7 for the current policy. Set to 0
            only if creative partner deletion should
            never lock.
          </p>
        </div>

        {/* Save */}
        <div
          className={`pt-4 border-t transition-colors ${
            isDark
              ? "border-white/5"
              : "border-zinc-100"
          }`}
        >
          <Button
            type="submit"
            disabled={loading || saving}
            className="
              h-10
              lg:h-14
              bg-[#E8D1AB]
              text-black
              font-medium
              lg:text-lg
              rounded-lg
              lg:rounded-xl
              min-w-[140px]
              lg:min-w-[200px]
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
    {/* Change History Modal */}
    {showChangeHistory && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={() => setShowChangeHistory(false)}
      >
        <div
          className={`relative max-h-[85vh] w-full max-w-[650px] overflow-hidden rounded-lg lg:rounded-2xl border shadow-2xl ${
            isDark
              ? "border-white/10 bg-[#111] text-white"
              : "border-zinc-200 bg-white text-black"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            className={`flex items-center justify-between border-b px-5 py-4 ${
              isDark
                ? "border-white/10"
                : "border-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isDark
                    ? "bg-white/10"
                    : "bg-black/5"
                }`}
              >
                <History
                  size={18}
                  className={
                    isDark
                      ? "text-[#E8D1AB]"
                      : "text-black/60"
                  }
                />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  Change History
                </h2>

                <p
                  className={`text-xs ${
                    isDark
                      ? "text-white/45"
                      : "text-black/45"
                  }`}
                >
                  {historyLoading
                    ? "Loading history..."
                    : history.length === 0
                      ? "No change history yet"
                      : `${history.length} history ${
                          history.length === 1
                            ? "entry"
                            : "entries"
                        }`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChangeHistory(false)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors ${
                isDark
                  ? "text-white/50 hover:bg-white/10 hover:text-white"
                  : "text-black/40 hover:bg-black/5 hover:text-black"
              }`}
              aria-label="Close change history"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="max-h-[65vh] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center px-5 py-10">
                <Loader2
                  size={20}
                  className={`animate-spin ${
                    isDark
                      ? "text-[#E8D1AB]"
                      : "text-black/60"
                  }`}
                />
              </div>
            ) : history.length === 0 ? (
              <div
                className={`px-5 py-8 text-sm ${
                  isDark
                    ? "text-white/60"
                    : "text-black/60"
                }`}
              >
                No history records found yet.
              </div>
            ) : (
              history.map((row) => (
                <div
                  key={row.id}
                  className={`border-b px-5 py-4 last:border-b-0 ${
                    isDark
                      ? "border-white/10"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {row.changed_by?.name ||
                          row.changed_by?.email ||
                          "Admin"}
                      </p>

                      <p
                        className={`text-xs ${
                          isDark
                            ? "text-white/45"
                            : "text-black/45"
                        }`}
                      >
                        {formatHistoryTimestamp(
                          row.changed_at,
                        )}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        isDark
                          ? "bg-white/10 text-white/60"
                          : "bg-black/5 text-black/50"
                      }`}
                    >
                      Settings changed
                    </span>
                  </div>

                  <div
                    className={`mt-3 flex items-center gap-2 text-xs ${
                      isDark
                        ? "text-white/70"
                        : "text-black/65"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        isDark
                          ? "bg-[#E8D1AB]"
                          : "bg-black/40"
                      }`}
                    />

                   <span>
                      <strong>Delete lock period:</strong>{" "}
                      Changed from{" "}
                      {row.before?.cp_delete_lock_days ?? "—"} day(s){" "}
                      to{" "}
                      <span className="font-semibold">
                        {row.after?.cp_delete_lock_days ?? row.cp_delete_lock_days} day(s)
                      </span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div
            className={`flex justify-end border-t px-5 py-3 ${
              isDark
                ? "border-white/10"
                : "border-zinc-200"
            }`}
          >
            <Button
              type="button"
              onClick={() => setShowChangeHistory(false)}
              className="h-9 bg-[#E8D1AB] text-black rounded-lg px-4 text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}