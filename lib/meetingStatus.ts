import type { MeetingItem } from "@/lib/meetingsApi";

const normalizeStatus = (value?: string) => String(value || "pending").toLowerCase();

interface ThemeStyles {
  dark: string;
  light: string;
}

const STATUS_STYLES: Record<string, ThemeStyles> = {
  pending: {
    dark: "border-[#B18A00]/25 bg-[#2A2110] text-[#F3D27A]",
    light: "border-[#B18A00]/30 bg-[#FEF7E0] text-[#B18A00]",
  },
  confirmed: {
    dark: "border-[#0E9F6E]/25 bg-[#10261E] text-[#67E8B5]",
    light: "border-[#0E9F6E]/30 bg-[#E6F6F0] text-[#0E9F6E]",
  },
  in_progress: {
    dark: "border-[#3B82F6]/25 bg-[#111E33] text-[#93C5FD]",
    light: "border-[#3B82F6]/30 bg-[#EFF6FF] text-[#1D4ED8]",
  },
  ongoing: {
    dark: "border-[#38BDF8]/25 bg-[#0E2230] text-[#7DD3FC]",
    light: "border-[#38BDF8]/30 bg-[#F0F9FF] text-[#0369A1]",
  },
  change_request: {
    dark: "border-[#C065F0]/25 bg-[#241228] text-[#E9B8FF]",
    light: "border-[#C065F0]/30 bg-[#FAF5FF] text-[#A855F7]",
  },
  completed: {
    dark: "border-[#34D399]/25 bg-[#0F241D] text-[#9AE6B4]",
    light: "border-[#34D399]/30 bg-[#ECFDF5] text-[#047857]",
  },
  cancelled: {
    dark: "border-[#FB7185]/25 bg-[#2A1419] text-[#FDA4AF]",
    light: "border-[#FB7185]/30 bg-[#FFF1F2] text-[#E11D48]",
  },
  rescheduled: {
    dark: "border-[#818CF8]/25 bg-[#171B33] text-[#C7D2FE]",
    light: "border-[#818CF8]/30 bg-[#EEF2FF] text-[#4338CA]",
  },
};

export const getEffectiveMeetingStatus = (meeting?: Pick<MeetingItem, "meeting_status" | "meeting_date_time" | "meeting_end_time"> | null) => {
  if (!meeting) return "pending";

  const storedStatus = normalizeStatus(meeting.meeting_status);
  if (["cancelled", "change_request", "rescheduled"].includes(storedStatus)) {
    return storedStatus;
  }

  const now = Date.now();
  const start = meeting.meeting_date_time ? new Date(meeting.meeting_date_time).getTime() : NaN;
  const end = meeting.meeting_end_time ? new Date(meeting.meeting_end_time).getTime() : NaN;

  if (!Number.isNaN(end) && end <= now) {
    return "completed";
  }

  if (!Number.isNaN(start) && !Number.isNaN(end) && start <= now && end > now) {
    return "ongoing";
  }

  if (storedStatus === "in_progress") {
    return "ongoing";
  }

  if (storedStatus === "confirmed") {
    return "pending";
  }

  return storedStatus;
};

export const canRespondToMeeting = (
  meeting?: Pick<MeetingItem, "meeting_date_time"> | null,
  hoursBeforeStart = 1
) => {
  if (!meeting?.meeting_date_time) return false;

  const startMs = new Date(meeting.meeting_date_time).getTime();
  if (!Number.isFinite(startMs)) return false;

  return Date.now() < startMs - hoursBeforeStart * 60 * 60 * 1000;
};

export const getMinimumSelectableMeetingTime = (hoursAhead = 1) => {
  const minTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  minTime.setSeconds(0, 0);

  if (minTime.getMinutes() > 0) {
    minTime.setHours(minTime.getHours() + 1, 0, 0, 0);
  } else {
    minTime.setMinutes(0, 0, 0);
  }

  return minTime;
};

export const getMinimumMeetingEndTime = (startTime?: Date | null, hoursAfterStart = 1) => {
  if (!startTime || Number.isNaN(startTime.getTime())) return null;
  const minEndTime = new Date(startTime.getTime() + hoursAfterStart * 60 * 60 * 1000);
  minEndTime.setSeconds(0, 0);
  return minEndTime;
};

export const formatMeetingStatusLabel = (value?: string) =>
  String(value || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getMeetingStatusClasses = (value?: string, isDark: boolean = true) => {
  const targetStyles = STATUS_STYLES[normalizeStatus(value)] || STATUS_STYLES.pending;
  return isDark ? targetStyles.dark : targetStyles.light;
};
