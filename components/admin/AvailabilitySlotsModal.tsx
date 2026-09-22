"use client";

import { X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

const DEFAULT_CREATOR_TIMEZONE = "Asia/Kolkata";

const SUPPORTED_CREATOR_TIME_ZONES = [
  { value: "Asia/Kolkata", label: "India / Kolkata (IST)" },
  { value: "America/New_York", label: "New York / Toronto (ET)" },
  { value: "America/Chicago", label: "Chicago / Winnipeg (CT)" },
  { value: "America/Denver", label: "Denver / Edmonton (MT)" },
  { value: "America/Phoenix", label: "Phoenix / Arizona (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles / Vancouver (PT)" },
  { value: "America/Anchorage", label: "Anchorage / Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Honolulu / Hawaii (HST)" },
  { value: "America/Halifax", label: "Halifax / Atlantic Canada (AT)" },
  { value: "America/St_Johns", label: "St. John's / Newfoundland (NT)" },
  { value: "America/Regina", label: "Regina / Saskatchewan (CST)" },
];

export type AvailabilitySlotBlock = {
  start_at?: string;
  end_at?: string;
  source?: string;
};

export type AvailabilityWeeklyRule = {
  start_time?: string;
  end_time?: string;
  timezone?: string;
};

export type AvailabilitySlotsStatus = {
  available?: boolean;
  projectAssigned?: boolean;
  customAvailabilityStatus?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  calendarBusy?: boolean;
  calendarBusyBlocks?: AvailabilitySlotBlock[];
  weeklyRules?: AvailabilityWeeklyRule[];
  projectDetails?: {
    project_id?: number | string;
    project_name?: string;
    start_time?: string | null;
    end_time?: string | null;
    event_location?: string | null;
  } | null;
};

type AvailabilitySlotsModalProps = {
  date: string;
  status?: AvailabilitySlotsStatus | null;
  isDark?: boolean;
  onClose: () => void;
  onViewShoot?: (projectId: number | string) => void;
};

const formatLocation = (locationInput?: string | null) => {
  if (!locationInput || locationInput === '""' || locationInput === "null") return "Location TBD";

  let addressStr = locationInput;
  try {
    const parsed = JSON.parse(locationInput);
    if (parsed?.address) addressStr = parsed.address;
  } catch {}

  return String(addressStr || "").replace(/\\+/g, "").replace(/"/g, "").trim() || "Location TBD";
};

const formatTimeForDisplay = (value?: string | null) => {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return "";

  const time = new Date();
  time.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return format(time, "h:mm a");
};

const formatDateTimeInTimeZone = (value?: string, timeZone = DEFAULT_CREATOR_TIMEZONE) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
};

const getTimeZoneLabel = (timeZone: string) =>
  SUPPORTED_CREATOR_TIME_ZONES.find((item) => item.value === timeZone)?.label || timeZone;

export function AvailabilitySlotsModal({
  date,
  status,
  isDark = true,
  onClose,
  onViewShoot,
}: AvailabilitySlotsModalProps) {
  const timezone =
    status?.weeklyRules?.find((rule) => rule?.timezone)?.timezone ||
    DEFAULT_CREATOR_TIMEZONE;
  const busyBlocks = Array.isArray(status?.calendarBusyBlocks) ? status.calendarBusyBlocks : [];
  const workingRules = Array.isArray(status?.weeklyRules) ? status.weeklyRules : [];
  const hasWorkingHours = Boolean(status?.start_time && status?.end_time);
  const isTimeOff = status?.available === false && status?.projectAssigned !== true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
      <div
        className={`w-full max-w-2xl mx-3 lg:mx-0 p-5 lg:p-7 relative shadow-2xl border max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#111111] border-white/10 text-white" : "bg-white border-black/5 text-black"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 transition-colors ${isDark ? "text-white/40 hover:text-[#E8D1AB]" : "text-black/40 hover:text-[#cbb38b]"}`}
        >
          <X size={20} />
        </button>

        <div className="mb-6 pr-8">
          <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? "text-[#E8D1AB]" : "text-[#9B7B4F]"}`}>
            Availability Slots
          </p>
          <h2 className={`text-xl lg:text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>
            {format(parseISO(date), "EEEE, MMM d, yyyy")}
          </h2>
          <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
            {getTimeZoneLabel(timezone)}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryTile label="Status" value={status?.projectAssigned ? "Booked" : isTimeOff ? "Not Available" : status?.available ? "Available" : "Not Set"} isDark={isDark} />
          <SummaryTile
            label="Working Hours"
            value={hasWorkingHours ? `${formatTimeForDisplay(status?.start_time)} - ${formatTimeForDisplay(status?.end_time)}` : "Not set"}
            isDark={isDark}
          />
          <SummaryTile label="Calendar Busy" value={`${busyBlocks.length} slot${busyBlocks.length === 1 ? "" : "s"}`} isDark={isDark} accent="text-amber-500" />
          <SummaryTile label="Shoots" value={status?.projectAssigned ? "1 booked" : "0 booked"} isDark={isDark} accent={status?.projectAssigned ? "text-blue-400" : undefined} />
        </div>

        <div className="space-y-3">
          {workingRules.length > 0 ? (
            workingRules.map((rule, index) => (
              <SlotRow
                key={`${rule.start_time}-${rule.end_time}-${index}`}
                color="bg-green-500"
                title="Working Slot"
                detail={`${formatTimeForDisplay(rule.start_time)} - ${formatTimeForDisplay(rule.end_time)}`}
                isDark={isDark}
              />
            ))
          ) : (
            <div className={`rounded-xl border p-4 ${isDark ? "bg-black/25 border-white/10 text-white/45" : "bg-neutral-50 border-black/10 text-black/45"}`}>
              No regular working slot is set for this day.
            </div>
          )}

          {busyBlocks.map((block, index) => (
            <SlotRow
              key={`${block.start_at}-${block.end_at}-${index}`}
              color="bg-amber-500"
              title="Google Calendar Busy"
              detail={`${formatDateTimeInTimeZone(block.start_at, timezone)} - ${formatDateTimeInTimeZone(block.end_at, timezone)}`}
              isDark={isDark}
              tone="amber"
            />
          ))}

          {isTimeOff && (
            <SlotRow
              color="bg-red-400"
              title="Manual Time Off"
              detail={hasWorkingHours ? `${formatTimeForDisplay(status?.start_time)} - ${formatTimeForDisplay(status?.end_time)}` : "Full day"}
              isDark={isDark}
              tone="red"
            />
          )}

          {status?.projectAssigned && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"}`}>
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {status.projectDetails?.project_name || "Booked Shoot"}
                </p>
                <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>
                  {status.projectDetails?.start_time && status.projectDetails?.end_time
                    ? `${formatTimeForDisplay(status.projectDetails.start_time)} - ${formatTimeForDisplay(status.projectDetails.end_time)}`
                    : "Time not set"}
                </p>
                {status.projectDetails?.event_location && (
                  <p className={`text-xs mt-1 ${isDark ? "text-white/35" : "text-black/45"}`}>
                    {formatLocation(status.projectDetails.event_location)}
                  </p>
                )}
              </div>
              {status.projectDetails?.project_id && onViewShoot && (
                <Button
                  onClick={() => onViewShoot(status.projectDetails.project_id)}
                  className="bg-[#E8D1AB] hover:bg-[#d4be9a] text-black font-bold h-9 px-4 rounded-lg"
                >
                  View
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  isDark,
  accent,
}: {
  label: string;
  value: string;
  isDark: boolean;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${isDark ? "bg-black/30 border-white/10" : "bg-neutral-50 border-black/10"}`}>
      <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? "text-white/35" : "text-black/40"}`}>{label}</p>
      <p className={`text-sm font-semibold ${accent || (isDark ? "text-white" : "text-black")}`}>{value}</p>
    </div>
  );
}

function SlotRow({
  color,
  title,
  detail,
  isDark,
  tone,
}: {
  color: string;
  title: string;
  detail: string;
  isDark: boolean;
  tone?: "amber" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
      : tone === "red"
        ? isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
        : isDark ? "bg-black/25 border-white/10" : "bg-neutral-50 border-black/10";

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${toneClass}`}>
      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
      <div>
        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{title}</p>
        <p className={`text-sm mt-1 ${isDark ? "text-white/55" : "text-black/55"}`}>{detail}</p>
      </div>
    </div>
  );
}
