"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppDispatch } from "@/lib/redux/hooks";
import { updateUser } from "@/lib/redux/features/auth/authSlice";

const commonTimezones = [
  "Asia/Kolkata", "America/Los_Angeles", "America/Denver", "America/Chicago",
  "America/New_York", "America/Toronto", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland", "UTC",
];

type TimezoneResponse = { success: boolean; message?: string; timezone?: string };

export function TimezonePreference({ isDark = true }: { isDark?: boolean }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const detectedTimezone = typeof window === "undefined"
    ? "UTC"
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [timezone, setTimezone] = useState(user?.timezone || detectedTimezone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimezone(user?.timezone || detectedTimezone);
  }, [user?.timezone, detectedTimezone]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await apiClient.patch<TimezoneResponse>("auth/timezone", { timezone });
      const savedTimezone = response.timezone || timezone;
      dispatch(updateUser({ timezone: savedTimezone }));

      const stored = typeof window === "undefined" ? null : localStorage.getItem("revure_user");
      if (stored) {
        localStorage.setItem("revure_user", JSON.stringify({ ...JSON.parse(stored), timezone: savedTimezone }));
      }
      toast.success("Timezone updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please enter a valid IANA timezone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-lg lg:rounded-2xl p-4 md:p-10 border ${isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200"}`}>
      <h2 className={`lg:text-xl font-bold mb-2 ${isDark ? "text-white" : "text-[#171717]"}`}>Timezone</h2>
      <p className={`text-sm mb-5 ${isDark ? "text-white/50" : "text-zinc-500"}`}>
        Meeting push notifications are shown in this timezone. It is detected from your device initially and can be changed here.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <div className="flex-1 space-y-2">
          <Label htmlFor="user-timezone">IANA timezone</Label>
          <Input id="user-timezone" list="common-timezones" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="America/New_York" />
          <datalist id="common-timezones">{commonTimezones.map((value) => <option key={value} value={value} />)}</datalist>
        </div>
        <Button type="button" onClick={save} disabled={saving} className="sm:self-end bg-[#E8D1AB] text-black hover:bg-[#ddc499]">
          {saving ? "Saving..." : "Save timezone"}
        </Button>
      </div>
    </div>
  );
}
