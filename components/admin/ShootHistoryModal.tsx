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
  return `${datePart} - ${timePart}`;
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
      const date = formatHistoryValue("date", day.event_date);
      const start = formatHistoryValue("start_time", day.start_time);
      const end = formatHistoryValue("end_time", day.end_time);
      return `${date} • ${start} – ${end}`;
    }).join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatBookingDayLines = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.length === 0) return ["Not set"];

  return value.map((item) => {
    if (!item || typeof item !== "object") return String(item);
    const day = item as Record<string, unknown>;
    const date = formatHistoryValue("date", day.event_date ?? day.date);
    const start = formatHistoryValue("start_time", day.start_time);
    const end = formatHistoryValue("end_time", day.end_time);
    return `${date} • ${start} – ${end}`;
  });
};

const actionLabel = (action: string) => {
  switch (action) {
    case "crew_assigned":
      return "Creative partner assigned";
    case "crew_removed":
      return "Creative partner removed";
    case "project_name_updated":
      return "Project name changed";
    case "schedule_location_updated":
      return "Schedule changed";
    case "restored":
      return "Shoot restored";
    case "deleted":
      return "Shoot deleted";
    default:
      return `Shoot ${action.replaceAll("_", " ")}`;
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
      return UserPlus;
    case "crew_removed":
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? "border-[#333] bg-[#151515] text-white" : "border-[#E5E5E5] bg-white text-black"}`}
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

        <div className="min-h-0 flex-1 overflow-y-auto">
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
            <div>
              {entries.map((entry) => {
                const metadata = parseMetadata(entry.metadata);
                const changes = (Array.isArray(metadata.changes) ? metadata.changes : []).filter(
                  (change) =>
                    visibleChangeFields.has(change.field) &&
                    !(isEmptyHistoryValue(change.old_value) && isEmptyHistoryValue(change.new_value))
                );
                const changeCount = Math.max(changes.length, 1);
                const label = actionLabel(entry.action);
                const detail = metadata.crew_member_name || entry.reason || "";
                const ActionIcon = actionIcon(entry.action);
                return (
                  <div key={entry.history_id} className={`border-b px-6 py-5 last:border-b-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{entry.performed_by_name || "System"}</p>
                        <p className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>{formatDate(entry.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/10 text-white/55" : "bg-black/10 text-black/55"}`}>
                        {changeCount} {changeCount === 1 ? "change" : "changes"}
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {changes.length > 0 ? changes.map((change, index) => {
                        const oldValue = formatHistoryValue(change.field, change.old_value);
                        const newValue = formatHistoryValue(change.field, change.new_value);
                        const ChangeIcon = changeIcons[change.field as keyof typeof changeIcons] || History;
                        const isBookingDaysChange = change.field === "booking_days";
                        return (
                          <li key={`${change.field}-${index}`} className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>
                            <ChangeIcon size={15} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                            {isBookingDaysChange ? (
                              <div className="min-w-0 break-words">
                                <strong className={isDark ? "text-white/80" : "text-black/80"}>Booking days changed:</strong>
                                <div className="mt-1.5 space-y-2">
                                  <div>
                                    <p className={`font-medium ${isDark ? "text-white/75" : "text-black/75"}`}>Previous schedule</p>
                                    <div className="mt-0.5 space-y-0.5 pl-2">
                                      {formatBookingDayLines(change.old_value).map((day, dayIndex) => (
                                        <p key={`old-day-${dayIndex}`}>Day {dayIndex + 1}: {day}</p>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className={`font-medium ${isDark ? "text-white/75" : "text-black/75"}`}>Updated schedule</p>
                                    <div className="mt-0.5 space-y-0.5 pl-2">
                                      {formatBookingDayLines(change.new_value).map((day, dayIndex) => (
                                        <p key={`new-day-${dayIndex}`}>Day {dayIndex + 1}: {day}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="whitespace-pre-line break-words">
                                <strong className={isDark ? "text-white/80" : "text-black/80"}>
                                  {fieldLabels[change.field] || change.field.replaceAll("_", " ")} changed:
                                </strong>{" "}
                                {oldValue === "Not set" ? `Set to ${newValue}` : `${oldValue} to ${newValue}`}
                              </span>
                            )}
                          </li>
                        );
                      }) : (
                        <li className={`flex items-start gap-2 text-sm ${isDark ? "text-white/65" : "text-black/65"}`}>
                          <ActionIcon size={15} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                          <span>
                            <strong className={isDark ? "text-white/80" : "text-black/80"}>{label}</strong>
                            {detail && detail.toLowerCase() !== label.toLowerCase() ? `: ${detail}` : ""}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`flex shrink-0 justify-end border-t px-6 py-4 ${isDark ? "border-white/10" : "border-black/10"}`}>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#E8D1AB] px-6 py-3 text-sm font-medium text-black hover:bg-[#DEC398]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
