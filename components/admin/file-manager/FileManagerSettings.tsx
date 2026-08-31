"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LockKeyhole, Save } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/src/components/landing/ui/button";
import { fileManagerApi } from "@/lib/fileManagerApi";

type FileManagerSettingsProps = {
  isDark?: boolean;
};

const DEFAULT_CP_DELETE_LOCK_DAYS = 7;

export function FileManagerSettings({ isDark = true }: FileManagerSettingsProps) {
  const [cpDeleteLockDays, setCpDeleteLockDays] = useState(String(DEFAULT_CP_DELETE_LOCK_DAYS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fileManagerApi.getFileManagerSettings();
      setCpDeleteLockDays(String(data?.cpDeleteLockDays ?? data?.cp_delete_lock_days ?? DEFAULT_CP_DELETE_LOCK_DAYS));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load file manager settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
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
      });
      setCpDeleteLockDays(String(data?.cpDeleteLockDays ?? data?.cp_delete_lock_days ?? Math.floor(days)));
      toast.success("File manager settings updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update file manager settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[700px] space-y-6">
      <div>
        <h2 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
          File Manager Settings
        </h2>
        <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
          Creative partners can delete uploaded files only during this window. After that, admin deletion is required.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2">
        <fieldset
          className={`w-full max-w-[220px] rounded-lg border px-4 pb-3 pt-1.5 ${isDark ? "border-white/25" : "border-black/20"
            }`}
        >
          <legend
            className={`px-1 text-[11px] leading-none ${isDark ? "text-white/55" : "text-black/55"
              }`}
          >
            Days after upload
          </legend>

          <Input
            type="number"
            min={0}
            max={365}
            step={1}
            value={cpDeleteLockDays}
            onChange={(event) => setCpDeleteLockDays(event.target.value)}
            disabled={loading || saving}
            className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] focus-visible:ring-0 ${isDark ? "text-white" : "text-black"
              }`}
          />
        </fieldset>

        <p
          className={`max-w-md text-xs leading-5 ${isDark ? "text-white/55" : "text-black/55"
            }`}
        >
          Set to 7 for the current policy. Set to 0 only if CP deletion should never
          lock.
        </p>
      </div>

      <div className={`flex justify-end border-t pt-4 ${isDark ? "border-white/10" : "border-[#E5E5E5]"}`}>
        <Button
          type="submit"
          variant="beige"
          disabled={loading || saving}
          className="h-11 rounded-lg px-5 text-sm font-semibold text-black"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
