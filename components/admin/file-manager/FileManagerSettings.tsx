"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileManagerApi } from "@/lib/fileManagerApi";

type FileManagerSettingsProps = {
  isDark?: boolean;
};

const DEFAULT_CP_DELETE_LOCK_DAYS = 7;

export function FileManagerSettings({
  isDark = true,
}: FileManagerSettingsProps) {
  const [cpDeleteLockDays, setCpDeleteLockDays] = useState(
    String(DEFAULT_CP_DELETE_LOCK_DAYS),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        <h2
          className={`lg:text-xl font-bold tracking-tight mb-1 transition-colors ${
            isDark
              ? "text-white"
              : "text-[#171717]"
          }`}
        >
          File Manager Settings
        </h2>

        <p
          className={`text-xs lg:text-sm leading-5 transition-colors ${
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
  );
}