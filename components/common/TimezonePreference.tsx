"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppDispatch } from "@/lib/redux/hooks";
import { updateUser } from "@/lib/redux/features/auth/authSlice";

const displayNames: Record<string, string> = {
  "Asia/Kolkata": "Kolkata, India",
  "Asia/Calcutta": "Kolkata, India",
  "America/New_York": "New York, United States",
  "America/Los_Angeles": "Los Angeles, United States",
  "America/Chicago": "Chicago, United States",
  "Europe/London": "London, United Kingdom",
  "Australia/Sydney": "Sydney, Australia",
};

const fallbackTimezones = ["Pacific/Auckland", "Australia/Sydney", "Asia/Tokyo", "Asia/Singapore", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Paris", "Europe/Berlin", "Africa/Johannesburg", "America/Sao_Paulo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Pacific/Honolulu", "UTC"];
type TimezoneResponse = { success: boolean; message?: string; timezone?: string };
type TimezoneOption = { value: string; label: string; offset: string; search: string };

const getDeviceTimezone = () => typeof window === "undefined" ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const getOffset = (timezone: string) => {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" }).formatToParts(new Date()).find((item) => item.type === "timeZoneName");
    return part?.value?.replace("GMT", "UTC") || "UTC";
  } catch { return "UTC"; }
};
const makeOption = (value: string): TimezoneOption => {
  const parts = value.split("/");
  const region = parts.shift() || "";
  const city = parts.join("/").replaceAll("_", " ") || value;
  const label = displayNames[value] || (parts.length ? city + ", " + region.replaceAll("_", " ") : value);
  return { value, label, offset: getOffset(value), search: (label + " " + value).toLowerCase() };
};

export function TimezonePreference({ isDark = true }: { isDark?: boolean }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const deviceTimezone = getDeviceTimezone();
  const [timezone, setTimezone] = useState(user?.timezone || deviceTimezone);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => {
    const list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : fallbackTimezones;
    return [...new Set([...list, "UTC"])].map(makeOption).sort((a, b) => a.label.localeCompare(b.label));
  }, []);
  const selected = options.find((option) => option.value === timezone) || makeOption(timezone);
  const matches = options.filter((option) => option.search.includes(query.toLowerCase())).slice(0, 80);

  useEffect(() => { setTimezone(user?.timezone || deviceTimezone); }, [user?.timezone, deviceTimezone]);

  const choose = (value: string) => { setTimezone(value); setQuery(""); setIsOpen(false); };
  const save = async () => {
    setSaving(true);
    try {
      const response = await apiClient.patch<TimezoneResponse>("auth/timezone", { timezone });
      const saved = response.timezone || timezone;
      dispatch(updateUser({ timezone: saved }));
      const stored = typeof window === "undefined" ? null : localStorage.getItem("revure_user");
      if (stored) localStorage.setItem("revure_user", JSON.stringify({ ...JSON.parse(stored), timezone: saved }));
      toast.success("Timezone updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save timezone");
    } finally { setSaving(false); }
  };

  const cardClass = isDark ? "bg-[#111] border-white/5" : "bg-white border-zinc-200";
  const inputClass = isDark ? "bg-[#1A1A1A] border-white/10 text-white placeholder:text-white/35" : "bg-[#F9F9F9] border-zinc-200 text-zinc-900";
  const mutedClass = isDark ? "text-white/50" : "text-zinc-500";

  return (
    <section className={"rounded-lg lg:rounded-2xl border p-5 md:p-8 " + cardClass}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB]/15 text-[#E8D1AB]"><Clock className="h-4 w-4" /></div>
        <div className="min-w-0"><h2 className={"text-lg font-semibold leading-tight " + (isDark ? "text-white" : "text-zinc-900")}>Timezone</h2><p className={"mt-1 text-sm " + mutedClass}>Meeting push notifications are shown in your selected local time.</p></div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1 space-y-2">
          <Label htmlFor="timezone-search" className={isDark ? "text-white/75" : "text-zinc-700"}>Primary timezone</Label>
          <div className="relative">
            <Search className={"absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 " + mutedClass} />
            <Input id="timezone-search" value={isOpen ? query : selected.label} onFocus={() => { setIsOpen(true); setQuery(""); }} onBlur={() => window.setTimeout(() => setIsOpen(false), 150)} onChange={(event) => { setIsOpen(true); setQuery(event.target.value); }} placeholder="Search city or country" className={"h-14 pl-11 " + inputClass} autoComplete="off" />
          </div>
          {isOpen && <div className={"absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border shadow-xl " + (isDark ? "border-white/10 bg-[#1A1A1A]" : "border-zinc-200 bg-white")}>
            {matches.length === 0 ? <p className={"px-4 py-5 text-sm " + mutedClass}>No timezone found.</p> : matches.map((option) => <button type="button" key={option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option.value)} className={"flex w-full items-start gap-3 px-4 py-3 text-left" + (isDark ? " hover:bg-white/10" : " hover:bg-zinc-50")}>
              <Check className={"mt-1 h-4 w-4 shrink-0 " + (timezone === option.value ? "text-[#E8D1AB] opacity-100" : "opacity-0")} /><span className="min-w-0"><span className={"block truncate text-sm font-medium " + (isDark ? "text-white" : "text-zinc-900")}>{option.label}</span><span className={"block truncate text-xs " + mutedClass}>{option.offset} · {option.value}</span></span>
            </button>)}
          </div>}
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Button type="button" variant="outline" onClick={() => choose(deviceTimezone)} className={"h-14 flex-1 sm:flex-none " + inputClass}><LocateFixed className="mr-2 h-4 w-4" />Use device</Button>
          <Button type="button" onClick={save} disabled={saving} className="h-14 flex-1 bg-[#E8D1AB] px-6 text-black hover:bg-[#ddc499] sm:flex-none">{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </section>
  );
}
