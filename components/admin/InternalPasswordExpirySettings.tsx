"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/lib/api";

type InternalPasswordExpirySettingsProps = { isDark?: boolean };

const isEnabledValue = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

export function InternalPasswordExpirySettings({ isDark = true }: InternalPasswordExpirySettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInternalPasswordExpirySettings();
      if (!response?.success) {
        toast.error(response?.error || "Failed to load password expiry settings");
        return;
      }
      setEnabled(isEnabledValue(response.data?.is_enabled));
      setDays(String(response.data?.expiry_days || 7));
    } catch {
      toast.error("Failed to load password expiry settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expiryDays = Number(days);
    if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 365) {
      toast.error("Enter an expiry period between 1 and 365 days");
      return;
    }
    try {
      setSaving(true);
      const response = await adminApi.updateInternalPasswordExpirySettings({
        is_enabled: enabled,
        expiry_days: expiryDays,
      });
      if (!response?.success) {
        toast.error(response?.error || "Failed to update password expiry settings");
        return;
      }
      setEnabled(isEnabledValue(response.data?.is_enabled));
      setDays(String(response.data?.expiry_days || expiryDays));
      toast.success(response.message || "Password expiry settings updated");
    } catch {
      toast.error("Failed to update password expiry settings");
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = `h-10 lg:h-14 lg:text-lg rounded-lg lg:rounded-xl transition-all ${
    isDark
      ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/30 focus:border-[#E8D1AB]/50"
      : "bg-[#F9F9F9] border-zinc-200 text-black placeholder:text-zinc-400 focus:border-[#E8D1AB]"
  }`;
  const labelClassName = `text-sm font-medium transition-colors ${isDark ? "text-white/60" : "text-zinc-500"}`;

  return (
    <form onSubmit={handleSubmit} className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border transition-colors ${
      isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"
    }`}>
      <div className="mb-4 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isDark ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "bg-[#E8D1AB]/30 text-[#8B642A]"
          }`}><ShieldCheck size={20} /></div>
          <div>
            <h2 className={`lg:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#171717]"}`}>Internal Password Expiry</h2>
            <p className={`mt-1 text-xs lg:text-sm leading-5 ${isDark ? "text-white/60" : "text-zinc-500"}`}>
              Require internal members to verify their email before changing an expired password.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className={`flex items-center justify-between gap-4 rounded-lg lg:rounded-xl border p-4 lg:p-5 ${
          isDark ? "border-white/10 bg-[#1A1A1A]" : "border-zinc-200 bg-[#F9F9F9]"
        }`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>Password expiry protection</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                enabled ? "bg-emerald-500/15 text-emerald-500" : isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/60"
              }`}>{enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className={`mt-1 text-xs leading-5 ${isDark ? "text-white/50" : "text-zinc-500"}`}>
              {enabled
                ? "Internal members will be asked to update their password after the selected period."
                : "Internal passwords will not expire while this protection is disabled."}
            </p>
          </div>
          <Switch id="password-expiry-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={loading || saving}
            aria-label="Enable password expiry protection"
            className="data-[state=checked]:bg-[#E8D1AB] data-[state=unchecked]:bg-white/20" />
        </div>

        <div className="space-y-3">
          <Label htmlFor="password-expiry-days" className={labelClassName}>Password expiry period (days)</Label>
          <Input id="password-expiry-days" type="number" inputMode="numeric" min={1} max={365} step={1}
            value={days} onChange={(event) => setDays(event.target.value)} disabled={loading || saving}
            placeholder={loading ? "Loading..." : "Enter number of days"} className={inputClassName} />
          <p className={`text-xs leading-5 ${isDark ? "text-white/50" : "text-zinc-500"}`}>
            Recommended: 7 days. When you enable this policy, existing internal members receive a fresh expiry period.
          </p>
        </div>

        <div className={`pt-4 border-t ${isDark ? "border-white/5" : "border-zinc-100"}`}>
          <Button type="submit" disabled={loading || saving}
            className="h-10 lg:h-14 bg-[#E8D1AB] text-black font-medium lg:text-lg rounded-lg lg:rounded-xl min-w-[140px] lg:min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
