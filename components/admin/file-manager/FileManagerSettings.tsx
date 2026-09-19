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

const toBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["1", "true", "yes", "enabled"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "disabled"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

export function FileManagerSettings({
  isDark = true,
}: FileManagerSettingsProps) {
  const [cpDeleteLockDays, setCpDeleteLockDays] = useState(
    String(DEFAULT_CP_DELETE_LOCK_DAYS),
  );

  const [cpSharingEnabled, setCpSharingEnabled] = useState(false);

  const [clientAccessTransferEnabled, setClientAccessTransferEnabled] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fileManagerApi.getFileManagerSettings();

      setCpDeleteLockDays(
        String(
          data?.cpDeleteLockDays ??
            data?.cp_delete_lock_days ??
            DEFAULT_CP_DELETE_LOCK_DAYS,
        ),
      );

      setCpSharingEnabled(
        toBoolean(
          data?.cpSharingEnabled ??
            data?.cp_sharing_enabled ??
            data?.cp_file_manager_sharing_enabled ??
            data?.cp_can_share_file_manager,
          false,
        ),
      );

      setClientAccessTransferEnabled(
        toBoolean(
          data?.clientAccessTransferEnabled ??
            data?.client_access_transfer_enabled ??
            data?.client_file_manager_access_transfer_enabled,
          false,
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
    void loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const days = Number(cpDeleteLockDays);
    if (!Number.isFinite(days) || days < 0 || days > 365) {
      toast.error("Enter a lock window between 0 and 365 days");
      return;
    }

    try {
      setSaving(true);

      const data = await fileManagerApi.updateFileManagerSettings({
        cp_delete_lock_days: Math.floor(days),
        cp_sharing_enabled: cpSharingEnabled,
        client_access_transfer_enabled: clientAccessTransferEnabled,
      });

      setCpDeleteLockDays(
        String(
          data?.cpDeleteLockDays ??
            data?.cp_delete_lock_days ??
            Math.floor(days),
        ),
      );

      setCpSharingEnabled(
        toBoolean(
          data?.cpSharingEnabled ??
            data?.cp_sharing_enabled ??
            data?.cp_file_manager_sharing_enabled ??
            data?.cp_can_share_file_manager,
          cpSharingEnabled,
        ),
      );

      setClientAccessTransferEnabled(
        toBoolean(
          data?.clientAccessTransferEnabled ??
            data?.client_access_transfer_enabled ??
            data?.client_file_manager_access_transfer_enabled,
          clientAccessTransferEnabled,
        ),
      );

      toast.success("File manager settings updated");
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

  const settingCardClassName = `
    flex
    items-center
    justify-between
    gap-4
    rounded-lg
    lg:rounded-xl
    border
    p-4
    lg:p-5
    transition-colors
    ${isDark ? "border-white/10 bg-[#1A1A1A]" : "border-zinc-200 bg-[#F9F9F9]"}
  `;

  const renderSwitch = (
    checked: boolean,
    onChange: () => void,
    ariaLabel: string,
  ) => (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={loading || saving}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#E8D1AB] bg-[#E8D1AB]"
          : isDark
            ? "border-white/15 bg-[#242424]"
            : "border-black/15 bg-[#E9E9E9]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-sm transition-all ${
          checked
            ? "left-[22px] bg-black"
            : isDark
              ? "left-1 bg-white/70"
              : "left-1 bg-white"
        }`}
      />
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
        isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
      }`}
    >
      <div className="mb-4 lg:mb-8">
        <h2
          className={`lg:text-xl font-bold tracking-tight mb-1 transition-colors ${
            isDark ? "text-white" : "text-[#171717]"
          }`}
        >
          File Manager Settings
        </h2>

        <p
          className={`text-xs lg:text-sm leading-5 transition-colors ${
            isDark ? "text-white/60" : "text-zinc-500"
          }`}
        >
          Manage file deletion, sharing and client access permissions.
        </p>
      </div>

      <div className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <Label htmlFor="cp-delete-lock-days" className={labelClassName}>
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
            onChange={(event) => setCpDeleteLockDays(event.target.value)}
            disabled={loading || saving}
            placeholder={loading ? "Loading..." : "Enter number of days"}
            className={inputClassName}
          />

          <p
            className={`text-xs leading-5 ${
              isDark ? "text-white/50" : "text-zinc-500"
            }`}
          >
            Creative partners can delete uploaded files during this period.
            After the configured period, admin deletion is required.
          </p>
        </div>

        <div
          className={`border-t ${
            isDark ? "border-white/5" : "border-zinc-100"
          }`}
        />

        <div className={settingCardClassName}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm lg:text-base font-semibold ${
                  isDark ? "text-white" : "text-[#171717]"
                }`}
              >
                File Manager Sharing
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  cpSharingEnabled
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isDark
                      ? "bg-white/10 text-white/60"
                      : "bg-black/5 text-black/60"
                }`}
              >
                {cpSharingEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <p
              className={`mt-1 text-xs leading-5 ${
                isDark ? "text-white/50" : "text-zinc-500"
              }`}
            >
              Allow Creative Partners to share files and folders from the File
              Manager.
            </p>
          </div>

          {renderSwitch(
            cpSharingEnabled,
            () => setCpSharingEnabled((current) => !current),
            "Toggle Creative Partner file manager sharing",
          )}
        </div>

        <div className={settingCardClassName}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-sm lg:text-base font-semibold ${
                  isDark ? "text-white" : "text-[#171717]"
                }`}
              >
                Client File Manager Access Transfer
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  clientAccessTransferEnabled
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isDark
                      ? "bg-white/10 text-white/60"
                      : "bg-black/5 text-black/60"
                }`}
              >
                {clientAccessTransferEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <p
              className={`mt-1 text-xs leading-5 ${
                isDark ? "text-white/50" : "text-zinc-500"
              }`}
            >
              Allow File Manager access assigned to a client to be transferred
              to another person.
            </p>
          </div>

          {renderSwitch(
            clientAccessTransferEnabled,
            () => setClientAccessTransferEnabled((current) => !current),
            "Toggle client file manager access transfer",
          )}
        </div>

        <div
          className={`pt-4 border-t transition-colors ${
            isDark ? "border-white/5" : "border-zinc-100"
          }`}
        >
          <Button
            type="submit"
            disabled={loading || saving}
            className="
              h-10
              lg:h-14
              bg-[#E8D1AB]
              hover:bg-[#D8C39D]
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
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
