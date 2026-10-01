"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, CalendarRange, Clock3, Globe2, History, Loader2, MapPin, Pencil, RotateCcw, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";

type ShootHistoryEntry = {
  history_id: number;
  action: string;
  reason?: string | null;
  performed_by_name?: string | null;
  performed_by_role?: string | null;
  metadata?: ShootHistoryMetadata | string | null;
  created_at: string;
};

type ShootHistoryChange = {
  field: string;
  old_value: unknown;
  new_value: unknown;
};

type ShootHistoryMetadata = {
  crew_member_id?: number;
  crew_member_name?: string;
  post_production_member_name?: string;
  changes?: ShootHistoryChange[];
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
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart}  •  ${timePart}`;
};

const parseMetadata = (metadata: ShootHistoryEntry["metadata"]): ShootHistoryMetadata => {
  if (!metadata) return {};
  if (typeof metadata === "object") return metadata;
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const fieldLabels: Record<string, string> = {
  project_name: "Project name",
  date: "Date",
  start_time: "Start time",
  end_time: "End time",
  time_zone: "Time zone",
  location: "Location",
  booking_days: "Booking days",
};

const visibleChangeFields = new Set(Object.keys(fieldLabels));

const isEmptyHistoryValue = (value: unknown) =>
  value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

const formatTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const formatLocation = (value: unknown): string => {
  let normalized = value;
  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized);
    } catch {
      return normalized;
    }
  }
  if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
    const location = normalized as Record<string, unknown>;
    const label = location.address || location.full_address || location.formatted_address || location.name;
    if (label) return String(label);
  }
  return typeof normalized === "string" ? normalized : (JSON.stringify(normalized) ?? String(normalized));
};

const formatHistoryValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Not set";
  if (field === "location") return formatLocation(value);
  if (field === "start_time" || field === "end_time") return formatTime(String(value));
  if (field === "date") {
    const raw = String(value).slice(0, 10);
    const parsed = new Date(`${raw}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (field === "booking_days" && Array.isArray(value)) {
    if (value.length === 0) return "Not set";
    return value.map((item) => {
      if (!item || typeof item !== "object") return String(item);
      const day = item as Record<string, unknown>;
      const has = (v: unknown) => v !== null && v !== undefined && v !== "";
      const datePart = has(day.event_date) ? formatHistoryValue("date", day.event_date) : "";
      const start = has(day.start_time) ? formatHistoryValue("start_time", day.start_time) : "";
      const end = has(day.end_time) ? formatHistoryValue("end_time", day.end_time) : "";
      const timePart = start && end ? `${start} – ${end}` : start ? `Start Time ${start}` : end ? `End Time ${end}` : "";
      return [datePart, timePart].filter(Boolean).join(" • ");
    }).join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

  const actionLabel = (action: string, metadata: ShootHistoryMetadata = {}) => {
  const crewName = metadata.crew_member_name || "Creative partner";
  const postName = metadata.post_production_member_name || "Member";
  switch (action) {
    case "created":
      return "Shoot was created";
    case "crew_assigned":
      return `${crewName} was assigned to the shoot`;
    case "crew_removed":
      return `${crewName} was removed from the shoot`;
    case "post_production_member_assigned":
      return `${postName} was added to post production team`;
    case "post_production_member_removed":
      return `${postName} was removed from post production team`;
    case "project_name_updated":
      return "Project name updated";
    case "schedule_location_updated":
      return "Schedule updated";
    case "restored":
      return "Shoot was restored";
    case "deleted":
      return "Shoot was deleted";
    case "files_uploaded":
      return "Files are uploaded";
    case "raw_files_uploaded":
      return "Raw Files are uploaded";
    case "payment":
      return "Partial payment is made";
    default:
      return action.replaceAll("_", " ");
  }
};

const changeIcons = {
  project_name: Pencil,
  date: CalendarDays,
  start_time: Clock3,
  end_time: Clock3,
  time_zone: Globe2,
  location: MapPin,
  booking_days: CalendarRange,
} as const;

const actionIcon = (action: string) => {
  switch (action) {
    case "crew_assigned":
    case "post_production_member_assigned":
      return UserPlus;
    case "crew_removed":
    case "post_production_member_removed":
      return UserMinus;
    case "restored":
      return RotateCcw;
    case "deleted":
      return Trash2;
    case "project_name_updated":
      return Pencil;
    case "schedule_location_updated":
      return CalendarDays;
    default:
      return History;
  }
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
    <div
      className="fixed inset-0 z-[300] flex justify-end bg-black/75 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-[640px] flex-col overflow-hidden bg-[#000000] text-white shadow-2xl border-l border-[#222222]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222222] px-5 py-4 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">View Activity</h2>
            {shootName && (
              <p className="mt-1 text-base text-white/50">{shootName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1C1C1E] text-white/70 hover:bg-[#2C2C2E] hover:text-white transition-colors"
            aria-label="Close activity history"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-base text-white/50">
              <Loader2 size={24} className="animate-spin text-[#E8D1AB]" /> Loading activity timeline...
            </div>
          ) : error ? (
            <div className="py-24 text-center text-sm text-red-400 bg-red-950/20 rounded-2xl border border-red-900/30 p-6">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-white/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C1C1E] mb-4">
                <History size={28} className="text-[#C9A96E]" />
              </div>
              <p className="text-base font-medium text-white/70">No activity recorded</p>
              <p className="mt-1 text-sm text-white/40">There is no history recorded for this shoot yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => {
                const metadata = parseMetadata(entry.metadata);
                const rawChanges = (Array.isArray(metadata.changes) ? metadata.changes : []).filter(
                  (change) =>
                    visibleChangeFields.has(change.field) &&
                    !(isEmptyHistoryValue(change.old_value) && isEmptyHistoryValue(change.new_value))
                );

             const performerName = entry.performed_by_name || "System";
             const performerRole = entry.performed_by_role || "";
                const initials = performerName
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "PC";

                const mainActionText = actionLabel(entry.action, metadata);
                const scheduleFields = ["date", "start_time", "end_time"];
                const scheduleChanges = rawChanges.filter((c) => scheduleFields.includes(c.field));
                const hasBookingDaysChange = rawChanges.some((c) => c.field === "booking_days");
                const pickValue = (field: string, key: "old_value" | "new_value") =>
                  scheduleChanges.find((c) => c.field === field)?.[key];
                const changes: ShootHistoryChange[] =
                  scheduleChanges.length > 0 && !hasBookingDaysChange
                    ? [
                        ...rawChanges.filter((c) => !scheduleFields.includes(c.field)),
                        {
                          field: "booking_days",
                          old_value: [{
                            event_date: pickValue("date", "old_value"),
                            start_time: pickValue("start_time", "old_value"),
                            end_time: pickValue("end_time", "old_value"),
                          }],
                          new_value: [{
                            event_date: pickValue("date", "new_value"),
                            start_time: pickValue("start_time", "new_value"),
                            end_time: pickValue("end_time", "new_value"),
                          }],
                        },
                      ]
                    : hasBookingDaysChange
                      ? rawChanges.filter((c) => !scheduleFields.includes(c.field))
                      : rawChanges;
const hasNamedLabel = Boolean(metadata.crew_member_name || metadata.post_production_member_name);
                const ActionIcon = actionIcon(entry.action);


                return (
                  <div key={entry.history_id} className="relative rounded-2xl bg-[#141414] border border-[#222222] p-5 shadow-lg">
                    {/* Main Entry Header */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5CBE6] text-[#111111] font-semibold text-lg shadow-sm">
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-[17px] font-semibold leading-snug text-white">
                          {performerName}
                          {performerRole && (
                            <span className="text-[#C9A96E] font-medium ml-1"> - {performerRole}</span>
                          )}
                        </h3>
                        <p className="mt-1 text-[13px] text-white/40 font-medium">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Timeline sub-items */}
                    <div className="relative mt-4 ml-6 space-y-3">
                      {changes.length > 0 ? (
                        changes.map((change, idx) => {
                          const oldValue = formatHistoryValue(change.field, change.old_value);
                          const newValue = formatHistoryValue(change.field, change.new_value);
                          const useFromTo = ["booking_days", "project_name", "location", "date", "start_time", "end_time"].includes(change.field);
                          const ChangeIcon = changeIcons[change.field as keyof typeof changeIcons] || History;
                          const isLast = idx === changes.length - 1;
                          const topGap = idx === 0 ? 20 : 14;

                                                    return (
                          <div key={idx} className="relative pl-7">
                            {/* Vertical line: starts at the avatar card, ends at the last box's elbow */}
                            <div
                              className="absolute left-0 w-px bg-[#333333]"
                              style={{
                                top: -topGap,
                                height: isLast ? `calc(50% - 20px + ${topGap}px)` : `calc(100% + ${topGap}px)`,
                              }}
                            />
                            {/* Curve only on the last box, straight connector on the others */}
                          {isLast ? (
                            <div className="absolute bottom-1/2 left-0 h-5 w-7 rounded-bl-2xl border-b border-l border-[#333333]" />
                          ) : (
                            <div className="absolute left-0 top-1/2 h-px w-7 bg-[#333333]" />
                          )}
                              <div className="flex items-center justify-between rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-[#2A2A2A] text-[#E8D1AB]">
                                    <ChangeIcon size={20} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                   {useFromTo ? (
                                    <div className="text-[15px]">
                                      <p className="font-medium text-white/90">
                                    {change.field === "booking_days" ? "Booking schedule updated" : `${fieldLabels[change.field] || change.field} updated`}
                                  </p>
                                      <p className="mt-2 text-xs uppercase tracking-wide text-white/40">From</p>
                                      <p className="whitespace-pre-line text-sm text-white/50">
                                        {oldValue}
                                      </p>
                                      <p className="mt-2 text-xs uppercase tracking-wide text-white/40">To</p>
                                      <p className="whitespace-pre-line text-sm text-[#E8D1AB]">{newValue}</p>
                                    </div>
                                  ) : (
                                    <p className="text-[15px] font-medium text-white/90 break-words">
                                      {`${fieldLabels[change.field] || change.field} changed: ${oldValue === "Not set" ? `Set to ${newValue}` : `${oldValue} → ${newValue}`}`}
                                    </p>
                                  )}
                                    
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                     <div className="relative pl-7">
                      <div
                        className="absolute left-0 w-px bg-[#333333]"
                        style={{ top: -20, height: "50%" }}
                      />
                      <div className="absolute bottom-1/2 left-0 h-5 w-7 rounded-bl-2xl border-b border-l border-[#333333]" />

                          <div className="flex items-center justify-between rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                            <div className="flex items-center w-full gap-3">
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-[#2A2A2A] text-[#E8D1AB]">
                                  <ActionIcon size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[15px] font-medium text-white/90 break-words">
                                    {hasNamedLabel ? mainActionText : entry.reason || mainActionText}
                                  </p>
                                  
                                </div>
                              </div>


                            </div>
                          </div>
                        </div>
                      )}
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
